import type { Lesson } from "../types";
import { forReact, reactCode, reactVariants } from "./shared";

export const hooksEscapeHatchesLessons: Lesson[] = [
  {
    id: "react-rules-of-hooks",
    module: "hooks-escape-hatches",
    title: "Hook Call Order Is the Protocol",
    blurb:
      "Why Hooks stay at the top level, how call order identifies state, and where React's `use` API differs.",
    content: forReact(
      (language) => `## A Hook call occupies a slot

Hooks are not ordinary utility calls. During a component render, React associates each Hook with the **position of that call**: first state slot, second state slot, first effect, and so on. The source does not provide keys for those calls, so stable order is the protocol that lets React reconnect a render to the right state, reducer, ref, or effect.

If one render calls \`useState\`, then \`useEffect\`, while the next skips the first call, every later slot shifts. React cannot infer which logical call disappeared. This is why the restriction is structural rather than stylistic.

Call Hooks only:

- at the top level of a function component; or
- at the top level of a custom Hook.

Do not call them inside conditions, loops, event handlers, nested functions, \`try\`/\`catch\`, or after an early return. "Top level" means React encounters the same Hook calls in the same order whenever that component renders. Put the **condition inside** the Hook or split the conditional branch into a component.

${reactCode(
  language,
  `import { useEffect, useMemo, useState } from "react";

function Results({ query, enabled }) {
  const [page, setPage] = useState(1);
  const normalized = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!enabled || normalized === "") return;
    document.title = \`Results for \${normalized}\`;
  }, [enabled, normalized]);

  if (!enabled) return null;

  return (
    <button onClick={() => setPage((current) => current + 1)}>
      Page {page}
    </button>
  );
}`,
  `import { useEffect, useMemo, useState } from "react";

interface ResultsProps {
  query: string;
  enabled: boolean;
}

function Results({ query, enabled }: ResultsProps) {
  const [page, setPage] = useState(1);
  const normalized = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!enabled || normalized === "") return;
    document.title = \`Results for \${normalized}\`;
  }, [enabled, normalized]);

  if (!enabled) return null;

  return (
    <button onClick={() => setPage((current) => current + 1)}>
      Page {page}
    </button>
  );
}`
)}

The early return is safe because it comes **after** every Hook. The effect always owns the same slot; its body decides whether synchronization is needed.

## Components and custom Hooks are React call sites

React must control when a Hook-bearing function runs. A component is invoked by React through an element, and a custom Hook is called while React is rendering another component or Hook. Calling a component as \`Panel()\`, or calling a Hook from a click handler, bypasses that contract.

${reactCode(
  language,
  `function Account({ compact }) {
  if (compact) {
    return <CompactAccount />;
  }
  return <FullAccount />;
}

function SaveButton() {
  const save = useSaveAccount();

  function handleClick() {
    save(); // call the returned operation, not useSaveAccount()
  }

  return <button onClick={handleClick}>Save</button>;
}`,
  `interface AccountProps {
  compact: boolean;
}

function Account({ compact }: AccountProps) {
  if (compact) {
    return <CompactAccount />;
  }
  return <FullAccount />;
}

function SaveButton() {
  const save = useSaveAccount();

  function handleClick(): void {
    save(); // call the returned operation, not useSaveAccount()
  }

  return <button onClick={handleClick}>Save</button>;
}`
)}

The \`eslint-plugin-react-hooks\` rules catch most violations and should be treated as correctness checks. Refactoring around the warning is safer than suppressing it.

## The precise \`use\` exception

React's \`use(resource)\` API is intentionally different from Hooks such as \`useState\` and \`useEffect\`: it may be called in a condition or loop. That enables reading a context or suspending on a resource only along a branch that needs it.

The exception is narrow. \`use\` still must run while React is rendering a component or custom Hook. It cannot be wrapped in \`try\`/\`catch\`; rejection is handled through an Error Boundary, while pending resources integrate with Suspense. The exception does not make conditional \`useState\`, \`useEffect\`, or custom Hook calls valid.

The practical model is simple: ordinary Hooks consume stable call-order slots. Keep those calls unconditional and top-level; move variability into Hook arguments, Hook bodies, or component boundaries.`,
    ),
    exercises: [
      {
        id: "react-hook-order-trace",
        title: "Detect a shifted Hook slot",
        instructions: `Implement \`firstHookOrderChange(previous, next)\`. Return the first index whose Hook label differs; return \`-1\` when the traces are identical. A missing call also counts as a difference.

This pure trace models the positional protocol React relies on without importing React into the worker.

Expected output: \`1\`, \`-1\`, \`2\`.`,
        starterCode: reactVariants(
          `function firstHookOrderChange(previous, next) {
  // TODO: compare every occupied position in the longer trace.
  // Return the first changed or missing slot, otherwise -1.
  return -1;
}

console.log(
  firstHookOrderChange(
    ["useState", "useEffect", "useRef"],
    ["useState", "useRef"]
  )
);
console.log(
  firstHookOrderChange(
    ["useState", "useEffect"],
    ["useState", "useEffect"]
  )
);
console.log(
  firstHookOrderChange(
    ["useState", "useMemo", "useEffect"],
    ["useState", "useMemo", "useRef"]
  )
);`,
          `function firstHookOrderChange(
  previous: string[],
  next: string[]
): number {
  // TODO: compare every occupied position in the longer trace.
  // Return the first changed or missing slot, otherwise -1.
  return -1;
}

console.log(
  firstHookOrderChange(
    ["useState", "useEffect", "useRef"],
    ["useState", "useRef"]
  )
);
console.log(
  firstHookOrderChange(
    ["useState", "useEffect"],
    ["useState", "useEffect"]
  )
);
console.log(
  firstHookOrderChange(
    ["useState", "useMemo", "useEffect"],
    ["useState", "useMemo", "useRef"]
  )
);`,
        ),
      },
    ],
    quiz: [
      {
        id: "react-rules-of-hooks-q1",
        prompt:
          "Why must ordinary Hooks be called in a stable order across renders?",
        options: [
          "React associates Hook state with call positions, so skipping a call shifts the later slots",
          "JavaScript cannot call functions from conditions",
          "Hooks are evaluated only once when a module loads",
          "Stable order lets the browser inline every Hook",
        ],
        answer: 0,
        explanation:
          "The call position is effectively the slot identifier. React needs the same sequence to reconnect each call with its prior state or effect.",
      },
      {
        id: "react-rules-of-hooks-q2",
        prompt:
          "A component needs an effect only while `enabled` is true. Which structure follows the Rules of Hooks?",
        options: [
          "Call `useEffect` inside an `if (enabled)` block",
          "Always call `useEffect`, then check `enabled` inside its callback",
          "Call `useEffect` from the event that enables the feature",
          "Call the component as a function only when enabled",
        ],
        answer: 1,
        explanation:
          "The Hook keeps its slot on every render. Its callback can decide that there is nothing to synchronize.",
      },
      {
        id: "react-rules-of-hooks-q3",
        prompt: "What is special about React's `use(resource)` API?",
        options: [
          "It may be called anywhere, including event handlers and module scope",
          "It makes every other Hook legal inside conditions",
          "It may be called conditionally or in a loop, but still only while rendering a component or custom Hook",
          "It catches rejected resources when wrapped in `try`/`catch`",
        ],
        answer: 2,
        explanation:
          "`use` has a narrow conditional/loop exception. It still belongs to React render code and cannot be wrapped in `try`/`catch`.",
      },
    ],
  },
  {
    id: "react-custom-hooks-contracts",
    module: "hooks-escape-hatches",
    title: "Custom Hooks as Domain Contracts",
    blurb:
      "Extract stateful behavior behind domain-shaped APIs without pretending Hook calls share state.",
    content: forReact(
      (language) => `## Reuse a behavior, not a bag of mechanics

A custom Hook is a function whose name starts with \`use\` and which may call other Hooks. Its value is not fewer lines in a component; its value is a **domain contract**. It can own synchronization, transitions, cancellation, and edge cases while exposing the vocabulary a caller actually needs.

\`useConnectionStatus\`, \`useCheckout\`, or \`useDraftPersistence\` communicates intent. A generic \`useEffectOnce\` or \`useMount\` hides dependency semantics and often fights React's lifecycle instead of modeling a domain.

Most importantly, custom Hooks share **stateful logic, not state**. Every call receives independent Hook slots. Two components calling \`useConnectionStatus()\` do not share a state cell merely because the implementation is the same. Shared state requires an external store, context/provider ownership, or state lifted to a common owner.

${reactCode(
  language,
  `import { useEffect, useState } from "react";

function useConnectionStatus(roomId) {
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    setStatus("connecting");
    const connection = createConnection(roomId);
    connection.onStatusChange(setStatus);
    connection.connect();

    return () => connection.disconnect();
  }, [roomId]);

  return {
    status,
    canSend: status === "connected",
  };
}

