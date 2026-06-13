import type { Lesson } from "./types";

export const errorsTestingLessons: Lesson[] = [
  {
    id: "exceptions",
    module: "errors-testing",
    title: "Exceptions Done Right",
    blurb: "the hierarchy, raising, and chaining.",
    content: `Python has no checked exceptions (unlike Java) and no error-return convention (unlike Go's \`if err != nil\`). Every error is an *exception* that propagates up the stack until something catches it. Errors are values you \`raise\` and control flow you \`except\`.

## The hierarchy

Everything catchable derives from \`BaseException\`. You almost always work with \`Exception\` and below:

\`\`\`
BaseException
 ├── SystemExit, KeyboardInterrupt   # do NOT catch these casually
 └── Exception
      ├── ValueError, KeyError, TypeError, OSError, ...
\`\`\`

**Never write a bare \`except:\`** — it swallows \`KeyboardInterrupt\` and \`SystemExit\` too. Catch \`Exception\` if you must be broad, but prefer the narrowest type that makes sense.

\`\`\`python
try:
    n = int("not a number")
except ValueError as e:
    print(f"bad input: {e}")
\`\`\`

## try / except / else / finally

\`\`\`python
try:
    result = risky()
except KeyError:
    handle_missing()
else:
    # runs ONLY if no exception was raised
    use(result)
finally:
    # ALWAYS runs — cleanup, even on exception or return
    cleanup()
\`\`\`

\`else\` keeps the "happy path" out of the \`try\` so you don't accidentally catch exceptions from \`use(result)\`.

## Raising and custom exceptions

Subclass \`Exception\` — that's the whole definition you usually need:

\`\`\`python
class ConfigError(Exception):
    pass

raise ConfigError("missing API key")
\`\`\`

## Chaining with \`raise ... from\`

When you translate a low-level error into a domain one, preserve the cause:

\`\`\`python
try:
    port = int(raw)
except ValueError as e:
    raise ConfigError("PORT must be an integer") from e
\`\`\`

The traceback shows both, linked by *"The above exception was the direct cause..."*. Use \`from None\` to deliberately suppress the original.`,
    exercises: [
    {
      id: "custom-exception",
      title: "A custom exception",
      instructions: `Define a custom exception class \`InsufficientFundsError\` that subclasses \`Exception\`. Write \`withdraw(balance, amount)\` that raises it when \`amount > balance\`, otherwise returns the new balance. Then call it inside a \`try/except\` that catches your exception and prints a message.

Expected output: a normal withdrawal prints the remaining balance; an over-withdrawal prints something like \`Denied: ...\`.`,
      starterCode: `class InsufficientFundsError(Exception):
    pass


def withdraw(balance, amount):
    # TODO: raise InsufficientFundsError if amount > balance,
    # otherwise return balance - amount
    pass


for amount in (30, 200):
    try:
        new_balance = withdraw(100, amount)
        print(f"Withdrew {amount}, balance is {new_balance}")
    except InsufficientFundsError as e:
        print(f"Denied: {e}")
`,
    },
    {
      id: "try-else-finally",
      title: "else and finally",
      instructions: `Write \`parse_int(text)\` that wraps \`int(text)\` in a \`try/except/else/finally\`. In \`except\` (catching \`ValueError\`) print \`parse failed\` and return \`None\`; in \`else\` print \`parsed ok\` and return the number; in \`finally\` print \`done\`. Call it once with \`"42"\` and once with \`"oops"\` so all branches are exercised.

Expected output: shows \`parsed ok\` + \`done\` for the good input and \`parse failed\` + \`done\` for the bad one.`,
      starterCode: `def parse_int(text):
    try:
        value = int(text)
    except ValueError:
        # TODO: print 'parse failed' and return None
        pass
    else:
        # TODO: print 'parsed ok' and return value
        pass
    finally:
        # TODO: print 'done' (runs no matter what)
        pass


print("result:", parse_int("42"))
print("result:", parse_int("oops"))
`,
    },
    {
      id: "raise-from",
      title: "Chain exceptions",
      instructions: `Define \`ConfigError(Exception)\`. Write \`load_port(raw)\` that tries \`int(raw)\`; on \`ValueError\`, raise \`ConfigError("PORT must be an integer")\` using \`raise ... from\` to preserve the original cause. In the caller, catch \`ConfigError\` and print both the error and its \`__cause__\`.

Expected output: prints the \`ConfigError\` message and shows the underlying \`ValueError\` as the cause.`,
      starterCode: `class ConfigError(Exception):
    pass


def load_port(raw):
    try:
        return int(raw)
    except ValueError as e:
        # TODO: raise ConfigError("PORT must be an integer") from e
        pass


try:
    load_port("eighty")
except ConfigError as err:
    print(f"config error: {err}")
    print(f"caused by: {err.__cause__!r}")
`,
    },
    ],
  },
  {
    id: "pytest",
    module: "errors-testing",
    title: "Testing with pytest",
    blurb: "plain asserts, conventions, and parametrize.",
    content: `\`pytest\` is the de-facto standard test runner in Python — most teams skip \`unittest\` (the Java-\`JUnit\`-flavored stdlib option) entirely. Its killer feature: you use the **plain \`assert\` statement**. No \`assertEqual\`, no \`expect(x).toBe(y)\`. pytest rewrites assert internals so a failing \`assert a == b\` still prints a rich diff.

## Conventions (discovery is automatic)

- Files named \`test_*.py\` (or \`*_test.py\`).
- Functions named \`test_*\`.
- No imports, no base class, no registration. pytest finds them.

\`\`\`python
# test_math.py
def add(a, b):
    return a + b

def test_add_positives():
    assert add(2, 3) == 5
\`\`\`

Run with \`pytest\` (or \`pytest -q\`). A bare \`assert\` that fails *is* a failed test.

## Arrange-Act-Assert

Structure each test in three beats:

\`\`\`python
def test_total_with_tax():
    cart = [10, 20]          # Arrange
    total = sum(cart) * 1.1  # Act
    assert total == 33.0     # Assert
\`\`\`

## parametrize — one test, many cases

Instead of looping or copy-pasting, feed cases as data:

\`\`\`python
import pytest

@pytest.mark.parametrize("a, b, expected", [
    (2, 3, 5),
    (0, 0, 0),
    (-1, 1, 0),
])
def test_add(a, b, expected):
    assert add(a, b) == expected
\`\`\`

Each tuple becomes its own reported test, so one failing case doesn't hide the others.

## fixtures — reusable setup

A \`fixture\` is dependency-injected setup; request it by naming it as a parameter:

\`\`\`python
@pytest.fixture
def sample_user():
    return {"name": "Ada", "admin": False}

def test_default_not_admin(sample_user):
    assert sample_user["admin"] is False
\`\`\`

> Note: in this browser sandbox \`pytest\` isn't installed, so the exercises use plain \`assert\` statements in a script that simply runs to completion. Same assertions — minus the runner.`,
    exercises: [
    {
      id: "write-asserts",
      title: "Write passing asserts",
      instructions: `A function \`slugify(text)\` is provided. Write a \`test_slugify()\` function containing several plain \`assert\` statements that all pass, then call it. Use the Arrange-Act-Assert shape.

Expected output: prints \`all asserts passed\` with no \`AssertionError\`.`,
      starterCode: `def slugify(text):
    return text.strip().lower().replace(" ", "-")


def test_slugify():
    # TODO: write a few \`assert\` statements that all pass, e.g.
    # assert slugify("Hello World") == "hello-world"
    pass


test_slugify()
print("all asserts passed")
`,
    },
    {
      id: "test-edge-cases",
      title: "Test the edges",
      instructions: `A function \`safe_divide(a, b)\` returns \`a / b\`, or \`0\` when \`b == 0\`. Write \`test_safe_divide()\` with asserts covering the edges: an empty/zero numerator, division by zero, and a negative input. Call it.

Expected output: prints \`edge cases passed\` with no \`AssertionError\`.`,
      starterCode: `def safe_divide(a, b):
    if b == 0:
        return 0
    return a / b


def test_safe_divide():
    # TODO: assert behavior for zero numerator, division by zero,
    # and a negative input
    # assert safe_divide(0, 5) == 0
    pass


test_safe_divide()
print("edge cases passed")
`,
    },
    {
      id: "param-asserts",
      title: "Parametrize-style checks",
      instructions: `A function \`is_even(n)\` is provided. Build a list of \`(input, expected)\` tuples and loop over them, asserting \`is_even(n) == expected\` for each — this is the hand-rolled spirit of \`@pytest.mark.parametrize\`. Include the index in the assert message so a failure points to the offending case.

Expected output: prints \`4 cases passed\` (or however many cases you wrote).`,
      starterCode: `def is_even(n):
    return n % 2 == 0


cases = [
    (2, True),
    (3, False),
    (0, True),
    (-4, True),
]


def test_is_even():
    for i, (n, expected) in enumerate(cases):
        # TODO: assert is_even(n) == expected, with a helpful message
        pass
    return len(cases)


count = test_is_even()
print(f"{count} cases passed")
`,
    },
    ],
  },
];
