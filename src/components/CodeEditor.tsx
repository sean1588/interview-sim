"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import type { LanguageId } from "@/lib/problems";
import { runCode, type RunResult } from "@/lib/runner";

interface CodeEditorProps {
  code: string;
  language: LanguageId;
  /** Languages the current problem supports — drives the picker. */
  languages: LanguageId[];
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: LanguageId) => void;
  /** Called with the run result so the parent can forward it to the interviewer. */
  onRun?: (result: RunResult) => void;
}

const LANGUAGE_LABELS: Record<LanguageId, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
};

export default function CodeEditor({
  code,
  language,
  languages,
  onCodeChange,
  onLanguageChange,
  onRun,
}: CodeEditorProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const r = await runCode(language, code);
      setResult(r);
      onRun?.(r);
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

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-900">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as LanguageId)}
          className="bg-gray-800 text-gray-200 text-sm rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-gray-500"
        >
          {languages.map((id) => (
            <option key={id} value={id}>
              {LANGUAGE_LABELS[id]}
            </option>
          ))}
        </select>
        <button
          onClick={run}
          disabled={running}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            running
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-500 text-white"
          }`}
        >
          {running ? "Running…" : "▶ Run"}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(value) => onCodeChange(value ?? "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 12 },
          }}
          loading={
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Loading editor…
            </div>
          }
        />
      </div>

      {/* Output console */}
      <div className="border-t border-gray-800 bg-black/40 h-40 overflow-auto">
        <div className="px-3 py-1.5 text-xs uppercase tracking-wide text-gray-500 border-b border-gray-800/60">
          Output
        </div>
        <pre className="px-3 py-2 text-xs font-mono whitespace-pre-wrap text-gray-300">
          {result
            ? result.output || result.stderr || "(no output)"
            : running
              ? language === "python"
                ? "Running… (first Python run loads the runtime, ~10s)"
                : "Running…"
              : "Press Run to execute your code."}
        </pre>
      </div>
    </div>
  );
}
