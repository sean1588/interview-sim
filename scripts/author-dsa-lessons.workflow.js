export const meta = {
  name: 'author-dsa-lessons',
  description: 'Author + adversarially review the 8-module Data Structures & Algorithms curriculum (24 lessons, TypeScript exercises, quizzes).',
  phases: [
    { title: 'Author', detail: 'one agent per module writes lessons + exercises + quizzes, verifies starters transpile + run' },
    { title: 'Review', detail: 'adversarial review per module: algorithmic accuracy, scaffold-not-solution, quiz correctness, re-verify' },
  ],
}

// Full curriculum. Lesson/exercise ids + titles + blurbs are PRE-ASSIGNED here so
// they are deterministic and globally unique (all `dsa-` prefixed); agents fill in
// `content` (lesson markdown), `instructions` + `starterCode` per exercise, and a
// 3-question `quiz` per lesson (ids <lesson-id>-q1..q3, options CORRECT-FIRST — the
// generator rotates them). Audience: experienced TypeScript/JS developers who are
// new to (or rusty on) data structures and algorithms.
const CURRICULUM = [
  {
    moduleId: 'complexity', file: 'complexity.ts', konst: 'complexityLessons',
    lessons: [
      { id: 'dsa-big-o', title: 'Big-O: How Work Grows',
        blurb: 'Growth classes, dropping constants, and worst vs average case.',
        focus: "Big-O measures how WORK GROWS as input grows, not how fast code is on one input. The growth classes that matter in practice — O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ) — with a concrete table of what each means at n = 1,000 and n = 1,000,000 (an O(n²) pass over a million items is ~10¹² steps: minutes, not milliseconds). Why constants and lower-order terms are dropped (3n + 40 is O(n)). Worst vs average case briefly (hash lookup is O(1) average, O(n) worst). Anchor to the audience: they already FEEL this when a nested .includes() inside a .map() gets slow — name that instinct.",
        exercises: [
          { id: 'dsa-count-ops', title: 'Count the steps', task: 'Starter provides two complete implementations of containsDuplicate (a nested-loop O(n²) one and a Set-based O(n) one) each taking a `steps` counter object they must increment inside the loops (the TODO is adding the counting). An example run on arrays of length 50 and 100 prints both counters so they SEE ~4x vs ~2x growth. Keep the algorithm code given; the counting is the exercise.' },
          { id: 'dsa-classify-growth', title: 'Name that growth', task: 'Starter defines three small complete functions (one O(1) — array index + arithmetic; one O(n) — single scan for a max; one O(n²) — all-pairs sum check) and a classify(fnName) stub returning a growth-class string; the learner fills in the mapping after reading the code, and the example calls print their answers next to the expected classes.' },
        ] },
      { id: 'dsa-time-vs-space', title: 'Trading Space for Time',
        blurb: 'Memory is a resource you can spend to buy speed.',
        focus: "The most common optimization in interviews is spending O(n) memory to erase a factor of n in time: precomputed lookups, Sets for membership, Maps for pairing. Walk the canonical trade: two-sum by nested loops (O(n²) time, O(1) space) vs one pass with a Map (O(n) time, O(n) space). Space complexity counts AUXILIARY memory, not the input itself; in-place vs copying (sort() mutates, toSorted() copies). When NOT to trade: tiny n, memory-constrained environments, or when the constant factors of hashing dominate. Concrete numbers: a Set of a million small ints is tens of MB — usually fine, sometimes not.",
        exercises: [
          { id: 'dsa-trade-space', title: 'Buy speed with a Set', task: 'Starter gives a complete, working O(n²) findFirstDuplicate using nested loops, plus an empty findFirstDuplicateFast stub whose TODO is the O(n) Set-based version. Example calls run both on the same array and print the (matching) results.' },
          { id: 'dsa-memo-lookup', title: 'Precompute a lookup', task: 'Starter has a list of user objects and a complete-but-slow getUserName(users, id) that scans the array per call inside a loop of many lookups; the TODO is buildIndex(users) returning a Map<id, user> and rewriting the loop to use it. Prints a few looked-up names.' },
        ] },
      { id: 'dsa-reading-complexity', title: 'Reading Code for Complexity',
        blurb: 'Loops, halving, and hidden costs inside library calls.',
        focus: "How to read complexity off real code: sequential loops ADD (O(n) + O(n) = O(n)); nested loops MULTIPLY (O(n·m)); a loop that halves its range each step is O(log n); a loop with a linear scan inside (arr.includes, arr.indexOf, arr.shift) is a HIDDEN nested loop — the single biggest source of accidental O(n²) in JS/TS. Library-call costs the audience uses daily: .includes/.indexOf O(n), .push/.pop O(1) amortized, .shift/.unshift O(n), .slice O(n), sort O(n log n), Map/Set get/has O(1) average. Briefly: amortized means occasional expensive operations averaged over many cheap ones (array growth doubling).",
        exercises: [
          { id: 'dsa-halving-loop', title: 'The halving loop', task: 'Implement countHalvings(n): repeatedly halve n (integer division) until it reaches 1, counting steps; example calls print counts for 8, 1024, and 1_000_000 so the learner sees log₂ growth (3, 10, ~20). Starter is a stub returning 0 with the example calls in place.' },
          { id: 'dsa-hidden-scan', title: 'Spot the hidden O(n)', task: 'Starter shows a complete dedupe(arr) built with `result.includes(x)` inside a loop (works, but O(n²), stated in a comment as the smell to fix); the TODO is dedupeFast(arr) with a Set in O(n). Example prints both outputs on the same input to confirm they match.' },
        ] },
    ],
  },
  {
    moduleId: 'arrays-strings', file: 'arrays-strings.ts', konst: 'arraysStringsLessons',
    lessons: [
      { id: 'dsa-two-pointers', title: 'Two Pointers',
        blurb: 'Converging indexes that replace nested loops on ordered data.',
        focus: "The two-pointer technique: two indexes moving through an array (usually converging from both ends, sometimes both moving forward) that exploit ORDER to replace an O(n²) pair search with O(n). The core insight to teach explicitly: each comparison lets you discard one pointer's element FOREVER — that's why it's linear, and why it needs sorted (or symmetric) data. Canonical uses: palindrome check (symmetric), pair-with-target-sum in a SORTED array (if sum too small move left pointer right, too big move right pointer left), reversing in place, removing items in place with a read/write pointer. Contrast with the hash-map approach to the same pair problem (next module previews).",
        exercises: [
          { id: 'dsa-palindrome-check', title: 'Palindrome with two pointers', task: 'Implement isPalindrome(s: string) with left/right pointers and NO reversed-copy shortcut (say so in the instructions — the point is the pointer walk, and the copy costs O(n) extra space). Starter stub returns false; example calls print results for a palindrome and a non-palindrome.' },
          { id: 'dsa-pair-sum-sorted', title: 'Pair sum in a sorted array', task: 'Implement pairWithSum(sorted: number[], target: number): [number, number] | null using converging pointers; instructions must state WHY moving the correct pointer is safe (discarding logic). Stub returns null; examples print a found pair and a null case.' },
        ] },
      { id: 'dsa-sliding-window', title: 'Sliding Windows',
        blurb: 'Fixed and growing windows over subarrays and substrings.',
        focus: "Sliding window = a two-pointer variant where the pointers bound a contiguous RANGE and you maintain a running summary of what's inside instead of recomputing it. Fixed-size windows: max sum of any k consecutive items — subtract the element leaving, add the element entering, O(n) instead of O(n·k). Variable-size windows: grow the right edge, shrink the left edge only when a constraint breaks (longest substring without repeats, using a Set of chars in the window). The invariant framing to teach: 'the window is always valid between iterations'. When it does NOT apply: non-contiguous subsequences, or negative numbers breaking 'growing helps' assumptions in some problems.",
        exercises: [
          { id: 'dsa-max-window-sum', title: 'Max sum of k neighbors', task: 'Implement maxWindowSum(nums: number[], k: number) with the subtract-leaving/add-entering rolling sum (instructions forbid re-summing each window and say why: that would be O(n·k)). Stub returns 0; examples print results for a couple of arrays.' },
          { id: 'dsa-longest-unique', title: 'Longest run of unique characters', task: 'Implement longestUniqueRun(s: string) with a grow-right/shrink-left window and a Set; instructions spell out the invariant (window never contains a duplicate). Stub returns 0; examples include a string with repeats ("abcabcbb" → 3).' },
        ] },
      { id: 'dsa-prefix-sums', title: 'Prefix Sums',
        blurb: 'Precompute running totals; answer range queries in O(1).',
        focus: "Prefix sums: one O(n) pass builds prefix[i] = sum of the first i elements (with the length-n+1, prefix[0] = 0 convention — teach THAT convention, it kills the off-by-ones), after which ANY range sum [i, j) is prefix[j] - prefix[i] in O(1). The economics: pay O(n) once instead of O(n) per query — the break-even is at the second query. Applications: range-sum queries, equilibrium/balance point, counting subarrays with a property (mention, don't deep-dive). This is the array version of the space-for-time trade from module 1 — connect them.",
        exercises: [
          { id: 'dsa-build-prefix', title: 'Build the prefix array', task: 'Implement buildPrefix(nums) returning the length-n+1 prefix array with prefix[0] = 0, and rangeSum(prefix, i, j) for the half-open range [i, j). Both are stubs (return [] / 0); example calls print a prefix array and two range sums with expected values in comments.' },
          { id: 'dsa-balance-point', title: 'Find the balance point', task: 'Implement balanceIndex(nums): the index where the sum of elements strictly before equals the sum strictly after (or -1), using a total + running left sum in ONE pass (instructions rule out re-summing both sides per index). Stub returns -1; examples include an array with a balance point and one without.' },
        ] },
    ],
  },
  {
    moduleId: 'hash-maps', file: 'hash-maps.ts', konst: 'hashMapsLessons',
    lessons: [
      { id: 'dsa-hash-mechanics', title: 'How a Hash Map Actually Works',
        blurb: 'Hash to a bucket, chain on collision — why O(1) is "average".',
        focus: "Under the hood of Map/Set: a hash function turns the key into a number, modulo the bucket-array length picks a bucket, and COLLISIONS (two keys, one bucket) are handled by chaining a little list per bucket. That's why lookup is O(1) AVERAGE (short chains) but O(n) worst (everything in one bucket), and why load factor triggers resize-and-rehash. What makes a good hash function: spread, determinism. In TS/JS practice: Map vs plain object (Map for arbitrary/typed keys, insertion order, .size), Set for membership, and the object-identity trap — object keys hash by REFERENCE, so two equal-looking objects are different keys (serialize to a string key when you need value semantics).",
        exercises: [
          { id: 'dsa-toy-hash-map', title: 'Build a toy hash map', task: 'Starter provides a complete simple stringHash(key) and a ToyMap class skeleton with a fixed 8-bucket array of [key, value][] chains; the TODOs are set(key, value) (replace on existing key, else push) and get(key). Example calls set a few keys (at least two colliding — pick keys the given hash sends to one bucket and say so in a comment), then print gets.' },
          { id: 'dsa-collision-count', title: 'Watch the collisions', task: 'Using the same given stringHash and a bucket count of 8, implement bucketCounts(keys: string[]): number[] returning how many of the given keys land in each bucket; example prints the distribution for ~12 sample keys so the learner sees uneven spread. Stub returns an 8-zero array.' },
        ] },
      { id: 'dsa-frequency-maps', title: 'Frequency Counting',
        blurb: 'The count-everything-first pattern behind a huge problem family.',
        focus: "The frequency-map pattern: one O(n) pass building Map<item, count>, then answer questions from the counts. It converts 'compare everything with everything' problems into two linear passes. Canonical members: anagram check (equal counts), first unique character, most-frequent element, 'can A be built from B'. The Map idioms that matter in TS: map.get(k) ?? 0 for the increment, iterating map.entries(). Complexity framing: O(n) time, O(k) space where k = distinct items — for lowercase letters k ≤ 26, effectively O(1).",
        exercises: [
          { id: 'dsa-char-counts', title: 'Count characters', task: 'Implement charCounts(s: string): Map<string, number>; stub returns an empty Map. Example prints a few looked-up counts (use console.log on specific .get calls, not the whole Map — say in a comment that printing a raw Map stringifies poorly here).' },
          { id: 'dsa-anagram-check', title: 'Anagram check', task: 'Implement isAnagram(a: string, b: string) via frequency counts (instructions: the sort-both-strings alternative works but costs O(n log n) — counting is O(n); mention the early length check). Stub returns false; examples print a true and a false case.' },
        ] },
      { id: 'dsa-seen-before', title: 'Seen-Before Patterns',
        blurb: 'Sets and Maps as memory: dedupe, detect, and pair in one pass.',
        focus: "The 'have I seen this before?' family: a Set (or Map when you need to remember WHERE/WHAT) consulted inside a single pass. Members: first repeated item, dedupe preserving order, and the classic two-sum on an UNSORTED array — for each x, ask the map for target - x before inserting x (one pass, handles duplicates cleanly, and works unsorted precisely where the two-pointer version needed sorted input — call back to that lesson explicitly). Teach the general shape: check-then-insert per element, so each element is both a query and future data.",
        exercises: [
          { id: 'dsa-first-repeat', title: 'First repeated value', task: 'Implement firstRepeat(items: string[]): string | null with a Set in one pass; stub returns null. Examples print the first repeat of a list with one and null for an all-unique list.' },
          { id: 'dsa-two-sum-map', title: 'Two-sum, unsorted, one pass', task: 'Implement twoSum(nums: number[], target: number): [number, number] | null returning INDEXES, using the check-then-insert Map pattern (instructions: state why checking before inserting also handles x + x = target with duplicate values). Stub returns null; examples print a found pair and a null case.' },
        ] },
    ],
  },
  {
    moduleId: 'linked-lists', file: 'linked-lists.ts', konst: 'linkedListsLessons',
    lessons: [
      { id: 'dsa-linked-list-basics', title: 'Nodes and Links',
        blurb: 'What a linked list buys you, and what it costs.',
        focus: "A linked list is nodes holding a value and a `next` reference — memory scattered, ORDER carried by the links. The honest trade vs arrays: O(1) insert/remove AT A KNOWN NODE (no shifting) and O(1) head operations, against O(n) access by index and terrible cache behavior. Singly vs doubly (a `prev` pointer buys O(1) delete-this-node and backward walks at the cost of bookkeeping). The traversal idiom `let cur = head; while (cur) { ...; cur = cur.next }` and null as the end-of-list. Where they actually appear for this audience: queue internals, LRU caches, and interviews. Define the course-wide ListNode class convention here (class ListNode { val; next } — NEVER named just `Node`).",
        exercises: [
          { id: 'dsa-list-from-array', title: 'Array ⇄ list', task: 'Starter provides the ListNode class complete plus a complete toArray(head) helper (so later exercises can print lists); the TODO is fromArray(nums: number[]): ListNode | null building the list front to back. Example builds from [1,2,3] and prints toArray of the result.' },
          { id: 'dsa-list-length-find', title: 'Walk the list', task: 'Given the ListNode class and complete fromArray/toArray helpers, implement listLength(head) and contains(head, val) by traversal. Stubs return 0/false; examples print both on a sample list.' },
        ] },
      { id: 'dsa-fast-slow-pointers', title: 'Fast & Slow Pointers',
        blurb: 'Two runners at different speeds find middles and cycles.',
        focus: "The runner technique: two pointers advancing at different speeds through the same list. Middle node: fast moves two, slow moves one; when fast hits the end slow is at the middle — one pass, no length precount. Cycle detection (Floyd): in a cyclic list fast eventually LAPS slow and they meet — teach the why (once both are in the cycle the gap shrinks by one each step, so meeting is guaranteed), and that it's O(1) space where the Set-of-visited-nodes alternative (call back to seen-before) costs O(n). Guard idiom: `while (fast && fast.next)`.",
        exercises: [
          { id: 'dsa-middle-node', title: 'Find the middle', task: 'Implement middleNode(head): ListNode | null with fast/slow (instructions rule out counting length first — one pass is the point; for even lengths return the second middle and say so). ListNode/fromArray/toArray given complete. Stub returns null; examples print middle values for odd- and even-length lists.' },
          { id: 'dsa-detect-cycle', title: 'Detect a cycle', task: 'Implement hasCycle(head): boolean with Floyd fast/slow. Starter provides helpers plus a small hand-built cyclic list (built by assigning .next to an earlier node — comment how) and an acyclic one; examples print both results. Stub returns false.' },
        ] },
      { id: 'dsa-reverse-list', title: 'Reversing In Place',
        blurb: 'The prev/cur/next pointer dance, and in-place edits generally.',
        focus: "In-place reversal — the signature linked-list interview move and the cleanest showcase of careful pointer surgery: walk with prev/cur, saving next BEFORE overwriting cur.next, flipping the link, advancing both. O(n) time, O(1) space, vs the copy-to-array-and-rebuild alternative at O(n) space. Generalize the discipline: for any in-place list edit, grab the reference you're about to destroy first. Also cover removal (skipping a node by linking around it) and the DUMMY/sentinel head node trick that erases the 'removing the head' special case — teach dummy nodes as edge-case killers.",
        exercises: [
          { id: 'dsa-reverse-in-place', title: 'Reverse the list', task: 'Implement reverseList(head): ListNode | null with the prev/cur/next walk (instructions forbid converting to an array; state the O(1)-space goal). Helpers given complete. Stub returns head unchanged; example prints the list before and after.' },
          { id: 'dsa-remove-value', title: 'Remove every match', task: 'Implement removeValue(head, val): ListNode | null deleting ALL nodes with that value, using a dummy head so removing real-head matches needs no special case (instructions name the dummy-node trick as the point). Stub returns head; examples include a list whose head must be removed.' },
        ] },
    ],
  },
  {
    moduleId: 'stacks-queues', file: 'stacks-queues.ts', konst: 'stacksQueuesLessons',
    lessons: [
      { id: 'dsa-stack-patterns', title: 'Stacks: Last In, First Out',
        blurb: 'Matching, nesting, and undoing — wherever order reverses.',
        focus: "A stack is push/pop/peek at one end, O(1) each — in TS an array used ONLY via push/pop (say that explicitly: discipline, not a new type). The tell for reaching for one: the problem involves NESTING or the most-recent-thing-first — matched brackets, undo history, the call stack itself (relate recursion to an implicit stack — this pays off in the trees module), evaluating postfix/RPN expressions. Walk the bracket-matching algorithm: push openers, on a closer pop and check the pair, valid iff never mismatched and empty at the end — and enumerate the three failure modes (wrong pair, pop from empty, leftovers).",
        exercises: [
          { id: 'dsa-bracket-match', title: 'Balanced brackets', task: "Implement isBalanced(s: string) for ()[]{} with a stack and a closer→opener lookup (Map or object literal); instructions call out all three failure modes that must return false. Stub returns false; examples print results for a valid string, a wrong-pair string, and an unclosed string." },
          { id: 'dsa-evaluate-rpn', title: 'Evaluate RPN', task: "Implement evalRPN(tokens: string[]): number for + - * / on integer tokens (postfix/reverse-Polish); instructions explain the push-numbers/pop-two-on-operator loop and note operand ORDER matters for - and /. Stub returns 0; examples print [\"2\",\"3\",\"+\",\"4\",\"*\"] → 20 and one with subtraction." },
        ] },
      { id: 'dsa-queues', title: 'Queues: First In, First Out',
        blurb: 'Processing in arrival order — and the shift() trap.',
        focus: "A queue is enqueue at the back, dequeue at the front, O(1) each — buffering, BFS frontiers, rate limiting, task scheduling. THE TS/JS TRAP to teach hard: array.shift() is O(n) (everything slides down), so an array-as-queue in a loop is accidentally O(n²); the fixes are a head-index queue (array + read pointer, never actually removing) or a linked-list-backed queue — implement the head-index one. Deques (push/pop at both ends) briefly, as the tool behind sliding-window-maximum. Preview honestly: the trees module's BFS is this queue put to work.",
        exercises: [
          { id: 'dsa-pointer-queue', title: 'A queue without shift()', task: 'Starter gives a SimpleQueue class skeleton holding an items array and a head index; TODOs are enqueue, dequeue, and size (dequeue advances head instead of shifting — instructions state the O(n) shift() cost as the reason). Example enqueues several values, dequeues two, prints them and the size.' },
          { id: 'dsa-recent-hits', title: 'Hits in the last 100 ticks', task: 'Implement a HitCounter with hit(tick) and countSince(tick) counting hits in (tick-100, tick], evicting old ticks from the front of an internal queue as time advances (instructions: each tick enters and leaves at most once → amortized O(1)). Skeleton class given; example prints counts at a few tick values.' },
        ] },
      { id: 'dsa-monotonic-stack', title: 'Monotonic Stacks',
        blurb: 'Keep the stack sorted; answer "next greater" in O(n).',
        focus: "The monotonic stack: while pushing each element, first pop everything that violates a sort order — every element pushed once, popped at most once, so the whole run is O(n) even with the inner while (teach that amortized argument explicitly; the nested-looking loop fools people). It answers the 'next greater/smaller element' family: for each item, the element that pops it is its answer. Work the next-greater-element trace on a short array in the content, showing the stack at each step (indexes on the stack, not values — you need positions to record answers). Where it shows up: daily temperatures, stock span, histogram problems (name-drop only).",
        exercises: [
          { id: 'dsa-next-greater', title: 'Next greater element', task: 'Implement nextGreater(nums: number[]): number[] (for each index, the next value to its right that is greater, else -1) with a stack of INDEXES; instructions restate the push-once/pop-once O(n) argument. Stub returns []; example prints the result for [2,1,2,4,3] with the expected answer in a comment.' },
          { id: 'dsa-stock-span', title: 'Stock span', task: 'Implement spans(prices: number[]): number[] — for each day, how many consecutive prior days (including today) had a price ≤ today — with a monotonic stack (instructions connect it to next-greater: a strictly-greater previous price is the boundary). Stub returns []; example prints spans for a sample week.' },
        ] },
    ],
  },
  {
    moduleId: 'trees', file: 'trees.ts', konst: 'treesLessons',
    lessons: [
      { id: 'dsa-tree-basics', title: 'Binary Trees and BSTs',
        blurb: 'Hierarchy, the BST ordering invariant, and why balance matters.',
        focus: "Trees model hierarchy: root, children, leaves, height; a binary tree caps children at two. Define the course TreeNode convention (class TreeNode { val; left; right } — NEVER named `Node`). The Binary SEARCH Tree invariant — everything in the left subtree is smaller, right is larger, RECURSIVELY at every node — and what it buys: search/insert follow one root-to-leaf path, O(height). The catch that makes or breaks BSTs: height is O(log n) only when BALANCED; inserting sorted data degenerates the tree into a linked list and O(n) operations — that's WHY production trees self-balance (name AVL/red-black, don't implement). Duplicates: pick a rule (ignore) and say so.",
        exercises: [
          { id: 'dsa-bst-insert', title: 'Insert into a BST', task: 'Starter gives the TreeNode class complete; TODOs are insert(root, val): TreeNode (returning the possibly-new root, ignoring duplicates) and contains(root, val): boolean — iterative or recursive, learner’s choice. Example inserts several values and prints two contains checks.' },
          { id: 'dsa-tree-height', title: 'Height of a tree', task: 'Implement height(root): number (empty tree = 0) recursively: 1 + max(height of children). Starter provides TreeNode plus a small hand-built tree; stub returns 0; example prints the height with the expected value in a comment.' },
        ] },
      { id: 'dsa-dfs-recursion', title: 'Depth-First Traversals',
        blurb: 'Preorder, inorder, postorder — recursion as a tree walker.',
        focus: "DFS commits to one subtree before touching the other; recursion is its natural form because the call stack IS the path back up (call back to the stacks lesson explicitly). The three orders differ only in when you visit the node relative to recursing: preorder (node, left, right — copying/serializing), inorder (left, node, right — and the punchline: inorder on a BST yields SORTED order, which is also how you validate one), postorder (left, right, node — children before parents: deleting, sizing, bottom-up aggregation). Teach the aggregate-shape: most tree problems are 'combine the answers from left and right' — sum, height, count all fit one recursive template. O(n) time always; O(height) stack space.",
        exercises: [
          { id: 'dsa-inorder-collect', title: 'Inorder of a BST is sorted', task: 'Implement inorder(root): number[] recursively. Starter provides TreeNode and a prebuilt BST (built with a GIVEN complete insert helper from an unsorted value list); example prints the traversal and a comment notes it must come out sorted. Stub returns [].' },
          { id: 'dsa-tree-sum', title: 'Sum a tree', task: 'Implement treeSum(root): number with the combine-children recursive template (base case null → 0). Starter provides TreeNode and a small hand-built tree; stub returns 0; example prints the sum with the expected total in a comment.' },
        ] },
      { id: 'dsa-bfs-level-order', title: 'Breadth-First: Level Order',
        blurb: 'A queue turns a tree into levels; nearest-first search.',
        focus: "BFS visits the tree level by level, powered by exactly the queue from the last module (use the head-index discipline, not shift() — reinforce the trap). The level-order loop with the LEVEL-SIZE snapshot: capture queue length at the top of each round, process exactly that many, and everything you enqueued meanwhile is the NEXT level — that snapshot trick is what separates 'flat BFS order' from 'grouped by level'. When BFS beats DFS: anything 'nearest'/'minimum depth'/'first encountered', because BFS meets every node at its shallowest. Cost: O(n) time, O(width) queue — for a bushy tree the bottom level is ~n/2, so its memory profile is the mirror of DFS's O(height).",
        exercises: [
          { id: 'dsa-level-order', title: 'Collect the levels', task: 'Implement levelOrder(root): number[][] using an array-with-head-index queue and the level-size snapshot; instructions restate the snapshot trick. Starter provides TreeNode and a hand-built 3-level tree; stub returns []; example prints the nested levels.' },
          { id: 'dsa-min-depth', title: 'Minimum depth via BFS', task: 'Implement minDepth(root): number — depth of the shallowest LEAF — with BFS, returning the moment a leaf is dequeued (instructions: contrast with DFS, which must explore everything before it can be sure). Starter provides TreeNode and a lopsided tree where BFS stops early; stub returns 0; example prints the depth.' },
        ] },
    ],
  },
  {
    moduleId: 'graphs', file: 'graphs.ts', konst: 'graphsLessons',
    lessons: [
      { id: 'dsa-graph-representation', title: 'Representing Graphs',
        blurb: 'Vertices, edges, and why adjacency lists usually win.',
        focus: "Graphs are relationships without hierarchy: vertices + edges, directed or undirected, weighted or not; trees are just connected acyclic graphs (bridge from the last module). The two representations and their trade: adjacency MATRIX (n×n grid — O(1) edge check, O(n²) memory, only worth it for dense graphs) vs adjacency LIST (Map<vertex, neighbors[]> — O(V+E) memory, iterate-your-neighbors in degree time; the default for the sparse graphs real problems have). Building the Map from an edge list — including inserting BOTH directions for undirected edges and making sure isolated vertices still get (empty) entries. Degree in/out for directed graphs, setting up topological sort.",
        exercises: [
          { id: 'dsa-build-adjacency', title: 'Edge list → adjacency map', task: 'Implement buildAdjacency(vertexCount: number, edges: [number, number][], directed: boolean): Map<number, number[]> — every vertex 0..n-1 gets an entry even with no edges; undirected inserts both directions. Stub returns an empty Map; example builds one directed and one undirected graph and prints a few neighbor lists via .get.' },
          { id: 'dsa-vertex-degrees', title: 'In-degrees', task: 'Implement inDegrees(vertexCount: number, edges: [number, number][]): number[] for a directed graph (instructions note this array is the seed of topological sort, two lessons ahead). Stub returns []; example prints the in-degree array for a small DAG with the expected values in a comment.' },
        ] },
      { id: 'dsa-graph-traversal', title: 'Graph DFS & BFS',
        blurb: 'The visited set, connected components, and shortest hops.',
        focus: "Tree traversals almost transfer to graphs, except graphs have CYCLES — so the ONE non-negotiable addition is the visited set consulted before every enqueue/recursion (call back to seen-before; omitting it is an infinite loop, say so bluntly). DFS from a vertex reaches everything connected to it → run it from every unvisited vertex and you've counted CONNECTED COMPONENTS (the outer-loop pattern). BFS on an UNWEIGHTED graph gives shortest paths in EDGE COUNT, by the same nearest-first argument as min-depth — track distance per vertex as you enqueue. Union-find gets an honest intro here as the OTHER way to track components (union by joining sets, find with path compression) — one paragraph of mechanism, when to prefer it (incremental edges), no implementation required.",
        exercises: [
          { id: 'dsa-count-components', title: 'Count the islands (components)', task: 'Implement countComponents(vertexCount: number, edges: [number, number][]): number for an undirected graph — buildAdjacency given COMPLETE from last lesson; the TODO is the visited set + DFS (iterative with an explicit stack or recursive) + outer loop. Stub returns 0; example prints the count for a graph with two components and an isolated vertex (expected 3).' },
          { id: 'dsa-shortest-hops', title: 'Shortest path in hops', task: 'Implement shortestHops(vertexCount, edges, start, goal): number (-1 if unreachable) with BFS and a distance map, on an undirected graph; adjacency helper given complete. Instructions restate why BFS (not DFS) answers "fewest edges". Stub returns -1; examples print a reachable and an unreachable case.' },
        ] },
      { id: 'dsa-topological-sort', title: 'Topological Sort',
        blurb: "Kahn's algorithm: dependency order for DAGs, cycles detected free.",
        focus: "Topological order: a linear order of a DIRECTED graph where every edge points forward — the shape of every dependency problem (build systems, course prerequisites, task scheduling). Only DAGs have one; any cycle makes it impossible. Kahn's algorithm as the workhorse: compute in-degrees (last lesson's exercise, literally), queue every vertex with in-degree 0, repeatedly dequeue into the order and decrement each neighbor's in-degree, enqueueing those that hit 0. The elegant bonus to spotlight: if the produced order is SHORTER than n, the leftovers form a cycle — detection falls out for free. Complexity O(V+E). Mention DFS-postorder-reversed as the alternative for the curious.",
        exercises: [
          { id: 'dsa-course-order', title: 'Order the prerequisites', task: "Implement courseOrder(courseCount: number, prereqs: [number, number][]): number[] | null with Kahn's algorithm ([a, b] means b must come before a; null when a cycle blocks any order). buildAdjacency/inDegrees given complete; the TODO is the queue loop. Stub returns null; examples print a valid order for a DAG and null for a graph with a cycle." },
          { id: 'dsa-can-finish', title: 'Is it even possible?', task: 'Implement canFinish(courseCount, prereqs): boolean — just the cycle question, by checking whether the Kahn order covers every vertex (instructions: identical loop, simpler bookkeeping — count processed vertices instead of collecting them). Stub returns false; examples print true for a DAG and false for a cycle.' },
        ] },
    ],
  },
  {
    moduleId: 'sorting-searching', file: 'sorting-searching.ts', konst: 'sortingSearchingLessons',
    lessons: [
      { id: 'dsa-binary-search', title: 'Binary Search',
        blurb: 'Halve the sorted search space; get the boundaries right.',
        focus: "Binary search: on SORTED data, one comparison discards half the candidates — O(log n), 20 comparisons for a million items (give that number). The canonical lo/hi/mid loop with inclusive bounds and `while (lo <= hi)`, mid = Math.floor((lo + hi) / 2), and the discipline that prevents the classic bugs: every branch must SHRINK the range (mid ± 1, never mid), and the loop condition matches the bound convention — teach ONE convention and stick to it course-wide. The precondition is absolute: unsorted data gives confidently wrong answers, not errors. Variants preview: the same loop, biased, finds the FIRST occurrence among duplicates (keep searching left after a hit).",
        exercises: [
          { id: 'dsa-binary-search-impl', title: 'The canonical loop', task: 'Implement binarySearch(sorted: number[], target: number): number (index or -1) with inclusive lo/hi and while (lo <= hi); instructions state the every-branch-shrinks rule as the bug-killer. Stub returns -1; examples print a hit, a miss, and both edge elements of the array.' },
          { id: 'dsa-first-occurrence', title: 'First occurrence', task: 'Implement firstOccurrence(sorted: number[], target: number): number — leftmost index among duplicates — by recording a hit and continuing to search LEFT instead of returning. Stub returns -1; example uses an array with a run of duplicates and prints the leftmost index (expected value in a comment).' },
        ] },
      { id: 'dsa-search-the-answer', title: 'Binary Searching the Answer',
        blurb: 'The first-true boundary: binary search beyond arrays.',
        focus: "The generalization that unlocks a whole problem family: binary search needs a MONOTONIC PREDICATE, not literally an array — anything that reads false, false, …, true, true has a findable boundary in O(log n) probes. Recast known problems in that frame: insertion point (first index whose value ≥ target), first bad version (first build where isBad flips true), capacity/speed problems ('smallest rate that finishes in time' — describe, don't implement). Teach the first-true loop shape distinctly from exact-match: lo = 0, hi = n (exclusive, can return n = 'no true exists'), while (lo < hi), true → hi = mid, false → lo = mid + 1 — and WHY hi = mid (mid might BE the boundary; never discard a possible answer). Expensive predicates are the point: each probe might cost a real computation, and log n probes is the win.",
        exercises: [
          { id: 'dsa-insertion-point', title: 'Insertion point', task: 'Implement insertionPoint(sorted: number[], target: number): number — the first index whose value is ≥ target (n if none) — with the first-true loop (lo < hi, hi = mid on true). Instructions contrast the shape with exact-match search. Stub returns 0; examples print positions for a value present, a value between elements, and a value past the end.' },
          { id: 'dsa-first-bad-version', title: 'First bad version', task: 'Starter provides a GIVEN isBad(version: number) closure (bad from a hidden threshold on) that also counts its calls; implement firstBad(n: number) with the boundary loop, then the example prints the found version AND the probe count to show ~log₂ n calls for n = 1_000_000. Stub returns 1.' },
        ] },
      { id: 'dsa-sorting-survey', title: 'How Sorting Actually Works',
        blurb: 'Insertion, merge, quick — and using the built-in well.',
        focus: "What's inside a sort, taught by mechanism: insertion sort (grow a sorted prefix, shift each new item back — O(n²) but the best on tiny or nearly-sorted input, which is why real sorts use it as their base case); merge sort (split, recurse, MERGE two sorted halves with two pointers — O(n log n) guaranteed, stable, O(n) extra space; the merge step is the exercise); quicksort (partition around a pivot — O(n log n) average, O(n²) on adversarial pivots, in place). STABILITY defined once, properly: equal elements keep their relative order — it's what makes sort-by-B-then-A layering work. Then the practical layer this audience ships: JS .sort() DEFAULTS TO STRING COMPARISON ([10, 9, 1].sort() → [1, 10, 9] — show it), so always pass (a, b) => a - b for numbers; comparator contract (negative/zero/positive), sort() mutates vs toSorted(), and V8's sort is stable by spec.",
        exercises: [
          { id: 'dsa-merge-step', title: 'The merge step', task: 'Implement merge(a: number[], b: number[]): number[] merging two ALREADY-SORTED arrays with two pointers in O(n + m), including draining the leftover tail (instructions call the tail-drain out — the classic missed case). Stub returns []; examples print merges of equal-length, different-length, and one-empty inputs.' },
          { id: 'dsa-comparator-fix', title: 'Fix the comparator', task: 'Starter shows const sortedWrong = [10, 9, 1, 200].sort() with its surprising output printed; TODOs are numericSort(nums) using a correct comparator WITHOUT mutating the input (toSorted or copy-then-sort — instructions mention both) and byAgeThenName(people) sorting an object array by two keys. Examples print all three results.' },
        ] },
    ],
  },
]

