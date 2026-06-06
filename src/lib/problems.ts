// Problem bank for the technical interview. Kept deliberately small for the
// spike — enough for the interviewer to have something concrete to talk about
// while the candidate codes. Starter code is provided per supported language.

export type LanguageId = "python" | "javascript" | "typescript";

export interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  /** Markdown-ish prompt shown to the candidate. */
  prompt: string;
  /** Starter scaffold per language. */
  starterCode: Record<LanguageId, string>;
}

export const PROBLEMS: Problem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    prompt: `Given an array of integers \`nums\` and an integer \`target\`, return the
indices of the two numbers that add up to \`target\`.

You may assume that each input has **exactly one solution**, and you may not
use the same element twice. You can return the answer in any order.

**Example**

\`\`\`
Input:  nums = [2, 7, 11, 15], target = 9
Output: [0, 1]          // because nums[0] + nums[1] == 9
\`\`\`

**Follow-up:** Can you do it in better than O(n²) time?`,
    starterCode: {
      python: `def two_sum(nums, target):
    # Your code here
    pass


if __name__ == "__main__":
    print(two_sum([2, 7, 11, 15], 9))  # expected: [0, 1]
`,
      javascript: `function twoSum(nums, target) {
  // Your code here
}

console.log(twoSum([2, 7, 11, 15], 9)); // expected: [0, 1]
`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  // Your code here
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9)); // expected: [0, 1]
`,
    },
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    prompt: `Given a string \`s\` containing just the characters \`()[]{}\`, determine if
the input string is valid.

A string is valid if open brackets are closed by the same type of bracket and
in the correct order.

**Examples**

\`\`\`
"()[]{}"  -> true
"(]"      -> false
"([)]"    -> false
"{[]}"    -> true
\`\`\``,
    starterCode: {
      python: `def is_valid(s):
    # Your code here
    pass


if __name__ == "__main__":
    print(is_valid("()[]{}"))  # expected: True
    print(is_valid("([)]"))    # expected: False
`,
      javascript: `function isValid(s) {
  // Your code here
}

console.log(isValid("()[]{}")); // expected: true
console.log(isValid("([)]"));   // expected: false
`,
      typescript: `function isValid(s: string): boolean {
  // Your code here
  return false;
}

console.log(isValid("()[]{}")); // expected: true
console.log(isValid("([)]"));   // expected: false
`,
    },
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    prompt: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`,
merge all overlapping intervals and return an array of the non-overlapping
intervals that cover all the intervals in the input.

**Example**

\`\`\`
Input:  [[1,3], [2,6], [8,10], [15,18]]
Output: [[1,6], [8,10], [15,18]]   // [1,3] and [2,6] overlap -> [1,6]
\`\`\``,
    starterCode: {
      python: `def merge(intervals):
    # Your code here
    pass


if __name__ == "__main__":
    print(merge([[1, 3], [2, 6], [8, 10], [15, 18]]))
    # expected: [[1, 6], [8, 10], [15, 18]]
`,
      javascript: `function merge(intervals) {
  // Your code here
}

console.log(merge([[1, 3], [2, 6], [8, 10], [15, 18]]));
// expected: [[1, 6], [8, 10], [15, 18]]
`,
      typescript: `function merge(intervals: number[][]): number[][] {
  // Your code here
  return [];
}

console.log(merge([[1, 3], [2, 6], [8, 10], [15, 18]]));
// expected: [[1, 6], [8, 10], [15, 18]]
`,
    },
  },
];

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}
