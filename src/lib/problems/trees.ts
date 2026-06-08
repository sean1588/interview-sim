import type { Problem } from "./types";

export const treeProblems: Problem[] = [
  {
    id: "binary-tree-level-order-traversal",
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    prompt: `Given the root of a binary tree, return the level-order traversal of its node values — that is, the values grouped by level, from left to right.

**Example**

\`\`\`
Input:  root = [3, 9, 20, null, null, 15, 7]
Output: [[3], [9, 20], [15, 7]]
\`\`\``,
    starterCode: {
      python: `from collections import deque


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


def build_tree(values):
    """Build a binary tree from a level-order list (None = missing node)."""
    if not values:
        return None
    root = TreeNode(values[0])
    q = deque([root])
    i = 1
    while q and i < len(values):
        node = q.popleft()
        if i < len(values) and values[i] is not None:
            node.left = TreeNode(values[i])
            q.append(node.left)
        i += 1
        if i < len(values) and values[i] is not None:
            node.right = TreeNode(values[i])
            q.append(node.right)
        i += 1
    return root


def level_order(root):
    # Your code here
    return []


if __name__ == "__main__":
    root = build_tree([3, 9, 20, None, None, 15, 7])
    print(level_order(root))  # expected: [[3], [9, 20], [15, 7]]
`,
      javascript: `class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a binary tree from a level-order array (null = missing node).
function buildTree(values) {
  if (values.length === 0) return null;
  const root = new TreeNode(values[0]);
  const queue = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift();
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]);
      queue.push(node.left);
    }
    i += 1;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

function levelOrder(root) {
  // Your code here
  return [];
}

const root = buildTree([3, 9, 20, null, null, 15, 7]);
console.log(levelOrder(root)); // expected: [[3], [9, 20], [15, 7]]
`,
    },
  },
];
