import type { Lesson } from "../types";

export const genericsLessons: Lesson[] = [
  {
    id: "generic-functions",
    module: "generics",
    title: "Generic Functions",
    blurb: "Type parameters, inference, and constraints.",
    content: `A **generic** function takes *type parameters* — placeholders for types, written in angle brackets — so one function can work over many types while still relating them. The canonical example links input and output with a single \`T\`:

\`\`\`ts
function identity<T>(x: T): T {
  return x;
}
\`\`\`

The payoff vs JavaScript: \`identity\` is fully typed for every caller without \`any\`. \`identity(5)\` is \`number\`, \`identity("hi")\` is \`string\` — the type flows *through*.

**Inference does the work.** You almost never write the type argument; TS infers \`T\` from how you call it:

\`\`\`ts
identity(5);        // T = number
identity(["a"]);    // T = string[]
identity<boolean>(true); // explicit, but rarely needed
\`\`\`

**Multiple type parameters** are independent:

\`\`\`ts
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}
pair("id", 42); // [string, number]
\`\`\`

**Constraints** with \`extends\` say "T must be at least this shape", which unlocks members inside the body. Without the constraint, \`T\` is opaque and \`.length\` won't compile:

\`\`\`ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
longest("kiwi", "melon"); // ok: strings have .length
longest([1], [1, 2]);     // ok: arrays do too
\`\`\`

**Default type parameters** supply a fallback when inference has nothing to go on: \`function make<T = string>(): T[] { return []; }\`.

**Why a generic beats \`any\`:** \`any\` *throws the type away* — \`function id(x: any): any\` lets the result be used as anything, errors and all. A generic *preserves and relates* types: the return is tied to the argument.

**Contrast with Java/C#:** their generics are nominal — a constraint is satisfied by *declared* inheritance (\`implements\`/\`extends\`). TS generics are **structural**: a constraint is satisfied by *shape*, no declaration needed. And like Java (but unlike C#, whose generics are reified), TS generics are **fully erased** — there is no \`T\` at runtime, so no \`new T()\`, no \`typeof T\`, no reflection over type parameters.`,
    exercises: [
    {
      id: "generic-identity",
      title: "A generic helper",
      instructions: `Implement the generic \`firstOrNull<T>(arr: T[]): T | null\` so it returns the first element, or \`null\` when the array is empty.

Call it on an array of numbers and an array of strings (let inference pick \`T\` — no explicit type argument). Note the inferred return types: \`number | null\` and \`string | null\`.

Expected output: the first number, the first word, and \`null\` for the empty array.`,
      starterCode: `// firstOrNull returns the first element of an array, or null if it's empty.
// The <T> ties the element type to the return type: T[] in, T | null out.
function firstOrNull<T>(arr: T[]): T | null {
  // TODO: return the first element if there is one, otherwise null
  return null;
}

// Inference picks T for you: number here, string below — no <T> at the call site.
const nums = [10, 20, 30];
const words = ["a", "b"];

console.log("first number:", firstOrNull(nums)); // inferred: number | null
console.log("first word:  ", firstOrNull(words)); // inferred: string | null
console.log("empty:       ", firstOrNull<number>([])); // null
`,
    },
    {
      id: "constrained-generic",
      title: "A constrained generic",
      instructions: `Implement \`longest<T extends { length: number }>(a: T, b: T): T\` so it returns whichever argument has the larger \`.length\` (on a tie, return \`a\`).

The constraint is what makes \`.length\` readable inside the body. Call it once on two strings and once on two arrays, and print both results.

Expected output: the longer string, then the longer array.`,
      starterCode: `// longest returns whichever argument has the greater \`.length\`.
// The constraint \`T extends { length: number }\` is what lets us read \`.length\`
// inside the body — without it, TS knows nothing about T.
function longest<T extends { length: number }>(a: T, b: T): T {
  // TODO: return whichever of a or b has the larger .length (ties -> a)
  return a;
}

// Works for strings...
console.log("string:", longest("kiwi", "watermelon"));
// ...and for arrays, because both have a numeric .length.
console.log("array: ", longest([1, 2], [1, 2, 3, 4]));
`,
    },
    {
      id: "generic-pair",
      title: "Two type parameters",
      instructions: `Implement \`pair<A, B>(a: A, b: B): [A, B]\` so it returns the two arguments as a tuple.

Use it with two different element types (e.g. a \`string\` and a \`number\`) and print the resulting tuple. Notice that \`A\` and \`B\` are inferred independently.

Expected output: the tuple \`["id", 42]\` (and a second pair of your choosing).`,
      starterCode: `// pair bundles two values of independent types into a typed tuple [A, B].
// Two type parameters let the two slots differ — A and B are inferred separately.
function pair<A, B>(a: A, b: B): [A, B] {
  // TODO: return the two-element tuple [a, b]
  return [undefined, undefined] as unknown as [A, B]; // <- stub, replace me
}

const p = pair("id", 42);        // inferred: [string, number]
const q = pair(true, ["x", "y"]); // inferred: [boolean, string[]]

console.log("pair p:", p);
console.log("pair q:", q);
console.log("first of p:", p[0]); // string
`,
    },
    ],
    quiz: [
      {
        id: "generic-functions-q1",
        prompt: "Why is `function identity<T>(x: T): T` better than `function id(x: any): any`?",
        options: [
          "The generic preserves and relates types — the return is tied to the argument, while `any` throws the information away",
          "The generic is faster at runtime because it avoids boxing",
          "`any` is deprecated in modern TypeScript",
          "The generic adds a runtime check that the types match",
        ],
        answer: 0,
        explanation: "With `any`, the result can be used as anything — errors and all. With a generic, `identity(5)` is `number` and `identity(\"hi\")` is `string`: the type flows through.",
      },
      {
        id: "generic-functions-q2",
        prompt: "Why does `function longest<T extends { length: number }>` need the constraint?",
        options: [
          "Constraints are required on every type parameter",
          "Without it `T` is opaque and `.length` won't compile — the constraint unlocks members inside the body",
          "Without it the function can't be called with strings",
          "Without it TypeScript can't infer `T` from the arguments",
        ],
        answer: 1,
        explanation: "`extends` says \"T must be at least this shape.\" Note that unlike Java/C#, the constraint is satisfied *structurally* — anything with a numeric `length` fits, with no declaration needed.",
      },
      {
        id: "generic-functions-q3",
        prompt: "How do TypeScript generics compare to C# generics at runtime?",
        options: [
          "Both are reified and support runtime type arguments",
          "TS reifies generics but only under `strict` mode",
          "TS generics are fully erased — no `new T()`, no `typeof T`, no reflection — whereas C# reifies them",
          "Both are erased, so neither supports `new T()`",
        ],
        answer: 2,
        explanation: "TS is like Java here — the type parameter simply doesn't exist at runtime. C# generics are reified, which is why C# can do things with type parameters that TypeScript structurally cannot.",
      },
    ],
  },
  {
    id: "generic-types",
    module: "generics",
    title: "Generic Types, keyof, and Indexed Access",
    blurb: "Box<T>, keyof, and the typed get(obj, key).",
    content: `Generics aren't just for functions — **interfaces, type aliases, and classes** can be parameterized too. A generic type is a *type-level function*: feed it type arguments, get a concrete type back.

\`\`\`ts
interface Box<T> { value: T; }
type Pair<A, B> = { first: A; second: B };

const b: Box<number> = { value: 42 };   // value is number
const p: Pair<string, boolean> = { first: "x", second: true };
\`\`\`

Classes parameterize the same way: \`class Stack<T> { ... }\` makes \`push(item: T)\` and \`pop(): T | undefined\` agree, so what you pop is exactly what you pushed.

**\`keyof\`** turns an object type into the **union of its keys**:

\`\`\`ts
type User = { name: string; age: number };
type UserKey = keyof User; // "name" | "age"
\`\`\`

**Indexed access** \`T[K]\` looks up the *type* of a property by key — like indexing, but in type-space:

\`\`\`ts
type NameType = User["name"]; // string
type AnyVal = User[keyof User]; // string | number
\`\`\`

Put them together for the classic safe accessor. \`K extends keyof T\` constrains the key to real keys, and \`T[K]\` gives back the precise property type:

\`\`\`ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const u = { name: "Ada", age: 36 };
get(u, "name"); // typed string
get(u, "age");  // typed number
get(u, "nope"); // compile error: "nope" isn't a key of u
\`\`\`

**Contrast with plain JS:** there, \`get(obj, key)\` returns \`any\` (or you reach for \`any\` to silence the checker), and a typo'd key fails silently at runtime. With \`keyof\` + \`T[K]\`, the key is validated and the result is *specifically* typed — the relationship between input and output is captured in the type itself.`,
    exercises: [
    {
      id: "generic-box",
      title: "A generic Box",
      instructions: `Define a generic \`Box<T>\` (an \`interface\` or a \`type\`) that holds a single \`value: T\`, plus a \`makeBox<T>(value: T): Box<T>\` helper.

Build a box of numbers and a box of strings, then print each box's \`value\`.

Expected output: the number you boxed, then the string you boxed.`,
      starterCode: `// A Box<T> is the simplest generic container: it just holds one value of type T.
// T is a placeholder filled in per use — Box<number>, Box<string>, etc.
interface Box<T> {
  value: T;
}

function makeBox<T>(value: T): Box<T> {
  // TODO: wrap \`value\` in a Box (return an object whose \`value\` field is value)
  return { value: undefined as unknown as T }; // <- stub, replace me
}

const numberBox = makeBox(123);      // Box<number>
const stringBox = makeBox("hello");  // Box<string>

console.log("number box:", numberBox.value);
console.log("string box:", stringBox.value);
`,
    },
    {
      id: "keyof-get",
      title: "Typed get(obj, key)",
      instructions: `Implement \`get<T, K extends keyof T>(obj: T, key: K): T[K]\` so it returns \`obj[key]\`.

Call it for two different keys of an object that has at least a \`string\` field and a \`number\` field, then print the results. Hover the calls in the editor: each result is typed as the *specific* property type (e.g. \`string\`, \`number\`), not \`any\`.

Expected output: the two property values you read.`,
      starterCode: `// get reads a property by key with full type safety.
// \`K extends keyof T\` limits key to T's actual keys; the return type T[K] is the
// type of THAT property — so get(user, "age") is typed number, not any.
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  // TODO: look up and return the property: obj[key]
  return undefined as unknown as T[K]; // <- stub, replace me
}

const user = { name: "Ada", age: 36, admin: true };

const personName = get(user, "name");  // typed string
const age = get(user, "age");           // typed number

console.log("name:", personName);
console.log("age: ", age);
// get(user, "nope") would be a compile error: "nope" isn't a key of user.
`,
    },
    {
      id: "generic-stack",
      title: "A generic Stack",
      instructions: `Complete the generic \`Stack<T>\` class: \`push(item: T)\` adds to the top, and \`pop(): T | undefined\` removes and returns the top item (or \`undefined\` when empty).

Push a few values, pop one, and print the popped value and the remaining \`size\`. Because the stack is typed in terms of \`T\`, what you pop is exactly the type you pushed.

Expected output: the last value you pushed, then the size after popping.`,
      starterCode: `// A Stack<T> is a LIFO container whose push/pop are typed in terms of T,
// so what you pop is exactly what you pushed — no casting, no any.
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    // TODO: add item to the top of the stack
  }

  pop(): T | undefined {
    // TODO: remove and return the top item (undefined if empty)
    return undefined;
  }

  get size(): number {
    return this.items.length;
  }
}

const s = new Stack<string>();
s.push("a");
s.push("b");
s.push("c");
console.log("popped:", s.pop()); // expected "c" once push/pop are implemented
console.log("size:  ", s.size);
`,
    },
    ],
    quiz: [
      {
        id: "generic-types-q1",
        prompt: "What does `keyof User` produce for `type User = { name: string; age: number }`?",
        options: [
          "An array `[\"name\", \"age\"]` available at runtime",
          "The type `string`, since keys are strings",
          "The union `\"name\" | \"age\"`",
          "The union `string | number` of the property types",
        ],
        answer: 2,
        explanation: "`keyof` turns an object type into the union of its keys. Paired with indexed access `T[K]` — which looks up a property's *type* by key — it gives you the classic safe accessor.",
      },
      {
        id: "generic-types-q2",
        prompt: "In `function get<T, K extends keyof T>(obj: T, key: K): T[K]`, what does `get(u, \"nope\")` do?",
        options: [
          "Returns `undefined` with type `any`",
          "Returns `undefined` with type `never`",
          "Compiles, and fails at runtime",
          "Compile error — `K extends keyof T` constrains the key to real keys of `u`",
        ],
        answer: 3,
        explanation: "In plain JS, `get(obj, key)` returns `any` and a typo'd key fails silently at runtime. With `keyof` plus `T[K]` the key is validated *and* the result is specifically typed — the relationship between input and output is captured in the type itself.",
      },
      {
        id: "generic-types-q3",
        prompt: "What is a generic type, conceptually?",
        options: [
          "A type-level function — feed it type arguments, get a concrete type back",
          "A runtime factory that constructs typed instances",
          "A shorthand for a union of every type it could hold",
          "An interface that defers checking until instantiation",
        ],
        answer: 0,
        explanation: "Interfaces, type aliases, and classes all parameterize this way. `Box<number>` is the concrete type you get by applying `Box` to `number`, and that mental model is what makes mapped and conditional types make sense later.",
      },
    ],
  },
  {
    id: "generics-in-practice",
    module: "generics",
    title: "Generics in Practice",
    blurb: "Result<T,E>, generic utilities, and when to reach for them.",
    content: `A generic is a **function at the type level**: it takes types in and produces a type out. That mental model is the key to using them well in real code.

**A reusable \`Result<T, E>\`.** Instead of throwing, return success-or-failure as a discriminated union. The same shape serves every operation, with \`T\` and \`E\` filled per use:

\`\`\`ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}
\`\`\`

The \`never\` in \`ok\`/\`err\` is deliberate: a success has *no* error type, so it slots into any \`Result<T, E>\`. Checking \`r.ok\` narrows the union, so \`r.value\` and \`r.error\` are each available only on the right branch.

**Generic utilities and containers.** A typed \`map\`, a small cache, a memoizer — all preserve and relate types across a boundary:

\`\`\`ts
function mapValues<T, U>(arr: T[], fn: (t: T) => U): U[] {
  const out: U[] = [];
  for (const x of arr) out.push(fn(x));
  return out;
}
mapValues(["a", "bb"], (s) => s.length); // number[]

class Cache<V> {
  private store = new Map<string, V>();
  set(k: string, v: V) { this.store.set(k, v); }
  get(k: string): V | undefined { return this.store.get(k); }
}
\`\`\`

**When does a generic earn its keep?** When a type *flows through* — the output type depends on the input type, or two parameters must agree. If a function takes \`T\` but \`T\` never appears again in the signature, the generic is decorative; a plain type (or \`unknown\`) is simpler. Don't parameterize for its own sake.

**The throughline:** generics beat \`any\` because \`any\` discards type information at the boundary, while a generic carries it across — preserving safety and relating the pieces.`,
    exercises: [
    {
      id: "result-type",
      title: "A Result type",
      instructions: `\`Result<T, E>\` is defined as a union of \`{ ok: true; value: T }\` and \`{ ok: false; error: E }\`.

Implement the generic constructors \`ok\` and \`err\`, and \`unwrapOr(r, fallback)\` which returns \`r.value\` when \`ok\` is \`true\` and the \`fallback\` otherwise (note how checking \`r.ok\` narrows the union).

Print both branches: an unwrapped success value, and a failure falling back.

Expected output: \`42\` for the success, the fallback \`-1\` for the failure.`,
      starterCode: `// Result<T, E> models success-or-failure WITHOUT exceptions, as a tagged union.
// The \`ok\` field is the discriminant: ok === true narrows to { value: T },
// ok === false narrows to { error: E }.
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  // TODO: build the success branch: { ok: true, value }
  return { ok: true, value: undefined as unknown as T }; // <- stub, replace me
}

function err<E>(error: E): Result<never, E> {
  // TODO: build the failure branch: { ok: false, error }
  return { ok: false, error: undefined as unknown as E }; // <- stub, replace me
}

function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  // TODO: return r.value when ok, otherwise the fallback
  return fallback;
}

const good: Result<number, string> = ok(42);
const bad: Result<number, string> = err("boom");

console.log("good:", unwrapOr(good, -1)); // expected 42 once implemented
console.log("bad: ", unwrapOr(bad, -1));  // expected -1
`,
    },
    {
      id: "generic-map",
      title: "A generic map",
      instructions: `Implement \`mapValues<T, U>(arr: T[], fn: (t: T) => U): U[]\` **with an explicit loop** — build a \`U[]\`, apply \`fn\` to each element, and collect the results. (Don't just delegate to \`Array.prototype.map\`; the point is to see \`T\` and \`U\` flow through the signature you wrote.)

Use it twice with different element/result types and print both arrays.

Expected output: \`[1, 2, 3]\` for the lengths, \`[2, 4, 6]\` for the doubled values.`,
      starterCode: `// mapValues transforms every element of a T[] into a U[] using fn.
// Writing the signature by hand shows how the type variables flow:
// T is the input element, U is whatever fn returns.
function mapValues<T, U>(arr: T[], fn: (t: T) => U): U[] {
  // TODO: loop over arr, apply fn, collect the results into \`out\`
  const out: U[] = [];
  return out;
}

const lengths = mapValues(["a", "bb", "ccc"], (s) => s.length); // number[]
const doubled = mapValues([1, 2, 3], (n) => n * 2);             // number[]

console.log("lengths:", lengths); // expected [1, 2, 3] once implemented
console.log("doubled:", doubled); // expected [2, 4, 6]
`,
    },
    {
      id: "typed-cache",
      title: "A typed cache",
      instructions: `Complete the generic \`TypedCache<V>\`: a \`string\`-keyed store backed by a \`Map\`, with \`set(key, value)\` and \`get(key): V | undefined\`.

Use one cache for \`number\` values and another for \`string\` values to show that \`V\` keeps each instance's values consistent. Print a hit from each, plus a miss.

Expected output: a stored number, a stored string, and \`undefined\` for a missing key.`,
      starterCode: `// TypedCache<V> is a thin, string-keyed store whose values are all of type V.
// One generic parameter (V) means get/set agree: what you set is what you get.
// (Named TypedCache, not Cache, to avoid colliding with the built-in DOM Cache.)
class TypedCache<V> {
  private store = new Map<string, V>();

  set(key: string, value: V): void {
    // TODO: store value under key
  }

  get(key: string): V | undefined {
    // TODO: look up key (undefined if missing)
    return undefined;
  }
}

const scores = new TypedCache<number>();
scores.set("ada", 99);

const names = new TypedCache<string>();
names.set("greeting", "hello");

console.log("score:", scores.get("ada"));        // expected 99 once implemented
console.log("greeting:", names.get("greeting")); // expected "hello"
console.log("missing:", scores.get("nope"));     // undefined
`,
    },
    ],
    quiz: [
      {
        id: "generics-in-practice-q1",
        prompt: "In `const ok = <T>(value: T): Result<T, never> => ...`, why `never` for the error type?",
        options: [
          "`never` forces the caller to supply an explicit error type",
          "It marks the function as one that cannot throw",
          "It's a placeholder that TypeScript replaces at the call site",
          "A success has no error type, and `never` slots into any `Result<T, E>`",
        ],
        answer: 3,
        explanation: "`never` is the bottom type, so it's assignable to every type — which is exactly what a success value needs in the error slot. Checking `r.ok` then narrows the union so `r.value` and `r.error` are each available only on the right branch.",
      },
      {
        id: "generics-in-practice-q2",
        prompt: "When is a generic type parameter decorative rather than useful?",
        options: [
          "When `T` appears once in the signature and never flows to the output or another parameter",
          "When the function has more than two type parameters",
          "When the type parameter has a constraint",
          "When inference supplies it rather than the caller",
        ],
        answer: 0,
        explanation: "A generic earns its keep when a type *flows through* — the output depends on the input, or two parameters must agree. If `T` never appears again, a plain type or `unknown` is simpler. Don't parameterize for its own sake.",
      },
      {
        id: "generics-in-practice-q3",
        prompt: "What's the throughline argument for generics over `any`?",
        options: [
          "`any` can't be used with classes or interfaces",
          "`any` discards type information at the boundary; a generic carries it across, preserving safety and relating the pieces",
          "`any` is slower because the compiler must check every use",
          "Generics produce smaller output because the types are inlined",
        ],
        answer: 1,
        explanation: "This is the same principle behind `unknown` at the boundary: one `any` at an edge silently disables the checker downstream, while a generic keeps the relationship intact all the way through.",
      },
    ],
  },
];
