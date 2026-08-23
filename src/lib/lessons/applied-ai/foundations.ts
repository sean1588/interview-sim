import type { Lesson } from "../types";

export const foundationsLessons: Lesson[] = [
  {
    id: "ai-what-a-model-call-is",
    module: "foundations",
    title: "What an LLM Call Actually Is",
    blurb: "a stateless function from tokens to tokens — and every design constraint falls out of that.",
    content: `## The whole API in one line

\`\`\`
completion(messages, params) -> tokens, one at a time
\`\`\`

That's it. A model call takes a sequence of tokens, and emits a probability distribution over the next token, repeatedly, until it emits a stop token or hits a limit. Everything else — chat, tools, agents, RAG — is a convention layered on top of that one primitive.

Two properties of that primitive decide almost every architectural choice you will make:

**It is stateless.** The model remembers nothing between calls. "Conversation memory" is you resending the entire transcript every turn. When your chat app feels like it has memory, that is your code concatenating strings, not the model retaining anything. This is why turn 30 of a conversation costs far more than turn 1: you are paying to re-send turns 1-29.

**It is a fixed-width window.** The context window is a hard ceiling on prompt + output combined. Not a soft budget, not a performance hint — cross it and the call fails or silently truncates. Every "memory" feature in a production AI system is really a strategy for what to *drop*.

## Tokens, not words

Tokens are subword fragments produced by the tokenizer, not words:

\`\`\`
"unbelievable"          -> ["un", "bel", "ievable"]         3 tokens
"the cat sat"           -> ["the", " cat", " sat"]          3 tokens
"{\\"user_id\\": 12345}"   -> ~9 tokens (punctuation is expensive)
"日本語"                  -> 2-4 tokens (non-Latin costs more)
\`\`\`

The rough English rule is **~4 characters per token**, or ~750 words per 1000 tokens. Code, JSON, and non-Latin scripts run considerably worse — JSON keys repeated across 500 records is real money. Exact splits differ by tokenizer and shift between model generations, so count with the provider's tokenizer rather than trusting a rule of thumb.

This matters because tokens are the unit of *everything*: billing, the context limit, and latency. "Make the response shorter" is simultaneously a cost fix, a latency fix, and a context fix.

## Where the time goes

A completion has two distinct phases with very different cost profiles:

\`\`\`
PREFILL     read the whole prompt        parallel, fast, scales with prompt size
DECODE      emit output one token        sequential, slow, scales with output size
\`\`\`

Prefill processes your entire prompt at once. Decode cannot — token N+1 depends on token N, so output is generated strictly serially. A 20,000-token prompt with a 50-token answer is *fast*. A 200-token prompt with a 2,000-token answer is *slow*.

This is the single most useful latency fact in applied AI, and it is counterintuitive: **output length dominates wall-clock time, not input length.** If your endpoint is slow, look at what you asked the model to write before you look at what you sent it.

## Common use cases this shape supports well

- **Transform one blob of text into another** — summarize, classify, extract, rewrite, translate. Big input, small output: the cheap and fast quadrant.
- **Answer from provided context** — you supply the documents, the model reads them. Prefill-heavy, decode-light.
- **Emit structured data** — pull fields out of messy input into JSON your code can act on.

## When it's the wrong reach

Anything with a *verifiable* answer that a deterministic program can compute. Arithmetic, sorting, date math, lookups against your own database, regex-shaped extraction from consistent formats. A model will usually get these right, which is worse than always getting them right — you inherit a small unbounded error rate in exchange for nothing. Call the function; if you need the model, let it *call* the function.

> The library's [ML serving](/library/ml-serving) note covers the serving-side view — batching, autoscaling, and where inference sits in a request path. This lesson is about the contract you're coding against.`,
    exercises: [],
    quiz: [
      {
        id: "ai-what-a-model-call-is-q1",
        prompt: "Request A sends a 20,000-token document and asks for a one-sentence summary. Request B sends a 200-token brief and asks for a 2,000-word essay. Which finishes first, and why?",
        options: [
          "B — the model has less input to read, and reading is the expensive part",
          "A — prefill reads the whole prompt in parallel, while decode emits output serially, so output length dominates wall-clock time",
          "They finish at roughly the same time — total tokens is what matters",
          "A — but only because summaries are an easier task than essays",
        ],
        answer: 1,
        explanation: "Prefill processes the entire prompt in parallel; decode must generate each output token after the previous one. A big-input/small-output call is fast, and a small-input/big-output call is slow. Output length is the dominant latency term.",
      },
      {
        id: "ai-what-a-model-call-is-q2",
        prompt: "Your chat feature gets steadily more expensive as a conversation goes on, even though each user message is the same length. What explains it?",
        options: [
          "The model allocates more memory per session as the conversation grows",
          "Later tokens are billed at a higher rate than earlier ones",
          "The API is stateless, so every turn resends the full transcript — you re-pay for all prior turns each time",
          "The model's context window shrinks as it is used, forcing costlier re-encoding",
        ],
        answer: 2,
        explanation: "The model retains nothing between calls. Conversation memory is your code resending the entire transcript, so turn 30 pays for turns 1-29 again. This is why context trimming and prompt caching exist.",
      },
      {
        id: "ai-what-a-model-call-is-q3",
        prompt: "Which task is the clearest case for NOT using an LLM?",
        options: [
          "Computing the number of business days between two dates stored in your database",
          "Summarizing a 40-page contract into five bullet points",
          "Classifying a support ticket into one of twelve categories",
          "Extracting the shipping address from a free-text customer email",
        ],
        answer: 0,
        explanation: "Date math is verifiable and deterministic — a function gets it right every time, while a model gets it right *usually*. You take on an unbounded error rate for no benefit. The other three involve messy natural language, which is exactly where a model earns its cost.",
      },
    ],
  },
  {
    id: "ai-sampling-and-determinism",
    module: "foundations",
    title: "Sampling, Temperature & Non-Determinism",
    blurb: "why the same prompt gives different answers, which knobs actually change that, and how to build on top of it.",
    content: `## The model outputs a distribution, not a token

At each step the model produces a score for *every* token in its vocabulary. Sampling is the policy that turns that distribution into one choice.

\`\`\`
next-token distribution:    " Paris"  0.71
                            " the"    0.11
                            " France" 0.06
                            ...       (100k+ more)
\`\`\`

**temperature** rescales the distribution before sampling. Low temperature sharpens it toward the top candidate; high temperature flattens it, giving unlikely tokens a real chance.

\`\`\`
temperature = 0     take the argmax           deterministic-ish, repetitive
temperature = 0.7   mild flattening           the sane default for prose
temperature = 1.5   heavy flattening          creative, and increasingly incoherent
\`\`\`

Ranges are provider-specific: some cap temperature at 1.0, others allow up to 2.0, and several reasoning models don't expose sampling knobs at all. Check the API you're actually on before you tune.

**top_p** (nucleus sampling) truncates instead of rescaling: keep the smallest set of tokens whose probabilities sum to *p*, sample from those, discard the rest. \`top_p = 0.9\` cuts the long tail of nonsense while leaving genuine alternatives in play.

Tune one, not both. Moving temperature and top_p together makes the effect of each impossible to reason about, and the interaction is not intuitive.

## Temperature 0 is not determinism

This trips up nearly everyone. Even at temperature 0 you can get different outputs for identical inputs, because:

- **Floating-point non-associativity.** GPU kernels reduce in whatever order the batch scheduler produced, and \`(a+b)+c != a+(b+c)\` in floats. When the top two tokens are within a rounding error, the tie can break either way — then the whole continuation diverges.
- **Batching.** Your request is batched with other users' requests. Different batch composition, different kernel path, different rounding.
- **The provider changes the model under you.** A version alias like \`latest\` silently repoints. Even a pinned version can sit behind a changed serving stack or quantization.

Some providers offer a \`seed\` parameter. It pins the *sampler's* random draw, so it only does anything above temperature 0 — none of the three causes above are sampling randomness. Even where it applies it is best-effort: it cannot touch batch-dependent kernel paths, a changed serving stack, or a repointed model version. The conclusion below is unchanged.

The practical consequence: **treat non-determinism as a property of the system, not a bug to eliminate.** Don't write tests that assert exact output strings. Don't build features whose correctness requires two calls to agree. Do pin explicit model versions so you at least control the *big* jumps.

## Choosing a temperature is choosing a failure mode

\`\`\`
LOW  (0 - 0.3)     classification, extraction, routing, structured output,
                   anything a downstream parser consumes
MID  (0.5 - 0.8)   explanations, chat, summaries, code
HIGH (1.0+)        brainstorming, variation generation, synthetic data
\`\`\`

The rule of thumb: **if a program reads the output, go low. If a person reads it, go mid.** High temperature is for when you specifically want *different* answers each time — generating ten candidate headlines, seeding a diverse eval set.

## Sampling as a feature: self-consistency

Non-determinism is occasionally the point. Sample the same prompt N times at moderate temperature and take the majority answer. On tasks with a short, checkable answer this measurably beats a single low-temperature call — the model's errors are scattered while its correct answers cluster.

It costs N times as much, so it earns its keep only where accuracy is worth far more than tokens. It also gives you a free confidence signal: **when the N samples disagree, that's your escalate-to-a-human trigger**, and it's one of the few honest uncertainty measures you can get out of a model.

## When it's the wrong reach

Turning temperature down to 0 to "make the model more accurate." Temperature controls *variety*, not correctness. A confidently wrong answer at temperature 0 is still wrong, and you have removed your ability to detect it by resampling.

> The library's [ML serving](/library/ml-serving) note explains why batching exists on the serving side — which is also the reason your "deterministic" call isn't.`,
    exercises: [],
    quiz: [
      {
        id: "ai-sampling-and-determinism-q1",
        prompt: "A teammate sets temperature to 0 and writes a test asserting the model returns an exact string. Why is this test fragile?",
        options: [
          "Temperature 0 is invalid on most APIs and gets silently coerced to 1.0",
          "Temperature 0 selects the argmax but does not guarantee identical output — float non-associativity, batching, and provider-side model changes all break exact-match",
          "Temperature only affects the first token, so the rest of the output is random regardless",
          "Assertions on model output always pass, so the test proves nothing",
        ],
        answer: 1,
        explanation: "Temperature 0 removes deliberate randomness, not variability. GPU reductions are order-dependent in floating point, batch composition changes the kernel path, and providers repoint versions. Assert on shape and properties, never on exact strings.",
      },
      {
        id: "ai-sampling-and-determinism-q2",
        prompt: "You're building a router that classifies incoming tickets into one of twelve labels, and downstream code switches on that label. What temperature, and why?",
        options: [
          "1.0 — variety helps the model consider all twelve labels rather than fixating",
          "Whatever temperature maximizes output length, so the model explains its reasoning",
          "Around 0.7 — the default is tuned for accuracy across task types",
          "Low, near 0 — a parser consumes the output, so you want the highest-probability label and no variety",
        ],
        answer: 3,
        explanation: "If a program reads the output, go low. Variety has no upside for classification and directly risks emitting a label your switch statement doesn't handle. Save mid and high temperatures for text a human reads.",
      },
      {
        id: "ai-sampling-and-determinism-q3",
        prompt: "What genuinely useful signal does self-consistency sampling (N samples, majority vote) give you beyond a modest accuracy bump?",
        options: [
          "Disagreement among the samples is a usable uncertainty measure — a trigger to escalate to a human",
          "It reduces cost by amortizing the prompt across N calls",
          "It eliminates non-determinism by forcing the model toward one answer",
          "It lets you skip evaluation, since the majority answer is correct by construction",
        ],
        answer: 0,
        explanation: "Models are poorly calibrated when asked to state their own confidence, but sample disagreement is an honest, behavioral uncertainty signal. It costs N times as much, so it earns its keep where accuracy matters far more than tokens.",
      },
    ],
  },
  {
    id: "ai-model-selection",
    module: "foundations",
    title: "Choosing a Model",
    blurb: "capability tiers, the cost curve, and why the biggest model is usually the wrong default.",
    content: `## Three tiers, and most work belongs in the middle

Providers ship a ladder, and the rungs are more alike than the marketing suggests:

\`\`\`
SMALL / FAST     classification, routing, extraction, reformatting,
                 short summaries, moderation. Cheapest by 10-30x.
MID              the workhorse. Most chat, most RAG answering,
                 most code assistance, most agent steps.
FRONTIER         hard multi-step reasoning, long-horizon agents,
                 gnarly code, anything where a wrong answer is expensive.
\`\`\`

The important shape: **capability climbs sub-linearly while price climbs super-linearly.** Moving from small to frontier might buy you 15 points of accuracy on a hard benchmark and cost 20x. On an easy task it buys you nothing at all and still costs 20x.

So the question is never "which model is best?" It's "what is the *cheapest* model that clears the bar on **my** eval set?" — which is a question you cannot answer without an eval set. This is the practical reason evals come before optimization: without them, model selection is vibes plus a bill.

## Reasoning models are a different axis

Some models spend extra tokens "thinking" before answering. They are not simply better — they are a *latency and cost trade* with a specific shape:

- **Good for**: multi-constraint problems, math, planning, debugging, anything where the model needs to backtrack.
- **Bad for**: latency-sensitive paths, high-volume simple calls, and format-following. A reasoning model asked to emit a 3-field JSON object burns thinking tokens on a task that has no reasoning in it.

Reasoning effort is usually a knob, not a binary. Turning it down is often the single largest latency win available in an agent loop.

## The specs that actually constrain your design

- **Context window** — decides your chunking and memory strategy. A window twice as large does not make retrieval unnecessary; it makes it cheaper to be sloppy, which is not the same thing.
- **Modality** — text, images, audio, video in; text out (usually). Vision changes what problems are even addressable.
- **Tool calling quality** — wildly variable across tiers, and the thing agent reliability depends on most. Small models often *can* call tools but pick the wrong one under ambiguity.
- **Rate limits** — the constraint that actually bites in production. A model you can't get capacity for is not a model you can ship on.

## The pattern worth internalizing: cascade

Run the cheap model first. Escalate only what it can't handle.

\`\`\`
request -> SMALL model -> confident + well-formed? -> return
                       -> low confidence / failed schema / flagged -> FRONTIER model
\`\`\`

If the small model handles 85% of traffic, your average cost approaches the small model's price while your worst-case quality approaches the frontier model's. The engineering work is entirely in the escalation predicate — validation failure, sample disagreement, a low-scoring self-check, or a simple heuristic on input complexity.

## Common use cases

- **Cascade for volume** — support triage, content moderation, tagging pipelines.
- **Frontier-only for stakes** — anything where a wrong answer costs more than the whole month's inference bill.
- **Small-model preprocessing** — a fast model rewrites the query or picks the route, the mid model does the work.

## When it's the wrong reach

Defaulting every call to the frontier model "for quality," then discovering at scale that 90% of the traffic was reformatting JSON. And its mirror image: standardizing on the cheapest model to save money, then paying for it in an error rate nobody measured because there was no eval set.

> The library's [ML serving](/library/ml-serving) note covers capacity and autoscaling for inference — the operational half of "can I actually get this model in production?"`,
    exercises: [],
    quiz: [
      {
        id: "ai-model-selection-q1",
        prompt: "Why is \"always use the most capable model\" a poor default rather than merely an expensive one?",
        options: [
          "Frontier models are tuned for long-form output, so they ignore short-answer instructions",
          "Capability rises sub-linearly while price rises super-linearly, so on easy tasks you pay a large multiple for zero measurable gain — and usually add latency too",
          "Frontier models cannot emit structured output",
          "Providers throttle frontier models so heavily that they are never viable in production",
        ],
        answer: 1,
        explanation: "The tiers are closer in capability than in price. On tasks the small model already clears, the frontier model buys nothing and costs 10-30x, plus latency. The real question is the cheapest model that passes your eval set.",
      },
      {
        id: "ai-model-selection-q2",
        prompt: "In a cascade (small model first, escalate to a large one), where does the engineering effort actually go?",
        options: [
          "Into fine-tuning the small model so escalation is never needed",
          "Into keeping both prompts byte-identical so results are comparable",
          "Into the escalation predicate — deciding reliably when the cheap answer isn't good enough",
          "Into load balancing requests evenly across the two models",
        ],
        answer: 2,
        explanation: "The cost and quality math works only if you can tell when the cheap model failed. Schema validation failures, sample disagreement, self-check scores, and input-complexity heuristics are the usual triggers, and getting that predicate right is the whole design.",
      },
      {
        id: "ai-model-selection-q3",
        prompt: "When is a reasoning model the wrong choice?",
        options: [
          "When the task involves math, since reasoning models are tuned for language",
          "When the task needs backtracking across multiple constraints",
          "Whenever cost matters at all — reasoning models are never economical",
          "On latency-sensitive, high-volume calls with no real reasoning in them, like emitting a three-field JSON object",
        ],
        answer: 3,
        explanation: "Reasoning models trade tokens and latency for the ability to work through multi-step problems. On a formatting task there is nothing to reason about, so you pay the thinking tokens and the added latency for no gain. Reasoning effort is usually a dial — turning it down is often the biggest latency win in an agent loop.",
      },
    ],
  },
];
