import type { Problem } from "./types";

export const dpProblems: Problem[] = [
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    prompt: `You are climbing a staircase that takes \`n\` steps to reach the top. Each
time you can climb either 1 or 2 steps. In how many distinct ways can you climb
to the top?

**Example**

\`\`\`
Input:  n = 3
Output: 3          // 1+1+1, 1+2, 2+1
\`\`\``,
    starterCode: {
      python: `def climb_stairs(n):
    # Your code here
    pass


if __name__ == "__main__":
    print(climb_stairs(3))  # expected: 3
`,
      javascript: `function climbStairs(n) {
  // Your code here
}

console.log(climbStairs(3)); // expected: 3
`,
      typescript: `function climbStairs(n: number): number {
  // Your code here
  return 0;
}

console.log(climbStairs(3)); // expected: 3
`,
    },
  },
  {
    id: "word-break",
    title: "Word Break",
    difficulty: "Medium",
    prompt: `Given a string \`s\` and a dictionary of strings \`wordDict\`, return \`true\` if
\`s\` can be segmented into a space-separated sequence of one or more dictionary
words. The same dictionary word may be reused any number of times.

**Example**

\`\`\`
Input:  s = "leetcode", wordDict = ["leet", "code"]
Output: true       // "leet" + "code"
\`\`\``,
    starterCode: {
      python: `def word_break(s, word_dict):
    # Your code here
    return False


if __name__ == "__main__":
    print(word_break("leetcode", ["leet", "code"]))  # expected: True
`,
      javascript: `function wordBreak(s, wordDict) {
  // Your code here
  return false;
}

console.log(wordBreak("leetcode", ["leet", "code"])); // expected: true
`,
      typescript: `function wordBreak(s: string, wordDict: string[]): boolean {
  // Your code here
  return false;
}

console.log(wordBreak("leetcode", ["leet", "code"])); // expected: true
`,
    },
  },
  {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    prompt: `Given an integer array \`nums\`, find the contiguous subarray (containing at
least one number) with the largest sum and return that sum.

**Example**

\`\`\`
Input:  nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: 6          // subarray [4, -1, 2, 1]
\`\`\``,
    starterCode: {
      python: `def max_subarray(nums):
    # Your code here
    return 0


if __name__ == "__main__":
    print(max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))  # expected: 6
`,
      javascript: `function maxSubArray(nums) {
  // Your code here
  return 0;
}

console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // expected: 6
`,
      typescript: `function maxSubArray(nums: number[]): number {
  // Your code here
  return 0;
}

console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // expected: 6
`,
    },
  },
  {
    id: "house-robber",
    title: "House Robber",
    difficulty: "Medium",
    prompt: `You are a robber planning to rob houses along a street, where each house has
some money. You cannot rob two adjacent houses. Given an integer array \`nums\`
representing the money in each house, return the maximum amount you can rob
without alerting the police.

**Example**

\`\`\`
Input:  nums = [2, 7, 9, 3, 1]
Output: 12          // rob houses 0, 2, 4 -> 2 + 9 + 1
\`\`\``,
    starterCode: {
      python: `def rob(nums):
    # Your code here
    return 0


if __name__ == "__main__":
    print(rob([2, 7, 9, 3, 1]))  # expected: 12
`,
      javascript: `function rob(nums) {
  // Your code here
  return 0;
}

console.log(rob([2, 7, 9, 3, 1])); // expected: 12
`,
      typescript: `function rob(nums: number[]): number {
  // Your code here
  return 0;
}

console.log(rob([2, 7, 9, 3, 1])); // expected: 12
`,
    },
  },
  {
    id: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    prompt: `Given an integer array \`coins\` of coin denominations and an integer
\`amount\`, return the fewest number of coins needed to make up that amount. If
the amount cannot be made up by any combination of coins, return \`-1\`. You may
use each coin an unlimited number of times.

**Example**

\`\`\`
Input:  coins = [1, 2, 5], amount = 11
Output: 3          // 5 + 5 + 1
\`\`\``,
    starterCode: {
      python: `def coin_change(coins, amount):
    # Your code here
    return -1


if __name__ == "__main__":
    print(coin_change([1, 2, 5], 11))  # expected: 3
`,
      javascript: `function coinChange(coins, amount) {
  // Your code here
  return -1;
}

console.log(coinChange([1, 2, 5], 11)); // expected: 3
`,
      typescript: `function coinChange(coins: number[], amount: number): number {
  // Your code here
  return -1;
}

console.log(coinChange([1, 2, 5], 11)); // expected: 3
`,
    },
  },
  {
    id: "unique-paths",
    title: "Unique Paths",
    difficulty: "Medium",
    prompt: `A robot starts at the top-left corner of an \`m x n\` grid and can only move
either right or down at any point. Return the number of distinct paths the robot
can take to reach the bottom-right corner.

**Example**

\`\`\`
Input:  m = 3, n = 7
Output: 28
\`\`\``,
    starterCode: {
      python: `def unique_paths(m, n):
    # Your code here
    return 0


if __name__ == "__main__":
    print(unique_paths(3, 7))  # expected: 28
`,
      javascript: `function uniquePaths(m, n) {
  // Your code here
  return 0;
}

console.log(uniquePaths(3, 7)); // expected: 28
`,
      typescript: `function uniquePaths(m: number, n: number): number {
  // Your code here
  return 0;
}

console.log(uniquePaths(3, 7)); // expected: 28
`,
    },
  },
  {
    id: "longest-increasing-subsequence",
    title: "Longest Increasing Subsequence",
    difficulty: "Medium",
    prompt: `Given an integer array \`nums\`, return the length of the longest strictly
increasing subsequence. A subsequence keeps the original order but need not be
contiguous.

**Example**

\`\`\`
Input:  nums = [10, 9, 2, 5, 3, 7, 101, 18]
Output: 4          // [2, 3, 7, 18]
\`\`\``,
    starterCode: {
      python: `def length_of_lis(nums):
    # Your code here
    return 0


if __name__ == "__main__":
    print(length_of_lis([10, 9, 2, 5, 3, 7, 101, 18]))  # expected: 4
`,
      javascript: `function lengthOfLIS(nums) {
  // Your code here
  return 0;
}

console.log(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])); // expected: 4
`,
      typescript: `function lengthOfLIS(nums: number[]): number {
  // Your code here
  return 0;
}

console.log(lengthOfLIS([10, 9, 2, 5, 3, 7, 101, 18])); // expected: 4
`,
    },
  },
  {
    id: "longest-common-subsequence",
    title: "Longest Common Subsequence",
    difficulty: "Medium",
    prompt: `Given two strings \`text1\` and \`text2\`, return the length of their longest
common subsequence. A subsequence keeps the original order of characters but
need not be contiguous; return \`0\` if there is no common subsequence.

**Example**

\`\`\`
Input:  text1 = "abcde", text2 = "ace"
Output: 3          // "ace"
\`\`\``,
    starterCode: {
      python: `def longest_common_subsequence(text1, text2):
    # Your code here
    return 0


if __name__ == "__main__":
    print(longest_common_subsequence("abcde", "ace"))  # expected: 3
`,
      javascript: `function longestCommonSubsequence(text1, text2) {
  // Your code here
  return 0;
}

console.log(longestCommonSubsequence("abcde", "ace")); // expected: 3
`,
      typescript: `function longestCommonSubsequence(text1: string, text2: string): number {
  // Your code here
  return 0;
}

console.log(longestCommonSubsequence("abcde", "ace")); // expected: 3
`,
    },
  },
  {
    id: "edit-distance",
    title: "Edit Distance",
    difficulty: "Hard",
    prompt: `Given two strings \`word1\` and \`word2\`, return the minimum number of
operations required to convert \`word1\` into \`word2\`. The permitted operations
are inserting a character, deleting a character, and replacing a character.

**Example**

\`\`\`
Input:  word1 = "horse", word2 = "ros"
Output: 3          // horse -> rorse -> rose -> ros
\`\`\``,
    starterCode: {
      python: `def min_distance(word1, word2):
    # Your code here
    return 0


if __name__ == "__main__":
    print(min_distance("horse", "ros"))  # expected: 3
`,
      javascript: `function minDistance(word1, word2) {
  // Your code here
  return 0;
}

console.log(minDistance("horse", "ros")); // expected: 3
`,
      typescript: `function minDistance(word1: string, word2: string): number {
  // Your code here
  return 0;
}

console.log(minDistance("horse", "ros")); // expected: 3
`,
    },
  },
];
