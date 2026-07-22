// In-browser code execution. Keeps us backend-free for the spike: no execution
// service, no API key, no per-run cost.
//   - Python runs on Pyodide (real CPython compiled to WASM) inside a Web
//     Worker — loaded lazily from a CDN the first time the candidate hits Run,
//     then reused across runs. Running off the main thread gives Python the same
//     hard timeout as JS, so a stray infinite loop can't hang the page.
//   - JavaScript runs in a sandboxed Web Worker with a hard timeout so a stray
//     infinite loop can't hang the page.
//   - TypeScript loads the compiler lazily from a CDN, strips types
//     (transpile-only — no type-check gate), then runs the emitted JS through
//     the same Worker. Monaco still surfaces type errors as editor squiggles.

export interface RunResult {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number;
}

/**
 * Single place that owns how stdout/stderr combine into the console `output`,
 * so each execution path supplies the two streams and a code, nothing more.
 */
function makeResult(parts: {
  stdout?: string;
  stderr?: string;
  exitCode: number;
}): RunResult {
  const stdout = parts.stdout ?? "";
  const stderr = parts.stderr ?? "";
  return {
    stdout,
    stderr,
    output: [stdout, stderr].filter(Boolean).join("\n"),
    exitCode: parts.exitCode,
  };
}

/**
 * Memoize a one-shot async CDN loader, but DROP the cache if it rejects so the
 * next caller retries instead of being stuck forever on a permanently-failed
 * promise. Used by loadTypeScript; the Python worker has its own equivalent (it
 * drops the worker on a load error). Exported for unit testing.
 */
export function memoizeWithRetry<T>(load: () => Promise<T>): () => Promise<T> {
  let cached: Promise<T> | null = null;
  return () => {
    if (cached) return cached;
    // While `cached` is set every caller shares it, so no second load can start
    // until this one's `.catch` resets it — there's no concurrent retry to clobber.
    cached = load();
    cached.catch(() => {
      cached = null;
    });
    return cached;
  };
}

const PYODIDE_VERSION = "0.26.2";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Pyodide runs inside a persistent Web Worker. The ~10MB WASM loads once and is
// reused across runs. Off the main thread, a runaway loop is killed with
// terminate() — but the 5s kill switch covers EXECUTION only: the worker posts a
// `ready` message once Pyodide and any imported packages have loaded, and the main
// thread arms the timer only then, so a slow first load isn't mistaken for an
// infinite loop. stdout/stderr come back as separate streams and are combined by
// makeResult on the main thread, so warnings on stderr stay visible without being
// treated as failure. The worker auto-fetches packages bundled for Pyodide (numpy,
// pandas, …) so the libraries lessons run.
const PY_WORKER_SRC = `
let pyReady = null;
const ensurePy = () => {
  if (!pyReady) {
    pyReady = (async () => {
      importScripts("${PYODIDE_BASE}pyodide.js");
      return await self.loadPyodide({ indexURL: "${PYODIDE_BASE}" });
    })();
    // Self-heal: drop the cached load promise if it rejects so the next run
    // retries the CDN instead of being stuck on a permanently-failed promise.
    pyReady.catch(() => { pyReady = null; });
  }
  return pyReady;
};

self.onmessage = async (e) => {
  let py;
  try {
    py = await ensurePy();
  } catch (err) {
    // Pyodide itself failed to load — the main thread drops this worker so the
    // next Run retries the CDN.
    self.postMessage({ loadError: String((err && err.message) || err) });
    return;
  }
  let stdout = "";
  let stderr = "";
  py.setStdout({ batched: (s) => (stdout += s + "\\n") });
  py.setStderr({ batched: (s) => (stderr += s + "\\n") });
  // Fetching imported packages (numpy/pandas, …) is part of loading, not
  // execution — do it untimed, THEN tell the main thread to start the 5s clock.
  try {
    await py.loadPackagesFromImports(e.data.code);
  } catch (err) {
    self.postMessage({ ok: false, stdout, stderr, error: String((err && err.message) || err) });
    return;
  }
  self.postMessage({ ready: true });
  try {
    await py.runPythonAsync(e.data.code);
    self.postMessage({ ok: true, stdout, stderr });
  } catch (err) {
    self.postMessage({ ok: false, stdout, stderr, error: String((err && err.message) || err) });
  }
};
`;

