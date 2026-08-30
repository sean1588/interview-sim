import type { Lesson } from "../types";
import { forReact, reactCode, reactVariants } from "./shared";

export const productionPatternsLessons: Lesson[] = [
  {
    id: "react-data-fetching-ownership",
    module: "production-patterns",
    title: "Data Fetching Has an Owner",
    blurb:
      "Put reads and writes behind a request-aware cache instead of rebuilding a data system in Effects.",
    content: forReact(
      (language) => `## React renders data; it does not define your data policy

React 19.2 gives you primitives that can display pending work (\`Suspense\` and \`use\`), memoize work during Server Component rendering (\`cache\`), and model mutations (\`useActionState\`, Actions, and optimistic state). It does **not** decide:

- how long a response stays fresh;
- whether two browser components share one request;
- how route navigation starts requests;
- how a mutation invalidates, patches, or rolls back cached data;
- whether a failed request retries; or
- whether data is authorized for the current user.

Those are cache, router, and framework contracts. In production, choose one owner for each resource: commonly a route loader/server renderer for route data and a client cache for live browser data. Components should consume that owner's result instead of independently starting the same request.

## Start work before the leaf renders

Fetching in an Effect is **fetch-on-render**: the parent renders, commits, fetches, renders a child, then the child commits and fetches. A 100 ms parent request followed by a 100 ms child request costs at least 200 ms before either network overhead or rendering.

A route or cache can discover the full requirement earlier and start independent reads together:

${reactCode(
  language,
  `import { Suspense, cache, use } from "react";

// React core: cache memoizes this function during one Server Component request.
// Cross-request freshness and invalidation still belong to the framework/cache.
const getProduct = cache(async (id) => {
  const response = await fetch("/internal/products/" + id);
  if (!response.ok) throw new Error("Product request failed");
  return response.json();
});

async function ProductHeading({ id }) {
  const product = await getProduct(id);
  return <h1>{product.name}</h1>;
}

async function ProductStock({ id }) {
  const product = await getProduct(id); // same primitive argument: deduplicated
  return <p>{product.inStock ? "In stock" : "Back order"}</p>;
}

export default function ProductPage({ id }) {
  return (
    <Suspense fallback={<p>Loading product…</p>}>
      <ProductHeading id={id} />
      <ProductStock id={id} />
    </Suspense>
  );
}`,
  `import { Suspense, cache } from "react";

type Product = { id: string; name: string; inStock: boolean };

// React core: cache memoizes this function during one Server Component request.
// Cross-request freshness and invalidation still belong to the framework/cache.
const getProduct = cache(async (id: string): Promise<Product> => {
  const response = await fetch("/internal/products/" + id);
  if (!response.ok) throw new Error("Product request failed");
  return response.json() as Promise<Product>;
});

async function ProductHeading({ id }: { id: string }) {
  const product = await getProduct(id);
  return <h1>{product.name}</h1>;
}

async function ProductStock({ id }: { id: string }) {
  const product = await getProduct(id); // same primitive argument: deduplicated
  return <p>{product.inStock ? "In stock" : "Back order"}</p>;
}

export default function ProductPage({ id }: { id: string }) {
  return (
    <Suspense fallback={<p>Loading product…</p>}>
      <ProductHeading id={id} />
      <ProductStock id={id} />
    </Suspense>
  );
}`
)}

\`cache\` is a **React core API for Server Component rendering**, not a general browser cache and not permanent storage. Its arguments are compared by identity, so two fresh objects such as \`{ id }\` are different cache keys. Pass stable primitives or deliberately shared objects. A framework may also deduplicate \`fetch\`, persist results across requests, preload routes, or revalidate tags; none of those behaviors follows from React itself. Read that framework's cache contract before relying on it.

If two requests are independent, initiate both before awaiting either. If B genuinely needs A's result, the sequence is real; put a Suspense boundary around the dependent region so unrelated UI can stream. Moving requests into child Effects does not remove a waterfall—it hides the dependency until after commit.

## Client reads need a cache contract too

A cache-owned promise can be passed to a component and read with React's \`use\`:

${reactCode(
  language,
  `import { Suspense, use } from "react";

function Product({ productPromise }) {
  const product = use(productPromise);
  return <h2>{product.name}</h2>;
}

export function ProductRegion({ productPromise }) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Product productPromise={productPromise} />
    </Suspense>
  );
}`,
  `import { Suspense, use } from "react";

type ProductData = { id: string; name: string };

function Product({ productPromise }: { productPromise: Promise<ProductData> }) {
  const product = use(productPromise);
  return <h2>{product.name}</h2>;
}

export function ProductRegion({
  productPromise,
}: {
  productPromise: Promise<ProductData>;
}) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Product productPromise={productPromise} />
    </Suspense>
  );
}`
)}

The important part is where \`productPromise\` came from: a route loader, Server Component, or client cache that preserves promise identity. Creating a new promise during every client render restarts work and defeats Suspense. React can read a promise; the owner must stabilize, deduplicate, expire, and retry it.

## Races are a data-owner problem

The familiar Effect cleanup guard prevents an obsolete response from calling \`setState\`:

${reactCode(
  language,
  `import { useEffect, useState } from "react";

