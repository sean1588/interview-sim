import type { Lesson } from "../types";

export const basicsLessons: Lesson[] = [
  {
    id: "go-hello-and-values",
    module: "basics",
    title: "Packages, Values, and Zero Values",
    blurb: "package main, := vs var, the basic types, and Go's zero-value guarantee.",
    content: `## Every file belongs to a package

A Go program is a set of packages. An executable starts in \`package main\` with a \`func main()\`; there is no top-level script code the way Python or JS allow.

\`\`\`go
package main

import "fmt"

func main() {
	fmt.Println("Hello, Go")
}
\`\`\`

\`fmt.Println\` writes to stdout with a newline. There are **no semicolons** in the source you write (the compiler inserts them), and **braces are mandatory** — Go's formatter (\`gofmt\`) owns all layout, so there are no style debates. The opening brace must be on the same line; putting it on the next line is a compile error, not a preference.

## Declaring variables

Two forms. Inside a function, \`:=\` declares and infers in one step — this is what you'll use most:

\`\`\`go
name := "Ada"     // string
count := 3        // int
ratio := 1.5      // float64
\`\`\`

\`var\` is the explicit form, required at package level (where \`:=\` is not allowed) and useful when you want an explicit type or the zero value:

\`\`\`go
var total int         // explicitly int, zero value 0
var label string = "x"
var ready bool        // false
\`\`\`

Naming is \`camelCase\`; an **initial capital letter is meaningful** — it makes an identifier *exported* (public) from its package. \`User\` is visible to other packages, \`user\` is not. This is Go's entire access-control system: no \`public\`/\`private\` keywords.

## Statically and strongly typed

Unlike Python and JS, types are fixed at compile time and there is **no implicit conversion** — not even between numeric types. You convert explicitly with \`T(v)\`:

\`\`\`go
var i int = 10
var f float64 = float64(i)   // required; int -> float64 is not automatic
var u uint = uint(f)
\`\`\`

\`"3" + 4\` doesn't compile at all (mismatched types), which catches a whole class of bugs before you run.

## The basic types

- \`int\`, \`int8/16/32/64\`, \`uint...\` — \`int\` is 64-bit on modern platforms.
- \`float64\` (the default) and \`float32\`.
- \`string\` — immutable UTF-8 bytes (more in the strings lesson).
- \`bool\` — \`true\` / \`false\`.
- \`byte\` (alias for \`uint8\`) and \`rune\` (alias for \`int32\`, a Unicode code point).

## Zero values — Go's answer to null

Every variable is **usable immediately** with no "undefined". A declared-but-unassigned value gets its type's **zero value**: \`0\` for numbers, \`""\` for strings, \`false\` for bools, and \`nil\` for pointers, slices, maps, and interfaces. There is no uninitialized-variable state to guard against.

\`\`\`go
var count int      // 0, ready to use
var names []string // nil slice, but len(names) == 0 and you can range it
\`\`\`

## Constants and iota

\`const\` values are compile-time and may be *untyped*, letting a numeric constant slot into any numeric context. \`iota\` auto-numbers a const block — the idiomatic way to make enum-like sequences:

\`\`\`go
const Pi = 3.14159

const (
	Red   = iota // 0
	Green        // 1
	Blue         // 2
)
\`\`\``,
    exercises: [
      {
        id: "go-hello-format",
        title: "Print a formatted greeting",
        instructions: `Using the provided \`name\` and \`age\`, print a single line with \`fmt.Printf\`. Go's format verbs are \`%s\` (string), \`%d\` (integer), and \`%v\` (any value's default format); remember the trailing \`\\n\` since \`Printf\` does not add one.

When this runs, it should print:

\`\`\`
Ada is 36 years old.
\`\`\``,
        starterCode: `package main

import "fmt"

func main() {
	name := "Ada"
	age := 36

	// TODO: print "Ada is 36 years old." using fmt.Printf with %s and %d.
	// Printf does NOT add a newline, so end the format string with \\n.
	_ = name
	_ = age
}
`,
      },
      {
        id: "go-numeric-convert",
        title: "Explicit numeric conversion",
        instructions: `Go never converts numeric types for you. Given an \`int\`, compute the average of it and a \`float64\` by converting explicitly.

1. Convert \`count\` (int) to \`float64\`.
2. Divide by 2.0 and store the result.
3. Print it with \`%v\`.

For \`count = 7\` the result is \`3.5\`.`,
        starterCode: `package main

import "fmt"

func main() {
	count := 7

	// TODO: convert count to float64, divide by 2.0, and print the result.
	// A bare  count / 2  would do integer division (3) — convert first.
	var avg float64 // replace with the real computation
	_ = count

	fmt.Printf("%v\\n", avg)
}
`,
      },
      {
        id: "go-zero-values",
        title: "Observe the zero values",
        instructions: `Declare (with \`var\`, no initializer) one of each: an \`int\`, a \`string\`, a \`bool\`, and a \`[]int\` slice. Print each so you can see Go's zero values — there is no "undefined".

Expected output:

\`\`\`
0
""
false
[] len=0
\`\`\`

(Use \`%q\` for the string so the empty value is visible, and \`len\` for the slice.)`,
        starterCode: `package main

import "fmt"

func main() {
	// TODO: declare n int, s string, ok bool, xs []int with var (no initializers).

	// Then print them. %q quotes the string so "" is visible.
	// fmt.Printf("%d\\n", n)
	// fmt.Printf("%q\\n", s)
	// fmt.Printf("%v\\n", ok)
	// fmt.Printf("%v len=%d\\n", xs, len(xs))
}
`,
      },
    ],
    quiz: [
      {
        id: "go-hello-and-values-q1",
        prompt: "What makes an identifier visible to other packages in Go?",
        options: [
          "Listing it in the package's `go.mod` file",
          "An initial capital letter — that is Go's entire access-control system",
          "An `export` keyword before the declaration",
          "Declaring it at package level rather than inside a function",
        ],
        answer: 1,
        explanation: "`User` is exported, `user` is not. There are no `public`/`private` keywords — capitalization does the whole job, which is why it's a meaningful naming decision rather than a style one.",
      },
      {
        id: "go-hello-and-values-q2",
        prompt: "Why does `var i int = 10; var f float64 = i` fail to compile?",
        options: [
          "`int` is 64-bit, so it can't fit in a `float64`",
          "Numeric conversion is only allowed with `:=`",
          "Go has no implicit conversion, not even between numeric types — you must write `float64(i)`",
          "`var` declarations can't have both a type and an initializer",
        ],
        answer: 2,
        explanation: "Types are fixed at compile time and nothing converts silently. `\"3\" + 4` doesn't compile either, which catches a whole class of bugs before you run.",
      },
      {
        id: "go-hello-and-values-q3",
        prompt: "What is `var names []string` — and can you use it immediately?",
        options: [
          "An uninitialized variable that panics on any access",
          "An empty slice allocated with capacity 0",
          "A compile error, since slices need `make`",
          "A nil slice, and yes — `len(names)` is 0 and you can range over it",
        ],
        answer: 3,
        explanation: "Every variable gets its type's zero value and is usable immediately — 0 for numbers, `\"\"` for strings, false for bools, nil for pointers, slices, maps, and interfaces. There is no undefined state to guard against. (Writing to a nil *map* is the one exception that panics.)",
      },
    ],
  },
  {
    id: "go-control-flow",
    module: "basics",
    title: "The One Loop, if, and switch",
    blurb: "for is the only loop, if with an init statement, and switch without fallthrough.",
    content: `## \`for\` is the only loop

Go has no \`while\`, no \`do/while\`, and no \`foreach\` keyword — just \`for\`, which wears several hats. Conditions take **no parentheses**, and braces are always required.

\`\`\`go
for i := 0; i < 5; i++ {   // classic three-clause
	fmt.Println(i)
}

n := 0
for n < 5 {                // "while": just the condition
	n++
}

for {                      // infinite loop: break to exit
	break
}
\`\`\`

To iterate a collection, use \`range\`, which yields index and value:

\`\`\`go
nums := []int{10, 20, 30}
for i, v := range nums {
	fmt.Println(i, v)   // 0 10 / 1 20 / 2 30
}

for _, v := range nums {   // _ discards the index
	fmt.Println(v)
}
\`\`\`

The blank identifier \`_\` throws away a value you must name but don't want — you'll see it constantly.

## \`if\`, with an optional init statement

No parentheses, and \`if\` can run a short statement *before* the condition, scoping that variable to the if/else. This is the idiomatic home for the error-check pattern you'll meet soon:

\`\`\`go
if x := compute(); x > 10 {
	fmt.Println("big", x)   // x is in scope here
} else {
	fmt.Println("small", x) // ...and here
}
// x is gone here
\`\`\`

There is **no ternary operator** in Go — deliberately. Use a plain \`if\`, or a small helper. Verbosity is the trade for one obvious way to read the branch.

## \`switch\` — no fallthrough, no break

Cases **do not fall through** by default, so you never write \`break\`. A case can list several values, and a bare \`switch\` (no expression) is a clean replacement for an \`if/else if\` ladder:

\`\`\`go
switch day {
case "Sat", "Sun":
	fmt.Println("weekend")
default:
	fmt.Println("weekday")
}

switch {                 // expression-less: first true case wins
case score >= 90:
	grade = "A"
case score >= 80:
	grade = "B"
default:
	grade = "C"
}
\`\`\`

If you *want* C-style fallthrough, the explicit \`fallthrough\` keyword opts in — rare in practice.`,
    exercises: [
      {
        id: "go-fizzbuzz",
        title: "FizzBuzz with a bare switch",
        instructions: `Print FizzBuzz for \`1\` through \`n\`. For each number: multiple of both 3 and 5 → \`FizzBuzz\`; of 3 → \`Fizz\`; of 5 → \`Buzz\`; otherwise the number. Use a \`for\` loop and an expression-less \`switch\`.

Expected first lines for \`n = 5\`:

\`\`\`
1
2
Fizz
4
Buzz
\`\`\``,
        starterCode: `package main

import "fmt"

func fizzbuzz(n int) {
	// TODO: loop i from 1 to n (inclusive) and use a bare switch:
	//   case i%15 == 0: print "FizzBuzz"
	//   case i%3 == 0:  print "Fizz"
	//   case i%5 == 0:  print "Buzz"
	//   default:        print the number i
}

func main() {
	fizzbuzz(5)
}
`,
      },
      {
        id: "go-sum-range",
        title: "Sum a slice with range",
        instructions: `Write \`sum(xs []int) int\` that adds up the slice using a \`range\` loop (discard the index with \`_\`), and return the total.

For \`[]int{1, 2, 3, 4}\` the result is \`10\`.`,
        starterCode: `package main

import "fmt"

func sum(xs []int) int {
	total := 0
	// TODO: range over xs, discarding the index, and add each value to total.
	return total
}

func main() {
	fmt.Println(sum([]int{1, 2, 3, 4}))
}
`,
      },
      {
        id: "go-if-init-classify",
        title: "if with an init statement",
        instructions: `Write \`classify(n int) string\` that returns \`"negative"\`, \`"zero"\`, or \`"positive"\`. Then in \`main\`, use an \`if\` with an **init statement** — \`if label := classify(v); label == "zero"\` — to print a message only when a value classifies as zero, keeping \`label\` scoped to the \`if\`.`,
        starterCode: `package main

import "fmt"

func classify(n int) string {
	// TODO: return "negative", "zero", or "positive" (a switch works well).
	return ""
}

func main() {
	for _, v := range []int{-3, 0, 7} {
		// TODO: use an if with an init statement:
		//   if label := classify(v); label == "zero" { ... print something ... }
		_ = v
	}
}
`,
      },
    ],
    quiz: [
      {
        id: "go-control-flow-q1",
        prompt: "How do you write a `while` loop in Go?",
        options: [
          "`do { } while condition`",
          "`loop { }` with an explicit `break`",
          "`for condition { }` — `for` is the only loop keyword and wears several hats",
          "`while condition { }`, which was added in Go 1.21",
        ],
        answer: 2,
        explanation: "Go has no `while`, no `do/while`, and no `foreach` keyword. `for` covers the three-clause form, the condition-only form, the infinite form, and `range` iteration.",
      },
      {
        id: "go-control-flow-q2",
        prompt: "In `if x := compute(); x > 10 { ... } else { ... }`, where is `x` in scope?",
        options: [
          "Only in the if branch",
          "For the rest of the enclosing function",
          "Only inside the condition expression itself",
          "In both the if and the else branch, and nowhere after",
        ],
        answer: 3,
        explanation: "The init statement scopes the variable to the whole if/else and no further. This is the idiomatic home for the `if err := ...; err != nil` pattern, which is why you see it constantly.",
      },
      {
        id: "go-control-flow-q3",
        prompt: "Do Go `switch` cases fall through?",
        options: [
          "No — cases don't fall through by default, so you never write `break`; the `fallthrough` keyword opts in",
          "Yes, exactly like C, so every case needs a `break`",
          "Only when the case lists multiple values",
          "Only in an expression-less switch",
        ],
        answer: 0,
        explanation: "No fallthrough is the default, which removes a classic C bug. A case can list several values (`case \"Sat\", \"Sun\":`), and a bare `switch` with no expression is a clean replacement for an if/else-if ladder.",
      },
    ],
  },
  {
    id: "go-functions",
    module: "basics",
    title: "Functions, Multiple Returns, and defer",
    blurb: "multi-value returns, named results, variadics, first-class functions, and defer.",
    content: `## Declaring functions

The type comes *after* the name — for parameters and for the return. Consecutive params of the same type can share it:

\`\`\`go
func add(a, b int) int {
	return a + b
}
\`\`\`

Functions are first-class values: you can store them, pass them, and return them.

\`\`\`go
op := add
fmt.Println(op(2, 3)) // 5
\`\`\`

## Multiple return values

This is the feature that shapes idiomatic Go. A function can return several values, and the overwhelmingly common pattern is **\`(result, error)\`** — Go's alternative to exceptions:

\`\`\`go
func divide(a, b int) (int, error) {
	if b == 0 {
		return 0, fmt.Errorf("divide by zero")
	}
	return a / b, nil
}

q, err := divide(10, 2)
if err != nil {
	// handle it
}
\`\`\`

You'll write \`if err != nil\` constantly — that repetition *is* the error handling, made explicit at every call site instead of hidden in a \`try\` somewhere up the stack.

## Named return values

You can name the results; they start at their zero value and a bare \`return\` sends them back. Useful with \`defer\`, but keep functions short or it hurts readability:

\`\`\`go
func split(sum int) (x, y int) {
	x = sum * 4 / 9
	y = sum - x
	return // returns x, y
}
\`\`\`

## Variadic functions

A trailing \`...T\` collects extra arguments into a slice:

\`\`\`go
func total(nums ...int) int {
	sum := 0
	for _, n := range nums {
		sum += n
	}
	return sum
}

total(1, 2, 3)          // 6
xs := []int{1, 2, 3}
total(xs...)            // spread a slice with ...
\`\`\`

## \`defer\`

\`defer\` schedules a call to run when the surrounding function returns, no matter how it returns. It's Go's answer to \`try/finally\` and RAII — the standard way to guarantee cleanup right next to the acquisition:

\`\`\`go
f, err := os.Open("data.txt")
if err != nil {
	return err
}
defer f.Close()   // runs on every return path below
// ... use f ...
\`\`\`

Deferred calls run in **LIFO** order (last deferred, first run), and their **arguments are evaluated when \`defer\` executes**, not when the deferred call finally runs — a common surprise:

\`\`\`go
for i := 0; i < 3; i++ {
	defer fmt.Println(i) // prints 2, 1, 0
}
\`\`\``,
    exercises: [
      {
        id: "go-divmod",
        title: "Return two values",
        instructions: `Write \`divmod(a, b int) (int, int)\` that returns the quotient and remainder. In \`main\`, capture both with \`q, r := divmod(17, 5)\` and print them.

Expected output:

\`\`\`
17 / 5 = 3 remainder 2
\`\`\``,
        starterCode: `package main

import "fmt"

func divmod(a, b int) (int, int) {
	// TODO: return a/b and a%b.
	return 0, 0
}

func main() {
	q, r := divmod(17, 5)
	fmt.Printf("17 / 5 = %d remainder %d\\n", q, r)
}
`,
      },
      {
        id: "go-result-error",
        title: "The (value, error) pattern",
        instructions: `Write \`safeDivide(a, b int) (int, error)\` that returns an error (via \`fmt.Errorf\`) when \`b\` is zero, and the quotient with a \`nil\` error otherwise. In \`main\`, call it and handle the error with the \`if err != nil\` idiom for both a valid and a divide-by-zero call.`,
        starterCode: `package main

import "fmt"

func safeDivide(a, b int) (int, error) {
	// TODO: if b == 0 return 0 and an error from fmt.Errorf("...").
	//       otherwise return a/b and nil.
	return 0, nil
}

func main() {
	for _, pair := range [][2]int{{10, 2}, {1, 0}} {
		q, err := safeDivide(pair[0], pair[1])
		if err != nil {
			fmt.Println("error:", err)
			continue
		}
		fmt.Println("ok:", q)
	}
}
`,
      },
      {
        id: "go-defer-order",
        title: "defer and LIFO order",
        instructions: `Write \`countdown()\` that loops \`i\` from 1 to 3, immediately printing \`"start i"\` each time, and \`defer\`s a \`fmt.Println("deferred", i)\`. Because defers are LIFO and their args are captured at \`defer\` time, the deferred lines print in reverse.

Expected output:

\`\`\`
start 1
start 2
start 3
deferred 3
deferred 2
deferred 1
\`\`\``,
        starterCode: `package main

import "fmt"

func countdown() {
	for i := 1; i <= 3; i++ {
		fmt.Println("start", i)
		// TODO: defer a call that prints "deferred", i
	}
}

func main() {
	countdown()
}
`,
      },
    ],
    quiz: [
      {
        id: "go-functions-q1",
        prompt: "What does this print?\n\n```go\nfor i := 0; i < 3; i++ {\n\tdefer fmt.Println(i)\n}\n```",
        options: [
          "0, 1, 2 — defers run in the order they were scheduled",
          "3, 3, 3 — the closure captures the loop variable",
          "Nothing — deferred calls in a loop are discarded",
          "2, 1, 0 — defers run LIFO and their arguments are evaluated at `defer` time",
        ],
        answer: 3,
        explanation: "Two rules combine here: deferred calls run last-in-first-out, and their arguments are evaluated when `defer` executes rather than when the call finally runs. That second rule is the common surprise.",
      },
      {
        id: "go-functions-q2",
        prompt: "What is the overwhelmingly common shape of a multi-value return in Go?",
        options: [
          "`(result, error)` — Go's alternative to exceptions, checked at every call site",
          "`(error, result)`, with the error first so it can't be ignored",
          "`(value, ok)` for every fallible operation",
          "A single struct containing both the result and an error field",
        ],
        answer: 0,
        explanation: "The error is the last return value, and `if err != nil` is written constantly. That repetition *is* the error handling — made explicit at every call site instead of hidden in a `try` somewhere up the stack.",
      },
      {
        id: "go-functions-q3",
        prompt: "How do you pass an existing `[]int` to a variadic `func total(nums ...int) int`?",
        options: [
          "You can't; you must loop and pass elements individually",
          "`total(xs...)` — spread the slice with `...`",
          "`total(xs)` — a slice is accepted directly",
          "`total(...xs)` — the spread goes before the value",
        ],
        answer: 1,
        explanation: "A trailing `...T` parameter collects extra arguments into a slice, and the `xs...` call syntax spreads a slice back into those arguments. Note the ellipsis is a suffix in Go, unlike JavaScript's prefix spread.",
      },
    ],
  },
];
