export const meta = {
  name: 'author-python-lessons',
  description: 'Author + adversarially review the 8-module Python learning curriculum (25 lessons).',
  phases: [
    { title: 'Author', detail: 'one agent per module writes lessons + exercises, verifies starters run' },
    { title: 'Review', detail: 'adversarial review per module: accuracy, framing, scaffold-not-solution, re-verify' },
  ],
}

// Full curriculum. Lesson/exercise ids + titles are PRE-ASSIGNED here so they're
// deterministic and globally unique; agents fill in `content` (lesson markdown),
// `instructions` (exercise markdown) and `starterCode` (runnable Python scaffold).
const CURRICULUM = [
  {
    moduleId: 'basics', file: 'basics.ts', konst: 'basicsLessons',
    lessons: [
      { id: 'hello-and-values', title: 'Hello, Values, and f-strings',
        blurb: 'print, dynamic typing, core scalar types, and string formatting.',
        focus: 'print(); variables with no declaration keyword (no let/const/var) and no semicolons; snake_case; dynamic but strong typing; core scalars int/float/str/bool and None; f-strings and how they compare to JS template literals and Java String.format; a preview of truthiness.',
        exercises: [
          { id: 'hello-fstring', title: 'Format a greeting', task: 'Given name and age variables, build and print a one-line greeting using an f-string.' },
          { id: 'numeric-types', title: 'Ints, floats, and division', task: 'Show the difference between / (true division), // (floor division) and % on a pair of integers; print each result.' },
          { id: 'type-conversion', title: 'Converting between types', task: 'Parse a numeric string to int and to float, convert a number back to str, and print the results and their types.' },
        ] },
      { id: 'control-flow', title: 'Control Flow and Truthiness',
        blurb: 'if/elif/else, loops, and what counts as true.',
        focus: 'Indentation instead of braces; if/elif/else with no parentheses; and/or/not instead of &&/||/!; truthiness of "", [], {}, 0, None; for ... in with range(); while; break/continue; the ternary a if cond else b. Contrast with C-style for loops in Java/Go.',
        exercises: [
          { id: 'fizzbuzz', title: 'FizzBuzz', task: 'Print FizzBuzz for 1..n using a for loop, range(), and conditionals with the modulo operator.' },
          { id: 'sum-evens', title: 'Sum the even numbers', task: 'Loop from 1 to n and accumulate the sum of even numbers using %, then print it.' },
          { id: 'truthiness-check', title: 'Truthy or falsy', task: 'Write is_empty(x) that relies on Python truthiness (not len(x) == 0) and test it on a few values.' },
        ] },
      { id: 'functions', title: 'Functions, Defaults, and *args',
        blurb: 'def, keyword args, packing, and the mutable-default trap.',
        focus: 'def and return; default arguments; keyword arguments; *args and **kwargs packing; returning multiple values as a tuple; docstrings; the classic mutable-default-argument gotcha. Contrast with JS default/rest params and Java overloading.',
        exercises: [
          { id: 'greet-defaults', title: 'Defaults and keyword args', task: 'Write greet(name, greeting="Hello") and call it both positionally and with keyword arguments.' },
          { id: 'args-sum', title: 'Variadic sum', task: 'Write total(*nums) that returns the sum of any number of arguments.' },
          { id: 'mutable-default', title: 'Fix the mutable default', task: 'Given a buggy append_to(item, target=[]), reproduce the shared-list bug across calls, then fix it with a None sentinel.' },
        ] },
      { id: 'modules-and-main', title: 'Imports, __main__, and Identity',
        blurb: 'import styles, the main guard, and is vs ==.',
        focus: 'import x, from x import y, and aliasing with as; the standard library; if __name__ == "__main__"; is (identity) vs == (equality) and why None checks use is; a brief note on LEGB scope. Contrast with import/require and Go package main.',
        exercises: [
          { id: 'use-math', title: 'Use the math module', task: 'Import math and use it (e.g. sqrt and factorial), printing the results.' },
          { id: 'is-vs-equals', title: 'is vs ==', task: 'Demonstrate None checks with is and value equality with ==; print a few comparisons that show the difference.' },
          { id: 'main-guard', title: 'The main guard', task: 'Define a function and call it from inside an if __name__ == "__main__" block.' },
        ] },
    ],
  },
  {
    moduleId: 'data-structures', file: 'data-structures.ts', konst: 'dataStructuresLessons',
    lessons: [
      { id: 'lists-and-tuples', title: 'Lists, Tuples, and Slicing',
        blurb: 'ordered collections, slicing, and unpacking.',
        focus: 'List literals; indexing including negative indices; slicing [a:b:c]; append/extend/insert/pop; sort vs sorted with a key; tuples and immutability; tuple unpacking; list(). Contrast with JS arrays.',
        exercises: [
          { id: 'slice-list', title: 'Slice and dice', task: 'Given a list, use slicing to produce: the reversed list, the first three items, and every other item.' },
          { id: 'sort-by-key', title: 'Sort by key', task: 'Sort a list of words by length using sorted() with a key function.' },
          { id: 'tuple-swap', title: 'Unpack and swap', task: 'Use tuple unpacking to swap two variables without a temporary.' },
        ] },
      { id: 'dicts', title: 'Dictionaries',
        blurb: 'key-value maps, get/setdefault, and iteration.',
        focus: 'Dict literals; access vs .get(key, default); setdefault; iterating .items()/.keys()/.values(); the in operator; merging with | and update(); nested dicts. Contrast with JS objects/Map and Java HashMap.',
        exercises: [
          { id: 'word-count', title: 'Word frequency', task: 'Count the frequency of words in a list using .get() or setdefault().' },
          { id: 'iterate-items', title: 'Iterate items', task: 'Iterate a dict with .items() and print each key/value pair formatted.' },
          { id: 'merge-dicts', title: 'Merge two dicts', task: 'Merge two dicts both with the | operator and with .update().' },
        ] },
      { id: 'sets', title: 'Sets',
        blurb: 'uniqueness and fast membership.',
        focus: 'Set literals; deduplication; O(1) membership; union | , intersection & , difference - ; a note on frozenset. Contrast with JS Set.',
        exercises: [
          { id: 'dedup-list', title: 'Deduplicate', task: 'Remove duplicates from a list using a set, and print the unique values.' },
          { id: 'common-elements', title: 'Common elements', task: 'Find the elements common to two lists using set intersection.' },
          { id: 'set-algebra', title: 'Set algebra', task: 'Given two sets, compute and print their union, intersection, and difference.' },
        ] },
      { id: 'comprehensions', title: 'Comprehensions',
        blurb: 'list, dict, and set comprehensions.',
        focus: 'List, dict, and set comprehensions; filtering conditions inside them; nesting; a first look at generator expressions. Contrast with chained map/filter in JS.',
        exercises: [
          { id: 'filter-comp', title: 'Filtered list comprehension', task: 'Use a list comprehension to build the squares of only the even numbers in a range.' },
          { id: 'dict-comp', title: 'Dict comprehension', task: 'Build a dict mapping each word to its length using a dict comprehension.' },
          { id: 'flatten-comp', title: 'Flatten with a nested comprehension', task: 'Flatten a list of lists into a single list using a nested comprehension.' },
        ] },
    ],
  },
  {
    moduleId: 'idioms', file: 'idioms.ts', konst: 'idiomsLessons',
    lessons: [
      { id: 'enumerate-zip-unpacking', title: 'enumerate, zip, and Unpacking',
        blurb: 'iterate like a Pythonista.',
        focus: 'enumerate() instead of range(len(...)); zip() to iterate in parallel; starred unpacking (first, *rest); multiple assignment; the _ throwaway convention. Contrast with manual index loops.',
        exercises: [
          { id: 'enumerate-index', title: 'Index with enumerate', task: 'Print each item with its index using enumerate() rather than range(len()).' },
          { id: 'zip-to-dict', title: 'Zip into a dict', task: 'Given a list of keys and a list of values, build a dict using zip().' },
          { id: 'starred-unpack', title: 'Starred unpacking', task: 'Use first, *rest = items to split a list into its head and tail.' },
        ] },
      { id: 'generators', title: 'Generators and yield',
        blurb: 'lazy iteration without building lists.',
        focus: 'yield and generator functions; laziness; next(); generator expressions; when and why to use them (memory, infinite streams). Contrast with JS generators and eagerly building arrays.',
        exercises: [
          { id: 'countdown-gen', title: 'Write a generator', task: 'Write countdown(n) that yields n down to 1, and consume it in a for loop.' },
          { id: 'take-infinite', title: 'Take from an infinite generator', task: 'Write an infinite counter generator and take only the first k values from it.' },
          { id: 'genexpr-sum', title: 'Generator expression', task: 'Sum the squares over a large range using a generator expression, without building a list.' },
        ] },
      { id: 'eafp', title: 'EAFP: Ask Forgiveness, Not Permission',
        blurb: 'try/except as idiomatic control flow.',
        focus: 'EAFP vs LBYL; using try/except as ordinary control flow; .get() vs a try; catching specific exception types rather than bare except. Contrast with the defensive pre-checking common in other languages.',
        exercises: [
          { id: 'lbyl-to-eafp', title: 'Rewrite LBYL as EAFP', task: 'Convert a "check key in dict then access" snippet into a try/except KeyError version.' },
          { id: 'safe-int', title: 'Safe parse', task: 'Write a function that tries int(s) and returns a default on ValueError.' },
          { id: 'catch-specific', title: 'Catch the right exception', task: 'Catch a specific exception type (not a bare except) and handle it.' },
        ] },
      { id: 'context-managers', title: 'Context Managers and with',
        blurb: 'deterministic cleanup with with-blocks.',
        focus: 'The with statement; deterministic cleanup; contextlib.contextmanager; a mention of __enter__/__exit__. Use io.StringIO since there is no real filesystem in the browser. Contrast with try/finally, Java try-with-resources, and Go defer.',
        exercises: [
          { id: 'with-stringio', title: 'Use a with-block', task: 'Write to an io.StringIO inside a with-block, then read the accumulated value back out.' },
          { id: 'custom-cm', title: 'Write a context manager', task: 'Use @contextmanager to write a manager that prints "open" before and "close" after the wrapped block.' },
          { id: 'nested-with', title: 'Multiple context managers', task: 'Open two io.StringIO managers in a single with statement and write to both.' },
        ] },
    ],
  },
  {
    moduleId: 'oop-typing', file: 'oop-typing.ts', konst: 'oopTypingLessons',
    lessons: [
      { id: 'classes', title: 'Classes, self, and Properties',
        blurb: 'defining objects the Python way.',
        focus: 'class; __init__; the explicit self; instance vs class attributes; methods; @property; the _ / __ convention for "private" and name mangling (there is no real private). Contrast with Java/TS classes, constructors, and this.',
        exercises: [
          { id: 'define-class', title: 'Define a class', task: 'Define a small class with __init__ and one method (e.g. a Point with a distance-from-origin method), and use it.' },
          { id: 'property-getter', title: 'A computed property', task: 'Add an @property that computes a value (e.g. area or full_name) from stored attributes.' },
          { id: 'class-attr', title: 'Class vs instance attribute', task: 'Use a class-level counter that increments each time an instance is created.' },
        ] },
      { id: 'dunders-duck-typing', title: 'Dunder Methods and Duck Typing',
        blurb: 'make your objects feel built-in.',
        focus: '__repr__ vs __str__; __eq__; __len__; __getitem__; __iter__; operator overloading; the duck-typing philosophy. Contrast with toString/equals and nominal interfaces.',
        exercises: [
          { id: 'repr-eq', title: '__repr__ and __eq__', task: 'Write a class with a readable __repr__ and value-based __eq__.' },
          { id: 'len-getitem', title: '__len__ and __getitem__', task: 'Write a small container class that supports len() and indexing via __getitem__.' },
          { id: 'make-iterable', title: 'Make it iterable', task: 'Implement __iter__ so instances of your class can be used in a for loop.' },
        ] },
      { id: 'dataclasses-typing', title: 'Dataclasses and Type Hints',
        blurb: 'type hints, @dataclass, and Protocols.',
        focus: 'Type hint syntax; the typing toolbox (list[...], dict[...], Optional, the | union); @dataclass and the boilerplate it removes; Protocol for structural typing (like TS interfaces); a mention of mypy. Contrast with TS type annotations.',
        exercises: [
          { id: 'annotate-fn', title: 'Annotate a function', task: 'Add type hints to a function signature (parameters and return type).' },
          { id: 'a-dataclass', title: 'Write a dataclass', task: 'Define a @dataclass with a couple of typed fields and one method, and use it.' },
          { id: 'a-protocol', title: 'Structural typing with Protocol', task: 'Define a Protocol and a function that accepts anything matching it, then pass an unrelated class that satisfies it.' },
        ] },
    ],
  },
  {
    moduleId: 'stdlib', file: 'stdlib.ts', konst: 'stdlibLessons',
    lessons: [
      { id: 'collections', title: 'collections: Counter, defaultdict, deque',
        blurb: 'the containers you reach for daily.',
        focus: 'Counter and most_common(); defaultdict; deque; namedtuple. Contrast with hand-rolling a dict-of-lists or a frequency dict.',
        exercises: [
          { id: 'counter-top', title: 'Most common with Counter', task: 'Use Counter on a list and print the k most common items with most_common().' },
          { id: 'defaultdict-group', title: 'Group with defaultdict', task: 'Group words by their first letter using defaultdict(list).' },
          { id: 'deque-queue', title: 'A queue with deque', task: 'Use a deque as a FIFO queue with append() and popleft().' },
        ] },
      { id: 'itertools-functools', title: 'itertools and functools',
        blurb: 'composable iteration and function tools.',
        focus: 'itertools: chain, combinations, groupby, count, islice. functools: reduce, lru_cache, partial. Emphasize composition and laziness.',
        exercises: [
          { id: 'combinations-ex', title: 'Combinations', task: 'Use itertools.combinations to print all pairs from a list.' },
          { id: 'lru-fib', title: 'Memoize with lru_cache', task: 'Write a recursive fib and speed it up with @lru_cache.' },
          { id: 'groupby-ex', title: 'Group consecutive with groupby', task: 'Use itertools.groupby on sorted data to group items by a key.' },
        ] },
      { id: 'pathlib-json-re-datetime', title: 'pathlib, json, re, datetime',
        blurb: 'paths, serialization, regex, and time.',
        focus: 'PurePosixPath for path manipulation (no real filesystem in the browser); json.dumps/loads; re.search/findall/sub; datetime basics with date and timedelta.',
        exercises: [
          { id: 'json-roundtrip', title: 'JSON round-trip', task: 'json.dumps a dict, json.loads it back, and access a field from the result.' },
          { id: 'regex-findall', title: 'Find all matches', task: 'Use re.findall to extract all numbers (or words) from a string.' },
          { id: 'purepath-parts', title: 'Manipulate a path', task: 'Use PurePosixPath to join segments and read .name and .suffix.' },
        ] },
    ],
  },
  {
    moduleId: 'errors-testing', file: 'errors-testing.ts', konst: 'errorsTestingLessons',
    lessons: [
      { id: 'exceptions', title: 'Exceptions Done Right',
        blurb: 'the hierarchy, raising, and chaining.',
        focus: 'The exception hierarchy; try/except/else/finally; raise; defining custom exception classes; raise ... from for chaining. Contrast with checked exceptions in Java and error returns in Go.',
        exercises: [
          { id: 'custom-exception', title: 'A custom exception', task: 'Define a subclass of Exception, then raise and catch it.' },
          { id: 'try-else-finally', title: 'else and finally', task: 'Write a try/except/else/finally that demonstrates when each block runs.' },
          { id: 'raise-from', title: 'Chain exceptions', task: 'Catch one exception and raise a different one using raise ... from to preserve the cause.' },
        ] },
      { id: 'pytest', title: 'Testing with pytest',
        blurb: 'plain asserts, conventions, and parametrize.',
        focus: 'pytest conventions: test_ functions and the plain assert statement (no assertEquals); a mention of fixtures and parametrize; the Arrange-Act-Assert shape. NOTE: pytest is not available in the browser, so exercises use plain assert statements that simply run.',
        exercises: [
          { id: 'write-asserts', title: 'Write passing asserts', task: 'Given a small function, write a test_ function with plain assert statements that all pass.' },
          { id: 'test-edge-cases', title: 'Test the edges', task: 'Write asserts that check a function on empty, zero, and negative inputs.' },
          { id: 'param-asserts', title: 'Parametrize-style checks', task: 'Loop over a list of (input, expected) cases and assert each one (the spirit of @pytest.mark.parametrize).' },
        ] },
    ],
  },
  {
    moduleId: 'tooling', file: 'tooling.ts', konst: 'toolingLessons',
    lessons: [
      { id: 'venvs-and-packages', title: 'Virtual Environments and Packages',
        blurb: 'venv, pip, and pyproject vs npm / go mod / maven.',
        focus: 'python -m venv and why isolation matters; activating; pip install / pip freeze; requirements.txt; pyproject.toml; the modern uv and poetry. Contrast directly with npm/package.json/node_modules, go mod, and maven/gradle. This is a CONVERSATIONAL lesson with NO exercises.',
        exercises: [] },
      { id: 'project-layout-tooling', title: 'Project Layout and Tooling',
        blurb: 'src layout, packages, and ruff/black/mypy.',
        focus: 'The src/ layout; __init__.py and packages; how imports resolve; the formatter/linter/type-checker stack: ruff (lint), black (format), mypy (types); pre-commit. Contrast with eslint/prettier/tsc and gofmt. This is a CONVERSATIONAL lesson with NO exercises.',
        exercises: [] },
    ],
  },
  {
    moduleId: 'libraries', file: 'libraries.ts', konst: 'librariesLessons',
    lessons: [
      { id: 'requests-http', title: 'HTTP with requests',
        blurb: 'calling APIs (taught; runs on mock data).',
        focus: 'The requests API: get/post, .json(), headers, status_code, raise_for_status. IMPORTANT: Pyodide in the browser has no network, so the lesson TEACHES requests but the EXERCISES operate on provided JSON strings / mock data using only the standard library (json, urllib.parse). State this limitation in the lesson card. Contrast with fetch/axios.',
        exercises: [
          { id: 'parse-response', title: 'Parse a JSON response body', task: 'Given a JSON string that simulates a response body, use json.loads to parse it and access nested fields. (stdlib only, no network.)' },
          { id: 'build-params', title: 'Build query params', task: 'Build a params dict and turn it into a query string with urllib.parse.urlencode. (stdlib only.)' },
          { id: 'status-branch', title: 'Handle status codes', task: 'Given a mock status code variable, branch on 200 / 404 / 5xx and print an appropriate message. (stdlib only.)' },
        ] },
      { id: 'numpy', title: 'numpy Arrays',
        blurb: 'vectorized numeric computing.',
        focus: 'The ndarray; vectorized elementwise operations; broadcasting; slicing; axis aggregations (sum/mean). Contrast with Python lists and manual loops. These exercises import numpy and RUN (numpy is available in the browser via Pyodide).',
        exercises: [
          { id: 'array-vectorize', title: 'Create and vectorize', task: 'Create a numpy array and apply a vectorized elementwise operation, then print the result.' },
          { id: 'array-2d', title: '2D slicing and aggregation', task: 'Build a 2D array, take a row and a column slice, and compute a sum or mean along an axis.' },
          { id: 'boolean-mask', title: 'Boolean masking', task: 'Filter a numpy array using a boolean mask (e.g. keep values above the mean).' },
        ] },
      { id: 'pandas', title: 'pandas DataFrames',
        blurb: 'tabular data wrangling.',
        focus: 'Series and DataFrame; building a DataFrame from a dict; selection with loc/iloc; boolean filtering; groupby and agg. Contrast with raw dicts/lists of rows. These exercises import pandas and RUN (pandas is available in the browser via Pyodide).',
        exercises: [
          { id: 'build-df', title: 'Build a DataFrame', task: 'Create a DataFrame from a dict of columns and select a single column.' },
          { id: 'filter-rows', title: 'Filter rows', task: 'Filter the rows of a DataFrame with a boolean condition on a column.' },
          { id: 'groupby-agg', title: 'Group and aggregate', task: 'Group a DataFrame by a column and aggregate another column with mean or sum.' },
        ] },
    ],
  },
]