function SearchResult({ query }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    let ignore = false;
    fetchResult(query).then((next) => {
      if (!ignore) setResult(next);
    });
    return () => {
      ignore = true;
    };
  }, [query]);

  return result ? <Result value={result} /> : <p>Loading…</p>;
}`,
  `import { useEffect, useState } from "react";

type ResultData = { title: string };

function SearchResult({ query }: { query: string }) {
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    let ignore = false;
    fetchResult(query).then((next: ResultData) => {
      if (!ignore) setResult(next);
    });
    return () => {
      ignore = true;
    };
  }, [query]);

  return result ? <Result value={result} /> : <p>Loading…</p>;
}`
)}

That guard is valid React, but it only suppresses one stale state update. It does not deduplicate requests, populate server HTML, retain data across remounts, coordinate consumers, cancel network work, or define retry behavior. A cache can key the result by \`query\`, share in-flight work, and ensure late completion for key A never overwrites key B.

Mutations need the same ownership. A complete mutation protocol is: authorize and write at the source, identify the affected cache keys, invalidate or patch them, reconcile the server result, and roll back an optimistic patch only if that mutation still owns it. Without mutation identity, a slow failure from edit 1 can undo the successful edit 2. React's optimistic and Action APIs manage UI transitions; framework APIs usually perform server execution and revalidation. Keep that distinction explicit.

## Production checklist

1. Name the owner of each resource and the exact cache key.
2. Start independent reads in parallel; preserve real dependent sequences.
3. Know whether deduplication is per render, per request, per tab, or persistent.
4. Treat authorization as a source-side check, never as a cached UI decision.
5. Define mutation invalidation, optimistic ordering, rollback, and retry together.
6. Keep Effect fetching for genuinely component-scoped synchronization or small unmanaged integrations—not as the default route-data architecture.`,
    ),
    exercises: [],
    quiz: [
      {
        id: "react-data-fetching-ownership-q1",
        prompt:
          "Two Server Components call the same function wrapped in React `cache` with the same string argument. What does React core guarantee?",
        options: [
          "The function is memoized within the current Server Component request; persistent freshness remains an external policy",
          "The result is stored across deployments until a mutation invalidates it",
          "Every browser tab shares the result through React's global cache",
          "The underlying HTTP response is always cached according to its response headers",
        ],
        answer: 0,
        explanation:
          "React `cache` provides request-scoped memoization for Server Component rendering. Cross-request persistence, HTTP caching, and invalidation are framework or cache-layer behavior.",
      },
      {
        id: "react-data-fetching-ownership-q2",
        prompt:
          "Why is an ignore flag in a fetching Effect insufficient as the application's data architecture?",
        options: [
          "It works only in production because Strict Mode runs Effects twice",
          "It suppresses one stale update but does not provide deduplication, caching, SSR, or mutation coordination",
          "It prevents React from batching updates from the resolved promise",
          "It turns every request into a blocking render",
        ],
        answer: 1,
        explanation:
          "The cleanup guard is useful for that Effect's race, but it does not own resource identity, in-flight sharing, server rendering, retries, freshness, or writes.",
      },
      {
        id: "react-data-fetching-ownership-q3",
        prompt:
          "After an optimistic rename, an older mutation fails after a newer rename succeeds. What prevents the old failure from clobbering the new value?",
        options: [
          "Wrapping both mutations in the same Suspense boundary",
          "Using object arguments with React `cache`",
          "Tracking mutation identity/version so rollback applies only while that mutation owns the optimistic state",
          "Moving the mutation call from an event handler into an Effect",
        ],
        answer: 2,
        explanation:
          "Optimistic updates are ordered writes. The data owner must associate rollback with a specific mutation/version and reconcile it against newer committed state.",
      },
    ],
  },
  {
    id: "react-external-stores",
    module: "production-patterns",
    title: "External Stores Without Tearing",
    blurb:
      "Adapt mutable systems to React with stable subscriptions and cached snapshots.",
    content: forReact(
      (language) => `## The adapter is a consistency contract

\`useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)\` is React's core bridge to state that lives outside React: a Redux-like store, a browser API, a websocket-backed model, or a legacy observable. It is not a store implementation. It tells React how to:

1. read one coherent snapshot;
2. subscribe to future changes; and
3. reproduce the server snapshot during hydration.

React may call these functions repeatedly and at inconvenient times. Their identities and return values are therefore part of correctness, not micro-optimizations.

${reactCode(
  language,
  `import { useSyncExternalStore } from "react";

const onlineStore = {
  subscribe(listener) {
    window.addEventListener("online", listener);
    window.addEventListener("offline", listener);
    return () => {
      window.removeEventListener("online", listener);
      window.removeEventListener("offline", listener);
    };
  },
  getSnapshot() {
    return navigator.onLine;
  },
  getServerSnapshot() {
    return true; // the server and first hydration read must agree
  },
};

export function ConnectionBadge() {
  const online = useSyncExternalStore(
    onlineStore.subscribe,
    onlineStore.getSnapshot,
    onlineStore.getServerSnapshot,
  );
  return <p>{online ? "Online" : "Offline"}</p>;
}`,
  `import { useSyncExternalStore } from "react";

const onlineStore = {
  subscribe(listener: () => void): () => void {
    window.addEventListener("online", listener);
    window.addEventListener("offline", listener);
    return () => {
      window.removeEventListener("online", listener);
      window.removeEventListener("offline", listener);
    };
  },
  getSnapshot(): boolean {
    return navigator.onLine;
  },
  getServerSnapshot(): boolean {
    return true; // the server and first hydration read must agree
  },
};

export function ConnectionBadge() {
  const online = useSyncExternalStore(
    onlineStore.subscribe,
    onlineStore.getSnapshot,
    onlineStore.getServerSnapshot,
  );
  return <p>{online ? "Online" : "Offline"}</p>;
}`
)}

Defining \`subscribe\` outside the component keeps its function identity stable. If a component creates a new \`subscribe\` function on every render, React must unsubscribe and resubscribe. If subscription truly depends on props, memoize that function with \`useCallback\` and include the dependency deliberately.

The subscribe callback means **“something may have changed”**. It should not carry the new value. React calls \`getSnapshot\` and compares its return value with the previous one using \`Object.is\`.

## Snapshot identity is load-bearing

For immutable stores, return the current immutable value. When no store change occurred, \`getSnapshot\` must return the exact same object:

${reactCode(
  language,
  `let snapshot = Object.freeze({ count: 0 });
const listeners = new Set();

export const counterStore = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return snapshot;
  },
  increment() {
    snapshot = Object.freeze({ count: snapshot.count + 1 });
    listeners.forEach((listener) => listener());
  },
};`,
  `type CounterSnapshot = Readonly<{ count: number }>;