let pyWorker: Worker | null = null;

function getPyWorker(): Worker {
  if (pyWorker) return pyWorker;
  const url = URL.createObjectURL(
    new Blob([PY_WORKER_SRC], { type: "application/javascript" })
  );
  pyWorker = new Worker(url);
  // The URL is only needed to construct the Worker; it keeps running after the URL
  // is revoked, so revoke now rather than tracking it for later cleanup.
  URL.revokeObjectURL(url);
  return pyWorker;
}

function killPyWorker() {
  pyWorker?.terminate();
  pyWorker = null;
}

/** A reply posted by the Python worker (other than the `ready` handshake). */
export interface PyWorkerReply {
  ok?: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  loadError?: string;
}

/**
 * Map a Python worker reply to a RunResult. Pure (no Worker/WASM), so the
 * exit-code contract is unit-testable: a clean run is exit 0 even if it wrote
 * warnings to stderr (stderr stays visible in `output`); only a *raised* error (or
 * a failed load) is exit 1. Exit code reflects whether execution raised, NOT
 * whether stderr was written.
 */
export function shapePyMessage(msg: PyWorkerReply): RunResult {
  if (msg.loadError) return makeResult({ stderr: msg.loadError, exitCode: 1 });
  return msg.ok
    ? makeResult({ stdout: msg.stdout, stderr: msg.stderr, exitCode: 0 })
    : makeResult({
        stdout: msg.stdout,
        stderr: (msg.stderr ?? "") + (msg.error ?? ""),
        exitCode: 1,
      });
}

// The Run button is disabled while a run is in flight (CodeEditor), so the
// persistent worker handles one request at a time — a per-call onmessage handler
// is enough. Kill sites guard on `pyWorker === worker` so that if a future
// concurrent caller ever replaces the worker, a stale timeout can't terminate it.
// Kept separate from runJavaScript by design: only Python has a load phase to gate
// the timer on, and only Python keeps a persistent worker — unifying the two would
// mean flagging those differences, not sharing real behavior.
function runPython(code: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = getPyWorker();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    worker.onmessage = (e) => {
      // The worker posts `ready` once Pyodide and any imported packages have
      // loaded — only then do we start the 5s clock, so a slow first load (~10s of
      // WASM/CDN download) isn't mistaken for an infinite loop.
      if (e.data.ready) {
        timeout = setTimeout(() => {
          if (pyWorker === worker) killPyWorker(); // kill the runaway loop
          resolve(
            makeResult({
              stderr: "Execution timed out (5s) — possible infinite loop.",
              exitCode: 1,
            })
          );
        }, 5000);
        return;
      }
      clearTimeout(timeout);
      // A load failure means Pyodide never came up — drop the worker so the next
      // Run spins a fresh one (the worker also self-heals internally).
      if (e.data.loadError && pyWorker === worker) killPyWorker();
      resolve(shapePyMessage(e.data));
    };
    worker.onerror = (e) => {
      clearTimeout(timeout);
      if (pyWorker === worker) killPyWorker();
      resolve(makeResult({ stderr: e.message, exitCode: 1 }));
    };

    worker.postMessage({ code });
  });
}

const JS_WORKER_SRC = `
self.onmessage = (e) => {
  const logs = [];
  const fmt = (a) => a.map((x) => {
    if (typeof x === "string") return x;
    try { return JSON.stringify(x); } catch { return String(x); }
  }).join(" ");
  const console = {
    log: (...a) => logs.push(fmt(a)),
    error: (...a) => logs.push(fmt(a)),
    warn: (...a) => logs.push(fmt(a)),
    info: (...a) => logs.push(fmt(a)),
  };
  try {
    const fn = new Function("console", e.data.code);
    fn(console);
    self.postMessage({ ok: true, output: logs.join("\\n") });
  } catch (err) {
    self.postMessage({ ok: false, output: logs.join("\\n"), error: String(err && err.stack || err) });
  }
};
`;

