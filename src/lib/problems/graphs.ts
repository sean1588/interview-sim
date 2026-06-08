import type { Problem } from "./types";

export const graphProblems: Problem[] = [
  {
    id: "median-island-size",
    title: "Median Island Size",
    difficulty: "Medium",
    prompt: `Given a 2D grid of 0s (water) and 1s (land), compute the median size of all islands in the grid. An island is a group of 1s connected vertically or horizontally (not diagonally). If there are no islands, return 0.

**Example**

\`\`\`
Input:  grid = [[1, 0, 0, 1],
                [0, 0, 0, 0],
                [1, 1, 0, 1],
                [0, 0, 0, 1]]
Output: 1.5
\`\`\``,
    starterCode: {
      python: `def compute_median_island_size(grid):
    # Your code here
    return 0


if __name__ == "__main__":
    grid = [
        [1, 0, 0, 1],
        [0, 0, 0, 0],
        [1, 1, 0, 1],
        [0, 0, 0, 1],
    ]
    print(compute_median_island_size(grid))  # expected: 1.5
`,
      javascript: `function computeMedianIslandSize(grid) {
  // Your code here
  return 0;
}

const grid = [
  [1, 0, 0, 1],
  [0, 0, 0, 0],
  [1, 1, 0, 1],
  [0, 0, 0, 1],
];
console.log(computeMedianIslandSize(grid)); // expected: 1.5
`,
    },
  },
  {
    id: "course-schedule",
    title: "Course Schedule",
    difficulty: "Medium",
    prompt: `There are \`numCourses\` courses labeled \`0\` to \`numCourses - 1\`. Each prerequisite \`[a, b]\` means you must take course \`b\` before course \`a\`. Return \`True\` if it is possible to finish all courses, otherwise \`False\`.

**Example**

\`\`\`
Input:  numCourses = 2, prerequisites = [[1, 0]]
Output: True
\`\`\``,
    starterCode: {
      python: `def can_finish(num_courses, prerequisites):
    # Your code here
    return False


if __name__ == "__main__":
    print(can_finish(2, [[1, 0]]))  # expected: True
`,
      javascript: `function canFinish(numCourses, prerequisites) {
  // Your code here
  return false;
}

console.log(canFinish(2, [[1, 0]])); // expected: true
`,
    },
  },
  {
    id: "bfs-shortest-path",
    title: "BFS Shortest Path",
    difficulty: "Medium",
    prompt: `Given an unweighted graph as an adjacency list and two nodes \`start\` and \`end\`, return the length of the shortest path between them using BFS. If no path exists, return -1.

**Example**

\`\`\`
Input:  graph = {"A": ["B", "C"], "B": ["A", "D"], "C": ["A", "D"], "D": ["B", "C", "E"], "E": ["D"]}
        start = "A", end = "E"
Output: 3
\`\`\``,
    starterCode: {
      python: `def shortest_path_bfs(graph, start, end):
    # Your code here
    return -1


if __name__ == "__main__":
    graph = {
        "A": ["B", "C"],
        "B": ["A", "D"],
        "C": ["A", "D"],
        "D": ["B", "C", "E"],
        "E": ["D"],
    }
    print(shortest_path_bfs(graph, "A", "E"))  # expected: 3
`,
      javascript: `function shortestPathBfs(graph, start, end) {
  // Your code here
  return -1;
}

const graph = {
  A: ["B", "C"],
  B: ["A", "D"],
  C: ["A", "D"],
  D: ["B", "C", "E"],
  E: ["D"],
};
console.log(shortestPathBfs(graph, "A", "E")); // expected: 3
`,
    },
  },
  {
    id: "dfs-path-exists",
    title: "DFS Path Exists",
    difficulty: "Medium",
    prompt: `Given a directed graph as an adjacency list and two nodes \`start\` and \`end\`, determine whether a path exists from \`start\` to \`end\` using DFS. Return \`True\` if a path exists, otherwise \`False\`.

**Example**

\`\`\`
Input:  graph = {"A": ["B"], "B": ["C"], "C": ["D"], "D": []}
        start = "A", end = "D"
Output: True
\`\`\``,
    starterCode: {
      python: `def path_exists_dfs(graph, start, end):
    # Your code here
    return False


if __name__ == "__main__":
    graph = {"A": ["B"], "B": ["C"], "C": ["D"], "D": []}
    print(path_exists_dfs(graph, "A", "D"))  # expected: True
`,
      javascript: `function pathExistsDfs(graph, start, end) {
  // Your code here
  return false;
}

const graph = { A: ["B"], B: ["C"], C: ["D"], D: [] };
console.log(pathExistsDfs(graph, "A", "D")); // expected: true
`,
    },
  },
  {
    id: "topological-sort",
    title: "Topological Sort",
    difficulty: "Medium",
    prompt: `Given a directed acyclic graph (DAG) as an adjacency list, return a valid topological ordering of its nodes. If the graph contains a cycle, return an empty list.

**Example**

\`\`\`
Input:  graph = {"1": ["2"], "2": ["3"], "3": []}
Output: ["1", "2", "3"]
\`\`\``,
    starterCode: {
      python: `def topological_sort(graph):
    # Your code here
    return []


if __name__ == "__main__":
    graph = {"1": ["2"], "2": ["3"], "3": []}
    print(topological_sort(graph))  # expected: ['1', '2', '3']
`,
      javascript: `function topologicalSort(graph) {
  // Your code here
  return [];
}

const graph = { "1": ["2"], "2": ["3"], "3": [] };
console.log(topologicalSort(graph)); // expected: ["1", "2", "3"]
`,
    },
  },
  {
    id: "rotting-oranges",
    title: "Rotting Oranges",
    difficulty: "Medium",
    prompt: `You are given a 2D grid where each cell is \`0\` (empty), \`1\` (fresh orange), or \`2\` (rotten orange). Every minute, any fresh orange that is adjacent (4-directionally) to a rotten orange becomes rotten. Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return -1.

**Example**

\`\`\`
Input:  grid = [[2, 1, 1],
                [1, 1, 0],
                [0, 1, 1]]
Output: 4
\`\`\``,
    starterCode: {
      python: `def oranges_rotting(grid):
    # Your code here
    return -1


if __name__ == "__main__":
    grid = [
        [2, 1, 1],
        [1, 1, 0],
        [0, 1, 1],
    ]
    print(oranges_rotting(grid))  # expected: 4
`,
      javascript: `function orangesRotting(grid) {
  // Your code here
  return -1;
}

const grid = [
  [2, 1, 1],
  [1, 1, 0],
  [0, 1, 1],
];
console.log(orangesRotting(grid)); // expected: 4
`,
    },
  },
  {
    id: "number-of-connected-components",
    title: "Number of Connected Components in an Undirected Graph",
    difficulty: "Medium",
    prompt: `You have a graph of \`n\` nodes labeled \`0\` to \`n - 1\`. Given \`n\` and a list of \`edges\` where each \`edges[i] = [a, b]\` is an undirected edge between nodes \`a\` and \`b\`, return the number of connected components in the graph.

**Example**

\`\`\`
Input:  n = 5, edges = [[0, 1], [1, 2], [3, 4]]
Output: 2
\`\`\``,
    starterCode: {
      python: `def count_components(n, edges):
    # Your code here
    return 0


if __name__ == "__main__":
    print(count_components(5, [[0, 1], [1, 2], [3, 4]]))  # expected: 2
`,
      javascript: `function countComponents(n, edges) {
  // Your code here
  return 0;
}

console.log(countComponents(5, [[0, 1], [1, 2], [3, 4]])); // expected: 2
`,
    },
  },
  {
    id: "pacific-atlantic-water-flow",
    title: "Pacific Atlantic Water Flow",
    difficulty: "Medium",
    prompt: `You are given an \`m x n\` grid \`heights\` representing the height of each cell on an island. The Pacific Ocean touches the top and left edges; the Atlantic Ocean touches the bottom and right edges. Water can flow from a cell to a 4-directionally adjacent cell with height less than or equal to the current cell's height. Return a list of \`[row, col]\` coordinates for all cells from which water can flow to BOTH the Pacific and Atlantic oceans.

**Example**

\`\`\`
Input:  heights = [[1, 2, 2, 3, 5],
                   [3, 2, 3, 4, 4],
                   [2, 4, 5, 3, 1],
                   [6, 7, 1, 4, 5],
                   [5, 1, 1, 2, 4]]
Output: [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]]
\`\`\``,
    starterCode: {
      python: `def pacific_atlantic(heights):
    # Your code here
    return []


if __name__ == "__main__":
    heights = [
        [1, 2, 2, 3, 5],
        [3, 2, 3, 4, 4],
        [2, 4, 5, 3, 1],
        [6, 7, 1, 4, 5],
        [5, 1, 1, 2, 4],
    ]
    # expected (any order): [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]]
    print(pacific_atlantic(heights))
`,
      javascript: `function pacificAtlantic(heights) {
  // Your code here
  return [];
}

const heights = [
  [1, 2, 2, 3, 5],
  [3, 2, 3, 4, 4],
  [2, 4, 5, 3, 1],
  [6, 7, 1, 4, 5],
  [5, 1, 1, 2, 4],
];
// expected (any order): [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]]
console.log(pacificAtlantic(heights));
`,
    },
  },
  {
    id: "word-ladder",
    title: "Word Ladder",
    difficulty: "Hard",
    prompt: `Given two words \`beginWord\` and \`endWord\`, and a dictionary \`wordList\`, return the length of the shortest transformation sequence from \`beginWord\` to \`endWord\`. Each transformation changes exactly one letter, and every intermediate word must exist in \`wordList\`. The length counts every word in the sequence including \`beginWord\` and \`endWord\`. Return 0 if no such sequence exists.

**Example**

\`\`\`
Input:  beginWord = "hit", endWord = "cog"
        wordList = ["hot", "dot", "dog", "lot", "log", "cog"]
Output: 5
\`\`\`

Follow-up: How would you speed up the search for neighboring words as the dictionary grows large?`,
    starterCode: {
      python: `def ladder_length(begin_word, end_word, word_list):
    # Your code here
    return 0


if __name__ == "__main__":
    word_list = ["hot", "dot", "dog", "lot", "log", "cog"]
    print(ladder_length("hit", "cog", word_list))  # expected: 5
`,
      javascript: `function ladderLength(beginWord, endWord, wordList) {
  // Your code here
  return 0;
}

const wordList = ["hot", "dot", "dog", "lot", "log", "cog"];
console.log(ladderLength("hit", "cog", wordList)); // expected: 5
`,
    },
  },
  {
    id: "clone-graph",
    title: "Clone Graph",
    difficulty: "Medium",
    prompt: `Given a reference to a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node holds a value and a list of its neighbors. The clone must be entirely independent of the original: no node object may be shared between the two graphs.

The harness builds a \`Node\` graph from a 1-indexed adjacency list, hands you the first node, and serializes your clone back to an adjacency list so you can confirm the structure matches.

**Example**

\`\`\`
Input:  adjacency = [[2, 4], [1, 3], [2, 4], [1, 3]]
        (node 1 connects to 2 and 4, node 2 connects to 1 and 3, etc.)
Output: [[2, 4], [1, 3], [2, 4], [1, 3]]
\`\`\``,
    starterCode: {
      python: `class Node:
    def __init__(self, val, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []


def build_graph(adj):
    if not adj:
        return None
    nodes = {i: Node(i) for i in range(1, len(adj) + 1)}
    for i, neighbors in enumerate(adj, start=1):
        nodes[i].neighbors = [nodes[j] for j in neighbors]
    return nodes[1]


def graph_to_adj(node):
    if node is None:
        return []
    seen = {}
    stack = [node]
    while stack:
        cur = stack.pop()
        if cur.val in seen:
            continue
        seen[cur.val] = cur
        for nb in cur.neighbors:
            if nb.val not in seen:
                stack.append(nb)
    return [[nb.val for nb in seen[val].neighbors] for val in sorted(seen)]


def clone_graph(node):
    # Your code here
    return None


if __name__ == "__main__":
    adj = [[2, 4], [1, 3], [2, 4], [1, 3]]
    original = build_graph(adj)
    cloned = clone_graph(original)
    print(graph_to_adj(cloned))  # expected: [[2, 4], [1, 3], [2, 4], [1, 3]]
`,
      javascript: `class Node {
  constructor(val, neighbors = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}

function buildGraph(adj) {
  if (adj.length === 0) return null;
  const nodes = {};
  for (let i = 1; i <= adj.length; i++) nodes[i] = new Node(i);
  for (let i = 1; i <= adj.length; i++) {
    nodes[i].neighbors = adj[i - 1].map((j) => nodes[j]);
  }
  return nodes[1];
}

function graphToAdj(node) {
  if (node === null) return [];
  const seen = new Map();
  const stack = [node];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (seen.has(cur.val)) continue;
    seen.set(cur.val, cur);
    for (const nb of cur.neighbors) {
      if (!seen.has(nb.val)) stack.push(nb);
    }
  }
  return [...seen.keys()]
    .sort((a, b) => a - b)
    .map((val) => seen.get(val).neighbors.map((nb) => nb.val));
}

function cloneGraph(node) {
  // Your code here
  return null;
}

const adj = [[2, 4], [1, 3], [2, 4], [1, 3]];
const original = buildGraph(adj);
const cloned = cloneGraph(original);
console.log(graphToAdj(cloned)); // expected: [[2, 4], [1, 3], [2, 4], [1, 3]]
`,
    },
  },
];
