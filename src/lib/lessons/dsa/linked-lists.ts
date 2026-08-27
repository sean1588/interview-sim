import type { Lesson } from "../types";

export const linkedListsLessons: Lesson[] = [
  {
    id: "dsa-linked-list-basics",
    module: "linked-lists",
    title: "Nodes and Links",
    blurb: "What a linked list buys you, and what it costs.",
    graphics: [
      {
        id: "nodes-and-links",
        title: "Nodes and next links",
        caption:
          "Each node holds a value and a pointer to the next. Cheap insert/delete at a known node; random access costs a walk.",
        src: "/lesson-graphics/dsa/dsa-linked-list-basics.png",
      },
    ],
    content: {
      typescript: `## Nodes and links

A linked list is the simplest "structure made of references": each node holds a value and a pointer to the next node. That's the whole thing.

\`\`\`ts
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val: number, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}
\`\`\`

This is the course-wide convention: the class is always \`ListNode\` (never just \`Node\` — that name collides with a browser global), and \`null\` means "end of list".

The key mental picture vs an array: an array is **one contiguous block** — element *i* lives at a computable address, which is why \`arr[i]\` is O(1). A linked list's nodes are **scattered wherever the allocator put them**; the ORDER exists only in the \`next\` links. To reach the 5000th node you must follow 5000 pointers.

## The honest trade

| Operation | Array | Linked list |
|---|---|---|
| Access by index | O(1) | O(n) |
| Insert/remove at front | O(n) — shift everything | O(1) |
| Insert/remove **just after a node you already hold** | O(n) — shift | O(1) — rewire two pointers |
| Scan all n | O(n), cache-friendly | O(n), cache-**hostile** |

That last row matters more than Big-O suggests: iterating an array streams through contiguous memory the CPU prefetches; chasing scattered pointers misses cache constantly. At n = 1,000,000, both scans are "O(n)" but the array scan is often 5–10× faster in practice. Linked lists win only when their O(1) splicing is the operation you actually do.

**Singly vs doubly:** adding a \`prev\` pointer per node buys O(1) "delete *this* node" (no hunt for the predecessor) and backward traversal, at the cost of a second pointer to keep consistent on every edit.

## The traversal idiom

Every list algorithm is a variation of this walk:

\`\`\`ts
let cur = head;
while (cur) {
  // use cur.val
  cur = cur.next;
}
\`\`\`

\`cur\` becomes \`null\` exactly when you step past the last node — the loop condition is the end-of-list check.

## When would I reach for this?

Rarely as a raw structure — arrays win most days. You meet linked lists as **internals**: queue/deque implementations (O(1) at both ends), LRU caches (a doubly linked list gives O(1) "move this entry to the front"), and — unavoidably — interviews, where pointer surgery is a standard test of careful reasoning.`,
      python: `## Nodes and links

A linked list is the simplest "structure made of references": each node holds a value and a pointer to the next node. That's the whole thing.

\`\`\`python
class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next
\`\`\`

This is the course-wide convention: the class is always \`ListNode\`, and \`None\` means "end of list". Naming the attribute \`next\` does shadow the builtin \`next()\` *as an attribute*, which is harmless and near-universal in interview code — \`self.next\` and the builtin never occupy the same namespace.

The key mental picture vs a list: a Python \`list\` is **one contiguous block of pointers** — element *i* lives at a computable offset, which is why \`lst[i]\` is O(1). A linked list's nodes are **scattered wherever the allocator put them**; the ORDER exists only in the \`next\` links. To reach the 5000th node you must follow 5000 pointers.

## The honest trade

| Operation | \`list\` | Linked list |
|---|---|---|
| Access by index | O(1) | O(n) |
| Insert/remove at front | O(n) — shift everything | O(1) |
| Insert/remove **just after a node you already hold** | O(n) — shift | O(1) — rewire two pointers |
| Scan all n | O(n), cache-friendly | O(n), cache-**hostile** |

That last row matters more than Big-O suggests: iterating a \`list\` streams through contiguous memory the CPU prefetches; chasing scattered pointers misses cache constantly. At n = 1,000,000, both scans are "O(n)" but the \`list\` scan is often several times faster in practice. Linked lists win only when their O(1) splicing is the operation you actually do.

**A Python-specific note on when NOT to build one:** \`collections.deque\` is already a doubly linked list of blocks, and a plain \`dict\` keeps insertion order, which covers most "I need cheap reordering" cases. Hand-rolling a linked list in production Python is rare; you build one to understand the mechanism and to survive interviews.

**Singly vs doubly:** adding a \`prev\` pointer per node buys O(1) "delete *this* node" (no hunt for the predecessor) and backward traversal, at the cost of a second pointer to keep consistent on every edit.

## The traversal idiom

Every list algorithm is a variation of this walk:

\`\`\`python
cur = head
while cur:
    ...  # use cur.val
    cur = cur.next
\`\`\`

\`cur\` becomes \`None\` exactly when you step past the last node — the loop condition is the end-of-list check. (\`while cur:\` leans on a plain object being truthy; \`while cur is not None:\` says the same thing more explicitly, and is worth preferring if the node type might ever define \`__len__\` or \`__bool__\`.)

## When would I reach for this?

Rarely as a raw structure — lists and deques win most days. You meet linked lists as **internals**: \`deque\` itself, and LRU caches, where a doubly linked list gives O(1) "move this entry to the front". And — unavoidably — interviews, where pointer surgery is a standard test of careful reasoning.`,
    },
    exercises: [
    {
      id: "dsa-list-from-array",
      title: {
        typescript: "Array ⇄ list",
        python: "List \u21c4 linked list",
      },
      instructions: {
        typescript: `Implement \`fromArray(nums)\`: build a linked list from the array, **front to back**, and return the head (or \`null\` for an empty array).

The \`ListNode\` class and the \`toArray\` printer are given complete — don't touch them. Keep a \`tail\` reference while building so each append is O(1); appending by re-walking from the head each time would make construction O(n²).

Expected output:

\`\`\`
[1,2,3]
[42]
[]
\`\`\``,
        python: `Implement \`from_list(nums)\`: build a linked list from the Python list, **front to back**, and return the head (or \`None\` for an empty list).

The \`ListNode\` class and the \`to_list\` printer are given complete — don't touch them. Keep a \`tail\` reference while building so each append is O(1); appending by re-walking from the head each time would make construction O(n²).

Expected output:

\`\`\`
[1, 2, 3]
[42]
[]
\`\`\``,
      },
      starterCode: {
        typescript: `// Course-wide convention: every list exercise uses this ListNode class.
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val: number, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Given complete: walks a list and collects its values (used for printing).
function toArray(head: ListNode | null): number[] {
  const out: number[] = [];
  let cur = head;
  while (cur) {
    out.push(cur.val);
    cur = cur.next;
  }
  return out;
}

function fromArray(nums: number[]): ListNode | null {
  // TODO: build the list front to back.
  // Keep a \`tail\` reference so each append is O(1); return the head.
  return null;
}

console.log(toArray(fromArray([1, 2, 3]))); // expected: [1,2,3]
console.log(toArray(fromArray([42])));      // expected: [42]
console.log(toArray(fromArray([])));        // expected: []`,
        python: `# Course-wide convention: every list exercise uses this ListNode class.
class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next


# Given complete: walks the linked list and collects its values (for printing).
def to_list(head):
    out = []
    cur = head
    while cur:
        out.append(cur.val)
        cur = cur.next
    return out


def from_list(nums):
    # TODO: build the linked list front to back.
    # Keep a \`tail\` reference so each append is O(1); return the head.
    return None


print(to_list(from_list([1, 2, 3])))  # expected: [1, 2, 3]
print(to_list(from_list([42])))       # expected: [42]
print(to_list(from_list([])))         # expected: []
`,
      },
    },
    {
      id: "dsa-list-length-find",
      title: "Walk the list",
      instructions: {
        typescript: `Implement two traversals over the given list (\`ListNode\`, \`fromArray\`, \`toArray\` are provided complete):

- \`listLength(head)\` — walk the list and count nodes. O(n).
- \`contains(head, val)\` — walk the list and return \`true\` as soon as you find \`val\`, \`false\` if you reach the end. O(n) worst case, but return early on a hit — don't keep walking.

Both are the same \`let cur = head; while (cur) { ...; cur = cur.next }\` idiom.

Expected output:

\`\`\`
list: [4,8,15,16,23,42]
length: 6
has 15: true
has 7: false
\`\`\``,
        python: `Implement two traversals over the given list (\`ListNode\`, \`from_list\`, \`to_list\` are provided complete):

- \`list_length(head)\` — walk the list and count nodes. O(n).
- \`contains(head, val)\` — walk the list and return \`True\` as soon as you find \`val\`, \`False\` if you reach the end. O(n) worst case, but return early on a hit — don't keep walking.

Both are the same \`cur = head\` / \`while cur:\` / \`cur = cur.next\` idiom.

Expected output:

\`\`\`
list: [4, 8, 15, 16, 23, 42]
length: 6
has 15: True
has 7: False
\`\`\``,
      },
      starterCode: {
        typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val: number, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Given complete.
function fromArray(nums: number[]): ListNode | null {
  let head: ListNode | null = null;
  let tail: ListNode | null = null;
  for (const n of nums) {
    const node = new ListNode(n);
    if (tail) {
      tail.next = node;
      tail = node;
    } else {
      head = tail = node;
    }
  }
  return head;
}

// Given complete.
function toArray(head: ListNode | null): number[] {
  const out: number[] = [];
  for (let cur = head; cur; cur = cur.next) out.push(cur.val);
  return out;
}

function listLength(head: ListNode | null): number {
  // TODO: walk the list with \`let cur = head; while (cur) ...\`, counting nodes.
  return 0;
}

function contains(head: ListNode | null, val: number): boolean {
  // TODO: walk the list; return true the moment you see \`val\`.
  return false;
}

const sample = fromArray([4, 8, 15, 16, 23, 42]);
console.log("list:", toArray(sample));       // [4,8,15,16,23,42]
console.log("length:", listLength(sample));  // expected: 6
console.log("has 15:", contains(sample, 15)); // expected: true
console.log("has 7:", contains(sample, 7));   // expected: false`,
        python: `class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next


# Given complete.
def from_list(nums):
    head = None
    tail = None
    for n in nums:
        node = ListNode(n)
        if tail:
            tail.next = node
            tail = node
        else:
            head = tail = node
    return head


# Given complete.
def to_list(head):
    out = []
    cur = head
    while cur:
        out.append(cur.val)
        cur = cur.next
    return out


def list_length(head):
    # TODO: walk the list with \`cur = head\` / \`while cur:\`, counting nodes.
    return 0


def contains(head, val):
    # TODO: walk the list; return True the moment you see \`val\`.
    return False


sample = from_list([4, 8, 15, 16, 23, 42])
print("list:", to_list(sample))         # [4, 8, 15, 16, 23, 42]
print("length:", list_length(sample))   # expected: 6
print("has 15:", contains(sample, 15))  # expected: True
print("has 7:", contains(sample, 7))    # expected: False
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-linked-list-basics-q1",
      prompt: "You hold a reference to a node in the middle of a singly linked list. What does it cost to insert a new node immediately after it?",
      options: [
        "O(n) — you must traverse from the head to reach the insertion point",
        "O(n) — the nodes after the insertion point must be shifted over by one",
        "O(log n) — the list must be re-linked from the midpoint",
        "O(1) — allocate the node and rewire two `next` pointers; nothing shifts",
      ],
      answer: 3,
      explanation: {
        typescript: "Insertion at a node you already hold is pure pointer rewiring: `newNode.next = cur.next; cur.next = newNode`. Traversal cost only applies if you must FIND the position first, and shifting is an array behavior — linked lists never shift.",
        python: "Insertion at a node you already hold is pure pointer rewiring: `new_node.next = cur.next` then `cur.next = new_node`. Traversal cost only applies if you must FIND the position first, and shifting is a `list` behavior — linked lists never shift.",
      },
    },
    {
      id: "dsa-linked-list-basics-q2",
      prompt: "Which workload actually favors a linked list over an array?",
      options: [
        "An LRU cache that must move an entry it already holds a node reference to up to the front of the ordering",
        "Reading elements by numeric position inside a hot loop",
        "Scanning millions of records where raw throughput matters",
        "Binary search over a large sorted collection",
      ],
      answer: 0,
      explanation: "Splicing a held node out and relinking it elsewhere is O(1) — the linked list's one real superpower, and exactly what LRU move-to-front needs. Indexing, cache-friendly scanning, and binary search all depend on contiguity or O(1) access by position, which arrays have and lists don't.",
    },
    {
      id: "dsa-linked-list-basics-q3",
      prompt: "You hold a reference to exactly the node you want to delete. Why is this O(1) in a doubly linked list but O(n) in a singly linked list?",
      options: [
        "Doubly linked lists store their nodes contiguously, so deletion is a cheap local shift",
        "Deletion rewires the predecessor's pointer, and only a doubly linked node can reach its predecessor directly via `prev`",
        "In a singly linked list all following nodes must be copied forward by one slot",
        "Doubly linked lists maintain a value-to-node index that singly linked lists lack",
      ],
      answer: 1,
      explanation: "To unlink a node you must change its predecessor's `next`. With a `prev` pointer the predecessor is one hop away; without it you must walk from the head to find it — that walk is the O(n). No copying or shifting is ever involved.",
    },
    ],
  },
  {
    id: "dsa-fast-slow-pointers",
    module: "linked-lists",
    title: "Fast & Slow Pointers",
    blurb: "Two runners at different speeds find middles and cycles.",
    graphics: [
      {
        id: "tortoise-hare",
        title: "Tortoise and hare",
        caption:
          "One pointer steps once, the other twice. They meet in a cycle, or the fast one finds the middle when it hits the end.",
        src: "/lesson-graphics/dsa/dsa-fast-slow-pointers.png",
      },
    ],
    content: {
      typescript: `## Two runners, one list

The fast/slow (or "runner") technique: walk **two** pointers through the same list at different speeds. It answers questions about a list's *shape* — where's the middle? does it loop? — in one pass, with O(1) extra space, without knowing the length up front.

The guard idiom you'll use every time:

\`\`\`ts
let slow = head;
let fast = head;
while (fast && fast.next) {
  slow = slow!.next;      // one step
  fast = fast.next.next;  // two steps
}
\`\`\`

Checking \`fast && fast.next\` before moving is what keeps \`fast.next.next\` from throwing on the last node.

## Middle node in one pass

Fast moves two, slow moves one. When fast hits the end, fast has covered the whole list — so slow, at half the speed, is at the **middle**. No "count the length, then walk n/2" second pass. For even lengths this lands slow on the *second* middle (\`[1,2,3,4]\` → node \`3\`), which is the standard convention.

Both approaches are O(n) time, but one pass matters when the data arrives as a stream you can't rewind, and it's the pattern interviews expect.

## Cycle detection (Floyd)

A cycle is a \`.next\` that points back at an earlier node — the list never ends, and a naive \`while (cur)\` walk spins forever.

The obvious fix you'd write yourself: a \`Set\` of visited nodes, stop when you see a repeat. Works — but costs **O(n) extra memory**.

Floyd's trick: run fast and slow. If there's no cycle, fast falls off the end — done, \`false\`. If there *is* a cycle, both pointers eventually enter it and then run in a circle. Here's the why: once both are inside the cycle, look at the gap from fast to slow (measured around the loop). Each step slow moves 1 and fast moves 2, so **the gap shrinks by exactly 1 per step**. It can't skip from 1 to −1 — it must pass through 0, and gap 0 means \`fast === slow\`. Meeting is guaranteed, in O(n) time and **O(1)** space.

\`\`\`ts
while (fast && fast.next) {
  slow = slow!.next;
  fast = fast.next.next;
  if (slow === fast) return true; // lapped — cycle
}
return false; // ran off the end
\`\`\`

## When would I reach for this?

Any single-pass structural question on a linked sequence: middle, cycle, k-from-the-end (advance fast k first, then move both). More broadly it generalizes to detecting cycles in any "follow the pointer" iteration — e.g. chasing \`redirectTo\` links in config until you either terminate or loop.`,
      python: `## Two runners, one list

The fast/slow (or "runner") technique: walk **two** pointers through the same list at different speeds. It answers questions about a list's *shape* — where's the middle? does it loop? — in one pass, with O(1) extra space, without knowing the length up front.

The guard idiom you'll use every time:

\`\`\`python
slow = head
fast = head
while fast and fast.next:
    slow = slow.next       # one step
    fast = fast.next.next  # two steps
\`\`\`

Checking \`fast and fast.next\` before moving is what keeps \`fast.next.next\` from raising \`AttributeError\` on the last node. Python's \`and\` short-circuits, so the order of those two checks is load-bearing — swap them and the guard raises on exactly the case it exists to prevent.

## Middle node in one pass

Fast moves two, slow moves one. When fast hits the end, fast has covered the whole list — so slow, at half the speed, is at the **middle**. No "count the length, then walk n/2" second pass. For even lengths this lands slow on the *second* middle (\`[1,2,3,4]\` → node \`3\`), which is the standard convention.

Both approaches are O(n) time, but one pass matters when the data arrives as a stream you can't rewind, and it's the pattern interviews expect.

## Cycle detection (Floyd)

A cycle is a \`.next\` that points back at an earlier node — the list never ends, and a naive \`while cur:\` walk spins forever.

The obvious fix you'd write yourself: a \`set\` of visited nodes, stop when you see a repeat. Works — a \`set\` of nodes hashes by identity, which is exactly the comparison you want — but it costs **O(n) extra memory**.

Floyd's trick: run fast and slow. If there's no cycle, fast falls off the end — done, \`False\`. If there *is* a cycle, both pointers eventually enter it and then run in a circle. Here's the why: once both are inside the cycle, look at the gap from fast to slow (measured around the loop). Each step slow moves 1 and fast moves 2, so **the gap shrinks by exactly 1 per step**. It can't skip from 1 to −1 — it must pass through 0, and gap 0 means \`fast is slow\`. Meeting is guaranteed, in O(n) time and **O(1)** space.

\`\`\`python
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
    if slow is fast:
        return True  # lapped — cycle
return False  # ran off the end
\`\`\`

Use \`is\`, not \`==\`, for that comparison: you are asking whether the two pointers are at the *same node*, not whether two nodes hold equal values. With a custom class the two happen to coincide (the default \`__eq__\` is identity), but \`is\` states the intent and keeps working if the class ever grows a value-based \`__eq__\`.

## When would I reach for this?

Any single-pass structural question on a linked sequence: middle, cycle, k-from-the-end (advance fast k first, then move both). More broadly it generalizes to detecting cycles in any "follow the pointer" iteration — e.g. chasing \`redirect_to\` links in config until you either terminate or loop.`,
    },
    exercises: [
    {
      id: "dsa-middle-node",
      title: "Find the middle",
      instructions: {
        typescript: `Implement \`middleNode(head)\` using **fast/slow pointers**: fast advances two nodes per step, slow advances one; when fast can't move anymore, slow is at the middle.

Do **not** count the length first and walk again — the single pass is the point of the exercise. Guard the loop with \`while (fast && fast.next)\`.

For even-length lists, return the **second** middle (that's what the guard above gives you naturally): \`[10, 20, 30, 40]\` → the node with \`30\`.

Expected output:

\`\`\`
[1,2,3,4,5] -> middle: 3
[10,20,30,40] -> middle: 30
\`\`\``,
        python: `Implement \`middle_node(head)\` using **fast/slow pointers**: fast advances two nodes per step, slow advances one; when fast can't move anymore, slow is at the middle.

Do **not** count the length first and walk again — the single pass is the point of the exercise. Guard the loop with \`while fast and fast.next:\`.

For even-length lists, return the **second** middle (that's what the guard above gives you naturally): \`[10, 20, 30, 40]\` → the node with \`30\`.

Expected output:

\`\`\`
[1, 2, 3, 4, 5] -> middle: 3
[10, 20, 30, 40] -> middle: 30
\`\`\``,
      },
      starterCode: {
        typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val: number, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Given complete.
function fromArray(nums: number[]): ListNode | null {
  let head: ListNode | null = null;
  let tail: ListNode | null = null;
  for (const n of nums) {
    const node = new ListNode(n);
    if (tail) {
      tail.next = node;
      tail = node;
    } else {
      head = tail = node;
    }
  }
  return head;
}

// Given complete.
function toArray(head: ListNode | null): number[] {
  const out: number[] = [];
  for (let cur = head; cur; cur = cur.next) out.push(cur.val);
  return out;
}

function middleNode(head: ListNode | null): ListNode | null {
  // TODO: fast/slow pointers — fast advances two, slow advances one.
  // Guard with \`while (fast && fast.next)\`. One pass, no length precount.
  return null;
}

const odd = fromArray([1, 2, 3, 4, 5]);
console.log(toArray(odd), "-> middle:", middleNode(odd)?.val ?? null);  // expected middle: 3

const even = fromArray([10, 20, 30, 40]);
console.log(toArray(even), "-> middle:", middleNode(even)?.val ?? null); // expected middle: 30 (second middle)`,
        python: `class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next


# Given complete.
def from_list(nums):
    head = None
    tail = None
    for n in nums:
        node = ListNode(n)
        if tail:
            tail.next = node
            tail = node
        else:
            head = tail = node
    return head


# Given complete.
def to_list(head):
    out = []
    cur = head
    while cur:
        out.append(cur.val)
        cur = cur.next
    return out


def middle_node(head):
    # TODO: fast/slow pointers — fast advances two, slow advances one.
    # Guard with \`while fast and fast.next:\`. One pass, no length precount.
    return None


odd = from_list([1, 2, 3, 4, 5])
mid = middle_node(odd)
print(to_list(odd), "-> middle:", mid.val if mid else None)   # expected middle: 3

even = from_list([10, 20, 30, 40])
mid = middle_node(even)
print(to_list(even), "-> middle:", mid.val if mid else None)  # expected middle: 30
`,
      },
    },
    {
      id: "dsa-detect-cycle",
      title: "Detect a cycle",
      instructions: {
        typescript: `Implement \`hasCycle(head)\` with Floyd's fast/slow pointers: slow moves one, fast moves two, inside \`while (fast && fast.next)\`. If \`fast === slow\` ever holds after moving, fast has lapped slow inside a cycle — return \`true\`. If the loop exits, fast ran off the end — return \`false\`.

Use O(1) extra space — no \`Set\` of visited nodes (that works, but costs O(n) memory).

The starter hand-builds a cyclic list (a \`.next\` assigned back to an earlier node) and an acyclic one. Don't try to print the cyclic list — walking it never ends.

Expected output:

\`\`\`
straight has cycle: false
looped has cycle: true
empty has cycle: false
\`\`\``,
        python: `Implement \`has_cycle(head)\` with Floyd's fast/slow pointers: slow moves one, fast moves two, inside \`while fast and fast.next:\`. If \`slow is fast\` ever holds after moving, fast has lapped slow inside a cycle — return \`True\`. If the loop exits, fast ran off the end — return \`False\`.

Compare with \`is\`, not \`==\`: the question is whether both pointers sit on the *same node*, not whether two nodes hold equal values.

Use O(1) extra space — no \`set\` of visited nodes (that works, but costs O(n) memory).

The starter hand-builds a cyclic list (a \`.next\` assigned back to an earlier node) and an acyclic one. Don't try to print the cyclic list — walking it never ends.

Expected output:

\`\`\`
straight has cycle: False
looped has cycle: True
empty has cycle: False
\`\`\``,
      },
      starterCode: {
        typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val: number, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

function hasCycle(head: ListNode | null): boolean {
  // TODO: Floyd's fast/slow. Advance fast by two and slow by one inside
  // \`while (fast && fast.next)\`; if they ever point at the SAME node
  // (fast === slow), there is a cycle. Falling off the end means no cycle.
  return false;
}

// Acyclic list: 1 -> 2 -> 3 -> null
const straight = new ListNode(1, new ListNode(2, new ListNode(3)));

// Cyclic list: 1 -> 2 -> 3 -> back to 2. A cycle is just a .next that
// points at an EARLIER node instead of null — built here by hand:
const a = new ListNode(1);
const b = new ListNode(2);
const c = new ListNode(3);
a.next = b;
b.next = c;
c.next = b; // closes the loop (never print this list — walking it loops forever)

console.log("straight has cycle:", hasCycle(straight)); // expected: false
console.log("looped has cycle:", hasCycle(a));          // expected: true
console.log("empty has cycle:", hasCycle(null));        // expected: false`,
        python: `class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next


def has_cycle(head):
    # TODO: Floyd's fast/slow. Advance fast by two and slow by one inside
    # \`while fast and fast.next:\`; if they ever point at the SAME node
    # (slow is fast), there is a cycle. Falling off the end means no cycle.
    return False


# Acyclic list: 1 -> 2 -> 3 -> None
straight = ListNode(1, ListNode(2, ListNode(3)))

# Cyclic list: 1 -> 2 -> 3 -> back to 2. A cycle is just a .next that
# points at an EARLIER node instead of None — built here by hand:
a = ListNode(1)
b = ListNode(2)
c = ListNode(3)
a.next = b
b.next = c
c.next = b  # closes the loop (never print this list — walking it loops forever)

print("straight has cycle:", has_cycle(straight))  # expected: False
print("looped has cycle:", has_cycle(a))           # expected: True
print("empty has cycle:", has_cycle(None))         # expected: False
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-fast-slow-pointers-q1",
      prompt: "In Floyd's cycle detection, why can't `fast` just keep jumping over `slow` forever inside a cycle?",
      options: [
        "Because `fast` restarts from the head each time it completes a lap",
        "Because both pointers are guaranteed to meet exactly at the node where the cycle begins",
        "Once both pointers are in the cycle, the gap between them shrinks by exactly one node per step, so it must reach zero",
        "It can — which is why a visited-`Set` check is still required as a backup",
      ],
      answer: 2,
      explanation: {
        typescript: "Per step, slow gains 1 and fast gains 2, so fast closes on slow by exactly 1 node per step (measured around the loop). A gap can't go from 1 to −1 without passing through 0, and gap 0 means `fast === slow`. The meeting point is generally NOT the cycle's start.",
        python: "Per step, slow gains 1 and fast gains 2, so fast closes on slow by exactly 1 node per step (measured around the loop). A gap can’t go from 1 to −1 without passing through 0, and gap 0 means `slow is fast`. The meeting point is generally NOT the cycle’s start.",
      },
    },
    {
      id: "dsa-fast-slow-pointers-q2",
      prompt: "You need cycle detection on lists of ~10 million nodes in a memory-constrained service. Why prefer Floyd's algorithm over a `Set` of visited nodes?",
      options: {
        typescript: [
        "Floyd runs in O(log n) time while the Set approach is O(n)",
        "The Set approach can return false positives when different nodes hold equal values",
        "Floyd is O(n) time while the Set approach degrades to O(n²)",
        "Both are O(n) time, but Floyd needs O(1) space while the Set may hold all 10M node references",
        ],
        python: [
        "Floyd runs in O(log n) time while the `set` approach is O(n)",
        "The `set` approach can return false positives when different nodes hold equal values",
        "Floyd is O(n) time while the `set` approach degrades to O(n²)",
        "Both are O(n) time, but Floyd needs O(1) space while the `set` may hold all 10M node references",
      ],
      },
      answer: 3,
      explanation: {
        typescript: "Time is O(n) either way — the win is space: two pointers versus a Set that can grow to n entries. A `Set` of node objects compares by reference, not value, so equal values cause no false positives; that option is the classic identity-vs-value confusion.",
        python: "Time is O(n) either way — the win is space: two pointers versus a `set` that can grow to n entries. A `set` of nodes hashes by identity (the default `__hash__`), not by value, so equal values cause no false positives; that option is the classic identity-vs-value confusion.",
      },
    },
    {
      id: "dsa-fast-slow-pointers-q3",
      prompt: {
        typescript: "With the standard guard `while (fast && fast.next)`, where does `slow` stop on the even-length list `[1, 2, 3, 4]`?",
        python: "With the standard guard `while fast and fast.next:`, where does `slow` stop on the even-length list `[1, 2, 3, 4]`?",
      },
      options: [
        "On `3` — the second of the two middle nodes",
        "On `2` — the first of the two middle nodes",
        "On `4` — the final node",
        "It depends on whether the list length was known in advance",
      ],
      answer: 0,
      explanation: {
        typescript: "After one step slow is at 2 and fast at 3; after two steps slow is at 3 and fast is null, ending the loop. This guard always yields the second middle for even lengths — to get the first middle you'd start `fast` at `head.next`. No length knowledge is involved; that's the point of the technique.",
        python: "After one step slow is at 2 and fast at 3; after two steps slow is at 3 and fast is `None`, ending the loop. This guard always yields the second middle for even lengths — to get the first middle you’d start `fast` at `head.next`. No length knowledge is involved; that’s the point of the technique.",
      },
    },
    ],
  },
  {
    id: "dsa-reverse-list",
    module: "linked-lists",
    title: "Reversing In Place",
    blurb: "The prev/cur/next pointer dance, and in-place edits generally.",
    graphics: [
      {
        id: "flip-links",
        title: "Flip the arrows",
        caption:
          "In-place reverse rewires next pointers with a prev/cur/next dance — same nodes, opposite direction, O(1) extra space.",
        src: "/lesson-graphics/dsa/dsa-reverse-list.png",
      },
    ],
    content: {
      typescript: `## The pointer dance

Reversing a linked list in place is *the* signature list interview question — not because reversing is useful daily, but because it's the cleanest test of disciplined pointer surgery.

The cheap way out — copy values to an array, reverse, rebuild — is O(n) extra space. The in-place version is O(n) time, **O(1)** space: walk the list once, flipping each \`next\` to point backward.

\`\`\`ts
let prev: ListNode | null = null;
let cur = head;
while (cur) {
  const nxt = cur.next; // 1. save — this reference is about to be destroyed
  cur.next = prev;      // 2. flip the link backward
  prev = cur;           // 3. advance prev
  cur = nxt;            // 4. advance cur (using the saved reference)
}
return prev; // prev is the new head; cur is null
\`\`\`

Step 1 is the whole game. \`cur.next\` is your **only** route to the rest of the list; overwrite it before saving and everything past \`cur\` is unreachable — silently, no error. That's the general discipline for *any* in-place list edit: **grab the reference you're about to destroy first.**

## Removal: linking around a node

Deleting a node means making its predecessor skip it:

\`\`\`ts
prev.next = cur.next; // cur is now unlinked; GC reclaims it
\`\`\`

Which immediately raises an edge case: what if the node to remove **is the head**? There's no predecessor to rewire, so you'd need a separate \`if\` branch that reassigns \`head\`... and another branch if *several* leading nodes all match.

## The dummy head: an edge-case killer

Manufacture a predecessor. Allocate one throwaway node in front of the real head, run one uniform loop, return \`dummy.next\`:

\`\`\`ts
const dummy = new ListNode(0, head);
let cur = dummy;
while (cur.next) {
  if (shouldRemove(cur.next)) cur.next = cur.next.next;
  else cur = cur.next;
}
return dummy.next; // the true head, whatever it now is
\`\`\`

Now *every* node has a predecessor — the head isn't special anymore, and the branch disappears. This is worth generalizing: when an algorithm sprouts special cases at a boundary, look for a small structural change (a sentinel) that makes the boundary case identical to the normal case. One allocated node buys you a branch-free loop; that trade is almost always right.

## When would I reach for this?

Dummy/sentinel nodes: any time you build or edit a list front to back (merging, filtering, partitioning). In-place reversal itself: interviews, and as a building block (reverse-in-groups, palindrome checks via reverse-second-half).`,
      python: `## The pointer dance

Reversing a linked list in place is *the* signature list interview question — not because reversing is useful daily, but because it's the cleanest test of disciplined pointer surgery.

The cheap way out — copy values to a \`list\`, reverse, rebuild — is O(n) extra space. The in-place version is O(n) time, **O(1)** space: walk the list once, flipping each \`next\` to point backward.

\`\`\`python
prev = None
cur = head
while cur:
    nxt = cur.next   # 1. save — this reference is about to be destroyed
    cur.next = prev  # 2. flip the link backward
    prev = cur       # 3. advance prev
    cur = nxt        # 4. advance cur (using the saved reference)
return prev  # prev is the new head; cur is None
\`\`\`

Step 1 is the whole game. \`cur.next\` is your **only** route to the rest of the list; overwrite it before saving and everything past \`cur\` is unreachable — silently, no error. That's the general discipline for *any* in-place list edit: **grab the reference you're about to destroy first.**

Python does let you compress the dance into one line — \`cur.next, prev, cur = prev, cur, cur.next\` — because the right-hand side is fully evaluated before any assignment happens, which saves the old \`cur.next\` for you. It's a genuinely correct one-liner and a nice demonstration of tuple assignment. Write the four-line version first anyway: in an interview the explicit save is what shows you understand *why* the order matters, and the one-liner hides exactly the step being tested.

## Removal: linking around a node

Deleting a node means making its predecessor skip it:

\`\`\`python
prev.next = cur.next  # cur is now unlinked; the GC reclaims it
\`\`\`

Which immediately raises an edge case: what if the node to remove **is the head**? There's no predecessor to rewire, so you'd need a separate \`if\` branch that reassigns \`head\`... and another branch if *several* leading nodes all match.

## The dummy head: an edge-case killer

Manufacture a predecessor. Allocate one throwaway node in front of the real head, run one uniform loop, return \`dummy.next\`:

\`\`\`python
dummy = ListNode(0, head)
cur = dummy
while cur.next:
    if should_remove(cur.next):
        cur.next = cur.next.next
    else:
        cur = cur.next
return dummy.next  # the true head, whatever it now is
\`\`\`

Now *every* node has a predecessor — the head isn't special anymore, and the branch disappears. This is worth generalizing: when an algorithm sprouts special cases at a boundary, look for a small structural change (a sentinel) that makes the boundary case identical to the normal case. One allocated node buys you a branch-free loop; that trade is almost always right.

## When would I reach for this?

Dummy/sentinel nodes: any time you build or edit a list front to back (merging, filtering, partitioning). In-place reversal itself: interviews, and as a building block (reverse-in-groups, palindrome checks via reverse-second-half).`,
    },
    exercises: [
    {
      id: "dsa-reverse-in-place",
      title: "Reverse the list",
      instructions: {
        typescript: `Implement \`reverseList(head)\` **in place** with the prev/cur walk — O(n) time, O(1) extra space. Converting to an array and rebuilding is not allowed (that's O(n) space and dodges the pointer discipline this exercise exists to teach).

Per step: save \`cur.next\` first, flip \`cur.next\` to point at \`prev\`, then advance both pointers. Return \`prev\` — it ends up on the old tail, which is the new head. Order matters: overwrite \`cur.next\` before saving it and you lose the rest of the list.

Expected output:

\`\`\`
before: [1,2,3,4,5]
after:  [5,4,3,2,1]
\`\`\``,
        python: `Implement \`reverse_list(head)\` **in place** with the prev/cur walk — O(n) time, O(1) extra space. Converting to a \`list\` and rebuilding is not allowed (that's O(n) space and dodges the pointer discipline this exercise exists to teach).

Per step: save \`cur.next\` first, flip \`cur.next\` to point at \`prev\`, then advance both pointers. Return \`prev\` — it ends up on the old tail, which is the new head. Order matters: overwrite \`cur.next\` before saving it and you lose the rest of the list.

Write the explicit four-line version rather than the \`cur.next, prev, cur = prev, cur, cur.next\` one-liner. The one-liner is correct — tuple assignment evaluates the whole right side first — but it hides the save-before-destroy step that is the entire point here.

Expected output:

\`\`\`
before: [1, 2, 3, 4, 5]
after:  [5, 4, 3, 2, 1]
\`\`\``,
      },
      starterCode: {
        typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val: number, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Given complete.
function fromArray(nums: number[]): ListNode | null {
  let head: ListNode | null = null;
  let tail: ListNode | null = null;
  for (const n of nums) {
    const node = new ListNode(n);
    if (tail) {
      tail.next = node;
      tail = node;
    } else {
      head = tail = node;
    }
  }
  return head;
}

// Given complete.
function toArray(head: ListNode | null): number[] {
  const out: number[] = [];
  for (let cur = head; cur; cur = cur.next) out.push(cur.val);
  return out;
}

function reverseList(head: ListNode | null): ListNode | null {
  // TODO: prev/cur walk. Each step: save cur.next FIRST, point cur.next
  // at prev, then advance prev and cur. Return prev (the new head).
  return head; // placeholder: list unchanged
}

const listHead = fromArray([1, 2, 3, 4, 5]);
console.log("before:", toArray(listHead)); // [1,2,3,4,5]
const reversed = reverseList(listHead);
console.log("after: ", toArray(reversed)); // expected: [5,4,3,2,1]`,
        python: `class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next


# Given complete.
def from_list(nums):
    head = None
    tail = None
    for n in nums:
        node = ListNode(n)
        if tail:
            tail.next = node
            tail = node
        else:
            head = tail = node
    return head


# Given complete.
def to_list(head):
    out = []
    cur = head
    while cur:
        out.append(cur.val)
        cur = cur.next
    return out


def reverse_list(head):
    # TODO: prev/cur walk. Each step: save cur.next FIRST, point cur.next
    # at prev, then advance prev and cur. Return prev (the new head).
    return head  # placeholder: list unchanged


list_head = from_list([1, 2, 3, 4, 5])
print("before:", to_list(list_head))  # [1, 2, 3, 4, 5]
reversed_head = reverse_list(list_head)
print("after: ", to_list(reversed_head))  # expected: [5, 4, 3, 2, 1]
`,
      },
    },
    {
      id: "dsa-remove-value",
      title: "Remove every match",
      instructions: {
        typescript: `Implement \`removeValue(head, val)\`: delete **every** node whose value equals \`val\`, by linking around it (\`cur.next = cur.next.next\`).

The point of this exercise is the **dummy-head trick**: allocate one sentinel node in front of the real head (\`new ListNode(0, head)\`) and walk from it, always inspecting \`cur.next\`. Because every real node now has a predecessor, removing the head (or several leading matches, or the entire list) needs **no special case** — one uniform loop. Return \`dummy.next\`.

The first example's head must be removed — if you wrote an \`if\` just for that, revisit the dummy.

Expected output:

\`\`\`
[1,2,3]
[1,1]
[]
\`\`\``,
        python: `Implement \`remove_value(head, val)\`: delete **every** node whose value equals \`val\`, by linking around it (\`cur.next = cur.next.next\`).

The point of this exercise is the **dummy-head trick**: allocate one sentinel node in front of the real head (\`ListNode(0, head)\`) and walk from it, always inspecting \`cur.next\`. Because every real node now has a predecessor, removing the head (or several leading matches, or the entire list) needs **no special case** — one uniform loop. Return \`dummy.next\`.

The first example's head must be removed — if you wrote an \`if\` just for that, revisit the dummy.

Expected output:

\`\`\`
[1, 2, 3]
[1, 1]
[]
\`\`\``,
      },
      starterCode: {
        typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val: number, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

// Given complete.
function fromArray(nums: number[]): ListNode | null {
  let head: ListNode | null = null;
  let tail: ListNode | null = null;
  for (const n of nums) {
    const node = new ListNode(n);
    if (tail) {
      tail.next = node;
      tail = node;
    } else {
      head = tail = node;
    }
  }
  return head;
}

// Given complete.
function toArray(head: ListNode | null): number[] {
  const out: number[] = [];
  for (let cur = head; cur; cur = cur.next) out.push(cur.val);
  return out;
}

function removeValue(head: ListNode | null, val: number): ListNode | null {
  // TODO: create a dummy node whose .next is head, then walk with \`cur\`
  // starting at the dummy: if cur.next.val === val, link around it
  // (cur.next = cur.next.next), else advance. Return dummy.next.
  return head; // placeholder: list unchanged
}

// Head itself must be removed here — the dummy makes it a non-event:
console.log(toArray(removeValue(fromArray([7, 1, 7, 2, 7, 3]), 7))); // expected: [1,2,3]
console.log(toArray(removeValue(fromArray([1, 2, 2, 1]), 2)));       // expected: [1,1]
console.log(toArray(removeValue(fromArray([5, 5, 5]), 5)));          // expected: []`,
        python: `class ListNode:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next


# Given complete.
def from_list(nums):
    head = None
    tail = None
    for n in nums:
        node = ListNode(n)
        if tail:
            tail.next = node
            tail = node
        else:
            head = tail = node
    return head


# Given complete.
def to_list(head):
    out = []
    cur = head
    while cur:
        out.append(cur.val)
        cur = cur.next
    return out


def remove_value(head, val):
    # TODO: create a dummy node whose .next is head, then walk with \`cur\`
    # starting at the dummy: if cur.next.val == val, link around it
    # (cur.next = cur.next.next), else advance. Return dummy.next.
    return head  # placeholder: list unchanged


# Head itself must be removed here — the dummy makes it a non-event:
print(to_list(remove_value(from_list([7, 1, 7, 2, 7, 3]), 7)))  # expected: [1, 2, 3]
print(to_list(remove_value(from_list([1, 2, 2, 1]), 2)))        # expected: [1, 1]
print(to_list(remove_value(from_list([5, 5, 5]), 5)))           # expected: []
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-reverse-list-q1",
      prompt: "Mid-reversal you're at `cur`. Why must the code save `cur.next` into a temp before executing `cur.next = prev`?",
      options: [
        "Because assigning to `cur.next` throws a runtime error if the old value hasn't been read",
        "The temp is only a readability nicety — the loop works fine without it",
        "That pointer is the only path to the unvisited remainder of the list — overwrite it first and the walk has nowhere left to advance",
        "Saving it prevents the garbage collector from reclaiming the remaining nodes mid-loop",
      ],
      answer: 2,
      explanation: "Nothing throws and GC isn't the issue — the failure is silent: after the overwrite, the unvisited remainder is unreachable — the walk dead-ends into the already-reversed side and the rest of the list is simply gone. Save-before-destroy is the core discipline of every in-place list edit.",
    },
    {
      id: "dsa-reverse-list-q2",
      prompt: "How does in-place reversal compare to copy-to-array, reverse, and rebuild, for a list of n nodes?",
      options: [
        "In-place is O(n²) because each pointer flip has to re-walk the list",
        "The array version is asymptotically faster because arrays are cache-friendly",
        "In-place needs O(log n) space for its recursion stack",
        "Both are O(n) time, but in-place uses O(1) extra space versus O(n) for the copy",
      ],
      answer: 3,
      explanation: "The in-place walk visits each node once doing constant work — O(n) time, three pointer variables of space. Cache friendliness improves the array version's constants, not its asymptotics, and the iterative pointer dance uses no recursion at all.",
    },
    {
      id: "dsa-reverse-list-q3",
      prompt: "What does the dummy (sentinel) head node buy you when removing all matching values from a list?",
      options: [
        "Every real node — including the head — now has a predecessor, so one uniform loop handles head removal with no special-case branch",
        "It makes each removal O(1) instead of O(n)",
        "It guards the loop against lists that contain a cycle",
        "It caches the list length so the loop knows when to stop",
      ],
      answer: 0,
      explanation: "Removal was already O(1) per node once you're standing at the predecessor — the dummy's job is purely structural: it manufactures a predecessor for the head so the 'remove the first node(s)' branch disappears. Sentinels are edge-case killers, not speed-ups.",
    },
    ],
  },
];
