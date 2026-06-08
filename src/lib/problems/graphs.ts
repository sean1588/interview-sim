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
];
