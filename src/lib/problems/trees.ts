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
      typescript: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a binary tree from a level-order array (null = missing node).
function buildTree(values: (number | null)[]): TreeNode | null {
  if (values.length === 0) return null;
  const root = new TreeNode(values[0]!);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]!);
      queue.push(node.left);
    }
    i += 1;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]!);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

function levelOrder(root: TreeNode | null): number[][] {
  // Your code here
  return [];
}

const root = buildTree([3, 9, 20, null, null, 15, 7]);
console.log(levelOrder(root)); // expected: [[3], [9, 20], [15, 7]]
`,
    },
  },
  {
    id: "maximum-depth-of-binary-tree",
    title: "Maximum Depth of Binary Tree",
    difficulty: "Easy",
    prompt: `Given the root of a binary tree, return its maximum depth — the number of nodes along the longest path from the root down to the farthest leaf node.

**Example**

\`\`\`
Input:  root = [3, 9, 20, null, null, 15, 7]
Output: 3
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


def max_depth(root):
    # Your code here
    return 0


if __name__ == "__main__":
    root = build_tree([3, 9, 20, None, None, 15, 7])
    print(max_depth(root))  # expected: 3
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

function maxDepth(root) {
  // Your code here
  return 0;
}

const root = buildTree([3, 9, 20, null, null, 15, 7]);
console.log(maxDepth(root)); // expected: 3
`,
      typescript: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a binary tree from a level-order array (null = missing node).
function buildTree(values: (number | null)[]): TreeNode | null {
  if (values.length === 0) return null;
  const root = new TreeNode(values[0]!);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]!);
      queue.push(node.left);
    }
    i += 1;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]!);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

function maxDepth(root: TreeNode | null): number {
  // Your code here
  return 0;
}

const root = buildTree([3, 9, 20, null, null, 15, 7]);
console.log(maxDepth(root)); // expected: 3
`,
    },
  },
  {
    id: "invert-binary-tree",
    title: "Invert Binary Tree",
    difficulty: "Easy",
    prompt: `Given the root of a binary tree, invert the tree (swap every node's left and right children) and return its root.

**Example**

\`\`\`
Input:  root = [4, 2, 7, 1, 3, 6, 9]
Output: [4, 7, 2, 9, 6, 3, 1]
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


def tree_to_level_order(root):
    """Convert a tree back to a trimmed level-order list (None = missing node)."""
    result = []
    q = deque([root])
    while q:
        node = q.popleft()
        if node is None:
            result.append(None)
            continue
        result.append(node.val)
        q.append(node.left)
        q.append(node.right)
    while result and result[-1] is None:
        result.pop()
    return result


def invert_tree(root):
    # Your code here
    return root


if __name__ == "__main__":
    root = build_tree([4, 2, 7, 1, 3, 6, 9])
    print(tree_to_level_order(invert_tree(root)))  # expected: [4, 7, 2, 9, 6, 3, 1]
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

// Convert a tree back to a trimmed level-order array (null = missing node).
function treeToLevelOrder(root) {
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === null) {
      result.push(null);
      continue;
    }
    result.push(node.val);
    queue.push(node.left);
    queue.push(node.right);
  }
  while (result.length > 0 && result[result.length - 1] === null) {
    result.pop();
  }
  return result;
}

function invertTree(root) {
  // Your code here
  return root;
}

const root = buildTree([4, 2, 7, 1, 3, 6, 9]);
console.log(treeToLevelOrder(invertTree(root))); // expected: [4, 7, 2, 9, 6, 3, 1]
`,
      typescript: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a binary tree from a level-order array (null = missing node).
function buildTree(values: (number | null)[]): TreeNode | null {
  if (values.length === 0) return null;
  const root = new TreeNode(values[0]!);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]!);
      queue.push(node.left);
    }
    i += 1;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]!);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

// Convert a tree back to a trimmed level-order array (null = missing node).
function treeToLevelOrder(root: TreeNode | null): (number | null)[] {
  const result: (number | null)[] = [];
  const queue: (TreeNode | null)[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node === null) {
      result.push(null);
      continue;
    }
    result.push(node.val);
    queue.push(node.left);
    queue.push(node.right);
  }
  while (result.length > 0 && result[result.length - 1] === null) {
    result.pop();
  }
  return result;
}