const OUT_DIR = '/tmp/dsa-lessons'

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['moduleId', 'jsonPath', 'lessonCount', 'exerciseCount', 'quizCount', 'allStartersRun', 'unrunnableStarters', 'issues', 'status'],
  properties: {
    moduleId: { type: 'string' },
    jsonPath: { type: 'string' },
    lessonCount: { type: 'number' },
    exerciseCount: { type: 'number' },
    quizCount: { type: 'number', description: 'total quiz questions written for the module (3 per lesson)' },
    allStartersRun: { type: 'boolean' },
    unrunnableStarters: { type: 'array', items: { type: 'string' }, description: 'exercise ids whose starter could not be executed cleanly (should be empty)' },
    issues: { type: 'array', items: { type: 'string' }, description: 'problems found/fixed; empty if clean' },
    status: { type: 'string', enum: ['ok', 'problems'] },
  },
}

const RULES = `
AUDIENCE: experienced developers who write TypeScript/JavaScript comfortably but are NEW TO (or rusty on) data structures and algorithms.
- NEVER explain what a variable, loop, function, class, array, or object fundamentally is. They ship code for a living.
- NEVER teach TypeScript syntax — the language is the vehicle, not the subject. Lead with the MECHANISM (what is actually in memory, what happens step by step) and the COMPLEXITY (name the Big-O of everything, with concrete numbers at real sizes where it lands the point).
- Anchor new structures to what this audience already does daily ("you've built this ad hoc every time you keyed an object by id").
- Always answer "when would I reach for this?" — the tool-selection judgment is the course's real product.

CONTENT FORMAT:
- "content" is GitHub-flavored Markdown shown on screen. Use fenced \\\`\\\`\\\`ts code blocks for examples. Aim for ~200-500 words plus short, correct examples per lesson. Teach the concept fully — this is the on-screen lesson card the tutor refers to.
- "instructions" is short Markdown telling the learner what to implement, with a line about expected output.

STARTER CODE (the most important rules):
- "starterCode" is a RUNNABLE, SELF-CONTAINED TypeScript scaffold the learner edits: types/signature plus a clear "// TODO" plus example calls that console.log something, so clicking Run produces output WITHOUT a runtime error.
- It MUST NOT contain the solution to the exercise. Leave the target algorithm as a TODO with a placeholder return (0 / -1 / null / [] / false / head unchanged) that still runs clean. BUT: infrastructure that is NOT the point of the exercise (ListNode/TreeNode classes, fromArray/toArray converters, given hash functions, prebuilt sample trees/graphs/lists, helpers the plan says are "given complete") must be PROVIDED COMPLETE and working — the learner implements only the algorithm under study.
- SINGLE FILE, NO MODULES: never use top-level import or export or require — the runner executes one self-contained file and cannot resolve modules. Define everything inline, including node classes, in EVERY starter that needs them.
- NAMING (this gates CI): the editor type-checks each starter as an ISOLATED SCRIPT against the full DOM lib, so top-level declarations that collide with browser globals produce failing squiggles. NEVER declare top-level identifiers named: Node, Event, Cache, Text, Range, Comment, Image, Option, History, Location, Screen, name, status, top, self, parent, history, length, origin, closed, open, close, print, focus, blur, stop, scroll, alert, prompt, confirm, screen, frames, opener, event. Use ListNode / TreeNode for node classes, listLen / treeHeight-style names for values. Inside functions, any parameter/local name is fine.
- This engine is TRANSPILE-AND-RUN: TYPE errors do NOT block Run (they show as editor squiggles only), but the starter MUST be free of RUNTIME errors AND free of unintended type squiggles. Do not write deliberately ill-typed code.
- No async. No infinite loops (a TODO stub must not spin: if the loop condition depends on the learner's code, guard the starter so the placeholder returns immediately). Recursion is fine.
- TypeScript only. 2-space indentation. Keep starters focused — roughly 15-45 lines.

QUIZ (3 questions per lesson, never optional):
- Each lesson gets "quiz": an array of EXACTLY 3 questions with ids "<lesson-id>-q1", "<lesson-id>-q2", "<lesson-id>-q3" (pre-determined — use them verbatim).
- Each question: { "id", "prompt", "options", "explanation" }. EXACTLY 4 options, all distinct, no "all/none of the above". Put the CORRECT answer FIRST (options[0]) — do NOT include an "answer" field; the generator rotates the options and sets the index deterministically.
- Test JUDGMENT, not trivia: complexity of an operation, which structure/technique fits a described situation, why an approach breaks, what an invariant guarantees. At least one question per lesson about Big-O or when-to-reach-for-it. Wrong options must be PLAUSIBLE (the mistakes people actually make), and the explanation (1-3 sentences) says why the right answer is right.
- Inline code in prompts/options is fine (backtick markdown).

VERIFY each starter by running it exactly like the app does: write it to a file under ${OUT_DIR}/check/ (mkdir -p first; filename contains the exercise id) and run "node scripts/ts-lesson-check.mjs <file>" from the repo root. It transpiles (type-strip) and executes the starter in the same bare scope the browser worker uses; it must print "OK". Fix any starter that fails and re-run until clean.
`.trim()

