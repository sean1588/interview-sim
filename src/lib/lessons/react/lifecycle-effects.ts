import type { Lesson } from "../types";
import { forReact, reactCode } from "./shared";

export const lifecycleEffectsLessons: Lesson[] = [
  {
    id: "react-effect-lifecycle",
    module: "lifecycle-effects",
    title: "Effects Synchronize Independent Lifecycles",
    blurb:
      "Model an Effect as one synchronization process that can start and stop repeatedly.",
    content: forReact(
      (language) => `## An Effect is not a lifecycle callback

The class-era vocabulary—“mount,” “update,” and “unmount”—describes a component. It is a poor primary model for an Effect. An Effect describes **one synchronization process** between React state and something React does not control: a connection, browser API, media player, analytics system, or third-party widget.

Ask two questions:

1. How does this synchronization **start**?
2. How does the same synchronization **stop or undo itself**?

React may run that start/stop cycle many times while the component remains mounted. Each Effect should therefore be understandable as an independent process, not as a branch over the component's age.

${reactCode(
  language,
  `import { useEffect } from "react";

function ChatRoom({ serverUrl, roomId }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();

    return () => {
      connection.disconnect();
    };
  }, [serverUrl, roomId]);

  return <RoomView roomId={roomId} />;
}`,
  `import { useEffect } from "react";

type ChatRoomProps = {
  serverUrl: string;
  roomId: string;
};

function ChatRoom({ serverUrl, roomId }: ChatRoomProps) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();

    return () => {
      connection.disconnect();
    };
  }, [serverUrl, roomId]);

  return <RoomView roomId={roomId} />;
}`
)}

This Effect does not mean “connect on mount.” It means “keep a connection synchronized with this \`serverUrl\` and \`roomId\`.” That statement remains correct if either value changes ten times.

## The exact sequence

Rendering calculates a proposed UI. Effects do not run during render: render must stay pure, and React may pause, restart, or abandon it. Once React commits a render, it updates the host tree. Passive Effects are then scheduled.

For one committed Effect:

- On its first committed appearance, React runs **setup**.
- After a later commit where a dependency changed, React runs the **previous render's cleanup**, then the **new render's setup**.
- When the component leaves the committed tree, React runs the final cleanup.
- A render that is abandoned before commit never starts its Effect.

For room A changing to room B, the conceptual trace is:

\`\`\`text
commit room A -> connect(A)
commit room B -> disconnect(A) -> connect(B)
unmount      -> disconnect(B)
\`\`\`

Cleanup closes over the values and resources from the render that created it. That is exactly what you want: the cleanup for A owns connection A, even though the latest props now describe B.

## Split by synchronization concern

Unrelated work should not share an Effect merely because it happens at the same component milestone. If a chat connection depends on \`roomId\` while analytics depends on \`pageName\`, combining them reconnects chat when only analytics changes.

${reactCode(
  language,
  `import { useEffect } from "react";

function RoomPage({ roomId, pageName }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  useEffect(() => {
    reportPageView(pageName);
  }, [pageName]);

  return <Room roomId={roomId} />;
}`,
  `import { useEffect } from "react";

type RoomPageProps = {
  roomId: string;
  pageName: string;
};

