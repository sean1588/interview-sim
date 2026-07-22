import type { Lesson } from "../types";

export const toolingLessons: Lesson[] = [
  {
    id: "go-testing",
    module: "tooling",
    title: "Testing the Go Way",
    blurb: "the testing package, table-driven tests, subtests, and testable examples.",
    content: `## Testing is built in

Go ships its own test runner — no Jest, no pytest, no assertion library needed. A test lives in a \`_test.go\` file, in a function named \`TestXxx\` taking \`*testing.T\`. You call the code and fail the test yourself with \`t.Errorf\`/\`t.Fatalf\`; there is **no \`assert\`** by design.

\`\`\`go
// in add_test.go
func TestAdd(t *testing.T) {
	got := Add(2, 3)
	if got != 5 {
		t.Errorf("Add(2,3) = %d, want 5", got)
	}
}
\`\`\`

Run with \`go test ./...\`. \`t.Errorf\` records a failure and continues; \`t.Fatalf\` stops that test immediately (use it when later lines would panic).

## Table-driven tests — the dominant idiom

Rather than one test function per case, Go idiom is a **slice of cases** looped over, usually with \`t.Run\` giving each a named **subtest** that fails independently:

\`\`\`go
func TestAbs(t *testing.T) {
	cases := []struct {
		name string
		in   int
		want int
	}{
		{"positive", 3, 3},
		{"negative", -3, 3},
		{"zero", 0, 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := Abs(c.in); got != c.want {
				t.Errorf("Abs(%d) = %d, want %d", c.in, got, c.want)
			}
		})
	}
}
\`\`\`

Adding a case is one line, and \`go test -run TestAbs/negative\` runs just that subtest.

## Testable examples

A function named \`ExampleXxx\` with an \`// Output:\` comment is compiled, run, and its stdout checked against the comment — documentation that can't go stale:

\`\`\`go
func ExampleAdd() {
	fmt.Println(Add(2, 3))
	// Output: 5
}
\`\`\`

## Benchmarks and coverage, briefly

\`BenchmarkXxx(b *testing.B)\` loops \`b.N\` times for \`go test -bench .\`; \`go test -cover\` reports coverage; \`go test -race\` runs the race detector. All built into the one \`go test\` command.

*(These exercises run on your machine with \`go test\` — the editor here is a scratchpad your tutor reviews.)*`,
    exercises: [
      {
        id: "go-table-test",
        title: "Write a table-driven test",
        instructions: `Given \`Abs(n int) int\`, write \`TestAbs\` as a **table-driven test**: a slice of \`{name, in, want}\` cases, looped with \`t.Run(c.name, ...)\`, failing with \`t.Errorf\` when \`Abs(c.in) != c.want\`. Include positive, negative, and zero cases.

You'd run this with \`go test\` on your machine; your tutor will review the structure here.`,
        starterCode: `package main

import "testing"

func Abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}

func TestAbs(t *testing.T) {
	cases := []struct {
		name string
		in   int
		want int
	}{
		// TODO: add cases, e.g. {"positive", 3, 3}, {"negative", -3, 3}, {"zero", 0, 0}.
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			// TODO: if got := Abs(c.in); got != c.want { t.Errorf(...) }
		})
	}
}
`,
      },
      {
        id: "go-example-test",
        title: "A testable example",
        instructions: `Write \`ExampleReverse\` for a \`Reverse(s string) string\` function: print the result of reversing \`"abc"\`, then add an \`// Output:\` comment with the expected \`cba\`. When you \`go test\`, Go compiles the example, runs it, and checks stdout against the comment.`,
        starterCode: `package main

import "fmt"

func Reverse(s string) string {
	rs := []rune(s)
	for i, j := 0, len(rs)-1; i < j; i, j = i+1, j-1 {
		rs[i], rs[j] = rs[j], rs[i]
	}
	return string(rs)
}

func ExampleReverse() {
	// TODO: fmt.Println(Reverse("abc"))
	// TODO: add an  // Output: cba  comment on its own line below.
}

func main() {
	fmt.Println(Reverse("abc"))
}
`,
      },
    ],
  },
  {
    id: "go-modules-tooling",
    module: "tooling",
    title: "Modules and the go Toolchain",
    blurb: "go mod, build/run/test, and the gofmt/go vet workflow (no exercises).",
    content: `## Modules: dependency management, built in

A **module** is a tree of packages with a \`go.mod\` file at its root declaring the module path and its dependencies. You create one once per project:

\`\`\`
go mod init github.com/you/project
\`\`\`

This writes \`go.mod\`:

\`\`\`
module github.com/you/project

go 1.23
\`\`\`

Add a dependency simply by \`import\`ing it and running \`go mod tidy\` — Go fetches it, pins an exact version, and records a checksum in \`go.sum\`. There's no separate install step and no lockfile-vs-manifest split: \`go.mod\` (direct requirements) plus \`go.sum\` (checksums) is the whole story. \`go mod tidy\` also *removes* dependencies you no longer import, keeping the file honest.

## Packages and imports

A directory is a package; the folder name is (by convention) the package name. You import by the module-relative path:

\`\`\`go
import "github.com/you/project/internal/store"
\`\`\`

A directory named \`internal/\` is special: its packages can only be imported by code rooted at its parent — enforced visibility for "this is our private API."

## The one command you'll live in: \`go\`

- \`go run .\` — compile and run the current package (no binary left behind). Great for quick iteration.
- \`go build ./...\` — compile everything; produces a single static binary with no runtime to ship.
- \`go test ./...\` — run every test in the module.
- \`go vet ./...\` — static analysis for likely mistakes (bad \`Printf\` verbs, unreachable code, lock copies). Run it in CI.
- \`go doc fmt.Println\` — read docs for any symbol from the terminal.

The \`./...\` pattern means "this package and everything under it."

## gofmt: the end of style arguments

\`gofmt\` (and \`go fmt\`) rewrites your code into the one canonical format — tabs, brace placement, spacing, import grouping. It is not configurable, and that's the point: **all Go code looks the same**, so there are no formatting reviews and no bikeshedding. Editors run it on save. A close cousin, \`goimports\`, additionally adds and removes import lines for you.

## A minimal project shape

\`\`\`
project/
  go.mod
  go.sum
  main.go          // package main, func main()
  internal/
    store/
      store.go     // package store
      store_test.go
\`\`\`

## The mental model coming from elsewhere

- No \`package.json\` scripts — the \`go\` command *is* the build system.
- No virtualenv — the module and Go's version selection handle isolation.
- No transpile/bundle step — \`go build\` emits a native binary directly.
- Formatting, testing, vetting, docs, dependency management: **all in the standard toolchain**, versioned with the language.

This lesson has no editor exercise — spin up \`go mod init\` in a scratch directory and try \`go run\`, \`go test\`, and \`gofmt\` on the code from earlier lessons. Ask your tutor about anything in the workflow.`,
    exercises: [],
  },
];
