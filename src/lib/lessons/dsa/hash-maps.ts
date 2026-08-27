import type { Lesson } from "../types";

export const hashMapsLessons: Lesson[] = [
  {
    id: "dsa-hash-mechanics",
    module: "hash-maps",
    title: "How a Hash Map Actually Works",
    blurb: "Hash to a bucket, chain on collision — why O(1) is \"average\".",
    graphics: [
      {
        id: "buckets",
        title: "Hash into buckets",
        caption:
          "A hash function scatters keys into slots. Collisions chain in the same bucket — average O(1), worst-case linear if everything piles into one slot.",
        src: "/lesson-graphics/dsa/dsa-hash-mechanics.png",
      },
    ],
    content: {
      typescript: `You use \`Map\` and \`Set\` daily. Here's what's actually in memory when you call \`map.get(key)\`.

## The mechanism

A hash map is an **array of buckets**. Two steps turn a key into an array index:

1. A **hash function** turns the key into a number: \`stringHash("apple") → 93029210\`.
2. **Modulo the bucket count** picks a slot: \`93029210 % 8 → 2\`.

That's it — a key lookup is really an array index, which is why it's O(1). But two different keys can land in the same bucket (with 8 buckets and 9 keys, it's guaranteed — pigeonhole). That's a **collision**, and the standard fix is **chaining**: each bucket holds a small list of \`[key, value]\` pairs, and lookup walks that chain comparing keys.

\`\`\`ts
// bucket 2 after inserting "apple" and "mango" (both hash there):
buckets[2] = [["apple", 3], ["mango", 4]];
// get("mango") = hash → bucket 2 → walk chain, compare keys → 4
\`\`\`

## Why O(1) is "average"

Lookup cost = 1 hash + chain length. With a good hash function spreading n keys over b buckets, chains average n/b — a small constant. Worst case, every key hashes to one bucket and the map degrades to a linked list: **O(n) per lookup**. That's the fine print in "O(1) average".

Two things keep chains short:

- **A good hash function**: deterministic (same key, same number — non-negotiable) and well-spread (similar keys should land in different buckets).
- **Resizing**: when the **load factor** (n / buckets) passes a threshold (~0.75 typically), the map allocates more buckets and **rehashes every key** — bucket = hash % length, so new length means new buckets. One resize is O(n), but amortized over all the inserts that led to it, insertion stays O(1). Same amortization story as array push.

## In TypeScript practice

- **\`Map\` over plain object** for anything dynamic: arbitrary key types, no prototype-key surprises, \`.size\` for free, insertion-order iteration.
- **\`Set\`** when you only care about membership.
- **The object-identity trap**: object keys hash by *reference*. \`map.get({x: 1})\` never finds anything, because that literal is a brand-new object:

\`\`\`ts
const seen = new Map<object, string>();
seen.set({ x: 1 }, "hi");
seen.get({ x: 1 }); // undefined — different object, different key
// Want value semantics? Key a Map<string, V> by JSON.stringify(obj) or a canonical id.
\`\`\``,
      python: `You use \`dict\` and \`set\` daily. Here's what's actually in memory when you call \`d[key]\`.

## The mechanism

A hash map is an **array of buckets**. Two steps turn a key into an array index:

1. A **hash function** turns the key into a number: \`hash("apple")\` → some large integer.
2. **Modulo the bucket count** picks a slot: \`93029210 % 8\` → \`2\`.

That's it — a key lookup is really an array index, which is why it's O(1). But two different keys can land in the same bucket (with 8 buckets and 9 keys, it's guaranteed — pigeonhole). That's a **collision**, and the textbook fix is **chaining**: each bucket holds a small list of \`[key, value]\` pairs, and lookup walks that chain comparing keys.

\`\`\`python
# bucket 2 after inserting "apple" and "mango" (both hash there):
buckets[2] = [["apple", 3], ["mango", 4]]
# get("mango") = hash -> bucket 2 -> walk chain, compare keys -> 4
\`\`\`

**Worth knowing: CPython's real \`dict\` doesn't chain.** It uses *open addressing* — on a collision it probes for another empty slot in the same array rather than hanging a list off the bucket. The exercise below builds the chaining version because it makes the mechanism visible, and the complexity story (O(1) average, O(n) worst case, resize on load factor) is the same either way. Open addressing just trades the chain pointers for better cache locality.

## Why O(1) is "average"

Lookup cost = 1 hash + collision resolution. With a good hash function spreading n keys over b buckets, chains average n/b — a small constant. Worst case, every key hashes to one bucket and the map degrades to a linear scan: **O(n) per lookup**. That's the fine print in "O(1) average".

Two things keep collisions rare:

- **A good hash function**: deterministic (same key, same number — non-negotiable) and well-spread (similar keys should land in different buckets).
- **Resizing**: when the **load factor** (n / buckets) passes a threshold (CPython grows at 2/3 full), the map allocates more buckets and **rehashes every key** — bucket = hash % length, so new length means new buckets. One resize is O(n), but amortized over all the inserts that led to it, insertion stays O(1). Same amortization story as list append.

## In Python practice

- **\`dict\` over a list of pairs** for anything you look up by key: O(1) average instead of an O(n) scan.
- **\`set\`** when you only care about membership. Note it is *unordered* — \`dict\` preserves insertion order (guaranteed since 3.7), \`set\` does not.
- **\`collections.defaultdict\` / \`Counter\`** when you'd otherwise write \`d.get(k, 0)\` everywhere.
- **The hashability trap**: keys must be hashable, which in practice means immutable. A \`list\` or \`dict\` as a key raises immediately:

\`\`\`python
seen = {}
seen[{"x": 1}] = "hi"   # TypeError: unhashable type: 'dict'
seen[["a", "b"]] = "hi" # TypeError: unhashable type: 'list'
seen[("a", "b")] = "hi" # fine — tuples are hashable
\`\`\`

This is friendlier than it looks: Python refuses up front rather than silently storing something you can never find again. A custom class *is* hashable by default, but hashes by **identity** — two structurally equal instances are different keys until you define \`__hash__\` and \`__eq__\` (or use a frozen dataclass, which writes both for you).`,
    },
    exercises: [
    {
      id: "dsa-toy-hash-map",
      title: "Build a toy hash map",
      instructions: {
        typescript: `Implement \`set\` and \`get\` on \`ToyMap\`. The hash function, the fixed 8-bucket array of \`[key, value][]\` chains, and \`bucketIndex\` are given — your job is only the chain logic:

- **\`set(key, value)\`**: find the bucket; if the chain already has an entry with this key, replace its value; otherwise push a new pair.
- **\`get(key)\`**: walk the chain in that bucket; return the value, or \`undefined\` if absent.

The example inserts \`"apple"\` and \`"mango"\`, which both hash to bucket 2 — your chain handling is what keeps them both alive.

Expected output: \`1\`, \`30\`, \`4\`, \`undefined\`.`,
        python: `Implement \`set_\` and \`get\` on \`ToyMap\`. The hash function, the fixed 8-bucket list of \`[key, value]\` chains, and \`bucket_index\` are given — your job is only the chain logic:

- **\`set_(key, value)\`**: find the bucket; if the chain already has an entry with this key, replace its value; otherwise append a new pair.
- **\`get(key)\`**: walk the chain in that bucket; return the value, or \`None\` if absent.

(The method is named \`set_\` to avoid colliding with the builtin \`set\`. Real dicts use \`d[key] = value\` via \`__setitem__\` — the plain name keeps the focus on the chain logic.)

The example inserts \`"apple"\` and \`"mango"\`, which both hash to bucket 2 — your chain handling is what keeps them both alive.

Expected output: \`1\`, \`30\`, \`4\`, \`None\`.`,
      },
      starterCode: {
        typescript: `// Given complete: a simple deterministic string hash.
function stringHash(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

class ToyMap {
  buckets: [string, number][][] = Array.from({ length: 8 }, () => []);

  bucketIndex(key: string): number {
    return stringHash(key) % 8;
  }

  set(key: string, value: number): void {
    // TODO: find the bucket via this.bucketIndex(key).
    // If an entry with this key already exists in the chain, replace its value;
    // otherwise push a new [key, value] pair onto the chain.
  }

  get(key: string): number | undefined {
    // TODO: scan the chain in the right bucket and return the value,
    // or undefined if the key is not there.
    return undefined;
  }
}

const m = new ToyMap();
m.set("cat", 1);
m.set("dog", 2);
// "apple" and "mango" both hash to bucket 2 — a real collision:
// both pairs must coexist in the same chain.
m.set("apple", 3);
m.set("mango", 4);
m.set("apple", 30); // replace, not duplicate

console.log(m.get("cat")); // expect 1
console.log(m.get("apple")); // expect 30 (replaced)
console.log(m.get("mango")); // expect 4 (survived the collision)
// String() because this console prints a raw undefined as a blank line:
console.log(String(m.get("missing"))); // expect undefined`,
        python: `# Given complete: a simple deterministic string hash.
# The mask mimics a fixed 32-bit register; Python ints are unbounded,
# so without it the value would grow without limit.
def string_hash(key):
    h = 0
    for ch in key:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h


class ToyMap:
    def __init__(self):
        self.buckets = [[] for _ in range(8)]

    def bucket_index(self, key):
        return string_hash(key) % 8

    def set_(self, key, value):
        # TODO: find the bucket via self.bucket_index(key).
        # If an entry with this key already exists in the chain, replace its
        # value; otherwise append a new [key, value] pair onto the chain.
        pass

    def get(self, key):
        # TODO: scan the chain in the right bucket and return the value,
        # or None if the key is not there.
        return None


m = ToyMap()
m.set_("cat", 1)
m.set_("dog", 2)
# "apple" and "mango" both hash to bucket 2 — a real collision:
# both pairs must coexist in the same chain.
m.set_("apple", 3)
m.set_("mango", 4)
m.set_("apple", 30)  # replace, not duplicate

print(m.get("cat"))      # expect 1
print(m.get("apple"))    # expect 30 (replaced)
print(m.get("mango"))    # expect 4 (survived the collision)
print(m.get("missing"))  # expect None
`,
      },
    },
    {
      id: "dsa-collision-count",
      title: "Watch the collisions",
      instructions: {
        typescript: `Implement \`bucketCounts(keys)\`: for each key, compute \`stringHash(key) % BUCKETS\` and count how many keys land in each of the 8 buckets.

The example prints a histogram for 12 sample keys. Even with a reasonable hash, the spread is **uneven** — that unevenness is exactly why hash map complexity is stated as *average*, not guaranteed.

Expected output: 8 histogram lines; buckets 2 and 3 should each show 4 keys, and the rest 0 or 1.`,
        python: `Implement \`bucket_counts(keys)\`: for each key, compute \`string_hash(key) % BUCKETS\` and count how many keys land in each of the 8 buckets.

The example prints a histogram for 12 sample keys. Even with a reasonable hash, the spread is **uneven** — that unevenness is exactly why hash map complexity is stated as *average*, not guaranteed.

Expected output: 8 histogram lines; buckets 2 and 3 should each show 4 keys, and the rest 0 or 1.`,
      },
      starterCode: {
        typescript: `// Given complete: the same hash the toy map used.
function stringHash(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

const BUCKETS = 8;

function bucketCounts(keys: string[]): number[] {
  const counts = new Array(BUCKETS).fill(0);
  // TODO: for each key, compute stringHash(key) % BUCKETS
  // and increment that bucket's count.
  return counts;
}

const sampleKeys = [
  "apple", "mango", "blue", "user:1",
  "grape", "green", "cyan", "lemon",
  "cat", "dog", "bird", "fish",
];

const dist = bucketCounts(sampleKeys);
dist.forEach((count, i) => {
  console.log(\`bucket \${i}: \${"#".repeat(count)} (\${count})\`);
});
// Expected once implemented: an UNEVEN spread —
// buckets 2 and 3 get 4 keys each while others get 0 or 1.`,
        python: `# Given complete: the same hash the toy map used.
def string_hash(key):
    h = 0
    for ch in key:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h


BUCKETS = 8


def bucket_counts(keys):
    counts = [0] * BUCKETS
    # TODO: for each key, compute string_hash(key) % BUCKETS
    # and increment that bucket's count.
    return counts


sample_keys = [
    "apple", "mango", "blue", "user:1",
    "grape", "green", "cyan", "lemon",
    "cat", "dog", "bird", "fish",
]

dist = bucket_counts(sample_keys)
for i, count in enumerate(dist):
    print(f"bucket {i}: {'#' * count} ({count})")
# Expected once implemented: an UNEVEN spread —
# buckets 2 and 3 get 4 keys each while others get 0 or 1.
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-hash-mechanics-q1",
      prompt: "A hash map with chaining holds n keys. What is the WORST-case cost of a single `get`, and when does it happen?",
      options: [
        "O(1) — hashing makes lookup constant time by construction, regardless of the keys",
        "O(log n) — the chains are kept balanced like a tree",
        "O(n) — but only when the map has never been resized",
        "O(n) — when every key hashes to the same bucket, so the chain is the whole map",
      ],
      answer: 3,
      explanation: "Lookup is hash + chain walk. If a bad (or adversarial) key set puts everything in one bucket, the chain is length n and the map degrades to a linked-list scan. That's why O(1) always carries the word 'average'.",
    },
    {
      id: "dsa-hash-mechanics-q2",
      prompt: "Why must a hash map rehash EVERY key when it grows its bucket array?",
      options: [
        "The bucket index is `hash % bucketCount`, so changing the count changes which bucket most keys map to",
        "The hash values themselves become stale and must be recomputed from scratch",
        "Rehashing is optional — it's only done to defragment memory",
        "Only colliding keys need to move; the rest keep their buckets",
      ],
      answer: 0,
      explanation: "The stored hash of a key doesn't change, but the bucket assignment is hash modulo the array length — a new length redistributes essentially all keys, so each one must be re-placed.",
    },
    {
      id: "dsa-hash-mechanics-q3",
      prompt: {
        typescript: "`cache.set({userId: 7}, data)` followed later by `cache.get({userId: 7})` returns `undefined`. Why?",
        python: "`cache[{\"user_id\": 7}] = data` raises `TypeError: unhashable type: \'dict\'`. What is the actual rule here?",
      },
      options: {
        typescript: [
        "Map keys must be strings or numbers, so the object key was silently coerced",
        "Object keys are compared by reference — the two literals are different objects, hence different keys",
        "The two objects hash to different buckets because their property order differs",
        "`set` deep-clones the key, so the original can never match it again",
        ],
        python: [
        "Dict keys must be strings or numbers, so the key has to be `str()`-ified first",
        "Keys must be hashable, which in practice means immutable — use a tuple like `(\"user\", 7)`, or a frozen dataclass",
        "The dict literal is too large to hash; a single-entry dict would be accepted",
        "`cache` must be a `defaultdict` before it can accept non-string keys",
      ],
      },
      answer: 1,
      explanation: {
        typescript: "Map uses identity (SameValueZero) for object keys: two structurally equal literals are distinct keys. When you need value semantics, serialize to a string key (e.g. `JSON.stringify` or a canonical id).",
        python: "A hash map needs a key whose hash never changes, so Python only accepts hashable (in practice, immutable) keys and raises immediately otherwise. Swap the dict for a tuple or a frozen dataclass. Note this is friendlier than the silent-miss behaviour in languages that key by object identity — you find out at the write, not at a mysteriously empty read.",
      },
    },
    ],
  },
  {
    id: "dsa-frequency-maps",
    module: "hash-maps",
    title: "Frequency Counting",
    blurb: "The count-everything-first pattern behind a huge problem family.",
    graphics: [
      {
        id: "count-first",
        title: "Count, then decide",
        caption:
          "Tally every element into a map, then answer with the counts. Anagrams, majorities, and many \"how many of X\" problems fall out of this pattern.",
        src: "/lesson-graphics/dsa/dsa-frequency-maps.png",
      },
    ],
    content: {
      typescript: `You've built this ad hoc every time you tallied results into an object keyed by id. Named and generalized, it's the **frequency map**: one O(n) pass building \`Map<item, count>\`, then answer questions from the counts instead of from the raw data.

## Why it matters

The pattern converts "compare everything with everything" — O(n²) — into two linear passes. Concretely: checking whether two 100,000-character strings are anagrams by cross-searching is ~10 billion comparisons; two counting passes are 200,000 steps.

\`\`\`ts
const counts = new Map<string, number>();
for (const ch of s) {
  counts.set(ch, (counts.get(ch) ?? 0) + 1); // THE idiom: ?? 0 handles first sight
}
\`\`\`

That \`counts.get(k) ?? 0\` line is the whole trick — absent keys read as zero, so first occurrence and hundredth occurrence are the same code path.

## The family

One counting pass, then a cheap second phase:

- **Anagram check** — count string A, then decrement while walking B; any miss or negative means no. (Sorting both strings also works but costs O(n log n); counting is O(n).)
- **First unique character** — count, then re-walk the string and return the first char whose count is 1. The re-walk is what preserves *first* — the map alone doesn't know positions.
- **Most-frequent element** — count, then one scan of \`map.entries()\` tracking the max.
- **"Can A be built from B?"** (ransom note) — count B, decrement for each char of A.

Reading the counts back:

\`\`\`ts
let best = "", bestCount = 0;
for (const [item, count] of counts) {      // insertion order, guaranteed
  if (count > bestCount) { best = item; bestCount = count; }
}
\`\`\`

## Complexity framing

Time O(n): each element touches the map a constant number of O(1)-average operations. Space **O(k) where k = distinct items** — not n. For lowercase English text k ≤ 26 no matter how long the string, so the map is effectively O(1) space. That distinction — distinct values, not input length — is the one to say out loud in an interview.

**Reach for a frequency map when** the question is about *how many times* things occur, or whether two collections are rearrangements of each other, and you're tempted to nest loops.`,
      python: `You've built this ad hoc every time you tallied results into a dict keyed by id. Named and generalized, it's the **frequency map**: one O(n) pass building \`{item: count}\`, then answer questions from the counts instead of from the raw data.

## Why it matters

The pattern converts "compare everything with everything" — O(n²) — into two linear passes. Concretely: checking whether two 100,000-character strings are anagrams by cross-searching is ~10 billion comparisons; two counting passes are 200,000 steps.

\`\`\`python
counts = {}
for ch in s:
    counts[ch] = counts.get(ch, 0) + 1  # THE idiom: get(k, 0) handles first sight
\`\`\`

That \`counts.get(ch, 0)\` is the whole trick — absent keys read as zero, so first occurrence and hundredth occurrence are the same code path.

Python gives you two shorter spellings of the same idea, and both are worth reaching for once you've written the loop by hand:

\`\`\`python
from collections import Counter, defaultdict

counts = Counter(s)                 # the whole loop, in one call
counts.most_common(1)               # and the "most frequent" phase for free

counts = defaultdict(int)           # or: absent keys default themselves
for ch in s:
    counts[ch] += 1
\`\`\`

\`Counter\` is the idiomatic answer in real code. Write the manual version once anyway — an interviewer asking about frequency counting usually wants the mechanism, and \`Counter\` is a \`dict\` subclass doing exactly what you just wrote.

## The family

One counting pass, then a cheap second phase:

- **Anagram check** — count string A, then decrement while walking B; any miss or negative means no. (Sorting both strings also works but costs O(n log n); counting is O(n). \`Counter(a) == Counter(b)\` is the one-liner.)
- **First unique character** — count, then re-walk the string and return the first char whose count is 1. The re-walk is what preserves *first* — the counts alone don't know positions.
- **Most-frequent element** — count, then one scan of \`counts.items()\` tracking the max.
- **"Can A be built from B?"** (ransom note) — count B, decrement for each char of A. (\`Counter(a) <= Counter(b)\` expresses exactly this.)

Reading the counts back:

\`\`\`python
best, best_count = "", 0
for item, count in counts.items():   # insertion order, guaranteed since 3.7
    if count > best_count:
        best, best_count = item, count
\`\`\`

## Complexity framing

Time O(n): each element touches the dict a constant number of O(1)-average operations. Space **O(k) where k = distinct items** — not n. For lowercase English text k ≤ 26 no matter how long the string, so the dict is effectively O(1) space. That distinction — distinct values, not input length — is the one to say out loud in an interview.

**Reach for a frequency map when** the question is about *how many times* things occur, or whether two collections are rearrangements of each other, and you're tempted to nest loops.`,
    },
    exercises: [
    {
      id: "dsa-char-counts",
      title: "Count characters",
      instructions: {
        typescript: `Implement \`charCounts(s)\`: one pass over the string, building \`Map<string, number>\` of character → occurrence count. Use the \`counts.get(ch) ?? 0\` idiom so absent keys start from zero.

Expected output for \`"mississippi"\`: \`s: 4\`, \`i: 4\`, \`p: 2\`, \`m: 1\`, and \`z: 0\` for a character that never appears.`,
        python: `Implement \`char_counts(s)\`: one pass over the string, building a \`dict\` of character → occurrence count. Use the \`counts.get(ch, 0)\` idiom so absent keys start from zero.

Write the loop by hand here rather than calling \`Counter(s)\` — the point is the mechanism. (In real code, reach for \`Counter\`.)

Expected output for \`"mississippi"\`: \`s: 4\`, \`i: 4\`, \`p: 2\`, \`m: 1\`, and \`z: 0\` for a character that never appears.`,
      },
      starterCode: {
        typescript: `function charCounts(s: string): Map<string, number> {
  const counts = new Map<string, number>();
  // TODO: one pass over s, incrementing each character's count.
  // Idiom: counts.set(ch, (counts.get(ch) ?? 0) + 1)
  return counts;
}

// Note: we log specific .get() calls rather than the whole Map —
// a raw Map stringifies poorly in this console.
const counts = charCounts("mississippi");
console.log("s:", counts.get("s") ?? 0); // expect 4
console.log("i:", counts.get("i") ?? 0); // expect 4
console.log("p:", counts.get("p") ?? 0); // expect 2
console.log("m:", counts.get("m") ?? 0); // expect 1
console.log("z:", counts.get("z") ?? 0); // expect 0 (absent key)`,
        python: `def char_counts(s):
    counts = {}
    # TODO: one pass over s, incrementing each character's count.
    # Idiom: counts[ch] = counts.get(ch, 0) + 1
    return counts


counts = char_counts("mississippi")
print("s:", counts.get("s", 0))  # expect 4
print("i:", counts.get("i", 0))  # expect 4
print("p:", counts.get("p", 0))  # expect 2
print("m:", counts.get("m", 0))  # expect 1
print("z:", counts.get("z", 0))  # expect 0 (absent key)
`,
      },
    },
    {
      id: "dsa-anagram-check",
      title: "Anagram check",
      instructions: {
        typescript: `Implement \`isAnagram(a, b)\` with frequency counts:

1. **Length check first** — different lengths can never be anagrams, and it lets the rest assume equal length.
2. Count the characters of \`a\`.
3. Walk \`b\` decrementing; a character that's missing or already at zero means \`false\`.

Sorting both strings and comparing also works, but costs O(n log n) — counting does it in O(n).

Expected output: \`true\`, \`false\`, \`false\`, \`false\`.`,
        python: `Implement \`is_anagram(a, b)\` with frequency counts:

1. **Length check first** — different lengths can never be anagrams, and it lets the rest assume equal length.
2. Count the characters of \`a\`.
3. Walk \`b\` decrementing; a character that's missing or already at zero means \`False\`.

Sorting both strings and comparing also works, but costs O(n log n) — counting does it in O(n). (\`Counter(a) == Counter(b)\` is the production one-liner; build it by hand here.)

Expected output: \`True\`, \`False\`, \`False\`, \`False\`.`,
      },
      starterCode: {
        typescript: `function isAnagram(a: string, b: string): boolean {
  // TODO:
  // 1. Early exit: different lengths can never be anagrams.
  // 2. Build a Map<char, count> from a.
  // 3. Walk b, decrementing counts; a missing char or a count
  //    that would go below zero means not an anagram.
  return false;
}

console.log(isAnagram("listen", "silent")); // expect true
console.log(isAnagram("rat", "car")); // expect false
console.log(isAnagram("aab", "abb")); // expect false (counts differ)
console.log(isAnagram("ab", "abc")); // expect false (length check)`,
        python: `def is_anagram(a, b):
    # TODO:
    # 1. Early exit: different lengths can never be anagrams.
    # 2. Build a dict of char -> count from a.
    # 3. Walk b, decrementing counts; a missing char or a count
    #    that would go below zero means not an anagram.
    return False


print(is_anagram("listen", "silent"))  # expect True
print(is_anagram("rat", "car"))        # expect False
print(is_anagram("aab", "abb"))        # expect False (counts differ)
print(is_anagram("ab", "abc"))         # expect False (length check)
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-frequency-maps-q1",
      prompt: "You build a frequency map over a 1-million-character string of lowercase English letters. What is the space complexity of the map?",
      options: [
        "O(n) — one map entry per character of input, so about a million entries",
        "O(n log n) — the map keeps its keys sorted internally",
        "O(n²) — each entry must remember where its occurrences were",
        "O(k) where k = distinct characters — here at most 26 entries, effectively O(1)",
      ],
      answer: 3,
      explanation: "The map holds one entry per DISTINCT key, not per occurrence — counts are just numbers. With an alphabet capped at 26, the map never grows past 26 entries regardless of input length.",
    },
    {
      id: "dsa-frequency-maps-q2",
      prompt: "Anagram check via sorting both strings vs. via frequency counting — what's the honest comparison?",
      options: {
        typescript: [
        "Both are correct; sorting costs O(n log n) while counting is O(n), so counting wins asymptotically",
        "Sorting is wrong because it loses duplicate characters",
        "Counting is O(n log n) too, because Map operations are logarithmic",
        "Sorting is faster because comparing two sorted strings is O(1)",
        ],
        python: [
        "Both are correct; sorting costs O(n log n) while counting is O(n), so counting wins asymptotically",
        "Sorting is wrong because it loses duplicate characters",
        "Counting is O(n log n) too, because `dict` operations are logarithmic",
        "Sorting is faster because comparing two sorted strings is O(1)",
      ],
      },
      answer: 0,
      explanation: "Sort-and-compare is perfectly correct — it's just dominated by the O(n log n) sorts. Counting does one O(n) pass per string with O(1)-average map operations. (Map get/set are hash lookups, not tree lookups.)",
    },
    {
      id: "dsa-frequency-maps-q3",
      prompt: "For 'first unique character in a string', you build the count map. Why do you then re-walk the STRING instead of iterating the map?",
      options: {
        typescript: [
        "Iterating a Map is O(n²), so the string walk is faster",
        "The string walk preserves position order, which is what 'first' means; the map only knows counts",
        "Map iteration order is random, so results would be nondeterministic",
        "The map may have dropped characters whose count exceeded a threshold",
        ],
        python: [
        "Iterating a `dict` is O(n²), so the string walk is faster",
        "The string walk preserves position order, which is what 'first' means; the counts only know totals",
        "`dict` iteration order is random, so results would be nondeterministic",
        "The dict may have dropped characters whose count exceeded a threshold",
      ],
      },
      answer: 1,
      explanation: {
        typescript: "The map answers 'how many?', not 'where first?'. Re-walking the original string in order and returning the first char with count 1 recovers the positional information. (Map iteration is actually insertion-ordered in JS — first-inserted, which for characters coincides with first occurrence — but relying on the string walk states the intent directly.)",
        python: "The counts answer \'how many?\', not \'where first?\'. Re-walking the original string in order and returning the first char with count 1 recovers the positional information. (A Python `dict` is insertion-ordered since 3.7 — first-inserted, which for characters coincides with first occurrence — but relying on the string walk states the intent directly.)",
      },
    },
    ],
  },
  {
    id: "dsa-seen-before",
    module: "hash-maps",
    title: "Seen-Before Patterns",
    blurb: "Sets and Maps as memory: dedupe, detect, and pair in one pass.",
    graphics: [
      {
        id: "first-seen",
        title: "Remember what you've seen",
        caption:
          "A Set or Map is working memory: first time is new, second time is the signal. Duplicates, two-sum complements, and first-repeat all live here.",
        src: "/lesson-graphics/dsa/dsa-seen-before.png",
      },
    ],
    content: {
      typescript: `Frequency maps count *after* seeing everything. This family asks a question **mid-pass**: *have I seen this before?* A \`Set\` (or a \`Map\`, when you need to remember *where* or *what*) acts as the pass's memory.

## The shape: check, then insert

\`\`\`ts
const seen = new Set<T>();
for (const x of items) {
  if (seen.has(/* what would make x interesting */)) {
    // hit — react
  }
  seen.add(x);
}
\`\`\`

Each element plays two roles: first it's a **query** against everything before it, then it becomes **data** for everything after it. One O(n) pass, O(1)-average per step, O(n) space worst case. The nested-loop version of the same question is O(n²) — at n = 100,000 that's the difference between ~100k steps and ~10 billion.

## The members

- **First repeated item**: \`seen.has(x)\` → return x; else add. The first hit is necessarily the earliest repeat.
- **Dedupe preserving order**: keep x only if it wasn't in the set. (In practice \`[...new Set(arr)]\` does exactly this — Set remembers insertion order.)
- **Two-sum on an UNSORTED array** — the classic. For each \`x\`, ask the map for \`target - x\` **before** inserting \`x\`:

\`\`\`ts
const seen = new Map<number, number>(); // value -> index
for (let i = 0; i < nums.length; i++) {
  const need = target - nums[i];
  if (seen.has(need)) return [seen.get(need)!, i]; // query first...
  seen.set(nums[i], i);                            // ...then become data
}
\`\`\`

Remember two-pointer two-sum from the arrays lesson? That version needed **sorted** input and gave O(n) time with O(1) space. The map version trades O(n) space to work **unsorted** — no O(n log n) sort first, and original indexes survive (sorting scrambles them). That's the tool-selection call: sorted and memory-tight → two pointers; unsorted or you need original indexes → map.

Check-before-insert isn't just style — it's what makes duplicates safe. For \`x + x = target\` with two equal values (say \`[3, 3]\`, target 6): when the second 3 queries, the first 3 is already in the map — a genuine pair of distinct indexes. Insert-first would let a single 3 "find itself".

**Reach for seen-before when** the question pairs or compares each element against *earlier* elements: duplicates, complements, "have we met". If you're writing \`for i { for j < i {...} }\`, the inner loop is usually a hash lookup in disguise.`,
      python: `Frequency maps count *after* seeing everything. This family asks a question **mid-pass**: *have I seen this before?* A \`set\` (or a \`dict\`, when you need to remember *where* or *what*) acts as the pass's memory.

## The shape: check, then insert

\`\`\`python
seen = set()
for x in items:
    if <what would make x interesting> in seen:
        ...  # hit — react
    seen.add(x)
\`\`\`

Each element plays two roles: first it's a **query** against everything before it, then it becomes **data** for everything after it. One O(n) pass, O(1)-average per step, O(n) space worst case. The nested-loop version of the same question is O(n²) — at n = 100,000 that's the difference between ~100k steps and ~10 billion.

## The members

- **First repeated item**: \`if x in seen\` → return x; else add. The first hit is necessarily the earliest repeat.
- **Dedupe preserving order**: keep x only if it wasn't in the set. Careful here — \`list(set(items))\` dedupes but **loses order**, because a Python \`set\` is unordered. The order-preserving one-liner is \`list(dict.fromkeys(items))\`, which leans on \`dict\` keeping insertion order.
- **Two-sum on an UNSORTED list** — the classic. For each \`x\`, ask the dict for \`target - x\` **before** inserting \`x\`:

\`\`\`python
seen = {}  # value -> index
for i, x in enumerate(nums):
    need = target - x
    if need in seen:
        return (seen[need], i)  # query first...
    seen[x] = i                 # ...then become data
\`\`\`

Remember two-pointer two-sum from the arrays lesson? That version needed **sorted** input and gave O(n) time with O(1) space. The dict version trades O(n) space to work **unsorted** — no O(n log n) sort first, and original indexes survive (sorting scrambles them). That's the tool-selection call: sorted and memory-tight → two pointers; unsorted or you need original indexes → dict.

Check-before-insert isn't just style — it's what makes duplicates safe. For \`x + x = target\` with two equal values (say \`[3, 3]\`, target 6): when the second 3 queries, the first 3 is already in the dict — a genuine pair of distinct indexes. Insert-first would let a single 3 "find itself".

**Reach for seen-before when** the question pairs or compares each element against *earlier* elements: duplicates, complements, "have we met". If you're writing a nested loop where the inner one only scans elements before \`i\`, that inner loop is usually a hash lookup in disguise.`,
    },
    exercises: [
    {
      id: "dsa-first-repeat",
      title: "First repeated value",
      instructions: {
        typescript: `Implement \`firstRepeat(items)\`: one pass with a \`Set<string>\`. For each item, if the set already contains it, return it immediately — that's the earliest repeat. Otherwise add it and continue. Return \`null\` if everything is unique.

Expected output: \`b\`, \`null\`, \`dup\`.`,
        python: `Implement \`first_repeat(items)\`: one pass with a \`set\`. For each item, if the set already contains it, return it immediately — that's the earliest repeat. Otherwise add it and continue. Return \`None\` if everything is unique.

Expected output: \`b\`, \`None\`, \`dup\`.`,
      },
      starterCode: {
        typescript: `function firstRepeat(items: string[]): string | null {
  // TODO: one pass with a Set<string>.
  // For each item: if the set already has it, return it;
  // otherwise add it and keep going.
  return null;
}

console.log(firstRepeat(["a", "b", "c", "b", "a"])); // expect "b"
console.log(firstRepeat(["x", "y", "z"])); // expect null
console.log(firstRepeat(["dup", "dup"])); // expect "dup"`,
        python: `def first_repeat(items):
    # TODO: one pass with a set.
    # For each item: if the set already has it, return it;
    # otherwise add it and keep going.
    return None


print(first_repeat(["a", "b", "c", "b", "a"]))  # expect b
print(first_repeat(["x", "y", "z"]))            # expect None
print(first_repeat(["dup", "dup"]))             # expect dup
`,
      },
    },
    {
      id: "dsa-two-sum-map",
      title: "Two-sum, unsorted, one pass",
      instructions: {
        typescript: `Implement \`twoSum(nums, target)\` returning a pair of **indexes** (earlier index first), or \`null\`. Use the check-then-insert pattern with a \`Map<number, number>\` of value → index: for each \`nums[i]\`, first ask the map for \`target - nums[i]\`; only then insert \`nums[i]\`.

Checking before inserting is what makes \`x + x = target\` with duplicate values work: for \`[3, 5, 3]\` with target 6, the second 3 finds the first 3 already in the map — two distinct indexes. If you inserted first, a lone 3 would match itself.

Expected output: \`[0,1]\`, \`[0,2]\`, \`null\`.`,
        python: `Implement \`two_sum(nums, target)\` returning a pair of **indexes** as a tuple (earlier index first), or \`None\`. Use the check-then-insert pattern with a \`dict\` of value → index: for each \`nums[i]\`, first ask the dict for \`target - nums[i]\`; only then insert \`nums[i]\`.

Checking before inserting is what makes \`x + x = target\` with duplicate values work: for \`[3, 5, 3]\` with target 6, the second 3 finds the first 3 already in the dict — two distinct indexes. If you inserted first, a lone 3 would match itself.

\`enumerate(nums)\` gives you index and value together, which is the natural way to write this loop.

Expected output: \`(0, 1)\`, \`(0, 2)\`, \`None\`.`,
      },
      starterCode: {
        typescript: `function twoSum(nums: number[], target: number): [number, number] | null {
  // TODO: one pass with a Map<number, number> of value -> index.
  // For each nums[i]:
  //   1. CHECK: if the map has target - nums[i], return [that index, i].
  //   2. INSERT: map.set(nums[i], i).
  // Checking BEFORE inserting is what makes duplicates work:
  // for [3, 3] with target 6, the second 3 finds the first.
  return null;
}

console.log(twoSum([2, 7, 11, 15], 9)); // expect [0, 1]
console.log(twoSum([3, 5, 3], 6)); // expect [0, 2] (duplicate values)
console.log(twoSum([1, 2, 4], 100)); // expect null`,
        python: `def two_sum(nums, target):
    # TODO: one pass with a dict of value -> index.
    # For each i, x in enumerate(nums):
    #   1. CHECK: if target - x is in the dict, return (that index, i).
    #   2. INSERT: seen[x] = i.
    # Checking BEFORE inserting is what makes duplicates work:
    # for [3, 3] with target 6, the second 3 finds the first.
    return None


print(two_sum([2, 7, 11, 15], 9))  # expect (0, 1)
print(two_sum([3, 5, 3], 6))       # expect (0, 2) (duplicate values)
print(two_sum([1, 2, 4], 100))     # expect None
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-seen-before-q1",
      prompt: "Two-sum with two pointers vs. two-sum with a Map — when is the Map version the right call?",
      options: {
        typescript: [
        "Never — two pointers is strictly better since it uses O(1) space",
        "When the array is already sorted, since the map can then skip half the elements",
        "When the array is unsorted or you need original indexes — the map works in O(n) without sorting, at the cost of O(n) space",
        "When the numbers are large, because two pointers only works on small integers",
        ],
        python: [
        "Never — two pointers is strictly better since it uses O(1) space",
        "When the list is already sorted, since the dict can then skip half the elements",
        "When the list is unsorted or you need original indexes — the dict works in O(n) without sorting, at the cost of O(n) space",
        "When the numbers are large, because two pointers only works on small integers",
      ],
      },
      answer: 2,
      explanation: "Two pointers requires sorted input; on unsorted data you'd pay O(n log n) to sort and lose the original indexes. The map version runs one O(n) pass on the array as-is — its price is O(n) extra space.",
    },
    {
      id: "dsa-seen-before-q2",
      prompt: "In one-pass two-sum, why must each element be checked against the map BEFORE being inserted?",
      options: [
        "Inserting first would overflow the map's capacity on large inputs",
        "The order doesn't matter — check-first is just a readability convention",
        "Checking after inserting makes each lookup O(n) instead of O(1)",
        "Insert-first would let an element match itself when `x + x = target`; check-first means any hit is a genuinely earlier, distinct index",
      ],
      answer: 3,
      explanation: "If x is inserted before the query and target − x equals x, the lookup finds x's own entry — a false pair using one index twice. Query-then-insert guarantees the found partner is a strictly earlier element, which also makes duplicate values ([3, 3], target 6) work correctly.",
    },
    {
      id: "dsa-seen-before-q3",
      prompt: {
        typescript: "`for (i) { for (j < i) { if (a[j] === a[i]) ... } }` over 100,000 items is too slow. What's the standard fix and the resulting complexity?",
        python: "A nested loop where the inner one scans `a[j]` for every `j < i`, looking for `a[j] == a[i]`, is too slow over 100,000 items. What is the standard fix and the resulting complexity?",
      },
      options: {
        typescript: [
        "Replace the inner loop with a Set lookup — O(n) time, O(n) space instead of O(n²) time",
        "Sort the array first and scan for neighbors — O(n) total",
        "Break out of the inner loop early — halves the work, changing the complexity class",
        "Memoize the outer loop with an array of arrays — O(n log n) time",
        ],
        python: [
        "Replace the inner loop with a `set` membership check — O(n) time, O(n) space instead of O(n²) time",
        "Sort the list first and scan for neighbors — O(n) total",
        "Break out of the inner loop early — halves the work, changing the complexity class",
        "Memoize the outer loop with a list of lists — O(n log n) time",
      ],
      },
      answer: 0,
      explanation: "The inner loop asks 'did an earlier element equal a[i]?' — exactly a set-membership query, O(1) average. That turns ~5 billion comparisons into ~100k lookups. Sorting also detects duplicates but costs O(n log n) and destroys original order/indexes; early break doesn't change the worst case.",
    },
    ],
  },
];