function RoomPage({ roomId, pageName }: RoomPageProps) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  useEffect(() => {
    reportPageView(pageName);
  }, [pageName]);

  return <Room roomId={roomId} />;
}`
)}

Also ask whether an Effect is needed at all. Deriving filtered data belongs in render; changing state because a user clicked belongs in the event handler. Effects are for synchronization caused by the component being **on screen with particular values**, not a general-purpose “after render” escape hatch.

## A concise class mapping—and its limit

A class subscription often had to be spread across:

| Class method | Typical responsibility |
| --- | --- |
| \`componentDidMount\` | subscribe using initial props |
| \`componentDidUpdate\` | compare props, unsubscribe old, subscribe new |
| \`componentWillUnmount\` | unsubscribe final resource |

One Effect's setup and cleanup can cover those responsibilities. That is a useful migration map, but not the governing mental model. The class methods grouped unrelated work by **component milestone**; Effects group code by **synchronization concern**. “Keep this subscription aligned with these inputs” scales better than “what should all my systems do after an update?”`,
    ),
    exercises: [],
    quiz: [
      {
        id: "react-effect-lifecycle-q1",
        prompt:
          "What is the best primary mental model for a `useEffect` that manages a chat connection?",
        options: [
          "A synchronization process that starts and stops as its reactive inputs change",
          "A functional replacement for `componentDidMount`",
          "A callback guaranteed to run once after the first render",
          "A place to perform any work that should not occur inside JSX",
        ],
        answer: 0,
        explanation:
          "The Effect keeps an external connection synchronized with current inputs. It may perform many setup-cleanup cycles while the component remains mounted.",
      },
      {
        id: "react-effect-lifecycle-q2",
        prompt:
          "After a committed render changes an Effect dependency, what happens to that Effect?",
        options: [
          "The new setup runs, then React cleans up the previous setup",
          "React runs the previous cleanup, then runs setup from the new render",
          "React runs both setups and delays cleanup until unmount",
          "React destroys and remounts the whole component",
        ],
        answer: 1,
        explanation:
          "Cleanup owns the resource created by the previous render, so React stops that synchronization before starting the one described by the new committed render.",
      },
      {
        id: "react-effect-lifecycle-q3",
        prompt: "When does an Effect from an abandoned render run?",
        options: [
          "Immediately when React calls the component",
          "After the next successful render commits",
          "Never; Effects start only for committed renders",
          "Only its cleanup runs, to restore purity",
        ],
        answer: 2,
        explanation:
          "Render is speculative and must remain pure. React starts Effects only after a render has committed, so abandoned renders create no external synchronization to clean up.",
      },
    ],
  },
  {
    id: "react-effect-dependencies",
    module: "lifecycle-effects",
    title: "Dependencies Describe the Synchronization",
    blurb:
      "Treat the dependency list as a proof of reactive reads, with Object.is comparison semantics.",
    content: forReact(
      (language) => `## Dependencies are not a scheduling preference

The dependency array is a declaration of every **reactive value** the Effect reads: props, state, and variables or functions declared directly in the component body. You do not choose dependencies to obtain a desired frequency. The Effect's code determines them.

The \`exhaustive-deps\` lint rule is therefore a correctness check. If an Effect reads \`roomId\`, omitting \`roomId\` does not make the code “run once”; it makes the Effect keep synchronizing with a value from an old render.

${reactCode(
  language,
  `import { useEffect } from "react";

function ChatRoom({ roomId }) {
  const serverUrl = "https://chat.example.com";

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  return <h1>Room {roomId}</h1>;
}`,
  `import { useEffect } from "react";

type ChatRoomProps = { roomId: string };

function ChatRoom({ roomId }: ChatRoomProps) {
  const serverUrl = "https://chat.example.com";

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  return <h1>Room {roomId}</h1>;
}`
)}

\`serverUrl\` is constant across renders, so it can be moved outside the component to make its non-reactivity structurally obvious. \`roomId\` is a prop and must be listed. A ref object returned by \`useRef\` and a state setter have stable identities; the linter knows they need not trigger an Effect.

## React compares each dependency with Object.is

After a commit, React compares each dependency with its previous value using \`Object.is\`:

- Most primitives behave as expected.
- \`Object.is(NaN, NaN)\` is \`true\`.
- \`Object.is(0, -0)\` is \`false\`.
- Objects, arrays, and functions compare by identity, not structure.

A fresh object literal is different on every render, even if its fields are equal. This is why “the dependency array didn't change” must mean identity under \`Object.is\`, not deep equality.

${reactCode(
  language,
  `function ChatRoom({ roomId }) {
  useEffect(() => {
    const options = {
      serverUrl: "https://chat.example.com",
      roomId,
    };
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  return <Room roomId={roomId} />;
}`,
  `type ChatRoomProps = { roomId: string };

function ChatRoom({ roomId }: ChatRoomProps) {
  useEffect(() => {
    const options = {
      serverUrl: "https://chat.example.com",
      roomId,
    };
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  return <Room roomId={roomId} />;
}`
)}

Creating \`options\` inside setup removes an accidental object dependency. The Effect now depends on the primitive \`roomId\` that actually controls the connection.

This is often better than reflexively wrapping \`options\` in \`useMemo\`. Memoization can be appropriate when stable identity is itself part of an API contract or an expensive value is reused, but it should not camouflage a synchronization design that can be expressed with primitive dependencies.

## Repair the code, not the lint rule

When the linter reports a missing or unstable dependency, use the warning as design feedback:

1. **No external synchronization?** Delete the Effect and derive during render or handle the action in an event.
2. **A value is truly constant?** Move it outside the component.
3. **An object/function is needed only by setup?** Create it inside the Effect.
4. **State is updated from previous state?** A functional updater can avoid reading that state.
5. **Some logic should observe the latest value without making the Effect reactive to it?** Use an Effect Event only when that separation is semantically real; it is not a general dependency loophole.
6. **The value really controls synchronization?** Include it and make cleanup/setup correct.

${reactCode(
  language,
  `import { useEffect, useState } from "react";

function Ticker({ step }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(current => current + step);
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  return <output>{count}</output>;
}`,
  `import { useEffect, useState } from "react";

type TickerProps = { step: number };

function Ticker({ step }: TickerProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id: ReturnType<typeof setInterval> = setInterval(() => {
      setCount(current => current + step);
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  return <output>{count}</output>;
}`
)}

The updater means the interval does not read \`count\`, so \`count\` is not a dependency. It still reads \`step\`; changing \`step\` must replace the interval callback. Disabling the rule would hide that distinction.`,
    ),
    exercises: [],
    quiz: [
      {
        id: "react-effect-dependencies-q1",
        prompt:
          "An Effect depends on an object literal created in the component body. Its fields are unchanged, but the Effect reruns. Why?",
        options: [
          "React deep-compares it and conservatively reruns on objects",
          "Objects are always treated as unsafe dependencies",
          "The linter forces all object Effects to run after every commit",
          "React uses `Object.is`; each render created a different object identity",
        ],
        answer: 3,
        explanation:
          "Dependency comparison is `Object.is`, not structural equality. Moving an object used only by setup inside the Effect often reveals the primitive dependencies that matter.",
      },
      {
        id: "react-effect-dependencies-q2",
        prompt: "What does the `exhaustive-deps` warning usually mean?",
        options: [
          "The Effect reads a reactive value that its synchronization declaration does not include",
          "React cannot optimize the component without `useMemo`",
          "The Effect needs an empty array to avoid an infinite loop",
          "The dependency list has too many primitive values",
        ],
        answer: 0,
        explanation:
          "Dependencies are determined by reactive reads. The warning exposes a likely stale closure or unstable design; repair the code rather than suppressing the rule.",
      },
      {
        id: "react-effect-dependencies-q3",
        prompt:
          "Why can `setCount(current => current + step)` remove `count` but not `step` from an interval Effect's dependencies?",
        options: [
          "State is never reactive inside timer callbacks",
          "The updater receives current state without closing over `count`, while the callback still reads the render's `step`",
          "React treats all setter arguments as non-reactive",
          "`step` is a prop and props must always be dependencies, even when unread",
        ],
        answer: 1,
        explanation:
          "A functional updater avoids a read of the rendered `count`. The interval callback still closes over `step`, so that value continues to control the synchronization.",
      },
    ],
  },
  {
    id: "react-stale-closures-effect-events",
    module: "lifecycle-effects",
    title: "Render Closures and Effect Events",
    blurb:
      "Understand stale reads first, then isolate genuinely non-reactive Effect logic with React 19.2 Effect Events.",
    content: forReact(
      (language) => `## Every render creates a closure

A component invocation gets a snapshot of props and state. Functions created during that invocation—including Effect setup, cleanup, timers, and event listeners—close over that snapshot. State does not mutate inside an existing closure when React renders again.

This property is valuable: setup and cleanup agree about which resources they own. It also creates stale reads when long-lived callbacks are installed once but expected to observe changing values.

${reactCode(
  language,
  `import { useEffect, useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}`,
  `import { useEffect, useState } from "react";

function Counter() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const id: ReturnType<typeof setInterval> = setInterval(() => {
      console.log(count);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}`
)}

The interval logs the initial \`count\` forever. The empty array did not make \`count\` stable; it prevented React from replacing the callback that captured the old value. If the interval's semantics are “restart when \`count\` changes,” add \`count\`. If it updates state from prior state, use a functional updater. If it should remain connected yet inspect a latest value, React 19.2 offers a more precise tool.

## Effect Events separate reactive and non-reactive logic

The \`useEffectEvent\` API is stable in React 19.2. It declares logic that is **called from an Effect** but should not itself make that Effect resynchronize. An Effect Event always reads the latest props and state when invoked. The returned function does not have stable identity; it is intentionally omitted from dependency arrays and must not be passed around as a general callback.

Consider page-visit analytics. A URL change is the event being observed; the current cart size is metadata sampled at that moment. Adding \`cart.length\` to the Effect would incorrectly report another page visit whenever the cart changes.

${reactCode(
  language,
  `import { useEffect, useEffectEvent } from "react";

function Page({ url, cart }) {
  const onVisit = useEffectEvent(visitedUrl => {
    logVisit(visitedUrl, cart.length);
  });

  useEffect(() => {
    onVisit(url);
  }, [url]);

  return <PageContent />;
}`,
  `import { useEffect, useEffectEvent } from "react";

type CartItem = { id: string };
type PageProps = {
  url: string;
  cart: CartItem[];
};

function Page({ url, cart }: PageProps) {
  const onVisit = useEffectEvent((visitedUrl: string) => {
    logVisit(visitedUrl, cart.length);
  });

  useEffect(() => {
    onVisit(url);
  }, [url]);

  return <PageContent />;
}`
)}

\`url\` is passed as an argument because it defines what happened and must remain reactive. \`cart.length\` is read by the Effect Event as latest non-reactive metadata. Effect Events are intentionally omitted from dependency arrays; current React lint tooling understands that.

## A narrow tool, not a lint escape hatch

Use an Effect Event only when you can state a real semantic split:

- **Reactive Effect body:** which values should stop and restart synchronization?
- **Non-reactive Effect Event:** which latest values should be observed when that synchronization emits or performs an action?

${reactCode(
  language,
  `import { useEffect, useEffectEvent } from "react";

function ChatRoom({ roomId, theme }) {
  const onConnected = useEffectEvent(() => {
    showNotification("Connected", theme);
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on("connected", () => onConnected());
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  return <Room roomId={roomId} />;
}`,
  `import { useEffect, useEffectEvent } from "react";

type ChatRoomProps = {
  roomId: string;
  theme: Theme;
};

function ChatRoom({ roomId, theme }: ChatRoomProps) {
  const onConnected = useEffectEvent(() => {
    showNotification("Connected", theme);
  });

  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on("connected", () => onConnected());
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);

  return <Room roomId={roomId} />;
}`
)}

Changing \`theme\` should alter the next notification, not reconnect the room. Changing \`roomId\` must reconnect, so hiding it inside the Effect Event would be a bug.

Keep Effect Events local to their Effect and call them only from Effect logic. Do not pass them to children or custom Hooks as general callbacks, do not use them for user events, and do not move ordinary reactive reads into one merely to silence \`exhaustive-deps\`. Their purpose is to make the reactive boundary explicit, not invisible.

Finally, refs can also hold a latest value, but manually updating and reading \`.current\` is less declarative and invisible to the dependency linter. Refs remain appropriate for imperative handles and mutable resources; Effect Events communicate “latest value in non-reactive Effect logic” directly.`,
    ),
    exercises: [],
    quiz: [
      {
        id: "react-stale-closures-effect-events-q1",
        prompt:
          "Why does an interval installed by an Effect with `[]` keep reading the initial state value?",
        options: [
          "Timers run outside React and cannot access updated state",
          "React freezes state objects after the first commit",
          "Its callback closes over the state snapshot from the render that installed it",
          "Empty dependency arrays convert state reads to refs",
        ],
        answer: 2,
        explanation:
          "Each render creates new closures over that render's snapshot. Preventing setup from rerunning leaves the original timer callback—and its original snapshot—installed.",
      },
      {
        id: "react-stale-closures-effect-events-q2",
        prompt:
          "When is `useEffectEvent` appropriate in React 19.2?",
        options: [
          "Whenever adding the linter's requested dependency would rerun an Effect",
          "For any callback that needs stable identity when passed to a child",
          "As a replacement for event handlers such as `onClick`",
          "For non-reactive logic called from an Effect that must read the latest props or state",
        ],
        answer: 3,
        explanation:
          "Effect Events express a semantic split: reactive values govern resynchronization, while non-reactive Effect logic can sample latest values when invoked.",
      },
      {
        id: "react-stale-closures-effect-events-q3",
        prompt:
          "A chat connection must reconnect for `roomId` changes but only use the latest `theme` in a connected notification. Which design is correct?",
        options: [
          "Keep `roomId` as an Effect dependency and read `theme` inside a local Effect Event",
          "Read both values inside an Effect Event and use `[]`",
          "Depend on both values so a theme change reconnects",
          "Store both values in refs and disable `exhaustive-deps`",
        ],
        answer: 0,
        explanation:
          "`roomId` controls the external connection and is reactive. `theme` only decorates a future notification, so it can be read as latest non-reactive data by the Effect Event.",
      },
    ],
  },
  {
    id: "react-effect-cleanup-strict-mode",
    module: "lifecycle-effects",
    title: "Cleanup Must Survive Strict Mode",
    blurb:
      "Design subscriptions and timers as symmetric, idempotent processes that pass React's development probe.",
    content: forReact(
      (language) => `## Strict Mode probes the contract

With Strict Mode enabled in development, React deliberately performs an extra **setup → cleanup → setup** sequence when an Effect first starts. This is not two production mounts and not a bug to suppress. It probes whether cleanup fully reverses setup.

The user should not be able to distinguish:

\`\`\`text
production:  setup
development: setup -> cleanup -> setup
\`\`\`

If development produces two listeners, two intervals, a flicker, or a connection that cannot reopen, the Effect already has a lifecycle bug. Navigation away and back, dependency changes, error recovery, and preserved UI state can expose the same defect in production.

## Subscriptions require the same target and handler

${reactCode(
  language,
  `import { useEffect } from "react";

function NetworkStatus({ source }) {
  useEffect(() => {
    function handleStatus(status) {
      sourceStatusChanged(status);
    }

    source.subscribe(handleStatus);
    return () => {
      source.unsubscribe(handleStatus);
    };
  }, [source]);

  return <StatusIndicator />;
}`,
  `import { useEffect } from "react";

type Status = "online" | "offline";
type StatusSource = {
  subscribe(handler: (status: Status) => void): void;
  unsubscribe(handler: (status: Status) => void): void;
};

function NetworkStatus({ source }: { source: StatusSource }) {
  useEffect(() => {
    function handleStatus(status: Status): void {
      sourceStatusChanged(status);
    }

    source.subscribe(handleStatus);
    return () => {
      source.unsubscribe(handleStatus);
    };
  }, [source]);

  return <StatusIndicator />;
}`
)}

The cleanup uses the exact \`source\` and \`handleStatus\` captured by its setup. On a source change, the old pair is removed before the new pair is installed.

Cleanup should be safe to call once for every successful setup. APIs such as \`clearInterval\`, \`AbortController.abort\`, and many unsubscribe functions are naturally idempotent—repeating them has no additional effect. If an external API is not, track its resource handle carefully and guard its state at the adapter boundary.

## Timers are resources too

${reactCode(
  language,
  `import { useEffect, useState } from "react";

function AutosaveIndicator({ savedAt }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return <time>{formatAge(now - savedAt)}</time>;
}`,
  `import { useEffect, useState } from "react";

type AutosaveIndicatorProps = { savedAt: number };

function AutosaveIndicator({ savedAt }: AutosaveIndicatorProps) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id: ReturnType<typeof setInterval> = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return <time>{formatAge(now - savedAt)}</time>;
}`
)}

The functional behavior of this timer needs no reactive render value, so \`[]\` is honest. Strict Mode creates interval 1, clears interval 1, then creates interval 2. Only interval 2 remains active. Omitting \`clearInterval\` leaks interval 1 immediately in development and leaks every interval after real remounts.

## Cleanup must mirror setup, not perform unrelated work

A reliable review method is to pair each setup operation with its inverse:

| Setup | Cleanup |
| --- | --- |
| \`subscribe(handler)\` | \`unsubscribe(handler)\` |
| \`addEventListener(type, handler, options)\` | same target/type/handler/options removed |
| \`setInterval(...)\` | \`clearInterval(id)\` |
| \`connect()\` | \`disconnect()\` |
| start request | abort it or make its result irrelevant |

Do not use a ref such as \`didRun.current\` to suppress the second setup. That only hides the failed probe: cleanup still has not demonstrated that the process can stop and restart.

Avoid setting ordinary component state in cleanup. Cleanup is about disposing the synchronization created by that Effect; on unmount, a state update has nowhere meaningful to render, and before reruns it often causes extra work or stale transitions. Update external resource ownership, not presentation state.

Some irreversible actions cannot be made symmetric. A purchase request belongs in the click handler, where it occurs once per user intent—not in an Effect that runs because a screen appeared. Analytics may legitimately be duplicated in development; use development filtering or an idempotency key if the receiving system requires deduplication, rather than weakening the Effect lifecycle.`,
    ),
    exercises: [],
    quiz: [
      {
        id: "react-effect-cleanup-strict-mode-q1",
        prompt:
          "What does Strict Mode's development-only setup-cleanup-setup sequence test?",
        options: [
          "Whether setup executes quickly enough before paint",
          "Whether cleanup fully reverses setup so the process can restart safely",
          "Whether the component can preserve state through server rendering",
          "Whether every Effect can be replaced by an event handler",
        ],
        answer: 1,
        explanation:
          "The extra cycle is a stress test for symmetry. A correct Effect leaves one active resource after either the production sequence or the development probe.",
      },
      {
        id: "react-effect-cleanup-strict-mode-q2",
        prompt:
          "A subscription still fires twice after Strict Mode's initial probe. What is the likely defect?",
        options: [
          "Strict Mode always leaves both setups active",
          "The dependency array should contain the handler",
          "Cleanup did not remove the exact subscription created by setup",
          "The subscription should be moved to render",
        ],
        answer: 2,
        explanation:
          "React cleans up the first setup before the second. Duplicate callbacks indicate that cleanup omitted the unsubscribe or used a different target, event type, options, or handler identity.",
      },
      {
        id: "react-effect-cleanup-strict-mode-q3",
        prompt:
          "Why is a `didRun` ref that suppresses the second Strict Mode setup usually wrong?",
        options: [
          "Refs are reset between the probe's two setups",
          "It forces the Effect to become reactive",
          "React forbids reading refs from Effects",
          "It hides an inability to stop and restart the synchronization instead of fixing cleanup",
        ],
        answer: 3,
        explanation:
          "The probe represents real restart scenarios. Suppression may quiet development symptoms, but the lifecycle defect remains for dependency changes, navigation, and remounting.",
      },
    ],
  },
  {
    id: "react-async-effects-races",
    module: "lifecycle-effects",
    title: "Async Effects, Races, and Data Ownership",
    blurb:
      "Prevent stale request results with ignore or abort, and know why application data belongs above leaf Effects.",
    content: forReact(
      (language) => `## The Effect callback itself is synchronous

An Effect setup may start asynchronous work, but the setup function must return either nothing or a cleanup function. An \`async\` function always returns a Promise, so do not write \`useEffect(async () => ...)\`. Define and call an inner async function instead.

The deeper problem is not syntax; it is ownership over time. Suppose \`person\` changes from Alice to Bob:

\`\`\`text
request Alice starts
request Bob starts
request Bob resolves -> show Bob
request Alice resolves -> stale Alice overwrites Bob
\`\`\`

Network completion order is unrelated to render order. A correct Effect must prevent a superseded request from committing its result.

## Ignore stale results

${reactCode(
  language,
  `import { useEffect, useState } from "react";

function Bio({ person }) {
  const [bio, setBio] = useState(null);

  useEffect(() => {
    let ignore = false;
    setBio(null);

    async function loadBio() {
      const result = await fetchBio(person);
      if (!ignore) {
        setBio(result);
      }
    }

    loadBio();
    return () => {
      ignore = true;
    };
  }, [person]);

  return <p>{bio ?? "Loading..."}</p>;
}`,
  `import { useEffect, useState } from "react";

type BioProps = { person: string };

function Bio({ person }: BioProps) {
  const [bio, setBio] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setBio(null);

    async function loadBio(): Promise<void> {
      const result: string = await fetchBio(person);
      if (!ignore) {
        setBio(result);
      }
    }

    void loadBio();
    return () => {
      ignore = true;
    };
  }, [person]);

  return <p>{bio ?? "Loading..."}</p>;
}`
)}

Each setup owns its own \`ignore\` binding. Cleanup for Alice flips Alice's binding; Bob's remains \`false\`. The Alice request may still consume bandwidth, but it cannot overwrite state.

Production code also needs an error path. Handle expected failures, but ignore an error belonging to a superseded request just as you ignore its success. Avoid converting an abort into a visible error.

## Abort work when the API supports it

${reactCode(
  language,
  `import { useEffect, useState } from "react";

function UserCard({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;
    setUser(null);

    async function loadUser() {
      try {
        const response = await fetch(\`/api/users/\${userId}\`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Request failed");
        const nextUser = await response.json();
        if (!ignore) setUser(nextUser);
      } catch (error) {
        if (!controller.signal.aborted && !ignore) {
          reportError(error);
        }
      }
    }

    loadUser();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [userId]);

  return user ? <Profile user={user} /> : <Spinner />;
}`,
  `import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
};

function UserCard({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;
    setUser(null);

    async function loadUser(): Promise<void> {
      try {
        const response = await fetch(\`/api/users/\${userId}\`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Request failed");
        const nextUser = (await response.json()) as User;
        if (!ignore) setUser(nextUser);
      } catch (error: unknown) {
        if (!controller.signal.aborted && !ignore) {
          reportError(error);
        }
      }
    }

    void loadUser();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [userId]);

  return user ? <Profile user={user} /> : <Spinner />;
}`
)}

Aborting saves work when honored by the transport. The ignore guard still protects the state boundary: not every promise is abortable, work may progress between await points, and a wrapper may not propagate the signal correctly. Think of abort as resource cancellation and ignore as stale-result correctness.

## Why framework data APIs and caches are usually better

Fetching directly in leaf Effects is valid for small client-only integrations, but it is a weak default for application data:

- Effects do not run during server rendering, so the initial HTML has no data.
- Parent Effects run before child Effects, encouraging network waterfalls.
- Remounts refetch unless you build deduplication and caching.
- Navigation cannot preload data before the component renders.
- Race handling, retries, invalidation, and stale-data policy get duplicated.

A React framework's server data APIs, route loaders, or a client cache can start requests earlier, deduplicate by key, retain results across remounts, preload routes, and define invalidation centrally. The best race is often one the architecture prevents by assigning request ownership above the leaf component.

Use an Effect when synchronizing with a data source truly follows the component's presence and no higher-level facility owns that data. Even then, make cleanup explicitly invalidate or cancel every request generation.`,
    ),
    exercises: [],
    quiz: [
      {
        id: "react-async-effects-races-q1",
        prompt:
          "Why should the function passed directly to `useEffect` not be `async`?",
        options: [
          "Effect setup must return nothing or cleanup, while an async function returns a Promise",
          "React cannot schedule microtasks from an Effect",
          "Async functions capture stale props but normal functions do not",
          "Fetch is only supported in event handlers",
        ],
        answer: 0,
        explanation:
          "Start async work from a synchronous setup function so that React receives cleanup immediately. An async setup would return a Promise, which is not a cleanup function.",
      },
      {
        id: "react-async-effects-races-q2",
        prompt:
          "What correctness guarantee does an `ignore` flag scoped to each Effect setup provide?",
        options: [
          "It forces requests to resolve in render order",
          "Cleanup marks a superseded generation so its eventual result cannot update state",
          "It deduplicates identical HTTP requests across components",
          "It cancels network transfer at the browser level",
        ],
        answer: 1,
        explanation:
          "The old setup's cleanup mutates the binding captured by that old request. It does not cancel transport; it prevents stale completion from committing state.",
      },
      {
        id: "react-async-effects-races-q3",
        prompt:
          "Why are framework data APIs or client caches generally preferable to fetching application data in leaf Effects?",
        options: [
          "They make every network request synchronous",
          "React forbids more than one fetch Effect per component tree",
          "They can support server rendering, preload, deduplication, caching, and avoid parent-child waterfalls",
          "They remove the need to define stale-data and invalidation policies",
        ],
        answer: 2,
        explanation:
          "Higher-level ownership can begin work before leaf Effects, share requests and results, render data on the server, and centralize lifecycle policies. It does not eliminate policy; it gives policy a coherent home.",
      },
    ],
  },
  {
    id: "react-layout-effects-and-ref-timing",
    module: "lifecycle-effects",
    title: "Layout Effects, Callback Refs, and Paint",
    blurb:
      "Use commit-phase timing only when visual correctness requires measurement before paint.",
    content: forReact(
      (language) => `## Commit, layout, paint, passive Effects

Most Effects should use \`useEffect\`. Passive Effects do not block the browser's paint and usually run after the updated UI is visible. React may vary passive Effect timing around interactions, so do not use \`useEffect\` as a precision paint clock; its important property is that visual measurement does not block paint.

\`useLayoutEffect\` has a narrower contract. It runs after React has committed host updates and attached refs, but before the browser repaints. State updates scheduled there are processed before paint, allowing a measure-and-correct pass without displaying the incorrect geometry.

\`\`\`text
render -> commit DOM changes and refs -> layout Effects -> browser paint -> passive Effects
\`\`\`

That pre-paint guarantee has a cost: layout Effects and their synchronous state updates block painting. On a busy tree they create visible jank. Use them only when the user would otherwise see an incorrect frame.

## Measure only when visual correctness requires it

${reactCode(
  language,
  `import { useLayoutEffect, useRef, useState } from "react";

function Tooltip({ targetRect, children }) {
  const tooltipRef = useRef(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const nextHeight =
      tooltipRef.current?.getBoundingClientRect().height ?? 0;
    setHeight(nextHeight);
  }, [children]);

  const top =
    targetRect.top - height < 0
      ? targetRect.bottom
      : targetRect.top - height;

  return (
    <div ref={tooltipRef} style={{ position: "fixed", top }}>
      {children}
    </div>
  );
}`,
  `import {
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type TooltipProps = {
  targetRect: DOMRect;
  children: ReactNode;
};

function Tooltip({ targetRect, children }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number>(0);

  useLayoutEffect(() => {
    const nextHeight =
      tooltipRef.current?.getBoundingClientRect().height ?? 0;
    setHeight(nextHeight);
  }, [children]);

  const top =
    targetRect.top - height < 0
      ? targetRect.bottom
      : targetRect.top - height;

  return (
    <div ref={tooltipRef} style={{ position: "fixed", top }}>
      {children}
    </div>
  );
}`
)}

React first commits the tooltip with an unknown height, attaches \`tooltipRef\`, then runs the layout Effect. The measurement updates state, React commits the corrected position, and the browser paints. The user sees only the final position.

This is appropriate for geometry that changes placement. It is not appropriate for fetching, logging, subscriptions unrelated to layout, or work that can happen after paint. CSS should solve layout whenever it can; it is more robust than measuring in JavaScript.

## Callback refs participate in the commit

A ref object tells you the current node but does not notify you that the node changed. A callback ref is invoked during commit when a node is attached, before layout Effects for that commit. On detach, React runs the cleanup returned by a React 19 callback ref; callbacks that return no cleanup are called with \`null\`. It is useful when setup is tied to the identity of a particular node.

${reactCode(
  language,
  `import { useCallback, useState } from "react";

function MeasuredPanel({ children }) {
  const [height, setHeight] = useState(0);

  const panelRef = useCallback(node => {
    if (node === null) return;
    setHeight(node.getBoundingClientRect().height);
    const observer = new ResizeObserver(entries => {
      setHeight(entries[0].contentRect.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section>
      <div ref={panelRef}>{children}</div>
      <output>Height: {height}px</output>
    </section>
  );
}`,
  `import {
  type ReactNode,
  useCallback,
  useState,
} from "react";

function MeasuredPanel({ children }: { children: ReactNode }) {
  const [height, setHeight] = useState<number>(0);

  const panelRef = useCallback((node: HTMLDivElement | null) => {
    if (node === null) return;
    setHeight(node.getBoundingClientRect().height);
    const observer = new ResizeObserver(entries => {
      setHeight(entries[0].contentRect.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section>
      <div ref={panelRef}>{children}</div>
      <output>Height: {height}px</output>
    </section>
  );
}`
)}

Memoizing the callback prevents React from detaching and reattaching it solely because a new function identity was rendered. The returned React 19 ref cleanup disconnects the observer before that node is detached or the callback changes.

A callback ref is not a replacement for every Effect. Use it when the external operation is fundamentally “a node appeared or changed identity.” Use a layout Effect when several committed refs or reactive values must be coordinated before paint. Use a passive Effect when waiting until after paint is acceptable.

## Restraint and server rendering

\`useLayoutEffect\` cannot measure during server rendering because no layout exists there. Components whose first render requires client geometry should either render a stable fallback, rely on CSS, or be limited to a client-only boundary. Do not blanket-replace \`useEffect\` to silence visual uncertainty.

The decision is practical:

- If delaying until after paint cannot produce a visible defect, use \`useEffect\`.
- If a committed node identity itself starts the integration, consider a callback ref.
- If measurement must change the very next painted frame, use \`useLayoutEffect\` and keep its work minimal.
- If CSS can express the relationship, use CSS and remove the timing problem entirely.`,
    ),
    exercises: [],
    quiz: [
      {
        id: "react-layout-effects-and-ref-timing-q1",
        prompt:
          "Which ordering best describes a committed visual update?",
        options: [
          "Layout Effect, render, commit, paint, callback ref",
          "Render, passive Effect, commit, layout Effect, paint",
          "Render, paint, commit and refs, layout Effect, passive Effect",
          "Render, commit and refs, layout Effect, paint, then passive Effect in the usual case",
        ],
        answer: 3,
        explanation:
          "Layout Effects run after host updates and refs are committed but before paint. Passive Effects do not block paint and usually run afterward, though they are not a precision paint-timing API.",
      },
      {
        id: "react-layout-effects-and-ref-timing-q2",
        prompt:
          "When is `useLayoutEffect` justified over `useEffect`?",
        options: [
          "When measurement must synchronously correct the next painted frame",
          "Whenever an Effect reads a ref",
          "For all browser event subscriptions",
          "When data fetching should begin before render",
        ],
        answer: 0,
        explanation:
          "Layout Effects block paint, so reserve them for visual correctness such as measure-and-position work where an after-paint correction would visibly flicker.",
      },
      {
        id: "react-layout-effects-and-ref-timing-q3",
        prompt:
          "What timing capability does a callback ref provide that a ref object alone does not?",
        options: [
          "It runs during render before React creates the node",
          "It notifies code during commit when a node attaches or detaches",
          "It guarantees passive Effects run before paint",
          "It makes server-side layout measurement possible",
        ],
        answer: 1,
        explanation:
          "React invokes callback refs with the node during commit and with `null` on detach. That directly signals node identity changes before layout Effects for the commit.",
      },
    ],
  },
];