let snapshot: CounterSnapshot = Object.freeze({ count: 0 });
const listeners = new Set<() => void>();

export const counterStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): CounterSnapshot {
    return snapshot;
  },
  increment(): void {
    snapshot = Object.freeze({ count: snapshot.count + 1 });
    listeners.forEach((listener) => listener());
  },
};`
)}

Returning \`{ count: mutableStore.count }\` on every call is wrong: a fresh object always looks changed and can cause a render loop. Returning one object while mutating it in place is also wrong: it always looks unchanged and React can miss the update. For a mutable source you cannot replace, cache an immutable projection and rebuild it only when the source version changes.

Notifications should follow the state write, and every successful subscription must return cleanup. A store may batch several writes into one notification, but by notification time \`getSnapshot\` must expose the final coherent state. React can re-check an external store around concurrent work; if the snapshot changed during a non-blocking Transition, React may restart that update as blocking so every component observes one version rather than a torn mixture.

## Server rendering and hydration

\`getServerSnapshot\` runs during server rendering and again during hydration. The hydration return must equal the value used to produce the HTML. For request data, serialize that exact initial snapshot into the response and initialize the client store from it. For browser APIs such as online status, choose a deterministic server fallback and accept that the real browser value may trigger a post-hydration update.

Omit \`getServerSnapshot\` only when the component is intentionally client-only and your rendering environment supports that choice. The mechanism that disables server rendering is framework-specific; React itself only defines the hook contract.

Do not suspend based on an external-store value or mutate the store inside a Transition as a strategy for hiding consistency problems. External-store mutations are synchronous from React's perspective. If the source is really asynchronous cached data, use a data cache designed for pending, error, invalidation, and race semantics.

## Choosing the boundary

Use ordinary props/state when React owns the value. Use context when React owns a value needed by a subtree. Reach for \`useSyncExternalStore\` when another system owns both storage and notification. A module-level variable with no subscription is not a store adapter; React has no signal to read it again.`,
    ),
    exercises: [
      {
        id: "react-external-store-snapshot",
        title: "Build a snapshot-stable store",
        instructions:
          "Complete the pure store. `getSnapshot()` must retain object identity until a real toggle, `toggle` must replace the immutable snapshot before notifying, and unsubscribe must stop later notifications. The starter is synchronous and models the exact adapter that `useSyncExternalStore` expects without requiring React or a DOM.",
        starterCode: reactVariants(
          `function createSelectionStore(initialIds) {
  let snapshot = Object.freeze({ selectedIds: Object.freeze([...initialIds]) });
  const listeners = new Set();

  return {
    subscribe(listener) {
      // TODO: register listener and return an unsubscribe function.
    },
    getSnapshot() {
      // TODO: return the cached snapshot object.
    },
    toggle(id) {
      // TODO: create a new selectedIds array and snapshot, then notify listeners.
    },
  };
}

const store = createSelectionStore(["a"]);
const first = store.getSnapshot();
let notifications = 0;
const unsubscribe = store.subscribe(() => notifications++);

store.toggle("b");
const second = store.getSnapshot();
unsubscribe();
store.toggle("a");

console.log(first === first); // expected true
console.log(first === second); // expected false
console.log(second.selectedIds.join(",")); // expected a,b
console.log(notifications); // expected 1`,
          `type SelectionSnapshot = Readonly<{
  selectedIds: readonly string[];
}>;

type SelectionStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => SelectionSnapshot;
  toggle: (id: string) => void;
};

function createSelectionStore(initialIds: string[]): SelectionStore {
  let snapshot: SelectionSnapshot = Object.freeze({
    selectedIds: Object.freeze([...initialIds]),
  });
  const listeners = new Set<() => void>();

  return {
    subscribe(listener: () => void): () => void {
      // TODO: register listener and return an unsubscribe function.
      return () => {};
    },
    getSnapshot(): SelectionSnapshot {
      // TODO: return the cached snapshot object.
      return snapshot;
    },
    toggle(id: string): void {
      // TODO: create a new selectedIds array and snapshot, then notify listeners.
    },
  };
}

const selectionStore = createSelectionStore(["a"]);
const firstSelection = selectionStore.getSnapshot();
let selectionNotifications = 0;
const stopSelection = selectionStore.subscribe(() => selectionNotifications++);

selectionStore.toggle("b");
const secondSelection = selectionStore.getSnapshot();
stopSelection();
selectionStore.toggle("a");

console.log(firstSelection === firstSelection); // expected true
console.log(firstSelection === secondSelection); // expected false
console.log(secondSelection.selectedIds.join(",")); // expected a,b
console.log(selectionNotifications); // expected 1`,
        ),
      },
    ],
    quiz: [
      {
        id: "react-external-stores-q1",
        prompt:
          "A mutable source has not changed, but `getSnapshot` returns a freshly allocated object on every call. What is wrong?",
        options: [
          "React will mutate the returned object to preserve identity",
          "Only server rendering is affected; client comparisons are deep",
          "The subscription cleanup will run before every snapshot read",
          "React sees every object as different under `Object.is`, which can cause repeated rendering",
        ],
        answer: 3,
        explanation:
          "Snapshots are identity-compared. Cache an immutable projection and return the same object until the underlying source really changes.",
      },
      {
        id: "react-external-stores-q2",
        prompt:
          "What should a stable `subscribe` implementation pass to its listener when the store changes?",
        options: [
          "No value; the listener is a notification and React obtains the value from `getSnapshot`",
          "The previous and next snapshots so React can diff them",
          "A promise resolving to the next snapshot",
          "The mutated backing object so React can freeze it",
        ],
        answer: 0,
        explanation:
          "The listener only signals possible change. React then reads `getSnapshot`, ensuring one authoritative read path and identity comparison.",
      },
      {
        id: "react-external-stores-q3",
        prompt:
          "What must be true of `getServerSnapshot` during hydration?",
        options: [
          "It must immediately read browser APIs so the page becomes accurate",
          "Its hydration value must match the snapshot that produced the server HTML",
          "It must return a new object so React can distinguish server and browser data",
          "It is required to subscribe to server-side changes",
        ],
        answer: 1,
        explanation:
          "Hydration adopts existing HTML. The first client snapshot must reproduce the server render; browser-specific truth can update after hydration.",
      },
    ],
  },
  {
    id: "react-error-boundaries-recovery",
    module: "production-patterns",
    title: "Error Boundaries and Recovery",
    blurb:
      "Contain unexpected render failures, keep expected failures in state, and make retry change something real.",
    content: forReact(
      (language) => `## Boundaries contain bugs; they do not replace error handling

An error boundary catches an exception thrown while React renders or runs lifecycle work in its **descendant tree**. React unmounts the failed subtree and renders the boundary's fallback, preventing a broken widget from taking down unrelated UI.

React 19.2 still has no core function-component API for defining an error boundary. The core implementation is a class using \`static getDerivedStateFromError\` and optionally \`componentDidCatch\`. Framework route-error files and third-party boundary components are conveniences built on top; their reset and logging props are not React APIs.

${reactCode(
  language,
  `import { Component } from "react";

export class RetryBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.props.reportError?.(error, info.componentStack);
  }

  retry = () => {
    this.props.beforeRetry?.();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <section role="alert">
          <p>This panel could not be displayed.</p>
          <button onClick={this.retry}>Try again</button>
        </section>
      );
    }
    return this.props.children;
  }
}`,
  `import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";