const OUT_DIR = '/tmp/py-lessons'

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['moduleId', 'jsonPath', 'lessonCount', 'exerciseCount', 'allStartersRun', 'unrunnableStarters', 'issues', 'status'],
  properties: {
    moduleId: { type: 'string' },
    jsonPath: { type: 'string' },
    lessonCount: { type: 'number' },
    exerciseCount: { type: 'number' },
    allStartersRun: { type: 'boolean' },
    unrunnableStarters: { type: 'array', items: { type: 'string' }, description: 'exercise ids whose starter could not be executed locally (e.g. numpy/pandas not installed)' },
    issues: { type: 'array', items: { type: 'string' }, description: 'problems found/fixed; empty if clean' },
    status: { type: 'string', enum: ['ok', 'problems'] },
  },
}

const RULES = `
AUDIENCE: experienced programmers (they know TypeScript, JavaScript, Java, and/or Go) who are NEW TO PYTHON.
- NEVER explain what a variable, loop, function, or class fundamentally is. They know.
- Lead with the Python-specific syntax and idioms, and explicitly contrast with TS/JS/Java/Go where it helps ("unlike JS's let, Python has no declaration keyword", "this is Python's version of a TS spread", etc.).
- Be precise and a little opinionated about what is idiomatic ("Pythonic") vs what merely works.

CONTENT FORMAT:
- "content" is GitHub-flavored Markdown shown on screen. Use fenced \\\`\\\`\\\`python code blocks for examples. Aim for ~150-450 words plus a few short, correct, runnable examples per lesson. Teach the concept fully — this is the on-screen lesson card the tutor refers to.
- "instructions" is short Markdown telling the learner what to implement, ideally with a line about expected output.

STARTER CODE (the most important rule):
- "starterCode" is a RUNNABLE Python scaffold the learner edits: a function signature or partial script with a clear "# TODO" plus an example call that prints something, so clicking Run produces output WITHOUT an error.
- It MUST NOT contain the solution. Leave the core logic as a TODO (use pass or a placeholder return). It is a starting point, not an answer key.
- It MUST run cleanly under python3 (exit code 0, no traceback). Keep imports to the standard library, EXCEPT the numpy and pandas lessons which import those packages.
- Python only. 2-space or 4-space indentation consistently (Python standard is 4; match that).
`.trim()

