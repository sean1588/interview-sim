import type { Article } from "./types";

export const toolkitArticles: Article[] = [
  {
    id: "geospatial-indexing",
    section: "toolkits",
    title: "Geospatial Indexing",
    blurb:
      "Geohash, quadtrees, S2, and R-trees; nearby queries, dense cities vs empty countryside, and high-rate location updates.",
    appliesTo: ["proximity-search", "ride-sharing", "google-maps", "hotel-booking"],
    content: `## Why a normal index doesn't work

"Find everything within 5km of me" is a two-dimensional range query, and a B-tree index is one-dimensional. An index on \`(lat, lng)\` can narrow by latitude and then must scan every row in that band — the entire equatorial strip of the planet — to filter by longitude. Computing distance to every row (\`ORDER BY haversine(...)\`) is a full scan by definition.

Every geospatial index solves the same problem: **map 2D space onto a 1D ordering that mostly preserves locality**, so a proximity query becomes one or a few range scans.

## The approaches

**Geohash.** Recursively split the world in half (longitude, then latitude, alternating), emitting a bit each time, and base-32 encode the result. The output is a string where **a shared prefix means physical proximity**: \`9q8yy\` (~600m precision) is inside \`9q8y\` (~2.4km) is inside \`9q8\` (~20km).

Cell size falls roughly an order of magnitude every two characters: 4 characters is ~39km, 5 is ~5km, 6 is ~1.2km, 7 is ~150m — so precision is a single number you dial per use case.

It's a plain string, so it works in *any* database — Postgres, Redis sorted sets, DynamoDB — with no extensions. That's its great virtue. Two flaws matter: **edge cases at cell boundaries** (two points 10m apart can share no prefix if a boundary runs between them, so you must query the target cell *and its eight neighbors*), and **fixed cell sizes** that don't adapt to density.

**Quadtree.** Recursively subdivide a square into four children, but only where there's data — split a node when it exceeds a capacity threshold. Cells are therefore **small in Manhattan and enormous in Nevada**, which is exactly what you want: query cost tracks result count instead of area. The tradeoff is a tree structure to maintain (rebalancing on inserts) rather than a string you can put in any index.

**S2 (Google).** Project the sphere onto the six faces of a cube, then use a Hilbert curve to order cells within each face. Better locality preservation than geohash (the Hilbert curve has no long-range jumps), true spherical geometry with no distortion at the poles, and a hierarchy of 30 levels with well-defined cell ids and neighbor operations. This is what Google Maps and Uber-scale systems use. **H3** (Uber) is the hexagonal cousin: hexagons have uniform distance to all six neighbors, which is nicer for coverage and flow modeling.

**R-tree.** Nested minimum bounding rectangles. Unlike the others it indexes **shapes, not just points**, which makes it the right structure for "which delivery zone contains this address" or "which parks intersect this viewport." This is what PostGIS gives you (via GiST), and if you're already on Postgres it's usually the correct answer — don't hand-roll geohashing to avoid an extension.

## Querying nearby

The two-phase shape is the same regardless of index:

1. **Coarse filter** — find candidate cells covering the query circle (target cell plus neighbors, or the S2 cell covering at the right level), and fetch their contents. This is the index-driven step.
2. **Exact filter and rank** — compute real distances on the candidate set, drop those outside the radius, apply other filters, and sort.

The one design decision worth stating: **choose the cell level from your typical radius.** Too coarse and phase 1 returns thousands of candidates you filter in memory; too fine and you scan hundreds of cells. And to guarantee "the 20 nearest" rather than "the nearest within 5km," you may need to expand the radius progressively until you have enough results — a real detail in rural areas where the first ring is empty.

## Density: the asymmetry that breaks naive designs

Manhattan has thousands of restaurants per square kilometer; rural Montana has none for 50km. A fixed grid means one query returns 5,000 candidates and another returns zero. Adaptive structures (quadtree, S2 with variable level) handle this by construction; with geohash you handle it explicitly — use a finer precision in dense areas, or cap and paginate.

## High-rate location updates

Ride-sharing inverts the workload: millions of drivers each writing their position every few seconds is a **write-heavy** geospatial problem, and it needs different treatment from a read-heavy business directory.

- Keep the live index **in memory**, sharded by region (a Redis geo set or an in-process grid per city). Durability of an individual position is worthless — a location three seconds old is already stale.
- **Don't index every update.** Only move a driver between cells when they actually cross a boundary; most updates change nothing about the index.
- **Shard by geography** so a city's drivers and riders live on one node and matching is a local operation. Cities are natural, mostly-independent partitions — one of the cleanest partition keys in system design.
- **Read the immutable data from a cache**; business details change rarely while positions change constantly, so separate the two paths.

> **In an interview:** name the structure and the level/precision, then handle density and boundaries out loud. "S2 cells at level 13 (~1km), query the covering cells plus neighbors, then exact-distance filter — and I'll expand the ring in sparse areas until I have 20 results" is a complete answer to the retrieval half of any nearby prompt.`,
  },
  {
    id: "search-and-ranking",
    section: "toolkits",
    title: "Search, Typeahead & Ranking",
    blurb:
      "Inverted indexes, tries and prefix search, BM25 and learned ranking, vector/ANN retrieval, and freshness.",
    appliesTo: ["typeahead-search", "qa-platform", "web-crawler", "rag-support-bot", "hotel-booking"],
    content: `## The inverted index

A forward index maps document → terms. Search needs the opposite: **term → the documents containing it**, with positions so phrase queries work.

\`\`\`text
"design"  -> [doc3:pos2, doc7:pos0, doc9:pos5, …]
"system"  -> [doc1:pos4, doc3:pos1, doc9:pos4, …]
\`\`\`

A query intersects posting lists (AND) or unions them (OR). Lists are stored sorted and delta-compressed, and skip pointers let the intersection jump ahead rather than walk every entry. Documents pass through an **analysis pipeline** first — tokenize, lowercase, remove stop words, stem or lemmatize ("running" → "run") — and the query must use *the same* pipeline, or the terms won't match. That mismatch is the most common "why does search return nothing" bug.

Index-time work makes query-time cheap, so almost every trick (n-grams for substring search, phonetic keys for name matching, synonym expansion) is applied when writing.

**Sharding and replication**: shard documents across nodes, query every shard, merge the top-K. Replicas scale query throughput. Note the fan-out tax — your latency is the slowest shard's — so keep shard counts sane and consider tiering (search a small "hot/popular" index first and only fall through to the full index when needed).

## Typeahead is a different problem

Autocomplete needs <100ms for every keystroke, over prefixes, with ranking by popularity. That's a prefix-matching problem, not a relevance problem.

- **Trie** — each node a character, each terminal node a completion. Precompute and **cache the top-K completions at every node** so a lookup is a walk to the prefix node plus a constant-time read; without that you're traversing the whole subtree per keystroke.
- **Compact alternatives** — an FST (finite state transducer) or ternary search tree gets you the same behavior with a fraction of the memory, which matters because a trie over millions of phrases is memory-hungry.
- **Serving** — the trie is small enough to fit in memory on every node, so replicate rather than shard, and rebuild periodically rather than updating in place. A per-user cache and an aggressive CDN/edge cache on common prefixes both pay off, since prefix distribution is extremely skewed.
- **Typos** — edit-distance tolerance is expensive at query time; the cheap approach is precomputing common misspellings and indexing them as aliases.
- **Trending terms** need a fast path: a small, frequently-rebuilt overlay index merged with the main one at query time, because a full rebuild is too slow to reflect a breaking news term.

Debounce on the client (~50ms) and cancel superseded requests; a keystroke's result that arrives after the next keystroke is wasted work.

## Ranking

Retrieval finds candidates; ranking decides the order, and it's usually a funnel:

1. **Retrieve** thousands of candidates cheaply (posting-list intersection, ANN lookup).
2. **Score** them with a cheap function — **BM25** is the classic: term frequency, saturating so the twentieth occurrence adds little; inverse document frequency, so rare terms count more; and length normalization, so a short exact match beats a long document mentioning the term once.
3. **Re-rank** the top ~100 with an expensive model that can use features BM25 can't: click-through history, personalization, recency, quality signals, business rules.

The signals that matter are rarely purely textual. For a Q&A site, vote score and answer quality; for hotels, price, rating, availability, and commercial factors; for the web, link-based authority. The design point is that **ranking features live in a feature store** and are joined at serve time — see [ML serving](/library/ml-serving).

## Vector search

Embeddings put text (or images) in a vector space where semantic similarity is geometric proximity, so "how do I cancel my plan" matches a document titled "Subscription termination" with no shared keywords. Exact nearest-neighbor over millions of vectors is too slow, so you use **ANN**:

- **HNSW** — a navigable small-world graph; excellent recall/latency, higher memory.
- **IVF (+PQ)** — cluster into cells, search the nearest few; product quantization compresses vectors to a few bytes each, trading a little recall for a large memory saving.

Every ANN index is a **recall/latency/memory** tradeoff, tunable but never free — say which knob you're turning. In practice, **hybrid retrieval** wins: run BM25 and vector search in parallel and fuse the results, because keyword search nails exact terms, names, and error codes while embeddings handle paraphrase.

## Freshness

A search index is a derived view (see [indexes](/library/indexes)) and it lags. Decide the tolerance and design to it: near-real-time indexing (seconds) via a change stream for user-visible content; batch rebuild (hours) for large corpora; and a small hot overlay merged at query time when you need both. Always be able to rebuild from the source of truth, because you *will* change the analysis pipeline and need to reindex everything.

> **In an interview:** separate retrieval from ranking explicitly, and give the funnel widths ("ANN + BM25 retrieve 1,000, a gradient-boosted model re-ranks the top 100"). For typeahead, the phrase that lands is "trie with precomputed top-K per node, held in memory and replicated" — it shows you know the trick that makes the latency budget achievable.`,
  },
  {
    id: "probabilistic-structures",
    section: "toolkits",
    title: "Sketches: Bloom, Count-Min & HyperLogLog",
    blurb:
      "Trading a little accuracy for enormous memory savings — membership, frequency, cardinality, and heavy hitters.",
    appliesTo: ["top-k-trending", "web-crawler", "ad-click-aggregation", "distributed-cache", "metrics-monitoring"],
    content: `## The trade

Exact answers over billions of items need memory proportional to the items. Sketches give approximate answers in **fixed, tiny memory** — often kilobytes where exactness would need gigabytes — with a known, tunable error bound. The reason to know them is that they turn "impossible at this scale" into "a few megabytes per node," and reaching for one at the right moment is a strong signal in an interview.

The other reason: most of them are **mergeable**. Sketches computed independently on 100 shards can be combined into a sketch of the union, which is precisely what distributed aggregation needs.

## Bloom filter — set membership

A bit array plus k hash functions. To add an item, set the k bits it hashes to; to test, check those bits. **No false negatives, tunable false positives.** "Definitely not present" is certain; "probably present" needs verification.

About **10 bits per element gives ~1% false positives**; 15 bits gives ~0.1%. One billion URLs at 1% error is ~1.2 GB — versus hundreds of gigabytes for the actual strings.

The one-way nature is what makes it *safe* as an optimization: you only ever skip work you were certain was unnecessary. Uses:

- **Crawler URL dedup** — "have I seen this URL?" Billions of URLs, and a rare false positive just means skipping one page.
- **LSM read path** — per-SSTable filters skip files that can't contain the key. See [storage engines](/library/storage-engines).
- **Cache penetration guard** — reject lookups for keys that certainly don't exist before they reach the database.

Limitation: no deletes (clearing a bit could affect other members). **Counting Bloom filters** use small counters instead of bits to support deletion at 3–4× the space; **cuckoo filters** support deletes and are more compact at low error rates.

## HyperLogLog — cardinality

"How many *distinct* users watched this video?" Exact counting means storing every id. HLL instead hashes each item and tracks the maximum number of leading zeros seen: a long run of leading zeros is evidence of many distinct items (probabilistically, one in 2^k items has k leading zeros). Averaging that estimator across many registers gives **under 1% standard error in about 12 KB, regardless of whether the true count is a thousand or a billion.**

Two properties make it the standard for unique counting: it's **mergeable** (per-shard HLLs union by taking per-register maxima, so distributed unique counts are trivial), and its memory is constant. Redis implements it directly (\`PFADD\`/\`PFCOUNT\`).

Use it for unique visitors, distinct search terms, unique IPs per endpoint, reach metrics. Don't use it where the number is contractual — you cannot bill an advertiser on an estimate, though you can absolutely drive their live dashboard with one.

## Count-min sketch — frequency

A 2D array of counters with one hash function per row. Increment: bump one counter per row. Query: take the **minimum** across rows, since collisions only ever inflate a counter and the minimum is the least-polluted estimate. Result: frequency estimates that **never underestimate**, in fixed memory.

Perfect for "how often has this item appeared" over a stream where a per-item counter is too expensive: request counts per key for hot-key detection, per-user rates for approximate [rate limiting](/library/rate-limiting), and term frequency in a stream.

Caveat: it's unreliable for *rare* items (their estimates are dominated by collisions with frequent ones). It's a heavy-hitter tool.

## Top-K / heavy hitters

Exact top-K over millions of events per second is a hot-key problem by construction — a single global counter can't take the write rate. The standard composition:

1. **Per-shard approximate counting** — count-min sketch or Space-Saving/Misra-Gries per shard, each keeping a bounded set of candidates.
2. **Merge** the sketches and candidate heaps into a global approximate top-K.
3. **Optionally verify** the top few dozen exactly, since a small candidate set is cheap to count precisely.

That gets you trending hashtags over sliding windows at stream scale. Combine with the bucketed-window trick from [stream processing](/library/stream-processing): keep a sketch per one-minute bucket and merge the last 5, 60, or 1,440 of them to serve multiple window sizes from one pipeline — the mergeability is what makes that work.

## Two more worth naming

- **t-digest / DDSketch** — mergeable quantile sketches. This is how a metrics system reports a fleet-wide p99 without shipping every sample, and why you can't just average per-host percentiles (see [observability](/library/observability)).
- **MinHash / SimHash** — similarity sketches, used for near-duplicate detection: two web pages with nearly identical content produce nearly identical hashes, which is how a crawler drops boilerplate mirrors without comparing full documents.

> **In an interview:** the winning move is to volunteer both the sketch and the exact backstop. "HyperLogLog for the live unique-viewer counter at under 1% error; the nightly batch over the event log produces the exact number for reporting" shows you know when approximate is fine and when it isn't — which is the actual judgment being tested.`,
  },
  {
    id: "unique-ids",
    section: "toolkits",
    title: "Unique ID Generation",
    blurb:
      "Snowflake, UUIDv7, ticket servers, and short codes — sortability, clock skew, and index locality.",
    appliesTo: ["id-generator", "url-shortener", "twitter-x", "message-queue", "payment-system"],
    content: `## Four properties, in tension

Before choosing a scheme, decide which of these you actually need — you can't have all of them:

- **Uniqueness** across every generator, forever. Non-negotiable.
- **Sortability** by creation time. Enables cursor pagination, time-range scans, and "newest first" without a secondary index.
- **Coordination-free generation**, so no network call and no single point of failure on the write path.
- **Compactness / opacity** — short enough for a URL, and not leaking your total record count or growth rate to competitors.

## The options

**Database auto-increment.** Sequential, compact, perfectly index-friendly, and coordinated by a single writer — which is the problem: a bottleneck and a single point of failure, and it doesn't survive sharding (two shards both hand out 1, 2, 3). Fine for a single-primary application; not for a distributed one.

**UUIDv4.** 128 random bits, generated anywhere with zero coordination, collision probability negligible. Two real costs: **not sortable**, so you need a separate timestamp index; and **terrible index locality** — random inserts scatter across a B-tree, causing page splits and write amplification. On a big table that's a measurable throughput hit.

**UUIDv7 / ULID.** The modern default. A 48-bit millisecond timestamp followed by randomness, so ids are **time-sortable and coordination-free**, and inserts land at the right end of the index. ULID adds a 26-character base32 encoding that's lexicographically sortable as a string. If you don't have a specific reason to build something else, this is the answer.

**Snowflake.** 64 bits, laid out as:

\`\`\`text
 1 bit  unused (sign)
41 bits millisecond timestamp since a custom epoch  (~69 years)
10 bits machine/worker id                           (1,024 workers)
12 bits per-millisecond sequence                    (4,096 ids/ms/worker)
\`\`\`

That's **4 million ids/sec per worker**, roughly sortable by time, half the size of a UUID, and coordination-free *at generation time* — the only coordination is assigning each worker its id at startup (from ZooKeeper, etcd, or config). Fitting in 64 bits matters: it's a native integer everywhere, half the index size, and cheap to compare.

**Ticket server / block allocation.** A central service hands out *ranges* ("you own 10,000,000–10,000,999"), and each node allocates from its block locally. One network call per 10,000 ids instead of per id, sequential-ish for index locality, and a lost block just leaves a gap. A very practical middle ground.

## Snowflake's sharp edges

These are exactly what an interviewer probes:

- **Clock moving backwards.** NTP correction or a leap second can rewind the clock, and a Snowflake generator that emits an id with a past timestamp can duplicate one. The standard handling: detect it and **refuse to generate** (block, or fail fast) until the clock catches up, rather than risk a duplicate. Say this out loud — it's the canonical follow-up.
- **Sequence exhaustion.** More than 4,096 ids in one millisecond means waiting for the next millisecond. Acceptable; know it's the behavior.
- **Worker id assignment.** Reusing a worker id while the old holder is still alive breaks uniqueness. Use a coordination service with ephemeral ownership (see [consensus](/library/consensus-and-coordination)) rather than static config that can be copy-pasted onto two hosts.
- **"Roughly" sorted.** Ids from different workers in the same millisecond have no meaningful order between them. Fine for feeds, not for anything requiring a total order.
- **Leaked information.** The embedded timestamp is public. If ids appear in URLs, that reveals creation times — sometimes a genuine privacy or competitive concern.

## Short codes: a different problem

A URL shortener needs *short and opaque*, not sortable. Base62 (\`[a-zA-Z0-9]\`) gives 62^7 ≈ 3.5 trillion codes in 7 characters — plenty. Two approaches:

- **Encode a counter.** Take a Snowflake or ticket-server id and base62-encode it. Guaranteed unique, no collision check. But sequential ids produce *enumerable* codes — anyone can walk your entire link set. Fix by encoding a scrambled value: multiply by a large coprime modulo the space, or apply a format-preserving permutation, so codes are unguessable while remaining collision-free.
- **Random plus uniqueness check.** Generate 7 random characters and insert with a unique constraint; retry on conflict. Trivially opaque, and retry probability stays negligible until the space is quite full. Rely on the **database constraint**, never on a "does it exist?" read — that read-then-write is a race.

For user-chosen custom aliases, the same unique index is what makes concurrent claims safe; see [concurrency control](/library/concurrency-control).

> **In an interview:** default to "UUIDv7 unless we need 64-bit ids, then Snowflake." Then volunteer the clock-skew answer before it's asked. The whole id-generator question is a vehicle for "what happens when a clock moves backwards," and having the answer ready is most of the win.`,
  },
  {
    id: "ml-serving",
    section: "toolkits",
    title: "Recommendations, Embeddings & LLM Serving",
    blurb:
      "The candidate-generation → ranking funnel, feature stores, ANN retrieval, RAG pipelines, and serving models under latency budgets.",
    appliesTo: ["recommendation-system", "rag-support-bot", "llm-chat-service", "instagram-feed", "typeahead-search"],
    content: `## The funnel is the architecture

You cannot score 500 million items per request. Every recommendation and search-ranking system is therefore a funnel that gets narrower and more expensive at each stage:

\`\`\`text
corpus            100M+ items
  candidate gen   → ~1,000    cheap, high recall, parallel sources
  filtering       → ~800      already seen, blocked, region, safety
  ranking         → ~800 scored   one model pass per item
  re-rank/policy  → ~20 shown     diversity, business rules, exploration
\`\`\`

**Candidate generation** runs several cheap retrieval strategies in parallel and unions them: ANN lookup on an embedding of the user, items popular in their region, items from creators they follow, trending items, and a slice of unexplored content. Diversity of *sources* is what keeps the funnel from collapsing into a single feedback loop.

**Ranking** is one model pass over ~1,000 candidates, so the per-item budget is tens of microseconds. That constraint is why the two-tower architecture exists: item embeddings are precomputed offline, the user embedding is computed once per request, and retrieval becomes a dot product.

**Re-ranking** applies what a per-item score can't express: diversity (don't show eight videos from one creator), freshness, business rules, and **exploration** — deliberately showing uncertain content to gather signal. Without exploration, new items never get impressions and the system slowly starves. Bandit approaches (Thompson sampling, UCB) are the principled version.

## The feature store

A model is only as good as the features available at serve time, and the same features must be computed identically for training and serving. **Training/serving skew** — computing a feature one way in the batch pipeline and slightly differently in the online path — is the most common way a model that looked great offline underperforms in production. One definition, two execution paths, ideally generated from shared code.

- **Offline store** — historical values for training, with **point-in-time correctness**: the features as they were *at that moment*, not as they are now. Leaking future information into training is the second most common failure.
- **Online store** — a low-latency KV store (Redis, DynamoDB) serving current feature values in single-digit milliseconds, keyed by user and item.
- **Real-time features** — "videos skipped in the last 30 seconds" can't come from a batch job. They're computed in a stream processor and written to the online store within seconds. This is what makes a feed feel responsive to your behavior, and it's a strong thing to volunteer on a recommendation prompt.

## Embeddings and ANN retrieval

Embeddings map users and items into a shared vector space so that "similar" is "nearby." Retrieval is then approximate nearest neighbor over hundreds of millions of vectors — HNSW or IVF+PQ, tuned on the recall/latency/memory triangle (see [search and ranking](/library/search-and-ranking)).

Two operational realities worth naming: the index is large and **rebuilt periodically** (with incremental additions for new items in between), and **embedding versions must match**. Query vectors from model v2 searched against an index built with v1 return garbage silently — no error, just bad results. Version the index alongside the model and swap atomically.

## RAG: grounding a model in your documents

\`\`\`text
ingest:  documents → chunk → embed → vector index (+ keyword index)
serve:   query → retrieve top-k → assemble prompt → generate → cite
\`\`\`

Where these systems actually fail, in rough order of frequency:

- **Chunking.** Too small loses context, too large dilutes the embedding and wastes the context window. Structure-aware chunks (by section) with a little overlap beat fixed-size splits.
- **Retrieval quality.** This dominates output quality far more than model choice. Hybrid keyword + vector retrieval plus a cross-encoder re-rank of the top ~50 is the standard fix.
- **Freshness.** The index is a derived view; when a doc changes, its chunks must be re-embedded and replaced. Stale answers cited confidently are worse than no answer.
- **Tenant isolation.** Filtering by tenant *after* retrieval is a data leak waiting to happen. Partition the index per tenant, or apply the filter inside the ANN query.
- **Grounding and escalation.** Require citations, and define the "I don't know" path: low retrieval scores or low model confidence should hand off to a human rather than improvise.

## Serving models under a latency budget

LLM inference is the extreme case, and its economics differ from ordinary services:

- **The GPU fleet is the constraint**, not CPU or network. Requests queue for it, so admission control and queue management *are* the design.
- **Continuous batching** — the throughput lever. Add and retire sequences from an in-flight batch each step instead of waiting for a whole batch to finish, which keeps utilization high without adding much latency.
- **Two latency metrics, not one** — time to first token (what feels responsive; stream it) and inter-token latency (what determines whether reading feels smooth). Both belong in your SLO.
- **KV-cache locality** — routing a conversation's turns to the same node reuses its cached prefix. That's a strong argument for [affinity-based routing](/library/load-balancing), with a cost: state on the node.
- **Tiering and degradation** — route easy requests to a small model, hard ones to a large one; under load, shorten context, reduce max tokens, or shed free-tier traffic before paid.

## Knowing whether it works

Offline metrics (precision@k, NDCG, AUC) are for iteration speed, not truth. The truth comes from **online A/B tests on product metrics**, plus guardrails against the failure modes offline metrics can't see: filter bubbles, engagement-bait amplification, and cold start for both new users (fall back to popularity plus onboarding signals) and new items (exploration budget). And monitor for **drift** — a model silently degrades as behavior shifts, which is a monitoring requirement, not a modeling one.

> **In an interview:** lead with the funnel and its widths, then name the feature store and the real-time signal path. The differentiator on ML-flavored prompts is usually not modeling depth — it's knowing that training/serving skew, point-in-time correctness, and exploration are the things that decide whether the system works.`,
  },
  {
    id: "media-pipelines",
    section: "toolkits",
    title: "Uploads, Transcoding & Adaptive Streaming",
    blurb:
      "Chunked resumable uploads, the transcode pipeline, HLS/DASH and ABR, dedup by content hash, and delta sync.",
    appliesTo: ["video-streaming", "instagram-feed", "file-storage", "dropbox-sync"],
    content: `## Upload: never through your app servers

A 4 GB video must not be streamed through the service that also renders your API responses. The pattern, in full:

1. Client asks for an upload target; the API returns a **presigned URL** and an upload id.
2. Client splits the file into **chunks** (5–10 MB) and uploads them in parallel, straight to object storage, retrying individual chunks on failure.
3. Client (or storage event) signals completion; storage assembles the object.
4. A completion event enqueues processing and writes metadata to the database.

What each detail buys: parallelism gets you throughput on a lossy connection; per-chunk retry means a failure costs 10 MB, not 4 GB; **resumability** means the client asks which chunks are already present and sends only the rest, so a dropped connection at 90% doesn't restart. Validate a checksum per chunk and for the whole object — bytes do get corrupted in transit.

**Content-addressed chunking** is the multiplier here. Hash each chunk and name it by its hash, and you get three things at once: **deduplication** (a chunk already in storage is never uploaded again — enormously effective when many users share files), **integrity** (the name *is* the checksum), and **delta transfer** (only chunks whose hashes changed need sending). Fixed-size chunks are simple but shift-sensitive — inserting a byte at the start changes every subsequent chunk — so sync systems that care use **content-defined chunking** (a rolling hash chooses boundaries) so an edit only changes the chunks it touches.

## Transcoding

One upload must become many renditions: resolutions (240p–4K), codecs (H.264 for compatibility, VP9/AV1 for efficiency), bitrate ladders, thumbnails, and preview clips. This is embarrassingly parallel work if you structure it right:

- **Split the source into segments** (a few seconds each), transcode segments **in parallel across workers**, then stitch. A 2-hour film becomes thousands of independent tasks, so wall-clock time is bounded by fleet size rather than film length. Segments must be cut at keyframe boundaries or the pieces won't join cleanly.
- **A DAG of stages**, not one job: validate → segment → transcode per rendition → package → generate manifests → thumbnails → publish. Each stage is retryable and idempotent, keyed by \`(asset, rendition, segment)\` so a retry overwrites rather than duplicates. See [queues and logs](/library/queues-and-logs).
- **Prioritize.** A 30-second phone clip should not sit behind a feature film. Separate queues by expected duration, and consider publishing a low resolution first so the video is watchable in seconds while higher renditions finish.
- **Cost control.** Transcoding is CPU/GPU-heavy and is the dominant cost of a video platform. Only generate the full ladder for content that gets watched: encode a baseline immediately, and produce expensive renditions (AV1, 4K) lazily once a video shows traction. Spot/preemptible instances suit segment-level work because a lost segment is a cheap retry.

## Adaptive bitrate delivery

The media is packaged into short segments (2–10 seconds) plus a **manifest** listing available renditions (HLS's \`.m3u8\`, DASH's \`.mpd\`). The **player** measures its throughput and buffer level and picks the next segment's quality — so adaptation lives on the client, and the server just serves files.

Consequences that make this design so effective: segments are **static, immutable files**, so a CDN caches them perfectly and delivery becomes a solved problem; startup is fast because the player begins at a low rendition and steps up; and a bandwidth drop degrades quality instead of stalling. Design targets worth knowing: **start playback in under 2 seconds**, keep 10–30 seconds buffered, and switch renditions only at segment boundaries. Live streaming uses the same machinery with short segments and a rolling manifest, trading latency against buffer safety.

## Metadata, versioning, and sync

The database holds what the bytes can't: owner, size, content hash, rendition status, visibility, and version history. Versioning is cheap when storage is content-addressed — a version is a new list of chunk hashes, and unchanged chunks are shared, so keeping full history costs only the deltas.

For **file sync** across devices, the same primitives compose into a protocol:

- Each client keeps a local index of path → chunk hashes and a server **sync cursor**.
- Local change detection (filesystem watcher, with a full rescan as the backstop) computes new hashes; the client uploads only unknown chunks, then commits a new file version.
- Other devices poll or get pushed a cursor advance and pull only changed metadata, then only missing chunks.
- **Conflicts** — two devices editing from the same base version — are detected by version, not timestamp. General binary files can't be merged, so the honest resolution is a **conflict copy** ("report (Sean's conflicted copy)"), which is exactly what Dropbox does. Only structured formats support true merge, via the CRDT and operational-transform approaches sketched in [consistency models](/library/consistency-models).
- **Batching and rate control** matter more than raw speed on laptops and phones: coalesce rapid edits, back off on battery, and cap concurrent transfers so sync doesn't saturate the user's uplink.

Large **shared folders** are the scaling edge: one member's change must fan out to thousands of others, so the notification is a cursor bump per member (cheap, fan-out on write to a lightweight index), never a copy of the data.

> **In an interview:** the backbone to state fast is "presigned chunked upload to object storage, content-addressed chunks for dedup and resume, segment-parallel transcode via a job DAG, HLS/DASH segments served from a CDN." Clearing that in two minutes leaves time for the part they actually want to dig into — the transcode DAG's failure handling, or sync conflict resolution.`,
  },
];
