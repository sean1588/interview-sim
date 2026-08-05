import type { Lesson } from "../types";

export const treesLessons: Lesson[] = [
  {
    id: "dsa-tree-basics",
    module: "trees",
    title: "Binary Trees and BSTs",
    blurb: "Hierarchy, the BST ordering invariant, and why balance matters.",
    content: `# Binary Trees and BSTs

You've been using trees all along — the DOM, your file system, nested JSON. A tree is just nodes with a single **root**, where each node points down at **children**; nodes with no children are **leaves**. The **height** is the longest root-to-leaf path. A **binary** tree caps children at two, which is enough structure to make searching cheap.

The course convention for a node (never name a class \`Node\` — it collides with the DOM global):

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

## The BST invariant

A **Binary Search Tree** adds one rule: at *every* node, everything in the left subtree is smaller than the node, everything in the right subtree is larger. Note the wording — the *entire subtree*, recursively, not just the immediate children. A node buried three levels down in the left subtree still has to be smaller than the root.

That invariant is what you're buying. To find a value, you compare at the root and discard half the tree: smaller → go left, larger → go right. One comparison per level, so search and insert walk a single root-to-leaf path: **O(height)**. In a balanced tree of 1,000,000 nodes, height is ~20 — twenty comparisons instead of a million.

## The catch: balance

O(height) is only O(log n) when the tree is **balanced**. Insert already-sorted data — \`1, 2, 3, 4, ...\` — into a naive BST and every value goes right: you've built a linked list wearing a tree costume, height n, and every operation degrades to **O(n)**. Sorted input is *common* (database keys, timestamps), which is exactly why production ordered structures are self-balancing trees — **AVL** and **red-black trees** — that do small local rotations on insert to pin height at O(log n). You won't implement rotations here; you just need to know why they exist and that library "sorted map" types use them.

**Duplicates:** every BST picks a rule. Ours is the simplest: inserting a value that's already present does nothing.

## When would I reach for a BST?

When you need your data *ordered* while it changes: range queries ("everything between 10 and 50"), nearest key, min/max, sorted iteration — all O(log n) or O(k + log n). If you only ever do exact-key lookups, a hash map (\`Map\`) is simpler and O(1); the tree earns its keep the moment order matters.`,
    exercises: [
    {
      id: "dsa-bst-insert",
      title: "Insert into a BST",
      instructions: `Implement two BST operations (the \`TreeNode\` class is given — don't touch it):

- \`insert(root, val)\` — attach \`val\` at the correct empty slot and return the (possibly new) root. Ignore duplicates. Iterative or recursive, your choice.
- \`contains(root, val)\` — follow one root-to-leaf path using the invariant; return whether \`val\` is present.

Both are O(height): each comparison discards one whole subtree.

**Expected output:** \`true\` then \`false\` (the tree holds 6 but not 7).`,
      starterCode: `class TreeNode {
  val: number;
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

function insert(root: TreeNode | null, val: number): TreeNode | null {
  // TODO: walk (or recurse) down to the correct empty slot and attach a new
  // TreeNode there. Smaller values go left, larger go right; if you hit an
  // equal value, ignore it. Return the root — a brand-new node if the tree
  // was empty, the same root otherwise.
  return root;
}

function contains(root: TreeNode | null, val: number): boolean {
  // TODO: follow the invariant down ONE path: go left when val is smaller,
  // right when larger. Return true if you land on val, false if you fall off.
  return false;
}

let bstRoot: TreeNode | null = null;
for (const v of [8, 3, 10, 1, 6, 14, 6]) {
  bstRoot = insert(bstRoot, v);
}
console.log(contains(bstRoot, 6)); // expected: true
console.log(contains(bstRoot, 7)); // expected: false`,
    },
    {
      id: "dsa-tree-height",
      title: "Height of a tree",
      instructions: `Implement \`treeHeight(root)\` recursively. An empty tree has height 0; otherwise the height is \`1 + Math.max(...)\` of the children's heights — your first taste of the combine-children template you'll lean on constantly.

The sample tree's longest path is \`5 → 9 → 12 → 15\`.

**Expected output:** \`4\` then \`0\`.`,
      starterCode: `class TreeNode {
  val: number;
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

function treeHeight(root: TreeNode | null): number {
  // TODO: an empty tree has height 0; otherwise the height is
  // 1 + Math.max(height of left subtree, height of right subtree).
  return 0;
}

// Hand-built tree:      5
//                      / \\
//                     3   9
//                    /     \\
//                   1       12
//                             \\
//                              15
const sampleRoot = new TreeNode(5);
sampleRoot.left = new TreeNode(3);
sampleRoot.right = new TreeNode(9);
sampleRoot.left.left = new TreeNode(1);
sampleRoot.right.right = new TreeNode(12);
sampleRoot.right.right.right = new TreeNode(15);

console.log(treeHeight(sampleRoot)); // expected: 4
console.log(treeHeight(null)); // expected: 0`,
    },
    ],
    quiz: [
    {
      id: "dsa-tree-basics-q1",
      prompt: "You insert 1,000,000 keys into a plain (non-self-balancing) BST in already-sorted order. What does a subsequent search cost?",
      options: [
        "O(log n) — the BST invariant guarantees logarithmic search regardless of insertion order",
        "O(1) amortized — repeated searches warm up the tree the way a hash map's buckets do",
        "O(n log n) — each search must re-verify the invariant at every level it passes",
        "O(n) — every insert went right, so the tree degenerated into a linked list; a search can take ~1,000,000 comparisons instead of ~20",
      ],
      answer: 3,
      explanation: "Search is O(height), and sorted insertion into a naive BST builds a height-n chain. That failure mode on common input (sorted keys, timestamps) is exactly why production trees self-balance (AVL, red-black) to pin height at O(log n).",
    },
    {
      id: "dsa-tree-basics-q2",
      prompt: "When validating a BST, why is it NOT enough to check that each node's immediate children satisfy `left.val < node.val < right.val`?",
      options: [
        "The invariant bounds entire subtrees, not parent-child pairs — a node deep in the left subtree can still be larger than the root even if every local pair looks fine",
        "It is enough — checking every parent-child pair transitively validates the whole tree",
        "Because duplicates might exist, and pairwise checks can't detect them",
        "Because the tree might be unbalanced, and pairwise checks only work on balanced trees",
      ],
      answer: 0,
      explanation: "The invariant is recursive over whole subtrees: everything left of the root must be smaller than the root, at any depth. A tree like 5 → left 3 → right-child 8 passes every pairwise check but violates the invariant (8 sits in 5's left subtree). Balance and duplicates are separate concerns.",
    },
    {
      id: "dsa-tree-basics-q3",
      prompt: "You're choosing between a hash map and a balanced BST-style ordered structure for a mutable key-value collection. When does the tree earn its extra complexity?",
      options: [
        "When you need the fastest possible exact-key lookup, since O(log n) beats hashing overhead",
        "When you need ordered operations — range queries, nearest key, min/max, sorted iteration — which a hash map can't do without an O(n log n) sort",
        "When keys are strings, because hashing strings is unreliable",
        "When the collection is large, because hash maps stop being O(1) past a few thousand entries",
      ],
      answer: 1,
      explanation: "Hash maps win exact-key lookup at O(1); the tree's O(log n) buys you the keys staying in order while the collection mutates — range queries, floor/ceiling, sorted scans. If order never matters, use the Map.",
    },
    ],
  },
  {
    id: "dsa-dfs-recursion",
    module: "trees",
    title: "Depth-First Traversals",
    blurb: "Preorder, inorder, postorder — recursion as a tree walker.",
    content: `# Depth-First Traversals

Depth-first search commits fully to one subtree before touching the other: it dives left until it can't, then backs up and tries the next branch. Recursion is DFS's natural form because **the call stack is the path back up** — the same stack mechanics from the stacks lesson, except the runtime maintains it for you. Each frame remembers "I was at this node, and I still owe the right subtree."

All three classic orders are the *same* walk. The only thing that changes is **when you visit the node** relative to the two recursive calls:

\`\`\`ts
function walk(root: TreeNode | null): void {
  if (root === null) return;
  // preorder: visit root.val here   (node, left, right)
  walk(root.left);
  // inorder: visit root.val here    (left, node, right)
  walk(root.right);
  // postorder: visit root.val here  (left, right, node)
}
\`\`\`

- **Preorder** (node, left, right) — you see a parent before its children. That's the order for copying or serializing a tree: write the root down first, and re-inserting values in preorder rebuilds the same shape.
- **Inorder** (left, node, right) — the punchline: on a **BST**, inorder yields the values in **sorted order**. The invariant says smaller-left / larger-right, and inorder reads exactly left, self, right. This is also how you *validate* a BST: inorder it and check the output is strictly increasing.
- **Postorder** (left, right, node) — children before parents. Reach for it whenever a parent's answer depends on its children's answers, or a child must be handled first: deleting/freeing a tree, computing directory sizes, any bottom-up aggregation.

## The aggregate shape

Most tree problems you'll meet are one template: *"combine the answers from the left and right subtrees."*

\`\`\`ts
function agg(root: TreeNode | null): number {
  if (root === null) return BASE;             // 0 for sum/count/height
  return combine(root.val, agg(root.left), agg(root.right));
}
\`\`\`

Sum is \`val + left + right\`. Count is \`1 + left + right\`. Height is \`1 + Math.max(left, right)\`. Once you see the template, dozens of "tree questions" collapse into choosing a base case and a combine step.

**Cost:** every traversal touches each node once — **O(n)** time, always. Space is the recursion depth: **O(height)** — ~20 frames for a balanced million-node tree, but O(n) frames on a degenerate chain (deep enough chains can genuinely blow the stack).`,
    exercises: [
    {
      id: "dsa-inorder-collect",
      title: "Inorder of a BST is sorted",
      instructions: `Implement \`inorder(root)\` recursively: left subtree, then this node's value, then right subtree. A tip: write an inner helper that pushes into one shared array, then return the array.

The starter builds a BST from an **unsorted** list using the given \`bstInsert\` helper. If your traversal is correct, the output must come out **sorted** — that's the inorder-on-a-BST guarantee, and checking it is exactly how you validate a BST.

**Expected output:** \`[ 1, 2, 4, 7, 8, 9, 11 ]\`.`,
      starterCode: `class TreeNode {
  val: number;
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

// GIVEN, complete: standard BST insert (ignores duplicates). Not the exercise.
function bstInsert(root: TreeNode | null, val: number): TreeNode {
  if (root === null) return new TreeNode(val);
  if (val < root.val) root.left = bstInsert(root.left, val);
  else if (val > root.val) root.right = bstInsert(root.right, val);
  return root;
}

function inorder(root: TreeNode | null): number[] {
  // TODO: recurse left, then take this node's val, then recurse right.
  // Tip: use an inner helper that pushes into one shared array.
  return [];
}

let bstRoot: TreeNode | null = null;
for (const v of [7, 2, 9, 4, 11, 1, 8]) {
  bstRoot = bstInsert(bstRoot, v);
}
// Inorder on a BST must come out SORTED:
console.log(inorder(bstRoot)); // expected: [ 1, 2, 4, 7, 8, 9, 11 ]`,
    },
    {
      id: "dsa-tree-sum",
      title: "Sum a tree",
      instructions: `Implement \`treeSum(root)\` with the combine-children template: base case \`null → 0\`, otherwise this value plus the sums of both subtrees. Three lines; the point is recognizing the template — swap the combine step and the same shape computes count, height, max, or depth-sum.

O(n) time (every node once), O(height) stack space.

**Expected output:** \`26\` then \`0\`.`,
      starterCode: `class TreeNode {
  val: number;
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

function treeSum(root: TreeNode | null): number {
  // TODO: the combine-children template.
  // Base case: null -> 0. Otherwise: this val + sum(left) + sum(right).
  return 0;
}

// Hand-built tree:      4
//                      / \\
//                     2   7
//                    / \\   \\
//                   1   3   9
const sampleRoot = new TreeNode(4);
sampleRoot.left = new TreeNode(2);
sampleRoot.right = new TreeNode(7);
sampleRoot.left.left = new TreeNode(1);
sampleRoot.left.right = new TreeNode(3);
sampleRoot.right.right = new TreeNode(9);

console.log(treeSum(sampleRoot)); // expected: 26
console.log(treeSum(null)); // expected: 0`,
    },
    ],
    quiz: [
    {
      id: "dsa-dfs-recursion-q1",
      prompt: "Which traversal visits a BST's values in sorted order, and why?",
      options: [
        "Preorder — the root is the natural starting point of the sorted sequence",
        "Inorder — the invariant puts smaller values in the left subtree and larger in the right, and left → node → right reads them in exactly ascending order",
        "Postorder — sorting requires resolving the children before the parent",
        "Level order — shallower nodes were inserted earlier, so they're smaller",
      ],
      answer: 1,
      explanation: "Inorder recurses left (everything smaller), visits the node, then recurses right (everything larger) — applied recursively that emits sorted order. It's also the standard BST validity check: inorder and confirm the output is strictly increasing.",
    },
    {
      id: "dsa-dfs-recursion-q2",
      prompt: "What auxiliary space does recursive DFS use on a tree of n nodes?",
      options: [
        "O(1) — recursion doesn't allocate anything; it just re-enters the same function",
        "O(n) always — every node gets a stack frame and they all live until the traversal finishes",
        "O(height) — one stack frame per node on the current root-to-leaf path: ~log n when balanced, but O(n) on a degenerate chain",
        "O(log n) always — the call stack can't grow past the tree's logarithmic depth",
      ],
      answer: 2,
      explanation: "Frames exist only for the path currently being explored; a frame pops as soon as its subtree is done. So the peak is the tree's height — ~20 frames for a balanced million-node tree, but n frames (and a possible stack overflow) on a linked-list-shaped tree.",
    },
    {
      id: "dsa-dfs-recursion-q3",
      prompt: "You're tearing down a tree where every node must be released strictly after both of its children. Which traversal order fits?",
      options: [
        "Preorder — release the parent first so nothing still points at freed children",
        "Inorder — it releases nodes in value order, which is the safest sequence",
        "Level order — releasing top-down by level guarantees parents outlive children",
        "Postorder — it processes left and right subtrees before the node itself, so a parent is only touched once its children are gone",
      ],
      answer: 3,
      explanation: "Postorder is the children-before-parent order — the shape for deletion, directory sizing, and any bottom-up aggregation where a node's answer depends on its children's answers. Preorder and level order do the opposite (parents first).",
    },
    ],
  },
  {
    id: "dsa-bfs-level-order",
    module: "trees",
    title: "Breadth-First: Level Order",
    blurb: "A queue turns a tree into levels; nearest-first search.",
    content: `# Breadth-First: Level Order

DFS plunges down; **BFS** sweeps across. It visits the root, then everything at depth 1, then depth 2 — the tree as horizontal slices. The engine is exactly the queue from the last module: dequeue a node, enqueue its children. Children land *behind* everything already waiting, which is precisely what makes shallow nodes come out before deep ones.

Same trap as before applies: \`shift()\` on a JS array is O(n) because it re-indexes every element. Use the **head-index discipline** — push to the back, read with a moving \`head\` pointer:

\`\`\`ts
const queue: TreeNode[] = [rootNode];
let head = 0;
while (head < queue.length) {
  const cur = queue[head++];            // O(1) "dequeue"
  if (cur.left) queue.push(cur.left);
  if (cur.right) queue.push(cur.right);
}
\`\`\`

That loop gives you *flat* BFS order. Grouping the output **by level** takes one extra idea:

## The level-size snapshot

At the top of each round, capture how many nodes are currently waiting — \`queue.length - head\`. That count is **exactly the current level**, because everything in the queue right now was enqueued by the *previous* level. Dequeue exactly that many, pushing children as you go; the children pile up behind the snapshot and form the **next** level. Without the snapshot, levels blur together mid-round and you can't tell where one ends — the snapshot is the entire difference between "BFS order" and "grouped by level."

## When BFS beats DFS

Any problem phrased as **nearest**, **minimum depth**, or **first encountered**. BFS meets every node at its *shallowest* possible depth, so the first hit is guaranteed to be an optimal one and you can stop immediately. DFS gives no such guarantee — it might find a depth-9 answer down the left branch while a depth-2 answer sits untouched on the right, so it has to explore everything before it can be sure. (Outside trees, this same property is why BFS finds shortest paths in unweighted graphs — next module.)

**Cost:** O(n) time — each node enqueued and dequeued once. Space is **O(width)**, the widest level. For a bushy (complete) tree the bottom level holds ~n/2 nodes, so BFS memory is effectively O(n) — the mirror image of DFS, whose O(height) stack loves bushy trees and hates chains. Tall and skinny → BFS is cheap; short and bushy → DFS is cheap.`,
    exercises: [
    {
      id: "dsa-level-order",
      title: "Collect the levels",
      instructions: `Implement \`levelOrder(root)\` returning the values grouped by level. Use an array-with-head-index queue (push to the back, advance a \`head\` pointer — never \`shift()\`, which is O(n) per dequeue).

The key move is the **level-size snapshot**: at the top of each round, record \`queue.length - head\`. That many nodes are the current level — dequeue exactly that count into one row, pushing children as you go. Everything you pushed during the round is the *next* level.

**Expected output:** \`[ [ 1 ], [ 2, 3 ], [ 4, 5, 6 ] ]\` then \`[]\`.`,
      starterCode: `class TreeNode {
  val: number;
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

function levelOrder(root: TreeNode | null): number[][] {
  // TODO: BFS with an array-plus-head-index queue (never shift()).
  // Each round: snapshot the number of nodes currently waiting
  // (queue.length - head) — that is exactly the current level. Dequeue that
  // many, pushing children as you go; the children are the NEXT level.
  return [];
}

// 3-level tree:        1
//                     / \\
//                    2   3
//                   / \\   \\
//                  4   5   6
const sampleRoot = new TreeNode(1);
sampleRoot.left = new TreeNode(2);
sampleRoot.right = new TreeNode(3);
sampleRoot.left.left = new TreeNode(4);
sampleRoot.left.right = new TreeNode(5);
sampleRoot.right.right = new TreeNode(6);

console.log(levelOrder(sampleRoot)); // expected: [ [ 1 ], [ 2, 3 ], [ 4, 5, 6 ] ]
console.log(levelOrder(null)); // expected: []`,
    },
    {
      id: "dsa-min-depth",
      title: "Minimum depth via BFS",
      instructions: `Implement \`minDepth(root)\` — the depth of the shallowest **leaf** (a node with no children; the root alone is depth 1) — using BFS. Track depth as you go (enqueue \`[node, depth]\` pairs, or count levels with the snapshot trick) and **return the moment you dequeue a leaf**.

That early return is the whole point: BFS meets every node at its shallowest depth, so the first leaf out of the queue is guaranteed to be the answer. DFS can't stop early — it might be deep in the long left chain while the depth-2 leaf waits on the right, so it must explore everything before it's sure. On the sample tree BFS looks at 3 nodes instead of all 5.

**Expected output:** \`2\` then \`0\`.`,
      starterCode: `class TreeNode {
  val: number;
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(val: number) {
    this.val = val;
  }
}

function minDepth(root: TreeNode | null): number {
  // TODO: BFS, tracking depth (enqueue [node, depth] pairs, or count levels).
  // The FIRST node you dequeue that has no children is the shallowest leaf —
  // return its depth immediately. Empty tree -> 0.
  return 0;
}

// Lopsided tree: a long chain on the left, a shallow leaf on the right.
//          1
//         / \\
//        2   3     <- 3 is a leaf at depth 2: BFS stops here
//       /
//      4
//     /
//    5             <- DFS would walk all the way down before it is sure
const sampleRoot = new TreeNode(1);
sampleRoot.left = new TreeNode(2);
sampleRoot.right = new TreeNode(3);
sampleRoot.left.left = new TreeNode(4);
sampleRoot.left.left.left = new TreeNode(5);

console.log(minDepth(sampleRoot)); // expected: 2
console.log(minDepth(null)); // expected: 0`,
    },
    ],
    quiz: [
    {
      id: "dsa-bfs-level-order-q1",
      prompt: "In the level-order loop, why snapshot the queue size at the top of each round instead of just draining the queue?",
      options: [
        "The snapshot count is exactly the current level — everything enqueued during the round is the next level, so the snapshot is what lets you group output by level",
        "Without it, children get enqueued twice and the loop revisits nodes",
        "Without it, nodes come out in the wrong order — plain draining doesn't produce valid BFS order",
        "It's a performance guard that keeps the queue from growing past O(width)",
      ],
      answer: 0,
      explanation: "Plain draining still yields correct flat BFS order and never revisits nodes — what it loses is the level boundaries. Snapshotting `queue.length - head` fences off the current level from the children being pushed behind it.",
    },
    {
      id: "dsa-bfs-level-order-q2",
      prompt: "You need the minimum depth (shallowest leaf) of a large tree. Why prefer BFS over DFS?",
      options: [
        "BFS is asymptotically faster than DFS at traversing trees",
        "BFS meets every node at its shallowest depth, so the first leaf dequeued is the answer and you stop early; DFS must keep exploring before it can be sure",
        "BFS uses less memory than DFS on every tree shape",
        "DFS can't track depth, so it can't compute minimum depth at all",
      ],
      answer: 1,
      explanation: "Both are O(n) worst case and DFS tracks depth fine — but DFS might find a depth-9 leaf down one branch while a depth-2 leaf sits unexplored elsewhere, so it can't stop until it has checked everything. BFS's shallowest-first guarantee makes the first leaf optimal. Memory actually favors DFS on bushy trees.",
    },
    {
      id: "dsa-bfs-level-order-q3",
      prompt: "For a complete (bushy) binary tree of n nodes, what is BFS's peak queue size?",
      options: [
        "O(log n) — the queue never holds more than one root-to-leaf path",
        "O(1) — nodes are dequeued as fast as they're enqueued",
        "O(n) — the widest level is the bottom one, holding about n/2 nodes",
        "O(n log n) — each node is enqueued once per level below it",
      ],
      answer: 2,
      explanation: "BFS memory is O(width), and a complete tree's bottom level holds ~n/2 nodes — effectively O(n). The one-path intuition describes DFS's stack, not BFS's queue: the two have mirrored memory profiles (BFS hates bushy, DFS hates deep).",
    },
    ],
  },
];
