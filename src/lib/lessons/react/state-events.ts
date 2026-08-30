import type { Lesson } from "../types";
import { forReact, reactCode, reactVariants } from "./shared";

export const stateEventsLessons: Lesson[] = [
  {
    id: "react-events-vs-rendering",
    module: "state-events",
    title: "Events, Rendering, and Effects Have Different Jobs",
    blurb:
      "Put interaction consequences in handlers, calculations in render, and external synchronization in Effects.",
    content: forReact(
      (language) => `# Events, Rendering, and Effects Have Different Jobs

React code is easier to place when you ask **what caused this work?**

- **Rendering** answers, “Given these props and this state snapshot, what should the UI describe?” It must be pure.
- **An event handler** answers, “What should happen because the user performed this particular interaction?” It may update state and initiate side effects.
- **An Effect** answers, “Now that this component is committed with these values, how should an external system be synchronized?” It is not a general-purpose “run code after render” hook.

That is a causal distinction, not a timing trick. If clicking *Buy* must create an order, the purchase belongs in that click path. Moving it into an Effect keyed by \`shouldBuy\` obscures the cause, introduces an intermediate state, and makes remounts or dependency changes dangerous.

## Render is a calculation

A component can run more than once for one visible result. React may restart, interrupt, or discard render work. Therefore render may calculate values and create event-handler closures, but it must not mutate external data, send requests, write storage, or dispatch analytics.

${reactCode(
  language,
  `function Invoice({ lines, taxRate, onPay }) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const total = subtotal * (1 + taxRate);

  return (
    <section>
      <output>Total: {total.toFixed(2)}</output>
      <button onClick={() => onPay({ total, lineIds: lines.map(line => line.id) })}>
        Pay
      </button>
    </section>
  );
}`,
  `type Line = {
  id: string;
  price: number;
  quantity: number;
};

type PaymentRequest = {
  total: number;
  lineIds: string[];
};

type InvoiceProps = {
  lines: Line[];
  taxRate: number;
  onPay: (request: PaymentRequest) => void;
};

function Invoice({ lines, taxRate, onPay }: InvoiceProps) {
  const subtotal = lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0
  );
  const total = subtotal * (1 + taxRate);

  return (
    <section>
      <output>Total: {total.toFixed(2)}</output>
      <button onClick={() => onPay({ total, lineIds: lines.map(line => line.id) })}>
        Pay
      </button>
    </section>
  );
}`
)}

\`subtotal\` and \`total\` are derived during render because they are deterministic calculations. The payment is initiated by the handler because the click is its cause. Passing an intent-rich callback such as \`onPay(request)\` also keeps the child from knowing whether payment means a request, a client-side transition, or a test spy.

## Handler bodies are allowed to do things

Handlers run in response to an event, outside render. They can validate the current snapshot, queue state updates, call callbacks, and start interaction-caused work. Pass the function; do not call it while rendering:

${reactCode(
  language,
  `function DraftEditor({ draft, saveDraft }) {
  const [message, setMessage] = useState("");

  function handleSave() {
    if (draft.body.trim() === "") {
      setMessage("Write something before saving");
      return;
    }

    saveDraft(draft);
    setMessage("Saved");
  }

  return <button onClick={handleSave}>{message || "Save"}</button>;
}`,
  `type Draft = {
  id: string;
  body: string;
};

type DraftEditorProps = {
  draft: Draft;
  saveDraft: (draft: Draft) => void;
};

function DraftEditor({ draft, saveDraft }: DraftEditorProps) {
  const [message, setMessage] = useState("");

  function handleSave(): void {
    if (draft.body.trim() === "") {
      setMessage("Write something before saving");
      return;
    }

    saveDraft(draft);
    setMessage("Saved");
  }

  return <button onClick={handleSave}>{message || "Save"}</button>;
}`
)}

\`onClick={handleSave()}\` is a classic pitfall: it executes during render and passes the return value as the handler. \`onClick={handleSave}\` passes behavior. An inline wrapper, \`onClick={() => handleSave(id)}\`, is appropriate when arguments must be bound.

Event objects are useful at the boundary; domain logic should usually receive domain values. This keeps most logic independent of React's event API:

${reactCode(
  language,
  `function SearchBox({ query, onQueryChange }) {
  return (
    <input
      value={query}
      onChange={event => onQueryChange(event.currentTarget.value)}
    />
  );
}`,
  `import type { ChangeEvent } from "react";

type SearchBoxProps = {
  query: string;
  onQueryChange: (query: string) => void;
};

function SearchBox({ query, onQueryChange }: SearchBoxProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onQueryChange(event.currentTarget.value);
  }

  return <input value={query} onChange={handleChange} />;
}`
)}

In TypeScript, type the handler at the narrowest useful boundary: \`ChangeEvent<HTMLInputElement>\` gives an accurately typed \`currentTarget\`, while \`onQueryChange\` remains a framework-independent \`(query: string) => void\`. Prefer \`currentTarget\` when you mean “the element whose handler is running”; \`target\` can be a descendant due to bubbling.

## Propagation and defaults are separate mechanisms

Most React events propagate upward. A child may call \`event.stopPropagation()\` when the parent interaction truly must not also run—for example, a “delete” button inside a clickable row. \`event.preventDefault()\` cancels browser default behavior, such as native form navigation. One does not imply the other.

Use both sparingly. A component API with explicit callbacks often communicates flow better than relying on invisible propagation. Form submission is the notable positive pattern: put shared submit logic on \`onSubmit\`, use a submit button, and prevent the native navigation only when client-side handling replaces it.

## Effects synchronize; they do not launder event logic

Connecting a chat client because \`roomId\` is currently rendered is synchronization: the component must remain connected for as long as that room is committed. Sending a message because the user clicked *Send* is an interaction:

${reactCode(
  language,
  `function ChatRoom({ roomId, transport }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const connection = transport.connect(roomId);
    return () => connection.disconnect();
  }, [roomId, transport]);

  function handleSend() {
    transport.send(roomId, text);
    setText("");
  }

  return (
    <form onSubmit={event => { event.preventDefault(); handleSend(); }}>
      <input value={text} onChange={event => setText(event.currentTarget.value)} />
      <button type="submit">Send</button>
    </form>
  );
}`,
  `import type { FormEvent } from "react";

type Connection = { disconnect: () => void };
type Transport = {
  connect: (roomId: string) => Connection;
  send: (roomId: string, text: string) => void;
};

