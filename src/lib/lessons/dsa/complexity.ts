import type { Lesson } from "../types";

export const complexityLessons: Lesson[] = [
  {
    id: "dsa-big-o",
    module: "complexity",
    title: "Big-O: How Work Grows",
    blurb: "Growth classes, dropping constants, and worst vs average case.",
    graphics: [
      {
        id: "growth-curves",
        title: "How work grows with n",
        caption:
          "Same input size, very different futures: constant stays flat while linear, super-linear, and quadratic curves peel away. Big-O names the shape of that growth, not a stopwatch reading.",
        src: "/lesson-graphics/dsa/dsa-big-o.png",
      },
    ],
    content: {
      typescript: `You already have the instinct for this. You've written a \`.map()\` with a \`.includes()\` check inside it, watched it fly on test data, and then watched it crawl in production once the array had 50,000 items instead of 50. That feeling — "why did this suddenly get slow" — is Big-O showing up uninvited. Big-O gives that instinct a name and a vocabulary.

Big-O does **not** measure how fast your code runs on one input. It measures how the *amount of work* grows as the input grows. Two functions can both finish in 2ms on a 10-item array and still have wildly different futures.

The growth classes that show up constantly, from best to worst:

| Class | Name | n = 1,000 | n = 1,000,000 |
|---|---|---|---|
| O(1) | constant | 1 | 1 |
| O(log n) | logarithmic | ~10 | ~20 |
| O(n) | linear | 1,000 | 1,000,000 |
| O(n log n) | linearithmic | ~10,000 | ~20,000,000 |
| O(n²) | quadratic | 1,000,000 | 1,000,000,000,000 |
| O(2ⁿ) | exponential | astronomical | forget it |

Look at that last column for O(n²): a trillion steps. Even at a billion operations a second, that's over 15 minutes for a single pass — for what looked like "just a nested loop" over a million rows. That's the concrete shape of the slowdown you've felt.

We also drop constants and lower-order terms. A function that does \`3n + 40\` operations is still **O(n)** — as n grows to a million, the \`+40\` and the \`×3\` become rounding error next to the shape of the growth. This isn't sloppiness; it's the point. Big-O answers "does this scale," not "is this fast today."

One more distinction: **worst case vs average case**. A \`Map\` lookup is O(1) *on average* — but its worst case (every key colliding into the same bucket) is O(n). Usually you reason about average case for hash-based structures and worst case for everything else, and interviewers expect you to name which one you're citing.`,
      python: `You already have the instinct for this. You've written a list comprehension with an \`x in seen_list\` check inside it, watched it fly on test data, and then watched it crawl in production once the list had 50,000 items instead of 50. That feeling — "why did this suddenly get slow" — is Big-O showing up uninvited. Big-O gives that instinct a name and a vocabulary.

Big-O does **not** measure how fast your code runs on one input. It measures how the *amount of work* grows as the input grows. Two functions can both finish in 2ms on a 10-item list and still have wildly different futures.

The growth classes that show up constantly, from best to worst:

| Class | Name | n = 1,000 | n = 1,000,000 |
|---|---|---|---|
| O(1) | constant | 1 | 1 |
| O(log n) | logarithmic | ~10 | ~20 |
| O(n) | linear | 1,000 | 1,000,000 |
| O(n log n) | linearithmic | ~10,000 | ~20,000,000 |
| O(n²) | quadratic | 1,000,000 | 1,000,000,000,000 |
| O(2ⁿ) | exponential | astronomical | forget it |

Look at that last column for O(n²): a trillion steps. Even at a billion operations a second, that's over 15 minutes for a single pass — for what looked like "just a nested loop" over a million rows. That's the concrete shape of the slowdown you've felt.

We also drop constants and lower-order terms. A function that does \`3n + 40\` operations is still **O(n)** — as n grows to a million, the \`+40\` and the \`×3\` become rounding error next to the shape of the growth. This isn't sloppiness; it's the point. Big-O answers "does this scale," not "is this fast today."

One more distinction: **worst case vs average case**. A \`dict\` lookup is O(1) *on average* — but its worst case (every key colliding into the same bucket) is O(n). Usually you reason about average case for hash-based structures and worst case for everything else, and interviewers expect you to name which one you're citing.`,
    },
    exercises: [
    {
      id: "dsa-count-ops",
      title: "Count the steps",
      instructions: {
        typescript: `Below are two complete, correct implementations of \`containsDuplicate\`: a nested-loop version and a Set-based version. Each takes a \`steps\` object with a \`count\` field — your job is to add the counting. Increment \`steps.count\` once for every comparison the nested-loop version makes, and once for every element the Set-based version processes. Don't change the algorithm logic, just instrument it.

Expected output: running both on arrays of length 50 and 100 prints step counts that show the nested-loop version growing roughly 4x (doubling n roughly quadruples its steps) while the Set version grows roughly 2x (doubling n roughly doubles its steps).`,
        python: `Below are two complete, correct implementations of \`contains_duplicate\`: a nested-loop version and a set-based version. Each takes a \`steps\` dict with a \`"count"\` key — your job is to add the counting. Increment \`steps["count"]\` once for every comparison the nested-loop version makes, and once for every element the set-based version processes. Don't change the algorithm logic, just instrument it.

Expected output: running both on lists of length 50 and 100 prints step counts that show the nested-loop version growing roughly 4x (doubling n roughly quadruples its steps) while the set version grows roughly 2x (doubling n roughly doubles its steps).`,
      },
      starterCode: {
        typescript: `function containsDuplicateSlow(arr: number[], steps: { count: number }): boolean {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      // TODO: count this comparison
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}

function containsDuplicateFast(arr: number[], steps: { count: number }): boolean {
  const seen = new Set<number>();
  for (const x of arr) {
    // TODO: count processing this element
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}

function makeUniqueArray(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

for (const n of [50, 100]) {
  const arr = makeUniqueArray(n);
  const slowSteps = { count: 0 };
  const fastSteps = { count: 0 };
  containsDuplicateSlow(arr, slowSteps);
  containsDuplicateFast(arr, fastSteps);
  console.log(\`n=\${n} slow steps=\${slowSteps.count} fast steps=\${fastSteps.count}\`);
}
`,
        python: `def contains_duplicate_slow(arr, steps):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            # TODO: count this comparison
            if arr[i] == arr[j]:
                return True
    return False


def contains_duplicate_fast(arr, steps):
    seen = set()
    for x in arr:
        # TODO: count processing this element
        if x in seen:
            return True
        seen.add(x)
    return False


def make_unique_list(n):
    return list(range(n))


for n in [50, 100]:
    arr = make_unique_list(n)
    slow_steps = {"count": 0}
    fast_steps = {"count": 0}
    contains_duplicate_slow(arr, slow_steps)
    contains_duplicate_fast(arr, fast_steps)
    print(f"n={n} slow steps={slow_steps['count']} fast steps={fast_steps['count']}")
`,
      },
    },
    {
      id: "dsa-classify-growth",
      title: "Name that growth",
      instructions: {
        typescript: `Three complete functions are given below: \`getMiddle\` (O(1)), \`findMax\` (O(n)), and \`hasPairSum\` (O(n^2)). Read each one, then fill in \`classify(fnName)\` so it returns the correct growth-class string (\`"O(1)"\`, \`"O(n)"\`, or \`"O(n^2)"\`) for each function name.

Expected output: the example calls print each function's name next to your classification, and they should read \`getMiddle -> O(1)\`, \`findMax -> O(n)\`, \`hasPairSum -> O(n^2)\`.`,
        python: `Three complete functions are given below: \`get_middle\` (O(1)), \`find_max\` (O(n)), and \`has_pair_sum\` (O(n^2)). Read each one, then fill in \`classify(fn_name)\` so it returns the correct growth-class string (\`"O(1)"\`, \`"O(n)"\`, or \`"O(n^2)"\`) for each function name.

Expected output: the example calls print each function's name next to your classification, and they should read \`get_middle -> O(1)\`, \`find_max -> O(n)\`, \`has_pair_sum -> O(n^2)\`.`,
      },
      starterCode: {
        typescript: `function getMiddle(arr: number[]): number {
  return arr[Math.floor(arr.length / 2)];
}

function findMax(arr: number[]): number {
  let max = -Infinity;
  for (const x of arr) {
    if (x > max) max = x;
  }
  return max;
}

function hasPairSum(arr: number[], target: number): boolean {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (i !== j && arr[i] + arr[j] === target) return true;
    }
  }
  return false;
}

function classify(fnName: string): string {
  // TODO: return "O(1)", "O(n)", or "O(n^2)" based on fnName
  return "";
}

for (const label of ["getMiddle", "findMax", "hasPairSum"]) {
  console.log(\`\${label} -> \${classify(label)}\`);
}
`,
        python: `def get_middle(arr):
    return arr[len(arr) // 2]


def find_max(arr):
    largest = float("-inf")
    for x in arr:
        if x > largest:
            largest = x
    return largest


def has_pair_sum(arr, target):
    for i in range(len(arr)):
        for j in range(len(arr)):
            if i != j and arr[i] + arr[j] == target:
                return True
    return False


def classify(fn_name):
    # TODO: return "O(1)", "O(n)", or "O(n^2)" based on fn_name
    return ""


for label in ["get_middle", "find_max", "has_pair_sum"]:
    print(f"{label} -> {classify(label)}")
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-big-o-q1",
      prompt: "A function performs exactly `5n + 200` operations for an input of size n. What is its Big-O?",
      options: [
        "O(n²)",
        "O(n)",
        "O(1)",
        "O(5n)",
      ],
      answer: 1,
      explanation: "Big-O drops constant factors and additive constants because they become irrelevant as n grows large — only the shape of growth (linear, here) matters.",
    },
    {
      id: "dsa-big-o-q2",
      prompt: "You have two functions that both process a collection of 1,000,000 items. One is O(n), the other O(n²). Roughly how do their step counts compare?",
      options: [
        "The O(n²) function takes exactly twice as many steps as the O(n) function",
        "They take about the same number of steps at this size, they only differ for small n",
        "The O(n) function takes about a million steps; the O(n²) function takes about a trillion",
        "The O(n) function takes about a trillion steps; the O(n²) function takes about a million",
      ],
      answer: 2,
      explanation: "At n = 1,000,000, O(n) is ~10^6 steps while O(n²) is ~10^12 steps — the gap is enormous and only widens as n grows, which is exactly why nested loops over large collections become a production incident.",
    },
    {
      id: "dsa-big-o-q3",
      prompt: {
        typescript: "A `Map`'s `.get()` is usually described as O(1). Why do interviewers still expect you to mention O(n) for it?",
        python: "A `dict` lookup is usually described as O(1). Why do interviewers still expect you to mention O(n) for it?",
      },
      options: {
        typescript: [
          "O(1) only applies to maps with fewer than 100 entries",
          "The O(n) figure describes how long it takes to build the map, not to read from it",
          "Maps are actually O(n) always, and O(1) is a common misconception",
          "O(1) is the average case; the worst case (heavy collisions putting many keys in one bucket) is O(n)",
        ],
        python: [
          "O(1) only applies to dicts with fewer than 100 entries",
          "The O(n) figure describes how long it takes to build the dict, not to read from it",
          "Dicts are actually O(n) always, and O(1) is a common misconception",
          "O(1) is the average case; the worst case (heavy collisions putting many keys in one bucket) is O(n)",
        ],
      },
      answer: 3,
      explanation: "Hash-based lookups are O(1) on average because a good hash function spreads keys evenly across buckets, but the worst case — many keys colliding into one bucket — degrades lookups to a linear scan, O(n).",
    },
    ],
  },
  {
    id: "dsa-time-vs-space",
    module: "complexity",
    title: "Trading Space for Time",
    blurb: "Memory is a resource you can spend to buy speed.",
    graphics: [
      {
        id: "space-for-time",
        title: "Buy speed with memory",
        caption:
          "The classic trade: spend extra space (a filled map or set) so each later query is cheap, instead of rescanning a sparse structure every time.",
        src: "/lesson-graphics/dsa/dsa-time-vs-space.png",
      },
    ],
    content: {
      typescript: `The single most common move in an interview — and in real production code — is spending memory to buy speed. You allocate a Set, a Map, or an array of precomputed results, and in exchange you erase a factor of n from your time complexity.

The canonical example is two-sum. Given an array and a target, find two numbers that add to it. The naive approach checks every pair: nested loops, O(n²) time, and O(1) extra space since you're not storing anything beyond the input. The traded version makes one pass, and for each number checks a Map for its complement (\`target - x\`); if it's not there yet, it stores the current number keyed by itself. That's O(n) time — one map lookup and one map insert per element, both O(1) average — at the cost of O(n) space for the Map itself.

**Space complexity counts auxiliary memory** — what you allocate beyond the input you were given, not the input itself. This is why \`sort()\` is described differently from \`toSorted()\`: both take O(n log n) time, but \`sort()\` mutates in place (O(1) extra space) while \`toSorted()\` copies the array first (O(n) extra space). Same time complexity, different space story — know which one you're calling.

When do you *not* make this trade? A few real cases: when n is tiny (the constant overhead of hashing can lose to a simple scan on 5 items), when you're in a genuinely memory-constrained environment (embedded systems, a hot path processing millions of requests where every allocation is billed), or when the trade doesn't actually help because you'd need the O(n) work anyway to build the lookup and only call it once. Concretely: a \`Set<number>\` holding a million small integers costs tens of megabytes — usually a non-issue on a server or laptop, but worth naming out loud if you're in a context where it isn't.`,
      python: `The single most common move in an interview — and in real production code — is spending memory to buy speed. You allocate a set, a dict, or a list of precomputed results, and in exchange you erase a factor of n from your time complexity.

The canonical example is two-sum. Given a list and a target, find two numbers that add to it. The naive approach checks every pair: nested loops, O(n²) time, and O(1) extra space since you're not storing anything beyond the input. The traded version makes one pass, and for each number checks a dict for its complement (\`target - x\`); if it's not there yet, it stores the current number keyed by itself. That's O(n) time — one dict lookup and one dict insert per element, both O(1) average — at the cost of O(n) space for the dict itself.

**Space complexity counts auxiliary memory** — what you allocate beyond the input you were given, not the input itself. This is why \`lst.sort()\` is described differently from \`sorted(lst)\`: both take O(n log n) time, but \`.sort()\` mutates in place (O(1) extra space) while \`sorted()\` builds a new list first (O(n) extra space). Same time complexity, different space story — know which one you're calling.

When do you *not* make this trade? A few real cases: when n is tiny (the constant overhead of hashing can lose to a simple scan on 5 items), when you're in a genuinely memory-constrained environment (embedded systems, a hot path processing millions of requests where every allocation is billed), or when the trade doesn't actually help because you'd need the O(n) work anyway to build the lookup and only call it once. Concretely: a \`set\` holding a million small integers costs tens of megabytes — usually a non-issue on a server or laptop, but worth naming out loud if you're in a context where it isn't.`,
    },
    exercises: [
    {
      id: "dsa-trade-space",
      title: {
        typescript: "Buy speed with a Set",
        python: "Buy speed with a set",
      },
      instructions: {
        typescript: `\`findFirstDuplicate\` below is complete and correct: it uses nested loops to find the first value that appears more than once, in O(n²) time and O(1) extra space. Implement \`findFirstDuplicateFast\` to do the same job in O(n) time by trading in O(n) space — use a Set to track values you've already seen.

Expected output: both functions run on the same array and print matching results.`,
        python: `\`find_first_duplicate\` below is complete and correct: it uses nested loops to find the first value that appears more than once, in O(n²) time and O(1) extra space. Implement \`find_first_duplicate_fast\` to do the same job in O(n) time by trading in O(n) space — use a set to track values you've already seen.

Expected output: both functions run on the same list and print matching results.`,
      },
      starterCode: {
        typescript: `function findFirstDuplicate(arr: number[]): number | null {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return arr[i];
    }
  }
  return null;
}

function findFirstDuplicateFast(arr: number[]): number | null {
  // TODO: use a Set to find the first repeated value in O(n) time
  return null;
}

const sample = [4, 2, 7, 5, 2, 9, 7];
console.log("slow:", findFirstDuplicate(sample));
console.log("fast:", findFirstDuplicateFast(sample));
`,
        python: `def find_first_duplicate(arr):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j]:
                return arr[i]
    return None


def find_first_duplicate_fast(arr):
    # TODO: use a set to find the first repeated value in O(n) time
    return None


sample = [4, 2, 7, 5, 2, 9, 7]
print("slow:", find_first_duplicate(sample))
print("fast:", find_first_duplicate_fast(sample))
`,
      },
    },
    {
      id: "dsa-memo-lookup",
      title: "Precompute a lookup",
      instructions: {
        typescript: `\`getUserName\` below scans the full \`users\` array on every call — fine once, wasteful in a loop of many lookups. Implement \`buildIndex(users)\` to return a \`Map<number, {id: number, name: string}>\` keyed by user id, then rewrite the lookup loop at the bottom to call \`buildIndex\` once and use \`.get(id)\` instead of calling \`getUserName\` repeatedly.

Expected output: prints the names for ids 2, 4, and 1 using the Map-based lookup.`,
        python: `\`get_user_name\` below scans the full \`users\` list on every call — fine once, wasteful in a loop of many lookups. Implement \`build_index(users)\` to return a dict keyed by user id, then rewrite the lookup loop at the bottom to call \`build_index\` once and use \`index[user_id]\` instead of calling \`get_user_name\` repeatedly.

Expected output: prints the names for ids 2, 4, and 1 using the dict-based lookup.`,
      },
      starterCode: {
        typescript: `type User = { id: number; name: string };

const users: User[] = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Grace" },
  { id: 3, name: "Alan" },
  { id: 4, name: "Katherine" },
];

function getUserName(userList: User[], id: number): string | undefined {
  for (const u of userList) {
    if (u.id === id) return u.name;
  }
  return undefined;
}

function buildIndex(userList: User[]): Map<number, User> {
  // TODO: build and return a Map from id -> user
  return new Map();
}

const idsToLookUp = [2, 4, 1];
const index = buildIndex(users);
for (const id of idsToLookUp) {
  // TODO: replace this with an index.get(id) lookup once buildIndex works
  console.log(id, getUserName(users, id));
}
`,
        python: `users = [
    {"id": 1, "name": "Ada"},
    {"id": 2, "name": "Grace"},
    {"id": 3, "name": "Alan"},
    {"id": 4, "name": "Katherine"},
]


def get_user_name(user_list, user_id):
    for u in user_list:
        if u["id"] == user_id:
            return u["name"]
    return None


def build_index(user_list):
    # TODO: build and return a dict from id -> user
    return {}


ids_to_look_up = [2, 4, 1]
index = build_index(users)
for user_id in ids_to_look_up:
    # TODO: replace this with an index[user_id] lookup once build_index works
    print(user_id, get_user_name(users, user_id))
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-time-vs-space-q1",
      prompt: {
        typescript: "You rewrite a two-sum solution from nested loops to a single pass using a Map. What's the honest complexity trade you just made?",
        python: "You rewrite a two-sum solution from nested loops to a single pass using a dict. What's the honest complexity trade you just made?",
      },
      options: {
        typescript: [
          "Time drops from O(n²) to O(n); space stays O(1) because the Map is temporary",
          "Time drops from O(n²) to O(n); space grows from O(1) to O(n)",
          "Both time and space improve, from O(n²) to O(n)",
          "Time stays O(n²) but space grows, because Map lookups are actually O(n)",
        ],
        python: [
          "Time drops from O(n²) to O(n); space stays O(1) because the dict is temporary",
          "Time drops from O(n²) to O(n); space grows from O(1) to O(n)",
          "Both time and space improve, from O(n²) to O(n)",
          "Time stays O(n²) but space grows, because dict lookups are actually O(n)",
        ],
      },
      answer: 1,
      explanation: "The lookup table itself holds up to n entries, which is O(n) auxiliary space — 'temporary' doesn't mean free, it's allocated and counted. In exchange, each lookup becomes O(1) average instead of an O(n) inner scan, dropping total time to O(n).",
    },
    {
      id: "dsa-time-vs-space-q2",
      prompt: {
        typescript: "`arr.sort()` and `arr.toSorted()` both run in O(n log n) time. What's the actual difference between them?",
        python: "`lst.sort()` and `sorted(lst)` both run in O(n log n) time. What's the actual difference between them?",
      },
      options: {
        typescript: [
          "`toSorted()` is faster because it doesn't mutate the original array",
          "`sort()` only works on numbers while `toSorted()` works on any type",
          "`sort()` mutates in place (O(1) extra space); `toSorted()` copies the array first (O(n) extra space)",
          "There's no real difference; `toSorted()` is just a newer alias for `sort()`",
        ],
        python: [
          "`sorted()` is faster because it doesn't mutate the original list",
          "`.sort()` only works on numbers while `sorted()` works on any type",
          "`.sort()` mutates in place (O(1) extra space); `sorted()` builds a new list (O(n) extra space)",
          "There's no real difference; `sorted()` is just a function form of `.sort()`",
        ],
      },
      answer: 2,
      explanation: "They share the same time complexity but differ in space: the in-place sort rearranges the existing sequence, while the copying form allocates a new one to leave the original untouched — that copy is O(n) auxiliary space.",
    },
    {
      id: "dsa-time-vs-space-q3",
      prompt: "When is trading space for time the wrong call, even though it would technically speed things up?",
      options: {
        typescript: [
          "Whenever the codebase already uses arrays instead of Maps elsewhere",
          "Never — trading space for time is always worth it if the language supports Map/Set",
          "Only when the function is called exactly once",
          "When n is small enough that hashing overhead outweighs the savings, or memory is genuinely constrained",
        ],
        python: [
          "Whenever the codebase already uses lists instead of dicts elsewhere",
          "Never — trading space for time is always worth it if the language has dicts and sets",
          "Only when the function is called exactly once",
          "When n is small enough that hashing overhead outweighs the savings, or memory is genuinely constrained",
        ],
      },
      answer: 3,
      explanation: "For tiny n, the constant overhead of hashing can cost more than a simple scan saves, and in memory-constrained environments the extra O(n) allocation may simply not be affordable — the trade is situational, not automatic.",
    },
    ],
  },
  {
    id: "dsa-reading-complexity",
    module: "complexity",
    title: "Reading Code for Complexity",
    blurb: "Loops, halving, and hidden costs inside library calls.",
    graphics: [
      {
        id: "read-the-shape",
        title: "Spot nested work",
        caption:
          "Complexity is read from structure: a single pass is linear; nested loops or a scan inside a loop compound. Library helpers hide the same cost.",
        src: "/lesson-graphics/dsa/dsa-reading-complexity.png",
      },
    ],
    content: {
      typescript: `Big-O isn't something you compute from a formula — it's something you read off the shape of the code. A few rules get you most of the way there.

**Sequential loops add.** Two separate \`for\` loops over the same array, one after another, is O(n) + O(n) = O(2n), which is still O(n). You don't multiply just because there are two loops — you multiply only when one loop runs *inside* another.

**Nested loops multiply.** A loop over n items with a loop over m items inside it is O(n·m). If both are the same array, that's O(n²) — the shape behind every "why is this slow" nested-loop story.

**A loop that halves its range each iteration is O(log n).** Binary search is the classic example: each comparison throws away half the remaining space, so you reach the answer in about log₂(n) steps — roughly 20 steps to search a million-item sorted array, instead of up to a million.

**The one that bites people the most: a linear scan hiding inside a loop.** \`arr.includes(x)\`, \`arr.indexOf(x)\`, and \`arr.shift()\` are all O(n) — they walk the array. Call any of them inside a loop that runs n times and you've built an accidental nested loop, O(n²), even though your code has only one \`for\` visible on the page. This is the single biggest source of surprise quadratic blowups in JS/TS codebases, and it's exactly the pattern behind that \`.map()\` with \`.includes()\` feeling slow.

Worth memorizing the going rates for the array methods you use daily:

| Call | Cost | Why |
|---|---|---|
| \`.push()\` / \`.pop()\` | O(1) amortized | end-of-array, no shifting |
| \`.shift()\` / \`.unshift()\` | O(n) | every remaining element shifts index |
| \`.includes()\` / \`.indexOf()\` | O(n) | linear scan |
| \`.slice()\` | O(n) | copies the range |
| \`.sort()\` | O(n log n) | comparison sort |
| \`Map\`/\`Set\` \`.get()\`/\`.has()\` | O(1) average | hash lookup |

"Amortized" on push/pop means: most calls are O(1), but occasionally the underlying array has to grow and copy everything (like doubling capacity) — averaged over many pushes, that occasional O(n) copy washes out to O(1) per call.`,
      python: `Big-O isn't something you compute from a formula — it's something you read off the shape of the code. A few rules get you most of the way there.

**Sequential loops add.** Two separate \`for\` loops over the same list, one after another, is O(n) + O(n) = O(2n), which is still O(n). You don't multiply just because there are two loops — you multiply only when one loop runs *inside* another.

**Nested loops multiply.** A loop over n items with a loop over m items inside it is O(n·m). If both are the same list, that's O(n²) — the shape behind every "why is this slow" nested-loop story.

**A loop that halves its range each iteration is O(log n).** Binary search is the classic example: each comparison throws away half the remaining space, so you reach the answer in about log₂(n) steps — roughly 20 steps to search a million-item sorted list, instead of up to a million.

**The one that bites people the most: a linear scan hiding inside a loop.** \`x in lst\`, \`lst.index(x)\`, and \`lst.pop(0)\` are all O(n) — they walk the list. Call any of them inside a loop that runs n times and you've built an accidental nested loop, O(n²), even though your code has only one \`for\` visible on the page. This is the single biggest source of surprise quadratic blowups in Python codebases, and it's exactly the pattern behind that comprehension with an \`in\` check feeling slow.

Note the trap in \`x in lst\` versus \`x in some_set\`: the two read identically, but the first is a linear scan and the second is a hash lookup. The \`in\` operator's cost depends entirely on what's on the right-hand side.

Worth memorizing the going rates for the list operations you use daily:

| Call | Cost | Why |
|---|---|---|
| \`.append()\` / \`.pop()\` | O(1) amortized | end-of-list, no shifting |
| \`.pop(0)\` / \`.insert(0, x)\` | O(n) | every remaining element shifts index |
| \`x in lst\` / \`.index(x)\` | O(n) | linear scan |
| \`lst[a:b]\` | O(n) | copies the range |
| \`.sort()\` / \`sorted()\` | O(n log n) | comparison sort (Timsort) |
| \`dict\`/\`set\` lookup | O(1) average | hash lookup |

"Amortized" on append/pop means: most calls are O(1), but occasionally the underlying array has to grow and copy everything (CPython over-allocates, then copies when it runs out) — averaged over many appends, that occasional O(n) copy washes out to O(1) per call.`,
    },
    exercises: [
    {
      id: "dsa-halving-loop",
      title: "The halving loop",
      instructions: {
        typescript: `Implement \`countHalvings(n)\`: repeatedly integer-divide \`n\` by 2 until it reaches 1, counting how many divisions it takes.

Expected output: prints the counts for 8, 1024, and 1,000,000 — you should see roughly 3, 10, and 20, showing log₂(n) growth (doubling n adds only one more step, unlike linear growth where doubling n doubles the steps).`,
        python: `Implement \`count_halvings(n)\`: repeatedly integer-divide \`n\` by 2 (that's \`n // 2\`) until it reaches 1, counting how many divisions it takes.

Expected output: prints the counts for 8, 1024, and 1,000,000 — you should see roughly 3, 10, and 20, showing log₂(n) growth (doubling n adds only one more step, unlike linear growth where doubling n doubles the steps).`,
      },
      starterCode: {
        typescript: `function countHalvings(n: number): number {
  // TODO: repeatedly halve n (integer division) until it reaches 1,
  // returning the number of halvings it took
  return 0;
}

for (const n of [8, 1024, 1_000_000]) {
  console.log(\`countHalvings(\${n}) = \${countHalvings(n)}\`);
}
`,
        python: `def count_halvings(n):
    # TODO: repeatedly halve n (integer division, n // 2) until it reaches 1,
    # returning the number of halvings it took
    return 0


for n in [8, 1024, 1_000_000]:
    print(f"count_halvings({n}) = {count_halvings(n)}")
`,
      },
    },
    {
      id: "dsa-hidden-scan",
      title: "Spot the hidden O(n)",
      instructions: {
        typescript: `\`dedupe(arr)\` below works correctly but is O(n²): the \`result.includes(x)\` check inside the loop is a hidden linear scan, run once per input element. Implement \`dedupeFast(arr)\` to do the same job in O(n) using a Set to track seen values.

Expected output: both functions run on the same array and print matching deduped results.`,
        python: `\`dedupe(arr)\` below works correctly but is O(n²): the \`x not in result\` check inside the loop is a hidden linear scan, run once per input element — \`in\` on a *list* walks it. Implement \`dedupe_fast(arr)\` to do the same job in O(n) using a set to track seen values, which makes the same \`in\` check O(1).

Expected output: both functions run on the same list and print matching deduped results.`,
      },
      starterCode: {
        typescript: `function dedupe(arr: number[]): number[] {
  const result: number[] = [];
  for (const x of arr) {
    // Smell: .includes() scans \`result\` every time -> O(n) inside an O(n) loop = O(n^2)
    if (!result.includes(x)) result.push(x);
  }
  return result;
}

function dedupeFast(arr: number[]): number[] {
  // TODO: same behavior as dedupe, but O(n) using a Set
  return [];
}

const sample = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];
console.log("slow:", dedupe(sample));
console.log("fast:", dedupeFast(sample));
`,
        python: `def dedupe(arr):
    result = []
    for x in arr:
        # Smell: 'x not in result' scans the list every time
        # -> O(n) inside an O(n) loop = O(n^2)
        if x not in result:
            result.append(x)
    return result


def dedupe_fast(arr):
    # TODO: same behavior as dedupe, but O(n) using a set
    return []


sample = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3]
print("slow:", dedupe(sample))
print("fast:", dedupe_fast(sample))
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-reading-complexity-q1",
      prompt: {
        typescript: "You're reviewing code with a `for` loop over an array of n items, and inside it there's a call to `arr.includes(x)`. What's the actual time complexity, and why?",
        python: "You're reviewing code with a `for` loop over a list of n items, and inside it there's an `x in arr` check against that list. What's the actual time complexity, and why?",
      },
      options: {
        typescript: [
          "O(n²) — `.includes()` is a hidden O(n) scan running once per loop iteration",
          "O(n) — there's only one visible `for` loop, so it's linear",
          "O(log n) — `.includes()` uses binary search internally",
          "O(1) — `.includes()` is a constant-time lookup like a Set",
        ],
        python: [
          "O(n²) — `in` on a list is a hidden O(n) scan running once per loop iteration",
          "O(n) — there's only one visible `for` loop, so it's linear",
          "O(log n) — `in` uses binary search internally",
          "O(1) — `in` is a constant-time lookup regardless of the container",
        ],
      },
      answer: 0,
      explanation: {
        typescript: "`.includes()` walks the array looking for a match, which is O(n) on its own. Calling it inside a loop that also runs n times multiplies the costs: O(n) outer iterations times O(n) per `.includes()` call is O(n²), even though only one `for` keyword appears in the code.",
        python: "`in` against a *list* walks it looking for a match, which is O(n) on its own. Running it inside a loop that also runs n times multiplies the costs: O(n) outer iterations times O(n) per check is O(n²), even though only one `for` keyword appears in the code. The same `in` against a set would be O(1) — the operator's cost depends on the container.",
      },
    },
    {
      id: "dsa-reading-complexity-q2",
      prompt: "You have two separate, back-to-back `for` loops over the same n-item collection (not nested — one runs, then the other runs). What's the combined complexity?",
      options: [
        "O(n²) — two loops over the same collection always multiply",
        "O(n) — sequential loops add, and O(n) + O(n) simplifies to O(n)",
        "O(2n), which is a distinct class from O(n) and must be kept separate",
        "It depends on which loop runs first",
      ],
      answer: 1,
      explanation: "Loops that run one after another add their costs rather than multiply: O(n) + O(n) = O(2n), and Big-O drops the constant factor, leaving O(n). Multiplication only happens when one loop is nested inside another.",
    },
    {
      id: "dsa-reading-complexity-q3",
      prompt: {
        typescript: "\"Amortized O(1)\" is used to describe `array.push()`. What does \"amortized\" mean here?",
        python: "\"Amortized O(1)\" is used to describe `list.append()`. What does \"amortized\" mean here?",
      },
      options: {
        typescript: [
          "The operation is always exactly O(1) with zero exceptions",
          "The cost depends on which browser or runtime is executing the code",
          "Most calls are O(1), but occasional O(n) resizing costs are averaged over many calls, washing out to O(1) per call",
          "It means the same as \"worst case\" — every call is guaranteed O(1) even under adversarial input",
        ],
        python: [
          "The operation is always exactly O(1) with zero exceptions",
          "The cost depends on which interpreter is executing the code",
          "Most calls are O(1), but occasional O(n) resizing costs are averaged over many calls, washing out to O(1) per call",
          "It means the same as \"worst case\" — every call is guaranteed O(1) even under adversarial input",
        ],
      },
      answer: 2,
      explanation: "Under the hood, a growable list occasionally needs to allocate a larger backing store and copy existing elements over, which is O(n) for that one call — but this happens rarely enough (capacity grows geometrically) that spread across many appends, the average cost per call is O(1).",
    },
    ],
  },
];
