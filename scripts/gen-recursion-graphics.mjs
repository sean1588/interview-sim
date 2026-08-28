#!/usr/bin/env node
/**
 * Generate Recursion lesson concept illustrations via OpenRouter image models
 * and write them to public/lesson-graphics/recursion/.
 *
 * Sibling of scripts/gen-dsa-graphics.mjs — same STYLE string, so the two
 * courses' figures read as one visual system.
 *
 * Usage:
 *   node scripts/gen-recursion-graphics.mjs                 # all lessons
 *   node scripts/gen-recursion-graphics.mjs rec-call-stack rec-backtracking
 *   node scripts/gen-recursion-graphics.mjs --limit 5
 *   node scripts/gen-recursion-graphics.mjs --model openai/gpt-image-2 --limit 5
 *   node scripts/gen-recursion-graphics.mjs --dry-run
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
const OUT_DIR = join(ROOT, "public", "lesson-graphics", "recursion");

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
 * One multi-panel figure per Recursion lesson. Order matches the course module
 * order (foundations, patterns, structures, advanced).
 * @type {{ id: string, title: string, prompt: string }[]}
 */
export const LESSONS = [
  {
    id: "rec-call-stack",
    title: "One frame per call",
    prompt: [
      "2x2 quadrant poster about the call stack during countdown(3).",
      "Step 1 'Call': a single stack frame box labeled 'countdown n=3' resting on a baseline, with small fields inside reading 'n = 3' and 'return to: main'.",
      "Step 2 'Stack grows': four frames stacked vertically, bottom to top labeled n=3, n=2, n=1, n=0, each a distinct box, arrow pointing upward labeled 'on the way down'.",
      "Step 3 'Base case': the topmost frame n=0 highlighted with a stop marker, no new frame above it.",
      "Step 4 'Unwind': the same four frames popping off top-first, downward arrow labeled 'on the way back up', and beside it a small ordered list titled 'work after the call runs' reading 1, then 2, then 3 from top to bottom.",
      "Frames are plain rectangles with short labels only; no code text.",
    ].join(" "),
  },
  {
    id: "rec-base-case",
    title: "Shrink until you stop",
    prompt: [
      "2x2 quadrant poster about base case and recursive case.",
      "Step 1 'Two halves': one function box split into a top band labeled 'base case: answer directly' and a bottom band labeled 'recursive case: same function, smaller input'.",
      "Step 2 'Shrinking': a row of shrinking boxes 5, 4, 3, 2, 1, 0 with the 0 marked as the stop, arrows between them labeled 'n - 1'.",
      "Step 3 'Missed base case': the same row stepping by 2 from 3 to 1 to -1 to -3, sailing past a 0 marker, tinted red with a warning marker.",
      "Step 4 'No progress': a single box calling itself with an unchanged label, a circular arrow, tinted red.",
      "Plain numbers only, short sharp labels.",
    ].join(" "),
  },
  {
    id: "rec-vs-iteration",
    title: "Flat data, nested data",
    prompt: [
      "Two-column comparison poster: recursion versus a loop.",
      "Left column 'Flat sequence': a straight row of five numbered cells with a single circular loop arrow above them, badge 'loop: one frame'.",
      "Right column 'Nested structure': a small tree of nested boxes inside boxes, with arrows descending into each, badge 'recursion: one frame per level'.",
      "Bottom strip: a decision rule bar reading 'one successor per step, use a loop' on the left and 'several successors, recurse' on the right, with a small balance icon in the middle.",
      "Plain cells and boxes, no code text.",
    ].join(" "),
  },
  {
    id: "rec-accumulators",
    title: "Down or up",
    prompt: [
      "Two-panel poster contrasting the two ways a recursion builds an answer, over the list 4, 7, 1.",
      "Left panel 'Build it up': four stacked frames; downward arrows carrying only the index, upward arrows carrying partial sums 0, then 1, then 8, then 12, with the final total 12 emerging at the top.",
      "Right panel 'Carry it down': the same four frames, downward arrows carrying a running accumulator 0, 4, 11, 12, and one straight arrow from the deepest frame all the way back to the top labeled 'already done'.",
      "Clear arrow directions, plain numbers in each arrow label, no code text.",
    ].join(" "),
  },
  {
    id: "rec-tail-position",
    title: "Nothing left to do",
    prompt: [
      "2x2 quadrant poster about tail position.",
      "Step 1 'Not a tail call': a frame box with a small pending-work badge attached after the call arrow, labeled 'still has an addition to do'.",
      "Step 2 'Tail call': the same frame with an empty pending-work badge, labeled 'nothing left to do'.",
      "Step 3 'With elimination': a single frame reused over and over, one box with a recycling-style arrow, badge 'constant stack'.",
      "Step 4 'Here': a growing stack of identical frames with a crossed-out recycling arrow, badge 'frames still pile up'.",
      "Flat vector, short labels, no code text.",
    ].join(" "),
  },
  {
    id: "rec-depth-limits",
    title: "The stack has a ceiling",
    prompt: [
      "2x2 quadrant poster about recursion depth limits.",
      "Step 1 'The ceiling': a tall narrow column of stacked frames with a hard horizontal line across the top labeled 'limit', frames below it green and one frame crossing it in red.",
      "Step 2 'Depth, not count': side by side, a wide balanced tree of a million small nodes with a badge 'depth about 20, safe' and a long thin chain of nodes with a badge 'depth n, unsafe'.",
      "Step 3 'Degenerate shape': a balanced tree next to the same values inserted in sorted order forming a one-sided chain, arrow between them labeled 'sorted input'.",
      "Step 4 'Guard it': a frame with a small counter dial reading 'depth 200 max' and a rejected input arrow bouncing off it.",
      "Plain shapes, short correct labels, no code text.",
    ].join(" "),
  },
  {
    id: "rec-linked-lists",
    title: "Head, then the rest",
    prompt: [
      "2x2 quadrant poster about recursing over a linked list 1 to 2 to 3 to null.",
      "Step 1 'A list is a node plus a list': the chain drawn once, with a dashed bracket around nodes 2 and 3 labeled 'the rest, also a list'.",
      "Step 2 'Down': four stacked frames labeled head=1, head=2, head=3, head=null, arrow downward.",
      "Step 3 'Base case': the head=null frame marked with a stop and the value 0 returning from it.",
      "Step 4 'Up': the same frames unwinding, carrying partial sums 3, then 5, then 6, and beside it the print order 3, 2, 1 labeled 'work after the call'.",
      "Boxes-and-arrows node style, plain numbers only.",
    ].join(" "),
  },
  {
    id: "rec-binary-trees",
    title: "Three places to put the visit",
    prompt: [
      "Three-panel horizontal poster over the same small binary tree with root 5, left child 3 with children 1 and 4, right child 9 with right child 12.",
      "Panel 1 'Pre-order': the tree with visit order 5, 3, 1, 4, 9, 12 numbered on the nodes and a marker showing the visit happening before both recursive calls.",
      "Panel 2 'In-order': the same tree with visit order 1, 3, 4, 5, 9, 12 and a note that a BST comes out sorted.",
      "Panel 3 'Post-order': the same tree with visit order 1, 4, 3, 12, 9, 5 and a note 'children answer first'.",
      "Identical tree drawing in all three panels; only the numbering and the marker position differ. Circular nodes, clean edges, plain numbers.",
    ].join(" "),
  },
  {
    id: "rec-nary-trees",
    title: "A loop inside the recursion",
    prompt: [
      "2x2 quadrant poster about n-ary and file-system trees.",
      "Step 1 'Many children': one parent node with five children fanned out beneath it, a horizontal arrow across the children labeled 'loop' and downward arrows into each labeled 'recurse'.",
      "Step 2 'Directory tree': a folder icon tree, root folder containing two folders and a file, each folder containing files with byte sizes 120, 900, 10, 300.",
      "Step 3 'Sizes add up': the same tree with subtotals written on each folder and the root reading 1330, arrows pointing upward.",
      "Step 4 'Paths build down': the same tree with the full path text accumulating downward, /root then /root/docs then /root/docs/a.md.",
      "Plain folder and file icons, short correct labels, numbers only in the size fields.",
    ].join(" "),
  },
  {
    id: "rec-graphs",
    title: "The visited set is the base case",
    prompt: [
      "2x2 quadrant poster about recursing over a graph with a cycle.",
      "Step 1 'A cycle': four nodes a, b, c, d with edges a to b, a to c, b to d, c to d, and d back to a, the back edge drawn in red.",
      "Step 2 'Without a set': the same graph with a path looping round and round it, tinted red, badge 'never terminates'.",
      "Step 3 'Mark on the way in': the same graph with a side panel labeled 'visited' filling with a, b, d, c as each node turns solid.",
      "Step 4 'Path set': the same graph with a small set that adds a node on entry and removes it on exit, one arrow labeled 'add going down' and one labeled 'remove coming up'.",
      "Circular nodes with single letters, clean edges, no code text.",
    ].join(" "),
  },
  {
    id: "rec-nested-data",
    title: "Dispatch on the type",
    prompt: [
      "2x2 quadrant poster about walking nested data.",
      "Step 1 'Which is it?': one value entering a three-way splitter labeled array, object, and leaf, with the leaf branch marked 'base case'.",
      "Step 2 'Deep flatten': nested brackets containing 1, then 2, 3, 4, then 5, 6, collapsing into one flat row reading 1 2 3 4 5 6.",
      "Step 3 'Deep clone': two identical nested structures side by side with fresh-copy arrows at every level, and one arrow marked in red labeled 'missed level: still shared'.",
      "Step 4 'Paths': a small document tree with leaf labels reading .name, .meta.level, .tags[0], .tags[1], showing the path text growing downward.",
      "Plain values and short labels only, no code text.",
    ].join(" "),
  },
  {
    id: "rec-divide-and-conquer",
    title: "Split, solve, combine",
    prompt: [
      "2x2 quadrant poster about divide and conquer.",
      "Step 1 'Divide': an array of eight cells 5 2 9 1 6 3 8 4 splitting into two halves, then four, then eight single cells, drawn as an inverted tree.",
      "Step 2 'Combine': the same tree read upward, pairs merging into sorted runs and finally the full sorted row 1 2 3 4 5 6 8 9.",
      "Step 3 'Cost per level': the merge tree with a badge on each level reading 'n work' and a side note 'log n levels, so n log n'.",
      "Step 4 'One side only': a sorted row 1 3 5 7 9 11 13 with binary search discarding half each step, hatched-out halves, badge 'log n'.",
      "Plain numbers in cells, no code text.",
    ].join(" "),
  },
  {
    id: "rec-backtracking",
    title: "The decision tree",
    prompt: [
      "2x2 quadrant poster about backtracking.",
      "Step 1 'Choose': a decision tree over the items 1, 2, 3 where each level branches into take and skip, with the current path highlighted.",
      "Step 2 'Explore': the highlighted path descending to a complete leaf, with the built list shown beside it.",
      "Step 3 'Un-choose': the same path retreating one level, the last element visibly removed from the list, arrow labeled 'undo'.",
      "Step 4 'Prune': a 4 by 4 chessboard, rows labeled 1 to 4 top to bottom and columns 1 to 4 left to right, " + "with exactly two queens already placed: one on row 1 column 2, one on row 2 column 4. " + "Faint attack lines run from each queen down its own column and along both of its diagonals. " + "The four squares of row 3 are the candidates: row 3 column 1 is the only one marked legal with a green check; " + "row 3 column 2, row 3 column 3 and row 3 column 4 are all marked attacked with grey crosses. " + "Beside the board, a small decision tree with three greyed-out branches marked 'rejected before exploring' and one highlighted surviving branch.",
      "Clean tree drawing, plain numbers, short labels.",
    ].join(" "),
  },
  {
    id: "rec-memoization",
    title: "The call tree collapses",
    prompt: [
      "2x2 quadrant poster about memoized recursion for fib(6).",
      "Step 1 'Overlap': a call tree for fib(6) where the repeated subtrees for fib(4), fib(3) and fib(2) are tinted red, badge 'exponential'.",
      "Step 2 'Second base case': one node with two exits, one labeled 'too small' and one labeled 'already in cache', both marked as immediate returns.",
      "Step 3 'Collapsed': the same tree with the duplicate branches removed and replaced by short arrows into a key-value table reading 2 to 1, 3 to 2, 4 to 3, 5 to 5, badge 'one call per distinct input'.",
      "Step 4 'Not depth': a tall thin column of frames next to a full cache table, with the column still crossing a red limit line, caption 'the cache does not shorten the first descent'.",
      "Plain numbers only in the tables and nodes.",
    ].join(" "),
  },
  {
    id: "rec-explicit-stack",
    title: "Move the stack to the heap",
    prompt: [
      "2x2 quadrant poster about replacing the call stack with an explicit one.",
      "Step 1 'Two stacks': side by side, a narrow call-stack column with a hard ceiling line, and a wide heap-allocated list of entries with no ceiling.",
      "Step 2 'Push order': a small binary tree with root 5 and children 3 and 9, and a stack showing the right child pushed first and the left child on top, arrow labeled 'LIFO, so left pops first'.",
      "Step 3 'Same loop, different order': the identical diagram with the container relabeled queue, popping from the front, and the visit order changing from depth-first to level-order.",
      "Step 4 'Post-order needs a flag': stack entries drawn as pairs of node plus a small false/true marker, one entry pushed back with the marker flipped, labeled 'come back to me later'.",
      "Plain boxes and short labels, no code text.",
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
  console.log(`Usage: node scripts/gen-recursion-graphics.mjs [lesson-id ...] [options]

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
      "X-Title": "interview-sim recursion lesson graphics",
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
