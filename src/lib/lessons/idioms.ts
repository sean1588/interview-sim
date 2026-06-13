import type { Lesson } from "./types";

export const idiomsLessons: Lesson[] = [
  {
    id: "enumerate-zip-unpacking",
    module: "idioms",
    title: "enumerate, zip, and Unpacking",
    blurb: "iterate like a Pythonista.",
    content: `Coming from JS/Java/Go you reach for an index loop. In Python you almost never want a raw index. Iterate over the items directly, and when you also need the index, use \`enumerate\`.

\`\`\`python
colors = ["red", "green", "blue"]

# Un-Pythonic (works, but nobody writes this):
for i in range(len(colors)):
    print(i, colors[i])

# Pythonic:
for i, color in enumerate(colors):
    print(i, color)

# Start counting at 1:
for i, color in enumerate(colors, start=1):
    print(i, color)
\`\`\`

\`enumerate\` returns an iterator of \`(index, value)\` tuples, and the \`for i, color\` part is *tuple unpacking* — Python destructures each tuple into two names, the way TS destructures \`const [i, color] = pair\`.

## zip: iterate in parallel

\`zip\` walks several iterables together, stopping at the shortest. It's the idiomatic way to combine two lists.

\`\`\`python
keys = ["name", "age"]
vals = ["Ada", 36]

for k, v in zip(keys, vals):
    print(k, v)

# Build a dict directly:
person = dict(zip(keys, vals))   # {'name': 'Ada', 'age': 36}
\`\`\`

## Multiple assignment and starred unpacking

\`\`\`python
a, b = 1, 2
a, b = b, a            # swap, no temp variable

first, *rest = [10, 20, 30, 40]   # first=10, rest=[20, 30, 40]
*init, last = [10, 20, 30]        # init=[10, 20], last=30
head, *mid, tail = [1, 2, 3, 4]   # mid=[2, 3]
\`\`\`

The \`*name\` star is Python's spread-on-the-left — it greedily collects the leftover items into a list. There can be at most one starred target.

## The \`_\` throwaway

When you don't care about a value, bind it to \`_\` by convention:

\`\`\`python
_, value = ("ignored", 42)
for _ in range(3):
    print("tick")
\`\`\`

It's just a normal variable, but \`_\` signals "intentionally unused" to readers and linters.`,
    exercises: [
    {
      id: "enumerate-index",
      title: "Index with enumerate",
      instructions: `Use \`enumerate()\` (not \`range(len(...))\`) to print each fruit with its index.

Expected output, one per line:
\`\`\`
0 apple
1 banana
2 cherry
\`\`\``,
      starterCode: `fruits = ["apple", "banana", "cherry"]

def print_indexed(items):
    # TODO: loop with enumerate() and print "<index> <item>" for each
    pass

print_indexed(fruits)
`,
    },
    {
      id: "zip-to-dict",
      title: "Zip into a dict",
      instructions: `Given a list of \`keys\` and a list of \`values\`, build and return a dict that pairs them up using \`zip()\`.

Expected output:
\`\`\`
{'host': 'localhost', 'port': 8080, 'tls': True}
\`\`\``,
      starterCode: `keys = ["host", "port", "tls"]
values = ["localhost", 8080, True]

def to_dict(keys, values):
    # TODO: use zip() to combine keys and values into a dict
    return {}

print(to_dict(keys, values))
`,
    },
    {
      id: "starred-unpack",
      title: "Starred unpacking",
      instructions: `Use \`first, *rest = items\` to split the list into its head and tail, and return them as a tuple \`(first, rest)\`.

Expected output:
\`\`\`
(1, [2, 3, 4, 5])
\`\`\``,
      starterCode: `items = [1, 2, 3, 4, 5]

def head_tail(items):
    # TODO: use starred unpacking to split into first and rest
    first = None
    rest = None
    return (first, rest)

print(head_tail(items))
`,
    },
    ],
  },
  {
    id: "generators",
    module: "idioms",
    title: "Generators and yield",
    blurb: "lazy iteration without building lists.",
    content: `A generator is a function that produces values lazily, one at a time, instead of building a whole list up front. Like JS's \`function*\`, you write \`yield\` instead of \`return\`, and calling the function gives you back an iterator — it does **not** run the body yet.

\`\`\`python
def countdown(n):
    while n > 0:
        yield n
        n -= 1

for x in countdown(3):
    print(x)        # 3, 2, 1
\`\`\`

Each \`yield\` hands a value to the caller and *pauses* the function with all its local state frozen. Execution resumes right after the \`yield\` on the next request. When the function returns (or falls off the end), iteration stops.

## next() and laziness

You can pull values manually with \`next()\`:

\`\`\`python
gen = countdown(2)
print(next(gen))   # 2
print(next(gen))   # 1
# next(gen) again would raise StopIteration
\`\`\`

Because values are produced on demand, a generator can be **infinite** — you just stop pulling when you've taken enough:

\`\`\`python
def naturals():
    n = 0
    while True:
        yield n
        n += 1

gen = naturals()
first_three = [next(gen) for _ in range(3)]   # [0, 1, 2]
\`\`\`

## Generator expressions

The lazy cousin of a list comprehension — swap \`[]\` for \`()\`. It builds nothing in memory; it yields as you consume.

\`\`\`python
# List comp: allocates a 1,000,000-element list.
total = sum([x * x for x in range(1_000_000)])

# Generator expr: streams one value at a time, constant memory.
total = sum(x * x for x in range(1_000_000))
\`\`\`

## When to use them

Reach for generators when the sequence is large, infinite, or expensive to compute and you only need to walk it once. If you need to index, re-iterate, or know the length, materialize a \`list\` instead. Idiomatically: \`sum(...)\`, \`any(...)\`, \`max(...)\` over a generator expression beats building a throwaway list.`,
    exercises: [
    {
      id: "countdown-gen",
      title: "Write a generator",
      instructions: `Write \`countdown(n)\` as a generator that yields \`n\`, \`n-1\`, ... down to \`1\` (inclusive), then stops. Consume it in a for loop and print each value.

For \`n = 4\`, expected output (one per line):
\`\`\`
4
3
2
1
\`\`\``,
      starterCode: `def countdown(n):
    # TODO: yield n, n-1, ..., down to 1
    # (this empty \`yield\` only makes countdown a generator so it runs;
    #  replace it with your real yielding loop)
    if False:
        yield

for x in countdown(4):
    print(x)
`,
    },
    {
      id: "take-infinite",
      title: "Take from an infinite generator",
      instructions: `Write an infinite \`counter()\` generator that yields \`0, 1, 2, ...\` forever. Then write \`take(gen, k)\` that returns the first \`k\` values as a list. Taking from an infinite generator must NOT hang — only pull \`k\` values.

Expected output:
\`\`\`
[0, 1, 2, 3, 4]
\`\`\``,
      starterCode: `def counter():
    # TODO: yield 0, 1, 2, ... forever (an infinite generator)
    pass

def take(gen, k):
    # TODO: pull and return the first k values from gen as a list
    return []

print(take(counter(), 5))
`,
    },
    {
      id: "genexpr-sum",
      title: "Generator expression",
      instructions: `Sum the squares of \`0..n-1\` using a generator expression passed straight to \`sum()\` — do NOT build an intermediate list (no square brackets).

For \`n = 1000\`, expected output:
\`\`\`
332833500
\`\`\``,
      starterCode: `def sum_of_squares(n):
    # TODO: return sum(...) over a generator expression of x*x for x in range(n)
    # Do not build a list first.
    return 0

print(sum_of_squares(1000))
`,
    },
    ],
  },
  {
    id: "eafp",
    module: "idioms",
    title: "EAFP: Ask Forgiveness, Not Permission",
    blurb: "try/except as idiomatic control flow.",
    content: `Two styles for handling things that might fail:

- **LBYL** — *Look Before You Leap*: check first, then act. The default instinct in Java/Go.
- **EAFP** — *Easier to Ask Forgiveness than Permission*: just do it, catch the exception if it fails. The Pythonic default.

\`\`\`python
config = {"timeout": 30}

# LBYL:
if "timeout" in config:
    t = config["timeout"]
else:
    t = 10

# EAFP:
try:
    t = config["timeout"]
except KeyError:
    t = 10
\`\`\`

Why prefer EAFP? The LBYL check can be wrong by the time you act (a race), it often duplicates work the operation does anyway, and it litters the happy path with guards. In Python, exceptions are cheap and \`try\`/\`except\` is ordinary control flow — not a last resort like in some languages.

## Use the right tool

For a dict lookup with a default, you don't even need \`try\` — \`.get()\` is cleaner:

\`\`\`python
t = config.get("timeout", 10)
\`\`\`

Reserve \`try\`/\`except\` for cases without a built-in fallback, like parsing, indexing computed positions, or calling code that signals failure by raising.

## Catch *specific* exceptions

The one rule that makes EAFP safe: catch the **narrowest** exception type, never a bare \`except:\`. A bare except swallows \`KeyboardInterrupt\`, typos, and bugs you wanted to see crash.

\`\`\`python
# Bad: hides every error, including real bugs.
try:
    value = int(raw)
except:
    value = 0

# Good: only handles the failure you anticipated.
try:
    value = int(raw)
except ValueError:
    value = 0
\`\`\`

You can catch several related types with a tuple: \`except (ValueError, TypeError):\`. Bind the object with \`as\` when you need it: \`except ValueError as e: print(e)\`.`,
    exercises: [
    {
      id: "lbyl-to-eafp",
      title: "Rewrite LBYL as EAFP",
      instructions: `Rewrite the lookup using \`try\`/\`except KeyError\` instead of an \`in\` check. Return the value if present, otherwise the string \`"missing"\`.

Expected output:
\`\`\`
Ada
missing
\`\`\``,
      starterCode: `scores = {"Ada": "A", "Bob": "B"}

def lookup(d, key):
    # LBYL version to convert:
    #   if key in d:
    #       return d[key]
    #   return "missing"
    # TODO: rewrite using try/except KeyError
    pass

print(lookup({"Ada": "Ada"}, "Ada"))
print(lookup({"Ada": "Ada"}, "Zed"))
`,
    },
    {
      id: "safe-int",
      title: "Safe parse",
      instructions: `Write \`safe_int(s, default=0)\` that tries \`int(s)\` and returns \`default\` if it raises \`ValueError\`.

Expected output:
\`\`\`
42
0
-1
\`\`\``,
      starterCode: `def safe_int(s, default=0):
    # TODO: try int(s); on ValueError, return default
    pass

print(safe_int("42"))
print(safe_int("not a number"))
print(safe_int("oops", -1))
`,
    },
    {
      id: "catch-specific",
      title: "Catch the right exception",
      instructions: `Write \`safe_div(a, b)\` that returns \`a / b\`, but catches the *specific* \`ZeroDivisionError\` (not a bare \`except\`) and returns the string \`"undefined"\` instead.

Expected output:
\`\`\`
5.0
undefined
\`\`\``,
      starterCode: `def safe_div(a, b):
    # TODO: return a / b, but catch ZeroDivisionError and return "undefined"
    pass

print(safe_div(10, 2))
print(safe_div(10, 0))
`,
    },
    ],
  },
  {
    id: "context-managers",
    module: "idioms",
    title: "Context Managers and with",
    blurb: "deterministic cleanup with with-blocks.",
    content: `A \`with\` block guarantees setup and teardown around a piece of code, even if it raises. It's Python's answer to Java's try-with-resources and Go's \`defer\`, but tied to a *block* rather than a function. The canonical use is files:

\`\`\`python
with open("data.txt") as f:
    data = f.read()
# f is closed here, automatically, even on exception
\`\`\`

That beats the manual equivalent:

\`\`\`python
f = open("data.txt")
try:
    data = f.read()
finally:
    f.close()
\`\`\`

There's no filesystem in this sandbox, so we'll use \`io.StringIO\` — an in-memory text buffer that behaves like a file:

\`\`\`python
import io

with io.StringIO() as buf:
    buf.write("hello ")
    buf.write("world")
    print(buf.getvalue())   # 'hello world'
\`\`\`

## Writing your own

The low-level protocol is two dunder methods: \`__enter__\` (runs on entry, its return value is bound by \`as\`) and \`__exit__\` (runs on exit, even on error). But the idiomatic way to write a *simple* one is \`contextlib.contextmanager\`, which turns a generator into a context manager — everything before \`yield\` is setup, everything after is teardown:

\`\`\`python
from contextlib import contextmanager

@contextmanager
def tag(name):
    print(f"<{name}>")     # setup
    yield                  # body runs here
    print(f"</{name}>")    # teardown

with tag("p"):
    print("hi")
# <p> / hi / </p>
\`\`\`

Put teardown in a \`finally\` inside the generator if it must run even when the body raises.

## Multiple managers

One \`with\` can open several managers, comma-separated. They enter left-to-right and exit in reverse:

\`\`\`python
with io.StringIO() as a, io.StringIO() as b:
    a.write("A")
    b.write("B")
\`\`\``,
    exercises: [
    {
      id: "with-stringio",
      title: "Use a with-block",
      instructions: `Inside a \`with io.StringIO() as buf:\` block, write two strings to \`buf\`, then read the accumulated value back with \`buf.getvalue()\` and return it.

Expected output:
\`\`\`
hello world
\`\`\``,
      starterCode: `import io

def build_message():
    with io.StringIO() as buf:
        # TODO: write "hello " and "world" to buf, then return buf.getvalue()
        pass

print(build_message())
`,
    },
    {
      id: "custom-cm",
      title: "Write a context manager",
      instructions: `Use \`@contextmanager\` to write \`section()\` that prints \`open\` before the wrapped block and \`close\` after it. Then use it in a \`with\` block that prints \`inside\`.

Expected output (one per line):
\`\`\`
open
inside
close
\`\`\``,
      starterCode: `from contextlib import contextmanager

@contextmanager
def section():
    # TODO: print "open" here (before the yield)
    yield
    # TODO: print "close" here (after the yield)

with section():
    print("inside")
`,
    },
    {
      id: "nested-with",
      title: "Multiple context managers",
      instructions: `Open two \`io.StringIO()\` managers in a single \`with\` statement (comma-separated). Write \`"left"\` to the first and \`"right"\` to the second, then return both values as a tuple \`(left_value, right_value)\`.

Expected output:
\`\`\`
('left', 'right')
\`\`\``,
      starterCode: `import io

def two_buffers():
    with io.StringIO() as a, io.StringIO() as b:
        # TODO: write "left" to a and "right" to b,
        # then return (a.getvalue(), b.getvalue())
        pass

print(two_buffers())
`,
    },
    ],
  },
];