function Composer({ roomId }) {
  const connection = useConnectionStatus(roomId);
  return (
    <button disabled={!connection.canSend}>
      {connection.status === "connecting" ? "Connecting…" : "Send"}
    </button>
  );
}`,
  `import { useEffect, useState } from "react";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface ConnectionContract {
  status: ConnectionStatus;
  canSend: boolean;
}

function useConnectionStatus(roomId: string): ConnectionContract {
  const [status, setStatus] =
    useState<ConnectionStatus>("connecting");

  useEffect(() => {
    setStatus("connecting");
    const connection = createConnection(roomId);
    connection.onStatusChange(setStatus);
    connection.connect();

    return () => connection.disconnect();
  }, [roomId]);

  return {
    status,
    canSend: status === "connected",
  };
}

function Composer({ roomId }: { roomId: string }) {
  const connection = useConnectionStatus(roomId);
  return (
    <button disabled={!connection.canSend}>
      {connection.status === "connecting" ? "Connecting…" : "Send"}
    </button>
  );
}`
)}

The caller knows what "can send" means without knowing that an effect and subscription implement it. The Hook's dependency list remains honest: changing \`roomId\` disconnects the old room and connects the new one.

## Design the return value around allowed operations

Returning raw setters leaks representation. If callers receive \`setState\`, they can create combinations the domain considers invalid. Prefer named commands and derived facts. This is the same reason a well-designed service object exposes \`retry()\` rather than arbitrary mutation of its internal status.

${reactCode(
  language,
  `import { useCallback, useState } from "react";

