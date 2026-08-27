#!/usr/bin/env node
/**
 * Generate DSA lesson concept illustrations via OpenRouter image models
 * and write them to public/lesson-graphics/dsa/.
 *
 * Usage:
 *   node scripts/gen-dsa-graphics.mjs                 # all lessons
 *   node scripts/gen-dsa-graphics.mjs dsa-big-o dsa-two-pointers
 *   node scripts/gen-dsa-graphics.mjs --limit 5
 *   node scripts/gen-dsa-graphics.mjs --model openai/gpt-image-2 --limit 5
 *   node scripts/gen-dsa-graphics.mjs --dry-run
 *
 * Requires OPENROUTER_API_KEY in the environment.
 *
 * Output PNGs are committed straight into the repo rather than generated at
 * build time or served from a CDN — there are few enough (one per lesson)
 * that a build step or asset host would be pure overhead. Re-run this script
 * and commit the new PNGs when a lesson's figure needs to change.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "lesson-graphics", "dsa");

const DEFAULT_MODEL = "openai/gpt-image-2";
const ENDPOINT = "https://openrouter.ai/api/v1/images";

/**
 * Shared visual system so the set reads as one course.
 * Multi-panel by default: one canvas, clear steps of the idea.
 */
const STYLE = [
  "Single educational poster image composed of clear labeled panels (2x2 quadrants or a horizontal strip of steps).",
  "Each panel is a distinct step of the algorithm or concept, numbered Step 1, Step 2, … with a short correct title.",
  "Warm cream paper background (#f6f1e7), soft sand tones, cognac orange (#a8551d) and olive green (#5e6b3c) accents, slate blue for secondary marks.",
  "Flat vector modern textbook / UI-diagram style: soft shadows, precise geometry, generous whitespace, consistent iconography across panels.",
  "No photorealism, no 3D clutter, no watermarks, no logos, no decorative random icons inside data cells.",
  "Array/list cells contain plain numbers or letters only. Labels must be short, sharp, and correctly spelled.",
  "Panel borders are subtle hairlines; the whole image should feel like one cohesive figure, not four unrelated stickers.",
].join(" ");

/**
 * One multi-panel figure per DSA lesson. Order matches the course module order.
 * @type {{ id: string, title: string, prompt: string }[]}
 */
