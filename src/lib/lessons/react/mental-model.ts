import type { Lesson } from "../types";
import { forReact, reactCode, reactVariants } from "./shared";

export const mentalModelLessons: Lesson[] = [
  {
    id: "react-elements-components-props",
    module: "mental-model",
    title: "Elements, Components, Props, and Children",
    blurb:
      "Treat elements as immutable UI descriptions and components as React-managed calculations over props.",
    content: forReact(
      (language) => `# Elements are descriptions, not instances

A React element is an immutable description of what should appear: a type, props, and the children carried in those props. JSX creates these values; it does not create a DOM node, mount a component, or call a lifecycle. React can inspect an element later, compare it with the previous render's output, and decide what to commit.

This distinction matters whenever code tries to treat JSX as a mutable widget. Once an element has been created, consider its props frozen. To describe different UI, create a new element during another render rather than editing the old one.

${reactCode(
  language,
  `function Avatar({ person, size = 40 }) {
  return (
    <img
      src={person.avatarUrl}
      width={size}
      height={size}
      alt={person.name}
    />
  );
}

function Profile({ person }) {
  const compactAvatar = <Avatar person={person} size={32} />;
  return (
    <section>
      {compactAvatar}
      <h2>{person.name}</h2>
    </section>
  );
}`,
  `type Person = {
  id: string;
  name: string;
  avatarUrl: string;
};

type AvatarProps = {
  person: Person;
  size?: number;
};

function Avatar({ person, size = 40 }: AvatarProps) {
  return (
    <img
      src={person.avatarUrl}
      width={size}
      height={size}
      alt={person.name}
    />
  );
}

function Profile({ person }: { person: Person }) {
  const compactAvatar = <Avatar person={person} size={32} />;
  return (
    <section>
      {compactAvatar}
      <h2>{person.name}</h2>
    </section>
  );
}`
)}

\`compactAvatar\` is a value describing an \`Avatar\`; it is not a mounted Avatar object. Reusing that value in JSX is safe because the description is immutable. React owns the eventual component instance and host nodes.

## Components are called by React

A function component defines how to calculate elements from its current inputs. Write \`<Avatar ... />\`, not \`Avatar(...)\`. Direct invocation bypasses React's component boundary and makes Hook ordering, component identity, debugging, and future scheduling depend on ordinary control flow. React must be the code that decides when to call a component.

Component functions are therefore unlike constructors or template factories you invoke to obtain a persistent instance. React may call them more than once, call them and discard the result, or not call them when it can safely reuse prior work. The return value is a description for that render, not an instruction to mutate the page immediately.

## Props are read-only inputs

Props belong to the render that received them. A component must not assign to a prop or mutate an object merely because it arrived through props. Mutation would alter data owned by the caller and make the component's output depend on call history. If the UI needs a changed value, the owner queues state and passes a new prop snapshot in a later render.

Default parameter values apply when a prop is \`undefined\`; they do not make the prop mutable. In the example, \`size\` is a local binding derived from props. Changing the \`person\` object itself would still be an ownership violation.

## \`children\` is composition data

Nested JSX arrives through the \`children\` prop. A wrapper should usually place that value rather than infer private facts about the elements inside it:

${reactCode(
  language,
  `function Panel({ heading, children }) {
  return (
    <section aria-labelledby="panel-heading">
      <h2 id="panel-heading">{heading}</h2>
      <div>{children}</div>
    </section>
  );
}

export default function Account() {
  return (
    <Panel heading="Account">
      <Avatar
        person={{ id: "a1", name: "Ada", avatarUrl: "/ada.png" }}
      />
      <button>Manage profile</button>
    </Panel>
  );
}`,
  `import type { ReactNode } from "react";

type PanelProps = {
  heading: string;
  children: ReactNode;
};

function Panel({ heading, children }: PanelProps) {
  return (
    <section aria-labelledby="panel-heading">
      <h2 id="panel-heading">{heading}</h2>
      <div>{children}</div>
    </section>
  );
}

export default function Account() {
  return (
    <Panel heading="Account">
      <Avatar
        person={{ id: "a1", name: "Ada", avatarUrl: "/ada.png" }}
      />
      <button>Manage profile</button>
    </Panel>
  );
}`
)}

\`Panel\` does not call, clone, or mutate its children. It accepts an opaque renderable value and chooses where it belongs. This keeps data ownership explicit: the parent chooses the content, the wrapper owns the surrounding structure, and React interprets the resulting element tree.`
    ),
    exercises: [],
    quiz: [
      {
        id: "react-elements-components-props-q1",
        prompt:
          "A variable holds `const row = <Result item={item} />`. What does `row` represent at that point?",
        options: [
          "An immutable React element describing a future `Result` in the UI",
          "A mounted `Result` instance with a DOM node",
          "The DOM subtree returned by running `Result` immediately",
          "A mutable template whose props React expects callers to edit",
        ],
        answer: 0,
        explanation:
          "JSX creates an element description. React later decides when to call `Result` and what, if anything, to commit; creating the element neither mounts a component nor creates DOM.",
      },
      {
        id: "react-elements-components-props-q2",
        prompt:
          "Why should application code render `<Widget value={value} />` instead of calling `Widget({ value })`?",
        options: [
          "JSX automatically memoizes every component call",
          "React must own the component boundary so Hook order, identity, and scheduling remain valid",
          "Direct calls always return DOM nodes rather than elements",
          "Function components accept props only when JSX supplies them",
        ],
        answer: 1,
        explanation:
          "A direct function call hides the component from React and folds its Hooks and identity into the caller. JSX leaves React in control of when and how the component is rendered.",
      },
      {
        id: "react-elements-components-props-q3",
        prompt:
          "A `Panel` receives nested JSX through `children`. Which design best matches React's composition model?",
        options: [
          "Mutate each child element's props before returning it",
          "Call every child component function to obtain its current DOM",
          "Treat `children` as renderable input and place it at the panel's intended slot",
          "Copy `children` into state so its identity survives every parent render",
        ],
        answer: 2,
        explanation:
          "`children` is a prop carrying renderable values. A compositional wrapper normally places it without mutating elements, invoking component functions, or mirroring it into state.",
      },
    ],
  },
  {
    id: "react-render-commit-paint",
    module: "mental-model",
    title: "Trigger, Render, Commit, Paint",
    blurb:
      "Separate requested updates, pure render work, atomic commits, and the browser's eventual paint.",
    content: forReact(
      (language) => `# Four moments, four different guarantees

React code becomes much easier to reason about when “update the screen” is split into distinct stages:

1. **Trigger:** the initial root render or a queued state update asks React to render.
2. **Render:** React calls components and calculates a candidate element tree.
3. **Commit:** React applies the necessary host changes for the accepted tree.
4. **Paint:** the browser draws the committed result.

Calling a state setter does not synchronously mutate the DOM and it does not change the state variable in the currently running handler. It queues work. React then renders from a state snapshot and, if that render wins, commits its result.

${reactCode(
  language,
  `import {
  useState,
  useTransition,
  type ChangeEvent,
} from "react";

function Search({ products }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(event) {
    const next = event.target.value;
    setQuery(next);
    startTransition(() => {
      setFilter(next);
    });
  }

  const visible = products.filter((product) =>
    product.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <span>Updating results…</span>}
      <ProductList products={visible} />
    </>
  );
}`,
  `import { useState, useTransition } from "react";

type Product = {
  id: string;
  name: string;
};

type SearchProps = {
  products: Product[];
};

function Search({ products }: SearchProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setQuery(next);
    startTransition(() => {
      setFilter(next);
    });
  }

  const visible = products.filter((product) =>
    product.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <span>Updating results…</span>}
      <ProductList products={visible} />
    </>
  );
}`
)}

The input update is urgent; the filter update is a Transition. React may begin rendering a filtered list, interrupt that render for another keystroke, and restart with fresher state. A superseded candidate can be discarded without committing. This is why render code must not send requests, mutate caches, increment global counters, or otherwise treat “component was called” as “the user saw this.”

Interruptibility is a property of concurrent render work, not of every line of React code. Event handlers run normally. Once React starts committing an accepted tree, the commit is synchronous and is not a partially visible, interruptible draft. Transition rendering can be interrupted by more urgent work; a Transition also cannot control a text input, which is why the example keeps the input's \`query\` state urgent.

## Render computes; commit mutates

During render, React recursively calls the relevant components and computes what should change. A render may produce exactly the same host output as before; React can then commit no DOM changes. “The component rendered” and “the DOM changed” are not equivalent claims.

During commit, React applies host mutations and updates refs. Code that needs to measure layout must run in \`useLayoutEffect\`, which runs after DOM changes but before the browser repaints and therefore blocks paint. Prefer \`useEffect\` for synchronization that does not require pre-paint layout:

${reactCode(
  language,
  `import { useEffect, useLayoutEffect, useRef } from "react";

