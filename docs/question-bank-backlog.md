# Question-Bank Coverage Backlog

Living list of problems to add so the coding bank becomes a *balanced prep
curriculum*, not just a snapshot of past practice. Check items off as they land.

The bank now has **71 problems**. The Priority-1 balance pass (trees, linked-list
fundamentals, a DP ladder) plus a graph boost is **done** — see below. Remaining
work is Priority 2 (missing categories) and Priority 3 (more depth).

## Current coverage snapshot

| Topic | Have | Assessment |
|---|---|---|
| Arrays / hashing | 11 | Good (a few low-signal warmups) |
| Strings | 8 | Good |
| Searching / binary search | 3 | OK |
| Linked lists | 8 | ✅ Fundamentals added |
| Trees | 10 | ✅ Now well-covered |
| Graphs | 10 | ✅ Strong |
| Heap | 2 | OK |
| Dynamic programming | 9 | ✅ Real Easy→Hard ladder |
| Backtracking | 2 | OK |
| Design | 2 | OK |
| JS utilities | 6 | Good (JS-only) |

## Priority 1 — ✅ DONE

### Trees
- [x] Maximum Depth of Binary Tree — Easy
- [x] Invert Binary Tree — Easy
- [x] Symmetric Tree — Easy
- [x] Diameter of Binary Tree — Easy
- [x] Balanced Binary Tree — Easy
- [x] Validate Binary Search Tree — Medium
- [x] Lowest Common Ancestor (BST) — Medium
- [x] Kth Smallest Element in a BST — Medium
- [x] Serialize and Deserialize Binary Tree — Hard
- [ ] Same Tree — Easy (optional, not yet added)
- [ ] Binary Tree Path Sum — Easy/Medium (optional, not yet added)

### Linked lists
- [x] Reverse a Linked List — Easy
- [x] Linked List Cycle (detect) — Easy
- [x] Middle of the Linked List — Easy
- [x] Palindrome Linked List — Easy
- [x] Remove Nth Node From End — Medium
- [x] Reorder List — Medium

### Dynamic programming
- [x] Maximum Subarray (Kadane) — Medium
- [x] House Robber — Medium
- [x] Coin Change — Medium
- [x] Unique Paths — Medium
- [x] Longest Increasing Subsequence — Medium
- [x] Longest Common Subsequence — Medium
- [x] Edit Distance — Hard

### Graphs (boost)
- [x] Clone Graph — Medium
- [x] Rotting Oranges — Medium (multi-source BFS)
- [x] Number of Connected Components — Medium (union-find)
- [x] Pacific Atlantic Water Flow — Medium (multi-source DFS)
- [x] Word Ladder — Hard (BFS)

## Priority 2 — missing categories

### Intervals (have Merge Intervals only)
- [ ] Insert Interval — Medium
- [ ] Non-overlapping Intervals — Medium
- [ ] Meeting Rooms / Meeting Rooms II — Easy/Medium

### Matrix (none)
- [ ] Rotate Image — Medium
- [ ] Spiral Matrix — Medium
- [ ] Set Matrix Zeroes — Medium
- [ ] Word Search — Medium (also backtracking)

### Greedy (none)
- [ ] Jump Game — Medium
- [ ] Gas Station — Medium

### Bit manipulation (have Hamming only)
- [ ] Single Number — Easy
- [ ] Number of 1 Bits — Easy
- [ ] Counting Bits — Easy
- [ ] Missing Number — Easy

## Priority 3 — more depth in existing categories

### Stack (have Valid Parentheses, Stock Span)
- [ ] Min Stack — Medium
- [ ] Daily Temperatures — Medium
- [ ] Evaluate Reverse Polish Notation — Medium
- [ ] Generate Parentheses — Medium (backtracking)

### Backtracking (have Permutations, Letter Combinations)
- [ ] Subsets — Medium
- [ ] Combination Sum — Medium
- [ ] Palindrome Partitioning — Medium
- [ ] N-Queens — Hard

### Graphs (have 10)
- [ ] Surrounded Regions — Medium
- [ ] Redundant Connection — Medium (union-find)

### Heap / two pointers (have a few)
- [ ] Kth Largest Element in a Stream — Easy
- [ ] Find Median from Data Stream — Hard
- [ ] Container With Most Water — Medium
- [ ] Trapping Rain Water — Hard

## Notes

- **Low-signal existing entries** to eventually deprioritize or replace with
  higher-frequency problems: `sock-merchant`, `hourglass-sum`,
  `array-left-rotation` (HackerRank warmups), `hamming-code-7-4` (niche),
  `basic-calculator` (trivial two-operand, not the real stack-parser).
- **Curate, don't dump.** Add new problems as a deliberate Easy → Hard ladder
  per topic so a candidate can progress.
- Later modes (out of scope for the coding bank): **system design** and
  **behavioral** — tracked separately when we get there.