function invertTree(root: TreeNode | null): TreeNode | null {
  // Your code here
  return root;
}

const root = buildTree([4, 2, 7, 1, 3, 6, 9]);
console.log(treeToLevelOrder(invertTree(root))); // expected: [4, 7, 2, 9, 6, 3, 1]
`,
    },
  },
  {
    id: "symmetric-tree",
    title: "Symmetric Tree",
    difficulty: "Easy",
    prompt: `Given the root of a binary tree, return \`true\` if the tree is a mirror of itself (symmetric around its center).

**Example**

\`\`\`
Input:  root = [1, 2, 2, 3, 4, 4, 3]
Output: true

Input:  root = [1, 2, 2, null, 3, null, 3]
Output: false
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


def is_symmetric(root):
    # Your code here
    return False


if __name__ == "__main__":
    root = build_tree([1, 2, 2, 3, 4, 4, 3])
    print(is_symmetric(root))  # expected: True
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

function isSymmetric(root) {
  // Your code here
  return false;
}

const root = buildTree([1, 2, 2, 3, 4, 4, 3]);
console.log(isSymmetric(root)); // expected: true
`,
      typescript: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a binary tree from a level-order array (null = missing node).
function buildTree(values: (number | null)[]): TreeNode | null {
  if (values.length === 0) return null;
  const root = new TreeNode(values[0]!);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]!);
      queue.push(node.left);
    }
    i += 1;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]!);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

function isSymmetric(root: TreeNode | null): boolean {
  // Your code here
  return false;
}

const root = buildTree([1, 2, 2, 3, 4, 4, 3]);
console.log(isSymmetric(root)); // expected: true
`,
    },
  },
  {
    id: "diameter-of-binary-tree",
    title: "Diameter of Binary Tree",
    difficulty: "Easy",
    prompt: `Given the root of a binary tree, return the length of the diameter of the tree — the number of edges on the longest path between any two nodes. This path may or may not pass through the root.

**Example**

\`\`\`
Input:  root = [1, 2, 3, 4, 5]
Output: 3
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


def diameter_of_binary_tree(root):
    # Your code here
    return 0


if __name__ == "__main__":
    root = build_tree([1, 2, 3, 4, 5])
    print(diameter_of_binary_tree(root))  # expected: 3
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

function diameterOfBinaryTree(root) {
  // Your code here
  return 0;
}

const root = buildTree([1, 2, 3, 4, 5]);
console.log(diameterOfBinaryTree(root)); // expected: 3
`,
      typescript: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a binary tree from a level-order array (null = missing node).
function buildTree(values: (number | null)[]): TreeNode | null {
  if (values.length === 0) return null;
  const root = new TreeNode(values[0]!);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]!);
      queue.push(node.left);
    }
    i += 1;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]!);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

function diameterOfBinaryTree(root: TreeNode | null): number {
  // Your code here
  return 0;
}

const root = buildTree([1, 2, 3, 4, 5]);
console.log(diameterOfBinaryTree(root)); // expected: 3
`,
    },
  },
  {
    id: "balanced-binary-tree",
    title: "Balanced Binary Tree",
    difficulty: "Easy",
    prompt: `Given the root of a binary tree, return \`true\` if it is height-balanced — a tree in which the left and right subtrees of every node differ in height by no more than 1.

**Example**

\`\`\`
Input:  root = [3, 9, 20, null, null, 15, 7]
Output: true
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


def is_balanced(root):
    # Your code here
    return False


if __name__ == "__main__":
    root = build_tree([3, 9, 20, None, None, 15, 7])
    print(is_balanced(root))  # expected: True
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

function isBalanced(root) {
  // Your code here
  return false;
}

const root = buildTree([3, 9, 20, null, null, 15, 7]);
console.log(isBalanced(root)); // expected: true
`,
      typescript: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a binary tree from a level-order array (null = missing node).
