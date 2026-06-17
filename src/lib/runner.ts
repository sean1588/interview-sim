// In-browser code execution. Keeps us backend-free for the spike: no execution
// service, no API key, no per-run cost.
//   - Python runs on Pyodide (real CPython compiled to WASM), loaded lazily
//     from a CDN the first time the candidate hits Run.
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

const PYODIDE_VERSION = "0.26.2";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodidePromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadPyodide(): Promise<any> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const boot = async () => {
      try {
        const py = await w.loadPyodide({ indexURL: PYODIDE_BASE });
        resolve(py);
      } catch (e) {
        reject(e);
      }
    };
    if (w.loadPyodide) {
      boot();
      return;
    }
    const script = document.createElement("script");
    script.src = `${PYODIDE_BASE}pyodide.js`;
    script.onload = boot;
    script.onerror = () => reject(new Error("Failed to load Pyodide from CDN"));
    document.head.appendChild(script);
  });
  return pyodidePromise;
}

async function runPython(code: string): Promise<RunResult> {
  const py = await loadPyodide();
  let stdout = "";
  let stderr = "";
  py.setStdout({ batched: (s: string) => (stdout += s + "\n") });
  py.setStderr({ batched: (s: string) => (stderr += s + "\n") });
  try {
    // Auto-fetch any imported packages bundled for Pyodide (numpy, pandas, …)
    // from the CDN so the libraries lessons can actually run. No-op for code
    // that only imports the stdlib.
    await py.loadPackagesFromImports(code);
    await py.runPythonAsync(code);
    return makeResult({ stdout, stderr, exitCode: stderr ? 1 : 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return makeResult({ stdout, stderr: stderr + msg, exitCode: 1 });
  }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let typescriptPromise: Promise<any> | null = null;

// Load the TypeScript compiler from the CDN once and cache it. The UMD bundle
// exposes a global `ts` when loaded via a <script> tag. Mirrors loadPyodide.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadTypeScript(): Promise<any> {
  if (typescriptPromise) return typescriptPromise;
  typescriptPromise = new Promise((resolve, reject) => {
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
  });
  return typescriptPromise;
}

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
