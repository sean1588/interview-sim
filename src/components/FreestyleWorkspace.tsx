"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import VoiceChat, { SessionContext } from "@/components/VoiceChat";
import CodeEditor from "@/components/CodeEditor";
import type { LanguageId } from "@/lib/problems";
import type { RunResult } from "@/lib/runner";

// Freestyle runs whatever the user wants by voice; the editor is a shared
// surface the agent can load code into. Only the runnable languages are offered.
const FREESTYLE_LANGUAGES: LanguageId[] = ["python", "javascript"];

const PLACEHOLDER = `# Freestyle session — tell the coach what you'd like to work on:
# a coding problem, system design, a behavioral interview, or learning
# something new. They'll load anything you need right here.
`;

/** The agent only writes python/javascript; normalize anything off-spec so a
 * stray language tag still loads the code rather than dropping it. */
function normalizeLanguage(lang: string): LanguageId {
  const l = lang.trim().toLowerCase();
  return l === "javascript" || l === "js" ? "javascript" : "python";
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
  const getContext = useCallback(
    (): SessionContext => ({
      code,
      language,
      lastRun: lastRunRef.current,
    }),
    [code, language]
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
        <span className="text-xs text-gray-500">
          Free-form — ask the coach for anything
        </span>
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
    </div>
  );
}
