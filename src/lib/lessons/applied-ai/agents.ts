import type { Lesson } from "../types";

export const agentsLessons: Lesson[] = [
  {
    id: "ai-tool-calling",
    module: "agents",
    title: "Tool Calling",
    blurb: "the mechanism that turns a text generator into something that can act, and the schema design that decides whether it works.",
    content: `## The model never calls anything

The name misleads. The model does not execute your function — it emits a structured request, and **your code** decides whether to run it:

\`\`\`
1. you send    messages + tool schemas
2. model emits { name: "get_weather", arguments: { city: "Oslo" } }
3. YOUR CODE   validates, authorizes, executes, handles the error
4. you send    the result back as a tool-result message
5. model emits the final answer (or another tool call)
\`\`\`

Step 3 is the whole security model. The model is an untrusted planner proposing an action; your code is the enforcement point. Every authorization check, every rate limit, every argument validation lives there — never in the prompt. "Only call refund_order for orders under $100" is a suggestion. A check in step 3 is a rule.

Note that the loop is the mechanism: a tool result goes back into the context and the model runs again. That's why an agent is not a new API — it's this loop, repeated.

## Tool schemas are prompts

The model picks a tool from its name, description, and parameter schema alone. Those three things *are* the interface documentation, and vague ones produce wrong calls:

\`\`\`
WEAK
  name: "search"
  description: "Searches"
  params: { q: string, type: string }

STRONG
  name: "search_orders"
  description: "Find a customer's orders by email or order ID. Returns at
    most 20, newest first. Use for order history questions. Does NOT
    return refunds — use search_refunds for those."
  params: { email?: string, order_id?: string,
            status?: "pending"|"shipped"|"delivered"|"cancelled" }
\`\`\`

The strong version does three things: it says what the tool returns, it says when to reach for it, and — most valuable — it says **what it is not for and where to go instead**. Confusion between two similar tools is the number one source of wrong tool calls, and a disambiguating sentence in each description fixes most of it.

Other rules that hold up: enums over free strings, flat arguments over nested objects, and **one tool per intent** rather than a mega-tool with a mode flag. Fewer, sharper tools beat many overlapping ones.

## Tool count is a budget

Accuracy degrades as the tool count grows — more tools means more chances to pick a neighbour. What actually hurts is confusability rather than the raw number: fifteen well-separated tools are easier than five that overlap. Past roughly 10-20, do something about it: filter the exposed set by conversation state, load definitions on demand from a searchable catalogue instead of listing them all up front, group tools behind a router, or split into sub-agents that each own a small toolkit.

## Errors are context, not exceptions

When a tool fails, feeding the model a useful error usually lets it recover — this is one of the genuinely delightful properties of the pattern:

\`\`\`
BAD    "Error"
       (silently drop it and hope)
GOOD   "Error: no order found with id 'A-99321'. Order IDs look like
        ORD-12345. Try search_orders with the customer's email."
\`\`\`

But bound it. A model that retries the same failing call forever is the most common agent bug. Cap retries per tool, cap total tool calls per turn, and treat "same call, same arguments, twice in a row" as a loop to break.

## Common use cases

- **Data lookup** — the model gets current, authoritative facts instead of guessing.
- **Actions with side effects** — booking, refunding, filing. These need confirmation gates.
- **Computation** — hand arithmetic, dates, and unit conversion to code that's always right.
- **Structured output** — define a tool you never execute, and read the arguments.

## When it's the wrong reach

Wrapping a fixed sequence in tools. If the flow is always lookup → compute → format, write the function; letting a model rediscover a known sequence on every request buys latency, cost, and a small failure rate in exchange for nothing. Tools earn their keep when *which* action to take, or *whether* to take one, genuinely depends on the input.

> Tool schemas are an API contract with an unusually literal-minded client — the library's [APIs & protocols](/library/apis-and-protocols) note covers the general design principles.`,
    exercises: [],
    quiz: [
      {
        id: "ai-tool-calling-q1",
        prompt: "Where does the rule \"only refund orders under $100\" belong?",
        options: [
          "In the system prompt, stated firmly and repeated for emphasis",
          "In the tool's parameter schema, as a maximum on the amount field",
          "In your code, at the point where you execute the tool call — the model is an untrusted planner and your executor is the enforcement point",
          "In the tool description, so the model knows the limit before calling",
        ],
        answer: 2,
        explanation: "The model only emits a request; your code executes it. Anything in the prompt or schema is a suggestion that a confused or manipulated model can ignore. Authorization, limits, and validation belong in the executor.",
      },
      {
        id: "ai-tool-calling-q2",
        prompt: "Your agent frequently calls `search_refunds` when the user asked about orders. What is the most effective fix?",
        options: [
          "Lower the temperature so the model commits to its first choice",
          "Add a disambiguating sentence to each tool description saying what it is NOT for and which tool to use instead",
          "Merge both tools into one with a `type` flag",
          "Increase the number of few-shot examples in the system prompt",
        ],
        answer: 1,
        explanation: "Confusion between similar tools is the leading cause of wrong calls, and the tool description is the interface documentation the model reads. Explicit negative scope — \"does NOT return refunds, use search_refunds\" — resolves most of it.",
      },
      {
        id: "ai-tool-calling-q3",
        prompt: "A tool call fails. What is the best default handling?",
        options: [
          "Return a specific, actionable error message to the model as a tool result, with retries and total call count capped",
          "Silently drop the result so the model isn't confused by errors",
          "Abort the turn and surface the raw exception to the user",
          "Retry automatically until it succeeds, since transient failures are common",
        ],
        answer: 0,
        explanation: "Models recover well from informative errors — that's a real strength of the pattern. But unbounded retrying of the same failing call is the most common agent bug, so cap retries, cap total calls, and break on a repeated identical call.",
      },
    ],
  },
  {
    id: "ai-agent-loops",
    module: "agents",
    title: "The Agent Loop",
    blurb: "plan, act, observe, repeat — plus the termination conditions that keep it from running forever.",
    content: `## The loop is four lines

\`\`\`
while not done:
    action = model(context)          # decide
    result = execute(action)         # act
    context += result                # observe
    done = action.is_final or over_budget(...)
\`\`\`

Everything marketed as an "agent framework" is this loop plus opinions about context management, tool registration, and error handling. Writing it yourself first is genuinely worth the hour — the frameworks make much more sense once you know what they're hiding.

The property that makes agents powerful is also what makes them hard: **the model chooses the number of steps.** A workflow with a fixed DAG has bounded cost and bounded failure modes. An agent has neither, by design.

## Termination is the actual engineering

An agent without hard stops is an outage waiting for traffic. You need all of these, not one:

\`\`\`
max steps           15-30 for most tasks; hitting it is a signal, not a crash
token budget        cumulative across the whole run
wall-clock timeout  because a slow tool can stall a run indefinitely
no-progress detect  same tool + same args twice -> break
cost ceiling        per run AND per user per day
\`\`\`

And decide what happens *at* the limit. Silently returning a half-finished result is worse than failing: downstream code can't tell the difference. Return a partial result explicitly marked incomplete, or escalate to a human.

**No-progress detection** is the highest-value one. The classic agent death spiral is a model calling the same failing tool with the same arguments, reading the same error, and trying again — burning a full budget on zero information. Hash (tool, args), keep a set, and break on a repeat.

## Errors compound multiplicatively

This is the number that should shape your design:

\`\`\`
per-step reliability     10 steps      20 steps
95%                      60%           36%
99%                      90%           82%
99.9%                    99%           98%
\`\`\`

A model that gets each step right 95% of the time — which sounds excellent — completes a ten-step task 60% of the time. There are only two responses: **fewer steps**, or **verification between steps**. Both are more effective than a better prompt.

Which is why the strongest production pattern is usually *not* a free-roaming agent. It's a **workflow with agentic steps**: a fixed sequence you control, where individual steps are model calls that may use tools. Deterministic where the flow is known, agentic only where it genuinely isn't.

\`\`\`
FREE AGENT            "here are 12 tools, achieve the goal"
                      flexible, unbounded, hard to test, hard to bound

AGENTIC WORKFLOW      fetch -> [model: classify] -> route
                        -> [model: draft w/ tools] -> validate -> send
                      testable, bounded, observable; each step evaluable
\`\`\`

Start with the workflow. Move toward the free agent only where the task genuinely can't be sequenced ahead of time.

## Human in the loop

For irreversible actions — sending an email, issuing a refund, deleting data, merging code — the loop should pause. The useful framing is a per-tool **reversibility** classification: read-only tools auto-run, reversible writes auto-run with an audit log, irreversible actions require confirmation. That's a property of the tool, not of the prompt, so it can't be talked around.

## When it's the wrong reach

An agent where a script would do. If you can write the steps down, write the steps down — you'll get lower latency, lower cost, testability, and a real stack trace when it breaks. The honest test: *can I enumerate the steps in advance?* If yes, it's a workflow.

> A multi-step run that must not half-complete raises the same questions as any distributed workflow — the library's [Failure & resilience](/library/failure-and-resilience) note covers timeouts, retries, and partial failure.`,
    exercises: [],
    quiz: [
      {
        id: "ai-agent-loops-q1",
        prompt: "A model is 95% reliable per step. Roughly what fraction of 10-step tasks complete correctly, and what does that imply?",
        options: [
          "About 95% — per-step errors are independent and mostly cancel out",
          "About 60% — errors compound multiplicatively, so the fixes are fewer steps or verification between steps, not a better prompt",
          "About 50% — but only if the steps depend on each other",
          "About 90% — the model self-corrects most single-step errors",
        ],
        answer: 1,
        explanation: "0.95^10 is roughly 0.6. Excellent per-step reliability still yields poor end-to-end reliability over many steps, which is why reducing step count and validating between steps beat prompt tuning.",
      },
      {
        id: "ai-agent-loops-q2",
        prompt: "Which termination guard most directly prevents the classic agent death spiral?",
        options: [
          "A wall-clock timeout on the whole run",
          "A cumulative token budget",
          "A maximum step count",
          "No-progress detection — breaking when the same tool is called with the same arguments twice",
        ],
        answer: 3,
        explanation: "The death spiral is a model repeatedly calling a failing tool with identical arguments and reading the same error. Step and token caps eventually stop it, but only after the full budget is burned on zero information.",
      },
      {
        id: "ai-agent-loops-q3",
        prompt: "What is the practical test for choosing an agentic workflow over a free-roaming agent?",
        options: [
          "Whether the task requires more than three tools",
          "Whether the model supports parallel tool calls",
          "Whether you can enumerate the steps in advance — if you can, write them down and make individual steps model calls",
          "Whether latency matters more than accuracy",
        ],
        answer: 2,
        explanation: "A known sequence should be code: bounded cost, testable steps, real stack traces, and per-step evaluation. Reserve open-ended agent loops for tasks whose shape genuinely isn't known until runtime.",
      },
    ],
  },
  {
    id: "ai-context-management",
    module: "agents",
    title: "Context Management",
    blurb: "the window is a budget, not a bucket — what to keep, what to summarize, what to move out entirely.",
    content: `## Why long runs degrade

An agent's context grows monotonically: every tool result, every intermediate answer, every error. Three separate problems follow, and they arrive in this order:

1. **Cost** — you resend the whole transcript every step, so cost grows quadratically in steps, not linearly. Prompt caching cuts the multiplier sharply on an append-only transcript (see below), but it doesn't change that shape.
2. **Quality** — long windows tend to under-attend the middle, so early instructions get crowded out by tool noise. The observable symptom: an agent that "forgets" its task around step 12.
3. **The wall** — you hit the window limit and the run dies mid-task.

Long-window models push the wall out. They do not fix cost or quality, and a 500k-token context full of raw tool output produces worse answers than a well-curated 20k one. **Curation beats capacity.**

## Four strategies, in order of preference

**1. Don't put it in.** The cheapest token is the one never added. Summarize tool results at the boundary rather than dumping raw payloads: a 40k-token API response becomes the six fields that matter. This is where most of the win is, and it's usually a few lines of code.

**2. Move it out.** Write large artifacts to files or a store and keep a *reference* in context. The agent reads them back on demand. This is why filesystem tools are so effective for coding agents — a file path is 10 tokens and the content is retrieved only when needed.

**3. Compact.** When the transcript crosses a threshold, replace the older portion with a structured summary and keep recent turns verbatim:

\`\`\`
[system prompt]                          always keep, verbatim
[summary of steps 1-18]                  what was tried, what was learned,
                                         what failed, current state
[steps 19-24 verbatim]                   recent detail matters most
[current task reminder]                  re-anchor at the end
\`\`\`

Compaction is lossy, and the art is in what the summary is *required* to preserve: the original goal, decisions made, constraints discovered, and failed approaches. That last one is essential — an agent that loses the memory of a failed approach will try it again.

**4. Re-anchor.** Restate the goal near the end of the window periodically. Cheap, and it directly counteracts middle-of-context drift.

## Sub-agents as context isolation

Delegating a sub-task to a fresh agent gives it a clean window; only its *result* returns to the parent. A research sub-agent might burn 80k tokens reading and return a 500-token finding. The parent's context grows by 500.

This is genuinely the most effective structural fix for context pressure, with one real cost: the parent doesn't see what the sub-agent saw, so the result summary must be self-contained. Vague sub-agent instructions produce vague findings that the parent can't interrogate.

## Prompt caching changes the arithmetic

Cached prefixes are dramatically cheaper and faster than fresh ones. That makes context *stability* a first-class concern: append-only contexts stay cached, and anything that edits the middle of the transcript invalidates everything after it. A compaction step is a full cache invalidation — worth doing, worth not doing every turn.

## When it's the wrong reach

Aggressive summarization on short tasks. If a run uses 8k tokens, compaction adds a model call, latency, and information loss to solve a problem you don't have. Instrument context growth first; optimize when you can see the curve.

> Curating a window is caching with an eviction policy — the library's [Caching](/library/caching) note covers the general trade-offs, and prompt caching follows the same rules.`,
    exercises: [],
    quiz: [
      {
        id: "ai-context-management-q1",
        prompt: "Why does a much larger context window fail to solve the problems of a long agent run?",
        options: [
          "Large windows are only available on slower models",
          "It solves them entirely — a large enough window makes context management unnecessary",
          "It pushes out the hard limit but not cost (the transcript is resent every step) or quality (long windows under-attend the middle)",
          "Large windows increase hallucination rates by design",
        ],
        answer: 2,
        explanation: "Capacity addresses only the wall. Cost still grows quadratically in steps because you resend everything, and answer quality still degrades as the signal-to-noise ratio in the window drops. Curation beats capacity.",
      },
      {
        id: "ai-context-management-q2",
        prompt: "What must a compaction summary preserve above all, and why?",
        options: [
          "The exact wording of every tool result, to avoid information loss",
          "The goal, decisions, constraints, and which approaches already failed — an agent that forgets a failed approach will retry it",
          "Only the most recent three steps, since older context is irrelevant",
          "The token count of the original transcript, for budget accounting",
        ],
        answer: 1,
        explanation: "Compaction is lossy by design, so what it is required to keep is the design. Losing the record of failed attempts is the costliest omission — the agent burns its remaining budget rediscovering dead ends.",
      },
      {
        id: "ai-context-management-q3",
        prompt: "What is the main trade-off when delegating a sub-task to a sub-agent with its own fresh context?",
        options: [
          "Sub-agents cannot use tools, so the sub-task must be pure reasoning",
          "It always costs more tokens overall than doing the work inline",
          "The parent only sees the returned result, not the reasoning behind it, so the sub-agent's output must be self-contained",
          "Sub-agent results cannot be cached, so latency roughly doubles",
        ],
        answer: 2,
        explanation: "Context isolation is exactly what makes sub-agents effective — 80k tokens of reading collapse to a 500-token finding. The price is that the parent can't interrogate what it didn't see, so vague delegation produces findings the parent can't verify or build on.",
      },
    ],
  },
  {
    id: "ai-multi-agent-systems",
    module: "agents",
    title: "Multi-Agent Systems & MCP",
    blurb: "when splitting into several agents genuinely helps, when it just multiplies failure, and the protocol standardizing the tool layer.",
    content: `## The honest default: one agent

Multi-agent architectures are over-applied. Every agent boundary is a lossy interface — the receiving agent gets a summary, not the context — and coordination cost is real. A single agent with a good toolkit beats a committee for most tasks.

There are three cases where splitting genuinely wins:

**1. Parallelizable, independent subtasks.** Research five vendors, review eight files, summarize twelve documents. The subtasks don't need each other, so wall-clock time collapses to the slowest one. This is the strongest case by a distance.

**2. Context isolation.** A sub-agent burns a large window and returns a small result — covered in the context lesson, and often the real motivation even when parallelism is the stated one.

**3. Genuinely distinct expertise.** Different system prompts, different tools, different models: a cheap fast agent for extraction, a frontier model for the judgement call. The separation is what lets you tier the cost.

## Topologies

\`\`\`
SUPERVISOR      one orchestrator delegating to workers, results return
                to it. Clear ownership, easy to debug, one bottleneck.
                The right default.

PIPELINE        A -> B -> C, each stage a specialist.
                Predictable and testable; that's a workflow, and that's fine.

DEBATE/CRITIC   generator + critic, iterating.
                Genuinely improves quality on writing and code review.
                Bound the iterations or they argue forever.

FREE-FOR-ALL    agents messaging each other ad hoc.
                Avoid. Untraceable, unbounded, unfixable.
\`\`\`

The generator/critic pair deserves the extra note: an adversarial reviewer prompted to *find problems* is far more effective than asking one agent to "check your work," because self-review inherits the same blind spots that produced the error.

## Where multi-agent goes wrong

- **Reliability multiplies down.** Five agents at 90% each is 59% end-to-end. Splitting a task does not split the error rate — it compounds it.
- **Cost multiplies up.** Each agent re-reads context and emits tokens. A supervisor plus four workers can be 5-10x a single call.
- **Debuggability collapses.** "Which agent decided that?" is hard to answer without tracing built in from day one, and retrofitting it is miserable.
- **Summarization loss stacks.** Each handoff drops detail. By the third hop the original nuance is gone.

## MCP: standardizing the tool layer

The Model Context Protocol solves an N×M problem. Without it, every agent implementation writes its own integration for every tool; with it, a tool is exposed once as an MCP server and any MCP-speaking client can use it.

\`\`\`
MCP server exposes:   tools      callable functions
                      resources  readable data
                      prompts    reusable templates
\`\`\`

Practically, it means a tool integration is a reusable component rather than code welded into one agent. Two things to keep in view: a connected MCP server's tools enter your model's context and count against the tool-confusion budget, so connecting a dozen servers "just in case" degrades tool selection. And an MCP server you didn't write is code you're trusting with whatever you give it — tool descriptions arrive from the server and land in your prompt, which makes an untrusted server an injection vector.

## When it's the wrong reach

Multi-agent as an organizational metaphor — "a PM agent, an engineer agent, a QA agent" — because it maps to how humans organize. Human team structure exists to route around human bandwidth limits that don't apply here. Split on *parallelism*, *context*, or *tooling*, never on job titles.

> Fan-out with a coordinator, partial failure, and result aggregation are classic distributed problems — the library's [Consensus & coordination](/library/consensus-and-coordination) note covers the general shape.`,
    exercises: [],
    quiz: [
      {
        id: "ai-multi-agent-systems-q1",
        prompt: "Which is the strongest justification for splitting work across multiple agents?",
        options: [
          "Mirroring a human team structure — a planner, an implementer, and a reviewer",
          "Independent subtasks that can run in parallel, collapsing wall-clock time to the slowest one",
          "Reducing the total token cost of the task",
          "Improving end-to-end reliability by dividing responsibility",
        ],
        answer: 1,
        explanation: "Parallelism is the clearest win, along with context isolation and genuinely distinct tooling. Splitting doesn't reduce cost (it multiplies it) or improve reliability (agent success rates compound down), and job-title metaphors solve a human bandwidth problem that doesn't apply.",
      },
      {
        id: "ai-multi-agent-systems-q2",
        prompt: "Why does a separate critic agent outperform instructing a single agent to \"check your work\"?",
        options: [
          "Critic agents are typically run on more capable models",
          "Self-review is disallowed by most model providers",
          "A separate agent prompted adversarially to find problems doesn't inherit the blind spots that produced the original error",
          "It halves the token cost by splitting the work",
        ],
        answer: 2,
        explanation: "Self-review runs in the same context that produced the mistake, so the same assumptions go unquestioned. A fresh context with an explicitly adversarial goal surfaces problems the author cannot see — bound the iterations, though.",
      },
      {
        id: "ai-multi-agent-systems-q3",
        prompt: "What is the risk of connecting many MCP servers to an agent \"just in case\"?",
        options: [
          "Their tools all enter the model's context, degrading tool selection — and a server you don't control supplies descriptions that land in your prompt, making it an injection vector",
          "MCP servers cannot be disconnected once connected",
          "Each server requires its own model instance, multiplying cost",
          "MCP servers bypass your executor, calling tools directly",
        ],
        answer: 0,
        explanation: "Tool accuracy degrades as the tool count grows, and MCP servers add to that count. Separately, tool names and descriptions come from the server and are inserted into your prompt, so an untrusted server can inject instructions.",
      },
    ],
  },
];