function useCheckout(submitOrder) {
  const [status, setStatus] = useState("idle");

  const submit = useCallback(async (order) => {
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      await submitOrder(order);
      setStatus("succeeded");
    } catch {
      setStatus("failed");
    }
  }, [status, submitOrder]);

  const reset = useCallback(() => setStatus("idle"), []);

  return {
    status,
    submit,
    reset,
    canSubmit: status === "idle" || status === "failed",
  };
}`,
  `import { useCallback, useState } from "react";

type CheckoutStatus =
  | "idle"
  | "submitting"
  | "succeeded"
  | "failed";

interface Order {
  id: string;
}

interface CheckoutContract {
  status: CheckoutStatus;
  submit(order: Order): Promise<void>;
  reset(): void;
  canSubmit: boolean;
}

function useCheckout(
  submitOrder: (order: Order) => Promise<void>
): CheckoutContract {
  const [status, setStatus] = useState<CheckoutStatus>("idle");

  const submit = useCallback(async (order: Order) => {
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      await submitOrder(order);
      setStatus("succeeded");
    } catch {
      setStatus("failed");
    }
  }, [status, submitOrder]);

  const reset = useCallback(() => setStatus("idle"), []);

  return {
    status,
    submit,
    reset,
    canSubmit: status === "idle" || status === "failed",
  };
}`
)}

The contract describes legal domain operations. TypeScript can make states and commands explicit, but the same API design matters in JavaScript.

## Preserve React's visibility

Custom Hooks do not bypass React's rules. Their calls remain top-level, reactive values remain dependencies, and effects still need symmetric cleanup. Keep the \`use\` prefix: it tells humans, React tooling, and the linter that the function participates in Hook semantics.

Do not extract every three-line Hook sequence. Extract when multiple callers need the behavior, when one behavior has a lifecycle worth naming, or when a domain boundary becomes clearer. Components should still make their data flow understandable from their props, state, and returned Hook contract.`,
    ),
    exercises: [
      {
        id: "react-custom-hook-domain-transition",
        title: "Protect a domain transition",
        instructions: `Implement the pure \`nextUploadStatus(status, event)\` transition used behind an imagined \`useUpload\` contract.

- \`start\` is legal from \`idle\` or \`failed\` and yields \`uploading\`.
- \`resolve\` and \`reject\` are legal only from \`uploading\`.
- \`reset\` always yields \`idle\`.
- Ignore every other transition by returning the current status.

Expected output: \`uploading\`, \`failed\`, \`failed\`, \`idle\`.`,
        starterCode: reactVariants(
          `function nextUploadStatus(status, event) {
  // TODO: encode the allowed transitions without exposing arbitrary mutation.
  return status;
}

let uploadStatus = "idle";
uploadStatus = nextUploadStatus(uploadStatus, "start");
console.log(uploadStatus);
uploadStatus = nextUploadStatus(uploadStatus, "reject");
console.log(uploadStatus);
uploadStatus = nextUploadStatus(uploadStatus, "resolve");
console.log(uploadStatus);
uploadStatus = nextUploadStatus(uploadStatus, "reset");
console.log(uploadStatus);`,
          `type UploadStatus = "idle" | "uploading" | "succeeded" | "failed";
type UploadEvent = "start" | "resolve" | "reject" | "reset";

function nextUploadStatus(
  status: UploadStatus,
  event: UploadEvent
): UploadStatus {
  // TODO: encode the allowed transitions without exposing arbitrary mutation.
  return status;
}

let uploadStatus: UploadStatus = "idle";
uploadStatus = nextUploadStatus(uploadStatus, "start");
console.log(uploadStatus);
uploadStatus = nextUploadStatus(uploadStatus, "reject");
console.log(uploadStatus);
uploadStatus = nextUploadStatus(uploadStatus, "resolve");
console.log(uploadStatus);
uploadStatus = nextUploadStatus(uploadStatus, "reset");
console.log(uploadStatus);`,
        ),
      },
    ],
    quiz: [
      {
        id: "react-custom-hooks-contracts-q1",
        prompt:
          "Two sibling components each call the same `useDraft()` custom Hook. What is shared automatically?",
        options: [
          "The state cells, but not effects",
          "The effects, but not state cells",
          "Both state and effects through the Hook function",
          "The implementation logic only; each call gets independent Hook state",
        ],
        answer: 3,
        explanation:
          "A custom Hook reuses stateful logic. Sharing actual state needs a common owner, context/store, or another explicit shared source.",
      },
      {
        id: "react-custom-hooks-contracts-q2",
        prompt:
          "Which return value best expresses a checkout Hook's domain contract?",
        options: [
          "`{ status, canSubmit, submit, reset }`",
          "`{ state, setState }`",
          "The internal effect callback",
          "The component that rendered the checkout",
        ],
        answer: 0,
        explanation:
          "Named facts and operations let callers do what the domain permits without coupling them to internal representation.",
      },
      {
        id: "react-custom-hooks-contracts-q3",
        prompt: "Why should a custom Hook's name start with `use`?",
        options: [
          "React memoizes every function with that prefix",
          "It signals Hook semantics to readers and lets Hook lint rules analyze its calls",
          "The prefix causes all calls to share one state instance",
          "JavaScript reserves the prefix for framework functions",
        ],
        answer: 1,
        explanation:
          "The naming convention makes participation in React's Hook protocol visible; it is not a state-sharing or memoization mechanism.",
      },
    ],
  },
  {
    id: "react-refs-vs-state",
    module: "hooks-escape-hatches",
    title: "Refs, State, and Render-Relevant Data",
    blurb:
      "Choose state for rendered snapshots and refs for retained mutable values or host nodes.",
    content: forReact(
      (language) => `## State participates in rendering; refs do not

\`useState\` stores a value and schedules another render when its setter is used. A ref is a stable object whose \`current\` field survives renders, but assigning to \`current\` does **not** render the component. That distinction determines the choice:

- If changing the value should change what the user sees, use state.
- If the value is bookkeeping needed by event handlers or effects, but not by rendering, a ref may fit.
- If React must give you a host node after commit, attach a DOM ref.

A ref is an escape hatch from React's normal snapshot data flow. It is appropriate for interval IDs, an imperative library instance, the latest pointer coordinates used outside rendering, or a previous value used by an effect. It is not "state without rerenders." Putting visible application data in a ref creates stale UI because React has no signal to render again.

${reactCode(
  language,
  `import { useRef, useState } from "react";

function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  function start() {
    if (intervalRef.current !== null) return;
    const startedAt = Date.now() - elapsed;
    intervalRef.current = window.setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 100);
  }

  function stop() {
    if (intervalRef.current === null) return;
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  return (
    <>
      <output>{Math.floor(elapsed / 1000)}s</output>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </>
  );
}`,
  `import { useRef, useState } from "react";

function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);

  function start(): void {
    if (intervalRef.current !== null) return;
    const startedAt = Date.now() - elapsed;
    intervalRef.current = window.setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 100);
  }

  function stop(): void {
    if (intervalRef.current === null) return;
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  return (
    <>
      <output>{Math.floor(elapsed / 1000)}s</output>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </>
  );
}`
)}

\`elapsed\` is state because it drives \`<output>\`. The interval handle is a ref because rendering it would be meaningless; it only lets event handlers address an external timer.

## Render stays pure

Do not read or write \`ref.current\` during rendering as a general data path. React may start, repeat, or discard renders, and mutation during render makes their result timing-dependent. Event handlers and effects are the normal places to use mutable refs.

The narrow initialization pattern below is safe because it is predictable and only fills an empty cell:

${reactCode(
  language,
  `function ParserPanel() {
  const parserRef = useRef(null);

  if (parserRef.current === null) {
    parserRef.current = createParser();
  }

  function handleParse(source) {
    return parserRef.current.parse(source);
  }

  // ...
}`,
  `function ParserPanel() {
  const parserRef = useRef<Parser | null>(null);

  if (parserRef.current === null) {
    parserRef.current = createParser();
  }

  function handleParse(source: string): ParseResult {
    return parserRef.current!.parse(source);
  }

  // ...
}`
)}

The branch always produces the same retained instance and does not derive visible output by mutating the ref.

## DOM refs exist after commit

Passing a ref to a host element asks React to populate it with the DOM node during commit and clear it when the node is removed. It is \`null\` before mount and during relevant unmount transitions, so access it from events or effects rather than assuming it exists during render.

${reactCode(
  language,
  `import { useRef } from "react";

