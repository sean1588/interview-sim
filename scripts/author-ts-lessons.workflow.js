export const meta = {
  name: 'author-ts-lessons',
  description: 'Author + adversarially review the 8-module TypeScript learning curriculum (24 lessons), typing-forward.',
  phases: [
    { title: 'Author', detail: 'one agent per module writes lessons + exercises, verifies starters transpile + run' },
    { title: 'Review', detail: 'adversarial review per module: type accuracy, framing, scaffold-not-solution, re-verify' },
  ],
}

// Full curriculum. Lesson/exercise ids + titles + blurbs are PRE-ASSIGNED here so
// they are deterministic and globally unique; agents fill in `content` (lesson
// markdown), `instructions` (exercise markdown) and `starterCode` (a runnable,
// self-contained TypeScript scaffold). Audience: experienced JS developers who
// are new to TypeScript. Weighted toward the type system.
const CURRICULUM = [
  {
    moduleId: 'basics', file: 'basics.ts', konst: 'basicsLessons',
    lessons: [
      { id: 'what-is-typescript', title: 'TypeScript on Top of JavaScript',
        blurb: 'A static type layer over JS, checked then erased.',
        focus: "TypeScript is JavaScript plus a STATIC type layer that is checked at compile time and then ERASED: types do not exist at runtime, there are no runtime type checks, and tsc emits plain JS. Typing is STRUCTURAL (shape-based, not name-based). Cover the transpile model (tsc / transpileModule) and strict mode briefly. IMPORTANT for this course: code here runs transpile-and-run, so TYPE errors appear as red squiggles in the editor but DO NOT block Run, and there is no separate type-check step — rely on the editor squiggles for type feedback while Run shows runtime behavior. Contrast with Java/C# where types are enforced and partly present at runtime.",
        exercises: [
          { id: 'annotate-and-run', title: 'Annotate, then run', task: 'Take a small untyped snippet, add type annotations to the variables and the function parameter/return, and run it to confirm the runtime behavior is unchanged because types are erased. Print a result.' },
          { id: 'spot-the-squiggle', title: 'Squiggle, not a blocker', task: 'Given a value with a type annotation, observe that code still RUNS even when a type is off (type errors do not block Run here); have them adjust the annotation so the editor squiggle goes away, then run. Keep it runtime-safe.' },
        ] },
      { id: 'primitives-and-inference', title: 'Primitives, Literals, and Inference',
        blurb: 'Annotations, inference, and any vs unknown vs never.',
        focus: "Primitive annotations string/number/boolean plus null and undefined; arrays as T[] and Array<T>; tuples like [string, number]; literal types ('GET' | 'POST'); how const vs let affects the inferred type (const narrows to the literal, let widens). When to annotate vs let TS infer. The special types: any (opts out of checking — a hole), unknown (top type, must be narrowed before use), never (bottom type), void (no useful return). Contrast with JS's single number type and dynamic typing.",
        exercises: [
          { id: 'annotate-primitives', title: 'Annotate primitives', task: 'Annotate a set of variables and a function with the right primitive, array, and tuple types so the editor is satisfied, and print them.' },
          { id: 'literal-and-inference', title: 'Literals and widening', task: 'Show the difference between a value declared with let (widened to string/number) and one fixed with as const or a literal-union annotation (narrowed). Assign a literal-union-typed variable and print it.' },
          { id: 'any-vs-unknown', title: 'any vs unknown', task: 'Given a value typed as unknown, show that you must narrow it with a typeof check before using it as a string, and contrast with any which skips the check. Print the narrowed result.' },
        ] },
      { id: 'type-vs-value', title: 'Type Space vs Value Space',
        blurb: 'typeof type operator, aliases, and the as escape hatch.',
        focus: "Type-space vs value-space: a type/interface declaration produces NO runtime value, and a const/function produces no type you can name directly except via the typeof TYPE operator (distinct from the JS runtime typeof). Type aliases with `type`. The `as` type assertion as an UNCHECKED escape hatch that can lie, and when narrowing is the safer choice. The non-null assertion `!`. Contrast with languages that have runtime reflection.",
        exercises: [
          { id: 'typeof-operator', title: 'Derive a type with typeof', task: 'Use the typeof TYPE operator to derive a type from a value object and annotate another variable with it; print to confirm the runtime value.' },
          { id: 'assertion-danger', title: 'When as lies', task: 'Show a type assertion (as) that compiles but is wrong, alongside the safer narrowing alternative; print the result from the safe path.' },
        ] },
    ],
  },
  {
    moduleId: 'functions-objects', file: 'functions-objects.ts', konst: 'functionsObjectsLessons',
    lessons: [
      { id: 'typing-functions', title: 'Typing Functions',
        blurb: 'Params, optionals, rest, void, and function types.',
        focus: "Typing function parameters and return values; optional params with ? and default params and how they interact; rest params like ...args: number[]; the void return type; function-type expressions like (a: number) => string and call signatures on object types; a brief note on overloads. Contrast with untyped JS functions and Java method overloading.",
        exercises: [
          { id: 'typed-function', title: 'A fully typed function', task: 'Write a typed function with a required param, an optional param, and an explicit return type; call it both with and without the optional arg and print the results.' },
          { id: 'function-type-value', title: 'A function-typed variable', task: 'Declare a variable whose type is a function-type expression, assign a matching arrow function, call it, and print the result.' },
          { id: 'rest-and-void', title: 'Rest params and void', task: 'Write a variadic function typed with rest params returning a number, and a void-returning logger; demonstrate both and print the number.' },
        ] },
      { id: 'object-types', title: 'Object Types: interface vs type',
        blurb: 'Object shapes, optional/readonly, and index signatures.',
        focus: "Object type literals; interface vs type (interfaces for object shapes and extends/declaration merging; type aliases for unions, primitives, tuples, and mapped/conditional types — both work for plain objects, choose by use). Optional ? and readonly properties; index signatures like [key: string]: number; nested object shapes. Contrast with plain JS objects that have no shape enforcement.",
        exercises: [
          { id: 'shape-an-object', title: 'Shape an object', task: 'Define an interface for an object with required, optional, and readonly fields; build a conforming value and print a field.' },
          { id: 'index-signature', title: 'Index signatures', task: 'Type a dictionary-like object with an index signature, populate it, and print the sum of its values.' },
          { id: 'interface-vs-type', title: 'interface vs type', task: 'Model the same object shape once with interface and once with type to show they are interchangeable for objects; then use type for something interface cannot express (a union). Print a value.' },
        ] },
      { id: 'structural-typing', title: 'Structural Typing',
        blurb: 'Shape-based assignability, excess checks, composition.',
        focus: "Structural (duck) typing: assignability is by SHAPE, not by declared name — an object with the right properties is assignable even if it never names the type. The excess-property check on fresh object literals (the one place TS gets stricter). Composition via interface extends and intersection A & B. Contrast sharply with nominal typing in Java/C# where the names must match.",
        exercises: [
          { id: 'structural-assign', title: 'Assignable by shape', task: 'Show that a plain object (or a differently-named type) is assignable to a target interface purely by shape; pass it to a function typed to that interface and print the result.' },
          { id: 'excess-property', title: 'The excess-property check', task: 'Trigger the excess-property check by passing an object literal with an extra field, then fix it (assign to a variable first, or drop the field). Print the accepted result. Keep the starter runtime-safe.' },
          { id: 'extend-and-intersect', title: 'extends and intersection', task: 'Compose one type with interface extends and another with intersection &, build a value, and print combined fields.' },
        ] },
    ],
  },
  {
    moduleId: 'unions-narrowing', file: 'unions-narrowing.ts', konst: 'unionsNarrowingLessons',
    lessons: [
      { id: 'union-types', title: 'Union Types',
        blurb: 'Values that are one of several types.',
        focus: "Union types A | B — a value that is one of several types. Literal unions for finite sets like 'red' | 'green' | 'blue' or a set of status codes. Unions of object types. What you can do with a union BEFORE narrowing (only the members common to every arm). Writing a function that accepts string | number. Contrast with JS where this is implicit and unchecked.",
        exercises: [
          { id: 'string-or-number', title: 'string | number', task: 'Write format(x: string | number) that handles both arms (use only common operations, or narrow first); print results for a string input and a number input.' },
          { id: 'literal-union', title: 'A literal union', task: 'Define a literal-union type for a small fixed set (e.g. compass directions), write a function constrained to it, and call it. Mention in instructions that the editor rejects an invalid member.' },
          { id: 'union-of-objects', title: 'Union of object types', task: 'Type a value as a union of two object shapes that share a property, access the shared property, and print it.' },
        ] },
      { id: 'narrowing', title: 'Narrowing',
        blurb: 'typeof, instanceof, in, and truthiness narrowing.',
        focus: "Control-flow narrowing: inside an if, TS narrows a union to a specific type. The narrowing operators: typeof (primitives), instanceof (classes), the `in` operator (property presence), truthiness checks, and equality/=== narrowing. How TS tracks the narrowed type through each branch. These are runtime checks you would write in JS anyway — here they also refine the static type.",
        exercises: [
          { id: 'typeof-narrow', title: 'Narrow with typeof', task: 'Narrow a string | number with a typeof check and call a type-specific method in each branch; print both outcomes.' },
          { id: 'in-narrow', title: 'Narrow with in', task: 'Narrow a union of two object types using the `in` operator on a distinguishing property; handle each shape and print.' },
          { id: 'truthiness-narrow', title: 'Narrow away null', task: 'Narrow away null/undefined from a string | null with a truthiness guard before using it, and print the safe result.' },
        ] },
      { id: 'discriminated-unions', title: 'Discriminated Unions',
        blurb: 'Tagged unions and switching on the tag.',
        focus: "Discriminated (tagged) unions: give each member a shared literal tag field (kind/type), then switch on it to narrow exhaustively. The canonical modeling pattern — Shape = Circle | Square | Triangle, each with its own kind and fields. Why this beats one big interface full of optional fields. Contrast with sealed classes / the visitor pattern in Java.",
        exercises: [
          { id: 'model-shapes', title: 'Model shapes', task: 'Define a discriminated union of two or three shapes (each with a kind literal and its own fields) and an area(shape) function that switches on kind; print the areas.' },
          { id: 'tagged-result', title: 'A tagged result', task: 'Model a { ok: true; value } | { ok: false; error } union; write a handler that branches on the tag; print both an ok and an error outcome.' },
          { id: 'narrow-by-tag', title: 'Narrow by tag', task: 'Given a discriminated-union value, switch on its tag and access member-specific fields safely; print.' },
        ] },
      { id: 'type-guards-exhaustiveness', title: 'Type Guards & Exhaustiveness',
        blurb: 'x is T guards and never-based exhaustiveness.',
        focus: "User-defined type guards: a function returning `x is T` that TS uses to narrow. Assertion functions (asserts x is T) briefly. Exhaustiveness checking: a default branch that assigns the value to `never` (the assertNever helper) so adding a new union member becomes a compile error. Why exhaustiveness is the real payoff of discriminated unions.",
        exercises: [
          { id: 'type-predicate', title: 'A type predicate', task: 'Write isString(x: unknown): x is string and use it to filter a mixed array down to strings; print them.' },
          { id: 'assert-never', title: 'assertNever', task: 'Add an assertNever default case to a discriminated-union switch so it is exhaustive; print a result for every handled case.' },
          { id: 'guard-a-union', title: 'Guard a union', task: 'Write a custom guard that distinguishes two object shapes in a union and use it to branch; print.' },
        ] },
    ],
  },
  {
    moduleId: 'generics', file: 'generics.ts', konst: 'genericsLessons',
    lessons: [
      { id: 'generic-functions', title: 'Generic Functions',
        blurb: 'Type parameters, inference, and constraints.',
        focus: "Generic functions: a type parameter <T> that links input and output types, e.g. identity<T>(x: T): T. Inference — you rarely pass type args explicitly. Multiple type params. Generic constraints with extends, e.g. <T extends { length: number }>. Default type params like <T = string>. Why a generic beats any (it preserves and relates the types). Contrast with Java/C# generics — TS's are structural and fully erased.",
        exercises: [
          { id: 'generic-identity', title: 'A generic helper', task: 'Write a generic firstOrNull<T>(arr: T[]): T | null and call it on arrays of two different element types; print, noting the inferred return type.' },
          { id: 'constrained-generic', title: 'A constrained generic', task: 'Write longest<T extends { length: number }>(a: T, b: T): T constrained to things with a length, call it on strings and on arrays, and print.' },
          { id: 'generic-pair', title: 'Two type parameters', task: 'Write pair<A, B>(a: A, b: B): [A, B] and use it; print the tuple.' },
        ] },
      { id: 'generic-types', title: 'Generic Types, keyof, and Indexed Access',
        blurb: 'Box<T>, keyof, and the typed get(obj, key).',
        focus: "Generic interfaces, type aliases, and classes: Box<T>, Pair<A, B>. The keyof operator (the union of an object type's keys) and indexed access types T[K]. The classic constrained pattern get<T, K extends keyof T>(obj: T, key: K): T[K]. Contrast with reaching for any in plain JS.",
        exercises: [
          { id: 'generic-box', title: 'A generic Box', task: 'Define a generic Box<T> (interface or type) holding a value; build boxes of two element types and print their contents.' },
          { id: 'keyof-get', title: 'Typed get(obj, key)', task: 'Implement the typed get using K extends keyof T returning T[K]; call it for a couple of keys and print the correctly-typed results.' },
          { id: 'generic-stack', title: 'A generic Stack', task: 'Define a generic Stack<T> (type or class) with push and pop typed in terms of T; push a few values, pop one, and print.' },
        ] },
      { id: 'generics-in-practice', title: 'Generics in Practice',
        blurb: 'Result<T,E>, generic utilities, and when to reach for them.',
        focus: "Putting generics to work: a reusable Result<T, E> type and helpers, a generic container/cache, mapping over typed collections. Knowing when a generic earns its keep vs over-engineering. The intuition that a generic is a function at the type level. Reinforce: generics beat any because they preserve and relate types.",
        exercises: [
          { id: 'result-type', title: 'A Result type', task: 'Define Result<T, E> as a union of { ok: true; value: T } and { ok: false; error: E }; write generic ok and err constructors and an unwrapOr; print both branches.' },
          { id: 'generic-map', title: 'A generic map', task: 'Write a generic mapValues<T, U>(arr: T[], fn: (t: T) => U): U[] with an explicit signature and a loop (do not just delegate to Array.map in the signature lesson); use it and print.' },
          { id: 'typed-cache', title: 'A typed cache', task: 'Write a tiny generic Cache<V> with get and set keyed by string; use it for two different value types and print.' },
        ] },
    ],
  },
  {
    moduleId: 'type-combinators', file: 'type-combinators.ts', konst: 'typeCombinatorsLessons',
    lessons: [
      { id: 'utility-types', title: 'Built-in Utility Types',
        blurb: 'Partial, Pick, Omit, Record, ReturnType, and friends.',
        focus: "The built-in utility types you will use daily: Partial<T>, Required<T>, Readonly<T>, Pick<T, K>, Omit<T, K>, Record<K, V>, NonNullable<T>, ReturnType<F>, Parameters<F>, Awaited<T>. What each does and when to reach for it. Note they are themselves built from mapped/conditional types (the next lessons). They are TYPE-LEVEL, so to see one at runtime you build a VALUE of the resulting type and print it.",
        exercises: [
          { id: 'partial-and-pick', title: 'Partial and Pick', task: 'Given a User interface, build a Partial<User> patch value and a Pick<User, ...> summary value, and print them.' },
          { id: 'record-type', title: 'Record', task: 'Use Record<string, number> (or a literal-union key) to type a lookup, populate it, and print a value.' },
          { id: 'returntype', title: 'ReturnType', task: 'Use ReturnType<typeof someFn> to type a variable to a function return type; assign a matching value and print it.' },
        ] },
      { id: 'mapped-types', title: 'Mapped Types',
        blurb: '{ [K in keyof T] } — type-level iteration.',
        focus: "Mapped types: { [K in keyof T]: ... } transforms every property of T. Key remapping with `as`. Modifiers: add or remove readonly and ? with + and -. Rebuild Partial<T> and Readonly<T> by hand to see how the built-ins work. This is iteration at the type level.",
        exercises: [
          { id: 'my-partial', title: 'Rebuild Partial', task: 'Implement MyPartial<T> = { [K in keyof T]?: T[K] } by hand, apply it to an interface, and build and print a partial value.' },
          { id: 'my-readonly', title: 'Rebuild Readonly', task: 'Implement MyReadonly<T> with the readonly modifier; apply it and build a value; print it (mention the editor flags writes).' },
          { id: 'stringify-fields', title: 'Map fields to strings', task: 'Write a mapped type that turns every field of T into a string field; build a conforming value and print it.' },
        ] },
      { id: 'conditional-types', title: 'Conditional Types and infer',
        blurb: 'T extends U ? X : Y, distribution, and infer.',
        focus: "Conditional types T extends U ? X : Y — branching at the type level. Distribution over unions (a conditional over a union applies to each member). The infer keyword to capture a type from a position, e.g. unwrap Promise<infer V> or an array element T extends (infer E)[] ? E : T. Building things like Flatten<T>. Contrast with the value-level ternary.",
        exercises: [
          { id: 'conditional-basic', title: 'A conditional type', task: 'Write IsArray<T> = T extends any[] ? true : false, then build values like const a: IsArray<number[]> = true and const b: IsArray<string> = false and print them.' },
          { id: 'infer-element', title: 'infer the element', task: 'Write ElementType<T> = T extends (infer E)[] ? E : T and use it to type a variable to an array element type; assign a value and print it.' },
          { id: 'unwrap-promise', title: 'Unwrap a Promise type', task: 'Write Unwrap<T> = T extends Promise<infer V> ? V : T (or use Awaited) and type a value to the unwrapped type; print it (a plain value, not an awaited one).' },
        ] },
      { id: 'template-literal-types', title: 'Template Literal Types',
        blurb: 'String literal types and key remapping.',
        focus: "Template literal types: build string-literal types by interpolation, e.g. `on${Capitalize<EventName>}`. The intrinsic string types Uppercase/Lowercase/Capitalize/Uncapitalize. Combining with mapped types to remap keys, e.g. turn { click } into { onClick }. A glimpse of type-level string manipulation. They are type-level, so build a VALUE of the resulting type and print it to see it at runtime.",
        exercises: [
          { id: 'event-name', title: 'An event-name type', task: 'Write EventName<T extends string> = `on${Capitalize<T>}` and build a value typed EventName<\'click\'> whose value is \'onClick\'; print it.' },
          { id: 'prefixed-keys', title: 'Prefix every key', task: 'Use a mapped type with key remapping and a template literal to prefix every key of an object type; build a conforming value and print it.' },
          { id: 'css-units', title: 'A px unit type', task: 'Define a template-literal type like `${number}px`, assign a couple of valid values, and print them (mention the editor rejects a bad one).' },
        ] },
    ],
  },
  {
    moduleId: 'classes', file: 'classes.ts', konst: 'classesLessons',
    lessons: [
      { id: 'classes-and-modifiers', title: 'Classes and Access Modifiers',
        blurb: 'Typed members, modifiers, and private vs #private.',
        focus: "TS classes add types to JS classes: typed fields and methods; access modifiers public (the default), private, protected, and readonly; parameter properties (declare and assign a field straight from the constructor signature); getters/setters; static members. The difference between TS private (compile-time only, still visible at runtime) and JS #private (truly private at runtime). Contrast with Java/C# access control.",
        exercises: [
          { id: 'typed-class', title: 'A typed class', task: 'Write a class with typed fields, a constructor, and a method; instantiate it and print a computed value.' },
          { id: 'parameter-properties', title: 'Parameter properties', task: 'Rewrite a small class to use parameter properties (modifiers on the constructor params) to cut boilerplate; instantiate and print.' },
          { id: 'private-vs-hash', title: 'private vs #private', task: 'Show a private field (compile-time) and a #private field (runtime) on a class, access both from a method, and print; mention which the editor blocks from outside.' },
        ] },
      { id: 'interfaces-abstract-generics', title: 'implements, abstract, and Generic Classes',
        blurb: 'Contracts, abstract bases, and generic classes.',
        focus: "Classes implementing interfaces (implements); abstract classes and abstract methods (a base that cannot be instantiated); generic classes like class Box<T>; this-typed returns for fluent/builder methods (brief). When to use an abstract class vs an interface. Contrast with Java abstract classes and interfaces.",
        exercises: [
          { id: 'implements-interface', title: 'implements an interface', task: 'Define an interface and a class that implements it; build an instance, call the interface method, and print.' },
          { id: 'abstract-base', title: 'An abstract base', task: 'Write an abstract base class with one concrete and one abstract method, and a subclass that implements the abstract one; instantiate the subclass and print.' },
          { id: 'generic-class', title: 'A generic class', task: 'Write a generic class Wrapper<T> with a typed value and a map method returning a new wrapper; use it and print.' },
        ] },
    ],
  },
  {
    moduleId: 'async-modules', file: 'async-modules.ts', konst: 'asyncModulesLessons',
    lessons: [
      { id: 'typing-async', title: 'Typing Async Code',
        blurb: 'Promise<T>, await, and unknown in catch.',
        focus: "Typing asynchronous code: an async function returns Promise<T>; await unwraps it. Typing Promise.all (a tuple of results). Typing the catch clause — the caught value is unknown in modern TS, so you must narrow it (instanceof Error) before reading .message. IMPORTANT for the exercises: the in-browser runner captures SYNCHRONOUS console output only, so center the runnable parts on the TYPES and synchronous illustration — an awaited result may not appear in Run output. State this in the lesson card.",
        exercises: [
          { id: 'type-a-promise', title: 'Type a Promise', task: 'Write an async function with an explicit Promise<number> return type and a synchronous caller that logs something about the returned promise (e.g. that it is a Promise); emphasize the annotation. Do NOT rely on an awaited value appearing in output. Keep it runtime-safe.' },
          { id: 'narrow-catch', title: 'Narrow unknown in catch', task: 'Write a try/catch where the caught value is unknown; narrow it with instanceof Error before reading .message; print the handled message synchronously (throw and catch synchronously so output appears).' },
        ] },
      { id: 'modules-and-tooling', title: 'Modules, import type, and tsconfig',
        blurb: 'ES modules, type-only imports, and the toolchain.',
        focus: "ES modules in TS: import/export, default vs named, and TYPE-ONLY imports (import type { Foo }) which are erased and avoid runtime cycles. A brief note on .d.ts declaration files (typing untyped JS) and the @types/* packages. tsconfig essentials: strict, target, module, lib, esModuleInterop. The toolchain: tsc, ts-node/tsx, and eslint with @typescript-eslint. This is a CONVERSATIONAL lesson with NO exercises (imports do not resolve in the single-file runner).",
        exercises: [] },
    ],
  },
  {
    moduleId: 'practical-typing', file: 'practical-typing.ts', konst: 'practicalTypingLessons',
    lessons: [
      { id: 'unknown-and-validation', title: 'Taming unknown at the Boundary',
        blurb: 'Narrowing external data instead of trusting any.',
        focus: "Working with unknown at the boundaries: JSON.parse returns any, so treat external data as unknown and narrow it (typeof/in/custom guards) before trusting it. Why any silently disables checking and spreads. Parse, do not validate — turn unknown into a typed value ONCE at the edge. Exercises use JSON strings plus hand-written guards (no validation libraries, no deps). Contrast with trusting any.",
        exercises: [
          { id: 'parse-unknown', title: 'Parse to unknown', task: 'JSON.parse a provided string to unknown, then narrow it with typeof/property checks into a typed object before use, and print a field.' },
          { id: 'guard-the-shape', title: 'Guard the shape', task: 'Write isUser(x: unknown): x is User checking the needed fields, apply it to parsed data, branch on the result, and print.' },
          { id: 'any-is-a-hole', title: 'any is a hole', task: 'Show how typing parsed data as any lets a wrong access compile (and would blow up at runtime) versus the unknown-plus-guard path; print the safe result. Keep the starter runtime-safe.' },
        ] },
      { id: 'as-const-and-derivation', title: 'as const, Derivation, and satisfies',
        blurb: 'Single-source-of-truth types and satisfies.',
        focus: "as const freezes a literal to its narrowest readonly type. Deriving types from values with typeof and keyof (single source of truth — define the value, derive the type). enums vs unions-of-literals: why a const object plus typeof/union often beats enum (enums emit runtime code and have quirks). The satisfies operator — check a value against a type WITHOUT widening it, keeping the precise inferred type.",
        exercises: [
          { id: 'as-const-derive', title: 'Derive from a value', task: 'Define a const config object with as const, derive a union type of its keys with keyof typeof, use that type for a variable, and print a key.' },
          { id: 'enum-vs-union', title: 'enum vs union', task: 'Replace an enum with a const object plus a derived union type, write a function over the union, and print a result.' },
          { id: 'satisfies-op', title: 'The satisfies operator', task: 'Use satisfies to check an object against a Record type while keeping its precise literal types (show a specific member is still accessible); print it.' },
        ] },
      { id: 'pitfalls-and-patterns', title: 'Pitfalls and Patterns',
        blurb: 'as/!/any traps, plus branded and readonly patterns.',
        focus: "The common TS pitfalls and how to avoid them: as assertions that lie, the non-null ! that hides real nulls, any leakage from untyped libraries, structural-typing surprises (extra fields slipping through), and == vs ===. A couple of solid patterns: branded/nominal types (brief) and readonly-by-default. A light capstone pulling earlier ideas together.",
        exercises: [
          { id: 'fix-the-any', title: 'Fix the any leak', task: 'Given code that leaks any, tighten it to a precise type (or unknown plus a guard) so the editor catches a bug; print the corrected result.' },
          { id: 'branded-type', title: 'A branded type', task: 'Create a simple branded type such as type UserId = string & { readonly __brand: \'UserId\' } and a constructor, to prevent mixing it with a plain string; print a value.' },
          { id: 'readonly-guard', title: 'readonly prevents mutation', task: 'Type a function parameter as readonly T[] (or Readonly<T>) to prevent mutation; mention the editor flags a mutation attempt, and print the non-mutating result.' },
        ] },
    ],
  },
]

