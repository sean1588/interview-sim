"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VoiceChat, { SessionContext } from "@/components/VoiceChat";
import CodeEditor from "@/components/CodeEditor";
import CustomQuestionModal from "@/components/CustomQuestionModal";
import SessionFrame from "@/components/session/SessionFrame";
import { Pencil, Sun } from "@/components/session/icons";
import type { LanguageId } from "@/lib/problems";
import type { RunResult } from "@/lib/runner";

// Freestyle runs whatever the user wants by voice; the editor is a shared
// surface the agent can load code into. Only the runnable languages are offered.
const FREESTYLE_LANGUAGES: LanguageId[] = ["python", "javascript", "typescript"];

const PLACEHOLDER = `# Freestyle session — tell the coach what you'd like to work on:
# a coding problem, system design, a behavioral interview, or learning
# something new. They'll load anything you need right here.
`;

// Pre-start affordances: clicking a chip seeds the coach's opening intent (it
// rides along as questionPrompt and shapes the kickoff). The user still taps the
// mic to begin — the chip just decides where the conversation starts.
const STARTERS: { label: string; intent: string }[] = [
  { label: "A coding problem", intent: "Let's do a coding problem." },
  { label: "System design", intent: "Let's do a system design round." },
  { label: "A behavioral round", intent: "Let's do a behavioral interview." },
  { label: "Learn a concept", intent: "I'd like to learn a new concept." },
];

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
  const router = useRouter();
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

  // The workspace is "waiting" until the coach (or the user) puts real code in it.
  const workspaceLoaded = code !== PLACEHOLDER;

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

  const controls = (
    <button
      onClick={() => setQuestionModalOpen(true)}
      title={customQuestion || "Optionally type your own question to start with"}
      className={`inline-flex items-center gap-2 rounded-[7px] border px-3.5 py-2 font-sans text-[13px] transition-colors ${
        customQuestion
          ? "border-cognac/50 bg-cognac/[0.08] text-cognac-text"
          : "border-edge bg-chip text-ink-muted hover:border-cognac/40"
      }`}
    >
      <Pencil size={14} />
      Custom question
      {customQuestion && <span className="text-cognac">●</span>}
    </button>
  );

  const prelude = (
    <>
      <div className="self-start max-w-[94%]">
        <div className="mb-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-[#a8754a]">
          Coach
        </div>
        <div className="rounded-[3px_14px_14px_14px] border border-hair bg-chip px-4 py-3 font-serif text-[17px] leading-[1.5] text-ink-soft">
          Welcome to freestyle. This is your hour — what would you like to work on
          today?
        </div>
      </div>
      <div className="self-start w-full">
        <div className="mb-2.5 font-sans text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
          Or pick a starting point
        </div>
        <div className="flex flex-wrap gap-2.5">
          {STARTERS.map((s) => (
            <button
              key={s.label}
              onClick={() => setCustomQuestion(s.intent)}
              className={`rounded-full border px-[15px] py-2.5 font-sans text-[13.5px] transition-colors ${
                customQuestion === s.intent
                  ? "border-cognac/50 bg-cognac/[0.08] text-cognac-text"
                  : "border-edge bg-chip text-ink-soft hover:border-cognac/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const waitingOverlay = (
    <div className="flex flex-col items-center gap-3.5 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-[#d6c8ad] animate-spin-slow">
        <Sun size={22} className="text-faint" />
      </div>
      <div className="max-w-[300px] font-serif italic text-[19px] leading-[1.4] text-faint">
        Your workspace is ready.
        <br />
        Whatever you choose appears here.
      </div>
    </div>
  );

  return (
    <>
      <SessionFrame
        root={{ label: "Studio", href: "/" }}
        title="Freestyle"
        endLabel="End Session"
        onEnd={() => router.push("/")}
        controls={controls}
      >
        {/* Conversation (the hero — wider) */}
        <div className="w-[520px] flex-none border-r border-section min-h-0">
          <VoiceChat
            sessionId={sessionId}
            mode="freestyle"
            getContext={getContext}
            onEditorWrite={handleEditorWrite}
            prelude={prelude}
          />
        </div>

        {/* Work */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-editor">
          <CodeEditor
            code={code}
            language={language}
            languages={FREESTYLE_LANGUAGES}
            onCodeChange={setCode}
            onLanguageChange={setLanguage}
            onRun={handleRun}
            canRun={workspaceLoaded}
            overlay={workspaceLoaded ? undefined : waitingOverlay}
          />
        </div>
      </SessionFrame>

      {questionModalOpen && (
        <CustomQuestionModal
          initialValue={customQuestion}
          onSubmit={setCustomQuestion}
          onClose={() => setQuestionModalOpen(false)}
        />
      )}
    </>
  );
}
