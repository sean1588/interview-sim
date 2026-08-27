import type { Lesson } from "../types";

export const dynamicProgrammingLessons: Lesson[] = [
  {
    id: "dsa-memoization",
    module: "dynamic-programming",
    title: "Memoization vs Tabulation",
    blurb: "Overlapping subproblems, and the two directions you can fill the answers in.",
    graphics: [
      {
        id: "memo-vs-table",
        title: "Compute once, reuse forever",
        caption:
          "The naive recursion tree recomputes the same subproblem over and over; a cache collapses it to one node each. Top-down remembers what it computed, bottom-up fills a table in dependency order.",
        src: "/lesson-graphics/dsa/dsa-memoization.png",
      },
    ],
    content: {
      typescript: `Dynamic programming has a reputation it doesn't deserve. It isn't a data structure or a trick — it's a diagnosis with two conditions:

1. **Optimal substructure** — the answer to the whole problem is built out of answers to smaller instances of the *same* problem.
2. **Overlapping subproblems** — those smaller instances repeat. A lot.

Condition 1 alone is just recursion: merge sort splits into halves, but the left half and the right half never share work, so there's nothing to cache. Add condition 2 and the recomputation *is* the cost — so you compute each distinct subproblem once and remember the answer. That's the whole idea. Everything after this lesson is bookkeeping about where you keep the answers and what order you fill them in.

## The exponential you're paying for

\`\`\`ts
function fib(n: number): number {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}
\`\`\`

Draw the call tree for \`fib(5)\`: \`fib(3)\` is computed twice, \`fib(2)\` three times, \`fib(1)\` five times. Each level roughly doubles, so the tree holds **O(2ⁿ)** nodes — \`fib(50)\` makes 2·F(51) − 1 = **40,730,022,147 calls**, minutes of CPU time. But look at the *distinct* arguments: \`0\` through \`n\`. There are only **n + 1 different questions** being asked, and the recursion is asking them billions of times.

That gap — exponential calls, linear distinct subproblems — is what DP closes.

## Top-down: memoization

Keep a cache keyed by the subproblem, check it on entry, fill it on exit:

\`\`\`ts
const memo = new Map<number, number>();

function fib(n: number): number {
  if (n < 2) return n;
  const cached = memo.get(n);
  if (cached !== undefined) return cached;   // check on the way in
  const value = fib(n - 1) + fib(n - 2);
  memo.set(n, value);                        // fill on the way out
  return value;
}
\`\`\`

Three added lines take it from O(2ⁿ) to **O(n) time, O(n) space**. Every distinct \`n\` is computed once; every later request for it is a Map hit.

Note \`cached !== undefined\` rather than \`if (cached)\`. A cached value of \`0\` is falsy, so the truthy check would recompute it forever — a memo of booleans or counts is where that bug actually bites. Check for *presence*, never for truthiness.

## Bottom-up: tabulation

Same recurrence, opposite direction: instead of recursing down to the base case, start at the base case and walk up.

\`\`\`ts
function fib(n: number): number {
  if (n < 2) return n;
  const dp = new Array<number>(n + 1).fill(0);
  dp[1] = 1;                                        // base case
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
  return dp[n];
}
\`\`\`

No recursion, no call stack, no hash lookups — same O(n) bound with a much smaller constant. And because the loop makes the dependency order explicit, it's the version you can shrink: \`dp[i]\` only ever reads the last two cells, so two variables replace the whole array and the space drops to **O(1)**. You can't do that to a memo, which by definition keeps everything.

## Which one

**Memoization** when the recurrence is easier to state than to schedule, or when the state space is huge but *sparse* — recursion only ever touches the states the answer actually depends on, while a table dutifully fills all of them. The cost is stack depth: one frame per level, and a deep chain overflows.

**Tabulation** when every state gets visited anyway. Iterative, better constants, no stack risk, and it's the only form you can roll down to O(1) space.

## The four questions

Every DP in this module is the same four blanks filled in:

1. **State** — what does \`dp[i]\` *mean*, in one sentence?
2. **Recurrence** — how does it follow from smaller states?
3. **Base cases** — which states are known outright?
4. **Order** — an iteration order where every dependency is already computed.

Get the state sentence wrong and nothing else can be right. "\`dp[i]\` is the answer for the first i items" and "\`dp[i]\` is the answer for subarrays *ending at* i" are different problems, and the second is the one that catches people out two lessons from now.`,
      python: `Dynamic programming has a reputation it doesn't deserve. It isn't a data structure or a trick — it's a diagnosis with two conditions:

1. **Optimal substructure** — the answer to the whole problem is built out of answers to smaller instances of the *same* problem.
2. **Overlapping subproblems** — those smaller instances repeat. A lot.

Condition 1 alone is just recursion: merge sort splits into halves, but the left half and the right half never share work, so there's nothing to cache. Add condition 2 and the recomputation *is* the cost — so you compute each distinct subproblem once and remember the answer. That's the whole idea. Everything after this lesson is bookkeeping about where you keep the answers and what order you fill them in.

## The exponential you're paying for

\`\`\`python
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
\`\`\`

Draw the call tree for \`fib(5)\`: \`fib(3)\` is computed twice, \`fib(2)\` three times, \`fib(1)\` five times. Each level roughly doubles, so the tree holds **O(2ⁿ)** nodes — \`fib(50)\` makes 2·F(51) − 1 = **40,730,022,147 calls**, on the order of an hour in CPython. But look at the *distinct* arguments: \`0\` through \`n\`. There are only **n + 1 different questions** being asked, and the recursion is asking them billions of times.

That gap — exponential calls, linear distinct subproblems — is what DP closes.

## Top-down: memoization

Keep a cache keyed by the subproblem, check it on entry, fill it on exit:

\`\`\`python
memo = {}

def fib(n):
    if n < 2:
        return n
    if n in memo:          # check on the way in
        return memo[n]
    memo[n] = fib(n - 1) + fib(n - 2)   # fill on the way out
    return memo[n]
\`\`\`

Three added lines take it from O(2ⁿ) to **O(n) time, O(n) space**. Every distinct \`n\` is computed once; every later request for it is a dict hit.

Note \`if n in memo\` rather than \`if memo.get(n)\`. A cached value of \`0\` is falsy, so the truthy check would recompute it forever — a memo of counts or booleans is where that bug actually bites. Check for *membership*, never for truthiness.

**The one-liner:** \`functools.cache\` (or \`lru_cache(maxsize=None)\` before 3.9) does exactly the above as a decorator:

\`\`\`python
from functools import cache

@cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)
\`\`\`

Use it in real code. Write the dict by hand in an interview *once*, so you can say what the decorator is doing — and remember it keys on the argument tuple, so every argument must be hashable (a \`list\` parameter will raise \`TypeError\`; pass a \`tuple\`).

## Bottom-up: tabulation

Same recurrence, opposite direction: instead of recursing down to the base case, start at the base case and walk up.

\`\`\`python
def fib(n):
    if n < 2:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1                                  # base case
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]
\`\`\`

No recursion, no call stack, no hash lookups — same O(n) bound with a much smaller constant. And because the loop makes the dependency order explicit, it's the version you can shrink: \`dp[i]\` only ever reads the last two cells, so \`a, b = b, a + b\` replaces the whole list and the space drops to **O(1)**. You can't do that to a memo, which by definition keeps everything.

## Which one

**Memoization** when the recurrence is easier to state than to schedule, or when the state space is huge but *sparse* — recursion only ever touches the states the answer actually depends on, while a table dutifully fills all of them. The cost is stack depth, and in Python that ceiling is low: the default recursion limit is 1000 frames, so a top-down DP over an array of 10,000 elements raises \`RecursionError\` before it raises anything interesting. Raising the limit with \`sys.setrecursionlimit\` works until the real C stack runs out; converting to a loop always works.

**Tabulation** when every state gets visited anyway. Iterative, better constants, no recursion ceiling, and it's the only form you can roll down to O(1) space.

## The four questions

Every DP in this module is the same four blanks filled in:

1. **State** — what does \`dp[i]\` *mean*, in one sentence?
2. **Recurrence** — how does it follow from smaller states?
3. **Base cases** — which states are known outright?
4. **Order** — an iteration order where every dependency is already computed.

Get the state sentence wrong and nothing else can be right. "\`dp[i]\` is the answer for the first i items" and "\`dp[i]\` is the answer for subarrays *ending at* i" are different problems, and the second is the one that catches people out two lessons from now.`,
    },
    exercises: [
      {
        id: "dsa-memo-fib",
        title: "Cache the recursion",
        instructions: {
          typescript: `The starter is the naive recursion, instrumented with a call counter. Run it as-is: \`fib(25)\` costs **242,785** calls.

Add a memo (\`Map<number, number>\` or a plain object) so each distinct \`n\` is computed once. Check the cache on entry, fill it before returning.

Watch the check itself: \`if (memo.get(n))\` is a bug waiting for the day a cached value is \`0\`. Test for presence.

Expected output: the same \`75025\`, but in **49** calls.`,
          python: `The starter is the naive recursion, instrumented with a call counter. Run it as-is: \`fib(25)\` costs **242,785** calls.

Add a memo \`dict\` so each distinct \`n\` is computed once. Check the cache on entry, fill it before returning.

Watch the check itself: \`if memo.get(n)\` is a bug waiting for the day a cached value is \`0\`. Test membership with \`in\`.

Do it by hand here rather than reaching for \`functools.cache\` — the point is to be able to describe what the decorator does.

Expected output: the same \`75025\`, but in **49** calls.`,
        },
        starterCode: {
          typescript: `let callCount = 0;

function fib(n: number): number {
  callCount++;
  // TODO: if n is already in the memo, return the cached value.
  if (n < 2) return n;
  const value = fib(n - 1) + fib(n - 2);
  // TODO: store \`value\` in the memo under n before returning it.
  return value;
}

console.log("fib(25) =", fib(25)); // expected 75025
console.log("calls:", callCount); // 242785 naive, 49 once memoized`,
          python: `call_count = 0


def fib(n):
    global call_count
    call_count += 1
    # TODO: if n is already in the memo, return the cached value.
    if n < 2:
        return n
    value = fib(n - 1) + fib(n - 2)
    # TODO: store \`value\` in the memo under n before returning it.
    return value


print("fib(25) =", fib(25))  # expected 75025
print("calls:", call_count)  # 242785 naive, 49 once memoized
`,
        },
      },
      {
        id: "dsa-tabulate-stairs",
        title: "Tabulate the stairs",
        instructions: {
          typescript: `Climbing stairs: you take 1 or 2 steps at a time — how many distinct ways to reach step \`n\`?

The recurrence is fib in disguise: the last move onto step \`i\` came from \`i - 1\` or \`i - 2\`, and those routes are disjoint, so \`ways(i) = ways(i - 1) + ways(i - 2)\`.

Build it **bottom-up** — a loop and a table (or two rolling variables), no recursion. Base cases: one way to stand on step 1, two ways to reach step 2.

The last line is why: \`climbStairs(45)\` is a 45-iteration loop, where the naive recursion would make about 3.6 billion calls.

Expected output: \`1\`, \`8\`, \`1836311903\`.`,
          python: `Climbing stairs: you take 1 or 2 steps at a time — how many distinct ways to reach step \`n\`?

The recurrence is fib in disguise: the last move onto step \`i\` came from \`i - 1\` or \`i - 2\`, and those routes are disjoint, so \`ways(i) = ways(i - 1) + ways(i - 2)\`.

Build it **bottom-up** — a loop and a table (or two rolling variables), no recursion. Base cases: one way to stand on step 1, two ways to reach step 2.

The last line is why: \`climb_stairs(45)\` is a 45-iteration loop, where the naive recursion would make about 3.6 billion calls.

Expected output: \`1\`, \`8\`, \`1836311903\`.`,
        },
        starterCode: {
          typescript: `function climbStairs(n: number): number {
  // TODO: bottom-up. dp[i] = number of ways to reach step i.
  // Base: dp[1] = 1, dp[2] = 2. Then dp[i] = dp[i - 1] + dp[i - 2].
  // No recursion — one loop from 3 up to n.
  return 0;
}

console.log(climbStairs(1)); // expected 1
console.log(climbStairs(5)); // expected 8
console.log(climbStairs(45)); // expected 1836311903`,
          python: `def climb_stairs(n):
    # TODO: bottom-up. dp[i] = number of ways to reach step i.
    # Base: dp[1] = 1, dp[2] = 2. Then dp[i] = dp[i - 1] + dp[i - 2].
    # No recursion — one loop from 3 up to n.
    return 0


print(climb_stairs(1))  # expected 1
print(climb_stairs(5))  # expected 8
print(climb_stairs(45))  # expected 1836311903
`,
        },
      },
    ],
    quiz: [
      {
        id: "dsa-memoization-q1",
        prompt: "Merge sort solves a problem by combining answers to smaller instances of itself, yet nobody memoizes it. Why not?",
        options: [
          "Its subproblems are too large to store — caching arrays would use O(n²) memory",
          "It is already O(n log n), and memoization only ever helps exponential algorithms",
          "Its recursion is not pure — the merge step mutates the array, so results cannot be cached",
          "Its subproblems never repeat: each recursive call gets a distinct slice, so a cache would never hit",
        ],
        answer: 3,
        explanation:
          "DP needs BOTH optimal substructure and overlapping subproblems. Merge sort has the first — the sorted whole is built from sorted halves — but every call operates on a slice no other call touches, so a memo would grow forever and never return a hit. Overlap is what makes the cache pay for itself.",
      },
      {
        id: "dsa-memoization-q2",
        prompt: {
          typescript:
            "You memoize `countPaths(x, y)`, which legitimately returns `0` for blocked cells, and guard the cache with `if (memo.get(key)) return memo.get(key)!;`. What happens?",
          python:
            "You memoize `count_paths(x, y)`, which legitimately returns `0` for blocked cells, and guard the cache with `if memo.get(key): return memo[key]`. What happens?",
        },
        options: [
          "Blocked cells are recomputed on every visit, so the exponential blow-up survives for exactly the states the cache was meant to kill",
          "It works, but wastes memory — the zeros are stored and never read",
          "It throws on the first blocked cell, because the guard reads a key that was never written",
          "It returns wrong answers immediately: cached zeros are reported as undefined paths",
        ],
        answer: 0,
        explanation:
          "The cached value IS there — the truthy guard just can't see it, because `0` is falsy. Every blocked cell re-expands its whole subtree, and on a grid with many blocked cells that's most of the work you were trying to avoid. Test for presence (`has` / `in`), not truth.",
      },
      {
        id: "dsa-memoization-q3",
        prompt: "A DP has 10⁶ possible states, but from the given start only about 2,000 are ever reachable. Top-down or bottom-up?",
        options: [
          "Bottom-up — a table is always faster than a hash map, so the extra states cost nothing",
          "Bottom-up — top-down cannot express a state space this large at all",
          "Top-down — recursion only touches states the answer actually depends on, so it does ~2,000 units of work instead of 10⁶",
          "Either — both visit the same states, so the choice is purely stylistic",
        ],
        answer: 2,
        explanation:
          "A table has to be filled in dependency order, which means filling all 10⁶ cells whether or not they matter. Memoized recursion is demand-driven: it computes a state only when something asks for it. Sparse, reachable-only state spaces are top-down's clearest win — as long as the recursion depth stays inside the stack.",
      },
    ],
  },
  {
    id: "dsa-one-dimensional-dp",
    module: "dynamic-programming",
    title: "One-Dimensional DP",
    blurb: "One index of state: house robber, rolling variables, and subsequences that look back.",
    graphics: [
      {
        id: "fill-the-line",
        title: "Filling a 1-D table",
        caption:
          "State is a single index, filled left to right. Some recurrences look back a fixed distance (two cells), others scan every earlier cell — that difference is O(n) versus O(n²).",
        src: "/lesson-graphics/dsa/dsa-one-dimensional-dp.png",
      },
    ],
    content: {
      typescript: `Most DP you'll meet in an interview has **one index of state**: \`dp[i]\` is the answer for a prefix of the input, or for the subarray *ending at* \`i\`. Getting that sentence right is the whole problem; the code after it is a loop.

## Constrained counting: house robber

Houses in a line with values \`nums\`, and you can't take two adjacent ones. Maximize the total.

State: \`dp[i]\` = the best you can do considering houses \`0..i\`. Standing at house \`i\` there are exactly two options, and they're exhaustive:

- **Skip it** — you keep whatever \`dp[i - 1]\` was worth.
- **Take it** — you get \`nums[i]\`, plus the best from \`0..i-2\` (\`i-1\` is now off limits).

\`\`\`ts
dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i]);
\`\`\`

That's the shape of nearly every 1-D DP: **at each position, enumerate the choices, take the best of the smaller answers they leave behind.** Note that "take it" adds \`dp[i - 2]\`, not \`nums[i - 2]\` — the subproblem already contains the best arrangement of everything before it, and re-deriving it is how people accidentally write greedy code and get \`[2, 7, 9, 3, 1]\` wrong.

A truer greedy — repeatedly take the largest still-legal house — fails on this problem too, though \`[2, 7, 9, 3, 1]\` is too forgiving to show it: taking 9 blocks only 7 and 3, so greedy goes on to pick up 2 and 1 for the same 12. Use \`[1, 7, 9, 4]\` instead. Greedy takes 9, which blocks both 7 and 4, then finishes with 1 for a total of 10; the DP takes 7 + 4 = 11. Locally-best choices don't compose, which is precisely why it's a DP and not a one-pass scan.

## Rolling the array away

\`dp[i]\` reads exactly two cells behind it, so there is no reason to keep the other n − 2:

\`\`\`ts
let prev2 = 0; // best through i - 2
let prev1 = 0; // best through i - 1
for (const value of nums) {
  const best = Math.max(prev1, prev2 + value);
  prev2 = prev1;
  prev1 = best;
}
return prev1;
\`\`\`

**O(n) time, O(1) space.** The rule generalizes: if the recurrence reaches back a *fixed* distance k, you only ever need k variables. Interviewers ask for this follow-up constantly — and it's the version tabulation gives you for free and memoization can't give you at all.

Do keep the array when you need to *reconstruct* the choice rather than just score it — you can't walk back through variables you overwrote.

## When the recurrence looks back at everything: LIS

Longest increasing subsequence — the longest set of indices, in order, with strictly increasing values. (**Subsequence**, not substring: you delete elements, you don't take a contiguous run.)

Here the natural state is the one people get wrong first. \`dp[i]\` = "the LIS of the first i elements" doesn't work — you can't tell whether \`nums[i]\` may extend it without knowing what it *ends with*. So pin the ending down:

> \`dp[i]\` = the length of the longest increasing subsequence **ending exactly at index i**.

\`\`\`ts
if (nums.length === 0) return 0;                // Math.max(...[]) is -Infinity
const dp = new Array<number>(nums.length).fill(1); // each element alone
for (let i = 0; i < nums.length; i++) {
  for (let j = 0; j < i; j++) {
    if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
  }
}
return Math.max(...dp);                         // NOT dp[n - 1]
\`\`\`

Two consequences of that state definition:

- The inner loop scans **every** earlier index, so this is **O(n²)** — the price of a recurrence that doesn't look back a fixed distance.
- The answer is \`max(dp)\`, not \`dp[n - 1]\`. The best subsequence needn't end at the last element. Forgetting this is the single most common LIS bug.

There's an **O(n log n)** version that keeps an array of "smallest tail seen for each length" and binary-searches it per element — the binary-search-on-a-sorted-array move from the last module, applied to a derived array. Know it exists and that the array it maintains is *not* the actual subsequence; write the O(n²) one unless you're asked for better.`,
      python: `Most DP you'll meet in an interview has **one index of state**: \`dp[i]\` is the answer for a prefix of the input, or for the subarray *ending at* \`i\`. Getting that sentence right is the whole problem; the code after it is a loop.

## Constrained counting: house robber

Houses in a line with values \`nums\`, and you can't take two adjacent ones. Maximize the total.

State: \`dp[i]\` = the best you can do considering houses \`0..i\`. Standing at house \`i\` there are exactly two options, and they're exhaustive:

- **Skip it** — you keep whatever \`dp[i - 1]\` was worth.
- **Take it** — you get \`nums[i]\`, plus the best from \`0..i-2\` (\`i-1\` is now off limits).

\`\`\`python
dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])
\`\`\`

That's the shape of nearly every 1-D DP: **at each position, enumerate the choices, take the best of the smaller answers they leave behind.** Note that "take it" adds \`dp[i - 2]\`, not \`nums[i - 2]\` — the subproblem already contains the best arrangement of everything before it, and re-deriving it is how people accidentally write greedy code and get \`[2, 7, 9, 3, 1]\` wrong.

A truer greedy — repeatedly take the largest still-legal house — fails on this problem too, though \`[2, 7, 9, 3, 1]\` is too forgiving to show it: taking 9 blocks only 7 and 3, so greedy goes on to pick up 2 and 1 for the same 12. Use \`[1, 7, 9, 4]\` instead. Greedy takes 9, which blocks both 7 and 4, then finishes with 1 for a total of 10; the DP takes 7 + 4 = 11. Locally-best choices don't compose, which is precisely why it's a DP and not a one-pass scan.

One Python-specific trap in the indexed form: \`dp[i - 2]\` at \`i = 1\` is \`dp[-1]\`, which silently reads the *last* cell of the list instead of raising. Negative indexing turns an off-by-one into a wrong answer with no traceback — either handle \`i = 0\` and \`i = 1\` explicitly, or pad the table with two leading zeros and offset by 2.

## Rolling the list away

\`dp[i]\` reads exactly two cells behind it, so there is no reason to keep the other n − 2:

\`\`\`python
prev2 = 0  # best through i - 2
prev1 = 0  # best through i - 1
for value in nums:
    prev2, prev1 = prev1, max(prev1, prev2 + value)
return prev1
\`\`\`

**O(n) time, O(1) space** — and the tuple assignment evaluates the whole right-hand side first, so there's no stale-variable ordering bug to get wrong. (In a language without simultaneous assignment you need a temporary, which is exactly where that bug lives.)

The rule generalizes: if the recurrence reaches back a *fixed* distance k, you only ever need k variables. Interviewers ask for this follow-up constantly — and it's the version tabulation gives you for free and memoization can't give you at all.

Do keep the list when you need to *reconstruct* the choice rather than just score it — you can't walk back through variables you overwrote.

## When the recurrence looks back at everything: LIS

Longest increasing subsequence — the longest set of indices, in order, with strictly increasing values. (**Subsequence**, not substring: you delete elements, you don't take a contiguous run.)

Here the natural state is the one people get wrong first. \`dp[i]\` = "the LIS of the first i elements" doesn't work — you can't tell whether \`nums[i]\` may extend it without knowing what it *ends with*. So pin the ending down:

> \`dp[i]\` = the length of the longest increasing subsequence **ending exactly at index i**.

\`\`\`python
if not nums:
    return 0                             # max([]) raises ValueError
dp = [1] * len(nums)                     # each element alone
for i in range(len(nums)):
    for j in range(i):
        if nums[j] < nums[i]:
            dp[i] = max(dp[i], dp[j] + 1)
return max(dp)                           # NOT dp[-1]
\`\`\`

Two consequences of that state definition:

- The inner loop scans **every** earlier index, so this is **O(n²)** — the price of a recurrence that doesn't look back a fixed distance.
- The answer is \`max(dp)\`, not \`dp[-1]\`. The best subsequence needn't end at the last element. Forgetting this is the single most common LIS bug — and in Python it's a *silent* one, since \`dp[-1]\` is perfectly legal.

There's an **O(n log n)** version that keeps a list of "smallest tail seen for each length" and \`bisect\`s it per element — the binary-search-on-a-sorted-list move from the last module, applied to a derived list. Know it exists and that the list it maintains is *not* the actual subsequence; write the O(n²) one unless you're asked for better.`,
    },
    exercises: [
      {
        id: "dsa-house-robber",
        title: "Non-adjacent maximum",
        instructions: {
          typescript: `Implement \`rob(nums)\`: the maximum total you can take from a line of houses without taking two adjacent ones.

At each house: \`max(skip = best through i-1, take = nums[i] + best through i-2)\`.

Use the **two rolling variables** version — O(n) time, O(1) space — rather than allocating a table. Handle the empty array.

Expected output: \`12\` (2 + 9 + 1), then \`10\` (5 + 5), then \`0\`.`,
          python: `Implement \`rob(nums)\`: the maximum total you can take from a line of houses without taking two adjacent ones.

At each house: \`max(skip = best through i-1, take = nums[i] + best through i-2)\`.

Use the **two rolling variables** version — O(n) time, O(1) space — rather than allocating a list. Handle the empty list.

Expected output: \`12\` (2 + 9 + 1), then \`10\` (5 + 5), then \`0\`.`,
        },
        starterCode: {
          typescript: `function rob(nums: number[]): number {
  // TODO: walk the array once, keeping two numbers:
  //   prev2 = best total through house i - 2
  //   prev1 = best total through house i - 1
  // For each value: best = Math.max(prev1, prev2 + value), then shift both along.
  return 0;
}

console.log(rob([2, 7, 9, 3, 1])); // expected 12 (2 + 9 + 1)
console.log(rob([5, 1, 1, 5])); // expected 10 (5 + 5)
console.log(rob([])); // expected 0`,
          python: `def rob(nums):
    # TODO: walk the list once, keeping two numbers:
    #   prev2 = best total through house i - 2
    #   prev1 = best total through house i - 1
    # For each value: best is max(prev1, prev2 + value), then shift both along.
    return 0


print(rob([2, 7, 9, 3, 1]))  # expected 12 (2 + 9 + 1)
print(rob([5, 1, 1, 5]))  # expected 10 (5 + 5)
print(rob([]))  # expected 0
`,
        },
      },
      {
        id: "dsa-lis-length",
        title: "Longest increasing subsequence",
        instructions: {
          typescript: `Implement \`lengthOfLIS(nums)\` in O(n²): the length of the longest strictly increasing subsequence (elements in order, not necessarily adjacent).

State: \`dp[i]\` = length of the longest increasing subsequence **ending at index i**. Every element starts at 1. For each \`i\`, scan every \`j < i\`; when \`nums[j] < nums[i]\`, index \`i\` can extend that subsequence.

The trap: return the **maximum over the whole table**, not the last cell — the best subsequence rarely ends at the last element. \`[10, 9, 2, 5, 3, 7, 101, 18]\` proves it.

Handle the empty array: \`Math.max(...[])\` is \`-Infinity\`, so return 0 before you touch the table.

Expected output: \`4\` (2, 3, 7, 18 — or 2, 5, 7, 101), then \`1\`, then \`0\`.`,
          python: `Implement \`length_of_lis(nums)\` in O(n²): the length of the longest strictly increasing subsequence (elements in order, not necessarily adjacent).

State: \`dp[i]\` = length of the longest increasing subsequence **ending at index i**. Every element starts at 1. For each \`i\`, scan every \`j < i\`; when \`nums[j] < nums[i]\`, index \`i\` can extend that subsequence.

The trap: return the **maximum over the whole table**, not \`dp[-1]\` — the best subsequence rarely ends at the last element, and negative indexing means the wrong version runs happily. \`[10, 9, 2, 5, 3, 7, 101, 18]\` proves it.

Handle the empty list: \`max([])\` raises \`ValueError\`, so return 0 before you touch the table.

Expected output: \`4\` (2, 3, 7, 18 — or 2, 5, 7, 101), then \`1\`, then \`0\`.`,
        },
        starterCode: {
          typescript: `function lengthOfLIS(nums: number[]): number {
  // TODO: dp[i] = longest increasing subsequence ENDING at i; start every cell at 1.
  // For each i, look at every j < i: if nums[j] < nums[i], then
  // dp[i] = Math.max(dp[i], dp[j] + 1).
  // Return the largest value in dp (NOT dp[dp.length - 1]).
  return 0;
}

console.log(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])); // expected 4
console.log(lengthOfLIS([7, 7, 7])); // expected 1 (strictly increasing)
console.log(lengthOfLIS([])); // expected 0`,
          python: `def length_of_lis(nums):
    # TODO: dp[i] = longest increasing subsequence ENDING at i; start every cell at 1.
    # For each i, look at every j < i: if nums[j] < nums[i], then
    # dp[i] is max(dp[i], dp[j] + 1).
    # Return the largest value in dp (NOT dp[-1]).
    return 0


print(length_of_lis([10, 9, 2, 5, 3, 7, 101, 18]))  # expected 4
print(length_of_lis([7, 7, 7]))  # expected 1 (strictly increasing)
print(length_of_lis([]))  # expected 0
`,
        },
      },
    ],
    quiz: [
      {
        id: "dsa-one-dimensional-dp-q1",
        prompt: "In house robber, why is the “take house i” branch `dp[i - 2] + nums[i]` rather than `nums[i - 2] + nums[i]`?",
        options: [
          "Because `dp[i - 2]` is already the best achievable total from houses 0..i-2, so the branch compares complete plans instead of two isolated houses",
          "Because `nums[i - 2]` might be negative, and the table clamps negatives to zero",
          "Because the table needs a value at every index for the rolling-variable optimization to work",
          "They are equivalent — `dp[i - 2]` always equals `nums[i - 2]` once the table is filled",
        ],
        answer: 0,
        explanation:
          "The whole leverage of DP is that a subproblem's answer is final: `dp[i - 2]` already accounts for every legal arrangement of the first i-1 houses. Adding `nums[i - 2]` instead reduces you to picking pairs of houses — greedy — which gets `[2, 7, 9, 3, 1]` wrong (11 instead of 12).",
      },
      {
        id: "dsa-one-dimensional-dp-q2",
        prompt: "Which 1-D DP can be rewritten to use O(1) extra space, and why?",
        options: [
          "Any DP at all — the table is always an implementation detail that a loop can eliminate",
          "Only DPs whose values are numbers, since a fixed number of variables cannot hold objects",
          "Only DPs over sorted input, because sorting makes earlier cells unnecessary",
          "One whose recurrence reads a fixed number of recent cells — k variables replace the table when nothing looks back further than k",
        ],
        answer: 3,
        explanation:
          "Climbing stairs and house robber read two cells back, so two variables suffice. LIS reads every earlier cell, so its table has to stay. And even a fixed-lookback DP needs the full table if you must reconstruct *which* choices produced the answer, not just its score.",
      },
      {
        id: "dsa-one-dimensional-dp-q3",
        prompt: "Your LIS solution fills `dp[i]` = longest increasing subsequence ending at i, then returns the final cell. On `[10, 9, 2, 5, 3, 7, 101, 18]` it returns 4 — correct. On `[1, 2, 3, 4, 1]` it returns 1. What is wrong?",
        options: [
          "The comparison should be `<=`, which is what collapses the count on the second input",
          "The answer is the maximum over the whole table — the best subsequence ends at index 3, not at the last element",
          "The table must be filled right to left so the final cell accumulates every earlier answer",
          "Nothing is wrong — a subsequence must end at the last element to count as longest",
        ],
        answer: 1,
        explanation:
          "`dp` is per-*ending-index*, so the last cell only reports subsequences that finish at the last element. On `[1, 2, 3, 4, 1]` the best is 1,2,3,4 (length 4, ending at index 3), while `dp[4]` is 1 because nothing before the trailing 1 is smaller than it. Return the max of the table. The first input passed by luck: its best subsequence happened to end at the last element.",
      },
    ],
  },
  {
    id: "dsa-grid-dp",
    module: "dynamic-programming",
    title: "Grid & Knapsack DP",
    blurb: "Two indices of state: paths through a grid, and the take-it-or-leave-it knapsack.",
    graphics: [
      {
        id: "two-d-table",
        title: "Two-dimensional tables",
        caption:
          "A grid DP fills row by row, each cell reading the neighbors above and to the left. Knapsack uses the same table with different axes: items down the side, remaining capacity across the top.",
        src: "/lesson-graphics/dsa/dsa-grid-dp.png",
      },
    ],
    content: {
      typescript: `When one index can't describe a subproblem, add another. Two-dimensional DP is the same four questions from lesson one — state, recurrence, base cases, order — with \`dp[i][j]\` instead of \`dp[i]\`.

## Grid paths: the state is the position

Minimum path sum: from the top-left of a grid of costs to the bottom-right, moving only right or down.

> \`dp[r][c]\` = the cheapest total cost of reaching cell (r, c).

You can only arrive at (r, c) from above or from the left, so:

\`\`\`ts
dp[r][c] = grid[r][c] + Math.min(dp[r - 1][c], dp[r][c - 1]);
\`\`\`

Base cases are the edges, where one of those neighbors doesn't exist: the first row can only be reached by walking right, the first column only by walking down — each is a running total. Handling them up front is cleaner than sprinkling \`r > 0 &&\` guards through the main loop.

**Order matters and is forced:** by the time you write \`dp[r][c]\`, the cell above and the cell to its left must already hold final values. Row by row, left to right, does that. Any order that reads a cell you haven't filled yet returns \`undefined\` — or worse, a stale zero from an initialized array, which produces a plausible wrong answer rather than a crash.

Cost: **O(rows × cols)** time and space, and the same rolling trick applies — you only ever read the previous row, so one row of length \`cols\` is enough.

Counting variants (*how many* paths rather than the cheapest) swap \`Math.min\` for addition, and the edges initialize to 1 instead of a running sum. Same skeleton.

## 0/1 knapsack: the state is item + capacity

Items with weights and values, a bag with capacity W, each item taken **at most once** (that's the "0/1"). Maximize value.

Why isn't one index enough? Because "the best value using the first i items" isn't answerable on its own — it depends on how much room is left, and the room left depends on which earlier items you took. The remaining capacity has to be part of the state:

> \`dp[i][c]\` = the best value using only the first \`i\` items, with capacity \`c\` available.

Each item is a take-it-or-leave-it choice, exactly like house robber:

\`\`\`ts
// skip item i-1
dp[i][c] = dp[i - 1][c];
// take it, if it fits
if (weights[i - 1] <= c) {
  dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - weights[i - 1]] + values[i - 1]);
}
\`\`\`

Row 0 (no items) is all zeros — the base case that makes the whole table work.

**O(n × W)** time and space. That looks polynomial, and it is not: W is a *value*, not a size. Doubling the *length* of the input — 10⁶ to 10¹², six digits to twelve — multiplies the work by a million. The term for this is **pseudo-polynomial**, and it's the honest answer when an interviewer asks whether you just solved an NP-hard problem in polynomial time. You didn't.

## Rolling it to one row — and the loop direction that matters

Each row reads only the row above, so a single array of length W+1 works, updated in place:

\`\`\`ts
for (let i = 0; i < n; i++) {
  for (let c = capacity; c >= weights[i]; c--) {   // DESCENDING
    dp[c] = Math.max(dp[c], dp[c - weights[i]] + values[i]);
  }
}
\`\`\`

The descending inner loop is load-bearing. Going down, \`dp[c - weight]\` still holds the *previous* row's value — item \`i\` not yet used — which is what 0/1 requires. Go up instead and \`dp[c - weight]\` may already include item \`i\`, so you take the same item twice. That's not a bug in every universe: ascending order is exactly the **unbounded knapsack** (unlimited copies per item). One character of loop direction picks the problem you're solving.

Other classics with the same two-index skeleton: longest common subsequence (\`dp[i][j]\` over prefixes of two strings), edit distance (insert/delete/replace as three neighbors), and coin change (amount as the second axis). Learn the shape once.`,
      python: `When one index can't describe a subproblem, add another. Two-dimensional DP is the same four questions from lesson one — state, recurrence, base cases, order — with \`dp[r][c]\` instead of \`dp[i]\`.

## Grid paths: the state is the position

Minimum path sum: from the top-left of a grid of costs to the bottom-right, moving only right or down.

> \`dp[r][c]\` = the cheapest total cost of reaching cell (r, c).

You can only arrive at (r, c) from above or from the left, so:

\`\`\`python
dp[r][c] = grid[r][c] + min(dp[r - 1][c], dp[r][c - 1])
\`\`\`

Base cases are the edges, where one of those neighbors doesn't exist: the first row can only be reached by walking right, the first column only by walking down — each is a running total. Handling them up front is cleaner than sprinkling \`if r > 0\` guards through the main loop. It's also *necessary* in Python: \`dp[r - 1][c]\` at \`r = 0\` is \`dp[-1][c]\`, the last row — no \`IndexError\`, just a wrong answer built from cells you haven't filled.

**Order matters and is forced:** by the time you write \`dp[r][c]\`, the cell above and the cell to its left must already hold final values. Row by row, left to right, does that.

Allocate the table with a comprehension, never with \`[[0] * cols] * rows\`:

\`\`\`python
dp = [[0] * cols for _ in range(rows)]   # rows distinct lists
bad = [[0] * cols] * rows                # the SAME list, rows times
\`\`\`

The second form makes \`bad[0]\` and \`bad[1]\` aliases of one list, so writing a single cell writes a whole column. It is the most common 2-D DP bug in Python and it fails silently.

Cost: **O(rows × cols)** time and space, and the same rolling trick applies — you only ever read the previous row, so one row of length \`cols\` is enough.

Counting variants (*how many* paths rather than the cheapest) swap \`min\` for addition, and the edges initialize to 1 instead of a running sum. Same skeleton.

## 0/1 knapsack: the state is item + capacity

Items with weights and values, a bag with capacity W, each item taken **at most once** (that's the "0/1"). Maximize value.

Why isn't one index enough? Because "the best value using the first i items" isn't answerable on its own — it depends on how much room is left, and the room left depends on which earlier items you took. The remaining capacity has to be part of the state:

> \`dp[i][c]\` = the best value using only the first \`i\` items, with capacity \`c\` available.

Each item is a take-it-or-leave-it choice, exactly like house robber:

\`\`\`python
dp[i][c] = dp[i - 1][c]                              # skip item i-1
if weights[i - 1] <= c:                              # take it, if it fits
    dp[i][c] = max(dp[i][c], dp[i - 1][c - weights[i - 1]] + values[i - 1])
\`\`\`

Row 0 (no items) is all zeros — the base case that makes the whole table work.

**O(n × W)** time and space. That looks polynomial, and it is not: W is a *value*, not a size. Doubling the *length* of the input — 10⁶ to 10¹², six digits to twelve — multiplies the work by a million. The term for this is **pseudo-polynomial**, and it's the honest answer when an interviewer asks whether you just solved an NP-hard problem in polynomial time. You didn't.

## Rolling it to one row — and the loop direction that matters

Each row reads only the row above, so a single list of length W+1 works, updated in place:

\`\`\`python
for i in range(n):
    for c in range(capacity, weights[i] - 1, -1):   # DESCENDING
        dp[c] = max(dp[c], dp[c - weights[i]] + values[i])
\`\`\`

The descending inner loop is load-bearing. Going down, \`dp[c - weight]\` still holds the *previous* row's value — item \`i\` not yet used — which is what 0/1 requires. Go up instead and \`dp[c - weight]\` may already include item \`i\`, so you take the same item twice. That's not a bug in every universe: ascending order is exactly the **unbounded knapsack** (unlimited copies per item). The \`-1\` step picks the problem you're solving.

Other classics with the same two-index skeleton: longest common subsequence (\`dp[i][j]\` over prefixes of two strings), edit distance (insert/delete/replace as three neighbors), and coin change (amount as the second axis). Learn the shape once.`,
    },
    exercises: [
      {
        id: "dsa-min-path-sum",
        title: "Cheapest path through a grid",
        instructions: {
          typescript: `Implement \`minPathSum(grid)\`: the smallest total of cells on a path from top-left to bottom-right, moving only **right or down**.

State: \`dp[r][c]\` = cheapest cost to reach (r, c). Fill the first row and first column as running totals first — they have only one way in — then the interior with \`grid[r][c] + Math.min(above, left)\`.

Fill row by row, left to right, so both neighbors are final before you read them.

Expected output: \`7\` (1→3→1→1→1 down the right side), then \`12\`, then \`5\`.`,
          python: `Implement \`min_path_sum(grid)\`: the smallest total of cells on a path from top-left to bottom-right, moving only **right or down**.

State: \`dp[r][c]\` = cheapest cost to reach (r, c). Fill the first row and first column as running totals first — they have only one way in — then the interior with \`grid[r][c] + min(above, left)\`.

Fill row by row, left to right, so both neighbors are final before you read them. Allocate with \`[[0] * cols for _ in range(rows)]\` — the \`[[0] * cols] * rows\` form aliases one list into every row.

Expected output: \`7\` (1→3→1→1→1 down the right side), then \`12\`, then \`5\`.`,
        },
        starterCode: {
          typescript: `function minPathSum(grid: number[][]): number {
  if (grid.length === 0) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  const dp: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  // TODO:
  //   1. dp[0][0] = grid[0][0]
  //   2. first row: dp[0][c] = dp[0][c - 1] + grid[0][c]
  //   3. first column: dp[r][0] = dp[r - 1][0] + grid[r][0]
  //   4. the rest, row by row: grid[r][c] + Math.min(dp[r - 1][c], dp[r][c - 1])
  return dp[rows - 1][cols - 1];
}

console.log(minPathSum([[1, 3, 1], [1, 5, 1], [4, 2, 1]])); // expected 7
console.log(minPathSum([[1, 2, 3], [4, 5, 6]])); // expected 12
console.log(minPathSum([[5]])); // expected 5`,
          python: `def min_path_sum(grid):
    if not grid:
        return 0
    rows = len(grid)
    cols = len(grid[0])
    dp = [[0] * cols for _ in range(rows)]
    # TODO:
    #   1. dp[0][0] = grid[0][0]
    #   2. first row: dp[0][c] = dp[0][c - 1] + grid[0][c]
    #   3. first column: dp[r][0] = dp[r - 1][0] + grid[r][0]
    #   4. the rest, row by row: grid[r][c] + min(dp[r - 1][c], dp[r][c - 1])
    return dp[rows - 1][cols - 1]


print(min_path_sum([[1, 3, 1], [1, 5, 1], [4, 2, 1]]))  # expected 7
print(min_path_sum([[1, 2, 3], [4, 5, 6]]))  # expected 12
print(min_path_sum([[5]]))  # expected 5
`,
        },
      },
      {
        id: "dsa-knapsack-max-value",
        title: "0/1 knapsack",
        instructions: {
          typescript: `Implement \`knapsack(weights, values, capacity)\`: the maximum value that fits in the bag, taking each item **at most once**.

Either shape is fine:

- **Table:** \`dp[i][c]\` over items × capacity, skip vs take — \`Math.max(dp[i-1][c], dp[i-1][c - w] + v)\`.
- **One row:** a single array of length \`capacity + 1\`, inner loop counting **down** from \`capacity\`. Descending is what keeps each item from being taken twice; ascending would silently solve the *unbounded* knapsack instead.

Expected output: \`9\` (items of weight 3 and 4, values 4 + 5 — beating the value-dense single item), then \`0\` (nothing fits), then \`0\`.`,
          python: `Implement \`knapsack(weights, values, capacity)\`: the maximum value that fits in the bag, taking each item **at most once**.

Either shape is fine:

- **Table:** \`dp[i][c]\` over items × capacity, skip vs take — \`max(dp[i-1][c], dp[i-1][c - w] + v)\`.
- **One row:** a single list of length \`capacity + 1\`, inner loop \`range(capacity, w - 1, -1)\`. That \`-1\` step is what keeps each item from being taken twice; an ascending range would silently solve the *unbounded* knapsack instead.

Expected output: \`9\` (items of weight 3 and 4, values 4 + 5 — beating the value-dense single item), then \`0\` (nothing fits), then \`0\`.`,
        },
        starterCode: {
          typescript: `function knapsack(weights: number[], values: number[], capacity: number): number {
  // TODO: dp[c] = best value achievable with capacity c.
  // For each item i, walk c DOWN from capacity to weights[i]:
  //   dp[c] = Math.max(dp[c], dp[c - weights[i]] + values[i])
  // Descending order is what makes this 0/1 rather than unbounded.
  return 0;
}

// Weight 3 (value 4) + weight 4 (value 5) exactly fills capacity 7.
console.log(knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7)); // expected 9
console.log(knapsack([3, 4], [10, 12], 2)); // expected 0 (nothing fits)
console.log(knapsack([], [], 10)); // expected 0`,
          python: `def knapsack(weights, values, capacity):
    # TODO: dp[c] = best value achievable with capacity c.
    # For each item i, walk c DOWN from capacity to weights[i]:
    #   dp[c] = max(dp[c], dp[c - weights[i]] + values[i])
    # Descending order is what makes this 0/1 rather than unbounded.
    return 0


# Weight 3 (value 4) + weight 4 (value 5) exactly fills capacity 7.
print(knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7))  # expected 9
print(knapsack([3, 4], [10, 12], 2))  # expected 0 (nothing fits)
print(knapsack([], [], 10))  # expected 0
`,
        },
      },
    ],
    quiz: [
      {
        id: "dsa-grid-dp-q1",
        prompt: "For minimum path sum with moves right and down only, which fill order is valid?",
        options: [
          "Any order — every cell's value is independent of when its neighbors are computed",
          "Bottom-right to top-left, so the destination is settled before the cells feeding it",
          "Row by row, left to right — it guarantees the cell above and the cell to the left are final before you read them",
          "Anti-diagonal by anti-diagonal starting at the bottom-right corner, so a whole diagonal can be filled at once",
        ],
        answer: 2,
        explanation:
          "The recurrence reads (r-1, c) and (r, c-1), so any order that finalizes those two first works — row-major is the simple one. Sweeping anti-diagonals from the bottom-right runs the dependencies backwards: when you reach a cell, the neighbor above it and the neighbor to its left sit on diagonals you haven't filled yet. An order that reads unfilled cells doesn't crash on a zero-initialized table; it just returns a confidently wrong number.",
      },
      {
        id: "dsa-grid-dp-q2",
        prompt: "0/1 knapsack runs in O(n × W) for n items and capacity W. Have you solved an NP-hard problem in polynomial time?",
        options: [
          "No — W is a numeric value, not an input size, so the cost is exponential in the digits of W: pseudo-polynomial, not polynomial",
          "Yes — O(n × W) is polynomial, which is why knapsack is considered tractable in practice",
          "No — the algorithm is only correct for small W, and returns approximate answers above a threshold",
          "Yes for 0/1 knapsack, no for the unbounded variant, which has no polynomial table formulation",
        ],
        answer: 0,
        explanation:
          "Writing W takes about log₁₀(W) characters, so the table's size grows exponentially in the length of the input. A capacity of 10¹² is a 13-character input and a trillion-column table. That's what pseudo-polynomial means — the algorithm is exactly correct, just not polynomial in input size.",
      },
      {
        id: "dsa-grid-dp-q3",
        prompt: "In the single-row knapsack, you change the inner capacity loop from descending to ascending. What does the code now compute?",
        options: [
          "The same answer, more slowly — the direction only affects cache locality",
          "The unbounded knapsack: `dp[c - w]` may already include the current item, so items get reused without limit",
          "Nothing usable — the loop reads uninitialized cells and returns garbage",
          "The minimum-value packing, because the table fills from the opposite end",
        ],
        answer: 1,
        explanation:
          "Descending keeps `dp[c - w]` at its previous-row value (item not yet used), which enforces at-most-once. Ascending lets an update made earlier in the same pass feed the next one, so the item is taken repeatedly — the correct algorithm for *unbounded* knapsack, and a silent wrong answer for 0/1.",
      },
    ],
  },
];