type ChatRoomProps = {
  roomId: string;
  transport: Transport;
};

function ChatRoom({ roomId, transport }: ChatRoomProps) {
  const [text, setText] = useState("");

  useEffect(() => {
    const connection = transport.connect(roomId);
    return () => connection.disconnect();
  }, [roomId, transport]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    transport.send(roomId, text);
    setText("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={event => setText(event.currentTarget.value)}
      />
      <button type="submit">Send</button>
    </form>
  );
}`
)}

Practical review question: **If the component appeared with these props and state but nobody performed the interaction, should this work still happen?** If yes because an external resource must match the rendered state, it may be an Effect. If no because a specific gesture is the cause, keep it in that event path. If it is only a calculation, keep it in render.`,
    ),
    exercises: [
      {
        id: "react-event-transition-command",
        title: "Separate a transition from its event boundary",
        instructions: `Implement \`submitDraft(state)\` as a pure transition. An empty trimmed body leaves state unchanged and emits a \`show-error\` command. A non-empty body increments \`revision\`, marks the draft clean, and emits a \`persist\` command containing the new revision.

The caller represents a React event handler: it can execute the returned command later, while the transition remains runnable and testable without React.

**Expected output:** \`show-error:Write something first\`, then \`persist:8\`, then \`false\`.`,
        starterCode: reactVariants(
          `function submitDraft(state) {
  // TODO: return { state, command }.
  // Blank body: preserve the same state object and emit:
  // { type: "show-error", message: "Write something first" }
  // Valid body: create a state with revision + 1 and dirty: false, then emit:
  // { type: "persist", revision: theNewRevision, body: trimmedBody }
  return { state, command: { type: "show-error", message: "Write something first" } };
}

const blank = { body: "   ", revision: 3, dirty: true };
const blankResult = submitDraft(blank);
console.log(blankResult.command.type + ":" + blankResult.command.message);

const draft = { body: "  Ship it  ", revision: 7, dirty: true };
const saved = submitDraft(draft);
console.log(saved.command.type + ":" + saved.command.revision);
console.log(saved.state.dirty);
// expected:
// show-error:Write something first
// persist:8
// false`,
          `type DraftState = {
  body: string;
  revision: number;
  dirty: boolean;
};

type SubmitCommand =
  | { type: "show-error"; message: string }
  | { type: "persist"; revision: number; body: string };

type SubmitResult = {
  state: DraftState;
  command: SubmitCommand;
};

function submitDraft(state: DraftState): SubmitResult {
  // TODO: return { state, command }.
  // Blank body: preserve the same state object and emit show-error.
  // Valid body: create a state with revision + 1 and dirty: false,
  // then emit persist with the new revision and trimmed body.
  return {
    state,
    command: { type: "show-error", message: "Write something first" },
  };
}

const blank: DraftState = { body: "   ", revision: 3, dirty: true };
const blankResult = submitDraft(blank);
if (blankResult.command.type === "show-error") {
  console.log(blankResult.command.type + ":" + blankResult.command.message);
}

const draft: DraftState = { body: "  Ship it  ", revision: 7, dirty: true };
const saved = submitDraft(draft);
if (saved.command.type === "persist") {
  console.log(saved.command.type + ":" + saved.command.revision);
}
console.log(saved.state.dirty);
// expected:
// show-error:Write something first
// persist:8
// false`,
        ),
      },
    ],
    quiz: [
      {
        id: "react-events-vs-rendering-q1",
        prompt:
          "A click on “Buy” must create an order exactly because that click occurred. Where should the order initiation live?",
        options: [
          "In the click event path, because the interaction is the cause",
          "In render, immediately before returning the button",
          "In an Effect watching a `shouldBuy` boolean set by the click",
          "In a memoized calculation so React runs it only when dependencies change",
        ],
        answer: 0,
        explanation:
          "The purchase is caused by one interaction, so its initiation belongs in that handler path. An Effect introduces indirect trigger state and can run for synchronization reasons unrelated to a fresh click; render and memo calculations must stay pure.",
      },
      {
        id: "react-events-vs-rendering-q2",
        prompt:
          "A button inside a clickable row calls `event.preventDefault()`. What does that guarantee?",
        options: [
          "The event stops bubbling to the row",
          "React skips every state update queued by the button",
          "The browser's default action is cancelled, but propagation is unchanged",
          "Both the native default and all parent React handlers are cancelled",
        ],
        answer: 2,
        explanation:
          "`preventDefault` controls the browser's default behavior; `stopPropagation` controls event propagation. They are independent, so the row's click handler can still run.",
      },
      {
        id: "react-events-vs-rendering-q3",
        prompt:
          "Which operation is correctly modeled as an Effect rather than an event handler or render calculation?",
        options: [
          "Formatting a total from the current invoice lines",
          "Sending an invoice because the user clicked Send",
          "Validating one submitted form and showing its errors",
          "Keeping a room connection synchronized with the committed `roomId`",
        ],
        answer: 3,
        explanation:
          "A connection must exist for as long as the committed room exists, regardless of which interaction produced that room ID. That is external synchronization. The total is derivation; sending and validation are interaction-caused.",
      },
    ],
  },
  {
    id: "react-batching-and-updaters",
    module: "state-events",
    title: "Batching, Snapshots, and the State Update Queue",
    blurb:
      "Reason about queued replacements and updater functions without pretending a setter mutates the current render.",
    content: forReact(
      (language) => `# Batching, Snapshots, and the State Update Queue

Calling a state setter does not mutate the variable in the handler that is currently running. It **queues work for a future render**. Every render receives a state snapshot, and every closure created by that render sees that snapshot.

This single model explains most “stale state” reports:

${reactCode(
  language,
  `function Counter() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    console.log(count);
  }

  return <button onClick={handleClick}>{count}</button>;
}`,
  `function Counter() {
  const [count, setCount] = useState<number>(0);

  function handleClick(): void {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    console.log(count);
  }

  return <button onClick={handleClick}>{count}</button>;
}`
)}

If \`count\` is 0, all three calls queue “replace with 1”; the log is still 0, and the next render shows 1. React does not rewrite the lexical variable, and batching is not what makes it stale—the snapshot would remain 0 even if rendering happened immediately after the handler returned.

## Batching is a transaction boundary

React batches queued updates so multiple setters normally produce one render after the current work finishes. Modern React also batches updates from more sources than old versions did. The practical contract is:

- Do not expect the DOM or local state variables to change midway through your handler.
- Do not depend on an exact number of renders for correctness.
- Separate intentional user events are handled separately; React will not merge two clicks into one semantic interaction.
- Reach for \`flushSync\` only at an imperative integration boundary that truly requires a committed DOM before the next line. It is an escape hatch with scheduling cost, not a way to make state act mutable.

Batching permits React to preserve invariants: all related updates can be reflected together instead of exposing partially updated UI.

## Updaters transform pending state

When the next value depends on the previous one, pass a function. React processes queued entries in order and gives each updater the result of the entry before it:

${reactCode(
  language,
  `function Score() {
  const [score, setScore] = useState(0);

  function addThree() {
    setScore(previous => previous + 1);
    setScore(previous => previous + 1);
    setScore(previous => previous + 1);
  }

  return <button onClick={addThree}>Score: {score}</button>;
}`,
  `function Score() {
  const [score, setScore] = useState<number>(0);

  function addThree(): void {
    setScore((previous) => previous + 1);
    setScore((previous) => previous + 1);
    setScore((previous) => previous + 1);
  }

  return <button onClick={addThree}>Score: {score}</button>;
}`
)}

Starting from 0, the queue computes 0 → 1 → 2 → 3. Name the argument after what it represents—\`previous\`, \`current\`, or a short form such as \`n\`—not after the closed-over snapshot.

Updater functions must be pure. React may invoke them more than once in development to expose accidental mutation or side effects. An updater can allocate the next state; it must not send requests, mutate its argument, consume a random value that correctness depends on, or write elsewhere.

## Replacements and updaters can share a queue

It helps to model \`setState(value)\` as a queue entry that ignores its input and returns \`value\`. Order therefore matters:

${reactCode(
  language,
  `function handleNormalize() {
  setCount(5);
  setCount(value => value + 1);
  setCount(value => value * 2);
  // next count: (5 + 1) * 2 = 12
}`,
  `function handleNormalize(): void {
  setCount(5);
  setCount((value: number) => value + 1);
  setCount((value: number) => value * 2);
  // next count: (5 + 1) * 2 = 12
}`
)}

Reverse the first two entries and the result changes: “increment pending state, then replace with 5” discards the increment. Mixing styles is valid, but a long mixed queue is usually a signal that one named transition or reducer action would communicate the transaction better.

## Choosing the setter form

Use a replacement when the next value is independent of the old one:

- \`setQuery(event.currentTarget.value)\`
- \`setOpen(false)\`
- \`setSelectedId(item.id)\`

Use an updater when prior state participates in the transition:

- \`setCount(count => count + 1)\`
- \`setItems(items => items.filter(item => item.id !== id))\`
- \`setDraft(draft => ({ ...draft, title }))\`

An updater is also useful when a stable callback should not depend on a captured state value:

${reactCode(
  language,
  `const appendMessage = useCallback(message => {
  setMessages(messages => [...messages, message]);
}, []);`,
  `type Message = {
  id: string;
  text: string;
};

