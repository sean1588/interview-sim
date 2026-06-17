import type { Lesson } from "../types";

export const basicsLessons: Lesson[] = [
  {
    id: "hello-and-values",
    module: "basics",
    title: "Hello, Values, and f-strings",
    blurb: "print, dynamic typing, core scalar types, and string formatting.",
    content: `## Printing and assigning

The entry point to Python output is \`print()\`, which writes to stdout and adds a newline by default:

\`\`\`python
print("Hello, Python")
\`\`\`

Variables have **no declaration keyword** — there is no \`let\`, \`const\`, or \`var\`. You just bind a name. And **no semicolons**: a newline ends a statement.

\`\`\`python
name = "Ada"
count = 3
\`\`\`

The idiomatic naming convention is \`snake_case\` for variables and functions (not \`camelCase\`). Constants are \`UPPER_SNAKE_CASE\` by convention only — Python has no real \`const\`, so nothing stops reassignment.

## Dynamic but strongly typed

Like JS, Python is **dynamically typed**: a name can be rebound to any type. But unlike JS, it is **strongly typed** — there is no implicit coercion between unrelated types. \`"3" + 4\` raises a \`TypeError\` rather than producing \`"34"\` or \`7\`.

\`\`\`python
x = 10        # int
x = "now str" # legal: names aren't typed, values are
\`\`\`

## Core scalar types

- \`int\` — arbitrary precision, no overflow.
- \`float\` — IEEE 754 double, just like JS \`number\`.
- \`str\` — immutable text; single or double quotes are equivalent.
- \`bool\` — \`True\` and \`False\` (capitalized!).
- \`NoneType\` — the single value \`None\`, Python's \`null\`/\`undefined\`.

Use \`type(value)\` to inspect at runtime.

## f-strings

The Pythonic way to format is an **f-string** — prefix the literal with \`f\` and embed expressions in \`{}\`:

\`\`\`python
name, age = "Ada", 36
print(f"{name} is {age} years old")
print(f"Next year: {age + 1}")
print(f"Pi approx {3.14159:.2f}")  # format spec after a colon
\`\`\`

This is Python's analog to JS template literals (\`\` \`\${name}\` \`\`) and Java's \`String.format\`, but the expression goes *inline* in the braces and a \`:format_spec\` controls width/precision.

## A preview of truthiness

Values have a boolean sense: \`""\`, \`0\`, \`None\`, and empty containers are *falsy*; most everything else is *truthy*. We lean on this heavily in the next lesson.`,
    exercises: [
    {
      id: "hello-fstring",
      title: "Format a greeting",
      instructions: `Using the provided \`name\` and \`age\` variables, build a single greeting string with an **f-string** and print it.

Expected output (for the given values):

\`\`\`
Hi, my name is Ada and I am 36.
\`\`\``,
      starterCode: `name = "Ada"
age = 36

# TODO: build a one-line greeting with an f-string and print it.
# It should read: Hi, my name is Ada and I am 36.
greeting = ""  # replace this with an f-string

print(greeting)
`,
    },
    {
      id: "numeric-types",
      title: "Ints, floats, and division",
      instructions: `Given two integers \`a\` and \`b\`, print the results of the three division-family operators:

- \`/\` true division (always returns a \`float\`)
- \`//\` floor division
- \`%\` modulo (remainder)

Expected output (for \`a = 17\`, \`b = 5\`):

\`\`\`
17 / 5 = 3.4
17 // 5 = 3
17 % 5 = 2
\`\`\``,
      starterCode: `a = 17
b = 5

# TODO: compute and print each of the three results.
# Use f-strings so the output matches the format below.
# 17 / 5 = 3.4
# 17 // 5 = 3
# 17 % 5 = 2

true_div = None   # a / b
floor_div = None  # a // b
remainder = None  # a % b

print(f"{a} / {b} = {true_div}")
print(f"{a} // {b} = {floor_div}")
print(f"{a} % {b} = {remainder}")
`,
    },
    {
      id: "type-conversion",
      title: "Converting between types",
      instructions: `Convert between types explicitly (Python never coerces for you):

1. Parse the string \`"42"\` to an \`int\`.
2. Parse the string \`"3.14"\` to a \`float\`.
3. Convert a number back to a \`str\`.

Print each result alongside its \`type(...)\`. Expected output shape:

\`\`\`
42 <class 'int'>
3.14 <class 'float'>
100 <class 'str'>
\`\`\``,
      starterCode: `int_text = "42"
float_text = "3.14"
number = 100

# TODO: convert each value and print it next to its type.
# Hint: int(...), float(...), str(...), and type(...).
parsed_int = None    # int(int_text)
parsed_float = None  # float(float_text)
as_string = None     # str(number)

print(parsed_int, type(parsed_int))
print(parsed_float, type(parsed_float))
print(as_string, type(as_string))
`,
    },
    ],
  },
  {
    id: "control-flow",
    module: "basics",
    title: "Control Flow and Truthiness",
    blurb: "if/elif/else, loops, and what counts as true.",
    content: `## Blocks are indentation, not braces

Python has **no curly braces**. A block is a colon followed by a consistently indented suite (4 spaces is standard). Indentation is syntactically significant — mis-indenting is a real error, not a style nit.

\`\`\`python
if score >= 90:
    grade = "A"
elif score >= 80:   # note: elif, not "else if"
    grade = "B"
else:
    grade = "C"
\`\`\`

Conditions take **no parentheses** around them, and the keywords are words, not symbols: \`and\`, \`or\`, \`not\` instead of \`&&\`, \`||\`, \`!\`.

\`\`\`python
if logged_in and not is_banned:
    ...
\`\`\`

## Truthiness

Any value can be tested directly. **Falsy**: \`False\`, \`None\`, \`0\`, \`0.0\`, \`""\`, \`[]\`, \`{}\`, \`()\`, \`set()\`. Everything else is **truthy**. The Pythonic check for "is this empty?" is the value itself, not a length comparison:

\`\`\`python
items = []
if not items:          # idiomatic
    print("empty")
# avoid: if len(items) == 0
\`\`\`

## Loops

Python has no C-style \`for (int i = 0; i < n; i++)\`. You iterate over a sequence. To loop a count, iterate \`range(n)\` (0..n-1):

\`\`\`python
for i in range(5):        # 0,1,2,3,4
    print(i)

for i in range(1, 4):     # 1,2,3  (start, stop)
    print(i)
\`\`\`

\`while\` works as expected, with \`break\` and \`continue\`:

\`\`\`python
n = 0
while True:
    n += 1            # no ++ operator in Python
    if n == 3:
        continue
    if n > 5:
        break
\`\`\`

## The conditional expression

Python's ternary reads in plain-English order — value-if-true **first**:

\`\`\`python
label = "even" if x % 2 == 0 else "odd"
\`\`\`

This is the equivalent of JS/Java \`cond ? a : b\`, just reordered to \`a if cond else b\`.`,
    exercises: [
    {
      id: "fizzbuzz",
      title: "FizzBuzz",
      instructions: `Print FizzBuzz for the numbers \`1\` through \`n\` (inclusive). For each number:

- multiple of 3 **and** 5 -> \`FizzBuzz\`
- multiple of 3 -> \`Fizz\`
- multiple of 5 -> \`Buzz\`
- otherwise -> the number itself

Use a \`for\` loop, \`range()\`, and the modulo operator \`%\`. Expected first lines for \`n = 5\`:

\`\`\`
1
2
Fizz
4
Buzz
\`\`\``,
      starterCode: `def fizzbuzz(n):
    # TODO: loop 1..n with range() and print Fizz / Buzz / FizzBuzz / the number.
    # Remember range(1, n + 1) to include n.
    pass


fizzbuzz(5)
`,
    },
    {
      id: "sum-evens",
      title: "Sum the even numbers",
      instructions: `Loop over \`1\` through \`n\` (inclusive), accumulate the sum of the **even** numbers using \`%\`, and return it.

Expected output for \`n = 10\` (2+4+6+8+10):

\`\`\`
30
\`\`\``,
      starterCode: `def sum_evens(n):
    total = 0
    # TODO: loop 1..n and add only the even numbers to total, then return it.
    return total


print(sum_evens(10))
`,
    },
    {
      id: "truthiness-check",
      title: "Truthy or falsy",
      instructions: `Write \`is_empty(x)\` that returns \`True\` when \`x\` is falsy and \`False\` otherwise, relying on Python **truthiness** — do *not* write \`len(x) == 0\`.

Test it on a few values. Expected output:

\`\`\`
[] -> True
[1] -> False
 -> True
hi -> False
0 -> True
None -> True
\`\`\``,
      starterCode: `def is_empty(x):
    # TODO: return True if x is falsy, False otherwise.
    # Use Python truthiness (e.g. \`not x\`), not len(x) == 0.
    pass


for value in [[], [1], "", "hi", 0, None]:
    print(f"{value} -> {is_empty(value)}")
`,
    },
    ],
  },
  {
    id: "functions",
    module: "basics",
    title: "Functions, Defaults, and *args",
    blurb: "def, keyword args, packing, and the mutable-default trap.",
    content: `## Defining functions

Functions are declared with \`def\` and return with \`return\` (a bare \`return\` or falling off the end yields \`None\`):

\`\`\`python
def square(x):
    return x * x
\`\`\`

The first string literal in the body is a **docstring** — accessible at runtime via \`square.__doc__\` and used by \`help()\`:

\`\`\`python
def square(x):
    """Return x squared."""
    return x * x
\`\`\`

## Default and keyword arguments

Defaults look like JS default params. The big addition over Java: callers can pass arguments **by name** in any order, which doubles as self-documenting call sites.

\`\`\`python
def connect(host, port=5432, ssl=True):
    ...

connect("db")                  # uses defaults
connect("db", ssl=False)       # skip port, name the rest
connect(port=5433, host="db")  # order-free with keywords
\`\`\`

This is why Python rarely needs Java-style overloading — one signature with defaults covers the cases.

## Packing: *args and **kwargs

\`*args\` collects extra positional arguments into a **tuple**; \`**kwargs\` collects extra keyword arguments into a **dict**. This is Python's rest-parameter analog.

\`\`\`python
def log(level, *args, **kwargs):
    print(level, args, kwargs)

log("INFO", 1, 2, user="ada")  # INFO (1, 2) {'user': 'ada'}
\`\`\`

## Returning multiple values

Return a comma-separated list and Python packs it into a **tuple**; the caller can unpack it:

\`\`\`python
def min_max(nums):
    return min(nums), max(nums)

lo, hi = min_max([3, 1, 4])    # lo=1, hi=4
\`\`\`

## The mutable-default trap

Default values are evaluated **once**, at definition time — not per call. A mutable default like \`[]\` is therefore *shared across every call*:

\`\`\`python
def bad(item, target=[]):
    target.append(item)
    return target

bad(1)   # [1]
bad(2)   # [1, 2]  <-- surprise, same list!
\`\`\`

The idiomatic fix is a \`None\` sentinel:

\`\`\`python
def good(item, target=None):
    if target is None:
        target = []
    target.append(item)
    return target
\`\`\``,
    exercises: [
    {
      id: "greet-defaults",
      title: "Defaults and keyword args",
      instructions: `Write \`greet(name, greeting="Hello")\` that returns a string like \`"Hello, Ada!"\`. Then call it three ways: positionally, with a keyword argument for the greeting, and order-free with both names.

Expected output:

\`\`\`
Hello, Ada!
Hi, Ada!
Hey, Bob!
\`\`\``,
      starterCode: `def greet(name, greeting="Hello"):
    # TODO: return a string like "Hello, Ada!" using the greeting and name.
    pass


print(greet("Ada"))                       # positional
print(greet("Ada", greeting="Hi"))        # keyword for greeting
print(greet(greeting="Hey", name="Bob"))  # order-free keywords
`,
    },
    {
      id: "args-sum",
      title: "Variadic sum",
      instructions: `Write \`total(*nums)\` that returns the sum of any number of positional arguments. With no arguments it should return \`0\`.

Expected output:

\`\`\`
6
10
0
\`\`\``,
      starterCode: `def total(*nums):
    # TODO: nums is a tuple of all the positional arguments. Return their sum.
    pass


print(total(1, 2, 3))
print(total(1, 2, 3, 4))
print(total())
`,
    },
    {
      id: "mutable-default",
      title: "Fix the mutable default",
      instructions: `The buggy \`append_to\` below shares one list across calls. First observe the bug, then write \`append_to_fixed\` using a \`None\` sentinel so each call starts fresh.

Expected output (the buggy version leaks, the fixed one does not):

\`\`\`
buggy: [1]
buggy: [1, 2]
fixed: [1]
fixed: [2]
\`\`\``,
      starterCode: `def append_to(item, target=[]):  # buggy: shared default list
    target.append(item)
    return target


def append_to_fixed(item, target=None):
    # TODO: make this correct.
    #   1. If target is None, create a fresh [] for THIS call (the None sentinel).
    #   2. Append item to target.
    #   3. Return target.
    # The placeholder below just returns an empty list so the scaffold runs;
    # replace it with the three steps above.
    return []


print("buggy:", append_to(1))
print("buggy:", append_to(2))
print("fixed:", append_to_fixed(1))
print("fixed:", append_to_fixed(2))
`,
    },
    ],
  },
  {
    id: "modules-and-main",
    module: "basics",
    title: "Imports, __main__, and Identity",
    blurb: "import styles, the main guard, and is vs ==.",
    content: `## Import styles

A Python file is a module; a directory of them is a package. You pull names in with \`import\`:

\`\`\`python
import math                 # whole module: use math.sqrt
from math import sqrt       # bind a single name: use sqrt
from math import sqrt as s  # alias it
import numpy as np          # common aliasing convention
\`\`\`

This is the rough analog of JS \`import\`/\`require\` and Go's \`import\`. The **standard library** is large and ships with Python — \`math\`, \`os\`, \`json\`, \`random\`, \`datetime\`, and many more are always available, no install needed.

## The main guard

When a file runs directly, its \`__name__\` is the string \`"__main__"\`. When it is *imported*, \`__name__\` is the module's name. The standard idiom guards your script's entry point so it runs on \`python file.py\` but not on \`import file\`:

\`\`\`python
def main():
    print("running directly")

if __name__ == "__main__":
    main()
\`\`\`

This is Python's counterpart to Go's \`package main\` + \`func main()\` — but it's a convention enforced by the guard, not the language.

## \`is\` vs \`==\`

- \`==\` compares **values** (calls \`__eq__\`).
- \`is\` compares **identity** — whether two names point to the *same object* in memory.

\`\`\`python
a = [1, 2]
b = [1, 2]
a == b   # True  (same contents)
a is b   # False (different objects)
\`\`\`

Because \`None\` is a singleton (exactly one instance exists), the idiomatic, correct way to check for it is identity:

\`\`\`python
if value is None:      # right
    ...
if value == None:      # works, but not Pythonic
    ...
\`\`\`

## A note on scope: LEGB

Name lookup follows **LEGB**: Local, then Enclosing (outer functions), then Global (module), then Built-in. A name assigned inside a function is local unless you declare \`global\` or \`nonlocal\`. This differs from JS in that there is no block scope — \`if\`/\`for\` blocks do **not** create a new scope; functions do.`,
    exercises: [
    {
      id: "use-math",
      title: "Use the math module",
      instructions: `Import the \`math\` module and use at least two of its functions — for example \`math.sqrt\` and \`math.factorial\` — then print the results.

Expected output:

\`\`\`
sqrt(16) = 4.0
factorial(5) = 120
\`\`\``,
      starterCode: `# TODO: import the math module, then use it below.

n = 16
k = 5

# TODO: compute math.sqrt(n) and math.factorial(k) and print them.
root = None       # math.sqrt(n)
fact = None       # math.factorial(k)

print(f"sqrt({n}) = {root}")
print(f"factorial({k}) = {fact}")
`,
    },
    {
      id: "is-vs-equals",
      title: "is vs ==",
      instructions: `Demonstrate the difference between identity (\`is\`) and value equality (\`==\`):

1. Check a \`None\` value with \`is\`.
2. Show two distinct lists with equal contents: \`==\` is \`True\` but \`is\` is \`False\`.

Expected output:

\`\`\`
value is None: True
a == b: True
a is b: False
\`\`\``,
      starterCode: `value = None
a = [1, 2, 3]
b = [1, 2, 3]  # equal contents, but a different object

# TODO: replace each None below with the correct comparison.
none_check = None   # value is None
equal_check = None  # a == b
identity_check = None  # a is b

print(f"value is None: {none_check}")
print(f"a == b: {equal_check}")
print(f"a is b: {identity_check}")
`,
    },
    {
      id: "main-guard",
      title: "The main guard",
      instructions: `Define a \`main()\` function that prints something, then call it only from inside an \`if __name__ == "__main__":\` block so it runs when the file is executed directly but not when imported.

Expected output when run directly:

\`\`\`
Running as a script.
\`\`\``,
      starterCode: `def main():
    # TODO: print a message such as: Running as a script.
    pass


# TODO: call main() only when this file is run directly.
# if __name__ == "__main__":
#     main()
`,
    },
    ],
  },
];
