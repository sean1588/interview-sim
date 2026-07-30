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
  {
    id: "parse-csv-line",
    title: "Parse a CSV Line",
    difficulty: "Medium",
    prompt: `Given a single line of CSV, return the list of its fields.

Fields are separated by commas. A field may be wrapped in double quotes, in
which case it can contain commas. Inside a quoted field, a doubled double-quote
(\`""\`) is an escaped quote character. Unquoted fields are used verbatim, and
empty fields are allowed. An empty input returns an empty list.

**Example**

\`\`\`
Input:  'one,"two, three","say ""hi""",'
Output: ["one", "two, three", 'say "hi"', ""]
\`\`\``,
    starterCode: {
      python: `def parse_csv_line(line):
    # Your code here
    return []


if __name__ == "__main__":
    print(parse_csv_line('one,"two, three","say ""hi""",'))
    # expected: ['one', 'two, three', 'say "hi"', '']
`,
      javascript: `function parseCsvLine(line) {
  // Your code here
  return [];
}

console.log(parseCsvLine('one,"two, three","say ""hi""",'));
// expected: [ "one", "two, three", 'say "hi"', "" ]
`,
      typescript: `function parseCsvLine(line: string): string[] {
  // Your code here
  return [];
}

console.log(parseCsvLine('one,"two, three","say ""hi""",'));
// expected: [ "one", "two, three", 'say "hi"', "" ]
`,
    },
  },
  {
    id: "compare-versions",
    title: "Compare Version Strings",
    difficulty: "Easy",
    prompt: `Given two version strings like \`"1.2.10"\` and \`"1.3"\`, return \`-1\` if the
first is lower, \`1\` if it is higher, and \`0\` if they are equal.

Split each version on \`.\` and compare the parts as integers, left to right.
When one version has fewer parts, the missing parts count as 0 (so \`"1.0"\`
equals \`"1.0.0"\`). Note that comparing as strings is wrong: \`"1.2.10"\` is
higher than \`"1.2.9"\`.

**Example**

\`\`\`
Input:  ("1.2.10", "1.3")    Output: -1
Input:  ("1.0", "1.0.0")     Output: 0
Input:  ("2.1", "2.0.9")     Output: 1
\`\`\``,
    starterCode: {
      python: `def compare_versions(a, b):
    # Your code here
    return 0


if __name__ == "__main__":
    print(compare_versions("1.2.10", "1.3"))  # expected: -1
    print(compare_versions("1.0", "1.0.0"))   # expected: 0
    print(compare_versions("2.1", "2.0.9"))   # expected: 1
`,
      javascript: `function compareVersions(a, b) {
  // Your code here
  return 0;
}

console.log(compareVersions("1.2.10", "1.3"));  // expected: -1
console.log(compareVersions("1.0", "1.0.0"));   // expected: 0
console.log(compareVersions("2.1", "2.0.9"));   // expected: 1
`,
      typescript: `function compareVersions(a: string, b: string): number {
  // Your code here
  return 0;
}

console.log(compareVersions("1.2.10", "1.3"));  // expected: -1
console.log(compareVersions("1.0", "1.0.0"));   // expected: 0
console.log(compareVersions("2.1", "2.0.9"));   // expected: 1
`,
    },
  },
  {
    id: "render-template",
    title: "Render a Template String",
    difficulty: "Easy",
    prompt: `Given a template string containing placeholders like \`{name}\` and a mapping of
values, return the template with each placeholder replaced by its value.

Placeholder names consist of letters, digits and underscores. A placeholder
whose name is missing from the mapping is left in the output as-is. Values are
converted to strings. Braces never nest and there is no escape syntax.

**Example**

\`\`\`
Input:  ("Hi {name}, you have {n} new {kind}", { name: "Sam", n: 3 })
Output: "Hi Sam, you have 3 new {kind}"
\`\`\``,
    starterCode: {
      python: `def render_template(template, values):
    # Your code here
    return ""


if __name__ == "__main__":
    print(render_template("Hi {name}, you have {n} new {kind}", {"name": "Sam", "n": 3}))
    # expected: Hi Sam, you have 3 new {kind}
`,
      javascript: `function renderTemplate(template, values) {
  // Your code here
  return "";
}

console.log(renderTemplate("Hi {name}, you have {n} new {kind}", { name: "Sam", n: 3 }));
// expected: Hi Sam, you have 3 new {kind}
`,
      typescript: `function renderTemplate(template: string, values: Record<string, unknown>): string {
  // Your code here
  return "";
}

console.log(renderTemplate("Hi {name}, you have {n} new {kind}", { name: "Sam", n: 3 }));
// expected: Hi Sam, you have 3 new {kind}
`,
    },
  },
  {
    id: "deep-merge",
    title: "Deep-Merge Two Configs",
    difficulty: "Medium",
    prompt: `Given a base config object and an override object, return a new object that
merges them: keys from the override win.

When the same key holds a plain object in BOTH inputs, merge those recursively.
Any other value in the override (including a list) replaces the base value
wholesale. Keys present in only one input are kept. Do not mutate either input.

**Example**

\`\`\`
Input:  base     = { port: 80, log: { level: "info", json: true } }
        override = { log: { level: "debug" }, tags: ["a"] }
Output: { port: 80, log: { level: "debug", json: true }, tags: ["a"] }
\`\`\``,
    starterCode: {
      python: `def deep_merge(base, override):
    # Your code here
    return {}


if __name__ == "__main__":
    base = {"port": 80, "log": {"level": "info", "json": True}}
    override = {"log": {"level": "debug"}, "tags": ["a"]}
    print(deep_merge(base, override))
    # expected: {'port': 80, 'log': {'level': 'debug', 'json': True}, 'tags': ['a']}
`,
      javascript: `function deepMerge(base, override) {
  // Your code here
  return {};
}

console.log(deepMerge(
  { port: 80, log: { level: "info", json: true } },
  { log: { level: "debug" }, tags: ["a"] },
));
// expected: { port: 80, log: { level: "debug", json: true }, tags: ["a"] }
`,
      typescript: `function deepMerge(
  base: Record<string, any>,
  override: Record<string, any>,
): Record<string, any> {
  // Your code here
  return {};
}

console.log(deepMerge(
  { port: 80, log: { level: "info", json: true } },
  { log: { level: "debug" }, tags: ["a"] },
));
// expected: { port: 80, log: { level: "debug", json: true }, tags: ["a"] }
`,
    },
  },
  {
    id: "parse-duration",
    title: "Parse a Duration String",
    difficulty: "Easy",
    prompt: `Given a compact duration string using the units \`h\`, \`m\` and \`s\`, return the
total number of seconds.

The input is one or more tokens separated by single spaces, each a non-negative
integer followed by a unit character. Values need not be normalized (\`"90m"\` is
valid) and units appear at most once, largest first.

**Example**

\`\`\`
Input:  "1h 1m 1s"   Output: 3661
Input:  "1m 30s"     Output: 90
Input:  "90m"        Output: 5400
Input:  "0s"         Output: 0
\`\`\``,
    starterCode: {
      python: `def parse_duration(text):
    # Your code here
    return 0


if __name__ == "__main__":
    print(parse_duration("1h 1m 1s"))  # expected: 3661
    print(parse_duration("1m 30s"))    # expected: 90
    print(parse_duration("90m"))       # expected: 5400
    print(parse_duration("0s"))        # expected: 0
`,
      javascript: `function parseDuration(text) {
  // Your code here
  return 0;
}

console.log(parseDuration("1h 1m 1s"));  // expected: 3661
console.log(parseDuration("1m 30s"));    // expected: 90
console.log(parseDuration("90m"));       // expected: 5400
console.log(parseDuration("0s"));        // expected: 0
`,
      typescript: `function parseDuration(text: string): number {
  // Your code here
  return 0;
}

console.log(parseDuration("1h 1m 1s"));  // expected: 3661
console.log(parseDuration("1m 30s"));    // expected: 90
console.log(parseDuration("90m"));       // expected: 5400
console.log(parseDuration("0s"));        // expected: 0
`,
    },
  },
  {
    id: "diff-objects",
    title: "Diff Two Objects",
    difficulty: "Medium",
    prompt: `Given the old and new versions of a flat object, return a diff with three
parts: \`added\` (keys only in the new object, mapped to their values), \`removed\`
(the list of keys only in the old object), and \`changed\` (keys present in both
with different values, mapped to the pair \`[old, new]\`).

Keys appear in first-seen order of the object they come from (\`added\` and
\`changed\` follow the new object, \`removed\` follows the old). Values are simple
scalars — no nesting. Identical objects produce an empty diff.

**Example**

\`\`\`
Input:  old = { a: 1, b: 2, c: 3 }
        new = { a: 1, b: 9, d: 4 }
Output: { added: { d: 4 }, removed: ["c"], changed: { b: [2, 9] } }
\`\`\``,
    starterCode: {
      python: `def diff_objects(old, new):
    # Your code here
    return {"added": {}, "removed": [], "changed": {}}


if __name__ == "__main__":
    print(diff_objects({"a": 1, "b": 2, "c": 3}, {"a": 1, "b": 9, "d": 4}))
    # expected: {'added': {'d': 4}, 'removed': ['c'], 'changed': {'b': [2, 9]}}
`,
      javascript: `function diffObjects(oldObj, newObj) {
  // Your code here
  return { added: {}, removed: [], changed: {} };
}

console.log(diffObjects({ a: 1, b: 2, c: 3 }, { a: 1, b: 9, d: 4 }));
// expected: { added: { d: 4 }, removed: ["c"], changed: { b: [2, 9] } }
`,
      typescript: `function diffObjects(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
): { added: Record<string, any>; removed: string[]; changed: Record<string, [any, any]> } {
  // Your code here
  return { added: {}, removed: [], changed: {} };
}

console.log(diffObjects({ a: 1, b: 2, c: 3 }, { a: 1, b: 9, d: 4 }));
// expected: { added: { d: 4 }, removed: ["c"], changed: { b: [2, 9] } }
`,
    },
  },
];
