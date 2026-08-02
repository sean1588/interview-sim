"use client";

import { useState, type ReactNode } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { LanguageId, TestSpec } from "@/lib/problems";
import { runCode, isRunnable, type RunResult } from "@/lib/runner";
import { runTests, failureLines, type TestSummary } from "@/lib/test-harness";
import { Play, ChevronDown } from "@/components/session/icons";

interface CodeEditorProps {
  code: string;
  language: LanguageId;
  /** Languages the current problem supports — drives the picker. */
  languages: LanguageId[];
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: LanguageId) => void;
  /**
   * Cases to grade the run against. Absent (the freestyle and lesson editors) ⇒
   * Run behaves exactly as it always has: execute, show output, nothing else.
   */
  tests?: TestSpec;
  /** Called with the run result so the parent can forward it to the interviewer. */
  onRun?: (result: RunResult, tests?: TestSummary) => void;
  /** When false, the Run button is disabled (freestyle's waiting state). */
  canRun?: boolean;
  /** Non-interactive content laid over the editor canvas (freestyle empty state). */
  overlay?: ReactNode;
}

const LANGUAGE_LABELS: Record<LanguageId, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  go: "Go",
};

// Languages whose first run pays a one-time CDN load; shown while running so the
// delay reads as expected, not hung. JavaScript runs instantly, so it's absent.
const FIRST_RUN_HINT: Partial<Record<LanguageId, string>> = {
  python: "Running… (first Python run loads the runtime, ~10s)",
  typescript: "Running… (first TypeScript run loads the compiler)",
};

/** The editorial light theme: ivory canvas, cognac keywords, slate identifiers,
 * olive strings, clay numbers, faint italic comments. Registered once per Monaco
 * instance before mount. */
function defineStudioTheme(monaco: Monaco) {
  monaco.editor.defineTheme("studio-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "9c4f1a" },
      { token: "comment", foreground: "a8997e", fontStyle: "italic" },
      { token: "string", foreground: "5e6b3c" },
      { token: "number", foreground: "b5651d" },
      { token: "type", foreground: "2f5e8c" },
      { token: "type.identifier", foreground: "2f5e8c" },
    ],
    colors: {
      "editor.background": "#fbf8f1",
      "editor.foreground": "#4a443b",
      "editorLineNumber.foreground": "#c3b69c",
      "editorLineNumber.activeForeground": "#8a7d63",
      "editorCursor.foreground": "#a8551d",
      "editor.selectionBackground": "#e9dcc2",
      "editor.lineHighlightBackground": "#f3ecdd80",
      "editorIndentGuide.background1": "#ece2cf",
      "editorWhitespace.foreground": "#e0d5c1",
    },
  });
}

