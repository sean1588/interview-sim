import type { Lesson } from "../types";

export const advancedLessons: Lesson[] = [
  {
    id: "rec-divide-and-conquer",
    module: "advanced",
    title: "Divide and Conquer",
    blurb: {
      typescript: "Split in half, solve both halves, combine — and where the cost goes.",
      python: "Split in half, solve both halves, combine — and where the cost goes.",
    },
    graphics: [
      {
        id: "divide-conquer",
        title: "Split, solve, combine",
        caption:
          "Divide and conquer halves the input at every level, so the recursion is log n deep. Whether the total is n log n or log n depends entirely on the combine step.",
        src: "/lesson-graphics/recursion/rec-divide-and-conquer.png",
      },
    ],
    content: {
      typescript: `# Divide and Conquer

Everything so far recursed on a structure someone else built. Divide and conquer recurses on a structure *you impose*: split the input into independent pieces, solve each with the same function, and combine the answers.

Three steps, always the same three:

1. **Divide** — split into subproblems (usually two halves).
2. **Conquer** — recurse on each. Base case: a piece small enough to answer directly.
3. **Combine** — assemble the subanswers into the answer for this level.

## Merge sort

\`\`\`ts
function mergeSort(values: number[]): number[] {
  if (values.length <= 1) return values;                 // base case
  const mid = Math.floor(values.length / 2);
  const left = mergeSort(values.slice(0, mid));          // conquer
  const right = mergeSort(values.slice(mid));
  return merge(left, right);                             // combine
}

function merge(a: number[], b: number[]): number[] {
  const out: number[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    out.push(a[i] <= b[j] ? a[i++] : b[j++]);
  }
  return out.concat(a.slice(i)).concat(b.slice(j));
}
\`\`\`

The recursion is four lines and obviously correct — *if* both halves come back sorted, merging two sorted lists is easy. All the real work is in \`merge\`, which is an ordinary loop. That division of labour is typical: the recursion expresses the strategy, a loop does the merging.

## Where the cost lives

Count it level by level, not call by call. Halving means there are **log n levels**. What varies is what each level costs *in total*:

- **Merge sort**: every level merges all n elements → O(n) per level × log n levels = **O(n log n)**.
- **Binary search**: each level does one comparison and *throws away* the other half → O(1) per level × log n levels = **O(log n)**.

\`\`\`ts
function binarySearch(values: number[], target: number, lo: number = 0, hi: number = values.length - 1): number {
  if (lo > hi) return -1;                                 // base case: empty range
  const mid = Math.floor((lo + hi) / 2);
  if (values[mid] === target) return mid;
  return values[mid] < target
    ? binarySearch(values, target, mid + 1, hi)           // discard the left half
    : binarySearch(values, target, lo, mid - 1);
}
\`\`\`

The difference is that binary search recurses on **one** side, so its "tree" is a single path. Two recursive calls that each halve the input give you n leaves; one gives you log n calls total.

Pass \`lo\`/\`hi\` rather than slicing — a slice copies, which would turn an O(log n) search into O(n).

## Depth is log n, which is the nice part

A million elements is 20 levels. Divide and conquer is the one recursive shape that is *never* at risk of overflowing the stack, because halving reaches 1 astonishingly fast. Contrast the linear recursions from earlier in this course, where depth equalled n.

Quicksort is the exception worth knowing: it divides by *partition*, not by position, so a bad pivot on already-sorted input splits n into 0 and n-1 — depth n, and O(n²) time. Randomized or median-of-three pivots exist to keep the split balanced, which is a statement about recursion depth as much as about speed.

## When to reach for it

When subproblems are **independent** — solving one tells you nothing about the other. Sorting, searching a sorted array, closest-pair, big-integer multiplication, most parallelizable work. (When the subproblems *overlap*, repeating them is the whole cost, and the answer is memoization — two lessons on.)

For the sorting algorithms themselves and their trade-offs, see the DSA course's [sorting survey](/learn/dsa/dsa-sorting-survey).`,
      python: `# Divide and Conquer

Everything so far recursed on a structure someone else built. Divide and conquer recurses on a structure *you impose*: split the input into independent pieces, solve each with the same function, and combine the answers.

Three steps, always the same three:

1. **Divide** — split into subproblems (usually two halves).
2. **Conquer** — recurse on each. Base case: a piece small enough to answer directly.
3. **Combine** — assemble the subanswers into the answer for this level.

## Merge sort

\`\`\`python
def merge_sort(values):
    if len(values) <= 1:
        return values                       # base case
    mid = len(values) // 2
    left = merge_sort(values[:mid])         # conquer
    right = merge_sort(values[mid:])
    return merge(left, right)               # combine


def merge(a, b):
    out = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i])
            i += 1
        else:
            out.append(b[j])
            j += 1
    return out + a[i:] + b[j:]
\`\`\`

The recursion is five lines and obviously correct — *if* both halves come back sorted, merging two sorted lists is easy. All the real work is in \`merge\`, which is an ordinary loop. That division of labour is typical: the recursion expresses the strategy, a loop does the merging.

## Where the cost lives

Count it level by level, not call by call. Halving means there are **log n levels**. What varies is what each level costs *in total*:

- **Merge sort**: every level merges all n elements → O(n) per level × log n levels = **O(n log n)**.
- **Binary search**: each level does one comparison and *throws away* the other half → O(1) per level × log n levels = **O(log n)**.

\`\`\`python
def binary_search(values, target, lo=0, hi=None):
    if hi is None:
        hi = len(values) - 1
    if lo > hi:
        return -1                                   # base case: empty range
    mid = (lo + hi) // 2
    if values[mid] == target:
        return mid
    if values[mid] < target:
        return binary_search(values, target, mid + 1, hi)   # discard the left half
    return binary_search(values, target, lo, mid - 1)
\`\`\`

The difference is that binary search recurses on **one** side, so its "tree" is a single path. Two recursive calls that each halve the input give you n leaves; one gives you log n calls total.

Pass \`lo\`/\`hi\` rather than slicing — a slice copies, which would turn an O(log n) search into O(n). (\`bisect\` in the standard library is the iterative version you'd actually ship.)

## Depth is log n, which is the nice part

A million elements is 20 levels. Divide and conquer is the one recursive shape that is *never* at risk of hitting the recursion limit, because halving reaches 1 astonishingly fast. Contrast the linear recursions from earlier in this course, where depth equalled n.

Quicksort is the exception worth knowing: it divides by *partition*, not by position, so a bad pivot on already-sorted input splits n into 0 and n-1 — depth n, and O(n²) time. Randomized or median-of-three pivots exist to keep the split balanced, which is a statement about recursion depth as much as about speed.

## When to reach for it

When subproblems are **independent** — solving one tells you nothing about the other. Sorting, searching a sorted list, closest-pair, big-integer multiplication, most parallelizable work. (When the subproblems *overlap*, repeating them is the whole cost, and the answer is memoization — two lessons on.)

For the sorting algorithms themselves and their trade-offs, see the DSA course's [sorting survey](/learn/dsa/dsa-sorting-survey).`,
    },
    exercises: [
      {
        id: "rec-merge-sort",
        title: "Merge sort, top-down",
        instructions: {
          typescript: `Implement the two halves of merge sort.

- \`merge(a, b)\` — an ordinary loop: repeatedly take the smaller front element, then append whatever is left of either side. No recursion here.
- \`mergeSort(values)\` — base case: 0 or 1 elements are already sorted. Otherwise split at the midpoint, sort each half recursively, and \`merge\` the results.

Use \`<=\` in the comparison so equal elements keep their original order — that's what makes merge sort *stable*.

**Expected output:** \`[1,2,3,4,5,6,8,9]\` then \`[]\`.`,
          python: `Implement the two halves of merge sort.

- \`merge(a, b)\` — an ordinary loop: repeatedly take the smaller front element, then append whatever is left of either side. No recursion here.
- \`merge_sort(values)\` — base case: 0 or 1 elements are already sorted. Otherwise split at the midpoint, sort each half recursively, and \`merge\` the results.

Use \`<=\` in the comparison so equal elements keep their original order — that's what makes merge sort *stable*.

**Expected output:** \`[1, 2, 3, 4, 5, 6, 8, 9]\` then \`[]\`.`,
        },
        starterCode: {
          typescript: `function merge(a: number[], b: number[]): number[] {
  // TODO: walk both arrays with two indices, always taking the smaller front
  // value, then append the remainder of whichever side is left.
  return [];
}

function mergeSort(values: number[]): number[] {
  // TODO: base case — 0 or 1 elements are already sorted.
  // TODO: split at Math.floor(values.length / 2), sort both halves, merge them.
  return values;
}

console.log(mergeSort([5, 2, 9, 1, 6, 3, 8, 4])); // expected: [1,2,3,4,5,6,8,9]
console.log(mergeSort([])); // expected: []`,
          python: `def merge(a, b):
    # TODO: walk both lists with two indices, always taking the smaller front
    # value, then append the remainder of whichever side is left.
    return []


def merge_sort(values):
    # TODO: base case — 0 or 1 elements are already sorted.
    # TODO: split at len(values) // 2, sort both halves, merge them.
    return values


print(merge_sort([5, 2, 9, 1, 6, 3, 8, 4]))  # expected: [1, 2, 3, 4, 5, 6, 8, 9]
print(merge_sort([]))                        # expected: []
`,
        },
      },
      {
        id: "rec-binary-search-recursive",
        title: "Binary search, one side only",
        instructions: {
          typescript: `Implement \`binarySearch(values, target, lo, hi)\` recursively over a sorted array, returning the index or \`-1\`.

- Base case: \`lo > hi\` — the range is empty, so the target isn't there.
- Compute \`mid\`; if it matches, return it.
- Otherwise recurse on **one** side only, with \`mid + 1\` or \`mid - 1\` as the new boundary.

Pass indices, never slices: slicing would copy and cost O(n). Note that the recursion is in tail position — which makes the iterative rewrite a two-minute job, and is why the version in your standard library is a loop.

**Expected output:** \`3\`, \`0\`, \`-1\`.`,
          python: `Implement \`binary_search(values, target, lo, hi)\` recursively over a sorted list, returning the index or \`-1\`.

- Base case: \`lo > hi\` — the range is empty, so the target isn't there.
- Compute \`mid\`; if it matches, return it.
- Otherwise recurse on **one** side only, with \`mid + 1\` or \`mid - 1\` as the new boundary.

Pass indices, never slices: slicing would copy and cost O(n). Note that the recursion is in tail position — which makes the iterative rewrite a two-minute job, and is why \`bisect\` is a loop.

**Expected output:** \`3\`, \`0\`, \`-1\`.`,
        },
        starterCode: {
          typescript: `const sorted = [1, 3, 5, 7, 9, 11, 13];

function binarySearch(
  values: number[],
  target: number,
  lo: number = 0,
  hi: number = values.length - 1
): number {
  // TODO: base case — lo > hi means the range is empty, return -1.
  // TODO: mid = Math.floor((lo + hi) / 2); return mid on a hit.
  // TODO: otherwise recurse on the half that could still contain target.
  return -1;
}

console.log(binarySearch(sorted, 7)); // expected: 3
console.log(binarySearch(sorted, 1)); // expected: 0
console.log(binarySearch(sorted, 8)); // expected: -1`,
          python: `sorted_values = [1, 3, 5, 7, 9, 11, 13]


def binary_search(values, target, lo=0, hi=None):
    if hi is None:
        hi = len(values) - 1
    # TODO: base case — lo > hi means the range is empty, return -1.
    # TODO: mid = (lo + hi) // 2; return mid on a hit.
    # TODO: otherwise recurse on the half that could still contain target.
    return -1


print(binary_search(sorted_values, 7))  # expected: 3
print(binary_search(sorted_values, 1))  # expected: 0
print(binary_search(sorted_values, 8))  # expected: -1
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-dc-cost",
        prompt:
          "Merge sort and binary search both halve the input at every level. Why is one O(n log n) and the other O(log n)?",
        options: [
          "Merge sort has a deeper recursion",
          "Binary search has no base case to evaluate",
          "Merge sort uses two indices per level",
          "Merge sort recurses on both halves and does O(n) work per level; binary search recurses on one and does O(1)",
        ],
        answer: 3,
        explanation:
          "Both have log n levels, so the difference is per-level cost and branching. Two halving calls plus an O(n) merge gives n log n; one halving call with a single comparison gives log n.",
      },
      {
        id: "rec-q-dc-depth",
        prompt: "Why is divide and conquer essentially never at risk of exhausting the stack?",
        options: [
          "Because halving the input reaches the base case in about log n levels",
          "Because the runtime eliminates its tail calls",
          "Because it allocates its subproblems on the heap",
          "Because each level frees the previous level's frame",
        ],
        answer: 0,
        explanation:
          "A million elements is about 20 levels deep. That's the structural advantage over the linear recursions earlier in this course, where depth equalled n.",
      },
      {
        id: "rec-q-quicksort-pivot",
        prompt: "Why does a bad quicksort pivot hurt recursion depth as well as running time?",
        options: [
          "Because a bad pivot forces a copy of the whole array",
          "Because the partition step becomes recursive too",
          "Because it splits n into 0 and n-1, so the recursion becomes n levels deep rather than log n",
          "Because it makes the sort unstable",
        ],
        answer: 2,
        explanation:
          "Quicksort divides by partition rather than by position, so an already-sorted input with a first-element pivot degenerates into a linear chain of calls: O(n²) time and O(n) depth. Randomized pivots exist to keep the split balanced.",
      },
    ],
  },
  {
    id: "rec-backtracking",
    module: "advanced",
    title: "Backtracking: Choose, Explore, Un-choose",
    blurb: {
      typescript: "Exploring every combination by making a choice and taking it back.",
      python: "Exploring every combination by making a choice and taking it back.",
    },
    graphics: [
      {
        id: "backtracking",
        title: "The decision tree",
        caption:
          "Backtracking walks a tree of decisions: take a choice, recurse, then undo it so the next branch starts from the same state.",
        src: "/lesson-graphics/recursion/rec-backtracking.png",
      },
    ],
    content: {
      typescript: `# Backtracking: Choose, Explore, Un-choose

Backtracking is recursion over a tree that **doesn't exist in memory** — the tree of decisions. At each level you pick one of the available choices, recurse to make the next decision, then undo the pick so the next branch starts from the same state.

The template is three lines, and they're always these three:

\`\`\`ts
for (const choice of choicesAt(state)) {
  path.push(choice);          // 1. choose
  explore(state, path, out);  // 2. explore
  path.pop();                 // 3. un-choose
}
\`\`\`

The \`pop\` is what makes it *back*tracking. Skip it and every branch inherits the previous branch's leftovers — exactly the bug you'd hit in the graph lesson by forgetting to remove a node from the path set.

## Subsets: include or exclude

The smallest example. At index \`i\` there are two choices — take \`values[i]\` or don't:

\`\`\`ts
function subsets(values: number[], i: number, path: number[], out: number[][]): void {
  if (i === values.length) {
    out.push([...path]);        // a complete decision → record a COPY
    return;
  }
  path.push(values[i]);         // choose: take it
  subsets(values, i + 1, path, out);
  path.pop();                   // un-choose
  subsets(values, i + 1, path, out);   // the "skip it" branch
}
\`\`\`

Note \`[...path]\` — you must copy. \`path\` is one array being mutated all the way through the walk; pushing it directly would put the same (eventually empty) array into \`out\` 2ⁿ times. Forgetting the copy is the single most common backtracking bug.

## Permutations: what's left to choose

Permutations differ only in which choices are available: everything not yet used.

\`\`\`ts
function permute(values: number[], used: boolean[], path: number[], out: number[][]): void {
  if (path.length === values.length) {
    out.push([...path]);
    return;
  }
  for (let i = 0; i < values.length; i++) {
    if (used[i]) continue;                 // not a legal choice right now
    used[i] = true;
    path.push(values[i]);
    permute(values, used, path, out);
    path.pop();                            // un-choose, both halves of the state
    used[i] = false;
  }
}
\`\`\`

Whatever you changed on the way down, change back on the way up — the array *and* the \`used\` flags.

## Pruning is the whole point

Without pruning, backtracking is just brute force with a nice shape: subsets is O(2ⁿ), permutations O(n!). What makes it usable is rejecting a partial choice **before** exploring it.

N-queens is the canonical demonstration: place one queen per row, and before recursing into row \`r + 1\`, check that the new queen isn't attacked by any already placed. A whole subtree of arrangements dies at that check. For n = 8 the naive count is 8⁸ ≈ 16.7 million placements; pruning cuts it to about 2,000 recursive calls.

\`\`\`ts
function solve(
  row: number,
  cols: Set<number>,      // columns already taken
  diag: Set<number>,      // ↖ diagonals, keyed row - c
  antiDiag: Set<number>,  // ↗ diagonals, keyed row + c
  n: number,
): number {
  if (row === n) return 1;                 // all rows placed: one solution
  let found = 0;
  for (let c = 0; c < n; c++) {
    if (cols.has(c) || diag.has(row - c) || antiDiag.has(row + c)) {
      continue;                            // ← the prune
    }
    cols.add(c); diag.add(row - c); antiDiag.add(row + c);
    found += solve(row + 1, cols, diag, antiDiag, n);
    cols.delete(c); diag.delete(row - c); antiDiag.delete(row + c);  // un-choose
  }
  return found;
}
\`\`\`

Three sets, because a queen attacks along three lines: its column, and both diagonals. Every square on a ↖ diagonal shares the same \`row - c\`, and every square on a ↗ diagonal shares the same \`row + c\` — which is what makes each check an O(1) set lookup. Track only \`cols\` and you don't have N-queens: you have "one queen per row and column", which for n = 8 has 8! = 40,320 arrangements rather than 92.

Prune as early as the constraint allows. Checking at the leaf and rejecting is correct and useless; checking as you place is what turns an exponential wall into something that finishes.

## The shape to recognize

- Depth = length of a complete solution (rows, positions, elements) — usually small, so the stack is fine.
- Width = choices per level — this is where the cost is.
- Every mutation on the way down needs a matching undo on the way up.
- Record a *copy* when you reach a complete solution.`,
      python: `# Backtracking: Choose, Explore, Un-choose

Backtracking is recursion over a tree that **doesn't exist in memory** — the tree of decisions. At each level you pick one of the available choices, recurse to make the next decision, then undo the pick so the next branch starts from the same state.

The template is three lines, and they're always these three:

\`\`\`python
for choice in choices_at(state):
    path.append(choice)          # 1. choose
    explore(state, path, out)    # 2. explore
    path.pop()                   # 3. un-choose
\`\`\`

The \`pop\` is what makes it *back*tracking. Skip it and every branch inherits the previous branch's leftovers — exactly the bug you'd hit in the graph lesson by forgetting to discard a node from the path set.

## Subsets: include or exclude

The smallest example. At index \`i\` there are two choices — take \`values[i]\` or don't:

\`\`\`python
def subsets(values, i, path, out):
    if i == len(values):
        out.append(list(path))       # a complete decision → record a COPY
        return
    path.append(values[i])           # choose: take it
    subsets(values, i + 1, path, out)
    path.pop()                       # un-choose
    subsets(values, i + 1, path, out)  # the "skip it" branch
\`\`\`

Note \`list(path)\` — you must copy. \`path\` is one list being mutated all the way through the walk; appending it directly would put the same (eventually empty) list into \`out\` 2ⁿ times. Forgetting the copy is the single most common backtracking bug.

## Permutations: what's left to choose

Permutations differ only in which choices are available: everything not yet used.

\`\`\`python
def permute(values, used, path, out):
    if len(path) == len(values):
        out.append(list(path))
        return
    for i, v in enumerate(values):
        if used[i]:
            continue                 # not a legal choice right now
        used[i] = True
        path.append(v)
        permute(values, used, path, out)
        path.pop()                   # un-choose, both halves of the state
        used[i] = False
\`\`\`

Whatever you changed on the way down, change back on the way up — the list *and* the \`used\` flags. (\`itertools.permutations\` ships this; write it once to understand what it's doing, then use the library.)

## Pruning is the whole point

Without pruning, backtracking is just brute force with a nice shape: subsets is O(2ⁿ), permutations O(n!). What makes it usable is rejecting a partial choice **before** exploring it.

N-queens is the canonical demonstration: place one queen per row, and before recursing into row \`r + 1\`, check that the new queen isn't attacked by any already placed. A whole subtree of arrangements dies at that check. For n = 8 the naive count is 8⁸ ≈ 16.7 million placements; pruning cuts it to about 2,000 recursive calls.

\`\`\`python
def solve(row, cols, diag, anti_diag, n):
    # cols: columns taken; diag: ↖ keyed row - c; anti_diag: ↗ keyed row + c
    if row == n:
        return 1                     # all rows placed: one solution
    found = 0
    for c in range(n):
        if c in cols or row - c in diag or row + c in anti_diag:
            continue                 # ← the prune
        cols.add(c); diag.add(row - c); anti_diag.add(row + c)
        found += solve(row + 1, cols, diag, anti_diag, n)
        cols.discard(c); diag.discard(row - c); anti_diag.discard(row + c)  # un-choose
    return found
\`\`\`

Three sets, because a queen attacks along three lines: its column, and both diagonals. Every square on a ↖ diagonal shares the same \`row - c\`, and every square on a ↗ diagonal shares the same \`row + c\` — which is what makes each check an O(1) set lookup. Track only \`cols\` and you don't have N-queens: you have "one queen per row and column", which for n = 8 has 8! = 40,320 arrangements rather than 92.

Prune as early as the constraint allows. Checking at the leaf and rejecting is correct and useless; checking as you place is what turns an exponential wall into something that finishes.

## The shape to recognize

- Depth = length of a complete solution (rows, positions, elements) — usually small, so the recursion limit is fine.
- Width = choices per level — this is where the cost is.
- Every mutation on the way down needs a matching undo on the way up.
- Record a *copy* when you reach a complete solution.`,
    },
    exercises: [
      {
        id: "rec-subsets",
        title: "Every subset, by choosing and un-choosing",
        instructions: {
          typescript: `Implement \`subsets(values)\` — every subset of the input, as an array of arrays.

Inside the helper, at index \`i\`:
- Base case: \`i === values.length\` — the decisions are all made, so push a **copy** of \`path\`.
- Otherwise take \`values[i]\` (push, recurse, pop) and then skip it (recurse without it).

Push \`[...path]\`, not \`path\` — the same array is reused throughout the walk.

**Expected output:** \`8\` and a list beginning \`[1,2,3]\`, then \`[[]]\`.`,
          python: `Implement \`subsets(values)\` — every subset of the input, as a list of lists.

Inside the helper, at index \`i\`:
- Base case: \`i == len(values)\` — the decisions are all made, so append a **copy** of \`path\`.
- Otherwise take \`values[i]\` (append, recurse, pop) and then skip it (recurse without it).

Append \`list(path)\`, not \`path\` — the same list is reused throughout the walk.

**Expected output:** \`8\` and a list beginning \`[1, 2, 3]\`, then \`[[]]\`.`,
        },
        starterCode: {
          typescript: `function subsets(values: number[]): number[][] {
  const out: number[][] = [];
  const path: number[] = [];

  function explore(i: number): void {
    // TODO: base case — i === values.length: push a COPY of path into out.
    // TODO: choose values[i] (push / explore(i + 1) / pop),
    //       then explore(i + 1) again for the branch that skips it.
  }

  explore(0);
  return out;
}

const all = subsets([1, 2, 3]);
console.log(all.length); // expected: 8
console.log(all); // expected: starts with [1,2,3]
console.log(subsets([])); // expected: [[]]`,
          python: `def subsets(values):
    out = []
    path = []

    def explore(i):
        # TODO: base case — i == len(values): append a COPY of path to out.
        # TODO: choose values[i] (append / explore(i + 1) / pop),
        #       then explore(i + 1) again for the branch that skips it.
        pass

    explore(0)
    return out


all_subsets = subsets([1, 2, 3])
print(len(all_subsets))  # expected: 8
print(all_subsets)       # expected: starts with [1, 2, 3]
print(subsets([]))       # expected: [[]]
`,
        },
      },
      {
        id: "rec-permutations",
        title: "Permutations with a used array",
        instructions: {
          typescript: `Implement \`permutations(values)\`.

- Base case: \`path.length === values.length\` — push a copy.
- Otherwise loop over every index; skip the ones already \`used\`; mark it used, push the value, recurse, then **undo both**.

The undo is the exercise. Forget \`used[i] = false\` and you get one permutation instead of six.

**Expected output:** \`6\` then \`[1,2,3]\` first.`,
          python: `Implement \`permutations(values)\`.

- Base case: \`len(path) == len(values)\` — append a copy.
- Otherwise loop over every index; skip the ones already \`used\`; mark it used, append the value, recurse, then **undo both**.

The undo is the exercise. Forget \`used[i] = False\` and you get one permutation instead of six.

**Expected output:** \`6\` then \`[1, 2, 3]\` first.`,
        },
        starterCode: {
          typescript: `function permutations(values: number[]): number[][] {
  const out: number[][] = [];
  const path: number[] = [];
  const used: boolean[] = values.map(() => false);

  function explore(): void {
    // TODO: base case — path.length === values.length: push a COPY of path.
    // TODO: for each i: skip if used[i]; otherwise mark used, push values[i],
    //       recurse, then pop and clear used[i].
  }

  explore();
  return out;
}

const perms = permutations([1, 2, 3]);
console.log(perms.length); // expected: 6
console.log(perms[0]); // expected: [1,2,3]`,
          python: `def permutations(values):
    out = []
    path = []
    used = [False] * len(values)

    def explore():
        # TODO: base case — len(path) == len(values): append a COPY of path.
        # TODO: for each i: skip if used[i]; otherwise mark used, append
        #       values[i], recurse, then pop and clear used[i].
        pass

    explore()
    return out


perms = permutations([1, 2, 3])
print(len(perms))  # expected: 6
print(perms[0] if perms else [])  # expected: [1, 2, 3]
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-backtrack-undo",
        prompt: "What is the `pop` (or un-choose) step actually for?",
        options: [
          "To restore the shared state so the next branch explores from the same starting point",
          "To free memory as the recursion proceeds",
          "To reverse the order in which solutions are recorded",
          "To signal the base case to the caller",
        ],
        answer: 0,
        explanation:
          "One mutable path is reused for the entire walk, so a choice made on the way down has to be undone on the way up. Otherwise each branch inherits the previous branch's leftovers.",
      },
      {
        id: "rec-q-backtrack-copy",
        prompt: "Why must a completed solution be recorded as a copy of the path?",
        options: [
          "Because the recursion returns before the path is filled",
          "Because copying is what makes the results comparable",
          "Because the path is one array mutated throughout the walk — storing the reference stores whatever it holds at the end",
          "Because the output collection cannot hold nested arrays",
        ],
        answer: 2,
        explanation:
          "Every stored reference would point at the same object, which the un-choose steps eventually empty. Copying at the moment of the base case captures that state permanently.",
      },
      {
        id: "rec-q-pruning",
        prompt: "In N-queens, what does pruning contribute?",
        options: [
          "It reduces the recursion depth from n to log n",
          "It removes the need to un-choose",
          "It changes the traversal from depth-first to breadth-first",
          "It rejects an illegal partial placement before recursing, discarding a whole subtree of arrangements",
        ],
        answer: 3,
        explanation:
          "Depth is still n — one frame per row. What pruning cuts is width: an early constraint check kills an entire subtree, which is the difference between roughly 16.7 million placements and about 2,000 calls.",
      },
    ],
  },
  {
    id: "rec-memoization",
    module: "advanced",
    title: "Memoized Recursion",
    blurb: {
      typescript: "A cache lookup as a second base case, and what it does and doesn't fix.",
      python: "A cache lookup as a second base case, and what it does and doesn't fix.",
    },
    graphics: [
      {
        id: "memo-tree",
        title: "The call tree collapses",
        caption:
          "Overlapping subproblems make naive recursion exponential. A cache turns every repeat into an immediate return, collapsing the tree to one call per distinct input.",
        src: "/lesson-graphics/recursion/rec-memoization.png",
      },
    ],
    content: {
      typescript: `# Memoized Recursion

Divide and conquer worked because the subproblems were **independent**. When they *overlap* — the same subproblem reached down many different branches — plain recursion re-solves it every single time, and the cost explodes.

\`\`\`ts
function fib(n: number): number {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}
\`\`\`

\`fib(40)\` makes over 300 million calls to compute 41 distinct values. \`fib(39)\` appears once, \`fib(38)\` twice, \`fib(37)\` three times, \`fib(34)\` thirteen times — the tree of repeats is the entire cost.

## The cache is a second base case

Read the fix that way and it stops feeling like a bolt-on:

\`\`\`ts
function fib(n: number, memo: Map<number, number> = new Map()): number {
  if (n < 2) return n;                     // base case 1: too small to recurse
  const hit = memo.get(n);
  if (hit !== undefined) return hit;       // base case 2: already computed
  const value = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, value);                      // record before returning
  return value;
}
\`\`\`

Every call now either returns immediately or computes a value that is never computed again. With n distinct inputs, that's **O(n) calls** — from exponential to linear by adding three lines. The rule of thumb: **memoized cost = number of distinct inputs × cost per call**, which is why counting distinct states is the first thing to do when you spot overlap.

## Getting the key right

The cache key must capture *everything* the result depends on. One parameter → the parameter. Two → a tuple or a joined string:

\`\`\`ts
const key = row + "," + col;
\`\`\`

Two failure modes, both quiet:

- **Key too narrow** — omit a parameter that matters and you serve a wrong answer from the cache. This produces bugs that look impossible, because the same call returns different things depending on what ran before.
- **Key too wide** — include something irrelevant (a timestamp, an accumulator that doesn't affect the result) and nothing ever hits; you keep the exponential cost and add memory on top.

And the function must be **pure** with respect to that key: same inputs, same output, no reliance on mutable outside state. Memoizing a function that reads a database or a clock caches a lie.

## What memoization does not fix

**Depth.** \`fib(50000)\` memoized still recurses 50,000 frames deep on the first descent before any cache entry exists — same \`RangeError\` as before, just after less work. Memoization removes repeated *work*, never recursion *depth*. When depth is the problem, you want the bottom-up table (or an explicit stack, next lesson).

**Memory.** The cache is O(distinct inputs). That's the trade — and a per-call \`new Map()\` default is worth pausing on: it lives only as long as the top-level call, so each fresh call to \`fib\` rebuilds from scratch. A module-level cache persists across calls, which is faster and is also a leak if the key space is unbounded.

## Top-down or bottom-up

Memoized recursion is **top-down dynamic programming**: you write the recurrence exactly as you'd state it, and the cache makes it efficient. The bottom-up version fills a table with a loop instead — same complexity, no stack depth, but you have to work out the fill order yourself.

Reach for memoized recursion when the recurrence is easy to state and the reachable state space is sparse; reach for a table when you need every state anyway or the depth would be a problem. The DSA course's [memoization lesson](/learn/dsa/dsa-memoization) covers the table forms and the classic DP recurrences; the point here is narrower — the cache is just a base case you added.`,
      python: `# Memoized Recursion

Divide and conquer worked because the subproblems were **independent**. When they *overlap* — the same subproblem reached down many different branches — plain recursion re-solves it every single time, and the cost explodes.

\`\`\`python
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
\`\`\`

\`fib(40)\` makes over 300 million calls to compute 41 distinct values. \`fib(39)\` appears once, \`fib(38)\` twice, \`fib(37)\` three times, \`fib(34)\` thirteen times — the tree of repeats is the entire cost.

## The cache is a second base case

Read the fix that way and it stops feeling like a bolt-on:

\`\`\`python
def fib(n, memo=None):
    if memo is None:
        memo = {}
    if n < 2:
        return n                 # base case 1: too small to recurse
    if n in memo:
        return memo[n]           # base case 2: already computed
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]
\`\`\`

Every call now either returns immediately or computes a value that is never computed again. With n distinct inputs, that's **O(n) calls** — from exponential to linear by adding three lines. The rule of thumb: **memoized cost = number of distinct inputs × cost per call**, which is why counting distinct states is the first thing to do when you spot overlap.

## Let the standard library do it

Python ships the decorator:

\`\`\`python
from functools import cache

@cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)
\`\`\`

\`@cache\` (3.9+) is an unbounded dict keyed by the arguments; \`@lru_cache(maxsize=1000)\` evicts the least recently used entry when it fills, which is what you want when the key space is unbounded. Both require the arguments to be **hashable** — so a list parameter has to become a tuple, and that requirement is a useful nudge: an unhashable argument is often a sign the function isn't as pure as you thought.

## Getting the key right

The cache key must capture *everything* the result depends on. Two failure modes, both quiet:

- **Key too narrow** — omit a parameter that matters and you serve a wrong answer from the cache. This produces bugs that look impossible, because the same call returns different things depending on what ran before. (This is the one \`@cache\` protects you from: it keys on all the arguments.)
- **Key too wide** — include something irrelevant (a timestamp, an accumulator that doesn't affect the result) and nothing ever hits; you keep the exponential cost and add memory on top.

And the function must be **pure** with respect to that key: same inputs, same output, no reliance on mutable outside state. Memoizing a function that reads a database or a clock caches a lie.

## What memoization does not fix

**Depth.** \`fib(50000)\` memoized still recurses 50,000 frames deep on the first descent before any cache entry exists — the same \`RecursionError\` as before, just after less work. Memoization removes repeated *work*, never recursion *depth*. When depth is the problem, you want the bottom-up table (or an explicit stack, next lesson).

**Memory.** The cache is O(distinct inputs). That's the trade — and a module-level \`@cache\` persists for the process lifetime, which is faster and is also a leak if the key space is unbounded. \`lru_cache(maxsize=…)\` exists for exactly that.

## Top-down or bottom-up

Memoized recursion is **top-down dynamic programming**: you write the recurrence exactly as you'd state it, and the cache makes it efficient. The bottom-up version fills a table with a loop instead — same complexity, no stack depth, but you have to work out the fill order yourself.

Reach for memoized recursion when the recurrence is easy to state and the reachable state space is sparse; reach for a table when you need every state anyway or the depth would be a problem. The DSA course's [memoization lesson](/learn/dsa/dsa-memoization) covers the table forms and the classic DP recurrences; the point here is narrower — the cache is just a base case you added.`,
    },
    exercises: [
      {
        id: "rec-memo-fib",
        title: "Count the calls, then add the cache",
        instructions: {
          typescript: `\`fibNaive\` is given and counts its own calls. Write \`fibMemo\` with a cache and compare.

- Check the cache first — that's your second base case.
- Store the computed value before returning it.
- Count calls the same way, so the two numbers are comparable.

**Expected output:** \`832040\`, a naive call count over 2 million, the same value from the memoized version, and a call count of about 2n.`,
          python: `\`fib_naive\` is given and counts its own calls. Write \`fib_memo\` with a cache and compare.

- Check the cache first — that's your second base case.
- Store the computed value before returning it.
- Count calls the same way, so the two numbers are comparable.

**Expected output:** \`832040\`, a naive call count over 2 million, the same value from the memoized version, and a call count of about 2n.`,
        },
        starterCode: {
          typescript: `let naiveCalls = 0;
let memoCalls = 0;

function fibNaive(n: number): number {
  naiveCalls++;
  if (n < 2) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

function fibMemo(n: number, memo: Map<number, number> = new Map()): number {
  memoCalls++;
  // TODO: base case 1 — n < 2 returns n.
  // TODO: base case 2 — return the cached value if memo already has n.
  // TODO: compute fibMemo(n - 1, memo) + fibMemo(n - 2, memo), store it, return it.
  return 0;
}

console.log(fibNaive(30), "calls:", naiveCalls); // expected: 832040, ~2.7M calls
console.log(fibMemo(30), "calls:", memoCalls); // expected: 832040, ~59 calls`,
          python: `naive_calls = 0
memo_calls = 0


def fib_naive(n):
    global naive_calls
    naive_calls += 1
    if n < 2:
        return n
    return fib_naive(n - 1) + fib_naive(n - 2)


def fib_memo(n, memo=None):
    global memo_calls
    memo_calls += 1
    if memo is None:
        memo = {}
    # TODO: base case 1 — n < 2 returns n.
    # TODO: base case 2 — return memo[n] if it is already there.
    # TODO: compute fib_memo(n - 1, memo) + fib_memo(n - 2, memo), store, return.
    return 0


print(fib_naive(30), "calls:", naive_calls)  # expected: 832040, ~2.7M calls
print(fib_memo(30), "calls:", memo_calls)    # expected: 832040, ~59 calls
`,
        },
      },
      {
        id: "rec-memo-grid-paths",
        title: "Two parameters, one key",
        instructions: {
          typescript: `\`countPaths(rows, cols)\` counts the routes from the top-left to the bottom-right of a grid moving only right or down.

- Base case: one row or one column means exactly one route.
- Recursive case: \`countPaths(r - 1, c) + countPaths(r, c - 1)\`.
- Memoize on **both** coordinates: build a key like \`r + "," + c\`. A key that drops one of them returns wrong answers, not slow ones.

**Expected output:** \`2002\` then \`1\`.`,
          python: `\`count_paths(rows, cols)\` counts the routes from the top-left to the bottom-right of a grid moving only right or down.

- Base case: one row or one column means exactly one route.
- Recursive case: \`count_paths(r - 1, c) + count_paths(r, c - 1)\`.
- Memoize on **both** coordinates: use the tuple \`(r, c)\` as the key. A key that drops one of them returns wrong answers, not slow ones.

**Expected output:** \`2002\` then \`1\`.`,
        },
        starterCode: {
          typescript: `function countPaths(rows: number, cols: number): number {
  const memo = new Map<string, number>();

  function go(r: number, c: number): number {
    // TODO: base case — r === 1 or c === 1 means one route.
    // TODO: build key = r + "," + c and return the cached value if present.
    // TODO: otherwise go(r - 1, c) + go(r, c - 1), cache it, return it.
    return 0;
  }

  return go(rows, cols);
}

console.log(countPaths(6, 10)); // expected: 2002
console.log(countPaths(1, 20)); // expected: 1`,
          python: `def count_paths(rows, cols):
    memo = {}

    def go(r, c):
        # TODO: base case — r == 1 or c == 1 means one route.
        # TODO: use (r, c) as the key and return the cached value if present.
        # TODO: otherwise go(r - 1, c) + go(r, c - 1), cache it, return it.
        return 0

    return go(rows, cols)


print(count_paths(6, 10))  # expected: 2002
print(count_paths(1, 20))  # expected: 1
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-memo-when",
        prompt: "Memoization helps when subproblems are…",
        options: [
          "overlapping — the same subproblem is reached down many branches",
          "independent, as in merge sort's two halves",
          "too deep for the stack",
          "expensive to state but cheap to compute",
        ],
        answer: 0,
        explanation:
          "A cache pays off only when the same input recurs. Divide and conquer splits into disjoint pieces, so nothing repeats and a cache adds memory for no benefit.",
      },
      {
        id: "rec-q-memo-key",
        prompt: "A memoized function takes `(row, col)` but the cache is keyed on `row` alone. What happens?",
        options: [
          "It runs correctly but no faster",
          "It raises an error on the second lookup",
          "It returns wrong answers, because a cached result is served for a different column",
          "It silently disables the cache",
        ],
        answer: 2,
        explanation:
          "The key must capture everything the result depends on. Too narrow serves a stale answer for a different state; too wide never hits and keeps the exponential cost.",
      },
      {
        id: "rec-q-memo-depth",
        prompt: {
          typescript:
            "A memoized recursion for `fib(50000)` still throws `RangeError: Maximum call stack size exceeded`. Why?",
          python:
            "A memoized recursion for `fib(50000)` still raises `RecursionError`. Why?",
        },
        options: [
          "The cache is consulted only after the recursive calls",
          "Memoization removes repeated work, not depth — the first descent is still 50,000 frames before any entry exists",
          "The cache itself is stored on the stack",
          "The base case never fires once a cache is present",
        ],
        answer: 1,
        explanation:
          "Nothing is cached until the deepest call returns, so the first path down is the full depth. When depth is the problem, the fix is a bottom-up table or an explicit stack, not a cache.",
      },
    ],
  },
  {
    id: "rec-explicit-stack",
    module: "advanced",
    title: "Recursion Without the Call Stack",
    blurb: {
      typescript: "Converting a recursion into a loop with a stack you own.",
      python: "Converting a recursion into a loop with a stack you own.",
    },
    graphics: [
      {
        id: "explicit-stack",
        title: "Move the stack to the heap",
        caption:
          "An explicit stack holds the same pending work the call stack did — but on the heap, where a million entries is unremarkable.",
        src: "/lesson-graphics/recursion/rec-explicit-stack.png",
      },
    ],
    content: {
      typescript: `# Recursion Without the Call Stack

The final move: when depth is the problem, take the stack away from the runtime and keep it yourself. The heap is bounded by memory rather than by a fixed frame budget, so an explicit stack of a million entries is unremarkable where a million frames is fatal.

## What the call stack was actually storing

Each frame held two things: the **arguments** of a pending call, and **where to resume**. If the only pending work is "visit these nodes eventually", the second part disappears and the conversion is easy.

Pre-order DFS is the easy case:

\`\`\`ts
function preOrder(root: TreeNode | null): number[] {
  const out: number[] = [];
  const stack: (TreeNode | null)[] = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;             // the null base case, unchanged
    out.push(node.val);              // visit
    stack.push(node.right);          // push RIGHT first…
    stack.push(node.left);           // …so LEFT is popped first
  }
  return out;
}
\`\`\`

The push order is the one thing to get right: a stack is LIFO, so pushing right before left makes left come out first — matching the recursive version's \`left, right\`. Push them the other way round and you get a mirror-image traversal that looks plausible and is wrong.

Swap the stack for a queue (\`shift()\` instead of \`pop()\`) and the same loop becomes breadth-first. That's the clearest demonstration that the *structure holding pending work* is what decides traversal order — the recursion was only ever a stack in disguise.

## The hard case: work after the children

Post-order breaks the easy conversion, because now there *is* something to resume: the parent has work left after both children finish. You have to store that pending state explicitly, usually as a flag on the stack entry:

\`\`\`ts
type Frame = { node: TreeNode; expanded: boolean };

function postOrder(root: TreeNode | null): number[] {
  const out: number[] = [];
  const stack: Frame[] = root ? [{ node: root, expanded: false }] : [];
  while (stack.length > 0) {
    const frame = stack.pop()!;
    if (frame.expanded) {
      out.push(frame.node.val);              // second visit: children are done
      continue;
    }
    stack.push({ node: frame.node, expanded: true });   // come back to me later
    if (frame.node.right) stack.push({ node: frame.node.right, expanded: false });
    if (frame.node.left) stack.push({ node: frame.node.left, expanded: false });
  }
  return out;
}
\`\`\`

That \`expanded\` flag is a hand-rolled **program counter** — it records which half of the function body this frame was in. This is exactly what the call stack gave you for free, and seeing it written out is the clearest argument for using recursion when depth allows: the recursive post-order was three lines and needed no invention.

## When to actually do this

- **Unbounded depth** — user-supplied nesting, a graph that might be a long chain, a linked list of unknown length.
- **You need to pause, resume, or bound the work** — an explicit stack is a value you can persist, cap ("stop after 10,000 nodes"), or step through in a debugger.
- **You must not blow up** in a request handler or a long-running service, where an overflow takes more than this one operation down.

And when *not* to: most of the time. A recursive tree walk is shorter, matches the data's shape, and is safe whenever depth is bounded by the height of a real tree. Convert because you measured a depth problem, not because recursion feels risky.

## The checklist for converting

1. What did each frame hold? Those fields become your stack entry.
2. Where could the function resume? Each resume point becomes a state flag (or a second entry pushed *before* the children).
3. Push children in reverse order to preserve the recursive visit order.
4. Base cases stay exactly as they are — they just become \`continue\` instead of \`return\`.`,
      python: `# Recursion Without the Call Stack

The final move: when depth is the problem, take the stack away from the interpreter and keep it yourself. A Python \`list\` on the heap is bounded by memory rather than by the 1000-frame recursion limit, so an explicit stack of a million entries is unremarkable where a million frames is impossible.

## What the call stack was actually storing

Each frame held two things: the **arguments** of a pending call, and **where to resume**. If the only pending work is "visit these nodes eventually", the second part disappears and the conversion is easy.

Pre-order DFS is the easy case:

\`\`\`python
def pre_order(root):
    out = []
    stack = [root]
    while stack:
        node = stack.pop()
        if node is None:
            continue                  # the None base case, unchanged
        out.append(node.val)          # visit
        stack.append(node.right)      # push RIGHT first…
        stack.append(node.left)       # …so LEFT is popped first
    return out
\`\`\`

The push order is the one thing to get right: a stack is LIFO, so pushing right before left makes left come out first — matching the recursive version's \`left, right\`. Push them the other way round and you get a mirror-image traversal that looks plausible and is wrong.

Swap the stack for a \`deque\` used as a queue (\`popleft()\` instead of \`pop()\`) and the same loop becomes breadth-first. That's the clearest demonstration that the *structure holding pending work* is what decides traversal order — the recursion was only ever a stack in disguise.

## The hard case: work after the children

Post-order breaks the easy conversion, because now there *is* something to resume: the parent has work left after both children finish. You have to store that pending state explicitly, usually as a flag on the stack entry:

\`\`\`python
def post_order(root):
    out = []
    stack = [(root, False)] if root else []
    while stack:
        node, expanded = stack.pop()
        if expanded:
            out.append(node.val)          # second visit: children are done
            continue
        stack.append((node, True))        # come back to me later
        if node.right:
            stack.append((node.right, False))
        if node.left:
            stack.append((node.left, False))
    return out
\`\`\`

That \`expanded\` flag is a hand-rolled **program counter** — it records which half of the function body this frame was in. This is exactly what the call stack gave you for free, and seeing it written out is the clearest argument for using recursion when depth allows: the recursive post-order was three lines and needed no invention.

## When to actually do this

- **Unbounded depth** — user-supplied nesting, a graph that might be a long chain, a linked list of unknown length.
- **You need to pause, resume, or bound the work** — an explicit stack is a value you can persist, cap ("stop after 10,000 nodes"), or step through in a debugger.
- **You must not blow up** in a request handler or a long-running service, where an unhandled \`RecursionError\` takes more than this one operation down.

And when *not* to: most of the time. A recursive tree walk is shorter, matches the data's shape, and is safe whenever depth is bounded by the height of a real tree. Convert because you measured a depth problem, not because recursion feels risky.

## The checklist for converting

1. What did each frame hold? Those fields become your stack entry (a tuple or a small dataclass).
2. Where could the function resume? Each resume point becomes a state flag (or a second entry pushed *before* the children).
3. Push children in reverse order to preserve the recursive visit order.
4. Base cases stay exactly as they are — they just become \`continue\` instead of \`return\`.`,
    },
    exercises: [
      {
        id: "rec-iterative-preorder",
        title: "Pre-order with a stack you own",
        instructions: {
          typescript: `Rewrite the pre-order traversal as a loop over an explicit stack — no recursive calls.

- Seed the stack with the root.
- Pop; skip nulls (that's the base case).
- Push the value, then push the children **right first, left second**, so left is popped first.

Get the push order backwards and you'll get \`[5,9,12,3,4,1]\` — a mirror image. That's the bug worth seeing once.

**Expected output:** \`[5,3,1,4,9,12]\` then \`[]\`.`,
          python: `Rewrite the pre-order traversal as a loop over an explicit stack — no recursive calls.

- Seed the stack with the root.
- Pop; skip \`None\` (that's the base case).
- Append the value, then push the children **right first, left second**, so left is popped first.

Get the push order backwards and you'll get \`[5, 9, 12, 3, 4, 1]\` — a mirror image. That's the bug worth seeing once.

**Expected output:** \`[5, 3, 1, 4, 9, 12]\` then \`[]\`.`,
        },
        starterCode: {
          typescript: `class TreeNode {
  val: number;
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

const root = new TreeNode(5);
root.left = new TreeNode(3);
root.right = new TreeNode(9);
root.left.left = new TreeNode(1);
root.left.right = new TreeNode(4);
root.right.right = new TreeNode(12);

function preOrderIterative(start: TreeNode | null): number[] {
  const out: number[] = [];
  const stack: (TreeNode | null)[] = [start];
  // TODO: while the stack isn't empty: pop, skip null, push the value,
  // then push node.right and node.left (in that order).
  return out;
}

console.log(preOrderIterative(root)); // expected: [5,3,1,4,9,12]
console.log(preOrderIterative(null)); // expected: []`,
          python: `class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


root = TreeNode(5)
root.left = TreeNode(3)
root.right = TreeNode(9)
root.left.left = TreeNode(1)
root.left.right = TreeNode(4)
root.right.right = TreeNode(12)


def pre_order_iterative(start):
    out = []
    stack = [start]
    # TODO: while the stack is non-empty: pop, skip None, append the value,
    # then push node.right and node.left (in that order).
    return out


print(pre_order_iterative(root))  # expected: [5, 3, 1, 4, 9, 12]
print(pre_order_iterative(None))  # expected: []
`,
        },
      },
      {
        id: "rec-stack-flatten",
        title: "Flatten without recursing",
        instructions: {
          typescript: `Flatten arbitrarily nested arrays with an explicit stack, so a document nested 100,000 levels deep can't overflow anything.

- Seed the stack with the top-level array's elements, in reverse, so the first element is popped first.
- Pop an item: if it's an array, push its elements (reversed); otherwise it's a leaf, so record it.

This is the same walk as the recursive version — the pending work just lives in your array instead of in frames.

**Expected output:** \`[1,2,3,4,5,6]\` then \`50\`.`,
          python: `Flatten arbitrarily nested lists with an explicit stack, so a document nested 100,000 levels deep can't raise \`RecursionError\`.

- Seed the stack with the top-level list's elements, reversed, so the first element is popped first.
- Pop an item: if it's a list, push its elements (reversed); otherwise it's a leaf, so record it.

This is the same walk as the recursive version — the pending work just lives in your list instead of in frames.

**Expected output:** \`[1, 2, 3, 4, 5, 6]\` then \`50\`.`,
        },
        starterCode: {
          typescript: `type Nested = number | Nested[];

const data: Nested[] = [1, [2, [3, [4, []]], 5], [], [[6]]];

// A chain 50 deep: [[[[…1…]]]]. The recursive walk handles this; the point is
// that the iterative one would handle 100,000 just as happily.
let deep: Nested = 1;
for (let i = 0; i < 49; i++) deep = [deep];

function flattenIterative(values: Nested[]): number[] {
  const out: number[] = [];
  const stack: Nested[] = [...values].reverse();
  // TODO: while the stack isn't empty: pop an item. Array.isArray(item) →
  // push its elements reversed; otherwise push item onto out.
  return out;
}

function deepestLevel(values: Nested[]): number {
  // TODO: same loop, but push [item, depth] pairs and track the maximum depth
  // reached. The outermost array's elements are at depth 1.
  return 0;
}

console.log(flattenIterative(data)); // expected: [1,2,3,4,5,6]
console.log(deepestLevel([deep])); // expected: 50`,
          python: `data = [1, [2, [3, [4, []]], 5], [], [[6]]]

# A chain 50 deep: [[[[…1…]]]]. The recursive walk handles this; the point is
# that the iterative one would handle 100,000 just as happily.
deep = 1
for _ in range(49):
    deep = [deep]


def flatten_iterative(values):
    out = []
    stack = list(reversed(values))
    # TODO: while the stack is non-empty: pop an item. isinstance(item, list)
    # means push its elements reversed; otherwise append item to out.
    return out


def deepest_level(values):
    # TODO: same loop, but push (item, depth) pairs and track the maximum depth
    # reached. The outermost list's elements are at depth 1.
    return 0


print(flatten_iterative(data))  # expected: [1, 2, 3, 4, 5, 6]
print(deepest_level([deep]))    # expected: 50
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-explicit-push-order",
        prompt: "Converting pre-order DFS to an explicit stack, why push the right child before the left?",
        options: [
          "To keep the stack balanced",
          "Because the right subtree is usually larger",
          "It makes no difference to the output",
          "Because a stack is LIFO, so the last pushed is popped first — pushing right first makes left visited first",
        ],
        answer: 3,
        explanation:
          "The recursive version visits left then right. To reproduce that with a LIFO structure, the left child must be on top of the stack, which means pushing it last.",
      },
      {
        id: "rec-q-explicit-why",
        prompt: "What is the real advantage of an explicit stack over the call stack?",
        options: [
          "It lives on the heap, so depth is bounded by memory rather than by a frame limit",
          "It visits nodes in a better order",
          "It removes the need for a base case",
          "It is always faster per node",
        ],
        answer: 0,
        explanation:
          "The work is identical; only where the pending work is stored changes. A heap-allocated stack of a million entries is ordinary, while a million frames is fatal — and it can also be capped, persisted, or inspected.",
      },
      {
        id: "rec-q-explicit-postorder",
        prompt: "Why is post-order harder to convert than pre-order?",
        options: [
          "It visits more nodes",
          "It requires a queue rather than a stack",
          "The parent has work pending after its children, so the frame's resume point must be stored explicitly — usually as a state flag",
          "Its base case cannot be expressed iteratively",
        ],
        answer: 2,
        explanation:
          "Pre-order finishes with a node before descending, so nothing needs resuming. Post-order does, and reproducing that means hand-rolling the program counter the call stack was keeping for you.",
      },
    ],
  },
];
