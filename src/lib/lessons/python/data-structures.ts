import type { Lesson } from "../types";

export const dataStructuresLessons: Lesson[] = [
  {
    id: "lists-and-tuples",
    module: "data-structures",
    title: "Lists, Tuples, and Slicing",
    blurb: "ordered collections, slicing, and unpacking.",
    content: `A Python \`list\` is your JS array: a growable, ordered, heterogeneous sequence. The literal is \`[]\`, indexing is \`lst[0]\`, and \`len(lst)\` gives the length (there is no \`.length\` property).

\`\`\`python
nums = [10, 20, 30, 40, 50]
print(nums[0])    # 10
print(nums[-1])   # 50  -> negative indices count from the end
print(nums[-2])   # 40
\`\`\`

**Slicing** is the big idea JS lacks. \`lst[start:stop:step]\` returns a *new* list; \`stop\` is exclusive. Omit any part to mean "the end of that side".

\`\`\`python
nums = [10, 20, 30, 40, 50]
print(nums[1:3])    # [20, 30]
print(nums[:2])     # [10, 20]
print(nums[2:])     # [30, 40, 50]
print(nums[::2])    # [10, 30, 50]   every other
print(nums[::-1])   # [50, 40, 30, 20, 10]   reversed
\`\`\`

**Mutating methods:** \`append(x)\` adds one item; \`extend(iterable)\` adds many (like JS spread into push); \`insert(i, x)\` inserts at an index; \`pop()\` removes and returns the last item (or \`pop(i)\` at an index).

\`\`\`python
xs = [1, 2]
xs.append(3)        # [1, 2, 3]
xs.extend([4, 5])   # [1, 2, 3, 4, 5]
xs.insert(0, 0)     # [0, 1, 2, 3, 4, 5]
last = xs.pop()     # last == 5
\`\`\`

**Sorting:** \`lst.sort()\` mutates in place and returns \`None\`; \`sorted(lst)\` returns a new list. Both take a \`key=\` function (not a comparator) and \`reverse=True\`.

\`\`\`python
words = ["bb", "a", "ccc"]
print(sorted(words, key=len))   # ['a', 'bb', 'ccc']
\`\`\`

**Tuples** are immutable lists: \`point = (1, 2)\`. Their superpower is **unpacking**, Python's destructuring:

\`\`\`python
x, y = (1, 2)
a, b = 1, 2
a, b = b, a            # swap, no temp -> a=2, b=1
first, *rest = [1, 2, 3, 4]   # first=1, rest=[2,3,4]
\`\`\`

\`list(iterable)\` materializes any iterable into a list. Use tuples for fixed-shape records, lists for collections you grow.`,
    exercises: [
    {
      id: "slice-list",
      title: "Slice and dice",
      instructions: `Given the list \`nums\`, use **slicing only** (no loops, no \`reversed()\`) to produce three new lists:

- \`reversed_nums\`: the list in reverse order
- \`first_three\`: the first three items
- \`every_other\`: every other item starting from the first

Return them as a tuple \`(reversed_nums, first_three, every_other)\`.

For \`[1, 2, 3, 4, 5, 6]\` the expected output is \`([6, 5, 4, 3, 2, 1], [1, 2, 3], [1, 3, 5])\`.`,
      starterCode: `def slice_and_dice(nums):
    # TODO: use slicing to build each list
    reversed_nums = []
    first_three = []
    every_other = []
    return (reversed_nums, first_three, every_other)


print(slice_and_dice([1, 2, 3, 4, 5, 6]))
`,
    },
    {
      id: "sort-by-key",
      title: "Sort by key",
      instructions: `Return a **new** list of the given words sorted from shortest to longest using \`sorted()\` with a \`key=\` function. Do not mutate the input.

For \`["banana", "fig", "kiwi", "a"]\` the expected output is \`['a', 'fig', 'kiwi', 'banana']\`.`,
      starterCode: `def sort_by_length(words):
    # TODO: return a new list sorted by word length using sorted(..., key=...)
    return words


print(sort_by_length(["banana", "fig", "kiwi", "a"]))
`,
    },
    {
      id: "tuple-swap",
      title: "Unpack and swap",
      instructions: `Use **tuple unpacking** to swap the values of \`a\` and \`b\` without a temporary variable, then return them as a tuple \`(a, b)\`.

For \`swap(1, 2)\` the expected output is \`(2, 1)\`.`,
      starterCode: `def swap(a, b):
    # TODO: swap a and b using tuple unpacking (no temp variable)
    return (a, b)


print(swap(1, 2))
`,
    },
    ],
    quiz: [
      {
        id: "lists-and-tuples-q1",
        prompt: "What does `nums[::-1]` produce?",
        options: [
          "A new reversed list — a step of -1 walks backwards",
          "The last element",
          "The list with its last element removed",
          "An error — a negative step needs explicit start and stop",
        ],
        answer: 0,
        explanation: "`lst[start:stop:step]` with any part omitted means \"the end of that side.\" `nums[::2]` takes every other element, and slicing always returns a *new* list.",
      },
      {
        id: "lists-and-tuples-q2",
        prompt: "What does `lst.sort()` return?",
        options: [
          "An iterator over the sorted elements",
          "`None` — it mutates in place; `sorted(lst)` is the one that returns a new list",
          "The sorted list, and also mutates in place",
          "A new sorted list, leaving the original alone",
        ],
        answer: 1,
        explanation: "This trips people up in chained expressions. Both take a `key=` function — note that's a key extractor, not a comparator — and `reverse=True`.",
      },
      {
        id: "lists-and-tuples-q3",
        prompt: "What does `first, *rest = [1, 2, 3, 4]` bind?",
        options: [
          "`first = [1]` and `rest = [2, 3, 4]`",
          "A SyntaxError — starred targets only work in function signatures",
          "`first = 1` and `rest = [2, 3, 4]` — the star greedily collects the leftovers into a list",
          "`first = 1` and `rest = (2, 3, 4)` as a tuple",
        ],
        answer: 2,
        explanation: "It's Python's spread-on-the-left, and there can be at most one starred target. `*init, last = [10, 20, 30]` and `head, *mid, tail = [1, 2, 3, 4]` work the same way.",
      },
    ],
  },
  {
    id: "dicts",
    module: "data-structures",
    title: "Dictionaries",
    blurb: "key-value maps, get/setdefault, and iteration.",
    content: `A \`dict\` is Python's hash map. Unlike a JS object, it is a *real* map (any hashable key, not just strings) and it is the everyday structure you reach for, like a JS \`Map\` or Java \`HashMap\`.

\`\`\`python
user = {"name": "Ada", "age": 36}
print(user["name"])   # Ada
user["age"] = 37      # set/overwrite
\`\`\`

**Missing keys raise \`KeyError\`** on \`d[key]\` access. Use \`.get(key, default)\` when a key may be absent (the default is \`None\` if omitted):

\`\`\`python
print(user.get("email"))            # None  (no exception)
print(user.get("email", "n/a"))     # n/a
\`\`\`

**\`setdefault(key, default)\`** returns the existing value, or inserts and returns the default if the key is missing. It is the idiomatic way to build up collections:

\`\`\`python
groups = {}
groups.setdefault("a", []).append(1)
groups.setdefault("a", []).append(2)   # {'a': [1, 2]}
\`\`\`

**Iteration.** Iterating a dict yields its **keys**. Prefer \`.items()\` to get key/value pairs at once (this unpacks, just like JS \`for (const [k, v] of map)\`):

\`\`\`python
for key, value in user.items():
    print(key, "=", value)

for k in user.keys():     # keys (same as iterating user directly)
    ...
for v in user.values():   # values
    ...
\`\`\`

**Membership** uses \`in\`, and it tests **keys**: \`"name" in user\` is \`True\`.

**Merging.** \`a | b\` returns a new merged dict (right side wins on conflicts); \`a.update(b)\` mutates \`a\` in place:

\`\`\`python
defaults = {"theme": "light", "size": 12}
merged = defaults | {"size": 14}    # {'theme': 'light', 'size': 14}
defaults.update({"size": 14})        # mutates defaults
\`\`\`

Dicts nest freely: \`config["db"]["host"]\`. Since Python 3.7, insertion order is preserved.`,
    exercises: [
    {
      id: "word-count",
      title: "Word frequency",
      instructions: `Count how many times each word appears in the list and return the counts as a dict. Use \`.get()\` or \`.setdefault()\` (do not import \`Counter\`).

For \`["a", "b", "a", "c", "b", "a"]\` the expected output is \`{'a': 3, 'b': 2, 'c': 1}\`.`,
      starterCode: `def word_count(words):
    counts = {}
    # TODO: tally each word using counts.get(word, 0) or setdefault
    return counts


print(word_count(["a", "b", "a", "c", "b", "a"]))
`,
    },
    {
      id: "iterate-items",
      title: "Iterate items",
      instructions: `Iterate the dict with \`.items()\` and return a list of strings, one per pair, formatted as \`"key=value"\`.

For \`{"name": "Ada", "age": 36}\` the expected output is \`['name=Ada', 'age=36']\`.`,
      starterCode: `def format_items(d):
    lines = []
    # TODO: loop over d.items() and append "key=value" strings
    return lines


print(format_items({"name": "Ada", "age": 36}))
`,
    },
    {
      id: "merge-dicts",
      title: "Merge two dicts",
      instructions: `Return a tuple \`(merged_with_operator, merged_with_update)\`:

- \`merged_with_operator\`: merge \`a\` and \`b\` using the \`|\` operator (\`b\` wins on conflicts).
- \`merged_with_update\`: start from a copy of \`a\` (use \`dict(a)\` or \`a.copy()\`), then apply \`.update(b)\`.

Both results should be equal. For \`a={"x": 1, "y": 2}\`, \`b={"y": 9, "z": 3}\` the expected output is \`({'x': 1, 'y': 9, 'z': 3}, {'x': 1, 'y': 9, 'z': 3})\`.`,
      starterCode: `def merge(a, b):
    # TODO: merge with | for the first result
    merged_with_operator = {}
    # TODO: copy a, then .update(b) for the second result
    merged_with_update = {}
    return (merged_with_operator, merged_with_update)


print(merge({"x": 1, "y": 2}, {"y": 9, "z": 3}))
`,
    },
    ],
    quiz: [
      {
        id: "dicts-q1",
        prompt: "What happens on `user[\"email\"]` when the key is absent?",
        options: [
          "A `KeyError` is raised — use `.get(key, default)` when a key may be missing",
          "It returns `None`",
          "It returns `None` and inserts the key",
          "It returns an empty string",
        ],
        answer: 0,
        explanation: "`d[key]` raises; `.get(key)` returns `None` and `.get(key, default)` returns your fallback. That difference is why the EAFP lesson uses dict lookup as its example.",
      },
      {
        id: "dicts-q2",
        prompt: "Iterating a dict directly yields what?",
        options: [
          "Nothing; dicts aren't iterable without `.items()`",
          "Its keys — use `.items()` to get key/value pairs at once",
          "Its values",
          "`(key, value)` tuples",
        ],
        answer: 1,
        explanation: "`for key, value in user.items()` unpacks each pair, just like JS's `for (const [k, v] of map)`. Membership with `in` also tests keys: `\"name\" in user`.",
      },
      {
        id: "dicts-q3",
        prompt: "What does `groups.setdefault(\"a\", []).append(1)` do?",
        options: [
          "Appends to a temporary list that's discarded",
          "Raises if `\"a\"` already exists",
          "Returns the existing list for `\"a\"`, or inserts and returns `[]` first — then appends to it either way",
          "Replaces the value at `\"a\"` with `[1]`",
        ],
        answer: 2,
        explanation: "It's the idiomatic way to build a dict of lists without an `if key in groups` guard — though `collections.defaultdict(list)` is cleaner still when every key needs the same factory.",
      },
    ],
  },
  {
    id: "sets",
    module: "data-structures",
    title: "Sets",
    blurb: "uniqueness and fast membership.",
    content: `A \`set\` is an unordered collection of unique, hashable values with O(1) membership testing, like a JS \`Set\`. The literal uses braces: \`{1, 2, 3}\`. Note the gotcha: \`{}\` is an empty **dict**, not a set, so use \`set()\` for an empty set.

\`\`\`python
colors = {"red", "green", "red"}
print(colors)          # {'red', 'green'}  -> duplicate dropped
print("red" in colors) # True, O(1)
\`\`\`

**Deduplication** is the most common use: wrap any iterable in \`set()\`. To get a list back, wrap that in \`list()\` (order is not guaranteed):

\`\`\`python
nums = [1, 1, 2, 3, 3, 3]
unique = set(nums)        # {1, 2, 3}
unique_list = list(set(nums))
\`\`\`

**Set algebra** uses operators (or named methods). These return new sets:

\`\`\`python
a = {1, 2, 3}
b = {2, 3, 4}
print(a | b)   # union        -> {1, 2, 3, 4}
print(a & b)   # intersection -> {2, 3}
print(a - b)   # difference   -> {1}
print(a ^ b)   # symmetric diff -> {1, 4}
\`\`\`

Unlike JS, where \`Set\` operations require manual loops, Python gives you these as first-class operators. Equivalent methods exist (\`a.union(b)\`, \`a.intersection(b)\`, \`a.difference(b)\`) and accept any iterable, not just another set.

Mutating methods: \`add(x)\`, \`discard(x)\` (no error if absent), \`remove(x)\` (raises if absent).

A **\`frozenset\`** is the immutable, hashable cousin of a set. Because it is hashable, you can use it as a dict key or put it inside another set, things a normal \`set\` cannot do:

\`\`\`python
seen = {frozenset({1, 2}), frozenset({3, 4})}
\`\`\``,
    exercises: [
    {
      id: "dedup-list",
      title: "Deduplicate",
      instructions: `Remove duplicates from the list using a set and return the unique values as a **sorted** list (sort so the output is deterministic).

For \`[3, 1, 2, 3, 1]\` the expected output is \`[1, 2, 3]\`.`,
      starterCode: `def dedup(items):
    # TODO: build a set to drop duplicates, then return a sorted list
    return items


print(dedup([3, 1, 2, 3, 1]))
`,
    },
    {
      id: "common-elements",
      title: "Common elements",
      instructions: `Find the elements common to both lists using set intersection (\`&\`). Return them as a **sorted** list.

For \`[1, 2, 3, 4]\` and \`[2, 4, 6]\` the expected output is \`[2, 4]\`.`,
      starterCode: `def common(a, b):
    # TODO: convert to sets, intersect with &, return a sorted list
    return []


print(common([1, 2, 3, 4], [2, 4, 6]))
`,
    },
    {
      id: "set-algebra",
      title: "Set algebra",
      instructions: `Given two sets, compute their union, intersection, and difference (\`a - b\`). Return them as a tuple of three **sorted** lists: \`(union, intersection, difference)\`.

For \`a={1, 2, 3}\`, \`b={2, 3, 4}\` the expected output is \`([1, 2, 3, 4], [2, 3], [1])\`.`,
      starterCode: `def set_algebra(a, b):
    # TODO: compute a | b, a & b, and a - b; return them as sorted lists
    union = []
    intersection = []
    difference = []
    return (union, intersection, difference)


print(set_algebra({1, 2, 3}, {2, 3, 4}))
`,
    },
    ],
    quiz: [
      {
        id: "sets-q1",
        prompt: "What is `{}` in Python?",
        options: [
          "An empty dict — use `set()` for an empty set",
          "An empty set",
          "An empty frozenset",
          "A syntax error; you must write `dict()` or `set()`",
        ],
        answer: 0,
        explanation: "The braces literal is claimed by dicts, so there's no empty-set literal. `{1, 2, 3}` is a set because it has bare elements rather than `key: value` pairs.",
      },
      {
        id: "sets-q2",
        prompt: "What does `a - b` do for two sets?",
        options: [
          "It's not defined; you need `a.difference(b)`",
          "Difference — the elements in `a` that aren't in `b`",
          "Symmetric difference — elements in exactly one of them",
          "Intersection — elements in both",
        ],
        answer: 1,
        explanation: "`|` is union, `&` is intersection, `-` is difference, `^` is symmetric difference. Unlike JS, where Set operations mean manual loops, Python gives you these as first-class operators — and the named methods accept any iterable, not just another set.",
      },
      {
        id: "sets-q3",
        prompt: "What can a `frozenset` do that a `set` cannot?",
        options: [
          "Preserve insertion order",
          "Support the set-algebra operators",
          "Be used as a dict key or placed inside another set, because it's hashable",
          "Hold unhashable elements like lists",
        ],
        answer: 2,
        explanation: "Mutability and hashability are in tension: a normal `set` can change, so it can't have a stable hash. The frozen version is immutable and therefore hashable.",
      },
    ],
  },
  {
    id: "comprehensions",
    module: "data-structures",
    title: "Comprehensions",
    blurb: "list, dict, and set comprehensions.",
    content: `Comprehensions are Python's signature idiom for building a collection from an iterable in one expression. They replace the \`map\`/\`filter\` chains you would write in JS, and they are considered the *Pythonic* default over an explicit loop with \`.append()\`.

**List comprehension:** \`[expr for item in iterable]\`.

\`\`\`python
squares = [n * n for n in range(5)]   # [0, 1, 4, 9, 16]
\`\`\`

Add a trailing \`if\` to **filter** (this is the \`filter\` half):

\`\`\`python
evens = [n for n in range(10) if n % 2 == 0]   # [0, 2, 4, 6, 8]
\`\`\`

Compare to JS: \`range(10).filter(n => n % 2 === 0).map(...)\`. The comprehension does both at once: filter with \`if\`, transform with the leading expression. You can use a ternary in the expression position too (that is mapping, not filtering): \`["even" if n % 2 == 0 else "odd" for n in nums]\`.

**Dict comprehension:** same shape, but produce \`key: value\` pairs.

\`\`\`python
words = ["hi", "bye"]
lengths = {w: len(w) for w in words}   # {'hi': 2, 'bye': 3}
\`\`\`

**Set comprehension:** braces with a single expression (no colon).

\`\`\`python
first_letters = {w[0] for w in words}   # {'h', 'b'}
\`\`\`

**Nesting** mirrors nested loops, read **left to right, outer to inner**:

\`\`\`python
matrix = [[1, 2], [3, 4]]
flat = [x for row in matrix for x in row]   # [1, 2, 3, 4]
\`\`\`

**Generator expressions** use parentheses and are lazy, computing items on demand instead of building the whole list. They are ideal for feeding aggregations without an intermediate list:

\`\`\`python
total = sum(n * n for n in range(1000))   # no list materialized
\`\`\`

Keep comprehensions short. If one needs multiple conditions and nesting and a ternary, a plain loop is more readable, and readability wins.`,
    exercises: [
    {
      id: "filter-comp",
      title: "Filtered list comprehension",
      instructions: `Using a **single list comprehension** with an \`if\` filter, return the squares of only the even numbers in \`range(n)\` (0 up to but not including \`n\`).

For \`n=10\` the expected output is \`[0, 4, 16, 36, 64]\`.`,
      starterCode: `def even_squares(n):
    # TODO: return [square of x for x in range(n) if x is even] as one comprehension
    return []


print(even_squares(10))
`,
    },
    {
      id: "dict-comp",
      title: "Dict comprehension",
      instructions: `Using a **dict comprehension**, build a dict mapping each word to its length.

For \`["hi", "bye", "yo"]\` the expected output is \`{'hi': 2, 'bye': 3, 'yo': 2}\`.`,
      starterCode: `def word_lengths(words):
    # TODO: return {word: len(word) for word in words}
    return {}


print(word_lengths(["hi", "bye", "yo"]))
`,
    },
    {
      id: "flatten-comp",
      title: "Flatten with a nested comprehension",
      instructions: `Using a **single nested list comprehension** (no \`sum()\`, no \`itertools\`), flatten a list of lists into one flat list, preserving order.

For \`[[1, 2], [3, 4], [5]]\` the expected output is \`[1, 2, 3, 4, 5]\`.`,
      starterCode: `def flatten(rows):
    # TODO: return [x for row in rows for x in row]
    return []


print(flatten([[1, 2], [3, 4], [5]]))
`,
    },
    ],
    quiz: [
      {
        id: "comprehensions-q1",
        prompt: "Where does the filter go in `[n for n in range(10) if n % 2 == 0]`?",
        options: [
          "The `if` is a ternary and doesn't filter at all",
          "You can't filter and transform in one comprehension",
          "The trailing `if` filters; the leading expression transforms — one comprehension does both",
          "The leading expression filters; the `if` transforms",
        ],
        answer: 2,
        explanation: "Compare `range(10).filter(...).map(...)` in JS. A ternary in the *expression* position is mapping, not filtering: `[\"even\" if n % 2 == 0 else \"odd\" for n in nums]`.",
      },
      {
        id: "comprehensions-q2",
        prompt: "How do you read the nesting in `[x for row in matrix for x in row]`?",
        options: [
          "Right to left, inner to outer",
          "The rightmost clause is always the outer loop",
          "Nested comprehensions can't be flattened this way",
          "Left to right, outer to inner — same order as the nested `for` loops would be written",
        ],
        answer: 3,
        explanation: "The clauses mirror the loops in the order you'd write them, which is why it flattens `[[1, 2], [3, 4]]` to `[1, 2, 3, 4]`. Keep them short — once you need multiple conditions plus nesting plus a ternary, a plain loop reads better.",
      },
      {
        id: "comprehensions-q3",
        prompt: "What's the difference between `sum([n * n for n in range(1000)])` and `sum(n * n for n in range(1000))`?",
        options: [
          "The second is a generator expression — lazy, with no intermediate list materialized",
          "The second is a set comprehension, so duplicates are dropped",
          "They're identical; the brackets are optional",
          "The second is slower because it can't be optimized",
        ],
        answer: 0,
        explanation: "Parentheses make it lazy, computing items on demand. That's ideal for feeding aggregations like `sum`, `any`, or `max`, where the intermediate list is pure waste.",
      },
    ],
  },
];