function SearchBox() {
  const inputRef = useRef(null);

  function focusSearch() {
    inputRef.current?.focus();
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusSearch}>Focus search</button>
    </>
  );
}`,
  `import { useRef } from "react";

function SearchBox() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function focusSearch(): void {
    inputRef.current?.focus();
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusSearch}>Focus search</button>
    </>
  );
}`
)}

Prefer declarative props and state for normal UI behavior. Focus, text selection, measurement, media control, and third-party widget bridges are legitimate imperative edges; using a ref to manually keep ordinary UI in sync usually duplicates React's job.`,
    ),
    exercises: [
      {
        id: "react-ref-retained-cell",
        title: "Model a retained mutable cell",
        instructions: `Implement \`createPreviousTracker()\`. Its \`record(value)\` method must return the previously recorded value, or \`undefined\` on the first call, then retain the new value for the next call.

The closure models the persistence aspect of a ref in worker-safe code. It deliberately does not model rendering: changing the retained cell emits no update.

Expected output: \`undefined\`, \`alpha\`, \`beta\`.`,
        starterCode: reactVariants(
          `function createPreviousTracker() {
  // TODO: retain one value in this closure.
  return {
    record(value) {
      // Return the old value, then retain value for the next call.
    },
  };
}

const tracker = createPreviousTracker();
console.log(tracker.record("alpha"));
console.log(tracker.record("beta"));
console.log(tracker.record("gamma"));`,
          `interface PreviousTracker<T> {
  record(value: T): T | undefined;
}

function createPreviousTracker<T>(): PreviousTracker<T> {
  // TODO: retain one T | undefined in this closure.
  return {
    record(value: T): T | undefined {
      // Return the old value, then retain value for the next call.
      return undefined;
    },
  };
}

const tracker = createPreviousTracker<string>();
console.log(tracker.record("alpha"));
console.log(tracker.record("beta"));
console.log(tracker.record("gamma"));`,
        ),
      },
    ],
    quiz: [
      {
        id: "react-refs-vs-state-q1",
        prompt:
          "A value changes and the rendered output must immediately reflect it. Where should that value normally live?",
        options: [
          "A module-level variable",
          "Only in a DOM property",
          "State, because updating it schedules a render",
          "A ref, because changing `current` schedules a render",
        ],
        answer: 2,
        explanation:
          "State is part of React's render data flow. Ref mutation is intentionally invisible to rendering.",
      },
      {
        id: "react-refs-vs-state-q2",
        prompt: "Which value is the strongest candidate for a ref?",
        options: [
          "The selected product shown in the page heading",
          "The authenticated user displayed throughout the app",
          "A validation error rendered beside a field",
          "An interval handle used only to stop an external timer",
        ],
        answer: 3,
        explanation:
          "The handle must persist across renders but has no visual meaning. It is imperative bookkeeping, not rendered state.",
      },
      {
        id: "react-refs-vs-state-q3",
        prompt: "When does React populate a ref attached to a host element?",
        options: [
          "During commit, and React clears it when the node is removed",
          "While the component function is calculating JSX",
          "At module evaluation time",
          "Only after the first user event",
        ],
        answer: 0,
        explanation:
          "Host nodes exist after React commits them. Render code therefore cannot rely on the DOM ref already being populated.",
      },
    ],
  },
  {
    id: "react-imperative-handles-widgets",
    module: "hooks-escape-hatches",
    title: "Narrow Imperative Handles and Widget Lifecycles",
    blurb:
      "Expose focused imperative capabilities in React 19 and synchronize external widget instances with cleanup.",
    content: forReact(
      (language) => `## An imperative API is an intentional escape hatch

Props and state are React's normal data flow: a parent describes the desired result and React reconciles it. Sometimes a parent genuinely needs an imperative capability such as focus, selection, reset, or scrolling. A ref crosses that declarative boundary, so expose the **smallest capability API** that solves the need.

In React 19, function components can receive \`ref\` as a prop. \`forwardRef\` is no longer required for newly written React 19 function components. \`useImperativeHandle(ref, createHandle, dependencies)\` controls what the parent receives instead of leaking an entire DOM node.

${reactCode(
  language,
  `import { useImperativeHandle, useRef } from "react";

function SearchField({ ref, defaultValue = "" }) {
  const inputRef = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        inputRef.current?.focus();
      },
      selectAll() {
        inputRef.current?.select();
      },
    }),
    []
  );

  return <input ref={inputRef} defaultValue={defaultValue} />;
}