const OUT_DIR = '/tmp/ts-lessons'

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['moduleId', 'jsonPath', 'lessonCount', 'exerciseCount', 'allStartersRun', 'unrunnableStarters', 'issues', 'status'],
  properties: {
    moduleId: { type: 'string' },
    jsonPath: { type: 'string' },
    lessonCount: { type: 'number' },
    exerciseCount: { type: 'number' },
    allStartersRun: { type: 'boolean' },
    unrunnableStarters: { type: 'array', items: { type: 'string' }, description: 'exercise ids whose starter could not be executed cleanly (should be empty)' },
    issues: { type: 'array', items: { type: 'string' }, description: 'problems found/fixed; empty if clean' },
    status: { type: 'string', enum: ['ok', 'problems'] },
  },
}

const RULES = `
AUDIENCE: experienced programmers who know JavaScript WELL (and maybe a typed language like Java, C#, or Go) but are NEW TO TYPESCRIPT.
- NEVER explain what a variable, loop, function, or class fundamentally is. They know JS.
- Lead with the TypeScript-specific idea — especially the TYPE SYSTEM, which is the whole point of this course — and explicitly contrast with plain JavaScript (the anchor) and with Java/C#/Go where it sharpens the point ("unlike Java, TS types are structural and erased at runtime").
- Be precise and a little opinionated about what is idiomatic TypeScript vs what merely compiles.

CONTENT FORMAT:
- "content" is GitHub-flavored Markdown shown on screen. Use fenced \\\`\\\`\\\`ts code blocks for examples. Aim for ~150-450 words plus a few short, correct examples per lesson. Teach the concept fully — this is the on-screen lesson card the tutor refers to.
- "instructions" is short Markdown telling the learner what to implement, ideally with a line about expected output.

STARTER CODE (the most important rules):
- "starterCode" is a RUNNABLE, SELF-CONTAINED TypeScript scaffold the learner edits: types/signature plus a clear "// TODO" plus an example call that console.logs something, so clicking Run produces output WITHOUT a runtime error.
- It MUST NOT contain the solution. Leave the core logic as a TODO (a placeholder return, or a clearly-marked stub). It is a starting point, not an answer key.
- SINGLE FILE, NO MODULES: never use top-level import or export or require — the runner executes one self-contained file and cannot resolve modules. Define everything inline.
- This engine is TRANSPILE-AND-RUN: TYPE errors do NOT block Run (they show as editor squiggles only), but the starter MUST be free of RUNTIME errors — the transpiled JS must execute cleanly. Do NOT put a deliberate TYPE error in the runnable starter; teach type errors in the lesson card prose instead. (If an exercise is about observing a squiggle, keep the starter runtime-safe so it still runs.)
- TYPE-LEVEL exercises (utility/mapped/conditional/template-literal types): types are ERASED, so a types-only file prints nothing. The starter MUST build a VALUE of the resulting type and console.log it so Run shows output.
- ASYNC: the runner captures SYNCHRONOUS console output only. Do not write a starter that depends on an awaited value appearing in the output; log synchronously.
- TypeScript only. 2-space indentation.

VERIFY each starter by running it exactly like the app does: write it to a file under ${OUT_DIR}/check/ (mkdir -p first; filename contains the exercise id) and run "node scripts/ts-lesson-check.mjs <file>" from the repo root. It transpiles (type-strip) and executes the starter in the same bare scope the browser worker uses; it must print "OK". Fix any starter that fails and re-run until clean.
`.trim()