export const LESSONS = [
  {
    id: "dsa-big-o",
    title: "How work grows with n",
    prompt: [
      "2x2 quadrant educational poster about Big-O growth.",
      "Top-left Step 1 'Tiny n': same three algorithms (nested loops, single loop, constant) all look fine on a small array of 5 items.",
      "Top-right Step 2 'n grows': input size meter rises; the nested-loop version is visibly longer.",
      "Bottom-left Step 3 'Growth curves': correct chart — O(1) flat, O(log n) gentle, O(n) linear, O(n log n) above linear, O(n²) steepest. Labels must match curve shapes exactly.",
      "Bottom-right Step 4 'Drop constants': equation 3n+40 simplifies to O(n) with lower-order terms fading out.",
    ].join(" "),
  },
  {
    id: "dsa-time-vs-space",
    title: "Buy speed with memory",
    prompt: [
      "2x2 quadrant poster: trading space for time.",
      "Step 1 'Naive scan': nested loops over an array, O(n²) badge, empty extra memory.",
      "Step 2 'Build a Set/Map': one pass inserting values into a hash set, memory boxes filling.",
      "Step 3 'Fast lookup': same query answered with O(1) set membership check.",
      "Step 4 'The trade': simple balance — less time, more space — with O(n) time and O(n) space badges.",
    ].join(" "),
  },
  {
    id: "dsa-reading-complexity",
    title: "Spot nested work",
    prompt: [
      "2x2 quadrant poster: reading code for complexity.",
      "Step 1 'Single loop': one for-loop over n items → O(n), simple ring icon.",
      "Step 2 'Nested loops': loop inside loop over n×n → O(n²), concentric rings.",
      "Step 3 'Halving loop': while n = n/2 → O(log n), shrinking bars.",
      "Step 4 'Hidden cost': outer loop calls includes() on an array each time → still O(n²); magnifying glass on the library call.",
    ].join(" "),
  },
  {
    id: "dsa-two-pointers",
    title: "Pointers from both ends",
    prompt: [
      "Horizontal 4-panel strip (or 2x2) showing two-pointers on a sorted array of numbers [1,2,3,4,6,8,9,11] seeking pair sum 10.",
      "Step 1: L at 1, R at 11, sum=12 too big — move R left.",
      "Step 2: L at 1, R at 9, sum=10 found — highlight the pair.",
      "Step 3 alternate path if needed: if sum too small, move L right.",
      "Final panel: general rule — move the pointer that fixes the sum. Plain numeric cells only, L and R arrows labeled.",
    ].join(" "),
  },
  {
    id: "dsa-sliding-window",
    title: "A window that slides",
    prompt: [
      "4-panel strip of a sliding window over array [2,1,5,1,3,2] with window size k=3 maximizing sum.",
      "Step 1: window covers [2,1,5], sum=8.",
      "Step 2: slide right to [1,5,1], sum=7.",
      "Step 3: slide to [5,1,3], sum=9 — new best highlighted.",
      "Step 4: slide to [1,3,2], sum=6; best remains 9. Flat translucent cognac window over exactly 3 cells each step; plain numbers only.",
    ].join(" "),
  },
  {
    id: "dsa-prefix-sums",
    title: "Running totals",
    prompt: [
      "2x2 poster for prefix sums on array [2,3,1,4].",
      "Step 1: original array.",
      "Step 2: build prefix array [2,5,6,10] with running-total arrows.",
      "Step 3: range sum query left..right via prefix[right]-prefix[left-1].",
      "Step 4: show O(1) answer vs re-scanning. Plain numbers only.",
    ].join(" "),
  },
  {
    id: "dsa-hash-mechanics",
    title: "Hash into buckets",
    prompt: [
      "2x2 poster: how a hash map works.",
      "Step 1: key enters hash function.",
      "Step 2: hash maps to a bucket index.",
      "Step 3: insert into that bucket.",
      "Step 4: collision — second key chains in the same bucket. Clean buckets, no clutter.",
    ].join(" "),
  },
  {
    id: "dsa-frequency-maps",
    title: "Count, then decide",
    prompt: [
      "2x2 poster: frequency counting.",
      "Step 1: input string or array of letters.",
      "Step 2: empty Map.",
      "Step 3: tallies fill in as you scan.",
      "Step 4: answer from counts (e.g. anagram / majority). Plain letters and numbers only.",
    ].join(" "),
  },
  {
    id: "dsa-seen-before",
    title: "Remember what you've seen",
    prompt: [
      "4-panel strip: seen-before Set pattern on stream 3,1,4,1.",
      "Step 1: see 3, add to Set.",
      "Step 2: see 1, add.",
      "Step 3: see 4, add.",
      "Step 4: see 1 again — already in Set, flag duplicate. Plain numbers only.",
    ].join(" "),
  },
  {
    id: "dsa-linked-list-basics",
    title: "Nodes and next links",
    prompt: [
      "2x2 poster: linked list basics.",
      "Step 1: single node {val, next}.",
      "Step 2: chain of 4 nodes 1→2→3→4→null.",
      "Step 3: walk with a cur pointer.",
      "Step 4: insert/delete at a known node by rewiring next. Clean boxes and arrows.",
    ].join(" "),
  },
  {
    id: "dsa-fast-slow-pointers",
    title: "Tortoise and hare",
    prompt: [
      "4-panel strip: fast/slow pointers on a list that has a cycle.",
      "Step 1: both at head.",
      "Step 2: slow +1, fast +2.",
      "Step 3: continue.",
      "Step 4: they meet inside the cycle. Label slow and fast clearly.",
    ].join(" "),
  },
  {
    id: "dsa-reverse-list",
    title: "Flip the arrows",
    prompt: [
      "4-panel strip: reverse linked list in place with prev, cur, next.",
      "Step 1: initial 1→2→3→4→null, prev=null, cur=1.",
      "Step 2: reverse first link.",
      "Step 3: mid progress.",
      "Step 4: final null←1←2←3←4. Show pointer variables each step.",
    ].join(" "),
  },
  {
    id: "dsa-stack-patterns",
    title: "Last in, first out",
    prompt: [
      "2x2 poster: stack for bracket matching on string (()[]) .",
      "Step 1: empty stack.",
      "Step 2-3: push opens, pop on matching closes.",
      "Step 4: empty stack = valid. Clear LIFO plates.",
    ].join(" "),
  },
  {
    id: "dsa-queues",
    title: "First in, first out",
    prompt: [
      "4-panel strip: queue FIFO.",
      "Step 1: empty queue.",
      "Step 2: enqueue A,B,C.",
      "Step 3: dequeue A.",
      "Step 4: enqueue D — front is B. Label front/back.",
    ].join(" "),
  },
  {
    id: "dsa-monotonic-stack",
    title: "Next greater in one pass",
    prompt: [
      "4-panel strip: next greater element with monotonic decreasing stack on bars [2,1,2,4,3].",
      "Show stack state and next-greater answers filling in panel by panel. Plain numbers on bars.",
    ].join(" "),
  },
  {
    id: "dsa-tree-basics",
    title: "Root, left, right",
    prompt: [
      "2x2 poster: binary tree / BST.",
      "Step 1: single root.",
      "Step 2: add left/right children.",
      "Step 3: full small BST with ordering (left < root < right).",
      "Step 4: search path for a value. Circular nodes, clear edges.",
    ].join(" "),
  },
  {
    id: "dsa-dfs-recursion",
    title: "Depth-first recursion",
    prompt: [
      "4-panel strip: DFS preorder walk of a small binary tree.",
      "Each panel deepens the path and shows the call stack growing/shrinking. Visit order list updates.",
    ].join(" "),
  },
  {
    id: "dsa-bfs-level-order",
    title: "Level by level",
    prompt: [
      "4-panel strip: BFS level-order with a queue.",
      "Step 1: enqueue root.",
      "Step 2: process level 0.",
      "Step 3: level 1.",
      "Step 4: level 2. Show queue contents each step.",
    ].join(" "),
  },
  {
    id: "dsa-graph-representation",
    title: "Graph ↔ adjacency list",
    prompt: [
      "2-panel or 2x2 poster: undirected graph of 5 nodes.",
      "One side: node-link drawing.",
      "Other side: adjacency list built edge by edge. Clear mapping between them.",
    ].join(" "),
  },
  {
    id: "dsa-graph-traversal",
    title: "Explore with a visited set",
    prompt: [
      "4-panel strip: BFS/DFS on a small graph with a visited set.",
      "Panels show frontier expanding, visited nodes filling solid, unvisited hollow.",
    ].join(" "),
  },
  {
    id: "dsa-topological-sort",
    title: "Respect the edges",
    prompt: [
      "2x2 poster: topological sort (Kahn).",
      "Step 1: DAG of course prerequisites.",
      "Step 2: indegrees.",
      "Step 3: repeatedly take indegree-0 nodes.",
      "Step 4: final linear order. If cycle, show stuck state.",
    ].join(" "),
  },
  {
    id: "dsa-binary-search",
    title: "Halve the search space",
    prompt: [
      "4-panel strip: binary search for target 7 in sorted [1,3,5,7,9,11,13].",
      "Each step shows lo, mid, hi; discarded half hatched. Mid labels correct each step.",
    ].join(" "),
  },
  {
    id: "dsa-search-the-answer",
    title: "Binary search the answer",
    prompt: [
      "4-panel strip: binary search on answer space (low..high).",
      "Each panel: mid probe, feasible/infeasible, shrink range. Number line with low/mid/high markers.",
    ].join(" "),
  },
  {
    id: "dsa-sorting-survey",
    title: "Three faces of sorting",
    prompt: [
      "2x2 poster of classic sorts on the same bar array.",
      "Panel 1 merge step, panel 2 partition (quick), panel 3 adjacent swap (bubble), panel 4 sorted result.",
      "Plain height bars, no clutter.",
    ].join(" "),
  },
  {
    id: "dsa-memoization",
    title: "Compute once, reuse forever",
    prompt: [
      "2x2 quadrant poster contrasting naive recursion, memoization and tabulation for fib(5).",
      "Step 1 'Naive recursion': a call tree for fib(5) where fib(3) appears twice and fib(2) three times, duplicates tinted red, badge O(2^n).",
      "Step 2 'Memoize': the same tree with duplicate branches collapsed into a cache lookup arrow pointing at a small key-value table (3 to 2, 2 to 1), badge O(n).",
      "Step 3 'Tabulate': a single row of cells indexed 0..5 holding 0,1,1,2,3,5, filled left to right with arrows from the two previous cells.",
      "Step 4 'Roll it up': the row reduced to just two labeled variables prev2 and prev1, badge O(1) space.",
      "Plain numbers in all cells, no code text beyond the short labels.",
    ].join(" "),
  },
  {
    id: "dsa-one-dimensional-dp",
    title: "Filling a 1-D table",
    prompt: [
      "2x2 quadrant poster about one-dimensional dynamic programming.",
      "Step 1 'State': a single row of cells labeled dp[0..n] with a caption cell reading 'best answer up to i'.",
      "Step 2 'Choose': at cell i, two arrows in — one from i-1 labeled skip, one from i-2 labeled take — merging into a max box.",
      "Step 3 'House robber': array 2,7,9,3,1 with 2, 9 and 1 highlighted and total 12 shown, adjacent picks visibly forbidden.",
      "Step 4 'Look back further': array 10,9,2,5,3,7 with many arrows from every earlier cell into the current one, badge O(n^2), caption 'longest increasing subsequence'.",
      "Plain numbers only in the cells, short sharp labels.",
    ].join(" "),
  },
  {
    id: "dsa-grid-dp",
    title: "Two-dimensional tables",
    prompt: [
      "2x2 quadrant poster about two-dimensional dynamic programming.",
      "Step 1 'Grid state': a 3x3 grid of costs 1,3,1 / 1,5,1 / 4,2,1 with a cell highlighted and two arrows into it, one from above and one from the left.",
      "Step 2 'Fill order': the cheapest-cost table for that grid, filled row by row left to right, cells reading exactly 1 4 5 / 2 7 6 / 6 8 7, with the first row and first column marked as running totals.",
      "Step 3 'Knapsack table': a table with items down the left side (weight,value pairs 2,3 then 3,4 then 4,5) and capacity 0..7 across the top; four rows labeled 'none', '2,3', '3,4', '4,5' reading exactly 0 0 0 0 0 0 0 0 / 0 0 3 3 3 3 3 3 / 0 0 3 4 4 7 7 7 / 0 0 3 4 5 7 8 9; the final cell 9 highlighted with skip and take arrows from the row above.",
      "Step 4 'One row, descending': a single row of capacity cells with a large right-to-left arrow labeled 'descending keeps it 0/1'.",
      "Plain numbers in cells, no photorealism, short correct labels.",
    ].join(" "),
  },
];

