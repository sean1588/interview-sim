import type { Lesson } from "../types";

export const errorsLessons: Lesson[] = [
  {
    id: "go-errors",
    module: "errors",
    title: "Errors Are Values",
    blurb: "the error interface, wrapping with %w, and errors.Is / errors.As.",
    content: `## No exceptions — errors are ordinary return values

Go has no \`try/catch\`. A function that can fail returns an \`error\` as its **last return value**, and the caller checks it immediately. \`error\` is just an interface with one method:

\`\`\`go
type error interface {
	Error() string
}
\`\`\`

A \`nil\` error means success. The pattern you'll write hundreds of times:

\`\`\`go
f, err := os.Open("data.txt")
if err != nil {
	return err          // bubble it up
}
defer f.Close()
\`\`\`

This is verbose on purpose: every failure path is visible at the call site, not hidden in a stack-unwinding mechanism. There's no way to *accidentally* ignore an error and have it silently propagate.

## Creating errors

\`\`\`go
errors.New("something failed")           // a fixed message
fmt.Errorf("parsing %q: bad syntax", in)  // a formatted message
\`\`\`

## Wrapping with %w — adding context without losing the cause

When you return an error from a lower layer, wrap it with \`%w\` to add context while keeping the original reachable:

\`\`\`go
if err != nil {
	return fmt.Errorf("load config: %w", err)
}
\`\`\`

This builds a chain: \`"load config: open config.json: file does not exist"\`.

## Inspecting the chain: errors.Is and errors.As

- \`errors.Is(err, target)\` — is a specific **sentinel** error anywhere in the chain? Compare against package sentinels like \`io.EOF\` or \`os.ErrNotExist\`:

\`\`\`go
if errors.Is(err, os.ErrNotExist) {
	// the file wasn't there, however deeply wrapped
}
\`\`\`

- \`errors.As(err, &target)\` — find a specific **error type** in the chain and bind it, so you can read its fields:

\`\`\`go
var perr *fs.PathError
if errors.As(err, &perr) {
	fmt.Println(perr.Path)
}
\`\`\`

Prefer these over \`==\` or type assertions, which only see the outermost error and miss wrapped causes.

## Sentinel and custom errors

A **sentinel** is a package-level error value callers compare against:

\`\`\`go
var ErrNotFound = errors.New("not found")
\`\`\`

A **custom error type** is any type with an \`Error() string\` method — useful when the error carries data:

\`\`\`go
type ValidationError struct{ Field string }
func (e *ValidationError) Error() string {
	return "invalid field: " + e.Field
}
\`\`\``,
    exercises: [
      {
        id: "go-sentinel-error",
        title: "Return and check a sentinel",
        instructions: `Define a sentinel \`var ErrEmpty = errors.New("empty input")\`. Write \`first(xs []int) (int, error)\` that returns \`ErrEmpty\` when the slice is empty, otherwise \`xs[0]\` and \`nil\`. In \`main\`, use \`errors.Is(err, ErrEmpty)\` to detect the empty case.

Expected output:

\`\`\`
empty!
first is 10
\`\`\``,
        starterCode: `package main

import (
	"errors"
	"fmt"
)

var ErrEmpty = errors.New("empty input")

func first(xs []int) (int, error) {
	// TODO: if len(xs) == 0 return 0, ErrEmpty; else return xs[0], nil.
	return 0, nil
}

func main() {
	if _, err := first(nil); errors.Is(err, ErrEmpty) {
		fmt.Println("empty!")
	}
	v, _ := first([]int{10, 20})
	fmt.Println("first is", v)
}
`,
      },
      {
        id: "go-wrap-error",
        title: "Wrap with %w and unwrap with Is",
        instructions: `Write \`loadUser(id int) error\` that, when \`id <= 0\`, returns \`fmt.Errorf("loadUser %d: %w", id, ErrBadID)\` — wrapping the sentinel \`ErrBadID\` with context. In \`main\`, print the full wrapped message, then confirm \`errors.Is(err, ErrBadID)\` still finds the cause through the wrapper.

Expected output:

\`\`\`
loadUser -1: bad id
is ErrBadID: true
\`\`\``,
        starterCode: `package main

import (
	"errors"
	"fmt"
)

var ErrBadID = errors.New("bad id")

func loadUser(id int) error {
	// TODO: if id <= 0, return fmt.Errorf("loadUser %d: %w", id, ErrBadID).
	//       otherwise return nil.
	return nil
}

func main() {
	err := loadUser(-1)
	fmt.Println(err)
	fmt.Println("is ErrBadID:", errors.Is(err, ErrBadID))
}
`,
      },
      {
        id: "go-custom-error-as",
        title: "A custom error type + errors.As",
        instructions: `Define \`ValidationError\` (a struct with a \`Field string\`) whose \`Error()\` returns \`"invalid field: <Field>"\`, on a **pointer receiver**. Write \`validate(name string) error\` that returns \`&ValidationError{Field: "name"}\` when \`name\` is empty. In \`main\`, use \`errors.As\` to recover the concrete type and print its \`Field\`.

Expected output:

\`\`\`
invalid field: name
field was: name
\`\`\``,
        starterCode: `package main

import (
	"errors"
	"fmt"
)

type ValidationError struct {
	Field string
}

// TODO: add  func (e *ValidationError) Error() string  returning "invalid field: " + e.Field.

func validate(name string) error {
	// TODO: if name == "" return &ValidationError{Field: "name"}, else nil.
	return nil
}

func main() {
	err := validate("")
	fmt.Println(err)

	var verr *ValidationError
	if errors.As(err, &verr) {
		fmt.Println("field was:", verr.Field)
	}
}
`,
      },
    ],
  },
  {
    id: "go-defer-panic-recover",
    module: "errors",
    title: "defer, panic, and recover",
    blurb: "why panic is not an exception, and the narrow role of recover.",
    content: `## panic is for the truly exceptional

A \`panic\` unwinds the stack, running deferred calls as it goes, and crashes the program if nothing stops it. It is **not** Go's error-handling mechanism — reserve it for *programmer bugs* and truly unrecoverable states: an impossible switch case, a violated invariant, an index out of range. For anything a caller might reasonably handle, return an \`error\` instead.

\`\`\`go
func mustPositive(n int) {
	if n < 0 {
		panic("n must be non-negative") // a bug in the caller
	}
}
\`\`\`

The runtime also panics on its own for nil-pointer dereferences, out-of-range indexes, and the like.

## defer runs during a panic

Deferred calls still execute while the stack unwinds — which is what makes \`recover\` possible and keeps cleanup reliable even on a crash path:

\`\`\`go
func f() {
	defer fmt.Println("cleanup runs even if we panic")
	panic("boom")
}
\`\`\`

## recover stops a panic — only inside a defer

\`recover\` regains control of a panicking goroutine, but **only when called directly from a deferred function**. It returns the panic value (or \`nil\` if there was no panic). The idiom converts a panic at a boundary into a normal error:

\`\`\`go
func safeRun() (err error) {   // named return so defer can set it
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered: %v", r)
		}
	}()
	panic("boom")
}
// safeRun() returns an error instead of crashing
\`\`\`

Note the **named return value** \`err\`: the deferred closure assigns to it, which is one of the few places named returns really earn their keep.

## When to actually use recover

Sparingly, and usually at a **process boundary**: a web server recovering per-request so one bad handler doesn't take down the whole server, or a worker that must survive a misbehaving job. Recovering to paper over ordinary errors is an anti-pattern — if a caller should handle it, return an \`error\` in the first place.`,
    exercises: [
      {
        id: "go-recover-to-error",
        title: "Turn a panic into an error",
        instructions: `Write \`safeDivide(a, b int) (result int, err error)\` that returns \`a / b\`, but uses a deferred \`recover\` to catch the runtime panic from dividing by zero and turn it into an error (assigning the named \`err\`). A valid call returns the quotient and a nil error.

Expected output:

\`\`\`
5 <nil>
0 recovered from panic
\`\`\``,
        starterCode: `package main

import "fmt"

func safeDivide(a, b int) (result int, err error) {
	defer func() {
		// TODO: if r := recover(); r != nil { err = fmt.Errorf("recovered from panic") }
	}()
	result = a / b // panics when b == 0
	return result, nil
}

func main() {
	r1, e1 := safeDivide(10, 2)
	fmt.Println(r1, e1)
	r2, e2 := safeDivide(1, 0)
	fmt.Println(r2, e2)
}
`,
      },
      {
        id: "go-defer-cleanup",
        title: "defer as guaranteed cleanup",
        instructions: `Write \`process(fail bool)\` that prints \`"open"\`, immediately \`defer\`s a \`fmt.Println("close")\`, then — if \`fail\` is true — calls \`panic("boom")\`. Wrap the call in \`main\` with a recover so the program survives, and observe that \`"close"\` prints on **both** the normal and the panicking path (that's the guarantee \`defer\` gives you).

Expected output:

\`\`\`
open
close
open
close
recovered
\`\`\``,
        starterCode: `package main

import "fmt"

func process(fail bool) {
	fmt.Println("open")
	// TODO: defer a fmt.Println("close").
	if fail {
		panic("boom")
	}
}

func run(fail bool) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("recovered")
		}
	}()
	process(fail)
}

func main() {
	run(false) // normal path
	run(true)  // panicking path
}
`,
      },
    ],
  },
];
