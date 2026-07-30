import type { Article } from "./types";

export const trafficArticles: Article[] = [
  {
    id: "load-balancing",
    section: "traffic",
    title: "Load Balancing & Traffic Routing",
    blurb:
      "DNS, anycast, L4 vs L7, algorithms, health checks, sticky sessions, and how a request actually reaches your server.",
    appliesTo: ["url-shortener", "llm-chat-service", "realtime-chat", "video-streaming", "deployment-system"],
    content: `## The path a request takes

Before any of your code runs, a request has already been routed several times. Being able to narrate the chain is worth a lot in an interview:

\`\`\`text
client -> DNS (GeoDNS / anycast) -> edge PoP / CDN
      -> regional L4 load balancer -> L7 load balancer
      -> service instance
\`\`\`

**DNS** is the coarsest layer: cheap, cacheable, and slow to change because clients and resolvers honor TTLs badly. Use it to steer users to a region, never to fail over in seconds. **GeoDNS** answers with a region-appropriate IP; **anycast** advertises the same IP from many locations and lets BGP pick the nearest, which is how CDNs and DNS providers get sub-20ms first hops.

## L4 vs L7

**Layer 4** balances TCP/UDP connections by IP and port. It doesn't parse the request, so it's extremely fast, protocol-agnostic, and handles long-lived connections well. It cannot route by path, and it cannot retry a failed request (it doesn't know what one is).

**Layer 7** terminates the connection and understands HTTP. That unlocks path- and header-based routing, TLS termination, retries, request-level timeouts, rewrites, response caching, and per-route rate limits. It costs more CPU per request and adds a hop.

The common shape is L4 in front for raw distribution and connection handling, L7 behind it for routing intelligence. A **service mesh** pushes L7 concerns into a sidecar next to each service, which is the same idea applied to internal traffic.

## Algorithms, and when the naive one hurts

- **Round robin** — fine when requests are uniform. It falls apart when they aren't: one 30-second request per five 5ms requests means round robin keeps handing work to a saturated box.
- **Least connections** — a good default for variable request cost; naturally routes away from busy or degraded instances.
- **Least response time / peak EWMA** — weights by observed latency, so a sick instance sheds load automatically.
- **Consistent hashing on a key** — needed when locality matters: cache-friendly routing, session affinity, or pinning a chat room / document / GPU-resident conversation to one node. See [sharding](/library/sharding-and-partitioning) for the ring mechanics.
- **Random with two choices ("power of two")** — sample two backends, pick the less loaded. Nearly as good as global least-connections without global state, which is why it's popular in distributed proxies.

## Health checks and their subtleties

**Passive** checks watch real traffic for errors and timeouts; **active** checks poll an endpoint. You want both, and you want two distinct endpoints:

- **Liveness** — "is this process broken?" Failing it means restart.
- **Readiness** — "should this instance receive traffic *right now*?" Failing it means remove from the pool but don't kill: warming a cache, draining before shutdown, or dependency degraded.

Two traps worth naming. A health check that verifies its downstream database will fail on *every* instance when the database blips, taking the whole service out for a partial dependency failure — a self-inflicted total outage. And **connection draining** on deploys: stop new traffic, let in-flight requests finish (30–60 seconds), *then* terminate. Skipping it turns every routine deploy into a burst of 502s.

## Sticky sessions, and how to avoid needing them

Affinity by cookie or source IP keeps a user on one instance. Sometimes it's genuinely necessary — an in-memory WebSocket session, a GPU with a warm conversation cache. Mostly it's a smell: it breaks even load distribution, complicates deploys (every restart drops sessions), and means an instance failure loses user state. The alternative is stateless services with shared state in Redis or a database, which is why "make it stateless" is such a common early move.

## Scaling and admission

Autoscale on a signal that tracks queueing, not just CPU — request rate, concurrency, or queue depth. Two guardrails: scale-up should be fast and scale-down slow (flapping is worse than a little waste), and scaling has a **warm-up cost** (a new instance with a cold cache is briefly slower, so ramp its traffic).

When demand exceeds capacity and scaling can't happen in time, the load balancer is where you shed. Queue with a bounded depth, reject fast with \`429\`/\`503\` plus \`Retry-After\` rather than accepting work you'll time out on, and prioritize if the product has tiers. See [rate limiting](/library/rate-limiting) and [resilience](/library/failure-and-resilience).

> **In an interview:** if long-lived connections are involved (chat, streaming, collaborative editing), volunteer the connection-layer story — L4 for the connection, consistent hashing to pin the room, and what happens to the pinned state when that node dies. It's the part most candidates skip.`,
  },
  {
    id: "caching",
    section: "traffic",
    title: "Caching Strategies",
    blurb:
      "Cache-aside vs write-through, invalidation, TTLs, eviction, stampedes, hot keys, and the layers you already have.",
    appliesTo: ["distributed-cache", "url-shortener", "typeahead-search", "instagram-feed", "proximity-search"],
    content: `## The first lever, and the one that creates the subtlest bugs

Memory is ~1000× faster than SSD, so caching is usually the cheapest large win available. It's also where correctness quietly goes wrong, because a cache is a second copy of the truth with no transaction protecting it.

Layers you already have, before adding anything: the client, the CDN, an L7 proxy, an application-level in-process cache, a shared cache tier (Redis/Memcached), and the database's own buffer pool. Naming the layer you mean is part of the answer.

## Read patterns

**Cache-aside (lazy loading)** — the default. On a miss, read the database, populate the cache, return.

\`\`\`text
v = cache.get(k)
if v is None:
    v = db.read(k)
    cache.set(k, v, ttl)
return v
\`\`\`

Only requested data is cached, and a cache outage degrades to slow rather than broken. Costs: every miss pays both hops, and there's a window where the cache holds a stale value after a write.

**Read-through** — the same flow hidden behind the cache client, so callers only see \`get\`. Cleaner call sites; less control over per-query behavior.

**Refresh-ahead** — proactively refresh entries near expiry so hot keys never actually miss. Nice for a small set of very hot, predictable keys; wasteful if applied broadly.

## Write patterns

**Write-through** — write cache and database together, synchronously. Cache is never stale; every write pays both latencies and you cache data nobody may read.

**Write-behind (write-back)** — write to cache, acknowledge, flush to the database asynchronously. Fastest writes, absorbs spikes, and **can lose acknowledged writes** if the cache dies before flushing. Acceptable for view counters, unacceptable for money.

**Write-around / invalidate-on-write** — write the database and *delete* the cache key. The most common production choice, because deleting is idempotent and safe while updating a cache entry from a write path introduces ordering races. **Prefer invalidation over update.**

## Invalidation is the hard part

Three strategies, and you'll usually combine them:

- **TTL** — everything expires eventually. Simple, self-healing, and the bound on how wrong you can be. Pick a TTL from the product's staleness tolerance and *say the number*: 30 seconds for a listing price, 24 hours for an avatar.
- **Explicit invalidation on write** — precise, low staleness, but you must find every key that derives from the changed data. That's where bugs live: a user rename may invalidate hundreds of denormalized entries.
- **Versioned keys** — embed a version in the key (\`user:42:v7\`). Old entries become unreachable and age out naturally; no delete fan-out at all. Very effective for derived/composite objects.

Multi-region caches make this worse: an invalidation must reach every region, and until it does, different users see different data.

## Failure modes with names

**Thundering herd / stampede.** A hot key expires and 10,000 concurrent requests all miss and all hit the database. Fixes: a per-key lock or single-flight so one request recomputes while others wait; serve-stale-while-revalidate; and **jittered TTLs** so a batch of keys written together doesn't expire together.

**Hot key.** One key exceeds a single cache node's capacity. Fixes: replicate the key across nodes with a random read suffix, add a small in-process cache in front of the shared tier (very effective — the same key is served from local memory for its short TTL), or shard the value.

**Cache penetration.** Requests for keys that don't exist bypass the cache every time (often an attack). Fix: cache the negative result with a short TTL, or gate with a bloom filter.

**Cold start.** A restarted or resharded cache passes 100% of traffic to the database, which cannot take it. This is the classic total outage. Mitigations: consistent hashing so resharding moves only 1/N of keys, warming before taking traffic, and a request rate limit to the database so it degrades instead of dying.

## Sizing and eviction

Cache the working set, not the dataset: apply 80/20 and size for the hot fraction plus headroom. **LRU** is the sensible default; **LFU** resists a scan evicting your hot set; **TTL-only** is fine for pure freshness use. Watch the *hit rate* as a first-class metric — below ~80% on a read-heavy path, either the key design or the TTL is wrong. And measure the miss cost: a 95% hit rate on a 10ms cache with a 500ms miss still averages 34ms, so p99 is dominated by misses, not hits.

> **In an interview:** state what you cache, the key, the TTL, and the invalidation trigger — four specifics. Then volunteer the cold-start answer. "What happens when the cache is empty?" is the follow-up that separates people who've operated a cache from people who've read about one.`,
  },
  {
    id: "cdn-and-object-storage",
    section: "traffic",
    title: "CDNs, Edge & Object Storage",
    blurb:
      "Serving bytes at scale: edge caching, cache keys, invalidation, presigned uploads, and storage tiering.",
    appliesTo: ["video-streaming", "instagram-feed", "file-storage", "google-maps", "dropbox-sync"],
    content: `## Bytes don't belong on your application servers

Any design that serves images, video, files, or map tiles hits the same wall: egress bandwidth and per-request cost. 10k requests/sec × 500 KB is 5 GB/s — physically impossible from an origin fleet at sane cost, and trivially handled by a CDN. Say the number, then say "CDN," and you've justified it.

A **CDN** is a global fleet of caching reverse proxies. The client resolves to a nearby point of presence (anycast or GeoDNS), the PoP serves a cached copy or fetches from origin once and caches it for everyone behind it. What you buy: a ~10–30ms first byte instead of ~150ms cross-ocean, origin offload of 90%+, TLS terminated close to the user, and DDoS absorption as a side effect.

## Making the cache actually hit

- **The cache key matters.** By default it's the URL; every distinct query string is a distinct object. Normalize keys (strip tracking parameters, lowercase, drop irrelevant params) or your hit rate quietly collapses. Vary on \`Accept-Encoding\` and, if you serve different formats, on a normalized device class — but never on something high-cardinality like the raw user agent.
- **Immutable content plus content-addressed URLs is the cheat code.** Put a hash in the path (\`/img/9f2a…/photo.jpg\`), set \`Cache-Control: public, max-age=31536000, immutable\`, and you never need to invalidate: a new version is a new URL.
- **\`stale-while-revalidate\`** lets the edge serve a slightly stale copy while it refreshes in the background — the single best knob for latency on content that changes occasionally.
- **Tiered caching** puts a regional shield in front of the origin so a cold object is fetched from origin once, not once per PoP. Without it, a viral object can produce an origin thundering herd from 200 PoPs at once.

**Purging** is the escape hatch, not the plan. Global invalidation takes seconds to minutes and is rate-limited by providers. If your design needs frequent purges, the URLs are wrong.

## Object storage as the source of bytes

Object storage (S3, GCS) gives you effectively unlimited capacity, ~11 nines of durability, and a flat key space — and it is not a database: no transactions, no queries, tens of milliseconds per object. The pairing is invariant across every media system: **blob storage for bytes, a database for metadata** (owner, size, content hash, version, visibility).

Two upload patterns worth knowing precisely:

- **Presigned URLs** — your API returns a short-lived signed URL; the client uploads straight to storage. Your servers never touch the payload. Confirm completion via a storage event notification rather than trusting the client to report success.
- **Multipart upload** — large files split into parts (5 MB–5 GB each), uploaded in parallel, retried individually, then assembled server-side. This is what makes a 10 GB upload survive a flaky connection, and it's the same chunking that lets a sync client resend only the parts that changed.

**Content-addressed chunking** (hash each chunk, name it by its hash) buys deduplication, resumability, and cheap delta transfer in one move: identical chunks are stored once no matter how many users upload the same file, and a client resends only the chunks whose hashes changed.

## Tiering, lifecycle, and cost

Storage cost is dominated by how long you keep bytes at what temperature. Lifecycle rules move objects down tiers automatically (hot → infrequent access after 30 days → archival after 90), with retrieval latency going from milliseconds to minutes or hours as you descend. Two frequently-forgotten cost facts: **egress is usually the biggest line item** (which is another argument for a CDN, since CDN egress is cheaper than origin egress), and cold tiers charge for early deletion and per-retrieval.

Durability is not backup. Object storage protects you from disk failure, not from your own delete call — versioning plus a lifecycle rule, or cross-region replication, is what protects against that.

## The edge as compute

Edge functions run small amounts of logic at the PoP: auth checks, A/B bucketing, header rewrites, redirects, signed-URL generation, personalized cache keys. Powerful for cutting a round trip to origin, sharply constrained in CPU time, memory, and available state. Use it for decisions, not for your business logic.

> **In an interview:** for any media-heavy prompt, get to "presigned upload to object storage, metadata in the database, delivery through a CDN with content-hashed immutable URLs" quickly. It's the expected backbone, and clearing it fast leaves time for the parts that are actually specific to the product — transcoding, sync, or feed assembly.`,
  },
  {
    id: "rate-limiting",
    section: "traffic",
    title: "Rate Limiting, Backpressure & Load Shedding",
    blurb:
      "Token bucket vs sliding window, distributed counters, where to enforce, and what to do when you're already overloaded.",
    appliesTo: ["distributed-rate-limiter", "llm-chat-service", "notification-service", "web-crawler", "ticket-booking"],
    content: `## Three different problems

They get conflated, and separating them is most of the answer:

- **Rate limiting** — a *policy*: this client may make 1000 requests per minute. Protects fairness, prevents abuse, enforces quotas.
- **Backpressure** — a *mechanism*: a slow consumer tells a fast producer to slow down, so queues stay bounded instead of growing until something dies.
- **Load shedding** — a *survival tactic*: you are already over capacity, so drop the least valuable work immediately rather than accept everything and fail everything.

## Algorithms

**Fixed window.** Count requests per calendar minute. Trivial and memory-cheap, with a real flaw: a client can send the full limit at 11:59:59 and again at 12:00:00, achieving 2× the intended rate across the boundary.

**Sliding window log.** Store a timestamp per request, count those inside the trailing window. Exactly correct, and memory grows with request volume — fine for expensive endpoints, too costly at millions of QPS.

**Sliding window counter.** Interpolate between the previous and current fixed windows (e.g. 25% into the current minute, weight the previous by 75%). Approximate, fixed memory, no boundary burst. The usual production compromise.

**Token bucket.** A bucket of capacity B refills at R tokens/sec; each request takes one. Allows bursts up to B while enforcing average rate R, needs only two numbers per key (token count, last refill time), and matches how people think about quotas: "100/sec sustained, bursts to 500." **The default choice.**

**Leaky bucket (queue).** Requests queue and drain at a fixed rate. Smooths output completely — the right shape when the downstream truly cannot tolerate bursts (an SMS provider, a payment gateway) — at the cost of added latency and a queue that can fill.

## Making it distributed

Limits are per-client, but requests land on many servers, so the counter must be shared.

- **Centralized store (Redis).** All gateways increment the same key, typically with a Lua script or \`INCR\` + \`EXPIRE\` so check-and-update is atomic. Accurate, and it adds a network hop (about 1ms in-region) plus a dependency on the critical path. Handle *its* failure explicitly: fail-open (allow traffic, protect availability) or fail-closed (deny, protect the backend). Say which, and why.
- **Local counters with a shared budget.** Each node enforces \`limit / N\` locally with zero coordination. Fast and wrong at the edges — uneven load balancing means some clients get throttled early. Adequate for abuse prevention, not for billed quotas.
- **Local counters with async reconciliation.** Enforce locally, gossip or periodically sync usage, adjust local budgets. This is how you get sub-millisecond decisions at millions of QPS with acceptable accuracy: precise enough to stop abuse, and honest that it's approximate.

Getting to <10ms p99 at that scale means the decision is essentially local; only the *budget* is distributed.

## Where to enforce, and what to return

Enforce at the outermost layer that has the identity you're limiting on — usually the API gateway, since the cheapest rejected request is the one that never reaches your service. Add a second limit deeper in for expensive internal operations. Multiple dimensions usually apply at once (per API key, per user, per IP, per endpoint, plus a global backstop), and the most restrictive wins.

Be a good citizen in the response: \`429 Too Many Requests\` with \`Retry-After\`, plus \`X-RateLimit-Limit\`/\`-Remaining\`/\`-Reset\` so clients can self-pace. Distinguish \`429\` (you did too much) from \`503\` (we're overloaded) — they mean different things to a client's retry logic. And require jittered exponential backoff from your own clients, because synchronized retries are how a brief blip becomes a sustained outage.

## Shedding well

Under real overload, the goal is to keep p99 sane for the work you do accept:

- **Bounded queues everywhere.** An unbounded queue converts an overload into a latency collapse and then an out-of-memory crash.
- **Drop stale work.** If a request has been queued longer than its client timeout, the response is worthless — discard it instead of paying to compute it.
- **Prioritize.** Serve checkout before recommendations; serve paying tiers before free; serve reads before background jobs. Shedding without priorities means shedding revenue.
- **Degrade instead of failing.** Cached or generic results, fewer recommendations, no personalization. See [resilience](/library/failure-and-resilience).

> **In an interview:** name the algorithm *and* the coordination story *and* the failure mode. "Token bucket for burst tolerance, counters in Redis with an atomic script, fail-open on Redis failure because throttling accuracy matters less than availability here" covers all three in one sentence.`,
  },
];