const appendMessage = useCallback((message: Message): void => {
  setMessages((messages) => [...messages, message]);
}, []);`
)}

The empty dependency list is honest here because the callback does not read \`messages\`; the updater receives pending state from React. Do not mechanically turn every setter into an updater, though. \`setQuery(() => nextQuery)\` adds ceremony without improving correctness.

## Multiple state variables versus one transition

Several setters in one event can be correct:

${reactCode(
  language,
  `function handleClose() {
  setSelectedId(null);
  setDraft("");
  setValidation([]);
}`,
  `function handleClose(): void {
  setSelectedId(null);
  setDraft("");
  setValidation([]);
}`
)}

Batching prevents intermediate renders, but it does not prove the state model is sound. If those values must always change together, one object transition or reducer action may better enforce the invariant. Conversely, combining unrelated values merely to “get one render” is obsolete reasoning: React already batches related updates.

The debugging discipline is to write down the snapshot and queue. For each setter, record either **replace with X** or **apply f**. Fold the queue left from the snapshot. That predicts the next state without relying on folklore about setter timing.`,
    ),
    exercises: [
      {
        id: "react-fold-state-update-queue",
        title: "Execute a mixed state-update queue",
        instructions: `Implement \`applyQueue(initial, entries)\`. Process entries from left to right. A \`replace\` entry discards pending state and installs its value; an \`update\` entry transforms pending state with its function.

This is the useful mental model for a batch containing \`setState(value)\` and \`setState(previous => next)\`.

**Expected output:** \`12\`, \`5\`, \`9\`.`,
        starterCode: reactVariants(
          `function applyQueue(initial, entries) {
  let pending = initial;
  // TODO: fold entries in order.
  // "replace" installs entry.value.
  // "update" calls entry.apply with pending and stores the result.
  return pending;
}

const mixed = [
  { type: "replace", value: 5 },
  { type: "update", apply: value => value + 1 },
  { type: "update", apply: value => value * 2 },
];

const overwritten = [
  { type: "update", apply: value => value + 10 },
  { type: "replace", value: 5 },
];

const chained = [
  { type: "update", apply: value => value - 2 },
  { type: "update", apply: value => value * 3 },
];

console.log(applyQueue(0, mixed));       // expected: 12
console.log(applyQueue(0, overwritten)); // expected: 5
console.log(applyQueue(5, chained));     // expected: 9`,
          `type QueueEntry =
  | { type: "replace"; value: number }
  | { type: "update"; apply: (pending: number) => number };

function applyQueue(initial: number, entries: QueueEntry[]): number {
  let pending = initial;
  // TODO: fold entries in order.
  // "replace" installs entry.value.
  // "update" calls entry.apply with pending and stores the result.
  return pending;
}

const mixed: QueueEntry[] = [
  { type: "replace", value: 5 },
  { type: "update", apply: (value) => value + 1 },
  { type: "update", apply: (value) => value * 2 },
];

const overwritten: QueueEntry[] = [
  { type: "update", apply: (value) => value + 10 },
  { type: "replace", value: 5 },
];

const chained: QueueEntry[] = [
  { type: "update", apply: (value) => value - 2 },
  { type: "update", apply: (value) => value * 3 },
];

console.log(applyQueue(0, mixed));       // expected: 12
console.log(applyQueue(0, overwritten)); // expected: 5
console.log(applyQueue(5, chained));     // expected: 9`,
        ),
      },
      {
        id: "react-compose-cart-updaters",
        title: "Compose immutable cart updaters",
        instructions: `Implement the two pure updater factories.

- \`addQuantity(id, amount)\` returns an updater that changes only the matching line and preserves every other line object.
- \`removeEmpty()\` returns an updater that removes lines whose quantity is zero or less.

\`runUpdaters\` models React applying several functional setters in queue order. Do not mutate the array or line objects.

**Expected output:** \`[{"id":"a","quantity":3}]\`, then \`1\`.`,
        starterCode: reactVariants(
          `function addQuantity(id, amount) {
  return lines => {
    // TODO: return a new array; replace only the matching line with a copy
    // whose quantity is incremented.
    return lines;
  };
}

function removeEmpty() {
  return lines => {
    // TODO: return only lines whose quantity is greater than zero.
    return lines;
  };
}

function runUpdaters(initial, updaters) {
  return updaters.reduce((pending, update) => update(pending), initial);
}

const original = [
  { id: "a", quantity: 1 },
  { id: "b", quantity: 1 },
];
const next = runUpdaters(original, [
  addQuantity("a", 2),
  addQuantity("b", -1),
  removeEmpty(),
]);

console.log(JSON.stringify(next)); // expected: [{"id":"a","quantity":3}]
console.log(original[0].quantity); // expected: 1`,
          `type CartLine = {
  id: string;
  quantity: number;
};

type CartUpdater = (lines: CartLine[]) => CartLine[];

function addQuantity(id: string, amount: number): CartUpdater {
  return (lines) => {
    // TODO: return a new array; replace only the matching line with a copy
    // whose quantity is incremented.
    return lines;
  };
}

function removeEmpty(): CartUpdater {
  return (lines) => {
    // TODO: return only lines whose quantity is greater than zero.
    return lines;
  };
}

function runUpdaters(initial: CartLine[], updaters: CartUpdater[]): CartLine[] {
  return updaters.reduce((pending, update) => update(pending), initial);
}

const original: CartLine[] = [
  { id: "a", quantity: 1 },
  { id: "b", quantity: 1 },
];
const next = runUpdaters(original, [
  addQuantity("a", 2),
  addQuantity("b", -1),
  removeEmpty(),
]);

console.log(JSON.stringify(next)); // expected: [{"id":"a","quantity":3}]
console.log(original[0].quantity); // expected: 1`,
        ),
      },
    ],
    quiz: [
      {
        id: "react-batching-and-updaters-q1",
        prompt:
          "Starting from 0, one handler calls `setCount(count + 1)` three times. What does the next render usually receive?",
        options: [
          "3, because React applies each arithmetic expression to pending state",
          "1, because all three calls queue the same replacement calculated from snapshot 0",
          "0, because replacements inside a batch cancel one another",
          "An unspecified value, because batched setters have no ordering contract",
        ],
        answer: 1,
        explanation:
          "The handler's `count` is the snapshot value 0, so each expression computes 1 before being queued. The queue contains three equivalent replacements. Functional updaters would chain through pending state and produce 3.",
      },
      {
        id: "react-batching-and-updaters-q2",
        prompt:
          "From pending state 2, the queue is: update `n => n + 3`, replace with 10, update `n => n * 2`. What is the result?",
        options: ["5", "10", "15", "20"],
        answer: 3,
        explanation:
          "The first updater produces 5, the replacement discards that and installs 10, and the final updater doubles pending state to 20. Queue order is observable.",
      },
      {
        id: "react-batching-and-updaters-q3",
        prompt: "Why must a functional state updater be pure?",
        options: [
          "React may invoke it more than once in development, and it must only calculate next state",
          "Pure functions force React to commit every intermediate queue entry",
          "Impure updaters are legal only when batching is disabled with `flushSync`",
          "Purity lets the updater read the newly committed DOM synchronously",
        ],
        answer: 0,
        explanation:
          "An updater is a state calculation, not an effect boundary. React can call it again to detect impurities, so mutation, requests, and other side effects can duplicate or corrupt work.",
      },
    ],
  },
  {
    id: "react-state-shape-and-derivation",
    module: "state-events",
    title: "Minimal State, Normalized Data, and Render-Time Derivation",
    blurb:
      "Store the smallest durable source of truth, preserve identity deliberately, and calculate the rest during render.",
    content: forReact(
      (language) => `# Minimal State, Normalized Data, and Render-Time Derivation

State is not a cache of everything the UI can display. It is the smallest durable information that can change over time and cannot be calculated from current props and state.

Every redundant field creates a synchronization obligation. If \`firstName\`, \`lastName\`, and \`fullName\` all live in state, every transition must update all three correctly. The impossible state “Ada Lovelace” paired with \`firstName = "Grace"\` now exists.

## Derive deterministic values during render

${reactCode(
  language,
  `function PeopleList({ people }) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const visiblePeople = people.filter(person =>
    person.name.toLowerCase().includes(normalizedQuery)
  );

  return (
    <>
      <input value={query} onChange={event => setQuery(event.currentTarget.value)} />
      <p>{visiblePeople.length} matches</p>
      <ul>{visiblePeople.map(person => <li key={person.id}>{person.name}</li>)}</ul>
    </>
  );
}`,
  `type Person = {
  id: string;
  name: string;
};

type PeopleListProps = {
  people: Person[];
};

function PeopleList({ people }: PeopleListProps) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const visiblePeople = people.filter((person) =>
    person.name.toLowerCase().includes(normalizedQuery)
  );

  return (
    <>
      <input
        value={query}
        onChange={event => setQuery(event.currentTarget.value)}
      />
      <p>{visiblePeople.length} matches</p>
      <ul>
        {visiblePeople.map((person) => <li key={person.id}>{person.name}</li>)}
      </ul>
    </>
  );
}`
)}

\`visiblePeople\` is not state. It is a projection of \`people\` and \`query\`. Calculating it in render guarantees that it corresponds to the same snapshot. Deriving it in an Effect would commit once with stale results, run the Effect, queue another update, and commit again—more code, an extra render, and a visible path through inconsistent data.

\`useMemo\` may cache an expensive projection, but it does not convert derived data into source-of-truth state:

${reactCode(
  language,
  `const visibleRows = useMemo(
  () => rankRows(rows, query, sort),
  [rows, query, sort]
);`,
  `const visibleRows = useMemo(
  (): Row[] => rankRows(rows, query, sort),
  [rows, query, sort]
);`
)}

Memoization is a performance tool. The un-memoized calculation must remain correct. Do not add \`useMemo\` to inexpensive maps, filters, and string concatenations merely to avoid creating a value; measure the expensive path first.

## Normalize relationships around stable IDs

Storing a selected object duplicates an entity:

${reactCode(
  language,
  `const [items, setItems] = useState(initialItems);