function buildTree(values: (number | null)[]): TreeNode | null {
  if (values.length === 0) return null;
  const root = new TreeNode(values[0]!);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]!);
      queue.push(node.left);
    }
    i += 1;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]!);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

function isBalanced(root: TreeNode | null): boolean {
  // Your code here
  return false;
}

const root = buildTree([3, 9, 20, null, null, 15, 7]);
console.log(isBalanced(root)); // expected: true
`,
    },
  },
  {
    id: "validate-binary-search-tree",
    title: "Validate Binary Search Tree",
    difficulty: "Medium",
    prompt: `Given the root of a binary tree, return \`true\` if it is a valid binary search tree (BST). In a valid BST, every node's left subtree contains only values less than the node, and its right subtree only values greater than the node.

**Example**

\`\`\`
Input:  root = [2, 1, 3]
Output: true

Input:  root = [5, 1, 4, null, null, 3, 6]
Output: false
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


def is_valid_bst(root):
    # Your code here
    return False


if __name__ == "__main__":
    root = build_tree([2, 1, 3])
    print(is_valid_bst(root))  # expected: True
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

function isValidBST(root) {
  // Your code here
  return false;
}

const root = buildTree([2, 1, 3]);
console.log(isValidBST(root)); // expected: true
`,
      typescript: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a binary tree from a level-order array (null = missing node).
function buildTree(values: (number | null)[]): TreeNode | null {
  if (values.length === 0) return null;
  const root = new TreeNode(values[0]!);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]!);
      queue.push(node.left);
    }
    i += 1;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]!);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

function isValidBST(root: TreeNode | null): boolean {
  // Your code here
  return false;
}

const root = buildTree([2, 1, 3]);
console.log(isValidBST(root)); // expected: true
`,
    },
  },
  {
    id: "lowest-common-ancestor-of-bst",
    title: "Lowest Common Ancestor of a Binary Search Tree",
    difficulty: "Medium",
    prompt: `Given the root of a binary search tree and two values \`p\` and \`q\`, return the value of their lowest common ancestor (LCA). The LCA is the deepest node that has both \`p\` and \`q\` as descendants (a node may be a descendant of itself).

**Example**

\`\`\`
Input:  root = [6, 2, 8, 0, 4, 7, 9], p = 2, q = 8
Output: 6
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


def lowest_common_ancestor(root, p, q):
    # Your code here
    return None


if __name__ == "__main__":
    root = build_tree([6, 2, 8, 0, 4, 7, 9])
    print(lowest_common_ancestor(root, 2, 8))  # expected: 6
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

function lowestCommonAncestor(root, p, q) {
  // Your code here
  return null;
}

const root = buildTree([6, 2, 8, 0, 4, 7, 9]);
console.log(lowestCommonAncestor(root, 2, 8)); // expected: 6
`,
      typescript: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a binary tree from a level-order array (null = missing node).
function buildTree(values: (number | null)[]): TreeNode | null {
  if (values.length === 0) return null;
  const root = new TreeNode(values[0]!);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]!);
      queue.push(node.left);
    }
    i += 1;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]!);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

function lowestCommonAncestor(root: TreeNode | null, p: number, q: number): number | null {
  // Your code here
  return null;
}

const root = buildTree([6, 2, 8, 0, 4, 7, 9]);
console.log(lowestCommonAncestor(root, 2, 8)); // expected: 6
`,
    },
  },
  {
    id: "kth-smallest-element-in-a-bst",
    title: "Kth Smallest Element in a BST",
    difficulty: "Medium",
    prompt: `Given the root of a binary search tree and an integer \`k\`, return the \`k\`th smallest value (1-indexed) among all node values in the tree.

**Example**

\`\`\`
Input:  root = [3, 1, 4, null, 2], k = 1
Output: 1
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


def kth_smallest(root, k):
    # Your code here
    return 0


if __name__ == "__main__":
    root = build_tree([3, 1, 4, None, 2])
    print(kth_smallest(root, 1))  # expected: 1
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

function kthSmallest(root, k) {
  // Your code here
  return 0;
}

const root = buildTree([3, 1, 4, null, 2]);
console.log(kthSmallest(root, 1)); // expected: 1
`,
      typescript: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a binary tree from a level-order array (null = missing node).