function Toolbar() {
  const searchRef = useRef(null);

  return (
    <>
      <SearchField ref={searchRef} />
      <button onClick={() => searchRef.current?.focus()}>
        Find
      </button>
    </>
  );
}`,
  `import {
  useImperativeHandle,
  useRef,
  type Ref,
} from "react";

interface SearchFieldHandle {
  focus(): void;
  selectAll(): void;
}

interface SearchFieldProps {
  ref?: Ref<SearchFieldHandle>;
  defaultValue?: string;
}

function SearchField({
  ref,
  defaultValue = "",
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        inputRef.current?.focus();
      },
      selectAll() {
        inputRef.current?.select();
      },
    }),
    []
  );

  return <input ref={inputRef} defaultValue={defaultValue} />;
}

function Toolbar() {
  const searchRef = useRef<SearchFieldHandle | null>(null);

  return (
    <>
      <SearchField ref={searchRef} />
      <button onClick={() => searchRef.current?.focus()}>
        Find
      </button>
    </>
  );
}`
)}

The parent can focus or select, but cannot mutate arbitrary input properties or couple itself to the child's internal node. Dependencies follow the same rule as other Hooks: every reactive value captured while creating the handle belongs in the list. An empty list is correct here because the methods only read the stable \`inputRef\` object.

Do not use an imperative handle to model ordinary data updates. If the parent wants to change the search value, a \`value\` prop and \`onChange\` callback keep that state visible and composable. Handles are for capabilities that are inherently imperative.

## Treat an external widget as a synchronized resource

A non-React chart, map, editor, or media controller owns mutable state outside React. Use a host-node ref to locate its mount point and an effect to synchronize its lifetime:

1. create the widget after the host node is committed;
2. update it when reactive inputs change, either in the same effect or a focused update effect;
3. destroy or unsubscribe in cleanup.

${reactCode(
  language,
  `import { useEffect, useRef } from "react";