function runJavaScript(code: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const blob = new Blob([JS_WORKER_SRC], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    const timeout = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(
        makeResult({
          stderr: "Execution timed out (5s) — possible infinite loop.",
          exitCode: 1,
        })
      );
    }, 5000);

    worker.onmessage = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      const { ok, output, error } = e.data;
      resolve(
        ok
          ? makeResult({ stdout: output, exitCode: 0 })
          : makeResult({ stdout: output, stderr: error || "", exitCode: 1 })
      );
    };
    worker.onerror = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(makeResult({ stderr: e.message, exitCode: 1 }));
    };

    worker.postMessage({ code });
  });
}

// Pinned to the compiler the project builds with (package.json typescript ^5).
const TYPESCRIPT_VERSION = "5.9.3";
const TYPESCRIPT_SRC = `https://cdn.jsdelivr.net/npm/typescript@${TYPESCRIPT_VERSION}/lib/typescript.js`;

// Load the TypeScript compiler from the CDN once and cache it. The UMD bundle
// exposes a global `ts` when loaded via a <script> tag. memoizeWithRetry drops
// the cache on failure so a flaky CDN load doesn't poison every later Run.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadTypeScript = memoizeWithRetry<any>(
  () =>
    new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (w.ts) {
        resolve(w.ts);
        return;
      }
      const script = document.createElement("script");
      script.src = TYPESCRIPT_SRC;
      script.onload = () =>
        w.ts
          ? resolve(w.ts)
          : reject(new Error("TypeScript compiler loaded but `ts` global is missing"));
      script.onerror = () =>
        reject(new Error("Failed to load the TypeScript compiler from CDN"));
      document.head.appendChild(script);
    })
);

/**
 * Strip types and downlevel to plain JS. `transpileModule` is single-file and
 * never type-checks (transpile-only), so type errors don't block a run. The
 * output still has to pass through wrapTranspiledTs before the worker can run it
 * (see below). Exported so it can be unit-tested with the node `typescript`
 * package — the same compiler API as the CDN global.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transpileTypeScript(ts: any, code: string): string {
  return ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
    },
  }).outputText;
}

/**
 * Make transpiled TS runnable in the worker's bare `new Function` scope.
 *
 * `module: None` only yields wrapper-free output for code with no top-level
 * import/export; the moment the source uses `export`/`import`, TypeScript lowers
 * it to CommonJS that references `module`/`exports`/`require` — names the worker
 * scope doesn't define, so it would throw "exports is not defined" before any
 * user code runs. Prepend a minimal CommonJS shim so such code runs; `require`
 * rejects real module imports (unresolvable in the sandbox) with a clear message.
 * Plain code simply ignores the unused bindings.
 *
 * Known limit: code that *declares* a top-level `module`/`exports`/`require`
 * would collide with the shim — rare, consistent with how CommonJS reserves
 * those names, and a clear SyntaxError rather than silent corruption.
 */
export function wrapTranspiledTs(js: string): string {
  const shim =
    `const module = { exports: {} }, exports = module.exports, ` +
    `require = (name) => { throw new Error("Imports aren't supported here — write a single self-contained file (no import/require)."); };`;
  return `${shim}\n${js}`;
}

async function runTypeScript(code: string): Promise<RunResult> {
  const ts = await loadTypeScript();
  return runJavaScript(wrapTranspiledTs(transpileTypeScript(ts, code)));
}

/**
 * Whether a language can execute in-browser. The learning courses include Go,
 * which has no lightweight in-browser runtime (no Pyodide-equivalent), so its
 * editor is a scratchpad the voice tutor reviews rather than a Run target. The
 * editor consults this to hide its Run button; `runCode` below is the matching
 * safety net if something calls it anyway.
 */
export function isRunnable(language: string): boolean {
  return (
    language === "python" || language === "javascript" || language === "typescript"
  );
}

export async function runCode(
  language: string,
  code: string
): Promise<RunResult> {
  if (language === "python") return runPython(code);
  if (language === "javascript") return runJavaScript(code);
  if (language === "typescript") return runTypeScript(code);
  return makeResult({
    stderr: `Running ${language} isn't supported yet — try Python, JavaScript, or TypeScript.`,
    exitCode: 1,
  });
}
