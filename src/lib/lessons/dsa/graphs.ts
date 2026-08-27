import type { Lesson } from "../types";

export const graphsLessons: Lesson[] = [
  {
    id: "dsa-graph-representation",
    module: "graphs",
    title: "Representing Graphs",
    blurb: "Vertices, edges, and why adjacency lists usually win.",
    graphics: [
      {
        id: "adjacency-list",
        title: "Graph ↔ adjacency list",
        caption:
          "Nodes and edges on the left; per-vertex neighbor lists on the right. Sparse graphs almost always prefer lists over a full matrix.",
        src: "/lesson-graphics/dsa/dsa-graph-representation.png",
      },
    ],
    content: {
      typescript: `Graphs are relationships without hierarchy: a set of **vertices** and a set of **edges** connecting them. Edges can be **directed** (\`follows\` on a social app: A→B doesn't imply B→A) or **undirected** (\`friendsWith\`), **weighted** (road lengths) or not. The tree you spent the last module on is just a special case — a connected graph with no cycles. Drop the "no cycles" guarantee and everything from here on has to earn its termination.

You've built graphs ad hoc plenty of times: an object mapping user ids to arrays of follower ids **is** an adjacency list. This lesson just names the structure and its trade-offs.

## The two representations

**Adjacency matrix** — an n×n grid where \`matrix[a][b]\` is truthy when edge a→b exists.
- Edge check: **O(1)**. That's its one superpower.
- Memory: **O(V²)** regardless of how many edges exist. 100k vertices → 10 billion cells. Dead on arrival for most real data.
- Iterating a vertex's neighbors costs O(V) even if it has 2 neighbors.

**Adjacency list** — \`Map<vertex, neighbor[]>\`.
- Memory: **O(V + E)** — you pay only for edges that exist.
- Iterating neighbors: proportional to how many there are (the vertex's *degree*).
- Edge check: O(degree), or O(1) if you store a \`Set\` instead of an array.

Real-world graphs are almost always **sparse** — E is nowhere near V². A road network with a million intersections has ~3 edges per vertex, not a million. So the adjacency list is the default; reach for a matrix only when the graph is small *and* dense, or when constant-time edge lookup is the hot operation.

## Building the map from an edge list

Problems hand you \`edges: [number, number][]\`. Two details bite people:

\`\`\`ts
const adj = new Map<number, number[]>();
for (let v = 0; v < vertexCount; v++) adj.set(v, []); // 1. isolated vertices too!
for (const [a, b] of edges) {
  adj.get(a)!.push(b);
  adj.get(b)!.push(a); // 2. undirected = BOTH directions
}
\`\`\`

Skip step 1 and every \`adj.get(v)\` needs an \`?? []\` guard downstream; skip step 2 and half your undirected graph is unreachable.

## Degrees

For directed graphs, a vertex's **in-degree** is how many edges point *at* it; **out-degree** is how many leave it. In-degree 0 means "nothing depends on this yet" — which is exactly the seed of topological sort, two lessons from now.`,
      python: `Graphs are relationships without hierarchy: a set of **vertices** and a set of **edges** connecting them. Edges can be **directed** (\`follows\` on a social app: A→B doesn't imply B→A) or **undirected** (\`friends_with\`), **weighted** (road lengths) or not. The tree you spent the last module on is just a special case — a connected graph with no cycles. Drop the "no cycles" guarantee and everything from here on has to earn its termination.

You've built graphs ad hoc plenty of times: a \`dict\` mapping user ids to lists of follower ids **is** an adjacency list. This lesson just names the structure and its trade-offs.

## The two representations

**Adjacency matrix** — an n×n grid where \`matrix[a][b]\` is truthy when edge a→b exists.
- Edge check: **O(1)**. That's its one superpower.
- Memory: **O(V²)** regardless of how many edges exist. 100k vertices → 10 billion cells. Dead on arrival for most real data.
- Iterating a vertex's neighbors costs O(V) even if it has 2 neighbors.

**Adjacency list** — a \`dict\` mapping each vertex to a list of its neighbors.
- Memory: **O(V + E)** — you pay only for edges that exist.
- Iterating neighbors: proportional to how many there are (the vertex's *degree*).
- Edge check: O(degree), or O(1) if you store a \`set\` instead of a list.

Real-world graphs are almost always **sparse** — E is nowhere near V². A road network with a million intersections has ~3 edges per vertex, not a million. So the adjacency list is the default; reach for a matrix only when the graph is small *and* dense, or when constant-time edge lookup is the hot operation.

## Building the dict from an edge list

Problems hand you the edges as a list of \`(a, b)\` tuples. Two details bite people:

\`\`\`python
adj = {v: [] for v in range(vertex_count)}  # 1. isolated vertices too!
for a, b in edges:
    adj[a].append(b)
    adj[b].append(a)  # 2. undirected = BOTH directions
\`\`\`

Skip step 1 and every \`adj[v]\` on an isolated vertex raises \`KeyError\`; skip step 2 and half your undirected graph is unreachable.

**On \`defaultdict(list)\`:** it's tempting, and it does make \`adj[7]\` return \`[]\` instead of raising. But it does so by *inserting* key 7 on read — so a later \`for v in adj\` loop sees vertices that only exist because you looked at them, and a missing-vertex bug becomes invisible instead of loud. The comprehension above is one line and keeps \`KeyError\` meaning something. Use \`defaultdict\` while *building* if you like; prefer an explicit vertex set when you'll iterate it.

## Degrees

For directed graphs, a vertex's **in-degree** is how many edges point *at* it; **out-degree** is how many leave it. In-degree 0 means "nothing depends on this yet" — which is exactly the seed of topological sort, two lessons from now.`,
    },
    exercises: [
    {
      id: "dsa-build-adjacency",
      title: "Edge list → adjacency map",
      instructions: {
        typescript: `Implement \`buildAdjacency(vertexCount, edges, directed)\` returning a \`Map<number, number[]>\`.

- **Every** vertex \`0..vertexCount-1\` must get an entry, even with no edges.
- When \`directed\` is false, insert **both** directions for each edge.

Expected output: the directed graph prints \`[ 1, 2 ]\` and \`[]\`; the undirected one prints \`[ 0, 2 ]\` and \`[]\` (the stub prints \`undefined\` until you fill it in).`,
        python: `Implement \`build_adjacency(vertex_count, edges, directed)\` returning a \`dict\` that maps each vertex to a list of its neighbors.

- **Every** vertex \`0..vertex_count-1\` must get an entry, even with no edges.
- When \`directed\` is False, insert **both** directions for each edge.

Expected output: the directed graph prints \`[1, 2]\` and \`[]\`; the undirected one prints \`[0, 2]\` and \`[]\` (the stub prints \`None\` until you fill it in).`,
      },
      starterCode: {
        typescript: `function buildAdjacency(
  vertexCount: number,
  edges: [number, number][],
  directed: boolean
): Map<number, number[]> {
  // TODO: create an entry for EVERY vertex 0..vertexCount-1 (even isolated ones),
  // then for each [a, b] push b onto a's list — and a onto b's list when undirected.
  return new Map();
}

// Directed: 0 -> 1, 0 -> 2, 2 -> 3
const directedGraph = buildAdjacency(4, [[0, 1], [0, 2], [2, 3]], true);
console.log("directed, neighbors of 0:", directedGraph.get(0)); // expected [ 1, 2 ]
console.log("directed, neighbors of 3:", directedGraph.get(3)); // expected []

// Undirected: 0 - 1, 1 - 2 (vertex 3 is isolated)
const undirectedGraph = buildAdjacency(4, [[0, 1], [1, 2]], false);
console.log("undirected, neighbors of 1:", undirectedGraph.get(1)); // expected [ 0, 2 ]
console.log("undirected, neighbors of 3:", undirectedGraph.get(3)); // expected []`,
        python: `def build_adjacency(
    vertex_count,
    edges,
    directed,
):
    # TODO: create an entry for EVERY vertex 0..vertex_count-1 (even isolated
    # ones), then for each (a, b) append b to a's list — and a to b's list
    # when undirected.
    return {}


# Directed: 0 -> 1, 0 -> 2, 2 -> 3
directed_graph = build_adjacency(4, [(0, 1), (0, 2), (2, 3)], True)
print("directed, neighbors of 0:", directed_graph.get(0))  # expected [1, 2]
print("directed, neighbors of 3:", directed_graph.get(3))  # expected []

# Undirected: 0 - 1, 1 - 2 (vertex 3 is isolated)
undirected_graph = build_adjacency(4, [(0, 1), (1, 2)], False)
print("undirected, neighbors of 1:", undirected_graph.get(1))  # expected [0, 2]
print("undirected, neighbors of 3:", undirected_graph.get(3))  # expected []
`,
      },
    },
    {
      id: "dsa-vertex-degrees",
      title: "In-degrees",
      instructions: {
        typescript: `Implement \`inDegrees(vertexCount, edges)\` for a **directed** graph: return an array where index \`v\` holds the number of edges pointing **into** \`v\`. Single pass over the edges, O(V + E).

Keep this one in your pocket — this exact array seeds Kahn's topological sort, two lessons ahead.

Expected output: \`[ 0, 1, 1, 2 ]\` for the DAG and \`[ 0, 1, 1 ]\` for the chain.`,
        python: `Implement \`in_degrees(vertex_count, edges)\` for a **directed** graph: return a list where index \`v\` holds the number of edges pointing **into** \`v\`. Single pass over the edges, O(V + E).

Keep this one in your pocket — this exact list seeds Kahn's topological sort, two lessons ahead.

Expected output: \`[0, 1, 1, 2]\` for the DAG and \`[0, 1, 1]\` for the chain.`,
      },
      starterCode: {
        typescript: `function inDegrees(vertexCount: number, edges: [number, number][]): number[] {
  // TODO: start every vertex at 0, then for each edge [from, to]
  // increment the count for \`to\`. One pass, O(V + E).
  return [];
}

// DAG: 0 -> 1, 0 -> 2, 1 -> 3, 2 -> 3
const dag: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3]];
console.log(inDegrees(4, dag)); // expected [ 0, 1, 1, 2 ]

// Chain: 0 -> 1 -> 2
console.log(inDegrees(3, [[0, 1], [1, 2]])); // expected [ 0, 1, 1 ]`,
        python: `def in_degrees(vertex_count, edges):
    # TODO: start every vertex at 0, then for each edge (frm, to)
    # increment the count for \`to\`. One pass, O(V + E).
    return []


# DAG: 0 -> 1, 0 -> 2, 1 -> 3, 2 -> 3
dag = [(0, 1), (0, 2), (1, 3), (2, 3)]
print(in_degrees(4, dag))  # expected [0, 1, 1, 2]

# Chain: 0 -> 1 -> 2
print(in_degrees(3, [(0, 1), (1, 2)]))  # expected [0, 1, 1]
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-graph-representation-q1",
      prompt: "A social network has 10 million users, each following ~200 others on average. Which representation, and why?",
      options: [
        "Adjacency matrix — O(1) 'does A follow B' checks matter most at this scale",
        "Adjacency matrix — 10 million users is small enough that V² memory is acceptable",
        "Either works — they have the same asymptotic memory footprint for this graph",
        "Adjacency list — memory is O(V + E) ≈ 2 billion entries, versus 100 trillion cells for a matrix",
      ],
      answer: 3,
      explanation: "This graph is extremely sparse (200 edges per vertex out of 10 million possible), so the list's O(V + E) memory wins by orders of magnitude — a matrix would need 10⁷ × 10⁷ = 10¹⁴ cells before storing a single follow.",
    },
    {
      id: "dsa-graph-representation-q2",
      prompt: "You build an adjacency map only from the edge list — no pre-seeding of vertices — for an undirected graph where vertex 7 has no edges. What goes wrong later?",
      options: {
        typescript: [
        "`adj.get(7)` returns `undefined`, so any traversal that iterates its neighbors crashes or silently skips vertex 7",
        "Nothing — a vertex with no edges carries no information, so omitting it is harmless",
        "The map's memory usage doubles because JavaScript backfills missing integer keys",
        "Edge insertion fails, because `push` requires the destination vertex to exist first",
        ],
        python: [
        "`adj[7]` raises `KeyError`, so any traversal that iterates its neighbors crashes — or silently skips vertex 7 if you guarded with `.get(7, [])`",
        "Nothing — a vertex with no edges carries no information, so omitting it is harmless",
        "The dict's memory usage doubles because Python backfills missing integer keys",
        "Edge insertion fails, because `append` requires the destination vertex to exist first",
      ],
      },
      answer: 0,
      explanation: {
        typescript: "Isolated vertices are still vertices — component counts, degree arrays, and 'visit every vertex' loops all need an (empty) entry for 7, or every downstream `.get` needs a defensive `?? []`. Pre-seeding all n vertices removes the edge case at the source.",
        python: "Isolated vertices are still vertices — component counts, degree lists, and \'visit every vertex\' loops all need an (empty) entry for 7, or every downstream access needs a defensive `.get(v, [])`. Pre-seeding all n vertices with a comprehension removes the edge case at the source.",
      },
    },
    {
      id: "dsa-graph-representation-q3",
      prompt: "With an adjacency list storing neighbor *arrays*, what does checking “is there an edge a→b?” cost?",
      options: {
        typescript: [
        "O(1) — the Map lookup for `a` is constant time",
        "O(deg(a)) — you scan a's neighbor array; swap the array for a Set to make it O(1)",
        "O(V) — you may have to check every vertex in the graph",
        "O(E) — edge checks always cost the total number of edges",
        ],
        python: [
        "O(1) — the dict lookup for `a` is constant time",
        "O(deg(a)) — you scan a's neighbor list; swap the list for a `set` to make it O(1)",
        "O(V) — you may have to check every vertex in the graph",
        "O(E) — edge checks always cost the total number of edges",
      ],
      },
      answer: 1,
      explanation: {
        typescript: "The Map lookup finds a's list in O(1), but then you linearly scan that list for b — O(deg(a)). If edge-existence checks are hot, store neighbors in a Set; that's the adjacency list's answer to the matrix's O(1) lookup.",
        python: "The dict lookup finds a\'s list in O(1), but then `b in adj[a]` linearly scans that list — O(deg(a)). If edge-existence checks are hot, store neighbors in a `set`; that\'s the adjacency list\'s answer to the matrix\'s O(1) lookup, and the same `in`-cost-depends-on-the-container point from module 1.",
      },
    },
    ],
  },
  {
    id: "dsa-graph-traversal",
    module: "graphs",
    title: "Graph DFS & BFS",
    blurb: "The visited set, connected components, and shortest hops.",
    graphics: [
      {
        id: "visited-frontier",
        title: "Explore with a visited set",
        caption:
          "Mark nodes as you go so you never reprocess them. Visited plus a stack (DFS) or queue (BFS) unlocks components and shortest unweighted paths.",
        src: "/lesson-graphics/dsa/dsa-graph-traversal.png",
      },
    ],
    content: {
      typescript: `Tree DFS and BFS transfer to graphs almost verbatim — with one non-negotiable addition. Trees can't loop back on themselves; graphs can. Traverse a cycle without protection and you revisit the same vertices forever. **The fix is a visited set, checked before every enqueue or recursive call.** Omit it and your traversal is an infinite loop — not slow, not wrong, *hung*. This is the same "have I seen this before?" Set you've reached for in dedup work; here it's load-bearing.

\`\`\`ts
function dfs(startAt: number, adj: Map<number, number[]>, visited: Set<number>) {
  const stack = [startAt];
  visited.add(startAt);
  while (stack.length > 0) {
    const v = stack.pop()!;
    for (const nb of adj.get(v)!) {
      if (!visited.has(nb)) {   // THE line. Everything else is tree traversal.
        visited.add(nb);
        stack.push(nb);
      }
    }
  }
}
\`\`\`

Both DFS and BFS run in **O(V + E)**: each vertex enters the structure once, each edge is examined a constant number of times.

## Connected components: the outer-loop pattern

DFS from one vertex reaches everything *connected to it* — and nothing else. So to count components, wrap it in a loop over all vertices: every time you find an unvisited vertex, that's a brand-new component — count it, DFS from it, repeat. The visited set is shared across the whole loop, so total work stays O(V + E) no matter how many components there are.

## BFS = shortest path in edge count

On an **unweighted** graph, BFS explores in rings: everything 1 hop away, then 2, then 3. The first time you reach a vertex is therefore via a fewest-edges path — the same nearest-first argument as min-depth on trees. Record \`dist[neighbor] = dist[current] + 1\` as you enqueue, and the distance map doubles as your visited set. DFS gives you *a* path; only BFS guarantees the *shortest* one (in hops — weighted graphs need Dijkstra, later).

## The other way to track components: union-find

If edges arrive **incrementally** ("are these two connected *now*?" after each insertion), re-running DFS per query is wasteful. Union-find keeps each component as a set with a representative element: \`union(a, b)\` merges two sets, \`find(v)\` returns v's representative — and *path compression* flattens the lookup chain as it walks it, making operations effectively constant amortized. Reach for it when connectivity changes over time; for a static graph, the DFS outer loop is simpler and just as fast. No implementation needed here — just know it exists and when it wins.`,
      python: `Tree DFS and BFS transfer to graphs almost verbatim — with one non-negotiable addition. Trees can't loop back on themselves; graphs can. Traverse a cycle without protection and you revisit the same vertices forever. **The fix is a visited set, checked before every enqueue or recursive call.** Omit it and your traversal is an infinite loop — not slow, not wrong, *hung*. This is the same "have I seen this before?" \`set\` you've reached for in dedup work; here it's load-bearing.

\`\`\`python
def dfs(start_at, adj, visited):
    stack = [start_at]
    visited.add(start_at)
    while stack:
        v = stack.pop()
        for nb in adj[v]:
            if nb not in visited:   # THE line. Everything else is tree traversal.
                visited.add(nb)
                stack.append(nb)
\`\`\`

Note this DFS is *iterative*. On a graph that matters more than it did on trees: recursive DFS costs one Python frame per vertex on the current path, and the default recursion limit of 1000 makes a long chain of vertices raise \`RecursionError\`. An explicit stack is bounded by the heap instead.

Both DFS and BFS run in **O(V + E)**: each vertex enters the structure once, each edge is examined a constant number of times.

## Connected components: the outer-loop pattern

DFS from one vertex reaches everything *connected to it* — and nothing else. So to count components, wrap it in a loop over all vertices: every time you find an unvisited vertex, that's a brand-new component — count it, DFS from it, repeat. The visited set is shared across the whole loop, so total work stays O(V + E) no matter how many components there are.

## BFS = shortest path in edge count

On an **unweighted** graph, BFS explores in rings: everything 1 hop away, then 2, then 3. The first time you reach a vertex is therefore via a fewest-edges path — the same nearest-first argument as min-depth on trees. Record \`dist[neighbor] = dist[current] + 1\` as you enqueue, and the distance dict doubles as your visited set. DFS gives you *a* path; only BFS guarantees the *shortest* one (in hops — weighted graphs need Dijkstra, which in Python means \`heapq\`).

Use \`collections.deque\` for the frontier, as always — \`pop(0)\` on a list would turn the O(V + E) bound into O(V²).

## The other way to track components: union-find

If edges arrive **incrementally** ("are these two connected *now*?" after each insertion), re-running DFS per query is wasteful. Union-find keeps each component as a set with a representative element: \`union(a, b)\` merges two sets, \`find(v)\` returns v's representative — and *path compression* flattens the lookup chain as it walks it, making operations effectively constant amortized. Reach for it when connectivity changes over time; for a static graph, the DFS outer loop is simpler and just as fast. No implementation needed here — just know it exists and when it wins.`,
    },
    exercises: [
    {
      id: "dsa-count-components",
      title: "Count the islands (components)",
      instructions: {
        typescript: `Implement \`countComponents(vertexCount, edges)\` for an undirected graph. \`buildAdjacency\` is given complete — your TODO is the traversal:

1. A shared \`visited\` set.
2. An outer loop over all vertices; each unvisited one starts a new component.
3. DFS from it (explicit stack or recursion) marking everything reachable.

Expected output: \`3\` (components {0,1,2}, {3,4}, and isolated {5}), then \`1\`.`,
        python: `Implement \`count_components(vertex_count, edges)\` for an undirected graph. \`build_adjacency\` is given complete — your TODO is the traversal:

1. A shared \`visited\` set.
2. An outer loop over all vertices; each unvisited one starts a new component.
3. DFS from it (explicit stack recommended) marking everything reachable.

Prefer the explicit stack over recursion here: a long chain of vertices would hit Python's 1000-frame recursion limit, and the iterative version has no such ceiling.

Expected output: \`3\` (components {0,1,2}, {3,4}, and isolated {5}), then \`1\`.`,
      },
      starterCode: {
        typescript: `// Given complete (last lesson): undirected adjacency map.
function buildAdjacency(
  vertexCount: number,
  edges: [number, number][]
): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  for (let v = 0; v < vertexCount; v++) adj.set(v, []);
  for (const [a, b] of edges) {
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }
  return adj;
}

function countComponents(vertexCount: number, edges: [number, number][]): number {
  const adj = buildAdjacency(vertexCount, edges);
  // TODO: keep a visited Set<number>. For each vertex 0..vertexCount-1 that is
  // NOT yet visited: that's a new component — count it, then DFS from it
  // (explicit stack or recursion) marking everything reachable as visited.
  return 0;
}

// Components: {0, 1, 2}, {3, 4}, and isolated {5}
console.log(countComponents(6, [[0, 1], [1, 2], [3, 4]])); // expected 3

// One fully connected graph
console.log(countComponents(3, [[0, 1], [1, 2]])); // expected 1`,
        python: `# Given complete: undirected adjacency dict.
def build_adjacency(vertex_count, edges):
    adj = {v: [] for v in range(vertex_count)}
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    return adj


def count_components(vertex_count, edges):
    adj = build_adjacency(vertex_count, edges)
    # TODO: keep a shared \`visited\` set. For each vertex 0..vertex_count-1 that
    # is NOT yet visited: that's a new component — count it, then DFS from it
    # (explicit stack) marking everything reachable as visited.
    return 0


# Components: {0, 1, 2}, {3, 4}, and isolated {5}
print(count_components(6, [(0, 1), (1, 2), (3, 4)]))  # expected 3

# One fully connected graph
print(count_components(3, [(0, 1), (1, 2)]))  # expected 1
`,
      },
    },
    {
      id: "dsa-shortest-hops",
      title: "Shortest path in hops",
      instructions: {
        typescript: `Implement \`shortestHops(vertexCount, edges, start, goal)\` on an undirected graph: the fewest edges from \`start\` to \`goal\`, or \`-1\` if unreachable. Adjacency helper given complete.

Why BFS and not DFS: BFS visits everything at distance 1 before anything at distance 2, so the *first* time it touches \`goal\` is via a fewest-edges path. DFS commits to one branch and may find a long path first. Track \`dist\` per vertex as you enqueue — the dist map is also your visited set.

Expected output: \`2\` (the 0-4-3 shortcut beats 0-1-2-3), then \`-1\`.`,
        python: `Implement \`shortest_hops(vertex_count, edges, start, goal)\` on an undirected graph: the fewest edges from \`start\` to \`goal\`, or \`-1\` if unreachable. Adjacency helper given complete.

Why BFS and not DFS: BFS visits everything at distance 1 before anything at distance 2, so the *first* time it touches \`goal\` is via a fewest-edges path. DFS commits to one branch and may find a long path first. Track \`dist\` per vertex as you enqueue — the dist dict is also your visited set.

Use \`collections.deque\` and \`popleft()\`; \`pop(0)\` on a list is O(n) and would wreck the O(V + E) bound.

Expected output: \`2\` (the 0-4-3 shortcut beats 0-1-2-3), then \`-1\`.`,
      },
      starterCode: {
        typescript: `// Given complete: undirected adjacency map.
function buildAdjacency(
  vertexCount: number,
  edges: [number, number][]
): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  for (let v = 0; v < vertexCount; v++) adj.set(v, []);
  for (const [a, b] of edges) {
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  }
  return adj;
}

function shortestHops(
  vertexCount: number,
  edges: [number, number][],
  start: number,
  goal: number
): number {
  const adj = buildAdjacency(vertexCount, edges);
  // TODO: BFS from start. Keep dist = Map<number, number> with dist.set(start, 0);
  // the map doubles as your visited set. When you dequeue v, enqueue each
  // unseen neighbor with dist v + 1. Return dist for goal, or -1 if BFS
  // finishes without reaching it.
  return -1;
}

// 0-1-2-3 the long way, 0-4-3 the short way; vertex 5 is isolated
const roads: [number, number][] = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 3]];
console.log(shortestHops(6, roads, 0, 3)); // expected 2 (via 4, not 3 hops via 1-2)
console.log(shortestHops(6, roads, 0, 5)); // expected -1 (unreachable)`,
        python: `from collections import deque


# Given complete: undirected adjacency dict.
def build_adjacency(vertex_count, edges):
    adj = {v: [] for v in range(vertex_count)}
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    return adj


def shortest_hops(
    vertex_count,
    edges,
    start,
    goal,
):
    adj = build_adjacency(vertex_count, edges)
    # TODO: BFS from start. Keep dist = {start: 0}; the dict doubles as your
    # visited set. When you popleft v, enqueue each unseen neighbor with
    # dist[v] + 1. Return dist[goal], or -1 if BFS finishes without reaching it.
    return -1


# 0-1-2-3 the long way, 0-4-3 the short way; vertex 5 is isolated
roads = [(0, 1), (1, 2), (2, 3), (0, 4), (4, 3)]
print(shortest_hops(6, roads, 0, 3))  # expected 2 (via 4, not 3 hops via 1-2)
print(shortest_hops(6, roads, 0, 5))  # expected -1 (unreachable)
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-graph-traversal-q1",
      prompt: "You port your tree BFS to a graph by swapping `node.children` for `adj.get(v)` — and on the first cyclic input it hangs forever. What's missing?",
      options: [
        "A visited set checked before each enqueue — cycles re-deliver vertices endlessly without it",
        "A recursion-depth limit — graphs are deeper than trees, so the queue overflows",
        "Sorting the neighbor lists — BFS requires neighbors in ascending order to terminate",
        "A directed adjacency map — BFS only terminates on directed graphs",
      ],
      answer: 0,
      explanation: "Trees terminate for free because no vertex has two paths into it; a cycle feeds the same vertices back into the queue forever. The visited set is the one non-negotiable difference between tree and graph traversal.",
    },
    {
      id: "dsa-graph-traversal-q2",
      prompt: "Fewest bus transfers between two stops, where every leg counts equally. Which traversal, and why?",
      options: [
        "DFS — it dives straight toward the goal, finding it faster than BFS's ring-by-ring search",
        "BFS — it explores by increasing hop count, so the first arrival at the goal uses the fewest edges",
        "Either — both visit every vertex once, so both find the same shortest path in O(V + E)",
        "Neither — fewest-edges paths require Dijkstra's algorithm even when weights are equal",
      ],
      answer: 1,
      explanation: "BFS's ring-by-ring order is the guarantee: all 1-hop stops before any 2-hop stop, so first contact = fewest hops. DFS finds *a* path but happily returns a 10-leg route when a 2-leg one exists. Dijkstra only becomes necessary when edges have unequal weights.",
    },
    {
      id: "dsa-graph-traversal-q3",
      prompt: "A system receives a stream of “server A now peered with server B” events, and between events must answer “are X and Y connected?” Best tool?",
      options: [
        "Re-run DFS from X on every query — O(V + E) each time is the only correct option",
        "Rebuild the adjacency map on each event and cache one components count",
        "Union-find — union each new edge, answer queries with find; near-O(1) amortized per operation",
        "Keep an adjacency matrix so connectivity is a single O(1) cell lookup",
      ],
      answer: 2,
      explanation: "Incremental edges are exactly union-find's home turf: merging sets and comparing representatives are effectively constant amortized with path compression. Repeated DFS pays O(V + E) per query, and a matrix cell only tells you about a direct edge, not connectivity through intermediaries.",
    },
    ],
  },
  {
    id: "dsa-topological-sort",
    module: "graphs",
    title: "Topological Sort",
    blurb: "Kahn's algorithm: dependency order for DAGs, cycles detected free.",
    graphics: [
      {
        id: "dependency-order",
        title: "Respect the edges",
        caption:
          "On a DAG, topological order lines tasks so every dependency appears before its dependents. A cycle means no valid order.",
        src: "/lesson-graphics/dsa/dsa-topological-sort.png",
      },
    ],
    content: {
      typescript: `A **topological order** of a directed graph is a linear arrangement of its vertices where every edge points forward — dependencies before dependents. It's the shape of every dependency problem you've met: build systems compiling modules in import order, course prerequisites, task schedulers, resolving a package lockfile. If your problem sounds like "X must happen before Y," you're looking at a topological sort.

Only **DAGs** (directed *acyclic* graphs) have one. A cycle — A needs B needs C needs A — makes any linear order impossible, and real systems hit this constantly (circular imports, deadlocked task specs). A good algorithm should *tell* you when that happens, not loop or produce garbage.

## Kahn's algorithm

The workhorse, built directly on the in-degree array you implemented two lessons ago:

1. Compute **in-degrees** for every vertex.
2. Queue every vertex with in-degree **0** — nothing blocks them.
3. Loop: dequeue a vertex, append it to the order, and for each of its neighbors decrement that neighbor's in-degree — you've satisfied one of its prerequisites. Any neighbor that **hits 0** is now unblocked: enqueue it.
4. Repeat until the queue is empty.

\`\`\`ts
const queue = indeg.flatMap((d, v) => (d === 0 ? [v] : []));
const order: number[] = [];
let head = 0; // read pointer — \`queue.shift()\` is O(n) per call and would wreck the bound
while (head < queue.length) {
  const v = queue[head++];
  order.push(v);
  for (const nb of adj.get(v)!) {
    if (--indeg[nb] === 0) queue.push(nb);
  }
}
\`\`\`

Each vertex is enqueued once and each edge decremented once: **O(V + E)**. (The head pointer matters: \`shift()\` re-indexes the whole array, turning the loop into O(V²) on a long queue — same trick applies to any array-backed BFS queue.)

## Cycle detection falls out for free

Here's the elegant part: a vertex on a cycle can *never* reach in-degree 0 — something on the cycle always still points at it. So when the loop finishes, if \`order.length < vertexCount\`, the leftover vertices are exactly the ones trapped in (or downstream of) a cycle. One length comparison and you have cycle detection — no extra pass, no recursion-stack coloring.

Note there are usually *many* valid orders (any tie among simultaneous in-degree-0 vertices can break either way). Callers should assert "every edge points forward," not one specific sequence.

## The alternative

DFS also produces a topological order: run DFS over the whole graph, record each vertex on *post-order* (after all its descendants), then reverse. Same O(V + E). Kahn's is usually preferred in practice — it's iterative, and the cycle check is a one-liner instead of tracking gray/black states.`,
      python: `A **topological order** of a directed graph is a linear arrangement of its vertices where every edge points forward — dependencies before dependents. It's the shape of every dependency problem you've met: build systems compiling modules in import order, course prerequisites, task schedulers, resolving a package lockfile. If your problem sounds like "X must happen before Y," you're looking at a topological sort.

Only **DAGs** (directed *acyclic* graphs) have one. A cycle — A needs B needs C needs A — makes any linear order impossible, and real systems hit this constantly (circular imports, deadlocked task specs). A good algorithm should *tell* you when that happens, not loop or produce garbage.

## Kahn's algorithm

The workhorse, built directly on the in-degree list you implemented two lessons ago:

1. Compute **in-degrees** for every vertex.
2. Queue every vertex with in-degree **0** — nothing blocks them.
3. Loop: dequeue a vertex, append it to the order, and for each of its neighbors decrement that neighbor's in-degree — you've satisfied one of its prerequisites. Any neighbor that **hits 0** is now unblocked: enqueue it.
4. Repeat until the queue is empty.

\`\`\`python
from collections import deque

queue = deque(v for v, d in enumerate(indeg) if d == 0)
order = []
while queue:
    v = queue.popleft()
    order.append(v)
    for nb in adj[v]:
        indeg[nb] -= 1
        if indeg[nb] == 0:
            queue.append(nb)
\`\`\`

Each vertex is enqueued once and each edge decremented once: **O(V + E)**. (\`popleft\` matters: \`queue.pop(0)\` on a list re-indexes the whole thing, turning the loop into O(V²) on a long queue — the same trap as any list-backed BFS queue.)

Python has no \`--x\` operator, so the decrement and the zero test are two statements rather than the one-liner other languages allow. Resist compressing it — \`indeg[nb] -= 1\` returns \`None\`, so there is no expression form to lean on.

**Standard-library shortcut:** \`graphlib.TopologicalSorter\` (Python 3.9+) implements exactly this, raising \`CycleError\` when no order exists. Worth knowing it exists; write the loop by hand here, because the interview question is the mechanism.

## Cycle detection falls out for free

Here's the elegant part: a vertex on a cycle can *never* reach in-degree 0 — something on the cycle always still points at it. So when the loop finishes, if \`len(order) < vertex_count\`, the leftover vertices are exactly the ones trapped in (or downstream of) a cycle. One length comparison and you have cycle detection — no extra pass, no recursion-stack coloring.

Note there are usually *many* valid orders (any tie among simultaneous in-degree-0 vertices can break either way). Callers should assert "every edge points forward," not one specific sequence.

## The alternative

DFS also produces a topological order: run DFS over the whole graph, record each vertex on *post-order* (after all its descendants), then reverse. Same O(V + E). Kahn's is usually preferred in practice — it's iterative (no recursion limit to worry about), and the cycle check is a one-liner instead of tracking gray/black states.`,
    },
    exercises: [
    {
      id: "dsa-course-order",
      title: "Order the prerequisites",
      instructions: {
        typescript: `Implement \`courseOrder(courseCount, prereqs)\` with Kahn's algorithm. \`[a, b]\` means **b must come before a** (the starter already flips each pair into a b→a edge). \`buildAdjacency\` and \`inDegrees\` are given complete — your TODO is the queue loop.

Return any valid order, or \`null\` when a cycle makes ordering impossible (finished order shorter than \`courseCount\`).

Expected output: a valid order such as \`[ 0, 1, 2, 3 ]\`, then \`null\` for the cyclic case.`,
        python: `Implement \`course_order(course_count, prereqs)\` with Kahn's algorithm. \`(a, b)\` means **b must come before a** (the starter already flips each pair into a b→a edge). \`build_adjacency\` and \`in_degrees\` are given complete — your TODO is the queue loop.

Return any valid order, or \`None\` when a cycle makes ordering impossible (finished order shorter than \`course_count\`).

Expected output: a valid order such as \`[0, 1, 2, 3]\`, then \`None\` for the cyclic case.`,
      },
      starterCode: {
        typescript: `// Given complete (earlier lessons): directed adjacency map + in-degree array.
function buildAdjacency(
  vertexCount: number,
  edges: [number, number][]
): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  for (let v = 0; v < vertexCount; v++) adj.set(v, []);
  for (const [from, to] of edges) adj.get(from)!.push(to);
  return adj;
}

function inDegrees(vertexCount: number, edges: [number, number][]): number[] {
  const indeg = new Array(vertexCount).fill(0);
  for (const [, to] of edges) indeg[to]++;
  return indeg;
}

function courseOrder(
  courseCount: number,
  prereqs: [number, number][]
): number[] | null {
  // [a, b] means "b before a", so the edge points b -> a:
  const edges: [number, number][] = prereqs.map(([a, b]) => [b, a]);
  const adj = buildAdjacency(courseCount, edges);
  const indeg = inDegrees(courseCount, edges);
  // TODO (Kahn's algorithm): queue every vertex with indeg 0. Repeatedly
  // dequeue into the order; for each neighbor, decrement its in-degree and
  // enqueue it when it hits 0. If the finished order has fewer than
  // courseCount entries, a cycle blocked the rest — return null.
  return null;
}

// DAG: 0 unlocks 1 and 2; both unlock 3
console.log(courseOrder(4, [[1, 0], [2, 0], [3, 1], [3, 2]])); // expected e.g. [ 0, 1, 2, 3 ]

// Cycle: 0 needs 1, 1 needs 0
console.log(courseOrder(2, [[0, 1], [1, 0]])); // expected null`,
        python: `from collections import deque


# Given complete (earlier lessons): directed adjacency dict + in-degree list.
def build_adjacency(vertex_count, edges):
    adj = {v: [] for v in range(vertex_count)}
    for frm, to in edges:
        adj[frm].append(to)
    return adj


def in_degrees(vertex_count, edges):
    indeg = [0] * vertex_count
    for _, to in edges:
        indeg[to] += 1
    return indeg


def course_order(course_count, prereqs):
    # (a, b) means "b before a", so the edge points b -> a:
    edges = [(b, a) for a, b in prereqs]
    adj = build_adjacency(course_count, edges)
    indeg = in_degrees(course_count, edges)
    # TODO (Kahn's algorithm): queue every vertex with indeg 0. Repeatedly
    # popleft into the order; for each neighbor, decrement its in-degree and
    # enqueue it when it hits 0. If the finished order has fewer than
    # course_count entries, a cycle blocked the rest — return None.
    return None


# DAG: 0 unlocks 1 and 2; both unlock 3
print(course_order(4, [(1, 0), (2, 0), (3, 1), (3, 2)]))  # expected e.g. [0, 1, 2, 3]

# Cycle: 0 needs 1, 1 needs 0
print(course_order(2, [(0, 1), (1, 0)]))  # expected None
`,
      },
    },
    {
      id: "dsa-can-finish",
      title: "Is it even possible?",
      instructions: {
        typescript: `Implement \`canFinish(courseCount, prereqs)\` — just the cycle question. It's the identical Kahn loop with simpler bookkeeping: instead of collecting the order, **count** how many vertices you dequeue. Processed count equal to \`courseCount\` means no cycle → \`true\`.

Expected output: \`true\` for the DAG, \`false\` for the 1↔2 cycle.`,
        python: `Implement \`can_finish(course_count, prereqs)\` — just the cycle question. It's the identical Kahn loop with simpler bookkeeping: instead of collecting the order, **count** how many vertices you dequeue. Processed count equal to \`course_count\` means no cycle → \`True\`.

Expected output: \`True\` for the DAG, \`False\` for the 1↔2 cycle.`,
      },
      starterCode: {
        typescript: `// Given complete: directed adjacency map + in-degree array.
function buildAdjacency(
  vertexCount: number,
  edges: [number, number][]
): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  for (let v = 0; v < vertexCount; v++) adj.set(v, []);
  for (const [from, to] of edges) adj.get(from)!.push(to);
  return adj;
}

function inDegrees(vertexCount: number, edges: [number, number][]): number[] {
  const indeg = new Array(vertexCount).fill(0);
  for (const [, to] of edges) indeg[to]++;
  return indeg;
}

function canFinish(courseCount: number, prereqs: [number, number][]): boolean {
  const edges: [number, number][] = prereqs.map(([a, b]) => [b, a]);
  const adj = buildAdjacency(courseCount, edges);
  const indeg = inDegrees(courseCount, edges);
  // TODO: same Kahn loop as courseOrder, but don't collect the order —
  // just count how many vertices you dequeue. Every vertex processed
  // (count === courseCount) means no cycle: return true.
  return false;
}

// DAG — finishable
console.log(canFinish(4, [[1, 0], [2, 0], [3, 1], [3, 2]])); // expected true

// 1 <-> 2 cycle — not finishable
console.log(canFinish(3, [[1, 2], [2, 1]])); // expected false`,
        python: `from collections import deque


# Given complete (earlier lessons): directed adjacency dict + in-degree list.
def build_adjacency(vertex_count, edges):
    adj = {v: [] for v in range(vertex_count)}
    for frm, to in edges:
        adj[frm].append(to)
    return adj


def in_degrees(vertex_count, edges):
    indeg = [0] * vertex_count
    for _, to in edges:
        indeg[to] += 1
    return indeg


def can_finish(course_count, prereqs):
    edges = [(b, a) for a, b in prereqs]
    adj = build_adjacency(course_count, edges)
    indeg = in_degrees(course_count, edges)
    # TODO: same Kahn loop as course_order, but don't collect the order —
    # just count how many vertices you dequeue. Every vertex processed
    # (count == course_count) means no cycle: return True.
    return False


# DAG — finishable
print(can_finish(4, [(1, 0), (2, 0), (3, 1), (3, 2)]))  # expected True

# 1 <-> 2 cycle — not finishable
print(can_finish(3, [(1, 2), (2, 1)]))  # expected False
`,
      },
    },
    ],
    quiz: [
    {
      id: "dsa-topological-sort-q1",
      prompt: "Kahn's algorithm finishes and the produced order contains 7 of the graph's 10 vertices. What do you know?",
      options: [
        "The graph has 3 connected components that need their own runs of the algorithm",
        "3 vertices were isolated (no edges), and isolated vertices never enter the order",
        "The queue was processed in the wrong order; rerunning with a stack will include them",
        "The 3 missing vertices are involved in (or blocked behind) a cycle — no topological order exists",
      ],
      answer: 3,
      explanation: "A vertex on a cycle can never reach in-degree 0 — something on the cycle always still points at it — so it's never enqueued. `order.length < vertexCount` IS the cycle check; isolated vertices, by contrast, start at in-degree 0 and always make it in.",
    },
    {
      id: "dsa-topological-sort-q2",
      prompt: "What does one dequeue-and-decrement step in Kahn's algorithm actually mean, in dependency terms?",
      options: [
        "The dequeued task's prerequisites are all satisfied, so completing it strikes it off each dependent's remaining-blockers count",
        "The dequeued task is the one with the most dependents, so finishing it unblocks the maximum work",
        "The decrement removes the edge from the adjacency map so later passes run faster",
        "The dequeued task is provisional and re-enters the queue if a later vertex still points at it",
      ],
      answer: 0,
      explanation: "In-degree = number of unfinished prerequisites. In-degree 0 = ready to run; completing it decrements each dependent's count, and a dependent hitting 0 is newly unblocked. Queue order among ready vertices is arbitrary — many valid orders exist.",
    },
    {
      id: "dsa-topological-sort-q3",
      prompt: "A CI pipeline has 50,000 build targets and 200,000 dependency edges. What does ordering them with Kahn's algorithm cost?",
      options: [
        "O(V · E) — about 10 billion: every vertex may rescan every edge",
        "O(V + E) — about 250,000 units of work: each vertex enqueued once, each edge decremented once",
        "O(V²) — about 2.5 billion: each vertex must be compared against every other",
        "O(E log V) — about 3.1 million: the queue keeps vertices in sorted order",
      ],
      answer: 1,
      explanation: "Each vertex enters the queue exactly once and each edge is touched exactly once (one decrement), so the work is V + E ≈ 250k — this graph orders in milliseconds. The queue is FIFO, not a priority queue, so no log factor appears.",
    },
    ],
  },
];
