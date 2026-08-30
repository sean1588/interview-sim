import type { Lesson } from "../types";
import { forReact, reactCode, reactVariants } from "./shared";

export const performanceLessons: Lesson[] = [
  {
    id: "react-measure-with-profiler",
    module: "performance",
    title: "Measure with the Profiler",
    blurb:
      "Turn React DevTools commits and Profiler durations into reproducible performance evidence.",
    content: forReact(
      (language) => `## Optimize evidence, not render folklore

A render is React calling components to calculate a candidate tree. A **commit** is React applying one completed result. Concurrent rendering can start, pause, restart, or abandon render work, so console logs and render counts do not establish user-visible cost. The React DevTools Profiler records committed work and is the right starting point for a rendering investigation.

Use a repeatable workflow:

1. Reproduce one named interaction, such as "type one character into the customer filter."
2. Record it in the DevTools **Profiler** and inspect the commits caused by that interaction.
3. Start with the slowest relevant commit, then use the flamegraph or ranked view to locate expensive subtrees.
4. Change one thing and repeat the same interaction, data, build mode, browser, and hardware.
5. Keep the change only when commit evidence improves without moving the cost elsewhere.

Development timings contain validation overhead, and Strict Mode deliberately repeats some work. That is useful for finding impurity but noisy for final numbers. Use development profiling to navigate, then validate consequential claims with a profiling-capable production build on representative hardware.

## Read the two durations correctly

For a profiled subtree, \`actualDuration\` is the time React spent rendering that subtree for **this committed update**. \`baseDuration\` estimates how expensive the subtree would be if all of its components rendered without memoization, based on React's most recent render-duration observations.

- A falling \`actualDuration\` with a roughly stable \`baseDuration\` is evidence that work was skipped on that update.
- A high \`baseDuration\` identifies potentially expensive render work, but is not itself proof that users paid that cost in every commit.
- Neither number includes every source of latency. Network, layout, paint, long event handlers, and third-party work need browser performance tooling too.
- Compare commits representing the same interaction. A cheap tooltip commit and an expensive route commit are not a before/after experiment.

DevTools also answers *why* a component rendered when that recording option is enabled. Changed props, state, and context are more actionable than "it rendered four times."

## Add a narrow programmatic probe

The built-in \`Profiler\` component reports commit evidence for a chosen subtree. Do not wrap every component forever; instrument a boundary that corresponds to the interaction under investigation.

${reactCode(
  language,
  `import { Profiler, useState } from "react";

function reportRender(
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) {
  performance.measure("react:" + id + ":" + phase, {
    start: startTime,
    end: commitTime,
    detail: { actualDuration, baseDuration },
  });
}

export default function CustomerScreen({ customers }) {
  const [query, setQuery] = useState("");

  return (
    <>
      <SearchBox value={query} onChange={setQuery} />
      <Profiler id="customer-results" onRender={reportRender}>
        <CustomerResults customers={customers} query={query} />
      </Profiler>
    </>
  );
}`,
  `import { Profiler, useState, type ProfilerOnRenderCallback } from "react";

type Customer = {
  id: string;
  name: string;
};

const reportRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  performance.measure("react:" + id + ":" + phase, {
    start: startTime,
    end: commitTime,
    detail: { actualDuration, baseDuration },
  });
};

export default function CustomerScreen({
  customers,
}: {
  customers: Customer[];
}) {
  const [query, setQuery] = useState("");

  return (
    <>
      <SearchBox value={query} onChange={setQuery} />
      <Profiler id="customer-results" onRender={reportRender}>
        <CustomerResults customers={customers} query={query} />
      </Profiler>
    </>
  );
}`
)}

The callback runs after React commits. Its \`phase\` distinguishes mounting from updates (and may report a nested update), while \`commitTime\` lets profilers group boundaries committed together. The browser measure above is diagnostic plumbing, not an optimization.

## Turn recordings into a claim

Suppose the same filter interaction produces three commits before and two after. Report the distribution and the worst relevant commit, not just the best sample. If \`actualDuration\` drops from 42 ms to 9 ms while \`baseDuration\` remains near 45 ms, React likely skipped existing expensive work. If both fall sharply, the subtree itself may have become cheaper or the compared tree may differ. Confirm with the flamegraph and the product behavior.

Profiler numbers are directional measurements, not a universal benchmark. Warm-up, background tabs, extensions, CPU throttling, and input data all affect them. A defensible result states the interaction, environment, commit set, and observed change.`,
    ),
    exercises: [
      {
        id: "react-summarize-profiler-commits",
        title: "Summarize comparable commits",
        instructions: `Implement \`summarizeCommits\`. Keep only samples matching the requested interaction, then return their commit count, total \`actualDuration\`, largest \`actualDuration\`, and average ratio of \`actualDuration / baseDuration\`. Treat a zero \`baseDuration\` as a zero ratio.

This is a pure model of Profiler evidence: it has no imports, JSX, DOM, dependencies, or asynchronous work.

**Expected output:** \`{ count: 2, totalActual: 30, maxActual: 18, averageRatio: 0.375 }\``,
        starterCode: reactVariants(
          `const commits = [
  { interaction: "filter", actualDuration: 12, baseDuration: 40 },
  { interaction: "open-row", actualDuration: 7, baseDuration: 20 },
  { interaction: "filter", actualDuration: 18, baseDuration: 40 },
];

function summarizeCommits(samples, interaction) {
  // TODO: filter to the named interaction and calculate all four fields.
  return { count: 0, totalActual: 0, maxActual: 0, averageRatio: 0 };
}

console.log(summarizeCommits(commits, "filter"));`,
          `type CommitSample = {
  interaction: string;
  actualDuration: number;
  baseDuration: number;
};

type CommitSummary = {
  count: number;
  totalActual: number;
  maxActual: number;
  averageRatio: number;
};

const commits: CommitSample[] = [
  { interaction: "filter", actualDuration: 12, baseDuration: 40 },
  { interaction: "open-row", actualDuration: 7, baseDuration: 20 },
  { interaction: "filter", actualDuration: 18, baseDuration: 40 },
];

function summarizeCommits(
  samples: CommitSample[],
  interaction: string
): CommitSummary {
  // TODO: filter to the named interaction and calculate all four fields.
  return { count: 0, totalActual: 0, maxActual: 0, averageRatio: 0 };
}

console.log(summarizeCommits(commits, "filter"));`
        ),
      },
      {
        id: "react-compare-profiler-runs",
        title: "Reject a misleading comparison",
        instructions: `Implement \`compareRuns\`. Return \`"not-comparable"\` unless the two runs have the same interaction, build mode, and data-set ID. Otherwise compare total committed \`actualDuration\`: return \`"improved"\`, \`"regressed"\`, or \`"unchanged"\`.

The task deliberately compares all relevant commits rather than cherry-picking one.

**Expected output:** \`improved\``,
        starterCode: reactVariants(
          `const before = {
  interaction: "type-filter",
  build: "production-profile",
  dataSet: "customers-10k",
  actualDurations: [31, 14],
};

const after = {
  interaction: "type-filter",
  build: "production-profile",
  dataSet: "customers-10k",
  actualDurations: [12, 8],
};

function compareRuns(left, right) {
  // TODO: validate comparability, sum each duration list, and classify.
  return "not-comparable";
}

console.log(compareRuns(before, after));`,
          `type ProfileRun = {
  interaction: string;
  build: string;
  dataSet: string;
  actualDurations: number[];
};

type Comparison =
  | "not-comparable"
  | "improved"
  | "regressed"
  | "unchanged";

const before: ProfileRun = {
  interaction: "type-filter",
  build: "production-profile",
  dataSet: "customers-10k",
  actualDurations: [31, 14],
};

const after: ProfileRun = {
  interaction: "type-filter",
  build: "production-profile",
  dataSet: "customers-10k",
  actualDurations: [12, 8],
};

function compareRuns(left: ProfileRun, right: ProfileRun): Comparison {
  // TODO: validate comparability, sum each duration list, and classify.
  return "not-comparable";
}

console.log(compareRuns(before, after));`
        ),
      },
    ],
    quiz: [
      {
        id: "react-measure-with-profiler-q1",
        prompt:
          "For the same interaction, `actualDuration` falls from 42 ms to 9 ms while `baseDuration` stays near 45 ms. What is the strongest supported conclusion?",
        options: [
          "React likely skipped substantial render work in the measured subtree for that committed update",
          "The browser's layout and paint time fell by exactly 33 ms",
          "The subtree can no longer render without memoization",
          "Every future interaction in the application will be faster",
        ],
        answer: 0,
        explanation:
          "`actualDuration` describes work paid in that commit, while stable `baseDuration` preserves the estimate without memoization. The pair supports a skipped-work claim, not a whole-browser or universal claim.",
      },
      {
        id: "react-measure-with-profiler-q2",
        prompt:
          "Why should a performance report compare all relevant commits from the same named interaction?",
        options: [
          "React guarantees every interaction has the same number of commits",
          "Only the final commit contains component render time",
          "It avoids comparing unrelated work or cherry-picking a cheap sample",
          "DevTools cannot display commits from different interactions",
        ],
        answer: 2,
        explanation:
          "A route change, tooltip, and filter update can produce very different trees and costs. Repeating one controlled interaction and considering its commit set makes the before/after claim defensible.",
      },
      {
        id: "react-measure-with-profiler-q3",
        prompt:
          "What does React Profiler `baseDuration` represent most closely?",
        options: [
          "The elapsed time between the user's event and the browser's next paint",
          "An estimate of rendering the subtree without memoization, based on recent render-duration observations",
          "The minimum `actualDuration` recorded for the subtree",
          "The time spent running effects after the commit",
        ],
        answer: 1,
        explanation:
          "`baseDuration` is an estimate of full subtree render cost, not end-to-end latency. Use browser tooling for event, layout, paint, and other non-React work.",
      },
    ],
  },
  {
    id: "react-memoization-and-identity",
    module: "performance",
    title: "Memoization and Identity",
    blurb:
      "Use memo, useMemo, and useCallback as measured, opt-in controls over prop identity.",
    content: forReact(
      (language) => `## A bailout is an identity decision

\`memo(Component)\` asks React to reuse the last rendered result when a parent renders and every prop compares equal. By default each prop is compared with \`Object.is\`. This is a performance optimization, not a semantic boundary: the component still renders for its own state updates and for context it consumes.

\`Object.is\` makes primitive props unsurprising, with two notable details: \`Object.is(NaN, NaN)\` is true and \`Object.is(0, -0)\` is false. Objects, arrays, and functions compare by reference. An inline \`{ sort: "date" }\`, \`[]\`, or arrow function is therefore different on every parent render even when its contents look identical.

That does **not** mean every value should be stabilized. Memoization adds comparisons, retained values, dependency maintenance, and debugging surface. Use it when Profiler evidence shows a costly child repeatedly rendering with logically unchanged inputs.

## The three controls have different jobs

- \`memo\` controls whether React may skip rendering a component for parent-driven updates.
- \`useMemo\` caches a calculated value and, when dependencies are equal, preserves that value's identity.
- \`useCallback\` preserves a function identity; it is equivalent in purpose to memoizing the function value.

They are opt-in identity controls, not correctness tools. Code must remain correct if React calculates again. In particular, do not use \`useMemo\` to perform side effects or to manufacture required semantics.

${reactCode(
  language,
  `import { memo, useCallback, useMemo, useState } from "react";

const ResultsTable = memo(function ResultsTable({ rows, onSelect }) {
  return (
    <table>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} onClick={() => onSelect(row.id)}>
            <td>{row.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

export default function SearchResults({ records }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const visibleRows = useMemo(
    () => rankMatches(records, query),
    [records, query]
  );
  const selectRow = useCallback((id) => setSelectedId(id), []);

  return (
    <>
      <SearchBox value={query} onChange={setQuery} />
      <ResultsTable rows={visibleRows} onSelect={selectRow} />
      <Selection id={selectedId} />
    </>
  );
}`,
  `import { memo, useCallback, useMemo, useState } from "react";

type RecordRow = {
  id: string;
  name: string;
};

const ResultsTable = memo(function ResultsTable({
  rows,
  onSelect,
}: {
  rows: RecordRow[];
  onSelect: (id: string) => void;
}) {
  return (
    <table>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} onClick={() => onSelect(row.id)}>
            <td>{row.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

export default function SearchResults({
  records,
}: {
  records: RecordRow[];
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleRows = useMemo(
    () => rankMatches(records, query),
    [records, query]
  );
  const selectRow = useCallback((id: string) => setSelectedId(id), []);

  return (
    <>
      <SearchBox value={query} onChange={setQuery} />
      <ResultsTable rows={visibleRows} onSelect={selectRow} />
      <Selection id={selectedId} />
    </>
  );
}`
)}

Here \`useMemo\` is justified only if ranking is expensive or stable \`rows\` lets the measured table bail out. \`useCallback\` matters only because function identity participates in that bailout. Neither Hook makes a cheap calculation intrinsically faster.

Dependencies are a data-flow declaration. If the callback must read current reactive values, include them or restructure with an updater:

${reactCode(
  language,
  `const addTag = useCallback((tag) => {
  setTags((current) => [...current, tag]);
}, []);`,
  `const addTag = useCallback((tag: string) => {
  setTags((current) => [...current, tag]);
}, []);`
)}

The updater removes the need to capture \`tags\`; the empty dependency list is now truthful rather than a lint suppression.

## Custom comparators can freeze old closures

A second argument to \`memo\` replaces the default prop comparison. It must compare **every prop**, including functions. Returning \`true\` means "the previous rendered output remains valid." If a comparator ignores a changed callback, the child can retain a closure from an older render and observe stale state:

${reactCode(
  language,
  `const Chart = memo(
  function Chart({ points, onPointClick }) {
    return points.map((point) => (
      <button key={point.id} onClick={() => onPointClick(point.id)}>
        {point.value}
      </button>
    ));
  },
  (previous, next) =>
    previous.points.length === next.points.length // Unsafe.
);`,
  `type Point = { id: string; value: number };

const Chart = memo(
  function Chart({
    points,
    onPointClick,
  }: {
    points: Point[];
    onPointClick: (id: string) => void;
  }) {
    return points.map((point) => (
      <button key={point.id} onClick={() => onPointClick(point.id)}>
        {point.value}
      </button>
    ));
  },
  (previous, next) =>
    previous.points.length === next.points.length // Unsafe.
);`
)}

Length is not content equality, and the comparator ignores \`onPointClick\`. Deep equality can also cost more than rendering and can become unbounded when data shapes evolve. Measure the comparator and the render it replaces.

## React Compiler changes automation, not causality

React Compiler can automatically apply memoization-like optimizations to supported code. Treat it as build tooling with a specific configuration, diagnostics, and rollout—not as a reason to stop profiling or to keep poor ownership boundaries. Confirm that it is enabled for the code being measured, preserve component and Hook purity, and evaluate emitted behavior with the same commit evidence. Manual memoization may become redundant, but expensive work, broad context updates, effect chains, and oversized lists still have architectural causes.`,
    ),
    exercises: [
      {
        id: "react-implement-shallow-prop-equality",
        title: "Model memo's default comparison",
        instructions: `Implement \`shallowPropsEqual\` to model the default prop check used by \`memo\`: both objects must have the same own enumerable keys and each corresponding value must pass \`Object.is\`. Do not recurse.

Notice that equal-looking object literals fail while \`NaN\` values pass.

**Expected output:** \`true false true\``,
        starterCode: reactVariants(
          `function shallowPropsEqual(previous, next) {
  // TODO: compare own keys, then compare each value with Object.is.
  return false;
}

const stableFilter = { status: "open" };

console.log(
  shallowPropsEqual(
    { page: 1, filter: stableFilter },
    { page: 1, filter: stableFilter }
  ),
  shallowPropsEqual(
    { page: 1, filter: { status: "open" } },
    { page: 1, filter: { status: "open" } }
  ),
  shallowPropsEqual({ score: NaN }, { score: NaN })
);`,
          `type Props = Record<string, unknown>;

function shallowPropsEqual(previous: Props, next: Props): boolean {
  // TODO: compare own keys, then compare each value with Object.is.
  return false;
}

const stableFilter = { status: "open" };

console.log(
  shallowPropsEqual(
    { page: 1, filter: stableFilter },
    { page: 1, filter: stableFilter }
  ),
  shallowPropsEqual(
    { page: 1, filter: { status: "open" } },
    { page: 1, filter: { status: "open" } }
  ),
  shallowPropsEqual({ score: NaN }, { score: NaN })
);`
        ),
      },
      {
        id: "react-audit-custom-comparator",
        title: "Audit a custom comparator",
        instructions: `A comparator receives the prop names it checked. Implement \`auditComparator\` so it returns every actual prop name omitted by the comparator, in actual-prop order. Function props are not exempt: omitting one can preserve a stale closure.

**Expected output:** \`[ 'onPointClick' ]\``,
        starterCode: reactVariants(
          `const chartProps = {
  points: [{ id: "a", value: 4 }],
  onPointClick: (id) => id,
};

function auditComparator(actualProps, comparedNames) {
  // TODO: return keys from actualProps that comparedNames does not include.
  return [];
}

console.log(auditComparator(chartProps, ["points"]));`,
          `type ChartProps = {
  points: { id: string; value: number }[];
  onPointClick: (id: string) => string;
};

const chartProps: ChartProps = {
  points: [{ id: "a", value: 4 }],
  onPointClick: (id: string) => id,
};

function auditComparator<T extends object>(
  actualProps: T,
  comparedNames: (keyof T)[]
): (keyof T)[] {
  // TODO: return keys from actualProps that comparedNames does not include.
  return [];
}

console.log(auditComparator(chartProps, ["points"]));`
        ),
      },
    ],
    quiz: [
      {
        id: "react-memoization-and-identity-q1",
        prompt:
          "A memoized child receives a freshly created object prop on every parent render. What does the default comparison do?",
        options: [
          "It recursively compares the object's fields",
          "It serializes both objects before comparing them",
          "It treats them as equal if their prototypes match",
          "It treats them as different because `Object.is` compares object references",
        ],
        answer: 3,
        explanation:
          "`memo` compares each prop with `Object.is` by default. Two separate object literals have different identities even when their fields are equal.",
      },
      {
        id: "react-memoization-and-identity-q2",
        prompt:
          "When is `useCallback` most directly useful as a performance optimization?",
        options: [
          "Whenever a function is declared inside a component",
          "When preserving the function prop's identity enables measured downstream work to be skipped",
          "When the callback needs access to current state",
          "When an event handler performs asynchronous work",
        ],
        answer: 1,
        explanation:
          "`useCallback` controls function identity. It earns its cost when that stable identity matters—for example, to let an expensive memoized child bail out—not merely because a function exists.",
      },
      {
        id: "react-memoization-and-identity-q3",
        prompt:
          "What is the main correctness risk when a custom `memo` comparator ignores a function prop?",
        options: [
          "React converts the function into a string before invoking it",
          "The function is invoked during comparison",
          "The child may retain an older callback closure and observe stale reactive values",
          "The component's local state is reset on each bailout",
        ],
        answer: 2,
        explanation:
          "Returning `true` reuses the previous rendered result, including its event handlers. Ignoring a changed callback can therefore preserve a closure from an older parent render.",
      },
    ],
  },
  {
    id: "react-architectural-performance",
    module: "performance",
    title: "Architectural Performance",
    blurb:
      "Reduce the amount of work created through state locality, composition, bounded rendering, and fewer chains.",
    content: forReact(
      (language) => `## Make less work before making work cheaper

The highest-leverage React optimization is usually a smaller update surface. Before adding identity controls, ask why an urgent interaction owns or invalidates so much of the tree. Architectural fixes improve the default path and remain valuable with or without React Compiler.

## Keep transient state local

State should live at the lowest common owner that needs it. Hoisting a hover, draft, disclosure, or input value to a page root makes every update begin at that root. Locality is not about hiding state; it is about matching ownership to the smallest meaningful update boundary.

Composition through \`children\` can preserve an already-created subtree while a wrapper updates its own state:

${reactCode(
  language,
  `import { useState } from "react";

function ResizablePanel({ children }) {
  const [width, setWidth] = useState(360);

  return (
    <section style={{ width }}>
      <input
        aria-label="Panel width"
        type="range"
        min="240"
        max="720"
        value={width}
        onChange={(event) => setWidth(Number(event.target.value))}
      />
      {children}
    </section>
  );
}

export default function AnalyticsPage({ report }) {
  return (
    <ResizablePanel>
      <ExpensiveReport report={report} />
    </ResizablePanel>
  );
}`,
  `import { useState, type ReactNode } from "react";

function ResizablePanel({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(360);

  return (
    <section style={{ width }}>
      <input
        aria-label="Panel width"
        type="range"
        min="240"
        max="720"
        value={width}
        onChange={(event) => setWidth(Number(event.target.value))}
      />
      {children}
    </section>
  );
}

type Report = {
  id: string;
  series: number[];
};

export default function AnalyticsPage({ report }: { report: Report }) {
  return (
    <ResizablePanel>
      <ExpensiveReport report={report} />
    </ResizablePanel>
  );
}`
)}

The parent creates \`ExpensiveReport\` once for a given page render and passes that element as \`children\`. A width update belongs to \`ResizablePanel\`; React can reconcile the same child element without the wrapper recreating it. This pattern is ownership design, not a guarantee that children never render—changes from their own state, context, or parent-created element still matter.

## Split context by change frequency and concern

A context consumer updates when its provider's \`value\` changes. One "application context" containing theme, current time, user, draft text, and actions gives fast-changing data a huge subscriber set. Split contexts by domain and update frequency. Separate state from actions when consumers need only dispatch, and stabilize provider objects when an object is genuinely the public value.

${reactCode(
  language,
  `import { createContext, useCallback, useMemo, useState } from "react";

const CartStateContext = createContext(null);
const CartActionsContext = createContext(null);

function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = useCallback((item) => {
    setItems((current) => [...current, item]);
  }, []);
  const actions = useMemo(() => ({ addItem }), [addItem]);

  return (
    <CartActionsContext value={actions}>
      <CartStateContext value={items}>{children}</CartStateContext>
    </CartActionsContext>
  );
}`,
  `import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CartItem = { id: string; name: string };
type CartActions = { addItem: (item: CartItem) => void };

const CartStateContext = createContext<CartItem[] | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => [...current, item]);
  }, []);
  const actions = useMemo(() => ({ addItem }), [addItem]);

  return (
    <CartActionsContext value={actions}>
      <CartStateContext value={items}>{children}</CartStateContext>
    </CartActionsContext>
  );
}`
)}

In React 19, the context object itself can be rendered as the provider. Consumers that subscribe only to actions no longer update merely because the item array changed. Do not split contexts mechanically; use Profiler "why did this render?" evidence and actual ownership boundaries.

## Bound large and optional work

Rendering 50,000 rows efficiently is still rendering 50,000 rows. **Virtualization** or windowing renders only the visible range plus overscan, bounding reconciliation and DOM size. It introduces real constraints—stable keys, item measurement, scroll anchoring, focus behavior, accessibility, and server-rendering strategy—so use a maintained implementation and test interaction behavior, not only frame rate.

Code splitting attacks a different cost: code that is not needed for the current route or interaction should not block initial download, parse, or evaluation. \`lazy\` loads a component module when React first attempts to render it, and \`Suspense\` supplies the nearest fallback:

${reactCode(
  language,
  `import { lazy, Suspense, useState } from "react";

const AuditTimeline = lazy(() => import("./AuditTimeline.js"));

export default function AccountPage() {
  const [showAudit, setShowAudit] = useState(false);

  return (
    <>
      <button onClick={() => setShowAudit(true)}>Show audit history</button>
      {showAudit && (
        <Suspense fallback={<AuditTimelineSkeleton />}>
          <AuditTimeline />
        </Suspense>
      )}
    </>
  );
}`,
  `import { lazy, Suspense, useState } from "react";

const AuditTimeline = lazy(() => import("./AuditTimeline.js"));

export default function AccountPage() {
  const [showAudit, setShowAudit] = useState(false);

  return (
    <>
      <button onClick={() => setShowAudit(true)}>Show audit history</button>
      {showAudit && (
        <Suspense fallback={<AuditTimelineSkeleton />}>
          <AuditTimeline />
        </Suspense>
      )}
    </>
  );
}`
)}

This creates an asynchronous reveal boundary; it does not make the timeline's later renders cheap. Place boundaries around coherent user experiences, consider preloading on intent when appropriate, and verify chunking with the actual framework bundler rather than assuming a dynamic import produced the desired network shape.

## Avoid Effects that manufacture render chains

An Effect runs after a commit. If it immediately derives state from props or other state, the browser receives one commit and React schedules another:

${reactCode(
  language,
  `function Invoice({ lines }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(lines.reduce((sum, line) => sum + line.amount, 0));
  }, [lines]);

  return <strong>{total}</strong>;
}`,
  `type Line = { id: string; amount: number };

function Invoice({ lines }: { lines: Line[] }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(lines.reduce((sum, line) => sum + line.amount, 0));
  }, [lines]);

  return <strong>{total}</strong>;
}`
)}

That total belongs in render:

${reactCode(
  language,
  `function Invoice({ lines }) {
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return <strong>{total}</strong>;
}`,
  `type Line = { id: string; amount: number };

function Invoice({ lines }: { lines: Line[] }) {
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return <strong>{total}</strong>;
}`
)}

If calculation is proven expensive, memoize the calculation; do not move it into an Effect. Effects are for synchronizing with external systems. Chains such as commit → Effect sets state → commit → another Effect sets state amplify work and expose intermediate states. Prefer deriving during render, updating related state in one event, or modeling transitions with a reducer.

Profile again after architectural changes. State locality should shrink the committed subtree, context splitting should reduce subscriber updates, virtualization should cap mounted rows, code splitting should alter resource timing, and removing an Effect chain should remove commits. Each fix predicts evidence you can verify.`,
    ),
    exercises: [
      {
        id: "react-estimate-update-surface",
        title: "Estimate an update surface",
        instructions: `Each component record names its parent and the contexts it consumes. Implement \`affectedByUpdate\`:

- A state update starts with the owner and all of its descendants.
- A context update starts with consumers of that context and all descendants of those consumers.
- Return affected component IDs in input order, without duplicates.

This simplified pure model helps compare state locality and context fan-out; real React may bail out or schedule work differently.

**Expected output:** \`[ 'search-panel', 'search-input', 'results' ]\` then \`[ 'toolbar', 'search-panel', 'search-input', 'results' ]\``,
        starterCode: reactVariants(
          `const tree = [
  { id: "page", parent: null, contexts: [] },
  { id: "toolbar", parent: "page", contexts: ["theme"] },
  { id: "search-panel", parent: "page", contexts: ["theme"] },
  { id: "search-input", parent: "search-panel", contexts: [] },
  { id: "results", parent: "search-panel", contexts: [] },
];

function affectedByUpdate(nodes, update) {
  // TODO: find roots, include every root and descendant, preserve input order.
  return [];
}

console.log(affectedByUpdate(tree, { kind: "state", owner: "search-panel" }));
console.log(affectedByUpdate(tree, { kind: "context", name: "theme" }));`,
          `type ComponentNode = {
  id: string;
  parent: string | null;
  contexts: string[];
};

type Update =
  | { kind: "state"; owner: string }
  | { kind: "context"; name: string };

const tree: ComponentNode[] = [
  { id: "page", parent: null, contexts: [] },
  { id: "toolbar", parent: "page", contexts: ["theme"] },
  { id: "search-panel", parent: "page", contexts: ["theme"] },
  { id: "search-input", parent: "search-panel", contexts: [] },
  { id: "results", parent: "search-panel", contexts: [] },
];

function affectedByUpdate(
  nodes: ComponentNode[],
  update: Update
): string[] {
  // TODO: find roots, include every root and descendant, preserve input order.
  return [];
}

console.log(affectedByUpdate(tree, { kind: "state", owner: "search-panel" }));
console.log(affectedByUpdate(tree, { kind: "context", name: "theme" }));`
        ),
      },
      {
        id: "react-count-effect-render-chain",
        title: "Expose an Effect render chain",
        instructions: `A render-derived field costs no additional commit; each Effect-derived state step schedules another commit. Implement \`countCommits\` so it starts at one commit and follows only fields whose source is \`"effect"\`, adding one commit per reachable Effect-derived field. Ignore cycles after the first visit.

Then change \`fullName\` and \`slug\` to \`"render"\` derivations and observe the chain collapse.

**Expected output before changing the records:** \`3\``,
        starterCode: reactVariants(
          `const fields = [
  { name: "profile", source: "event", dependsOn: null },
  { name: "fullName", source: "effect", dependsOn: "profile" },
  { name: "slug", source: "effect", dependsOn: "fullName" },
  { name: "badge", source: "render", dependsOn: "profile" },
];

function countCommits(records, changedField) {
  // TODO: begin at one and follow reachable effect-derived fields once.
  return 1;
}

console.log(countCommits(fields, "profile"));`,
          `type DerivedField = {
  name: string;
  source: "event" | "effect" | "render";
  dependsOn: string | null;
};

const fields: DerivedField[] = [
  { name: "profile", source: "event", dependsOn: null },
  { name: "fullName", source: "effect", dependsOn: "profile" },
  { name: "slug", source: "effect", dependsOn: "fullName" },
  { name: "badge", source: "render", dependsOn: "profile" },
];

function countCommits(
  records: DerivedField[],
  changedField: string
): number {
  // TODO: begin at one and follow reachable effect-derived fields once.
  return 1;
}

console.log(countCommits(fields, "profile"));`
        ),
      },
    ],
    quiz: [
      {
        id: "react-architectural-performance-q1",
        prompt:
          "A draft input value is used only by a small editor, but its state lives at the route root. What should be investigated first?",
        options: [
          "Move the draft state to the lowest owner that needs it and profile the resulting update surface",
          "Wrap every route child in `memo`",
          "Store the draft in one global context",
          "Mirror the draft into local state with an Effect",
        ],
        answer: 0,
        explanation:
          "State locality removes unnecessary parent-driven work at its source. Memoization may hide some symptoms, while global context or Effect mirroring usually broadens or multiplies updates.",
      },
      {
        id: "react-architectural-performance-q2",
        prompt:
          "Which problem does list virtualization address most directly?",
        options: [
          "Unstable callback identities passed to row components",
          "JavaScript bundle code for a route the user has not visited",
          "The unbounded reconciliation and DOM cost of rendering a very large list",
          "Context consumers updating when a provider value changes",
        ],
        answer: 2,
        explanation:
          "Virtualization bounds mounted work to a visible window plus overscan. It has separate measurement, focus, accessibility, and scroll-correctness constraints.",
      },
      {
        id: "react-architectural-performance-q3",
        prompt:
          "Why is deriving synchronous display state in an Effect often a performance smell?",
        options: [
          "Effects run before React calculates JSX",
          "Effect state cannot be read by event handlers",
          "React Compiler refuses to compile components containing Effects",
          "The Effect runs after a commit and setting state schedules another render and commit with an intermediate state",
        ],
        answer: 3,
        explanation:
          "Synchronous derivations belong in render; expensive ones can be measured and memoized. Effects should synchronize with external systems, not manufacture commit chains.",
      },
    ],
  },
];
