import type { Lesson } from "../types";

export const patternsLessons: Lesson[] = [
  {
    id: "rec-accumulators",
    module: "patterns",
    title: "Accumulators and Helper Parameters",
    blurb: {
      typescript: "Carrying state down the stack instead of building it up on the way back.",
      python: "Carrying state down the stack instead of building it up on the way back.",
    },
    graphics: [
      {
        id: "accumulator",
        title: "Down or up",
        caption:
          "Two ways to build an answer: pass a partial result down as an extra parameter, or return values up and combine them in the caller.",
        src: "/lesson-graphics/recursion/rec-accumulators.png",
      },
    ],
    content: {
      typescript: `# Accumulators and Helper Parameters

There are two ways to build an answer out of a recursion, and knowing which one you're writing removes most of the confusion around "where do I put the result?".

## Build it up (return values)

Each call returns its own answer; the caller combines the answers from below. Nothing is shared, nothing is mutated.

\`\`\`ts
function sumList(values: number[], i: number = 0): number {
  if (i === values.length) return 0;
  return values[i] + sumList(values, i + 1);  // combine on the way UP
}
\`\`\`

The work happens as the stack unwinds. This is the default, and it's the one to reach for when the answer is a single value.

## Carry it down (an accumulator)

Each call takes a *partial answer* as an extra parameter and passes an updated copy downward. The base case returns the finished accumulator.

\`\`\`ts
function sumList(values: number[], i: number = 0, acc: number = 0): number {
  if (i === values.length) return acc;         // the answer is already built
  return sumList(values, i + 1, acc + values[i]);
}
\`\`\`

Nothing is left to do after the recursive call — the answer arrives complete from the bottom. That's the **tail-recursive** shape (next lesson), and it's also what makes an accumulator natural when you're collecting many things rather than computing one:

\`\`\`ts
function collectEven(values: number[], i: number = 0, out: number[] = []): number[] {
  if (i === values.length) return out;
  if (values[i] % 2 === 0) out.push(values[i]);
  return collectEven(values, i + 1, out);
}
\`\`\`

## The public/private helper split

An accumulator is an implementation detail, and leaking it into your signature invites a caller to pass a wrong one. Wrap it:

\`\`\`ts
function sumList(values: number[]): number {
  function go(i: number, acc: number): number {
    return i === values.length ? acc : go(i + 1, acc + values[i]);
  }
  return go(0, 0);
}
\`\`\`

The inner function also **closes over** \`values\`, so it doesn't have to be threaded through every call. That's the standard recursive-helper shape in real code: a thin public function that validates and seeds, plus an inner one that does the recursion with whatever extra state it needs — a depth counter, the path so far, a visited set, an output array.

## Slicing is the trap

\`sumList(values.slice(1))\` reads beautifully and is quietly O(n²): every call copies the rest of the array. Pass an **index** instead of a smaller array. The recursion still shrinks — \`values.length - i\` is the thing getting smaller — but nothing gets copied.

## Which one?

- Returning up is easier to reason about — no shared mutable state, and each call is independently testable.
- An accumulator avoids re-combining work (string concatenation, list building) and is what you need if you want the tail-call shape.
- Shared mutable accumulators (that \`out\` array) are efficient and are what most tree/graph walks use in practice, but remember that *every* branch is writing into the same array — order-of-visit becomes order-in-output.`,
      python: `# Accumulators and Helper Parameters

There are two ways to build an answer out of a recursion, and knowing which one you're writing removes most of the confusion around "where do I put the result?".

## Build it up (return values)

Each call returns its own answer; the caller combines the answers from below. Nothing is shared, nothing is mutated.

\`\`\`python
def sum_list(values, i=0):
    if i == len(values):
        return 0
    return values[i] + sum_list(values, i + 1)  # combine on the way UP
\`\`\`

The work happens as the stack unwinds. This is the default, and it's the one to reach for when the answer is a single value.

## Carry it down (an accumulator)

Each call takes a *partial answer* as an extra parameter and passes an updated copy downward. The base case returns the finished accumulator.

\`\`\`python
def sum_list(values, i=0, acc=0):
    if i == len(values):
        return acc                              # the answer is already built
    return sum_list(values, i + 1, acc + values[i])
\`\`\`

Nothing is left to do after the recursive call — the answer arrives complete from the bottom. That's the **tail-recursive** shape (next lesson), and it's also what makes an accumulator natural when you're collecting many things rather than computing one.

## The mutable default argument trap

The obvious way to write a collecting accumulator is the one Python punishes:

\`\`\`python
def collect_even(values, i=0, out=[]):   # ← BUG: one list, shared by every call
    ...
\`\`\`

Default arguments are evaluated **once**, when the \`def\` executes — so \`out\` is the *same list object* on every top-level call, and results from the previous call are still in it. The fix is the standard one:

\`\`\`python
def collect_even(values, i=0, out=None):
    if out is None:
        out = []
    if i == len(values):
        return out
    if values[i] % 2 == 0:
        out.append(values[i])
    return collect_even(values, i + 1, out)
\`\`\`

This bites hardest in recursion, because the accumulator parameter is exactly the kind of thing you want to default.

## The public/private helper split

An accumulator is an implementation detail, and leaking it into your signature invites a caller to pass a wrong one. Wrap it:

\`\`\`python
def sum_list(values):
    def go(i, acc):
        return acc if i == len(values) else go(i + 1, acc + values[i])
    return go(0, 0)
\`\`\`

The inner function also **closes over** \`values\`, so it doesn't have to be threaded through every call. That's the standard recursive-helper shape in real code: a thin public function that validates and seeds, plus an inner one carrying whatever extra state it needs — a depth counter, the path so far, a visited set, an output list.

## Slicing is the trap

\`sum_list(values[1:])\` reads beautifully and is quietly O(n²): every call copies the rest of the list. Pass an **index** instead of a smaller list. The recursion still shrinks — \`len(values) - i\` is the thing getting smaller — but nothing gets copied.

## Which one?

- Returning up is easier to reason about — no shared mutable state, and each call is independently testable.
- An accumulator avoids re-combining work (string joining, list building) and is what you need if you want the tail-call shape.
- Shared mutable accumulators (that \`out\` list) are efficient and are what most tree/graph walks use in practice, but remember that *every* branch is appending to the same list — order-of-visit becomes order-in-output.`,
    },
    exercises: [
      {
        id: "rec-accumulate-sum",
        title: "Both directions, same sum",
        instructions: {
          typescript: `Write the same sum twice so the difference is in front of you.

- \`sumUp(values, i)\` — return \`values[i] + sumUp(values, i + 1)\`, combining on the way back up. Base case: \`i\` has reached the end, return 0.
- \`sumDown(values, i, acc)\` — pass the running total down; the base case returns \`acc\`.

Use an **index**, not \`slice\` — copying the rest of the array on each call would make this O(n²).

**Expected output:** \`19\`, \`19\`, \`0\`.`,
          python: `Write the same sum twice so the difference is in front of you.

- \`sum_up(values, i)\` — return \`values[i] + sum_up(values, i + 1)\`, combining on the way back up. Base case: \`i\` has reached the end, return 0.
- \`sum_down(values, i, acc)\` — pass the running total down; the base case returns \`acc\`.

Use an **index**, not a slice — copying the rest of the list on each call would make this O(n²).

**Expected output:** \`19\`, \`19\`, \`0\`.`,
        },
        starterCode: {
          typescript: `function sumUp(values: number[], i: number = 0): number {
  // TODO: base case — i === values.length, nothing left to add.
  // TODO: recursive case — values[i] + sumUp(values, i + 1).
  return 0;
}

function sumDown(values: number[], i: number = 0, acc: number = 0): number {
  // TODO: base case — i === values.length, the answer is already in acc.
  // TODO: recursive case — sumDown(values, i + 1, acc + values[i]).
  return 0;
}

const nums = [4, 7, 1, 5, 2];
console.log(sumUp(nums)); // expected: 19
console.log(sumDown(nums)); // expected: 19
console.log(sumUp([])); // expected: 0`,
          python: `def sum_up(values, i=0):
    # TODO: base case — i == len(values), nothing left to add.
    # TODO: recursive case — values[i] plus sum_up(values, i + 1).
    return 0


def sum_down(values, i=0, acc=0):
    # TODO: base case — i == len(values), the answer is already in acc.
    # TODO: recursive case — sum_down(values, i + 1, acc + values[i]).
    return 0


nums = [4, 7, 1, 5, 2]
print(sum_up(nums))    # expected: 19
print(sum_down(nums))  # expected: 19
print(sum_up([]))      # expected: 0
`,
        },
      },
      {
        id: "rec-collect-with-helper",
        title: "Hide the accumulator in a helper",
        instructions: {
          typescript: `\`collectLongWords(words, minLength)\` should return the words at least \`minLength\` characters long, in order — but the accumulator must not appear in the public signature.

Fill in the inner \`go\` helper: it takes the index and the output array, closes over \`words\` and \`minLength\`, and returns \`out\` once the index reaches the end.

**Expected output:** \`["recursion","frame"]\` then \`[]\`.`,
          python: `\`collect_long_words(words, min_length)\` should return the words at least \`min_length\` characters long, in order — but the accumulator must not appear in the public signature.

Fill in the inner \`go\` helper: it takes the index and the output list, closes over \`words\` and \`min_length\`, and returns \`out\` once the index reaches the end.

**Expected output:** \`['recursion', 'frame']\` then \`[]\`.`,
        },
        starterCode: {
          typescript: `function collectLongWords(words: string[], minLength: number): string[] {
  function go(i: number, out: string[]): string[] {
    // TODO: base case — i === words.length, return out.
    // TODO: push words[i] when it is long enough, then recurse on i + 1.
    return out;
  }
  return go(0, []);
}

console.log(collectLongWords(["recursion", "is", "a", "frame", "op"], 5));
// expected: ["recursion","frame"]
console.log(collectLongWords(["ok", "no"], 5)); // expected: []`,
          python: `def collect_long_words(words, min_length):
    def go(i, out):
        # TODO: base case — i == len(words), return out.
        # TODO: append words[i] when it is long enough, then recurse on i + 1.
        return out

    return go(0, [])


print(collect_long_words(["recursion", "is", "a", "frame", "op"], 5))
# expected: ['recursion', 'frame']
print(collect_long_words(["ok", "no"], 5))  # expected: []
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-accumulator-direction",
        prompt: "With an accumulator parameter, when is the final answer complete?",
        options: [
          "When the outermost call returns, after every frame has combined its part",
          "When the base case is reached — it returns the finished accumulator straight back",
          "Halfway down, once the accumulator stops changing",
          "Only if the accumulator is a mutable object shared between frames",
        ],
        answer: 1,
        explanation:
          "An accumulator carries the partial answer downward, so the deepest frame holds the complete result and simply returns it. Nothing is left to do on the way back up — which is what makes the shape tail-recursive.",
      },
      {
        id: "rec-q-slice-cost",
        prompt: {
          typescript:
            "Why is `sumList(values.slice(1))` a worse recursion than passing an index?",
          python: "Why is `sum_list(values[1:])` a worse recursion than passing an index?",
        },
        options: [
          "It has no base case",
          "It never makes progress, so it cannot terminate",
          "It copies the remaining elements on every call, making it O(n²)",
          "It mutates the caller's array",
        ],
        answer: 2,
        explanation:
          "The slice is a fresh copy of everything left, so n calls copy n, n-1, n-2 … elements. Passing an index shrinks the same problem without copying anything.",
      },
      {
        id: "rec-q-helper-closure",
        prompt: "What is the main reason to wrap a recursion in a public function with an inner helper?",
        options: [
          "It makes the recursion run faster by avoiding parameter passing",
          "It keeps implementation-only parameters like accumulators and depth counters out of the public signature",
          "It is the only way to write a recursive function that returns a list",
          "It removes the need for a base case",
        ],
        answer: 1,
        explanation:
          "The accumulator, index, depth and visited set are internal bookkeeping. Hiding them behind a one-argument public function stops callers from seeding them wrongly, and the inner function closes over the shared inputs for free.",
      },
    ],
  },
  {
    id: "rec-tail-position",
    module: "patterns",
    title: "Tail Position (and Why It Doesn't Help Here)",
    blurb: {
      typescript: "What a tail call is, why V8 doesn't eliminate it, and what to do instead.",
      python: "What a tail call is, why CPython doesn't eliminate it, and what to do instead.",
    },
    graphics: [
      {
        id: "tail-call",
        title: "Nothing left to do",
        caption:
          "A call is in tail position when its result is returned unchanged. Languages with tail-call elimination reuse the frame; TypeScript and Python do not.",
        src: "/lesson-graphics/recursion/rec-tail-position.png",
      },
    ],
    content: {
      typescript: `# Tail Position (and Why It Doesn't Help Here)

A call is in **tail position** when its result is returned *unchanged* — nothing happens after it comes back.

\`\`\`ts
return go(i + 1, acc + values[i]);  // tail position: the answer IS the answer
return values[i] + go(i + 1);       // NOT tail position: there's an addition left
\`\`\`

The distinction matters because the caller's frame in the first case has no remaining work. In a language with **tail-call elimination** (TCE), the compiler notices this and *reuses* the frame instead of pushing a new one — the recursion executes in constant stack space, exactly like a loop. Scheme, Lua, Erlang, Elixir and OCaml all do it, and idiomatic code in those languages relies on it.

## The bad news

**TypeScript and JavaScript do not do this in practice.** Proper tail calls were specified in ES6, but V8 (Chrome, Node, Edge) and SpiderMonkey (Firefox) never shipped them; only JavaScriptCore (Safari) implements the spec. TypeScript compiles \`return f(x)\` to \`return f(x)\`, so whatever your runtime does is what you get — and on Node that means a new frame every time.

So a tail-recursive loop over a million-element array will still throw \`RangeError: Maximum call stack size exceeded\`. The tail-call shape is free to write and costs nothing, but it does not buy you depth.

## Which means: convert it yourself

The valuable thing about tail position is that it makes the mechanical rewrite obvious. A tail recursion is a loop with the parameters as loop variables:

\`\`\`ts
// Tail-recursive
function sum(values: number[], i: number = 0, acc: number = 0): number {
  if (i === values.length) return acc;
  return sum(values, i + 1, acc + values[i]);
}

// The same thing, iterative — parameters become mutable locals,
// the recursive call becomes reassignment, the base case becomes the loop guard.
function sumLoop(values: number[]): number {
  let i = 0;
  let acc = 0;
  while (i !== values.length) {
    [i, acc] = [i + 1, acc + values[i]];
  }
  return acc;
}
\`\`\`

That transformation is always available for a tail recursion, and always mechanical. Non-tail recursions (like \`values[i] + go(i + 1)\`) don't convert this cleanly — the pending work is exactly what the stack was remembering for you, so removing the stack means building one yourself. That's the last lesson in this course.

## What to take away

- Write the tail-call shape when it's the natural one (accumulators usually are) — it's clearer, and it makes the iterative rewrite trivial.
- Don't *rely* on it for depth. In TypeScript, depth is depth.
- If a recursion is both linear and unbounded in depth, rewrite it as a loop before it reaches production, not after the first \`RangeError\` in your logs.`,
      python: `# Tail Position (and Why It Doesn't Help Here)

A call is in **tail position** when its result is returned *unchanged* — nothing happens after it comes back.

\`\`\`python
return go(i + 1, acc + values[i])   # tail position: the answer IS the answer
return values[i] + go(i + 1)        # NOT tail position: there's an addition left
\`\`\`

The distinction matters because the caller's frame in the first case has no remaining work. In a language with **tail-call elimination** (TCE), the compiler notices this and *reuses* the frame instead of pushing a new one — the recursion executes in constant stack space, exactly like a loop. Scheme, Lua, Erlang, Elixir and OCaml all do it, and idiomatic code in those languages relies on it.

## The bad news

**CPython does not do this, and it is a deliberate decision.** Guido van Rossum has written about rejecting TCE more than once; the stated reasons are that it destroys the tracebacks Python users depend on (the eliminated frames are gone, so the traceback lies about how you got there), and that Python's answer to "I need a loop" is to write a loop. No mainstream Python implementation eliminates tail calls.

So a tail-recursive walk over a 10,000-element list still raises \`RecursionError\` around the thousandth call. The tail-call shape is free to write and costs nothing, but it does not buy you depth.

## Which means: convert it yourself

The valuable thing about tail position is that it makes the mechanical rewrite obvious. A tail recursion is a loop with the parameters as loop variables:

\`\`\`python
# Tail-recursive
def total(values, i=0, acc=0):
    if i == len(values):
        return acc
    return total(values, i + 1, acc + values[i])

# The same thing, iterative — parameters become locals, the recursive call
# becomes reassignment, the base case becomes the loop guard.
def total_loop(values):
    i, acc = 0, 0
    while i != len(values):
        i, acc = i + 1, acc + values[i]
    return acc
\`\`\`

That transformation is always available for a tail recursion, and always mechanical. Non-tail recursions (like \`values[i] + go(i + 1)\`) don't convert this cleanly — the pending work is exactly what the stack was remembering for you, so removing the stack means building one yourself. That's the last lesson in this course.

## What to take away

- Write the tail-call shape when it's the natural one (accumulators usually are) — it's clearer, and it makes the iterative rewrite trivial.
- Don't *rely* on it for depth. In Python, depth is depth, and the limit is low.
- If a recursion is both linear and unbounded in depth, rewrite it as a loop before it reaches production, not after the first \`RecursionError\` in your logs.`,
    },
    exercises: [
      {
        id: "rec-tail-to-loop",
        title: "Turn a tail recursion into a loop",
        instructions: {
          typescript: `\`digitSum\` is written in the tail-call shape: the recursive call's result is returned unchanged. Convert it, mechanically, into \`digitSumLoop\`.

The recipe, in order:
1. Every parameter becomes a mutable local seeded with its default.
2. The base-case condition becomes the loop's exit condition.
3. The recursive call becomes reassignment of those locals.
4. The base case's return value becomes the value returned after the loop.

Don't re-derive the algorithm — apply the recipe.

**Expected output:** \`15\` then \`true\`.`,
          python: `\`digit_sum\` is written in the tail-call shape: the recursive call's result is returned unchanged. Convert it, mechanically, into \`digit_sum_loop\`.

The recipe, in order:
1. Every parameter becomes a local seeded with its default.
2. The base-case condition becomes the loop's exit condition.
3. The recursive call becomes reassignment of those locals.
4. The base case's return value becomes the value returned after the loop.

Don't re-derive the algorithm — apply the recipe.

**Expected output:** \`15\` then \`True\`.`,
        },
        starterCode: {
          typescript: `// Given: a tail-recursive digit sum. Don't change it.
function digitSum(n: number, acc: number = 0): number {
  if (n === 0) return acc;
  return digitSum(Math.floor(n / 10), acc + (n % 10));
}

function digitSumLoop(n: number): number {
  // TODO: locals for n and acc, a while loop guarded by the base-case condition,
  // reassignment in place of the recursive call, and return acc at the end.
  return 0;
}

console.log(digitSum(4821)); // expected: 15
console.log(digitSumLoop(4821) === digitSum(4821)); // expected: true`,
          python: `# Given: a tail-recursive digit sum. Don't change it.
def digit_sum(n, acc=0):
    if n == 0:
        return acc
    return digit_sum(n // 10, acc + n % 10)


def digit_sum_loop(n):
    # TODO: locals for n and acc, a while loop guarded by the base-case
    # condition, reassignment in place of the recursive call, return acc.
    return 0


print(digit_sum(4821))                          # expected: 15
print(digit_sum_loop(4821) == digit_sum(4821))  # expected: True
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-tail-position",
        prompt: {
          typescript: "Which return statement is in tail position?",
          python: "Which return statement is in tail position?",
        },
        options: {
          typescript: [
            "`return n * factorial(n - 1);`",
            "`return go(i + 1, acc + values[i]);`",
            "`return helper(node.left) + helper(node.right);`",
            "`return [...walk(node.left), node.val];`",
          ],
          python: [
            "`return n * factorial(n - 1)`",
            "`return go(i + 1, acc + values[i])`",
            "`return helper(node.left) + helper(node.right)`",
            "`return walk(node.left) + [node.val]`",
          ],
        },
        answer: 1,
        explanation:
          "Tail position means the call's result is returned unchanged. The other three all have pending work after the call returns — a multiplication, an addition, a list build — so their frames must stay alive.",
      },
      {
        id: "rec-q-no-tce",
        prompt: {
          typescript:
            "You rewrite a deep recursion into tail-call form and run it on Node. What happens to the stack usage?",
          python:
            "You rewrite a deep recursion into tail-call form and run it on CPython. What happens to the stack usage?",
        },
        options: [
          "It becomes constant — the runtime reuses the frame",
          "It is unchanged: the frames are still pushed, so the depth limit still applies",
          "It halves, because tail frames are smaller",
          "It grows, because the accumulator is copied into each frame",
        ],
        answer: 1,
        explanation: {
          typescript:
            "Proper tail calls are in the ES6 spec, but V8 never shipped them (only JavaScriptCore did). The tail shape costs nothing and clarifies the code, but on Node it buys no depth at all.",
          python:
            "CPython deliberately does not eliminate tail calls — partly to keep tracebacks honest. The tail shape costs nothing and clarifies the code, but it buys no depth at all.",
        },
      },
      {
        id: "rec-q-tail-rewrite",
        prompt: "What is the practical value of writing a recursion in tail-call form?",
        options: [
          "The compiler removes the recursion automatically",
          "It guarantees the function is pure",
          "The conversion to an ordinary loop becomes mechanical: parameters become locals, the call becomes reassignment",
          "It makes the base case unnecessary",
        ],
        answer: 2,
        explanation:
          "With nothing pending after the call, each frame carries no information the loop wouldn't hold in locals. That's exactly why the rewrite is mechanical — and why non-tail recursions need an explicit stack instead.",
      },
    ],
  },
  {
    id: "rec-depth-limits",
    module: "patterns",
    title: "How Deep Can You Go?",
    blurb: {
      typescript: "Stack size, RangeError, and designing recursion around a depth budget.",
      python: "The recursion limit, RecursionError, and designing recursion around a depth budget.",
    },
    graphics: [
      {
        id: "depth-limit",
        title: "The stack has a ceiling",
        caption:
          "Depth, not total call count, is what overflows. A million-node balanced tree is 20 frames deep; a thousand-node linked list is a thousand.",
        src: "/lesson-graphics/recursion/rec-depth-limits.png",
      },
    ],
    content: {
      typescript: `# How Deep Can You Go?

The stack is a fixed-size region of memory. Push enough frames and you run out — the failure is abrupt, and it happens at the *deepest* point of your recursion regardless of how much total work you did.

\`\`\`
RangeError: Maximum call stack size exceeded
\`\`\`

## Depth, not call count

This is the distinction that decides whether a recursion is safe:

- **Total calls** can be enormous with no risk. Walking a balanced binary tree of a million nodes makes a million calls but is only ~20 frames deep at any moment, because each finishes before the next sibling starts.
- **Depth** is what kills you. A thousand-node *linked list* walked recursively is a thousand frames deep, all alive at once.

So the question is never "how big is the input?" — it's "how long is the longest path from the first call to the deepest one?".

## What the ceiling actually is

On V8 the limit is roughly 10,000–15,000 frames for a simple function, but it is **not a fixed number of calls** — it's a fixed number of *bytes*. A function with many parameters and locals uses a bigger frame, so it overflows sooner. Node lets you raise it with \`--stack-size\`, which is a footgun: set it above what the OS thread actually reserved and you get a hard segfault instead of a catchable error.

\`RangeError\` *is* catchable, which tempts people into "try recursive, fall back to iterative". Resist it: by the time it throws you may be halfway through mutating something, and the error can surface in whatever unlucky call happened to be the last straw.

## Designing within the budget

**Prefer log-depth or bounded-depth recursion.** Divide and conquer (\`log n\`), balanced trees (\`log n\`), a JSON document (nesting depth, usually < 100) are all fine forever.

**Watch for degenerate shapes.** A *balanced* BST is \`log n\` deep; the same BST built from sorted input is a linked list wearing a tree costume, and \`n\` deep. The recursion that was safe in testing overflows in production because the real data arrived sorted.

**Never recurse to unbounded depth on untrusted input.** A recursive-descent JSON parser is the classic case: \`[[[[[[…]]]]]]\` from a request body is a stack overflow with a one-line payload. Either cap the depth explicitly and reject, or use an explicit stack.

\`\`\`ts
function parseValue(input: string, depth: number = 0): unknown {
  if (depth > 200) throw new Error("input nested too deeply");
  // …recurse with depth + 1
  return null;
}
\`\`\`

An explicit depth guard turns an uncatchable-ish crash into an ordinary validation error, and it documents your assumption. That guard costs one comparison per call.

## When you actually need the depth

Rewrite the recursion with an explicit stack on the heap (the last lesson of this course). The heap is orders of magnitude larger than the stack, so an explicit stack of a million entries is unremarkable — the same million frames is not.`,
      python: `# How Deep Can You Go?

CPython puts a hard ceiling on recursion depth, and it is *low*:

\`\`\`python
import sys
sys.getrecursionlimit()   # 1000 by default
\`\`\`

Exceed it and you get \`RecursionError: maximum recursion depth exceeded\`. Note the number counts *frames*, not just your function's — the limit is shared with everything above you on the stack, so you effectively get a bit fewer than 1000.

## Depth, not call count

This is the distinction that decides whether a recursion is safe:

- **Total calls** can be enormous with no risk. Walking a balanced binary tree of a million nodes makes a million calls but is only ~20 frames deep at any moment, because each finishes before the next sibling starts.
- **Depth** is what kills you. A 2,000-node *linked list* walked recursively is 2,000 frames deep, all alive at once — and that dies at 1,000.

So the question is never "how big is the input?" — it's "how long is the longest path from the first call to the deepest one?".

## Raising the limit is not the fix

\`\`\`python
sys.setrecursionlimit(100_000)   # dangerous
\`\`\`

The limit is a guard rail CPython uses to raise a clean Python exception *before* the real C stack runs out. Raise it far enough and you sail past the guard rail into a genuine C stack overflow, which is a **segfault** — no traceback, no \`except\`, process gone. A modest bump (say to 3,000–5,000) with a known-bounded input is defensible; \`sys.setrecursionlimit(10**6)\` is not.

\`RecursionError\` is catchable — it's an ordinary exception — but catching it is a poor design: by the time it fires you may be halfway through mutating something, and it surfaces in whatever unlucky call happened to be the last straw.

## Designing within the budget

**Prefer log-depth or bounded-depth recursion.** Divide and conquer (\`log n\`), balanced trees (\`log n\`), a JSON document (nesting depth, usually < 100) are all fine forever.

**Watch for degenerate shapes.** A *balanced* BST is \`log n\` deep; the same BST built from sorted input is a linked list wearing a tree costume, and \`n\` deep. The recursion that was safe in testing raises in production because the real data arrived sorted.

**Never recurse to unbounded depth on untrusted input.** \`json.loads\` on \`[[[[[[…]]]]]]\` raises \`RecursionError\` from a tiny payload for exactly this reason. Cap the depth explicitly and reject:

\`\`\`python
def parse_value(text, depth=0):
    if depth > 200:
        raise ValueError("input nested too deeply")
    # …recurse with depth + 1
    return None
\`\`\`

A depth guard turns a resource failure into an ordinary validation error, and it documents your assumption. It costs one comparison per call.

## When you actually need the depth

Rewrite the recursion with an explicit stack — a plain \`list\` on the heap (the last lesson of this course). The heap is bounded by memory, not by a 1000-frame limit, so an explicit stack of a million entries is unremarkable.`,
    },
    exercises: [
      {
        id: "rec-depth-budget",
        title: "Measure the ceiling, then guard it",
        instructions: {
          typescript: `Two small pieces:

- \`maxDepth()\` — recurse until the runtime throws, catch the \`RangeError\`, and return the depth reached. Increment a counter on the way down; wrap the *first* call in \`try\`/\`catch\`.
- \`nestedDepth(value, depth)\` — return the nesting depth of an array-of-arrays, but throw \`new Error("too deep")\` once \`depth\` exceeds \`limit\`. \`[]\` is depth 1; \`[[1]]\` is depth 2.

The point of the first is that the number is large but finite, and shifts run to run. The point of the second is that a guard is one comparison.

**Expected output:** a depth in the thousands, then \`3\`, then \`too deep\`.`,
          python: `Two small pieces:

- \`max_depth()\` — recurse until CPython raises, catch the \`RecursionError\`, and return the depth reached. Increment a counter on the way down; wrap the *first* call in \`try\`/\`except\`.
- \`nested_depth(value, depth)\` — return the nesting depth of a list-of-lists, but raise \`ValueError("too deep")\` once \`depth\` exceeds \`limit\`. \`[]\` is depth 1; \`[[1]]\` is depth 2.

The point of the first is that the number is close to \`sys.getrecursionlimit()\`, not equal to it. The point of the second is that a guard is one comparison.

**Expected output:** a depth just under 1000, then \`3\`, then \`too deep\`.`,
        },
        starterCode: {
          typescript: `function maxDepth(): number {
  let depth = 0;
  function down(): void {
    depth++;
    // TODO: recurse — call down() again. Nothing else needed here.
  }
  try {
    down();
  } catch {
    // RangeError: the stack is full.
  }
  return depth;
}

const limit = 4;

function nestedDepth(value: unknown, depth: number = 1): number {
  if (depth > limit) throw new Error("too deep");
  // TODO: if value is not an array, this level contributes nothing — return depth - 1.
  // TODO: otherwise return the max of nestedDepth(child, depth + 1) over the
  // children, or depth itself when the array is empty.
  return depth;
}

console.log(maxDepth());
console.log(nestedDepth([1, [2, [3]]])); // expected: 3
try {
  nestedDepth([[[[1]]]]);
} catch (err) {
  console.log((err as Error).message); // expected: too deep
}`,
          python: `def max_depth():
    depth = 0

    def down():
        nonlocal depth
        depth += 1
        # TODO: recurse — call down() again. Nothing else needed here.

    try:
        down()
    except RecursionError:
        pass  # the interpreter stopped us
    return depth


LIMIT = 4


def nested_depth(value, depth=1):
    if depth > LIMIT:
        raise ValueError("too deep")
    # TODO: if value is not a list, this level contributes nothing:
    #       return depth - 1.
    # TODO: otherwise return the max of nested_depth(child, depth + 1) over the
    #       children, or depth when the list is empty.
    return depth


print(max_depth())
print(nested_depth([1, [2, [3]]]))  # expected: 3
try:
    nested_depth([[[[1]]]])
except ValueError as err:
    print(err)  # expected: too deep
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-depth-vs-calls",
        prompt:
          "Which recursive walk is at risk of overflowing the stack: a balanced binary tree of 1,000,000 nodes, or a linked list of 5,000 nodes?",
        options: [
          "The linked list — depth is what matters, and it is 5,000 frames deep",
          "The tree — a million calls is far more work",
          "Neither: both finish within the limit",
          "Both equally: total call count is what the limit counts",
        ],
        answer: 0,
        explanation:
          "The limit counts frames alive at once, not calls made. The balanced tree is about 20 frames deep at any moment; the list keeps all 5,000 frames alive simultaneously.",
      },
      {
        id: "rec-q-raise-limit",
        prompt: {
          typescript: "What is the risk of raising Node's stack size with `--stack-size`?",
          python: "What is the risk of calling `sys.setrecursionlimit(10**6)`?",
        },
        options: {
          typescript: [
            "It silently disables recursion entirely",
            "Set above what the thread actually reserved, the process segfaults instead of throwing a catchable RangeError",
            "It slows every function call down by a constant factor",
            "It applies only to arrow functions",
          ],
          python: [
            "It silently disables recursion entirely",
            "Past the guard rail the C stack really does run out, and the process segfaults instead of raising a catchable RecursionError",
            "It slows every function call down by a constant factor",
            "It applies only to functions defined at module level",
          ],
        },
        answer: 1,
        explanation: {
          typescript:
            "The limit exists so the engine fails cleanly before the OS-level stack is exhausted. Push it past the real reservation and you lose the clean failure — and get an uncatchable crash.",
          python:
            "The recursion limit is a guard rail that lets CPython raise a normal exception before the real C stack is exhausted. Raise it far enough and you get a segfault: no traceback, nothing to catch.",
        },
      },
      {
        id: "rec-q-untrusted-depth",
        prompt: "You are parsing untrusted JSON with a recursive-descent parser. What is the right defense?",
        options: [
          "Catch the stack-overflow error and retry",
          "Raise the stack limit as high as the platform allows",
          "Pass a depth counter and reject input past an explicit maximum",
          "Nothing — deeply nested input is not a realistic attack",
        ],
        answer: 2,
        explanation:
          "A one-line payload of nested brackets can exhaust the stack. A depth parameter checked against a documented maximum turns that into an ordinary validation error, at the cost of one comparison per call.",
      },
    ],
  },
];