function buildTree(values: (number | null)[]): TreeNode | null {
  if (values.length === 0) return null;
  const root = new TreeNode(values[0]!);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]!);
      queue.push(node.left);
    }
    i += 1;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]!);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

function kthSmallest(root: TreeNode | null, k: number): number {
  // Your code here
  return 0;
}

const root = buildTree([3, 1, 4, null, 2]);
console.log(kthSmallest(root, 1)); // expected: 1
`,
    },
  },
  {
    id: "serialize-and-deserialize-binary-tree",
    title: "Serialize and Deserialize Binary Tree",
    difficulty: "Hard",
    prompt: `Design an algorithm to serialize a binary tree to a string and deserialize that string back into the original tree structure. Implement both \`serialize(root)\` and \`deserialize(data)\` so that \`deserialize(serialize(root))\` reproduces the original tree.

**Example**

\`\`\`
Input:  root = [1, 2, 3, null, null, 4, 5]
Output: [1, 2, 3, null, null, 4, 5]  (round-trip preserves the tree)
\`\`\`

**Follow-up:** Your encoding does not need to match any particular format, as long as serialize and deserialize are mutual inverses.`,
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


def tree_to_level_order(root):
    """Convert a tree back to a trimmed level-order list (None = missing node)."""
    result = []
    q = deque([root])
    while q:
        node = q.popleft()
        if node is None:
            result.append(None)
            continue
        result.append(node.val)
        q.append(node.left)
        q.append(node.right)
    while result and result[-1] is None:
        result.pop()
    return result


def serialize(root):
    # Your code here
    return ""


def deserialize(data):
    # Your code here
    return None


if __name__ == "__main__":
    root = build_tree([1, 2, 3, None, None, 4, 5])
    restored = deserialize(serialize(root))
    print(tree_to_level_order(restored))  # expected: [1, 2, 3, None, None, 4, 5]
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

// Convert a tree back to a trimmed level-order array (null = missing node).
function treeToLevelOrder(root) {
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === null) {
      result.push(null);
      continue;
    }
    result.push(node.val);
    queue.push(node.left);
    queue.push(node.right);
  }
  while (result.length > 0 && result[result.length - 1] === null) {
    result.pop();
  }
  return result;
}

function serialize(root) {
  // Your code here
  return "";
}

function deserialize(data) {
  // Your code here
  return null;
}

const root = buildTree([1, 2, 3, null, null, 4, 5]);
const restored = deserialize(serialize(root));
console.log(treeToLevelOrder(restored)); // expected: [1, 2, 3, null, null, 4, 5]
`,
      typescript: `class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// Build a binary tree from a level-order array (null = missing node).
function buildTree(values: (number | null)[]): TreeNode | null {
  if (values.length === 0) return null;
  const root = new TreeNode(values[0]!);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()!;
    if (i < values.length && values[i] !== null) {
      node.left = new TreeNode(values[i]!);
      queue.push(node.left);
    }
    i += 1;
    if (i < values.length && values[i] !== null) {
      node.right = new TreeNode(values[i]!);
      queue.push(node.right);
    }
    i += 1;
  }
  return root;
}

// Convert a tree back to a trimmed level-order array (null = missing node).
function treeToLevelOrder(root: TreeNode | null): (number | null)[] {
  const result: (number | null)[] = [];
  const queue: (TreeNode | null)[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node === null) {
      result.push(null);
      continue;
    }
    result.push(node.val);
    queue.push(node.left);
    queue.push(node.right);
  }
  while (result.length > 0 && result[result.length - 1] === null) {
    result.pop();
  }
  return result;
}

function serialize(root: TreeNode | null): string {
  // Your code here
  return "";
}

function deserialize(data: string): TreeNode | null {
  // Your code here
  return null;
}

const root = buildTree([1, 2, 3, null, null, 4, 5]);
const restored = deserialize(serialize(root));
console.log(treeToLevelOrder(restored)); // expected: [1, 2, 3, null, null, 4, 5]
`,
    },
  },
];
