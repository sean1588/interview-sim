import type { Lesson } from "../types";
import { forReact, reactCode, reactVariants } from "./shared";

export const asyncConcurrencyLessons: Lesson[] = [
  {
    id: "react-suspense-boundaries",
    module: "async-concurrency",
    title: "Suspense Boundaries and Reveal Sequences",
    blurb:
      "Place boundaries around meaningful reveal units, and connect them only to supported sources of suspension.",
    content: forReact(
      (language) => `## Suspense coordinates a reveal; it is not a fetching API

A \`<Suspense>\` boundary says, “If this subtree cannot finish rendering yet, reveal this fallback instead.” When the subtree becomes ready, React retries it and commits the completed content. The boundary coordinates **what appears together**; it neither starts a request nor chooses a cache policy.

In stable React 19.2, a boundary can be activated by supported render-time resources such as:

- component code loaded with \`lazy\`;
- a cached Promise read with \`use\`, including data supplied by a Suspense-enabled framework;
- framework-integrated streaming server rendering and hydration;
- other React-managed resources documented as Suspense-aware.

The data integration is deliberately provider-neutral. A framework or data layer normally owns request creation, caching, deduplication, invalidation, and server/client transfer. If you use \`use(promise)\` directly, the Promise must be cached and stable across retries. Creating a new Promise during every render creates a new pending resource every time and is not a viable cache.

${reactCode(
  language,
  `import { Suspense, use } from "react";

// The framework or resource layer creates and caches this Promise.
function Profile({ profilePromise }) {
  const profile = use(profilePromise);
  return <ProfileCard profile={profile} />;
}

export function ProfileRoute({ profilePromise }) {
  return (
    <RouteLayout>
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile profilePromise={profilePromise} />
      </Suspense>
    </RouteLayout>
  );
}`,
  `import { Suspense, use, type ReactNode } from "react";

type ProfileData = { id: string; displayName: string };

declare function RouteLayout(props: { children: ReactNode }): ReactNode;
declare function ProfileCard(props: { profile: ProfileData }): ReactNode;
declare function ProfileSkeleton(): ReactNode;

function Profile({ profilePromise }: { profilePromise: Promise<ProfileData> }) {
  const profile = use(profilePromise);
  return <ProfileCard profile={profile} />;
}

export function ProfileRoute({
  profilePromise,
}: {
  profilePromise: Promise<ProfileData>;
}) {
  return (
    <RouteLayout>
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile profilePromise={profilePromise} />
      </Suspense>
    </RouteLayout>
  );
}`
)}

The Promise is injected rather than created by \`Profile\`. That keeps transport and cache ownership outside the presentation component and lets React retry against the same resource. Exactly how the Promise reaches this component is a framework concern.

## Effects do not activate Suspense

Fetching in an Effect and later calling \`setState\` does **not** make the component suspend. The first render already completed, so Suspense sees no pending render-time resource. You must model loading, errors, cancellation, and stale responses yourself:

${reactCode(
  language,
  `function EffectProfile({ id }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    fetchProfile(id).then(value => {
      if (active) setProfile(value);
    });
    return () => {
      active = false;
    };
  }, [id]);

  // This branch is ordinary conditional UI, not a Suspense fallback.
  return profile ? <ProfileCard profile={profile} /> : <ProfileSkeleton />;
}`,
  `function EffectProfile({ id }: { id: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let active = true;
    fetchProfile(id).then((value: ProfileData) => {
      if (active) setProfile(value);
    });
    return () => {
      active = false;
    };
  }, [id]);

  // This branch is ordinary conditional UI, not a Suspense fallback.
  return profile ? <ProfileCard profile={profile} /> : <ProfileSkeleton />;
}`
)}

Wrapping \`EffectProfile\` in Suspense does not change that fact. Use an Effect when synchronizing with an external system is genuinely the right model; use your framework's documented Suspense integration when you want render-time coordination.

## Boundaries encode the product's reveal sequence

One boundary waits for its entire subtree, so siblings under it reveal as a unit. Nested or sibling boundaries permit progressive reveal. Place them around user-perceived regions, not mechanically around every component:

${reactCode(
  language,
  `<Suspense fallback={<PageSkeleton />}>
  <Article />
  <Suspense fallback={<CommentsSkeleton />}>
    <Comments />
  </Suspense>
