"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import VoiceChat, { SessionContext } from "@/components/VoiceChat";
import CodeEditor from "@/components/CodeEditor";
import Scorecard, { ScorecardData } from "@/components/Scorecard";
import { useSession } from "@/components/useSession";
import { PROBLEMS, getProblem, type LanguageId, type Problem } from "@/lib/problems";
import type { RunResult } from "@/lib/runner";

// Languages the editor can actually run, in display order. A problem is offered
// in the intersection of these and the languages it provides a starter for.
const RUNNABLE_LANGUAGES: LanguageId[] = ["python", "javascript"];

function languagesFor(problem: Problem): LanguageId[] {
  return RUNNABLE_LANGUAGES.filter((l) => l in problem.starterCode);
}

export default function InterviewSim() {
  const [problemId, setProblemId] = useState(PROBLEMS[0].id);
  const [language, setLanguage] = useState<LanguageId>("python");

  const { sessionId, assessing, result: scorecard, error: assessError, endSession, closeResult } =
    useSession<ScorecardData>("coding");

  const problem = useMemo(() => getProblem(problemId)!, [problemId]);
  const availableLanguages = useMemo(() => languagesFor(problem), [problem]);

  // Code is tracked per (problem, language) so switching either restores the
  // right buffer. Initialised lazily from each problem's starter scaffold.
  const [buffers, setBuffers] = useState<Record<string, string>>(() => ({
    [`${problem.id}:${language}`]: problem.starterCode[language] ?? "",
  }));
  const bufKey = `${problemId}:${language}`;
  const code = buffers[bufKey] ?? problem.starterCode[language] ?? "";

  const lastRunRef = useRef<string | undefined>(undefined);

  const setCode = useCallback(
    (value: string) => {
      setBuffers((prev) => ({ ...prev, [bufKey]: value }));
    },
    [bufKey]
  );

  // Seed the (problem, language) buffer from starter code if we haven't seen it
  // yet, and reset the last run. Switching either axis funnels through here.
  const ensureBuffer = useCallback((pid: string, lang: LanguageId) => {
    const key = `${pid}:${lang}`;
    setBuffers((prev) =>
      key in prev
        ? prev
        : { ...prev, [key]: getProblem(pid)!.starterCode[lang] ?? "" }
    );
    lastRunRef.current = undefined;
  }, []);

  const handleLanguageChange = useCallback(
    (lang: LanguageId) => {
      setLanguage(lang);
      ensureBuffer(problemId, lang);
    },
    [problemId, ensureBuffer]
  );

  const handleProblemChange = useCallback(
    (id: string) => {
      setProblemId(id);
      // The new problem may not offer the current language (e.g. a JS-only
      // utility). Fall back to a supported one, preferring Python.
      const supported = languagesFor(getProblem(id)!);
      const nextLang = supported.includes(language) ? language : supported[0];
      setLanguage(nextLang);
      ensureBuffer(id, nextLang);
    },
    [language, ensureBuffer]
  );

  const handleRun = useCallback((result: RunResult) => {
    const text = result.output || result.stderr || "(no output)";
    lastRunRef.current = `exit ${result.exitCode}\n${text}`.slice(0, 2000);
  }, []);

  // Pulled fresh by VoiceChat on each turn.
  const getContext = useCallback(
    (): SessionContext => ({
      code,
      language,
      questionId: problem.id,
      questionTitle: problem.title,
      questionPrompt: problem.prompt,
      lastRun: lastRunRef.current,
    }),
    [code, problem, language]
  );

  const handleEnd = useCallback(() => {
    const ctx = getContext();
    endSession({
      questionTitle: ctx.questionTitle,
      questionPrompt: ctx.questionPrompt,
      code: ctx.code,
      language: ctx.language,
      lastRun: ctx.lastRun,
    });
  }, [getContext, endSession]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← Home</Link>
          <span className="text-gray-600">·</span>
          <h1 className="text-lg font-semibold">Coding Interview</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="text-gray-400">Problem</label>
          <select
            value={problemId}
            onChange={(e) => handleProblemChange(e.target.value)}
            className="bg-gray-800 text-gray-200 rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-gray-500"
          >
            {PROBLEMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} · {p.difficulty}
              </option>
            ))}
          </select>
          {assessError && (
            <span className="text-red-400 text-xs">{assessError}</span>
          )}
          <button
            onClick={handleEnd}
            disabled={assessing}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              assessing
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {assessing ? "Assessing…" : "End Interview"}
          </button>
        </div>
      </header>

      {/* Split screen */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: interviewer + voice */}
        <div className="w-[38%] min-w-[320px] border-r border-gray-800 min-h-0">
          <VoiceChat sessionId={sessionId} mode="coding" getContext={getContext} />
        </div>

        {/* Right: problem + editor */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="px-5 py-4 border-b border-gray-800 max-h-[38%] overflow-y-auto">
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-base font-semibold">{problem.title}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                {problem.difficulty}
              </span>
            </div>
            <div className="prose-invert max-w-none text-sm text-gray-300 space-y-2 markdown">
              <ReactMarkdown>{problem.prompt}</ReactMarkdown>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <CodeEditor
              code={code}
              language={language}
              languages={availableLanguages}
              onCodeChange={setCode}
              onLanguageChange={handleLanguageChange}
              onRun={handleRun}
            />
          </div>
        </div>
      </div>

      {scorecard && (
        <Scorecard data={scorecard} mode="coding" onClose={closeResult} />
      )}
    </div>
  );
}