function SalesChart({ data, theme }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const chart = createChart(containerRef.current, { theme });
    chartRef.current = chart;

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    chartRef.current?.setData(data);
  }, [data, theme]);

  return <div ref={containerRef} />;
}`,
  `import { useEffect, useRef } from "react";

interface SalesChartProps {
  data: readonly DataPoint[];
  theme: ChartTheme;
}

function SalesChart({ data, theme }: SalesChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (containerRef.current === null) return;

    const chart = createChart(containerRef.current, { theme });
    chartRef.current = chart;

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    chartRef.current?.setData(data);
  }, [data, theme]);

  return <div ref={containerRef} />;
}`
)}

Here \`theme\` defines widget identity, so changing it destroys the old instance before creating the replacement. The data effect also depends on \`theme\`, ensuring it initializes that replacement after setup; changing \`data\` alone updates the current instance without reconstruction. Real APIs differ; choose effect boundaries from the external system's lifecycle, not from a desire to minimize effect count.

Cleanup must fully undo setup. Development Strict Mode may run an extra setup-cleanup-setup cycle to expose missing teardown. Correct integration tolerates that cycle: no duplicate subscriptions, leaked observers, orphaned canvases, or stale instance left in the ref.

This is what makes refs and effects escape hatches rather than an alternate architecture. React remains the owner of application data and desired UI. The imperative object is contained at a boundary, synchronized from reactive inputs, and disposed when that boundary changes or disappears.`,
    ),
    exercises: [
      {
        id: "react-widget-lifecycle-plan",
        title: "Plan widget replacement and cleanup",
        instructions: `Implement the pure \`planWidgetTransition(currentId, event)\` function. It returns the next widget ID and an ordered list of lifecycle commands.

- \`mount(id)\` with no current widget creates it.
- \`mount(id)\` with the same ID does nothing.
- \`mount(id)\` with a different current ID destroys the old widget before creating the new one.
- \`unmount\` destroys the current widget; when none exists it does nothing.

Expected output: \`create:a\`, an empty line, \`destroy:a,create:b\`, \`destroy:b\`.`,
        starterCode: reactVariants(
          `function planWidgetTransition(currentId, event) {
  // TODO: return { nextId, commands } without mutating event.
  return { nextId: currentId, commands: [] };
}

let currentId = null;
for (const event of [
  { type: "mount", id: "a" },
  { type: "mount", id: "a" },
  { type: "mount", id: "b" },
  { type: "unmount" },
]) {
  const plan = planWidgetTransition(currentId, event);
  currentId = plan.nextId;
  console.log(plan.commands.join(","));
}`,
          `type WidgetEvent =
  | { type: "mount"; id: string }
  | { type: "unmount" };

interface WidgetPlan {
  nextId: string | null;
  commands: string[];
}

function planWidgetTransition(
  currentId: string | null,
  event: WidgetEvent
): WidgetPlan {
  // TODO: return { nextId, commands } without mutating event.
  return { nextId: currentId, commands: [] };
}

let currentId: string | null = null;
const events: WidgetEvent[] = [
  { type: "mount", id: "a" },
  { type: "mount", id: "a" },
  { type: "mount", id: "b" },
  { type: "unmount" },
];

for (const event of events) {
  const plan = planWidgetTransition(currentId, event);
  currentId = plan.nextId;
  console.log(plan.commands.join(","));
}`,
        ),
      },
    ],
    quiz: [
      {
        id: "react-imperative-handles-widgets-q1",
        prompt:
          "In React 19, how can a new function component receive a parent's ref?",
        options: [
          "Only through a module-level variable",
          "As a `ref` prop; `forwardRef` is not required for new React 19 function components",
          "Only by converting the component to a class",
          "Through context, because refs cannot cross component boundaries",
        ],
        answer: 1,
        explanation:
          "React 19 supports `ref` as a prop. `useImperativeHandle` can then expose a controlled handle to that ref.",
      },
      {
        id: "react-imperative-handles-widgets-q2",
        prompt:
          "Why expose `{ focus, selectAll }` with `useImperativeHandle` instead of the child input node?",
        options: [
          "The handle makes focus declarative state",
          "DOM nodes cannot be stored in refs",
          "A narrow capability API reduces coupling and prevents arbitrary external mutation",
          "The handle automatically rerenders the child after every method call",
        ],
        answer: 2,
        explanation:
          "The parent receives only intentional operations. The child remains free to change its internal node or implementation.",
      },
      {
        id: "react-imperative-handles-widgets-q3",
        prompt:
          "What makes an effect-based third-party widget integration robust?",
        options: [
          "Creating a fresh widget during every render",
          "Storing all application state inside the widget",
          "Skipping cleanup so development remounts reuse the instance",
          "Mirroring the widget's setup with complete cleanup and synchronizing it from explicit reactive inputs",
        ],
        answer: 3,
        explanation:
          "A symmetric lifecycle survives replacement, unmount, and Strict Mode checks without leaking external resources.",
      },
    ],
  },
];
