import type { Lesson } from "../types";

export const stacksQueuesLessons: Lesson[] = [
  {
    id: "dsa-stack-patterns",
    module: "stacks-queues",
    title: "Stacks: Last In, First Out",
    blurb: "Matching, nesting, and undoing — wherever order reverses.",
    graphics: [
      {
        id: "lifo",
        title: "Last in, first out",
        caption:
          "Push to open work, pop to resolve it. Bracket matching, nesting, undo, and postorder walks all reverse arrival order.",
        src: "/lesson-graphics/dsa/dsa-stack-patterns.png",
      },
    ],
    content: {
      typescript: `## The structure

A stack has one rule: the only element you can touch is the most recently added one. \`push\` puts an element on top, \`pop\` removes it, \`peek\` reads it without removing — each **O(1)**.

In TypeScript there is no \`Stack\` class, and you don't need one. An array **used only via \`push\` and \`pop\`** *is* a stack. That's discipline, not a new type — the moment you \`shift()\` from the front or splice the middle, you've left stack-land and lost the guarantees.

\`\`\`ts
const stack: number[] = [];
stack.push(7);                 // O(1)
stack.push(9);                 // O(1)
stack[stack.length - 1];       // peek -> 9
stack.pop();                   // -> 9. Last in, first out.
\`\`\`

## When do I reach for one?

The tell is **nesting** or **most-recent-thing-first**:

- **Matched brackets / HTML tags** — a closer must match the *most recent* unclosed opener. Nesting, literally.
- **Undo history** — Ctrl+Z reverses the latest action first. You've built this ad hoc with an array of actions; that array was a stack.
- **The call stack** — recursion *is* a stack the runtime maintains for you: each call pushes a frame, each return pops one. Any recursive algorithm has an iterative twin with an explicit stack — this pays off in the trees module.
- **Postfix/RPN evaluation** — operands wait on a stack until an operator consumes them.

## The bracket-matching algorithm

Scan left to right. Push every opener. On a closer, pop and check that what comes off is the matching opener:

\`\`\`ts
// scanning "([)]"
// '(' -> push          stack: ['(']
// '[' -> push          stack: ['(', '[']
// ')' -> pop '['       mismatch! ')' needed '(' -> invalid
\`\`\`

There are exactly **three failure modes** — miss one and your validator lies:

1. **Wrong pair** — you pop \`(\` but the closer is \`]\` (\`"(]"\`).
2. **Pop from empty** — a closer arrives with no opener waiting (\`"())"\`).
3. **Leftovers** — the scan ends but openers remain on the stack (\`"(("\`).

A string is valid **iff** the scan never mismatches, never pops empty, and the stack is empty at the end. One pass, O(n) time, O(n) worst-case space — at 1M characters that's one pass, not the O(n²) you'd get rescanning for partners.`,
      python: `## The structure

A stack has one rule: the only element you can touch is the most recently added one. \`append\` puts an element on top, \`pop\` removes it, \`stack[-1]\` reads it without removing — each **O(1)**.

In Python there is no \`Stack\` class, and you don't need one. A list **used only via \`append\` and \`pop()\`** *is* a stack. That's discipline, not a new type — the moment you \`pop(0)\` from the front or slice out of the middle, you've left stack-land and lost the guarantees.

\`\`\`python
stack = []
stack.append(7)   # O(1)
stack.append(9)   # O(1)
stack[-1]         # peek -> 9
stack.pop()       # -> 9. Last in, first out.
\`\`\`

One Python-specific care point: \`pop()\` on an empty list raises \`IndexError\`, it doesn't return \`None\`. So the empty check is part of the algorithm, not defensive noise — which is convenient, because "pop from empty" is one of the three bracket-matching failure modes below.

## When do I reach for one?

The tell is **nesting** or **most-recent-thing-first**:

- **Matched brackets / HTML tags** — a closer must match the *most recent* unclosed opener. Nesting, literally.
- **Undo history** — Ctrl+Z reverses the latest action first. You've built this ad hoc with a list of actions; that list was a stack.
- **The call stack** — recursion *is* a stack the interpreter maintains for you: each call pushes a frame, each return pops one. Any recursive algorithm has an iterative twin with an explicit stack — this pays off in the trees module, and in Python it matters more than most, because the default recursion limit is 1000 frames.
- **Postfix/RPN evaluation** — operands wait on a stack until an operator consumes them.

## The bracket-matching algorithm

Scan left to right. Push every opener. On a closer, pop and check that what comes off is the matching opener:

\`\`\`python
# scanning "([)]"
# '(' -> push          stack: ['(']
# '[' -> push          stack: ['(', '[']
# ')' -> pop '['       mismatch! ')' needed '(' -> invalid
\`\`\`

There are exactly **three failure modes** — miss one and your validator lies:

1. **Wrong pair** — you pop \`(\` but the closer is \`]\` (\`"(]"\`).
2. **Pop from empty** — a closer arrives with no opener waiting (\`"())"\`).
3. **Leftovers** — the scan ends but openers remain on the stack (\`"(("\`).

A string is valid **iff** the scan never mismatches, never pops empty, and the stack is empty at the end. One pass, O(n) time, O(n) worst-case space — at 1M characters that's one pass, not the O(n²) you'd get rescanning for partners.`,
    },
    exercises: [
    {
      id: "dsa-bracket-match",
      title: "Balanced brackets",
      instructions: {
        typescript: `Implement \`isBalanced(s)\` for the six characters \`()[]{}\` using a stack and the given closer→opener lookup.

Push openers. On a closer, pop and compare against \`pairForCloser[ch]\`. Return \`false\` for any of the three failure modes:

1. **Wrong pair** — the popped opener doesn't match the closer.
2. **Pop from empty** — a closer arrives while the stack is empty.
3. **Leftovers** — the stack is non-empty after the scan.

Expected output: \`true\`, \`false\`, \`false\`.`,
        python: `Implement \`is_balanced(s)\` for the six characters \`()[]{}\` using a stack and the given closer→opener lookup.

Push openers. On a closer, pop and compare against \`pair_for_closer[ch]\`. Return \`False\` for any of the three failure modes:

1. **Wrong pair** — the popped opener doesn't match the closer.
2. **Pop from empty** — a closer arrives while the stack is empty. Check \`if not stack\` *before* popping: \`pop()\` on an empty list raises \`IndexError\`.
3. **Leftovers** — the stack is non-empty after the scan.

Expected output: \`True\`, \`False\`, \`False\`.`,
      },
      starterCode: {
        typescript: `function isBalanced(s: string): boolean {
  // Closer -> opener lookup: when you see a closer, this is the opener
  // that must be on top of the stack.
  const pairForCloser: Record<string, string> = {
    ")": "(",
    "]": "[",
    "}": "{",
  };
  const stack: string[] = [];

  // TODO: scan s left to right.
  //  - opener ( [ {  -> push it
  //  - closer ) ] }  -> pop and compare against pairForCloser[ch]
  // Return false on: wrong pair, pop from empty, or leftovers at the end.
  return false;
}

console.log(isBalanced("([]{})")); // expected: true
console.log(isBalanced("(]"));     // expected: false (wrong pair)
console.log(isBalanced("(("));     // expected: false (unclosed leftovers)
`,
        python: `def is_balanced(s):
    # Closer -> opener lookup: when you see a closer, this is the opener
    # that must be on top of the stack.
    pair_for_closer = {
        ")": "(",
        "]": "[",
        "}": "{",
    }
    stack = []

    # TODO: scan s left to right.
    #  - opener ( [ {  -> push it
    #  - closer ) ] }  -> pop and compare against pair_for_closer[ch]
    # Return False on: wrong pair, pop from empty, or leftovers at the end.
    # Guard the empty case before popping — pop() raises IndexError.
    return False


print(is_balanced("([]{})"))  # expected: True
print(is_balanced("(]"))      # expected: False (wrong pair)
print(is_balanced("(("))      # expected: False (unclosed leftovers)
`,
      },
    },
    {
      id: "dsa-evaluate-rpn",
      title: "Evaluate RPN",
      instructions: {
        typescript: `Implement \`evalRPN(tokens)\` for postfix (reverse-Polish) expressions with integer tokens and \`+ - * /\`.

The loop: push numbers; when you hit an operator, pop twice, apply, push the result. **Operand order matters for \`-\` and \`/\`**: the first pop is the *right* operand \`b\`, the second pop is the *left* operand \`a\` — compute \`a - b\`, not \`b - a\`. When the tokens run out, the answer is the one value left on the stack.

Expected output: \`20\`, \`4\`, \`1\`.`,
        python: `Implement \`eval_rpn(tokens)\` for postfix (reverse-Polish) expressions with integer tokens and \`+ - * /\`.

The loop: push numbers; when you hit an operator, pop twice, apply, push the result. **Operand order matters for \`-\` and \`/\`**: the first pop is the *right* operand \`b\`, the second pop is the *left* operand \`a\` — compute \`a - b\`, not \`b - a\`. When the tokens run out, the answer is the one value left on the stack.

A Python-specific trap worth knowing even though these cases avoid it: \`/\` is float division, and \`//\` floors toward negative infinity (\`-7 // 2 == -4\`). Interview specs almost always want truncation *toward zero*, which is \`int(a / b)\`.

Expected output: \`20\`, \`4\`, \`1\`.`,
      },
      starterCode: {
        typescript: `function evalRPN(tokens: string[]): number {
  const stack: number[] = [];

  // TODO: for each token:
  //  - number  -> push Number(token)
  //  - operator -> pop b, then pop a, push (a op b)
  // Order matters for - and /: the SECOND pop is the left operand.
  // The final answer is the single value left on the stack.
  return 0;
}

console.log(evalRPN(["2", "3", "+", "4", "*"])); // expected: 20
console.log(evalRPN(["5", "1", "-"]));           // expected: 4
console.log(evalRPN(["7", "2", "3", "*", "-"])); // expected: 1
`,
        python: `def eval_rpn(tokens):
    stack = []

    # TODO: for each token:
    #  - number   -> push int(token)
    #  - operator -> pop b, then pop a, push (a op b)
    # Order matters for - and /: the SECOND pop is the left operand.
    # The final answer is the single value left on the stack.
    return 0


print(eval_rpn(["2", "3", "+", "4", "*"]))  # expected: 20
print(eval_rpn(["5", "1", "-"]))            # expected: 4
print(eval_rpn(["7", "2", "3", "*", "-"]))  # expected: 1
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-stack-patterns-q1",
      prompt: "Which of these situations is the tell that a stack is the right tool?",
      options: [
        "A job runner that must process tasks in the order they arrived",
        "Repeatedly retrieving the smallest remaining item from a changing set",
        "Checking whether a value has been seen before in O(1)",
        "Undo history, where the most recent action must be reversed first",
      ],
      answer: 3,
      explanation: {
        typescript: "Stacks fit nesting and most-recent-first problems like undo. Arrival order is a queue, smallest-first is a heap, and membership checks are a Set.",
        python: "Stacks fit nesting and most-recent-first problems like undo. Arrival order is a queue, smallest-first is a heap (`heapq`), and membership checks are a `set`.",
      },
    },
    {
      id: "dsa-stack-patterns-q2",
      prompt: {
        typescript: "Using a TS array as a stack, what is the cost of `push` and `pop`?",
        python: "Using a Python list as a stack, what is the cost of `append` and `pop()`?",
      },
      options: {
        typescript: [
        "Both are O(1) (amortized for `push` due to occasional resizing)",
        "Both are O(n) because arrays must stay contiguous",
        "`push` is O(1) but `pop` is O(n) because elements slide down",
        "Both are O(log n), like most container operations",
        ],
        python: [
        "Both are O(1) (amortized for `append` due to occasional resizing)",
        "Both are O(n) because lists must stay contiguous",
        "`append` is O(1) but `pop()` is O(n) because elements slide down",
        "Both are O(log n), like most container operations",
      ],
      },
      answer: 0,
      explanation: {
        typescript: "Both operations touch only the tail in place, so both are O(1); resizing on push is amortized away. Sliding happens on `shift`/`unshift` (the front), not `pop`.",
        python: "Both operations touch only the tail in place, so both are O(1); resizing on append is amortized away. Sliding happens on `pop(0)`/`insert(0, x)` (the front), not the bare `pop()`.",
      },
    },
    {
      id: "dsa-stack-patterns-q3",
      prompt: "While validating brackets you read `]` and pop `(` off the stack. What does the algorithm do?",
      options: [
        "Keeps scanning, since a matching `)` may still appear later",
        "Returns false immediately — this is the wrong-pair failure mode",
        "Pushes the `]` and lets a future opener resolve it",
        "Returns false only if the stack is also non-empty at the end",
      ],
      answer: 1,
      explanation: "A closer must match the most recent unclosed opener; `(` vs `]` is an unrecoverable mismatch, so the scan can stop right there. Counting or deferring lets strings like \"([)]\" pass.",
    },
    ],
  },
  {
    id: "dsa-queues",
    module: "stacks-queues",
    title: "Queues: First In, First Out",
    blurb: "Processing in arrival order — and the shift() trap.",
    graphics: [
      {
        id: "fifo",
        title: "First in, first out",
        caption:
          "Enqueue at the back, dequeue from the front. Arrival order is processing order — BFS, rate windows, and fair scheduling.",
        src: "/lesson-graphics/dsa/dsa-queues.png",
      },
    ],
    content: {
      typescript: `## The structure

A queue is the mirror image of a stack: **enqueue at the back, dequeue from the front**, both O(1). First in, first out — arrival order is preserved. You reach for one whenever fairness or ordering matters: buffering incoming events, task scheduling, rate limiting, and — the big one — **BFS frontiers** (the trees module's level-order traversal is exactly this queue put to work).

## The JS/TS trap: \`shift()\` is O(n)

The "obvious" queue is \`arr.push(x)\` to enqueue and \`arr.shift()\` to dequeue. But \`shift()\` removes index 0 and **slides every remaining element down one slot** — it's O(n). Do that inside a loop that drains the queue and you've written an accidental **O(n²)**:

\`\`\`ts
// looks innocent, is quadratic
while (queue.length > 0) {
  const item = queue.shift(); // O(n) each time
  process(item);
}
\`\`\`

At 1,000 items nobody notices. At 100,000 items that's ~5 billion element moves — a multi-second stall where an honest queue takes milliseconds. This is one of the most common real-world perf bugs in JS BFS implementations.

## The fix: a head index

Don't remove from the front — just stop looking at it. Keep the array plus a \`head\` pointer:

- **enqueue**: \`items.push(value)\` — O(1)
- **dequeue**: read \`items[head]\`, then \`head++\` — O(1), nothing moves
- **size**: \`items.length - head\`

Dequeued slots linger in memory until the queue is garbage-collected — the classic space-for-time trade, and almost always the right one for a queue that gets drained and dropped (like a BFS frontier). A linked-list-backed queue is the alternative when the queue is long-lived and memory matters.

## Deques, briefly

A **deque** allows push/pop at *both* ends. In JS, \`push\`/\`pop\` are O(1) but \`shift\`/\`unshift\` are O(n), so a true O(1) deque needs the same head-index idea applied at both ends (or a doubly linked list). The deque is the machinery behind the sliding-window-maximum trick — file the name away; the pattern is a monotonic queue, cousin of the next lesson's monotonic stack.`,
      python: `## The structure

A queue is the mirror image of a stack: **enqueue at the back, dequeue from the front**, both O(1). First in, first out — arrival order is preserved. You reach for one whenever fairness or ordering matters: buffering incoming events, task scheduling, rate limiting, and — the big one — **BFS frontiers** (the trees module's level-order traversal is exactly this queue put to work).

## The Python trap: \`pop(0)\` is O(n)

The "obvious" queue is \`lst.append(x)\` to enqueue and \`lst.pop(0)\` to dequeue. But \`pop(0)\` removes index 0 and **slides every remaining element down one slot** — it's O(n). Do that inside a loop that drains the queue and you've written an accidental **O(n²)**:

\`\`\`python
# looks innocent, is quadratic
while queue:
    item = queue.pop(0)  # O(n) each time
    process(item)
\`\`\`

At 1,000 items nobody notices. At 100,000 items that's ~5 billion element moves — a multi-second stall where an honest queue takes milliseconds. This is one of the most common real-world perf bugs in Python BFS implementations.

## The fix: \`collections.deque\`

Python hands you the answer in the standard library, and in real code this is simply what you use:

\`\`\`python
from collections import deque

queue = deque()
queue.append(x)          # enqueue, O(1)
item = queue.popleft()   # dequeue, O(1) — no sliding
\`\`\`

A \`deque\` is a doubly linked list of fixed-size blocks, so both ends are O(1). The cost is that indexing into the middle (\`queue[n // 2]\`) is O(n) rather than O(1) — a trade that is irrelevant for queue use and exactly why a list isn't secretly a deque already.

## The fix you build yourself: a head index

\`deque\` is the answer, but it's worth knowing *why* it beats the list, because the same trick shows up whenever you can't reach for one. Don't remove from the front — just stop looking at it. Keep the list plus a \`head\` pointer:

- **enqueue**: \`items.append(value)\` — O(1)
- **dequeue**: read \`items[head]\`, then \`head += 1\` — O(1), nothing moves
- **size**: \`len(items) - head\`

Dequeued slots linger in memory until the queue is garbage-collected — the classic space-for-time trade, and almost always the right one for a queue that gets drained and dropped (like a BFS frontier). That lingering is precisely what \`deque\` fixes by freeing whole blocks as they empty.

## Deques, briefly

A **deque** allows push/pop at *both* ends — \`append\`/\`pop\` at the right, \`appendleft\`/\`popleft\` at the left, all O(1). It's the machinery behind the sliding-window-maximum trick — file the name away; the pattern is a monotonic queue, cousin of the next lesson's monotonic stack.`,
    },
    exercises: [
    {
      id: "dsa-pointer-queue",
      title: "A queue without shift()",
      instructions: {
        typescript: `Fill in \`enqueue\`, \`dequeue\`, and \`size\` on \`SimpleQueue\`.

The whole point: \`shift()\` is O(n) because every remaining element slides down a slot, so a shift-based queue drained in a loop is O(n²). Instead, \`dequeue\` reads \`items[head]\` and **advances \`head\`** — the front element is abandoned in place, nothing moves, O(1). \`size\` is what's between \`head\` and the end.

Expected output: \`a\`, \`b\`, \`1\`.`,
        python: `Fill in \`enqueue\`, \`dequeue\`, and \`size\` on \`SimpleQueue\`.

The whole point: \`pop(0)\` is O(n) because every remaining element slides down a slot, so a \`pop(0)\`-based queue drained in a loop is O(n²). Instead, \`dequeue\` reads \`items[head]\` and **advances \`head\`** — the front element is abandoned in place, nothing moves, O(1). \`size\` is what's between \`head\` and the end.

In production you would write \`from collections import deque\` and call \`popleft()\`, which does this for you in C. Build it by hand once so you know what \`deque\` is buying you — and so you can explain it when an interviewer asks why \`pop(0)\` was the bug.

Expected output: \`a\`, \`b\`, \`1\`.`,
      },
      starterCode: {
        typescript: `class SimpleQueue<T> {
  private items: T[] = [];
  private head = 0;

  enqueue(value: T): void {
    // TODO: add value at the back
  }

  dequeue(): T | undefined {
    // TODO: return the item at this.head and advance this.head.
    // Do NOT use shift() — that's the O(n) trap this class exists to avoid.
    return undefined;
  }

  size(): number {
    // TODO: how many items are still waiting? (hint: head has moved)
    return 0;
  }
}

const q = new SimpleQueue<string>();
q.enqueue("a");
q.enqueue("b");
q.enqueue("c");
console.log(q.dequeue()); // expected: a
console.log(q.dequeue()); // expected: b
console.log(q.size());    // expected: 1
`,
        python: `class SimpleQueue:
    def __init__(self):
        self.items = []
        self.head = 0

    def enqueue(self, value):
        # TODO: add value at the back
        pass

    def dequeue(self):
        # TODO: return the item at self.head and advance self.head.
        # Do NOT use pop(0) — that's the O(n) trap this class exists to avoid.
        return None

    def size(self):
        # TODO: how many items are still waiting? (hint: head has moved)
        return 0


q = SimpleQueue()
q.enqueue("a")
q.enqueue("b")
q.enqueue("c")
print(q.dequeue())  # expected: a
print(q.dequeue())  # expected: b
print(q.size())     # expected: 1
`,
      },
    },
    {
      id: "dsa-recent-hits",
      title: "Hits in the last 100 ticks",
      instructions: {
        typescript: `Implement \`hit(tick)\` and \`countSince(tick)\`. \`countSince\` returns how many hits landed in the window \`(tick - 100, tick]\` — evict expired ticks (those \`<= tick - 100\`) from the *front* of the internal queue by advancing \`head\`, then return the remaining count.

Why this is fast: each tick enters the queue once and leaves at most once, so across any sequence of calls the total eviction work is bounded by the number of hits — **amortized O(1)** per call, no matter how bursty the traffic.

Expected output: \`3\`, \`1\`, \`0\`.`,
        python: `Implement \`hit(tick)\` and \`count_since(tick)\`. \`count_since\` returns how many hits landed in the window \`(tick - 100, tick]\` — evict expired ticks (those \`<= tick - 100\`) from the *front* of the internal queue by advancing \`head\`, then return the remaining count.

Why this is fast: each tick enters the queue once and leaves at most once, so across any sequence of calls the total eviction work is bounded by the number of hits — **amortized O(1)** per call, no matter how bursty the traffic.

(A \`deque\` with \`popleft()\` would work identically here; the head index is used so the eviction is visible.)

Expected output: \`3\`, \`1\`, \`0\`.`,
      },
      starterCode: {
        typescript: `class HitCounter {
  // Ticks arrive in non-decreasing order; head-index queue, no shift().
  private ticks: number[] = [];
  private head = 0;

  hit(tick: number): void {
    // TODO: record a hit at this tick (enqueue at the back)
  }

  countSince(tick: number): number {
    // TODO: evict from the front every recorded tick <= tick - 100
    // (advance this.head past it), then return how many remain.
    return 0;
  }
}

const counter = new HitCounter();
counter.hit(1);
counter.hit(2);
counter.hit(3);
console.log(counter.countSince(4));   // expected: 3
counter.hit(300);
console.log(counter.countSince(300)); // expected: 1 (ticks 1..3 left the window)
console.log(counter.countSince(401)); // expected: 0
`,
        python: `class HitCounter:
    # Ticks arrive in non-decreasing order; head-index queue, no pop(0).
    def __init__(self):
        self.ticks = []
        self.head = 0

    def hit(self, tick):
        # TODO: record a hit at this tick (enqueue at the back)
        pass

    def count_since(self, tick):
        # TODO: evict from the front every recorded tick <= tick - 100
        # (advance self.head past it), then return how many remain.
        return 0


counter = HitCounter()
counter.hit(1)
counter.hit(2)
counter.hit(3)
print(counter.count_since(4))    # expected: 3
counter.hit(300)
print(counter.count_since(300))  # expected: 1 (ticks 1..3 left the window)
print(counter.count_since(401))  # expected: 0
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-queues-q1",
      prompt: {
        typescript: "Why does draining an array-backed queue with `shift()` in a loop become O(n²)?",
        python: "Why does draining a list-backed queue with `pop(0)` in a loop become O(n²)?",
      },
      options: {
        typescript: [
        "Each `shift()` allocates a brand-new array and copies into it",
        "Each `shift()` is O(n) — every remaining element slides down one slot — and you do it n times",
        "`shift()` is O(log n), and the log factors compound across iterations",
        "It doesn't — JS engines special-case `shift()` to be O(1) like `pop()`",
        ],
        python: [
        "Each `pop(0)` allocates a brand-new list and copies into it",
        "Each `pop(0)` is O(n) — every remaining element slides down one slot — and you do it n times",
        "`pop(0)` is O(log n), and the log factors compound across iterations",
        "It doesn't — CPython special-cases `pop(0)` to be O(1) like `pop()`",
      ],
      },
      answer: 1,
      explanation: {
        typescript: "Removing index 0 forces every remaining element to move down, so each shift is O(n); n shifts total roughly n²/2 moves. Engines do not make this free in general.",
        python: "Removing index 0 forces every remaining element to move down, so each `pop(0)` is O(n); n of them total roughly n²/2 moves. CPython does not make this free — `collections.deque.popleft()` is the O(1) alternative.",
      },
    },
    {
      id: "dsa-queues-q2",
      prompt: "In a head-index queue, what does `dequeue` actually do?",
      options: {
        typescript: [
        "Swaps the front element with the last one, then pops",
        "Splices index 0 out of the array in place",
        "Reads `items[head]` and increments `head` — nothing in the array moves",
        "Sets the front slot to `null` and periodically compacts the array",
        ],
        python: [
        "Swaps the front element with the last one, then pops",
        "Deletes index 0 out of the list in place with `del items[0]`",
        "Reads `items[head]` and increments `head` — nothing in the list moves",
        "Sets the front slot to `None` and periodically compacts the list",
      ],
      },
      answer: 2,
      explanation: "The front element is simply abandoned in place; advancing the read pointer is O(1). Swap-with-last would be O(1) too, but it destroys FIFO order — the whole point of a queue.",
    },
    {
      id: "dsa-queues-q3",
      prompt: "You need to visit every node of a wide tree level by level (all depth-1 nodes, then depth-2, ...). Which structure holds the frontier?",
      options: {
        typescript: [
        "A stack — the most recently discovered node should go next",
        "A sorted array keyed by node depth",
        "A Map from depth to node, replacing entries as you go",
        "A queue — nodes are processed in the order they were discovered",
        ],
        python: [
        "A stack — the most recently discovered node should go next",
        "A list of nodes kept sorted by depth",
        "A `dict` from depth to node, replacing entries as you go",
        "A queue — nodes are processed in the order they were discovered",
      ],
      },
      answer: 3,
      explanation: "Level-order traversal is BFS, and BFS is defined by a FIFO frontier: children discovered earlier are visited earlier. A stack gives you depth-first order instead.",
    },
    ],
  },
  {
    id: "dsa-monotonic-stack",
    module: "stacks-queues",
    title: "Monotonic Stacks",
    blurb: "Keep the stack sorted; answer \"next greater\" in O(n).",
    graphics: [
      {
        id: "next-greater",
        title: "Next greater in one pass",
        caption:
          "Keep the stack sorted by value so each new bar can pop smaller predecessors and answer \"who is next greater?\" in amortized O(1) per element.",
        src: "/lesson-graphics/dsa/dsa-monotonic-stack.png",
      },
    ],
    content: {
      typescript: `## The idea

A **monotonic stack** is a plain stack with one added invariant: the values from bottom to top stay sorted (say, decreasing). Before pushing each new element, you first **pop everything that would violate the order**. That popping is the trick — *the element that pops you is your answer*.

This is the tool for the whole **"next greater / next smaller element"** family: for each item, find the first thing to its right (or left) that beats it.

## Why the nested loop is still O(n)

The code has a \`while\` inside a \`for\`, and it fools people into calling it O(n²). Count operations by *element*, not by loop nesting: each index is **pushed exactly once** and **popped at most once**. Total pushes + pops across the entire run ≤ 2n, so the whole thing is **amortized O(n)**. One iteration might pop 10,000 items — but those 10,000 can never be popped again. The brute-force nested scan really is O(n²): at n = 100,000 that's ~10 billion comparisons vs. 200,000 stack operations.

## Trace: next greater element on \`[2, 1, 2, 4, 3]\`

Keep **indexes** on the stack, not values — you need the position to write the answer into the result array (the value is one lookup away via \`nums[i]\`).

\`\`\`ts
// ans starts as [-1, -1, -1, -1, -1]
// i=0 (2): stack empty            -> push 0     stack: [0]
// i=1 (1): 1 beats nothing        -> push 1     stack: [0, 1]
// i=2 (2): nums[1]=1 < 2 -> pop 1, ans[1]=2
//          nums[0]=2 not < 2      -> push 2     stack: [0, 2]
// i=3 (4): nums[2]=2 < 4 -> pop 2, ans[2]=4
//          nums[0]=2 < 4 -> pop 0, ans[0]=4
//                                  -> push 3     stack: [3]
// i=4 (3): nums[3]=4 not < 3      -> push 4     stack: [3, 4]
// done: 3 and 4 never popped -> stay -1
// ans = [4, 2, 4, -1, -1]
\`\`\`

Indexes left on the stack at the end never met a greater element — their answer stays \`-1\`.

## When do I reach for one?

Any "for each element, find the nearest element that dominates it" question: **daily temperatures** (days until warmer), **stock span** (streak of days not exceeding today), and the classic **largest rectangle in a histogram** (next-smaller on both sides). If you catch yourself writing a nested loop that scans rightward from every index, a monotonic stack usually collapses it to O(n).`,
      python: `## The idea

A **monotonic stack** is a plain stack with one added invariant: the values from bottom to top stay sorted (say, decreasing). Before pushing each new element, you first **pop everything that would violate the order**. That popping is the trick — *the element that pops you is your answer*.

This is the tool for the whole **"next greater / next smaller element"** family: for each item, find the first thing to its right (or left) that beats it.

## Why the nested loop is still O(n)

The code has a \`while\` inside a \`for\`, and it fools people into calling it O(n²). Count operations by *element*, not by loop nesting: each index is **pushed exactly once** and **popped at most once**. Total pushes + pops across the entire run ≤ 2n, so the whole thing is **amortized O(n)**. One iteration might pop 10,000 items — but those 10,000 can never be popped again. The brute-force nested scan really is O(n²): at n = 100,000 that's ~10 billion comparisons vs. 200,000 stack operations.

## Trace: next greater element on \`[2, 1, 2, 4, 3]\`

Keep **indexes** on the stack, not values — you need the position to write the answer into the result list (the value is one lookup away via \`nums[i]\`).

\`\`\`python
# ans starts as [-1, -1, -1, -1, -1]
# i=0 (2): stack empty            -> push 0     stack: [0]
# i=1 (1): 1 beats nothing        -> push 1     stack: [0, 1]
# i=2 (2): nums[1]=1 < 2 -> pop 1, ans[1]=2
#          nums[0]=2 not < 2      -> push 2     stack: [0, 2]
# i=3 (4): nums[2]=2 < 4 -> pop 2, ans[2]=4
#          nums[0]=2 < 4 -> pop 0, ans[0]=4
#                                 -> push 3     stack: [3]
# i=4 (3): nums[3]=4 not < 3      -> push 4     stack: [3, 4]
# done: 3 and 4 never popped -> stay -1
# ans = [4, 2, 4, -1, -1]
\`\`\`

Indexes left on the stack at the end never met a greater element — their answer stays \`-1\`.

Two Python details that keep this loop clean: \`while stack and nums[stack[-1]] < nums[i]\` relies on \`and\` short-circuiting, so the empty-stack check must come first or \`stack[-1]\` raises \`IndexError\`. And \`stack[-1]\` is the idiomatic peek — no \`len(stack) - 1\` arithmetic needed.

## When do I reach for one?

Any "for each element, find the nearest element that dominates it" question: **daily temperatures** (days until warmer), **stock span** (streak of days not exceeding today), and the classic **largest rectangle in a histogram** (next-smaller on both sides). If you catch yourself writing a nested loop that scans rightward from every index, a monotonic stack usually collapses it to O(n).`,
    },
    exercises: [
    {
      id: "dsa-next-greater",
      title: "Next greater element",
      instructions: {
        typescript: `Implement \`nextGreater(nums)\`: for each index, the first value to its right that is strictly greater, else \`-1\`.

Use a stack of **indexes**. For each \`i\`, while the stack's top index holds a value less than \`nums[i]\`, pop it and record \`nums[i]\` as its answer; then push \`i\`. Whatever survives the scan has no greater element — leave those at \`-1\`.

The nested-looking \`while\` doesn't make this O(n²): every index is pushed once and popped at most once, so the entire run is **O(n)**.

Expected output: \`[4, 2, 4, -1, -1]\` then \`[-1, -1, -1, -1, -1]\`.`,
        python: `Implement \`next_greater(nums)\`: for each index, the first value to its right that is strictly greater, else \`-1\`.

Use a stack of **indexes**. For each \`i\`, while the stack's top index holds a value less than \`nums[i]\`, pop it and record \`nums[i]\` as its answer; then push \`i\`. Whatever survives the scan has no greater element — leave those at \`-1\`.

Write the guard as \`while stack and nums[stack[-1]] < nums[i]\` — \`and\` short-circuits, so the emptiness check has to come first or \`stack[-1]\` raises \`IndexError\`.

The nested-looking \`while\` doesn't make this O(n²): every index is pushed once and popped at most once, so the entire run is **O(n)**.

Expected output: \`[4, 2, 4, -1, -1]\` then \`[-1, -1, -1, -1, -1]\`.`,
      },
      starterCode: {
        typescript: `function nextGreater(nums: number[]): number[] {
  // TODO: answers array filled with -1, plus a stack of INDEXES
  // whose next-greater is not yet known.
  // For each i: while the stack's top index holds a value < nums[i],
  // pop it — nums[i] is its answer. Then push i.
  // Each index is pushed once and popped at most once -> O(n) total.
  return [];
}

console.log(nextGreater([2, 1, 2, 4, 3])); // expected: [4, 2, 4, -1, -1]
console.log(nextGreater([5, 4, 3, 2, 1])); // expected: [-1, -1, -1, -1, -1]
`,
        python: `def next_greater(nums):
    # TODO: answers list filled with -1, plus a stack of INDEXES
    # whose next-greater is not yet known.
    # For each i: while the stack's top index holds a value < nums[i],
    # pop it — nums[i] is its answer. Then push i.
    # Guard: while stack and nums[stack[-1]] < nums[i]
    # Each index is pushed once and popped at most once -> O(n) total.
    return []


print(next_greater([2, 1, 2, 4, 3]))  # expected: [4, 2, 4, -1, -1]
print(next_greater([5, 4, 3, 2, 1]))  # expected: [-1, -1, -1, -1, -1]
`,
      },
    },
    {
      id: "dsa-stock-span",
      title: "Stock span",
      instructions: {
        typescript: `Implement \`spans(prices)\`: for each day, how many consecutive prior days — including today — had a price less than or equal to today's.

This is next-greater in a mirror: the span ends at the nearest **strictly greater previous price**, and that boundary is exactly what a monotonic stack tracks. Keep a stack of indexes with strictly decreasing prices. For day \`i\`, pop every index with \`prices[index] <= prices[i]\`; the span is \`i\` minus the index now on top (or \`i + 1\` if the stack emptied — every earlier day was cheaper). Push \`i\` and move on. Push-once/pop-once again: **O(n)** total.

Expected output: \`[1, 1, 1, 2, 1, 4, 6]\`.`,
        python: `Implement \`spans(prices)\`: for each day, how many consecutive prior days — including today — had a price less than or equal to today's.

This is next-greater in a mirror: the span ends at the nearest **strictly greater previous price**, and that boundary is exactly what a monotonic stack tracks. Keep a stack of indexes with strictly decreasing prices. For day \`i\`, pop every index with \`prices[index] <= prices[i]\`; the span is \`i\` minus the index now on top (or \`i + 1\` if the stack emptied — every earlier day was cheaper). Push \`i\` and move on. Push-once/pop-once again: **O(n)** total.

Expected output: \`[1, 1, 1, 2, 1, 4, 6]\`.`,
      },
      starterCode: {
        typescript: `function spans(prices: number[]): number[] {
  // TODO: monotonic stack of INDEXES with strictly decreasing prices.
  // For day i: pop every index whose price is <= prices[i].
  // The span is i - (index now on top) — or i + 1 if the stack is empty
  // (no strictly-greater earlier day). Then push i.
  return [];
}

// One trading week:
console.log(spans([100, 80, 60, 70, 60, 75, 85]));
// expected: [1, 1, 1, 2, 1, 4, 6]
`,
        python: `def spans(prices):
    # TODO: monotonic stack of INDEXES with strictly decreasing prices.
    # For day i: pop every index whose price is <= prices[i].
    # The span is i - (index now on top) — or i + 1 if the stack is empty
    # (no strictly-greater earlier day). Then push i.
    return []


# One trading week:
print(spans([100, 80, 60, 70, 60, 75, 85]))
# expected: [1, 1, 1, 2, 1, 4, 6]
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-monotonic-stack-q1",
      prompt: "The monotonic-stack loop has a `while` nested inside a `for`, yet it runs in O(n). Why?",
      options: [
        "The inner `while` almost never executes more than a couple of times in practice",
        "The stack never grows beyond a small constant number of entries",
        "Each index is pushed once and popped at most once, so total stack operations are bounded by 2n",
        "It is actually O(n log n), but the log factor is negligible at real sizes",
      ],
      answer: 2,
      explanation: "This is the amortized argument: charge each pop to the element being popped, and no element can be popped twice. A single iteration may pop many items, but the total across the run is at most n.",
    },
    {
      id: "dsa-monotonic-stack-q2",
      prompt: "In next-greater-element, why does the stack hold indexes rather than values?",
      options: [
        "Indexes are integers, so comparisons on them are faster than on the values",
        "Storing values would break when the array contains duplicates",
        "Indexes keep the stack automatically sorted without any popping",
        "You need each element's position to write its answer into the result array; the value is one `nums[i]` lookup away",
      ],
      answer: 3,
      explanation: "When `nums[i]` pops an entry, you must record the answer at that entry's position — a bare value can't tell you where it came from. Duplicates and comparison speed are red herrings.",
    },
    {
      id: "dsa-monotonic-stack-q3",
      prompt: "Which problem is a monotonic stack the right tool for?",
      options: [
        "For each day's temperature, how many days until a strictly warmer one",
        "Repeatedly fetching the k-th largest element from a stream",
        "Validating that a string's brackets are properly nested",
        "Maintaining the running median of a growing dataset",
      ],
      answer: 0,
      explanation: "Daily temperatures is the next-greater family: the element that pops you is your answer. Brackets need only a plain stack; k-th largest and running median call for heaps.",
    },
    ],
  },
];
