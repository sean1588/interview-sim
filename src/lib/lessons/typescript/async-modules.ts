import type { Lesson } from "../types";

export const asyncModulesLessons: Lesson[] = [
  {
    id: "typing-async",
    module: "async-modules",
    title: "Typing Async Code",
    blurb: "Promise<T>, await, and unknown in catch.",
    content: `## \`Promise<T>\` is the type of an in-flight value

The runtime semantics of \`async\`/\`await\` are exactly the JavaScript you already know — TypeScript only adds the types on top. The one rule to internalize: an \`async\` function **always** returns a \`Promise\`, and its annotation is \`Promise<T>\` where \`T\` is the resolved value.

\`\`\`ts
async function getCount(): Promise<number> {
  return 42;           // a bare number, but TS wraps it in Promise<number>
}

const n: number = await getCount(); // await unwraps Promise<number> -> number
\`\`\`

Note the asymmetry: inside the body you \`return\` a plain \`number\`, but the declared return type is \`Promise<number>\`. \`await\` is the inverse — it unwraps \`Promise<T>\` back to \`T\`. Annotating the return type wrong (\`Promise<string>\` here) is a compile error, even though the runtime would happily resolve to a number.

## Typing \`Promise.all\` — a tuple of results

\`Promise.all\` is generic over a *tuple*, so each resolved value keeps its own type by position — this is far better than \`any[]\`:

\`\`\`ts
async function load(): Promise<[number, string]> {
  const [count, name] = await Promise.all([getCount(), getName()]);
  //      ^number       ^string  — positions preserved, not a union
  return [count, name];
}
\`\`\`

## The caught value is \`unknown\`

In JavaScript you can \`throw\` *anything* — a string, a number, \`null\`. So under modern strict TS (\`useUnknownInCatchVariables\`) the catch binding is typed **\`unknown\`**, not \`any\`. You must narrow before reading properties:

\`\`\`ts
try {
  risky();
} catch (err: unknown) {
  // err.message;  // ERROR: 'err' is of type 'unknown'
  if (err instanceof Error) {
    console.log(err.message); // narrowed to Error -> .message is safe
  }
}
\`\`\`

Unlike Java/C#, you do not catch a typed exception class in the \`catch (...)\` clause — there is one binding, always \`unknown\`, and you narrow it yourself with \`instanceof\`.

## A note on these exercises

The in-browser runner captures **synchronous** \`console.log\` output only — an awaited result may *not* appear in Run output, because the log fires before the microtask resolves. So center the runnable parts on the **types** and on synchronous illustration: log the \`Promise\` object itself, or throw and catch synchronously, rather than relying on an awaited value showing up.`,
    exercises: [
    {
      id: "type-a-promise",
      title: "Type a Promise",
      instructions: `Write an \`async\` function \`fetchAnswer\` with an explicit **\`Promise<number>\`** return type whose body simply \`return\`s a number. Then, in a synchronous caller, log something about the *returned promise itself* — e.g. that it is a \`Promise\`.

The point is the annotation: an \`async\` function returns \`Promise<number>\` even though the body returns a bare \`number\`. Do **not** rely on an awaited value appearing in the output — the runner only captures synchronous logs.

Expected output: a line confirming the call returns a Promise, e.g. \`fetchAnswer() returns a Promise: true\`.`,
      starterCode: `// An \`async\` function ALWAYS returns a Promise. The explicit return type is
// \`Promise<number>\` even though the body just \`return\`s a number — TS wraps it.
async function fetchAnswer(): Promise<number> {
  // TODO: replace the placeholder below with the answer you want this function
  // to resolve to — a bare \`number\`. TS wraps it in Promise<number> for you.
  // Experiment: change the annotation to Promise<string> and watch the editor
  // complain that a \`number\` is not assignable.
  return 0; // <- your number here
}

// Synchronous illustration (leave this as-is — it must run): calling the async
// function hands back a Promise *now*, before any awaited value is ready. The
// runner only captures sync console output, so we inspect the Promise object
// itself rather than its eventual result.
const pending: Promise<number> = fetchAnswer();
console.log("fetchAnswer() returns a Promise:", pending instanceof Promise);
`,
    },
    {
      id: "narrow-catch",
      title: "Narrow unknown in catch",
      instructions: `Inside \`describeError\`, a \`try\` block \`throw\`s an \`Error\` and the \`catch\` binding is typed **\`unknown\`**. Narrow it with \`if (err instanceof Error)\` before reading \`err.message\`, and return a message built from it.

The throw and catch are synchronous, so the handled message appears on Run. Reading \`err.message\` *without* narrowing is a compile error — \`err\` is \`unknown\`.

Expected output: one line containing the handled error text, e.g. \`handled: disk is full\`.`,
      starterCode: `// In modern TS (\`useUnknownInCatchVariables\`), the caught value is \`unknown\`,
// not \`any\` — because JS lets you \`throw\` literally anything. You must narrow
// before touching \`.message\`.
function describeError(): string {
  try {
    // Thrown and caught synchronously so the output appears on Run.
    throw new Error("disk is full");
  } catch (err: unknown) {
    // TODO: narrow \`err\` with \`if (err instanceof Error)\`, then return a
    // message built from \`err.message\`. Reading err.message without narrowing
    // is a compile error, because \`err\` is typed \`unknown\` here.
    return "TODO: narrow err and read its message";
  }
}

console.log(describeError());
`,
    },
    ],
  },
  {
    id: "modules-and-tooling",
    module: "async-modules",
    title: "Modules, import type, and tsconfig",
    blurb: "ES modules, type-only imports, and the toolchain.",
    content: `## ES modules in TypeScript

TypeScript speaks standard **ES module** syntax — the same \`import\`/\`export\` you know from modern JS, just with types flowing across the boundary. Named and default exports both work:

\`\`\`ts
// math.ts
export function add(a: number, b: number): number { return a + b; }
export const PI = 3.14159;
export default class Calculator { /* ... */ }

// app.ts
import Calculator, { add, PI } from "./math";
\`\`\`

A file with a top-level \`import\`/\`export\` *is* a module — its top-level names are scoped to the file, not global. (This single-file runner can't resolve modules, so this lesson has no exercises — read and absorb.)

## \`import type\` — erased, cycle-safe imports

When you import something used **only as a type**, prefer \`import type\`. It is guaranteed to be erased at compile time, so it emits no runtime \`require\`/\`import\` — which avoids accidental side effects and breaks import cycles that would otherwise deadlock at load time:

\`\`\`ts
import type { User } from "./models";   // erased — no runtime import
import { saveUser } from "./db";        // real runtime import

function format(u: User): string { return u.name; }
\`\`\`

This distinction has no analogue in Java/C#, where imports are purely compile-time. In TS it matters because \`import\` normally *also* emits runtime code. You can also inline it: \`import { saveUser, type User } from "./db"\`.

## \`.d.ts\` files and \`@types/*\`

A **declaration file** (\`.d.ts\`) carries *types only* — no implementation — and is how you put a TypeScript face on plain JavaScript. For the huge body of untyped npm packages, the community ships types separately under the \`@types/*\` scope (DefinitelyTyped):

\`\`\`bash
npm i lodash
npm i -D @types/lodash   # types for an untyped JS library
\`\`\`

Many modern packages bundle their own \`.d.ts\`, so you only reach for \`@types/*\` when a library ships none.

## \`tsconfig.json\` essentials

A few keys carry most of the weight:

\`\`\`jsonc
{
  "compilerOptions": {
    "strict": true,            // turn on every soundness check — always start here
    "target": "ES2020",       // JS version to emit
    "module": "ESNext",       // module format of the output
    "lib": ["ES2020", "DOM"], // ambient APIs available (e.g. DOM, newer stdlib)
    "esModuleInterop": true    // let \`import x from "cjs-pkg"\` work smoothly
  }
}
\`\`\`

\`strict\` is the one that defines whether you are writing real TypeScript: it enables \`strictNullChecks\`, \`noImplicitAny\`, \`useUnknownInCatchVariables\` (the \`unknown\` catch from the last lesson), and more. Treat it as non-negotiable on new projects.

## The toolchain

- **\`tsc\`** — the compiler. Type-checks and emits JS. \`tsc --noEmit\` is the canonical "just type-check" step in CI.
- **\`tsx\`** / **\`ts-node\`** — run a \`.ts\` file directly during development, no separate build step.
- **ESLint + \`@typescript-eslint\`** — lint rules that understand the type system (e.g. flag a floating, un-awaited Promise). \`tsc\` checks *types*; ESLint enforces *style and patterns*. You want both.`,
    exercises: [],
  },
];
