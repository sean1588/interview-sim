import type { Lesson } from "../types";

export const servingLessons: Lesson[] = [
  {
    id: "ai-latency-and-streaming",
    module: "serving",
    title: "Latency & Streaming",
    blurb: "TTFT vs total time, why streaming changes the product, and where the seconds actually go.",
    content: `## Two numbers, not one

\`\`\`
TTFT      time to first token       prefill + queue + network
TPOT      time per output token     decode, ~10-100ms each
total  =  TTFT + TPOT * output_tokens
\`\`\`

Optimizing "latency" without splitting these leads people to trim prompts when the problem is output length. Work the term that dominates:

- **TTFT dominated?** Shorten or cache the prompt, cut queue time (capacity, provider), move closer to the region.
- **Total dominated?** Cut output tokens, use a faster model, drop reasoning effort, or stream so total stops mattering as much.

A 1,000-token answer at 25ms/token is 25 seconds of decode. No amount of prompt trimming touches that.

## Streaming is a product decision

Streaming doesn't make anything faster — it changes what the user experiences. TTFT becomes the perceived latency and total time recedes into the background. A 12-second response that starts in 400ms feels responsive; the same response delivered whole at 12 seconds feels broken.

The costs are real, though, and worth knowing before you commit:

- **You can't validate before showing.** Streamed text is out of your hands. Schema validation, safety filtering, and repair all assume a complete response — which is why structured outputs and streaming pull against each other.
- **Errors mid-stream are awkward.** A failure after 300 tokens have rendered has no clean UX. Design for it explicitly.
- **Everything in the path must support it.** Proxies that buffer, serverless platforms that don't stream responses, and client frameworks that batch updates will silently defeat you.

The usual resolution: **stream what a human reads, buffer what a program parses.**

## Where the time actually goes

\`\`\`
network + TLS         20-100ms      real if you're cross-region
queueing              0-2000ms+     the invisible one; spikes under load
prefill               proportional to prompt; cache hits collapse it
decode                dominates whenever output is long
your own overhead     retrieval, reranking, tool calls, DB reads
\`\`\`

The one people miss is **queueing at the provider**. Your p99 is often not your model — it's capacity contention you don't control. It doesn't show up in local testing and it's the reason p99 diverges from p50 far more sharply than in a normal service.

Also budget your own pipeline honestly: retrieval 20ms, reranking 150ms, two tool calls at 300ms each, and you've spent nearly a second before the final generation begins.

## Levers that work, in rough order of payoff

1. **Generate fewer tokens** — cap length, ask for terse output, skip the preamble. Biggest lever, almost always.
2. **Prompt caching** — collapses prefill on a stable prefix; often a large TTFT win for free.
3. **Smaller model** — a tier down is often several times faster; combine with a cascade so quality holds.
4. **Parallelize your own steps** — retrieval, safety checks, and metadata lookups rarely need to be serial.
5. **Speculative UI** — start rendering scaffolding, show retrieved sources while generation runs.

## Timeouts and the client contract

Set explicit timeouts; the defaults are usually far too generous. And decide what a timeout *means* — retrying a long generation doubles cost and often times out again. For long jobs, the honest answer is an async pattern: accept the request, return a job id, deliver by webhook or polling. Trying to hold an HTTP connection open for a three-minute agent run fights every proxy in the path.

## When it's the wrong reach

Micro-optimizing model latency while your own pipeline spends 2 seconds in serial retrieval and reranking. Profile the whole path first — in AI systems, the non-model portion is bigger than teams expect.

> The library's [ML serving](/library/ml-serving) note covers batching, queueing, and capacity on the inference side — the source of the queue time you can see but not control.`,
    exercises: [],
    quiz: [
      {
        id: "ai-latency-and-streaming-q1",
        prompt: "Your endpoint takes 25 seconds. TTFT is 300ms and the response is ~1,000 tokens. What is the highest-leverage fix?",
        options: [
          "Trimming the prompt, since prompt size drives total latency",
          "Adding prompt caching to reduce prefill time",
          "Reducing output length or using a faster model — decode is serial, so ~1,000 tokens at 25ms each is where the 25 seconds live",
          "Moving the service to a region closer to the provider",
        ],
        answer: 2,
        explanation: "TTFT of 300ms says prefill, queue, and network are fine. Total time is dominated by decode, which is strictly serial in output tokens. Prompt trimming and caching improve a term that is already small.",
      },
      {
        id: "ai-latency-and-streaming-q2",
        prompt: "What does streaming fundamentally trade away?",
        options: [
          "Total throughput, since streamed connections hold server resources longer",
          "The ability to validate, filter, or repair the response before the user sees it — which is why structured output and streaming pull against each other",
          "Accuracy, because streamed generation uses a faster decoding path",
          "Prompt caching, which requires a complete non-streamed request",
        ],
        answer: 1,
        explanation: "Once tokens are rendered you can't take them back, so schema validation, safety checks, and repair loops all assume a complete response. The usual resolution is to stream what a human reads and buffer what a program parses.",
      },
      {
        id: "ai-latency-and-streaming-q3",
        prompt: "Your p99 latency is far worse than p50, and it doesn't reproduce in load testing against your own service. What's the most likely cause?",
        options: [
          "Queueing at the provider under capacity contention — a term you can observe but not control",
          "Tokenizer performance degrading on longer inputs",
          "Garbage collection pauses in your application server",
          "TLS handshake overhead on cold connections",
        ],
        answer: 0,
        explanation: "Provider-side queueing is the invisible latency term in AI systems. It spikes with aggregate demand you have no visibility into, doesn't appear in local testing, and makes p99 diverge from p50 much more sharply than in a normal service.",
      },
    ],
  },
  {
    id: "ai-caching-strategies",
    module: "serving",
    title: "Caching for LLM Systems",
    blurb: "three distinct caches with three different correctness stories — and which ones are actually safe.",
    content: `## Three caches, and people conflate them

\`\`\`
1. PROMPT / PREFIX CACHE    provider reuses computed attention state
                            for an identical prompt PREFIX
                            exact match, no correctness risk

2. EXACT-MATCH CACHE        you store completions keyed by a hash of
                            (prompt, model, params)
                            exact match, you control invalidation

3. SEMANTIC CACHE           you return a stored answer for a
                            SIMILAR query
                            fuzzy match — the dangerous one
\`\`\`

## Prompt caching: take the free win

Providers can cache the computed state for a prompt prefix, so a repeated prefix skips most of prefill. It is typically much cheaper and much faster, and requires no correctness reasoning at all — the output is the same.

The one rule that decides whether you get it: **stable content first, volatile content last.**

\`\`\`
GOOD                                    BAD
[system prompt]        cacheable        [timestamp]        <- kills it all
[tool definitions]     cacheable        [user id]
[few-shot examples]    cacheable        [system prompt]
[retrieved docs]                        [tool definitions]
[conversation]                          [conversation]
[user turn]            volatile
\`\`\`

Anything volatile at the top invalidates everything after it. This single ordering mistake is one of the most common — and most expensive — in production AI code. Note also that caches have short TTLs (minutes), so the win is on hot paths and multi-turn conversations, not on a request that arrives once an hour.

## Exact-match caching: mind the keys

Straightforward, with two traps. The key must include **everything** that changes the output — prompt, model *version*, temperature, tools, and every parameter — or you'll serve a stale answer after a model upgrade. And a cached answer at temperature 1.0 makes a deliberately-varied endpoint deterministic; if variety was the point, you just removed it.

Hit rates are highly workload-dependent: high for FAQ-shaped traffic, near zero for personalized or conversational traffic where no two prompts are identical.

## Semantic caching: powerful, and the one that bites

Embed the query, and if a stored query is within a similarity threshold, return its cached answer. Hit rates can be dramatically higher than exact match.

The risk is structural: **cosine similarity is not equivalence.** These pairs sit very close in embedding space and have opposite correct answers:

\`\`\`
"How do I cancel my subscription?"  vs  "How do I cancel my order?"
"Is the API rate limited?"          vs  "Is the API not rate limited?"
"What's the refund policy?"         vs  "What was the refund policy in 2019?"
\`\`\`

If you use it, constrain it hard: a **high threshold** (tuned against labelled pairs, not guessed), **namespace by user/tenant/locale** so you can't cross personalized boundaries, restrict it to a **known-safe query class** like general FAQ, and **log every hit** so you can audit what got substituted. Never semantically cache personalized, transactional, or time-sensitive answers.

## Invalidation is where RAG caches go wrong

A cached answer derived from documents is stale the moment those documents change. Track which document versions contributed to a cached answer and invalidate on update — or accept a short TTL and stop pretending. The failure mode is nasty: your assistant confidently quotes a policy you retired last week, and the index looks correct because the staleness lives in the cache.

## When it's the wrong reach

Semantic caching on anything user-specific or transactional. The cost of serving user A's answer to user B is not a slightly worse response — it's a data-leak incident. Exact-match caching is the safe default; make semantic caching prove its hit rate on a query class you can define.

> The library's [Caching](/library/caching) note covers keys, TTLs, invalidation, and stampedes — all of which apply here, with an extra hazard: a fuzzy key.`,
    exercises: [],
    quiz: [
      {
        id: "ai-caching-strategies-q1",
        prompt: "Why does putting a timestamp at the top of your system prompt defeat prompt caching entirely?",
        options: [
          "Timestamps are excluded from cacheable content by provider policy",
          "Prefix caches match from the start of the prompt, so a volatile first line invalidates every cached token after it",
          "The cache key is a hash of the full prompt, so any change misses — but only for that request",
          "It doesn't; prefix caches tolerate small differences",
        ],
        answer: 1,
        explanation: "Prefix caching reuses computed state for a matching prefix. Change byte one and nothing after it can be reused. Stable content — system prompt, tools, examples — goes first; volatile content goes last.",
      },
      {
        id: "ai-caching-strategies-q2",
        prompt: "What makes semantic caching structurally riskier than exact-match caching?",
        options: [
          "It requires an embedding call, which adds latency to every request",
          "Its hit rate is too low to justify the complexity",
          "Cosine similarity is not equivalence — \"cancel my subscription\" and \"cancel my order\" sit close together but have opposite correct answers",
          "Embeddings cannot be computed for questions, only for documents",
        ],
        answer: 2,
        explanation: "Exact match is either the same request or it isn't. Semantic match substitutes a different question's answer whenever it's near enough, and negation, entity swaps, and time qualifiers barely move the vector while completely changing the answer.",
      },
      {
        id: "ai-caching-strategies-q3",
        prompt: "What must a cache key include for a completion cache, beyond the prompt text?",
        options: [
          "Nothing else — the prompt fully determines the output",
          "Only the temperature, since other parameters don't alter output",
          "A timestamp, so entries expire naturally",
          "The model version and every generation parameter — otherwise a model upgrade silently serves answers from the old model",
        ],
        answer: 3,
        explanation: "Anything that changes the output belongs in the key: model version, temperature, top_p, max_tokens, tool definitions. Omitting the model version is the classic bug — you upgrade the model and keep serving the old one from cache.",
      },
    ],
  },
  {
    id: "ai-cost-control",
    module: "serving",
    title: "Cost Control",
    blurb: "where the bill actually comes from, and the levers that cut it by an order of magnitude.",
    content: `## Cost is tokens, and tokens have a shape

\`\`\`
cost = input_tokens x input_rate + output_tokens x output_rate
\`\`\`

Two things follow immediately. **Output tokens cost several times more than input tokens** on most providers — so verbose answers hit the bill twice, once in price and once in latency. And **the cheapest token is the one you never send**, which is why context hygiene is the first lever, not the last.

## Do this first: find out where the money goes

You cannot optimize an unlabelled bill. Log per request: feature, model, input tokens, output tokens, cached tokens, cost. Then group by feature.

The result is almost always lopsided in a way nobody predicted — one background job re-summarizing unchanged documents nightly, or a debug prompt that shipped with 8,000 tokens of examples nobody trimmed. **Attribution before optimization**, every time.

## The levers, roughly by payoff

**1. Right-size the model.** A tier down is often 10-30x cheaper. Most calls in a real system don't need the frontier model — reformatting, routing, extraction, and short summaries usually don't. Combine with a cascade so quality holds where it matters.

**2. Prompt caching.** Large discount on repeated prefixes, no quality cost. Requires the stable-first ordering from the caching lesson.

**3. Cut output length.** "At most 3 sentences" is a cost fix on the expensive side of the equation, and a latency fix, and often a quality fix.

**4. Trim context.** Retrieve 5 chunks instead of 20 if evals show no quality loss — which they often do, because irrelevant chunks are noise as well as cost. Summarize tool results instead of dumping raw payloads. Compact long conversations.

**5. Batch APIs.** Large discounts for asynchronous work with relaxed latency: nightly enrichment, backfills, bulk classification, eval runs. If it doesn't need to be interactive, it shouldn't be priced as if it were.

**6. Don't call the model.** Cache, use a rule, use a classical classifier, or return a canned response. A regex that handles 30% of traffic correctly is free and instant.

## Agents need budgets, not just monitoring

Agent loops are where cost incidents originate, because the model decides how many steps to take. Enforce, in code:

\`\`\`
per-run token budget          hard stop, with a defined partial result
per-user daily ceiling        the abuse and runaway-loop guard
per-feature monthly alert     at 50% / 80% / 100% of expected
cost logged per run           so a regression is visible next morning
\`\`\`

The specific disaster to prevent: a retry loop or a prompt-injected instruction driving a model to burn a month's budget overnight. Rate limiting per user is as much a cost control as an abuse control.

## Watch out for

- **Retries doubling cost silently.** Every retry is a full re-bill. Cap them and log the rate.
- **Long conversations.** Cost grows quadratically in turns without trimming.
- **Streaming and abandonment.** You pay for tokens generated after the user closed the tab — cancel on disconnect.
- **Evals.** A 500-case set with an LLM judge, run per commit, is a real line item.
- **Provider price changes and version repoints.** Pin versions and re-check the math periodically.

## When it's the wrong reach

Optimizing cost before you have quality. A cheap system nobody trusts has a poor return regardless of the bill, and premature downgrading is hard to detect without an eval set. Get it working, measure quality, *then* find the cheapest configuration that holds the bar.

> The library's [Rate limiting](/library/rate-limiting) note covers per-user quotas and token buckets — the mechanism behind per-user AI spend ceilings.`,
    exercises: [],
    quiz: [
      {
        id: "ai-cost-control-q1",
        prompt: "What should you do before applying any cost optimization?",
        options: [
          "Switch every call to the cheapest available model as a baseline",
          "Attribute spend per feature and per model — the distribution is almost always lopsided in a way nobody predicted",
          "Enable prompt caching everywhere, since it has no downside",
          "Reduce max_tokens globally to cap worst-case spend",
        ],
        answer: 1,
        explanation: "An unlabelled bill can't be optimized. Logging feature, model, and token counts per request usually reveals one background job or one bloated prompt dominating, and that beats broad speculative cuts.",
      },
      {
        id: "ai-cost-control-q2",
        prompt: "Why does \"limit the answer to three sentences\" pay off more than the token savings suggest?",
        options: [
          "Shorter answers can be cached more aggressively",
          "It reduces the input token count on the following turn only",
          "Output tokens cost several times more than input tokens, and decode is the dominant latency term — so it's a cost fix and a latency fix at once",
          "It allows a smaller model to be used automatically",
        ],
        answer: 2,
        explanation: "Output is the expensive side of the pricing equation and the serial side of the latency equation. Cutting it hits both, and on many tasks it improves the answer too.",
      },
      {
        id: "ai-cost-control-q3",
        prompt: "Which control most directly prevents an overnight cost incident from a runaway agent?",
        options: [
          "A dashboard alert at 80% of the monthly budget",
          "Switching the agent to a cheaper model tier",
          "A weekly cost review with the team",
          "Hard per-run token budgets and per-user daily ceilings enforced in code, with a defined partial result at the limit",
        ],
        answer: 3,
        explanation: "Alerts and reviews notice after the money is spent. Because the model decides how many steps to take, the only reliable guard is an enforced budget in the loop — plus a defined behaviour at the limit so a truncated run isn't mistaken for a complete one.",
      },
    ],
  },
  {
    id: "ai-fine-tuning-vs-prompting",
    module: "serving",
    title: "Fine-Tuning, RAG or Prompting?",
    blurb: "the decision people get backwards, and what fine-tuning actually teaches a model.",
    content: `## The one-line rule

**Fine-tuning teaches a model a form. Retrieval gives a model facts.** Almost every bad fine-tuning decision comes from confusing these.

\`\`\`
Model doesn't know your DATA          -> RAG. Not fine-tuning.
Model doesn't follow your FORMAT      -> prompt, then structured output.
Model doesn't match your STYLE/TONE   -> few-shot, then fine-tuning.
Model is too SLOW or EXPENSIVE        -> smaller model + fine-tuning.
Model can't do your SPECIALIZED TASK  -> fine-tuning, after evals prove it.
Model needs CURRENT information       -> tools. Nothing else works.
\`\`\`

## Why "fine-tune it on our docs" fails

It's the most common instinct and it's usually wrong. Fine-tuning adjusts weights to shift output *distribution*; it isn't a reliable storage mechanism for facts. Train on your documentation and you get a model that writes in the voice of your docs and still invents details, with no citations, no way to update a changed fact without retraining, and no access control. Retrieval gets you all four for far less effort.

The concrete comparison:

\`\`\`
                 RAG                        FINE-TUNING
new facts        add a document             retrain
correct a fact   edit a document            retrain
citations        natural                    none
access control   metadata filter            impossible
setup            days                       weeks + data collection
per-call cost    higher (context tokens)    lower (shorter prompts)
\`\`\`

The one place fine-tuning wins on the cost row is worth noting: if a long few-shot prompt is baked into the weights, every call gets shorter. At high volume that can pay for the training.

## What fine-tuning is genuinely good at

- **Format and style adherence** so consistent you stop paying for examples in every prompt.
- **Distilling a big model into a small one** for one narrow task: generate labelled outputs with the frontier model, fine-tune a small model on them, serve the small one. This is often a 10-30x cost reduction at comparable task quality, and it's the most under-used technique in applied AI.
- **Domain vocabulary and conventions** — legal, clinical, or internal shorthand where the base model's register is wrong.
- **Latency**, indirectly, by making a small fast model good enough.

## The part nobody budgets for: data

Fine-tuning is a data project wearing a modelling costume. You need hundreds to thousands of examples that are consistent, correct, and representative — and quality dominates quantity. Five hundred clean examples beat five thousand noisy ones, and inconsistent labels teach inconsistency directly.

You also inherit ongoing obligations: an eval set the tuned model is measured on, a retraining path when the base model is deprecated, and version pinning for both. A fine-tuned model is infrastructure you now own.

## The correct order

\`\`\`
1. prompt engineering        hours       often sufficient
2. + few-shot examples       hours
3. + retrieval               days        fixes the knowledge gap
4. + decomposition/tools     days        fixes the reasoning gap
5. fine-tune                 weeks       only with evals proving 1-4 fell short
\`\`\`

Skipping to 5 is the classic mistake, and it's expensive in the worst way: you spend weeks and end up unable to tell whether it helped, because you never built the eval set that would have shown you step 2 was enough.

## When it's the wrong reach

Fine-tuning for anything requiring current data, per-user data, or auditability. And fine-tuning before you have evals — you cannot tell if a tuned model is better without a measurement, and "it feels better" on a fine-tune you spent three weeks on is not a trustworthy report.

> The library's [ML serving](/library/ml-serving) note covers hosting your own model — the operational commitment a fine-tune signs you up for.`,
    exercises: [],
    quiz: [
      {
        id: "ai-fine-tuning-vs-prompting-q1",
        prompt: "A team wants to fine-tune a model on their product documentation so it can answer support questions. What's the strongest objection?",
        options: [
          "Fine-tuning teaches form, not facts — you'd get docs-flavoured prose that still invents details, with no citations, no access control, and a retrain needed for every content change",
          "Documentation is too short to fine-tune on effectively",
          "Fine-tuning would make the model slower at inference time",
          "Fine-tuned models cannot be used with structured outputs",
        ],
        answer: 0,
        explanation: "Weight updates shift output distribution; they aren't a reliable fact store. Retrieval gives you updatable facts, citations, and access control for a fraction of the effort. Fine-tune for style and format, retrieve for knowledge.",
      },
      {
        id: "ai-fine-tuning-vs-prompting-q2",
        prompt: "What is the most under-used, genuinely strong use of fine-tuning?",
        options: [
          "Injecting proprietary knowledge that must not leave your infrastructure",
          "Distillation — using a frontier model to generate labelled outputs, then fine-tuning a small model on them to serve one narrow task far more cheaply",
          "Keeping the model current on recent events without tool calls",
          "Improving the model's general reasoning ability across all tasks",
        ],
        answer: 1,
        explanation: "Distillation regularly buys a 10-30x cost reduction at comparable quality on a narrow task, and it also cuts latency by making a small model good enough. It's a form-and-behaviour transfer, which is exactly what fine-tuning does well.",
      },
      {
        id: "ai-fine-tuning-vs-prompting-q3",
        prompt: "Why is fine-tuning before building an eval set particularly costly?",
        options: [
          "Fine-tuning APIs require an eval set as a mandatory input",
          "The training data must be drawn from the eval set to be valid",
          "Without evals you can't tell whether the tune helped — and you may have spent weeks on something prompt changes would have fixed in hours",
          "Untested fine-tunes void the provider's model version pinning",
        ],
        answer: 2,
        explanation: "Fine-tuning is the last step in the ladder for a reason. Without a measurement you can't distinguish a real gain from a hopeful one, and you never learn whether few-shot prompting or retrieval would have closed the gap far sooner.",
      },
    ],
  },
];
