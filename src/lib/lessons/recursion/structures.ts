import type { Lesson } from "../types";

export const structuresLessons: Lesson[] = [
  {
    id: "rec-linked-lists",
    module: "structures",
    title: "Walking a Linked List",
    blurb: {
      typescript: "The simplest recursive structure: one node, then the rest of the list.",
      python: "The simplest recursive structure: one node, then the rest of the list.",
    },
    graphics: [
      {
        id: "list-walk",
        title: "Head, then the rest",
        caption:
          "A linked list is recursive by definition: a node plus a list. One frame per node means the walk is n deep, which is why long lists want a loop.",
        src: "/lesson-graphics/recursion/rec-linked-lists.png",
      },
    ],
    content: {
      typescript: `# Walking a Linked List

A linked list is the smallest structure that is genuinely recursive by *definition*: a list is either empty, or a node holding a value and **a list**. That definition writes the code for you.

\`\`\`ts
class ListNode {
  val: number;
  next: ListNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

function listSum(head: ListNode | null): number {
  if (head === null) return 0;             // base case: the empty list
  return head.val + listSum(head.next);    // this node + the rest
}
\`\`\`

Two things to notice, because they generalize to every structure in this module:

- The base case is the **empty** case (\`null\`), not "the last node". Guarding \`head.next === null\` instead would force you to handle an empty list separately and would blow up on \`listSum(null)\`.
- The recursive call is on \`head.next\`, which is *the same kind of thing*, one shorter. Progress is structural: you can't loop forever on a finite acyclic list.

## The unwind gives you reverse for free

Want the values backwards? Don't reverse anything — just do the work *after* the recursive call, so it happens as the stack unwinds:

\`\`\`ts
function printForward(head: ListNode | null): void {
  if (head === null) return;
  console.log(head.val);        // before the call: head → tail
  printForward(head.next);
}

function printBackward(head: ListNode | null): void {
  if (head === null) return;
  printBackward(head.next);
  console.log(head.val);        // after the call: tail → head
}
\`\`\`

One line moved, opposite order. Doing this with a loop requires an explicit stack — which is precisely what the recursion was giving you.

## Recursive reverse

Rewiring the links recursively is the classic exercise, and it's worth reading slowly:

\`\`\`ts
function reverse(head: ListNode | null): ListNode | null {
  if (head === null || head.next === null) return head;  // 0 or 1 node
  const newHead = reverse(head.next);   // trust it: the tail is now reversed
  head.next.next = head;                // the node after me should point BACK at me
  head.next = null;                     // and I become the new tail
  return newHead;                       // the new head never changes as we unwind
}
\`\`\`

The leap of faith is doing all the work here. After \`reverse(head.next)\` returns, everything past \`head\` is reversed and \`head.next\` is now the *last* node of that reversed section — so pointing it back at \`head\` appends \`head\` to the end. The two base cases exist because \`head.next.next\` needs \`head.next\` to be a real node.

## When not to

Depth here is \`n\` — one frame per node, all alive at once. That's fine for a 50-item list and a \`RangeError\` for a 100,000-item one. Linked lists are a *sequence*: one successor per step, no branching, so the iterative version (\`while (cur !== null) cur = cur.next\`) is both safer and no harder to read. Recurse on a list to learn the shape and to get the free unwind on short lists; loop on it in production.

For the iterative patterns — fast/slow pointers, in-place surgery — see the DSA course's [linked list module](/learn/dsa/dsa-linked-list-basics).`,
      python: `# Walking a Linked List

A linked list is the smallest structure that is genuinely recursive by *definition*: a list is either empty, or a node holding a value and **a list**. That definition writes the code for you.

\`\`\`python
class ListNode:
    def __init__(self, val):
        self.val = val
        self.next = None


def list_sum(head):
    if head is None:
        return 0                            # base case: the empty list
    return head.val + list_sum(head.next)   # this node + the rest
\`\`\`

Two things to notice, because they generalize to every structure in this module:

- The base case is the **empty** case (\`None\`), not "the last node". Guarding \`head.next is None\` instead would force you to handle an empty list separately and would raise \`AttributeError\` on \`list_sum(None)\`.
- The recursive call is on \`head.next\`, which is *the same kind of thing*, one shorter. Progress is structural: you can't loop forever on a finite acyclic list.

## The unwind gives you reverse for free

Want the values backwards? Don't reverse anything — just do the work *after* the recursive call, so it happens as the stack unwinds:

\`\`\`python
def print_forward(head):
    if head is None:
        return
    print(head.val)          # before the call: head → tail
    print_forward(head.next)


def print_backward(head):
    if head is None:
        return
    print_backward(head.next)
    print(head.val)          # after the call: tail → head
\`\`\`

One line moved, opposite order. Doing this with a loop requires an explicit stack — which is precisely what the recursion was giving you.

## Recursive reverse

Rewiring the links recursively is the classic exercise, and it's worth reading slowly:

\`\`\`python
def reverse(head):
    if head is None or head.next is None:
        return head                # 0 or 1 node
    new_head = reverse(head.next)  # trust it: the tail is now reversed
    head.next.next = head          # the node after me should point BACK at me
    head.next = None               # and I become the new tail
    return new_head                # the new head never changes as we unwind
\`\`\`

The leap of faith is doing all the work here. After \`reverse(head.next)\` returns, everything past \`head\` is reversed and \`head.next\` is now the *last* node of that reversed section — so pointing it back at \`head\` appends \`head\` to the end. The two base cases exist because \`head.next.next\` needs \`head.next\` to be a real node.

## When not to

Depth here is \`n\` — one frame per node, all alive at once. With CPython's default limit of 1000 frames, a recursive walk of a 2,000-node list raises \`RecursionError\`. Linked lists are a *sequence*: one successor per step, no branching, so the iterative version (\`while cur is not None: cur = cur.next\`) is both safer and no harder to read. Recurse on a list to learn the shape and to get the free unwind on short lists; loop on it in production.

For the iterative patterns — fast/slow pointers, in-place surgery — see the DSA course's [linked list module](/learn/dsa/dsa-linked-list-basics).`,
    },
    exercises: [
      {
        id: "rec-list-sum",
        title: "Sum a list recursively",
        instructions: {
          typescript: `Implement \`listSum(head)\` with no loop: the empty list sums to 0, otherwise it's this node's value plus the sum of the rest.

\`fromArray\` is given — don't change it.

**Expected output:** \`19\` then \`0\`.`,
          python: `Implement \`list_sum(head)\` with no loop: the empty list sums to 0, otherwise it's this node's value plus the sum of the rest.

\`from_values\` is given — don't change it.

**Expected output:** \`19\` then \`0\`.`,
        },
        starterCode: {
          typescript: `class ListNode {
  val: number;
  next: ListNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

function fromArray(values: number[]): ListNode | null {
  let head: ListNode | null = null;
  for (let i = values.length - 1; i >= 0; i--) {
    const node = new ListNode(values[i]);
    node.next = head;
    head = node;
  }
  return head;
}

function listSum(head: ListNode | null): number {
  // TODO: base case — an empty list (null) sums to 0.
  // TODO: recursive case — head.val + listSum(head.next).
  return 0;
}

console.log(listSum(fromArray([4, 7, 1, 5, 2]))); // expected: 19
console.log(listSum(null)); // expected: 0`,
          python: `class ListNode:
    def __init__(self, val):
        self.val = val
        self.next = None


def from_values(values):
    head = None
    for v in reversed(values):
        node = ListNode(v)
        node.next = head
        head = node
    return head


def list_sum(head):
    # TODO: base case — an empty list (None) sums to 0.
    # TODO: recursive case — head.val plus list_sum(head.next).
    return 0


print(list_sum(from_values([4, 7, 1, 5, 2])))  # expected: 19
print(list_sum(None))                          # expected: 0
`,
        },
      },
      {
        id: "rec-list-unwind",
        title: "Print it backwards without reversing it",
        instructions: {
          typescript: `Implement both walks over the same list, differing only in *where* the print goes.

- \`printForward(head)\` — print before recursing.
- \`printBackward(head)\` — recurse first, print after the call returns, so the values come out as the stack unwinds.

You may not build an array, reverse anything, or use a loop.

**Expected output:** \`1\`, \`2\`, \`3\` on separate lines, then \`3\`, \`2\`, \`1\`.`,
          python: `Implement both walks over the same list, differing only in *where* the print goes.

- \`print_forward(head)\` — print before recursing.
- \`print_backward(head)\` — recurse first, print after the call returns, so the values come out as the stack unwinds.

You may not build a list, reverse anything, or use a loop.

**Expected output:** \`1\`, \`2\`, \`3\` on separate lines, then \`3\`, \`2\`, \`1\`.`,
        },
        starterCode: {
          typescript: `class ListNode {
  val: number;
  next: ListNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

const third = new ListNode(3);
const second = new ListNode(2);
const first = new ListNode(1);
first.next = second;
second.next = third;

function printForward(head: ListNode | null): void {
  // TODO: return on null; otherwise print head.val, THEN recurse.
}

function printBackward(head: ListNode | null): void {
  // TODO: return on null; otherwise recurse FIRST, then print head.val.
}

printForward(first); // expected: 1, 2, 3
console.log("---");
printBackward(first); // expected: 3, 2, 1`,
          python: `class ListNode:
    def __init__(self, val):
        self.val = val
        self.next = None


third = ListNode(3)
second = ListNode(2)
first = ListNode(1)
first.next = second
second.next = third


def print_forward(head):
    # TODO: return on None; otherwise print head.val, THEN recurse.
    pass


def print_backward(head):
    # TODO: return on None; otherwise recurse FIRST, then print head.val.
    pass


print_forward(first)  # expected: 1, 2, 3
print("---")
print_backward(first)  # expected: 3, 2, 1
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-list-base-case",
        prompt: {
          typescript: "Why is `head === null` a better base case than `head.next === null`?",
          python: "Why is `head is None` a better base case than `head.next is None`?",
        },
        options: {
          typescript: [
            "It handles the empty list, and it never dereferences a node that might not exist",
            "It is faster, because comparing against null is cheaper",
            "It allows the function to return a value instead of printing",
            "It removes the need for the recursive case",
          ],
          python: [
            "It handles the empty list, and it never dereferences a node that might not exist",
            "It is faster, because comparing against None is cheaper",
            "It allows the function to return a value instead of printing",
            "It removes the need for the recursive case",
          ],
        },
        answer: 0,
        explanation:
          "The empty case is unambiguous and total: it covers an empty list at the top level and the end of the walk with the same branch. Guarding the last node makes an empty input a separate special case — and a crash if you forget it.",
      },
      {
        id: "rec-q-list-unwind-print",
        prompt: "How do you print a linked list backwards recursively, without reversing it?",
        options: [
          "Recurse on `head.next` twice",
          "Print before the recursive call and reverse the output afterwards",
          "Recurse first, print after the call returns — the unwind visits nodes tail-first",
          "You cannot; a linked list can only be walked forward",
        ],
        answer: 2,
        explanation:
          "Post-call work runs as the stack unwinds, innermost first — which is the last node first. The stack is doing exactly the job you would otherwise have to build by hand.",
      },
      {
        id: "rec-q-list-depth",
        prompt: "What is the recursion depth of a recursive walk over a list of n nodes?",
        options: [
          "O(log n)",
          "O(1) — each call returns before the next begins",
          "O(n) — one live frame per node",
          "O(n log n)",
        ],
        answer: 2,
        explanation:
          "Each node's frame stays alive until the rest of the list finishes, so all n frames coexist. That linear depth with no branching is exactly why long lists should be walked with a loop.",
      },
    ],
  },
  {
    id: "rec-binary-trees",
    module: "structures",
    title: "Walking a Binary Tree",
    blurb: {
      typescript: "Pre-order, in-order, post-order — one line moved, three different walks.",
      python: "Pre-order, in-order, post-order — one line moved, three different walks.",
    },
    graphics: [
      {
        id: "traversal-orders",
        title: "Three places to put the visit",
        caption:
          "Pre-, in- and post-order differ only in where the visit sits relative to the two recursive calls. The traversal itself is identical.",
        src: "/lesson-graphics/recursion/rec-binary-trees.png",
      },
    ],
    content: {
      typescript: `# Walking a Binary Tree

A binary tree is where recursion stops being a curiosity and becomes the obvious tool: each node has *two* successors, so a loop would have to remember one branch while it explores the other — which is a stack you'd be writing yourself.

\`\`\`ts
class TreeNode {
  val: number;
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}
\`\`\`

The template never changes: **base case \`null\`, then recurse left, recurse right.** What changes is *where you put the visit*.

\`\`\`ts
function preOrder(node: TreeNode | null, out: number[]): void {
  if (node === null) return;
  out.push(node.val);        // ← visit
  preOrder(node.left, out);
  preOrder(node.right, out);
}

function inOrder(node: TreeNode | null, out: number[]): void {
  if (node === null) return;
  inOrder(node.left, out);
  out.push(node.val);        // ← visit
  inOrder(node.right, out);
}

function postOrder(node: TreeNode | null, out: number[]): void {
  if (node === null) return;
  postOrder(node.left, out);
  postOrder(node.right, out);
  out.push(node.val);        // ← visit
}
\`\`\`

Same traversal, same O(n) work, same O(height) depth. One line moved.

## Which order, and why

- **Pre-order** — parent before children. Use it when the parent's information is needed to process the children: serializing a tree, copying it, rendering a document outline, choosing a move before exploring it.
- **In-order** — left, node, right. On a **BST this yields the values in sorted order**, which is the standard way to prove a BST is valid or to dump it sorted. On a non-BST it's rarely what you want.
- **Post-order** — children before parent. Use it whenever the parent's answer *depends on the children's answers*: height, size, subtree sums, "is this subtree balanced", or freeing/deleting nodes.

That last one is the workhorse. The post-order aggregate has its own template:

\`\`\`ts
function height(node: TreeNode | null): number {
  if (node === null) return 0;                                // base: empty
  return 1 + Math.max(height(node.left), height(node.right)); // combine below
}
\`\`\`

Read it as a sentence: *the height of a tree is one more than the taller of its two subtrees.* The code is the definition. That's the thing to aim for — when your recursion reads like the spec, it's usually right.

## Null base case, not leaf base case

\`if (node === null) return 0;\` handles an empty tree, a missing child, and the end of every path with one branch. The tempting alternative — checking \`node.left === null && node.right === null\` — needs an extra null guard *and* special-cases a one-child node, which is where the off-by-one bugs live. Use the leaf check only when the leaf itself means something different (counting leaves, for example).

## Depth is height, not size

Frames alive at once = the current path's length = the tree's height. A balanced tree of a million nodes is ~20 frames deep and completely safe. A degenerate tree — every node with one child, which is what a BST built from sorted input looks like — is n frames deep, and blows the stack for the same node count. Whether recursion over a tree is safe depends on the *shape* of the data, not the size.

For the structures themselves — BST invariants, balance, BFS with a queue — see the DSA course's [tree basics](/learn/dsa/dsa-tree-basics) and [DFS lesson](/learn/dsa/dsa-dfs-recursion).`,
      python: `# Walking a Binary Tree

A binary tree is where recursion stops being a curiosity and becomes the obvious tool: each node has *two* successors, so a loop would have to remember one branch while it explores the other — which is a stack you'd be writing yourself.

\`\`\`python
class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None
\`\`\`

The template never changes: **base case \`None\`, then recurse left, recurse right.** What changes is *where you put the visit*.

\`\`\`python
def pre_order(node, out):
    if node is None:
        return
    out.append(node.val)      # ← visit
    pre_order(node.left, out)
    pre_order(node.right, out)


def in_order(node, out):
    if node is None:
        return
    in_order(node.left, out)
    out.append(node.val)      # ← visit
    in_order(node.right, out)


def post_order(node, out):
    if node is None:
        return
    post_order(node.left, out)
    post_order(node.right, out)
    out.append(node.val)      # ← visit
\`\`\`

Same traversal, same O(n) work, same O(height) depth. One line moved.

## Which order, and why

- **Pre-order** — parent before children. Use it when the parent's information is needed to process the children: serializing a tree, copying it, rendering a document outline, choosing a move before exploring it.
- **In-order** — left, node, right. On a **BST this yields the values in sorted order**, which is the standard way to prove a BST is valid or to dump it sorted. On a non-BST it's rarely what you want.
- **Post-order** — children before parent. Use it whenever the parent's answer *depends on the children's answers*: height, size, subtree sums, "is this subtree balanced", or releasing resources bottom-up.

That last one is the workhorse. The post-order aggregate has its own template:

\`\`\`python
def height(node):
    if node is None:
        return 0                                           # base: empty
    return 1 + max(height(node.left), height(node.right))   # combine below
\`\`\`

Read it as a sentence: *the height of a tree is one more than the taller of its two subtrees.* The code is the definition. That's the thing to aim for — when your recursion reads like the spec, it's usually right.

A Python note: a generator makes an in-order walk composable, and \`yield from\` is its recursive form.

\`\`\`python
def in_order_values(node):
    if node is None:
        return
    yield from in_order_values(node.left)
    yield node.val
    yield from in_order_values(node.right)
\`\`\`

Each level adds a generator frame, so the depth cost is the same — but the caller can stop early, which the list-building version cannot.

## None base case, not leaf base case

\`if node is None: return 0\` handles an empty tree, a missing child, and the end of every path with one branch. The tempting alternative — checking \`node.left is None and node.right is None\` — needs an extra \`None\` guard *and* special-cases a one-child node, which is where the off-by-one bugs live. Use the leaf check only when the leaf itself means something different (counting leaves, for example).

## Depth is height, not size

Frames alive at once = the current path's length = the tree's height. A balanced tree of a million nodes is ~20 frames deep and completely safe. A degenerate tree — every node with one child, which is what a BST built from sorted input looks like — is n frames deep, and hits CPython's 1000-frame limit at 1000 nodes. Whether recursion over a tree is safe depends on the *shape* of the data, not the size.

For the structures themselves — BST invariants, balance, BFS with a queue — see the DSA course's [tree basics](/learn/dsa/dsa-tree-basics) and [DFS lesson](/learn/dsa/dsa-dfs-recursion).`,
    },
    exercises: [
      {
        id: "rec-tree-orders",
        title: "Move one line, get three walks",
        instructions: {
          typescript: `Fill in all three traversals over the given tree. Each is the same three statements in a different order — a null check, two recursive calls, and one \`out.push(node.val)\`.

The sample tree is a BST, so in-order comes out sorted. That's your correctness check.

**Expected output:** \`[5,3,1,4,9,12]\`, \`[1,3,4,5,9,12]\`, \`[1,4,3,12,9,5]\`.`,
          python: `Fill in all three traversals over the given tree. Each is the same three statements in a different order — a \`None\` check, two recursive calls, and one \`out.append(node.val)\`.

The sample tree is a BST, so in-order comes out sorted. That's your correctness check.

**Expected output:** \`[5, 3, 1, 4, 9, 12]\`, \`[1, 3, 4, 5, 9, 12]\`, \`[1, 4, 3, 12, 9, 5]\`.`,
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

//        5
//       / \\
//      3   9
//     / \\    \\
//    1   4    12
const root = new TreeNode(5);
root.left = new TreeNode(3);
root.right = new TreeNode(9);
root.left.left = new TreeNode(1);
root.left.right = new TreeNode(4);
root.right.right = new TreeNode(12);

function preOrder(node: TreeNode | null, out: number[]): number[] {
  // TODO: return out on null; push node.val, then recurse left, then right.
  return out;
}

function inOrder(node: TreeNode | null, out: number[]): number[] {
  // TODO: recurse left, push node.val, recurse right.
  return out;
}

function postOrder(node: TreeNode | null, out: number[]): number[] {
  // TODO: recurse left, recurse right, push node.val.
  return out;
}

console.log(preOrder(root, [])); // expected: [5,3,1,4,9,12]
console.log(inOrder(root, [])); // expected: [1,3,4,5,9,12]
console.log(postOrder(root, [])); // expected: [1,4,3,12,9,5]`,
          python: `class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None


#        5
#       /  \\
#      3    9
#     / \\     \\
#    1   4     12
root = TreeNode(5)
root.left = TreeNode(3)
root.right = TreeNode(9)
root.left.left = TreeNode(1)
root.left.right = TreeNode(4)
root.right.right = TreeNode(12)


def pre_order(node, out):
    # TODO: return out on None; append node.val, then recurse left, then right.
    return out


def in_order(node, out):
    # TODO: recurse left, append node.val, recurse right.
    return out


def post_order(node, out):
    # TODO: recurse left, recurse right, append node.val.
    return out


print(pre_order(root, []))   # expected: [5, 3, 1, 4, 9, 12]
print(in_order(root, []))    # expected: [1, 3, 4, 5, 9, 12]
print(post_order(root, []))  # expected: [1, 4, 3, 12, 9, 5]
`,
        },
      },
      {
        id: "rec-tree-aggregate",
        title: "Combine the answers from below",
        instructions: {
          typescript: `Two post-order aggregates on the same tree — both are "the answer here is built from the children's answers".

- \`countLeaves(node)\` — an empty tree has 0 leaves; a node with no children is 1; otherwise it's the sum of both sides. This is the one place a *leaf* check is the right base case, because a leaf is what you're counting.
- \`deepestValue(node, depth)\` — return \`[value, depth]\` for the deepest node, preferring the left subtree on a tie. Compare the two children's results and return the deeper one.

**Expected output:** \`3\` then \`[1,3]\`.`,
          python: `Two post-order aggregates on the same tree — both are "the answer here is built from the children's answers".

- \`count_leaves(node)\` — an empty tree has 0 leaves; a node with no children is 1; otherwise it's the sum of both sides. This is the one place a *leaf* check is the right base case, because a leaf is what you're counting.
- \`deepest_value(node, depth)\` — return \`(value, depth)\` for the deepest node, preferring the left subtree on a tie. Compare the two children's results and return the deeper one.

**Expected output:** \`3\` then \`(1, 3)\`.`,
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

function countLeaves(node: TreeNode | null): number {
  // TODO: null → 0; no children → 1; otherwise the sum of both subtrees.
  return 0;
}

function deepestValue(node: TreeNode | null, depth: number = 1): [number, number] {
  // TODO: null → [0, 0]. Otherwise take the deeper of the two child results,
  // and use [node.val, depth] when this node is deeper than both.
  return [0, 0];
}

console.log(countLeaves(root)); // expected: 3
console.log(deepestValue(root)); // expected: [1,3]`,
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


def count_leaves(node):
    # TODO: None gives 0; no children gives 1; otherwise the sum of both sides.
    return 0


def deepest_value(node, depth=1):
    # TODO: None gives (0, 0). Otherwise take the deeper of the two child
    # results, and use (node.val, depth) when this node is deeper than both.
    return (0, 0)


print(count_leaves(root))   # expected: 3
print(deepest_value(root))  # expected: (1, 3)
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-inorder-bst",
        prompt: "Which traversal visits a BST's values in sorted order?",
        options: ["Pre-order", "In-order", "Post-order", "Level-order"],
        answer: 1,
        explanation:
          "In-order visits the whole left subtree, then the node, then the right — which is exactly the BST invariant read out loud. It's the standard way to dump a BST sorted or to validate one.",
      },
      {
        id: "rec-q-postorder-use",
        prompt: "You need each node's subtree size. Which traversal fits, and why?",
        options: [
          "Pre-order — the parent is visited first, so it can pass its size down",
          "In-order — it balances work between the two subtrees",
          "Post-order — the parent's answer is built from answers the children already returned",
          "Any of them; the order does not affect what a node can compute",
        ],
        answer: 2,
        explanation:
          "Subtree size is 1 + left size + right size, so both child answers must exist before the parent computes its own. That dependency is exactly what post-order — visiting after both recursive calls — provides.",
      },
      {
        id: "rec-q-tree-depth-shape",
        prompt:
          "A recursive traversal is safe on a balanced tree of a million nodes but overflows on a much smaller one. What explains it?",
        options: [
          "The smaller tree holds more values per node",
          "Recursion depth equals the tree's height, and a degenerate one-child-per-node tree has height n",
          "The traversal order was pre-order rather than post-order",
          "Balanced trees are traversed iteratively by the runtime",
        ],
        answer: 1,
        explanation:
          "Live frames equal the current path length, so depth is height. Balanced height is about log n; a degenerate tree — a BST built from sorted input, for instance — is a linked list with height n.",
      },
    ],
  },
  {
    id: "rec-nary-trees",
    module: "structures",
    title: "N-ary and File-System Trees",
    blurb: {
      typescript: "Many children per node: loop across them, recurse into each.",
      python: "Many children per node: loop across them, recurse into each.",
    },
    graphics: [
      {
        id: "nary-walk",
        title: "A loop inside the recursion",
        caption:
          "With an arbitrary number of children, the recursion iterates the child list and recurses into each — the shape behind directory trees, the DOM, and org charts.",
        src: "/lesson-graphics/recursion/rec-nary-trees.png",
      },
    ],
    content: {
      typescript: `# N-ary and File-System Trees

Binary trees are the teaching case; almost every tree you actually meet has an *arbitrary* number of children. The DOM, a directory tree, a JSON document, an org chart, a category hierarchy, an AST — all n-ary.

The code barely changes. Two hard-coded recursive calls become a loop:

\`\`\`ts
interface TreeNodeN {
  val: number;
  children: TreeNodeN[];
}

function total(node: TreeNodeN): number {
  let sum = node.val;
  for (const child of node.children) {
    sum += total(child);      // loop across, recurse down
  }
  return sum;
}
\`\`\`

This is the shape almost all real recursive code has: **iterate the children at this level, recurse into each one.** The base case is implicit — a node with an empty \`children\` array simply never enters the loop, which is the empty-case base case written by the loop instead of by an \`if\`. (An explicit \`if (node.children.length === 0) return node.val;\` would be redundant.)

Written functionally it's the same thing:

\`\`\`ts
const total = (node: TreeNodeN): number =>
  node.val + node.children.reduce((sum, c) => sum + total(c), 0);
\`\`\`

## A file system is just this tree

Model a directory entry as a file (a name and a size) or a directory (a name and entries), and the classic tools fall out in a few lines:

\`\`\`ts
type Entry =
  | { kind: "file"; name: string; size: number }
  | { kind: "dir"; name: string; entries: Entry[] };

// du -s
function totalSize(entry: Entry): number {
  if (entry.kind === "file") return entry.size;                 // base case
  return entry.entries.reduce((sum, e) => sum + totalSize(e), 0);
}
\`\`\`

Two kinds of node, so the kind check *is* the base case: files terminate, directories recurse. That's the pattern for every heterogeneous tree — dispatch on the node kind, and the leaf kinds are your base cases.

## Carrying the path down

The other thing a file walk always needs is the path to where you are, and a path is the textbook use for a **pass-down accumulator** — a parameter that grows on the way in, as opposed to a return value that grows on the way out:

\`\`\`ts
function listFiles(entry: Entry, prefix: string = ""): string[] {
  const path = prefix + "/" + entry.name;
  if (entry.kind === "file") return [path];
  return entry.entries.flatMap((e) => listFiles(e, path));
}
\`\`\`

Note how naturally the two directions coexist: \`path\` flows *down* the stack, the array of results flows *up*. That combination — context down, answers up — is what most real tree walks look like, and it's worth recognizing as a shape rather than rediscovering each time.

## Watch the fan-out

Two costs behave differently here:

- **Depth** is the nesting level — a directory tree is rarely more than 20 or 30 deep, so recursion is safe. (Symlink loops are the exception; \`find\` and friends guard against them, and so should you if you follow links.)
- **Work** is the total node count, which fans out fast. An n-ary walk is still O(n) in nodes visited, but "n" here is every file in the subtree.

A wide, shallow tree is the friendly case for recursion: enormous total work, trivial depth.`,
      python: `# N-ary and File-System Trees

Binary trees are the teaching case; almost every tree you actually meet has an *arbitrary* number of children. A directory tree, a JSON document, an org chart, an XML/HTML document, a category hierarchy, an AST — all n-ary.

The code barely changes. Two hard-coded recursive calls become a loop:

\`\`\`python
def total(node):
    result = node["val"]
    for child in node["children"]:
        result += total(child)      # loop across, recurse down
    return result
\`\`\`

This is the shape almost all real recursive code has: **iterate the children at this level, recurse into each one.** The base case is implicit — a node with an empty \`children\` list simply never enters the loop, which is the empty-case base case written by the loop instead of by an \`if\`. (An explicit \`if not node["children"]: return node["val"]\` would be redundant.)

Written with a comprehension it's the same thing:

\`\`\`python
def total(node):
    return node["val"] + sum(total(c) for c in node["children"])
\`\`\`

## A file system is just this tree

Model an entry as a file (a name and a size) or a directory (a name and entries), and the classic tools fall out in a few lines:

\`\`\`python
# du -s
def total_size(entry):
    if entry["kind"] == "file":
        return entry["size"]                              # base case
    return sum(total_size(e) for e in entry["entries"])
\`\`\`

Two kinds of node, so the kind check *is* the base case: files terminate, directories recurse. That's the pattern for every heterogeneous tree — dispatch on the node kind, and the leaf kinds are your base cases. (\`os.walk\` exists precisely so you don't hand-roll this for real directories; it does the recursion for you and hands back one directory per iteration.)

## Carrying the path down

The other thing a file walk always needs is the path to where you are, and a path is the textbook use for a **pass-down accumulator** — a parameter that grows on the way in, as opposed to a return value that grows on the way out:

\`\`\`python
def list_files(entry, prefix=""):
    path = prefix + "/" + entry["name"]
    if entry["kind"] == "file":
        return [path]
    return [p for e in entry["entries"] for p in list_files(e, path)]
\`\`\`

Note how naturally the two directions coexist: \`path\` flows *down* the stack, the list of results flows *up*. That combination — context down, answers up — is what most real tree walks look like, and it's worth recognizing as a shape rather than rediscovering each time.

## Watch the fan-out

Two costs behave differently here:

- **Depth** is the nesting level — a directory tree is rarely more than 20 or 30 deep, so recursion is safe even against CPython's 1000-frame limit. (Symlink loops are the exception; guard against them if you follow links.)
- **Work** is the total node count, which fans out fast. An n-ary walk is still O(n) in nodes visited, but "n" here is every file in the subtree.

A wide, shallow tree is the friendly case for recursion: enormous total work, trivial depth.`,
    },
    exercises: [
      {
        id: "rec-nary-total",
        title: "Sum an n-ary tree",
        instructions: {
          typescript: `Implement \`total(node)\` and \`deepest(node)\` over a tree whose nodes have a \`children\` array of any length.

- \`total\` — this node's value plus the total of each child. A leaf has an empty \`children\` array, so the loop just doesn't run; you don't need a separate base case.
- \`deepest\` — the number of levels below and including this node. A leaf is 1; otherwise it's 1 plus the largest child depth.

**Expected output:** \`28\` then \`3\`.`,
          python: `Implement \`total(node)\` and \`deepest(node)\` over a tree whose nodes have a \`children\` list of any length.

- \`total\` — this node's value plus the total of each child. A leaf has an empty \`children\` list, so the loop just doesn't run; you don't need a separate base case.
- \`deepest\` — the number of levels below and including this node. A leaf is 1; otherwise it's 1 plus the largest child depth.

**Expected output:** \`28\` then \`3\`.`,
        },
        starterCode: {
          typescript: `interface TreeNodeN {
  val: number;
  children: TreeNodeN[];
}

const leaf = (val: number): TreeNodeN => ({ val, children: [] });

const tree: TreeNodeN = {
  val: 1,
  children: [
    { val: 2, children: [leaf(4), leaf(5), leaf(6)] },
    leaf(3),
    { val: 7, children: [] },
  ],
};

function total(node: TreeNodeN): number {
  // TODO: start from node.val, then add total(child) for every child.
  return 0;
}

function deepest(node: TreeNodeN): number {
  // TODO: a node with no children is 1 level; otherwise 1 + the largest
  // deepest(child).
  return 0;
}

console.log(total(tree)); // expected: 28
console.log(deepest(tree)); // expected: 3`,
          python: `def leaf(val):
    return {"val": val, "children": []}


tree = {
    "val": 1,
    "children": [
        {"val": 2, "children": [leaf(4), leaf(5), leaf(6)]},
        leaf(3),
        {"val": 7, "children": []},
    ],
}


def total(node):
    # TODO: start from node["val"], then add total(child) for every child.
    return 0


def deepest(node):
    # TODO: a node with no children is 1 level; otherwise 1 plus the largest
    # deepest(child).
    return 0


print(total(tree))    # expected: 28
print(deepest(tree))  # expected: 3
`,
        },
      },
      {
        id: "rec-dir-walk",
        title: "du and find, recursively",
        instructions: {
          typescript: `Walk a small file-system tree. An entry is either \`{ kind: "file", name, size }\` or \`{ kind: "dir", name, entries }\`.

- \`totalSize(entry)\` — a file's size is its own; a directory's is the sum of its entries. The \`kind\` check is your base case.
- \`listFiles(entry, prefix)\` — return the full path of every *file*, with the path built on the way **down**: append \`"/" + entry.name\` to the prefix before recursing.

**Expected output:** \`1330\`, then four paths starting \`/root/\`.`,
          python: `Walk a small file-system tree. An entry is either a file dict (\`kind\`, \`name\`, \`size\`) or a directory dict (\`kind\`, \`name\`, \`entries\`).

- \`total_size(entry)\` — a file's size is its own; a directory's is the sum of its entries. The \`kind\` check is your base case.
- \`list_files(entry, prefix)\` — return the full path of every *file*, with the path built on the way **down**: append \`"/" + entry["name"]\` to the prefix before recursing.

**Expected output:** \`1330\`, then four paths starting \`/root/\`.`,
        },
        starterCode: {
          typescript: `type Entry =
  | { kind: "file"; name: string; size: number }
  | { kind: "dir"; name: string; entries: Entry[] };

const asFile = (name: string, size: number): Entry => ({ kind: "file", name, size });

const disk: Entry = {
  kind: "dir",
  name: "root",
  entries: [
    asFile("readme.md", 120),
    {
      kind: "dir",
      name: "src",
      entries: [asFile("index.ts", 900), { kind: "dir", name: "empty", entries: [] }],
    },
    { kind: "dir", name: "docs", entries: [asFile("a.md", 10), asFile("b.md", 300)] },
  ],
};

function totalSize(entry: Entry): number {
  // TODO: a file contributes entry.size; a directory contributes the sum of
  // totalSize over entry.entries.
  return 0;
}

function listFiles(entry: Entry, prefix: string = ""): string[] {
  // TODO: build path = prefix + "/" + entry.name.
  // A file returns [path]; a directory returns every child's paths, passing
  // path down as the new prefix.
  return [];
}

console.log(totalSize(disk)); // expected: 1330
for (const filePath of listFiles(disk)) {
  console.log(filePath);
}
// expected: /root/readme.md, /root/src/index.ts, /root/docs/a.md, /root/docs/b.md`,
          python: `def as_file(name, size):
    return {"kind": "file", "name": name, "size": size}


disk = {
    "kind": "dir",
    "name": "root",
    "entries": [
        as_file("readme.md", 120),
        {
            "kind": "dir",
            "name": "src",
            "entries": [
                as_file("index.py", 900),
                {"kind": "dir", "name": "empty", "entries": []},
            ],
        },
        {"kind": "dir", "name": "docs", "entries": [as_file("a.md", 10), as_file("b.md", 300)]},
    ],
}


def total_size(entry):
    # TODO: a file contributes entry["size"]; a directory contributes the sum
    # of total_size over entry["entries"].
    return 0


def list_files(entry, prefix=""):
    # TODO: build path = prefix + "/" + entry["name"].
    # A file returns [path]; a directory returns every child's paths, passing
    # path down as the new prefix.
    return []


print(total_size(disk))  # expected: 1330
for file_path in list_files(disk):
    print(file_path)
# expected: /root/readme.md, /root/src/index.py, /root/docs/a.md, /root/docs/b.md
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-nary-shape",
        prompt: "What does the body of a typical n-ary tree walk look like?",
        options: [
          "A loop over this node's children, recursing into each one",
          "Two recursive calls, as with a binary tree, on the first and last child",
          "A single recursive call on the child list as a whole",
          "A loop only — recursion cannot express an arbitrary number of children",
        ],
        answer: 0,
        explanation:
          "Branching is handled by the recursion, breadth by an ordinary loop. Most real recursive code is this mix, which is why 'recursive versus iterative' is rarely an either/or.",
      },
      {
        id: "rec-q-nary-base-case",
        prompt: "In that walk, where is the base case for a childless node?",
        options: [
          "There isn't one — the walk relies on the caller to skip leaves",
          "It has to be written explicitly or the recursion will not terminate",
          "The loop over an empty child collection simply never runs, which is the base case",
          "The base case is the root, checked before the first call",
        ],
        answer: 2,
        explanation:
          "An empty children collection means zero recursive calls, so the frame returns immediately. Adding an explicit leaf check is harmless but redundant — unless a leaf means something different, as when counting leaves.",
      },
      {
        id: "rec-q-path-accumulator",
        prompt: "When listing the full path of every file, which way does the path travel?",
        options: [
          "Up, as each frame appends its name to the returned value",
          "Down, as a parameter extended before each recursive call",
          "Neither — the path must be reconstructed from a separate parent lookup",
          "Both: it must be passed down and re-derived on the way up",
        ],
        answer: 1,
        explanation:
          "Context flows down as a parameter and answers flow up as return values. The prefix is known on the way in, so extending it per level is the natural pass-down accumulator.",
      },
    ],
  },
  {
    id: "rec-graphs",
    module: "structures",
    title: "Walking a Graph Without Looping Forever",
    blurb: {
      typescript: "Why a graph walk needs a visited set that a tree walk doesn't.",
      python: "Why a graph walk needs a visited set that a tree walk doesn't.",
    },
    graphics: [
      {
        id: "visited-set",
        title: "The visited set is the base case",
        caption:
          "A graph can point back at itself, so structural progress is not guaranteed. The visited set is what makes 'already seen' a terminating base case.",
        src: "/lesson-graphics/recursion/rec-graphs.png",
      },
    ],
    content: {
      typescript: `# Walking a Graph Without Looping Forever

Everything so far terminated for free: a list, a tree and a directory tree all get *structurally smaller* with each call, so there was no way to recurse forever. A graph offers no such guarantee — \`a → b → c → a\` is a perfectly ordinary graph, and the same recursion that walked a tree will now run until the stack dies.

\`\`\`ts
const graph: Record<string, string[]> = {
  a: ["b", "c"],
  b: ["d"],
  c: ["d"],
  d: ["a"],        // ← back edge: the tree walk's assumption is gone
};
\`\`\`

## The visited set is the base case

The fix is to *manufacture* the progress the structure won't give you. Track what you've already entered, and treat "already visited" as a base case:

\`\`\`ts
function reachable(
  node: string,
  edges: Record<string, string[]>,
  seen: Set<string> = new Set()
): Set<string> {
  if (seen.has(node)) return seen;    // base case: nothing new down this path
  seen.add(node);                     // mark BEFORE recursing
  for (const next of edges[node] ?? []) {
    reachable(next, edges, seen);
  }
  return seen;
}
\`\`\`

Now every call either returns immediately or removes one node from the set of unvisited ones — a finite quantity — so termination is back. Read \`seen\` as the thing that shrinks.

Two details do all the work:

- **Mark on the way in, not on the way out.** Adding \`node\` after the loop means a cycle re-enters the node before it was ever marked, and you're back to infinite recursion.
- **One shared set, threaded through every branch.** A per-branch copy would let two paths visit the same node twice — correct output, exponential cost. This is one of the rare cases where the shared mutable accumulator isn't just an optimization; it's the algorithm.

## Two visits, two questions

"Have I seen this node in *this walk*?" and "have I seen it on *the current path*?" are different questions:

- A **visited set** answers reachability, connected components, and "is there a path" — it prevents re-work as well as infinite loops.
- A **path set** (added on the way down, removed on the way *up*) is what detects a **cycle**: if a neighbour is on the path you are currently standing on, you've found a back edge. Removing on the unwind is the distinguishing move — the node stops being "on the path" as soon as you leave it. That's a backtracking pattern, and it's how cycle detection in a dependency graph is written.

\`\`\`ts
function hasCycle(node: string, edges: Record<string, string[]>, path: Set<string>): boolean {
  if (path.has(node)) return true;      // back edge into the current path
  path.add(node);
  for (const next of edges[node] ?? []) {
    if (hasCycle(next, edges, path)) return true;
  }
  path.delete(node);                    // leaving: no longer on the path
  return false;
}
\`\`\`

(Production cycle detection combines both sets — a *done* set so finished nodes aren't re-explored, plus the path set — which is the classic white/grey/black colouring.)

## Depth is the longest path

A recursive DFS is \`O(V + E)\` in work and \`O(V)\` in depth worst case — a graph that happens to be one long chain gives you one frame per node. On large graphs from untrusted or unknown sources, an explicit stack (or BFS with a queue) is the safe form.

For the graph *algorithms* — adjacency lists, BFS, components, topological sort — see the DSA course's [graph traversal lesson](/learn/dsa/dsa-graph-traversal). Here the point is narrower: the visited set is what replaces the structural guarantee a tree gave you for free.`,
      python: `# Walking a Graph Without Looping Forever

Everything so far terminated for free: a list, a tree and a directory tree all get *structurally smaller* with each call, so there was no way to recurse forever. A graph offers no such guarantee — \`a → b → c → a\` is a perfectly ordinary graph, and the same recursion that walked a tree will now run until \`RecursionError\`.

\`\`\`python
graph = {
    "a": ["b", "c"],
    "b": ["d"],
    "c": ["d"],
    "d": ["a"],      # ← back edge: the tree walk's assumption is gone
}
\`\`\`

## The visited set is the base case

The fix is to *manufacture* the progress the structure won't give you. Track what you've already entered, and treat "already visited" as a base case:

\`\`\`python
def reachable(node, edges, seen=None):
    if seen is None:
        seen = set()
    if node in seen:
        return seen              # base case: nothing new down this path
    seen.add(node)               # mark BEFORE recursing
    for nxt in edges.get(node, []):
        reachable(nxt, edges, seen)
    return seen
\`\`\`

Now every call either returns immediately or removes one node from the set of unvisited ones — a finite quantity — so termination is back. Read \`seen\` as the thing that shrinks. (Note the \`seen=None\` dance rather than \`seen=set()\`: a mutable default is created once at \`def\` time and would leak between top-level calls.)

Two details do all the work:

- **Mark on the way in, not on the way out.** Adding \`node\` after the loop means a cycle re-enters the node before it was ever marked, and you're back to infinite recursion.
- **One shared set, threaded through every branch.** A per-branch copy would let two paths visit the same node twice — correct output, exponential cost. This is one of the rare cases where the shared mutable accumulator isn't just an optimization; it's the algorithm.

## Two visits, two questions

"Have I seen this node in *this walk*?" and "have I seen it on *the current path*?" are different questions:

- A **visited set** answers reachability, connected components, and "is there a path" — it prevents re-work as well as infinite loops.
- A **path set** (added on the way down, removed on the way *up*) is what detects a **cycle**: if a neighbour is on the path you are currently standing on, you've found a back edge. Removing on the unwind is the distinguishing move — the node stops being "on the path" as soon as you leave it. That's a backtracking pattern, and it's how cycle detection in a dependency graph is written.

\`\`\`python
def has_cycle(node, edges, path):
    if node in path:
        return True              # back edge into the current path
    path.add(node)
    for nxt in edges.get(node, []):
        if has_cycle(nxt, edges, path):
            return True
    path.discard(node)           # leaving: no longer on the path
    return False
\`\`\`

(Production cycle detection combines both sets — a *done* set so finished nodes aren't re-explored, plus the path set — which is the classic white/grey/black colouring.)

## Depth is the longest path

A recursive DFS is \`O(V + E)\` in work and \`O(V)\` in depth worst case — a graph that happens to be one long chain gives you one frame per node, which hits CPython's limit at a thousand. On large graphs from untrusted or unknown sources, an explicit stack (or BFS with a \`deque\`) is the safe form.

For the graph *algorithms* — adjacency lists, BFS, components, topological sort — see the DSA course's [graph traversal lesson](/learn/dsa/dsa-graph-traversal). Here the point is narrower: the visited set is what replaces the structural guarantee a tree gave you for free.`,
    },
    exercises: [
      {
        id: "rec-graph-reachable",
        title: "Reachability on a cyclic graph",
        instructions: {
          typescript: `The sample graph contains the cycle \`a → b → d → a\`, so a walk without a visited set never terminates.

Implement \`reachable(node, graph, seen)\`:
- If \`node\` is already in \`seen\`, return \`seen\` unchanged — that's the base case.
- Otherwise add it *before* recursing, then recurse into every neighbour with the same set.

Use \`graph[node] ?? []\` so a node with no outgoing edges doesn't blow up.

**Expected output:** \`["a","b","c","d"]\` then \`["e"]\`.`,
          python: `The sample graph contains the cycle \`a → b → d → a\`, so a walk without a visited set never terminates.

Implement \`reachable(node, graph, seen)\`:
- If \`node\` is already in \`seen\`, return \`seen\` unchanged — that's the base case.
- Otherwise add it *before* recursing, then recurse into every neighbour with the same set.

Use \`graph.get(node, [])\` so a node with no outgoing edges doesn't raise.

**Expected output:** \`['a', 'b', 'c', 'd']\` then \`['e']\`.`,
        },
        starterCode: {
          typescript: `const edges: Record<string, string[]> = {
  a: ["b", "c"],
  b: ["d"],
  c: ["d"],
  d: ["a"], // cycle back to a
  e: [],
};

function reachable(
  node: string,
  graph: Record<string, string[]>,
  seen: Set<string> = new Set()
): Set<string> {
  // TODO: base case — node already in seen, return seen.
  // TODO: add node to seen, then recurse into each neighbour with the SAME set.
  return seen;
}

console.log([...reachable("a", edges)].sort()); // expected: ["a","b","c","d"]
console.log([...reachable("e", edges)].sort()); // expected: ["e"]`,
          python: `edges = {
    "a": ["b", "c"],
    "b": ["d"],
    "c": ["d"],
    "d": ["a"],  # cycle back to a
    "e": [],
}


def reachable(node, graph, seen=None):
    if seen is None:
        seen = set()
    # TODO: base case — node already in seen, return seen.
    # TODO: add node to seen, then recurse into each neighbour with the SAME set.
    return seen


print(sorted(reachable("a", edges)))  # expected: ['a', 'b', 'c', 'd']
print(sorted(reachable("e", edges)))  # expected: ['e']
`,
        },
      },
      {
        id: "rec-graph-cycle",
        title: "Add on the way down, remove on the way up",
        instructions: {
          typescript: `Detect a cycle by tracking the nodes on the *current path* rather than every node ever seen.

\`hasCycle(node, graph, path)\`:
- If \`node\` is already in \`path\`, you have found a back edge — return \`true\`.
- Otherwise add it, recurse into each neighbour, and return \`true\` as soon as one reports a cycle.
- Before returning \`false\`, **delete** \`node\` from \`path\` — leaving a node means it is no longer on the path you're standing on.

Try skipping that delete: \`acyclic\` will report a cycle that isn't there, because a diamond (\`x → y → w\`, \`x → z → w\`) reaches \`w\` twice by two different paths.

**Expected output:** \`true\` then \`false\`.`,
          python: `Detect a cycle by tracking the nodes on the *current path* rather than every node ever seen.

\`has_cycle(node, graph, path)\`:
- If \`node\` is already in \`path\`, you have found a back edge — return \`True\`.
- Otherwise add it, recurse into each neighbour, and return \`True\` as soon as one reports a cycle.
- Before returning \`False\`, **discard** \`node\` from \`path\` — leaving a node means it is no longer on the path you're standing on.

Try skipping that discard: \`acyclic\` will report a cycle that isn't there, because a diamond (\`x → y → w\`, \`x → z → w\`) reaches \`w\` twice by two different paths.

**Expected output:** \`True\` then \`False\`.`,
        },
        starterCode: {
          typescript: `const cyclic: Record<string, string[]> = { a: ["b"], b: ["c"], c: ["a"] };
const acyclic: Record<string, string[]> = { x: ["y", "z"], y: ["w"], z: ["w"], w: [] };

function hasCycle(
  node: string,
  graph: Record<string, string[]>,
  path: Set<string> = new Set()
): boolean {
  // TODO: node already in path → return true (back edge).
  // TODO: add node, recurse into each neighbour, return true if any does.
  // TODO: delete node from path before returning false.
  return false;
}

console.log(hasCycle("a", cyclic)); // expected: true
console.log(hasCycle("x", acyclic)); // expected: false`,
          python: `cyclic = {"a": ["b"], "b": ["c"], "c": ["a"]}
acyclic = {"x": ["y", "z"], "y": ["w"], "z": ["w"], "w": []}


def has_cycle(node, graph, path=None):
    if path is None:
        path = set()
    # TODO: node already in path gives True (back edge).
    # TODO: add node, recurse into each neighbour, return True if any does.
    # TODO: discard node from path before returning False.
    return False


print(has_cycle("a", cyclic))   # expected: True
print(has_cycle("x", acyclic))  # expected: False
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-graph-progress",
        prompt: "Why does a tree walk terminate without a visited set while a graph walk does not?",
        options: [
          "Trees are smaller in practice",
          "A tree walk is iterative under the hood",
          "Every recursive call on a tree moves to a strictly smaller subtree; a graph edge can point back at an ancestor",
          "Graphs store their nodes in a set, which is unordered",
        ],
        answer: 2,
        explanation:
          "Termination needs measurable progress. A tree gives it structurally; a graph can cycle, so you have to supply the progress yourself — each call either returns at once or shrinks the unvisited set.",
      },
      {
        id: "rec-q-mark-before",
        prompt:
          "What breaks if you add the node to the visited set *after* the neighbour loop instead of before it?",
        options: [
          "Nothing — the set ends up identical either way",
          "A cycle re-enters an unmarked node and the recursion never terminates",
          "The traversal becomes breadth-first",
          "Nodes with no neighbours are skipped",
        ],
        answer: 1,
        explanation:
          "The mark exists to stop a path returning to a node that is currently being explored. Marking on the unwind means it isn't in the set while its own subtree runs, so a back edge loops forever.",
      },
      {
        id: "rec-q-path-vs-visited",
        prompt: "Cycle detection removes the node from its set on the way back up. Why?",
        options: [
          "To free memory as the walk proceeds",
          "So the node can be re-counted in a different connected component",
          "Because the set tracks the current path, and leaving the node means it is no longer on that path",
          "Because sets cannot grow beyond the recursion limit",
        ],
        answer: 2,
        explanation:
          "A visited set and a path set answer different questions. Removing on the unwind is what makes it a path: a node reachable by two different routes is not a cycle, but a node reachable from itself is.",
      },
    ],
  },
  {
    id: "rec-nested-data",
    module: "structures",
    title: "Nested Arrays, Objects, and JSON",
    blurb: {
      typescript: "Deep flatten, deep clone, and walking a JSON document by type.",
      python: "Deep flatten, deep copy, and walking a JSON document by type.",
    },
    graphics: [
      {
        id: "nested-walk",
        title: "Dispatch on the type",
        caption:
          "Nested data has no node class — the value's own type decides whether it is a leaf or a container, which makes the type check the base case.",
        src: "/lesson-graphics/recursion/rec-nested-data.png",
      },
    ],
    content: {
      typescript: `# Nested Arrays, Objects, and JSON

This is the recursion you will actually write at work. There's no \`TreeNode\` class in sight — the tree is a plain value whose *type* tells you whether it's a container or a leaf.

## The type check is the base case

\`\`\`ts
type Nested = number | Nested[];

function deepFlatten(values: Nested[]): number[] {
  const out: number[] = [];
  for (const v of values) {
    if (Array.isArray(v)) out.push(...deepFlatten(v));   // container → recurse
    else out.push(v);                                    // leaf → base case
  }
  return out;
}

deepFlatten([1, [2, [3, [4]], 5]]);   // [1, 2, 3, 4, 5]
\`\`\`

Every walk in this lesson has that shape: *if it's a container, recurse into its parts; otherwise you're at a leaf, so handle the value.* Use \`Array.isArray\` rather than \`typeof v === "object"\` — arrays are objects too, and \`typeof null\` is famously \`"object"\`, so ordering these checks wrongly is a real bug.

(\`[1, [2, [3]]].flat(Infinity)\` does this for arrays specifically. Knowing the recursion matters because the moment your leaves aren't numbers or your containers aren't arrays, the built-in stops applying.)

## Deep clone: rebuild, don't mutate

\`\`\`ts
type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function deepClone(value: Json): Json {
  if (Array.isArray(value)) return value.map(deepClone);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepClone(v)]));
  }
  return value;                       // primitives are already immutable
}
\`\`\`

Note the structure: **two container cases, then a catch-all leaf case.** The recursion returns a *new* value at each level rather than mutating, which is what makes the whole clone deep. Miss the recursion on one branch — say, copy an array with \`slice()\` — and you get the classic half-deep copy whose nested objects are still shared.

Two things a hand-rolled clone gets wrong that are worth knowing: **cycles** (\`a.self = a\` recurses forever unless you keep a \`Map\` of already-cloned objects) and **non-JSON values** (\`Date\`, \`Map\`, \`RegExp\`, class instances). The platform's \`structuredClone\` handles both and is the right default — with the caveat that it does not preserve prototypes, so a class instance comes back as a plain object; write the recursion when you need custom behaviour per node.

## Mutual recursion for a JSON walk

When the container types are genuinely different, splitting into several functions that call each other is often clearer than one function with a pile of branches. That's **mutual recursion**:

\`\`\`ts
function walkValue(value: Json, path: string, out: string[]): void {
  if (Array.isArray(value)) walkArray(value, path, out);
  else if (value !== null && typeof value === "object") walkObject(value, path, out);
  else out.push(path + " = " + String(value));       // leaf
}

function walkArray(values: Json[], path: string, out: string[]): void {
  values.forEach((v, i) => walkValue(v, path + "[" + i + "]", out));
}

function walkObject(obj: { [k: string]: Json }, path: string, out: string[]): void {
  for (const [k, v] of Object.entries(obj)) walkValue(v, path + "." + k, out);
}
\`\`\`

\`walkValue\` never calls itself directly — it goes through \`walkArray\` or \`walkObject\`, which call back into it. The stack doesn't care; mutual recursion is ordinary recursion with more than one function in the cycle, and the same rules apply (each trip round the cycle must make progress). Function declarations are hoisted, so the forward reference is fine.

This is how config readers, schema validators, redaction passes, and every "walk this document and do X to the leaves" utility are written. The path parameter travels *down*, the output array collects *up* — the same pairing as the file-system walk.

## Depth is the nesting level

The good news: nesting is usually shallow, so these walks are safe. The exception is deeply nested data from an untrusted source — the depth-limits lesson's guard applies here, verbatim.`,
      python: `# Nested Lists, Dicts, and JSON

This is the recursion you will actually write at work. There's no \`TreeNode\` class in sight — the tree is a plain value whose *type* tells you whether it's a container or a leaf.

## The type check is the base case

\`\`\`python
def deep_flatten(values):
    out = []
    for v in values:
        if isinstance(v, list):
            out.extend(deep_flatten(v))   # container → recurse
        else:
            out.append(v)                 # leaf → base case
    return out


deep_flatten([1, [2, [3, [4]], 5]])       # [1, 2, 3, 4, 5]
\`\`\`

Every walk in this lesson has that shape: *if it's a container, recurse into its parts; otherwise you're at a leaf, so handle the value.*

One Python-specific trap: \`str\` is itself iterable, so a "recurse into anything iterable" version descends into \`"abc"\`, then into \`"a"\`, which is a one-character string that is *still* iterable — infinite recursion on a single letter. Check for the concrete container types you mean (\`list\`, \`tuple\`), or explicitly exclude \`str\` and \`bytes\`.

## Deep copy: rebuild, don't mutate

\`\`\`python
def deep_clone(value):
    if isinstance(value, list):
        return [deep_clone(v) for v in value]
    if isinstance(value, dict):
        return {k: deep_clone(v) for k, v in value.items()}
    return value                      # immutable scalars need no copy
\`\`\`

Note the structure: **two container cases, then a catch-all leaf case.** The recursion returns a *new* value at each level rather than mutating, which is what makes the whole copy deep. Miss the recursion on one branch — say, copy a list with \`list(x)\` — and you get the classic half-deep copy whose nested dicts are still shared.

\`copy.deepcopy\` is the batteries-included version, and it also handles **cycles** (\`a["self"] = a\` recurses forever in the code above) by memoising objects it has already copied. Write the recursion when you need custom behaviour per node; reach for \`deepcopy\` otherwise.

## Mutual recursion for a JSON walk

When the container types are genuinely different, splitting into several functions that call each other is often clearer than one function with a pile of branches. That's **mutual recursion**:

\`\`\`python
def walk_value(value, path, out):
    if isinstance(value, list):
        walk_list(value, path, out)
    elif isinstance(value, dict):
        walk_dict(value, path, out)
    else:
        out.append(path + " = " + str(value))     # leaf


def walk_list(values, path, out):
    for i, v in enumerate(values):
        walk_value(v, path + "[" + str(i) + "]", out)


def walk_dict(obj, path, out):
    for k, v in obj.items():
        walk_value(v, path + "." + k, out)
\`\`\`

\`walk_value\` never calls itself directly — it goes through \`walk_list\` or \`walk_dict\`, which call back into it. The stack doesn't care; mutual recursion is ordinary recursion with more than one function in the cycle, and the same rules apply (each trip round the cycle must make progress). Names are resolved at call time, so referring to \`walk_list\` before it is defined is fine.

This is how config readers, schema validators, redaction passes, and every "walk this document and do X to the leaves" utility are written. The path parameter travels *down*, the output list collects *up* — the same pairing as the file-system walk.

## Depth is the nesting level

The good news: nesting is usually shallow, so these walks are safe. The exception is deeply nested data from an untrusted source — the depth-limits lesson's guard applies here, verbatim. (\`json.loads\` raises \`RecursionError\` on adversarial input for exactly this reason.)`,
    },
    exercises: [
      {
        id: "rec-deep-flatten",
        title: "Flatten arbitrarily nested data",
        instructions: {
          typescript: `Implement \`deepFlatten(values)\`: return every number, in order, no matter how deeply nested.

For each element: if it's an array, recurse and append everything that comes back; otherwise it's a leaf, so push it. Don't use \`flat()\` — the point is the walk.

Then implement \`deepCount(values)\`, which returns how many *leaves* there are, without building the flattened array.

**Expected output:** \`[1,2,3,4,5,6]\`, \`6\`, \`[]\`.`,
          python: `Implement \`deep_flatten(values)\`: return every number, in order, no matter how deeply nested.

For each element: if it's a list, recurse and extend with everything that comes back; otherwise it's a leaf, so append it.

Then implement \`deep_count(values)\`, which returns how many *leaves* there are, without building the flattened list.

**Expected output:** \`[1, 2, 3, 4, 5, 6]\`, \`6\`, \`[]\`.`,
        },
        starterCode: {
          typescript: `type Nested = number | Nested[];

const data: Nested[] = [1, [2, [3, [4, []]], 5], [], [[6]]];

function deepFlatten(values: Nested[]): number[] {
  // TODO: loop the values. Array.isArray(v) → recurse and append the result;
  // otherwise push v.
  return [];
}

function deepCount(values: Nested[]): number {
  // TODO: same walk, but add up counts instead of collecting values.
  return 0;
}

console.log(deepFlatten(data)); // expected: [1,2,3,4,5,6]
console.log(deepCount(data)); // expected: 6
console.log(deepFlatten([[], [[]]])); // expected: []`,
          python: `data = [1, [2, [3, [4, []]], 5], [], [[6]]]


def deep_flatten(values):
    # TODO: loop the values. isinstance(v, list) means recurse and extend with
    # the result; otherwise append v.
    return []


def deep_count(values):
    # TODO: same walk, but add up counts instead of collecting values.
    return 0


print(deep_flatten(data))        # expected: [1, 2, 3, 4, 5, 6]
print(deep_count(data))          # expected: 6
print(deep_flatten([[], [[]]]))  # expected: []
`,
        },
      },
      {
        id: "rec-json-leaf-paths",
        title: "Walk a JSON document with mutual recursion",
        instructions: {
          typescript: `Print every leaf of a JSON document with the path that reaches it, using three mutually recursive functions.

- \`walkValue\` dispatches: array → \`walkArray\`, non-null object → \`walkObject\`, anything else is a leaf, so push \`path + " = " + String(value)\`.
- \`walkArray\` recurses into each element with \`path + "[" + i + "]"\`.
- \`walkObject\` recurses into each entry with \`path + "." + key\`.

Check \`Array.isArray\` **before** the object check, and remember \`typeof null === "object"\`.

**Expected output:** five lines, ending with \`.tags[1] = beta\`.`,
          python: `Print every leaf of a JSON document with the path that reaches it, using three mutually recursive functions.

- \`walk_value\` dispatches: list → \`walk_list\`, dict → \`walk_dict\`, anything else is a leaf, so append \`path + " = " + str(value)\`.
- \`walk_list\` recurses into each element with \`path + "[" + str(i) + "]"\`.
- \`walk_dict\` recurses into each entry with \`path + "." + key\`.

**Expected output:** five lines, ending with \`.tags[1] = beta\`.`,
        },
        starterCode: {
          typescript: `type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

const doc: Json = {
  name: "recursion",
  meta: { level: 3, draft: false },
  tags: ["alpha", "beta"],
};

function walkValue(value: Json, path: string, out: string[]): void {
  // TODO: array → walkArray; non-null object → walkObject;
  // otherwise push path + " = " + String(value).
}

function walkArray(values: Json[], path: string, out: string[]): void {
  // TODO: walkValue on each element with path + "[" + i + "]".
}

function walkObject(obj: { [k: string]: Json }, path: string, out: string[]): void {
  // TODO: walkValue on each entry with path + "." + key.
}

const lines: string[] = [];
walkValue(doc, "", lines);
for (const line of lines) {
  console.log(line);
}
// expected: .name = recursion, .meta.level = 3, .meta.draft = false,
//           .tags[0] = alpha, .tags[1] = beta`,
          python: `doc = {
    "name": "recursion",
    "meta": {"level": 3, "draft": False},
    "tags": ["alpha", "beta"],
}


def walk_value(value, path, out):
    # TODO: a list goes to walk_list; a dict goes to walk_dict;
    # otherwise append path + " = " + str(value).
    pass


def walk_list(values, path, out):
    # TODO: walk_value on each element with path + "[" + str(i) + "]".
    pass


def walk_dict(obj, path, out):
    # TODO: walk_value on each entry with path + "." + key.
    pass


lines = []
walk_value(doc, "", lines)
for line in lines:
    print(line)
# expected: .name = recursion, .meta.level = 3, .meta.draft = False,
#           .tags[0] = alpha, .tags[1] = beta
`,
        },
      },
    ],
    quiz: [
      {
        id: "rec-q-nested-base-case",
        prompt: "In a deep-flatten walk, what plays the role of the base case?",
        options: [
          "The length of the outer array",
          "The value's type: anything that is not a container is a leaf and is handled directly",
          "An explicit depth counter",
          "The first empty array encountered",
        ],
        answer: 1,
        explanation:
          "Nested data carries no node class, so the type check is the structure. Containers recurse; every other value terminates that branch immediately.",
      },
      {
        id: "rec-q-nested-typecheck",
        prompt: {
          typescript: 'Why check `Array.isArray(v)` before `typeof v === "object"`?',
          python: 'Why is a "recurse into anything iterable" flatten dangerous in Python?',
        },
        options: {
          typescript: [
            "Because arrays are objects too, so the object branch would swallow them",
            "Because `Array.isArray` is faster than `typeof`",
            "Because `typeof` cannot be applied to arrays",
            "Because arrays are not allowed to contain objects",
          ],
          python: [
            "Because a string is iterable and its one-character elements are still iterable strings, so it never bottoms out",
            "Because `isinstance` is slower than comparing types directly",
            "Because tuples and lists compare unequal",
            "Because generators cannot be indexed",
          ],
        },
        answer: 0,
        explanation: {
          typescript:
            'Both `typeof []` and `typeof null` are `"object"`, so the array test must come first and null must be excluded before the object branch, or arrays get walked as plain objects.',
          python:
            'Iterating `"abc"` yields `"a"`, which is itself an iterable string — there is no smaller case to reach. Check for the concrete container types you mean, or exclude `str` and `bytes` explicitly.',
        },
      },
      {
        id: "rec-q-mutual-recursion",
        prompt: "What makes a set of functions mutually recursive?",
        options: [
          "Each one calls itself twice",
          "They share a global accumulator",
          "They are defined inside one another",
          "They call each other in a cycle, so no single function has to call itself directly",
        ],
        answer: 3,
        explanation:
          "Mutual recursion is ordinary recursion with more than one function in the loop — a dispatcher calling per-type walkers that call back into the dispatcher. The stack behaves identically, and each trip round the cycle must still make progress.",
      },
    ],
  },
];