function PositionedPopover({ anchorId, onMeasured }) {
  const popoverRef = useRef(null);

  useLayoutEffect(() => {
    const rect = popoverRef.current.getBoundingClientRect();
    onMeasured(rect);
  }, [anchorId, onMeasured]);

  useEffect(() => {
    const connection = analytics.connect("popover");
    return () => connection.disconnect();
  }, []);

  return <aside ref={popoverRef}>Details</aside>;
}`,
  `import { useEffect, useLayoutEffect, useRef } from "react";

type PositionedPopoverProps = {
  anchorId: string;
  onMeasured: (rect: DOMRect) => void;
};

function PositionedPopover({
  anchorId,
  onMeasured,
}: PositionedPopoverProps) {
  const popoverRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const rect = popoverRef.current!.getBoundingClientRect();
    onMeasured(rect);
  }, [anchorId, onMeasured]);

  useEffect(() => {
    const connection = analytics.connect("popover");
    return () => connection.disconnect();
  }, []);

  return <aside ref={popoverRef}>Details</aside>;
}`
)}

Do not use “after render” as a synonym for either Effect timing. Layout Effects run as part of the commit path before paint. Passive Effects generally run after the browser paints, but React may run an interaction-caused Effect before paint; code that must wait for paint needs an explicit browser scheduling mechanism. Effects are for synchronizing committed React state with external systems, never for making render itself valid.

Logs are especially deceptive: a log in a component proves that render work ran, not that its output committed or painted. Put observable external work behind events or Effects with correct cleanup, and use the profiler rather than render logs to infer what users actually received.`
    ),
    exercises: [],
    quiz: [
      {
        id: "react-render-commit-paint-q1",
        prompt:
          "A component logged during a Transition render, but that render was superseded by an urgent update. What can be concluded?",
        options: [
          "Its DOM changes were committed and then immediately reverted",
          "Its passive Effects completed before the urgent update",
          "The browser painted its output for at least one frame",
          "React called the component, but the candidate output may never have committed",
        ],
        answer: 3,
        explanation:
          "Concurrent render work may be interrupted and discarded. A render-phase log only proves the component function ran; commit, Effects, and paint are separate events.",
      },
      {
        id: "react-render-commit-paint-q2",
        prompt:
          "Which work belongs in the render phase of a component?",
        options: [
          "A pure calculation of elements from the current props and state snapshot",
          "Writing the calculated selection directly into the DOM",
          "Opening a subscription that remains active after commit",
          "Incrementing a module-level analytics counter",
        ],
        answer: 0,
        explanation:
          "Render must be restartable and discardable, so it can only calculate output. DOM writes happen in commit, while subscriptions and analytics belong in Effects or events as appropriate.",
      },
      {
        id: "react-render-commit-paint-q3",
        prompt:
          "A tooltip must measure its newly committed DOM and update position before the user sees it. Which timing is designed for that requirement?",
        options: [
          "A state setter called while the tooltip renders",
          "`useLayoutEffect`, used sparingly because it runs after DOM mutation and blocks paint",
          "`useEffect`, which is guaranteed to run after every browser paint",
          "A Transition, because transition commits are interruptible",
        ],
        answer: 1,
        explanation:
          "`useLayoutEffect` runs after the DOM has been committed but before repaint, allowing measurement and a synchronous follow-up. It blocks paint, so non-layout synchronization should use `useEffect`.",
      },
    ],
  },
  {
    id: "react-purity-state-snapshots",
    module: "mental-model",
    title: "Purity, State Snapshots, and Strict Mode",
    blurb:
      "Make render replay-safe, reason from fixed state snapshots, and let Strict Mode expose hidden impurities.",
    content: forReact(
      (language) => `# Render is a replayable calculation

React assumes components and Hooks are pure during render: the same props, state, and context produce the same JSX, and rendering does not mutate values created outside that render. Local mutation of a fresh array is fine; mutation of a prop, module singleton, cache, or previously stored object is not.

Purity is an execution requirement, not style advice. React 19.2 can render work more than once, interleave it with other work, or abandon it. A render-time side effect would then happen a different number of times than commits.

${reactCode(
  language,
  `function RecipeList({ recipes }) {
  const rows = [];

  for (const recipe of recipes) {
    rows.push(
      <li key={recipe.id}>
        {recipe.title} · {recipe.minutes} min
      </li>
    );
  }

  return <ul>{rows}</ul>;
}`,
  `import type { ReactNode } from "react";

type Recipe = {
  id: string;
  title: string;
  minutes: number;
};

function RecipeList({ recipes }: { recipes: readonly Recipe[] }) {
  const rows: ReactNode[] = [];

  for (const recipe of recipes) {
    rows.push(
      <li key={recipe.id}>
        {recipe.title} · {recipe.minutes} min
      </li>
    );
  }

  return <ul>{rows}</ul>;
}`
)}

\`rows.push\` is safe because \`rows\` was allocated by this render and cannot affect an earlier or concurrent render. In contrast, pushing into \`recipes\` or a module-level array would make output depend on how often and in what order React called the component.

## State is fixed within one render

Each render receives a snapshot of state. Event handlers created by that render close over that snapshot. Calling a setter queues another render; it does not rewrite the state variable inside the already-running handler.

${reactCode(
  language,
  `import { useState } from "react";

function Score() {
  const [score, setScore] = useState(0);

  function addOne() {
    setScore(score + 1);
    setScore(score + 1);
    setScore(score + 1);
  }

  function addThree() {
    setScore((current) => current + 1);
    setScore((current) => current + 1);
    setScore((current) => current + 1);
  }

  return (
    <>
      <output>{score}</output>
      <button onClick={addOne}>Add one</button>
      <button onClick={addThree}>Add three</button>
    </>
  );
}`,
  `import { useState } from "react";

function Score() {
  const [score, setScore] = useState<number>(0);

  function addOne(): void {
    setScore(score + 1);
    setScore(score + 1);
    setScore(score + 1);
  }

  function addThree(): void {
    setScore((current) => current + 1);
    setScore((current) => current + 1);
    setScore((current) => current + 1);
  }

  return (
    <>
      <output>{score}</output>
      <button onClick={addOne}>Add one</button>
      <button onClick={addThree}>Add three</button>
    </>
  );
}`
)}

In one click, every \`setScore(score + 1)\` computes the same replacement from the same captured \`score\`, so the net result is one increment. Functional updaters are queued and applied in order to the pending value, so three \`current => current + 1\` updates compose to three increments. Use an updater whenever next state depends on pending state.

Batching lets React process multiple queued updates before rendering, but the snapshot rule is more fundamental: even without guessing batching boundaries, code in this handler continues to see the render that created it. If later work needs the next value immediately, calculate it in a local variable; do not expect the state binding to change.

State objects follow the same ownership rule as props. Never mutate an object already held in state and pass that same reference back. Construct the next value so old render snapshots remain trustworthy:

${reactCode(
  language,
  `function renameUser(nextName) {
  setUser((current) => ({
    ...current,
    name: nextName,
  }));
}`,
  `function renameUser(nextName: string): void {
  setUser((current: User): User => ({
    ...current,
    name: nextName,
  }));
}`
)}

## Strict Mode is an impurity detector

In development, root-level \`<StrictMode>\` intentionally performs extra checks: it re-renders component logic an extra time, re-runs Effects through an extra setup-and-cleanup cycle, and re-runs ref callbacks. These checks do not run in production. They are designed to expose work that lacks cleanup or changes external state during render.

Do not “fix” a duplicate development symptom with a ref that suppresses the second call. Fix the violated contract: move user-caused work into the event, move external synchronization into an Effect, and return cleanup that fully undoes setup. Strict Mode does not guarantee that production renders happen exactly once; concurrent rendering is an independent reason render must remain pure.`
    ),
    exercises: [
      {
        id: "react-state-update-queue",
        title: "Model React's state update queue",
        instructions:
          "Complete `applyUpdates(initial, updates)`. A number replaces the pending state; a function derives the next state from the pending state produced by earlier updates. Process left to right without mutating the input array. This pure model explains why repeated snapshot-based replacements collapse while updater functions compose. The scaffold must print `1`, `3`, then `7`.",
        starterCode: reactVariants(
          `function applyUpdates(initial, updates) {
  // TODO: process each update from left to right.
  // A function receives the current pending state.
  // A number replaces the current pending state.
  return initial;
}

const snapshot = 0;
console.log(applyUpdates(snapshot, [
  snapshot + 1,
  snapshot + 1,
  snapshot + 1,
])); // expected: 1

console.log(applyUpdates(snapshot, [
  (current) => current + 1,
  (current) => current + 1,
  (current) => current + 1,
])); // expected: 3

console.log(applyUpdates(2, [
  (current) => current * 2,
  10,
  (current) => current - 3,
])); // expected: 7`,
          `type StateUpdate =
  | number
  | ((current: number) => number);

function applyUpdates(
  initial: number,
  updates: readonly StateUpdate[]
): number {
  // TODO: process each update from left to right.
  // A function receives the current pending state.
  // A number replaces the current pending state.
  return initial;
}

const snapshot = 0;
console.log(applyUpdates(snapshot, [
  snapshot + 1,
  snapshot + 1,
  snapshot + 1,
])); // expected: 1

console.log(applyUpdates(snapshot, [
  (current) => current + 1,
  (current) => current + 1,
  (current) => current + 1,
])); // expected: 3

console.log(applyUpdates(2, [
  (current) => current * 2,
  10,
  (current) => current - 3,
])); // expected: 7`
        ),
      },
    ],
    quiz: [
      {
        id: "react-purity-state-snapshots-q1",
        prompt:
          "Which mutation is compatible with a pure component render?",
        options: [
          "Appending to an array received through props",
          "Incrementing a module-level render counter",
          "Filling a new local array allocated during this render",
          "Changing a field on the object currently stored in state",
        ],
        answer: 2,
        explanation:
          "A fresh local value is owned by this calculation and cannot corrupt another snapshot. Props, prior state, and module-level values outlive the render and must not be mutated by it.",
      },
      {
        id: "react-purity-state-snapshots-q2",
        prompt:
          "Starting from `count === 0`, one handler queues `setCount(count + 1)` three times. Why is the resulting count normally 1 rather than 3?",
        options: [
          "React ignores all setter calls after the first call in a handler",
          "Only updater functions can trigger a render",
          "Strict Mode rolls back two of the three updates",
          "All three replacements were calculated from the handler's same `count === 0` snapshot",
        ],
        answer: 3,
        explanation:
          "The handler closes over one render's fixed snapshot, so each expression queues the replacement value 1. To compose three increments, queue three functional updaters.",
      },
      {
        id: "react-purity-state-snapshots-q3",
        prompt:
          "An Effect connects to a service twice during initial development under Strict Mode. What is the correct response?",
        options: [
          "Return complete cleanup from the Effect so the extra setup-cleanup cycle is harmless",
          "Disable Strict Mode because production always runs every Effect exactly once",
          "Use a ref to permanently suppress all setup after the first call",
          "Move the connection into the component body so it shares render timing",
        ],
        answer: 0,
        explanation:
          "Strict Mode deliberately probes Effect cleanup in development. Correct synchronization can be set up, cleaned up, and set up again; suppressing the probe hides leaks rather than fixing them.",
      },
    ],
  },
  {
    id: "react-reconciliation-keys-state",
    module: "mental-model",
    title: "Reconciliation, Keys, and State Identity",
    blurb:
      "Predict state preservation and reset from component type, tree position, and stable sibling keys.",
    content: forReact(
      (language) => `# State belongs to a place in the tree

State is not stored inside a function call or JSX variable. React associates it with a component's identity at a position in the rendered tree. On the next render, reconciliation matches the new element tree against the previous one. A compatible component at the same identity keeps its state; an incompatible identity is unmounted and a new state lifetime begins.

Without explicit keys, sibling position participates in identity. At one position, replacing one component type with another resets that position's subtree. Keeping the same component type there preserves its state even when props change.

${reactCode(
  language,
  `import { useState } from "react";

function PlayerScore({ player }) {
  const [score, setScore] = useState(0);
  return (
    <section>
      <h2>{player.name}</h2>
      <output>{score}</output>
      <button onClick={() => setScore((value) => value + 1)}>
        Point
      </button>
    </section>
  );
}

function Scoreboard({ activePlayer }) {
  return (
    <PlayerScore
      key={activePlayer.id}
      player={activePlayer}
    />
  );
}`,
  `import { useState } from "react";

type Player = {
  id: string;
  name: string;
};

function PlayerScore({ player }: { player: Player }) {
  const [score, setScore] = useState<number>(0);
  return (
    <section>
      <h2>{player.name}</h2>
      <output>{score}</output>
      <button onClick={() => setScore((value) => value + 1)}>
        Point
      </button>
    </section>
  );
}

function Scoreboard({ activePlayer }: { activePlayer: Player }) {
  return (
    <PlayerScore
      key={activePlayer.id}
      player={activePlayer}
    />
  );
}`
)}

If \`activePlayer\` changes from Ada to Lin, the component type and JSX position are unchanged, but the key changes. React therefore treats the score panel as a different identity, unmounts the old lifetime, and initializes score to zero. Remove the key and the same position/type preserves one score state while only the \`player\` prop changes. Neither behavior is universally right: choose identity to match the product's ownership semantics.

A key is not passed to the component as a normal prop. If \`PlayerScore\` needs the id, pass \`player\` or a separate \`playerId\` prop as well.

## Keys identify siblings, not records globally

For a dynamic list, keys let React match siblings across insertions, deletions, and reordering:

${reactCode(
  language,
  `function DraftList({ drafts, onChange }) {
  return (
    <ul>
      {drafts.map((draft) => (
        <DraftRow
          key={draft.id}
          draft={draft}
          onChange={onChange}
        />
      ))}
    </ul>
  );
}`,
  `type Draft = {
  id: string;
  subject: string;
};

type DraftListProps = {
  drafts: readonly Draft[];
  onChange: (id: string, subject: string) => void;
};

function DraftList({ drafts, onChange }: DraftListProps) {
  return (
    <ul>
      {drafts.map((draft) => (
        <DraftRow
          key={draft.id}
          draft={draft}
          onChange={onChange}
        />
      ))}
    </ul>
  );
}`
)}

\`draft.id\` is stable data identity. If the list is reordered, React can associate each \`DraftRow\` with the same logical draft and preserve its local state and host nodes where appropriate.

An array index is only a safe key when membership and order are truly static and the items have no identity beyond position. If an item is inserted at the front, index keys cause every following row to inherit the identity previously attached to that position. Local input state can then appear beside the wrong record.

\`Math.random()\` and other render-time key generation are worse: every render creates new identities, forcing remounts, losing local state and focus, and defeating reuse. Keys need only be unique among siblings, but they must be stable for the lifetime of the corresponding data.

## Position means the rendered tree, not source formatting

React reasons about the tree returned for this render. Two conditional branches can still describe the same position:

${reactCode(
  language,
  `function Editor({ compact }) {
  return compact
    ? <DraftForm density="compact" />
    : <DraftForm density="comfortable" />;
}

function ResettableEditor({ document }) {
  return (
    <DraftForm
      key={document.id}
      initialDocument={document}
    />
  );
}`,
  `type EditorProps = {
  compact: boolean;
};

function Editor({ compact }: EditorProps) {
  return compact
    ? <DraftForm density="compact" />
    : <DraftForm density="comfortable" />;
}

type ResettableEditorProps = {
  document: DocumentDraft;
};

function ResettableEditor({ document }: ResettableEditorProps) {
  return (
    <DraftForm
      key={document.id}
      initialDocument={document}
    />
  );
}`
)}

Changing \`compact\` preserves \`DraftForm\` state because the same component type occupies the same returned position; only a prop changes. Changing \`document.id\` deliberately resets the keyed form.

Component type identity must also be stable. Defining a component function inside another component creates a new function on every render. React sees a different type, remounts that subtree, and resets its state. Declare component types at module scope unless you intentionally need a different type—and use a key, not a freshly declared component, when the real intent is an explicit reset.

The practical test is: “Does this next element represent the same conceptual state owner?” Encode yes with stable type, position, and key; encode no by changing type or key.`
    ),
    exercises: [],
    quiz: [
      {
        id: "react-reconciliation-keys-state-q1",
        prompt:
          "A single `<Editor document={active} />` remains at the same tree position while `active.id` changes. No key is present. What happens to Editor's local state?",
        options: [
          "It always resets because every prop change creates a component instance",
          "It is preserved because the component type and unkeyed tree position still match",
          "It is moved into the `active` object by reconciliation",
          "It is preserved only if the parent is wrapped in `memo`",
        ],
        answer: 1,
        explanation:
          "Props may change without changing component identity. At the same unkeyed position and type, React preserves the state lifetime; use `key={active.id}` when switching documents should reset it.",
      },
      {
        id: "react-reconciliation-keys-state-q2",
        prompt:
          "Why can array indexes produce wrong-row state after inserting an item at the start of a list?",
        options: [
          "React requires keys to be UUIDs rather than numbers",
          "Index keys force React to sort the underlying data",
          "Each old identity remains attached to its position, which now represents a different record",
          "Index keys are passed as props and overwrite each row's state",
        ],
        answer: 2,
        explanation:
          "After insertion, the record at each index changes while the key at that position does not. React can preserve a row's local state under the wrong record; stable record IDs keep identity aligned with data.",
      },
      {
        id: "react-reconciliation-keys-state-q3",
        prompt:
          "What is the most direct way to reset a form's entire local state when switching from document A to document B?",
        options: [
          "Copy every incoming prop into separate state variables",
          "Generate `Math.random()` as the form key on every render",
          "Declare the form component inside its parent so its type changes",
          "Render the stable form type with `key={document.id}`",
        ],
        answer: 3,
        explanation:
          "A stable data key intentionally creates one state lifetime per document. Random keys reset on unrelated renders, and nested component definitions create accidental type churn rather than explicit identity.",
      },
    ],
  },
];
