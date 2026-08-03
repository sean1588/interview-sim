import type { Lesson } from "../types";

export const typesLessons: Lesson[] = [
  {
    id: "go-structs-methods",
    module: "types",
    title: "Structs, Pointers, and Methods",
    blurb: "struct literals, pointers without arithmetic, and value vs pointer receivers.",
    content: `## Structs

A \`struct\` is a typed collection of fields — Go's plain data aggregate, like a class without inheritance. You define a named type and construct values with a field-labeled literal:

\`\`\`go
type Point struct {
	X, Y int
}

p := Point{X: 1, Y: 2}   // labeled (preferred — order-independent)
q := Point{3, 4}          // positional (all fields, in order)
fmt.Println(p.X, q.Y)     // 1 4
\`\`\`

An uninitialized struct is its zero value — every field zeroed — and is immediately usable: \`var p Point\` gives \`{0 0}\`. Structs are **value types**: assigning or passing one *copies* it.

## Pointers, minus the danger

Go has pointers but **no pointer arithmetic**. \`&x\` takes an address, \`*p\` dereferences, and that's essentially it — safe by design.

\`\`\`go
p := Point{1, 2}
ptr := &p         // *Point
ptr.X = 10        // no need to write (*ptr).X — Go auto-dereferences
fmt.Println(p.X)  // 10
\`\`\`

The zero value of a pointer is \`nil\`. Use a pointer when you want to **mutate** the pointee or **avoid copying** a large struct.

## Methods

A method is a function with a **receiver** written before the name. There are no classes — you attach behavior to any named type you define:

\`\`\`go
func (p Point) Distance() float64 {
	return math.Sqrt(float64(p.X*p.X + p.Y*p.Y))
}

p := Point{3, 4}
fmt.Println(p.Distance()) // 5
\`\`\`

## Value vs pointer receivers — the one real decision

- **Value receiver** \`(p Point)\` gets a *copy*; mutations don't stick to the caller's value.
- **Pointer receiver** \`(p *Point)\` can **mutate** the original and avoids copying.

\`\`\`go
func (p *Point) Scale(f int) { // pointer receiver: mutates
	p.X *= f
	p.Y *= f
}

p := Point{1, 2}
p.Scale(3)          // Go takes &p automatically for you
fmt.Println(p)      // {3 6}
\`\`\`

The convention: **if any method needs a pointer receiver, give them all pointer receivers** for consistency. Reach for pointer receivers when the type is mutable or large; value receivers are fine for small, immutable-style types.`,
    exercises: [
      {
        id: "go-struct-literal",
        title: "Build and print a struct",
        instructions: `Define a \`Rectangle\` struct with \`Width\` and \`Height\` (both \`int\`). Construct one with a labeled literal, then print it two ways: \`%v\` (values only) and \`%+v\` (with field names).

Expected output for width 3, height 4:

\`\`\`
{3 4}
{Width:3 Height:4}
\`\`\``,
        starterCode: `package main

import "fmt"

// TODO: define a Rectangle struct with Width and Height ints.

func main() {
	// TODO: construct a Rectangle{Width: 3, Height: 4} and print it with %v then %+v.
}
`,
      },
      {
        id: "go-value-receiver",
        title: "A value-receiver method",
        instructions: `Give \`Rectangle\` an \`Area() int\` method with a **value receiver** \`(r Rectangle)\`. It should return \`Width * Height\`. Call it in \`main\`.

For a 3×4 rectangle the area is \`12\`.`,
        starterCode: `package main

import "fmt"

type Rectangle struct {
	Width, Height int
}

// TODO: add a value-receiver method  func (r Rectangle) Area() int  returning Width*Height.

func main() {
	r := Rectangle{Width: 3, Height: 4}
	fmt.Println(r.Area())
}
`,
      },
      {
        id: "go-pointer-receiver",
        title: "Mutate with a pointer receiver",
        instructions: `Add a \`Scale(factor int)\` method with a **pointer receiver** \`(r *Rectangle)\` that multiplies both \`Width\` and \`Height\` by \`factor\` in place. After \`r.Scale(2)\`, the caller's rectangle should be changed — that's the point of a pointer receiver.

Expected output:

\`\`\`
{6 8}
\`\`\``,
        starterCode: `package main

import "fmt"

type Rectangle struct {
	Width, Height int
}

// TODO: add  func (r *Rectangle) Scale(factor int)  that mutates Width and Height in place.

func main() {
	r := Rectangle{Width: 3, Height: 4}
	r.Scale(2) // Go automatically passes &r
	fmt.Printf("%v\\n", r)
}
`,
      },
    ],
    quiz: [
      {
        id: "go-structs-methods-q1",
        prompt: "When should a method use a pointer receiver `(p *Point)` rather than a value receiver?",
        options: [
          "Whenever the method returns a value",
          "Whenever the type has more than one field",
          "Only when the type is used through an interface",
          "When it must mutate the original, or when copying the struct is expensive",
        ],
        answer: 3,
        explanation: "A value receiver gets a copy, so mutations don't stick. The convention: if any method needs a pointer receiver, give them all pointer receivers for consistency. Value receivers are fine for small, immutable-style types.",
      },
      {
        id: "go-structs-methods-q2",
        prompt: "Given `ptr := &p`, why does `ptr.X = 10` compile without writing `(*ptr).X`?",
        options: [
          "Go auto-dereferences pointers on field and method access",
          "`&` returns a value, not a pointer, in Go",
          "`.` is defined as the dereferencing operator in Go",
          "It only works because `Point` has a pointer-receiver method",
        ],
        answer: 0,
        explanation: "Go auto-dereferences on selection, and it also auto-takes the address when calling a pointer-receiver method on an addressable value — `p.Scale(3)` becomes `(&p).Scale(3)` for you. Go has pointers but no pointer arithmetic, which is what makes them safe.",
      },
      {
        id: "go-structs-methods-q3",
        prompt: "What happens when you assign or pass a struct value in Go?",
        options: [
          "It's moved, and the original becomes unusable",
          "It's copied — structs are value types",
          "A reference is shared, like a class instance in Java",
          "It's copied only if the struct has no pointer fields",
        ],
        answer: 1,
        explanation: "Structs are value types, so assignment and parameter passing copy the whole thing. That's exactly why a value receiver can't mutate the caller's value, and why large structs are usually passed by pointer.",
      },
    ],
  },
  {
    id: "go-interfaces",
    module: "types",
    title: "Interfaces, Satisfied Implicitly",
    blurb: "small interfaces, structural satisfaction, the any type, and type switches.",
    content: `## Interfaces are just method sets

An interface lists methods. **A type satisfies it automatically by having those methods** — there is no \`implements\` keyword and no declared relationship. This is structural, like TypeScript, but resolved at compile time:

\`\`\`go
type Shape interface {
	Area() float64
}

type Circle struct{ R float64 }
func (c Circle) Area() float64 { return math.Pi * c.R * c.R }

// Circle satisfies Shape simply because it has Area() float64.
var s Shape = Circle{R: 2}
fmt.Println(s.Area())
\`\`\`

The interface doesn't know about \`Circle\`, and \`Circle\` doesn't mention \`Shape\`. You can define an interface *after* the types, even for types in someone else's package.

## Keep interfaces small

Idiomatic Go favors tiny interfaces — often one method. The stdlib's \`io.Reader\` and \`io.Writer\` are single-method interfaces that compose the entire I/O world. The proverb: **"accept interfaces, return structs."** A function takes the narrow behavior it needs, so any type providing it fits.

\`\`\`go
func describe(s Shape) string {
	return fmt.Sprintf("area = %.2f", s.Area())
}
\`\`\`

## The empty interface: \`any\`

An interface with no methods is satisfied by **every** type. Its modern spelling is \`any\` (an alias for \`interface{}\`) — Go's \`Object\` / \`unknown\`:

\`\`\`go
var x any = 42
x = "now a string"   // holds anything
\`\`\`

You rarely want \`any\` now that generics exist, but you'll meet it in \`fmt.Println(a ...any)\` and JSON decoding.

## Getting the concrete type back

A **type assertion** pulls the concrete value out, with a comma-ok form that won't panic:

\`\`\`go
if n, ok := x.(int); ok {
	fmt.Println("it's an int:", n)
}
\`\`\`

A **type switch** handles several possibilities at once — the idiomatic way to branch on a dynamic type:

\`\`\`go
switch v := x.(type) {
case int:
	fmt.Println("int", v)
case string:
	fmt.Println("string", v)
default:
	fmt.Println("something else")
}
\`\`\``,
    exercises: [
      {
        id: "go-implicit-interface",
        title: "Satisfy an interface implicitly",
        instructions: `Given the \`Speaker\` interface (\`Speak() string\`), define two types — \`Dog\` and \`Cat\` — each with a \`Speak()\` method. Because they have the method, they satisfy \`Speaker\` with no \`implements\`. Store both in a \`[]Speaker\` and print what each says.

Expected output:

\`\`\`
Woof
Meow
\`\`\``,
        starterCode: `package main

import "fmt"

type Speaker interface {
	Speak() string
}

// TODO: define Dog and Cat structs, each with a Speak() string method
// returning "Woof" and "Meow" respectively.

func main() {
	speakers := []Speaker{ /* TODO: a Dog and a Cat */ }
	for _, s := range speakers {
		fmt.Println(s.Speak())
	}
}
`,
      },
      {
        id: "go-type-switch",
        title: "Branch with a type switch",
        instructions: `Write \`describe(x any) string\` that uses a **type switch** to return: \`"int"\` for an int, \`"string"\` for a string, \`"bool"\` for a bool, and \`"unknown"\` otherwise. Call it on a few values.

Expected output:

\`\`\`
int
string
bool
unknown
\`\`\``,
        starterCode: `package main

import "fmt"

func describe(x any) string {
	// TODO: switch v := x.(type) { case int: ... case string: ... case bool: ... default: ... }
	return "unknown"
}

func main() {
	for _, v := range []any{42, "hi", true, 3.14} {
		fmt.Println(describe(v))
	}
}
`,
      },
      {
        id: "go-accept-interface",
        title: "Accept an interface",
        instructions: `Write a \`totalArea(shapes []Shape) float64\` that sums the \`Area()\` of every shape. Because it accepts the \`Shape\` interface, it works for any type with an \`Area() float64\` method — pass a mix of \`Circle\` and \`Square\`.`,
        starterCode: `package main

import (
	"fmt"
	"math"
)

type Shape interface {
	Area() float64
}

type Circle struct{ R float64 }

func (c Circle) Area() float64 { return math.Pi * c.R * c.R }

type Square struct{ Side float64 }

func (s Square) Area() float64 { return s.Side * s.Side }

func totalArea(shapes []Shape) float64 {
	// TODO: sum shape.Area() across the slice and return it.
	return 0
}

func main() {
	shapes := []Shape{Circle{R: 1}, Square{Side: 2}}
	fmt.Printf("%.2f\\n", totalArea(shapes))
}
`,
      },
    ],
    quiz: [
      {
        id: "go-interfaces-q1",
        prompt: "How does a type declare that it implements a Go interface?",
        options: [
          "By embedding the interface in the struct",
          "By registering it with the interface at init time",
          "It doesn't — having the right methods satisfies the interface automatically, with no `implements` keyword",
          "With an `implements Shape` clause on the type declaration",
        ],
        answer: 2,
        explanation: "Satisfaction is structural and resolved at compile time. The interface doesn't know about the type and the type doesn't mention the interface — so you can define an interface *after* the types, even for types in someone else's package.",
      },
      {
        id: "go-interfaces-q2",
        prompt: "What does the Go proverb \"accept interfaces, return structs\" mean in practice?",
        options: [
          "Interfaces should be defined in the package that implements them",
          "Constructors should always return an interface for testability",
          "Every exported struct should have a matching interface",
          "A function takes the narrow behavior it needs, so any type providing it fits, but hands back a concrete type",
        ],
        answer: 3,
        explanation: "Idiomatic Go favours tiny interfaces, often one method — `io.Reader` and `io.Writer` compose the entire I/O world between them. Accepting the narrowest interface maximizes what can be passed in; returning a struct avoids hiding capability from the caller.",
      },
      {
        id: "go-interfaces-q3",
        prompt: "Which construct branches on the dynamic type held in an `any`?",
        options: [
          "A type switch: `switch v := x.(type) { case int: ... }`",
          "A regular switch on `reflect.TypeOf(x)`",
          "`instanceof` comparisons in an if/else chain",
          "A type assertion, which handles all cases at once",
        ],
        answer: 0,
        explanation: "A type assertion `x.(int)` pulls out one concrete type, with a comma-ok form that won't panic. A type switch handles several possibilities at once and is the idiomatic way to branch.",
      },
    ],
  },
  {
    id: "go-embedding",
    module: "types",
    title: "Composition through Embedding",
    blurb: "struct and interface embedding — Go's answer to inheritance.",
    content: `## Go has no inheritance

There are no base classes, no \`extends\`, no method overriding. Instead Go offers **embedding**: put a type into a struct *without a field name*, and its fields and methods are **promoted** to the outer type. Composition, made ergonomic.

\`\`\`go
type Animal struct {
	Name string
}

func (a Animal) Describe() string {
	return "I am " + a.Name
}

type Dog struct {
	Animal        // embedded — no field name
	Breed  string
}

d := Dog{Animal: Animal{Name: "Rex"}, Breed: "Lab"}
fmt.Println(d.Name)        // promoted field: "Rex"
fmt.Println(d.Describe())  // promoted method: "I am Rex"
\`\`\`

\`d.Name\` is shorthand for \`d.Animal.Name\` — the embedded value is still reachable by its type name when you need it. This looks like inheritance but it is **has-a**, not **is-a**: \`Dog\` contains an \`Animal\`.

## "Overriding" by shadowing

Define a method on the outer type with the same name and it takes precedence — the promoted one is shadowed, not virtually dispatched. You can still call the inner version explicitly:

\`\`\`go
func (d Dog) Describe() string {
	return d.Animal.Describe() + ", a " + d.Breed
}
\`\`\`

There's no polymorphic \`super\` call chain — you name the embedded field, which is more explicit.

## Embedding interfaces

Interfaces embed too, composing larger contracts from smaller ones. This is exactly how the stdlib builds \`io.ReadWriter\`:

\`\`\`go
type Reader interface { Read(p []byte) (int, error) }
type Writer interface { Write(p []byte) (int, error) }

type ReadWriter interface {
	Reader
	Writer
}
\`\`\`

A type satisfies \`ReadWriter\` when it has both \`Read\` and \`Write\` — small interfaces snapping together into bigger ones.`,
    exercises: [
      {
        id: "go-embed-struct",
        title: "Embed a struct",
        instructions: `Define \`Base\` with a \`ID int\` field and an \`Info() string\` method returning \`"id=<ID>"\`. Then define \`User\` that **embeds** \`Base\` and adds a \`Name string\`. Construct a \`User\`, and access the promoted \`ID\` field and \`Info()\` method directly on it.

Expected output for ID 7, name "Ada":

\`\`\`
7
id=7
Ada
\`\`\``,
        starterCode: `package main

import "fmt"

type Base struct {
	ID int
}

func (b Base) Info() string {
	return fmt.Sprintf("id=%d", b.ID)
}

// TODO: define User that embeds Base (no field name) and adds Name string.

func main() {
	// TODO: construct a User with Base{ID: 7} and Name "Ada".
	// Then print u.ID, u.Info(), and u.Name.
}
`,
      },
      {
        id: "go-embed-shadow",
        title: "Shadow a promoted method",
        instructions: `Reuse \`Base\`/\`User\`. Give \`User\` its own \`Info() string\` that returns the embedded \`Base.Info()\` result plus \`" name=<Name>"\` — calling the inner version explicitly via \`u.Base.Info()\`. This is Go's "override + super" without inheritance.

Expected output for ID 7, name "Ada":

\`\`\`
id=7 name=Ada
\`\`\``,
        starterCode: `package main

import "fmt"

type Base struct {
	ID int
}

func (b Base) Info() string {
	return fmt.Sprintf("id=%d", b.ID)
}

type User struct {
	Base
	Name string
}

// TODO: add  func (u User) Info() string  that returns u.Base.Info() + " name=" + u.Name.

func main() {
	u := User{Base: Base{ID: 7}, Name: "Ada"}
	fmt.Println(u.Info())
}
`,
      },
    ],
    quiz: [
      {
        id: "go-embedding-q1",
        prompt: "Embedding looks like inheritance. What is it actually?",
        options: [
          "Single inheritance, with `Animal` as the base class",
          "Interface implementation, checked at compile time",
          "A compiler macro that copies the inner type's methods",
          "Composition — `Dog` *has an* `Animal`, whose fields and methods are promoted to the outer type",
        ],
        answer: 3,
        explanation: "It's has-a, not is-a. `d.Name` is shorthand for `d.Animal.Name`, and the embedded value stays reachable by its type name. There are no base classes, no `extends`, and no virtual dispatch.",
      },
      {
        id: "go-embedding-q2",
        prompt: "You define `Info()` on both `Base` and the type that embeds it. What happens?",
        options: [
          "The outer method shadows the promoted one — it's not virtual dispatch, and you call the inner one explicitly as `u.Base.Info()`",
          "A compile error from the duplicate method name",
          "The inner method is called, since it was defined first",
          "Go dispatches dynamically based on the runtime type",
        ],
        answer: 0,
        explanation: "Shadowing, not overriding. There's no polymorphic `super` chain — you name the embedded field, which is more explicit than an implicit call up a hierarchy.",
      },
      {
        id: "go-embedding-q3",
        prompt: "How does the standard library build `io.ReadWriter`?",
        options: [
          "With a type union of `Reader | Writer`",
          "By embedding the `Reader` and `Writer` interfaces, so a type satisfies it by having both methods",
          "By declaring a struct containing a Reader and a Writer field",
          "By listing `Read` and `Write` again in a separate interface",
        ],
        answer: 1,
        explanation: "Interfaces embed too, composing larger contracts from smaller ones. Small interfaces snapping together into bigger ones is the pattern the whole stdlib I/O layer is built on.",
      },
    ],
  },
];