type RetryBoundaryProps = {
  children: ReactNode;
  beforeRetry?: () => void;
  reportError?: (error: Error, componentStack: string | null) => void;
};

type RetryBoundaryState = { error: Error | null };

export class RetryBoundary extends Component<
  RetryBoundaryProps,
  RetryBoundaryState
> {
  state: RetryBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RetryBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.reportError?.(error, info.componentStack);
  }

  retry = (): void => {
    this.props.beforeRetry?.();
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <section role="alert">
          <p>This panel could not be displayed.</p>
          <button onClick={this.retry}>Try again</button>
        </section>
      );
    }
    return this.props.children;
  }
}`
)}

\`getDerivedStateFromError\` must stay pure; use \`componentDidCatch\` for reporting. The user-facing fallback should provide context and an action, while telemetry receives the technical error and component stack. Do not expose stack traces or raw server messages to users.

## Scope follows the recovery unit

Place boundaries around regions that can fail and recover independently: a chart, editor, message thread, or route body. One root boundary is still useful as a last resort, but it offers only a whole-app crash screen. A boundary around every icon creates noisy fallbacks and loses useful context.

Errors bubble to the nearest boundary **above** the throwing component. A boundary does not catch an error thrown by its own render or fallback; a parent boundary must contain that. Changing a boundary's \`key\` remounts it and clears all descendant state, which is useful when resource identity or navigation changes:

${reactCode(
  language,
  `import { useState } from "react";

function ReportRegion({ reportId }) {
  const [attempt, setAttempt] = useState(0);

  return (
    <RetryBoundary
      key={reportId}
      beforeRetry={() => {
        reportCache.invalidate(reportId);
        setAttempt((value) => value + 1);
      }}
    >
      <Report reportId={reportId} attempt={attempt} />
    </RetryBoundary>
  );
}`,
  `import { useState } from "react";

