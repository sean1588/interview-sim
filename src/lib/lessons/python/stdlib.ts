import type { Lesson } from "../types";

export const stdlibLessons: Lesson[] = [
  {
    id: "collections",
    module: "stdlib",
    title: "collections: Counter, defaultdict, deque",
    blurb: "the containers you reach for daily.",
    content: `The \`collections\` module gives you specialized containers so you stop hand-rolling dict-of-lists and frequency dicts. These are the daily drivers.

## Counter — frequency counting done

Instead of the classic \`freq[x] = freq.get(x, 0) + 1\` loop, hand \`Counter\` an iterable:

\`\`\`python
from collections import Counter

votes = ["a", "b", "a", "c", "a", "b"]
c = Counter(votes)
print(c)                 # Counter({'a': 3, 'b': 2, 'c': 1})
print(c["a"])            # 3
print(c["missing"])      # 0  (no KeyError, unlike a plain dict)
print(c.most_common(2))  # [('a', 3), ('b', 2)]
\`\`\`

\`most_common(k)\` returns the top \`k\` as \`(item, count)\` pairs, already sorted descending. Counters also add and subtract like multisets: \`Counter(a) + Counter(b)\`.

## defaultdict — no more \`setdefault\`

A \`defaultdict\` calls a factory to produce a value for missing keys. This is the Pythonic way to build a dict-of-lists:

\`\`\`python
from collections import defaultdict

groups = defaultdict(list)
for word in ["apple", "avocado", "banana"]:
    groups[word[0]].append(word)   # no 'if key in groups' guard
print(dict(groups))                # {'a': ['apple', 'avocado'], 'b': ['banana']}
\`\`\`

The factory is any zero-arg callable: \`int\` (counters defaulting to 0), \`list\`, \`set\`, even \`lambda: 0\`.

## deque — fast appends/pops at both ends

A plain \`list\` is O(n) for \`pop(0)\`. A \`deque\` (double-ended queue) is O(1) at both ends — use it for queues and sliding windows:

\`\`\`python
from collections import deque

q = deque([1, 2, 3])
q.append(4)        # add right
q.appendleft(0)    # add left
print(q.popleft()) # 0  (FIFO front)
print(q.pop())     # 4  (LIFO back)
\`\`\`

## namedtuple — a tiny immutable record

When you want a lightweight struct without a full class:

\`\`\`python
from collections import namedtuple

Point = namedtuple("Point", ["x", "y"])
p = Point(1, 2)
print(p.x, p.y)   # 1 2  (also unpacks like a tuple)
\`\`\`

Reach for these before writing the manual version — they are faster and read cleaner.`,
    exercises: [
    {
      id: "counter-top",
      title: "Most common with Counter",
      instructions: `Build a \`Counter\` from the \`words\` list and print the **2** most common items using \`most_common()\`.

Expected output is a list of \`(word, count)\` pairs sorted by count, e.g. \`[('the', 3), ('fox', 2)]\`.`,
      starterCode: `from collections import Counter

words = ["the", "fox", "the", "dog", "the", "fox"]

def top_words(words, k):
    # TODO: build a Counter from words and return the k most common (item, count) pairs
    pass

print(top_words(words, 2))
`,
    },
    {
      id: "defaultdict-group",
      title: "Group with defaultdict",
      instructions: `Use \`defaultdict(list)\` to group the \`words\` by their first letter. Return a regular dict mapping each first letter to the list of words that start with it.

Expected output: \`{'a': ['apple', 'avocado'], 'b': ['banana'], 'c': ['cherry']}\`.`,
      starterCode: `from collections import defaultdict

words = ["apple", "avocado", "banana", "cherry"]

def group_by_first_letter(words):
    groups = defaultdict(list)
    # TODO: append each word to groups[<its first letter>]
    return dict(groups)

print(group_by_first_letter(words))
`,
    },
    {
      id: "deque-queue",
      title: "A queue with deque",
      instructions: `Treat a \`deque\` as a FIFO queue. \`append()\` each task onto the queue, then drain it with \`popleft()\`, returning the tasks in the order they were processed.

Expected output: \`['email', 'build', 'deploy']\` (same order they went in).`,
      starterCode: `from collections import deque

def process(tasks):
    queue = deque()
    for task in tasks:
        queue.append(task)
    processed = []
    # TODO: while the queue is not empty, popleft() and append to processed
    return processed

print(process(["email", "build", "deploy"]))
`,
    },
    ],
    quiz: [
      {
        id: "collections-q1",
        prompt: "What does `Counter(votes)[\"missing\"]` return for a key that was never seen?",
        options: [
          "`0` — unlike a plain dict, a Counter has no KeyError for missing keys",
          "`None`",
          "A KeyError",
          "An empty Counter",
        ],
        answer: 0,
        explanation: "It replaces the classic `freq[x] = freq.get(x, 0) + 1` loop entirely. `most_common(k)` returns the top k as `(item, count)` pairs already sorted, and Counters add and subtract like multisets.",
      },
      {
        id: "collections-q2",
        prompt: "What does `defaultdict(list)` take as its argument?",
        options: [
          "A function that takes the missing key and returns a value",
          "Any zero-arg callable — the factory that produces a value for a missing key",
          "A default value that's copied for each missing key",
          "The type of the dictionary's values, for type checking",
        ],
        answer: 1,
        explanation: "`list`, `set`, `int` (for counters defaulting to 0), or even `lambda: 0` all work — note the factory receives no arguments, so it can't depend on the key. It removes the `if key in groups` guard when building a dict of lists.",
      },
      {
        id: "collections-q3",
        prompt: "Why use a `deque` rather than a list for a queue?",
        options: [
          "A deque preserves insertion order and a list doesn't",
          "A deque can hold more elements than a list",
          "`list.pop(0)` is O(n); `deque.popleft()` is O(1) — a deque is fast at both ends",
          "A deque is thread-safe while a list isn't",
        ],
        answer: 2,
        explanation: "Removing from the front of a list shifts every remaining element. A deque is doubly-ended, so `append`/`appendleft` and `pop`/`popleft` are all constant time — right for queues and sliding windows.",
      },
    ],
  },
  {
    id: "itertools-functools",
    module: "stdlib",
    title: "itertools and functools",
    blurb: "composable iteration and function tools.",
    content: `\`itertools\` and \`functools\` are the standard library's answer to lazy, composable iteration and higher-order function plumbing. Think of them as the batteries behind list/array helpers you know from JS, but lazy by default.

## itertools — lazy iterators you compose

Everything here returns an **iterator** (lazy), not a list. Wrap in \`list()\` to materialize.

\`\`\`python
import itertools

# chain: concatenate iterables without building intermediates
print(list(itertools.chain([1, 2], [3, 4])))   # [1, 2, 3, 4]

# combinations: all r-length subsets, order-independent
print(list(itertools.combinations("ABC", 2)))   # [('A','B'), ('A','C'), ('B','C')]

# count + islice: an infinite counter, sliced to a finite window
print(list(itertools.islice(itertools.count(10, 2), 3)))  # [10, 12, 14]
\`\`\`

\`count(start, step)\` is an infinite stream — \`islice(it, n)\` takes the first \`n\` without ever building the whole thing. That laziness is the whole point: you compose infinite/large sources and only pay for what you consume.

## groupby — collapse consecutive runs

The gotcha that bites everyone: \`groupby\` groups **consecutive** equal keys, not all equal keys. Sort first if you want global grouping.

\`\`\`python
import itertools

data = sorted(["apple", "avocado", "banana"], key=len)
for key, group in itertools.groupby(data, key=len):
    print(key, list(group))
# 5 ['apple']
# 6 ['banana']
# 7 ['avocado']
\`\`\`

Note each \`group\` is itself a one-shot iterator — consume it (e.g. \`list(group)\`) before advancing.

## functools — tools that wrap functions

\`\`\`python
import functools

# reduce: fold an iterable to a single value (Python moved this out of builtins)
print(functools.reduce(lambda acc, x: acc + x, [1, 2, 3, 4], 0))  # 10

# partial: pre-bind arguments, like bind() in JS
from functools import partial
add = lambda a, b: a + b
add10 = partial(add, 10)
print(add10(5))   # 15

# lru_cache: memoize a pure function with one decorator
@functools.lru_cache(maxsize=None)
def slow(n):
    return n * n
\`\`\`

\`lru_cache\` is the idiomatic memoizer — no manual cache dict, no cache-invalidation boilerplate.`,
    exercises: [
    {
      id: "combinations-ex",
      title: "Combinations",
      instructions: `Use \`itertools.combinations\` to produce all **pairs** (2-element combinations) from \`items\`, and return them as a list of tuples.

Expected output: \`[(1, 2), (1, 3), (2, 3)]\`.`,
      starterCode: `import itertools

items = [1, 2, 3]

def all_pairs(items):
    # TODO: return a list of all 2-element combinations of items
    pass

print(all_pairs(items))
`,
    },
    {
      id: "lru-fib",
      title: "Memoize with lru_cache",
      instructions: `Write a naive recursive \`fib(n)\` (where \`fib(0)==0\`, \`fib(1)==1\`), then add \`@lru_cache\` so repeated calls are fast.

Expected output: \`55\` for \`fib(10)\`.`,
      starterCode: `from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    # TODO: base cases for n < 2, otherwise fib(n-1) + fib(n-2)
    return 0

print(fib(10))
`,
    },
    {
      id: "groupby-ex",
      title: "Group consecutive with groupby",
      instructions: `Group the \`people\` records by their \`"dept"\` field using \`itertools.groupby\`. Remember groupby only groups *consecutive* keys — **sort by the key first**.

Return a dict mapping each department to the list of names in it, e.g. \`{'eng': ['Ana', 'Cy'], 'sales': ['Bo']}\`.`,
      starterCode: `import itertools

people = [
    {"name": "Ana", "dept": "eng"},
    {"name": "Bo", "dept": "sales"},
    {"name": "Cy", "dept": "eng"},
]

def group_by_dept(people):
    key = lambda p: p["dept"]
    result = {}
    # TODO: sort people by key, then itertools.groupby(...) and collect names per dept
    return result

print(group_by_dept(people))
`,
    },
    ],
    quiz: [
      {
        id: "itertools-functools-q1",
        prompt: "What's the gotcha with `itertools.groupby`?",
        options: [
          "It groups *consecutive* equal keys, so you must sort first for global grouping",
          "It consumes the whole iterable eagerly",
          "It only accepts a list, not an arbitrary iterable",
          "It returns groups in reverse key order",
        ],
        answer: 0,
        explanation: "It's a run-length grouper, not a SQL GROUP BY. A second gotcha: each group is itself a one-shot iterator, so consume it — for example with `list(group)` — before advancing to the next.",
      },
      {
        id: "itertools-functools-q2",
        prompt: "Why does `itertools.islice(itertools.count(10, 2), 3)` work despite `count` being infinite?",
        options: [
          "It doesn't — this raises a MemoryError",
          "Everything in itertools is lazy — `islice` takes the first n without the source ever building the whole thing",
          "`count` is capped at a large but finite number",
          "`islice` special-cases `count` to compute the range directly",
        ],
        answer: 1,
        explanation: "Laziness is the whole point: you compose infinite or large sources and only pay for what you consume. Wrap in `list()` when you actually want to materialize.",
      },
      {
        id: "itertools-functools-q3",
        prompt: "What does `functools.lru_cache` do?",
        options: [
          "Caches the function's source for faster reimport",
          "Pre-binds arguments so the function can be called with fewer",
          "Memoizes a pure function with one decorator — no manual cache dict",
          "Limits how often a function may be called per second",
        ],
        answer: 2,
        explanation: "It's the idiomatic memoizer. `functools.partial` is the one that pre-binds arguments, like `bind()` in JS, and `functools.reduce` is the fold that Python moved out of builtins.",
      },
    ],
  },
  {
    id: "pathlib-json-re-datetime",
    module: "stdlib",
    title: "pathlib, json, re, datetime",
    blurb: "paths, serialization, regex, and time.",
    content: `Four workhorse modules for everyday glue code: path manipulation, JSON, regex, and dates.

## pathlib — paths as objects, not strings

Forget string concatenation and \`os.path.join\`. \`PurePath\` gives you path *algebra* with the \`/\` operator (no filesystem access — pure manipulation, which is all we can do in the browser sandbox):

\`\`\`python
from pathlib import PurePosixPath

p = PurePosixPath("data") / "logs" / "app.log"
print(p)          # data/logs/app.log
print(p.name)     # app.log
print(p.suffix)   # .log
print(p.stem)     # app
print(p.parent)   # data/logs
print(p.parts)    # ('data', 'logs', 'app.log')
\`\`\`

We use \`PurePosixPath\` (not plain \`Path\`) so behavior is deterministic and never touches a real disk.

## json — serialize/parse

Mirrors JS's \`JSON.stringify\` / \`JSON.parse\`:

\`\`\`python
import json

obj = {"name": "Ada", "langs": ["py", "go"]}
text = json.dumps(obj)            # '{"name": "Ada", "langs": ["py", "go"]}'
back = json.loads(text)          # back to a dict
print(back["name"])              # Ada
print(json.dumps(obj, indent=2)) # pretty-printed
\`\`\`

Key difference from JS: Python tuples become JSON arrays, and dict keys must be strings in the output.

## re — regular expressions

Python regex lives in functions, not on the string. Use raw strings (\`r"..."\`) so backslashes survive:

\`\`\`python
import re

text = "order 12 has 3 items, total 450"
print(re.findall(r"\\d+", text))    # ['12', '3', '450']  (all matches)
m = re.search(r"total (\\d+)", text)
print(m.group(1))                  # 450  (first match + capture group)
print(re.sub(r"\\d+", "#", text))   # order # has # items, total #
\`\`\`

\`findall\` returns every match; \`search\` finds the first (or \`None\`); \`sub\` replaces.

## datetime — dates and arithmetic

\`\`\`python
from datetime import date, timedelta

d = date(2026, 6, 12)
print(d.isoformat())          # 2026-06-12
print(d + timedelta(days=7))  # 2026-06-19
print((date(2026, 1, 1) - d).days)  # -162  (a timedelta)
\`\`\`

Subtracting two dates yields a \`timedelta\`; add a \`timedelta\` to shift a date.`,
    exercises: [
    {
      id: "json-roundtrip",
      title: "JSON round-trip",
      instructions: `Serialize the \`user\` dict with \`json.dumps\`, parse it back with \`json.loads\`, and return the \`"name"\` field from the parsed result.

Expected output: \`Ada\`.`,
      starterCode: `import json

user = {"name": "Ada", "role": "admin"}

def roundtrip_name(user):
    text = json.dumps(user)
    # TODO: json.loads(text) back into a dict, then return its "name" field
    pass

print(roundtrip_name(user))
`,
    },
    {
      id: "regex-findall",
      title: "Find all matches",
      instructions: `Use \`re.findall\` with the pattern \`r"\\d+"\` to extract every run of digits from \`text\`, returning them as a list of strings.

Expected output: \`['42', '7', '100']\`.`,
      starterCode: `import re

text = "room 42, seat 7, building 100"

def extract_numbers(text):
    # TODO: use re.findall with r"\\d+" to return all number strings
    pass

print(extract_numbers(text))
`,
    },
    {
      id: "purepath-parts",
      title: "Manipulate a path",
      instructions: `Build a path by joining \`"home"\`, \`"sean"\`, and \`"report.pdf"\` with \`PurePosixPath\` (use the \`/\` operator), then return a tuple of \`(path.name, path.suffix)\`.

Expected output: \`('report.pdf', '.pdf')\`.`,
      starterCode: `from pathlib import PurePosixPath

def path_info():
    base = PurePosixPath("home")
    # TODO: join "sean" and "report.pdf" onto base with the / operator,
    #       then return (path.name, path.suffix)
    pass

print(path_info())
`,
    },
    ],
    quiz: [
      {
        id: "pathlib-json-re-datetime-q1",
        prompt: "How do you join path segments with `pathlib`?",
        options: [
          "With the `/` operator: `PurePosixPath(\"data\") / \"logs\" / \"app.log\"`",
          "With `+`, like string concatenation",
          "With `.join()` on the path object",
          "With `os.path.join`, which pathlib wraps",
        ],
        answer: 0,
        explanation: "Paths become objects with algebra rather than strings you concatenate. You also get `.name`, `.suffix`, `.stem`, `.parent`, and `.parts` for free.",
      },
      {
        id: "pathlib-json-re-datetime-q2",
        prompt: "What's the difference between `re.findall` and `re.search`?",
        options: [
          "`findall` is for literal text; `search` is for patterns",
          "`findall` returns every match; `search` returns the first match object, or `None`",
          "`findall` returns match objects; `search` returns strings",
          "`findall` searches from the start only; `search` scans the whole string",
        ],
        answer: 1,
        explanation: "Python's regex lives in module functions rather than on the string. Use raw strings (`r\"\\d+\"`) so backslashes survive, and `re.sub` for replacement.",
      },
      {
        id: "pathlib-json-re-datetime-q3",
        prompt: "What does subtracting two `date` objects give you?",
        options: [
          "A float number of seconds",
          "A `date` representing the interval's midpoint",
          "A `timedelta`, whose `.days` is the difference",
          "An int number of days",
        ],
        answer: 2,
        explanation: "Dates and durations are separate types: subtract two dates for a `timedelta`, add a `timedelta` to a date to shift it. That separation is what stops you accidentally adding two dates together.",
      },
    ],
  },
];
