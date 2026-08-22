import type { Lesson } from "../types";

export const promptingLessons: Lesson[] = [
  {
    id: "ai-prompt-anatomy",
    module: "prompting",
    title: "The Anatomy of a Working Prompt",
    blurb: "the five parts every production prompt has, and where in the window each one belongs.",
    content: `## A prompt is a program with a very unusual compiler

Production prompts converge on the same five parts, roughly in this order:

\`\`\`
1. ROLE + TASK      who the model is, what it's doing, for whom
2. CONTEXT          the documents, transcript, or data to work from
3. INSTRUCTIONS     rules, constraints, edge cases, what to do when unsure
4. EXAMPLES         2-5 input/output pairs showing the exact shape wanted
5. OUTPUT FORMAT    the schema or structure, stated last
\`\`\`

The ordering is not arbitrary and it is not stylistic. Two effects drive it.

**Position matters.** Models attend most reliably to the beginning and the end of the window, and least reliably to the middle. So: put the *task* first so everything after is read in light of it, put the *format* last so it is the freshest instruction when generation starts, and put bulk context in the middle where a small attention deficit is survivable.

**Long context is not free recall.** Give a model 100k tokens and ask about a fact buried at 60%, and retrieval accuracy sags. This is the practical reason "just paste everything in" is not a strategy: relevance beats volume, and it beats it at *every* context size.

## System vs user, and what the split is for

The system prompt carries what is true across *all* turns: persona, rules, format, available tools. The user turn carries this request. The split matters for three reasons: system instructions are typically weighted more strongly, the boundary is a security boundary (see the injection lesson), and a stable system prefix is what makes prompt caching possible.

Corollary that saves real money: **put the stable parts first.** Cached prefixes only work if the prefix is byte-identical across calls. A timestamp at the top of your system prompt invalidates the cache on every single request.

## Instructions that work vs instructions that don't

\`\`\`
WEAK                              STRONG
"Be concise."                     "At most 3 sentences."
"Don't make things up."           "If the answer isn't in the context above,
                                   reply exactly: NOT_FOUND"
"Handle errors gracefully."       "If the input isn't valid JSON, return
                                   {\\"error\\": \\"malformed\\"} and nothing else."
"Be helpful and accurate."        (delete — this is decoration)
\`\`\`

The pattern: **replace adjectives with thresholds, and give every failure case a named output.** A model with no instruction for "I don't know" will produce a confident guess, because that is what the surrounding text distribution looks like. Most hallucination in a well-built RAG system is not a knowledge failure — it's an unhandled branch.

Say what to do, not only what to avoid. "Don't use bullet points" leaves the model choosing among everything that isn't bullets; "Write one flowing paragraph" specifies the target.

## Common use cases

- **Extraction** — heavy on format and edge cases ("field absent → null"), light on role.
- **Classification** — the label definitions *are* the prompt; ambiguity between two labels is where all your errors live, so define the boundary explicitly.
- **Long-document QA** — task first, document in the middle, "answer only from the document above" last.

## When it's the wrong reach

Prompt engineering as a substitute for retrieval or tooling. If the model doesn't have the fact, no phrasing conjures it. If the task needs current data, the answer is a tool call, not a firmer instruction. Prompting shapes *how* a model uses what it has; it cannot supply what isn't there.

> Format is a wire contract between the model and your code — the library's [APIs & protocols](/library/apis-and-protocols) note covers how to think about contracts that both sides must honour.`,
    exercises: [],
    quiz: [
      {
        id: "ai-prompt-anatomy-q1",
        prompt: "Where should bulk context (a long document) sit relative to the task description and the output format?",
        options: [
          "Context last, so it is freshest in the model's attention when generation begins",
          "Between them — task first so the document is read purposefully, format last so it is freshest at generation time",
          "Context first, before the task, so the model reads with an open mind",
          "It makes no difference; attention is uniform across the context window",
        ],
        answer: 1,
        explanation: "Attention is strongest at the start and end of the window and weakest in the middle. The task belongs first so everything after is read in light of it, the format belongs last so it is the freshest instruction, and bulk context goes in the middle where a small deficit is survivable.",
      },
      {
        id: "ai-prompt-anatomy-q2",
        prompt: "A RAG system confidently invents answers when the retrieved documents don't contain the fact. What is the most likely prompt-level cause?",
        options: [
          "The temperature is set too low, forcing over-commitment to one answer",
          "The retrieved documents are too short for the model to ground itself",
          "There is no named output for the not-found case, so the model fills the gap with the most plausible-looking continuation",
          "The system prompt is too long and has crowded out the documents",
        ],
        answer: 2,
        explanation: "Most hallucination in a well-built RAG system is an unhandled branch, not a knowledge failure. Giving the failure case an explicit named output — \"reply exactly: NOT_FOUND\" — converts a guess into a signal your code can act on.",
      },
      {
        id: "ai-prompt-anatomy-q3",
        prompt: "Your system prompt begins with the current timestamp so the model knows today's date. What does this quietly cost you?",
        options: [
          "Prompt caching — the cached prefix must be byte-identical across calls, so a changing first line invalidates the cache on every request",
          "Nothing measurable; timestamps are only a few tokens",
          "Accuracy, because models cannot parse ISO dates reliably",
          "The system/user boundary, which no longer functions as a security boundary",
        ],
        answer: 0,
        explanation: "Cached prefixes match from the start of the prompt. Anything volatile at the top invalidates the whole cache every call. Keep the stable parts first and move volatile values — timestamps, user ids, request context — into the user turn.",
      },
    ],
  },
  {
    id: "ai-structured-output",
    module: "prompting",
    title: "Structured Output",
    blurb: "getting JSON your code can trust, and why \"return JSON\" in the prompt is the weakest way to ask.",
    content: `## Three mechanisms, in ascending order of reliability

\`\`\`
1. ASK NICELY        "Respond with JSON matching {...}"
                     ~95-99% valid. Fails on long outputs and edge inputs.

2. JSON MODE         provider flag forcing syntactically valid JSON
                     100% parseable. Shape is still not guaranteed.

3. CONSTRAINED       provider validates against YOUR schema during decoding
   DECODING          (structured outputs / tool schemas)
                     Shape guaranteed. The only one you can build on.
\`\`\`

The distinction between 2 and 3 is the one people miss. JSON mode guarantees you can call \`JSON.parse\`. It does **not** guarantee the object has your fields, or that \`status\` is one of your three enum values. Constrained decoding masks the token distribution at each step so that only tokens keeping the output valid against your schema can be sampled — invalid output is not rejected after the fact, it is *unreachable*.

If your provider supports it, use it. It removes an entire class of production incident for zero prompt effort.

## Tool calling is structured output wearing a hat

A function-call schema and a structured-output schema are the same mechanism. This is worth knowing because on providers where tool calling is better supported than structured outputs, "define a tool the model must call" is the sturdier way to get typed data — you never actually execute the tool, you just read the arguments.

## Designing schemas the model can actually fill

The schema is part of the prompt. Models fill well-designed schemas more accurately:

\`\`\`
BAD                                   GOOD
{ "data": object }                    { "invoice_total": number,
                                        "currency": "USD"|"EUR"|"GBP",
                                        "line_items": [...] }

deeply nested, 6 levels                flat, or 2 levels
free-string "category"                 enum of the 8 real categories
optional everything                    required fields with explicit
                                       nullable types
field named "value"                    field named "unit_price_cents"
\`\`\`

Concrete rules:

- **Enums over free strings** wherever the value set is closed. This is the single highest-leverage schema decision — it makes the wrong answer unrepresentable.
- **Descriptive field names.** \`refund_reason\` primes the model far better than \`reason2\`. The field name is an instruction.
- **Flat beats nested.** Deep nesting is where structural mistakes accumulate.
- **Put reasoning first, if you want reasoning.** A \`reasoning\` field *before* the answer field lets the model think on the page; the same field placed after the answer is a post-hoc rationalization and does nothing for accuracy. JSON key order is generation order.
- **Explicit nulls beat omitted fields.** \`"middle_name": null\` is unambiguous; a missing key could mean absent or forgotten.

## Handle failure anyway

Even with constrained decoding, calls fail: truncation at max_tokens (which yields *valid-prefix, invalid-whole* JSON), refusals, timeouts. The standard ladder:

\`\`\`
parse -> validate against schema -> on failure, retry once with the
         validation error appended -> on second failure, fall back
\`\`\`

The retry-with-the-error step is remarkably effective — the model usually fixes a schema violation when shown exactly what it broke. Two things to get right: cap it at one retry (a model that fails twice usually fails five times), and **log every repair**, because a rising repair rate is one of the earliest signals that a model version changed under you.

## When it's the wrong reach

Forcing structure on genuinely prose output. Wrapping a three-paragraph explanation in \`{"answer": "..."}\` costs escaping, tokens, and quality — long strings inside JSON are measurably worse than the same text generated freely. If the consumer is a human, return text.

> Schemas are the contract between the model and your code, with the same versioning problems as any other — see the library's [APIs & protocols](/library/apis-and-protocols) note.`,
    exercises: [],
    quiz: [
      {
        id: "ai-structured-output-q1",
        prompt: "What does JSON mode guarantee that asking nicely doesn't — and what does it still NOT guarantee?",
        options: [
          "It guarantees your required fields exist, but not their types",
          "It guarantees syntactically valid JSON, but not that the object matches your schema — fields and enum values can still be wrong",
          "It guarantees both syntax and schema; constrained decoding only adds speed",
          "It guarantees nothing extra; it is the same mechanism with a different name",
        ],
        answer: 1,
        explanation: "JSON mode makes the output parseable. Only constrained decoding against your schema makes the shape guaranteed, by masking the token distribution so invalid continuations are unreachable rather than rejected after the fact.",
      },
      {
        id: "ai-structured-output-q2",
        prompt: "You want the model to explain its reasoning as part of a structured response. Where does the `reasoning` field belong?",
        options: [
          "In a separate follow-up call, since reasoning and answers can't share a schema",
          "It doesn't matter — JSON objects are unordered",
          "After the answer field, so the answer isn't influenced by rambling",
          "Before the answer field — JSON key order is generation order, so reasoning placed first actually informs the answer",
        ],
        answer: 3,
        explanation: "The model generates keys in schema order. Reasoning before the answer is thinking on the page and can improve accuracy; reasoning after the answer is a post-hoc rationalization of a decision already made.",
      },
      {
        id: "ai-structured-output-q3",
        prompt: "Your schema-validation repair loop starts firing on 8% of requests, up from 0.3%. What should you conclude first?",
        options: [
          "Something changed on the model side — a version repoint or serving change — and the repair rate is your early-warning signal",
          "Users are sending longer inputs, which always degrades JSON validity",
          "The repair loop is misconfigured and should be removed",
          "Nothing — repair loops exist precisely so this doesn't need investigating",
        ],
        answer: 0,
        explanation: "Repairs succeed silently, which is exactly why the rate must be logged and alerted on. A sudden jump is one of the earliest available signals that the model underneath you changed.",
      },
    ],
  },
  {
    id: "ai-few-shot-and-decomposition",
    module: "prompting",
    title: "Examples & Decomposition",
    blurb: "when a few examples beat a page of rules, and when one prompt should have been three.",
    content: `## Examples specify what prose can't

Some things are hard to describe and trivial to demonstrate: tone, formatting conventions, how much detail is enough, where the boundary between two labels falls. For those, **2-5 examples usually outperform a paragraph of rules**, and cost fewer tokens.

The gains come almost entirely from the first few examples. One example fixes format. Three fix format plus the obvious edge cases. Twenty rarely beats five — and by then you're paying real prefill on every call for diminishing returns.

## Pick examples for coverage, not for typicality

The mistake is choosing three examples that all look like the happy path. The model already handles the happy path. Your examples should span the space *and* include the cases you keep getting wrong:

\`\`\`
example 1   the common case
example 2   the boundary between the two labels you keep confusing
example 3   the empty / missing-field / "not applicable" case
example 4   the adversarial-looking input that should NOT trigger the rule
\`\`\`

Two failure modes to watch. **Label imbalance**: if four of five examples are \`APPROVED\`, the model will over-predict \`APPROVED\`. Balance the classes or at least don't skew them. **Copying**: if your examples all mention "Acme Corp", expect "Acme Corp" to surface in outputs where it doesn't belong. Vary the surface details.

## Decomposition: one prompt, one job

The strongest reliability lever in applied AI isn't a better prompt — it's a smaller one. When a single call is asked to read a document, extract entities, judge sentiment, decide routing, and write a reply, errors compound and you cannot tell which step failed.

\`\`\`
ONE BIG CALL                          A CHAIN
read + extract + judge + route        extract  -> validate
+ write, in one shot                  classify -> validate
                                      draft    -> validate

opaque: one score, no idea            each step separately testable,
which step broke                      separately fixable, separately
                                      model-tiered
\`\`\`

Chaining buys you three things that matter more than they sound: **per-step evals** (you can measure extraction accuracy without confounding it with writing quality), **per-step model choice** (extraction on the cheap model, drafting on the good one), and **validation between steps** (a bad extraction gets caught before it poisons the draft).

It costs latency — steps run serially — and it costs tokens, since each step re-sends context. Parallelize the independent steps. Don't decompose past the point where a step is genuinely one job.

## Letting the model think

For multi-step problems, giving the model room to work before committing to an answer helps — that's the entire premise of reasoning models, and you can approximate it on any model with a \`reasoning\` field ahead of the answer, or an instruction to work through the steps first.

Two caveats worth carrying. The stated reasoning is **not a faithful trace** of the computation; it is text that looks like reasoning, and it can be a confabulation attached to an answer arrived at otherwise. So don't show it to users as an explanation, and don't audit decisions with it. And on genuinely simple tasks it adds latency and can talk the model out of a correct first instinct.

## Common use cases

- **Few-shot for style transfer** — matching an internal writing convention no rule captures.
- **Decompose for pipelines** — document → extract → normalize → validate → act.
- **Decompose for cost** — the expensive model runs only on the one step that needs it.

## When it's the wrong reach

Few-shot examples where the task has a *closed, describable* rule. If the rule is "flag any invoice over $10,000", state the rule — examples are a lossy, expensive encoding of something you can say exactly. And avoid decomposing a single-step task into a chain; you have added latency and failure points to buy nothing.

> A chained pipeline has the same coupling and partial-failure questions as any multi-service call path — the library's [APIs & protocols](/library/apis-and-protocols) note is the general version.`,
    exercises: [],
    quiz: [
      {
        id: "ai-few-shot-and-decomposition-q1",
        prompt: "You have five few-shot examples for a two-label classifier, and four of them are labelled APPROVED. What goes wrong?",
        options: [
          "Nothing — label distribution in examples has no effect on predictions",
          "The model over-predicts APPROVED, because the example distribution acts as an implicit prior",
          "The model refuses to emit REJECTED at all, since it was never shown enough of it",
          "The examples get truncated, so only the first is used",
        ],
        answer: 1,
        explanation: "Example distribution is read as a prior on the output distribution. Skewed examples skew predictions. Balance the classes, and choose examples for coverage of the hard boundaries rather than for typicality.",
      },
      {
        id: "ai-few-shot-and-decomposition-q2",
        prompt: "What is the strongest argument for splitting one large prompt into a chain of smaller ones?",
        options: [
          "Chains are always faster, because each call has a smaller prompt",
          "Chains eliminate hallucination by keeping each context short",
          "Each step becomes separately measurable, separately fixable, and separately model-tiered — instead of one opaque score you can't attribute",
          "It reduces token cost, since context is not re-sent between steps",
        ],
        answer: 2,
        explanation: "Decomposition buys per-step evals, per-step model choice, and validation between steps. It costs latency and tokens — context is re-sent each step — so it earns its keep when you need to know which step failed.",
      },
      {
        id: "ai-few-shot-and-decomposition-q3",
        prompt: "Why shouldn't you show a model's stated reasoning to users as an explanation of its decision?",
        options: [
          "It is usually too long to display in a UI",
          "It is not a faithful trace of the computation — it is plausible-looking text that can be a confabulation attached to an answer reached some other way",
          "Providers forbid displaying reasoning tokens",
          "Reasoning is generated after the answer, so it is always irrelevant",
        ],
        answer: 1,
        explanation: "Written reasoning helps accuracy on multi-step problems, but it is not an audit trail. Treating it as an explanation of why a decision was made — especially for consequential decisions — attributes a faithfulness it doesn't have.",
      },
    ],
  },
  {
    id: "ai-prompts-as-code",
    module: "prompting",
    title: "Prompts as Code",
    blurb: "versioning, diffing and shipping prompts without the silent regression.",
    content: `## The problem: your most fragile logic is a string literal

A prompt has all the properties of production code — it encodes business rules, it breaks, it needs review — and by default none of the tooling. Teams that skip this arrive at the same place: nobody knows which prompt version is live, nobody can explain why quality dropped last Tuesday, and a one-word tweak to fix one customer's complaint silently broke forty other cases.

## What "as code" concretely means

**Version them.** In the repo, in files, in git. Not in a database row edited through an admin panel, not inline in a handler where a hotfix can't be reviewed. You want \`git blame\` on the sentence that changed.

**Template them, don't concatenate them.** A prompt is a template with named slots and a typed input:

\`\`\`
render(TEMPLATE_V3, { documents, question, max_words: 100 })
\`\`\`

Named slots give you one place to see what varies, and — critically — one place to escape or delimit untrusted input.

**Stamp every call.** Log the prompt version *and* the model version with every completion. When quality moves, the first question is "what changed?" and you cannot answer it retroactively. This is a five-minute change that pays for itself the first time.

**Gate on evals, not on vibes.** Prompt changes get the same treatment as code changes: run the eval set before and after, and look at the *per-case* diff, not just the aggregate. An aggregate that holds steady at 87% can hide six new failures balanced by six new passes — and the six new failures might be your biggest customer.

## The one that surprises people: prompt changes are not local

Editing a prompt is not like editing a function. There's no type system, no call graph, and no compiler to tell you what else you touched. Adding "be concise" to fix verbose answers on one input class shortens answers on *every* class, including the ones where detail was the point.

This is the entire argument for an eval set. Not rigor for its own sake — it is the only mechanism that makes prompt edits reviewable at all.

## Rolling out a prompt change

Treat it as a deploy, because it is one:

\`\`\`
1. change the prompt, bump the version
2. run the offline eval set — inspect per-case regressions
3. ship behind a flag to a small % of traffic
4. watch online metrics (thumbs, escalation rate, repair rate, latency, cost)
5. ramp or roll back
\`\`\`

Rollback needs to be a config flip, not a redeploy. Bad prompt changes are usually noticed by users before they're noticed by dashboards, so the time from "this is worse" to "it's reverted" is the number that matters.

## Common use cases

- **A/B testing prompt variants** — same eval harness, two versions, real traffic split.
- **Per-tenant or per-locale prompt variants** — the same template, different slot values, one code path.
- **Auditability** — reproducing exactly what the model was shown when a decision is disputed.

## When it's the wrong reach

Building a prompt-management platform before you have a prompt problem. For one prompt and two engineers, a file and an eval script is the correct amount of infrastructure. The failure mode here is real but it's the *second* failure mode — the first is having no eval set at all.

> Shipping a prompt is shipping behaviour: the library's [Deploys & rollouts](/library/deploys-and-rollouts) note covers staged rollout and fast rollback, which apply here unchanged.`,
    exercises: [],
    quiz: [
      {
        id: "ai-prompts-as-code-q1",
        prompt: "Why is looking only at aggregate eval score before and after a prompt change insufficient?",
        options: [
          "Aggregate scores are always noisy and should be ignored",
          "A steady aggregate can hide new failures offset by new passes — the per-case diff is what reveals which behaviours you traded away",
          "Aggregate scores can only be computed with an LLM judge, which is unreliable",
          "It isn't insufficient; per-case inspection is redundant once you have an aggregate",
        ],
        answer: 1,
        explanation: "87% before and 87% after can mean six new failures balanced by six new passes. Prompt edits are non-local, so you need to see which specific cases moved — the new failures may matter far more than the new passes.",
      },
      {
        id: "ai-prompts-as-code-q2",
        prompt: "What single low-effort logging change most improves your ability to debug a quality drop?",
        options: [
          "Logging the full model output for every request",
          "Logging token counts per request",
          "Logging user IDs alongside each completion",
          "Stamping every completion with the prompt version and the model version",
        ],
        answer: 3,
        explanation: "When quality moves, the first question is what changed. Without version stamps you cannot answer it retroactively, and the two things most likely to have changed are the prompt and the model.",
      },
      {
        id: "ai-prompts-as-code-q3",
        prompt: "A teammate adds \"be concise\" to the system prompt to fix verbose answers reported by one customer. What is the specific risk?",
        options: [
          "The instruction will be ignored, since adjectives have no effect on models",
          "Prompt edits are non-local: with no type system or call graph, the change shortens answers on every input class, including ones where detail was the point",
          "It will invalidate the prompt cache permanently",
          "Conciseness instructions increase hallucination by definition",
        ],
        answer: 1,
        explanation: "There is no compiler to tell you what else a prompt edit touched. A global instruction applies globally, which is why an eval set — and a per-case diff — is the only thing that makes prompt edits reviewable.",
      },
    ],
  },
];
