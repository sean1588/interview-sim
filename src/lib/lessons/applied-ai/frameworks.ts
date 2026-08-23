import type { Lesson } from "../types";

export const frameworksLessons: Lesson[] = [
  {
    id: "ai-framework-decision",
    module: "frameworks",
    title: "Do You Need a Framework?",
    blurb: "what LangChain actually is after v1, how the packages fit together, and the honest build-vs-adopt call.",
    content: `## The reputation is out of date

LangChain's reputation was formed in 2023, when it was a large surface of chain abstractions wrapped around a young API. Most criticism you'll read online is aimed at that version. **v1 is a different library**, and the reorganization is the thing to understand first:

\`\`\`
langchain            the agent essentials: create_agent, messages,
                     tools, init_chat_model, middleware
langchain-core       the base abstractions everything builds on
                     (messages, tools, runnables/LCEL primitives)
langgraph            the runtime — the graph engine, state,
                     persistence, streaming, human-in-the-loop
langchain-classic    the old world: legacy chains, retrievers,
                     the hub, community exports
langchain-<provider> one integration package per model provider
LangSmith            hosted tracing + evals (separate product)
\`\`\`

The headline: the old \`Chain\` machinery moved out to \`langchain-classic\`, and **LangGraph became the runtime underneath everything**. \`create_agent\` builds a LangGraph graph whether you asked for one or not — which means persistence, streaming, time travel, and interrupts are available to you without writing a graph yourself.

Practically, this matters when you read a tutorial: pre-1.0 material uses \`LLMChain\`, \`AgentExecutor\`, or \`langgraph.prebuilt.create_react_agent\`. The first two still work through the compatibility package; \`create_react_agent\` is still in \`langgraph.prebuilt\` but deprecated in favour of \`create_agent\`. None of them are what you should be writing today.

## What you actually get

- **Provider abstraction** — one interface across model providers, and \`content_blocks\` gives you a uniform view of reasoning traces, citations, and provider-native tools instead of per-provider response shapes.
- **A tested agent loop** — the model/tool/observe cycle with the termination handling, message bookkeeping, and error paths already worked out.
- **Streaming, persistence, human-in-the-loop** — inherited from the LangGraph runtime.
- **Ecosystem integrations** — vector stores, loaders, retrievers, and hundreds of tools already wrapped.
- **Tracing** — LangSmith instrumentation you don't have to build.

## What it costs

- **A layer between you and the API.** When a provider ships a feature on Tuesday, you wait for the integration. When something misbehaves, you debug two things.
- **Abstraction leakage.** The moment you need something the abstraction didn't anticipate, you're reading framework source.
- **Concept load.** Runnables, state schemas, reducers, checkpointers, middleware — real concepts a new team member must learn on top of the actual problem.
- **Version churn.** This ecosystem moves fast. Pin versions and expect migrations.

## The honest decision

\`\`\`
WRITE IT YOURSELF          one model provider, a known sequence of
                           steps, a handful of tools. The loop is
                           twenty lines. You will understand every one.

USE THE FRAMEWORK          multiple providers, long-running or
                           resumable work, human approval steps,
                           many integrations, or a team that benefits
                           from a shared vocabulary.
\`\`\`

A useful middle path that many teams land on: **write the loop yourself first**, then adopt LangGraph specifically when you need durable execution and human-in-the-loop — because those are genuinely hard to build well and are the strongest part of the offering.

The worst outcome is adopting a framework to avoid understanding the underlying mechanics. The abstractions are thin over concepts you need anyway; if the agent loop is a mystery to you, the framework makes it a mystery with more vocabulary.

## When it's the wrong reach

A single prompt-and-response call. Importing an agent framework to make one completion request adds a dependency tree, a version pin, and an abstraction, in exchange for nothing — the provider SDK is one function call. Frameworks earn their keep at the point where you have *state* to manage.

> The library's [Observability](/library/observability) note covers traces and spans generally — LangSmith is that idea applied to a chain of model calls, and it's the part of the ecosystem worth adopting earliest.`,
    exercises: [],
    quiz: [
      {
        id: "ai-framework-decision-q1",
        prompt: "In LangChain v1, where did the legacy chain machinery (LLMChain, AgentExecutor, the old retrievers) end up?",
        options: [
          "It was deleted outright, so pre-1.0 code cannot run on v1",
          "It moved to a separate `langchain-classic` package, keeping the core packages focused on agent essentials",
          "It stayed in `langchain` but was renamed with a `Legacy` prefix",
          "It moved into `langgraph`, since chains are now graphs",
        ],
        answer: 1,
        explanation: "v1 slimmed `langchain` down to agents, messages, tools, and model init. Legacy chains, retrievers, the hub, and community exports moved to `langchain-classic` for backwards compatibility — they still work, but they aren't what you should write today.",
      },
      {
        id: "ai-framework-decision-q2",
        prompt: "What does it mean that LangGraph is \"the runtime\" underneath `create_agent`?",
        options: [
          "LangGraph runs the agent in a separate process for isolation",
          "You must define a StateGraph before you can call `create_agent`",
          "`create_agent` builds a LangGraph graph for you, so persistence, streaming, interrupts and time travel are available without writing a graph yourself",
          "LangGraph handles only the tool-execution step; the model loop is separate",
        ],
        answer: 2,
        explanation: "The prebuilt agent compiles down to a graph. That's why capabilities people associate with LangGraph — checkpointers, human-in-the-loop, state inspection — are reachable from a plain `create_agent` call, and why dropping to the graph API later is a continuation rather than a rewrite.",
      },
      {
        id: "ai-framework-decision-q3",
        prompt: "Which situation most justifies adopting the framework rather than writing the loop yourself?",
        options: [
          "You need to make a single completion request from one provider",
          "You want to avoid having to understand how the agent loop works",
          "You have a fixed three-step sequence with two tools",
          "You need long-running work that can pause for human approval and resume after a crash",
        ],
        answer: 3,
        explanation: "Durable execution and human-in-the-loop are genuinely hard to build well, and they're the strongest part of what LangGraph offers. A fixed sequence or a single call doesn't need it, and adopting a framework to avoid learning the mechanics just adds vocabulary to a mystery.",
      },
    ],
  },
  {
    id: "ai-langchain-agents",
    module: "frameworks",
    title: "LangChain: Models, Tools & create_agent",
    blurb: "the four imports that cover most of the library, and what the prebuilt agent does for you.",
    content: `## Most of LangChain v1 is four imports

\`\`\`python
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain.messages import HumanMessage, AIMessage, SystemMessage
from langchain.tools import tool
\`\`\`

That's the working surface for a large share of real applications. The library got much smaller in v1, and this is the part that replaced it.

## Models: one interface, many providers

\`\`\`python
model = init_chat_model("anthropic:claude-sonnet-4-6", temperature=0)
model = init_chat_model("openai:gpt-5")          # same interface
\`\`\`

The provider-prefixed string is the important detail — swapping providers is a string change plus an installed integration package, not a rewrite. That portability is the single clearest reason to take the dependency.

Its companion feature is **standard content blocks**. Providers return reasoning traces, citations, and built-in tool results in different shapes; \`response.content_blocks\` gives you one typed view across all of them. If you've ever written per-provider parsing for reasoning output, this is the thing that deletes it.

## Tools: a decorator over a normal function

\`\`\`python
@tool
def search_orders(email: str, status: str | None = None) -> str:
    """Find a customer's orders by email. Returns at most 20, newest
    first. Does NOT return refunds — use search_refunds for those."""
    ...
\`\`\`

The decorator derives the tool schema from the signature, the type hints, and the docstring. Two consequences follow directly:

- **The docstring is the tool description the model sees.** It's not documentation for your teammates that happens to be nearby — it's the prompt. Everything from the tool-calling lesson applies: say what it returns, when to reach for it, and what it is *not* for.
- **Type hints are the parameter schema.** \`Literal["pending", "shipped"]\` becomes an enum the model must satisfy; \`str\` lets it invent anything.

## The agent

\`\`\`python
agent = create_agent(
    model="anthropic:claude-sonnet-4-6",
    tools=[search_orders, issue_refund],
    system_prompt="You are a support agent. Never promise delivery dates.",
    response_format=SupportReply,      # a Pydantic model
    checkpointer=checkpointer,         # persistence, see the next lessons
)

result = agent.invoke({"messages": [HumanMessage("Where is order A-99321?")]})
\`\`\`

\`create_agent\` is the v1 replacement for the older \`create_react_agent\` from \`langgraph.prebuilt\`, and for \`AgentExecutor\` before that. It implements exactly the loop from the agents module: call the model, run any tools it asked for, feed results back, stop when it stops asking.

\`response_format\` is worth calling out — v1 picks the strategy for you, using provider-native structured output where it exists and falling back to a tool-calling strategy where it doesn't, so the final answer arrives as a validated object rather than a string you parse and hope about.

## What it does NOT do for you

This is the part that decides whether your agent survives production, and none of it is automatic:

- **Authorization.** The tool function runs when the model asks. Permission checks go *inside* the function or in middleware — the framework will not do it for you.
- **Cost and step ceilings.** Configure recursion limits and enforce token budgets yourself.
- **Tool-count discipline.** Handing \`create_agent\` thirty tools is as bad an idea here as anywhere else.
- **Retry semantics on side effects.** A tool that charges a card needs idempotency you supply.

The framework gives you the loop. The guardrails are still yours.

## When it's the wrong reach

Using \`create_agent\` for a fixed pipeline. If the sequence is known — extract, then classify, then draft — you don't want a model deciding the order on every request. Call the model directly for each step, or build an explicit graph. The prebuilt agent is for when the *path* is genuinely unknown until runtime.

> Tool schemas are an API contract with an unusually literal-minded client, and \`content_blocks\` is a normalization layer over inconsistent provider responses — the library's [APIs & protocols](/library/apis-and-protocols) note covers both problems in their general form.`,
    exercises: [],
    quiz: [
      {
        id: "ai-langchain-agents-q1",
        prompt: "Under the `@tool` decorator, what role does the function's docstring play?",
        options: [
          "It becomes the tool description the model reads when deciding which tool to call — it is prompt text, not internal documentation",
          "It is used only for generated API documentation and never sent to the model",
          "It sets the tool's display name in tracing tools like LangSmith",
          "It is optional metadata; the schema comes entirely from the type hints",
        ],
        answer: 0,
        explanation: "The decorator derives the tool schema from the signature and type hints, and the description from the docstring. That text is what the model uses to choose between similar tools, so it should state what the tool returns, when to use it, and what it is not for.",
      },
      {
        id: "ai-langchain-agents-q2",
        prompt: "Which of these does `create_agent` NOT handle for you?",
        options: [
          "Running the tools the model requests and feeding results back",
          "Terminating the loop when the model stops requesting tools",
          "Authorizing whether this user may perform the action a tool takes",
          "Passing the accumulated message history to the model each turn",
        ],
        answer: 2,
        explanation: "The framework implements the loop; it does not know your permission model. A tool function runs whenever the model asks for it, so authorization belongs inside the tool or in middleware — exactly the same enforcement point as in a hand-written loop.",
      },
      {
        id: "ai-langchain-agents-q3",
        prompt: "What problem do standard content blocks (`response.content_blocks`) solve?",
        options: [
          "They compress long message histories to reduce token cost",
          "They enforce a JSON schema on the model's final answer",
          "They cache repeated prompt prefixes across providers",
          "They give one typed view of reasoning traces, citations and built-in tool results, which each provider otherwise returns in its own shape",
        ],
        answer: 3,
        explanation: "Provider responses diverge most in the non-text parts. Content blocks normalize them, so per-provider parsing code disappears — which is what makes swapping the model string a genuinely cheap change. Schema enforcement is `response_format`, a separate feature.",
      },
    ],
  },
  {
    id: "ai-langchain-middleware",
    module: "frameworks",
    title: "Middleware",
    blurb: "the v1 abstraction that makes the prebuilt agent worth using — hooks around every step of the loop.",
    content: `## The problem it solves

The prebuilt agent loop is fine until you need to change something *inside* it: trim the context before each model call, block a tool for this user, redact PII on the way out, retry with a different model on failure. Pre-v1, that meant abandoning the prebuilt agent and hand-rolling a graph.

Middleware is the seam. You keep \`create_agent\` and inject behaviour at named points in the loop:

\`\`\`
before_agent        once, before the run starts
  |
  +-> before_model      every iteration, before the model call
  |     wrap_model_call   around the call itself (retries, fallbacks,
  |                       model selection, prompt rewriting)
  +-> after_model       every iteration, after the response
  |     wrap_tool_call    around each tool execution
  |
after_agent         once, when the run finishes
\`\`\`

The \`before_*\`/\`after_*\` hooks observe and modify state. The \`wrap_*\` hooks sit *around* a call, so they can retry it, substitute it, or skip it entirely — that's where fallback and short-circuit logic lives.

## The built-ins cover the common needs

\`\`\`python
from langchain.agents import create_agent
from langchain.agents.middleware import (
    SummarizationMiddleware,
    HumanInTheLoopMiddleware,
)

agent = create_agent(
    model="anthropic:claude-sonnet-4-6",
    tools=[read_email, send_email],
    middleware=[
        SummarizationMiddleware(
            model="anthropic:claude-haiku-4-5",
            trigger=("tokens", 8000),
            keep=("messages", 20),
        ),
        HumanInTheLoopMiddleware(interrupt_on={"send_email": True}),
    ],
)
\`\`\`

Read what those two lines actually bought. \`SummarizationMiddleware\` is the compaction strategy from the context-management lesson, implemented and tested. \`HumanInTheLoopMiddleware\` pauses the run before \`send_email\` executes and waits for approval — the confirmation gate for irreversible actions, as configuration rather than control flow. There are also built-ins for PII redaction, tool retries, model fallbacks, and call limits.

That's the strongest argument for the framework in v1: these are the patterns you'd otherwise build, and they're one constructor argument each.

## Writing your own

A custom middleware is a class implementing the hooks you care about. The two that carry most real work:

- **\`before_model\`** — inspect and rewrite state on the way in. Context trimming, dynamic system prompts, injecting retrieved documents.
- **\`wrap_model_call\`** — you receive the call and decide what to do with it. Try a cheap model, inspect the result, escalate to a stronger one on low confidence: **the cascade from the model-selection lesson is a single middleware.**

Order matters. Middleware composes as a stack, so a summarizer that runs before a guardrail sees different content than one that runs after. Write them so each does one thing, and be deliberate about sequence.

## Where it earns its keep

- **Cross-cutting policy.** Logging, cost accounting, PII redaction, per-tenant tool filtering — applied uniformly rather than remembered at each call site.
- **Dynamic tool exposure.** Filter the tool list per user or per conversation state, which directly addresses tool-count degradation.
- **Graceful degradation.** Provider fallback in \`wrap_model_call\` rather than scattered through business logic.

## When it's the wrong reach

Middleware as a place to put business logic. It's an interception layer, and logic hidden there is genuinely hard to find later — a teammate reading the agent definition sees a constructor argument, not the ten rules inside it. Keep it to cross-cutting concerns. If it's specific to one step, that step should be an explicit node in a graph where it's visible.

And note what middleware doesn't change: a \`wrap_tool_call\` that checks permissions is real enforcement, but it's still your code doing it. The framework gives you the hook, not the policy.

> Middleware is a filter chain around a call — the library's [APIs & protocols](/library/apis-and-protocols) note covers the general pattern of interceptors and the coupling they introduce.`,
    exercises: [],
    quiz: [
      {
        id: "ai-langchain-middleware-q1",
        prompt: "What can a `wrap_model_call` hook do that a `before_model` hook cannot?",
        options: [
          "Read the current message state",
          "Modify the system prompt for this iteration",
          "Retry, substitute, or skip the model call entirely — it sits around the call rather than before it",
          "Access the tool results from the previous iteration",
        ],
        answer: 2,
        explanation: "`before_model` observes and modifies state on the way in. `wrap_model_call` receives the call itself, so it controls whether and how it happens — which is what makes retries, provider fallback, and cheap-then-escalate cascades expressible as one middleware.",
      },
      {
        id: "ai-langchain-middleware-q2",
        prompt: "Why is `HumanInTheLoopMiddleware(interrupt_on={\"send_email\": True})` a notable convenience?",
        options: [
          "It prevents prompt injection from reaching the model",
          "It turns the confirmation gate for irreversible actions into configuration rather than hand-written control flow around the agent loop",
          "It removes the need for a checkpointer by holding state in memory",
          "It guarantees the model will never attempt to send an email unprompted",
        ],
        answer: 1,
        explanation: "Pausing before an irreversible action is the standard safety pattern, and previously it meant abandoning the prebuilt agent for a hand-rolled graph. Note what it doesn't do: it gates execution, it doesn't stop the model from *requesting* the action.",
      },
      {
        id: "ai-langchain-middleware-q3",
        prompt: "What is the main argument against putting business rules in middleware?",
        options: [
          "Middleware runs outside the graph, so it cannot access state",
          "Middleware hooks are called only once per run, not per iteration",
          "It measurably increases latency on every model call",
          "It hides logic — a reader of the agent definition sees a constructor argument, not the rules inside it, so step-specific logic belongs in a visible node",
        ],
        answer: 3,
        explanation: "Middleware is an interception layer and suits cross-cutting concerns: logging, redaction, cost accounting, tool filtering. Business logic buried there is hard to find and hard to test in isolation; if it belongs to one step, make that step explicit.",
      },
    ],
  },
  {
    id: "ai-langgraph-state-machines",
    module: "frameworks",
    title: "LangGraph: State, Nodes & Edges",
    blurb: "modelling an agent as a state machine — and why a graph beats a chain once control flow gets real.",
    content: `## Why a graph and not a chain

A chain is a pipeline: A then B then C. That shape can't express the things real agent systems need — looping until a condition holds, branching on a classification, running three branches in parallel and merging, or pausing mid-run and resuming next Tuesday.

LangGraph models the application as a **state machine**: a shared state object, nodes that update it, and edges that decide what runs next. It's the same idea as the agentic workflow from the agent-loop lesson, given a runtime.

## The three pieces

\`\`\`python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]   # accumulates
    intent: str                               # last write wins
    escalated: bool

builder = StateGraph(State)

def classify(state: State):
    return {"intent": call_classifier(state["messages"][-1])}

builder.add_node("classify", classify)
builder.add_node("answer", answer_node)
builder.add_node("escalate", escalate_node)

builder.add_edge(START, "classify")
builder.add_conditional_edges("classify", lambda s:
    "escalate" if s["intent"] == "complaint" else "answer")
builder.add_edge("answer", END)
builder.add_edge("escalate", END)

graph = builder.compile()
\`\`\`

**State** is a typed dict. A node returns a *partial* update — only the keys it touched — and the runtime merges it in.

**Reducers** decide how that merge happens, and they're the concept people miss. The default is replace: return \`{"intent": "x"}\` and the old value is gone. \`Annotated[list, add_messages]\` says *append instead*, with message deduplication handled. If a node returns \`{"messages": [...]}\` and the history vanishes, you forgot the reducer. It matters even more with parallel branches, where two nodes write the same key and the reducer is the only thing deciding what happens.

**Edges** are the control flow. \`add_edge\` is unconditional; \`add_conditional_edges\` takes a function of state returning the next node name — that's your loop-back, your branch, your termination check.

## Command and Send

Two types worth knowing because they unlock the patterns:

\`\`\`python
return Command(update={"escalated": True}, goto="escalate")   # update + route
return [Send("summarize", {"doc": d}) for d in docs]          # fan out
\`\`\`

\`Command\` combines a state update with a routing decision in one return — often clearer than pairing a node with a separate conditional edge function.

\`Send\` dispatches N parallel instances of a node, each with its own state. That's map-reduce: the parallel-subtask case from the multi-agent lesson, without hand-rolled concurrency.

## What compiling buys you

\`compile()\` validates the graph structure — unreachable nodes, edges to names that don't exist — and returns something invokable that also streams, checkpoints, and supports interrupts. Configuration like \`checkpointer\` is supplied here, which is the subject of the next lesson.

## The real cost

You are now writing a state machine, and state machines are more work than straight-line code. There's genuine ceremony: a schema, reducers, node functions, edge wiring. For a three-step sequence that's pure overhead — the value only appears when control flow is a real design problem.

The failure mode to watch for is state sprawl: fifteen keys, half of them written by two nodes each, and no one can say what's set when. Keep state small, name keys for what they mean, and prefer explicit routing over flags that three different nodes read.

## When it's the wrong reach

A linear pipeline. If it's extract → classify → draft with no branching, three function calls are clearer than a graph, and you can always promote it when a branch appears. Reach for the graph when you have loops, conditionals, parallelism, or a need to pause.

> A graph with fan-out, merges and partial failure raises the same questions as any distributed workflow — the library's [Consensus & coordination](/library/consensus-and-coordination) note covers coordinating work across steps that can each fail independently.`,
    exercises: [],
    quiz: [
      {
        id: "ai-langgraph-state-machines-q1",
        prompt: "A node returns `{\"messages\": [new_message]}` and the entire prior history disappears from state. What's the cause?",
        options: [
          "The node returned a partial update instead of the full state object",
          "`messages` has no reducer, so the default replace semantics overwrote the list — `Annotated[list, add_messages]` is what makes it append",
          "The graph was compiled without a checkpointer, so history isn't retained",
          "Message history is only preserved when the node returns a `Command`",
        ],
        answer: 1,
        explanation: "Nodes returning partial updates is normal and expected. What decides the merge is the reducer: the default replaces the value, and `add_messages` appends with deduplication. Missing reducers are the most common source of vanished state.",
      },
      {
        id: "ai-langgraph-state-machines-q2",
        prompt: "You need to summarize 40 documents in parallel and collect the results. Which LangGraph primitive fits?",
        options: [
          "`add_conditional_edges`, returning a list of 40 branch names",
          "`Command(goto=...)` called 40 times from a loop inside one node",
          "`Send`, which dispatches N parallel instances of a node each with its own state",
          "Compiling 40 separate graphs and invoking them concurrently",
        ],
        answer: 2,
        explanation: "`Send` is the map half of map-reduce: it fans out to many instances of a node with independent state, and the reducer on the collecting key handles the merge. It's the parallel-subtask pattern without hand-rolled concurrency.",
      },
      {
        id: "ai-langgraph-state-machines-q3",
        prompt: "When is a StateGraph genuinely worth its ceremony over three plain function calls?",
        options: [
          "Whenever more than one model call is involved",
          "When you need type-checked inputs and outputs between steps",
          "Whenever you want tracing and observability on the pipeline",
          "When control flow is a real design problem — loops, branching, parallel fan-out, or the need to pause and resume",
        ],
        answer: 3,
        explanation: "The graph API buys expressive control flow plus the runtime features built on it. For a linear sequence it's pure overhead — write the functions and promote to a graph when a branch or a pause actually appears.",
      },
    ],
  },
  {
    id: "ai-langgraph-persistence",
    module: "frameworks",
    title: "Checkpointers, Threads & Interrupts",
    blurb: "durable execution and human-in-the-loop — the strongest reason to reach for LangGraph, and the replay gotcha that bites everyone.",
    content: `## Checkpointing is the feature

Attach a checkpointer and the runtime saves a snapshot of state after every step:

\`\`\`python
from langgraph.checkpoint.postgres import PostgresSaver

graph = builder.compile(checkpointer=checkpointer)
graph.invoke({"messages": [...]}, {"configurable": {"thread_id": "user-42"}})
\`\`\`

\`InMemorySaver\` for tests, \`SqliteSaver\` for local development, \`PostgresSaver\` for production — same interface. Four capabilities fall out of it, and together they're the best argument for the framework:

- **Conversation memory.** A \`thread_id\` is a conversation. Invoke with the same one and prior state is loaded — no manual transcript management.
- **Crash recovery.** The process dies at step 7 of 12; restart and resume from the last checkpoint instead of re-running from the top and re-charging every card along the way.
- **Inspection.** \`get_state\` returns the current snapshot, \`get_state_history\` the full sequence. You can see exactly what the agent believed at each step.
- **Time travel.** Rewind to an earlier checkpoint, \`update_state\` to change something, and re-run from there. For debugging a non-deterministic system, this is a genuinely powerful tool — it's the closest thing to a replay debugger that AI systems have.

**Threads are short-term memory.** For facts that outlive one conversation — user preferences, learned context — there's a separate **store**, keyed independently of threads. Don't try to make one \`thread_id\` serve as a user's permanent memory.

## Interrupts: pausing for a human

\`\`\`python
from langgraph.types import interrupt, Command

def approve_refund(state: State):
    decision = interrupt({"amount": state["amount"], "order": state["order_id"]})
    if decision != "approve":
        return {"status": "declined"}
    return {"status": "approved"}

# ... later, possibly days later, from an entirely different process:
graph.invoke(Command(resume="approve"), {"configurable": {"thread_id": "user-42"}})
\`\`\`

\`interrupt()\` suspends the graph, persists state, and returns control to the caller. Resuming with \`Command(resume=value)\` makes that value the return of \`interrupt()\`. A checkpointer is **required** — the pause is durable precisely because state is written down, which is what lets approval arrive from a different process days later.

This is the confirmation gate for irreversible actions, implemented properly.

## The gotcha that bites everyone

**On resume, the node re-runs from the beginning.** Not from the line after \`interrupt()\` — the whole function, from the top.

\`\`\`python
def approve_refund(state: State):
    charge_the_card(state)          # <-- RUNS TWICE
    decision = interrupt({...})
    ...
\`\`\`

Everything before the \`interrupt()\` executes again. Three rules follow, and they're all documented consequences of that one fact:

- **No side effects before an \`interrupt()\`** in the same node. Put them in a separate downstream node, or make them idempotent.
- **Never wrap \`interrupt()\` in try/except.** It works by raising a special exception; catch it and you've swallowed the pause.
- **Keep interrupt calls in a consistent order.** Resume values are matched by index, so conditional interrupts — and loops that call \`interrupt()\` repeatedly — misalign.

The mental model that keeps you out of trouble: **a node containing an \`interrupt()\` should be small, pure, and do nothing but ask.**

## When it's the wrong reach

A checkpointer on a stateless single-turn endpoint. You're paying a database write per step to persist a conversation that ends in one turn. And in-memory checkpointing in production: \`InMemorySaver\` gives you the API without the durability, which is worse than no checkpointer at all, because the code reads as if it's safe.

> Resuming a partially completed run without repeating its side effects is the durable-execution problem in general form — the library's [Failure & resilience](/library/failure-and-resilience) note covers idempotency, retries, and partial failure.`,
    exercises: [],
    quiz: [
      {
        id: "ai-langgraph-persistence-q1",
        prompt: "Why must a node that calls `interrupt()` avoid performing side effects beforehand?",
        options: [
          "Side effects are forbidden inside graph nodes generally",
          "On resume the node re-runs from the beginning, so anything before the interrupt executes a second time",
          "The checkpointer cannot serialize state after an external call has been made",
          "Side effects before an interrupt cause the resume value to be discarded",
        ],
        answer: 1,
        explanation: "Resumption restarts the whole node function, not the line after the interrupt. A charge, an email, or an insert placed before the pause happens twice — so keep those in a separate downstream node or make them idempotent.",
      },
      {
        id: "ai-langgraph-persistence-q2",
        prompt: "What is `thread_id` for, and what is it NOT for?",
        options: [
          "It identifies a conversation for checkpointed state; it is not a place to keep facts that should outlive the conversation — that's what the store is for",
          "It identifies a user account, and doubles as their long-term memory key",
          "It names a compiled graph so multiple graphs can share a checkpointer",
          "It is an idempotency key that prevents a run from executing twice",
        ],
        answer: 0,
        explanation: "Checkpointers are thread-scoped short-term memory: same `thread_id`, same conversation state. Cross-thread facts like user preferences belong in the store, which is keyed independently.",
      },
      {
        id: "ai-langgraph-persistence-q3",
        prompt: "Why is shipping `InMemorySaver` to production worse than using no checkpointer at all?",
        options: [
          "It leaks memory in long-running processes",
          "It silently disables interrupts, so approval gates never fire",
          "It gives you the persistence API without the durability, so the code reads as crash-safe while state dies with the process",
          "It cannot support more than one concurrent thread_id",
        ],
        answer: 2,
        explanation: "The danger is the false guarantee. Interrupts, resumption and recovery all appear to be wired up, and a reviewer sees a checkpointer configured — but a restart loses every in-flight run. Use Sqlite locally and Postgres in production.",
      },
    ],
  },
];