phase('Author')

const results = await pipeline(
  CURRICULUM,
  // Stage 1 — author the module.
  (mod) => agent(
    `You are an expert TypeScript educator and engineer authoring one module of a guided TypeScript course.

${RULES}

Write the module "${mod.moduleId}". Here is the EXACT plan — keep every id, title, and blurb verbatim, fill in the prose/code:
${JSON.stringify(mod.lessons, null, 2)}

For each lesson, write "content" (lesson card markdown) from its "focus". For each exercise, write "instructions" (markdown) and "starterCode" (a runnable, self-contained TS scaffold) from its "task". The "module" field of every lesson MUST be "${mod.moduleId}".

OUTPUT: write a JSON file to ${OUT_DIR}/${mod.moduleId}.json with this exact shape (no trailing commentary):
{
  "moduleId": "${mod.moduleId}",
  "lessons": [
    { "id": "...", "module": "${mod.moduleId}", "title": "...", "blurb": "...", "content": "<markdown>", "exercises": [ { "id": "...", "title": "...", "instructions": "<markdown>", "starterCode": "<typescript>" } ] }
  ]
}
Use the pre-assigned ids/titles/blurbs from the plan verbatim. Write valid JSON (the Write tool handles escaping — just produce correct JSON).

VERIFY before returning: for EVERY exercise, write its starterCode to ${OUT_DIR}/check/<exerciseId>.ts and run "node scripts/ts-lesson-check.mjs ${OUT_DIR}/check/<exerciseId>.ts" from the repo root; it must print "OK". Fix any starter that fails (runtime error) and re-run until every starter passes. Re-read your JSON file at the end to confirm it parses.

Return the StructuredOutput summary. jsonPath is the file you wrote. allStartersRun is true only if every starter printed OK; unrunnableStarters lists any that did not. Set status to "ok" only if every starter ran clean and the JSON parses.`,
    { label: `author:${mod.moduleId}`, phase: 'Author', schema: SCHEMA }
  ),
  // Stage 2 — adversarial review + fix.
  (authored, mod) => agent(
    `You are a meticulous senior TypeScript engineer and educator doing an ADVERSARIAL review of one authored course module. Assume there are problems and hunt for them.

The module "${mod.moduleId}" was authored to ${OUT_DIR}/${mod.moduleId}.json. Read that file.

Check EVERY lesson and exercise for:
1. TYPE-SYSTEM ACCURACY — is every statement and code example correct for modern TypeScript (5.x)? No wrong claims about types, erasure, structural typing, narrowing, generics, mapped/conditional/template-literal types, or utility types. Examples must compile (modulo intentional teaching squiggles) and behave as described.
2. AUDIENCE/FRAMING — written for an experienced JS developer NEW TO TYPESCRIPT? It must NOT explain JS basics, and SHOULD lead with TS type-system specifics and contrast with JS/Java/C#/Go. Flag any condescending or beginner-pitched prose.
3. SCAFFOLD-NOT-SOLUTION — does each starterCode leave the core logic as a TODO rather than giving away the answer? If a starter already contains the solution, gut it back to a scaffold (types/signature + TODO + an example call that still runs clean and prints).
4. STARTER RUNS CLEAN — single self-contained file (NO import/export/require), no deliberate TYPE error in the runnable starter, and (for type-level exercises) it builds and logs a VALUE so Run shows output. The transpiled JS must execute without a runtime error.
5. INSTRUCTIONS<->STARTER MATCH and COMPLETENESS — instructions describe what the starter sets up; the content actually teaches the concept with correct examples.

FIX every problem you find by rewriting ${OUT_DIR}/${mod.moduleId}.json in place (keep the pre-assigned ids/titles/blurbs verbatim; keep "module" = "${mod.moduleId}").

RE-VERIFY: re-run every exercise starter via "node scripts/ts-lesson-check.mjs <file>" (write each to ${OUT_DIR}/check/<exerciseId>.ts first); each must print OK. Confirm the JSON still parses.

The author reported: ${JSON.stringify(authored)}

Return the StructuredOutput summary for the FINAL state of the file. List in "issues" what you fixed (empty if nothing needed fixing). status "ok" only if the file parses and every starter runs clean.`,
    { label: `review:${mod.moduleId}`, phase: 'Review', schema: SCHEMA }
  )
)

return results.filter(Boolean)
