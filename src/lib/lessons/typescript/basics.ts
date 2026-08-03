import type { Lesson } from "../types";

export const basicsLessons: Lesson[] = [
  {
    id: "what-is-typescript",
    module: "basics",
    title: "TypeScript on Top of JavaScript",
    blurb: "A static type layer over JS, checked then erased.",
    content: `## TypeScript = JavaScript + a static type layer

Every line of JavaScript you already know is valid TypeScript. TypeScript adds a **static type layer** on top: annotations and checks that catch mistakes *before* the code runs. The crucial fact is what happens next — those types are **erased**.

\`\`\`ts
function greet(name: string): string {
  return \`Hi, \${name}\`;
}
\`\`\`

Run this through the compiler and the emitted JavaScript is just:

\`\`\`js
function greet(name) {
  return \`Hi, \${name}\`;
}
\`\`\`

The \`: string\` annotations are gone. **There are no runtime type checks, no reflectable type metadata, no runtime cost.** This is the opposite of Java/C#, where types are enforced by the VM and partly present at runtime (you can \`getClass()\` / \`typeof\`-reflect). In TS, if a wrong-typed value sneaks in at the boundary (JSON, an \`any\`, a bad cast), nothing stops it at runtime — the type system only ever ran at compile time.

## Structural, not nominal

TS typing is **structural**: compatibility is decided by *shape*, not by name or declared inheritance. If an object has the right properties, it fits — no \`implements\` required.

\`\`\`ts
interface Named { name: string }
const dog = { name: "Rex", legs: 4 };
const n: Named = dog; // OK: dog has a \`name\`, so it IS Named-shaped
\`\`\`

A Java/C# developer expects this to need an explicit \`implements Named\`. TS does not — same shape, same type.

## The transpile model

\`tsc\` (or \`ts.transpileModule\` for a single file) does two jobs: **type-check** and **emit JS**. They are separable. A type-only build (\`tsc --noEmit\`) checks without producing output; bundlers often *strip types and emit without checking at all*. Turning on **strict mode** (\`"strict": true\` in \`tsconfig.json\`) enables the good defaults — \`noImplicitAny\`, strict null checks — and is what idiomatic TS assumes.

## How THIS course runs your code

Important: the editor here is **transpile-and-run**. Your code is type-stripped and executed — there is *no separate type-check gate*. So a **type error does not block Run**; it appears only as a **red squiggle** in the editor. Watch the squiggles for type feedback, and watch the output console for runtime behavior. They are two independent signals.`,
    exercises: [
    {
      id: "annotate-and-run",
      title: "Annotate, then run",
      instructions: `The snippet below is plain, untyped JavaScript. Add TypeScript **annotations** without changing any behavior:

- annotate \`label\` as \`string\`
- annotate the function's parameters \`price\` and \`rate\` as \`number\`, and its **return type** as \`number\`

Then Run. The point: the output is identical to before, because types are **erased** before execution.

Expected output:

\`\`\`
subtotal 108
\`\`\``,
      starterCode: `// Original untyped snippet:
//   function priceWithTax(price, rate) { return price + price * rate; }
//   const label = "subtotal";
//
// TODO: add type annotations to \`label\`, and to the function's
// parameters and return type. The runtime behavior must NOT change —
// types are erased before this code runs.

const label = "subtotal"; // TODO: annotate as string

function priceWithTax(price, rate) {
  // TODO: annotate price: number, rate: number, and the return type
  return price + price * rate;
}

console.log(label, priceWithTax(100, 0.08));
`,
    },
    {
      id: "spot-the-squiggle",
      title: "Squiggle, not a blocker",
      instructions: `The value below is the **number** \`42\` but is annotated as \`string\`. That is a genuine type mismatch, so the editor shows a **red squiggle** on the annotation. Yet it still **Runs** — in this transpile-and-run engine the squiggle is the *only* signal; the type error does not block Run.

Fix it: change the annotation to the correct type (\`number\`). The squiggle should disappear and it should still Run.

Expected output:

\`\`\`
answer is 42
\`\`\``,
      starterCode: `// This file RUNS even though there is a real type mismatch: the value is the
// number 42, but it is annotated as \`string\`. In this transpile-and-run
// engine the type error shows ONLY as a red squiggle in the editor — it does
// not block Run.
//
// TODO: change the annotation to the correct type so the squiggle goes away
// (the value is a number, so the annotation should be \`number\`). Keep the
// code runnable.

const answer: string = 42; // TODO: annotate as number to clear the squiggle

console.log("answer is", answer);
`,
    },
    ],
    quiz: [
      {
        id: "what-is-typescript-q1",
        prompt: "What happens to a `: string` annotation after compilation?",
        options: [
          "It's stored as metadata the runtime can reflect over",
          "It's converted to a JSDoc comment in the emitted JavaScript",
          "It's erased — no runtime type checks, no reflectable metadata, no runtime cost",
          "It becomes a runtime assertion that throws on a wrong type",
        ],
        answer: 2,
        explanation: "This is the opposite of Java/C#, where types are enforced by the VM and partly present at runtime. In TS, if a wrong-typed value sneaks in at a boundary — JSON, an `any`, a bad cast — nothing stops it, because the type system only ever ran at compile time.",
      },
      {
        id: "what-is-typescript-q2",
        prompt: "`const dog = { name: \"Rex\", legs: 4 }` is assigned to `const n: Named = dog` where `Named` requires only `name`. Why does this compile?",
        options: [
          "TypeScript ignores extra properties on all assignments",
          "`Named` is an interface, and interfaces are always satisfied implicitly at runtime",
          "It doesn't compile — `dog` needs `implements Named`",
          "TypeScript is structurally typed — compatibility is decided by shape, not by a declared relationship",
        ],
        answer: 3,
        explanation: "A Java or C# developer expects an explicit `implements Named`. TS just compares shapes: `dog` has a `name`, so it is `Named`-shaped. (An object *literal* passed directly would trigger the separate excess-property check.)",
      },
      {
        id: "what-is-typescript-q3",
        prompt: "In this course's editor, what happens when you Run code containing a type error?",
        options: [
          "It runs — the code is type-stripped and executed, so the error appears only as a red squiggle",
          "The Run button is disabled until the error is fixed",
          "It throws a TypeError at runtime where the annotation was",
          "It runs but prints the type error to the output console first",
        ],
        answer: 0,
        explanation: "The editor is transpile-and-run with no separate type-check gate. Squiggles are your type feedback and the console is your runtime feedback — two independent signals. `tsc --noEmit` is what gates types in a real project.",
      },
    ],
  },
  {
    id: "primitives-and-inference",
    module: "basics",
    title: "Primitives, Literals, and Inference",
    blurb: "Annotations, inference, and any vs unknown vs never.",
    content: `## Primitive annotations

The core scalar types are lowercase: \`string\`, \`number\`, \`boolean\`, plus \`null\` and \`undefined\`. Note **one** numeric type — \`number\` covers ints and floats alike (no \`int\`/\`long\`/\`double\` split like Java). There is also \`bigint\` and \`symbol\`, but you rarely annotate those.

\`\`\`ts
const host: string = "localhost";
const port: number = 5432;
const tls: boolean = true;
\`\`\`

## Arrays and tuples

Arrays are \`T[]\` or the equivalent \`Array<T>\` (pick a style and stay consistent — \`T[]\` is more common). A **tuple** is a fixed-length, position-typed array — something JS has no concept of:

\`\`\`ts
const tags: string[] = ["a", "b"];
const nums: Array<number> = [1, 2, 3];
const point: [number, number] = [3, 4]; // exactly two numbers
\`\`\`

## Literal types and widening

A **literal type** is a single value used as a type: \`"GET"\`, \`42\`, \`true\`. Combine them with \`|\` into a union — the idiomatic alternative to string enums:

\`\`\`ts
type Method = "GET" | "POST";
const m: Method = "POST"; // "PUT" would be a type error
\`\`\`

\`const\` vs \`let\` changes what TS **infers**. \`const\` can never be reassigned, so TS narrows to the literal; \`let\` can be reassigned, so TS **widens** to the base type:

\`\`\`ts
const a = "GET"; // type: "GET"  (literal, narrowed)
let b = "GET";   // type: string  (widened)
\`\`\`

Rule of thumb: **let inference do the work** for locals; annotate at boundaries (function params, return types, exported values) where you want the contract pinned down.

## The special types

- **\`any\`** — opts out of checking entirely. A hole in the type system: anything goes, nothing is caught. Avoid it.
- **\`unknown\`** — the **top type**. Anything is assignable *to* it, but you can do nothing *with* it until you **narrow** (via \`typeof\`, a check, etc.). The safe counterpart to \`any\`.
- **\`never\`** — the **bottom type**: a value that can never exist (a function that always throws, the impossible branch of an exhaustive switch).
- **\`void\`** — "no useful return value" (a function that returns nothing meaningful).

\`\`\`ts
let x: unknown = JSON.parse("123");
// x.toFixed(2);            // error: must narrow first
if (typeof x === "number") x.toFixed(2); // OK
\`\`\`

Reach for \`unknown\` over \`any\` whenever a value's type is genuinely not known yet.`,
    exercises: [
    {
      id: "annotate-primitives",
      title: "Annotate primitives",
      instructions: `Replace each \`any\` with the correct annotation so the editor is satisfied, then Run:

- \`title\` → \`string\`
- \`year\` → \`number\`
- \`published\` → \`boolean\`
- \`tags\` → a string array (\`string[]\` or \`Array<string>\`)
- \`point\` → a tuple \`[number, number]\`
- \`lengthOf\` → give its parameter a type and a return type

Expected output:

\`\`\`
TypeScript 2012 true ["typed","structural"] [3,4] 10
\`\`\``,
      starterCode: `// TODO: replace each \`any\` with the correct annotation:
//   - title: string
//   - year: number
//   - published: boolean
//   - tags: a string array (string[] or Array<string>)
//   - point: a tuple of [number, number]
//   - and give \`lengthOf\` a parameter type and a return type.

const title: any = "TypeScript";
const year: any = 2012;
const published: any = true;
const tags: any = ["typed", "structural"];
const point: any = [3, 4];

function lengthOf(text): any {
  return text.length;
}

console.log(title, year, published, tags, point, lengthOf(title));
`,
    },
    {
      id: "literal-and-inference",
      title: "Literals and widening",
      instructions: `\`widened\` is declared with \`let\`, so TS infers its type as \`string\` (widened). Now pin a value down with a literal union:

- Declare \`method\` with the type \`"GET" | "POST"\` and assign it \`"POST"\`.
- Try assigning \`"PUT"\` to see the editor squiggle, then change it back to a valid value.

Print both. Expected output:

\`\`\`
GET POST
\`\`\``,
      starterCode: `// \`let\` WIDENS: \`widened\` is inferred as \`string\`, so it could later be any
// string. \`const\` (or a literal-union annotation) NARROWS to the literal.
//
// TODO: declare \`method\` with the literal-union type "GET" | "POST" and
// assign it "POST" (try assigning "PUT" to see the editor squiggle, then
// fix it back). Print both values.

let widened = "GET"; // inferred type: string (widened)

// TODO: const method: "GET" | "POST" = "POST";
const method = "POST";

console.log(widened, method);
`,
    },
    {
      id: "any-vs-unknown",
      title: "any vs unknown",
      instructions: `\`shout\` takes an \`unknown\`. You can't call \`.toUpperCase()\` on it directly — TS forces you to **narrow** first. Inside the function, add a \`typeof value === "string"\` guard: when it's a string, return the uppercased value; otherwise return \`"not a string"\`.

(Contrast: typing the parameter as \`any\` would let \`.toUpperCase()\` through unchecked — and crash at runtime on a number.)

Expected output:

\`\`\`
HELLO
not a string
\`\`\``,
      starterCode: `// \`unknown\` is the safe top type: you must NARROW it before using it.
// \`any\` is a hole: it skips checking entirely.
//
// TODO: inside \`shout\`, narrow \`value\` with a \`typeof value === "string"\`
// check before calling \`.toUpperCase()\`. Return the uppercased string when
// it is a string, otherwise return "not a string".

function shout(value: unknown): string {
  // TODO: add the typeof narrowing guard here
  return "not a string";
}

console.log(shout("hello")); // should print HELLO once you narrow
console.log(shout(42)); // should print: not a string
`,
    },
    ],
    quiz: [
      {
        id: "primitives-and-inference-q1",
        prompt: "What are the inferred types of `const a = \"GET\"` and `let b = \"GET\"`?",
        options: [
          "Both are `string`",
          "Both are the literal type `\"GET\"`",
          "`a` is `string`; `b` is `\"GET\"`",
          "`a` is the literal type `\"GET\"`; `b` is widened to `string`",
        ],
        answer: 3,
        explanation: "A `const` can never be reassigned, so TS narrows to the literal. A `let` can be, so TS widens to the base type. This is why `as const` matters for object literals, whose properties widen the same way.",
      },
      {
        id: "primitives-and-inference-q2",
        prompt: "What's the difference between `any` and `unknown`?",
        options: [
          "Anything is assignable to `unknown`, but you can do nothing with it until you narrow — `any` opts out of checking entirely",
          "`unknown` is a runtime type check; `any` is compile-time only",
          "`any` accepts anything; `unknown` accepts only object types",
          "They're aliases, but `unknown` is the modern spelling",
        ],
        answer: 0,
        explanation: "`any` is a hole in the type system: anything goes, nothing is caught, and it spreads to everything you pull off it. `unknown` is the safe top type — the same \"I don't know yet\" with the opposite default. Reach for it whenever a value's type is genuinely not known yet.",
      },
      {
        id: "primitives-and-inference-q3",
        prompt: "What is `never`?",
        options: [
          "The type of `null` under strict null checks",
          "The bottom type — a value that can never exist, like the return of a function that always throws",
          "The type of a variable that hasn't been assigned yet",
          "A synonym for `void`",
        ],
        answer: 1,
        explanation: "`never` is what you get for the impossible branch of an exhaustive switch, which is what makes the `assertNever` exhaustiveness trick work. `void` is different — it means \"no useful return value,\" not \"no value can exist.\"",
      },
    ],
  },
  {
    id: "type-vs-value",
    module: "basics",
    title: "Type Space vs Value Space",
    blurb: "typeof type operator, aliases, and the as escape hatch.",
    content: `## Two separate worlds

TypeScript code lives in **two namespaces that don't overlap**. A \`type\` or \`interface\` declaration exists only in **type space** — it produces *no* runtime value. A \`const\` or \`function\` produces a runtime **value** but, on its own, no *named type*. They can even share a name without colliding:

\`\`\`ts
type User = { id: number };     // type space only — emits nothing
const User = { id: 1 };         // value space only
\`\`\`

After compilation the \`type User\` line is gone entirely; only the \`const\` survives.

## Bridging with the \`typeof\` TYPE operator

To go from a value to its type, use the **\`typeof\` type operator**. This is a *different* \`typeof\` from the JS runtime one — same keyword, but it lives in type space and yields a type, not a string:

\`\`\`ts
const defaults = { retries: 3, timeoutMs: 1000 };
type Options = typeof defaults; // { retries: number; timeoutMs: number }

const custom: Options = { retries: 5, timeoutMs: 500 };
\`\`\`

You'll see it constantly with \`as const\` and \`keyof typeof\` to derive types from a single source of truth instead of hand-writing them twice.

## Type aliases

\`type\` names any type — not just object shapes, but unions, tuples, functions:

\`\`\`ts
type Method = "GET" | "POST";
type Handler = (req: string) => void;
\`\`\`

## The \`as\` assertion — an unchecked escape hatch

\`as\` tells the compiler "treat this as type X, trust me." It performs **no runtime conversion and no check** — it can **lie**, and when it does, you get a runtime crash with no warning:

\`\`\`ts
const data: unknown = 42;
const s = data as string; // compiles fine...
// s.toUpperCase();        // ...throws at runtime: 42 has no toUpperCase
\`\`\`

Prefer **narrowing** (a \`typeof\`/\`in\`/\`instanceof\` check) over \`as\` — narrowing is *verified* by the compiler and reflects the real runtime value. Use \`as\` only when you genuinely know more than the checker (e.g. a freshly-parsed shape you've already validated).

The **non-null assertion** \`!\` is a focused form: \`value!\` asserts "this is not \`null\`/\`undefined\`." Same caveat — it's an unchecked promise:

\`\`\`ts
const el = document.getElementById("app")!; // "I promise it exists"
\`\`\`

Unlike languages with runtime reflection (Java/C# \`getClass\`, attributes), TS has **nothing to fall back on at runtime** — so an assertion that's wrong is simply a bug waiting to fire.`,
    exercises: [
    {
      id: "typeof-operator",
      title: "Derive a type with typeof",
      instructions: `Use the **\`typeof\` type operator** to derive a type from the \`config\` object instead of writing it by hand:

- Declare \`type Config = typeof config\`.
- Annotate \`replica\` as \`Config\` and give it its own host/port values.

Print both objects. Expected output:

\`\`\`
{"host":"localhost","port":5432} {"host":"replica.local","port":5433}
\`\`\``,
      starterCode: `// The \`typeof\` TYPE operator derives a type from a value. (This is distinct
// from the JS runtime \`typeof\`, which returns a string.)
//
//   type Config = typeof config;  // { host: string; port: number }
//
// TODO: declare \`type Config = typeof config\`, then annotate \`replica\` with
// \`Config\` and give it its own values. Print both objects.

const config = {
  host: "localhost",
  port: 5432,
};

// TODO: type Config = typeof config;

// TODO: const replica: Config = { host: "replica.local", port: 5433 };
const replica = { host: "replica.local", port: 5433 };

console.log(config, replica);
`,
    },
    {
      id: "assertion-danger",
      title: "When as lies",
      instructions: `\`raw\` is really a \`number\`, but the commented-out \`(raw as string)\` would compile and then **crash at runtime** — the assertion lies.

Implement the **safe path** in \`safeUpper\`: instead of asserting, **narrow** with a \`typeof value === "string"\` check, return \`value.toUpperCase()\` when it's a string, and keep the existing fallback otherwise.

Expected output:

\`\`\`
(not a string)
OK
\`\`\``,
      starterCode: `// \`as\` is an UNCHECKED assertion — it tells the compiler "trust me" and can
// LIE. Here \`raw\` is really a number, but the unsafe path asserts it is a
// string, so \`.toUpperCase\` is \`undefined\` at runtime.
//
// TODO: implement the SAFE path: narrow \`raw\` with a typeof check instead of
// asserting, and return an uppercased string only when it really is a string.

const raw: unknown = 42;

// The dangerous version (do NOT use): compiles, but lies.
//   const bad = (raw as string).toUpperCase(); // throws at runtime

function safeUpper(value: unknown): string {
  // TODO: narrow with typeof, then return value.toUpperCase()
  return "(not a string)";
}

console.log(safeUpper(raw)); // number -> (not a string)
console.log(safeUpper("ok")); // string -> OK once you narrow
`,
    },
    ],
    quiz: [
      {
        id: "type-vs-value-q1",
        prompt: "Can `type User = { id: number }` and `const User = { id: 1 }` coexist in one file?",
        options: [
          "Only if the type is declared with `interface` instead",
          "Yes — types and values live in separate namespaces that don't collide",
          "No — the second declaration shadows the first",
          "No — it's a duplicate-identifier error",
        ],
        answer: 1,
        explanation: "Type space and value space don't overlap. After compilation the `type` line is gone entirely and only the `const` survives. This is exactly what lets the `as const` + derived-union pattern reuse one name for both.",
      },
      {
        id: "type-vs-value-q2",
        prompt: "How does the `typeof` *type* operator differ from JavaScript's `typeof`?",
        options: [
          "It's the same operator; TypeScript just allows it in more positions",
          "It performs a runtime check that TS then narrows on",
          "It lives in type space and yields a type, not a runtime string",
          "It works on types rather than values, and returns their names as strings",
        ],
        answer: 2,
        explanation: "Same keyword, two different operators. `type Options = typeof defaults` derives an object type from a value, and you'll see it constantly with `as const` and `keyof typeof` to keep a single source of truth rather than hand-writing the type twice.",
      },
      {
        id: "type-vs-value-q3",
        prompt: "`const s = data as string` where `data` is actually `42`. What happens?",
        options: [
          "It throws immediately at the assertion",
          "It coerces 42 to the string \"42\"",
          "It's a compile error, since `unknown` can't be asserted to `string`",
          "It compiles fine and crashes later — `as` performs no runtime conversion and no check",
        ],
        answer: 3,
        explanation: "`as` tells the compiler \"trust me\" and it obeys. Prefer narrowing — a `typeof`/`in`/`instanceof` check — which is *verified* and reflects the real runtime value. The non-null `!` is the same unchecked promise in focused form.",
      },
    ],
  },
];
