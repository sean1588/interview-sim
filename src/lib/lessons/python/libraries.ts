import type { Lesson } from "../types";

export const librariesLessons: Lesson[] = [
  {
    id: "requests-http",
    module: "libraries",
    title: "HTTP with requests",
    blurb: "calling APIs (taught; runs on mock data).",
    content: `The \`requests\` library is the de facto standard for HTTP in Python — think \`axios\`, but synchronous and batteries-included. The stdlib \`urllib\` works but is clunky; almost everyone reaches for \`requests\`.

> **Sandbox note:** the in-browser Python (Pyodide) has **no network access**, so the exercises below cannot make real calls. This card *teaches* \`requests\`; the exercises operate on **provided JSON strings / mock data** using only the standard library (\`json\`, \`urllib.parse\`). The API you see here is exactly what you'd write against a real server.

## The basic call

\`\`\`python
import requests

resp = requests.get("https://api.example.com/users/1")
print(resp.status_code)   # 200  (an int, like fetch's response.status)
data = resp.json()        # parse the body as JSON -> dict/list
print(data["name"])
\`\`\`

Unlike \`fetch\`, where you \`await response.json()\` in a second step and the first \`await\` only resolves headers, \`requests\` is **synchronous**: \`requests.get(...)\` returns once the full response is in hand. \`.json()\` is a method that parses the body (it raises if the body isn't valid JSON).

## POST, headers, query params

\`\`\`python
resp = requests.post(
    "https://api.example.com/users",
    json={"name": "Ada"},                 # serialized to a JSON body + sets Content-Type
    headers={"Authorization": "Bearer t"},
    params={"verbose": "true"},           # appended as ?verbose=true
)
\`\`\`

Pass \`json=\` and \`requests\` serializes the dict and sets \`Content-Type: application/json\` for you. Pass \`params=\` (a dict) and it builds the query string — no manual string concatenation. This is the \`params\` you'll mimic with \`urllib.parse.urlencode\` in the exercises.

## Status checks

\`\`\`python
print(resp.status_code)     # 200, 404, 500, ...
print(resp.headers)         # a dict-like of response headers
resp.raise_for_status()     # raises HTTPError for 4xx/5xx, no-op for 2xx
\`\`\`

\`raise_for_status()\` is the idiomatic guard: call it right after a request and let 4xx/5xx become an exception instead of silently flowing downstream. Contrast with \`fetch\`, which **does not reject** on HTTP errors — you have to check \`response.ok\` yourself.

Key takeaway: \`.json()\` parses the body, \`.status_code\` is the int code, \`.raise_for_status()\` turns error codes into exceptions.
`,
    exercises: [
    {
      id: "parse-response",
      title: "Parse a JSON response body",
      instructions: `You can't hit the network here, so treat \`body\` (a JSON string) as a stand-in for \`resp.text\` — the raw body you'd get back from \`requests\`.

Parse it with \`json.loads\`, then dig into the nested structure and return the **first user's city** (\`data["users"][0]["address"]["city"]\`).

Expected output: \`Springfield\`.
`,
      starterCode: `import json

# Stand-in for resp.text: the raw response body. In real code you'd parse it with resp.json().
body = '''
{
  "users": [
    {"name": "Ada", "address": {"city": "Springfield", "zip": "01101"}},
    {"name": "Bo", "address": {"city": "Portland", "zip": "97035"}}
  ]
}
'''

def first_user_city(body):
    data = json.loads(body)
    # TODO: return the first user's nested address city
    pass

print(first_user_city(body))
`,
    },
    {
      id: "build-params",
      title: "Build query params",
      instructions: `When you call \`requests.get(url, params=...)\`, \`requests\` turns that dict into a query string for you. Here you'll do that part by hand with \`urllib.parse.urlencode\`.

Build a params dict from the arguments and return \`urlencode(params)\`.

Expected output: \`q=python&page=2&sort=recent\` (key order follows insertion order).
`,
      starterCode: `from urllib.parse import urlencode

def build_query(q, page, sort):
    params = {"q": q, "page": page, "sort": sort}
    # TODO: turn params into a URL-encoded query string with urlencode
    pass

print(build_query("python", 2, "recent"))
`,
    },
    {
      id: "status-branch",
      title: "Handle status codes",
      instructions: `In real code you'd read \`resp.status_code\` after a request. Here \`status\` is a plain int standing in for it.

Branch on the code and return a message:
- \`200\` -> \`"OK"\`
- \`404\` -> \`"Not Found"\`
- any code \`500\`-\`599\` -> \`"Server Error"\`
- anything else -> \`"Unexpected: <code>"\`

Expected output (for \`503\`): \`Server Error\`.
`,
      starterCode: `def describe_status(status):
    # TODO: branch on the status code and return the right message.
    #   200 -> "OK"
    #   404 -> "Not Found"
    #   500-599 -> "Server Error"
    #   otherwise -> "Unexpected: <code>"
    pass

print(describe_status(503))
`,
    },
    ],
  },
  {
    id: "numpy",
    module: "libraries",
    title: "numpy Arrays",
    blurb: "vectorized numeric computing.",
    content: `\`numpy\` is the foundation of Python's numeric stack. Its core type is the **\`ndarray\`**: a fixed-type, contiguous N-dimensional array. Operations are **vectorized** — they run in compiled C over the whole array, so you almost never write an explicit element loop.

> These exercises **import numpy and actually run** — it's available in the browser via Pyodide.

## Creating arrays and vectorized ops

\`\`\`python
import numpy as np

a = np.array([1, 2, 3, 4])
print(a * 2)        # [2 4 6 8]   elementwise, no loop
print(a + a)        # [2 4 6 8]
print(a ** 2)       # [ 1  4  9 16]
print(np.sqrt(a))   # [1.  1.41 1.73 2.  ]
\`\`\`

In plain Python, \`[1,2,3] * 2\` *repeats the list*. On an \`ndarray\`, \`*\` is **elementwise math**. That's the whole mental shift from JS arrays / Python lists: think in whole-array expressions, not loops.

## Broadcasting

When shapes don't match, numpy *broadcasts* the smaller operand across the larger one:

\`\`\`python
prices = np.array([10.0, 20.0, 30.0])
print(prices * 1.1)          # [11. 22. 33.]  scalar stretched over the array
grid = np.array([[1, 2, 3], [4, 5, 6]])
print(grid + np.array([10, 20, 30]))   # row vector added to every row
# [[11 22 33]
#  [14 25 36]]
\`\`\`

## Slicing and axis aggregations

Slicing looks like lists but extends to multiple dimensions with a comma, and **slices are views** (no copy):

\`\`\`python
m = np.array([[1, 2, 3],
              [4, 5, 6]])
print(m[0])        # [1 2 3]   first row
print(m[:, 1])     # [2 5]     second column (all rows)
print(m.sum())          # 21   everything
print(m.sum(axis=0))    # [5 7 9]   collapse rows -> per-column sums
print(m.sum(axis=1))    # [ 6 15]   collapse cols -> per-row sums
print(m.mean(axis=0))   # [2.5 3.5 4.5]
\`\`\`

\`axis=0\` reduces *down the rows* (one result per column); \`axis=1\` reduces *across the columns* (one result per row). Getting that axis intuition right is most of using numpy well.
`,
    exercises: [
    {
      id: "array-vectorize",
      title: "Create and vectorize",
      instructions: `Create a numpy array from \`[1, 2, 3, 4, 5]\` and return the result of a **vectorized** operation: each element doubled, then plus one (\`x * 2 + 1\`). No Python loop — write it as a whole-array expression.

Expected output: \`[ 3  5  7  9 11]\`.
`,
      starterCode: `import numpy as np

def transform():
    a = np.array([1, 2, 3, 4, 5])
    # TODO: return the vectorized result of a * 2 + 1 (no loop)
    pass

print(transform())
`,
    },
    {
      id: "array-2d",
      title: "2D slicing and aggregation",
      instructions: `Build the 2D array \`[[1, 2, 3], [4, 5, 6], [7, 8, 9]]\`.

Return a tuple of three things:
1. the **second row** (\`m[1]\`),
2. the **first column** (\`m[:, 0]\`),
3. the **per-column sums** (\`m.sum(axis=0)\`).

Expected output: \`(array([4, 5, 6]), array([1, 4, 7]), array([12, 15, 18]))\`.
`,
      starterCode: `import numpy as np

def inspect():
    m = np.array([[1, 2, 3],
                  [4, 5, 6],
                  [7, 8, 9]])
    # TODO: return (second row, first column, column sums via axis=0)
    pass

print(inspect())
`,
    },
    {
      id: "boolean-mask",
      title: "Boolean masking",
      instructions: `Create the array \`[4, 8, 15, 16, 23, 42]\`. Compute its mean, then use a **boolean mask** to return only the values strictly above the mean (\`a[a > a.mean()]\`).

Expected output: \`[23 42]\` (the mean is \`18.0\`).
`,
      starterCode: `import numpy as np

def above_mean():
    a = np.array([4, 8, 15, 16, 23, 42])
    # TODO: build a boolean mask a > a.mean() and use it to index a
    pass

print(above_mean())
`,
    },
    ],
  },
  {
    id: "pandas",
    module: "libraries",
    title: "pandas DataFrames",
    blurb: "tabular data wrangling.",
    content: `\`pandas\` is the tabular-data workhorse built on top of numpy. Two types matter:

- **\`Series\`** — a 1D labeled array (a column).
- **\`DataFrame\`** — a 2D table of columns, each a \`Series\`, sharing one index.

Think of a \`DataFrame\` as a typed, vectorized replacement for a list-of-dicts (rows) — but you operate on whole columns at once.

> These exercises **import pandas and actually run** — it's available in the browser via Pyodide.

## Building a DataFrame

The most common constructor takes a **dict of columns**:

\`\`\`python
import pandas as pd

df = pd.DataFrame({
    "name": ["Ada", "Bo", "Cy"],
    "dept": ["eng", "sales", "eng"],
    "salary": [120, 90, 110],
})
print(df["salary"])        # a Series (one column)
print(df["salary"].mean()) # 106.66...
\`\`\`

\`df["salary"]\` selects a column; \`df[["name", "salary"]]\` selects several (note the double brackets — a list of column names).

## Selection: loc vs iloc

\`\`\`python
print(df.loc[0])          # row by *label* (here the index 0) -> a Series
print(df.iloc[0])         # row by *position* (0th row)
print(df.loc[0, "name"])  # single cell by label -> "Ada"
print(df.iloc[0, 1])      # single cell by position -> "eng"
\`\`\`

\`loc\` is label-based, \`iloc\` is integer-position-based. With a default \`RangeIndex\` they look the same, but they diverge the moment you set a custom index.

## Boolean filtering

Just like numpy masks — build a boolean \`Series\` and index with it:

\`\`\`python
print(df[df["salary"] > 100])        # rows where salary > 100
print(df[df["dept"] == "eng"])       # rows in eng
\`\`\`

## groupby + agg

The pandas killer feature — split, apply, combine:

\`\`\`python
print(df.groupby("dept")["salary"].mean())
# dept
# eng      115.0
# sales     90.0
# Name: salary, dtype: float64

print(df.groupby("dept").agg(avg_pay=("salary", "mean"), headcount=("name", "count")))
\`\`\`

\`groupby("dept")\` partitions rows by department; selecting \`["salary"]\` then \`.mean()\` aggregates each group. \`.agg(...)\` lets you compute several named aggregations at once. This replaces the manual \`defaultdict\`-then-loop grouping you'd write by hand.
`,
    exercises: [
    {
      id: "build-df",
      title: "Build a DataFrame",
      instructions: `Create a \`DataFrame\` from this dict of columns:

\`\`\`python
{"name": ["Ada", "Bo", "Cy"], "score": [90, 75, 88]}
\`\`\`

Then return the \`"score"\` column (a \`Series\`).

Expected output (a Series):
\`\`\`
0    90
1    75
2    88
Name: score, dtype: int64
\`\`\`
`,
      starterCode: `import pandas as pd

def scores():
    df = pd.DataFrame({
        "name": ["Ada", "Bo", "Cy"],
        "score": [90, 75, 88],
    })
    # TODO: return the "score" column
    pass

print(scores())
`,
    },
    {
      id: "filter-rows",
      title: "Filter rows",
      instructions: `Given the \`df\` below, return only the rows where \`"score"\` is **greater than 80**, using a boolean mask (\`df[df["score"] > 80]\`).

Expected output: the rows for Ada (90) and Cy (88).
`,
      starterCode: `import pandas as pd

df = pd.DataFrame({
    "name": ["Ada", "Bo", "Cy"],
    "score": [90, 75, 88],
})

def high_scorers(df):
    # TODO: return rows where df["score"] > 80
    pass

print(high_scorers(df))
`,
    },
    {
      id: "groupby-agg",
      title: "Group and aggregate",
      instructions: `Group \`df\` by the \`"dept"\` column and compute the **mean** \`"salary"\` per department.

Use \`df.groupby("dept")["salary"].mean()\`.

Expected output (a Series indexed by dept):
\`\`\`
dept
eng      115.0
sales     90.0
Name: salary, dtype: float64
\`\`\`
`,
      starterCode: `import pandas as pd

df = pd.DataFrame({
    "name": ["Ada", "Bo", "Cy"],
    "dept": ["eng", "sales", "eng"],
    "salary": [120, 90, 110],
})

def avg_salary_by_dept(df):
    # TODO: group by "dept" and return the mean of "salary" per group
    pass

print(avg_salary_by_dept(df))
`,
    },
    ],
  },
];
