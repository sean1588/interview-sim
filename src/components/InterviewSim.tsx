"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import VoiceChat, { SessionContext } from "@/components/VoiceChat";
import CodeEditor from "@/components/CodeEditor";
import Scorecard, { ScorecardData } from "@/components/Scorecard";
import SessionFrame from "@/components/session/SessionFrame";
import SelectChip from "@/components/session/SelectChip";
import ToggleChip from "@/components/session/ToggleChip";
import { useSession } from "@/components/useSession";
import {
  PROBLEMS,
  TOPICS,
  filterProblemGroups,
  getProblem,
  type Difficulty,
  type LanguageId,
  type Problem,
} from "@/lib/problems";
import type { RunResult } from "@/lib/runner";
import { failureLines, type TestSummary } from "@/lib/test-harness";

// Languages the editor can actually run, in display order. A problem is offered
// in the intersection of these and the languages it provides a starter for.
const RUNNABLE_LANGUAGES: LanguageId[] = ["python", "javascript", "typescript"];

function languagesFor(problem: Problem): LanguageId[] {
  return RUNNABLE_LANGUAGES.filter((l) => l in problem.starterCode);
}

// Options for the picker's difficulty filter, in display order.
const DIFFICULTY_FILTERS: (Difficulty | "All")[] = ["All", "Easy", "Medium", "Hard"];

// Options for the picker's category filter — the problem bank's topics, in bank
// order, behind an "All" default. "Category" is the label; `topic` is the field.
const CATEGORY_FILTERS: string[] = ["All", ...TOPICS];

// Difficulty tags carry their own warm tone: olive (Easy) → gold (Medium) → cognac (Hard).
const DIFFICULTY_TONE: Record<Difficulty, string> = {
  Easy: "border-olive/30 bg-olive/[0.12] text-olive",
  Medium: "border-gold/40 bg-gold/[0.13] text-gold-text",
  Hard: "border-cognac/30 bg-cognac/[0.1] text-cognac-text",
};

export default function InterviewSim() {
  const [problemId, setProblemId] = useState(PROBLEMS[0].id);
  const [language, setLanguage] = useState<LanguageId>("python");
  // Narrow the problem picker; "All" on either axis shows everything, and the
  // two compose (Trees + Hard shows only the hard tree problems).
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");
  const [topic, setTopic] = useState<string>("All");
  // Same problem, editor, and scorecard — only the live interviewer persona
  // changes (evaluator -> teacher).
  const [tutor, setTutor] = useState(false);

  const { sessionId, assessing, result: scorecard, error: assessError, endSession, closeResult } =
    useSession<ScorecardData>("coding");

  const problem = useMemo(() => getProblem(problemId)!, [problemId]);
  const availableLanguages = useMemo(() => languagesFor(problem), [problem]);

  // Groups (with their problems) matching the active filters.
  const visibleGroups = useMemo(
    () => filterProblemGroups(topic, difficulty),
    [topic, difficulty]
  );

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

  // If a filter change hides the selected problem, drop to the first one still
  // visible (routing through handleProblemChange resets buffer + language). If
  // nothing matches, keep the selection.
  const reselectIfHidden = useCallback(
    (nextTopic: string, nextDifficulty: Difficulty | "All") => {
      const visible = filterProblemGroups(nextTopic, nextDifficulty).flatMap(
        (g) => g.problems
      );
      if (visible.length > 0 && !visible.some((p) => p.id === problemId)) {
        handleProblemChange(visible[0].id);
      }
    },
    [problemId, handleProblemChange]
  );

  const handleDifficultyChange = useCallback(
    (next: Difficulty | "All") => {
      setDifficulty(next);
      reselectIfHidden(topic, next);
    },
    [topic, reselectIfHidden]
  );

  const handleTopicChange = useCallback(
    (next: string) => {
      setTopic(next);
      reselectIfHidden(next, difficulty);
    },
    [difficulty, reselectIfHidden]
  );

  // The interviewer reads the run through `lastRun`, so the grade has to ride in
  // the same text — folding it in here keeps turn-context.ts (and its marker
  // contract with the assess route) untouched.
  const handleRun = useCallback(
    (result: RunResult, tests?: TestSummary) => {
      const text = result.output || result.stderr || "(no output)";
      const verdict = tests
        ? tests.didNotRun
          ? ["Tests: did not run (code raised before the harness)"]
          : [
              `Tests: ${tests.passed}/${tests.total} cases passed`,
              ...failureLines(tests, problem.tests?.entryPoint[language] ?? "solution"),
            ]
        : [];
      lastRunRef.current = [`exit ${result.exitCode}`, ...verdict, text]
        .join("\n")
        .slice(0, 2000);
    },
    [problem, language]
  );

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

  // Three pickers plus the tutor toggle fill the header row, so the widest
  // control — the problem picker — is the one capped; a long title clips in the
  // closed chip, never in the dropdown itself.
  const controls = (
    <>
      <span className="whitespace-nowrap font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-faint">
        Problem
      </span>
      <SelectChip
        value={problemId}
        onChange={(e) => handleProblemChange(e.target.value)}
        ariaLabel="Problem"
        className="max-w-[230px]"
      >
        {visibleGroups.length === 0 ? (
          // No problem matches the filters (Backtracking + Hard, say). The
          // session keeps the problem it's on, so the picker says why it's
          // empty instead of collapsing to a blank chip. Carrying the current
          // id as the value is what makes the select show this line.
          <option value={problemId} disabled>
            No problems match
          </option>
        ) : (
          visibleGroups.map((g) => (
            <optgroup key={g.topic} label={g.topic}>
              {g.problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} · {p.difficulty}
                </option>
              ))}
            </optgroup>
          ))
        )}
      </SelectChip>
      <span className="whitespace-nowrap font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-faint">
        Category
      </span>
      <SelectChip
        value={topic}
        onChange={(e) => handleTopicChange(e.target.value)}
        ariaLabel="Category"
      >
        {CATEGORY_FILTERS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </SelectChip>
      <span className="whitespace-nowrap font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-faint">
        Difficulty
      </span>
      <SelectChip
        value={difficulty}
        onChange={(e) => handleDifficultyChange(e.target.value as Difficulty | "All")}
        ariaLabel="Difficulty"
      >
        {DIFFICULTY_FILTERS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </SelectChip>
      <ToggleChip checked={tutor} onChange={setTutor} label="Tutor mode" />
    </>
  );

  return (
    <>
      <SessionFrame
        root={{ label: "Studio", href: "/" }}
        title="Coding Interview"
        endLabel="End Interview"
        endBusyLabel="Assessing…"
        ending={assessing}
        onEnd={handleEnd}
        error={assessError ?? undefined}
        controls={controls}
      >
        {/* Conversation */}
        <div className="w-[466px] flex-none border-r border-section min-h-0">
          <VoiceChat sessionId={sessionId} mode="coding" tutor={tutor} getContext={getContext} />
        </div>

        {/* Work */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-editor">
          <div className="h-[218px] flex-none overflow-y-auto border-b border-hair px-[26px] py-5">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-serif text-[25px] font-semibold text-ink">{problem.title}</h2>
              <span
                className={`rounded-[5px] border px-2.5 py-[3px] font-sans text-[10px] font-medium uppercase tracking-[0.1em] ${DIFFICULTY_TONE[problem.difficulty]}`}
              >
                {problem.difficulty}
              </span>
            </div>
            <div className="markdown">
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
              tests={problem.tests}
              onRun={handleRun}
            />
          </div>
        </div>
      </SessionFrame>

      {scorecard && <Scorecard data={scorecard} mode="coding" onClose={closeResult} />}
    </>
  );
}
