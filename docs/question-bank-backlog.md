# Question-Bank Coverage Backlog

Living list of problems to add so the coding bank becomes a *balanced prep
curriculum*, not just a snapshot of past practice. Check items off as they land.

The current bank (44 problems) has strong **pattern breadth** but uneven
**topic depth** — it reflects what was practiced, not a designed ladder. The
priorities below close the systematic gaps.

## Current coverage snapshot

| Topic | Have | Assessment |
|---|---|---|
| Arrays / hashing | 11 | Good (a few low-signal warmups) |
| Strings | 8 | Good |
| Searching / binary search | 3 | OK |
| Linked lists | 2 | **Thin — missing fundamentals** |
| Trees | 1 | **Badly under-covered** |
| Graphs | 5 | Good |
| Heap | 2 | OK |
| Dynamic programming | 2 | **Thin** |
| Backtracking | 2 | OK |
| Design | 2 | OK |
| JS utilities | 6 | Good (JS-only) |

## Priority 1 — critical gaps (do these first)

Trees and linked-list fundamentals are among the most common interview topics,
and DP is a wide category we've barely touched.

### Trees (have 1 — need the fundamentals)
- [ ] Maximum Depth of Binary Tree — Easy
- [ ] Invert Binary Tree — Easy
- [ ] Same Tree / Symmetric Tree — Easy
- [ ] Validate Binary Search Tree — Medium
- [ ] Lowest Common Ancestor (BST + binary tree) — Medium
- [ ] Diameter of Binary Tree — Easy/Medium
- [ ] Binary Tree Path Sum — Easy/Medium
- [ ] Kth Smallest Element in a BST — Medium
- [ ] Serialize and Deserialize Binary Tree — Hard

### Linked-list fundamentals (have Add Two Numbers, Merge k — need the basics)
- [ ] Reverse a Linked List — Easy
- [ ] Linked List Cycle (detect) — Easy
- [ ] Middle of the Linked List — Easy
- [ ] Remove Nth Node From End — Medium
- [ ] Reorder List — Medium
- [ ] Palindrome Linked List — Easy

### Dynamic programming (have Climbing Stairs, Word Break — need a ladder)
- [ ] House Robber — Medium
- [ ] Coin Change — Medium
- [ ] Longest Increasing Subsequence — Medium
- [ ] Maximum Subarray (Kadane) — Medium
- [ ] Unique Paths — Medium
- [ ] Longest Common Subsequence — Medium
- [ ] Edit Distance — Hard

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

### Graphs (have 5)
- [ ] Clone Graph — Medium
- [ ] Number of Connected Components — Medium
- [ ] Pacific Atlantic Water Flow — Medium
- [ ] Word Ladder — Hard

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
- **Curate, don't dump.** Unlike the initial import (which pulled whatever
  existed in the practice repos), add these as a deliberate Easy → Hard ladder
  per topic so a candidate can progress.
- Later modes (out of scope for the coding bank): **system design** and
  **behavioral** — tracked separately when we get there.
