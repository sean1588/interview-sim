import type { Lesson } from "../types";

export const stdlibLessons: Lesson[] = [
  {
    id: "go-stdlib-essentials",
    module: "stdlib",
    title: "slices, maps, sort, and time",
    blurb: "the modern generic helpers, sorting, and working with durations and times.",
    content: `## The standard library is the ecosystem

Go's stdlib is broad and stable — \`net/http\` is a production web server, \`encoding/json\` is built in, \`testing\` needs no third-party runner. You'll pull in far fewer dependencies than in Node or Python. A few everyday packages:

## slices (Go 1.21+)

The generic \`slices\` package replaced a pile of hand-written loops. Highlights:

\`\`\`go
import "slices"

slices.Contains(xs, 3)          // bool
slices.Index(xs, 3)             // first index, or -1
slices.Sort(xs)                 // in place, ascending (ordered types)
slices.Max(xs); slices.Min(xs)
slices.Reverse(xs)              // in place
ys := slices.Clone(xs)          // independent copy (beats the aliasing trap)
slices.Equal(xs, ys)            // element-wise ==
\`\`\`

## maps (Go 1.21+)

\`\`\`go
import "maps"

keys := slices.Sorted(maps.Keys(m)) // maps.Keys yields an iterator; sort for order
maps.Clone(m)                        // shallow copy
\`\`\`

## sort with a custom comparator

For anything beyond natural order, \`slices.SortFunc\` takes a comparator returning negative / zero / positive (like \`cmp\`):

\`\`\`go
people := []Person{{"Bob", 40}, {"Ada", 36}}
slices.SortFunc(people, func(a, b Person) int {
	return a.Age - b.Age            // ascending by age
})
\`\`\`

The older \`sort\` package (\`sort.Slice\`, \`sort.Ints\`) still works and you'll see it in existing code.

## time

Durations are a typed \`time.Duration\` (nanoseconds under the hood), written with unit constants that multiply cleanly:

\`\`\`go
import "time"

d := 2 * time.Second + 500*time.Millisecond
time.Sleep(d)

start := time.Now()
// ... work ...
elapsed := time.Since(start)     // a Duration
fmt.Println(elapsed)             // e.g. "1.2s"
\`\`\`

Formatting uses a **reference layout** — the specific date \`Mon Jan 2 15:04:05 MST 2006\` (i.e. 01/02 03:04:05 PM '06) — instead of \`%Y-%m-%d\` codes:

\`\`\`go
t.Format("2006-01-02")           // -> "2026-07-22"
\`\`\``,
    exercises: [
      {
        id: "go-slices-helpers",
        title: "Use the slices package",
        instructions: `Given \`[]int{5, 3, 8, 1}\`, use the \`slices\` package to (1) sort it ascending in place, (2) find the max, and (3) check whether it contains \`8\`. Print each result.

Expected output:

\`\`\`
[1 3 5 8]
8
true
\`\`\``,
        starterCode: `package main

import (
	"fmt"
	"slices"
)

func main() {
	xs := []int{5, 3, 8, 1}

	// TODO: slices.Sort(xs) in place.
	// TODO: compute slices.Max(xs).
	// TODO: compute slices.Contains(xs, 8).

	fmt.Println(xs)
	// fmt.Println(max)
	// fmt.Println(has8)
}
`,
      },
      {
        id: "go-sortfunc",
        title: "Sort structs with SortFunc",
        instructions: `Sort a \`[]Person\` by \`Age\` ascending using \`slices.SortFunc\` with a comparator that returns \`a.Age - b.Age\`. Print the names in the resulting order.

Expected output:

\`\`\`
[Ada Bob Cy]
\`\`\``,
        starterCode: `package main

import (
	"fmt"
	"slices"
)

type Person struct {
	Name string
	Age  int
}

func main() {
	people := []Person{{"Bob", 40}, {"Cy", 51}, {"Ada", 36}}

	// TODO: slices.SortFunc(people, func(a, b Person) int { return a.Age - b.Age })

	var names []string
	for _, p := range people {
		names = append(names, p.Name)
	}
	fmt.Println(names)
}
`,
      },
    ],
    quiz: [
      {
        id: "go-stdlib-essentials-q1",
        prompt: "What should a comparator passed to `slices.SortFunc` return?",
        options: [
          "The smaller of the two values",
          "An error when the two values are incomparable",
          "A negative, zero, or positive int — like `cmp.Compare`",
          "A bool that is true when `a` should come before `b`",
        ],
        answer: 2,
        explanation: "`slices.SortFunc(people, func(a, b Person) int { return a.Age - b.Age })` sorts ascending by age. The older `sort.Slice` takes a `less` bool instead, and you'll still see it in existing code.",
      },
      {
        id: "go-stdlib-essentials-q2",
        prompt: "How does Go format a date as `2026-07-22`?",
        options: [
          "`t.Format(\"%Y-%m-%d\")`",
          "`t.Format(\"YYYY-MM-DD\")`",
          "`t.Format(time.ISO8601)`",
          "`t.Format(\"2006-01-02\")` — a reference layout, not `%Y-%m-%d` codes",
        ],
        answer: 3,
        explanation: "Go formats by example, using the specific reference date `Mon Jan 2 15:04:05 MST 2006` — that is, 01/02 03:04:05 PM '06. You write the layout as that date would appear.",
      },
      {
        id: "go-stdlib-essentials-q3",
        prompt: "Which `slices` helper directly addresses the slice aliasing trap?",
        options: [
          "`slices.Clone` — an independent copy",
          "`slices.Equal` — element-wise comparison",
          "`slices.Contains` — membership without indexing",
          "`slices.Reverse` — in-place reversal",
        ],
        answer: 0,
        explanation: "`slices.Clone(xs)` allocates fresh backing storage, so appends and mutations to the copy can't reach the original. It replaced a `make` plus `copy` that everyone wrote by hand.",
      },
    ],
  },
  {
    id: "go-json-io",
    module: "stdlib",
    title: "encoding/json and io",
    blurb: "struct tags, Marshal/Unmarshal, and the Reader/Writer interfaces.",
    content: `## JSON maps to structs

\`encoding/json\` converts between JSON and Go values. You define a struct that mirrors the shape; **struct tags** (the backtick metadata) control the JSON field names. Only **exported** (capitalized) fields are marshaled — an unexported field is invisible to the encoder.

\`\`\`go
type User struct {
	Name  string \`json:"name"\`
	Email string \`json:"email,omitempty"\` // omit when empty
	Admin bool   \`json:"-"\`               // never marshal this field
}
\`\`\`

## Marshal and Unmarshal

\`\`\`go
u := User{Name: "Ada", Email: "ada@x.com"}
data, err := json.Marshal(u)      // struct -> []byte
// data == {"name":"Ada","email":"ada@x.com"}

var back User
err = json.Unmarshal(data, &back) // []byte -> struct (pass a POINTER)
\`\`\`

Two things trip people up: you pass a **pointer** to \`Unmarshal\` so it can write into your value, and unknown JSON fields are silently ignored (only matching fields fill in). For pretty output, \`json.MarshalIndent(v, "", "  ")\`.

## Decoding into a map when the shape is unknown

If you don't have a struct, decode into \`map[string]any\` — but you'll then type-assert each value out (\`m["age"].(float64)\` — all JSON numbers decode as \`float64\`). Prefer a struct whenever the shape is known.

## io.Reader and io.Writer — the universal streams

Two one-method interfaces underpin all of Go's I/O:

\`\`\`go
type Reader interface { Read(p []byte) (n int, err error) }
type Writer interface { Write(p []byte) (n int, err error) }
\`\`\`

Files, network connections, \`bytes.Buffer\`, \`strings.Reader\`, HTTP bodies — all implement these, so code written against \`io.Reader\`/\`io.Writer\` works with any of them. This is "accept interfaces" at stdlib scale:

\`\`\`go
var buf bytes.Buffer
fmt.Fprintf(&buf, "hello %s", "go") // Fprintf writes to any io.Writer
io.Copy(dst, src)                    // stream from any Reader to any Writer
\`\`\`

\`json.NewEncoder(w).Encode(v)\` and \`json.NewDecoder(r).Decode(&v)\` are the streaming counterparts that read/write directly to a Reader/Writer.`,
    exercises: [
      {
        id: "go-json-marshal",
        title: "Marshal a struct with tags",
        instructions: `Define a \`Book\` struct with \`Title\` and \`Pages\` fields, tagged \`json:"title"\` and \`json:"pages"\`. Marshal a \`Book{Title: "Go", Pages: 300}\` and print the JSON string.

Expected output:

\`\`\`
{"title":"Go","pages":300}
\`\`\``,
        starterCode: `package main

import (
	"encoding/json"
	"fmt"
)

type Book struct {
	// TODO: Title string with json:"title", Pages int with json:"pages".
}

func main() {
	b := Book{ /* Title: "Go", Pages: 300 */ }
	data, err := json.Marshal(b)
	if err != nil {
		fmt.Println("error:", err)
		return
	}
	fmt.Println(string(data))
}
`,
      },
      {
        id: "go-json-roundtrip",
        title: "Unmarshal into a struct",
        instructions: `Given the JSON \`{"title":"Go","pages":300}\`, \`Unmarshal\` it into a \`Book\` value (pass a **pointer**) and print the fields. Handle the returned error with the \`if err != nil\` idiom.

Expected output:

\`\`\`
Go 300
\`\`\``,
        starterCode: `package main

import (
	"encoding/json"
	"fmt"
)

type Book struct {
	Title string \`json:"title"\`
	Pages int    \`json:"pages"\`
}

func main() {
	data := []byte(\`{"title":"Go","pages":300}\`)

	var b Book
	// TODO: json.Unmarshal(data, &b) and check the error.

	fmt.Println(b.Title, b.Pages)
}
`,
      },
    ],
    quiz: [
      {
        id: "go-json-io-q1",
        prompt: "Why doesn't an unexported (lowercase) struct field appear in `json.Marshal` output?",
        options: [
          "It appears with its lowercase name unless a tag renames it",
          "It appears only when `omitempty` is absent",
          "It causes a marshal error",
          "Only exported fields are visible to the encoder — a struct tag can't rescue an unexported field",
        ],
        answer: 3,
        explanation: "The encoder can only see exported fields. Struct tags control the *name* and options of fields it can already see — `json:\"email,omitempty\"` omits when empty, `json:\"-\"` never marshals.",
      },
      {
        id: "go-json-io-q2",
        prompt: "Why must you pass `&back` rather than `back` to `json.Unmarshal`?",
        options: [
          "Unmarshal writes into your value, so it needs a pointer",
          "Structs can only be passed by pointer in Go",
          "The pointer tells Unmarshal which struct tags to use",
          "It avoids copying the JSON bytes twice",
        ],
        answer: 0,
        explanation: "Without the address it would be filling in a copy. The other common surprise: unknown JSON fields are silently ignored rather than erroring, so a typo'd tag produces a zero-valued field with no complaint.",
      },
      {
        id: "go-json-io-q3",
        prompt: "Why is code written against `io.Reader` and `io.Writer` so widely reusable?",
        options: [
          "They buffer internally, so callers never need to manage chunk sizes",
          "Files, network connections, `bytes.Buffer`, `strings.Reader`, and HTTP bodies all implement these one-method interfaces",
          "The runtime converts any type to a Reader automatically",
          "They are generic over the element type",
        ],
        answer: 1,
        explanation: "This is \"accept interfaces\" at stdlib scale. `io.Copy(dst, src)` streams between any pair of them, and `fmt.Fprintf` writes to any Writer — which is why `json.NewEncoder(w)` and `json.NewDecoder(r)` compose with everything.",
      },
    ],
  },
];
