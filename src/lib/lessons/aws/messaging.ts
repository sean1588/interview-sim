import type { Lesson } from "../types";

export const messagingLessons: Lesson[] = [
  {
    id: "aws-sqs",
    module: "messaging",
    title: "SQS — Queues, Visibility & Dead Letters",
    blurb: "the visibility-timeout mechanic that defines the service, and why exactly-once isn't on the menu.",
    content: `## The model

A producer sends a message; a consumer receives it, does the work, and deletes it. That last step is the one that matters, because **receiving does not remove the message** — it hides it.

\`\`\`
send  ->  [ message in queue ]
receive -> message becomes INVISIBLE for the visibility timeout (default 30s)
   consumer works...
   delete  -> gone for good
   OR crash / timeout expires -> message REAPPEARS for another consumer
\`\`\`

That is the entire durability guarantee: nothing is lost when a worker dies, because an undeleted message comes back. It is also the source of the service's defining constraint — **at-least-once delivery**. If your worker finishes the job and dies before calling delete, the work happens again.

**So your consumers must be idempotent.** Not as a nicety: as a correctness requirement. Standard approaches are a deduplication key in DynamoDB, an idempotency key on the downstream API, or making the operation naturally repeatable (\`SET status = 'shipped'\` rather than \`increment\`).

Set the visibility timeout to comfortably exceed your worst-case processing time, or you get duplicate work by construction. For long jobs, extend it while processing (\`ChangeMessageVisibility\`) rather than setting a huge default.

## Standard vs FIFO

\`\`\`
                 Standard                    FIFO
throughput       effectively unlimited       3,000 msg/s with batching
ordering         best-effort                 strict, per message group
duplicates       possible                    deduplicated within a 5-minute window
\`\`\`

FIFO's ordering is **per message group id**, not per queue — which is what lets it be parallel at all. Order events by \`customerId\` and each customer's events stay ordered while different customers process concurrently. Choose the group id carefully: one group means one consumer's worth of throughput.

## Dead-letter queues

A **redrive policy** moves a message to a DLQ after N failed receives. Without one, a message that always fails (a poison pill) is retried forever, consuming capacity and filling your logs.

Set \`maxReceiveCount\` around 3-5, alarm on \`ApproximateNumberOfMessagesVisible\` on the DLQ, and treat anything landing there as a bug to look at. AWS supports redriving a DLQ back to the source once you've fixed the cause.

## Common use cases

- **Decoupling a slow task from a request** — return 202 immediately, process later. The everyday case.
- **Absorbing a spike** — the queue buffers; workers drain at their own rate rather than the database being overwhelmed.
- **Fan-out worker pools** — many consumers on one queue, scaling on queue depth.
- **Retry with backoff** — failures return to the queue naturally.
- **SNS-to-SQS fan-out** — the standard pattern where one event feeds several independent consumers, each with its own queue and its own failure isolation.
- **Lambda event source** — SQS triggers Lambda, which polls, batches, scales, and deletes on success automatically.

## When it's the wrong reach

- **When you need replay.** A consumed SQS message is gone. If a second consumer might need the same events later, or you'll want to reprocess history after a bug, that's Kinesis — a log you can rewind.
- **When you need strict global ordering at scale.** FIFO caps out.
- **When the payload is big.** 256 KB limit; put the blob in S3 and send the key.
- **For request/response.** A queue is one-way; building RPC on it is usually a mistake.

> [Queues & logs](/library/queues-and-logs) and [Delivery semantics](/library/delivery-semantics) in the library are the conceptual companions — at-least-once, idempotency, and the queue-vs-log distinction this lesson makes concrete.`,
    exercises: [],
    quiz: [
      {
        id: "aws-sqs-q1",
        prompt: "A worker receives a message, completes the job, then crashes before calling delete. What happens?",
        options: [
          "The visibility timeout expires and another consumer processes the same message — the work happens twice",
          "SQS detects the completion and removes the message",
          "The message moves straight to the dead-letter queue",
          "The message is lost, since it was already received",
        ],
        answer: 0,
        explanation: "Receiving hides a message; only delete removes it. That's the durability guarantee and the source of at-least-once delivery. It's why idempotent consumers are a correctness requirement, not a nicety.",
      },
      {
        id: "aws-sqs-q2",
        prompt: "In a FIFO queue, ordering is guaranteed per what?",
        options: [
          "Per deduplication id",
          "Per message group id — which is what allows different groups to process concurrently",
          "Per queue, globally across all messages",
          "Per consumer connection",
        ],
        answer: 1,
        explanation: "Ordering is per message group, not per queue — that's what lets FIFO be parallel at all. Grouping by `customerId` keeps each customer's events ordered while different customers process concurrently. Choose the group id carefully: one group means one consumer's worth of throughput.",
      },
      {
        id: "aws-sqs-q3",
        prompt: "You'll need to reprocess the last week of events after fixing a consumer bug. Is SQS the right choice?",
        options: [
          "Yes, if you enable a dead-letter queue",
          "Yes, provided the queue is FIFO",
          "No — a consumed SQS message is gone. A replayable log like Kinesis is the right shape",
          "Yes — SQS retains messages for 14 days and supports replay",
        ],
        answer: 2,
        explanation: "SQS retains *undelivered* messages up to 14 days, but a successfully consumed and deleted message is gone. If a second consumer might need the same events later, or you'll want to reprocess history, that's a log you can rewind — Kinesis, not a queue.",
      },
    ],
  },
  {
    id: "aws-sns",
    module: "messaging",
    title: "SNS — Pub/Sub Fan-Out",
    blurb: "push to many subscribers at once, and why you almost always put a queue in between.",
    content: `## The model

SNS is a **topic**: publishers send a message, and every subscriber gets a copy. Push, not poll — SNS delivers to the subscriber rather than the subscriber asking.

\`\`\`
                        +--> SQS queue  -> billing worker
publisher -> [ topic ] -+--> SQS queue  -> analytics worker
                        +--> Lambda     -> send confirmation email
                        +--> HTTPS      -> partner webhook
                        +--> SMS / email / mobile push
\`\`\`

One publish, N deliveries. The publisher knows nothing about who is listening, which is the point: adding a fifth consumer requires no change to the producer.

## The pattern that matters: SNS → SQS

This pairing is so common it's effectively one architecture, and it exists because of what each service lacks.

SNS alone delivers once and gives up after its retry policy expires. If your Lambda subscriber is broken for an hour, those messages are gone. Put an **SQS queue between the topic and each consumer** and you get:

- **Durability** — messages wait in the queue while a consumer is down.
- **Failure isolation** — the analytics consumer failing doesn't affect billing.
- **Independent scaling and retry** — each consumer drains at its own rate, with its own DLQ.
- **Replay of the recent window** — messages persist up to 14 days.

**Fan-out with a buffer per consumer** is the durable form of pub/sub on AWS.

## Filtering

A subscription can carry a **filter policy** evaluated on message attributes, so a subscriber only receives what it cares about:

\`\`\`
{ "eventType": ["order_placed", "order_cancelled"], "amount": [{"numeric": [">", 100]}] }
\`\`\`

That filtering happens in SNS, so you're not paying to deliver and then discard. It's the difference between one topic per event type (a mess) and one topic with subscribers declaring their interest.

## Standard vs FIFO, and the encryption note

FIFO topics exist, deliver only to FIFO queues, and give ordering and deduplication with the same throughput ceiling as FIFO queues. Standard is the default.

If you encrypt a topic with KMS, remember the subscriber's queue and the KMS key policy both need to allow it — a silently undelivered message is usually a key policy.

## Common use cases

- **Event fan-out inside a system** — "order placed" reaching billing, inventory, email, and analytics.
- **Application alerts to humans** — CloudWatch alarms publish to SNS, which emails or pages. Nearly every AWS alarm you set up ends here.
- **Mobile push notifications** — SNS talks to APNs and FCM directly.
- **SMS and email** — transactional messages without a separate provider (though for bulk marketing email, SES is the right service).
- **Webhooks to partners** — HTTPS subscribers, with a DLQ for failures.
- **Cross-account and cross-region fan-out** — topics and subscriptions span both.

## When it's the wrong reach

- **When one consumer needs the work exactly once and in order** — that's a queue, used directly.
- **When you need routing rules richer than attribute matching, or a schema registry, or scheduled events** — that's EventBridge, which is the next lesson and overlaps here deliberately.
- **When consumers need to replay history** — SNS has no retention; Kinesis does.
- **For large payloads** — 256 KB, same as SQS.`,
    exercises: [],
    quiz: [
      {
        id: "aws-sns-q1",
        prompt: "Why is SNS → SQS → consumer so much more common than SNS → consumer directly?",
        options: [
          "SNS delivers messages out of order unless a queue buffers them",
          "The queue adds durability, failure isolation per consumer, independent retry, and a replay window while a consumer is down",
          "SNS cannot deliver to Lambda or HTTPS endpoints directly",
          "SQS is required to decrypt KMS-encrypted topics",
        ],
        answer: 1,
        explanation: "SNS alone delivers once and gives up when its retry policy expires — if your subscriber is broken for an hour, those messages are gone. A queue per consumer is the durable form of pub/sub on AWS.",
      },
      {
        id: "aws-sns-q2",
        prompt: "What does an SNS subscription filter policy evaluate?",
        options: [
          "The subscriber's IAM policy at delivery time",
          "Nothing — filtering happens in the consumer",
          "Message attributes, in SNS — so you don't pay to deliver messages a subscriber would discard",
          "The message body, using JSON path expressions",
        ],
        answer: 2,
        explanation: "Filter policies match on message attributes and are evaluated inside SNS. That's the difference between one topic per event type (a mess) and one topic with subscribers declaring their interest. Matching on the message *body* is EventBridge's job.",
      },
      {
        id: "aws-sns-q3",
        prompt: "You encrypt an SNS topic with KMS and subscribers silently stop receiving messages. Where do you look?",
        options: [
          "The topic's delivery retry policy",
          "The subscription's filter policy",
          "The SNS message size limit",
          "The KMS key policy — the subscriber's queue and the key policy both need to allow the operation",
        ],
        answer: 3,
        explanation: "A silently undelivered message on an encrypted topic is usually a key policy. Access to the data requires access to the key, and both the subscribing queue's policy and the KMS key policy have to permit it.",
      },
    ],
  },
  {
    id: "aws-eventbridge",
    module: "messaging",
    title: "EventBridge — The Event Bus",
    blurb: "content-based routing, AWS's own events, and the honest SNS comparison.",
    content: `## What makes it different

EventBridge is a **bus**: events go in, **rules** match on their *content*, and matching events are routed to targets. The difference from SNS is where the routing intelligence lives.

\`\`\`
SNS           subscriber attaches to a topic, filters on message ATTRIBUTES
EventBridge   rules match on the event BODY, with rich patterns, and one event
              can go to up to 5 targets per rule, transformed on the way
\`\`\`

A rule can match nested fields, prefixes, numeric ranges, and negations:

\`\`\`json
{
  "source": ["myapp.orders"],
  "detail-type": ["OrderPlaced"],
  "detail": { "amount": [{ "numeric": [">", 1000] }], "region": ["eu-west-1"] }
}
\`\`\`

No consumer code runs to decide that. High-value European orders reach the fraud check and nothing else does.

## The three bus types

- **Default bus** — receives events from ~200 AWS services automatically. This is the big one: an EC2 state change, an S3 upload, an ECS task stopping, a CodePipeline stage completing — all of it is already flowing, and you just write a rule.
- **Custom bus** — your own application events.
- **Partner bus** — SaaS providers (Datadog, Shopify, Zendesk) publishing directly into your account.

## The features that decide it over SNS

**Schema registry** — EventBridge can infer schemas from events and generate typed bindings, so producers and consumers aren't coupled by folklore. **Archive and replay** — retain events and replay a time window through the rules again, which is genuinely valuable after fixing a consumer bug. **Scheduler** — cron and rate expressions, including one-off scheduled events, which replaces a lot of custom scheduling code. **API destinations** — call an external HTTP API as a target, with managed auth and rate limiting.

## Common use cases

- **Reacting to AWS itself** — the single most common use. An S3 upload, an ECS task failing, a Health Dashboard event, a GuardDuty finding, all routed without polling anything.
- **Scheduled jobs** — cron that isn't on a box someone has to remember.
- **Event-driven microservices** — services publish domain events to a custom bus; consumers subscribe by pattern, and adding one changes nothing upstream.
- **SaaS integration** — partner events landing natively.
- **Cross-account event flow** — a bus in one account forwarding to another, a common multi-account building block.

## When it's the wrong reach

**Throughput and latency.** SNS is faster and cheaper at high volume; EventBridge adds tens of milliseconds and costs about $1 per million events. For a hot path fanning out millions of messages, SNS→SQS is the leaner choice.

**When you need a durable buffer per consumer.** EventBridge targets can fail; use SQS as the target if the consumer must not miss anything.

**When ordering matters** — EventBridge makes no ordering guarantee at all.

## The honest summary

Use **SNS** for simple, high-throughput fan-out to consumers you control. Use **EventBridge** when the routing decision is genuinely content-based, when you want AWS service events, when you need scheduling, or when replay and schemas earn their keep. The overlap is real and both answers are defensible — what isn't defensible is not knowing which properties you're buying.`,
    exercises: [],
    quiz: [
      {
        id: "aws-eventbridge-q1",
        prompt: "What routing capability does EventBridge have that SNS does not?",
        options: [
          "Cross-account delivery",
          "Guaranteed message ordering",
          "Rules match on the event body — nested fields, prefixes, numeric ranges, negations — not just message attributes",
          "Delivery to SQS queues",
        ],
        answer: 2,
        explanation: "SNS filters on message attributes; EventBridge rules match on the event's content, including nested fields with numeric comparisons and negation. That means no consumer code runs to decide whether an event is relevant. EventBridge makes no ordering guarantee at all.",
      },
      {
        id: "aws-eventbridge-q2",
        prompt: "What is the single most common use of the EventBridge default bus?",
        options: [
          "Fanning out application events to millions of subscribers cheaply",
          "Buffering events durably per consumer",
          "Enforcing ordering across a distributed workflow",
          "Reacting to AWS's own events — an S3 upload, an ECS task stopping, a GuardDuty finding — without polling anything",
        ],
        answer: 3,
        explanation: "The default bus already receives events from ~200 AWS services. All of it is flowing whether or not you use it, and you just write a rule. That reach — plus scheduling, archive/replay, and the schema registry — is what you're buying over SNS.",
      },
      {
        id: "aws-eventbridge-q3",
        prompt: "You're fanning out millions of messages an hour on a hot path. SNS or EventBridge?",
        options: [
          "SNS → SQS — it's faster and cheaper at high volume; EventBridge adds tens of milliseconds and ~$1 per million events",
          "EventBridge, because the schema registry prevents producer/consumer drift",
          "EventBridge, because it scales further than SNS",
          "Either; throughput and cost are equivalent",
        ],
        answer: 0,
        explanation: "The overlap between the two is real and both answers are often defensible — what isn't defensible is not knowing which properties you're buying. On a high-volume hot path, SNS→SQS is the leaner choice; EventBridge earns its keep when routing is genuinely content-based or you want AWS events, scheduling, or replay.",
      },
    ],
  },
  {
    id: "aws-kinesis",
    module: "messaging",
    title: "Kinesis — Streams You Can Rewind",
    blurb: "the log-versus-queue distinction, shards as the unit of throughput, and Firehose's different job.",
    content: `## A log, not a queue

The distinction that makes Kinesis a separate service from SQS:

\`\`\`
QUEUE (SQS)                        LOG (Kinesis)
consume = delete                   consume = advance YOUR cursor
one consumer gets each message     every consumer reads everything
no history                         retention 24h - 365 days
no replay                          replay from any point
\`\`\`

Records stay for the retention period no matter how many consumers read them. Each consumer tracks its own position, so you can add a consumer later and have it read the last week, or rewind one after fixing a bug. That replayability is the whole reason to choose it.

## Shards, and the partition key again

A stream is made of **shards**, and each shard has fixed capacity:

\`\`\`
per shard:  1 MB/s or 1,000 records/s IN
            2 MB/s OUT (shared) — or 2 MB/s per consumer with enhanced fan-out
\`\`\`

Every record carries a **partition key** that hashes to a shard. Same trap as DynamoDB: a low-cardinality partition key concentrates traffic on one shard and throttles you while the stream looks under-utilized overall. And **ordering is guaranteed per shard**, which means per partition key — so ordering by \`deviceId\` or \`userId\` is available, global ordering is not.

**On-demand mode** removes shard management (it scales automatically) at a higher per-GB price. Provisioned is cheaper if you know your throughput.

## The family — they do different jobs

- **Kinesis Data Streams** — the raw, low-latency, replayable log. You write consumers.
- **Data Firehose** — a managed *delivery* pipeline: buffers records and writes them to S3, Redshift, OpenSearch, or Splunk, with optional Lambda transformation and Parquet conversion. **No replay, near-zero code.** If your goal is "get these events into S3 as Parquet", this is the answer and Data Streams is the overbuild.
- **Managed Service for Apache Flink** — real stream processing: windows, aggregations, joins over time.
- **MSK** — managed Kafka, when you want Kafka's ecosystem or already have it.

## Common use cases

- **Clickstream and telemetry ingestion** — high volume, several consumers wanting the same events.
- **Firehose to a data lake** — the standard analytics on-ramp, feeding the Athena pattern.
- **Real-time dashboards and anomaly detection** — Flink windows over the stream.
- **Change data capture** — database changes into a stream, feeding search indexes and caches.
- **DynamoDB Streams and Kinesis Data Streams for DynamoDB** — the same idea applied to table mutations.
- **Log aggregation** — CloudWatch Logs subscription filters can stream straight into Kinesis.

## When it's the wrong reach

- **Simple task decoupling.** If one worker should handle each message and nobody will replay, SQS is simpler, cheaper, and scales without shard math.
- **Low volume.** A provisioned shard bills hourly whether or not anything flows.
- **Fewer than a handful of consumers with no replay need** — SNS→SQS is less machinery.
- **When you want Kafka semantics and tooling** — use MSK rather than reimplementing them.

> [Queues & logs](/library/queues-and-logs) and [Stream processing](/library/stream-processing) in the library cover this distinction conceptually; this lesson is the AWS implementation of it.`,
    exercises: [],
    quiz: [
      {
        id: "aws-kinesis-q1",
        prompt: "What does \"consume\" mean in Kinesis, as opposed to SQS?",
        options: [
          "Acknowledging it so the shard can be rebalanced",
          "Advancing your own cursor — records stay for the retention period and every consumer reads everything",
          "Deleting the record, the same as SQS",
          "Moving the record to a secondary stream",
        ],
        answer: 1,
        explanation: "That's the queue-versus-log distinction. In a queue, consuming deletes. In a log, consuming advances your cursor — records persist for 24 hours to 365 days regardless of how many consumers read them, so you can add a consumer later or rewind one after a bug.",
      },
      {
        id: "aws-kinesis-q2",
        prompt: "Your stream throttles while overall utilization looks low. What's the likely cause?",
        options: [
          "Enhanced fan-out is disabled",
          "The stream is in on-demand mode, which caps total throughput",
          "A low-cardinality partition key concentrates records on one shard, and per-shard capacity is fixed at 1 MB/s in",
          "The retention period is too short for the consumer's lag",
        ],
        answer: 2,
        explanation: "Same trap as DynamoDB's partition key. Each shard takes 1 MB/s or 1,000 records/s in, and every record's partition key hashes to a shard — so a skewed key throttles you while the stream looks under-utilized overall. Ordering is also per shard, meaning per partition key.",
      },
      {
        id: "aws-kinesis-q3",
        prompt: "Your goal is simply \"get these events into S3 as Parquet.\" Which service is right?",
        options: [
          "Data Streams, writing your own consumer",
          "Managed Service for Apache Flink",
          "MSK with an S3 sink connector",
          "Data Firehose — a managed delivery pipeline with buffering, optional Lambda transform, and Parquet conversion, and near-zero code",
        ],
        answer: 3,
        explanation: "Firehose does exactly this job with no consumers to write — the tradeoff is no replay. Data Streams is the overbuild here; reach for it when you need the replayable log or multiple independent consumers.",
      },
    ],
  },
  {
    id: "aws-step-functions",
    module: "messaging",
    title: "Step Functions — Orchestrating Workflows",
    blurb: "making the state machine explicit instead of hiding it in chained Lambdas, and the saga it enables.",
    content: `## The problem it solves

Multi-step processes chained by events get hard to reason about fast. Lambda A invokes B, B writes to a queue that triggers C, C fails somewhere and nobody knows how far the process got. The state of the workflow exists only as scattered logs.

Step Functions makes the workflow a **declarative state machine** that AWS runs and tracks: each execution has a visible history, every transition is recorded, retries and error handling are configuration, and you can see exactly where any execution stopped.

\`\`\`
[ Validate ] -> [ Charge card ] -> [ Reserve stock ] -> [ Ship ]
                      |                    |
                  on error             on error
                      v                    v
                [ Notify ]        [ Refund ] -> [ Notify ]
\`\`\`

## The state types worth knowing

\`Task\` (do work — a Lambda, an ECS task, or a direct call to one of 200+ AWS APIs), \`Choice\` (branch), \`Parallel\` (fixed concurrent branches), \`Map\` (fan out over an array — **Distributed Map** handles up to a million items from S3), \`Wait\` (seconds, or until a timestamp), \`Retry\`/\`Catch\` (backoff and error routing as config, not code), and \`Succeed\`/\`Fail\`.

The direct AWS integrations matter more than they sound: putting an item in DynamoDB or publishing to SNS is a state, not a Lambda you have to write, deploy, and pay for.

## Standard vs Express

\`\`\`
                 Standard                     Express
duration         up to 1 YEAR                 5 minutes
pricing          per state transition         per invocation + duration (much cheaper)
history          full, in the console         to CloudWatch Logs
execution        exactly-once                 at-least-once
use for          long business processes      high-volume short workflows
\`\`\`

The pricing difference is large enough to be a design input: Standard at high volume gets expensive per transition, which is exactly what Express is for.

## The saga pattern

This is where Step Functions earns its place in a distributed system. You cannot have a distributed transaction across a payment provider, an inventory service, and a shipping service. What you can have is a **saga**: a sequence of local transactions, each with a compensating action, and an orchestrator that runs the compensations in reverse when a later step fails.

\`\`\`
charge card  ->  reserve stock  ->  create shipment
                       |  fails
                       v
              refund the charge          <- compensation
\`\`\`

A \`Catch\` on each state routing to its compensating step is a saga orchestrator, written declaratively. Doing this by hand across chained Lambdas is where correctness quietly disappears.

## Common use cases

- **Order fulfilment, onboarding, approvals** — anything with steps, branches, and failure paths.
- **ETL orchestration** — chaining Glue jobs, EMR steps, and Athena queries with real error handling.
- **Long-running human-in-the-loop flows** — the \`waitForTaskToken\` pattern pauses an execution for up to a year until something calls back with the token. Approval workflows are the classic case.
- **Batch fan-out** — Distributed Map over a million S3 objects with controlled concurrency.
- **Anything over Lambda's 15 minutes** — split it into steps.
- **Saga-style compensation**, as above.

## When it's the wrong reach

- **A single simple call.** Two Lambdas in sequence do not need an orchestrator; the state machine is more machinery than the problem.
- **Very high volume with Standard workflows** — per-transition pricing adds up fast. Use Express, or reconsider.
- **When choreography suits better.** Services reacting to events independently (via EventBridge) is looser coupling than a central orchestrator, and for some domains that's the better shape. Orchestration gives you visibility and control; choreography gives you independence.

> [Distributed transactions](/library/distributed-transactions) in the library covers sagas, two-phase commit, and why the former wins in practice — Step Functions is how you actually build one here.`,
    exercises: [],
    quiz: [
      {
        id: "aws-step-functions-q1",
        prompt: "What does Step Functions give you that chained Lambdas and queues do not?",
        options: [
          "Lower latency between steps",
          "Automatic idempotency for every step",
          "The ability to run steps longer than 15 minutes inside a single Lambda",
          "The workflow becomes an explicit state machine with a visible execution history, so you can see exactly where any execution stopped",
        ],
        answer: 3,
        explanation: "In a chained-event design the state of the workflow exists only as scattered logs. Step Functions makes it declarative and tracked: every transition recorded, retries and error handling as configuration, and a visible history per execution.",
      },
      {
        id: "aws-step-functions-q2",
        prompt: "You need to charge a card, reserve stock, and create a shipment — with the charge refunded if stock reservation fails. What pattern is this?",
        options: [
          "A saga — local transactions each paired with a compensating action, run in reverse on failure",
          "Two-phase commit across the three services",
          "An idempotency key applied to the whole workflow",
          "A distributed lock held for the duration of the workflow",
        ],
        answer: 0,
        explanation: "You can't have a distributed transaction across a payment provider, an inventory service, and a shipping service. A `Catch` on each state routing to its compensating step is a saga orchestrator written declaratively — and doing it by hand across chained Lambdas is where correctness quietly disappears.",
      },
      {
        id: "aws-step-functions-q3",
        prompt: "A high-volume workflow completes in under a minute and runs millions of times a day. Standard or Express?",
        options: [
          "Either; pricing is equivalent below five minutes",
          "Express — Standard bills per state transition, which gets expensive fast at that volume",
          "Standard — its exactly-once execution is required at high volume",
          "Standard — Express is capped at 15 minutes and this may exceed it",
        ],
        answer: 1,
        explanation: "Express is priced per invocation plus duration rather than per state transition, which is exactly what high-volume short workflows need. The tradeoffs are at-least-once execution, a five-minute ceiling, and history going to CloudWatch Logs rather than the console.",
      },
    ],
  },
];
