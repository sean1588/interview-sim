import type { Article } from "./types";

export const streamingArticles: Article[] = [
  {
    id: "queues-and-logs",
    section: "streaming",
    title: "Queues, Logs & Event-Driven Design",
    blurb:
      "Task queues vs replayable logs, partitions and consumer groups, ordering, retries, dead letters, and when async is wrong.",
    appliesTo: ["message-queue", "notification-service", "job-scheduler", "ad-click-aggregation", "video-streaming"],
    content: `## Two different things called "a queue"

**A task queue** (SQS, RabbitMQ, Celery) hands each message to one consumer, which acknowledges it and the message is deleted. Messages are gone once processed, delivery is competitive across workers, and per-message retry and visibility timeouts are built in. Right for work distribution: send this email, transcode this video, charge this card.

**A replayable log** (Kafka, Kinesis, Pulsar) is an append-only ordered sequence retained for a fixed window (hours to forever). Consumers track their own **offset** and can rewind. Many independent consumer groups read the same events at their own pace. Right for event streams that multiple systems care about: click events, database change capture, metrics.

The distinction decides whether "replay the last hour into a new consumer" is a five-minute operation or impossible. Choose deliberately.

## What async buys, and what it costs

Introducing a queue between producer and consumer buys four things:

- **Decoupling** — the producer doesn't know or care who consumes.
- **Load smoothing** — a 10× spike becomes queue depth instead of dropped requests.
- **Failure isolation** — a downstream outage delays work rather than failing the user's request.
- **Retry and durability** — the message survives a consumer crash.

It costs: **eventual consistency** (the effect hasn't happened when you respond), **duplicate delivery** (so consumers must be idempotent), **out-of-order arrival**, **no natural transaction** across producer and consumer, and a whole new operational surface (lag, poison messages, dead letters).

The right test is whether the user needs the result in the response. Charging a card: synchronous, the user must know it worked. Emailing the receipt: async, nobody blocks on SMTP. And "async so it's fast" is not a reason if the user still has to wait for the effect — you've only moved the wait somewhere less visible.

## Partitions, ordering, and consumer groups

A log is split into **partitions** for parallelism, and this is where the guarantees live:

- Ordering is **per partition**, never global. Messages with the same partition key land in the same partition and stay ordered relative to each other.
- Choose the key so that things that must be ordered share one: \`chat_id\` for messages, \`account_id\` for ledger entries, \`user_id\` for profile updates. Related events ordered, unrelated events parallel.
- Within a consumer group, each partition is consumed by exactly one member, so **partition count is your maximum parallelism**. More consumers than partitions means idle consumers. Partitions are cheap to over-provision at creation and awkward to add later (adding them changes the key→partition mapping).

**Rebalancing** happens when a consumer joins, leaves, or is presumed dead. It briefly stops consumption and reassigns partitions, which is why a consumer that takes too long between polls gets kicked out and triggers a rebalance — one of the most common self-inflicted lag problems. Long work belongs off the poll loop.

**Offset commits** define your delivery semantics. Commit before processing → at-most-once (crash loses the message). Commit after processing → at-least-once (crash reprocesses). See [delivery semantics](/library/delivery-semantics).

## Retries, poison messages, and dead letters

Retry with **exponential backoff and jitter**, and cap attempts. After the cap, move the message to a **dead letter queue** rather than retrying forever — an unprocessable message retried infinitely blocks its partition or burns the whole consumer's throughput. A DLQ is only useful if someone is alerted on its depth and there's a documented way to inspect and replay from it.

Distinguish retryable from terminal failures: a downstream timeout should be retried; a malformed payload or a validation failure should go straight to the DLQ, because 50 retries will fail identically.

## Consumer lag is the metric that matters

Lag — the gap between the newest offset and the committed one — is your early warning for the entire async subsystem. Alert on lag *and* on lag's derivative: steadily growing lag means consumption is permanently below production and no amount of waiting fixes it. When lag spikes, the levers are: add consumers (up to the partition count), make processing cheaper, batch downstream writes, or shed low-value events.

## Retention, compaction, and back-pressure

Time- or size-based **retention** bounds storage; **log compaction** keeps only the latest value per key, which turns a log into a replayable snapshot of current state (perfect for config or entity state distribution). If producers outrun both consumers and retention, unread messages are dropped — so decide whether the producer should be blocked (back-pressure into the request path) or the loss is acceptable. Say which.

> **In an interview:** when you add a queue, say what the user sees in the gap. "The upload returns 202 immediately; the client polls the job endpoint and the video appears in the library within about a minute" is a design. Drawing an arrow labeled "async" is not.`,
  },
  {
    id: "delivery-semantics",
    section: "streaming",
    title: "Delivery Semantics & Idempotency",
    blurb:
      "At-most-once, at-least-once, and why \"exactly-once\" means idempotent processing — plus dedup, outbox, and fencing.",
    appliesTo: ["payment-system", "ad-click-aggregation", "job-scheduler", "notification-service", "message-queue"],
    content: `## The impossibility you have to design around

A sender cannot distinguish "the message never arrived" from "the message arrived and the acknowledgement was lost." That's not an implementation gap; it's a property of unreliable networks. Every delivery guarantee is a choice about which error you prefer.

- **At-most-once** — send, don't retry. No duplicates, possible loss. Acceptable for a metrics sample or a presence heartbeat.
- **At-least-once** — retry until acknowledged. No loss, possible duplicates. **The default for anything that matters.**
- **Exactly-once** — no loss, no duplicates. Not achievable as a pure delivery guarantee across a network. Achievable as an *end-to-end effect*: at-least-once delivery plus idempotent or transactional processing.

So the real design question is never "how do I get exactly-once delivery." It's "what makes reprocessing this message harmless?"

## Making processing idempotent

Four techniques, in order of how often you'll reach for them:

**Natural idempotency.** \`SET status = 'shipped'\` is idempotent; \`increment count\` is not. Whenever you can express the operation as "put the world in state X" instead of "change the world by X," duplicates stop mattering. Look for this first — it's free.

**Deduplication by key.** Give every message a stable id derived from the event, not from the attempt (\`click:{user}:{ad}:{timestamp_ms}\`, not a UUID minted per retry). Record processed ids and drop repeats. The store needs a TTL matched to your retry window and a size bound — this is exactly where a [bloom filter](/library/probabilistic-structures) in front of a durable set earns its keep at high volume.

**Transactional write plus dedup mark.** Write the effect and the "id processed" record in the *same* transaction. If they're separate, a crash between them gives you either a duplicate effect or a lost one. Same-transaction is what makes the guarantee real.

**Conditional / compare-and-set writes.** \`UPDATE … WHERE version = 7\` or a unique constraint on \`(payment_intent_id)\` lets the database enforce once-ness. A unique index is the most reliable dedup mechanism most systems have, and it costs one line of schema.

## The dual-write problem and the outbox

The most common correctness bug in event-driven systems:

\`\`\`text
db.save(order)          # succeeds
queue.publish(event)    # crashes here -> order exists, nobody knows
\`\`\`

There is no ordering of two independent writes that fixes this. **The transactional outbox** does: within the same database transaction, insert the event into an \`outbox\` table alongside the business change. A separate poller (or change-data-capture stream) reads the outbox and publishes, marking rows as sent. Publishing may duplicate — hence at-least-once and idempotent consumers — but an event can never be lost or invented. The inverse, the **inbox pattern**, records consumed message ids to make the consumer side idempotent.

Kafka's transactions provide a variant of this *within* Kafka (consume→process→produce atomically, with the offset commit in the transaction), which is what "exactly-once processing" means in that ecosystem: it covers reads and writes inside the system, not the side effects you make outside it.

## Side effects you can't take back

Charging a card, sending an email, launching a rocket: idempotency must be pushed to the *external* boundary. Pass an idempotency key the provider honors (every serious payment API supports this), and record the outcome before doing anything else so a crash mid-flight is recoverable. For genuinely non-idempotent externals, the pattern is: persist "attempting", call, persist the result, and reconcile anything left in "attempting" with the provider's own records. Reconciliation isn't a fallback here — it's part of the design.

## Ordering and zombies

Duplicates aren't the only reprocessing hazard.

- **Out-of-order** — a retried message can arrive after a newer one. Guard state transitions with version numbers or timestamps and ignore stale updates (last-write-wins on version). Partition by the entity key so its events stay ordered in the first place.
- **Zombie workers** — a consumer that stalled (long GC, network partition) can wake up believing it still owns work that's been reassigned, and write over the new owner's results. The fix is a **fencing token**: a monotonically increasing number issued with ownership, which storage refuses to accept below its highest seen value. See [consensus and coordination](/library/consensus-and-coordination).

> **In an interview:** never say "exactly-once" without immediately saying how. "At-least-once delivery with a dedup key on \`(campaign_id, click_id)\` and the counter update in the same transaction as the dedup insert, so replays are no-ops" is the answer. And for anything financial, volunteer the reconciliation job — that's the detail that says you've shipped one.`,
  },
  {
    id: "stream-processing",
    section: "streaming",
    title: "Stream Processing, Windows & Watermarks",
    blurb:
      "Event time vs processing time, tumbling/sliding/session windows, late data, checkpointing, and lambda vs kappa.",
    appliesTo: ["ad-click-aggregation", "top-k-trending", "metrics-monitoring", "ride-sharing", "recommendation-system"],
    content: `## Aggregating an unbounded stream

Batch processing has an easy job: the input is finite, so "count the clicks" has a definite answer. A stream never ends, so every aggregate is over a **window**, and every window has to decide when it's allowed to be final. That single question — when do I stop waiting for more data — is what stream processing is about.

## Event time vs processing time

- **Event time** — when it happened, per the producing device.
- **Ingestion / processing time** — when your system saw it.

They differ by network delay, batching, retries, and offline devices. A phone in a tunnel emits clicks at 10:00 that arrive at 10:45. Aggregating by processing time is easy and produces *wrong* answers that shift depending on your infrastructure's behavior; aggregating by event time produces correct, reproducible answers and forces you to handle lateness.

Bill by event time. Alert on processing time (a metrics alert that waits for stragglers is a slow alert). Say which you're using — mixing them silently is a classic bug.

Event-time processing also means you can't trust client clocks: they're skewed, wrong, and occasionally adversarial. Clamp implausible timestamps and record both times so you can measure the gap.

## Window types

- **Tumbling** — fixed, non-overlapping ("per minute"). Each event belongs to exactly one window. The default for billing and dashboards.
- **Sliding / hopping** — fixed size, advancing by a smaller step ("5-minute window every 30 seconds"). Smoother curves, and each event lands in multiple windows, multiplying state.
- **Session** — dynamic, closed by a gap of inactivity ("user activity until 30 minutes idle"). Natural for engagement analysis, unbounded in length, and the most state-hungry.

For sliding windows over long spans, don't keep a window per step: keep small tumbling buckets and sum the buckets you need. "Last hour" becomes the sum of 60 one-minute buckets, and rolling it forward is one add and one subtract.

## Watermarks: the completeness signal

A **watermark** is the framework's assertion that no events with an event time earlier than T will arrive anymore — usually derived as "the maximum event time seen, minus an allowed lateness." When the watermark passes a window's end, the window fires.

The tradeoff is direct and worth stating explicitly: **allowed lateness trades latency for completeness.** A 10-second watermark delay means results are 10 seconds behind but include nearly everything; a 1-hour delay is much more complete and useless for a real-time dashboard.

For events later than the watermark, you have three options, and mature designs use more than one:

1. **Drop** them, and *count what you dropped* as a monitored metric.
2. **Update** the emitted result (requires a downstream that accepts corrections — an upsert, not an append).
3. **Route to a side output** for a slower reconciliation path.

This is exactly how ad billing works in practice: fast approximate counts drive dashboards and budget enforcement, while a nightly batch job over the durable log produces the invoice-grade number. Which brings us to the two architectures.

## Lambda vs kappa

**Lambda** runs a fast approximate streaming path *and* a slow accurate batch path over the same data, and serves a merge of the two. It's honest about the tradeoff and gives you a correct source of truth for billing and disputes; the cost is maintaining the same logic twice in two systems, which is where the bugs live.

**Kappa** keeps one streaming path over a replayable log; "recompute" means replay from the beginning with new code. Much simpler to reason about, requires long retention and a stream engine you trust with correctness and stateful upgrades.

Either way, the log is the source of truth. Aggregates are derived views, and being able to rebuild them from the log is the property that makes the whole design safe.

## Stateful processing, mechanically

Windowed aggregation means state per key per window, which can dwarf the event volume. Practical constraints:

- **State backend** — an embedded LSM store (RocksDB) local to each worker, keyed by partition.
- **Checkpointing** — periodic consistent snapshots of state plus offsets to durable storage. Recovery restores the snapshot and replays from the checkpointed offset, which is what makes at-least-once processing survivable. Checkpoint interval trades recovery time against steady-state overhead.
- **Keyed partitioning** — events for a key always route to the same worker, so state is local and never shared. Which makes hot keys a real problem: pre-aggregate or salt them (see [sharding](/library/sharding-and-partitioning)).
- **State TTL** — expire window state, or a session-window job over high-cardinality keys grows without bound.

When exact counting is too expensive, swap in a [sketch](/library/probabilistic-structures): HyperLogLog for unique visitors, count-min for heavy hitters. They're mergeable across shards and bounded in memory, and the accuracy loss is usually irrelevant to the decision the number drives.

> **In an interview:** say "event time, tumbling one-minute windows, 30-second allowed lateness, late events counted and reconciled by a nightly batch." That one sentence answers windowing, latency, correctness, and disputes — and it's the part interviewers on data-heavy prompts are actually probing for.`,
  },
  {
    id: "realtime-delivery",
    section: "streaming",
    title: "Real-Time Delivery: WebSockets, SSE & Fan-Out",
    blurb:
      "Polling vs long-poll vs SSE vs WebSockets, connection state at scale, presence, offline delivery, and fan-out.",
    appliesTo: ["realtime-chat", "collaborative-docs", "notification-service", "ride-sharing", "llm-chat-service"],
    content: `## Choose the weakest mechanism that meets the requirement

Pushing to clients is a spectrum, and complexity rises sharply along it. Start at the bottom and only move up when a requirement forces you.

- **Short polling** — client asks every N seconds. Trivial, stateless, cacheable, and wasteful: latency averages N/2 and most requests return nothing. Genuinely correct for slowly-changing data with loose latency needs.
- **Long polling** — server holds the request open until there's data or a timeout (~30s), then the client reconnects. Near-real-time over plain HTTP with no special infrastructure, at the cost of a held connection per waiting client and a reconnect per message.
- **Server-sent events (SSE)** — one long-lived HTTP response streaming server→client, with automatic reconnect and \`Last-Event-ID\` resumption built into the browser. The right default for one-way push: notifications, live counters, LLM token streams. It rides normal HTTP, so proxies, CDNs, and auth all behave.
- **WebSockets** — full-duplex, low per-message overhead, bidirectional. Necessary for chat, collaborative editing, multiplayer, and anything where the client sends frequently. You take on connection state, heartbeats, reconnection with backoff, sticky routing, and load balancers that must be configured for long-lived connections.

Choosing SSE over WebSockets when traffic is one-directional is a strong signal, because most candidates default to WebSockets reflexively.

## Connection state at scale

Once you hold millions of long-lived connections, the design becomes about *where the connection lives*:

- **Dedicated gateway tier.** Stateless business services behind a fleet whose only job is holding connections. Scale it independently — connection count and request rate are different axes.
- **A connection registry.** \`user_id -> {gateway_node, connection_id, device}\` in Redis, with a TTL refreshed by heartbeat so crashed nodes' entries expire. To deliver to a user, look up their node(s) and forward. Many users have several devices, so it's a set, not a value.
- **Per-node capacity.** Tens of thousands to ~100k connections per node is achievable with an event-driven server; memory per connection (buffers, TLS state) is the usual limiting factor. That number sets your fleet size — state your assumption.
- **Heartbeats.** Both directions, every 30 seconds or so, because TCP won't tell you about a client that vanished. Heartbeats detect the dead, keep NAT and proxy timeouts from silently killing idle connections, and feed presence.
- **Reconnect storms.** When a gateway node dies, all its clients reconnect at once. Jittered backoff on the client and admission control on the server are the difference between a blip and a cascade.

## Fan-out

Delivering one event to many recipients is the core routing problem:

- **Direct** (1:1 or small groups) — look up recipients, forward to their nodes. Straightforward.
- **Via pub/sub** — gateways subscribe to topics (\`chat:{id}\`, \`doc:{id}\`) and the publisher writes once; the broker handles the multiply. Decoupled and the usual answer for rooms and documents.
- **Room affinity** — consistently hash a room to one node so all its members share it, making fan-out node-local. Excellent efficiency for group chat and documents; the tradeoff is that losing that node disconnects the whole room, and one huge room can overload one node.

**Large fan-out needs different treatment from small.** A million-follower livestream chat can't do per-recipient delivery: sample or aggregate messages, batch them into bundles per interval, and accept that not every viewer sees every message. Say the threshold at which you switch strategies.

## Offline, ordering, and delivery guarantees

The connection is the fast path, never the source of truth. Persist first, then push — that's what makes the rest solvable:

- **Offline users** — messages land in durable per-conversation storage; on reconnect the client syncs from its last known sequence number. Push notifications (APNs/FCM) cover the "app not running" case, and they are best-effort, not a delivery guarantee.
- **Ordering** — assign a server-side monotonic sequence number per conversation. Clients order by it and can detect gaps, which is what makes resumption reliable. Client timestamps cannot do this job.
- **Acknowledgements** — sent → delivered → read is three separate state transitions with three separate writes, and read receipts at scale are a surprisingly heavy write workload (every reader × every message).
- **Idempotent sends** — the client's own retries need a client-generated message id so a resent message doesn't double-post. Same principle as [delivery semantics](/library/delivery-semantics).

**Presence** deserves its own caveat: it's high-churn, low-value data. Keep it in a TTL'd in-memory store, and fan status changes out to *interested* subscribers only (people currently viewing that user), otherwise a popular account's presence updates cost more than its messages.

> **In an interview:** the two moves that carry a real-time prompt are (1) persist-then-push, so the connection layer is an optimization rather than the guarantee, and (2) a connection registry keyed by user with heartbeat TTLs. Add "and here's what a client does after a 30-second disconnection" and you've covered what interviewers push on.`,
  },
];
