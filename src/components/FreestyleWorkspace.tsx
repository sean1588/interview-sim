"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import VoiceChat, { SessionContext } from "@/components/VoiceChat";
import CodeEditor from "@/components/CodeEditor";
import CustomQuestionModal from "@/components/CustomQuestionModal";
import type { LanguageId } from "@/lib/problems";
import type { RunResult } from "@/lib/runner";

// Freestyle runs whatever the user wants by voice; the editor is a shared
// surface the agent can load code into. Only the runnable languages are offered.
const FREESTYLE_LANGUAGES: LanguageId[] = ["python", "javascript", "typescript"];

const PLACEHOLDER = `# Freestyle session — tell the coach what you'd like to work on:
# a coding problem, system design, a behavioral interview, or learning
# something new. They'll load anything you need right here.
`;

// The agent writes python/javascript/typescript; map common aliases so a stray
// tag still loads the code, and default anything off-spec to python.
const LANGUAGE_ALIASES: Record<string, LanguageId> = {
  py: "python",
  python: "python",
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
};

function normalizeLanguage(lang: string): LanguageId {
  return LANGUAGE_ALIASES[lang.trim().toLowerCase()] ?? "python";
}

export default function FreestyleWorkspace() {
  // Freestyle has no assessment, so it doesn't use useSession — it just needs a
  // stable session id for the voice loop.
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  // One shared buffer: there's no per-problem or per-language starter to track.
  const [code, setCode] = useState(PLACEHOLDER);
  const [language, setLanguage] = useState<LanguageId>("python");
  const lastRunRef = useRef<string | undefined>(undefined);

  // Optional: the user can type the exact thing they want to work on instead of
  // speaking it. Empty by default — when blank, freestyle behaves exactly as
  // before (the coach opens by asking what they'd like to do).
  const [customQuestion, setCustomQuestion] = useState("");
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  const handleRun = useCallback((result: RunResult) => {
    const text = result.output || result.stderr || "(no output)";
    lastRunRef.current = `exit ${result.exitCode}\n${text}`.slice(0, 2000);
  }, []);

  // The agent loaded new editor contents. Replace the buffer, set the language,
  // and clear the stale run output.
  const handleEditorWrite = useCallback(
    (block: { language: string; code: string }) => {
      setLanguage(normalizeLanguage(block.language));
      setCode(block.code);
      lastRunRef.current = undefined;
    },
    []
  );

  // Pulled fresh by VoiceChat on each turn so the coach sees the latest code.
  // A custom question (if set) rides along as questionPrompt — the freestyle
  // kickoff/system prompt center the session on it; when blank it's omitted and
  // the default "what would you like to work on?" flow is unchanged.
  const getContext = useCallback(
    (): SessionContext => ({
      code,
      language,
      lastRun: lastRunRef.current,
      questionPrompt: customQuestion || undefined,
    }),
    [code, language, customQuestion]
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← Home</Link>
          <span className="text-gray-600">·</span>
          <h1 className="text-lg font-semibold">Freestyle</h1>
        </div>
        <button
          onClick={() => setQuestionModalOpen(true)}
          title={customQuestion || "Optionally type your own question to start with"}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            customQuestion
              ? "border-fuchsia-500/60 text-fuchsia-300 bg-fuchsia-500/10 hover:bg-fuchsia-500/20"
              : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
          }`}
        >
          ✎ Custom question
          {customQuestion && <span className="text-fuchsia-400">●</span>}
        </button>
      </header>

      {/* Split screen */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: coach + voice */}
        <div className="w-[38%] min-w-[320px] border-r border-gray-800 min-h-0">
          <VoiceChat
            sessionId={sessionId}
            mode="freestyle"
            getContext={getContext}
            onEditorWrite={handleEditorWrite}
          />
        </div>

        {/* Right: editor (full height — the coach fills it in for you) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <CodeEditor
            code={code}
            language={language}
            languages={FREESTYLE_LANGUAGES}
            onCodeChange={setCode}
            onLanguageChange={setLanguage}
            onRun={handleRun}
          />
        </div>
      </div>

      {questionModalOpen && (
        <CustomQuestionModal
          initialValue={customQuestion}
          onSubmit={setCustomQuestion}
          onClose={() => setQuestionModalOpen(false)}
        />
      )}
    </div>
  );
}
