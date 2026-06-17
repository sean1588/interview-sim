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
  },
];
