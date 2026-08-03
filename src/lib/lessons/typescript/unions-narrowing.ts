import type { Lesson } from "../types";

export const unionsNarrowingLessons: Lesson[] = [
  {
    id: "union-types",
    module: "unions-narrowing",
    title: "Union Types",
    blurb: "Values that are one of several types.",
    content: `## A value that is one of several types

A **union type** \`A | B\` says a value is *either* an \`A\` or a \`B\`. In JavaScript you do this all the time implicitly — a function that takes "a string or a number" — but nothing checks it. TypeScript makes the set explicit and enforces it.

\`\`\`ts
let id: string | number;
id = "abc"; // ok
id = 42;    // ok
id = true;  // Type 'boolean' is not assignable to 'string | number'
\`\`\`

## Literal unions: finite sets

Unions really shine with **literal types** — exact values, not just types. This models a finite set far more tightly than a bare \`string\`:

\`\`\`ts
type Color = "red" | "green" | "blue";
type HttpStatus = 200 | 404 | 500;

let c: Color = "red";   // ok
c = "purple";           // Type '"purple"' is not assignable to 'Color'
\`\`\`

This is closer to an \`enum\` in Java/C# or \`iota\` constants in Go, but it is just plain strings/numbers at runtime — the type is **erased**, there is no enum object.

## Unions of object types

Members can be object shapes too:

\`\`\`ts
type Ok = { status: "ok"; data: string };
type Err = { status: "error"; message: string };
type Result = Ok | Err;
\`\`\`

## What you can do *before* narrowing

This is the key rule. On a union, you may only access what **every** arm has in common. For \`string | number\`, that is the members shared by both:

\`\`\`ts
function describe(x: string | number) {
  // x.toUpperCase(); // ERROR: number has no toUpperCase
  return String(x);   // ok: works for both arms
}
\`\`\`

To use arm-specific members you must first **narrow** — prove to the compiler which arm you have. That is the whole next lesson. Until then, the union only exposes the intersection of its members.`,
    exercises: [
    {
      id: "string-or-number",
      title: "string | number",
      instructions: `Implement \`format(x: string | number)\` so it returns a display string for **both** arms.

Use only operations common to both, or narrow with a \`typeof\` check first. The starter already prints results for a string and a number input.

Expected output (once implemented): two lines, one formatting the string and one the number.`,
      starterCode: `function format(x: string | number): string {
  // TODO: handle both arms. Either use an operation valid for both
  // (e.g. String(x)) or narrow with \`typeof x === "string"\` first.
  return "";
}

console.log(format("hello"));
console.log(format(42));
`,
    },
    {
      id: "literal-union",
      title: "A literal union",
      instructions: `Define a literal-union type \`Direction\` for the four compass directions (\`"north" | "east" | "south" | "west"\`), then write \`turnClockwise(d: Direction): Direction\` that returns the next direction clockwise. Call it and print the result.

Note: the editor rejects any value outside the four members — try typing \`turnClockwise("up")\` and watch the squiggle. Keep the runnable call valid so Run still works.

Expected output: the direction clockwise from \`"north"\` (which is \`"east"\`).`,
      starterCode: `type Direction = "north" | "east" | "south" | "west";

function turnClockwise(d: Direction): Direction {
  // TODO: return the next direction clockwise (north -> east -> south -> west -> north).
  return d;
}

console.log(turnClockwise("north"));
`,
    },
    {
      id: "union-of-objects",
      title: "Union of object types",
      instructions: `You are given two object shapes that **share** a \`name\` property. Type the \`pet\` value as the union \`Cat | Dog\`, then write \`greet(p: Cat | Dog)\` that accesses the shared \`name\` (legal without narrowing) and returns a greeting. Print it.

Expected output: a greeting using the pet's name.`,
      starterCode: `type Cat = { name: string; meows: boolean };
type Dog = { name: string; barks: boolean };

function greet(p: Cat | Dog): string {
  // TODO: only the SHARED property \`name\` is available without narrowing.
  // Use p.name to build a greeting.
  return "";
}

const pet: Cat | Dog = { name: "Whiskers", meows: true };
console.log(greet(pet));
`,
    },
    ],
    quiz: [
      {
        id: "union-types-q1",
        prompt: "Given `x: string | number`, what can you access before narrowing?",
        options: [
          "Only the members of the first arm listed",
          "Nothing at all until you narrow",
          "Only what every arm has in common — the intersection of the members",
          "Everything from both arms; TS checks at runtime",
        ],
        answer: 2,
        explanation: "`x.toUpperCase()` is an error because `number` has no such method, but `String(x)` is fine because it works for both. To use arm-specific members you must first prove which arm you have.",
      },
      {
        id: "union-types-q2",
        prompt: "How does `type Color = \"red\" | \"green\" | \"blue\"` compare to a Java/C# enum at runtime?",
        options: [
          "It compiles to a frozen object with the three members",
          "It compiles to numeric constants with reverse mappings",
          "It creates a runtime `Symbol` per member",
          "It's just plain strings — the type is erased and there is no enum object",
        ],
        answer: 3,
        explanation: "A literal union models a finite set far more tightly than a bare `string`, with zero emitted machinery. TypeScript's own `enum` is the one type construct that *does* emit runtime JavaScript, which is why modern style usually prefers `as const` plus a derived union.",
      },
      {
        id: "union-types-q3",
        prompt: "Why write `type Result = Ok | Err` with distinct object shapes rather than one shape with optional fields?",
        options: [
          "The union makes illegal states unrepresentable and lets a tag narrow to exactly one shape",
          "The union is smaller in the emitted JavaScript",
          "Optional fields aren't allowed in unions",
          "Unions are checked at runtime; optional fields are not",
        ],
        answer: 0,
        explanation: "With everything optional, each field is `T | undefined` everywhere, so you litter the code with `!` and null checks — and nothing stops a nonsensical combination. This is the argument the discriminated-unions lesson develops in full.",
      },
    ],
  },
  {
    id: "narrowing",
    module: "unions-narrowing",
    title: "Narrowing",
    blurb: "typeof, instanceof, in, and truthiness narrowing.",
    content: `## Refining a union inside a branch

On a raw union you only get the members shared by every arm. **Narrowing** is how you prove to the compiler which arm you actually have, so it lets you use arm-specific members. The clever part: these are the *same runtime checks you would write in JavaScript anyway* — TypeScript just also refines the static type along each branch. This is **control-flow analysis**.

## \`typeof\` — primitives

\`\`\`ts
function pad(x: string | number) {
  if (typeof x === "string") {
    return x.padStart(3); // x is string here
  }
  return x.toFixed(2);    // x is number here
}
\`\`\`

Inside the \`if\`, \`x\` is narrowed to \`string\`; in the \`else\` path the compiler knows the only remaining arm is \`number\`.

## \`instanceof\` — classes

\`\`\`ts
function len(x: string | Date) {
  if (x instanceof Date) return x.getTime(); // x is Date
  return x.length;                            // x is string
}
\`\`\`

## \`in\` — property presence

The \`in\` operator narrows object unions by which property exists:

\`\`\`ts
type Fish = { swim: () => void };
type Bird = { fly: () => void };
function move(a: Fish | Bird) {
  if ("swim" in a) a.swim(); // a is Fish
  else a.fly();              // a is Bird
}
\`\`\`

## Truthiness and \`===\`

A truthiness guard removes \`null\`/\`undefined\`; an equality check against a literal narrows a union member:

\`\`\`ts
function shout(s: string | null) {
  if (s) return s.toUpperCase(); // null removed -> s is string
  return "(nothing)";
}
\`\`\`

Unlike a cast (\`as\`), narrowing is *sound* — it is backed by a real runtime check, so the compiler's refinement matches what actually happens at runtime.`,
    exercises: [
    {
      id: "typeof-narrow",
      title: "Narrow with typeof",
      instructions: `Implement \`describe(x: string | number)\` using a \`typeof\` check. In the string branch call a string-only method (e.g. \`.toUpperCase()\`); in the number branch call a number-only method (e.g. \`.toFixed(1)\`). Return a string in each branch. The starter prints both outcomes.

Expected output: two lines — the uppercased string, then the formatted number.`,
      starterCode: `function describe(x: string | number): string {
  // TODO: narrow with \`typeof x === "string"\`.
  // In the string branch use a string-only method; in the other, a number-only method.
  return "";
}

console.log(describe("hello"));
console.log(describe(3.14159));
`,
    },
    {
      id: "in-narrow",
      title: "Narrow with in",
      instructions: `You have a union of two object shapes with a distinguishing property each (\`area\` vs \`radius\`). Implement \`size(s: Square | Circle)\` that narrows with the \`in\` operator and returns the side length or the radius accordingly. Print both.

Expected output: two lines, one for the square and one for the circle.`,
      starterCode: `type Square = { side: number };
type Circle = { radius: number };

function size(s: Square | Circle): number {
  // TODO: narrow with \`"side" in s\` (or \`"radius" in s\`) and return the right field.
  return 0;
}

console.log(size({ side: 4 }));
console.log(size({ radius: 7 }));
`,
    },
    {
      id: "truthiness-narrow",
      title: "Narrow away null",
      instructions: `Implement \`safeUpper(s: string | null)\` with a truthiness guard that removes \`null\` before calling \`.toUpperCase()\`. Return a fallback (e.g. \`"(none)"\`) when the input is \`null\`. The starter prints a real string and a null case.

Expected output: two lines — the uppercased string, then the fallback.`,
      starterCode: `function safeUpper(s: string | null): string {
  // TODO: guard with \`if (s)\` so the compiler knows s is a string inside,
  // then call s.toUpperCase(). Return a fallback for the null case.
  return "";
}

console.log(safeUpper("world"));
console.log(safeUpper(null));
`,
    },
    ],
    quiz: [
      {
        id: "narrowing-q1",
        prompt: "Why is narrowing safer than an `as` assertion?",
        options: [
          "It produces a clearer error message when it fails",
          "It's not safer; it's just more verbose",
          "It's backed by a real runtime check, so the compiler's refinement matches what actually happens",
          "It's checked twice — once at compile time and once at runtime",
        ],
        answer: 2,
        explanation: "The clever part of narrowing is that these are the same runtime checks you'd write in JavaScript anyway — TypeScript's control-flow analysis just also refines the static type along each branch. An `as` asserts a belief with nothing behind it.",
      },
      {
        id: "narrowing-q2",
        prompt: "Which operator narrows an object union by which property exists?",
        options: [
          "`typeof`, which reports the property set",
          "`instanceof`, which checks the prototype chain",
          "`hasOwnProperty`, which TS special-cases",
          "`in` — as in `if (\"swim\" in a) a.swim()`",
        ],
        answer: 3,
        explanation: "`typeof` narrows primitives, `instanceof` narrows classes, and `in` narrows by property presence. Truthiness guards remove `null`/`undefined`, and `===` against a literal narrows a union member — which is what makes discriminated unions work.",
      },
      {
        id: "narrowing-q3",
        prompt: "In `function pad(x: string | number)`, after `if (typeof x === \"string\") { ... return; }`, what is `x` on the following line?",
        options: [
          "`number` — the compiler knows the only remaining arm",
          "`string | number` — narrowing applies only inside the `if`",
          "`unknown`, since the check consumed the type information",
          "`never`, because both arms were handled",
        ],
        answer: 0,
        explanation: "Control-flow analysis tracks what's still possible along each path, not just inside the branch. That's why the else path — or the code after an early return — gets the remaining arm for free.",
      },
    ],
  },
  {
    id: "discriminated-unions",
    module: "unions-narrowing",
    title: "Discriminated Unions",
    blurb: "Tagged unions and switching on the tag.",
    content: `## The tagged-union pattern

Give every member of a union a shared **literal tag** — a field like \`kind\` or \`type\` whose value is a distinct string literal. Then a \`switch\` on that tag narrows to exactly one member per \`case\`. This is the single most useful modeling tool in TypeScript.

\`\`\`ts
type Circle = { kind: "circle"; radius: number };
type Square = { kind: "square"; side: number };
type Triangle = { kind: "triangle"; base: number; height: number };
type Shape = Circle | Square | Triangle;

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":   return Math.PI * s.radius ** 2; // s is Circle
    case "square":   return s.side ** 2;             // s is Square
    case "triangle": return (s.base * s.height) / 2; // s is Triangle
  }
}
\`\`\`

Inside each \`case\`, the compiler narrows \`s\` by the tag, so \`s.radius\` is available in the \`circle\` arm and nowhere else.

## Why not one big optional-field interface?

The naive alternative is a single shape with everything optional:

\`\`\`ts
type BadShape = {
  kind: string;
  radius?: number;
  side?: number;
  base?: number;
  height?: number;
};
\`\`\`

This is worse: \`radius\` is \`number | undefined\` everywhere, so you litter the code with \`!\` or null checks, and nothing stops a nonsensical \`{ kind: "circle", side: 3 }\`. The discriminated union makes **illegal states unrepresentable** — a \`circle\` simply cannot carry a \`side\`.

## Contrast with Java/C#

This fills the role of *sealed classes* + the *visitor pattern*, or an F#/Rust \`enum\`. But there is no class hierarchy and no dispatch object — it is plain data, and the \`switch\` is the visitor. The tag is an ordinary string at runtime; the type is erased.`,
    exercises: [
    {
      id: "model-shapes",
      title: "Model shapes",
      instructions: `Define a discriminated union \`Shape\` of at least two shapes (each with a \`kind\` literal and its own fields — e.g. a circle with \`radius\` and a square with \`side\`). Then implement \`area(s: Shape)\` that \`switch\`es on \`s.kind\`. Print the area of one of each.

Expected output: the numeric areas, one per line.`,
      starterCode: `type Circle = { kind: "circle"; radius: number };
type Square = { kind: "square"; side: number };
type Shape = Circle | Square;

function area(s: Shape): number {
  // TODO: switch on s.kind. In each case the matching fields are available
  // (s.radius for circle, s.side for square). Return the area.
  switch (s.kind) {
    case "circle":
      return 0;
    case "square":
      return 0;
  }
}

console.log(area({ kind: "circle", radius: 2 }));
console.log(area({ kind: "square", side: 3 }));
`,
    },
    {
      id: "tagged-result",
      title: "A tagged result",
      instructions: `Model a result type \`{ ok: true; value: number } | { ok: false; error: string }\` and implement \`render(r: Result)\` that branches on \`r.ok\`, returning a message for each case. Print one \`ok\` outcome and one error outcome.

Expected output: two lines — a success message with the value, and a failure message with the error.`,
      starterCode: `type Result =
  | { ok: true; value: number }
  | { ok: false; error: string };

function render(r: Result): string {
  // TODO: branch on r.ok. When true, r.value is available; when false, r.error is.
  return "";
}

console.log(render({ ok: true, value: 99 }));
console.log(render({ ok: false, error: "not found" }));
`,
    },
    {
      id: "narrow-by-tag",
      title: "Narrow by tag",
      instructions: `You are given a \`UiEvent\` discriminated union. Implement \`describe(e: UiEvent)\` that switches on \`e.type\` and accesses the member-specific field safely in each branch. Print a description for each event kind.

(The type is named \`UiEvent\` rather than \`Event\` on purpose — \`Event\` is a built-in DOM global, and shadowing it would produce confusing errors.)

Expected output: two lines describing a click and a keypress.`,
      starterCode: `type Click = { type: "click"; x: number; y: number };
type KeyPress = { type: "keypress"; key: string };
type UiEvent = Click | KeyPress;

function describe(e: UiEvent): string {
  // TODO: switch on e.type. In the "click" case use e.x / e.y;
  // in the "keypress" case use e.key.
  return "";
}

console.log(describe({ type: "click", x: 10, y: 20 }));
console.log(describe({ type: "keypress", key: "Enter" }));
`,
    },
    ],
    quiz: [
      {
        id: "discriminated-unions-q1",
        prompt: "What makes a union *discriminated*?",
        options: [
          "Every member carries a shared field whose value is a distinct literal type",
          "Every member is an object rather than a primitive",
          "The members are declared with `interface` rather than `type`",
          "A type guard function is defined for each member",
        ],
        answer: 0,
        explanation: "A field like `kind` or `type` with a distinct string literal per member lets a `switch` narrow to exactly one member per case. It's the single most useful modeling tool in TypeScript.",
      },
      {
        id: "discriminated-unions-q2",
        prompt: "What's the concrete problem with modeling shapes as one interface with every field optional?",
        options: [
          "TypeScript rejects interfaces where all fields are optional",
          "Every field is `T | undefined` everywhere, and nothing stops a nonsensical `{ kind: \"circle\", side: 3 }`",
          "Optional fields can't be narrowed by any type guard",
          "The emitted JavaScript is larger",
        ],
        answer: 1,
        explanation: "The discriminated union makes illegal states unrepresentable — a `circle` simply cannot carry a `side`. The optional-field version pushes that burden onto every read site as `!` or null checks.",
      },
      {
        id: "discriminated-unions-q3",
        prompt: "What does a discriminated union replace, coming from Java or C#?",
        options: [
          "Abstract classes with template methods",
          "Reflection over annotated types",
          "Sealed classes plus the visitor pattern — but with plain data and no dispatch object",
          "Generic interfaces with bounded type parameters",
        ],
        answer: 2,
        explanation: "It fills the same role as an F# or Rust `enum`. There is no class hierarchy and no dispatch object — the data is plain, the `switch` is the visitor, and the tag is an ordinary string at runtime because the type is erased.",
      },
    ],
  },
  {
    id: "type-guards-exhaustiveness",
    module: "unions-narrowing",
    title: "Type Guards & Exhaustiveness",
    blurb: "x is T guards and never-based exhaustiveness.",
    content: `## User-defined type guards

The built-in narrowing (\`typeof\`, \`in\`, …) does not cover every shape. A **type guard** is a function whose return type is a *type predicate* \`x is T\`. When it returns \`true\`, the compiler narrows the argument to \`T\` at the call site:

\`\`\`ts
function isString(x: unknown): x is string {
  return typeof x === "string";
}

const vals: unknown[] = ["a", 1, "b"];
const strings = vals.filter(isString); // string[], not unknown[]
\`\`\`

Without the \`x is string\` predicate, \`filter\` would still hand back \`unknown[]\`. The predicate is what teaches \`filter\` the result type.

## Assertion functions (briefly)

A related form *throws* instead of returning a boolean, using \`asserts\`:

\`\`\`ts
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}
\`\`\`

After \`assert(x != null, ...)\`, the compiler treats \`x\` as non-null for the rest of the scope.

## Exhaustiveness with \`never\`

This is the real payoff of discriminated unions. Add a \`default\` case that assigns the value to \`never\`. If every member is handled, the value is narrowed to \`never\` and it compiles. Add a new union member and forget a case, and you get a **compile error** pointing right at it:

\`\`\`ts
function assertNever(x: never): never {
  throw new Error("Unexpected: " + JSON.stringify(x));
}

type Shape = { kind: "circle"; r: number } | { kind: "square"; s: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.r ** 2;
    case "square": return shape.s ** 2;
    default:       return assertNever(shape); // errors if a case is missing
  }
}
\`\`\`

This turns "I added a new variant and forgot to update a switch somewhere" from a runtime bug into a compile-time error — the discipline sealed classes give you in Java, achieved with plain data and one helper.`,
    exercises: [
    {
      id: "type-predicate",
      title: "A type predicate",
      instructions: `Implement \`isString(x: unknown): x is string\` and use it with \`Array.prototype.filter\` to narrow a mixed \`unknown[]\` down to a \`string[]\`. Print the filtered strings.

Expected output: an array containing only the string elements.`,
      starterCode: `function isString(x: unknown): x is string {
  // TODO: return a boolean that is true only for strings.
  return false;
}

const mixed: unknown[] = ["a", 1, "b", true, "c"];
const strings: string[] = mixed.filter(isString);
console.log(strings);
`,
    },
    {
      id: "assert-never",
      title: "assertNever",
      instructions: `Complete the \`area\` switch over the \`Shape\` union so it handles every \`kind\`, and add a \`default\` case that calls \`assertNever(s)\`. With every case handled, \`s\` narrows to \`never\` in the default and it compiles. Print an area for each shape.

Try it: add a third member to \`Shape\` and watch the \`default\` line error until you add its case. Keep the runnable version exhaustive so Run works.

Expected output: the numeric areas, one per line.`,
      starterCode: `type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; s: number };

function assertNever(x: never): never {
  throw new Error("Unexpected case: " + JSON.stringify(x));
}

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      // TODO: return the circle's area using s.r
      return 0;
    case "square":
      // TODO: return the square's area using s.s
      return 0;
    default:
      return assertNever(s);
  }
}

console.log(area({ kind: "circle", r: 2 }));
console.log(area({ kind: "square", s: 3 }));
`,
    },
    {
      id: "guard-a-union",
      title: "Guard a union",
      instructions: `Write a custom type guard \`isAdmin(u: User): u is Admin\` that distinguishes the two object shapes in the \`User\` union (an admin has a \`permissions\` array; a guest does not). Use it to branch and return a different message for each. Print both.

Expected output: two lines — one for the admin, one for the guest.`,
      starterCode: `type Admin = { name: string; permissions: string[] };
type Guest = { name: string };
type User = Admin | Guest;

function isAdmin(u: User): u is Admin {
  // TODO: return true only when u has the \`permissions\` field (use the \`in\` operator).
  return false;
}

function describe(u: User): string {
  if (isAdmin(u)) {
    // u is Admin here — u.permissions is available
    return "";
  }
  return "";
}

console.log(describe({ name: "Root", permissions: ["read", "write"] }));
console.log(describe({ name: "Visitor" }));
`,
    },
    ],
    quiz: [
      {
        id: "type-guards-exhaustiveness-q1",
        prompt: "What does the return type `x is string` do on `function isString(x: unknown)`?",
        options: [
          "It's a type predicate — when the function returns true, the compiler narrows the argument at the call site",
          "It asserts at runtime and throws when false",
          "It's documentation only; TS ignores it",
          "It constrains the parameter so only strings can be passed",
        ],
        answer: 0,
        explanation: "Without the predicate, `vals.filter(isString)` would still hand back `unknown[]`. The predicate is what teaches `filter` the result type — it's how you extend narrowing beyond the built-in `typeof`/`in`/`instanceof` checks.",
      },
      {
        id: "type-guards-exhaustiveness-q2",
        prompt: "How does `default: return assertNever(shape)` catch a missing switch case?",
        options: [
          "The compiler special-cases any function named `assertNever`",
          "If every member is handled, `shape` narrows to `never` and the call type-checks; an unhandled member makes it non-`never` and errors",
          "It throws at runtime, which surfaces the gap during testing",
          "`assertNever` uses reflection to enumerate the union's members",
        ],
        answer: 1,
        explanation: "This is the real payoff of discriminated unions. Adding a new variant and forgetting a switch somewhere turns from a runtime bug into a compile error pointing right at it — the discipline sealed classes give you, achieved with plain data and one helper.",
      },
      {
        id: "type-guards-exhaustiveness-q3",
        prompt: "What does an `asserts cond` return type do?",
        options: [
          "It narrows only inside the asserting function's body",
          "It requires the caller to wrap the call in a try/catch",
          "After the call, the compiler treats the condition as true for the rest of the scope",
          "It converts a thrown error into a typed result",
        ],
        answer: 2,
        explanation: "It's the throwing counterpart to a boolean type guard. After `assert(x != null, ...)`, `x` is non-null for everything that follows — control-flow analysis knows the alternative would have thrown.",
      },
    ],
  },
];
