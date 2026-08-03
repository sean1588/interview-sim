import type { Lesson } from "../types";

export const collectionsLessons: Lesson[] = [
  {
    id: "go-slices",
    module: "collections",
    title: "Slices and the Shared Backing Array",
    blurb: "arrays vs slices, len/cap, append, and the aliasing trap that bites everyone.",
    content: `## Arrays are fixed; slices are what you use

An **array** has a compile-time length that is part of its type — \`[3]int\` and \`[4]int\` are different types. They're rarely used directly. A **slice** is a dynamically-sized, flexible view — the everyday list type:

\`\`\`go
var a [3]int              // array: exactly 3 ints, fixed
s := []int{1, 2, 3}        // slice: note NO number in the brackets
\`\`\`

A slice is a small header — a pointer to a **backing array**, a **length**, and a **capacity**:

\`\`\`go
s := []int{10, 20, 30}
len(s) // 3 — elements you can index
cap(s) // 3 — room before a new backing array is needed
\`\`\`

## make and append

\`make\` pre-allocates; \`append\` grows a slice, returning a (possibly new) slice you must reassign:

\`\`\`go
s := make([]int, 0, 4)   // len 0, cap 4
s = append(s, 1, 2)       // always reassign the result
s = append(s, moreSlice...) // spread another slice
\`\`\`

When \`append\` exceeds capacity, Go allocates a bigger backing array and copies — which is why the return value matters.

## Slicing

\`s[lo:hi]\` is a half-open view (\`hi\` excluded) that **shares the same backing array** — no copy:

\`\`\`go
s := []int{0, 1, 2, 3, 4}
mid := s[1:4]      // [1 2 3], len 3
mid[0] = 99        // MUTATES s too -> s is now [0 99 2 3 4]
\`\`\`

## The aliasing trap

Because slices share storage, a sub-slice (or an \`append\` that stays within capacity) can mutate data another slice can see. This is the #1 slice surprise:

\`\`\`go
base := []int{1, 2, 3}
view := base[:2]
view = append(view, 99) // fits in cap -> overwrites base[2]!
fmt.Println(base)        // [1 2 99]
\`\`\`

To get an independent copy, use \`copy\` or the three-index slice / \`slices.Clone\`:

\`\`\`go
dst := make([]int, len(src))
copy(dst, src)          // fully independent
\`\`\`

Rule of thumb: if you slice something and then \`append\`, assume you may be sharing memory unless you copied.`,
    exercises: [
      {
        id: "go-append-build",
        title: "Build a slice with append",
        instructions: `Write \`evens(n int) []int\` that returns a slice of the even numbers from \`0\` up to (not including) \`n\`, built with \`append\`. Start from \`nil\` or \`make([]int, 0)\` — remember to reassign the result of \`append\`.

For \`n = 10\` the result is \`[0 2 4 6 8]\`.`,
        starterCode: `package main

import "fmt"

func evens(n int) []int {
	var out []int
	// TODO: loop i from 0 to n-1; when i is even, out = append(out, i).
	return out
}

func main() {
	fmt.Println(evens(10))
}
`,
      },
      {
        id: "go-slice-copy",
        title: "Copy to break the alias",
        instructions: `Write \`doubled(src []int) []int\` that returns a **new, independent** slice where each element is doubled — mutating the result must NOT affect \`src\`. Allocate with \`make([]int, len(src))\` and fill it (or \`copy\` then modify). Prove independence by showing \`src\` is unchanged.

Expected output:

\`\`\`
[2 4 6]
[1 2 3]
\`\`\``,
        starterCode: `package main

import "fmt"

func doubled(src []int) []int {
	out := make([]int, len(src))
	// TODO: fill out[i] with src[i] * 2 so out is independent of src.
	return out
}

func main() {
	src := []int{1, 2, 3}
	fmt.Println(doubled(src))
	fmt.Println(src) // must still be [1 2 3]
}
`,
      },
      {
        id: "go-slice-aliasing",
        title: "Watch the aliasing trap",
        instructions: `Explore the shared backing array. Given \`base := []int{1, 2, 3, 4}\`, take \`view := base[:2]\`, then \`append(view, 99)\`. Print \`base\` afterward and observe that index 2 was overwritten because the append fit within capacity. This exercise is about *seeing* the trap, then writing a comment explaining why \`base[2]\` changed.

Expected output:

\`\`\`
view: [1 2 99]
base: [1 2 99 4]
\`\`\``,
        starterCode: `package main

import "fmt"

func main() {
	base := []int{1, 2, 3, 4}
	view := base[:2]

	// TODO: append 99 to view (reassigning view), then print view and base.
	// Add a one-line comment: why did base[2] change?
	_ = view
}
`,
      },
    ],
    quiz: [
      {
        id: "go-slices-q1",
        prompt: "What does this print?\n\n```go\nbase := []int{1, 2, 3}\nview := base[:2]\nview = append(view, 99)\nfmt.Println(base)\n```",
        options: [
          "`[1 2 3]` — append always allocates a new backing array",
          "`[1 2 3 99]` — the append extends the original slice",
          "A panic — you can't append to a sub-slice",
          "`[1 2 99]` — the append fit within capacity and overwrote `base[2]`",
        ],
        answer: 3,
        explanation: "This is the #1 slice surprise. `view` shares `base`'s backing array and has spare capacity, so the append writes into the storage `base` can still see. Rule of thumb: if you slice something and then append, assume you may be sharing memory unless you copied.",
      },
      {
        id: "go-slices-q2",
        prompt: "Why must you write `s = append(s, x)` rather than just `append(s, x)`?",
        options: [
          "When the append exceeds capacity, Go allocates a bigger backing array and returns a new slice header",
          "`append` returns an error you must handle",
          "Go requires all function results to be assigned",
          "It's only necessary for slices created with `make`",
        ],
        answer: 0,
        explanation: "A slice is a header — pointer, length, capacity. Growing past capacity produces a new header pointing at new storage, so discarding the return value loses the append. Even within capacity the length changes, so the return value always matters.",
      },
      {
        id: "go-slices-q3",
        prompt: "How do you get a genuinely independent copy of a slice?",
        options: [
          "`dst := append([]int{}, src...)` is the only way that works",
          "`copy(dst, src)` into a `make`d slice, or `slices.Clone(src)`",
          "`dst := src` — assignment copies the elements",
          "`dst := src[:]` — a full re-slice detaches the storage",
        ],
        answer: 1,
        explanation: "Assignment and re-slicing both copy the *header*, not the backing array, so they still alias. `copy` into freshly allocated storage or `slices.Clone` gives you independence. (`append` onto an empty slice does work too, but `copy`/`Clone` states the intent.)",
      },
    ],
  },
  {
    id: "go-maps",
    module: "collections",
    title: "Maps and the comma-ok Idiom",
    blurb: "map literals, the two-value lookup, delete, random iteration, and sets.",
    content: `## Maps

A \`map[K]V\` is Go's hash table — dict, HashMap, object-as-dictionary. Keys must be comparable (\`==\`-able). Create with a literal or \`make\`:

\`\`\`go
ages := map[string]int{"Ada": 36, "Bob": 40}
counts := make(map[string]int)
counts["x"]++            // missing key reads as the zero value, so this works
\`\`\`

A **nil map** (the zero value, \`var m map[string]int\`) can be *read* (everything returns the zero value) but writing to it **panics** — always \`make\` or use a literal before writing.

## The comma-ok lookup

Indexing a missing key returns the value type's **zero value**, not an error — so \`m["missing"]\` gives \`0\`, indistinguishable from a stored \`0\`. To tell "absent" from "present but zero", use the two-value form:

\`\`\`go
v, ok := ages["Carol"]
if !ok {
	fmt.Println("not present")  // ok is false
}
\`\`\`

This comma-ok pattern is everywhere in Go — the same shape as a type assertion or a channel receive.

## delete and iteration

\`\`\`go
delete(ages, "Bob")   // no-op if the key is absent

for k, v := range ages {
	fmt.Println(k, v)  // ORDER IS RANDOMIZED on purpose
}
\`\`\`

Map iteration order is **deliberately randomized** — never rely on it. To print in order, collect the keys into a slice and \`sort\` them.

## Sets

Go has no built-in set. The idiom is a map to an empty struct (\`struct{}\` uses zero memory) or to \`bool\`:

\`\`\`go
seen := map[string]struct{}{}
seen["a"] = struct{}{}
_, exists := seen["a"]   // true
\`\`\``,
    exercises: [
      {
        id: "go-word-count",
        title: "Count with a map",
        instructions: `Write \`wordCount(words []string) map[string]int\` that returns how many times each word appears. Lean on the fact that a missing key reads as \`0\`, so \`counts[w]++\` just works.

For \`["a", "b", "a", "c", "b", "a"]\` the map has \`a:3, b:2, c:1\`. Print counts for \`a\`, \`b\`, \`c\`:

\`\`\`
a=3 b=2 c=1
\`\`\``,
        starterCode: `package main

import "fmt"

func wordCount(words []string) map[string]int {
	counts := make(map[string]int)
	// TODO: for each word, increment counts[word].
	return counts
}

func main() {
	c := wordCount([]string{"a", "b", "a", "c", "b", "a"})
	fmt.Printf("a=%d b=%d c=%d\\n", c["a"], c["b"], c["c"])
}
`,
      },
      {
        id: "go-comma-ok",
        title: "Present vs zero with comma-ok",
        instructions: `Given a \`map[string]int\`, write \`lookup(m map[string]int, key string) string\` that returns \`"missing"\` when the key is absent and \`"value=<n>"\` when present — even if the stored value is \`0\`. Use the two-value \`v, ok := m[key]\` form; a plain \`m[key] == 0\` cannot tell the two apart.`,
        starterCode: `package main

import "fmt"

func lookup(m map[string]int, key string) string {
	// TODO: v, ok := m[key]; if !ok return "missing", else return fmt.Sprintf("value=%d", v).
	return ""
}

func main() {
	m := map[string]int{"present": 0, "count": 5}
	fmt.Println(lookup(m, "present")) // value=0 (NOT missing)
	fmt.Println(lookup(m, "count"))   // value=5
	fmt.Println(lookup(m, "absent"))  // missing
}
`,
      },
      {
        id: "go-set-dedup",
        title: "Dedup with a set",
        instructions: `Write \`unique(xs []string) []string\` that returns the input with duplicates removed, preserving first-seen order. Use a \`map[string]struct{}\` as a set to track what you've seen.

For \`["a", "b", "a", "c", "b"]\` the result is \`[a b c]\`.`,
        starterCode: `package main

import "fmt"

func unique(xs []string) []string {
	seen := make(map[string]struct{})
	var out []string
	// TODO: for each x, if it's not in seen, mark it and append to out.
	return out
}

func main() {
	fmt.Println(unique([]string{"a", "b", "a", "c", "b"}))
}
`,
      },
    ],
    quiz: [
      {
        id: "go-maps-q1",
        prompt: "`m[\"missing\"]` returns `0` for a `map[string]int`. How do you tell absent from a stored zero?",
        options: [
          "Use `errors.Is` on the returned value",
          "The comma-ok form: `v, ok := m[key]` — `ok` is false only when the key is absent",
          "Compare against `nil`, since missing keys return nil",
          "Call `len(m)` before and after the lookup",
        ],
        answer: 1,
        explanation: "Indexing a missing key returns the value type's zero value, not an error — indistinguishable from a stored `0`. The comma-ok pattern appears everywhere in Go: the same shape as a type assertion or a channel receive.",
      },
      {
        id: "go-maps-q2",
        prompt: "What happens when you write to a nil map (`var m map[string]int`)?",
        options: [
          "Go allocates the map automatically on first write",
          "It's a compile error",
          "It panics — reads return the zero value, but writes require `make` or a literal first",
          "It silently does nothing",
        ],
        answer: 2,
        explanation: "The nil map is readable — every lookup returns the zero value — which makes the write panic surprising. Always `make` or use a literal before writing.",
      },
      {
        id: "go-maps-q3",
        prompt: "Is Go's map iteration order stable?",
        options: [
          "Yes, it follows insertion order",
          "Yes, it follows the keys' natural sort order",
          "It's unspecified but stable within a single program run",
          "No — it's deliberately randomized, so to print in order you collect the keys and sort them",
        ],
        answer: 3,
        explanation: "The randomization is intentional: it stops code from accidentally depending on an order the implementation never promised. Collect keys into a slice and sort when you need determinism.",
      },
    ],
  },
  {
    id: "go-strings-runes",
    module: "collections",
    title: "Strings, Bytes, and Runes",
    blurb: "immutable UTF-8 strings, the byte/rune distinction, and ranging over text.",
    content: `## A string is immutable bytes

A Go \`string\` is a read-only slice of **bytes** holding UTF-8 text. You cannot mutate it in place (\`s[0] = 'H'\` won't compile). Indexing gives you a **byte**, not a character:

\`\`\`go
s := "héllo"
fmt.Println(len(s))   // 6, not 5 — 'é' is two bytes in UTF-8
fmt.Println(s[0])     // 104 (the byte 'h'), a uint8
\`\`\`

This is the key mental shift from Python 3 (where indexing yields characters) and from JS (UTF-16 code units). In Go, \`len\` and \`s[i]\` speak **bytes**.

## byte vs rune

- \`byte\` = \`uint8\` — one UTF-8 byte.
- \`rune\` = \`int32\` — one Unicode **code point** (a "character").

A quoted \`'a'\` is a rune literal. To count or iterate characters, you work in runes.

## Ranging over a string yields runes

\`for range\` over a string decodes UTF-8 for you: the index is the **byte offset**, the value is the **rune**:

\`\`\`go
for i, r := range "héllo" {
	fmt.Printf("%d:%c ", i, r) // 0:h 1:é 3:l 4:l 5:o  (note the jump 1->3)
}
\`\`\`

To count characters, use \`utf8.RuneCountInString(s)\`, not \`len(s)\`. To index characters, convert to \`[]rune\` first:

\`\`\`go
rs := []rune("héllo")
fmt.Println(len(rs), string(rs[1])) // 5 é
\`\`\`

## Building and converting strings

String concatenation with \`+\` allocates each time; to build in a loop use \`strings.Builder\`. Convert between forms explicitly:

\`\`\`go
b := []byte("hi")     // string -> bytes
s := string(b)         // bytes -> string
s2 := string(rune(65)) // rune -> "A"
n, _ := strconv.Atoi("42") // string -> int (with an error)
str := strconv.Itoa(42)    // int -> string
\`\`\`

Note \`string(65)\` converts a *code point* to \`"A"\`, not \`"65"\` — use \`strconv\` for the numeric-text conversion you probably meant.`,
    exercises: [
      {
        id: "go-rune-count",
        title: "Count characters, not bytes",
        instructions: `Write \`charCount(s string) int\` that returns the number of **characters** (runes), which differs from \`len(s)\` for non-ASCII text. Either range over the string counting iterations, or use \`utf8.RuneCountInString\`.

For \`"héllo"\` the answer is \`5\` (while \`len\` is \`6\`).`,
        starterCode: `package main

import "fmt"

func charCount(s string) int {
	count := 0
	// TODO: range over s (the value is a rune) and count each iteration.
	// Or: return utf8.RuneCountInString(s) with "unicode/utf8" imported.
	for range s {
		_ = count
	}
	return count
}

func main() {
	fmt.Println(charCount("héllo")) // 5
	fmt.Println(len("héllo"))       // 6
}
`,
      },
      {
        id: "go-reverse-runes",
        title: "Reverse by runes",
        instructions: `Write \`reverse(s string) string\` that reverses a string **by characters** so multi-byte runes stay intact. Convert to \`[]rune\`, swap ends toward the middle, then convert back with \`string(...)\`.

For \`"héllo"\` the result is \`"olléh"\`.`,
        starterCode: `package main

import "fmt"

func reverse(s string) string {
	rs := []rune(s)
	// TODO: swap rs[i] and rs[len(rs)-1-i] from both ends toward the middle.
	return string(rs)
}

func main() {
	fmt.Println(reverse("héllo"))
}
`,
      },
      {
        id: "go-strings-builder",
        title: "Join with strings.Builder",
        instructions: `Write \`shout(words []string) string\` that upper-cases each word (\`strings.ToUpper\`) and joins them with a single space, using a \`strings.Builder\` to accumulate the result efficiently rather than \`+=\` in a loop.

For \`["go", "is", "fun"]\` the result is \`"GO IS FUN"\`.`,
        starterCode: `package main

import (
	"fmt"
	"strings"
)

func shout(words []string) string {
	var b strings.Builder
	// TODO: for i, w := range words:
	//   write a space before every word except the first (b.WriteByte(' ')),
	//   then b.WriteString(strings.ToUpper(w)).
	// Return b.String().
	_ = b
	return ""
}

func main() {
	fmt.Println(shout([]string{"go", "is", "fun"}))
}
`,
      },
    ],
    quiz: [
      {
        id: "go-strings-runes-q1",
        prompt: "What is `len(\"héllo\")` in Go?",
        options: [
          "6 — `len` counts bytes, and `é` takes two bytes in UTF-8",
          "5 — `len` counts characters",
          "5 — `len` counts UTF-16 code units",
          "10 — Go strings are stored as UTF-32",
        ],
        answer: 0,
        explanation: "A Go string is a read-only slice of bytes holding UTF-8. `len` and `s[i]` both speak bytes — the key mental shift from Python 3, where indexing yields characters, and JS, which uses UTF-16 code units. Use `utf8.RuneCountInString` to count characters.",
      },
      {
        id: "go-strings-runes-q2",
        prompt: "Ranging over `\"héllo\"` yields indices 0, 1, 3, 4, 5. Why does it jump from 1 to 3?",
        options: [
          "It's a bug fixed in Go 1.22",
          "The index is the byte offset and the value is the decoded rune — `é` occupies two bytes",
          "Ranging skips any character that isn't ASCII",
          "The index counts runes but starts over after a multi-byte character",
        ],
        answer: 1,
        explanation: "`for range` over a string decodes UTF-8 for you: index is the byte offset, value is the rune. That's why the offsets skip — the loop is walking bytes while handing you characters.",
      },
      {
        id: "go-strings-runes-q3",
        prompt: "What does `string(65)` produce?",
        options: [
          "A compile error, since int and string are unrelated",
          "`\"\\x41\"` as an escaped literal",
          "`\"A\"` — it converts a code point, not a number; use `strconv.Itoa` for `\"65\"`",
          "`\"65\"` — the decimal representation",
        ],
        answer: 2,
        explanation: "Converting an integer to a string interprets it as a Unicode code point. `strconv.Itoa(65)` is the numeric-text conversion you probably meant, and `strconv.Atoi` goes the other way with an error.",
      },
    ],
  },
];