</Suspense>`,
  `<Suspense fallback={<PageSkeleton />}>
  <Article />
  <Suspense fallback={<CommentsSkeleton />}>
    <Comments />
  </Suspense>
</Suspense>`
)}

Here the outer boundary withholds the article shell until \`Article\` is ready. After that reveal, comments can arrive independently behind their local fallback. If both components sat directly under one boundary, they would pop in together. If every leaf had its own spinner, the page could flicker through a noisy sequence that does not match the design.

Boundary placement also determines failure and navigation behavior:

- A fallback that suspends delegates to the next Suspense boundary above it.
- A render that suspends before its first mount has no committed local state to preserve; React retries that tree from scratch.
- If already revealed content suspends again, React normally shows the fallback again. Updates marked with a Transition or driven by a deferred value can keep stale, revealed content visible instead.
- When React must hide revealed content, it cleans up layout Effects in that hidden tree and runs them again when the tree is revealed.
- A \`key\` can intentionally reset identity when navigation represents different content, allowing the fallback to appear rather than preserving the previous entity.
- Rejected resources are errors, not loading states. Put an Error Boundary at the recovery scope you want.

Suspense-enabled routers and server frameworks often combine these mechanics with streaming and selective hydration. React defines the boundary semantics; the framework defines how routes, resources, and caches participate.`
    ),
    exercises: [],
    quiz: [
      {
        id: "react-suspense-boundaries-q1",
        prompt:
          "Which operation can activate a Suspense boundary for data loading?",
        options: [
          "Reading a cached Promise with `use`, directly or through a supported framework integration",
          "Starting `fetch` in an Effect and setting state when it resolves",
          "Returning `null` while local `isLoading` state is true",
          "Awaiting a request in an event handler without scheduling a render",
        ],
        answer: 0,
        explanation:
          "Suspense responds to supported render-time resources. Effect and event-handler fetching happens outside that protocol and needs explicit loading and error state.",
      },
      {
        id: "react-suspense-boundaries-q2",
        prompt:
          "An article should appear first, with comments revealing later. Where should the boundaries go?",
        options: [
          "One boundary around both regions so neither can reveal alone",
          "An outer article/page boundary with a nested boundary around comments",
          "A boundary around every leaf component, regardless of the intended loading sequence",
          "No boundary around comments because nested boundaries cannot reveal independently",
        ],
        answer: 1,
        explanation:
          "Nested boundaries describe a progressive reveal sequence: the meaningful page region appears, then the comments boundary fills independently.",
      },
      {
        id: "react-suspense-boundaries-q3",
        prompt:
          "Already revealed content suspends again during an ordinary urgent update. What is the default behavior?",
        options: [
          "React always keeps the old content visible until the new content is ready",
          "React ignores the suspension because the boundary has revealed once",
          "The closest boundary can show its fallback again; a Transition or deferred value can avoid hiding stale content",
          "React converts the rejected Promise into an Effect",
        ],
        answer: 2,
        explanation:
          "A boundary may return to its fallback. Marking appropriate updates as non-urgent lets React preserve already revealed content while replacement work finishes.",
      },
    ],
  },
  {
    id: "react-transitions-urgent-updates",
    module: "async-concurrency",
    title: "Transitions and Urgent Updates",
    blurb:
      "Keep direct manipulation urgent while marking expensive destination rendering as interruptible background work.",
    content: forReact(
      (language) => `## Priority follows the interaction contract

Concurrent rendering is not parallel JavaScript. React may prepare a render in the background, pause it, abandon it, and restart from newer state before committing. \`useTransition\` lets you classify state updates so urgent interaction feedback can commit without waiting for expensive destination UI.

\`useTransition()\` returns \`[isPending, startTransition]\`. The function passed to \`startTransition\` runs immediately. State updates scheduled synchronously while it runs are marked as Transition updates:

${reactCode(
  language,
  `import { useState, useTransition } from "react";

export function Catalog() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(event) {
    const next = event.target.value;
    setQuery(next); // urgent: keep the controlled input synchronized
    startTransition(() => {
      setFilter(next); // non-urgent: may trigger an expensive result render
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      <SearchResults query={filter} />
      {isPending && <InlineProgress />}
    </>
  );
}`,
  `import {
  useState,
  useTransition,
  type ChangeEvent,
  type ReactNode,
} from "react";

declare function SearchResults(props: { query: string }): ReactNode;
declare function InlineProgress(): ReactNode;

export function Catalog() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setQuery(next); // urgent: keep the controlled input synchronized
    startTransition(() => {
      setFilter(next); // non-urgent: may trigger an expensive result render
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      <SearchResults query={filter} />
      {isPending && <InlineProgress />}
    </>
  );
}`
)}

The controlled input state must remain urgent. If \`setQuery\` itself were marked as a Transition, the input could not reliably reflect each keystroke; React explicitly does not support Transition updates as the state controlling text inputs. Split the state, as above, or defer the value consumed by the expensive subtree.

## Transition renders are interruptible

Suppose rendering \`SearchResults("rea")\` is expensive and the user types \`"react"\` before it commits. An urgent input update interrupts that background render. React can abandon the obsolete \`"rea"\` work, commit the input update, and restart results for the latest filter. Intermediate Transition state is therefore not an audit log: code must not depend on every candidate render committing.

Transitions are appropriate for navigation, tab destinations, charts, large result sets, and other replaceable visual work. They are not a universal wrapper:

- Direct manipulation—typing, dragging, focus feedback—stays urgent.
- A Transition does not make a slow calculation faster; it makes rendering work schedulable.
- Side effects do not become safely cancelable merely because their surrounding state update is a Transition.
- Multiple ongoing Transitions are currently batched together, so do not treat \`isPending\` as a request identifier.

\`isPending\` becomes true when the Transition starts and remains true until its Actions complete and the final state is shown. Prefer local, continuity-preserving feedback—a pending tab label or dimmed region—over replacing the already useful screen with a global spinner.

## Suspense and Transitions compose

If a Transition render suspends, React can keep an already revealed boundary visible instead of replacing it with its fallback. A newly introduced nested boundary may still show its own fallback. This gives navigation a stable shell while fresh route content streams or loads.

The placement is intentional: mark the destination state change as non-urgent, keep the existing page usable, and show \`isPending\` near the control that initiated the change. Suspense decides reveal units; the Transition tells React the replacement is allowed to wait.

## Async Actions and the post-\`await\` caveat

The function given to \`startTransition\` is called an **Action** and may be async. React tracks its pending lifetime, but in React 19.2 state updates after an \`await\` currently need another \`startTransition\` to retain Transition priority:

${reactCode(
  language,
  `function saveSelection(nextId) {
  startTransition(async () => {
    const confirmed = await persistSelection(nextId);

    // Current React limitation: re-establish Transition context after await.
    startTransition(() => {
      setSelectedId(confirmed.id);
    });
  });
}`,
  `function saveSelection(nextId: string) {
  startTransition(async () => {
    const confirmed: { id: string } = await persistSelection(nextId);

    // Current React limitation: re-establish Transition context after await.
    startTransition(() => {
      setSelectedId(confirmed.id);
    });
  });
}`
)}

Do not confuse render interruption with network cancellation or response ordering. Raw async Transition code can still receive responses out of order; own that policy with request IDs or cancellation, or use higher-level Action abstractions such as \`useActionState\` and form Actions where their sequencing semantics fit. Errors thrown from Actions are handled by the nearest Error Boundary unless the Action catches them and returns an explicit error state.`
    ),
    exercises: [],
    quiz: [
      {
        id: "react-transitions-urgent-updates-q1",
        prompt:
          "A controlled search input drives an expensive result list. Which update split is correct?",
        options: [
          "Put both the input value and result filter in the same Transition",
          "Delay the input value with a timer and make the result filter urgent",
          "Make every update urgent because concurrent rendering cannot be interrupted",
          "Update the input value urgently and mark the expensive result state as a Transition",
        ],
        answer: 3,
        explanation:
          "Controlled input state must update urgently. The replaceable, expensive result render is the work that can be scheduled and interrupted.",
      },
      {
        id: "react-transitions-urgent-updates-q2",
        prompt:
          "What happens if an urgent keystroke arrives while React is preparing a Transition render?",
        options: [
          "React may abandon or pause the background render, handle the keystroke, and restart from newer state",
          "The browser queues the keystroke until the Transition commits",
          "React commits the partial Transition tree before handling the keystroke",
          "`startTransition` moves the render to a Web Worker",
        ],
        answer: 0,
        explanation:
          "Transition rendering is interruptible and replaceable. It still runs on the JavaScript environment; it is not worker-based parallelism.",
      },
      {
        id: "react-transitions-urgent-updates-q3",
        prompt:
          "In React 19.2, how do you preserve Transition priority for a state update after an `await`?",
        options: [
          "Nothing special is needed; all later updates inherit the context indefinitely",
          "Wrap that post-`await` state update in another `startTransition`",
          "Move the update into an Effect",
          "Replace the state update with `flushSync`",
        ],
        answer: 1,
        explanation:
          "Async Actions are tracked as pending, but React currently loses the Transition context across the await boundary for state marking. Re-enter it around the later setter.",
      },
    ],
  },
  {
    id: "react-deferred-values",
    module: "async-concurrency",
    title: "Deferred Values and Stale Content",
    blurb:
      "Let a consumer lag behind an urgent source value while React prepares the latest render in the background.",
    content: forReact(
      (language) => `## Defer a value when you do not own the update

\`useTransition\` marks setters you call. \`useDeferredValue\` is the complementary tool when you have a value—often a prop or controlled input value—and want one expensive consumer to lag behind it.

\`useDeferredValue(value, initialValue?)\` returns a deferred version. On an update React first renders urgently with the new source value but the **previous deferred value**, then attempts a background render in which the deferred value catches up. That background render is interruptible and always restarts from the latest source.

${reactCode(
  language,
  `import { memo, Suspense, useDeferredValue, useState } from "react";

const SearchResults = memo(function SearchResults({ query }) {
  return <ResultResource query={query} />;
});

export function SearchPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query, "");
  const isStale = query !== deferredQuery;

  return (
    <>
      <input value={query} onChange={event => setQuery(event.target.value)} />
      <div aria-busy={isStale}>
        <Suspense fallback={<ResultsSkeleton />}>
          <SearchResults query={deferredQuery} />
        </Suspense>
      </div>
    </>
  );
}`,
  `import {
  memo,
  Suspense,
  useDeferredValue,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

declare function ResultResource(props: { query: string }): ReactNode;
declare function ResultsSkeleton(): ReactNode;

const SearchResults = memo(function SearchResults({
  query,
}: {
  query: string;
}) {
  return <ResultResource query={query} />;
});

export function SearchPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query, "");
  const isStale = query !== deferredQuery;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      <div aria-busy={isStale}>
        <Suspense fallback={<ResultsSkeleton />}>
          <SearchResults query={deferredQuery} />
        </Suspense>
      </div>
    </>
  );
}`
)}

The input reflects every keystroke immediately. The results continue receiving the previous query while React prepares the next version. Comparing source and deferred values gives an explicit stale signal; use it to communicate that the visible content is behind rather than pretending it is current.

The optional \`initialValue\` is useful when the first render should use a cheap placeholder value. Without it there is no older value on the initial render, so React returns the source value immediately.

## Deferred rendering is not a timer

There is no fixed debounce interval. React starts background work as soon as the urgent render finishes. Faster devices may catch up almost immediately; on slower devices the deferred consumer lags by the amount needed to preserve urgent responsiveness. Another keystroke interrupts obsolete work rather than waiting for a timeout.

This distinction matters operationally:

- Deferral schedules **rendering**, not arbitrary work.
- It does not reduce the number of network requests. A Suspense-enabled cache may reuse results, but request policy belongs to the framework or data layer.
- Debouncing or throttling remains useful when the actual goal is fewer requests or fewer external side effects.
- Effects belonging to an uncommitted background render do not run. If that render suspends, its Effects run only after the resource is ready and the render commits.

## Keep the urgent pass cheap

On the urgent render, the parent still runs with the new source value. The expensive child must be able to skip work while its deferred prop remains unchanged. \`memo\`, stable props, component boundaries, or compiler-proven memoization provide that bailout. Without a bailout, the child can perform the same expensive render during the urgent pass and defeat the optimization.

Do not create a fresh object and immediately defer it on every render:

${reactCode(
  language,
  `// Avoid: Object.is sees a new object on every render.
