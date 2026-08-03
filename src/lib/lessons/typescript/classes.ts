import type { Lesson } from "../types";

export const classesLessons: Lesson[] = [
  {
    id: "classes-and-modifiers",
    module: "classes",
    title: "Classes and Access Modifiers",
    blurb: "Typed members, modifiers, and private vs #private.",
    content: `TypeScript classes are JS classes with a type layer bolted on: fields and methods get type annotations, and you gain *access modifiers* that JavaScript never had.

**Typed members.** Unlike JS, you declare fields up front with types. You also get three *access modifiers* that control visibility — \`public\` (the default), \`private\`, and \`protected\` — plus \`readonly\`, which is a separate *mutability* modifier, not an access one: it controls whether a field can be reassigned after construction, and composes with any of the three (\`private readonly\`, \`public readonly\`, etc.).

\`\`\`ts
class Account {
  readonly id: string;      // assignable only in the constructor
  private balance: number;  // visible only inside this class
  protected note = "";      // this class + subclasses

  constructor(id: string, opening: number) {
    this.id = id;
    this.balance = opening;
  }

  deposit(amount: number): number {
    this.balance += amount;
    return this.balance;
  }
}
\`\`\`

**Parameter properties** kill boilerplate: put a modifier on a constructor parameter and TS declares *and* assigns the field for you — no separate field line, no \`this.x = x\`.

\`\`\`ts
class Point {
  constructor(public readonly x: number, public readonly y: number) {}
}
\`\`\`

**Getters/setters and static members** work like JS but are typed:

\`\`\`ts
class Temp {
  constructor(private c: number) {}
  get fahrenheit(): number { return this.c * 9 / 5 + 32; }
  static fromF(f: number): Temp { return new Temp((f - 32) * 5 / 9); }
}
\`\`\`

**The big gotcha — TS \`private\` vs JS \`#private\`.** TS \`private\` is a *compile-time* fiction: the editor blocks outside access, but the field is a plain property at runtime (reachable via a cast or \`obj["balance"]\`). JS \`#private\` is enforced by the *runtime* — the field genuinely isn't there from outside. This is unlike Java/C#, where \`private\` is a real access boundary enforced by the platform. Idiomatic TS: reach for \`#private\` when you need actual encapsulation, and \`private\` when a compile-time hint is enough.`,
    exercises: [
    {
      id: "typed-class",
      title: "A typed class",
      instructions: `Implement \`deposit\` so it adds \`amount\` to \`this.balance\` and returns the new balance. Notice \`owner\` is \`readonly\` — assignable only in the constructor. Expected output: \`150\`.`,
      starterCode: `class BankAccount {
  // Typed fields. \`readonly\` is enforced at compile time only.
  readonly owner: string;
  balance: number;

  constructor(owner: string, opening: number) {
    this.owner = owner;
    this.balance = opening;
  }

  // A typed method: parameter and return type are explicit.
  deposit(amount: number): number {
    // TODO: add \`amount\` to this.balance, then return the new balance.
    return this.balance;
  }
}

const acct = new BankAccount("Ada", 100);
console.log(acct.deposit(50)); // expected: 150 once implemented
`,
    },
    {
      id: "parameter-properties",
      title: "Parameter properties",
      instructions: `The constructor already uses **parameter properties** (\`public readonly x\`/\`y\`) — no field declarations or \`this.x = x\` lines needed. Implement \`manhattanFromOrigin\` to return \`|x| + |y|\` (use \`Math.abs\`). Expected output: \`3 -4 7\`.`,
      starterCode: `// Parameter properties: putting a modifier (public/private/readonly) on a
// constructor parameter declares AND assigns the field in one stroke.
class Point {
  // No separate field declarations, no \`this.x = x\` lines — the modifiers do it.
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  manhattanFromOrigin(): number {
    // TODO: return the Manhattan distance from (0, 0): |x| + |y|.
    return 0;
  }
}

const p = new Point(3, -4);
console.log(p.x, p.y, p.manhattanFromOrigin()); // expected: 3 -4 7 once implemented
`,
    },
    {
      id: "private-vs-hash",
      title: "private vs #private",
      instructions: `Both \`tsSecret\` (TS \`private\`) and \`#realSecret\` (JS \`#private\`) are reachable from *inside* the class. Implement \`reveal\` to return \`\` \`\${this.tsSecret} / \${this.#realSecret}\` \`\`. From *outside* the class the editor blocks both — but only \`#realSecret\` is truly gone at runtime; \`tsSecret\` is still a plain property. Expected output: \`compile-time / runtime\`.`,
      starterCode: `class Vault {
  // TS \`private\`: blocked by the compiler, but the property still exists at
  // runtime (you could reach it via a cast or bracket access).
  private tsSecret: string;
  // JS \`#private\`: truly private — not present on the object at runtime.
  #realSecret: string;

  constructor(a: string, b: string) {
    this.tsSecret = a;
    this.#realSecret = b;
  }

  reveal(): string {
    // Both are reachable from INSIDE the class.
    // TODO: return \`\${this.tsSecret} / \${this.#realSecret}\`.
    return "";
  }
}

const v = new Vault("compile-time", "runtime");
console.log(v.reveal()); // expected: "compile-time / runtime" once implemented
// Outside the class the editor blocks BOTH v.tsSecret and v.#realSecret.
`,
    },
    ],
    quiz: [
      {
        id: "classes-and-modifiers-q1",
        prompt: "What's the difference between TypeScript's `private` and JavaScript's `#private`?",
        options: [
          "`#private` is compile-time only; TS `private` emits a WeakMap",
          "TS `private` also blocks subclass access, while `#private` allows it",
          "TS `private` is compile-time only and still reachable via `obj[\"field\"]`; `#private` is enforced by the runtime",
          "They're identical; `#` is just newer syntax",
        ],
        answer: 2,
        explanation: "TS `private` is a compile-time fiction — the editor blocks outside access but the field is a plain property at runtime, reachable via a cast. This is unlike Java/C#, where `private` is a real platform-enforced boundary. Reach for `#private` when you need actual encapsulation.",
      },
      {
        id: "classes-and-modifiers-q2",
        prompt: "What does `constructor(public readonly x: number) {}` do?",
        options: [
          "It creates a getter named `x` backed by a private field",
          "It marks the constructor argument as required at the call site",
          "It declares the field but you must still assign it in the body",
          "It's a parameter property — TS declares *and* assigns the field for you, with no separate field line or `this.x = x`",
        ],
        answer: 3,
        explanation: "Parameter properties kill the boilerplate of declaring a field, taking a parameter, and assigning one to the other. Any access modifier — or `readonly` — on a constructor parameter triggers it.",
      },
      {
        id: "classes-and-modifiers-q3",
        prompt: "Is `readonly` an access modifier?",
        options: [
          "No — it controls mutability, and composes with any of the three access modifiers",
          "Yes — it's a fourth level between `protected` and `private`",
          "Yes — it implies `public` and can't be combined with `private`",
          "No — it's only valid on interface properties, not class fields",
        ],
        answer: 0,
        explanation: "`public`, `private`, and `protected` control visibility; `readonly` controls whether a field can be reassigned after construction. `private readonly` and `public readonly` are both perfectly ordinary.",
      },
    ],
  },
  {
    id: "interfaces-abstract-generics",
    module: "classes",
    title: "implements, abstract, and Generic Classes",
    blurb: "Contracts, abstract bases, and generic classes.",
    content: `Three ways TS classes express richer contracts than plain JS.

**\`implements\` — a contract, not inheritance.** An interface describes a shape; \`implements\` asks TS to *check* that a class has those members. It adds no runtime behavior and copies nothing (unlike \`extends\`). A class can implement several interfaces at once.

\`\`\`ts
interface Named { name: string; }
interface Greets { greet(): string; }
class User implements Named, Greets {
  constructor(public name: string) {}
  greet() { return \`hi, \${this.name}\`; }
}
\`\`\`

**\`abstract\` — a base you can't instantiate.** Mark a class \`abstract\` and \`new\`-ing it directly becomes a compile error. \`abstract\` methods have no body; every concrete subclass must supply one. Use an abstract class (not an interface) when you want to share *implementation* — concrete methods, fields, a constructor — alongside the required holes. Like Java, but TS interfaces are purely structural and erased.

\`\`\`ts
abstract class Shape {
  abstract area(): number;          // each subclass fills this in
  describe() { return \`area=\${this.area()}\`; } // shared concrete method
}
class Square extends Shape {
  constructor(private side: number) { super(); }
  area() { return this.side ** 2; }
}
\`\`\`

*Rule of thumb:* interface for a pure contract many unrelated types satisfy; abstract class when subclasses share code.

**Generic classes.** Parameterize a class over a type with \`<T>\`, fixed when you construct it:

\`\`\`ts
class Box<T> {
  constructor(public value: T) {}
  map<U>(fn: (v: T) => U): Box<U> { return new Box(fn(this.value)); }
}
const b = new Box(2).map((n) => \`n=\${n}\`); // Box<string>
\`\`\`

**\`this\`-typed returns** make fluent builders type-safe: declaring a method's return type as \`this\` means chaining survives subclassing, because each call returns the *actual* subtype, not the base.

\`\`\`ts
class Query {
  where(c: string): this { /* ... */ return this; }
}
\`\`\``,
    exercises: [
    {
      id: "implements-interface",
      title: "implements an interface",
      instructions: `\`Circle implements Shape\`, so TS checks it has an \`area()\` method. Implement \`area\` to return \`Math.PI * radius * radius\`. Note \`shape\` is typed as \`Shape\` — the interface — but holds a \`Circle\`. Expected output: \`12.57\`.`,
      starterCode: `interface Shape {
  area(): number;
}

// \`implements\` is a compile-time contract check: TS verifies Circle has the
// members Shape requires. It adds NO runtime behavior (unlike \`extends\`).
class Circle implements Shape {
  constructor(private radius: number) {}

  area(): number {
    // TODO: return the circle's area: Math.PI * radius * radius.
    return 0;
  }
}

const shape: Shape = new Circle(2);
console.log(shape.area().toFixed(2)); // expected: "12.57" once implemented
`,
    },
    {
      id: "abstract-base",
      title: "An abstract base",
      instructions: `\`Animal\` is abstract: it has a concrete \`describe()\` and an abstract \`speak()\`. Implement \`Dog.speak\` to return \`"woof"\`. Trying to \`new Animal(...)\` directly would be a compile error. Expected output: \`Rex says woof\`.`,
      starterCode: `abstract class Animal {
  constructor(protected name: string) {}

  // Concrete method shared by every subclass.
  describe(): string {
    return \`\${this.name} says \${this.speak()}\`;
  }

  // Abstract method: no body here; each subclass MUST implement it.
  abstract speak(): string;
}

class Dog extends Animal {
  speak(): string {
    // TODO: return the string "woof".
    return "";
  }
}

const d = new Dog("Rex");
console.log(d.describe()); // expected: "Rex says woof" once implemented
// \`new Animal("x")\` would be a compile error — abstract classes can't be instantiated.
`,
    },
    {
      id: "generic-class",
      title: "A generic class",
      instructions: `\`Wrapper<T>\` holds a typed \`value\`. Implement \`map\` to apply \`fn\` to \`this.value\` and return a **new** \`Wrapper\` of the result (don't mutate). The result type \`U\` is inferred from \`fn\`, so \`num.map((n) => string)\` yields a \`Wrapper<string>\`. Expected output: \`value is 42\`.`,
      starterCode: `// A generic class: T is a type parameter fixed when you construct an instance.
class Wrapper<T> {
  constructor(public readonly value: T) {}

  // \`map\` returns a NEW Wrapper of the transformed type U — no mutation.
  map<U>(fn: (value: T) => U): Wrapper<U> {
    // TODO: apply fn to this.value and wrap the result in a new Wrapper.
    return new Wrapper(undefined as unknown as U);
  }
}

const num = new Wrapper(21);
const text = num.map((n) => \`value is \${n * 2}\`); // Wrapper<string>
console.log(text.value); // expected: "value is 42" once implemented
`,
    },
    ],
    quiz: [
      {
        id: "interfaces-abstract-generics-q1",
        prompt: "What does `implements` add compared to `extends`?",
        options: [
          "It makes the class nominally typed rather than structural",
          "Only a check that the class has the required members — it adds no runtime behavior and copies nothing",
          "It copies default method implementations from the interface",
          "It registers the class so `instanceof` works against the interface",
        ],
        answer: 1,
        explanation: "An interface describes a shape; `implements` asks TS to check the class against it. A class can implement several at once. Since TS is structural anyway, the class would satisfy the interface with or without the clause — `implements` just makes the failure loud and local.",
      },
      {
        id: "interfaces-abstract-generics-q2",
        prompt: "When should you use an abstract class rather than an interface?",
        options: [
          "When the type must be checked at runtime",
          "When the members should be private",
          "When subclasses share implementation — concrete methods, fields, a constructor — alongside the required holes",
          "When you need more than one level of inheritance",
        ],
        answer: 2,
        explanation: "Rule of thumb: interface for a pure contract many unrelated types satisfy; abstract class when subclasses share code. Marking a class `abstract` also makes `new`-ing it directly a compile error.",
      },
      {
        id: "interfaces-abstract-generics-q3",
        prompt: "Why declare a fluent builder method's return type as `this` rather than the class name?",
        options: [
          "It avoids a circular type reference in the class declaration",
          "It lets the method be called on both instances and the constructor",
          "It's required for methods that return the receiver",
          "Chaining survives subclassing — each call returns the actual subtype, not the base",
        ],
        answer: 3,
        explanation: "`where(c: string): Query` would erase the subtype halfway through a chain, so subclass methods would stop being available. `this` keeps the concrete type flowing through every call.",
      },
    ],
  },
];