function parseArgs(argv) {
  const ids = [];
  let limit = null;
  let dryRun = false;
  let resolution = "1K";
  let aspectRatio = "1:1";
  let model = DEFAULT_MODEL;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--limit") {
      limit = Number(argv[++i]);
    } else if (a === "--dry-run") {
      dryRun = true;
    } else if (a === "--resolution") {
      resolution = argv[++i];
    } else if (a === "--aspect-ratio") {
      aspectRatio = argv[++i];
    } else if (a === "--model") {
      model = argv[++i];
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else if (a.startsWith("-")) {
      throw new Error(`Unknown flag: ${a}`);
    } else {
      ids.push(a);
    }
  }
  return { ids, limit, dryRun, resolution, aspectRatio, model };
}

function printHelp() {
  console.log(`Usage: node scripts/gen-dsa-graphics.mjs [lesson-id ...] [options]

Options:
  --model ID           OpenRouter model (default: ${DEFAULT_MODEL})
  --limit N            Generate only the first N lessons (course order)
  --resolution 1K|2K   Image resolution (default 1K)
  --aspect-ratio R     Aspect ratio (default 1:1)
  --dry-run            Print prompts only, do not call the API
  -h, --help           Show this help

Environment:
  OPENROUTER_API_KEY   Required for generation
`);
}

