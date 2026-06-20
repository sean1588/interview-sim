import type { Problem } from "./types";

export const searchingProblems: Problem[] = [
  {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    prompt: `Given a sorted array and a target value, return the index of the target if it is found. If the target is not present, return -1.

**Example**

\`\`\`
Input:  nums = [1, 2, 3, 4, 5], target = 3
Output: 2
\`\`\``,
    starterCode: {
      python: `def binary_search(nums, target):
    # Your code here
    return -1


if __name__ == "__main__":
    print(binary_search([1, 2, 3, 4, 5], 3))  # expected: 2
`,
      javascript: `function binarySearch(nums, target) {
  // Your code here
  return -1;
}

console.log(binarySearch([1, 2, 3, 4, 5], 3)); // expected: 2
`,
      typescript: `function binarySearch(nums: number[], target: number): number {
  // Your code here
  return -1;
}

console.log(binarySearch([1, 2, 3, 4, 5], 3)); // expected: 2
`,
    },
  },
  {
    id: "search-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    prompt: `An integer array sorted in ascending order is possibly rotated at an unknown pivot. Given such an array and a target, return the index of the target if it is present, otherwise return -1.

**Example**

\`\`\`
Input:  nums = [4, 5, 6, 7, 0, 1, 2], target = 0
Output: 4
\`\`\``,
    starterCode: {
      python: `def search(nums, target):
    # Your code here
    return -1


if __name__ == "__main__":
    print(search([4, 5, 6, 7, 0, 1, 2], 0))  # expected: 4
`,
      javascript: `function search(nums, target) {
  // Your code here
  return -1;
}

console.log(search([4, 5, 6, 7, 0, 1, 2], 0)); // expected: 4
`,
      typescript: `function search(nums: number[], target: number): number {
  // Your code here
  return -1;
}

console.log(search([4, 5, 6, 7, 0, 1, 2], 0)); // expected: 4
`,
    },
  },
  {
    id: "median-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    prompt: `Given two sorted arrays \`nums1\` and \`nums2\`, return the median of the combined sorted set of all their elements. Aim for an overall run time of O(log (m + n)).

**Example**

\`\`\`
Input:  nums1 = [1, 3], nums2 = [2]
Output: 2.0
\`\`\``,
    starterCode: {
      python: `def find_median_sorted_arrays(nums1, nums2):
    # Your code here
    return 0.0


if __name__ == "__main__":
    print(find_median_sorted_arrays([1, 3], [2]))  # expected: 2.0
`,
      javascript: `function findMedianSortedArrays(nums1, nums2) {
  // Your code here
  return 0.0;
}

console.log(findMedianSortedArrays([1, 3], [2])); // expected: 2.0
`,
      typescript: `function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
  // Your code here
  return 0.0;
}

console.log(findMedianSortedArrays([1, 3], [2])); // expected: 2.0
`,
    },
  },
];