function ReportRegion({ reportId }: { reportId: string }) {
  const [attempt, setAttempt] = useState(0);

  return (
    <RetryBoundary
      key={reportId}
      beforeRetry={() => {
        reportCache.invalidate(reportId);
        setAttempt((value) => value + 1);
      }}
    >
      <Report reportId={reportId} attempt={attempt} />
    </RetryBoundary>
  );
}`
)}

Resetting only the error flag retries the same descendants. That is correct for a transient render failure, but a cache that remembers a rejected request will immediately throw again. A real retry first changes the failed condition—reconnect, invalidate/refetch, or use a new attempt token—then resets the boundary. Disable or label repeated attempts when retry itself is pending, and escalate to a durable fallback after a sensible limit.

## What boundaries do not catch

Core boundaries are not a universal \`try/catch\`. They do not catch:

- errors in event handlers;
- rejection from arbitrary asynchronous callbacks or timers;
- errors during server rendering;
- errors thrown by the boundary itself.

Catch expected event and request failures where the operation runs, then represent them as renderable state. React 19 can route errors thrown inside work scheduled by \`startTransition\` to a boundary, but that does not turn ordinary promise callbacks into boundary-managed work.

Validation failures, conflicts, “not found,” and authorization denials are expected product outcomes. Return typed results and render specific guidance. Reserve thrown errors and boundaries for failures where the subtree cannot produce its normal UI.

## Recovery is a state machine

A practical operation has states such as idle, pending, failed-with-retry, and succeeded. Keeping attempt identity in that state prevents late responses from changing a newer attempt. Reducers are useful because legal transitions stay explicit and testable without mounting React.

Frameworks commonly generate route boundaries, catch server-render failures, and expose a \`reset\` or \`retry\` function. Those functions may re-render a route segment or issue a new server request. That behavior is a framework contract, not what calling \`setState\` on a core boundary guarantees.`,
    ),
    exercises: [
      {
        id: "react-error-recovery-reducer",
        title: "Model retry as a pure reducer",
        instructions:
          "Complete the recovery reducer for `start`, `fail`, `retry`, and `succeed`. Every start/retry increments `attempt`; fail records the message; success clears it. Ignore fail/succeed events whose attempt does not equal the current attempt, so a late result cannot overwrite newer work. This exercises the state protocol used around boundaries without imports, JSX, async timing, or dependencies.",
        starterCode: reactVariants(
          `const initialRecovery = {
  status: "idle",
  attempt: 0,
  message: null,
};

function recoveryReducer(state, event) {
  // TODO: return the next immutable state.
  // Ignore stale "fail" and "succeed" events.
  return state;
}

let recovery = recoveryReducer(initialRecovery, { type: "start" });
recovery = recoveryReducer(recovery, { type: "retry" });
recovery = recoveryReducer(recovery, {
  type: "fail",
  attempt: 1,
  message: "stale",
});
recovery = recoveryReducer(recovery, {
  type: "fail",
  attempt: 2,
  message: "offline",
});
console.log(recovery); // expected failed, attempt 2, "offline"

recovery = recoveryReducer(recovery, { type: "retry" });
recovery = recoveryReducer(recovery, { type: "succeed", attempt: 3 });
console.log(recovery); // expected succeeded, attempt 3, null`,
          `type RecoveryState = {
  status: "idle" | "pending" | "failed" | "succeeded";
  attempt: number;
  message: string | null;
};

type RecoveryAction =
  | { type: "start" }
  | { type: "retry" }
  | { type: "fail"; attempt: number; message: string }
  | { type: "succeed"; attempt: number };

const initialRecoveryState: RecoveryState = {
  status: "idle",
  attempt: 0,
  message: null,
};

function recoveryReducer(
  state: RecoveryState,
  event: RecoveryAction,
): RecoveryState {
  // TODO: return the next immutable state.
  // Ignore stale "fail" and "succeed" events.
  return state;
}

let recoveryState = recoveryReducer(initialRecoveryState, { type: "start" });
recoveryState = recoveryReducer(recoveryState, { type: "retry" });
recoveryState = recoveryReducer(recoveryState, {
  type: "fail",
  attempt: 1,
  message: "stale",
});
recoveryState = recoveryReducer(recoveryState, {
  type: "fail",
  attempt: 2,
  message: "offline",
});
console.log(recoveryState); // expected failed, attempt 2, "offline"

recoveryState = recoveryReducer(recoveryState, { type: "retry" });
recoveryState = recoveryReducer(recoveryState, {
  type: "succeed",
  attempt: 3,
});
console.log(recoveryState); // expected succeeded, attempt 3, null`,
        ),
      },
    ],
    quiz: [
      {
        id: "react-error-boundaries-recovery-q1",
        prompt:
          "A Retry button clears a boundary's error state, but the child immediately throws the same cached rejection. What is missing?",
        options: [
          "The retry must run in `componentDidCatch`",
          "The fallback needs its own nested boundary",
          "The failed condition or cached resource must be reset/refetched before retrying the subtree",
          "The error should be converted to a string before it is thrown",
        ],
        answer: 2,
        explanation:
          "Boundary reset only asks descendants to render again. If their input still contains the same failure, they correctly throw again.",
      },
      {
        id: "react-error-boundaries-recovery-q2",
        prompt:
          "Which error is a core React error boundary designed to catch?",
        options: [
          "A rejected promise in an unobserved timer callback",
          "An exception in the boundary's own fallback",
          "An exception thrown directly by a click handler",
          "An exception while a descendant component renders",
        ],
        answer: 3,
        explanation:
          "Boundaries contain errors from descendant rendering and lifecycle work. Event handlers, arbitrary async callbacks, and the boundary itself need other handling or an ancestor.",
      },
      {
        id: "react-error-boundaries-recovery-q3",
        prompt:
          "How should a form's expected validation failure usually be represented?",
        options: [
          "As result/state rendered near the relevant fields, not as a boundary-triggering exception",
          "As an exception thrown from the submit event so the nearest boundary handles it",
          "As a hydration mismatch that the framework can replace",
          "As a root-boundary fallback so all form state resets",
        ],
        answer: 0,
        explanation:
          "Expected product outcomes need specific, actionable UI and usually preserve user input. Boundaries are for unexpected failures that prevent normal subtree rendering.",
      },
    ],
  },
  {
    id: "react-testing-user-behavior",
    module: "production-patterns",
    title: "Test What the User Can Observe",
    blurb:
      "Drive accessible interactions, flush React work, and assert outcomes rather than component internals.",
    content: forReact(
      (language) => `## A test should survive a refactor

A useful component test describes a user contract:

> Given a signed-in user, when they open the menu and choose Sign out, the page shows Sign in.

It does not describe \`isOpen\`, call a component method, inspect a hook, or assert that \`setState\` ran once. Those are implementation details. If replacing local state with a reducer or moving a button into a child breaks the test while behavior is unchanged, the test was coupled to structure rather than value.

React core supplies \`act\` so tests can flush pending React updates before assertions. Render/query helpers, DOM matchers, and high-level interaction utilities such as Testing Library and \`user-event\` are third-party APIs. React does not prescribe them, but their user-oriented model fits React's observable contract.

${reactCode(
  language,
  `import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

function Preferences({ save }) {
  const [message, setMessage] = useState("");

  async function submit(formData) {
    await save({ theme: formData.get("theme") });
    setMessage("Preferences saved");
  }

  return (
    <form action={submit}>
      <label>
        Theme
        <select name="theme" defaultValue="system">
          <option value="system">System</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <button>Save preferences</button>
      <p aria-live="polite">{message}</p>
    </form>
  );
}

test("saves the selected theme", async () => {
  const user = userEvent.setup();
  const saved = [];
  render(<Preferences save={async (value) => saved.push(value)} />);

  await user.selectOptions(screen.getByRole("combobox", { name: "Theme" }), "dark");
  await user.click(screen.getByRole("button", { name: "Save preferences" }));

  expect(await screen.findByText("Preferences saved")).toBeVisible();
  expect(saved).toEqual([{ theme: "dark" }]);
});`,
  `import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type Preference = { theme: string };

function Preferences({
  save,
}: {
  save: (value: Preference) => Promise<void>;
}) {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData): Promise<void> {
    await save({ theme: String(formData.get("theme")) });
    setMessage("Preferences saved");
  }

  return (
    <form action={submit}>
      <label>
        Theme
        <select name="theme" defaultValue="system">
          <option value="system">System</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <button>Save preferences</button>
      <p aria-live="polite">{message}</p>
    </form>
  );
}

test("saves the selected theme", async () => {
  const user = userEvent.setup();
  const saved: Preference[] = [];
  render(<Preferences save={async (value) => { saved.push(value); }} />);

  await user.selectOptions(
    screen.getByRole("combobox", { name: "Theme" }),
    "dark",
  );
  await user.click(
    screen.getByRole("button", { name: "Save preferences" }),
  );

  expect(await screen.findByText("Preferences saved")).toBeVisible();
  expect(saved).toEqual([{ theme: "dark" }]);
});`
)}

Role-and-name queries exercise the same accessibility semantics a user and assistive technology rely on. Prefer them over CSS selectors and test IDs. A test ID is reasonable when no meaningful accessible or textual handle exists, but it should be an explicit escape hatch rather than the default.

\`userEvent.setup()\` and awaited interactions model complete browser interactions—focus, pointer events, keyboard events, and input/change sequences—more closely than directly dispatching one event. The exact event simulation is library behavior, not React behavior.

## Understand \`act\`, then let helpers use it

\`act(async () => { ... })\` groups renders and updates so React applies them before the assertion. Modern rendering and interaction libraries wrap their public operations in \`act\`; awaiting \`user.click\` is usually enough. Manually wrapping every helper can hide a missing \`await\`.

Use explicit \`act\` when the update originates outside the helper's control—for example, a test-only callback from an external store:

${reactCode(
  language,
  `import { act } from "react";
import { render, screen } from "@testing-library/react";

test("shows connection loss", () => {
  render(<ConnectionBadge store={connectionStore} />);

  act(() => {
    connectionStore.setOnline(false);
  });

  expect(screen.getByRole("status")).toHaveTextContent("Offline");
});`,
  `import { act } from "react";
import { render, screen } from "@testing-library/react";

test("shows connection loss", () => {
  render(<ConnectionBadge store={connectionStore} />);

  act(() => {
    connectionStore.setOnline(false);
  });

  expect(screen.getByRole("status")).toHaveTextContent("Offline");
});`
)}

An “update was not wrapped in act” warning is evidence that the test observed the UI before React finished or failed to await the operation that caused it. Do not silence the warning globally. Find the source, await the user interaction or visible result, and reserve timer flushing for code that actually uses timers.

## Assertions at the right boundary

Good assertions cover visible text, accessible state, focus, enabled/disabled state, navigation intent, and calls to a true system boundary such as \`savePreference\`. Mock the network or service adapter, not React hooks or child components. Then the test includes component composition, event wiring, and state transitions while remaining deterministic.

Avoid asserting:

- component state or reducer action names;
- exact render counts unless render count is the behavior under investigation;
- class names generated for styling;
- a child component's presence when the user-visible outcome is what matters;
- snapshots of large trees that reviewers cannot meaningfully inspect.

Use \`getBy...\` for something that must exist now, \`queryBy...\` for proving absence, and an awaited \`findBy...\` for something that appears after work. For disappearance, use the testing library's disappearance helper rather than sleeping. Waiting a fixed number of milliseconds makes tests slower and still race-prone.

## Choose the smallest test that proves the contract

A pure reducer or formatter deserves a fast unit test. A component interaction deserves a DOM component test. A critical workflow spanning routing, browser behavior, and a real backend deserves an end-to-end test. Do not force all confidence into one level.

Concurrent rendering means intermediate implementation states are intentionally less stable than user outcomes. Assert the committed experience. Keep Strict Mode enabled in tests where practical; code that only passes after disabling development checks likely has a cleanup or purity defect worth finding.`,
    ),
    exercises: [],
    quiz: [
      {
        id: "react-testing-user-behavior-q1",
        prompt:
          "Which assertion is most resilient when a menu implementation changes from local state to a reducer?",
        options: [
          "The component's `isOpen` field becomes `true`",
          "After the user activates Menu, a menu named Account is visible",
          "The reducer receives an action with type `OPEN_MENU`",
          "The component renders exactly twice",
        ],
        answer: 1,
        explanation:
          "The accessible menu is the user contract. State shape, action names, and render counts may change without changing behavior.",
      },
      {
        id: "react-testing-user-behavior-q2",
        prompt:
          "When is an explicit React `act` call most appropriate with a modern interaction library?",
        options: [
          "Around every assertion, including synchronous text reads",
          "Instead of awaiting `userEvent` interactions",
          "When a test directly triggers an update source outside the helper, such as an external store emitter",
          "To make implementation-detail assertions stable under concurrent rendering",
        ],
        answer: 2,
        explanation:
          "Rendering and user-event helpers normally act for their own work. A directly triggered external source is outside that wrapper and should be flushed explicitly.",
      },
      {
        id: "react-testing-user-behavior-q3",
        prompt:
          "A confirmation appears after an async save. Which query strategy best expresses that contract?",
        options: [
          "Read the component instance's state immediately",
          "Sleep for 500 ms, then query by CSS class",
          "Snapshot the whole container before and after the click",
          "Await a query for the visible confirmation text or status",
        ],
        answer: 3,
        explanation:
          "Awaiting the observable result synchronizes on the behavior itself. Fixed sleeps and internal state checks are both less reliable and less representative.",
      },
    ],
  },
  {
    id: "react-server-client-hydration",
    module: "production-patterns",
    title: "Server/Client Boundaries and Hydration",
    blurb:
      "Keep execution environments explicit, pass transport-safe data, and make the first browser render match the server.",
    content: forReact(
      (language) => `## Three ideas that are often collapsed into “SSR”

They are distinct:

1. **Server rendering** turns a React tree into HTML, often as a stream.
2. **Hydration** attaches React to server-rendered HTML and makes Client Components interactive.
3. **React Server Components (RSC)** execute in a server module graph and send a serialized component payload, not their component code, to the browser.

React core and React DOM define primitives such as \`hydrateRoot\`, streaming server rendering, the \`"use client"\` directive contract, and the serializable values accepted at an RSC boundary. A framework supplies the bundler integration, request lifecycle, router, HTML/payload transport, caching, and usually file conventions. React alone does not turn an arbitrary project into an RSC application.

A **Client Component is not necessarily browser-only rendering**. Frameworks commonly prerender Client Components on the server for the initial HTML and then hydrate them. “Client” means its module belongs to the client graph and may use state, Effects, event handlers, and browser APIs at the appropriate time.

## Keep the client boundary narrow

In an RSC-capable environment, \`"use client"\` marks a module-graph boundary. Imports below that boundary join the client bundle. Put it at focused interactive leaves instead of moving an entire page, data layer, and formatting library into the browser.

${reactCode(
  language,
  `// purchase-panel.jsx
"use client";

import { useState } from "react";

export function PurchasePanel({ product }) {
  const [quantity, setQuantity] = useState(1);

  function copySku() {
    navigator.clipboard.writeText(product.sku);
  }

  return (
    <section>
      <h2>{product.name}</h2>
      <label>
        Quantity
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        />
      </label>
      <button onClick={copySku}>Copy SKU</button>
    </section>
  );
}`,
  `// purchase-panel.tsx
"use client";

import { useState } from "react";

type ProductForPurchase = {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
};

export function PurchasePanel({
  product,
}: {
  product: ProductForPurchase;
}) {
  const [quantity, setQuantity] = useState(1);

  function copySku(): void {
    navigator.clipboard.writeText(product.sku);
  }

  return (
    <section>
      <h2>{product.name}</h2>
      <label>
        Quantity
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        />
      </label>
      <button onClick={copySku}>Copy SKU</button>
    </section>
  );
}`
)}

The server can render this component with a small product record. The browser API is used only in an event handler, which cannot run during server rendering. Do not pass a database model, open connection, class instance with behavior, or closure across the boundary. Pass the fields the interaction needs.

React's RSC serialization is broader than JSON in some cases, but it is still an explicit transport allowlist. Plain records, arrays, primitives, and supported built-ins are easier to reason about. Functions cannot normally cross from server to client; a Server Function is a special reference produced by an RSC framework, not arbitrary closure serialization. Validate and authorize again when that server entry point executes.

## Hydration is adoption, not a second independent render

\`hydrateRoot(container, <App />)\` expects the client's initial output to match the HTML already in \`container\`. React attaches handlers and preserves the existing DOM. Mismatches are bugs: recovery may be partial, development warnings identify them, and there is no guarantee that every differing attribute gets patched.

Common mismatch sources are \`Date.now()\`, \`Math.random()\`, locale/time-zone differences, reading \`window\` or \`localStorage\` during render, invalid HTML nesting, and data that changed between server output and hydration.

Move browser-only synchronization after hydration:

${reactCode(
  language,
  `import { useEffect, useState } from "react";

export function TimeZoneLabel() {
  const [zone, setZone] = useState("UTC");

  useEffect(() => {
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return <span>Time zone: {zone}</span>;
}`,
  `import { useEffect, useState } from "react";

export function TimeZoneLabel() {
  const [zone, setZone] = useState("UTC");

  useEffect(() => {
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return <span>Time zone: {zone}</span>;
}`
)}

Both server render and first client render produce “UTC”; the Effect updates to the browser's zone after hydration. For an external store, the equivalent is a \`getServerSnapshot\` value that exactly matches the serialized initial value. If a value is truly server-known, pass it as data rather than recomputing it independently in the browser.

\`suppressHydrationWarning\` is a narrow escape hatch for intentionally different text such as an unavoidable timestamp. It is not a general repair strategy and should not be spread over a subtree.

## Environment-safe modules

Render must be pure in either environment where it can run. A top-level \`window\` read fails as soon as a server imports the module. A \`typeof window !== "undefined"\` branch inside render avoids the exception but usually creates different HTML and a hydration mismatch.

Use these placements:

- server-only credentials, database clients, and authorization in server modules;
- browser subscriptions and imperative APIs in Effects with cleanup;
- browser actions such as clipboard and share in event handlers;
- deterministic shared formatting in environment-neutral modules.

Many frameworks provide server-only/client-only guards and environment-aware package exports. Those build errors are framework tooling. The underlying React contract is that code must be valid in every environment where its module executes.

## Composition across the boundary

A server-rendered component may be passed as a slot/child to a Client Component by an RSC framework. This does not make the server component's module part of the client graph; the client receives its rendered payload. Conversely, a Client Component cannot import a server-only component as ordinary browser code. Think in module graphs and transported values, not merely visual parent/child nesting.

When debugging production rendering, ask four separate questions: Where does this module execute? Which code ships? What data crosses the transport? Does the first client render reproduce the server output? That vocabulary prevents most “works on navigation, breaks on refresh” failures.`,
    ),
    exercises: [],
    quiz: [
      {
        id: "react-server-client-hydration-q1",
        prompt:
          "What does marking a module with `\"use client\"` mean in an RSC-capable setup?",
        options: [
          "It establishes a client module-graph boundary; the framework/bundler includes that graph for browser execution",
          "React skips server prerendering for that component in every framework",
          "Every descendant visible beneath it must be imported into the browser bundle",
          "All props become JSON strings before every local render",
        ],
        answer: 0,
        explanation:
          "The directive marks the client graph boundary. Frameworks decide bundling and may still prerender Client Components; server-rendered slots can remain outside the imported client graph.",
      },
      {
        id: "react-server-client-hydration-q2",
        prompt:
          "A component renders `localStorage.getItem(\"theme\")` on the client but renders `\"light\"` on the server. What is the robust fix?",
        options: [
          "Add `suppressHydrationWarning` to the application root",
          "Use the same deterministic initial value, then synchronize local storage in an Effect",
          "Call `hydrateRoot` twice so the second render replaces the server HTML",
          "Wrap the local storage read in `useMemo`",
        ],
        answer: 1,
        explanation:
          "Server and first browser output must agree. Browser-only state can be read after hydration and applied as a normal update.",
      },
      {
        id: "react-server-client-hydration-q3",
        prompt:
          "Which statement correctly separates React core from framework behavior?",
        options: [
          "React core defines route files and persistent fetch invalidation; frameworks only choose URLs",
          "React core automatically converts any project into an RSC application",
          "React defines hydration/RSC contracts, while frameworks provide routing, bundling, transport, caching, and file conventions",
          "Frameworks define whether `useState` and Effects are legal in Client Components",
        ],
        answer: 2,
        explanation:
          "React supplies rendering and boundary contracts. An RSC-capable framework integrates the server/client module graphs, request transport, router, and cache policy.",
      },
    ],
  },
];