phase('Author')

const results = await pipeline(
  CURRICULUM,
  // Stage 1 — author the module.
  (mod) => agent(
    `You are an expert Python educator and engineer authoring one module of a guided Python course.

${RULES}

Write the module "${mod.moduleId}". Here is the EXACT plan — keep every id and title verbatim, fill in the prose/code:
${JSON.stringify(mod.lessons, null, 2)}

For each lesson, write "content" (lesson card markdown) from its "focus". For each exercise, write "instructions" (markdown) and "starterCode" (runnable Python scaffold) from its "task". The "module" field of every lesson MUST be "${mod.moduleId}".

OUTPUT: write a JSON file to ${OUT_DIR}/${mod.moduleId}.json with this exact shape (no trailing commentary):
{
  "moduleId": "${mod.moduleId}",
  "lessons": [
    { "id": "...", "module": "${mod.moduleId}", "title": "...", "blurb": "...", "content": "<markdown>", "exercises": [ { "id": "...", "title": "...", "instructions": "<markdown>", "starterCode": "<python>" } ] }
  ]
}
Use the pre-assigned ids/titles/blurbs from the plan verbatim. Write valid JSON (the Write tool handles escaping — just produce correct JSON).

VERIFY before returning: for EVERY exercise, extract its starterCode to a temp file under ${OUT_DIR}/check/ (mkdir -p first; use a filename containing the exercise id) and run it with python3. It must exit 0 with no traceback. If a starter imports numpy or pandas and that import fails because the package is not installed locally, instead run python3 -c "compile(open(path).read(), path, 'exec')" to confirm it at least parses, and record that exercise id in unrunnableStarters. Fix any starter that throws for any other reason, and re-run until clean. Re-read your JSON file at the end to confirm it parses.

Return the StructuredOutput summary. jsonPath is the file you wrote. Set status to "ok" only if every non-numpy/pandas starter ran clean and the JSON parses.`,
    { label: `author:${mod.moduleId}`, phase: 'Author', schema: SCHEMA }
  ),
  // Stage 2 — adversarial review + fix.
  (authored, mod) => agent(
    `You are a meticulous senior Python engineer and educator doing an ADVERSARIAL review of one authored course module. Assume there are problems and hunt for them.

The module "${mod.moduleId}" was authored to ${OUT_DIR}/${mod.moduleId}.json. Read that file.

Check EVERY lesson and exercise for:
1. TECHNICAL ACCURACY — is every statement and code example correct for modern Python 3? No wrong claims, no code that would error or mislead.
2. AUDIENCE/FRAMING — written for an EXPERIENCED programmer new to Python? It must NOT explain programming basics, and SHOULD lead with Python specifics and contrast with TS/JS/Java/Go. Flag any condescending or beginner-pitched prose.
3. SCAFFOLD-NOT-SOLUTION — does each starterCode leave the core logic as a TODO rather than giving away the answer? If a starter already contains the solution, gut it back to a scaffold (signature + TODO + example call that still runs clean).
4. INSTRUCTIONS↔STARTER MATCH — do the instructions describe what the starter sets up?
5. COMPLETENESS — content actually teaches the concept (not a stub); examples present and correct.

FIX every problem you find by rewriting ${OUT_DIR}/${mod.moduleId}.json in place (keep the pre-assigned ids/titles/blurbs verbatim; keep "module" = "${mod.moduleId}").

RE-VERIFY: re-run every exercise starterCode under python3 (same numpy/pandas caveat: if the package isn't installed, compile-check and list the id in unrunnableStarters). Confirm the JSON still parses.

The author reported: ${JSON.stringify(authored)}

Return the StructuredOutput summary for the FINAL state of the file. List in "issues" what you fixed (empty if nothing needed fixing). status "ok" only if the file parses and every runnable starter passes.`,
    { label: `review:${mod.moduleId}`, phase: 'Review', schema: SCHEMA }
  )
)

return results.filter(Boolean)