phase('Author')

const results = await pipeline(
  CURRICULUM,
  // Stage 1 — author the module.
  (mod) => agent(
    `You are an expert algorithms educator and engineer authoring one module of a guided Data Structures & Algorithms course (exercises in TypeScript).

${RULES}

Write the module "${mod.moduleId}". Here is the EXACT plan — keep every id, title, and blurb verbatim, fill in the prose/code:
${JSON.stringify(mod.lessons, null, 2)}

For each lesson, write "content" (lesson card markdown) from its "focus", a 3-question "quiz" (ids <lesson-id>-q1..q3, correct option FIRST), and for each exercise "instructions" (markdown) and "starterCode" (a runnable, self-contained TS scaffold) from its "task". The "module" field of every lesson MUST be "${mod.moduleId}".

OUTPUT: write a JSON file to ${OUT_DIR}/${mod.moduleId}.json with this exact shape (no trailing commentary):
{
  "moduleId": "${mod.moduleId}",
  "lessons": [
    { "id": "...", "module": "${mod.moduleId}", "title": "...", "blurb": "...", "content": "<markdown>",
      "exercises": [ { "id": "...", "title": "...", "instructions": "<markdown>", "starterCode": "<typescript>" } ],
      "quiz": [ { "id": "<lesson-id>-q1", "prompt": "...", "options": ["<correct>", "...", "...", "..."], "explanation": "..." } ] }
  ]
}
Use the pre-assigned ids/titles/blurbs from the plan verbatim. Write valid JSON (the Write tool handles escaping — just produce correct JSON).

VERIFY before returning: for EVERY exercise, write its starterCode to ${OUT_DIR}/check/<exerciseId>.ts and run "node scripts/ts-lesson-check.mjs ${OUT_DIR}/check/<exerciseId>.ts" from the repo root; it must print "OK". Fix any starter that fails (runtime error) and re-run until every starter passes. Re-read your JSON file at the end to confirm it parses and every lesson has exactly 3 quiz questions with 4 options each.

Return the StructuredOutput summary. jsonPath is the file you wrote. allStartersRun is true only if every starter printed OK; unrunnableStarters lists any that did not. Set status to "ok" only if every starter ran clean, the quizzes are complete, and the JSON parses.`,
    // Bulk authoring runs on Sonnet by owner preference — the adversarial review
    // stage is the quality gate, so top-model rates per author aren't warranted.
    { label: `author:${mod.moduleId}`, phase: 'Author', schema: SCHEMA, model: 'sonnet' }
  ),
  // Stage 2 — adversarial review + fix.
  (authored, mod) => agent(
    `You are a meticulous senior engineer and algorithms educator doing an ADVERSARIAL review of one authored course module. Assume there are problems and hunt for them.

The module "${mod.moduleId}" was authored to ${OUT_DIR}/${mod.moduleId}.json. Read that file. The module plan, for reference:
${JSON.stringify(mod.lessons, null, 2)}

Check EVERY lesson, exercise, and quiz question for:
1. ALGORITHMIC ACCURACY — is every claim, complexity bound, and code example correct? Trace each example by hand. No wrong Big-O, no off-by-one in binary search bounds, no broken invariant statements, no JS/TS runtime misstatements (e.g. sort() default comparator, shift() cost, Map key identity).
2. AUDIENCE/FRAMING — written for an experienced TS/JS developer new to DSA? It must NOT explain programming basics or teach TypeScript syntax, and SHOULD name the Big-O of everything and answer "when do I reach for this?". Flag condescending or beginner-pitched prose.
3. SCAFFOLD-NOT-SOLUTION — does each starterCode leave the TARGET algorithm as a TODO rather than giving it away? (Given-complete infrastructure — node classes, converters, prebuilt samples — is required and fine.) If a starter contains the solution, gut it back to a scaffold whose placeholder still runs clean and prints.
4. STARTER RUNS CLEAN + NAMING — single self-contained file (NO import/export/require), no runtime errors, no top-level identifiers colliding with DOM globals (Node, Event, Text, name, status, top, parent, history, length, prompt, stop, ...). Node classes are ListNode/TreeNode.
5. QUIZ CORRECTNESS — options[0] is the unambiguously correct answer; the other three are plausible but definitely wrong (if a distractor is arguably correct, rewrite it); exactly 3 questions with the pre-assigned ids, 4 distinct options each, explanations that actually explain. At least one Big-O/when-to-use question per lesson.
6. INSTRUCTIONS<->STARTER MATCH and COMPLETENESS — instructions describe what the starter sets up and what "done" looks like; the content actually teaches the mechanism from the plan's focus.

FIX every problem you find by rewriting ${OUT_DIR}/${mod.moduleId}.json in place (keep the pre-assigned ids/titles/blurbs verbatim; keep "module" = "${mod.moduleId}").

RE-VERIFY: re-run every exercise starter via "node scripts/ts-lesson-check.mjs <file>" (write each to ${OUT_DIR}/check/<exerciseId>.ts first); each must print OK. Confirm the JSON still parses.

The author reported: ${JSON.stringify(authored)}

Return the StructuredOutput summary for the FINAL state of the file. List in "issues" what you fixed (empty if nothing needed fixing). status "ok" only if the file parses, every starter runs clean, and every quiz survived review.`,
    { label: `review:${mod.moduleId}`, phase: 'Review', schema: SCHEMA, model: 'sonnet' }
  )
)

return results.filter(Boolean)