const [selectedItem, setSelectedItem] = useState(initialItems[0]);`,
  `const [items, setItems] = useState<Item[]>(initialItems);
const [selectedItem, setSelectedItem] = useState<Item | null>(
  initialItems[0] ?? null
);`
)}

If an item is edited in \`items\`, \`selectedItem\` can silently retain the old object. Store the relationship, then derive the object:

${reactCode(
  language,
  `const [items, setItems] = useState(initialItems);
const [selectedId, setSelectedId] = useState(null);

const selectedItem =
  items.find(item => item.id === selectedId) ?? null;`,
  `const [items, setItems] = useState<Item[]>(initialItems);
const [selectedId, setSelectedId] = useState<string | null>(null);

const selectedItem: Item | null =
  items.find((item) => item.id === selectedId) ?? null;`
)}

For larger relational collections, normalize as \`byId\` plus an ordered ID list. One entity has one authoritative record; selections, parent-child links, and open tabs store IDs. This resembles a small in-memory database and makes immutable updates local.

Do not normalize by reflex. A short ordered list edited as a unit is often clearest as an array. Normalize when entities are shared, updated independently, or referenced from multiple places.

## Shape state around invariants

Good state eliminates impossible combinations:

- Replace \`isLoading\`, \`hasError\`, and \`isSuccess\` booleans with one status such as \`"idle" | "pending" | "success" | "error"\`.
- Group values that always transition together, such as a range's \`start\` and \`end\`.
- Keep unrelated values separate. One giant form-and-navigation-and-cache object makes every update touch an oversized boundary.
- Avoid mirroring props into state. \`useState(props.color)\` reads the prop only for initialization and then diverges. Either use the prop directly, intentionally own an editable draft, or reset identity with a key at an appropriate boundary.

The design question is not “object or several hooks?” It is **which transitions and invariants belong together?**

## Immutable updates preserve the meaning of identity

React uses identity as a change signal. Treat arrays and objects in state as read-only and allocate along the path that changed:

${reactCode(
  language,
  `function renameItem(id, name) {
  setItems(items =>
    items.map(item =>
      item.id === id ? { ...item, name } : item
    )
  );
}`,
  `function renameItem(id: string, name: string): void {
  setItems((items) =>
    items.map((item) =>
      item.id === id ? { ...item, name } : item
    )
  );
}`
)}

This creates a new array and one new changed item while preserving identities for unchanged items. That is both correct and useful for memoized descendants. Deep-cloning every entity is safe from mutation but destroys structural sharing and makes every row look changed.

For normalized data, update one record:

${reactCode(
  language,
  `setCatalog(catalog => ({
  ...catalog,
  byId: {
    ...catalog.byId,
    [id]: { ...catalog.byId[id], name },
  },
}));`,
  `setCatalog((catalog) => ({
  ...catalog,
  byId: {
    ...catalog.byId,
    [id]: { ...catalog.byId[id], name },
  },
}));`
)}

Spreads are shallow, which is exactly why each changed nesting level needs a new container. Mutating \`catalog.byId[id].name\` and then spreading only \`catalog\` has already corrupted the previous snapshot.

## Useful deletion semantics

When an entity disappears, derived relationships should degrade safely. If \`selectedId\` refers to a deleted item, deriving with \`?? null\` produces no selection. You may also clear the ID in the delete transition if the invariant says dangling IDs are forbidden. Choose deliberately; do not preserve a stale selected object to hide the issue.

A practical state audit lists every field and asks:

1. Can this be calculated from another field or prop in the same render?
2. Can two copies of this entity disagree?
3. Which values must transition atomically?
4. Does this update preserve untouched identities and previous snapshots?

Removing redundant state often deletes more bugs than adding another synchronization Effect ever could.`,
    ),
    exercises: [
      {
        id: "react-derive-normalized-view",
        title: "Derive a view from normalized source state",
        instructions: `Implement \`selectView(state)\` without changing \`state\`.

Use \`orderedIds\` to preserve display order, look up each entity in \`byId\`, filter by the trimmed case-insensitive query, and derive \`selected\` from \`selectedId\`. A missing selected entity becomes \`null\`; do not store a second selected-object copy.

**Expected output:** \`["Grace Hopper","Margaret Hamilton"]\`, then \`null\`, then \`3\`.`,
        starterCode: reactVariants(
          `function selectView(state) {
  // TODO: derive { visible, selected } from this snapshot.
  // Keep orderedIds order, ignore IDs missing from byId, and apply the query.
  return { visible: [], selected: null };
}

const state = {
  byId: {
    ada: { id: "ada", name: "Ada Lovelace" },
    grace: { id: "grace", name: "Grace Hopper" },
    margaret: { id: "margaret", name: "Margaret Hamilton" },
  },
  orderedIds: ["grace", "ada", "margaret"],
  selectedId: "missing",
  query: "  a  ",
};

const view = selectView(state);
console.log(JSON.stringify(view.visible.map(person => person.name)));
console.log(view.selected);
console.log(state.orderedIds.length);
// expected:
// ["Grace Hopper","Margaret Hamilton"]
// null
// 3`,
          `type Person = {
  id: string;
  name: string;
};

type PeopleState = {
  byId: Record<string, Person>;
  orderedIds: string[];
  selectedId: string | null;
  query: string;
};

type PeopleView = {
  visible: Person[];
  selected: Person | null;
};

function selectView(state: PeopleState): PeopleView {
  // TODO: derive { visible, selected } from this snapshot.
  // Keep orderedIds order, ignore IDs missing from byId, and apply the query.
  return { visible: [], selected: null };
}

const state: PeopleState = {
  byId: {
    ada: { id: "ada", name: "Ada Lovelace" },
    grace: { id: "grace", name: "Grace Hopper" },
    margaret: { id: "margaret", name: "Margaret Hamilton" },
  },
  orderedIds: ["grace", "ada", "margaret"],
  selectedId: "missing",
  query: "  a  ",
};

const view = selectView(state);
console.log(JSON.stringify(view.visible.map((person) => person.name)));
console.log(view.selected);
console.log(state.orderedIds.length);
// expected:
// ["Grace Hopper","Margaret Hamilton"]
// null
// 3`,
        ),
      },
      {
        id: "react-update-normalized-entity",
        title: "Update one entity with structural sharing",
        instructions: `Implement \`renamePerson(state, id, name)\`.

If the ID is missing, return the original state object. Otherwise create a new state, a new \`byId\` map, and one new person object. Preserve \`orderedIds\`, \`selectedId\`, and all untouched person identities. Do not mutate the previous snapshot.

**Expected output:** \`Amazing Grace\`, then four \`true\` lines.`,
        starterCode: reactVariants(
          `function renamePerson(state, id, name) {
  // TODO: no-op with the same reference when id is absent.
  // Otherwise copy only state, byId, and the changed person.
  return state;
}

const ada = { id: "ada", name: "Ada" };
const grace = { id: "grace", name: "Grace" };
const before = {
  byId: { ada, grace },
  orderedIds: ["ada", "grace"],
  selectedId: "grace",
};

const after = renamePerson(before, "grace", "Amazing Grace");
console.log(after.byId.grace.name);                  // expected: Amazing Grace
console.log(before.byId.grace.name === "Grace");    // expected: true
console.log(after !== before);                      // expected: true
console.log(after.byId.ada === before.byId.ada);    // expected: true
console.log(renamePerson(before, "x", "X") === before); // expected: true`,
          `type Person = {
  id: string;
  name: string;
};

type DirectoryState = {
  byId: Record<string, Person>;
  orderedIds: string[];
  selectedId: string | null;
};

function renamePerson(
  state: DirectoryState,
  id: string,
  name: string
): DirectoryState {
  // TODO: no-op with the same reference when id is absent.
  // Otherwise copy only state, byId, and the changed person.
  return state;
}

const ada: Person = { id: "ada", name: "Ada" };
const grace: Person = { id: "grace", name: "Grace" };
const before: DirectoryState = {
  byId: { ada, grace },
  orderedIds: ["ada", "grace"],
  selectedId: "grace",
};

const after = renamePerson(before, "grace", "Amazing Grace");
console.log(after.byId.grace.name);                      // expected: Amazing Grace
console.log(before.byId.grace.name === "Grace");        // expected: true
console.log(after !== before);                          // expected: true
console.log(after.byId.ada === before.byId.ada);        // expected: true
console.log(renamePerson(before, "x", "X") === before); // expected: true`,
        ),
      },
    ],
    quiz: [
      {
        id: "react-state-shape-and-derivation-q1",
        prompt:
          "A component stores `items`, `query`, and `filteredItems`. What is the best default design?",
        options: [
          "Keep all three and update `filteredItems` in every input handler",
          "Keep all three and synchronize `filteredItems` in an Effect",
          "Store `items` and `query`; derive `filteredItems` during render",
          "Store only `filteredItems` and reconstruct the source items when needed",
        ],
        answer: 2,
        explanation:
          "`filteredItems` is a deterministic projection of the same render's `items` and `query`. Deriving it removes a synchronization obligation, an inconsistent intermediate render, and an unnecessary Effect.",
      },
      {
        id: "react-state-shape-and-derivation-q2",
        prompt:
          "When a selected item also exists in an editable collection, which state shape best avoids stale duplicates?",
        options: [
          "Store the collection and `selectedId`, then derive the selected item",
          "Store both the collection item and a cloned `selectedItem` object",
          "Remove the item from the collection while it is selected",
          "Store the selected array index and sort the collection in place",
        ],
        answer: 0,
        explanation:
          "An ID represents the relationship without duplicating entity data. Looking up the item from the authoritative collection means edits and deletion are reflected in the same render.",
      },
      {
        id: "react-state-shape-and-derivation-q3",
        prompt:
          "An immutable update changes one entity in a normalized `byId` map. Which identities should normally change?",
        options: [
          "Every entity, because deep cloning is required for immutability",
          "The state, `byId` map, and changed entity; untouched entities stay identical",
          "Only the changed entity; the containing state and map should be mutated",
          "No identities, because React detects changes by comparing field values deeply",
        ],
        answer: 1,
        explanation:
          "Allocate each container on the changed path and preserve everything else. That protects previous snapshots and gives React and memoized children meaningful identity signals.",
      },
    ],
  },
  {
    id: "react-reducers-and-actions",
    module: "state-events",
    title: "Reducers as Pure Transition Systems",
    blurb:
      "Model domain events as actions, centralize invariants in a pure reducer, and test transitions without rendering.",
    content: forReact(
      (language) => `# Reducers as Pure Transition Systems

\`useReducer\` does not unlock a different kind of state. It organizes updates as a **pure transition system**:

\`\`\`text
(previous state, action describing what happened) -> next state
\`\`\`

Reach for a reducer when a state domain has several related transitions, when multiple handlers must preserve the same invariants, or when update logic has become more important than the UI code around it. A reducer is not automatically better for two independent booleans or a controlled input.

## Actions should name events or intent

Compare \`{ type: "set-field", field: "status", value: "paid" }\` with \`{ type: "payment-confirmed", paymentId }\`. The generic setter exposes the storage layout and lets callers request invalid combinations. The domain action records what happened; the reducer decides every field that must change.

${reactCode(
  language,
  `const initialState = {
  status: "draft",
  lines: [],
  paymentId: null,
  error: null,
};

function invoiceReducer(state, action) {
  switch (action.type) {
    case "line-added":
      if (state.status !== "draft") return state;
      return { ...state, lines: [...state.lines, action.line] };

    case "payment-confirmed":
      return {
        ...state,
        status: "paid",
        paymentId: action.paymentId,
        error: null,
      };

    case "payment-failed":
      return { ...state, status: "error", error: action.message };

    default:
      throw new Error("Unknown invoice action: " + action.type);
  }
}`,
  `type InvoiceLine = {
  id: string;
  description: string;
  amount: number;
};

type InvoiceState = {
  status: "draft" | "pending" | "paid" | "error";
  lines: InvoiceLine[];
  paymentId: string | null;
  error: string | null;
};

type InvoiceAction =
  | { type: "line-added"; line: InvoiceLine }
  | { type: "payment-confirmed"; paymentId: string }
  | { type: "payment-failed"; message: string };

function assertNever(value: never): never {
  throw new Error("Unhandled invoice action: " + JSON.stringify(value));
}

function invoiceReducer(
  state: InvoiceState,
  action: InvoiceAction
): InvoiceState {
  switch (action.type) {
    case "line-added":
      if (state.status !== "draft") return state;
      return { ...state, lines: [...state.lines, action.line] };

    case "payment-confirmed":
      return {
        ...state,
        status: "paid",
        paymentId: action.paymentId,
        error: null,
      };

    case "payment-failed":
      return { ...state, status: "error", error: action.message };

    default:
      return assertNever(action);
  }
}`
)}

In TypeScript, a discriminated union narrows payloads by \`action.type\`. The \`never\` check makes a new action a compile-time obligation at the switch. In JavaScript, throwing on an unknown action catches misspellings and stale callers instead of silently doing nothing. Some teams choose \`return state\` at a trust boundary; inside an application, loud failure usually finds modeling errors earlier.

## Reducers must be pure

A reducer can validate, branch, and allocate next state. It must not:

- mutate \`state\` or nested values;
- send a request, write storage, navigate, or dispatch another action;
- read time or randomness when that value affects the transition;
- depend on mutable module-level data.

React may call reducers more than once in development. More importantly, purity makes transitions replayable, testable, and compatible with concurrent rendering.

Generate nondeterministic facts before dispatch and include them in the action:

${reactCode(
  language,
  `function handleAdd(text) {
  dispatch({
    type: "task-added",
    task: { id: crypto.randomUUID(), text },
  });
}`,
  `type Task = {
  id: string;
  text: string;
  completed: boolean;
};

function handleAdd(text: string): void {
  dispatch({
    type: "task-added",
    task: {
      id: crypto.randomUUID(),
      text,
      completed: false,
    },
  });
}`
)}

The reducer receives a complete fact. Replaying the same action produces the same state. If persistence must follow, the event handler or an external orchestration layer performs it; the reducer only calculates.

## Immutable transitions, including no-ops

Return the original state when an action makes no semantic change. This is both honest and efficient:

${reactCode(
  language,
  `case "task-renamed": {
  const task = state.byId[action.id];
  if (!task || task.text === action.text) return state;

  return {
    ...state,
    byId: {
      ...state.byId,
      [action.id]: { ...task, text: action.text },
    },
  };
}`,
  `case "task-renamed": {
  const task = state.byId[action.id];
  if (!task || task.text === action.text) return state;

  return {
    ...state,
    byId: {
      ...state.byId,
      [action.id]: { ...task, text: action.text },
    },
  };
}`
)}

Do not spread state at the top before discovering there is no change; that manufactures a new identity and tells consumers that something changed when nothing did.

## Dispatch describes; it does not return next state

${reactCode(
  language,
  `function handleToggle(id) {
  dispatch({ type: "task-toggled", id });
  console.log(state); // this render's snapshot, not the reduced state
}`,
  `function handleToggle(id: string): void {
  dispatch({ type: "task-toggled", id });
  console.log(state); // this render's snapshot, not the reduced state
}`
)}

\`dispatch\` queues an action for a future render just as a state setter queues an update. It does not return next state and does not mutate the handler's snapshot. If a handler needs to decide an immediate side effect from the event, compute the needed command from event data, or extract a pure transition that can return both next state and a command. Do not call the reducer manually and then dispatch the same action unless duplicate calculation is explicitly intended.

## Reducer boundaries

A reducer should own a coherent state domain. A checkout reducer might own line items, discount application, and checkout status because their transitions share invariants. It should not absorb unrelated global theme state merely because both use \`useReducer\`.

Split reducers when domains evolve independently. Combine them only where one action genuinely coordinates them, and be aware that independently reducing two domains cannot enforce a cross-domain invariant without an orchestrator.

${reactCode(
  language,
  `function Checkout() {
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckout);

  return (
    <Cart
      lines={state.lines}
      onQuantityChanged={(id, quantity) =>
        dispatch({ type: "quantity-changed", id, quantity })
      }
    />
  );
}`,
  `type CartProps = {
  lines: CartLine[];
  onQuantityChanged: (id: string, quantity: number) => void;
};

function Checkout() {
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckout);

  return (
    <Cart
      lines={state.lines}
      onQuantityChanged={(id, quantity) =>
        dispatch({ type: "quantity-changed", id, quantity })
      }
    />
  );
}`
)}

Children receive domain callbacks rather than raw \`dispatch\` when you want to hide action vocabulary and state ownership. Passing dispatch through context can be appropriate for a feature subtree, but context is distribution, not state modeling; reducer quality still determines whether transitions are valid.

## Test the transition table directly

Reducer tests need no renderer. Arrange a previous state, apply an action, and assert:

- next values and invariants;
- previous state remains unchanged;
- untouched branches preserve identity;
- invalid or no-op actions return the original state;
- every action variant has a case.

Thinking in a transition table—current status × action → next status—often reveals impossible or missing cases before component code does. The reducer then becomes executable domain policy rather than a long setter switch.`,
    ),
    exercises: [
      {
        id: "react-design-order-reducer",
        title: "Implement an invariant-preserving order reducer",
        instructions: `Complete \`orderReducer\`.

- \`item-added\` appends an item only while status is \`draft\`.
- \`submitted\` moves a non-empty draft to \`pending\`; an empty draft is a no-op.
- \`payment-confirmed\` moves only a pending order to \`paid\` and stores the payment ID.
- \`cancelled\` moves any non-paid order to \`cancelled\`; cancelling paid or already-cancelled state is a no-op.

Never mutate state or its items. Return the original object for every no-op.

**Expected output:** \`paid:1:pay-7\`, then \`true\`, then \`draft\`.`,
        starterCode: reactVariants(
          `function orderReducer(state, action) {
  switch (action.type) {
    case "item-added":
      // TODO: append only to a draft.
      return state;
    case "submitted":
      // TODO: only a non-empty draft becomes pending.
      return state;
    case "payment-confirmed":
      // TODO: only pending becomes paid; store action.paymentId.
      return state;
    case "cancelled":
      // TODO: paid and already-cancelled are no-ops.
      return state;
    default:
      throw new Error("Unknown action: " + action.type);
  }
}

const initial = { status: "draft", items: [], paymentId: null };
const actions = [
  { type: "item-added", item: { id: "book", price: 30 } },
  { type: "submitted" },
  { type: "payment-confirmed", paymentId: "pay-7" },
];
const paid = actions.reduce(orderReducer, initial);
const cancelledPaid = orderReducer(paid, { type: "cancelled" });
const emptySubmit = orderReducer(initial, { type: "submitted" });

console.log(paid.status + ":" + paid.items.length + ":" + paid.paymentId);
console.log(cancelledPaid === paid);
console.log(emptySubmit.status);
// expected:
// paid:1:pay-7
// true
// draft`,
          `type OrderStatus = "draft" | "pending" | "paid" | "cancelled";

type OrderItem = {
  id: string;
  price: number;
};

type OrderState = {
  status: OrderStatus;
  items: OrderItem[];
  paymentId: string | null;
};

type OrderAction =
  | { type: "item-added"; item: OrderItem }
  | { type: "submitted" }
  | { type: "payment-confirmed"; paymentId: string }
  | { type: "cancelled" };

function assertNever(action: never): never {
  throw new Error("Unknown action: " + JSON.stringify(action));
}

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case "item-added":
      // TODO: append only to a draft.
      return state;
    case "submitted":
      // TODO: only a non-empty draft becomes pending.
      return state;
    case "payment-confirmed":
      // TODO: only pending becomes paid; store action.paymentId.
      return state;
    case "cancelled":
      // TODO: paid and already-cancelled are no-ops.
      return state;
    default:
      return assertNever(action);
  }
}

const initial: OrderState = { status: "draft", items: [], paymentId: null };
const actions: OrderAction[] = [
  { type: "item-added", item: { id: "book", price: 30 } },
  { type: "submitted" },
  { type: "payment-confirmed", paymentId: "pay-7" },
];
const paid = actions.reduce(orderReducer, initial);
const cancelledPaid = orderReducer(paid, { type: "cancelled" });
const emptySubmit = orderReducer(initial, { type: "submitted" });

console.log(paid.status + ":" + paid.items.length + ":" + paid.paymentId);
console.log(cancelledPaid === paid);
console.log(emptySubmit.status);
// expected:
// paid:1:pay-7
// true
// draft`,
        ),
      },
      {
        id: "react-replay-domain-actions",
        title: "Replay actions and preserve structural sharing",
        instructions: `Implement \`tasksReducer\` for \`task-added\`, \`task-toggled\`, and \`task-renamed\`.

Actions for missing IDs and renaming to the existing text are no-ops that return the same state object. Real changes allocate a new state, a new \`byId\` map, and only the changed task. Replaying the fixed action log must be deterministic.

**Expected output:** \`Write tests:true\`, then \`true\`, then \`true\`.`,
        starterCode: reactVariants(
          `function tasksReducer(state, action) {
  // TODO: implement the three domain actions immutably.
  // task-added carries action.task.
  // task-toggled carries action.id.
  // task-renamed carries action.id and action.text.
  return state;
}

function replay(initial, actions) {
  return actions.reduce(tasksReducer, initial);
}

const initial = { byId: {}, order: [] };
const actions = [
  { type: "task-added", task: { id: "t1", text: "Write", done: false } },
  { type: "task-added", task: { id: "t2", text: "Review", done: false } },
  { type: "task-toggled", id: "t1" },
  { type: "task-renamed", id: "t1", text: "Write tests" },
];
const result = replay(initial, actions);
const noRename = tasksReducer(result, {
  type: "task-renamed",
  id: "t1",
  text: "Write tests",
});

console.log(result.byId.t1?.text + ":" + result.byId.t1?.done);
console.log(result.byId.t2 === actions[1].task);
console.log(noRename === result);
// expected:
// Write tests:true
// true
// true`,
          `type Task = {
  id: string;
  text: string;
  done: boolean;
};

type TasksState = {
  byId: Record<string, Task>;
  order: string[];
};

type TasksAction =
  | { type: "task-added"; task: Task }
  | { type: "task-toggled"; id: string }
  | { type: "task-renamed"; id: string; text: string };

function tasksReducer(state: TasksState, action: TasksAction): TasksState {
  // TODO: implement the three domain actions immutably.
  // Missing IDs and same-text renames return state unchanged.
  return state;
}

function replay(initial: TasksState, actions: TasksAction[]): TasksState {
  return actions.reduce(tasksReducer, initial);
}

const initial: TasksState = { byId: {}, order: [] };
const reviewTask: Task = { id: "t2", text: "Review", done: false };
const actions: TasksAction[] = [
  { type: "task-added", task: { id: "t1", text: "Write", done: false } },
  { type: "task-added", task: reviewTask },
  { type: "task-toggled", id: "t1" },
  { type: "task-renamed", id: "t1", text: "Write tests" },
];
const result = replay(initial, actions);
const noRename = tasksReducer(result, {
  type: "task-renamed",
  id: "t1",
  text: "Write tests",
});

console.log(result.byId.t1?.text + ":" + result.byId.t1?.done);
console.log(result.byId.t2 === reviewTask);
console.log(noRename === result);
// expected:
// Write tests:true
// true
// true`,
        ),
      },
    ],
    quiz: [
      {
        id: "react-reducers-and-actions-q1",
        prompt:
          "Which action best preserves a reducer's domain boundary and invariants?",
        options: [
          '`{ type: "set-field", field: "status", value: "paid" }`',
          '`{ type: "merge-state", value: partialState }`',
          '`{ type: "set-payment-id", value: id }` followed by a status setter',
          '`{ type: "payment-confirmed", paymentId: id }`',
        ],
        answer: 3,
        explanation:
          "The domain event says what happened and lets one reducer case update status, payment ID, and related error state atomically. Generic setters expose storage and permit invalid combinations.",
      },
      {
        id: "react-reducers-and-actions-q2",
        prompt:
          "A reducer needs a generated task ID. Where should the ID normally be created?",
        options: [
          "Inside the reducer so action payloads stay small",
          "Before dispatch, with the generated ID included in the action",
          "In an Effect that mutates the task after the reducer commits",
          "During render and stored in a module-level variable",
        ],
        answer: 1,
        explanation:
          "Random ID generation is nondeterministic. Putting the resulting fact in the action keeps the reducer pure and makes replaying the same action log produce the same state.",
      },
      {
        id: "react-reducers-and-actions-q3",
        prompt:
          "What should a reducer return when a rename targets a missing entity or supplies its existing name?",
        options: [
          "A deep clone, to prove the action was processed",
          "A shallow copy with an incremented internal revision",
          "The original state object, because no semantic change occurred",
          "`undefined`, so React can skip the update",
        ],
        answer: 2,
        explanation:
          "A semantic no-op should preserve identity. It avoids false change signals and accurately communicates that the transition left state untouched.",
      },
    ],
  },
];
