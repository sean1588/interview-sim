import type { Lesson } from "../types";

export const foundationsLessons: Lesson[] = [
  {
    id: "rec-call-stack",
    module: "foundations",
    title: "What a Recursive Call Actually Does",
    blurb: {
      typescript: "Frames, the call stack, and the two halves of every recursive call.",
      python: "Frames, the call stack, and the two halves of every recursive call.",
    },
    graphics: [
      {
        id: "call-stack",
        title: "One frame per call",
        caption:
          "A recursive call is an ordinary call: a new frame goes on the stack with its own copy of the parameters. The stack grows on the way down and unwinds on the way back up.",
        src: "/lesson-graphics/recursion/rec-call-stack.png",
      },
    ],
    content: {
      typescript: `# What a Recursive Call Actually Does

Recursion has a reputation for being magic. It isn't. A function calling itself is the *same* mechanism as a function calling anything else — the only thing that makes it feel strange is that several calls to the same function are alive at once, each with its own private copy of the parameters.

## The frame is the whole idea

Every call — recursive or not — pushes a **stack frame**: a small block of memory holding that call's arguments, its local variables, and the address to return to when it finishes. The frames stack up; the innermost call is on top.

\`\`\`ts
function countdown(n: number): void {
  console.log("down", n);       // happens on the way DOWN
  if (n === 0) return;          // base case: stop growing the stack
  countdown(n - 1);
  console.log("up", n);         // happens on the way BACK UP
}

countdown(3);
// down 3, down 2, down 1, down 0, up 1, up 2, up 3
\`\`\`

There are **four** frames alive at the deepest point, and four different \`n\` values in memory simultaneously — \`3\`, \`2\`, \`1\`, \`0\`. They don't overwrite each other, because each frame has its own \`n\`. This is the single most useful mental correction for anyone who finds recursion slippery: \`n\` isn't one variable changing, it's four variables coexisting.

## Every call has two halves

Look at where the two \`console.log\`s land. Everything *before* the recursive call runs top-down, outermost first. Everything *after* it runs bottom-up, innermost first — as the stack unwinds. That's not a trick; it's just what "the rest of the function continues after the call returns" means.

So when you write a recursion, ask which half your work belongs in:

- **Pre-order work** (before the call) sees the problem on the way in — printing a directory name before its contents, choosing a move before exploring it.
- **Post-order work** (after the call) sees the *answers* from below — summing a subtree, computing a height, freeing a resource.

Almost every "how do I do X recursively?" question is really "does X happen on the way down or on the way up?".

## Where it comes back to

When \`countdown(0)\` hits \`return\`, its frame is popped and control resumes in \`countdown(1)\` on the line *after* the call. There's no jump back to the top. Each return hands a value (or nothing) to exactly one waiting frame, which then continues.

Compare it to a loop: a loop reuses one frame and one set of variables, so there is nothing to unwind — which is exactly why a loop can't naturally do "on the way back up" work without you building a stack yourself.

## Reading a recursion by hand

The tracing technique that actually works: write one indented line per call, listing the arguments. Indentation *is* stack depth. Add the returned value at the end of each line as you unwind. Four levels of that is usually enough to see the shape, and it is far more reliable than trying to hold six frames in your head.`,
      python: `# What a Recursive Call Actually Does

Recursion has a reputation for being magic. It isn't. A function calling itself is the *same* mechanism as a function calling anything else — the only thing that makes it feel strange is that several calls to the same function are alive at once, each with its own private copy of the parameters.

## The frame is the whole idea

Every call — recursive or not — pushes a **stack frame**: a small block of memory holding that call's arguments, its local variables, and where to resume when it finishes. In CPython the frame is a real object you can inspect (that's what every line of a traceback is: one frame). The frames stack up; the innermost call is on top.

\`\`\`python
def countdown(n):
    print("down", n)       # happens on the way DOWN
    if n == 0:
        return             # base case: stop growing the stack
    countdown(n - 1)
    print("up", n)         # happens on the way BACK UP


countdown(3)
# down 3, down 2, down 1, down 0, up 1, up 2, up 3
\`\`\`

There are **four** frames alive at the deepest point, and four different \`n\` values in memory simultaneously — \`3\`, \`2\`, \`1\`, \`0\`. They don't overwrite each other, because each frame has its own \`n\`. This is the single most useful mental correction for anyone who finds recursion slippery: \`n\` isn't one variable changing, it's four variables coexisting.

## Every call has two halves

Look at where the two \`print\`s land. Everything *before* the recursive call runs top-down, outermost first. Everything *after* it runs bottom-up, innermost first — as the stack unwinds. That's not a trick; it's just what "the rest of the function continues after the call returns" means.

So when you write a recursion, ask which half your work belongs in:

- **Pre-order work** (before the call) sees the problem on the way in — printing a directory name before its contents, choosing a move before exploring it.
- **Post-order work** (after the call) sees the *answers* from below — summing a subtree, computing a height, closing a resource.

Almost every "how do I do X recursively?" question is really "does X happen on the way down or on the way up?".

## Where it comes back to

When \`countdown(0)\` returns, its frame is popped and control resumes inside \`countdown(1)\` on the line *after* the call. There's no jump back to the top. Each return hands a value (\`None\` if you didn't say otherwise) to exactly one waiting frame, which then continues.

A Python traceback is this stack printed bottom-up. A runaway recursion prints the same line hundreds of times precisely because hundreds of frames of the same function are genuinely on the stack.

Compare it to a loop: a loop reuses one frame and one set of variables, so there is nothing to unwind — which is exactly why a loop can't naturally do "on the way back up" work without you building a stack yourself.

## Reading a recursion by hand

The tracing technique that actually works: write one indented line per call, listing the arguments. Indentation *is* stack depth. Add the returned value at the end of each line as you unwind. Four levels of that is usually enough to see the shape, and it beats trying to hold six frames in your head.`,
    },
    exercises: [
      {
        id: "rec-countdown-trace",
        title: "See the stack grow and unwind",
        instructions: {
          typescript: `\`countdown\` currently prints only on the way down. Finish it so it prints on the way back up too, and so the indentation shows the stack depth.

- Print \`"  ".repeat(depth) + "down " + n\` **before** recursing (already there).
- Stop recursing when \`n\` reaches 0 — that's the base case.
- Otherwise call \`countdown(n - 1, depth + 1)\`, then print \`"  ".repeat(depth) + "up " + n\` **after** the call returns.

**Expected output:** \`down 3\`, \`down 2\`, \`down 1\`, \`down 0\` (each indented one more), then \`up 1\`, \`up 2\`, \`up 3\` unwinding back out.`,
          python: `\`countdown\` currently prints only on the way down. Finish it so it prints on the way back up too, and so the indentation shows the stack depth.

- Print \`"  " * depth + "down " + str(n)\` **before** recursing (already there).
- Stop recursing when \`n\` reaches 0 — that's the base case.
- Otherwise call \`countdown(n - 1, depth + 1)\`, then print \`"  " * depth + "up " + str(n)\` **after** the call returns.

**Expected output:** \`down 3\`, \`down 2\`, \`down 1\`, \`down 0\` (each indented one more), then \`up 1\`, \`up 2\`, \`up 3\` unwinding back out.`,
        },
        starterCode: {
          typescript: `function countdown(n: number, depth: number = 0): void {
  console.log("  ".repeat(depth) + "down " + n);
  // TODO: stop here when n is 0 (the base case).
  // TODO: otherwise recurse on n - 1 with depth + 1, and AFTER that call
  // returns, print "  ".repeat(depth) + "up " + n.
}

countdown(3);`,
          python: `def countdown(n, depth=0):
    print("  " * depth + "down " + str(n))
    # TODO: stop here when n is 0 (the base case).
    # TODO: otherwise recurse on n - 1 with depth + 1, and AFTER that call
    # returns, print "  " * depth + "up " + str(n).


countdown(3)
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-frame-contents",
        prompt: "At the deepest point of `countdown(3)`, how many values of `n` exist in memory?",
        options: [
          "One — `n` is reassigned on each call",
          "Four — every live frame has its own `n`",
          "Two — the current value and the previous one",
          "None — the parameter is optimized away once the base case is reached",
        ],
        answer: 1,
        explanation:
          "Each call pushes its own frame with its own copy of the parameters. With calls for n = 3, 2, 1 and 0 all still on the stack, four distinct `n` values are alive at once — nothing is being overwritten.",
      },
      {
        id: "rec-q-unwind-order",
        prompt: {
          typescript:
            "A recursive function prints `n` *after* its recursive call. Called with 3, in what order do the numbers print?",
          python:
            "A recursive function prints `n` *after* its recursive call. Called with 3, in what order do the numbers print?",
        },
        options: ["3, 2, 1", "3, 3, 3", "1, 1, 1", "1, 2, 3"],
        answer: 3,
        explanation:
          "Work placed after the recursive call runs as the stack unwinds — innermost frame first. The deepest call (n = 1) finishes first, so the numbers come back out in increasing order.",
      },
      {
        id: "rec-q-return-target",
        prompt: "When the base-case call returns, where does execution resume?",
        options: [
          "In the frame that called it, on the line after the recursive call",
          "At the top of the original outermost call",
          "At the top of the function body again, with the base-case arguments",
          "Nowhere — the whole recursion ends immediately",
        ],
        answer: 0,
        explanation:
          "A return pops exactly one frame and hands control back to its caller, immediately after the call expression. That's why post-call work runs once per frame, innermost first, rather than restarting anything.",
      },
    ],
  },
  {
    id: "rec-base-case",
    module: "foundations",
    title: "Base Case and Recursive Case",
    blurb: {
      typescript: "The two-part shape every recursion has, and what makes it terminate.",
      python: "The two-part shape every recursion has, and what makes it terminate.",
    },
    graphics: [
      {
        id: "base-case",
        title: "Shrink until you stop",
        caption:
          "Every recursion is a base case that returns an answer directly plus a recursive case that makes the input strictly smaller. Break either half and the recursion never terminates.",
        src: "/lesson-graphics/recursion/rec-base-case.png",
      },
    ],
    content: {
      typescript: `# Base Case and Recursive Case

Every correct recursion is exactly two things:

1. A **base case** — an input small enough to answer outright, with no further calls.
2. A **recursive case** — an answer expressed in terms of the *same function* on a **strictly smaller** input.

If both hold, the recursion terminates, because you can only shrink a finite input so many times before you land on a base case. That's the whole termination argument, and it's worth stating out loud every time you write one.

\`\`\`ts
function sumTo(n: number): number {
  if (n <= 0) return 0;        // base case
  return n + sumTo(n - 1);     // recursive case: strictly smaller
}
\`\`\`

## The leap of faith

The thing that makes recursion hard to *write* is that you have to stop tracing. When you write \`n + sumTo(n - 1)\`, do **not** try to unfold what \`sumTo(n - 1)\` does — assume it already works and returns the sum of \`1..n-1\`. Your only jobs are: the base case is right, and the recursive case combines the smaller answer correctly.

This is induction wearing a different hat. Base case = the \`n = 0\` proof; recursive case = "if it works for \`n - 1\`, it works for \`n\`".

## The three ways it goes wrong

**No base case.** The obvious one: nothing ever stops.

**An unreachable base case.** Far more common, and much nastier — the base case exists but the recursion steps past it:

\`\`\`ts
function countdown(n: number): void {
  if (n === 0) return;   // never fires for 3.5, or for -1
  countdown(n - 2);
}
countdown(3);            // 3, 1, -1, -3, … RangeError
\`\`\`

Use \`<=\` rather than \`===\` when the step can overshoot. A base case guarding the boundary you actually cross is worth more than one guarding the value you hoped to land on.

**No progress.** \`solve(n)\` calling \`solve(n)\` — or, subtly, calling \`solve(items)\` with the same array because you filtered and got the same length back. Every recursive call must be on something *measurably* smaller: a smaller number, a shorter list, a subtree, one fewer choice remaining.

## Structural base cases

For numbers the base case is a threshold. For data structures it's usually the empty case, and it's often *simpler* than the number version:

\`\`\`ts
// Base case: an empty list has nothing to sum.
function sumList(values: number[]): number {
  if (values.length === 0) return 0;
  return values[0] + sumList(values.slice(1));
}
\`\`\`

For a tree it's \`node === null\`; for a graph it's "already visited"; for a string it's the empty string. Reaching for the empty case first — instead of "the last element" — kills a whole class of off-by-one bugs, because empty is unambiguous and one-element is not.

## More than one base case

Nothing says you get only one. Fibonacci needs two, because its recursive case reaches back two steps and would otherwise step over a single base case:

\`\`\`ts
function fib(n: number): number {
  if (n === 0) return 0;
  if (n === 1) return 1;
  return fib(n - 1) + fib(n - 2);
}
\`\`\`

Rule of thumb: you need as many base cases as the furthest step your recursive case takes. (This \`fib\` is also exponentially slow — recursion's most famous performance trap, which the memoization lesson later in this course fixes.)`,
      python: `# Base Case and Recursive Case

Every correct recursion is exactly two things:

1. A **base case** — an input small enough to answer outright, with no further calls.
2. A **recursive case** — an answer expressed in terms of the *same function* on a **strictly smaller** input.

If both hold, the recursion terminates, because you can only shrink a finite input so many times before you land on a base case. That's the whole termination argument, and it's worth stating out loud every time you write one.

\`\`\`python
def sum_to(n):
    if n <= 0:
        return 0             # base case
    return n + sum_to(n - 1)  # recursive case: strictly smaller
\`\`\`

## The leap of faith

The thing that makes recursion hard to *write* is that you have to stop tracing. When you write \`n + sum_to(n - 1)\`, do **not** try to unfold what \`sum_to(n - 1)\` does — assume it already works and returns the sum of \`1..n-1\`. Your only jobs are: the base case is right, and the recursive case combines the smaller answer correctly.

This is induction wearing a different hat. Base case = the \`n = 0\` proof; recursive case = "if it works for \`n - 1\`, it works for \`n\`".

## The three ways it goes wrong

**No base case.** The obvious one: nothing ever stops.

**An unreachable base case.** Far more common, and much nastier — the base case exists but the recursion steps past it:

\`\`\`python
def countdown(n):
    if n == 0:      # never fires for 3.5, or for -1
        return
    countdown(n - 2)

countdown(3)        # 3, 1, -1, -3, … RecursionError
\`\`\`

Use \`<=\` rather than \`==\` when the step can overshoot. A base case guarding the boundary you actually cross is worth more than one guarding the value you hoped to land on.

**No progress.** \`solve(n)\` calling \`solve(n)\` — or, subtly, calling \`solve(items)\` with the same list because you filtered and got the same length back. Every recursive call must be on something *measurably* smaller: a smaller number, a shorter list, a subtree, one fewer choice remaining.

## Structural base cases

For numbers the base case is a threshold. For data structures it's usually the empty case, and it's often *simpler* than the number version:

\`\`\`python
def sum_list(values):
    if not values:            # base case: empty list sums to 0
        return 0
    return values[0] + sum_list(values[1:])
\`\`\`

For a tree it's \`node is None\`; for a graph it's "already visited"; for a string it's \`""\`. Reaching for the empty case first — instead of "the last element" — kills a whole class of off-by-one bugs, because empty is unambiguous and one-element is not.

Note that \`values[1:]\` **copies** the rest of the list on every call, so this particular version is O(n²) in time and space. Idiomatic Python passes an index instead — a detail the accumulator lesson comes back to.

## More than one base case

Nothing says you get only one. Fibonacci needs two, because its recursive case reaches back two steps and would otherwise step over a single base case:

\`\`\`python
def fib(n):
    if n == 0:
        return 0
    if n == 1:
        return 1
    return fib(n - 1) + fib(n - 2)
\`\`\`

Rule of thumb: you need as many base cases as the furthest step your recursive case takes. (This \`fib\` is also exponentially slow — recursion's most famous performance trap, which the memoization lesson later in this course fixes.)`,
    },
    exercises: [
      {
        id: "rec-sum-to-n",
        title: "Your first two-part recursion",
        instructions: {
          typescript: `Write \`sumTo(n)\`, which returns \`1 + 2 + ... + n\` recursively (no loops).

- Base case: \`n <= 0\` returns 0. Use \`<=\`, not \`===\` — it has to hold for a negative input too.
- Recursive case: \`n\` plus the sum up to \`n - 1\`. Trust that call to be correct; don't trace it.

**Expected output:** \`15\` then \`0\`.`,
          python: `Write \`sum_to(n)\`, which returns \`1 + 2 + ... + n\` recursively (no loops).

- Base case: \`n <= 0\` returns 0. Use \`<=\`, not \`==\` — it has to hold for a negative input too.
- Recursive case: \`n\` plus the sum up to \`n - 1\`. Trust that call to be correct; don't trace it.

**Expected output:** \`15\` then \`0\`.`,
        },
        starterCode: {
          typescript: `function sumTo(n: number): number {
  // TODO: base case — return 0 when n has reached (or passed) 0.
  // TODO: recursive case — return n + sumTo(n - 1).
  return 0;
}

console.log(sumTo(5)); // expected: 15
console.log(sumTo(-3)); // expected: 0`,
          python: `def sum_to(n):
    # TODO: base case — return 0 when n has reached (or passed) 0.
    # TODO: recursive case — return n plus sum_to(n - 1).
    return 0


print(sum_to(5))   # expected: 15
print(sum_to(-3))  # expected: 0
`,
        },
      },
      {
        id: "rec-fix-the-base-case",
        title: "Fix a base case that never fires",
        instructions: {
          typescript: `\`countDigits(n)\` should return how many digits a non-negative integer has (\`0\` has one digit, \`4821\` has four).

The scaffold's base case is wrong in the classic way: it stops at \`n === 0\`, but the recursive step \`Math.floor(n / 10)\` reaches 0 *before* the last digit has been counted — and for the input 0 itself it would count zero digits.

Fix the base case (a single-digit number is one digit) and add the recursive case.

**Expected output:** \`4\`, \`1\`, \`1\`.`,
          python: `\`count_digits(n)\` should return how many digits a non-negative integer has (\`0\` has one digit, \`4821\` has four).

The scaffold's base case is wrong in the classic way: it stops at \`n == 0\`, but the recursive step \`n // 10\` reaches 0 *before* the last digit has been counted — and for the input 0 itself it would count zero digits.

Fix the base case (a single-digit number is one digit) and add the recursive case.

**Expected output:** \`4\`, \`1\`, \`1\`.`,
        },
        starterCode: {
          typescript: `function countDigits(n: number): number {
  if (n === 0) return 0; // TODO: wrong base case — fix it.
  // TODO: recursive case — one digit here, plus the digits of Math.floor(n / 10).
  return 0;
}

console.log(countDigits(4821)); // expected: 4
console.log(countDigits(7)); // expected: 1
console.log(countDigits(0)); // expected: 1`,
          python: `def count_digits(n):
    if n == 0:
        return 0  # TODO: wrong base case — fix it.
    # TODO: recursive case — one digit here, plus the digits of n // 10.
    return 0


print(count_digits(4821))  # expected: 4
print(count_digits(7))     # expected: 1
print(count_digits(0))     # expected: 1
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-unreachable-base",
        prompt: {
          typescript:
            "`if (n === 0) return;` followed by `countdown(n - 2)`, called with 3. What happens?",
          python: "`if n == 0: return` followed by `countdown(n - 2)`, called with 3. What happens?",
        },
        options: [
          "It returns immediately — 3 is not 0",
          "It stops at 1, the closest value to the base case",
          "It runs forever until the stack overflows — the values 3, 1, -1, -3 step past 0",
          "It raises a type error on the negative input",
        ],
        answer: 2,
        explanation:
          "The base case exists but is unreachable: stepping by 2 from an odd number never lands exactly on 0. Guarding the boundary you cross (`n <= 0`) rather than the value you hoped to hit is what fixes it.",
      },
      {
        id: "rec-q-progress",
        prompt: "Which requirement makes a recursion terminate?",
        options: [
          "Every recursive call is made on a strictly smaller input",
          "The function returns a value rather than printing",
          "The recursive call is the last statement in the function",
          "The base case appears at the top of the function body",
        ],
        answer: 0,
        explanation:
          "A base case alone proves nothing if the recursion never reaches it. Termination needs measurable progress — a smaller number, a shorter list, a subtree — so that finitely many steps land on the base case.",
      },
      {
        id: "rec-q-two-base-cases",
        prompt: "Why does the naive `fib` need two base cases rather than one?",
        options: [
          "Because it returns two values",
          "Because 0 and 1 are both falsy and need separate handling",
          "Because it is exponential and one base case would make it worse",
          "Because its recursive case reaches back two steps, so a single base case could be stepped over",
        ],
        answer: 3,
        explanation:
          "You need as many base cases as the furthest step the recursive case takes. `fib(n - 2)` from `n = 1` would ask for `fib(-1)`, so both 0 and 1 must terminate directly.",
      },
    ],
  },
  {
    id: "rec-vs-iteration",
    module: "foundations",
    title: "Recursion or a Loop?",
    blurb: {
      typescript: "When recursion earns its keep, and when you should just write the loop.",
      python: "When recursion earns its keep, and when you should just write the loop.",
    },
    graphics: [
      {
        id: "recursion-vs-loop",
        title: "Flat data, nested data",
        caption:
          "Loops fit flat sequences; recursion fits data whose shape is defined in terms of itself. Matching the code's shape to the data's shape is the whole decision.",
        src: "/lesson-graphics/recursion/rec-vs-iteration.png",
      },
    ],
    content: {
      typescript: `# Recursion or a Loop?

Anything you can write recursively you can write iteratively, and vice versa — they're equivalent in power. So the choice is never about what's *possible*; it's about which one makes the code shorter to read and harder to get wrong.

## The rule that actually decides it

**Match the code's shape to the data's shape.**

A flat sequence — an array, a string, a range of numbers — is defined by "next, next, next". That's a loop. Writing \`sumTo(1000000)\` recursively is a party trick that also happens to blow the stack.

A structure defined *in terms of itself* — a tree whose children are trees, JSON whose values may be objects of values, a directory containing directories — is recursive by definition. Iterating it means building your own stack and hand-rolling the unwind logic that the language would have given you for free.

\`\`\`ts
// Flat: the loop is obviously right.
let total = 0;
for (const value of [1, 2, 3, 4]) total += value;

// Nested: the recursion is obviously right.
function deepSum(values: unknown[]): number {
  let sum = 0;
  for (const v of values) {
    sum += Array.isArray(v) ? deepSum(v) : (v as number);
  }
  return sum;
}
\`\`\`

Notice that the recursive version still contains a loop. Real recursive code is usually *both*: loop across the children at this level, recurse into each one. "Recursive vs iterative" is rarely all-or-nothing.

## What recursion costs

- **Frames.** Each level is a stack frame — memory, plus the push/pop work. A loop reuses one frame. For a tight numeric loop that overhead is genuinely measurable.
- **Depth limits.** Frames are finite. Recursion depth proportional to \`n\` breaks on large inputs; depth proportional to \`log n\`, or to the height of a balanced tree, does not. (Both languages hit this differently — that's the depth-limits lesson.)
- **Debuggability.** A stack trace with 400 identical frames is harder to read than a loop you can breakpoint once.

## What recursion buys

- **The unwind is free.** Post-order work — "combine the answers from below" — is one line in a recursion and a hand-rolled state machine in a loop.
- **The base case is explicit.** The empty case is written down as its own branch instead of hiding inside a loop condition.
- **It matches the definition.** When the spec says "a directory's size is the sum of its entries' sizes", the recursion *is* the spec, and the reviewer can check it against the sentence.

## A rule of thumb worth memorizing

Recurse on **branching or nesting**, loop on **sequence**. If each step has exactly one successor, a loop is at least as clear and never overflows. If a step has several successors — two children, N neighbors, K choices — recursion is almost always the right call, because you'd otherwise be simulating a stack.

And when the recursion is linear *and* deep (walking a million-node linked list), you get the worst of both: no branching to justify the frames, and enough depth to overflow. Rewrite it as a loop.`,
      python: `# Recursion or a Loop?

Anything you can write recursively you can write iteratively, and vice versa — they're equivalent in power. So the choice is never about what's *possible*; it's about which one makes the code shorter to read and harder to get wrong.

## The rule that actually decides it

**Match the code's shape to the data's shape.**

A flat sequence — a list, a string, a range of numbers — is defined by "next, next, next". That's a loop. Writing \`sum_to(1_000_000)\` recursively is a party trick that also happens to raise \`RecursionError\` about 999,000 calls early.

A structure defined *in terms of itself* — a tree whose children are trees, JSON whose values may be dicts of values, a directory containing directories — is recursive by definition. Iterating it means building your own stack and hand-rolling the unwind logic that the language would have given you for free.

\`\`\`python
# Flat: the loop is obviously right.
total = 0
for value in [1, 2, 3, 4]:
    total += value

# Nested: the recursion is obviously right.
def deep_sum(values):
    total = 0
    for v in values:
        total += deep_sum(v) if isinstance(v, list) else v
    return total
\`\`\`

Notice that the recursive version still contains a loop. Real recursive code is usually *both*: loop across the children at this level, recurse into each one. "Recursive vs iterative" is rarely all-or-nothing.

## What recursion costs

- **Frames.** Each level is a stack frame — memory, plus the push/pop work. CPython frames are comparatively expensive, so a recursive numeric routine is noticeably slower than the loop.
- **Depth limits.** CPython ships a recursion limit of 1000 by default, so depth proportional to \`n\` breaks on inputs that a loop would shrug off. Depth proportional to \`log n\`, or to the height of a balanced tree, is fine.
- **Debuggability.** A traceback with 400 identical frames is harder to read than a loop you can breakpoint once.

## What recursion buys

- **The unwind is free.** Post-order work — "combine the answers from below" — is one line in a recursion and a hand-rolled state machine in a loop.
- **The base case is explicit.** The empty case is written down as its own branch instead of hiding inside a loop condition.
- **It matches the definition.** When the spec says "a directory's size is the sum of its entries' sizes", the recursion *is* the spec, and the reviewer can check it against the sentence.

## A rule of thumb worth memorizing

Recurse on **branching or nesting**, loop on **sequence**. If each step has exactly one successor, a loop is at least as clear and never overflows. If a step has several successors — two children, N neighbors, K choices — recursion is almost always the right call, because you'd otherwise be simulating a stack.

And when the recursion is linear *and* deep (walking a million-node linked list), you get the worst of both: no branching to justify the frames, and enough depth to blow the limit. Rewrite it as a loop.`,
    },
    exercises: [
      {
        id: "rec-both-ways",
        title: "The same answer, both ways",
        instructions: {
          typescript: `Write \`reverseLoop(text)\` with a loop and \`reverseRecursive(text)\` without one, then compare which reads better.

- \`reverseLoop\` — walk the string and build the reversed result. Iterating a flat sequence is exactly what loops are for.
- \`reverseRecursive\` — base case: a string of length 0 or 1 is already reversed. Recursive case: the reverse of \`text.slice(1)\`, with \`text[0]\` stuck on the end.

Then answer for yourself: which one would you ship for a 100,000-character string, and why?

**Expected output:** \`recursion\` twice, then \`true\`.`,
          python: `Write \`reverse_loop(text)\` with a loop and \`reverse_recursive(text)\` without one, then compare which reads better.

- \`reverse_loop\` — walk the string and build the reversed result. Iterating a flat sequence is exactly what loops are for.
- \`reverse_recursive\` — base case: a string of length 0 or 1 is already reversed. Recursive case: the reverse of \`text[1:]\`, with \`text[0]\` stuck on the end.

Then answer for yourself: which one would you ship for a 100,000-character string, and why?

**Expected output:** \`recursion\` twice, then \`True\`.`,
        },
        starterCode: {
          typescript: `function reverseLoop(text: string): string {
  // TODO: build the reversed string with a loop.
  return text;
}

function reverseRecursive(text: string): string {
  // TODO: base case — a string shorter than 2 characters is its own reverse.
  // TODO: recursive case — reverseRecursive(text.slice(1)) + text[0].
  return text;
}

console.log(reverseLoop("noisrucer")); // expected: recursion
console.log(reverseRecursive("noisrucer")); // expected: recursion
console.log(reverseLoop("abcdef") === reverseRecursive("abcdef")); // expected: true`,
          python: `def reverse_loop(text):
    # TODO: build the reversed string with a loop.
    return text


def reverse_recursive(text):
    # TODO: base case — a string shorter than 2 characters is its own reverse.
    # TODO: recursive case — reverse_recursive(text[1:]) plus text[0].
    return text


print(reverse_loop("noisrucer"))       # expected: recursion
print(reverse_recursive("noisrucer"))  # expected: recursion
print(reverse_loop("abcdef") == reverse_recursive("abcdef"))  # expected: True
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-when-loop",
        prompt: "Which task is the clearest case for a plain loop rather than recursion?",
        options: [
          "Summing the sizes of every file under a directory tree",
          "Summing a flat array of one million numbers",
          "Enumerating every subset of a set of choices",
          "Computing the height of a binary tree",
        ],
        answer: 1,
        explanation:
          "A flat sequence has exactly one successor per step, so a loop is at least as clear — and one million recursive frames would exhaust the stack. The other three are branching or nested by definition.",
      },
      {
        id: "rec-q-shape-fit",
        prompt: "What is the practical rule for choosing between the two?",
        options: [
          "Recursion is always slower, so use it only when a loop is impossible",
          "Prefer recursion whenever the function returns a value",
          "Recurse on branching or nested data; loop on flat sequences",
          "Prefer whichever produces fewer lines of code",
        ],
        answer: 2,
        explanation:
          "Match the code's shape to the data's shape. One successor per step is a loop; several successors — children, neighbors, choices — means you'd otherwise be simulating a stack by hand.",
      },
      {
        id: "rec-q-mixed-shape",
        prompt: "In a typical tree or nested-data walk, what does real code usually look like?",
        options: [
          "Pure recursion with no loops anywhere",
          "A loop over the children at this level, recursing into each child",
          "A single loop with no recursive calls at all",
          "Two separate passes: one fully iterative, one fully recursive",
        ],
        answer: 1,
        explanation:
          "\"Recursive versus iterative\" is rarely all-or-nothing. Branching downward is the recursion; visiting this node's several children is an ordinary loop inside the same function.",
      },
    ],
  },
];