export default function CodeEditor({
  code,
  language,
  languages,
  onCodeChange,
  onLanguageChange,
  tests,
  onRun,
  canRun = true,
  overlay,
}: CodeEditorProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [summary, setSummary] = useState<TestSummary | null>(null);

  // The entry point the spec names for the current language: its presence is what
  // decides whether this run is graded, and it labels failures once it is.
  const entryPoint = tests?.entryPoint[language];
  const spec = tests && entryPoint && isRunnable(language) ? tests : null;

  const run = async () => {
    setRunning(true);
    setResult(null);
    setSummary(null);
    try {
      const graded = spec
        ? await runTests(language, code, spec)
        : { run: await runCode(language, code), tests: null };
      setResult(graded.run);
      setSummary(graded.tests);
      onRun?.(graded.run, graded.tests ?? undefined);
    } catch (e) {
      const r: RunResult = {
        stdout: "",
        stderr: e instanceof Error ? e.message : "Execution failed",
        output: e instanceof Error ? e.message : "Execution failed",
        exitCode: 1,
      };
      setResult(r);
      onRun?.(r);
    } finally {
      setRunning(false);
    }
  };

  const fixedLanguage = languages.length <= 1;
  const runnable = canRun && !running;
  // Some learning languages (Go) have no in-browser runtime — the editor is a
  // scratchpad the voice tutor reviews, so we drop the Run button and the
  // output console entirely rather than offer a button that always errors.
  const executable = isRunnable(language);
  // Failing cases, shown above the raw output so the verdict reads before the noise.
  const failures = summary ? failureLines(summary, entryPoint ?? "solution") : [];

  return (
    <div className="flex flex-col h-full min-h-0 bg-editor">
      {/* Toolbar */}
      <div className="flex h-[50px] flex-none items-center justify-between border-b border-hair bg-inset px-[18px]">
        <div className="relative inline-flex items-center">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as LanguageId)}
            disabled={fixedLanguage}
            aria-label="Language"
            className={`appearance-none rounded-[7px] border border-edge bg-chip py-1.5 pl-3 font-mono text-[12.5px] text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 ${
              fixedLanguage ? "pr-3 cursor-default" : "pr-8 cursor-pointer"
            }`}
          >
            {languages.map((id) => (
              <option key={id} value={id}>
                {LANGUAGE_LABELS[id]}
              </option>
            ))}
          </select>
          {!fixedLanguage && (
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-3 text-faint"
            />
          )}
        </div>
        {executable ? (
          <button
            onClick={run}
            disabled={!runnable}
            className={`inline-flex items-center gap-2 rounded-[7px] px-4 py-2 font-sans text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 ${
              runnable
                ? "bg-olive text-[#f3f1e4] hover:bg-olive/90"
                : "cursor-not-allowed bg-[#cdbfa3] text-[#f3f1e4]"
            }`}
          >
            <Play size={12} />
            {running ? "Running…" : "Run"}
          </button>
        ) : (
          <span className="font-sans text-[12px] text-faint">
            {LANGUAGE_LABELS[language]} runs on your machine — your tutor reviews your code here
          </span>
        )}
      </div>

      {/* Editor */}
      <div className="relative flex-1 min-h-0">
        {overlay && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            {overlay}
          </div>
        )}
        <Editor
          height="100%"
          language={language}
          theme="studio-light"
          beforeMount={defineStudioTheme}
          value={code}
          onChange={(value) => onCodeChange(value ?? "")}
          options={{
            fontSize: 13.5,
            fontFamily: "var(--font-plex), ui-monospace, monospace",
            lineHeight: 22,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 16 },
            renderLineHighlight: "none",
          }}
          loading={
            <div className="h-full flex items-center justify-center text-faint text-sm">
              Loading editor…
            </div>
          }
        />
      </div>

      {/* Output console — omitted for non-runnable languages (nothing to show). */}
      {executable && (
        <div className="h-[122px] flex-none flex flex-col border-t border-hair bg-inset">
          <div className="flex-none flex items-baseline justify-between gap-3 border-b border-hair px-[18px] py-[9px] font-sans text-[10px] font-medium uppercase tracking-[0.16em]">
            <span className="text-faint">Output</span>
            {summary && (
              <span
                className={
                  !summary.didNotRun && summary.passed === summary.total
                    ? "text-olive"
                    : "text-cognac-text"
                }
              >
                {summary.didNotRun
                  ? "Tests didn't run"
                  : `${summary.passed} / ${summary.total} cases passed`}
              </span>
            )}
          </div>
          <pre className="flex-1 min-h-0 overflow-auto px-[18px] py-3 font-mono text-[12.5px] whitespace-pre-wrap text-ink-body">
            {result ? (
              <>
                {failures.length > 0 && (
                  <span className="text-cognac-text">{failures.join("\n")}{"\n\n"}</span>
                )}
                {result.output || result.stderr || "(no output)"}
              </>
            ) : running ? (
              FIRST_RUN_HINT[language] ?? "Running…"
            ) : (
              <span className="text-faint">Press Run to execute your code.</span>
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
