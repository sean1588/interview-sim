import type { Problem } from "./types";

export const stringsProblems: Problem[] = [
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
    id: "group-anagrams",
    title: "Group Anagrams",
    difficulty: "Medium",
    prompt: `Given an array of strings \`strs\`, group the anagrams together. Anagrams are
words made from the same characters in a different order. Return the groups in
any order.

**Example**

\`\`\`
Input:  ["eat", "tea", "tan", "ate", "nat", "bat"]
Output: [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]
\`\`\``,
    starterCode: {
      python: `def group_anagrams(strs):
    # Your code here
    return []


if __name__ == "__main__":
    print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
    # expected: [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]
`,
      javascript: `function groupAnagrams(strs) {
  // Your code here
  return [];
}

console.log(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));
// expected: [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]
`,
    },
  },
  {
    id: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    prompt: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of
\`s\`, and \`false\` otherwise. Two strings are anagrams if they contain the same
characters with the same frequencies.

**Example**

\`\`\`
Input:  s = "anagram", t = "nagaram"
Output: true

Input:  s = "rat", t = "car"
Output: false
\`\`\``,
    starterCode: {
      python: `def is_anagram(s, t):
    # Your code here
    return False


if __name__ == "__main__":
    print(is_anagram("anagram", "nagaram"))  # expected: True
    print(is_anagram("rat", "car"))          # expected: False
`,
      javascript: `function isAnagram(s, t) {
  // Your code here
  return false;
}

console.log(isAnagram("anagram", "nagaram")); // expected: true
console.log(isAnagram("rat", "car"));         // expected: false
`,
    },
  },
  {
    id: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    prompt: `Given a string \`s\`, find the length of the longest substring without
repeating characters.

**Example**

\`\`\`
Input:  "abcabcbb"
Output: 3   ("abc")

Input:  "pwwkew"
Output: 3   ("wke")
\`\`\``,
    starterCode: {
      python: `def length_of_longest_substring(s):
    # Your code here
    return 0


if __name__ == "__main__":
    print(length_of_longest_substring("abcabcbb"))  # expected: 3
    print(length_of_longest_substring("pwwkew"))    # expected: 3
`,
      javascript: `function lengthOfLongestSubstring(s) {
  // Your code here
  return 0;
}

console.log(lengthOfLongestSubstring("abcabcbb")); // expected: 3
console.log(lengthOfLongestSubstring("pwwkew"));   // expected: 3
`,
    },
  },
  {
    id: "minimum-window-substring",
    title: "Minimum Window Substring",
    difficulty: "Hard",
    prompt: `Given two strings \`s\` and \`t\`, return the smallest substring of \`s\` that
contains every character of \`t\` (including duplicates). If no such substring
exists, return the empty string.

**Example**

\`\`\`
Input:  s = "adobecodebanc", t = "abc"
Output: "banc"

Input:  s = "abc", t = "abc"
Output: "abc"
\`\`\``,
    starterCode: {
      python: `def min_window(s, t):
    # Your code here
    return ""


if __name__ == "__main__":
    print(min_window("adobecodebanc", "abc"))  # expected: banc
    print(min_window("abc", "abc"))            # expected: abc
`,
      javascript: `function minWindow(s, t) {
  // Your code here
  return "";
}

console.log(minWindow("adobecodebanc", "abc")); // expected: banc
console.log(minWindow("abc", "abc"));           // expected: abc
`,
    },
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    prompt: `Given a string \`s\`, determine if it reads the same forwards and backwards,
considering only alphanumeric characters and ignoring case.

**Example**

\`\`\`
Input:  "A man, a plan, a canal: Panama"
Output: true

Input:  "race a car"
Output: false
\`\`\``,
    starterCode: {
      python: `def is_palindrome(s):
    # Your code here
    return False


if __name__ == "__main__":
    print(is_palindrome("A man, a plan, a canal: Panama"))  # expected: True
    print(is_palindrome("race a car"))                      # expected: False
`,
      javascript: `function isPalindrome(s) {
  // Your code here
  return false;
}

console.log(isPalindrome("A man, a plan, a canal: Panama")); // expected: true
console.log(isPalindrome("race a car"));                     // expected: false
`,
    },
  },
  {
    id: "hamming-distance",
    title: "Hamming Distance",
    difficulty: "Easy",
    prompt: `Given two strings of equal length, compute the Hamming distance: the number of
positions at which the corresponding characters differ. If the strings have
different lengths, return \`-1\`.

**Example**

\`\`\`
Input:  s1 = "karolin", s2 = "kathrin"
Output: 3

Input:  s1 = "10101", s2 = "10011"
Output: 2
\`\`\``,
    starterCode: {
      python: `def hamming_distance(s1, s2):
    # Your code here
    return 0


if __name__ == "__main__":
    print(hamming_distance("karolin", "kathrin"))  # expected: 3
    print(hamming_distance("10101", "10011"))      # expected: 2
`,
      javascript: `function hammingDistance(s1, s2) {
  // Your code here
  return 0;
}

console.log(hammingDistance("karolin", "kathrin")); // expected: 3
console.log(hammingDistance("10101", "10011"));     // expected: 2
`,
    },
  },
  {
    id: "hamming-code-7-4",
    title: "Hamming Code (7,4) Single-Bit Error Correction",
    difficulty: "Hard",
    prompt: `Implement the Hamming(7,4) code. \`hamming_encode\` takes 4 data bits and
returns a 7-bit codeword laid out as \`[p1, p2, d1, p3, d2, d3, d4]\`.
\`hamming_decode\` takes a 7-bit codeword, corrects any single-bit error, and
returns the 4 recovered data bits along with the 1-based position of the error
(0 if none).

**Example**

\`\`\`
Input:  encode [1, 0, 1, 1]
Output: [0, 1, 1, 0, 0, 1, 1]

Input:  decode [0, 1, 1, 0, 0, 1, 1] with bit 3 flipped
Output: data [1, 0, 1, 1], error_pos 3
\`\`\``,
    starterCode: {
      python: `def hamming_encode(data):
    # Your code here
    return []


def hamming_decode(codeword):
    # Your code here
    return {"data": [], "corrected": [], "error_pos": 0}


if __name__ == "__main__":
    print(hamming_encode([1, 0, 1, 1]))  # expected: [0, 1, 1, 0, 0, 1, 1]
    print(hamming_decode([0, 1, 1, 0, 0, 1, 1]))
    # expected: data [1, 0, 1, 1], error_pos 0
`,
      javascript: `function hammingEncode(data) {
  // Your code here
  return [];
}

function hammingDecode(codeword) {
  // Your code here
  return { data: [], corrected: [], errorPos: 0 };
}

console.log(hammingEncode([1, 0, 1, 1])); // expected: [0, 1, 1, 0, 0, 1, 1]
console.log(hammingDecode([0, 1, 1, 0, 0, 1, 1]));
// expected: data [1, 0, 1, 1], errorPos 0
`,
    },
  },
];
