"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import VoiceChat, { InterviewContext } from "@/components/VoiceChat";
import CodeEditor, { RunResult } from "@/components/CodeEditor";
import { PROBLEMS, getProblem, type LanguageId } from "@/lib/problems";

export default function InterviewSim() {
  const [problemId, setProblemId] = useState(PROBLEMS[0].id);
  const [language, setLanguage] = useState<LanguageId>("python");

  const problem = useMemo(() => getProblem(problemId)!, [problemId]);

  // Code is tracked per (problem, language) so switching either restores the
  // right buffer. Initialised lazily from each problem's starter scaffold.
  const [buffers, setBuffers] = useState<Record<string, string>>(() => ({
    [`${problem.id}:${language}`]: problem.starterCode[language],
  }));
  const bufKey = `${problemId}:${language}`;
  const code = buffers[bufKey] ?? problem.starterCode[language];

  const lastRunRef = useRef<string | undefined>(undefined);

  const setCode = useCallback(
    (value: string) => {
      setBuffers((prev) => ({ ...prev, [bufKey]: value }));
    },
    [bufKey]
  );

  const handleLanguageChange = useCallback(
    (lang: LanguageId) => {
      setLanguage(lang);
      const key = `${problemId}:${lang}`;
      setBuffers((prev) =>
        key in prev
          ? prev
          : { ...prev, [key]: getProblem(problemId)!.starterCode[lang] }
      );
      lastRunRef.current = undefined;
    },
    [problemId]
  );

  const handleProblemChange = useCallback(
    (id: string) => {
      setProblemId(id);
      const key = `${id}:${language}`;
      setBuffers((prev) =>
        key in prev
          ? prev
          : { ...prev, [key]: getProblem(id)!.starterCode[language] }
      );
      lastRunRef.current = undefined;
    },
    [language]
  );

  const handleRun = useCallback((result: RunResult) => {
    const text = result.output || result.stderr || "(no output)";
    lastRunRef.current = `exit ${result.exitCode}\n${text}`.slice(0, 2000);
  }, []);

  // Pulled fresh by VoiceChat on each turn.
  const getContext = useCallback(
    (): InterviewContext => ({
      code: buffers[bufKey] ?? problem.starterCode[language],
      language,
      problemTitle: problem.title,
      problemPrompt: problem.prompt,
      lastRun: lastRunRef.current,
    }),
    [buffers, bufKey, problem, language]
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800 shrink-0">
        <h1 className="text-lg font-semibold">Interview Sim</h1>
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
        </div>
      </header>

      {/* Split screen */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: interviewer + voice */}
        <div className="w-[38%] min-w-[320px] border-r border-gray-800 min-h-0">
          <VoiceChat getContext={getContext} />
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
              onCodeChange={setCode}
              onLanguageChange={handleLanguageChange}
              onRun={handleRun}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
