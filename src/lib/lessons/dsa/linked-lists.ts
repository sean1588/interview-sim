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
    content: `## Nodes and links

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
    exercises: [
    {
      id: "dsa-list-from-array",
      title: "Array ⇄ list",
      instructions: `Implement \`fromArray(nums)\`: build a linked list from the array, **front to back**, and return the head (or \`null\` for an empty array).

The \`ListNode\` class and the \`toArray\` printer are given complete — don't touch them. Keep a \`tail\` reference while building so each append is O(1); appending by re-walking from the head each time would make construction O(n²).

Expected output:

\`\`\`
[1,2,3]
[42]
[]
\`\`\``,
      starterCode: `// Course-wide convention: every list exercise uses this ListNode class.
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
    },
    {
      id: "dsa-list-length-find",
      title: "Walk the list",
      instructions: `Implement two traversals over the given list (\`ListNode\`, \`fromArray\`, \`toArray\` are provided complete):

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
      starterCode: `class ListNode {
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
      explanation: "Insertion at a node you already hold is pure pointer rewiring: `newNode.next = cur.next; cur.next = newNode`. Traversal cost only applies if you must FIND the position first, and shifting is an array behavior — linked lists never shift.",
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
    content: `## Two runners, one list

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
    exercises: [
    {
      id: "dsa-middle-node",
      title: "Find the middle",
      instructions: `Implement \`middleNode(head)\` using **fast/slow pointers**: fast advances two nodes per step, slow advances one; when fast can't move anymore, slow is at the middle.

Do **not** count the length first and walk again — the single pass is the point of the exercise. Guard the loop with \`while (fast && fast.next)\`.

For even-length lists, return the **second** middle (that's what the guard above gives you naturally): \`[10, 20, 30, 40]\` → the node with \`30\`.

Expected output:

\`\`\`
[1,2,3,4,5] -> middle: 3
[10,20,30,40] -> middle: 30
\`\`\``,
      starterCode: `class ListNode {
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
    },
    {
      id: "dsa-detect-cycle",
      title: "Detect a cycle",
      instructions: `Implement \`hasCycle(head)\` with Floyd's fast/slow pointers: slow moves one, fast moves two, inside \`while (fast && fast.next)\`. If \`fast === slow\` ever holds after moving, fast has lapped slow inside a cycle — return \`true\`. If the loop exits, fast ran off the end — return \`false\`.

Use O(1) extra space — no \`Set\` of visited nodes (that works, but costs O(n) memory).

The starter hand-builds a cyclic list (a \`.next\` assigned back to an earlier node) and an acyclic one. Don't try to print the cyclic list — walking it never ends.

Expected output:

\`\`\`
straight has cycle: false
looped has cycle: true
empty has cycle: false
\`\`\``,
      starterCode: `class ListNode {
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
      explanation: "Per step, slow gains 1 and fast gains 2, so fast closes on slow by exactly 1 node per step (measured around the loop). A gap can't go from 1 to −1 without passing through 0, and gap 0 means `fast === slow`. The meeting point is generally NOT the cycle's start.",
    },
    {
      id: "dsa-fast-slow-pointers-q2",
      prompt: "You need cycle detection on lists of ~10 million nodes in a memory-constrained service. Why prefer Floyd's algorithm over a `Set` of visited nodes?",
      options: [
        "Floyd runs in O(log n) time while the Set approach is O(n)",
        "The Set approach can return false positives when different nodes hold equal values",
        "Floyd is O(n) time while the Set approach degrades to O(n²)",
        "Both are O(n) time, but Floyd needs O(1) space while the Set may hold all 10M node references",
      ],
      answer: 3,
      explanation: "Time is O(n) either way — the win is space: two pointers versus a Set that can grow to n entries. A `Set` of node objects compares by reference, not value, so equal values cause no false positives; that option is the classic identity-vs-value confusion.",
    },
    {
      id: "dsa-fast-slow-pointers-q3",
      prompt: "With the standard guard `while (fast && fast.next)`, where does `slow` stop on the even-length list `[1, 2, 3, 4]`?",
      options: [
        "On `3` — the second of the two middle nodes",
        "On `2` — the first of the two middle nodes",
        "On `4` — the final node",
        "It depends on whether the list length was known in advance",
      ],
      answer: 0,
      explanation: "After one step slow is at 2 and fast at 3; after two steps slow is at 3 and fast is null, ending the loop. This guard always yields the second middle for even lengths — to get the first middle you'd start `fast` at `head.next`. No length knowledge is involved; that's the point of the technique.",
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
    content: `## The pointer dance

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
    exercises: [
    {
      id: "dsa-reverse-in-place",
      title: "Reverse the list",
      instructions: `Implement \`reverseList(head)\` **in place** with the prev/cur walk — O(n) time, O(1) extra space. Converting to an array and rebuilding is not allowed (that's O(n) space and dodges the pointer discipline this exercise exists to teach).

Per step: save \`cur.next\` first, flip \`cur.next\` to point at \`prev\`, then advance both pointers. Return \`prev\` — it ends up on the old tail, which is the new head. Order matters: overwrite \`cur.next\` before saving it and you lose the rest of the list.

Expected output:

\`\`\`
before: [1,2,3,4,5]
after:  [5,4,3,2,1]
\`\`\``,
      starterCode: `class ListNode {
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
    },
    {
      id: "dsa-remove-value",
      title: "Remove every match",
      instructions: `Implement \`removeValue(head, val)\`: delete **every** node whose value equals \`val\`, by linking around it (\`cur.next = cur.next.next\`).

The point of this exercise is the **dummy-head trick**: allocate one sentinel node in front of the real head (\`new ListNode(0, head)\`) and walk from it, always inspecting \`cur.next\`. Because every real node now has a predecessor, removing the head (or several leading matches, or the entire list) needs **no special case** — one uniform loop. Return \`dummy.next\`.

The first example's head must be removed — if you wrote an \`if\` just for that, revisit the dummy.

Expected output:

\`\`\`
[1,2,3]
[1,1]
[]
\`\`\``,
      starterCode: `class ListNode {
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
