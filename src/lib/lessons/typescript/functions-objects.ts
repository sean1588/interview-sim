import type { Lesson } from "../types";

export const functionsObjectsLessons: Lesson[] = [
  {
    id: "typing-functions",
    module: "functions-objects",
    title: "Typing Functions",
    blurb: "Params, optionals, rest, void, and function types.",
    content: `In plain JS a function signature tells you nothing — any caller can pass anything. TypeScript annotates each parameter and the return type, and then *checks every call site* against that contract. The return type is usually inferred, but writing it explicitly turns the function body into a checked promise.

\`\`\`ts
function add(a: number, b: number): number {
  return a + b;
}
\`\`\`

## Optional and default params

A trailing \`?\` marks a parameter optional; inside the body its type widens to include \`undefined\`. A default value also makes the argument optional at the call site — but the parameter type does **not** include \`undefined\`, because the default fills it in.

\`\`\`ts
function tag(text: string, prefix?: string): string {
  // prefix: string | undefined
  return \`\${prefix ?? "#"}\${text}\`;
}
function tag2(text: string, prefix: string = "#"): string {
  // prefix: string  (the default supplies it)
  return \`\${prefix}\${text}\`;
}
\`\`\`

Optional params must come after required ones — same rule as JS defaults.

## Rest params

The rest param collects the remaining arguments into a typed array:

\`\`\`ts
function sum(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3); // 6
\`\`\`

## void

\`void\` is the return type of a function that returns nothing meaningful — the analog of a method you call for its side effect. It is distinct from \`undefined\`: a \`void\`-typed callback is allowed to return a value (TS just ignores it), which is what lets \`arr.forEach(x => arr.push(x))\` type-check.

## Function types and call signatures

A function-type expression is a first-class type you can name or pass around: \`(a: number) => string\`. You can also attach a **call signature** to an object type, which is how you type a callable that also carries properties:

\`\`\`ts
type Formatter = (value: number) => string;
const pct: Formatter = (v) => \`\${(v * 100).toFixed(0)}%\`;

interface Counter {
  (): number;      // callable
  reset(): void;   // ...and has a method
}
\`\`\`

## Overloads (a brief note)

Unlike Java/C#, you don't write multiple bodies. You declare several **overload signatures** above one implementation signature; only the overloads are visible to callers. Reach for this only when the return type genuinely depends on the argument shapes — a union or generic is usually cleaner.

\`\`\`ts
function len(x: string): number;
function len(x: unknown[]): number;
function len(x: string | unknown[]): number {
  return x.length;
}
\`\`\``,
    exercises: [
    {
      id: "typed-function",
      title: "A fully typed function",
      instructions: `Implement \`greet(name, greeting?)\`:

- \`name\` is required, \`greeting\` is **optional**, and the return type is explicitly \`string\`.
- When \`greeting\` is provided, use it; otherwise fall back to \`"Hello"\`.
- Return a string like \`\` \`\${greeting}, \${name}!\` \`\`.

Call it once **without** the optional arg and once **with** it.

Expected output:

\`\`\`
Hello, Ada!
Hi, Grace!
\`\`\``,
      starterCode: `// A required param, an optional param (note the \`?\`), and an explicit
// \`: string\` return type. \`greeting\` is optional, so inside the body its
// type is \`string | undefined\`.
function greet(name: string, greeting?: string): string {
  // TODO: build a message. Use \`greeting\` when it is provided, otherwise
  // fall back to "Hello". Return the full string, e.g. "Hello, Ada!".
  return ""; // replace with the real message
}

console.log(greet("Ada"));
console.log(greet("Grace", "Hi"));
`,
    },
    {
      id: "function-type-value",
      title: "A function-typed variable",
      instructions: `The variable \`add\` is declared with a **function-type expression**: \`(a: number, b: number) => number\`. The arrow function you assign must match that shape.

Implement the body so \`add\` returns the sum, then it is called for you.

Expected output:

\`\`\`
5
\`\`\``,
      starterCode: `// \`add\` is a *variable* whose TYPE is a function-type expression:
// (a: number, b: number) => number. The arrow function assigned to it must
// match that shape — params and return type are checked against it.
const add: (a: number, b: number) => number = (a, b) => {
  // TODO: return the sum of a and b.
  return 0; // replace this
};

console.log(add(2, 3));
`,
    },
    {
      id: "rest-and-void",
      title: "Rest params and void",
      instructions: `Two functions:

- \`sum(...nums: number[]): number\` — a **variadic** function that adds up all its arguments.
- \`logLine(label: string): void\` — a logger whose return type is \`void\` (it exists for its side effect).

\`logLine\` is called first, then the result of \`sum\` is printed.

Expected output:

\`\`\`
[log] computing sum
10
\`\`\``,
      starterCode: `// \`...nums\` is a rest param typed as number[] — the function is variadic and
// returns a number.
function sum(...nums: number[]): number {
  // TODO: add up every value in \`nums\` and return the total.
  return 0; // replace this
}

// A void-returning function: callers must not rely on its return value.
function logLine(label: string): void {
  console.log(\`[log] \${label}\`);
}

logLine("computing sum");
console.log(sum(1, 2, 3, 4));
`,
    },
    ],
    quiz: [
      {
        id: "typing-functions-q1",
        prompt: "What's the type of `prefix` inside `function tag(text: string, prefix?: string)` versus `function tag2(text: string, prefix: string = \"#\")`?",
        options: [
          "`string | undefined` in the first; plain `string` in the second, because the default fills it in",
          "`string | undefined` in both",
          "`string` in both — `?` only affects the call site",
          "`string | undefined` in the second, since a default can be overridden with `undefined`",
        ],
        answer: 0,
        explanation: "A trailing `?` widens the parameter type to include `undefined` inside the body. A default value also makes the argument optional at the call site, but the parameter type doesn't include `undefined` — the default has already supplied it.",
      },
      {
        id: "typing-functions-q2",
        prompt: "Why does `arr.forEach(x => arr.push(x))` type-check even though `push` returns a number?",
        options: [
          "The arrow function's return is discarded before type checking",
          "A `void`-typed callback is allowed to return a value; TS just ignores it",
          "`forEach` accepts `any` as its callback return type",
          "`push` is special-cased by the standard library definitions",
        ],
        answer: 1,
        explanation: "`void` as a return type means \"no useful return value,\" which is distinct from `undefined`. Requiring callbacks to return exactly `undefined` would break a huge amount of ordinary code.",
      },
      {
        id: "typing-functions-q3",
        prompt: "When should you reach for function overloads in TypeScript?",
        options: [
          "Whenever you'd write multiple methods with the same name in Java",
          "Whenever a parameter is optional",
          "Only when the return type genuinely depends on the argument shapes — a union or generic is usually cleaner",
          "Whenever a function accepts more than one parameter type",
        ],
        answer: 2,
        explanation: "Unlike Java/C# you don't write multiple bodies — you declare several overload signatures above one implementation signature, and only the overloads are visible to callers. It's more machinery than a union or generic, so it should earn its place.",
      },
    ],
  },
  {
    id: "object-types",
    module: "functions-objects",
    title: "Object Types: interface vs type",
    blurb: "Object shapes, optional/readonly, and index signatures.",
    content: `A plain JS object has no enforced shape — you discover missing properties at runtime. TypeScript lets you describe the shape up front, with an **object type literal**, and checks every assignment against it.

\`\`\`ts
const point: { x: number; y: number } = { x: 1, y: 2 };
\`\`\`

You usually give that shape a name. There are two tools, and the choice trips people up.

## interface vs type

- **\`interface\`** is purpose-built for object shapes. It supports \`extends\`, and it **merges** — two \`interface Foo\` declarations in scope combine, which is how you augment third-party types.
- **\`type\`** is an alias for *any* type: objects, but also unions, primitives, tuples, and mapped/conditional types. It does **not** merge.

For a plain object shape they are interchangeable — pick one and be consistent. Reach for \`type\` the moment you need something an interface can't express (a union, a tuple, a \`keyof\`/mapped type). A common house style: \`interface\` for object/class shapes, \`type\` for everything else.

\`\`\`ts
interface User {
  id: number;
  name: string;
}
type Id = string | number;          // interface can't do this
type Pair = [number, number];       // ...or this
\`\`\`

Unlike a Java interface, a TS interface is **erased** and **structural** — it's a compile-time shape, not a runtime contract a class must explicitly declare.

## Optional and readonly

\`?\` makes a property optional; \`readonly\` forbids reassignment after construction (compile-time only — it does **not** deep-freeze the object at runtime).

\`\`\`ts
interface Account {
  readonly id: number; // can't reassign id later
  name: string;
  bio?: string;        // may be absent
}
\`\`\`

## Index signatures

When keys aren't known ahead of time, an index signature types the whole dictionary: every value under a \`string\` key is, say, a \`number\`.

\`\`\`ts
interface Scores {
  [name: string]: number;
}
const s: Scores = {};
s["ada"] = 99; // ok
s["x"] = "hi"; // error: string not assignable to number
\`\`\`

Keys can be \`string\` or \`number\`. Any *named* property you also declare must be compatible with the index value type.

## Nesting

Object types nest like the values do — annotate inline or compose named types:

\`\`\`ts
interface Order {
  id: string;
  customer: { name: string; vip: boolean };
}
\`\`\``,
    exercises: [
    {
      id: "shape-an-object",
      title: "Shape an object",
      instructions: `The \`User\` interface has a \`readonly id\`, a required \`name\`, and an optional \`nickname\`.

Build a conforming \`user\` value (give \`id\` and \`name\` real values; \`nickname\` is up to you), then it prints \`user.name\`.

Expected output is whatever \`name\` you choose, e.g.:

\`\`\`
Ada
\`\`\``,
      starterCode: `// An interface describes an object SHAPE. \`nickname\` is optional (?), and
// \`id\` is readonly — assigning to it after creation is a compile error.
interface User {
  readonly id: number;
  name: string;
  nickname?: string;
}

// TODO: build a value that conforms to User. \`id\` and \`name\` are required;
// include or omit \`nickname\` as you like.
const user: User = {
  id: 0, // replace with real values
  name: "",
};

console.log(user.name);
`,
    },
    {
      id: "index-signature",
      title: "Index signatures",
      instructions: `\`Scores\` is a dictionary typed with an **index signature** (\`[name: string]: number\`).

- Populate \`scores\` with a few \`name -> number\` entries.
- Compute \`total\` as the sum of the values (hint: \`Object.values(scores)\`).

Expected output (depends on your entries), e.g. for \`{ ada: 99, grace: 88 }\`:

\`\`\`
187
\`\`\``,
      starterCode: `// An index signature types a dictionary-like object: any string key maps to a
// number value. Unlike a plain JS object, TS now enforces the value type.
interface Scores {
  [name: string]: number;
}

const scores: Scores = {};

// TODO: populate \`scores\` with a few name -> number entries.

// TODO: sum the values and assign the total. Hint: Object.values(scores).
const total = 0; // replace this

console.log(total);
`,
    },
    {
      id: "interface-vs-type",
      title: "interface vs type",
      instructions: `\`PointI\` (interface) and \`PointT\` (type alias) describe the **same** object shape — the starter shows they are interchangeable by assigning one to the other.

Then \`Status\` is a **union** type, something an interface cannot express. Pick one valid \`Status\` value, and a value is printed combining the point and the status.

Expected output (with the defaults):

\`\`\`
1,2 active
\`\`\``,
      starterCode: `// The SAME object shape, written two equivalent ways. For a plain object,
// interface and type are interchangeable.
interface PointI {
  x: number;
  y: number;
}

type PointT = {
  x: number;
  y: number;
};

// A value typed by the interface is assignable to the type alias and vice
// versa — they describe the same structure.
const a: PointI = { x: 1, y: 2 };
const b: PointT = a;

// A \`type\` can express things an interface cannot — here, a union.
type Status = "active" | "paused" | "done";

// TODO: pick one of the three valid Status strings.
const currentStatus: Status = "active"; // change to "paused" or "done" if you like

console.log(\`\${b.x},\${b.y} \${currentStatus}\`);
`,
    },
    ],
    quiz: [
      {
        id: "object-types-q1",
        prompt: "What can `type` express that `interface` cannot?",
        options: [
          "Optional and readonly properties",
          "Index signatures",
          "Unions, primitives, tuples, and mapped or conditional types",
          "Extension of another named shape",
        ],
        answer: 2,
        explanation: "For a plain object shape they're interchangeable. `interface` supports `extends` and *merges* — two declarations in scope combine, which is how you augment third-party types. `type` doesn't merge but aliases any type at all.",
      },
      {
        id: "object-types-q2",
        prompt: "What does `readonly id: number` actually guarantee?",
        options: [
          "The object is frozen with `Object.freeze` when constructed",
          "The property is non-enumerable and hidden from `JSON.stringify`",
          "The whole object graph is immutable, including nested objects",
          "Compile-time only — it forbids reassignment but does not deep-freeze the object at runtime",
        ],
        answer: 3,
        explanation: "Like everything else in the type layer, it erases. `readonly` is a checked convention, not a runtime guarantee — which is why the pitfalls lesson recommends copying (`[...xs]`) before sorting rather than trusting the annotation.",
      },
      {
        id: "object-types-q3",
        prompt: "You add `[name: string]: number` to an interface that also declares `id: string`. What happens?",
        options: [
          "A type error — any named property must be compatible with the index signature's value type",
          "It compiles; named properties are exempt from the index signature",
          "`id` is silently widened to `string | number`",
          "The index signature is ignored for keys that are explicitly declared",
        ],
        answer: 0,
        explanation: "An index signature is a claim about *every* key, so a declared property that violates it makes the type inconsistent. Keys can be `string` or `number`, and index signatures are the tool for dictionaries whose keys aren't known ahead of time.",
      },
    ],
  },
  {
    id: "structural-typing",
    module: "functions-objects",
    title: "Structural Typing",
    blurb: "Shape-based assignability, excess checks, composition.",
    content: `This is the single biggest mental shift coming from Java/C#/Go (interfaces): TypeScript is **structurally typed**. Assignability is decided by an object's *shape*, not by the name it was declared with. If a value has all the required properties of a target type, it **is** that type — no \`implements\`, no declaration, no inheritance required. This is duck typing made static.

\`\`\`ts
interface Named {
  name: string;
}
function hello(n: Named) {
  return \`hi \${n.name}\`;
}

const dog = { name: "Rex", legs: 4 };
hello(dog); // ok — dog has a \`name\`, so it fits Named
\`\`\`

In Java that \`dog\` would have to declare \`implements Named\`. In TS the compiler just compares shapes. (Two interfaces with identical members are mutually assignable for the same reason.)

## The excess-property check

There is one place TS gets *stricter* than pure structural typing: when you pass a **fresh object literal** directly where a type is expected, TS flags properties the target doesn't declare. The idea is to catch typos like \`colour\` for \`color\`.

\`\`\`ts
hello({ name: "Rex", legs: 4 }); // error: \`legs\` not in Named
\`\`\`

Note the contradiction with the \`dog\` example above — same object, different result. The check **only** fires on fresh literals. Two escape hatches:

\`\`\`ts
const d = { name: "Rex", legs: 4 };
hello(d);                  // ok — assigned to a variable first
hello({ name: "Rex" });    // ok — drop the extra field
\`\`\`

This is a deliberate convenience guard, not a soundness rule — once the value flows through a variable, only the shape matters again.

## Composition: extends and &

Build bigger shapes from smaller ones. \`interface B extends A\` adds members to \`A\`. The \`type\` equivalent is **intersection** \`A & B\`, which produces a type with *all* members of both.

\`\`\`ts
interface Animal { name: string }
interface Dog extends Animal { breed: string } // name + breed

type WithTimestamps = { createdAt: number };
type DogRecord = Dog & WithTimestamps;         // name + breed + createdAt
\`\`\`

Use \`extends\` when composing named object interfaces; use \`&\` when combining type aliases, unions, or mixing in inline shapes. They overlap heavily — prefer whichever reads cleaner at the call site.`,
    exercises: [
    {
      id: "structural-assign",
      title: "Assignable by shape",
      instructions: `\`area(r: Rect)\` wants something shaped like \`Rect\` (\`width\`, \`height\`). The \`box\` value never names \`Rect\` and even has an extra \`color\` field — but because it's bound to a variable first, it's accepted purely on shape.

Implement \`area\` to return \`width * height\`.

Expected output:

\`\`\`
20
\`\`\``,
      starterCode: `// \`area\` accepts anything shaped like a Rect. Structural typing means a value
// is assignable by SHAPE, not by the name it was declared with.
interface Rect {
  width: number;
  height: number;
}

function area(r: Rect): number {
  // TODO: return width * height.
  return 0; // replace this
}

// \`box\` never names Rect, and even has an extra property — but assigning it to
// a variable first means the excess-property check does NOT apply, so it is
// accepted purely on shape.
const box = { width: 4, height: 5, color: "red" };

console.log(area(box));
`,
    },
    {
      id: "excess-property",
      title: "The excess-property check",
      instructions: `\`connect(cfg: Config)\` takes a \`{ host, port }\`.

1. Inside the call, add an extra field directly in the object literal (e.g. \`debug: true\`) and watch the editor flag it — that's the **excess-property check** firing on a fresh literal.
2. Remove the extra field again (or assign the object to a variable first) so the file still runs cleanly.

The starter already compiles and runs; the exercise is to *see* the squiggle and undo it.

Expected output:

\`\`\`
localhost:8080
\`\`\``,
      starterCode: `interface Config {
  host: string;
  port: number;
}

// Passing a FRESH object literal with an extra field triggers the
// excess-property check, e.g.:
//   connect({ host: "localhost", port: 8080, debug: true }) // error on \`debug\`
// Two fixes: drop the extra field, OR assign to a variable first (then only
// the shape is checked). The version below already compiles cleanly.
function connect(cfg: Config): string {
  return \`\${cfg.host}:\${cfg.port}\`;
}

// TODO: try adding an extra field directly inside this call to SEE the squiggle,
// then remove it again so the starter still runs.
console.log(connect({ host: "localhost", port: 8080 }));
`,
    },
    {
      id: "extend-and-intersect",
      title: "extends and intersection",
      instructions: `Two composition styles:

- \`Dog extends Animal\` adds \`breed\` to \`name\`.
- \`DogRecord = Dog & Timestamps\` intersects to require \`name\`, \`breed\`, **and** \`createdAt\`.

Fill in \`record\` with real values for all three fields, and a combined string is printed.

Expected output (with your values), e.g.:

\`\`\`
Rex (corgi) @ 1718000000
\`\`\``,
      starterCode: `// Composition two ways. \`interface extends\` adds fields to a base interface.
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

// Intersection \`A & B\` combines two types into one that has ALL their members.
type Timestamps = { createdAt: number };
type DogRecord = Dog & Timestamps;

// TODO: build a value with every required field: name, breed, createdAt.
const record: DogRecord = {
  name: "",
  breed: "",
  createdAt: 0,
};

console.log(\`\${record.name} (\${record.breed}) @ \${record.createdAt}\`);
`,
    },
    ],
    quiz: [
      {
        id: "structural-typing-q1",
        prompt: "`hello({ name: \"Rex\", legs: 4 })` errors, but `const d = { name: \"Rex\", legs: 4 }; hello(d)` compiles. Why?",
        options: [
          "`hello` is overloaded to accept extra properties from variables",
          "The first form is a compile error in strict mode only",
          "The excess-property check only fires on fresh object literals passed directly — it's a typo guard, not a soundness rule",
          "Assigning to a variable strips the extra properties",
        ],
        answer: 2,
        explanation: "It exists to catch typos like `colour` for `color`. Once the value flows through a variable, only the shape matters again — which is the ordinary structural rule.",
      },
      {
        id: "structural-typing-q2",
        prompt: "When would you use `A & B` rather than `interface B extends A`?",
        options: [
          "When you need the result to merge with later declarations",
          "When one of the members must override the other's property types",
          "Never — they are exactly equivalent in every position",
          "When combining type aliases, unions, or mixing in inline shapes — `extends` is for composing named object interfaces",
        ],
        answer: 3,
        explanation: "They overlap heavily; prefer whichever reads cleaner at the call site. `extends` only works between interfaces, so anything involving a union, tuple, or mapped type has to use intersection.",
      },
      {
        id: "structural-typing-q3",
        prompt: "Two interfaces declare identical members but have different names. Are they assignable to each other?",
        options: [
          "Yes — structural typing compares shapes, so identical members means mutually assignable",
          "No — different names make them distinct types",
          "Only if one explicitly extends the other",
          "Only when both are declared in the same module",
        ],
        answer: 0,
        explanation: "This is duck typing made static. It's also why *branded types* exist — intersecting with a unique erased tag is how you deliberately opt out and get nominal behavior for things like `UserId`.",
      },
    ],
  },
];