const deferredOptions = useDeferredValue({ query, sort });

// Prefer stable primitives or memoized objects.
const options = useMemo(() => ({ query, sort }), [query, sort]);
const deferredOptions = useDeferredValue(options);`,
  `type SearchOptions = { query: string; sort: "date" | "relevance" };

// Avoid: Object.is sees a new object on every render.
const deferredOptions = useDeferredValue<SearchOptions>({ query, sort });

// Prefer stable primitives or memoized objects.
const options = useMemo<SearchOptions>(() => ({ query, sort }), [query, sort]);
const deferredOptions = useDeferredValue(options);`
)}

## Deferred values and Suspense

If the catch-up render suspends, React keeps showing the previous deferred content instead of flashing the boundary's fallback. Once the resource is ready, React retries and atomically commits the fresh content. The initial load can still show the fallback because there is no previously revealed result to preserve.

Use deferral when stale content remains valid and useful—search results, charts, previews. Do not use it where showing an old value is misleading or unsafe, such as confirming which account will receive a destructive operation. Priority is a product decision, not only a performance trick.`
    ),
    exercises: [],
    quiz: [
      {
        id: "react-deferred-values-q1",
        prompt:
          "During an update, what does `useDeferredValue(query)` return first?",
        options: [
          "Always the latest query after a fixed debounce interval",
          "`undefined` until the background render commits",
          "The previous deferred value, while React schedules a background render with the latest query",
          "A Promise that resolves to the latest query",
        ],
        answer: 2,
        explanation:
          "The urgent pass uses the old deferred value. React then attempts an interruptible background render where it catches up.",
      },
      {
        id: "react-deferred-values-q2",
        prompt:
          "Why is an expensive child often memoized when it receives a deferred prop?",
        options: [
          "Memoization changes the deferred value's equality from `Object.is` to deep equality",
          "Memoization makes the child's network requests run in parallel",
          "Memoization is required for Suspense to catch a Promise",
          "It lets the child skip the urgent parent render while its deferred prop is still unchanged",
        ],
        answer: 3,
        explanation:
          "The parent still renders urgently. A bailout keeps the expensive child from repeating work until the deferred prop actually advances.",
      },
      {
        id: "react-deferred-values-q3",
        prompt:
          "Which claim about deferred values is accurate?",
        options: [
          "They defer rendering without a fixed delay; request throttling remains a separate concern",
          "They debounce requests by a device-dependent timeout",
          "They guarantee every intermediate deferred render commits",
          "They cause Effects from abandoned background renders to run immediately",
        ],
        answer: 0,
        explanation:
          "Deferral is React scheduling, not request control. Background renders can be interrupted, and their Effects run only if and when the render commits.",
      },
    ],
  },
  {
    id: "react-actions-optimistic-ui",
    module: "async-concurrency",
    title: "Actions and Optimistic UI",
    blurb:
      "Model mutation results, pending state, and reversible optimistic projections as one coherent interaction.",
    content: forReact(
      (language) => `## Actions give mutations a lifecycle

In React 19.2, an **Action** is a function executed in a Transition context. Actions may perform side effects and can participate in pending UI, error handling, form submission, and optimistic updates. They do not define your transport: the mutation can call a browser API, a client library, or a framework-provided server function.

The core pieces have distinct responsibilities:

- \`useActionState(reducerAction, initialState)\` stores the value returned by the latest Action and exposes \`[state, dispatchAction, isPending]\`. The reducer Action receives previous state first and its payload second.
- A function passed to a form's \`action\` prop receives \`FormData\` and runs as an Action.
- \`useFormStatus()\` reads the nearest **parent form's** pending submission from a descendant component.
- \`useOptimistic(baseState, reducer)\` overlays a temporary projection while an Action is pending.

${reactCode(
  language,
  `import { useActionState, useOptimistic } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Posting…" : "Post"}</button>;
}

function optimisticReducer(currentComments, draft) {
  return [...currentComments, { ...draft, pending: true }];
}

export function CommentForm({ initialComments, saveComment }) {
  const [result, dispatchAction, isPending] = useActionState(
    async (previous, formData) => {
      const text = String(formData.get("comment") ?? "").trim();
      try {
        const saved = await saveComment(text);
        return {
          comments: [...previous.comments, saved],
          error: null,
        };
      } catch {
        return {
          comments: previous.comments,
          error: "The comment was not saved.",
        };
      }
    },
    { comments: initialComments, error: null }
  );

  const [comments, addOptimistic] = useOptimistic(
    result.comments,
    optimisticReducer
  );

  async function submitAction(formData) {
    const text = String(formData.get("comment") ?? "").trim();
    addOptimistic({ id: "pending-" + text, text });
    await dispatchAction(formData);
  }

  return (
    <>
      <CommentList comments={comments} />
      <form action={submitAction}>
        <input name="comment" />
        <SubmitButton />
      </form>
      {isPending && <span>Synchronizing…</span>}
      {result.error && <p role="alert">{result.error}</p>}
    </>
  );
}`,
  `import {
  useActionState,
  useOptimistic,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";

type Comment = { id: string; text: string; pending?: boolean };
type CommentState = { comments: Comment[]; error: string | null };
type SaveComment = (text: string) => Promise<Comment>;

declare function CommentList(props: { comments: Comment[] }): ReactNode;

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Posting…" : "Post"}</button>;
}

function optimisticReducer(
  currentComments: Comment[],
  draft: Comment
): Comment[] {
  return [...currentComments, { ...draft, pending: true }];
}

export function CommentForm({
  initialComments,
  saveComment,
}: {
  initialComments: Comment[];
  saveComment: SaveComment;
}) {
  const [result, dispatchAction, isPending] = useActionState(
    async (previous: CommentState, formData: FormData): Promise<CommentState> => {
      const text = String(formData.get("comment") ?? "").trim();
      try {
        const saved = await saveComment(text);
        return {
          comments: [...previous.comments, saved],
          error: null,
        };
      } catch {
        return {
          comments: previous.comments,
          error: "The comment was not saved.",
        };
      }
    },
    { comments: initialComments, error: null }
  );

  const [comments, addOptimistic] = useOptimistic(
    result.comments,
    optimisticReducer
  );

  async function submitAction(formData: FormData) {
    const text = String(formData.get("comment") ?? "").trim();
    addOptimistic({ id: "pending-" + text, text });
    await dispatchAction(formData);
  }

  return (
    <>
      <CommentList comments={comments} />
      <form action={submitAction}>
        <input name="comment" />
        <SubmitButton />
      </form>
      {isPending && <span>Synchronizing…</span>}
      {result.error && <p role="alert">{result.error}</p>}
    </>
  );
}`
)}

\`SubmitButton\` must be a descendant of the form. Calling \`useFormStatus\` in the component that creates that form observes no parent form and leaves \`pending\` false. The Hook is scoped structurally, which makes reusable submit controls possible without threading a pending prop.

The wrapper \`submitAction\` is already an Action because React invokes it through the form's \`action\` prop. It adds the temporary row, then dispatches the stateful mutation. If you call \`dispatchAction\` imperatively elsewhere, do so from an Action prop or inside \`startTransition\`; calling it outside an Action context produces a development warning.

## Optimism is a projection, not a second source of truth

The first argument to \`useOptimistic\` is canonical state. While an Action is pending, React folds optimistic payloads through the pure reducer. When canonical state changes during the Action, React can replay that reducer over the latest base, preserving concurrent confirmed updates.

On success above, \`result.comments\` receives the saved server value and becomes the post-Action base. On failure, the reducer Action returns the previous comments plus an error. When the Action ends, the temporary row disappears automatically because the canonical list never accepted it. That is rollback by derivation—there is no compensating “remove optimistic row” mutation to race.

The optimistic reducer must be pure: no request, ID allocation with hidden mutable state, logging, or mutation of its input. Give it a complete payload prepared by the event or Action and return a new projection.

## Choose an explicit error contract

There are two useful failure paths:

1. **Expected mutation failure:** catch it inside the reducer Action and return typed state such as \`{ data, fieldErrors, message }\`. The current UI remains mounted, the optimistic overlay rolls back, and the form renders recoverable feedback.
2. **Unexpected failure:** let the Action throw. React ends the Transition, the optimistic view reverts to the current base, and the nearest Error Boundary owns recovery. For \`useActionState\`, a thrown dispatch also cancels queued Actions.

Do not both swallow an exception and expect an Error Boundary to see it. Once caught, the returned state is the error channel.

\`useActionState\` queues multiple dispatches sequentially because each reducer Action receives the previous Action's result. This is useful for dependent mutations but means the Hook is not a parallel request pool. Raw async Transitions require you to handle stale response ordering yourself; React's form and Action-state abstractions cover common ordered workflows.

## Transition caveats still apply

Form Actions and Action-state dispatch provide their pending and ordering behavior, but they do not make every unrelated setter after an \`await\` a Transition update. If an Action directly calls another state setter after awaiting, wrap that setter in another \`startTransition\` in React 19.2. Network cancellation, idempotency, authorization, and conflict resolution remain responsibilities of the mutation layer.

Optimistic UI should only predict outcomes that are likely, reversible, and clearly pending. A “like” or appended comment is a good fit. Irreversible billing or permission changes usually deserve confirmed state before the UI claims completion.`
    ),
    exercises: [
      {
        id: "react-optimistic-reducer",
        title: "Build a pure optimistic reducer",
        instructions: `Implement \`applyOptimisticTasks(current, action)\` as the pure projection you could pass to \`useOptimistic\`.

- For \`add\`, return a new array with a pending task appended.
- For \`remove\`, return a new array without the matching task.
- Do not mutate \`current\` or \`action.task\`.
- Unknown actions return \`current\` unchanged.

This is intentionally a framework-free runnable exercise: the reducer's purity is the part that can be tested authentically without a React renderer. The synchronous examples should print a pending two-item list, then a list containing only the second task.`,
        starterCode: reactVariants(
          `function applyOptimisticTasks(current, action) {
  // TODO: return a new optimistic projection for "add" and "remove".
  // An added task should include pending: true.
  return current;
}

const baseTasks = [{ id: "a", title: "Review", pending: false }];
const withDraft = applyOptimisticTasks(baseTasks, {
  type: "add",
  task: { id: "b", title: "Ship", pending: false },
});
const afterRemoval = applyOptimisticTasks(withDraft, {
  type: "remove",
  id: "a",
});

console.log(JSON.stringify(withDraft));
console.log(JSON.stringify(afterRemoval));
console.log("base unchanged:", baseTasks.length === 1);`,
          `type Task = {
  id: string;
  title: string;
  pending: boolean;
};

type OptimisticTaskAction =
  | { type: "add"; task: Task }
  | { type: "remove"; id: string };

function applyOptimisticTasks(
  current: Task[],
  action: OptimisticTaskAction
): Task[] {
  // TODO: return a new optimistic projection for "add" and "remove".
  // An added task should include pending: true.
  return current;
}

const baseTasks: Task[] = [
  { id: "a", title: "Review", pending: false },
];
const withDraft = applyOptimisticTasks(baseTasks, {
  type: "add",
  task: { id: "b", title: "Ship", pending: false },
});
const afterRemoval = applyOptimisticTasks(withDraft, {
  type: "remove",
  id: "a",
});

console.log(JSON.stringify(withDraft));
console.log(JSON.stringify(afterRemoval));
console.log("base unchanged:", baseTasks.length === 1);`
        ),
      },
    ],
    quiz: [
      {
        id: "react-actions-optimistic-ui-q1",
        prompt:
          "What does the reducer Action passed to `useActionState` receive first?",
        options: [
          "The nearest form element",
          "The previous state, followed by the dispatched payload such as `FormData`",
          "Only an `AbortSignal`",
          "The optimistic state produced by every component on the page",
        ],
        answer: 1,
        explanation:
          "`useActionState` sequences stateful Actions by passing each reducer Action the previous returned state before its payload.",
      },
      {
        id: "react-actions-optimistic-ui-q2",
        prompt:
          "A comment is shown through `useOptimistic`, but the save Action fails and canonical comments are unchanged. What should happen?",
        options: [
          "The optimistic comment becomes canonical automatically",
          "React retries forever because optimistic reducers cannot fail",
          "When the Action ends, the view derives from unchanged canonical state and the optimistic comment rolls back",
          "The reducer must mutate the original array to remove the comment",
        ],
        answer: 2,
        explanation:
          "Optimistic state is a temporary projection during an Action. If success never updates the base, ending the Action naturally reveals the unchanged base.",
      },
      {
        id: "react-actions-optimistic-ui-q3",
        prompt:
          "Where must a component call `useFormStatus` to observe a form submission?",
        options: [
          "In the same component before it returns the form",
          "Anywhere in the application because form status is global",
          "Only inside the function supplied to the form's `action` prop",
          "Inside a descendant of the parent form whose status it should observe",
        ],
        answer: 3,
        explanation:
          "`useFormStatus` reads the nearest parent form. A component cannot observe a form that it creates below itself.",
      },
    ],
  },
];
