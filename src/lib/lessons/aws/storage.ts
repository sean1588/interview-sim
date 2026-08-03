import type { Lesson } from "../types";

export const storageLessons: Lesson[] = [
  {
    id: "aws-s3",
    module: "storage",
    title: "S3 — Object Storage as Infrastructure",
    blurb: "why eleven nines is achievable, what an object store refuses to do, and the flat-namespace truth.",
    content: `## What an object store is, and isn't

S3 stores **objects**: an immutable blob (up to 5 TB), a key, and metadata, inside a bucket. You PUT a whole object and GET a whole object. There is no seek, no append, no partial write, no rename. Changing one byte means uploading the object again.

That refusal is exactly what buys the durability. Because objects are immutable and self-contained, S3 can replicate each one across at least three AZs and repair from redundancy in the background — which is where **11 nines (99.999999999%) of durability** comes from. That's roughly "store 10 million objects and expect to lose one every 10,000 years." Availability is a separate and much lower number: 99.9-99.99%, because being reachable is harder than not losing data.

## The flat namespace

There are no directories. The key \`logs/2024/03/app.log\` is one string with slashes in it; the console renders folders as a convenience. This has a real consequence: **listing is a prefix scan, not a directory read.** Listing a bucket with a million objects under one prefix is slow and paginated, which is why designs that need "give me the files in this folder" usually want an index in DynamoDB alongside the bucket.

Performance is also per-prefix: **3,500 PUT/s and 5,500 GET/s per prefix**, and prefixes scale horizontally. Keys that all start with the same timestamp concentrate load; keys with a high-entropy leading component spread it.

## Consistency, since it changed

Since December 2020, S3 is **strongly read-after-write consistent** for all operations. A GET after a PUT returns the new object; a LIST after a PUT shows it. The old advice about eventual consistency on overwrites and deletes is obsolete — but it's still in a lot of blog posts and a lot of people's heads.

## Common use cases

- **Static assets and media** — images, video, downloads, almost always with CloudFront in front.
- **Data lake storage** — Parquet files queried in place by Athena, Redshift Spectrum, or Spark. S3 is the de facto storage layer for analytics on AWS.
- **Backups and archives** — database snapshots, logs, anything with a retention policy.
- **Static website hosting** — a whole SPA served from a bucket behind CloudFront, no server at all.
- **Event source** — an upload fires a Lambda (thumbnail it, virus-scan it, index it). This is the backbone of most serverless pipelines.
- **Cross-service handoff** — the standard way to move a payload too big for a queue message: put the object in S3, put the key in the message.

## The features worth knowing

**Versioning** keeps every overwrite and turns delete into a marker — the real protection against "someone ran the wrong script". **Presigned URLs** let a browser upload or download directly with a time-limited signed link, so your server never proxies the bytes. **Multipart upload** is required over 5 GB and a good idea over ~100 MB. **Block Public Access** is on by default now and is the reason accidental public buckets have become rarer.

## When it's the wrong reach

S3 is not a filesystem and not a database. If you need file locking, partial writes, or POSIX semantics, that's EFS. If you need low-latency random reads of small records, that's DynamoDB — S3's first-byte latency is tens of milliseconds, not single-digit. And if a workload rewrites the same object constantly, the immutability model is fighting you.

> [CDN & object storage](/library/cdn-and-object-storage) in the library is the interview-facing version of this pairing — this lesson is about what S3 itself guarantees and why.`,
    exercises: [],
  },
  {
    id: "aws-ebs-and-efs",
    module: "storage",
    title: "EBS vs EFS — Block and File Storage",
    blurb: "one volume for one instance versus one filesystem for many, and the AZ boundary between them.",
    content: `## Two different shapes

\`\`\`
              EBS                          EFS
what          a block device (a disk)      an NFS filesystem
attached to   ONE instance (usually)       many instances at once
scope         a single AZ                  regional, all AZs
capacity      you provision it             grows and shrinks automatically
latency       sub-millisecond              single-digit ms (network filesystem)
price         ~$0.08/GB-month (gp3)        ~$0.30/GB-month (Standard)
\`\`\`

The line to remember: **EBS is a disk for one machine; EFS is a shared drive for many.** And EBS is *zonal* — a volume in us-east-1a can only ever attach to an instance in us-east-1a. That single fact drives a lot of architecture.

## EBS volume types

\`\`\`
gp3   general SSD    3,000 IOPS baseline, throughput/IOPS set INDEPENDENTLY of size
gp2   older SSD      IOPS tied to size (3 per GB) — gp3 is cheaper and better; migrate
io2   provisioned    up to 256,000 IOPS, 99.999% durable — serious databases
st1   throughput HDD  big sequential reads, cheap — logs, data processing
\`\`\`

**gp3 is the default answer.** The gp2 trap is worth knowing because it's still everywhere: with gp2 you had to over-provision *capacity* to get IOPS, so people ran 1 TB volumes for a 40 GB database. gp3 decouples them.

Snapshots are incremental and land in S3, so they survive the AZ. A snapshot restored into another AZ is how an EBS volume "moves".

## Common use cases

**EBS:** the root volume of every EC2 instance; a self-managed database's data directory; anything wanting a real filesystem with sub-millisecond latency. **io2 Block Express** when you're running your own high-IOPS database and mean it.

**EFS:** a shared upload/content directory behind several web servers; a CMS or legacy app that assumes a POSIX filesystem shared across nodes; home directories for a dev/CI fleet; ML training data read by many nodes; and giving **Lambda** a real filesystem — mounting EFS is how a function gets more than /tmp's 10 GB or shares state with other functions.

## When each is the wrong reach

**EFS as a database volume.** It's a network filesystem: single-digit-millisecond latency and NFS locking semantics. Postgres on EFS will be slow and occasionally strange. Use EBS.

**EBS when you actually need sharing.** People build rsync cron jobs between instances to fake a shared directory. That's EFS.

**Either one when S3 would do.** Both cost several times S3 per gigabyte and neither is durable across a region by default. If the access pattern is "write once, read many, by key" — that's S3, and using a filesystem for it is usually habit rather than a requirement.

## The multi-AZ consequence

Because EBS is zonal, an instance and its volume die together with the AZ. There is no "reattach it elsewhere" — recovery means restoring a snapshot into another AZ, which takes time. This is precisely why stateful workloads either use a managed service that handles the replication (RDS Multi-AZ), or keep the durable copy in something regional (S3, EFS) and treat the instance as disposable.`,
    exercises: [],
  },
  {
    id: "aws-storage-classes",
    module: "storage",
    title: "Storage Classes, Lifecycle & Glacier",
    blurb: "the same bytes at a tenth the price, and the retrieval costs that make it a bad idea.",
    content: `## The menu

Every S3 object has a storage class. Same durability (11 nines) across all of them — what changes is availability, retrieval latency, and the pricing shape.

\`\`\`
                        $/GB-mo   retrieval        min duration   use for
Standard                 0.023    instant, free    none           active data
Intelligent-Tiering      0.023*   instant, free    none           unknown patterns
Standard-IA              0.0125   instant, per-GB  30 days        monthly-ish access
One Zone-IA              0.010    instant, per-GB  30 days        reproducible data
Glacier Instant          0.004    instant, per-GB  90 days        archives, rare reads
Glacier Flexible         0.0036   1 min - 12 hrs   90 days        real archives
Glacier Deep Archive     0.00099  12 - 48 hours    180 days       compliance, 7-yr retention
\`\`\`

Deep Archive is roughly **23× cheaper** than Standard. That is the prize, and the catch is in the two columns before it.

## The two ways this bites

**Retrieval charges.** Infrequent Access classes are cheap to store and cost money *per gigabyte read*. An object in Standard-IA read twice a week costs more than it would have in Standard. The break-even is genuinely about "less than once a month" — the class names mean what they say.

**Minimum billable duration.** Delete a Standard-IA object after 3 days and you're billed for 30. Delete a Deep Archive object after a week and you're billed for 180 days. A lifecycle rule that transitions short-lived objects to IA can *increase* your bill.

**One Zone-IA** is the other trap: it stores in a single AZ. Still 11 nines of durability against disk failure, but an AZ loss takes the data with it. Only for data you can regenerate.

## Lifecycle policies — the actual mechanism

A lifecycle rule moves or expires objects automatically by age and prefix. The pattern that pays for itself almost everywhere is logs:

\`\`\`
logs/*   day 0    Standard          being queried
         day 30   Standard-IA       occasional investigation
         day 90   Glacier Flexible  compliance only
         day 365  Deep Archive
         day 2555 expire            (7 years)
\`\`\`

Rules also clean up two things people forget and pay for indefinitely: **noncurrent versions** (versioning keeps every overwrite forever unless you expire them) and **incomplete multipart uploads** (a failed 4 GB upload leaves its parts billing you silently). Both are worth a rule in every bucket.

## Common use cases

- **Log and event archives** — the staged transition above.
- **Compliance retention** — Deep Archive plus Object Lock, which makes objects genuinely undeletable for a fixed window, including by an admin.
- **Media masters** — the original 4K file in Glacier, the transcoded renditions in Standard.
- **Backups** — nightly snapshots aging out on a schedule.
- **Intelligent-Tiering when you don't know the pattern** — a small monitoring fee per object, and AWS moves objects between tiers based on real access. Correct for large buckets with unpredictable reads; wasteful for millions of tiny objects, where the per-object fee dominates.

## When it's the wrong reach

Don't archive anything on a user-facing path. Glacier Flexible's retrieval is measured in minutes to hours — a request that hits it doesn't slow down, it fails to answer for hours. If a human might ever click a button and expect that object, it belongs in an instant-retrieval class.`,
    exercises: [],
  },
];
