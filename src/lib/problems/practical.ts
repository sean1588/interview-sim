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
  {
    id: "title-case",
    title: "Title-Case a Sentence",
    difficulty: "Easy",
    prompt: `Given a sentence, capitalize the first letter of each word and lowercase the
rest, EXCEPT for a fixed set of small words that stay fully lowercase.

The small words are \`a, an, and, the, or, of, to, in, on, for, with\`. A small
word is still capitalized when it is the very first word of the sentence. Words
are separated by single spaces; an empty input returns the empty string.

**Example**

\`\`\`
Input:  "the lord of the rings"
Output: "The Lord of the Rings"
\`\`\``,
    starterCode: {
      python: `def title_case(sentence):
    # Your code here
    return ""


if __name__ == "__main__":
    print(title_case("the lord of the rings"))
    # expected: The Lord of the Rings
`,
      javascript: `function titleCase(sentence) {
  // Your code here
  return "";
}

console.log(titleCase("the lord of the rings"));
// expected: The Lord of the Rings
`,
      typescript: `function titleCase(sentence: string): string {
  // Your code here
  return "";
}

console.log(titleCase("the lord of the rings"));
// expected: The Lord of the Rings
`,
    },
  },
  {
    id: "chunk-array",
    title: "Chunk a List",
    difficulty: "Easy",
    prompt: `Given a list and a chunk size \`n\`, split the list into consecutive chunks of
\`n\` elements each. The final chunk may be shorter if the list does not divide
evenly.

If \`n\` is less than or equal to 0, return an empty list. An empty input returns
an empty list.

**Example**

\`\`\`
Input:  ([1, 2, 3, 4, 5], 2)
Output: [[1, 2], [3, 4], [5]]
\`\`\``,
    starterCode: {
      python: `def chunk_array(items, n):
    # Your code here
    return []


if __name__ == "__main__":
    print(chunk_array([1, 2, 3, 4, 5], 2))
    # expected: [[1, 2], [3, 4], [5]]
`,
      javascript: `function chunkArray(items, n) {
  // Your code here
  return [];
}

console.log(chunkArray([1, 2, 3, 4, 5], 2));
// expected: [[1, 2], [3, 4], [5]]
`,
      typescript: `function chunkArray<T>(items: T[], n: number): T[][] {
  // Your code here
  return [];
}

console.log(chunkArray([1, 2, 3, 4, 5], 2));
// expected: [[1, 2], [3, 4], [5]]
`,
    },
  },
  {
    id: "group-by",
    title: "Group Records by Key",
    difficulty: "Medium",
    prompt: `Given a list of records (objects) and a key name, return a mapping from each
distinct value of that key to the list of records that have it.

Groups appear in first-seen order, and records within a group keep their
original order. Assume every record has the key. An empty input returns an empty
mapping.

**Example**

\`\`\`
Input:  ([{name: "a", team: "x"},
          {name: "b", team: "y"},
          {name: "c", team: "x"}], "team")
Output: { x: [{name: "a", team: "x"}, {name: "c", team: "x"}],
          y: [{name: "b", team: "y"}] }
\`\`\``,
    starterCode: {
      python: `def group_by(records, key):
    # Your code here
    return {}


if __name__ == "__main__":
    rows = [
        {"name": "a", "team": "x"},
        {"name": "b", "team": "y"},
        {"name": "c", "team": "x"},
    ]
    print(group_by(rows, "team"))
    # expected: {'x': [{'name': 'a', 'team': 'x'}, {'name': 'c', 'team': 'x'}], 'y': [{'name': 'b', 'team': 'y'}]}
`,
      javascript: `function groupBy(records, key) {
  // Your code here
  return {};
}

console.log(groupBy([
  { name: "a", team: "x" },
  { name: "b", team: "y" },
  { name: "c", team: "x" },
], "team"));
// expected: { x: [{name:"a",team:"x"}, {name:"c",team:"x"}], y: [{name:"b",team:"y"}] }
`,
      typescript: `function groupBy<T extends Record<string, any>>(
  records: T[],
  key: string,
): Record<string, T[]> {
  // Your code here
  return {};
}

console.log(groupBy([
  { name: "a", team: "x" },
  { name: "b", team: "y" },
  { name: "c", team: "x" },
], "team"));
// expected: { x: [{name:"a",team:"x"}, {name:"c",team:"x"}], y: [{name:"b",team:"y"}] }
`,
    },
  },
  {
    id: "format-duration",
    title: "Format a Duration",
    difficulty: "Medium",
    prompt: `Given a non-negative integer number of seconds, return a compact duration string
using the units \`h\`, \`m\` and \`s\`.

Include only the units with a non-zero value, joined by single spaces and
ordered largest first. When the input is 0, return \`"0s"\` (always show at least
one unit).

**Example**

\`\`\`
Input:  3661   Output: "1h 1m 1s"
Input:  90     Output: "1m 30s"
Input:  45     Output: "45s"
Input:  0      Output: "0s"
\`\`\``,
    starterCode: {
      python: `def format_duration(seconds):
    # Your code here
    return ""


if __name__ == "__main__":
    print(format_duration(3661))  # expected: 1h 1m 1s
    print(format_duration(90))    # expected: 1m 30s
    print(format_duration(45))    # expected: 45s
    print(format_duration(0))     # expected: 0s
`,
      javascript: `function formatDuration(seconds) {
  // Your code here
  return "";
}

console.log(formatDuration(3661));  // expected: 1h 1m 1s
console.log(formatDuration(90));    // expected: 1m 30s
console.log(formatDuration(45));    // expected: 45s
console.log(formatDuration(0));     // expected: 0s
`,
      typescript: `function formatDuration(seconds: number): string {
  // Your code here
  return "";
}

console.log(formatDuration(3661));  // expected: 1h 1m 1s
console.log(formatDuration(90));    // expected: 1m 30s
console.log(formatDuration(45));    // expected: 45s
console.log(formatDuration(0));     // expected: 0s
`,
    },
  },
  {
    id: "parse-cookie-string",
    title: "Parse a Cookie Header",
    difficulty: "Easy",
    prompt: `Given the value of an HTTP \`Cookie\` header, return a mapping from each cookie
name to its value.

Split the header on \`"; "\` (semicolon followed by a space), then split each
pair on the first \`=\`. A segment with no \`=\` is ignored. Values are used
verbatim — no decoding — so an empty value stays the empty string. An empty
input returns an empty mapping.

**Example**

\`\`\`
Input:  "sid=abc; theme=dark; empty="
Output: { sid: "abc", theme: "dark", empty: "" }
\`\`\``,
    starterCode: {
      python: `def parse_cookie_string(header):
    # Your code here
    return {}


if __name__ == "__main__":
    print(parse_cookie_string("sid=abc; theme=dark; empty="))
    # expected: {'sid': 'abc', 'theme': 'dark', 'empty': ''}
`,
      javascript: `function parseCookieString(header) {
  // Your code here
  return {};
}

console.log(parseCookieString("sid=abc; theme=dark; empty="));
// expected: { sid: "abc", theme: "dark", empty: "" }
`,
      typescript: `function parseCookieString(header: string): Record<string, string> {
  // Your code here
  return {};
}

console.log(parseCookieString("sid=abc; theme=dark; empty="));
// expected: { sid: "abc", theme: "dark", empty: "" }
`,
    },
  },
];
