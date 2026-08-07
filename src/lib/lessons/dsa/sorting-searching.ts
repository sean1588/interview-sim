import type { Lesson } from "../types";

export const sortingSearchingLessons: Lesson[] = [
  {
    id: "dsa-binary-search",
    module: "sorting-searching",
    title: "Binary Search",
    blurb: "Halve the sorted search space; get the boundaries right.",
    graphics: [
      {
        id: "halve-space",
        title: "Halve the search space",
        caption:
          "On sorted data, compare the midpoint and discard half. Log n probes if the boundaries and loop invariant stay honest.",
        src: "/learn/dsa/dsa-binary-search.png",
      },
    ],
    content: `You've scanned arrays for a value a thousand times — \`indexOf\`, \`find\`, a \`for\` loop. All O(n): worst case touches every element. Binary search is what you get when the data is **sorted**: one comparison against the middle element tells you which half the target *can't* be in, so each step discards half the candidates.

That halving is the entire story. n → n/2 → n/4 → … hits 1 in log₂ n steps. For 1,000,000 elements that's **20 comparisons** instead of a million; for a billion, 30. "Is it sorted?" should be the first question you ask about any lookup problem.

The canonical loop — one convention, used course-wide: **inclusive bounds**.

\`\`\`ts
function binarySearch(sorted: number[], target: number): number {
  let lo = 0;
  let hi = sorted.length - 1;        // inclusive: hi is a real candidate
  while (lo <= hi) {                 // <= because a 1-element range is still live
    const mid = Math.floor((lo + hi) / 2);
    if (sorted[mid] === target) return mid;
    if (sorted[mid] < target) lo = mid + 1;  // mid is ruled out — skip past it
    else hi = mid - 1;                       // mid is ruled out — skip past it
  }
  return -1;
}
\`\`\`

Two disciplines kill the classic bugs:

1. **Every branch must shrink the range.** Always \`mid + 1\` or \`mid - 1\`, never \`lo = mid\` or \`hi = mid\`. With inclusive bounds, keeping \`mid\` in the range can leave a 2-element range unchanged forever — the infinite loop everyone writes exactly once.
2. **The loop condition matches the bound convention.** Inclusive \`hi\` pairs with \`lo <= hi\`. Mixing conventions (inclusive bounds with \`lo < hi\`, or exclusive with \`<=\`) is where off-by-one bugs breed. Pick one convention and never improvise.

The precondition is absolute: **the array must be sorted.** On unsorted data binary search doesn't throw — it confidently returns wrong answers, typically \`-1\` for an element that's right there. Nothing checks sortedness at runtime; it's a contract you carry in your head.

Variant preview: with duplicates, the loop above returns *some* matching index — no promise which. Bias it — on a hit, record the index and keep searching **left** — and the same loop finds the *first* occurrence. That biased shape is the bridge to the next lesson.`,
    exercises: [
    {
      id: "dsa-binary-search-impl",
      title: "The canonical loop",
      instructions: `Implement \`binarySearch(sorted, target)\` returning the index of \`target\`, or \`-1\` if absent.

Use the course convention: inclusive \`lo\`/\`hi\` (\`hi = sorted.length - 1\`) with \`while (lo <= hi)\`. The bug-killer rule: **every branch must shrink the range** — move to \`mid + 1\` or \`mid - 1\`, never to \`mid\` itself, or a 2-element range can loop forever.

Expected output: \`5\`, \`-1\`, \`0\`, \`9\` — a hit, a miss, and both edge elements.`,
      starterCode: `function binarySearch(sorted: number[], target: number): number {
  // TODO: inclusive bounds — lo = 0, hi = sorted.length - 1
  // while (lo <= hi):
  //   mid = Math.floor((lo + hi) / 2)
  //   sorted[mid] === target -> return mid
  //   sorted[mid] < target   -> lo = mid + 1   (shrink!)
  //   otherwise              -> hi = mid - 1   (shrink!)
  return -1;
}

const sortedNums = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];

console.log(binarySearch(sortedNums, 23)); // expected: 5  (hit in the middle)
console.log(binarySearch(sortedNums, 40)); // expected: -1 (miss)
console.log(binarySearch(sortedNums, 2)); // expected: 0  (first element)
console.log(binarySearch(sortedNums, 91)); // expected: 9  (last element)
`,
    },
    {
      id: "dsa-first-occurrence",
      title: "First occurrence",
      instructions: `Implement \`firstOccurrence(sorted, target)\` returning the **leftmost** index of \`target\` among duplicates, or \`-1\` if absent.

Same inclusive-bounds loop as \`binarySearch\`, one change: on a hit, don't return — **record the index and keep searching left** (\`hi = mid - 1\`). Earlier occurrences can only live to the left; the last index you recorded is the answer.

Expected output: \`2\` (leftmost of the run of 7s), \`6\`, \`-1\`.`,
      starterCode: `function firstOccurrence(sorted: number[], target: number): number {
  // TODO: same lo/hi/mid loop as binarySearch, with one change —
  // on a hit, RECORD the index and keep searching LEFT (hi = mid - 1)
  // instead of returning. Return the last recorded index (or -1).
  return -1;
}

const withDupes = [1, 3, 7, 7, 7, 7, 9, 12];

console.log(firstOccurrence(withDupes, 7)); // expected: 2 (leftmost of the run of 7s)
console.log(firstOccurrence(withDupes, 9)); // expected: 6 (single occurrence)
console.log(firstOccurrence(withDupes, 5)); // expected: -1 (absent)
`,
    },
    ],
    quiz: [
    {
      id: "dsa-binary-search-q1",
      prompt: "You binary search a sorted array of 1,000,000 elements for a value that is NOT present. Roughly how many comparisons does that take?",
      options: [
        "About 1,000 — binary search is O(√n)",
        "About 500,000 — on average you check half the array",
        "Exactly 1,000,000 — a miss must rule out every element",
        "About 20 — the range halves each step, and log₂(1,000,000) ≈ 20",
      ],
      answer: 3,
      explanation: "Each comparison discards half the remaining candidates, so the range collapses from a million to one in about log₂(1,000,000) ≈ 20 steps — hit or miss.",
    },
    {
      id: "dsa-binary-search-q2",
      prompt: "In the inclusive-bounds loop (`while (lo <= hi)`), why must the branches use `lo = mid + 1` / `hi = mid - 1` instead of `lo = mid` / `hi = mid`?",
      options: [
        "Keeping `mid` in the range can leave a small range unchanged, so the loop never terminates",
        "Using `mid` directly would skip over the target and return -1 on valid hits",
        "It changes the complexity from O(log n) to O(n)",
        "It only matters when the array contains duplicate values",
      ],
      answer: 0,
      explanation: "With inclusive bounds, `lo = mid` on a 2-element range can recompute the same `mid` forever — the classic infinite loop. Every branch must strictly shrink the range.",
    },
    {
      id: "dsa-binary-search-q3",
      prompt: "You run `binarySearch` on an array that is NOT sorted. What happens?",
      options: [
        "It throws an error when it detects out-of-order elements",
        "It returns confidently wrong answers — often -1 for an element that is present — with no error",
        "It still finds the target, just in O(n) instead of O(log n)",
        "It works as long as the target happens to be near the middle",
      ],
      answer: 1,
      explanation: "Nothing validates sortedness at runtime. The comparisons discard halves based on an ordering assumption that doesn't hold, so the search silently walks away from the target.",
    },
    ],
  },
  {
    id: "dsa-search-the-answer",
    module: "sorting-searching",
    title: "Binary Searching the Answer",
    blurb: "The first-true boundary: binary search beyond arrays.",
    graphics: [
      {
        id: "answer-space",
        title: "Binary search the answer",
        caption:
          "When the feasible region is monotonic on a range, binary search over the answer itself — not just over array indexes.",
        src: "/learn/dsa/dsa-search-the-answer.png",
      },
    ],
    content: `Strip binary search to its essentials and the array disappears. What it actually needs is a **monotonic predicate**: a boolean function over an ordered domain that reads \`false, false, false, true, true, true\` — once it flips to true, it never flips back. Any such predicate has a boundary (the *first true*), and binary search finds it in O(log n) probes. You don't need an array in memory — just the ability to evaluate the predicate at any point.

Recast problems you already know into this frame:

- **Insertion point** — over indices, \`sorted[i] >= target\` is false…false, true…true. The first true is where the target belongs (and it's what \`lodash.sortedIndex\` computes).
- **First bad version** — builds go good, good, good, bad, bad. \`isBad(v)\` is monotonic; the boundary is the culprit build. \`git bisect\` is exactly this search.
- **Capacity/speed problems** — "smallest shipping capacity that finishes within D days." \`canFinish(capacity)\` is monotonic: if capacity c works, every larger capacity works too. You binary search over *candidate answers*, not over data.

The first-true loop is a different shape from exact-match — learn both, never blend them:

\`\`\`ts
let lo = 0, hi = n;                // hi EXCLUSIVE — returning n means "no true exists"
while (lo < hi) {
  const mid = Math.floor((lo + hi) / 2);
  if (predicate(mid)) hi = mid;    // mid might BE the boundary — keep it in range
  else lo = mid + 1;               // mid is definitely not the answer — discard it
}
return lo;                         // lo === hi: the first true (or n)
\`\`\`

Note the asymmetry, because it's the whole trick: on true you set \`hi = mid\`, **not** \`mid - 1\`. A true at \`mid\` might be the first true — you must never discard a possible answer. A false at \`mid\` can't be the answer, so \`lo = mid + 1\` is safe. The loop still terminates because \`mid\` is always strictly less than \`hi\` while \`lo < hi\`, so \`hi = mid\` genuinely shrinks the range.

Why this frame earns its keep: **the predicate is often expensive.** Each \`canFinish(capacity)\` probe is an O(n) simulation; each \`isBad(version)\` might be a full CI run. Twenty probes to cover a million candidates is the difference between feasible and absurd.`,
    exercises: [
    {
      id: "dsa-insertion-point",
      title: "Insertion point",
      instructions: `Implement \`insertionPoint(sorted, target)\` — the first index whose value is \`>= target\`, or \`n\` (the length) if no such index exists.

This is the **first-true** shape, not exact-match: exclusive \`hi = sorted.length\`, \`while (lo < hi)\`, and on true set \`hi = mid\` (mid might *be* the boundary — never discard a possible answer), on false \`lo = mid + 1\`. Return \`lo\`. Contrast with the exact-match loop: there every branch skips past \`mid\`; here the true branch keeps it.

Expected output: \`2\` (value present), \`3\` (fits between elements), \`5\` (past the end → n).`,
      starterCode: `function insertionPoint(sorted: number[], target: number): number {
  // TODO: first-true boundary loop — note how it differs from exact-match:
  //   lo = 0, hi = sorted.length   (hi is EXCLUSIVE; returning n means "no index qualifies")
  //   while (lo < hi):
  //     mid = Math.floor((lo + hi) / 2)
  //     sorted[mid] >= target -> hi = mid      (mid might BE the answer — keep it)
  //     otherwise             -> lo = mid + 1  (mid is ruled out — discard it)
  //   return lo
  return 0;
}

const sortedVals = [10, 20, 30, 40, 50];

console.log(insertionPoint(sortedVals, 30)); // expected: 2 (value present)
console.log(insertionPoint(sortedVals, 35)); // expected: 3 (fits between 30 and 40)
console.log(insertionPoint(sortedVals, 99)); // expected: 5 (past the end -> n)
`,
    },
    {
      id: "dsa-first-bad-version",
      title: "First bad version",
      instructions: `The checker is **given complete**: \`isBad(version)\` returns true from a hidden threshold onward and counts how many times you call it. Implement \`firstBad(n)\` to find the first bad version using the boundary loop over \`1..n\`: \`while (lo < hi)\`, bad → \`hi = mid\`, good → \`lo = mid + 1\`.

The probe count is the point — call \`isBad\` only inside the loop.

Expected output: \`first bad version: 722018\` and \`isBad probes:\` around 20 — log₂ of 1,000,000 probes, when each probe could be a full CI run.`,
      starterCode: `// GIVEN (complete): a build checker. Versions are bad from a hidden
// threshold onward, and every isBad call is counted — the probe count
// is the whole point of this exercise.
function makeChecker(hiddenFirstBad: number) {
  let calls = 0;
  return {
    isBad: (version: number): boolean => {
      calls += 1;
      return version >= hiddenFirstBad;
    },
    callCount: (): number => calls,
  };
}

const checker = makeChecker(722_018);
const isBad = checker.isBad;

function firstBad(n: number): number {
  // TODO: boundary search over versions 1..n using isBad(version):
  //   lo = 1, hi = n
  //   while (lo < hi):
  //     isBad(mid) -> hi = mid      (mid might be the first bad one — keep it)
  //     otherwise  -> lo = mid + 1
  //   return lo
  return 1;
}

const found = firstBad(1_000_000);
console.log("first bad version:", found); // expected: 722018
console.log("isBad probes:", checker.callCount()); // expected: ~20 (log2 of 1,000,000)
`,
    },
    ],
    quiz: [
    {
      id: "dsa-search-the-answer-q1",
      prompt: "What does binary search fundamentally require in order to work?",
      options: [
        "A monotonic predicate over an ordered domain — once it flips false→true it never flips back",
        "A sorted array materialized in memory",
        "Random access into a concrete collection of elements",
        "A domain with no duplicate values",
      ],
      answer: 0,
      explanation: "The array is just one instance. Anything that reads false…false, true…true has a boundary findable in O(log n) probes — first bad version and capacity problems have no array at all.",
    },
    {
      id: "dsa-search-the-answer-q2",
      prompt: "In the first-true loop, why is the true branch `hi = mid` rather than `hi = mid - 1`?",
      options: [
        "`hi = mid - 1` would make the loop run forever",
        "`mid` might itself be the first true — `mid - 1` could discard the answer",
        "It keeps the range larger, which makes each probe more informative",
        "It only matters when the predicate has duplicate boundary points",
      ],
      answer: 1,
      explanation: "A true at `mid` doesn't tell you whether an earlier true exists, so `mid` stays a candidate. Only the false branch may discard `mid`, because a false is definitely not the boundary.",
    },
    {
      id: "dsa-search-the-answer-q3",
      prompt: "“Find the smallest shipping capacity that delivers all packages within D days.” Why does binary search fit this problem?",
      options: [
        "The package weights array is sorted, so binary search applies to it directly",
        "Binary search enumerates every candidate capacity faster than a for loop would",
        "Feasibility is monotonic in capacity: if capacity c works, every larger capacity works, so the first workable capacity is a findable boundary",
        "It doesn't fit — binary search only applies to arrays, not to numeric answers",
      ],
      answer: 2,
      explanation: "You search the answer space, not the data: `canFinish(capacity)` reads false…false, true…true. Each probe is an O(n) simulation, so finding the boundary in ~log₂(range) probes is the entire win.",
    },
    ],
  },
  {
    id: "dsa-sorting-survey",
    module: "sorting-searching",
    title: "How Sorting Actually Works",
    blurb: "Insertion, merge, quick — and using the built-in well.",
    graphics: [
      {
        id: "sort-family",
        title: "Three faces of sorting",
        caption:
          "Merge combines sorted halves, bubble/selection swap locally, quick partitions around a pivot. Know the shape; reach for the built-in for production.",
        src: "/learn/dsa/dsa-sorting-survey.png",
      },
    ],
    content: `Three mechanisms cover what's inside virtually every real sort.

**Insertion sort** grows a sorted prefix: take the next element, shift it backward until it sits in place. O(n²) — at n = 1,000,000 that's ~10¹² steps, never your main sort — but on tiny (≲16 elements) or nearly-sorted input it's the fastest thing running: no recursion, no allocation, and almost no shifts when things are close to ordered. That's exactly why production sorts use it as their base case.

**Merge sort** splits in half, recursively sorts each half, then **merges** two sorted halves with two pointers: repeatedly take the smaller head, then drain whichever side has a leftover tail. The merge is O(n + m); the whole sort is **O(n log n) guaranteed** — no input can degrade it. It's stable, at the cost of O(n) extra space for the merge buffer.

**Quicksort** partitions in place around a pivot — smaller elements left, larger right — then recurses on both sides. O(n log n) average with great constants and no extra array, but adversarial pivots (say, first-element pivots on already-sorted input) degrade it to O(n²).

**Stability**, defined once, properly: a stable sort keeps *equal* elements in their original relative order. That's what makes layered sorting work — sort orders by date, then stably sort by customer, and within each customer the date order survives. Unstable sorts silently scramble that second-level order.

Now the layer you actually ship. JavaScript's default \`.sort()\` compares elements **as strings**:

\`\`\`ts
[10, 9, 1].sort();                 // [1, 10, 9]  — "10" < "9" as strings!
[10, 9, 1].sort((a, b) => a - b);  // [1, 9, 10]
\`\`\`

Always pass a comparator for numbers. The contract: return negative to put \`a\` first, positive to put \`b\` first, zero for a tie — \`(a, b) => a - b\` ascending, \`b - a\` descending. Two more things worth knowing: \`.sort()\` **mutates** the array in place (use \`toSorted()\` — or copy first — when you need the original intact), and the spec requires \`Array.prototype.sort\` to be stable, so layered comparator tricks are safe in every modern engine.`,
    exercises: [
    {
      id: "dsa-merge-step",
      title: "The merge step",
      instructions: `Implement \`merge(a, b)\` combining two **already-sorted** arrays into one sorted array in O(n + m): two pointers, repeatedly push the smaller head and advance that pointer.

Don't forget the **tail drain**: when one array runs out, the other still has elements — append them all. Forgetting the drain is *the* classic merge bug, and the one-empty-array example will catch it.

Expected output: \`[1, 2, 4, 5, 8, 9]\`, \`[1, 2, 5, 10, 11]\`, \`[3, 6]\`.`,
      starterCode: `function merge(a: number[], b: number[]): number[] {
  // TODO: two pointers i (into a) and j (into b).
  // While both have elements left, push the smaller and advance its pointer.
  // Then DRAIN the leftover tail — exactly one array still has elements,
  // and forgetting this drain is the classic bug.
  return [];
}

console.log(merge([1, 4, 9], [2, 5, 8])); // expected: [1, 2, 4, 5, 8, 9]
console.log(merge([1, 2, 10, 11], [5])); // expected: [1, 2, 5, 10, 11]
console.log(merge([], [3, 6])); // expected: [3, 6]
`,
    },
    {
      id: "dsa-comparator-fix",
      title: "Fix the comparator",
      instructions: `The starter shows the default-\`.sort()\` trap live: \`[10, 9, 1, 200].sort()\` prints \`[1, 10, 200, 9]\` (string comparison). Two TODOs:

1. \`numericSort(nums)\` — return a new numerically-sorted array **without mutating the input**. Either \`toSorted((a, b) => a - b)\` or copy-then-sort (\`[...nums].sort(...)\`).
2. \`byAgeThenName(people)\` — sort by \`age\` ascending, break ties by \`name\` (\`localeCompare\`). One comparator: compare ages; if equal, compare names.

Expected output: \`[1, 9, 10, 200]\`, the untouched input \`[10, 9, 1, 200]\`, then Alex (28), Bo (35), Dana (35).`,
      starterCode: `// Surprise: with no comparator, .sort() compares elements as STRINGS.
const sortedWrong = [10, 9, 1, 200].sort();
console.log("default sort:", sortedWrong); // [1, 10, 200, 9] — "9" > "200" as strings

function numericSort(nums: number[]): number[] {
  // TODO: return a NEW array sorted numerically — do NOT mutate nums.
  // Either copy-then-sort ([...nums].sort(...)) or use toSorted(...).
  // The comparator for ascending numbers is (a, b) => a - b.
  return [...nums];
}

interface Person {
  name: string;
  age: number;
}

function byAgeThenName(people: Person[]): Person[] {
  // TODO: return a NEW array sorted by age ascending; break age ties by
  // name (localeCompare). Comparator contract: negative / zero / positive.
  return [...people];
}

const rawNums = [10, 9, 1, 200];
console.log("numericSort:", numericSort(rawNums)); // expected: [1, 9, 10, 200]
console.log("input untouched:", rawNums); // expected: [10, 9, 1, 200]

const team: Person[] = [
  { name: "Dana", age: 35 },
  { name: "Alex", age: 28 },
  { name: "Bo", age: 35 },
];
console.log("byAgeThenName:", byAgeThenName(team));
// expected order: Alex (28), Bo (35), Dana (35)
`,
    },
    ],
    quiz: [
    {
      id: "dsa-sorting-survey-q1",
      prompt: "What does `[10, 9, 1].sort()` evaluate to, and why?",
      options: [
        "`[1, 10, 9]` — without a comparator, elements are compared as strings",
        "`[1, 9, 10]` — numbers sort numerically by default",
        "`[10, 9, 1]` — sort returns a new array and leaves the original order here",
        "It throws a TypeError — numeric arrays require a comparator",
      ],
      answer: 0,
      explanation: "The default comparator stringifies: \"10\" < \"9\" because \"1\" < \"9\" character-by-character. Always pass `(a, b) => a - b` for numbers.",
    },
    {
      id: "dsa-sorting-survey-q2",
      prompt: "You sort a list of orders by date, then sort that result by customer using a stable sort. What does stability guarantee?",
      options: [
        "The second sort runs in O(n log n) worst case",
        "Within each customer, the orders remain in date order — equal keys keep their prior relative order",
        "The second sort does not mutate the input array",
        "Each customer's orders end up grouped together, but in arbitrary internal order",
      ],
      answer: 1,
      explanation: "Stability means equal elements (same customer) keep the relative order they arrived in — which is the date order from the first sort. That layering is the practical payoff of stability.",
    },
    {
      id: "dsa-sorting-survey-q3",
      prompt: "Why do production sorts (like V8's) switch to insertion sort for small subarrays instead of recursing all the way down?",
      options: [
        "Insertion sort becomes O(n log n) once the input is below a size threshold",
        "Insertion sort is unstable, which makes it faster on small inputs",
        "On tiny or nearly-sorted input, insertion sort's low overhead beats the recursive machinery despite its O(n²) worst case",
        "Merge sort produces incorrect results on arrays shorter than the threshold",
      ],
      answer: 2,
      explanation: "Big-O describes growth, not constants. At n ≈ 16 the n² term is tiny, and insertion sort's no-recursion, no-allocation inner loop wins — so hybrid sorts use it as the base case.",
    },
    ],
  },
];
