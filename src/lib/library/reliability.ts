import type { Article } from "./types";

export const reliabilityArticles: Article[] = [
  {
    id: "failure-and-resilience",
    section: "reliability",
    title: "Timeouts, Retries & Circuit Breakers",
    blurb:
      "How distributed systems actually fail, and the small set of patterns that keep one broken dependency from taking everything down.",
    appliesTo: ["payment-system", "notification-service", "llm-chat-service", "rag-support-bot", "deployment-system"],
    content: `## Partial failure is the normal state

At any real scale something is always broken: a disk is dying, a node is unreachable, a dependency is slow, a deploy is half-rolled-out. The design question is never "how do I prevent failure" but **"what does the product do while this is broken, and how do I stop it from spreading."**

The most dangerous failure isn't a crash — it's a service that responds *slowly*. Crashes are detected in milliseconds and routed around. Slowness quietly consumes every caller's threads, connections, and patience, and propagates upward until the whole system is unavailable while every individual component reports itself "up."

## Timeouts: the foundation

No network call may be unbounded. A missing timeout is how one slow dependency exhausts your thread pool and turns a partial failure into a total one.

- Set timeouts from the **observed p99**, not from hope — roughly p99 plus headroom. A timeout longer than your caller's timeout is useless work.
- **Budget them down the stack.** If the user-facing request has 1 second, an internal call can't have 3. Pass the remaining budget along (a deadline, not a per-hop timeout) so nobody starts work that's already too late.
- **Separate connect and read timeouts**; a connect timeout should be aggressive (hundreds of ms), a read timeout matched to the work.

## Retries, and how they cause outages

Retries fix transient failures and amplify systemic ones. A struggling service that receives 3× traffic because every caller retries does not recover — that's a **retry storm**, and it's a leading cause of outages that outlast their trigger.

Rules that make retries safe:

- **Only retry idempotent operations**, or operations carrying an idempotency key.
- **Exponential backoff with jitter.** Without jitter, retries synchronize into waves that hammer the recovering service in lockstep.
- **Cap attempts** (2–3), and never retry in more than one layer. Three layers each retrying three times is 27 requests for one user action.
- **Only retry retryable errors.** A \`400\` or a validation failure will fail identically forever.
- **Retry budgets** are the industry-strength version: allow retries only while they're under ~10% of total requests, so retries vanish exactly when the system is broadly unhealthy — which is when they hurt most.

## Circuit breakers and bulkheads

A **circuit breaker** watches a dependency's error rate. Past a threshold it **opens**: calls fail instantly without touching the network. After a cooldown it goes **half-open**, letting a trickle through to test recovery, then closes if they succeed. Two wins: the caller stops burning resources on a doomed call, and the dependency gets the breathing room to recover. Pair every open breaker with a defined fallback — cached data, a degraded response, or a clean error.

A **bulkhead** isolates resources so one dependency can't consume them all: a separate connection pool and thread pool per downstream, with hard concurrency caps. Without it, the recommendation service's slowness eats the connection pool that checkout also needs. Named after ship compartments, and the metaphor is exact — the flooding is contained to one compartment.

## Degrade instead of failing

Rank features by what the product can survive without, and decide in advance what gets dropped:

- Feed can't personalize → serve the popular/chronological fallback.
- Recommendations are down → show nothing there; the page still works.
- Search is down → show recent items and say search is unavailable.
- The write path is down → read-only mode with an honest banner beats a 500.

This ranking is a *product* decision that belongs in the design, not an improvisation during an incident.

## Failure modes worth naming by name

- **Cascading failure** — one component fails, its load moves to the survivors, they fail too. Mitigate with load shedding, circuit breakers, and capacity headroom (never run a pool at 95%).
- **Thundering herd** — synchronized retries or simultaneous cache expiry. Mitigate with jitter everywhere.
- **Metastable failure** — the trigger is gone but the system stays down, held there by its own retry and cache-miss load. This is why recovery sometimes requires shedding load or a cold start with a warm cache: you must break the feedback loop, not just fix the original cause.
- **Gray failure** — a node that's slow, dropping some requests, or corrupting a fraction, while passing health checks. The reason health checks should probe real work, and why outlier detection (eject the instance whose latency is 3× its peers) matters.
- **Poison pill** — one input that crashes every consumer that touches it. Bound retries and dead-letter it.

## Blast radius

Design so that no single failure can affect everyone. **Cells** (independent stacks each serving a slice of users), **shuffle sharding** (each customer assigned an overlapping random subset of resources, so one abusive tenant rarely shares a full set with any other), and **staged rollouts** all limit exposure. "One bad config reached every server simultaneously" is the story behind a remarkable number of large outages — the fix is that config deploys are staged like code deploys (see [safe deploys](/library/deploys-and-rollouts)).

Then verify: **chaos testing** and game days, because a failure path that has never been exercised is a hypothesis, not a mitigation.

> **In an interview:** don't recite the list. Pick the two dependencies most likely to fail in *this* design and say concretely what happens: "if the recommendation service times out at 100ms, the breaker opens and we serve the trending list; the page never fails on it." Specific degradation beats a catalogue of patterns.`,
  },
  {
    id: "multi-region",
    section: "reliability",
    title: "Multi-Region & Disaster Recovery",
    blurb:
      "Active-passive vs active-active, the physics of cross-region latency, data residency, and honest RPO/RTO targets.",
    appliesTo: ["realtime-chat", "kv-store", "video-streaming", "payment-system", "google-maps"],
    content: `## Start by asking why

Going multi-region costs a lot of complexity, so name the driver, because each one implies a *different* architecture:

- **Latency** — users are global and a 150ms cross-ocean round trip is unacceptable. Often solved by putting *reads* and static content near users (CDN + read replicas) while writes stay in one region. Much cheaper than multi-region writes.
- **Availability / disaster recovery** — survive losing a region. Needs data continuously replicated elsewhere and a tested failover, not necessarily local writes.
- **Data residency** — regulation requires EU data to stay in the EU. This is a *partitioning* requirement, not a replication one: shard by region and keep the data home.

Conflating these produces the worst outcome — global write conflicts you didn't need, taken on to solve a read-latency problem.

## The physics you can't design around

Cross-country is ~60ms round trip; intercontinental is 150–250ms. That's speed of light in fiber plus routing, and no engineering removes it. Consequences:

- A synchronous write quorum spanning continents costs 150ms+ *per write*. Sometimes that's the right call (correctness first) but it must be a stated decision.
- Sequential cross-region calls compound. Two round trips and you've blown a 300ms budget.
- **Replication lag between regions is normally tens to hundreds of milliseconds and can be seconds.** Any read from a remote replica may be stale by that much.

## The patterns

**Active-passive (warm standby).** All writes to one primary region, continuous async replication to a standby that serves nothing (or reads only). Simplest to reason about: one write path, no conflicts. Failover is a deliberate, ideally practiced, operation. Async replication means failover can lose the last few seconds of writes (RPO > 0).

**Active-active, partitioned by user.** Every region is live, but each *record* has a home region — users are assigned one, and their writes always go there. No conflicts (single writer per record), local latency for your own users, and full utilization. The cost is routing: requests must reach the right region, and cross-user operations (a US user messaging an EU user) span regions. **This is the sweet spot for most global products**, and it's the answer that shows you know conflict-free doesn't require global consensus.

**Active-active, any region writes anything.** Genuine multi-leader replication. Maximum availability and locality, and you have signed up for **write conflicts as routine events** — resolved with CRDTs (automatic, limited to certain data types), last-write-wins (simple, silently loses updates), or application merge. Only take this on when the requirement demands it.

**Globally distributed database** (Spanner, CockroachDB, DynamoDB global tables). Push the problem into infrastructure. Real, and honest about its cost: strongly consistent cross-region writes pay the consensus round trip, so you're buying convenience, not free speed.

## Failover mechanics

- **DNS-based** — simple, but client and resolver caching means minutes, not seconds. Fine for planned failover.
- **Anycast / BGP** — seconds, and requires network-level infrastructure.
- **Global load balancer with health checks** — the common managed answer, tens of seconds.

The parts people forget: **the database must be promoted too** (an app tier pointed at a dead primary is not a failover); **capacity must exist** in the surviving region *before* the incident, because scaling up during a regional outage means competing with everyone else doing the same; and **failing back** is often harder than failing over, since the recovered region's data has diverged.

## RPO and RTO, stated honestly

- **RPO** (recovery point objective) — how much data you may lose. Async replication → RPO equals your replication lag, so seconds. Synchronous → zero, at a latency cost.
- **RTO** (recovery time objective) — how long you may be down. Automatic failover → tens of seconds. Manual runbook → tens of minutes, honestly.

Give numbers, and give them for a *tested* path. An untested failover has an unknown RTO, and that's the real answer for most systems.

## What must be global anyway

A few things resist regional partitioning and need explicit handling: **unique identifiers** (use a scheme that embeds the region or is coordination-free — see [unique IDs](/library/unique-ids)); **uniqueness constraints** like usernames (usually one global service, or accept a brief reservation window); **rate limits and quotas** (per-region budgets that sum to the global limit, reconciled asynchronously); and **config and feature flags**, which need a staged, per-region rollout precisely because a bad global config push is the fastest way to a global outage.

> **In an interview:** propose the cheapest topology that meets the stated requirement — usually active-passive for DR, or active-active partitioned by user for global latency. Then give RPO and RTO with numbers. Jumping to multi-leader everywhere signals you haven't priced the conflict resolution you just bought.`,
  },
  {
    id: "observability",
    section: "reliability",
    title: "Observability, SLOs & Alerting",
    blurb:
      "Metrics, logs, and traces; why percentiles beat averages; cardinality limits; and alerts that mean something.",
    appliesTo: ["metrics-monitoring", "deployment-system", "llm-chat-service", "job-scheduler", "ad-click-aggregation"],
    content: `## Three signals with different economics

- **Metrics** — pre-aggregated numeric time series with labels. Cheap, compact (~1–2 bytes per point after compression), and the basis for dashboards and alerts. They tell you *that* something is wrong.
- **Logs** — discrete events with detail. Expensive at volume, essential for the specifics. Structured (JSON, queryable fields) beats free text every time; sample the high-volume happy path and keep all errors.
- **Traces** — the causal path of one request across services with per-span timing. The only signal that answers "which of these nine hops is slow." Sampled — head-based (decide up front, typically 0.1–1%) or tail-based (buffer, keep the interesting ones, which catches the slow and failed requests you actually want).

The unifying practice is **correlation**: a request id propagated everywhere, so a metric anomaly leads to traces, which lead to logs, which lead to the line of code. Without that thread you have three disconnected haystacks.

## Averages lie

An average response time hides everything that matters. If 99% of requests take 10ms and 1% take 5 seconds, the mean is 60ms and looks great — while one user in a hundred is having a terrible time. Always **p50, p95, p99, p99.9**.

Two facts that follow, and both are worth saying out loud in an interview:

- **A page that makes 100 backend calls will hit its dependency's p99 on most page loads.** Tail latency at the component level becomes typical latency at the user level — which is why fan-out width matters so much.
- **Percentiles don't average.** You cannot take the mean of per-host p99s and get the fleet p99. Aggregate from histograms (fixed buckets, mergeable), which is exactly why metrics systems store histograms rather than computed percentiles.

Prefer **histograms** over gauges for latency, and measure at the boundary the user experiences, not just inside the service.

## Cardinality is the cost model

A time series exists for every unique label combination. \`http_requests{service, endpoint, status, region}\` with 20 services × 50 endpoints × 10 statuses × 5 regions is 50,000 series — fine. Add \`user_id\` and you have millions, and the metrics system falls over. **Never put unbounded values in labels**: user id, request id, URL with parameters, email, session. Those belong in logs and traces, which are indexed for exactly that.

This is the single most common way people break a metrics pipeline, and it's why "the tag cardinality explosion problem" is a stock system design follow-up. Defenses: enforce label allow-lists at ingestion, cap series per tenant, and alert on cardinality growth itself.

## SLIs, SLOs, and error budgets

- **SLI** — the measurement: "proportion of requests served successfully in under 300ms."
- **SLO** — the target: "99.9% over 30 days."
- **Error budget** — the permitted failure, 0.1% ≈ **43 minutes per 30 days**. Spend it deliberately: ship fast while the budget is healthy, freeze risky changes when it's nearly gone.

Choose SLIs the user actually feels (request success and latency, freshness for pipelines, correctness for billing), not internals like CPU. And don't over-promise: every additional nine costs roughly an order of magnitude more effort, and your SLO can never exceed your dependencies' combined availability.

## Alerting that people don't learn to ignore

Alert on **symptoms**, not causes. "The checkout success rate dropped below 99%" is actionable; "CPU is at 80%" is not — 80% CPU with healthy latency is a well-utilized machine.

- Every page must be **urgent, actionable, and user-visible**. If nobody needs to act tonight, it's a ticket or a dashboard, not a page.
- Use **multi-window burn-rate alerts** on the error budget: a fast window (consuming budget 14× too fast over an hour) catches acute breakage, a slow window (2× over six hours) catches slow bleeds. This is what replaces brittle static thresholds.
- **Alert fatigue is a real outage cause.** A team that receives 50 noisy pages a week will miss the real one. Deleting a bad alert is a reliability improvement.
- Include what the responder needs: what broke, what the user impact is, and a link to the dashboard and runbook.

## Monitoring must survive the outage

The monitoring system cannot depend on the systems it monitors — a shared database means you go blind exactly when you need to see. Run it in a separate failure domain, with an independent alerting path, and use black-box probes from outside your infrastructure so you learn about a total outage from your own tooling rather than from users. Also monitor the absence of signal: "no metrics received from region X for two minutes" is one of the most important alerts you can have.

> **In an interview:** volunteer one SLO with numbers and one alert that would have caught the failure you just described. "p99 under 300ms at 99.9% availability; we page on error-budget burn rate, not raw CPU" shows you'd operate the thing you designed — a dimension most answers skip entirely.`,
  },
  {
    id: "deploys-and-rollouts",
    section: "reliability",
    title: "Safe Deploys: Canaries, Flags & Rollback",
    blurb:
      "Staged rollouts, blue-green vs canary, feature flags, schema migrations, and why config deploys need the same care as code.",
    appliesTo: ["deployment-system", "recommendation-system", "collaborative-docs", "metrics-monitoring", "twitter-x"],
    content: `## Deploys are the leading cause of incidents

Most outages are self-inflicted and correlate with a change. So the goal isn't to deploy less — it's to make each deploy affect few users, be detected fast, and be reversible in seconds. Every technique below serves one of those three.

## Rollout strategies

**Rolling update.** Replace instances in batches, respecting a minimum healthy count. Cheap and the default in orchestrators. During the rollout two versions serve simultaneously — which is a constraint on your code, not an accident (see compatibility below).

**Blue-green.** Stand up a complete second environment, cut traffic over at the load balancer, keep the old one warm. Rollback is a traffic switch (seconds), and there's no mixed-version window for the app tier. Costs double capacity briefly, and the shared database still spans both versions.

**Canary.** Route a small slice — 1%, then 5%, 25%, 100% — to the new version and *compare metrics between the two populations* at each step. The best signal-to-cost ratio available, because you find bad versions with 1% of users affected instead of 100%. Make it useful with three details: bake time long enough for real signal (minutes, not seconds), automated comparison against the control (error rate, latency, business KPIs), and automatic rollback on regression rather than waiting for a human.

Canary catches most bad code and misses two things: problems that only appear at full load, and slow-burn issues (a leak that surfaces after hours). Keep watching after 100%.

## Version compatibility is a hard requirement

During any rollout, old and new run at once, so **every change must be backward compatible with the version it's replacing, in both directions**. That forces multi-phase changes:

- **Adding a field**: deploy readers that tolerate it → deploy writers that emit it. Never the reverse.
- **Removing a field**: stop reading → deploy → stop writing → deploy → drop.
- **Renaming anything**: add the new, dual-write, migrate readers, stop writing the old, remove. There is no atomic rename in a distributed system.

**Schema migrations** deserve the same discipline, plus one rule: **migrations must be forward-only and additive**, because rolling back code is easy while rolling back a destructive schema change is a restore-from-backup. Expand-migrate-contract is the pattern (add the new column, backfill in batches, dual-write, switch reads, drop the old one in a much later deploy). Long-running backfills need throttling and resumability — an unthrottled backfill on a hot table is its own outage.

## Feature flags

Flags decouple *deploy* from *release*: ship dark, enable for internal users, ramp by percentage, kill instantly without a deploy. They also enable A/B testing and per-tenant rollout.

The discipline that keeps them from becoming the problem:

- **Flags at the boundary, not scattered deep.** A flag checked in twelve places has twelve behaviors and no meaning.
- **Every flag has an owner and an expiry.** Stale flags multiply the number of code paths that exist and nobody tests the combinations. Removing a flag is part of finishing the feature.
- **Fail to a safe default** when the flag service is unreachable — usually "old behavior."
- **Flag changes are deploys.** They need staged rollout, an audit trail, and monitoring. A flag flipped globally at once is exactly as dangerous as a global code push.

## Config is the underrated risk

Code goes through review, CI, and staged rollout. Config too often goes everywhere at once — and a bad config reaches every server in seconds, which is why config pushes are behind a striking share of large-scale outages. Treat config as code: version it, validate the schema *before* distribution, stage it region by region, and give it the same automatic rollback. Distributing config through a consensus-backed store (see [consensus](/library/consensus-and-coordination)) buys you an ordered history and a rollback target.

## Detecting bad versions fast

- **Health and readiness gates** on every step, so a batch that doesn't come up healthy stops the rollout.
- **Automated metric comparison** between canary and control — the deploy pipeline should hold the rollback trigger, not a human watching a dashboard.
- **Version-tagged everything.** Every metric, log, and trace carries the build id, so "which version is erroring" is a filter, not an investigation.
- **Fast rollback as a first-class path.** Keep the previous artifact warm and pre-staged; measure rollback time and practice it. A rollback that takes 20 minutes because artifacts must be rebuilt is not a rollback.

For a global fleet, artifact distribution itself is a scaling problem: a peer-to-peer or hierarchical mirror scheme, since tens of thousands of nodes pulling a large binary from one origin is a self-inflicted denial of service.

> **In an interview:** for any deploy-flavored prompt, the shape of a strong answer is "1% canary with automated metric comparison, 30-minute bake, automatic rollback, staged per region — and config takes the same path as code." Then mention the expand-migrate-contract database rule, which is the part most people forget when they say "just roll back."`,
  },
];
