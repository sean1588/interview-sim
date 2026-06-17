import type { Lesson } from "../types";

export const typeCombinatorsLessons: Lesson[] = [
  {
    id: "utility-types",
    module: "type-combinators",
    title: "Built-in Utility Types",
    blurb: "Partial, Pick, Omit, Record, ReturnType, and friends.",
    content: `## Types that take types

TypeScript ships a standard library of **utility types** — generic types that transform other types. They are the type-level equivalent of \`map\`/\`filter\` helpers: you pass a type in, you get a derived type out. Java/C# generics let you parameterize over types, but they cannot *reshape* a type's members; TypeScript can, and these utilities are the everyday tools for it.

All of these are **type-level only**. They erase completely at runtime — \`Partial<User>\` produces no JavaScript. To *see* one run, you build a real value of the resulting type and \`console.log\` it.

## The ones you reach for daily

\`\`\`ts
interface User {
  id: number;
  name: string;
  email: string;
}

Partial<User>   // every field optional:  { id?, name?, email? }
Required<User>  // every field required (strips ?)
Readonly<User>  // every field readonly
Pick<User, "id" | "name">  // keep only those keys
Omit<User, "email">        // drop those keys
Record<string, User>       // an object whose values are User
\`\`\`

\`Pick\` and \`Omit\` are complements: \`Pick\` whitelists keys, \`Omit\` blacklists them. Reach for \`Partial\` to type a patch/update object, \`Pick\`/\`Omit\` to derive a narrower DTO from a model instead of declaring a second interface by hand.

## Pulling types out of functions and values

\`\`\`ts
type Make = (id: number) => User;

ReturnType<Make>       // User
Parameters<Make>       // [id: number]   (a tuple)
NonNullable<string | null | undefined>  // string
Awaited<Promise<User>>                   // User
\`\`\`

\`ReturnType<typeof fn>\` is the killer move: the \`typeof fn\` grabs the function's *type*, and \`ReturnType\` extracts what it returns — so the type follows the implementation automatically. \`Awaited<T>\` unwraps a \`Promise\` (and recursively unwraps nested ones), which is what \`await\` does at the value level.

## They are not magic

Every utility above is *built from* mapped and conditional types — the exact tools you'll write by hand in the next two lessons. \`Partial<T>\` is literally \`{ [K in keyof T]?: T[K] }\`. Knowing that, you can build your own when the standard library runs out.`,
    exercises: [
    {
      id: "partial-and-pick",
      title: "Partial and Pick",
      instructions: `Given the \`User\` interface, declare \`patch\` typed \`Partial<User>\` (set only *some* fields — that's the point of \`Partial\`) and \`summary\` typed \`Pick<User, "id" | "name">\` (only those two keys, both required). Then \`console.log\` both.

**Expected output:** the patch object and the summary object, e.g. \`{"name":"Ada"} {"id":1,"name":"Ada"}\`.`,
      starterCode: `interface User {
  id: number;
  name: string;
  email: string;
}

// A Partial<User> only needs *some* fields — that's the whole point of Partial.
// TODO: adjust which field(s) you set; any subset is valid.
const patch: Partial<User> = {
  name: "Ada",
};

// A Pick<User, "id" | "name"> needs exactly id and name, both required.
const summary: Pick<User, "id" | "name"> = {
  id: 1,
  name: "Ada",
};

console.log(patch, summary);
`,
    },
    {
      id: "record-type",
      title: "Record",
      instructions: `Use \`Record<Currency, number>\` (where \`Currency\` is a literal union) to type an exchange-rate lookup. Populate every key, then \`console.log\` one looked-up value.

**Expected output:** the rate you stored under one currency, e.g. \`usd rate: 1\`.`,
      starterCode: `type Currency = "usd" | "eur" | "gbp";

// Record<Currency, number> requires an entry for EVERY key in the union.
const rates: Record<Currency, number> = {
  usd: 1,
  eur: 0,   // TODO: put a real rate
  gbp: 0,   // TODO: put a real rate
};

const key: Currency = "usd";
console.log(\`\${key} rate:\`, rates[key]);
`,
    },
    {
      id: "returntype",
      title: "ReturnType",
      instructions: `\`makeUser\` returns an object. Instead of hand-writing its shape, type the \`user\` variable as \`ReturnType<typeof makeUser>\` so it tracks the function automatically. Assign a matching value and \`console.log\` it.

**Expected output:** the user object you assign — e.g. with \`{ id: 7, name: "Grace" }\` it prints \`{"id":7,"name":"Grace"}\`.`,
      starterCode: `function makeUser(id: number, name: string) {
  return { id, name };
}

// typeof makeUser is the function's TYPE; ReturnType extracts what it returns.
type User = ReturnType<typeof makeUser>;

// TODO: assign a value matching User (id + name). Keep it in sync by construction.
const user: User = {
  id: 0,
  name: "",
};

console.log(user);
`,
    },
    ],
  },
  {
    id: "mapped-types",
    module: "type-combinators",
    title: "Mapped Types",
    blurb: "{ [K in keyof T] } — type-level iteration.",
    content: `## Iteration, at the type level

A **mapped type** walks over the keys of a type and produces a new property for each one:

\`\`\`ts
type Stringify<T> = { [K in keyof T]: string };
\`\`\`

Read \`[K in keyof T]\` as a \`for...in\` loop *in the type system*: \`keyof T\` is the union of \`T\`'s keys, and \`K\` ranges over them. \`T[K]\` is an **indexed access** — the type of property \`K\` in \`T\`. There is no JavaScript equivalent; this is pure compile-time machinery that erases at runtime.

## Modifiers: \`readonly\` and \`?\`

Mapped types can add or remove the \`readonly\` and optional (\`?\`) modifiers with \`+\` and \`-\`:

\`\`\`ts
type Mutable<T>     = { -readonly [K in keyof T]: T[K] };  // strip readonly
type AllRequired<T> = { [K in keyof T]-?: T[K] };           // strip optional
\`\`\`

Bare \`readonly\` and \`?\` mean \`+readonly\` / \`+?\` (add). The \`-\` variants *remove* a modifier — that's how \`Required<T>\` works.

## Rebuilding the built-ins

The standard utilities are one-liners once you see the pattern:

\`\`\`ts
type MyPartial<T>  = { [K in keyof T]?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyRecord<K extends string, V> = { [P in K]: V };
\`\`\`

That's not pseudocode — it's essentially how \`lib.es5.d.ts\` defines \`Partial\` and \`Readonly\`.

## Key remapping with \`as\`

You can also rename keys while mapping, using an \`as\` clause:

\`\`\`ts
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};
// { name: string } -> { getName: () => string }
\`\`\`

We lean on \`as\` heavily in the template-literal lesson. For now: mapped types are your \`for\`-loop over a type's members, and the modifiers let you flip \`readonly\`/optional on or off in a single, declarative line.`,
    exercises: [
    {
      id: "my-partial",
      title: "Rebuild Partial",
      instructions: `Implement \`MyPartial<T>\` by hand as a mapped type that makes every property optional (\`{ [K in keyof T]?: T[K] }\`). The starter ships an *identity* map (no \`?\`), so the example value must list every field. Add the \`?\`, then you can delete all but one field and it still type-checks.

**Expected output (as shipped):** the full config object, e.g. \`{"host":"localhost","port":5432,"retries":3}\`.`,
      starterCode: `interface Config {
  host: string;
  port: number;
  retries: number;
}

// TODO: make every property optional by adding \`?\` after [K in keyof T].
// Right now this is an identity map (no \`?\`), so the value below must be complete.
type MyPartial<T> = { [K in keyof T]: T[K] };

// TODO: once MyPartial adds \`?\`, you can drop fields and keep only \`retries\`.
const override: MyPartial<Config> = {
  host: "localhost",
  port: 5432,
  retries: 3,
};

console.log(override);
`,
    },
    {
      id: "my-readonly",
      title: "Rebuild Readonly",
      instructions: `Implement \`MyReadonly<T>\` with the \`readonly\` modifier (\`{ readonly [K in keyof T]: T[K] }\`). Apply it to \`Point\`, build a value, and \`console.log\` it. Note: the editor will flag any later write like \`p.x = 5\` as an error — but \`readonly\` is erased, so it does not exist at runtime.

**Expected output:** the point object, e.g. \`{"x":1,"y":2}\`.`,
      starterCode: `interface Point {
  x: number;
  y: number;
}

// TODO: add the readonly modifier in front of [K in keyof T].
type MyReadonly<T> = { [K in keyof T]: T[K] };

const p: MyReadonly<Point> = { x: 1, y: 2 };
// Try adding \`p.x = 5\` below — the editor squiggles it, but it's compile-time only.

console.log(p);
`,
    },
    {
      id: "stringify-fields",
      title: "Map fields to strings",
      instructions: `Write a mapped type \`Stringify<T>\` that turns every field of \`T\` into a \`string\` field (the value type becomes \`string\`, regardless of the original). The starter ships an *identity* map, so the example value currently uses the original types. Change \`T[K]\` to \`string\`; the editor will then require every field to be a string.

**Expected output (as shipped):** the account object with its original types, e.g. \`{"id":42,"active":true}\`. Once you switch the value type to \`string\`, set the fields to strings like \`{"id":"42","active":"true"}\`.`,
      starterCode: `interface Account {
  id: number;
  active: boolean;
}

// TODO: change the value type from \`T[K]\` to \`string\` so EVERY field becomes a string.
// Right now this is an identity map, so the value below uses the ORIGINAL types.
type Stringify<T> = { [K in keyof T]: T[K] };

const row: Stringify<Account> = {
  id: 42,
  active: true,
};

console.log(row);
`,
    },
    ],
  },
  {
    id: "conditional-types",
    module: "type-combinators",
    title: "Conditional Types and infer",
    blurb: "T extends U ? X : Y, distribution, and infer.",
    content: `## A ternary for types

A **conditional type** branches in the type system:

\`\`\`ts
type IsString<T> = T extends string ? "yes" : "no";
type A = IsString<"hi">;   // "yes"
type B = IsString<42>;     // "no"
\`\`\`

Read \`T extends U\` as *"is \`T\` assignable to \`U\`?"* — the type-level equivalent of the value ternary \`cond ? x : y\`, but evaluated by the compiler. There is no runtime cost; like everything here, it erases.

## Distribution over unions

When the checked type is a **naked type parameter** and you hand it a union, the conditional applies to *each member separately*, then unions the results:

\`\`\`ts
type ToArray<T> = T extends any ? T[] : never;
type R = ToArray<string | number>;  // string[] | number[]   (NOT (string | number)[])
\`\`\`

This is the single most surprising rule here. It's why \`Exclude\` and \`NonNullable\` work — they distribute and drop the members that fail the check. To *opt out* of distribution, wrap both sides in a tuple: \`[T] extends [U] ? ...\`.

## \`infer\`: capture a type from a position

Inside the \`extends\` clause you can introduce a fresh type variable with \`infer\` and let the compiler fill it in by pattern-matching:

\`\`\`ts
type ElementType<T> = T extends (infer E)[] ? E : T;
type E1 = ElementType<number[]>;  // number
type E2 = ElementType<string>;    // string  (not an array -> falls through)

type UnwrapPromise<T> = T extends Promise<infer V> ? V : T;
type U1 = UnwrapPromise<Promise<User>>;  // User
\`\`\`

\`infer E\` says "match this shape and bind whatever sits in that slot to \`E\`". It's the type-level version of destructuring. With it you can build \`Flatten\`, read a function's return type, pull a \`Promise\`'s value out — all the introspection the built-in utilities are made of.

\`\`\`ts
type Flatten<T> = T extends (infer E)[] ? E : T;
\`\`\`

These are type-only, so to watch one run, declare a value of the resulting type and print it.`,
    exercises: [
    {
      id: "conditional-basic",
      title: "A conditional type",
      instructions: `Write \`IsArray<T>\` as a conditional type that is \`true\` when \`T\` is an array and \`false\` otherwise (\`T extends any[] ? true : false\`). The starter ships a wrong check (\`T extends never\`) that is \`false\` for both inputs here, so both values are \`false\` and it runs clean. Fix the check; the editor will then force you to flip \`a\` to \`true\` because \`IsArray<number[]>\` becomes the literal \`true\`.

**Expected output (as shipped):** \`false false\`. After you fix \`IsArray\` and update \`a\`, it prints \`true false\`.`,
      starterCode: `// TODO: return the literal \`true\` when T is an array, else \`false\`.
// This wrong check (T extends never) is false for these inputs — fix it.
type IsArray<T> = T extends never ? true : false;

// Once IsArray is correct, IsArray<number[]> is \`true\` and the editor forces
// you to change \`a\` to \`true\`. IsArray<string> stays \`false\`.
const a: IsArray<number[]> = false;
const b: IsArray<string> = false;

console.log(a, b);
`,
    },
    {
      id: "infer-element",
      title: "infer the element",
      instructions: `Write \`ElementType<T>\` using \`infer\`: \`T extends (infer E)[] ? E : T\`. Use it to type \`first\` as \`ElementType<number[]>\` (which is \`number\`), assign a value, and \`console.log\` it.

**Expected output:** the element value, e.g. \`first: 10\`.`,
      starterCode: `// TODO: if T is an array, capture its element type with \`infer E\` and return E.
type ElementType<T> = T extends (infer E)[] ? unknown : T;

// ElementType<number[]> should resolve to \`number\`.
const first: ElementType<number[]> = 10;

console.log("first:", first);
`,
    },
    {
      id: "unwrap-promise",
      title: "Unwrap a Promise type",
      instructions: `Write \`Unwrap<T>\` with \`infer\`: \`T extends Promise<infer V> ? V : T\`. Use it to type a *plain* value (not an awaited one) as \`Unwrap<Promise<string>>\`, which is \`string\`, and \`console.log\` it. (\`Awaited<T>\` from the standard library does the same thing.)

**Expected output:** the unwrapped value, e.g. \`done\`.`,
      starterCode: `// TODO: if T is a Promise, capture its value type with \`infer V\` and return V.
type Unwrap<T> = T extends Promise<infer V> ? unknown : T;

// Unwrap<Promise<string>> is just \`string\` — assign a plain string, no await.
const value: Unwrap<Promise<string>> = "done";

console.log(value);
`,
    },
    ],
  },
  {
    id: "template-literal-types",
    module: "type-combinators",
    title: "Template Literal Types",
    blurb: "String literal types and key remapping.",
    content: `## String literals you can compute

TypeScript lets you build **string-literal types** the way template literals build strings — by interpolation, but in the type system:

\`\`\`ts
type Greeting = \`hello \${string}\`;       // any string starting "hello "
type Lang = "ts" | "js";
type File = \`app.\${Lang}\`;               // "app.ts" | "app.js"
\`\`\`

Interpolating a *union* distributes across every member, so \`File\` is a two-member union, not a single fuzzy string. This has no JavaScript counterpart — the closest cousin is a regex, but here the *type checker* enforces the shape at compile time.

## The intrinsic case helpers

Four built-in types transform the casing of a string-literal type: \`Uppercase<S>\`, \`Lowercase<S>\`, \`Capitalize<S>\`, \`Uncapitalize<S>\`.

\`\`\`ts
type Loud = Uppercase<"hi">;       // "HI"
type Cap  = Capitalize<"click">;   // "Click"
\`\`\`

\`\`\`ts
type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type Click = EventName<"click">;   // "onClick"
\`\`\`

## Remapping keys with templates

Their real power shows when combined with a mapped type's \`as\` clause to **rename keys**:

\`\`\`ts
type Handlers<T> = {
  [K in keyof T as \`on\${Capitalize<string & K>}\`]: () => void;
};

type Events = { click: 0; hover: 0 };
type H = Handlers<Events>;
// { onClick: () => void; onHover: () => void }
\`\`\`

The \`string & K\` intersection is the idiom that convinces the compiler \`K\` is a string (keys can in principle be \`number\`/\`symbol\`, which \`Capitalize\` rejects). With this you can prefix every key, generate getter/setter names, or derive an event-handler map from a model — turning a \`{ click }\` shape into \`{ onClick }\` declaratively.

Template literal types are type-level, so to see one at runtime, build a **value** of the resulting type and \`console.log\` it.`,
    exercises: [
    {
      id: "event-name",
      title: "An event-name type",
      instructions: `Write \`EventName<T extends string> = \\\`on\${Capitalize<T>}\\\`\`. The starter ships the identity template, so \`EventName<"click">\` is just \`"click"\`. Fix it to prefix \`on\` and \`Capitalize<T>\`; the editor will then force the value to be the literal \`"onClick"\`.

**Expected output (as shipped):** \`click\`. After you fix \`EventName\` and update the value, it prints \`onClick\`.`,
      starterCode: `// TODO: prefix with "on" and Capitalize the event name: \`on\${Capitalize<T>}\`.
// Right now this is the identity template, so EventName<"click"> is just "click".
type EventName<T extends string> = \`\${T}\`;

// Once fixed, EventName<"click"> becomes the literal "onClick" and the editor
// will require you to change this value to "onClick".
const handlerName: EventName<"click"> = "click";

console.log(handlerName);
`,
    },
    {
      id: "prefixed-keys",
      title: "Prefix every key",
      instructions: `Use a mapped type with key remapping (\`as\`) and a template literal to write \`Prefixed<T>\` that renames every key of \`T\` to \`\` \`data_\${K}\` \`\`. The starter ships an identity remap (\`as K\`), so the keys are unchanged. Replace \`K\` with \`\` \`data_\${string & K}\` \`\`; the editor will then require the prefixed key names.

**Expected output (as shipped):** the object with original keys, e.g. \`{"open":true,"dirty":false}\`. Once remapped, the keys become \`{"data_open":true,"data_dirty":false}\`.`,
      starterCode: `interface Flags {
  open: boolean;
  dirty: boolean;
}

// TODO: remap each key K to \`data_\${K}\` using the \`as\` clause and a template literal.
// (string & K keeps the compiler happy: keyof can include number/symbol.)
// Right now this remaps K to itself, so the keys below are the ORIGINAL names.
type Prefixed<T> = {
  [K in keyof T as K]: T[K];
};

const state: Prefixed<Flags> = {
  open: true,
  dirty: false,
};

console.log(state);
`,
    },
    {
      id: "css-units",
      title: "A px unit type",
      instructions: `Define \`Px = \\\`\${number}px\\\`\`, the template-literal type of any numeric string ending in \`px\`. Assign a couple of valid values (e.g. \`"8px"\`, \`"16px"\`) and \`console.log\` them. A bad value like \`"8rem"\` or \`"8"\` is rejected by the editor — try one to see the squiggle.

**Expected output:** the two padding values, e.g. \`8px 16px\`.`,
      starterCode: `// TODO: make this match any number followed by "px", e.g. "8px".
type Px = string;

const padding: Px = "8px";
const margin: Px = "16px";
// Try \`const bad: Px = "8rem";\` — the editor rejects it (compile-time only).

console.log(padding, margin);
`,
    },
    ],
  },
];
