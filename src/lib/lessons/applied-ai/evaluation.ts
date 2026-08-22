import type { Lesson } from "../types";

export const evaluationLessons: Lesson[] = [
  {
    id: "ai-eval-sets",
    module: "evaluation",
    title: "Building an Eval Set",
    blurb: "the artifact that turns \"seems better\" into a number, and how to build one from real traffic in an afternoon.",
    content: `## Without evals you are not engineering

A prompt change has no compiler, no type check, and no local blast radius. The eval set is the only mechanism that answers "did that help?" — and teams that skip it end up tuning by anecdote, where the last complaint always wins and quality random-walks.

The good news is that the bar is far lower than people assume. **Twenty to fifty hand-labelled cases in a CSV, run by a fifty-line script, is enough to be transformative.** The gap between zero evals and a small eval set is enormous; the gap between a small one and an elaborate platform is modest.

## Where cases come from

In descending order of value:

1. **Production failures.** Every bug report, thumbs-down, and escalation becomes a case, permanently. This is how the set stays aligned with reality, and it's the reason to wire feedback capture before you need it.
2. **Real traffic, sampled.** Take a stratified sample of actual inputs — by intent, by length, by customer segment. Real queries are messier than anything you'd invent.
3. **Known edge cases.** Empty input, hostile input, wrong language, the ambiguous category boundary, the injection attempt.
4. **Synthetic cases.** A model generating test inputs. Useful for volume and for coverage of rare shapes; never sufficient alone, because generated inputs share the generator's blind spots.

The single most important discipline: **a bug that reaches production becomes a permanent eval case.** That one rule converts your eval set from a static snapshot into a regression suite that gets stronger every incident.

## What "correct" means, per task

Grading method follows task shape, and cheaper is better:

\`\`\`
EXACT MATCH        classification, routing, extraction fields
                   trivially automatable, unambiguous. Prefer it.

SCHEMA/RULE        valid JSON, required fields present, cited source
CHECK              exists, no PII, length within bounds
                   code, not a model. Fast, free, deterministic.

REFERENCE-BASED    "does the answer contain these three facts?"
                   robust to phrasing without needing exact match.

LLM JUDGE          open-ended quality, tone, helpfulness
                   powerful and noisy — see the next lesson.

HUMAN              the ground truth all of the above are calibrated to
\`\`\`

Push as much as possible up this list. A rule-based check that runs in CI for free beats a judge call that costs money and drifts. Reserve judges for what genuinely can't be checked mechanically.

## Structure the set so failures are legible

A single aggregate number tells you something moved but not what. Tag every case with a **category** — intent, difficulty, language, whether the answer is in the corpus — and report per-slice:

\`\`\`
overall          87%   (up 2 points — looks fine)
  simple_lookup  96%
  multi_hop      71%
  not_in_corpus  52%   <- down 14 points; the change taught it to guess
\`\`\`

That is a completely different story from "87%", and it is the story you needed. Slices are how you catch a change that helps the average and breaks the case that matters.

## Running them

Fast, deterministic, and in CI where possible. Set a temperature of 0 to reduce noise (accepting it isn't true determinism), pin the model version, and run each case a few times if you're measuring something noisy. Report per-case results, not just the aggregate, so a diff is reviewable.

Then hold the line: **a prompt or model change ships only with an eval diff attached.**

## When it's the wrong reach

Building an eval platform before you have twenty cases. Start with a CSV and a script. Also: chasing a high score on a stale set — an eval set that hasn't gained a case in three months has stopped tracking your product, and a score you've overfit to is worse than no score, because it's confidence without information.

> The library's [Observability](/library/observability) note covers instrumentation and the feedback signals that supply real production failures — the highest-value source of eval cases.`,
    exercises: [],
    quiz: [
      {
        id: "ai-eval-sets-q1",
        prompt: "Your overall eval score improves from 85% to 87% after a prompt change. Why might you still roll it back?",
        options: [
          "A 2-point gain is within noise for any eval set size",
          "Per-slice results may show a critical category — like \"answer isn't in the corpus\" — collapsing while easy cases improve",
          "Improvements under 5% are conventionally treated as regressions",
          "Because prompt changes should be evaluated only with an LLM judge",
        ],
        answer: 1,
        explanation: "Aggregates hide redistribution. If the change taught the model to guess rather than say NOT_FOUND, the not-in-corpus slice tanks while easy lookups improve. Tag cases by category and read the per-slice diff.",
      },
      {
        id: "ai-eval-sets-q2",
        prompt: "Which single discipline does the most to keep an eval set useful over time?",
        options: [
          "Regenerating the whole set synthetically each quarter",
          "Keeping the set at exactly the size where it runs in under a minute",
          "Grading every case with the most capable available judge model",
          "Turning every production failure into a permanent eval case",
        ],
        answer: 3,
        explanation: "That one rule converts a static snapshot into a regression suite that strengthens with every incident, and keeps the set anchored to how the product actually fails rather than how you imagined it would.",
      },
      {
        id: "ai-eval-sets-q3",
        prompt: "For checking that a response is valid JSON with required fields and a citation, what should do the grading?",
        options: [
          "Code — a deterministic rule check is free, fast, and unambiguous, so push grading as far up from LLM judges as the task allows",
          "An LLM judge, since it can also assess whether the citation is appropriate",
          "A human reviewer, since format compliance is subjective",
          "Exact string match against a reference response",
        ],
        answer: 0,
        explanation: "Grading method should follow task shape, and cheaper is better. Rule checks run free in CI and never drift; reserve judges for open-ended quality that genuinely can't be checked mechanically.",
      },
    ],
  },
  {
    id: "ai-llm-as-judge",
    module: "evaluation",
    title: "LLM-as-Judge",
    blurb: "grading open-ended output at scale — and the biases that make a naive judge worse than useless.",
    content: `## The problem judges solve

"Is this summary good?" has no exact-match answer. Human grading is the gold standard and doesn't scale to every commit. An LLM judge sits between: cheap enough to run on every change, better than nothing by a wide margin, and — critically — **noisy in ways you must actively correct for.**

## The biases, and the fixes

These are measured, reproducible effects, not folklore:

\`\`\`
POSITION BIAS      prefers whichever response came first (or last)
                   FIX: run both orders, average; disagreement = a tie

VERBOSITY BIAS     prefers longer answers, largely regardless of quality
                   FIX: control for length, or grade against a rubric
                   with explicit conciseness criteria

SELF-PREFERENCE    prefers text from its own model family
                   FIX: use a different model as judge than as generator

SCORE CLUSTERING   nearly everything lands on 7 or 8 out of 10
                   FIX: use 3-5 point scales with defined anchors,
                   or binary pass/fail per criterion

SYCOPHANCY         "is this correct?" biases toward yes
                   FIX: neutral framing, no leading question
\`\`\`

Position and verbosity bias between them explain most of the surprise when a judge disagrees with a human — and both have cheap mechanical fixes.

## Design the judge like a rubric, not a vibe

\`\`\`
WEAK    "Rate this answer 1-10 for quality."

STRONG  "Score each criterion independently as PASS or FAIL.
         GROUNDED: every factual claim is supported by the context above.
         COMPLETE: addresses every part of the question.
         FORMAT:   valid JSON with a \`sources\` array.
         For each, state the criterion, a one-line justification, then
         PASS or FAIL. Justification first."
\`\`\`

Three things make the strong version work: **decomposed criteria** (you learn *what* is wrong, and each is more objective than "quality"), **binary decisions** (no clustering at 7), and **justification before verdict** (generation order means reasoning placed first actually informs the decision).

Pairwise comparison — "A or B, which better satisfies this rubric?" — is more reliable than absolute scoring, because relative judgement is easier than calibration. Use it for A/B'ing two prompt versions; use absolute rubric scoring when you need a trackable number over time.

## Calibrate the judge against humans

This is the step that gets skipped, and it's what separates a judge from a random number generator.

1. Have a human grade 50-100 cases.
2. Run the judge on the same cases.
3. Measure agreement (Cohen's kappa, or plain agreement rate).
4. Below ~80% agreement, the judge is measuring something other than what you care about — fix the rubric and repeat.
5. Re-calibrate whenever the judge model or rubric changes.

**An uncalibrated judge is a number that feels like evidence.** That's worse than no number, because you'll act on it.

## Practical notes

- **Judge model ≠ generator model.** Self-preference is real, and a shared blind spot is invisible by construction.
- **Judges cost money.** A 500-case set × 3 criteria × every commit adds up. Reserve judges for what rules can't check.
- **Log judge reasoning.** When the score moves, you need to read why.
- **Version the rubric.** A changed rubric changes the score. Un-versioned rubrics produce mysterious step changes in your quality dashboard.

## When it's the wrong reach

Using a judge for something a rule can check. "Is it valid JSON?", "did it cite a source?", "is it under 200 words?" — that's code, and code is free, instant, and doesn't drift. And using a judge for factual correctness in a domain where the judge has no more knowledge than the generator: it will confidently confirm a plausible falsehood.

> A judge is a quality metric you deploy and must trust — the library's [Observability](/library/observability) note covers what makes a metric actionable rather than decorative.`,
    exercises: [],
    quiz: [
      {
        id: "ai-llm-as-judge-q1",
        prompt: "You ask a judge to pick the better of two responses and it favours the first one presented far more often than a human would. What's the standard fix?",
        options: [
          "Switch to a more capable judge model, which eliminates ordering effects",
          "Run the comparison in both orders and average — treat disagreement between the two runs as a tie",
          "Always present the new response first, so improvements aren't missed",
          "Ask the judge to explain its choice, which removes position bias",
        ],
        answer: 1,
        explanation: "Position bias is a measured, reproducible effect present in capable models too. Running both orders costs one extra call and turns the bias into a usable tie signal.",
      },
      {
        id: "ai-llm-as-judge-q2",
        prompt: "Why is an uncalibrated LLM judge arguably worse than having no judge at all?",
        options: [
          "It costs money that would be better spent on human review",
          "Judges always disagree with humans, so the number is meaningless by definition",
          "It produces a number that looks like evidence, so teams act on a metric that may not track what they care about",
          "It slows down CI enough to discourage running evals",
        ],
        answer: 2,
        explanation: "The failure isn't the noise, it's the false confidence. Grade 50-100 cases by hand, measure agreement, and fix the rubric until agreement is high enough that the score means something.",
      },
      {
        id: "ai-llm-as-judge-q3",
        prompt: "Which rubric design most reduces score clustering and tells you what actually went wrong?",
        options: [
          "A single 1-10 quality score with a detailed description of what 10 means",
          "A 1-100 score, which gives the judge finer resolution",
          "Averaging three independent 1-10 scores from three judge calls",
          "Independent PASS/FAIL decisions per named criterion, each with a one-line justification stated before the verdict",
        ],
        answer: 3,
        explanation: "Decomposed binary criteria avoid the 7-or-8 clustering of numeric scales, each criterion is more objective than \"quality\", and justification-before-verdict exploits generation order so the reasoning informs the decision.",
      },
    ],
  },
  {
    id: "ai-online-evaluation",
    module: "evaluation",
    title: "Online Evaluation & Error Analysis",
    blurb: "the metrics that reveal quality in production, and the manual read-through that finds what dashboards can't.",
    content: `## Offline evals can't see everything

Your eval set contains the inputs you thought of. Production contains the ones you didn't: the language you don't support, the copy-pasted 40-page email, the user who types one word. Offline evals catch regressions on known cases; **online evaluation is how new failure modes are discovered at all.**

## Signals, ranked by honesty

\`\`\`
IMPLICIT (free, plentiful, indirect)
  did the user retry / rephrase immediately?     strongest cheap signal
  did they copy the answer?                      it was useful
  did they abandon mid-stream?                   it wasn't
  did they escalate to a human?                  the sharpest of all
  conversation length for a task-based flow      longer is usually worse

EXPLICIT (sparse, biased, direct)
  thumbs up/down                                 <1% response rate,
                                                 skewed to the angry
  a free-text "what went wrong?"                 low volume, high value

AUTOMATIC (on every request, no user involved)
  schema validation failure rate
  NOT_FOUND / refusal rate
  citation-present rate
  tool error rate, retry rate
  latency, cost, token counts per request
\`\`\`

Two of these deserve special attention. **Immediate rephrase** is the best cheap quality signal most teams already have in their logs and don't use — a user rewording the same question is telling you the first answer failed. And the **automatic** row is free, dense, and unbiased: those rates moving is often the first sign of a model change, a corpus problem, or a bad deploy.

## Error analysis: the highest-yield hour in applied AI

Read fifty real failures. By hand. Not a dashboard — the actual inputs and outputs.

\`\`\`
1. sample 50 failures (low rating, escalated, rephrased, errored)
2. read every one; write a one-line cause for each
3. group the causes into categories
4. count the categories
5. fix the biggest one
6. repeat
\`\`\`

This is unglamorous and it consistently outperforms speculative optimization. Almost every team that does it discovers the distribution is nothing like what they assumed — that 40% of "bad answers" are one document that was never indexed, or a date-format quirk, or a single ambiguous label definition. You do not find that in an aggregate score.

The output is two things: a ranked fix list, and a batch of new eval cases.

## Shipping changes safely

Model and prompt changes are behaviour changes, so they get the same rollout discipline as code:

\`\`\`
shadow      run the new version alongside, compare outputs, serve neither
canary      1-5% of traffic, watch automatic + implicit metrics
A/B         real split, measure the outcome you actually care about
ramp        widen if metrics hold
\`\`\`

Shadow mode is underused and especially valuable here: because there's no ground truth, output *diffs* between old and new on real traffic are often more informative than either version's score. Where they agree, you don't care; where they disagree, you have a curated review queue.

Bad AI changes are usually noticed by users before dashboards. Keep rollback a config flip, not a redeploy.

## When it's the wrong reach

Optimizing a metric that doesn't track user value — thumbs-up rate rewards agreeable answers, and a model can raise it by being flattering rather than correct. Tie online metrics to task outcomes (did the ticket get resolved without a human?) rather than to sentiment wherever you can.

> The library's [Deploys & rollouts](/library/deploys-and-rollouts) note covers canaries, shadow traffic, and fast rollback — the same machinery, applied to a non-deterministic component.`,
    exercises: [],
    quiz: [
      {
        id: "ai-online-evaluation-q1",
        prompt: "Which implicit signal is usually the strongest cheap indicator that an answer was bad?",
        options: [
          "The user immediately rephrasing and resubmitting essentially the same question",
          "Total session duration across the day",
          "The number of tokens in the model's response",
          "Whether the user returned to the product the following week",
        ],
        answer: 0,
        explanation: "An immediate rephrase is the user telling you the first answer failed, it's already in your logs, and it's far denser than the sub-1% who click a thumbs button. Most teams have this signal and don't use it.",
      },
      {
        id: "ai-online-evaluation-q2",
        prompt: "What makes manually reading fifty real failures more valuable than studying the aggregate quality dashboard?",
        options: [
          "It produces a lower error rate by itself, since reading failures fixes them",
          "It is the only way to compute per-slice scores",
          "Dashboards are typically miscalibrated and cannot be trusted",
          "The cause distribution is almost never what the team assumed — it surfaces things like one unindexed document causing 40% of failures",
        ],
        answer: 3,
        explanation: "Aggregates tell you something is wrong; reading actual inputs and outputs tells you what. The output is a ranked fix list plus a batch of new eval cases, and it consistently beats speculative optimization.",
      },
      {
        id: "ai-online-evaluation-q3",
        prompt: "Why is shadow mode especially useful for AI changes compared with conventional deploys?",
        options: [
          "It removes the need for offline evals entirely",
          "With no ground truth available, the diff between old and new outputs on real traffic gives you a curated review queue of exactly the cases where behaviour changed",
          "It eliminates cost, since shadow requests aren't billed",
          "It guarantees the new version cannot affect users, which canaries cannot",
        ],
        answer: 1,
        explanation: "You often can't score either version absolutely, but you can see where they disagree. Agreement is uninteresting; disagreement is the entire set of cases worth a human look before you ramp.",
      },
    ],
  },
];
