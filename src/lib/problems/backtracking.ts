import type { Problem } from "./types";

export const backtrackingProblems: Problem[] = [
  {
    id: "permutations",
    title: "Permutations",
    difficulty: "Medium",
    prompt: `Given an array \`nums\` of distinct integers, return all the possible
permutations. You may return the answer in any order.

**Example**

\`\`\`
Input:  nums = [1, 2, 3]
Output: [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]
\`\`\``,
    starterCode: {
      python: `def permute(nums):
    # Your code here
    return []


if __name__ == "__main__":
    print(permute([1, 2, 3]))  # expected: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
`,
      javascript: `function permute(nums) {
  // Your code here
  return [];
}

console.log(permute([1, 2, 3])); // expected: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
`,
      typescript: `function permute(nums: number[]): number[][] {
  // Your code here
  return [];
}

console.log(permute([1, 2, 3])); // expected: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
`,
    },
  },
  {
    id: "letter-combinations",
    title: "Letter Combinations of a Phone Number",
    difficulty: "Medium",
    prompt: `Given a string \`digits\` containing digits from 2-9 inclusive, return all
possible letter combinations the number could represent. The digit-to-letter
mapping follows the telephone buttons (2 -> "abc", 3 -> "def", ...).

**Example**

\`\`\`
Input:  digits = "23"
Output: ["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"]
\`\`\``,
    starterCode: {
      python: `def letter_combinations(digits):
    # Your code here
    return []


if __name__ == "__main__":
    print(letter_combinations("23"))  # expected: ['ad','ae','af','bd','be','bf','cd','ce','cf']
`,
      javascript: `function letterCombinations(digits) {
  // Your code here
  return [];
}

console.log(letterCombinations("23")); // expected: ['ad','ae','af','bd','be','bf','cd','ce','cf']
`,
      typescript: `function letterCombinations(digits: string): string[] {
  // Your code here
  return [];
}

console.log(letterCombinations("23")); // expected: ['ad','ae','af','bd','be','bf','cd','ce','cf']
`,
    },
  },
];