function selectLessons({ ids, limit }) {
  if (ids.length > 0) {
    const byId = new Map(LESSONS.map((l) => [l.id, l]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length) {
      throw new Error(`Unknown lesson id(s): ${missing.join(", ")}`);
    }
    return ids.map((id) => byId.get(id));
  }
  if (limit != null) {
    if (!Number.isFinite(limit) || limit < 1) {
      throw new Error(`--limit must be a positive number, got ${limit}`);
    }
    return LESSONS.slice(0, limit);
  }
  return LESSONS;
}

function fullPrompt(lesson) {
  return `${STYLE}\n\nFigure: ${lesson.title}\n\n${lesson.prompt}`;
}

async function generateImage({ model, prompt, resolution, aspectRatio, apiKey }) {
  const body = {
    model,
    prompt,
    n: 1,
  };
  // Only send params when set; some models reject unknown enums.
  if (resolution) body.resolution = resolution;
  if (aspectRatio) body.aspect_ratio = aspectRatio;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/sean1588/interview-sim",
      "X-Title": "interview-sim DSA lesson graphics",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 500)}`);
  }

  if (!res.ok) {
    const msg = parsed?.error?.message || parsed?.message || text.slice(0, 500);
    throw new Error(`OpenRouter ${res.status}: ${msg}`);
  }

  const image = parsed?.data?.[0];
  if (!image) {
    throw new Error(`No image in response: ${JSON.stringify(parsed).slice(0, 500)}`);
  }

  if (image.b64_json) {
    // Detect png vs jpeg from magic bytes after decode.
    const bytes = Buffer.from(image.b64_json, "base64");
    const ext = bytes[0] === 0xff && bytes[1] === 0xd8 ? "jpg" : "png";
    return { bytes, ext };
  }
  if (image.url) {
    const imgRes = await fetch(image.url);
    if (!imgRes.ok) {
      throw new Error(`Failed to download image URL (${imgRes.status})`);
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const ct = imgRes.headers.get("content-type") || "";
    const ext = ct.includes("jpeg") || ct.includes("jpg") ? "jpg" : "png";
    return { bytes: buf, ext };
  }

  throw new Error(`Unrecognized image payload keys: ${Object.keys(image).join(", ")}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const selected = selectLessons(opts);

  console.log(`Model: ${opts.model}`);
  console.log(`Lessons: ${selected.map((l) => l.id).join(", ")}`);
  console.log(`Out: ${OUT_DIR}`);
  console.log(`Resolution: ${opts.resolution}  Aspect: ${opts.aspectRatio}`);

  if (opts.dryRun) {
    for (const lesson of selected) {
      console.log("\n---", lesson.id);
      console.log(fullPrompt(lesson));
    }
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  let ok = 0;
  let failed = 0;

  for (const lesson of selected) {
    const prompt = fullPrompt(lesson);
    process.stdout.write(`Generating ${lesson.id} ... `);
    try {
      const { bytes, ext } = await generateImage({
        model: opts.model,
        prompt,
        resolution: opts.resolution,
        aspectRatio: opts.aspectRatio,
        apiKey,
      });
      // Lesson graphics reference a fixed `.png` src; a model that returns
      // jpeg bytes must not be aliased under a .png name (mismatched
      // extension/content confuses anything that trusts the extension).
      if (ext !== "png") {
        throw new Error(
          `model returned ${ext} image data, but lesson graphics only support .png — rerun with a PNG-capable model`
        );
      }
      const outPath = join(OUT_DIR, `${lesson.id}.png`);
      await writeFile(outPath, bytes);
      console.log(`ok (${bytes.length} bytes → ${lesson.id}.png)`);
      ok++;
    } catch (err) {
      console.log("FAILED");
      console.error(`  ${err.message || err}`);
      failed++;
    }
  }

  console.log(`\nDone. ok=${ok} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
