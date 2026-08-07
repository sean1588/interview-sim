import type { Lesson } from "../types";

export const arraysStringsLessons: Lesson[] = [
  {
    id: "dsa-two-pointers",
    module: "arrays-strings",
    title: "Two Pointers",
    blurb: "Converging indexes that replace nested loops on ordered data.",
    graphics: [
      {
        id: "two-ends",
        title: "Pointers from both ends",
        caption:
          "On ordered data, two indexes can walk toward (or past) each other and discard half the possibilities per step — often replacing an O(n²) nested scan.",
        src: "/lesson-graphics/dsa/dsa-two-pointers.png",
      },
    ],
    content: `## The problem with pairs

Any question of the form "find two elements that..." has an obvious answer: nested loops, check every pair. That's O(n²) — 10,000 elements means ~50 million comparisons. Fine in a unit test, painful in a hot path.

Two pointers replaces that with a single O(n) pass — **when the data has order you can exploit.**

## The mechanism

Two indexes walk the array, usually converging from opposite ends:

\`\`\`ts
let left = 0;
let right = arr.length - 1;
while (left < right) {
  // examine arr[left] and arr[right], move exactly one pointer inward
}
\`\`\`

The core insight — and the reason this is linear — is that **each comparison lets you discard one pointer's element forever.**

Take pair-with-target-sum in a *sorted* array. Look at \`arr[left] + arr[right]\`:

- **Sum too small?** Then \`arr[left]\` is useless with *every* remaining partner — \`arr[right]\` is already the largest one available, and even that wasn't enough. Discard it: \`left++\`.
- **Sum too big?** Symmetric: \`arr[right]\` overshoots even with the smallest partner. Discard it: \`right--\`.

Every iteration permanently retires one element. With n elements you get at most n-1 iterations. No pair is ever "missed" because a discarded element was *proven* unable to participate — that proof is what sortedness buys you. On unsorted data the discard argument collapses, and so does the technique.

## Where it shows up

- **Palindrome check** — the "order" here is symmetry: position i must mirror position n-1-i. Compare ends, walk inward, O(n) time and O(1) space (versus building a reversed copy, which costs O(n) extra space).
- **Pair with target sum in a sorted array** — the discard logic above.
- **Reversing in place** — swap at the pointers, converge.
- **Read/write pointers** (both moving forward): filtering an array in place — the read pointer scans everything, the write pointer marks where the next keeper lands. You've written this ad hoc whenever you compacted an array without allocating a new one.

## When to reach for it

Sorted or symmetric data plus a pair/containment question — think two pointers before nested loops. If the array is **unsorted** and you can't sort it (order matters, or you can't afford O(n log n)), the tool is a hash map of seen values instead — same O(n) time, but O(n) space. That trade is the next module's opening act.`,
    exercises: [
    {
      id: "dsa-palindrome-check",
      title: "Palindrome with two pointers",
      instructions: `Implement \`isPalindrome(s)\` with two pointers: \`left\` starting at 0, \`right\` at the end, walking toward each other and comparing characters.

**Do not build a reversed copy** (\`s.split("").reverse().join("")\`) and compare — that's O(n) extra space and skips the whole point. The pointer walk uses O(1) space and can bail out on the first mismatch.

Expected output: \`true\`, \`true\`, \`false\`.`,
      starterCode: `function isPalindrome(s: string): boolean {
  let left = 0;
  let right = s.length - 1;
  // TODO: walk the pointers toward each other.
  // Compare s[left] and s[right]; on mismatch return false,
  // otherwise move both pointers inward until they meet.
  // Do NOT build a reversed copy of the string.
  return false;
}

console.log(isPalindrome("racecar")); // expected: true
console.log(isPalindrome("noon"));    // expected: true
console.log(isPalindrome("rocket")); // expected: false
`,
    },
    {
      id: "dsa-pair-sum-sorted",
      title: "Pair sum in a sorted array",
      instructions: `Implement \`pairWithSum(sorted, target)\`: return the two **values** that add up to \`target\` as \`[smaller, larger]\`, or \`null\` if no pair exists. The input is sorted ascending — use converging pointers, not nested loops.

Why moving the right pointer is safe when the sum is too big: \`sorted[right]\` was just tested against \`sorted[left]\`, the **smallest** remaining partner, and still overshot — so it can't pair with anything. It's discarded forever. Same logic mirrored when the sum is too small. Each step retires one element, so the loop runs at most n-1 times: O(n).

Expected output: \`[ 1, 9 ]\`, then \`null\`.`,
      starterCode: `function pairWithSum(sorted: number[], target: number): [number, number] | null {
  let left = 0;
  let right = sorted.length - 1;
  // TODO: while left < right, look at sum = sorted[left] + sorted[right].
  //   sum === target -> return [sorted[left], sorted[right]]
  //   sum < target   -> left++   (sorted[left] can never work: discard it)
  //   sum > target   -> right--  (sorted[right] can never work: discard it)
  return null;
}

console.log(pairWithSum([1, 2, 4, 6, 9, 11], 10)); // expected: [1, 9]
console.log(pairWithSum([2, 3, 5, 8], 4));         // expected: null
`,
    },
    ],
    quiz: [
    {
      id: "dsa-two-pointers-q1",
      prompt: "Converging two pointers finds a pair-with-target-sum in a sorted array in O(n). What makes that linear bound valid?",
      options: [
        "Every comparison proves one pointer's element can't be part of any answer, so it's discarded permanently — at most n-1 steps total",
        "Each comparison halves the remaining search range, like binary search",
        "Sortedness means the answer pair is always adjacent, so one scan finds it",
        "The two pointers each scan the full array once, giving O(2n) which simplifies to O(n)",
      ],
      answer: 0,
      explanation: "The linear bound comes from permanent elimination: a too-small sum proves the left element fails with every remaining partner (the right one was its best shot), so each iteration retires one element for good. Nothing is halved, and the answer pair need not be adjacent.",
    },
    {
      id: "dsa-two-pointers-q2",
      prompt: "You need pair-with-target-sum in an UNSORTED array, and you must preserve the original order (no sorting). What's the right tool?",
      options: [
        "Converging two pointers on the array as-is — the technique doesn't require sorted input",
        "A hash map/Set of values seen so far — one O(n) pass, checking `target - x` at each element, at the cost of O(n) space",
        "Nested loops — without sorted order, O(n²) is unavoidable",
        "Binary search for `target - x` for each element x",
      ],
      answer: 1,
      explanation: "Without order, the pointer discard argument collapses — but a hash of seen values answers \"have I seen the complement?\" in O(1), keeping the whole scan O(n) with O(n) space. Two pointers and binary search both silently require sorted data, and nested loops are not the only option.",
    },
    {
      id: "dsa-two-pointers-q3",
      prompt: "Checking a palindrome by comparing against a reversed copy vs. walking two pointers inward — both are O(n) time. What does the pointer version actually buy you?",
      options: [
        "It drops the time complexity to O(log n)",
        "The reversed-copy version returns wrong answers for even-length strings",
        "O(1) extra space instead of the O(n) copy, plus early exit on the first mismatched pair",
        "The pointer version only reads half as many characters in the worst case",
      ],
      answer: 2,
      explanation: "The win is space (no allocation) and early exit — a mismatch at the ends returns immediately, while the copy version pays full O(n) allocation up front no matter what. Time class is the same, and the copy version is correct, just wasteful. In the worst case (a true palindrome) the pointer walk still examines every character.",
    },
    ],
  },
  {
    id: "dsa-sliding-window",
    module: "arrays-strings",
    title: "Sliding Windows",
    blurb: "Fixed and growing windows over subarrays and substrings.",
    graphics: [
      {
        id: "window",
        title: "A window that slides",
        caption:
          "Maintain a contiguous range over the array or string, expand when you can, shrink when the constraint breaks — still O(n) overall if each edge only moves forward.",
        src: "/lesson-graphics/dsa/dsa-sliding-window.png",
      },
    ],
    content: `## Two pointers, but they bound a range

A sliding window is the two-pointer variant where the pointers mark the edges of a contiguous range, and you maintain a **running summary** of what's inside instead of recomputing it from scratch each time the range moves. That reuse is the whole trick.

## Fixed-size windows

"Max sum of any k consecutive elements." The naive version sums each window independently:

\`\`\`ts
// O(n · k): for n = 100,000 and k = 1,000 that's ~100 million adds
for (let i = 0; i + k <= nums.length; i++) {
  let sum = 0;
  for (let j = i; j < i + k; j++) sum += nums[j];
}
\`\`\`

But adjacent windows share k-1 elements — resumming them is pure waste. Slide instead: subtract the element leaving on the left, add the element entering on the right.

\`\`\`ts
windowSum += nums[i] - nums[i - k]; // O(1) per slide → O(n) total
\`\`\`

Same n and k: ~100,000 operations instead of ~100 million.

## Variable-size windows

When the constraint is a *property* rather than a size — "longest substring without repeated characters" — the window grows and shrinks:

- **Grow** the right edge one step per iteration.
- **Shrink** the left edge only while the constraint is broken (e.g., the entering char is already in a \`Set\` of window contents).

The framing that keeps this correct is the **invariant: between iterations, the window is always valid.** Every loop iteration admits one new element, restores validity, then records the window size. You never have to reason about invalid states — they exist only transiently inside the shrink loop.

It looks like a nested loop, but it's O(n): the left edge only ever moves forward, so across the *entire run* each pointer advances at most n times — at most 2n pointer movements total, not n per iteration.

## When it does NOT apply

- **Non-contiguous subsequences.** A window is a contiguous range by definition; "longest increasing subsequence" is a different tool entirely.
- **When "growing helps" breaks.** Some window arguments assume adding elements moves you monotonically toward/past the goal (true for sums of positive numbers). Negative numbers can break that: growing the window might *shrink* the sum, so "shrink when too big" no longer makes decisions you can trust.

Reach for a window whenever you see **contiguous** + **best/count of ranges satisfying X** — and check the monotonicity assumption before trusting it.`,
    exercises: [
    {
      id: "dsa-max-window-sum",
      title: "Max sum of k neighbors",
      instructions: `Implement \`maxWindowSum(nums, k)\`: the maximum sum over all windows of exactly \`k\` consecutive elements.

Sum the first window once, then slide: \`windowSum += nums[i] - nums[i - k]\` (add the entering element, subtract the leaving one). **Do not re-sum each window with an inner loop** — that's O(n·k); adjacent windows share k-1 elements, and the rolling update makes each slide O(1) for O(n) total.

Expected output: \`9\`, \`9\`, \`0\`.`,
      starterCode: `function maxWindowSum(nums: number[], k: number): number {
  if (nums.length < k || k <= 0) return 0;
  // TODO: sum the first k elements once.
  // Then slide the window one step at a time:
  //   windowSum += nums[i] - nums[i - k]  (add entering, subtract leaving)
  // and track the max. Do NOT re-sum each window from scratch.
  return 0;
}

console.log(maxWindowSum([2, 1, 5, 1, 3, 2], 3));  // expected: 9  (5+1+3)
console.log(maxWindowSum([4, -1, 2, 7, -3], 2));   // expected: 9  (2+7)
console.log(maxWindowSum([5], 3));                 // expected: 0  (no window fits)
`,
    },
    {
      id: "dsa-longest-unique",
      title: "Longest run of unique characters",
      instructions: `Implement \`longestUniqueRun(s)\`: the length of the longest contiguous substring with no repeated character.

Use a grow-right/shrink-left window with a \`Set\` of the characters currently inside. For each new right-edge character: while it's already in the Set, delete \`s[leftEdge]\` and advance \`leftEdge\`; then add it and update the best length.

**Invariant: between iterations the window never contains a duplicate.** Each iteration admits one character, restores the invariant by shrinking, then measures. Both edges only move forward, so the whole thing is O(n).

Expected output: \`3\`, \`1\`, \`3\`.`,
      starterCode: `function longestUniqueRun(s: string): number {
  const inWindow = new Set<string>();
  let leftEdge = 0;
  let best = 0;
  // TODO: for each right edge, if s[right] is already in the Set,
  // shrink from the left (delete s[leftEdge], leftEdge++) until it isn't.
  // Then add s[right] and update best with the window size.
  // Invariant: between iterations the window [leftEdge, right] has no duplicate.
  return best;
}

console.log(longestUniqueRun("abcabcbb")); // expected: 3  ("abc")
console.log(longestUniqueRun("bbbbb"));    // expected: 1  ("b")
console.log(longestUniqueRun("pwwkew"));   // expected: 3  ("wke")
`,
    },
    ],
    quiz: [
    {
      id: "dsa-sliding-window-q1",
      prompt: "For max-sum-of-k-consecutive over n = 100,000 elements with k = 1,000: what's the cost of re-summing each window vs. the rolling subtract-leaving/add-entering update?",
      options: [
        "Re-summing is O(n·k) ≈ 100 million operations; the rolling update is O(n) ≈ 100,000",
        "Both are O(n) — the inner sum is over a constant-size window, so it doesn't affect the asymptotic class",
        "Re-summing is O(n²) ≈ 10 billion operations; rolling is O(n log n)",
        "Re-summing is O(n·k) but the rolling update is O(n + k), so the gap only matters when k is small",
      ],
      answer: 0,
      explanation: "Each of ~n window positions re-sums k elements → O(n·k) ≈ 10⁵ × 10³ = 10⁸ operations, versus one O(1) update per slide → ~10⁵. k is an input, not a constant, so it can't be waved out of the bound — and the gap grows with k, it doesn't shrink.",
    },
    {
      id: "dsa-sliding-window-q2",
      prompt: "Which of these problems is NOT a sliding-window candidate?",
      options: [
        "Longest substring of a string containing no repeated characters",
        "Longest increasing subsequence, where picked elements need not be adjacent",
        "Maximum sum of any k consecutive elements of an array",
        "Shortest contiguous run of positive numbers whose sum reaches a threshold",
      ],
      answer: 1,
      explanation: "A window is by definition a contiguous range; a subsequence can skip elements, so no [left, right] pair can represent the candidates. The other three are all questions about contiguous runs — exactly what windows answer.",
    },
    {
      id: "dsa-sliding-window-q3",
      prompt: "The variable-size window loop has a `while` (shrink left) nested inside a `for` (grow right), yet runs in O(n). Why?",
      options: [
        "The inner while can execute at most once per outer iteration",
        "Set.add and Set.delete are O(log n), which cancels the nesting",
        "The left edge only moves forward, so across the entire run each pointer advances at most n times — ~2n steps total regardless of how they interleave",
        "It's actually O(n²) in the worst case; O(n) only describes the average",
      ],
      answer: 2,
      explanation: "Amortize over the whole run: total work equals total pointer movement, and each edge moves monotonically forward through n positions — at most 2n steps combined. A single outer iteration CAN shrink many times (so the once-per-iteration claim is false), but those shrinks are paid for by earlier growth. Set operations are O(1).",
    },
    ],
  },
  {
    id: "dsa-prefix-sums",
    module: "arrays-strings",
    title: "Prefix Sums",
    blurb: "Precompute running totals; answer range queries in O(1).",
    graphics: [
      {
        id: "running-total",
        title: "Running totals",
        caption:
          "Precompute cumulative sums once; any subarray sum becomes two lookups. Trade a linear prep for constant-time range answers.",
        src: "/lesson-graphics/dsa/dsa-prefix-sums.png",
      },
    ],
    content: `## Pay once, query forever

"What's the sum of elements i through j?" asked once is a loop. Asked thousands of times against the same array — analytics buckets, time-series ranges, game boards — it's a performance bug: O(n) per query, O(n·m) for m queries.

Prefix sums move all that work into one preprocessing pass. Build \`prefix\` where \`prefix[i]\` = sum of the **first i elements**:

\`\`\`ts
// nums:   [3, 1, 4, 1, 5]
// prefix: [0, 3, 4, 8, 9, 14]   <- length n + 1, prefix[0] = 0
const prefix = new Array(nums.length + 1).fill(0);
for (let i = 0; i < nums.length; i++) {
  prefix[i + 1] = prefix[i] + nums[i];
}
\`\`\`

After that, **any** half-open range sum \`[i, j)\` is a subtraction:

\`\`\`ts
const sum = prefix[j] - prefix[i]; // O(1)
// sum of nums[1..3] = prefix[4] - prefix[1] = 9 - 3 = 6
\`\`\`

Why it works: \`prefix[j]\` is everything before index j, \`prefix[i]\` is everything before index i — subtract and the shared head cancels, leaving exactly \`[i, j)\`.

## The convention that kills off-by-ones

Use **length n+1 with \`prefix[0] = 0\`**, not a same-length running total. With the shorter version, a range starting at index 0 needs a special case (\`i === 0 ? prefix[j] : prefix[j] - prefix[i-1]\`). The leading zero makes the formula uniform — \`prefix[j] - prefix[i]\` for every range, no branches. One extra array slot buys away an entire class of off-by-one bugs. When a convention removes an edge case, take the convention.

## The economics

Build: O(n), once. Query: O(1), forever. Against O(n)-per-query naive summing, **break-even is the second query** — one build plus one query costs about the same as one naive scan, and everything after is free. At n = 10⁵ elements and 10⁵ queries: ~2×10⁵ operations versus ~10¹⁰.

This is the same space-for-time trade you saw with hash maps in module 1 — spend O(n) memory holding precomputed answers so each lookup is O(1). Prefix sums are that idea specialized to "cumulative totals over an array."

The fine print: a point update to \`nums[i]\` invalidates every prefix entry from i+1 on — an O(n) rebuild. Prefix sums fit **read-heavy, rarely-updated** data. (Frequent updates push you toward a Fenwick tree — later in the course.)

## What it unlocks

- **Range-sum queries** — the bread and butter above.
- **Equilibrium / balance point** — an index where everything before equals everything after; one total plus a running left sum answers it in a single pass.
- **Counting subarrays with a property** — e.g., "how many subarrays sum to k" falls to prefix sums plus a hash map of counts. File the pattern; it comes back later.`,
    exercises: [
    {
      id: "dsa-build-prefix",
      title: "Build the prefix array",
      instructions: `Implement both functions:

- \`buildPrefix(nums)\` — return the length-\`n+1\` prefix array with \`prefix[0] = 0\` and \`prefix[i] = nums[0] + ... + nums[i-1]\`. One O(n) pass.
- \`rangeSum(prefix, i, j)\` — the sum of the half-open range \`[i, j)\` in O(1). It's a single subtraction; no loops.

Expected output: \`[0, 3, 4, 8, 9, 14]\`, then \`6\`, then \`14\`.`,
      starterCode: `function buildPrefix(nums: number[]): number[] {
  // TODO: return an array of length nums.length + 1 where
  // prefix[0] = 0 and prefix[i] = nums[0] + ... + nums[i - 1].
  return [];
}

function rangeSum(prefix: number[], i: number, j: number): number {
  // TODO: sum of the half-open range [i, j) in O(1).
  return 0;
}

const prefix = buildPrefix([3, 1, 4, 1, 5]);
console.log(prefix);                // expected: [0, 3, 4, 8, 9, 14]
console.log(rangeSum(prefix, 1, 4)); // expected: 6   (1 + 4 + 1)
console.log(rangeSum(prefix, 0, 5)); // expected: 14  (whole array)
`,
    },
    {
      id: "dsa-balance-point",
      title: "Find the balance point",
      instructions: `Implement \`balanceIndex(nums)\`: the index where the sum of elements **strictly before** it equals the sum of elements **strictly after** it, or \`-1\` if none exists. (An empty side counts as 0.)

Do it in **one pass after one total**: compute \`total\` once, then walk the array keeping a running \`leftSum\`; at each index the right side is \`total - leftSum - nums[i]\` — no second loop needed. **Do not re-sum both sides at every index** — that's O(n²) (~10¹⁰ operations at n = 10⁵) versus O(n) for this approach.

Expected output: \`3\`, \`0\`, \`-1\`.`,
      starterCode: `function balanceIndex(nums: number[]): number {
  // TODO: compute the total sum once (O(n)).
  // Then walk left to right keeping leftSum = sum of elements before i.
  // At each i: rightSum = total - leftSum - nums[i].
  // If leftSum === rightSum, return i. Otherwise leftSum += nums[i].
  // Do NOT re-sum both sides at every index — that's O(n^2).
  return -1;
}

console.log(balanceIndex([1, 7, 3, 6, 5, 6])); // expected: 3  (1+7+3 === 5+6)
console.log(balanceIndex([2, 1, -1]));         // expected: 0  (empty left, 1+(-1) === 0)
console.log(balanceIndex([1, 2, 3]));          // expected: -1 (no balance point)
`,
    },
    ],
    quiz: [
    {
      id: "dsa-prefix-sums-q1",
      prompt: "Why build the prefix array with length n+1 and `prefix[0] = 0` instead of a same-length running total?",
      options: [
        "It makes `prefix[j] - prefix[i]` work uniformly for every range — including ranges starting at index 0 — with no special case",
        "JavaScript arrays are 1-indexed internally, so the extra slot aligns the math",
        "The extra zero prevents numeric overflow when the sums get large",
        "It's required for the build pass itself to be O(n)",
      ],
      answer: 0,
      explanation: "With a same-length array, a range starting at 0 has no `prefix[i-1]` to subtract and needs an `i === 0` branch. The leading zero makes one formula cover every range — a convention that deletes an edge case. It has nothing to do with indexing internals, overflow, or build cost.",
    },
    {
      id: "dsa-prefix-sums-q2",
      prompt: "An array of 10⁵ elements will receive 10⁵ range-sum queries. Roughly what's the cost of prefix sums vs. naively looping per query?",
      options: [
        "Prefix: ~10⁵ log(10⁵) ≈ 1.7×10⁶; naive: ~10⁷",
        "Prefix: ~2×10⁵ operations total (one O(n) build + O(1) per query); naive: ~10¹⁰ (O(n) per query)",
        "Both ~10¹⁰ — prefix sums only help when queries outnumber elements by a large factor",
        "Prefix: ~10¹⁰ up front for preprocessing; naive: ~10⁵ per query, so naive wins for few queries",
      ],
      answer: 1,
      explanation: "The build is a single O(n) pass (~10⁵), then each query is one subtraction (~10⁵ more). Naive summing does O(n) work per query × 10⁵ queries ≈ 10¹⁰. Break-even is at the second query — the preprocessing is cheap, not expensive.",
    },
    {
      id: "dsa-prefix-sums-q3",
      prompt: "Your array receives frequent point updates (`nums[i] = x`) interleaved with range-sum queries. Why do plain prefix sums fit poorly?",
      options: [
        "Updates are fine — only `prefix[i+1]` changes, an O(1) fix",
        "Queries silently return stale-but-close values, which is acceptable for sums",
        "One point update invalidates every prefix entry after position i, forcing an O(n) rebuild — prefix sums fit read-heavy, rarely-updated data",
        "Prefix sums only work when all elements are positive, and updates might introduce negatives",
      ],
      answer: 2,
      explanation: "`prefix[i+1]` through `prefix[n]` all include `nums[i]`, so every one of them changes — O(n) per update wipes out the O(1) query win under write-heavy load. (That's the gap Fenwick trees fill: O(log n) for both.) Prefix sums are exact and handle negatives fine.",
    },
    ],
  },
];
