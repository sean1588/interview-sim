import type { Lesson } from "../types";

export const oopTypingLessons: Lesson[] = [
  {
    id: "classes",
    module: "oop-typing",
    title: "Classes, self, and Properties",
    blurb: "defining objects the Python way.",
    content: `Python classes look familiar but differ in three loud ways from Java/TS.

**The constructor is \`__init__\`, and \`self\` is explicit.** There's no \`new\` keyword (you call the class like a function), and every method's first parameter is the instance, conventionally named \`self\`. Unlike JS/Java's implicit \`this\`, Python makes it a real parameter you must declare and use to reach attributes.

\`\`\`python
class Point:
    def __init__(self, x, y):   # the constructor
        self.x = x              # no field declarations — assigning creates them
        self.y = y

    def translate(self, dx, dy):
        return Point(self.x + dx, self.y + dy)

p = Point(1, 2)        # no \`new\`
print(p.x, p.y)        # 1 2
\`\`\`

**Instance vs class attributes.** A name assigned inside \`__init__\` via \`self\` is per-instance. A name assigned in the class body is shared by every instance (Python's static field):

\`\`\`python
class Counter:
    total = 0                 # class attribute — one shared copy
    def __init__(self):
        Counter.total += 1    # mutate the shared one
\`\`\`

Reading \`instance.total\` falls back to the class attribute; *assigning* \`self.total = ...\` would shadow it with a new instance attribute. Beware mutable class defaults (a shared \`[]\`) — a classic footgun.

**\`@property\` turns a method into a computed attribute**, accessed without \`()\`:

\`\`\`python
class Circle:
    def __init__(self, r): self.r = r
    @property
    def area(self):           # call site is c.area, not c.area()
        return 3.14159 * self.r ** 2
\`\`\`

**There is no real \`private\`.** Convention: a single leading underscore (\`_cache\`) means "internal, hands off." Double underscore (\`__x\`) triggers *name mangling* to \`_ClassName__x\` — it discourages collisions in subclasses, not access. Nothing is truly hidden; Python trusts you ("we're all consenting adults").`,
    exercises: [
    {
      id: "define-class",
      title: "Define a class",
      instructions: `Implement \`Point.distance_from_origin\` so it returns the Euclidean distance from \`(0, 0)\`. Use \`self.x\` and \`self.y\` (\`math.hypot\` is the idiomatic helper). Expected output for \`Point(3, 4)\`: \`5.0\`.`,
      starterCode: `import math


class Point:
    def __init__(self, x: float, y: float):
        # Stash the coordinates on the instance via self.
        self.x = x
        self.y = y

    def distance_from_origin(self) -> float:
        # TODO: return the Euclidean distance from (0, 0).
        # Hint: math.hypot(self.x, self.y) or math.sqrt(...)
        return 0.0


p = Point(3, 4)
print(p.distance_from_origin())  # expected: 5.0 once implemented
`,
    },
    {
      id: "property-getter",
      title: "A computed property",
      instructions: `Make \`area\` a real computed \`@property\` that returns \`self.width * self.height\`. Note it's accessed as \`r.area\` with no parentheses. Expected output for \`Rectangle(4, 5)\`: \`20\`.`,
      starterCode: `class Rectangle:
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height

    @property
    def area(self) -> float:
        # TODO: compute area from self.width and self.height.
        # Accessed as r.area (no parentheses), not r.area().
        return 0.0


r = Rectangle(4, 5)
print(r.area)  # expected: 20 once implemented
`,
    },
    {
      id: "class-attr",
      title: "Class vs instance attribute",
      instructions: `Increment the class-level \`count\` inside \`__init__\` (reference it as \`Widget.count\` so you mutate the shared value, not a new instance attribute). After creating two widgets, \`Widget.count\` should print \`2\`.`,
      starterCode: `class Widget:
    # Class-level attribute: one copy shared across ALL instances.
    count = 0

    def __init__(self, name: str):
        self.name = name  # instance attribute: one per object
        # TODO: increment the class-level counter here.
        # Reference it as Widget.count so you mutate the shared value.
        pass


a = Widget("a")
b = Widget("b")
print(Widget.count)  # expected: 2 once implemented
`,
    },
    ],
    quiz: [
      {
        id: "classes-q1",
        prompt: "Why is `self` written explicitly in every method signature?",
        options: [
          "It's required only in `__init__`",
          "It distinguishes instance methods from static ones at runtime",
          "It's a keyword the interpreter treats specially",
          "It's a real parameter — the instance is passed in, and you use it to reach attributes",
        ],
        answer: 3,
        explanation: "Unlike JS/Java's implicit `this`, Python makes it ordinary and explicit — `self` is just the conventional name. There's also no `new` keyword: you call the class like a function.",
      },
      {
        id: "classes-q2",
        prompt: "A name assigned in the class body versus one assigned via `self` in `__init__` — what's the difference?",
        options: [
          "The class-body one is shared by every instance; the `self` one is per-instance",
          "They're identical; the class body is just a shorthand",
          "The class-body one is private; the `self` one is public",
          "The class-body one is evaluated lazily on first access",
        ],
        answer: 0,
        explanation: "Reading `instance.total` falls back to the class attribute, but *assigning* `self.total = ...` shadows it with a new instance attribute. Beware mutable class defaults — a shared `[]` is a classic footgun.",
      },
      {
        id: "classes-q3",
        prompt: "What does a double leading underscore (`__x`) actually do?",
        options: [
          "Prevents the attribute from appearing in `__dict__`",
          "Triggers name mangling to `_ClassName__x` — it discourages subclass collisions, not access",
          "Makes the attribute genuinely private and inaccessible from outside",
          "Marks it as internal, exactly like a single underscore",
        ],
        answer: 1,
        explanation: "There is no real `private` in Python. A single underscore means \"internal, hands off\" by convention; the double underscore mangles the name to avoid accidental collisions in subclasses. Nothing is truly hidden — Python trusts you.",
      },
    ],
  },
  {
    id: "dunders-duck-typing",
    module: "oop-typing",
    title: "Dunder Methods and Duck Typing",
    blurb: "make your objects feel built-in.",
    content: `"Dunder" methods (double-underscore, like \`__repr__\`) are Python's protocol hooks: implement them and built-in syntax just works on your objects. This is how Python does operator overloading and interface conformance — *structurally*, not by declaring \`implements\`.

**\`__repr__\` vs \`__str__\`.** \`__repr__\` is the unambiguous, developer-facing form (what you see in a REPL or list); \`__str__\` is the friendly form for \`print\`/\`str()\`. If you write only one, write \`__repr__\` — it's the fallback for both. Aim to make \`repr\` look like a constructor call. This is \`toString()\`, but with two audiences:

\`\`\`python
class Money:
    def __init__(self, cents): self.cents = cents
    def __repr__(self):  return f"Money({self.cents})"
    def __str__(self):   return f"\${self.cents / 100:.2f}"
\`\`\`

**\`__eq__\` for value equality.** By default \`==\` is identity (like Java's \`==\`/\`.equals\` split). Define \`__eq__\` to compare by value; return \`NotImplemented\` for foreign types so Python can try the other operand:

\`\`\`python
    def __eq__(self, other):
        if not isinstance(other, Money): return NotImplemented
        return self.cents == other.cents
\`\`\`

**Container protocols.** \`__len__\` powers \`len(obj)\`, \`__getitem__\` powers \`obj[i]\`, and \`__iter__\` powers \`for x in obj\`. Implement them and your class behaves like a list to every function that expects one:

\`\`\`python
class Bag:
    def __init__(self, items): self._items = list(items)
    def __len__(self):           return len(self._items)
    def __getitem__(self, i):    return self._items[i]
    def __iter__(self):          return iter(self._items)
\`\`\`

**Duck typing:** "if it walks like a duck...". Functions don't check types; they just call the methods. A \`for\` loop works on *anything* with \`__iter__\` — no shared base class, no nominal interface. Contrast with Java/Go, where a type must *declare* it implements an interface. In Python, conformance is having the right methods, full stop. Operators dispatch the same way: \`+\` calls \`__add__\`, \`<\` calls \`__lt__\`.`,
    exercises: [
    {
      id: "repr-eq",
      title: "__repr__ and __eq__",
      instructions: `Give \`Color\` a \`__repr__\` that returns a constructor-like string (e.g. \`Color(255, 0, 0)\`) and an \`__eq__\` that compares by value, returning \`NotImplemented\` for non-\`Color\` operands. Expected: \`repr(red)\` prints \`Color(255, 0, 0)\` and \`red == also_red\` prints \`True\`.`,
      starterCode: `class Color:
    def __init__(self, r: int, g: int, b: int):
        self.r = r
        self.g = g
        self.b = b

    def __repr__(self) -> str:
        # TODO: return an unambiguous string, ideally one that looks like
        # the constructor call, e.g. "Color(255, 0, 0)".
        return object.__repr__(self)

    def __eq__(self, other) -> bool:
        # TODO: return True when other is a Color with the same r, g, b.
        # Return NotImplemented if other isn't a Color.
        return NotImplemented


red = Color(255, 0, 0)
also_red = Color(255, 0, 0)
print(repr(red))          # expected: Color(255, 0, 0) once implemented
print(red == also_red)    # expected: True once implemented
`,
    },
    {
      id: "len-getitem",
      title: "__len__ and __getitem__",
      instructions: `Implement \`__len__\` to report the number of tracks and \`__getitem__\` to support indexing (delegate to \`self._tracks\`). Expected: \`len(pl)\` prints \`3\` and \`pl[1]\` prints \`Verse\`.`,
      starterCode: `class Playlist:
    def __init__(self, tracks):
        self._tracks = list(tracks)

    def __len__(self) -> int:
        # TODO: return how many tracks are in the playlist.
        return 0

    def __getitem__(self, index):
        # TODO: return the track at the given index (delegate to self._tracks).
        return None


pl = Playlist(["Intro", "Verse", "Chorus"])
print(len(pl))   # expected: 3 once implemented
print(pl[1])     # expected: Verse once implemented
`,
    },
    {
      id: "make-iterable",
      title: "Make it iterable",
      instructions: `Implement \`__iter__\` so iterating a \`Countdown(n)\` yields \`n, n-1, ..., 1\`. The simplest approach is to \`yield\` from a loop, which makes \`__iter__\` a generator. Expected output for \`Countdown(3)\`: \`3\`, then \`2\`, then \`1\` on separate lines.`,
      starterCode: `class Countdown:
    def __init__(self, start: int):
        self.start = start

    def __iter__(self):
        # TODO: yield start, start-1, ..., down to 1.
        # The simplest way is to \`yield\` from a loop, which makes
        # __iter__ a generator function.
        return iter(())  # placeholder: an empty iterator


for n in Countdown(3):
    print(n)  # expected: 3, then 2, then 1 once implemented
`,
    },
    ],
    quiz: [
      {
        id: "dunders-duck-typing-q1",
        prompt: "If you implement only one of `__repr__` and `__str__`, which should it be?",
        options: [
          "`__repr__` — it's the fallback for both, and should read like a constructor call",
          "`__str__` — it's what `print` uses",
          "Neither; the default is adequate for both",
          "Both are required if you define either",
        ],
        answer: 0,
        explanation: "`__repr__` is the unambiguous, developer-facing form you see in a REPL or inside a list; `__str__` is the friendly one for `print`. With only `__repr__` defined, `str()` falls back to it.",
      },
      {
        id: "dunders-duck-typing-q2",
        prompt: "Why should `__eq__` return `NotImplemented` for a foreign type rather than `False`?",
        options: [
          "So the comparison is deferred until both types are known",
          "So Python can try the other operand's `__eq__` before giving up",
          "Because returning `False` raises a TypeError in strict mode",
          "Because `NotImplemented` is falsy anyway, so it's shorter",
        ],
        answer: 1,
        explanation: "Returning `False` asserts inequality; returning `NotImplemented` says \"I don't know,\" letting the reflected operation run. By default `==` is identity, which is why you define `__eq__` for value equality at all.",
      },
      {
        id: "dunders-duck-typing-q3",
        prompt: "What makes a class work in a `for` loop?",
        options: [
          "Registering the class with the iterator protocol",
          "Implementing `__len__` and `__getitem__` together",
          "Implementing `__iter__` — conformance is having the right method, with no base class or declaration",
          "Inheriting from `collections.abc.Iterable`",
        ],
        answer: 2,
        explanation: "That's duck typing: functions don't check types, they just call the methods. Contrast with Java or Go, where a type must declare that it implements an interface. `__len__` powers `len()` and `__getitem__` powers `obj[i]` the same way.",
      },
    ],
  },
  {
    id: "dataclasses-typing",
    module: "oop-typing",
    title: "Dataclasses and Type Hints",
    blurb: "type hints, @dataclass, and Protocols.",
    content: `Python type hints are annotations on names — *optional* and *not enforced at runtime*. The interpreter ignores them; tools like **mypy** or **pyright** check them statically, exactly like \`tsc\` over TS. This is the biggest mental shift from TS: a wrong hint won't raise, it just fails the type-checker.

\`\`\`python
def total(prices: list[float], tax: float = 0.0) -> float:
    return sum(prices) * (1 + tax)
\`\`\`

**The typing toolbox** (modern, Python 3.10+):
- Built-in generics: \`list[int]\`, \`dict[str, int]\`, \`tuple[int, str]\`, \`set[str]\`.
- \`X | None\` for "nullable" — the idiomatic replacement for \`Optional[X]\`. \`int | str\` is a union (TS's \`number | string\`).
- \`from typing import Optional, Union\` still exist but \`|\` is preferred now.

**\`@dataclass\` kills boilerplate.** Declare typed fields in the class body and the decorator generates \`__init__\`, \`__repr__\`, and \`__eq__\` for you — no assigning \`self.x = x\` by hand. It's like a TS class with parameter properties, or a record:

\`\`\`python
from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    age: int = 0            # default makes it optional
    tags: list[str] = field(default_factory=list)  # never use [] as a default!

u = User("Ada", 36)
print(u)                    # User(name='Ada', age=36, tags=[])
print(u == User("Ada", 36)) # True — value equality for free
\`\`\`

Use \`frozen=True\` for immutability (hashable, like a tuple-record).

**\`Protocol\` = structural typing, TS-style interfaces.** Instead of inheriting, a class matches a \`Protocol\` just by having the right methods/attributes — duck typing the type-checker can verify:

\`\`\`python
from typing import Protocol

class HasName(Protocol):
    name: str

def label(x: HasName) -> str:
    return x.name        # any object with a .name str satisfies HasName
\`\`\`

This is exactly TS's \`interface { name: string }\` — conformance by shape, not by declaration. Contrast with \`ABC\`/inheritance, which is nominal (Java-style).`,
    exercises: [
    {
      id: "annotate-fn",
      title: "Annotate a function",
      instructions: `Add type hints to \`greet_all\`: \`names: list[str]\`, \`greeting: str\`, and return type \`-> list[str]\`. Then build each entry as \`"<greeting>, <name>!"\`. Expected output: \`['Hello, Ada!', 'Hello, Linus!']\`.`,
      starterCode: `def greet_all(names, greeting):
    # TODO: add type hints to the signature above:
    #   names: list[str], greeting: str, and the return type -> list[str].
    # Then return a list of "<greeting>, <name>!" strings.
    result = []
    for name in names:
        result.append(name)  # placeholder — build the greeting instead
    return result


print(greet_all(["Ada", "Linus"], "Hello"))
# expected once implemented: ['Hello, Ada!', 'Hello, Linus!']
`,
    },
    {
      id: "a-dataclass",
      title: "Write a dataclass",
      instructions: `Implement \`Money.formatted\` to return a string like \`"12.5 USD"\` using \`self.amount\` and \`self.currency\`. Notice \`__init__\`, \`__repr__\`, and \`__eq__\` are generated by \`@dataclass\` for free. Expected: \`m.formatted()\` prints \`12.5 USD\`.`,
      starterCode: `from dataclasses import dataclass


@dataclass
class Money:
    amount: float
    currency: str = "USD"

    def formatted(self) -> str:
        # TODO: return a string like "12.5 USD".
        # Use self.amount and self.currency.
        return ""


m = Money(12.5)
print(m)             # __repr__ is free: Money(amount=12.5, currency='USD')
print(m.formatted()) # expected: 12.5 USD once implemented
print(m == Money(12.5))  # __eq__ is free: True
`,
    },
    {
      id: "a-protocol",
      title: "Structural typing with Protocol",
      instructions: `Implement \`describe\` to return a string like \`"has 3 items"\` using \`thing.size()\`. \`Box\` never mentions \`Sized\`, yet satisfies the \`Protocol\` structurally — that's the point. Expected output: \`has 3 items\`.`,
      starterCode: `from typing import Protocol


class Sized(Protocol):
    # Anything with an int-returning size() method matches this Protocol —
    # no inheritance or registration required (structural typing).
    def size(self) -> int: ...


class Box:
    def __init__(self, items):
        self._items = list(items)

    def size(self) -> int:
        return len(self._items)


def describe(thing: Sized) -> str:
    # TODO: return a string like "has 3 items" using thing.size().
    return ""


# Box never mentions Sized, yet it satisfies the Protocol structurally.
print(describe(Box(["a", "b", "c"])))  # expected: has 3 items once implemented
`,
    },
    ],
    quiz: [
      {
        id: "dataclasses-typing-q1",
        prompt: "What happens at runtime when a Python type hint is wrong?",
        options: [
          "The value is coerced to the annotated type",
          "Nothing — hints are ignored by the interpreter; mypy or pyright catch them statically",
          "A TypeError is raised at the call site",
          "A warning is printed to stderr",
        ],
        answer: 1,
        explanation: "This is the biggest mental shift from TypeScript. Checking is a separate, deliberate command — the analog of `tsc` — rather than something the runtime does for you.",
      },
      {
        id: "dataclasses-typing-q2",
        prompt: "Why must a dataclass list field use `field(default_factory=list)` rather than `= []`?",
        options: [
          "`default_factory` is required for all defaults in a dataclass",
          "It's a style preference; both work identically",
          "A bare `[]` would be a shared mutable default across every instance — the same trap as mutable function defaults",
          "`[]` isn't a valid type annotation",
        ],
        answer: 2,
        explanation: "The class body is evaluated once, so a literal `[]` would be one list shared by every instance. `default_factory` calls the factory per instance — and dataclasses actually raise an error if you try the literal.",
      },
      {
        id: "dataclasses-typing-q3",
        prompt: "What does `typing.Protocol` give you?",
        options: [
          "Runtime enforcement of the declared interface",
          "Nominal typing, like an abstract base class",
          "A way to declare abstract methods that subclasses must override",
          "Structural typing — a class matches just by having the right methods and attributes, no inheritance",
        ],
        answer: 3,
        explanation: "It's exactly TypeScript's `interface { name: string }` — conformance by shape, which is duck typing the type-checker can verify. `ABC` and inheritance are the nominal, Java-style alternative.",
      },
    ],
  },
];
