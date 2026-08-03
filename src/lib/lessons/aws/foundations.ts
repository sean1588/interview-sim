import type { Lesson } from "../types";

export const foundationsLessons: Lesson[] = [
  {
    id: "aws-regions-and-azs",
    module: "foundations",
    title: "Regions, Availability Zones & Edge",
    blurb: "the three-level geography every other service inherits, and which failures each level survives.",
    content: `## Three levels, and they are not interchangeable

Almost every AWS design question reduces to "at which level does this live?" There are three, nested:

\`\`\`
Region          us-east-1        a geographic area. Independent. ~30 worldwide.
  |
  +- AZ         us-east-1a       1+ datacenters, own power/cooling/network.
  |             us-east-1b       Single-digit ms apart. 3-6 per region.
  |             us-east-1c
  |
Edge            400+ PoPs        CloudFront/Route 53 only. No compute, no storage.
\`\`\`

The key numbers: **AZs within a region are ~1-2ms apart** — close enough to replicate synchronously. **Regions are 60-200ms apart** — far enough that synchronous cross-region writes are a design mistake, not a tuning problem.

## What each level is actually for

An **Availability Zone** is the unit of *fault isolation*. Separate power, separate cooling, separate network. A flooded datacenter, a failed generator, a bad switch upgrade — those take out one AZ. AWS's whole high-availability story is: run in three, lose one, don't notice.

A **Region** is the unit of *blast radius and jurisdiction*. Regions do not share control planes, so a bad deploy in us-east-1 does not (usually) reach eu-west-1. It's also where data residency lives: your data stays in the region you put it in unless you explicitly move it.

**Edge locations** are the unit of *proximity*. They cache and terminate connections close to the user. They do not run your code in any general sense (Lambda@Edge and CloudFront Functions are deliberately tiny).

## The service split you must internalize

Services are either regional or zonal, and it decides your failure model:

\`\`\`
ZONAL  (dies with its AZ)      REGIONAL (survives an AZ loss)
EC2 instance                   S3
EBS volume                     DynamoDB
RDS instance (single-AZ)       SQS / SNS
                               Lambda
                               ELB (once it has subnets in 3 AZs)
\`\`\`

This is why "put it in three AZs" is the default advice: an EC2 instance and its EBS volume both vanish when the AZ does, so surviving that means having another instance already running elsewhere. S3 and DynamoDB already replicate across AZs for you — you get it without asking.

## Common use cases

- **Single region, three AZs** — the correct default for almost everything. Survives a datacenter loss, costs nothing extra in latency, no data-consistency problems.
- **Multi-region active-passive** — a warm standby in a second region with data replicated asynchronously. For when a whole-region outage is unacceptable. You accept some data loss (RPO) on failover.
- **Multi-region active-active** — traffic served from both. Only when latency for globally-distributed users demands it, and only for workloads that tolerate eventual consistency, because you cannot have synchronous writes at 150ms.
- **Region chosen for law, not latency** — eu-central-1 because the data must stay in Germany.

## When it's the wrong reach

Going multi-region "for availability" before you have exhausted multi-AZ is the classic overbuild. Multi-AZ is nearly free and handles the failure you'll actually have. Multi-region doubles your infrastructure, forces you into eventual consistency, and adds a failover procedure that is itself a leading cause of outages.

> The library's [Multi-region](/library/multi-region) note is the interview-facing companion — how to *talk about* active-active vs active-passive under time pressure. This lesson is about what AWS actually gives you at each level.`,
    exercises: [],
    quiz: [
      {
        id: "aws-regions-and-azs-q1",
        prompt: "You need to replicate a database synchronously so a failure loses no committed writes. Across AZs in one region, or across two regions?",
        options: [
          "Across regions — only a region boundary is a real fault domain",
          "Either works; the latency difference is not large enough to matter",
          "Neither — synchronous replication is impossible on AWS",
          "Across AZs — they are ~1-2ms apart, close enough that synchronous replication is practical",
        ],
        answer: 3,
        explanation: "AZs sit ~1-2ms apart, so a synchronous commit costs single-digit milliseconds. Regions are 60-200ms apart, which makes synchronous cross-region writes a design mistake rather than a tuning problem.",
      },
      {
        id: "aws-regions-and-azs-q2",
        prompt: "Which pair of resources disappears together when a single Availability Zone fails?",
        options: [
          "An EC2 instance and its attached EBS volume",
          "An S3 bucket and a DynamoDB table",
          "An SQS queue and an SNS topic",
          "A Lambda function and its execution role",
        ],
        answer: 0,
        explanation: "EC2 instances and EBS volumes are zonal — both live in one AZ and die with it. S3, DynamoDB, SQS, SNS, and Lambda are regional and already replicate across AZs for you.",
      },
      {
        id: "aws-regions-and-azs-q3",
        prompt: "A team wants to go multi-region \"for availability\" but is currently running in a single AZ. What is the strongest objection?",
        options: [
          "Nothing — multi-region strictly dominates multi-AZ on availability",
          "Multi-AZ is nearly free, handles the failure they will actually have, and avoids the eventual consistency and failover procedure multi-region forces on them",
          "Multi-region is not supported for most AWS services",
          "Multi-region would violate data residency rules in every jurisdiction",
        ],
        answer: 1,
        explanation: "Skipping multi-AZ to go multi-region is the classic overbuild. Multi-AZ costs almost nothing extra and survives the datacenter loss you're realistically going to have; multi-region doubles the infrastructure, forces eventual consistency, and adds a failover procedure that is itself a leading cause of outages.",
      },
    ],
  },
  {
    id: "aws-iam",
    module: "foundations",
    title: "IAM — The Front Door to Everything",
    blurb: "why every AWS call is an authorization decision, and the four things a policy is made of.",
    content: `## Every single call is authorized

There is no "inside the firewall" in AWS. Every API call — \`s3:GetObject\`, \`ec2:RunInstances\`, \`dynamodb:Query\` — is evaluated against IAM before it runs. Not just human logins: your Lambda reading from DynamoDB is an IAM decision too. Understanding IAM is not a security specialty here, it's how the platform works.

## The four nouns

\`\`\`
Principal   who is asking        an IAM role, a user, a service
Action      what they want       s3:GetObject
Resource    on what              arn:aws:s3:::my-bucket/reports/*
Condition   under what           aws:SourceIp, aws:MultiFactorAuthPresent
\`\`\`

A **policy** is a JSON document that allows or denies combinations of those four. The evaluation rule is short and worth memorizing: **an explicit Deny always wins; otherwise you need an explicit Allow; with no statement at all, the answer is no.** Default-deny is the whole model.

## Roles, not keys — this is the part people get wrong

An **IAM user** has long-lived access keys. An **IAM role** has none: it is assumed, and assuming it mints credentials that expire in an hour.

\`\`\`
Lambda function --assumes--> execution role --> temporary creds (1hr) --> DynamoDB
EC2 instance    --assumes--> instance profile
Your laptop     --SSO-->     temporary creds
\`\`\`

The practical rule: **roles for anything that runs, users (ideally none) for humans.** A long-lived \`AKIA...\` key in an environment variable is the single most common way AWS accounts get compromised, because keys leak into git history, CI logs, and Slack, and they never expire on their own.

## Common use cases

- **Execution roles** — every Lambda, ECS task, and EC2 instance gets a role scoped to exactly what it touches. This is the everyday use.
- **Cross-account access** — a role in the prod account that the CI account is trusted to assume. Beats copying credentials between accounts.
- **Federated human access** — humans log in via SSO/Identity Center and assume a role. No IAM users at all.
- **Service-to-service without secrets** — an S3 bucket policy that allows a specific role, so no key is ever written down.
- **Permission boundaries / SCPs** — an org-level ceiling: even an admin in a sandbox account cannot leave the allowed regions or delete CloudTrail.

## The trap: two policies, one question

Resources have their own policies too. An S3 object read is checked against **both** the caller's IAM policy and the bucket policy — and a Deny in either kills it. When something is mysteriously forbidden and the IAM policy looks right, the bucket policy (or a KMS key policy, or an SCP) is usually the one saying no.

## When to reach for what

Start every role at zero and add the specific actions that fail. \`"Action": "*"\` on \`"Resource": "*"\` is not a starting point you tighten later — nobody ever tightens it. IAM Access Analyzer will generate a least-privilege policy from what a role actually called over the last 90 days, which is far more honest than guessing.`,
    exercises: [],
    quiz: [
      {
        id: "aws-iam-q1",
        prompt: "An IAM policy allows `s3:GetObject` on a bucket, but the call is still denied. What is the most likely cause?",
        options: [
          "Another policy — the bucket policy, a KMS key policy, or an SCP — carries an explicit Deny",
          "The IAM policy needs to be attached twice, once to the user and once to the role",
          "S3 requires the action to be spelled `s3:Get*` to work",
          "IAM policies take 24 hours to propagate before they take effect",
        ],
        answer: 0,
        explanation: "An S3 read is evaluated against both the caller's IAM policy and the resource's policy, and an explicit Deny anywhere wins. When the IAM policy looks right, the bucket policy, KMS key policy, or an org-level SCP is usually the one saying no.",
      },
      {
        id: "aws-iam-q2",
        prompt: "Why is an IAM role preferred over an IAM user with access keys for anything that runs?",
        options: [
          "Roles bypass the bucket policy check, simplifying access",
          "Assuming a role mints credentials that expire in about an hour, so there is no long-lived key to leak into git, CI logs, or Slack",
          "Roles are evaluated faster than users at the API layer",
          "Roles can be attached to more services than users can",
        ],
        answer: 1,
        explanation: "A role has no key material of its own — it is assumed, producing temporary credentials. A long-lived `AKIA...` key in an environment variable never expires on its own, and leaked keys are the single most common way AWS accounts get compromised.",
      },
      {
        id: "aws-iam-q3",
        prompt: "A request arrives for an action that no policy mentions at all — no Allow, no Deny. What happens?",
        options: [
          "It is allowed only if the principal is in the same account as the resource",
          "The call fails with a policy-not-found error rather than an authorization decision",
          "It is denied — IAM is default-deny, so you need an explicit Allow",
          "It is allowed, because nothing forbade it",
        ],
        answer: 2,
        explanation: "The evaluation rule is short: an explicit Deny always wins; otherwise you need an explicit Allow; with no statement at all the answer is no. Default-deny is the whole model.",
      },
    ],
  },
  {
    id: "aws-shared-responsibility-and-cost",
    module: "foundations",
    title: "Shared Responsibility & How You Actually Pay",
    blurb: "the line between AWS's job and yours, and the four cost levers that decide the bill.",
    content: `## The line

AWS says it secures **the cloud**; you secure what's **in** the cloud. That sounds like a slogan until you notice it moves depending on the service:

\`\`\`
                        AWS handles          You handle
EC2                     hypervisor, host     OS patches, your runtime, your app
RDS                     + OS, DB patching    schema, queries, who can connect
Lambda / DynamoDB       + the runtime        your code, your IAM, your data model
S3                      + durability         bucket policy, encryption choice, what you put in it
\`\`\`

Read that top to bottom: **the more managed the service, the less of the stack is yours.** That's what you're actually buying. What never becomes AWS's job, at any level, is *your data, your IAM policies, and your application logic*. A public S3 bucket is not an AWS failure.

## The four cost levers

Nearly every AWS bill is dominated by four things, and knowing which one you're pulling makes cost conversations concrete instead of vague:

\`\`\`
1. Compute time      instance-hours, or Lambda GB-seconds
2. Storage           GB-months, and which class it sits in
3. Requests          per-million API calls (S3 GETs, DynamoDB reads, Lambda invokes)
4. Data transfer     the one that surprises people
\`\`\`

**Data transfer is the sleeper.** Inbound is free. Outbound to the internet is not. Cross-AZ traffic is charged in both directions — so chatty service-to-service calls spread across AZs for "high availability" quietly bill you per gigabyte. Traffic within an AZ, and to S3 via a gateway endpoint, is free. A surprising number of "why is this so expensive" investigations end at cross-AZ chatter or an un-cached CloudFront origin.

## The pricing models, and when each earns its keep

- **On-demand** — pay per second, no commitment. The default; correct for anything spiky or short-lived.
- **Savings Plans / Reserved** — commit to a spend level for 1-3 years for ~30-70% off. Correct for your steady-state baseline, which for most companies is most of the bill.
- **Spot** — spare capacity at up to 90% off, reclaimed with a two-minute warning. Correct for batch, CI, rendering, and anything checkpointed and restartable. Wrong for your database.
- **Serverless (per-request)** — Lambda, DynamoDB on-demand, Fargate. You pay nothing at idle, which is either a huge win or an expensive surprise depending on your traffic shape.

The shape of your traffic decides: **spiky and low-duty-cycle favours serverless; steady and high-utilization favours committed instances.** A Lambda running flat out 24/7 costs several times what the equivalent EC2 instance does, and an EC2 fleet sized for a twice-a-day spike is mostly paying for idle.

## Common use cases

- **Tag everything, then split the bill** — cost allocation tags are the only way to answer "which team spent this."
- **Budgets and anomaly alerts** — a runaway loop invoking Lambda, or a forgotten GPU instance, is a real and common way to lose thousands of dollars in a weekend.
- **S3 lifecycle policies** — move old objects to cheaper classes automatically rather than paying Standard rates for logs nobody reads.
- **Right-sizing from CloudWatch** — an instance at 4% CPU for three months is the easiest saving there is.`,
    exercises: [],
    quiz: [
      {
        id: "aws-shared-responsibility-and-cost-q1",
        prompt: "Under the shared responsibility model, which item is yours no matter how managed the service is?",
        options: [
          "OS patching",
          "Database engine patching",
          "The durability of stored objects",
          "Your data, your IAM policies, and your application logic",
        ],
        answer: 3,
        explanation: "The more managed the service, the less of the stack is yours — Lambda takes the runtime, RDS takes OS and DB patching, S3 takes durability. What never becomes AWS's job at any level is your data, your IAM policies, and your application logic. A public S3 bucket is not an AWS failure.",
      },
      {
        id: "aws-shared-responsibility-and-cost-q2",
        prompt: "Which cost lever most often produces a surprising bill for teams who thought they understood their spend?",
        options: [
          "Data transfer — outbound to the internet is charged, and cross-AZ traffic is billed in both directions",
          "Compute time, because instance-hours are hard to predict",
          "Storage, because GB-months compound",
          "Request counts, because per-million API pricing is opaque",
        ],
        answer: 0,
        explanation: "Data transfer is the sleeper. Inbound is free, but outbound to the internet is not, and cross-AZ traffic is charged in both directions — so chatty service-to-service calls spread across AZs \"for high availability\" quietly bill per gigabyte.",
      },
      {
        id: "aws-shared-responsibility-and-cost-q3",
        prompt: "A batch rendering job runs for hours, is checkpointed, and can restart safely. Which pricing model fits?",
        options: [
          "Lambda, since it scales to zero between runs",
          "Spot — up to 90% off spare capacity, reclaimed with a two-minute warning",
          "On-demand, so the job is never interrupted",
          "Reserved instances, to lock in the lowest rate",
        ],
        answer: 1,
        explanation: "Spot is exactly the right fit for batch, CI, rendering, and ML training — interruptible work that is checkpointed and restartable. It's wrong for your database. Lambda's 15-minute ceiling rules it out for a multi-hour render.",
      },
    ],
  },
];
