import type { Problem } from "./types";

export const arraysProblems: Problem[] = [
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
    id: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "Medium",
    prompt: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge
all overlapping intervals and return an array of the non-overlapping intervals
that cover all the intervals in the input.

**Example**

\`\`\`
Input:  [[1, 3], [2, 6], [8, 10], [15, 18]]
Output: [[1, 6], [8, 10], [15, 18]]   // [1,3] and [2,6] overlap into [1,6]
\`\`\``,
    starterCode: {
      python: `def merge(intervals):
    # Your code here
    pass


if __name__ == "__main__":
    print(merge([[1, 3], [2, 6], [8, 10], [15, 18]]))  # expected: [[1, 6], [8, 10], [15, 18]]
`,
      javascript: `function merge(intervals) {
  // Your code here
}

console.log(merge([[1, 3], [2, 6], [8, 10], [15, 18]])); // expected: [[1, 6], [8, 10], [15, 18]]
`,
      typescript: `function merge(intervals: number[][]): number[][] {
  // Your code here
  return [];
}

console.log(merge([[1, 3], [2, 6], [8, 10], [15, 18]])); // expected: [[1, 6], [8, 10], [15, 18]]
`,
    },
  },
  {
    id: "three-sum",
    title: "3Sum",
    difficulty: "Medium",
    prompt: `Given an integer array \`nums\`, return all the triplets
\`[nums[i], nums[j], nums[k]]\` such that \`i\`, \`j\`, and \`k\` are distinct and
\`nums[i] + nums[j] + nums[k] == 0\`. The result must not contain duplicate
triplets.

**Example**

\`\`\`
Input:  nums = [-1, 0, 1, 2, -1, -4]
Output: [[-1, -1, 2], [-1, 0, 1]]
\`\`\``,
    starterCode: {
      python: `def three_sum(nums):
    # Your code here
    return []


if __name__ == "__main__":
    print(three_sum([-1, 0, 1, 2, -1, -4]))  # expected: [[-1, -1, 2], [-1, 0, 1]]
`,
      javascript: `function threeSum(nums) {
  // Your code here
  return [];
}

console.log(threeSum([-1, 0, 1, 2, -1, -4])); // expected: [[-1, -1, 2], [-1, 0, 1]]
`,
    },
  },
  {
    id: "product-except-self",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    prompt: `Given an integer array \`nums\`, return an array \`answer\` such that
\`answer[i]\` is the product of all the elements of \`nums\` except \`nums[i]\`.
Solve it without using division and in O(n) time.

**Example**

\`\`\`
Input:  nums = [1, 2, 3, 4]
Output: [24, 12, 8, 6]
\`\`\``,
    starterCode: {
      python: `def product_except_self(nums):
    # Your code here
    return []


if __name__ == "__main__":
    print(product_except_self([1, 2, 3, 4]))  # expected: [24, 12, 8, 6]
`,
      javascript: `function productExceptSelf(nums) {
  // Your code here
  return [];
}

console.log(productExceptSelf([1, 2, 3, 4])); // expected: [24, 12, 8, 6]
`,
    },
  },
  {
    id: "top-k-frequent",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    prompt: `Given an integer array \`nums\` and an integer \`k\`, return the \`k\` most
frequent elements. You may return the answer in any order.

**Example**

\`\`\`
Input:  nums = [1, 1, 1, 2, 2, 3], k = 2
Output: [1, 2]
\`\`\``,
    starterCode: {
      python: `def top_k_frequent(nums, k):
    # Your code here
    return []


if __name__ == "__main__":
    print(top_k_frequent([1, 1, 1, 2, 2, 3], 2))  # expected: [1, 2]
`,
      javascript: `function topKFrequent(nums, k) {
  // Your code here
  return [];
}

console.log(topKFrequent([1, 1, 1, 2, 2, 3], 2)); // expected: [1, 2]
`,
    },
  },
  {
    id: "longest-consecutive",
    title: "Longest Consecutive Sequence",
    difficulty: "Medium",
    prompt: `Given an unsorted array of integers \`nums\`, return the length of the longest
run of consecutive integers. Your algorithm must run in O(n) time.

**Example**

\`\`\`
Input:  nums = [100, 4, 200, 1, 3, 2]
Output: 4               // the sequence [1, 2, 3, 4]
\`\`\``,
    starterCode: {
      python: `def longest_consecutive(nums):
    # Your code here
    return 0


if __name__ == "__main__":
    print(longest_consecutive([100, 4, 200, 1, 3, 2]))  # expected: 4
`,
      javascript: `function longestConsecutive(nums) {
  // Your code here
  return 0;
}

console.log(longestConsecutive([100, 4, 200, 1, 3, 2])); // expected: 4
`,
    },
  },
  {
    id: "sock-merchant",
    title: "Sock Merchant",
    difficulty: "Easy",
    prompt: `Given an array \`ar\` of \`n\` sock colors, count how many matching pairs of
socks there are. A pair is two socks of the same color.

**Example**

\`\`\`
Input:  n = 9, ar = [10, 20, 20, 10, 10, 30, 50, 10, 20]
Output: 3               // two pairs of color 10, one pair of color 20
\`\`\``,
    starterCode: {
      python: `def sock_merchant(n, ar):
    # Your code here
    return 0


if __name__ == "__main__":
    print(sock_merchant(9, [10, 20, 20, 10, 10, 30, 50, 10, 20]))  # expected: 3
`,
      javascript: `function sockMerchant(n, ar) {
  // Your code here
  return 0;
}

console.log(sockMerchant(9, [10, 20, 20, 10, 10, 30, 50, 10, 20])); // expected: 3
`,
    },
  },
  {
    id: "array-left-rotation",
    title: "Array Left Rotation",
    difficulty: "Easy",
    prompt: `Given an array \`a\` of integers and an integer \`d\`, rotate the array to the
left by \`d\` positions and return the result.

**Example**

\`\`\`
Input:  a = [1, 2, 3, 4, 5], d = 2
Output: [3, 4, 5, 1, 2]
\`\`\``,
    starterCode: {
      python: `def rot_left(a, d):
    # Your code here
    return a


if __name__ == "__main__":
    print(rot_left([1, 2, 3, 4, 5], 2))  # expected: [3, 4, 5, 1, 2]
`,
      javascript: `function rotLeft(a, d) {
  // Your code here
  return a;
}

console.log(rotLeft([1, 2, 3, 4, 5], 2)); // expected: [3, 4, 5, 1, 2]
`,
    },
  },
  {
    id: "hourglass-sum",
    title: "2D Array Hourglass Sum",
    difficulty: "Medium",
    prompt: `Given a 6x6 2D array \`arr\`, find the largest sum among all hourglass-shaped
subsets. An hourglass is the pattern of indices:

\`\`\`
a b c
  d
e f g
\`\`\`

**Example**

\`\`\`
Input:
[[1, 1, 1, 0, 0, 0],
 [0, 1, 0, 0, 0, 0],
 [1, 1, 1, 0, 0, 0],
 [0, 0, 2, 4, 4, 0],
 [0, 0, 0, 2, 0, 0],
 [0, 0, 1, 2, 4, 0]]
Output: 19
\`\`\``,
    starterCode: {
      python: `def hourglass_sum(arr):
    # Your code here
    return 0


if __name__ == "__main__":
    grid = [
        [1, 1, 1, 0, 0, 0],
        [0, 1, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 0],
        [0, 0, 2, 4, 4, 0],
        [0, 0, 0, 2, 0, 0],
        [0, 0, 1, 2, 4, 0],
    ]
    print(hourglass_sum(grid))  # expected: 19
`,
      javascript: `function hourglassSum(arr) {
  // Your code here
  return 0;
}

const grid = [
  [1, 1, 1, 0, 0, 0],
  [0, 1, 0, 0, 0, 0],
  [1, 1, 1, 0, 0, 0],
  [0, 0, 2, 4, 4, 0],
  [0, 0, 0, 2, 0, 0],
  [0, 0, 1, 2, 4, 0],
];
console.log(hourglassSum(grid)); // expected: 19
`,
    },
  },
  {
    id: "two-movies-on-flight",
    title: "Two Movies on Flight",
    difficulty: "Medium",
    prompt: `You are on a flight of duration \`d\` minutes and want to watch exactly two
movies. Given \`movieDurations\`, pick the pair whose total duration is as large
as possible while still being at most \`d - 30\`. If several pairs tie, choose
the one containing the longest single movie. Return the two durations.

**Example**

\`\`\`
Input:  movieDurations = [90, 85, 75, 60, 120, 150, 125], d = 250
Output: [125, 90]       // sum 215 <= 220, the best fitting pair
\`\`\``,
    starterCode: {
      python: `def two_movies_on_flight(movie_durations, flight_duration):
    # Your code here
    return None


if __name__ == "__main__":
    print(two_movies_on_flight([90, 85, 75, 60, 120, 150, 125], 250))  # expected: [125, 90]
`,
      javascript: `function twoMoviesOnFlight(movieDurations, flightDuration) {
  // Your code here
  return null;
}

console.log(twoMoviesOnFlight([90, 85, 75, 60, 120, 150, 125], 250)); // expected: [125, 90]
`,
    },
  },
  {
    id: "stock-span",
    title: "Stock Span",
    difficulty: "Medium",
    prompt: `Given an array of daily stock \`prices\`, return an array where each element is
the stock span for that day: the number of consecutive days up to and including
today on which the price was less than or equal to today's price.

**Example**

\`\`\`
Input:  prices = [100, 80, 60, 70, 60, 75, 85]
Output: [1, 1, 1, 2, 1, 4, 6]
\`\`\``,
    starterCode: {
      python: `def stock_span(prices):
    # Your code here
    return []


if __name__ == "__main__":
    print(stock_span([100, 80, 60, 70, 60, 75, 85]))  # expected: [1, 1, 1, 2, 1, 4, 6]
`,
      javascript: `function stockSpan(prices) {
  // Your code here
  return [];
}

console.log(stockSpan([100, 80, 60, 70, 60, 75, 85])); // expected: [1, 1, 1, 2, 1, 4, 6]
`,
    },
  },
];
