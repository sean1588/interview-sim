import type { Lesson } from "../types";

export const concurrencyLessons: Lesson[] = [
  {
    id: "go-goroutines-waitgroups",
    module: "concurrency",
    title: "Goroutines and WaitGroups",
    blurb: "the go keyword, the scheduler, and waiting for concurrent work to finish.",
    content: `## A goroutine is a cheap concurrent function

Prefix any call with \`go\` and it runs concurrently in a **goroutine** — a lightweight thread the Go runtime multiplexes onto OS threads. They start at a few KB of stack and grow as needed, so spawning thousands is normal, unlike OS threads.

\`\`\`go
go doWork()          // returns immediately; doWork runs concurrently
go func() {          // an inline goroutine
	fmt.Println("hi from a goroutine")
}()
\`\`\`

The concurrency model in one line: **"Don't communicate by sharing memory; share memory by communicating"** — coordinate with channels (next lesson) rather than locks where you can.

## main doesn't wait

The program exits when \`main\` returns, **killing any still-running goroutines**. This naive version usually prints nothing:

\`\`\`go
func main() {
	go fmt.Println("might not run")
	// main returns immediately -> program exits
}
\`\`\`

You need to *wait* for goroutines to finish. Never use \`time.Sleep\` to "hope they're done."

## sync.WaitGroup — wait for N goroutines

A \`WaitGroup\` is a counter: \`Add\` before launching, \`Done\` when each finishes (via \`defer\`), \`Wait\` to block until the counter hits zero.

\`\`\`go
var wg sync.WaitGroup
for i := 0; i < 3; i++ {
	wg.Add(1)
	go func() {
		defer wg.Done()
		fmt.Println("worker", i)
	}()
}
wg.Wait() // blocks until all three call Done
\`\`\`

Note: since **Go 1.22**, each loop iteration gets a fresh \`i\`, so the goroutine closes over the value you expect. In older Go you had to pass \`i\` as an argument to avoid every goroutine seeing the final value — a classic gotcha now fixed.

## Sharing memory safely: sync.Mutex

When goroutines *do* touch shared state, guard it. Two goroutines writing the same variable is a **data race** (run the race detector with \`go run -race\`). A \`sync.Mutex\` serializes access:

\`\`\`go
var mu sync.Mutex
count := 0
// inside each goroutine:
mu.Lock()
count++
mu.Unlock()
\`\`\`

For a simple counter, \`sync/atomic\` is even lighter; for now, \`Mutex\` + \`WaitGroup\` covers most needs.`,
    exercises: [
      {
        id: "go-waitgroup-basic",
        title: "Wait for goroutines",
        instructions: `Launch 3 goroutines, each printing \`"done"\`, and use a \`sync.WaitGroup\` so \`main\` waits for all of them before printing \`"all finished"\`. Remember: \`wg.Add(1)\` before each \`go\`, \`defer wg.Done()\` inside, \`wg.Wait()\` after the loop.

Expected output (the three "done" lines may interleave, but "all finished" is last):

\`\`\`
done
done
done
all finished
\`\`\``,
        starterCode: `package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	for i := 0; i < 3; i++ {
		// TODO: wg.Add(1), then launch a goroutine that defers wg.Done() and prints "done".
	}
	// TODO: wg.Wait()
	fmt.Println("all finished")
}
`,
      },
      {
        id: "go-mutex-counter",
        title: "A race-free counter",
        instructions: `Increment a shared \`count\` from 100 goroutines (each adding 1), guarding it with a \`sync.Mutex\` so the final total is exactly \`100\`. Use a \`WaitGroup\` to wait, and \`mu.Lock()\` / \`mu.Unlock()\` around \`count++\`.

Expected output:

\`\`\`
100
\`\`\``,
        starterCode: `package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	var mu sync.Mutex
	count := 0

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			// TODO: lock, count++, unlock.
		}()
	}
	wg.Wait()
	fmt.Println(count)
}
`,
      },
    ],
    quiz: [
      {
        id: "go-goroutines-waitgroups-q1",
        prompt: "What happens to running goroutines when `main` returns?",
        options: [
          "The runtime waits for all of them to finish first",
          "They are detached and continue as background processes",
          "The program panics if any goroutine is still running",
          "The program exits and kills them — you must wait explicitly, never with `time.Sleep`",
        ],
        answer: 3,
        explanation: "`go fmt.Println(\"might not run\")` in an otherwise empty main usually prints nothing. A `sync.WaitGroup` — `Add` before launching, `defer Done` inside, `Wait` to block — is the standard way to wait.",
      },
      {
        id: "go-goroutines-waitgroups-q2",
        prompt: "What is Go's concurrency proverb?",
        options: [
          "\"Don't communicate by sharing memory; share memory by communicating\"",
          "\"Locks are cheaper than channels\"",
          "\"A goroutine per request, a mutex per resource\"",
          "\"Concurrency is parallelism\"",
        ],
        answer: 0,
        explanation: "Coordinate with channels rather than locks where you can. Mutexes still exist and are right when goroutines genuinely share state — but the default reach is a channel.",
      },
      {
        id: "go-goroutines-waitgroups-q3",
        prompt: "The classic loop-variable capture gotcha — every goroutine seeing the final `i`. What changed?",
        options: [
          "WaitGroups were changed to snapshot loop variables",
          "Since Go 1.22 each loop iteration gets a fresh variable, so the closure captures the value you expect",
          "It was never real; closures always captured by value",
          "`go vet` now rejects the pattern, but the behavior is unchanged",
        ],
        answer: 1,
        explanation: "In older Go you had to pass `i` as an argument to the goroutine to avoid every one of them seeing the loop's final value. Go 1.22 gives each iteration a fresh variable, which fixes the gotcha at the language level.",
      },
    ],
  },
  {
    id: "go-channels",
    module: "concurrency",
    title: "Channels",
    blurb: "typed pipes, buffered vs unbuffered, close, and ranging over a channel.",
    content: `## Channels connect goroutines

A channel is a typed conduit you send to (\`ch <- v\`) and receive from (\`v := <-ch\`). It's how goroutines hand off values and synchronize — the primary alternative to locks.

\`\`\`go
ch := make(chan int)
go func() { ch <- 42 }()  // send (blocks until someone receives)
v := <-ch                  // receive
fmt.Println(v)             // 42
\`\`\`

## Unbuffered channels synchronize

An unbuffered channel (\`make(chan T)\`) has **no capacity**: a send blocks until a receiver is ready, and vice versa. The send and receive happen together — a **rendezvous**. That blocking *is* the synchronization, often removing the need for a WaitGroup.

## Buffered channels decouple

\`make(chan T, n)\` holds up to \`n\` values. Sends block only when the buffer is full; receives block only when empty:

\`\`\`go
ch := make(chan int, 2)
ch <- 1   // doesn't block
ch <- 2   // doesn't block
ch <- 3   // BLOCKS — buffer full, no receiver
\`\`\`

## Direction matters, and so does nil/closed

- Sending or receiving on a **nil** channel blocks forever.
- **Closing** a channel (\`close(ch)\`) signals "no more values." Receives after close return the zero value immediately with \`ok == false\`.

\`\`\`go
v, ok := <-ch   // ok is false once the channel is closed AND drained
\`\`\`

Only the **sender** should close, and never close twice — sending on a closed channel panics. Closing is a broadcast, not a required cleanup; leaving a channel open is fine if no one relies on the close signal.

## range over a channel

\`for v := range ch\` receives until the channel is closed — the clean way to consume a stream. This is the producer/consumer backbone:

\`\`\`go
ch := make(chan int)
go func() {
	for i := 0; i < 3; i++ {
		ch <- i
	}
	close(ch)  // range ends when the channel closes
}()
for v := range ch {
	fmt.Println(v) // 0 1 2
}
\`\`\`

## Directional parameters

Function parameters can restrict direction — \`chan<- T\` (send-only) or \`<-chan T\` (receive-only) — documenting and enforcing intent:

\`\`\`go
func produce(out chan<- int) { out <- 1; close(out) }
func consume(in <-chan int)  { for v := range in { _ = v } }
\`\`\``,
    exercises: [
      {
        id: "go-channel-handoff",
        title: "Send and receive",
        instructions: `Launch a goroutine that computes \`square(n)\` and sends the result on a channel; receive it in \`main\` and print it. The unbuffered channel makes \`main\` wait for the result with no WaitGroup needed.

For \`n = 6\` the output is \`36\`.`,
        starterCode: `package main

import "fmt"

func main() {
	n := 6
	ch := make(chan int)

	// TODO: launch a goroutine that sends n*n on ch.

	// TODO: receive from ch and print it.
	_ = ch
}
`,
      },
      {
        id: "go-channel-range",
        title: "Stream with range and close",
        instructions: `Write a producer goroutine that sends the numbers \`1..5\` on a channel and then \`close\`s it. In \`main\`, consume with \`for v := range ch\` and sum the values, printing the total.

Expected output (1+2+3+4+5):

\`\`\`
15
\`\`\``,
        starterCode: `package main

import "fmt"

func main() {
	ch := make(chan int)

	go func() {
		// TODO: send 1..5 on ch, then close(ch).
	}()

	sum := 0
	// TODO: for v := range ch { sum += v }
	fmt.Println(sum)
}
`,
      },
      {
        id: "go-worker-pool",
        title: "A tiny worker pool",
        instructions: `Build a fan-out pool: send jobs \`1..5\` on a \`jobs\` channel, start 3 worker goroutines that each read jobs and send \`job*2\` on a \`results\` channel, and collect all 5 results in \`main\`. Use a buffered \`results\` channel and a \`WaitGroup\` to know when to \`close(results)\`. Print the **sum** of results (order is nondeterministic).

Expected output (2+4+6+8+10):

\`\`\`
30
\`\`\``,
        starterCode: `package main

import (
	"fmt"
	"sync"
)

func main() {
	jobs := make(chan int, 5)
	results := make(chan int, 5)

	var wg sync.WaitGroup
	for w := 0; w < 3; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			// TODO: for j := range jobs { results <- j * 2 }
		}()
	}

	// TODO: send 1..5 into jobs, then close(jobs).

	go func() {
		wg.Wait()
		close(results) // close once all workers are done
	}()

	sum := 0
	for r := range results {
		sum += r
	}
	fmt.Println(sum)
}
`,
      },
    ],
    quiz: [
      {
        id: "go-channels-q1",
        prompt: "What does an unbuffered channel (`make(chan T)`) do on send?",
        options: [
          "Blocks until a receiver is ready — the send and receive rendezvous, which *is* the synchronization",
          "Buffers one value and returns immediately",
          "Returns an error if no receiver is waiting",
          "Drops the value silently if nobody is listening",
        ],
        answer: 0,
        explanation: "No capacity means send and receive happen together. That blocking often removes the need for a WaitGroup entirely — the handoff itself is the coordination.",
      },
      {
        id: "go-channels-q2",
        prompt: "Who should close a channel, and why does it matter?",
        options: [
          "Nobody; the garbage collector closes channels automatically",
          "Only the sender — sending on a closed channel panics, and closing twice panics too",
          "Only the receiver, once it has read everything it wants",
          "Whichever side finishes first",
        ],
        answer: 1,
        explanation: "Closing is a broadcast that says \"no more values,\" and receives after close return the zero value with `ok == false`. It isn't required cleanup — leaving a channel open is fine if nobody relies on the close signal.",
      },
      {
        id: "go-channels-q3",
        prompt: "What does `for v := range ch` do?",
        options: [
          "Iterates the channel's buffer without consuming values",
          "Blocks forever unless the channel is buffered",
          "Receives until the channel is closed — the clean way to consume a stream",
          "Receives exactly the number of values currently buffered",
        ],
        answer: 2,
        explanation: "It's the producer/consumer backbone: the producer sends and then closes, and the range loop ends. A send on a nil channel, by contrast, blocks forever.",
      },
    ],
  },
  {
    id: "go-select-context",
    module: "concurrency",
    title: "select and Cancellation with context",
    blurb: "waiting on multiple channels, timeouts, and propagating cancellation.",
    content: `## select waits on multiple channels

\`select\` blocks until **one** of several channel operations is ready, then runs that case. If several are ready, it picks one at random. It's the control structure that makes channels composable:

\`\`\`go
select {
case v := <-ch1:
	fmt.Println("from ch1:", v)
case ch2 <- 5:
	fmt.Println("sent to ch2")
default:
	fmt.Println("nothing ready right now") // non-blocking with default
}
\`\`\`

A \`default\` case makes the \`select\` **non-blocking**; without it, \`select\` waits.

## Timeouts

Combine \`select\` with \`time.After\`, which returns a channel that fires once after a duration — the idiomatic timeout:

\`\`\`go
select {
case res := <-work:
	fmt.Println("got", res)
case <-time.After(2 * time.Second):
	fmt.Println("timed out")
}
\`\`\`

## The done-channel pattern

A receive-only "done" channel signals a goroutine to stop. Closing it broadcasts to every receiver at once:

\`\`\`go
done := make(chan struct{})
go func() {
	for {
		select {
		case <-done:
			return          // told to stop
		default:
			// do a unit of work
		}
	}
}()
close(done) // every <-done unblocks
\`\`\`

## context — the standard cancellation API

Manually threading done-channels gets unwieldy, so Go standardizes it in \`context.Context\`: a value that carries **cancellation**, **deadlines**, and request-scoped data across API boundaries. By convention it's the **first parameter** of any function that does I/O or long work: \`func Fetch(ctx context.Context, ...)\`.

\`\`\`go
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel() // always call cancel to release resources

select {
case res := <-work:
	fmt.Println(res)
case <-ctx.Done():
	fmt.Println("cancelled:", ctx.Err()) // deadline exceeded or cancelled
}
\`\`\`

\`ctx.Done()\` is a channel that closes when the context is cancelled or times out; \`ctx.Err()\` says why. Cancellation propagates down: a context derived from a cancelled parent is itself cancelled, so one signal tears down a whole tree of goroutines.`,
    exercises: [
      {
        id: "go-select-timeout",
        title: "Race a result against a timeout",
        instructions: `Write \`fetch(slow bool) string\`. It launches a goroutine that, after \`time.Sleep\` of 10ms (fast) or 100ms (slow), sends \`"result"\` on a channel. Then it \`select\`s between that channel and \`time.After(50 * time.Millisecond)\`, returning \`"result"\` if it arrives in time or \`"timeout"\` otherwise.

Expected output:

\`\`\`
result
timeout
\`\`\``,
        starterCode: `package main

import (
	"fmt"
	"time"
)

func fetch(slow bool) string {
	ch := make(chan string, 1)
	go func() {
		if slow {
			time.Sleep(100 * time.Millisecond)
		} else {
			time.Sleep(10 * time.Millisecond)
		}
		ch <- "result"
	}()

	// TODO: select between <-ch (return "result") and
	//       <-time.After(50 * time.Millisecond) (return "timeout").
	return ""
}

func main() {
	fmt.Println(fetch(false)) // result
	fmt.Println(fetch(true))  // timeout
}
`,
      },
      {
        id: "go-context-cancel",
        title: "Stop work with context",
        instructions: `Write \`worker(ctx context.Context) string\` that loops, and on each pass \`select\`s between \`<-ctx.Done()\` (return \`"cancelled"\`) and a \`time.After(10 * time.Millisecond)\` tick (keep working). In \`main\`, create a context with a 25ms timeout, call the worker, and print its result — it should be cancelled once the deadline passes.

Expected output:

\`\`\`
cancelled
\`\`\``,
        starterCode: `package main

import (
	"context"
	"fmt"
	"time"
)

func worker(ctx context.Context) string {
	for {
		select {
		// TODO: case <-ctx.Done(): return "cancelled"
		case <-time.After(10 * time.Millisecond):
			// keep working
		}
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Millisecond)
	defer cancel()
	fmt.Println(worker(ctx))
}
`,
      },
    ],
    quiz: [
      {
        id: "go-select-context-q1",
        prompt: "What does adding a `default` case to a `select` do?",
        options: [
          "Catches any panic raised inside the other cases",
          "Makes the select loop until one of the channels is ready",
          "Makes it non-blocking — it runs immediately if no other case is ready",
          "Runs after every other case has been evaluated",
        ],
        answer: 2,
        explanation: "Without a default, `select` blocks until one of its channel operations is ready; if several are ready it picks one at random. A default turns it into a poll.",
      },
      {
        id: "go-select-context-q2",
        prompt: "By convention, where does `context.Context` go in a function signature?",
        options: [
          "Last parameter, alongside the error return",
          "In a struct field on the receiver",
          "As a package-level variable set at startup",
          "First parameter, for any function that does I/O or long work",
        ],
        answer: 3,
        explanation: "`func Fetch(ctx context.Context, ...)` is the standard shape. The context carries cancellation, deadlines, and request-scoped data across API boundaries, and always calling the returned `cancel` (usually via `defer`) releases its resources.",
      },
      {
        id: "go-select-context-q3",
        prompt: "What is `ctx.Done()`?",
        options: [
          "A channel that closes when the context is cancelled or times out, so `<-ctx.Done()` unblocks",
          "A method that blocks until all child contexts finish",
          "A boolean reporting whether the context has expired",
          "A callback registered to run at cancellation",
        ],
        answer: 0,
        explanation: "Closing a channel broadcasts to every receiver at once, which is why it's the cancellation primitive. `ctx.Err()` then says why. Cancellation propagates down, so one signal tears down a whole tree of goroutines.",
      },
    ],
  },
];
