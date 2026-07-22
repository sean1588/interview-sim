import type { Lesson } from "../types";

export const genericsLessons: Lesson[] = [
  {
    id: "go-generics-basics",
    module: "generics",
    title: "Type Parameters and Constraints",
    blurb: "generic functions, the any and comparable constraints, and type inference.",
    content: `## Generics arrived in Go 1.18

Before 1.18, reusable container and algorithm code meant \`interface{}\` plus runtime type assertions — untyped and unsafe. **Type parameters** bring compile-time generics, familiar from Java/C#/TypeScript but with Go's own twist: **constraints are interfaces**.

## A generic function

Type parameters go in square brackets after the name, each with a **constraint** (an interface bounding what the type can be):

\`\`\`go
func Map[T, U any](xs []T, f func(T) U) []U {
	out := make([]U, len(xs))
	for i, x := range xs {
		out[i] = f(x)
	}
	return out
}

nums := []int{1, 2, 3}
strs := Map(nums, func(n int) string { return strconv.Itoa(n) })
\`\`\`

\`any\` is the "no constraint" constraint (every type satisfies it). Notice the call has **no explicit type arguments** — Go **infers** \`T=int\`, \`U=string\` from the arguments. You can spell them out (\`Map[int, string](...)\`) when inference can't.

## Constraints are interfaces

A constraint is just an interface describing what operations the type must support. Two built-ins matter most:

- **\`any\`** — anything.
- **\`comparable\`** — types usable with \`==\` and \`!=\` (so they can be map keys, or compared for equality). Required whenever you compare values:

\`\`\`go
func Contains[T comparable](xs []T, target T) bool {
	for _, x := range xs {
		if x == target { // legal only because T is comparable
			return true
		}
	}
	return false
}
\`\`\`

If you tried \`==\` under an \`any\` constraint, it wouldn't compile — the constraint is what unlocks the operation.

## Generic to a fault?

Go's guidance is deliberately conservative: **reach for generics when you'd otherwise write the same code for several types, or build a general container.** If a single concrete type or a plain interface reads more clearly, prefer that. Generics are a tool for library-shaped code, not a default.`,
    exercises: [
      {
        id: "go-generic-map",
        title: "A generic Map",
        instructions: `Write \`Map[T, U any](xs []T, f func(T) U) []U\` that applies \`f\` to each element and returns the results in a new slice. Call it to turn \`[]int{1,2,3}\` into their squares, letting Go infer the type arguments.

Expected output:

\`\`\`
[1 4 9]
\`\`\``,
        starterCode: `package main

import "fmt"

func Map[T, U any](xs []T, f func(T) U) []U {
	out := make([]U, len(xs))
	// TODO: fill out[i] with f(xs[i]).
	return out
}

func main() {
	nums := []int{1, 2, 3}
	squares := Map(nums, func(n int) int { return n * n })
	fmt.Println(squares)
}
`,
      },
      {
        id: "go-generic-contains",
        title: "Constrain with comparable",
        instructions: `Write \`Contains[T comparable](xs []T, target T) bool\` that reports whether \`target\` is in the slice. The \`comparable\` constraint is what lets you use \`==\`. Test it on both an \`[]int\` and a \`[]string\` with one generic function.

Expected output:

\`\`\`
true
false
true
\`\`\``,
        starterCode: `package main

import "fmt"

func Contains[T comparable](xs []T, target T) bool {
	// TODO: range over xs; return true if any element == target; false otherwise.
	return false
}

func main() {
	fmt.Println(Contains([]int{1, 2, 3}, 2))
	fmt.Println(Contains([]int{1, 2, 3}, 9))
	fmt.Println(Contains([]string{"a", "b"}, "b"))
}
`,
      },
    ],
  },
  {
    id: "go-generics-practical",
    module: "generics",
    title: "Constraint Sets and Generic Types",
    blurb: "union constraints with |, generic structs, and building typed containers.",
    content: `## Custom constraints with type sets

Beyond \`any\` and \`comparable\`, you define your own constraints as interfaces containing a **type set** — a list of allowed underlying types joined with \`|\`. This is how you say "any number":

\`\`\`go
type Number interface {
	~int | ~int64 | ~float64
}

func Sum[T Number](xs []T) T {
	var total T // zero value of T
	for _, x := range xs {
		total += x // legal: every type in the set supports +
	}
	return total
}
\`\`\`

The \`~\` means "any type whose **underlying** type is this" — so a \`type Celsius float64\` still satisfies \`~float64\`. Without \`~\`, only \`float64\` itself would qualify. The standard \`golang.org/x/exp/constraints\` package predefines \`Ordered\`, \`Integer\`, \`Float\`, etc., so you rarely hand-write these.

## Generic types

Structs can be generic too — the foundation for typed containers:

\`\`\`go
type Stack[T any] struct {
	items []T
}

func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }

func (s *Stack[T]) Pop() (T, bool) {
	var zero T
	if len(s.items) == 0 {
		return zero, false
	}
	last := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1]
	return last, true
}

var s Stack[string]  // a stack of strings
s.Push("a")
\`\`\`

Note the method receiver repeats the type parameter: \`(s *Stack[T])\`. And \`var zero T\` is the idiom for "the zero value of an unknown type" — you can't write a literal, so you declare one.

## Keep it grounded

Generics shine for containers (\`Stack\`, \`Set\`, \`Tree\`), for slice/map utilities (\`Map\`, \`Filter\`, \`Keys\`), and for numeric code over several types. When a constraint's type set grows unwieldy or you're adding generics "just in case," step back — a concrete type or a one-method interface is often the simpler design.`,
    exercises: [
      {
        id: "go-generic-sum",
        title: "Sum over a numeric constraint",
        instructions: `Define a \`Number\` constraint (\`~int | ~float64\`) and write \`Sum[T Number](xs []T) T\` that adds up the slice, starting from \`var total T\` (the zero value). Test it on both \`[]int\` and \`[]float64\`.

Expected output:

\`\`\`
6
7.5
\`\`\``,
        starterCode: `package main

import "fmt"

type Number interface {
	~int | ~float64
}

func Sum[T Number](xs []T) T {
	var total T
	// TODO: add each element to total.
	return total
}

func main() {
	fmt.Println(Sum([]int{1, 2, 3}))
	fmt.Println(Sum([]float64{2.5, 5.0}))
}
`,
      },
      {
        id: "go-generic-stack",
        title: "A generic Stack",
        instructions: `Complete the generic \`Stack[T any]\`. Implement \`Push\` (append) and \`Pop\` (return the top value and \`true\`, or the zero value and \`false\` when empty). Exercise it as a \`Stack[int]\`.

Expected output:

\`\`\`
2 true
1 true
0 false
\`\`\``,
        starterCode: `package main

import "fmt"

type Stack[T any] struct {
	items []T
}

func (s *Stack[T]) Push(v T) {
	// TODO: append v to s.items.
}

func (s *Stack[T]) Pop() (T, bool) {
	var zero T
	// TODO: if empty return zero, false.
	//       otherwise pop the last item and return it with true.
	return zero, false
}

func main() {
	var s Stack[int]
	s.Push(1)
	s.Push(2)
	for i := 0; i < 3; i++ {
		v, ok := s.Pop()
		fmt.Println(v, ok)
	}
}
`,
      },
    ],
  },
];
