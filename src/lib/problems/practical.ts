import type { Problem } from "./types";

export const practicalProblems: Problem[] = [
  {
    id: "parse-query-string",
    title: "Parse Query String",
    difficulty: "Easy",
    prompt: `Given a URL query string, return a mapping from each key to its value.

Ignore a single leading \`?\` if present, then split on \`&\` and on the first \`=\`
of each pair. A key with no \`=\` maps to the empty string. A key that appears
more than once maps to the list of its values in first-seen order (a key seen
once maps to a plain string, not a one-element list). Values are used verbatim —
no URL-decoding. An empty input returns an empty mapping.

**Example**

\`\`\`
Input:  "?a=1&b=2&b=3&c=&flag"
Output: { a: "1", b: ["2", "3"], c: "", flag: "" }
\`\`\``,
    starterCode: {
      python: `def parse_query_string(query):
    # Your code here
    return {}


if __name__ == "__main__":
    print(parse_query_string("?a=1&b=2&b=3&c=&flag"))
    # expected: {'a': '1', 'b': ['2', '3'], 'c': '', 'flag': ''}
`,
      javascript: `function parseQueryString(query) {
  // Your code here
  return {};
}

console.log(parseQueryString("?a=1&b=2&b=3&c=&flag"));
// expected: { a: "1", b: ["2", "3"], c: "", flag: "" }
`,
      typescript: `function parseQueryString(query: string): Record<string, string | string[]> {
  // Your code here
  return {};
}

console.log(parseQueryString("?a=1&b=2&b=3&c=&flag"));
// expected: { a: "1", b: ["2", "3"], c: "", flag: "" }
`,
    },
  },
  {
    id: "flatten-object",
    title: "Flatten a Nested Object",
    difficulty: "Medium",
    prompt: `Given a nested object, return a flat one whose keys are the dot-joined paths to
each leaf, where a leaf is any value that is not a plain object.

Assume string keys, no arrays, and no empty nested objects — every branch ends
in a leaf. An empty input returns an empty object.

**Example**

\`\`\`
Input:  { a: 1, b: { c: 2, d: { e: 3 } } }
Output: { "a": 1, "b.c": 2, "b.d.e": 3 }
\`\`\``,
    starterCode: {
      python: `def flatten_object(obj):
    # Your code here
    return {}


if __name__ == "__main__":
    print(flatten_object({"a": 1, "b": {"c": 2, "d": {"e": 3}}}))
    # expected: {'a': 1, 'b.c': 2, 'b.d.e': 3}
`,
      javascript: `function flattenObject(obj) {
  // Your code here
  return {};
}

console.log(flattenObject({ a: 1, b: { c: 2, d: { e: 3 } } }));
// expected: { "a": 1, "b.c": 2, "b.d.e": 3 }
`,
      typescript: `function flattenObject(obj: Record<string, any>): Record<string, any> {
  // Your code here
  return {};
}

console.log(flattenObject({ a: 1, b: { c: 2, d: { e: 3 } } }));
// expected: { "a": 1, "b.c": 2, "b.d.e": 3 }
`,
    },
  },
  {
    id: "humanize-bytes",
    title: "Human-Readable File Size",
    difficulty: "Easy",
    prompt: `Given a non-negative integer number of bytes, return a human-readable size
string using the units B, KB, MB, GB and TB, where 1 KB = 1024 B.

Use the largest unit for which the value is at least 1, capping at TB. Plain
bytes (under 1024) show no decimals and the unit \`B\`; KB and above show exactly
one decimal place.

**Example**

\`\`\`
Input:  0          Output: "0 B"
Input:  500        Output: "500 B"
Input:  1024       Output: "1.0 KB"
Input:  1536       Output: "1.5 KB"
Input:  5242880    Output: "5.0 MB"
\`\`\``,
    starterCode: {
      python: `def humanize_bytes(num_bytes):
    # Your code here
    return ""


if __name__ == "__main__":
    print(humanize_bytes(0))        # expected: 0 B
    print(humanize_bytes(500))      # expected: 500 B
    print(humanize_bytes(1024))     # expected: 1.0 KB
    print(humanize_bytes(1536))     # expected: 1.5 KB
    print(humanize_bytes(5242880))  # expected: 5.0 MB
`,
      javascript: `function humanizeBytes(numBytes) {
  // Your code here
  return "";
}

console.log(humanizeBytes(0));        // expected: 0 B
console.log(humanizeBytes(500));      // expected: 500 B
console.log(humanizeBytes(1024));     // expected: 1.0 KB
console.log(humanizeBytes(1536));     // expected: 1.5 KB
console.log(humanizeBytes(5242880));  // expected: 5.0 MB
`,
      typescript: `function humanizeBytes(numBytes: number): string {
  // Your code here
  return "";
}

console.log(humanizeBytes(0));        // expected: 0 B
console.log(humanizeBytes(500));      // expected: 500 B
console.log(humanizeBytes(1024));     // expected: 1.0 KB
console.log(humanizeBytes(1536));     // expected: 1.5 KB
console.log(humanizeBytes(5242880));  // expected: 5.0 MB
`,
    },
  },
];
