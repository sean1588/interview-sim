import type { Lesson } from "../types";

export const practicalTypingLessons: Lesson[] = [
  {
    id: "unknown-and-validation",
    module: "practical-typing",
    title: "Taming unknown at the Boundary",
    blurb: "Narrowing external data instead of trusting any.",
    content: `## Where your types stop being true

Inside your program the type checker keeps everyone honest. But data crossing a *boundary* — an HTTP body, \`localStorage\`, a file, a message — has no compile-time type. TypeScript can only *describe* shapes; it cannot *check* a string of JSON at the door. So the boundary is exactly where types most often lie.

The trap is built into the standard library: \`JSON.parse\` is typed to return **\`any\`**.

\`\`\`ts
const data = JSON.parse(body); // data: any  ← the checker just gave up
data.user.name.toUpperCase();  // compiles. explodes at runtime if wrong.
\`\`\`

## \`any\` is a hole, \`unknown\` is a wall

\`any\` opts a value *out* of type checking — and it spreads: anything you pull off an \`any\` is also \`any\`. One \`any\` at the edge silently disables the checker across everything downstream.

\`unknown\` is its safe twin: it accepts any value but lets you do **nothing** with it until you prove what it is. Same "I don't know yet," opposite default — \`unknown\` forces the check, \`any\` skips it.

\`\`\`ts
const data: unknown = JSON.parse(body);
data.user;          // ERROR: Object is of type 'unknown'
if (typeof data === "object" && data !== null && "user" in data) {
  // now TS lets you look closer
}
\`\`\`

## Parse, don't validate

Narrow external data into a typed value **once**, at the edge, and let the rest of the program work with the real type — never re-check downstream. The narrowing tools are plain JavaScript: \`typeof\`, the \`in\` operator, \`Array.isArray\`, and **custom type guards** (next lesson). No validation library required; for nested or large schemas a library like Zod earns its keep, but the principle is the same.

\`\`\`ts
interface User { id: number; name: string; }

function parseUser(json: string): User {
  const d: unknown = JSON.parse(json);
  if (
    typeof d === "object" && d !== null &&
    "id" in d && typeof (d as Record<string, unknown>).id === "number" &&
    "name" in d && typeof (d as Record<string, unknown>).name === "string"
  ) {
    return d as User; // earned the assertion: we just checked every field
  }
  throw new Error("bad User");
}
\`\`\`

Past that function, you hold a real \`User\`. The messy \`unknown\` lives only at the boundary — which is exactly where domain edge cases belong.`,
    exercises: [
    {
      id: "parse-unknown",
      title: "Parse to unknown",
      instructions: `\`JSON.parse\` hands you \`any\`. In \`parseUser\`, type the parsed value as \`unknown\`, then **narrow** it — confirm it's a non-null object with a numeric \`id\` and a string \`name\` — before returning it as a \`User\`. \`throw\` if the shape is wrong. Replace the placeholder return.

**Expected output:** \`name: Ada\``,
      starterCode: `// JSON.parse is typed to return \`any\` — the one place TS hands you back a hole.
// Treat the result as \`unknown\` and narrow it before you trust it.
const raw = '{"id": 7, "name": "Ada"}';

interface User {
  id: number;
  name: string;
}

function parseUser(json: string): User {
  const data: unknown = JSON.parse(json);
  // TODO: narrow \`data\` to a User before returning it.
  //   - check it is a non-null object
  //   - check typeof data.id === "number" and typeof data.name === "string"
  //   - throw if the shape is wrong
  // Placeholder so the starter runs cleanly; replace with real narrowing:
  return { id: 0, name: "unparsed" };
}

const user = parseUser(raw);
console.log("name:", user.name);
`,
    },
    {
      id: "guard-the-shape",
      title: "Guard the shape",
      instructions: `Implement \`isUser(x: unknown): x is User\` so it returns \`true\` only when \`x\` is a non-null object with a numeric \`id\` and a string \`name\`. The \`x is User\` return type is what makes TS **narrow** \`x\` inside the \`if\` branch. Apply it to the parsed data and log inside the branch.

**Expected output:** \`valid user: Ada\``,
      starterCode: `// A type guard is a function returning \`x is T\`. When it returns true, TS
// narrows the argument to T in the calling branch — your runtime check and
// your compile-time type stay in sync.
interface User {
  id: number;
  name: string;
}

function isUser(x: unknown): x is User {
  // TODO: return true only when x has a numeric \`id\` and a string \`name\`.
  //   Check it's a non-null object, then check each field with typeof.
  //   Returning false for now so the starter runs cleanly:
  return false;
}

const raw = '{"id": 7, "name": "Ada"}';
const data: unknown = JSON.parse(raw);

if (isUser(data)) {
  // Inside this branch, \`data\` is narrowed to User.
  console.log("valid user:", data.name);
} else {
  console.log("not a user");
}
`,
    },
    {
      id: "any-is-a-hole",
      title: "any is a hole",
      instructions: `The commented \`any\` block shows a typo (\`.nmae\`) that *compiles* and would crash at runtime — read it, don't uncomment it. Then finish \`safeName\`: narrow the \`unknown\` to confirm a string \`name\` and return it. The starter already runs safely; keep it that way.

**Expected output:** \`safe name: Ada\``,
      starterCode: `// \`any\` switches off type-checking for the value and everything derived from
// it. A typo or wrong field compiles silently and blows up at runtime. The
// fix is to start from \`unknown\` and narrow once, at the edge.
const raw = '{"id": 7, "name": "Ada"}';

interface User {
  id: number;
  name: string;
}

// The any path: this would COMPILE even though \`.nmae\` doesn't exist.
// (Left commented so the starter doesn't throw at runtime.)
// const loose: any = JSON.parse(raw);
// console.log(loose.nmae.toUpperCase()); // compiles, then: Cannot read ... of undefined

// The safe path: narrow \`unknown\`, then access only real fields.
function safeName(json: string): string {
  const data: unknown = JSON.parse(json);
  // TODO: narrow \`data\` to confirm a string \`name\`, then return data.name.
  //   - check it is a non-null object
  //   - check "name" in data and typeof (data as Record<string, unknown>).name === "string"
  //   - return data.name once narrowed; otherwise return a fallback
  // Placeholder so the starter runs cleanly; replace with real narrowing:
  return "unknown";
}

console.log("safe name:", safeName(raw));
`,
    },
    ],
  },
  {
    id: "as-const-and-derivation",
    module: "practical-typing",
    title: "as const, Derivation, and satisfies",
    blurb: "Single-source-of-truth types and satisfies.",
    content: `## Let the value define the type

By default TypeScript **widens** literals: \`const role = "admin"\` is the literal \`"admin"\`, but \`{ role: "admin" }\` infers \`{ role: string }\` — the useful literal is lost. \`as const\` stops that. It freezes a literal to its **narrowest, \`readonly\`** form:

\`\`\`ts
const config = { host: "localhost", port: 8080 } as const;
// type: { readonly host: "localhost"; readonly port: 8080 }
\`\`\`

Now the value is precise enough to *derive a type from*. The idiom is **single source of truth**: define the data once, generate the type with \`typeof\` and \`keyof\`.

\`\`\`ts
type Config    = typeof config;          // the whole shape
type ConfigKey = keyof typeof config;    // "host" | "port"
type Values    = (typeof config)[keyof typeof config]; // "localhost" | 8080
\`\`\`

Change the object and every derived type updates automatically — no second declaration to keep in sync. This inverts the usual order (declare type, then write a conforming value); here the *value* leads.

## const-object + union over \`enum\`

TypeScript has \`enum\`, but it's the one TS feature that **emits runtime JavaScript** (most type constructs erase). Numeric enums are also reverse-mapped and members aren't plain strings. Idiomatic modern TS usually prefers a frozen object plus a derived union:

\`\`\`ts
const Status = { Active: "active", Closed: "closed" } as const;
type Status = (typeof Status)[keyof typeof Status]; // "active" | "closed"
\`\`\`

Plain string values at runtime, an exhaustive union at compile time, zero emitted machinery. (Value and type can share the name \`Status\` — they live in separate namespaces.)

## \`satisfies\`: check without widening

Annotating \`const palette: Record<string, string> = {...}\` *checks* the value but **widens** it — you lose the literal keys, so \`palette.primary\` is no longer known. \`satisfies\` verifies the value against a type yet **keeps the precise inferred type**:

\`\`\`ts
const palette = {
  primary: "#0070f3",
  danger:  "#e00",
} satisfies Record<string, \`#\${string}\`>;

palette.primary; // still the literal "#0070f3"; keys still known
\`\`\`

Rule of thumb: \`: T\` constrains *and* widens to \`T\`; \`satisfies T\` constrains but **preserves** the narrow inferred type. Reach for \`satisfies\` whenever you want a type-check on a literal without throwing away its precision.`,
    exercises: [
    {
      id: "as-const-derive",
      title: "Derive from a value",
      instructions: `The \`config\` object is already \`as const\`. Replace \`type ConfigKey = string\` with a type **derived** from the value: \`keyof typeof config\`. \`key\` must then be one of \`"host" | "port" | "retries"\` — anything else should be a type error.

**Expected output:** \`key: host value: localhost\``,
      starterCode: `// \`as const\` freezes a literal to its narrowest readonly type. Combined with
// \`keyof typeof\`, the VALUE is the single source of truth and the type is
// derived from it — change the object, the type updates for free.
const config = {
  host: "localhost",
  port: 8080,
  retries: 3,
} as const;

// TODO: derive a union of config's keys.
//   typeof config  -> the object's type
//   keyof typeof config -> "host" | "port" | "retries"
// Replace \`string\` with that derived type:
type ConfigKey = string;

const key: ConfigKey = "host";
console.log("key:", key, "value:", config[key as keyof typeof config]);
`,
    },
    {
      id: "enum-vs-union",
      title: "enum vs union",
      instructions: `Replace the placeholder \`type Direction = string\` with the union of the const object's **values**: \`(typeof Direction)[keyof typeof Direction]\`. Then implement \`opposite\` so it maps each direction to its opposite (up/down, left/right). The value and type may share the name \`Direction\`.

**Expected output:** \`opposite of up: down\``,
      starterCode: `// A TS \`enum\` emits a runtime object and has sharp edges (numeric enums are
// bidirectional, values aren't plain strings). Idiomatic TS often prefers a
// \`const\` object plus a derived union: zero runtime surprises, plain values.
const Direction = {
  Up: "up",
  Down: "down",
  Left: "left",
  Right: "right",
} as const;

// TODO: derive the union of the object's *values* (not keys).
//   (typeof Direction)[keyof typeof Direction] -> "up" | "down" | "left" | "right"
// Replace \`string\` with that derived type:
type Direction = string;

function opposite(d: Direction): Direction {
  // TODO: return the opposite direction. Placeholder keeps the starter runnable:
  return d;
}

console.log("opposite of up:", opposite(Direction.Up));
`,
    },
    {
      id: "satisfies-op",
      title: "The satisfies operator",
      instructions: `\`palette\` uses \`satisfies Record<string, HexColor>\` so its literal keys and values survive. Confirm a specific member is still accessible by logging \`palette.primary\` (or \`palette.danger\`). Note how, with \`satisfies\`, the editor still knows the exact keys — unlike a \`: Record<...>\` annotation.

**Expected output:** \`primary: #0070f3\``,
      starterCode: `// \`satisfies\` checks a value against a type WITHOUT widening it. Annotating
// \`: Record<string, string>\` would erase the literal keys; \`satisfies\` verifies
// the constraint yet keeps the precise inferred type, so members stay known.
type HexColor = \`#\${string}\`;

const palette = {
  primary: "#0070f3",
  danger: "#e00",
} satisfies Record<string, HexColor>;

// Because we used \`satisfies\`, \`palette.primary\` is the literal "#0070f3",
// and \`palette\` still has exactly the keys \`primary\` and \`danger\` — try typing
// \`palette.\` and you'll see both. With a \`: Record<...>\` annotation that
// precision would be lost.

// TODO: read a specific member off \`palette\` (e.g. palette.primary) and log it.
//   Because of \`satisfies\`, the exact keys survive — your editor autocompletes
//   \`primary\` and \`danger\`. Placeholder keeps the starter runnable:
console.log("primary:", "(read palette.primary)");
`,
    },
    ],
  },
  {
    id: "pitfalls-and-patterns",
    module: "practical-typing",
    title: "Pitfalls and Patterns",
    blurb: "as/!/any traps, plus branded and readonly patterns.",
    content: `## The escape hatches that lie

TypeScript gives you ways to overrule the checker. Each is occasionally necessary and routinely abused — they assert a *belief*, they don't *verify* it.

**\`as\` (type assertion)** says "trust me, it's this type." The compiler obeys without checking. \`as\` is not a cast — there's no runtime conversion — so a wrong \`as\` is a runtime bug the checker was told to ignore.

\`\`\`ts
const el = JSON.parse(s) as User; // a lie if the JSON isn't a User
\`\`\`

**Non-null \`!\`** asserts "this isn't null/undefined." \`user!.name\` silences the checker exactly where a real null would crash. Prefer a guard (\`if (user)\`) that *proves* it.

**\`any\` leakage** from untyped libraries spreads silently (see the previous module). Contain it: type the boundary as \`unknown\` or a precise shape and narrow once.

## Structural typing surprises

TS types are **structural**, not nominal (unlike Java/C#): compatibility is by shape, so an object with *extra* fields satisfies a smaller type. Object **literals** get a special excess-property check, but a value passed through a variable does not — extra fields slip through:

\`\`\`ts
type Pt = { x: number; y: number };
const p = { x: 1, y: 2, z: 3 };
const q: Pt = p; // OK — p has at least x and y; z slips through
\`\`\`

And **\`==\` vs \`===\`**: \`==\` does coercion (\`0 == ""\`, \`null == undefined\`). Use \`===\` everywhere; the checker won't save you from \`==\`.

## Two patterns worth keeping

**Branded (nominal) types.** Intersect a base type with a unique, erased tag so two same-shaped types stop being interchangeable:

\`\`\`ts
type UserId = string & { readonly __brand: "UserId" };
const asUserId = (s: string) => s as UserId; // brand only at the constructor
\`\`\`

Now a plain \`string\` won't pass where a \`UserId\` is required — nominal safety, zero runtime cost (it erases).

**\`readonly\` by default.** Type inputs as \`readonly T[]\` / \`Readonly<T>\` so mutation is a *compile* error, not a convention you hope holds. Copy before you sort or push:

\`\`\`ts
function top(xs: readonly number[]) {
  return [...xs].sort((a, b) => b - a)[0]; // copy, don't mutate the caller's array
}
\`\`\`

Together: \`unknown\` at the boundary, derive types from values, brand your ids, default to \`readonly\` — and reach for \`as\`/\`!\` only when you can name why the checker is wrong.`,
    exercises: [
    {
      id: "fix-the-any",
      title: "Fix the any leak",
      instructions: `\`getConfig\` returns \`any\`, so the typo \`cfg.timeoutMS\` (wrong casing) would compile and be \`undefined\` at runtime. Change the return type to the precise \`{ timeoutMs: number; retries: number }\` so the editor catches such a bug. The starter already reads the *correct* field.

**Expected output:** \`timeout: 5000\``,
      starterCode: `// \`any\` leaks: once a value is \`any\`, everything you pull off it is \`any\` too,
// and checking stops. Here \`getConfig\` returns \`any\`, so a typo on a field name
// compiles. Tighten the return type so the editor catches the mistake.

// TODO: change the return type from \`any\` to a precise type.
//   Give it a return type of \`{ timeoutMs: number; retries: number }\`.
function getConfig(): any {
  return { timeoutMs: 5000, retries: 3 };
}

const cfg = getConfig();

// With \`any\`, \`cfg.timeoutMS\` (wrong casing) compiles and is \`undefined\` at
// runtime. With a precise return type, the editor flags it. Use the real field:
const timeout = cfg.timeoutMs;
console.log("timeout:", timeout);
`,
    },
    {
      id: "branded-type",
      title: "A branded type",
      instructions: `\`UserId\` is \`string\` intersected with an erased brand, so a bare string can't be used where a \`UserId\` is required — \`greet("abc")\` would not compile. Build one via \`makeUserId\` and pass it to \`greet\`. The brand vanishes at runtime; \`id\` is just a string.

**Expected output:** \`Hello, user u_123\``,
      starterCode: `// TS is STRUCTURAL: a UserId and an OrderId that are both \`string\` are freely
// interchangeable — a real bug source. A *branded* type bolts an invisible,
// erased tag onto the type so the two can't be mixed, while staying a plain
// string at runtime. This is how you get nominal typing in a structural system.
type UserId = string & { readonly __brand: "UserId" };

function makeUserId(raw: string): UserId {
  // The brand exists only in the type system; assert across at the constructor,
  // the ONE place we vouch for the value.
  return raw as UserId;
}

function greet(id: UserId): string {
  return \`Hello, user \${id}\`;
}

// TODO: build a UserId via makeUserId("u_123") and pass it to greet, then log
//   the result. Note: passing a bare string like greet("abc") would NOT compile
//   — that's the whole point; the brand can only be minted by makeUserId.
// Placeholder so the starter runs cleanly; replace with the real construction:
console.log("(build a UserId, then greet it)");
`,
    },
    {
      id: "readonly-guard",
      title: "readonly prevents mutation",
      instructions: `\`firstTwoSorted\` takes a \`readonly number[]\`, so \`items.sort()\` or \`items.push()\` is a **compile error** (the commented lines show it). Copy the array, sort the copy ascending, and return its first two elements — leaving the caller's array untouched.

**Expected output:** \`result: [1,2]\` then \`source untouched: [5,2,9,1]\``,
      starterCode: `// \`readonly T[]\` (or \`Readonly<T>\`) makes mutation a COMPILE error, not a
// runtime convention. Type a parameter readonly to promise — and enforce — that
// the function won't mutate its caller's array. Unlike a runtime freeze, this
// costs nothing at runtime; it's erased.
function firstTwoSorted(items: readonly number[]): number[] {
  // items.sort();        // ERROR: sort() mutates — not allowed on readonly[]
  // items.push(0);       // ERROR: push() mutates — not allowed on readonly[]
  // Make a copy first, then it's safe to sort the copy:
  const copy = [...items];
  // TODO: sort \`copy\` ascending and return its first two elements.
  //   Placeholder keeps the starter runnable:
  return copy.slice(0, 2);
}

const source = [5, 2, 9, 1];
console.log("result:", firstTwoSorted(source));
console.log("source untouched:", source);
`,
    },
    ],
  },
];
