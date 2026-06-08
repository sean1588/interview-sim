import type { Problem } from "./types";

export const heapProblems: Problem[] = [
  {
    id: "k-largest-elements",
    title: "K Largest Elements",
    difficulty: "Medium",
    prompt: `Given an array of numbers \`nums\` and an integer \`k\`, return the \`k\` largest
elements in descending order.

**Example**

\`\`\`
Input:  nums = [3, 1, 5, 12, 2, 11], k = 3
Output: [12, 11, 5]
\`\`\``,
    starterCode: {
      python: `def k_largest(nums, k):
    # Your code here
    return []


if __name__ == "__main__":
    print(k_largest([3, 1, 5, 12, 2, 11], 3))  # expected: [12, 11, 5]
`,
      javascript: `function kLargest(nums, k) {
  // Your code here
  return [];
}

console.log(kLargest([3, 1, 5, 12, 2, 11], 3)); // expected: [12, 11, 5]
`,
    },
  },
  {
    id: "min-cost-connect-ropes",
    title: "Min Cost to Connect Ropes",
    difficulty: "Medium",
    prompt: `Given \`ropes\`, an array of rope lengths, connect them all into a single rope.
You may connect only two ropes at a time, and the cost of connecting two ropes
equals the sum of their lengths. Return the minimum total cost to connect every
rope into one.

**Example**

\`\`\`
Input:  ropes = [8, 4, 6, 12]
Output: 58         // 4+6=10, 8+10=18, 18+12=30 -> 10+18+30
\`\`\``,
    starterCode: {
      python: `def min_cost_connect_ropes(ropes):
    # Your code here
    return 0


if __name__ == "__main__":
    print(min_cost_connect_ropes([8, 4, 6, 12]))  # expected: 58
`,
      javascript: `function minCostConnectRopes(ropes) {
  // Your code here
  return 0;
}

console.log(minCostConnectRopes([8, 4, 6, 12])); // expected: 58
`,
    },
  },
];
