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
    },
  },
];
