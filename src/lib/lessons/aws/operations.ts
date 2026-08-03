import type { Lesson } from "../types";

export const operationsLessons: Lesson[] = [
  {
    id: "aws-kms-and-secrets",
    module: "operations",
    title: "KMS & Secrets Manager — Keys and Credentials",
    blurb: "envelope encryption in one picture, and the rotation question that decides which secret store you want.",
    content: `## KMS: the key never leaves

**KMS** holds keys in hardware and performs cryptographic operations on your behalf. A KMS key's material cannot be exported — you send KMS a small piece of data and it returns the encrypted version, or you ask it for a data key.

That second one is the important mechanism, because encrypting a 5 GB file through an API is not viable. **Envelope encryption**:

\`\`\`
1. ask KMS for a data key   -> returns { plaintext key, encrypted key }
2. encrypt your data LOCALLY with the plaintext key   (fast, no size limit)
3. store the ENCRYPTED key alongside the ciphertext
4. throw the plaintext key away
5. to decrypt: send the encrypted key to KMS, get the plaintext back, decrypt locally
\`\`\`

This is what "encryption at rest" means everywhere in AWS. S3, EBS, RDS, DynamoDB — all of them are doing exactly this under the label "SSE-KMS", and understanding it turns a checkbox into something you can reason about.

The consequence worth remembering: **access to the data requires access to the key.** A KMS key policy that doesn't allow a role is an access denial that looks like a storage problem. Cross-account access to an encrypted bucket needs both the bucket policy *and* the key policy.

Key types: **AWS-managed** (free, automatic, minimal control), **customer-managed** ($1/month, your policy, your rotation schedule, and it appears in CloudTrail), and **CloudHSM-backed** for single-tenant hardware requirements.

## Secrets Manager vs Parameter Store

Both store configuration; the difference is what you're willing to pay for.

\`\`\`
                     Secrets Manager           SSM Parameter Store
price                ~$0.40/secret/month       standard tier FREE
rotation             BUILT IN, with Lambda     you build it
                     and native RDS support
cross-region replica yes                       no
size limit           64 KB                     4 KB (8 KB advanced)
\`\`\`

**Automatic rotation is the whole reason Secrets Manager exists.** For RDS it's a managed integration: it creates a new password, updates the database, and updates the secret, with no downtime because it alternates users. Building that yourself is real work, and paying $0.40/month to not build it is usually correct.

Parameter Store's free standard tier is the right answer for the much larger set of things that are configuration rather than credentials — feature flags, endpoint URLs, tuning values, AMI ids. SecureString parameters are still KMS-encrypted, so "not a secret store" would be unfair; it just has no rotation.

## Common use cases

- **Database credentials with rotation** — Secrets Manager, the canonical case.
- **Third-party API keys** — rotation via a custom Lambda.
- **Application configuration** — Parameter Store, free, hierarchical paths like \`/app/prod/db/host\`.
- **Encryption at rest everywhere** — a customer-managed KMS key per data domain, so you can audit and revoke at that granularity.
- **Application-level field encryption** — envelope-encrypt a PII column so it's protected even inside the database.
- **Cross-account data sharing** — a KMS key policy is often the cleanest place to express who may read what.

## When it's the wrong reach

**A secret in an environment variable that never rotates** is what these services replace — and Lambda environment variables in particular are visible to anyone with \`lambda:GetFunctionConfiguration\`. Fetch at cold start and cache instead.

Equally, **don't fetch a secret on every invocation**: Secrets Manager is billed per 10,000 API calls and adds latency. Cache it for the life of the execution environment, with a refresh window shorter than the rotation period.`,
    exercises: [],
  },
  {
    id: "aws-cloudwatch-and-observability",
    module: "operations",
    title: "CloudWatch, CloudTrail & X-Ray",
    blurb: "the three questions — is it healthy, who did that, where did the time go — and which service answers each.",
    content: `## Three services, three different questions

\`\`\`
CloudWatch    "is it healthy, and what is it doing?"     metrics, logs, alarms, dashboards
CloudTrail    "who called which API, and when?"          an audit log of every AWS API call
X-Ray         "where did the latency go in this request?" distributed traces
\`\`\`

People conflate the first two constantly. CloudWatch Logs holds *your application's* output. CloudTrail records *control-plane actions* — someone deleting a security group, a role being assumed, a KMS key being used. When the question is "who changed this?", it's always CloudTrail.

## CloudWatch, concretely

**Metrics** arrive free from every AWS service at 5-minute resolution (1-minute with detailed monitoring). Custom metrics cost per metric, and the cost driver people miss is **dimensions**: every unique combination is a separate metric. A dimension with high cardinality — a user id, a request id — produces an enormous bill. Use **Embedded Metric Format**, which lets you emit structured logs that CloudWatch extracts metrics from, so the high-cardinality fields stay queryable in logs without becoming metrics.

**Logs Insights** is the query language over log groups, and it's better than most people realize:

\`\`\`
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)
\`\`\`

Set a **retention policy on every log group** — the default is "never expire", and forgotten log groups are a genuinely common line item.

**Alarms** watch a metric against a threshold for N periods and publish to SNS. The two failure modes are symmetric and both common: alarms so noisy nobody reads them, and alarms only on infrastructure metrics so a fully broken application looks healthy. Alarm on what users experience — error rate, p99 latency, queue age — and use composite alarms to suppress the downstream noise when an upstream alarm is already firing.

## X-Ray

Instrument your services and X-Ray reconstructs a request's path across them, with a timing breakdown per hop:

\`\`\`
API Gateway  |=|
  Lambda       |=========================|
    DynamoDB      |==|
    HTTP call        |==================|     <- there it is
\`\`\`

It samples (1 request/second plus 5% by default), so it's for finding *where* time goes and which dependency is slow, not for auditing every request. It's the fastest way to answer "the API got slow and I don't know which of nine services did it."

## Common use cases

- **The standard alarm set** — error rate, p99 latency, SQS queue age, DLQ depth, Lambda throttles, RDS connections and CPU.
- **Log-based alerting** — a metric filter counting \`ERROR\` lines, alarmed on.
- **CloudTrail for the incident question** — "when did that security group change, and who did it?"
- **CloudTrail to S3, queried with Athena** — the practical way to search months of audit history.
- **Container Insights / Lambda Insights** — per-container and per-function resource metrics.
- **Synthetics canaries** — a scripted browser hitting your endpoint continuously, so you find out before your users do.
- **X-Ray service maps** — a live picture of what calls what, which is usually more accurate than the architecture diagram.

## When it's the wrong reach

CloudWatch is not a great long-horizon analytics store; for retrospective analysis across months, export to S3 and use Athena. And if your organization already runs Datadog, Grafana, or an OpenTelemetry pipeline, adding CloudWatch dashboards alongside splits attention during an incident — pick where people look, and ship everything there.

> [Observability](/library/observability) in the library covers the metrics/logs/traces model and what to alert on; this lesson maps it onto the AWS services.`,
    exercises: [],
  },
  {
    id: "aws-iac",
    module: "operations",
    title: "Infrastructure as Code — CloudFormation, CDK & Terraform",
    blurb: "why the console is a dead end, and the honest comparison of the three tools.",
    content: `## Why the console stops working

Clicking through the console is fine to learn and untenable to operate. It leaves no record of what was created or why, can't be reviewed, can't be reproduced in a second region or account, and drifts silently from whatever your diagram says. The moment there's a staging environment and a production environment, "the same, but I set them up six months apart" becomes a category of bug.

Infrastructure as code makes the environment a reviewed, versioned artifact. The property that matters most is that it's **declarative**: you describe the desired end state and the tool computes the diff. That's what makes an apply repeatable rather than a script that only works once.

## The three tools

\`\`\`
                CloudFormation        CDK                     Terraform
language        YAML/JSON             TypeScript, Python,     HCL
                                      Java, Go, C#
runs on         AWS-managed           synthesizes to CFN      your runner / Cloud
state           AWS holds it          AWS holds it            a state FILE you must manage
multi-cloud     no                    no                      yes
abstraction     verbose, explicit     loops, conditionals,    modules
                                      real functions
\`\`\`

**CloudFormation** is AWS's native engine. It manages state for you, supports change sets (a diff you approve before applying) and automatic rollback on failure. The cost is verbosity — a modest VPC is hundreds of lines of YAML with no loops.

**CDK** is the ergonomic answer: write TypeScript or Python, and it synthesizes CloudFormation. You get real abstraction — a class for "our standard service" instantiated five times — plus type checking and IDE completion. Its higher-level constructs apply sensible defaults (an L2 \`Bucket\` is encrypted and non-public without you asking). The tradeoff is a layer of indirection: when something breaks you're debugging generated CloudFormation, and CDK's own upgrades occasionally churn resources.

**Terraform** is the multi-cloud standard with the largest provider ecosystem, and it's frequently the right answer even in an AWS-only shop simply because the team already knows it. The distinctive burden is **state**: a file recording what Terraform believes exists, which must live in remote storage (S3 with locking) and must not be lost or corrupted — losing state means Terraform no longer knows it owns your infrastructure.

## Common use cases

- **The whole environment as a repo** — VPC, clusters, databases, IAM, alarms, reviewed in pull requests.
- **Reproducible environments** — the same stack parameterized into dev, staging, and prod.
- **Multi-account landing zones** — Control Tower and StackSets deploying a baseline into every account.
- **SAM / CDK for serverless** — function, API, table, and permissions defined together in one deployable unit.
- **Drift detection** — CloudFormation will tell you what someone changed by hand.
- **Policy as code** — cfn-guard, OPA, or Checkov failing a pull request that opens 0.0.0.0/0 on port 22.

## When it's the wrong reach

Not everything belongs in the same stack. **Separate the slow-moving from the fast-moving**: a VPC and a database change monthly; an application changes daily. Putting them in one stack means every deploy risks the database, and a failed rollback can be genuinely dangerous.

Also, **IaC does not manage data**. Terraform will happily plan a change that replaces an RDS instance. Read the plan — especially the lines that say *replace* — every time. Deletion protection on stateful resources exists because this has bitten everyone at least once.

## The rule that makes it work

**Once a resource is managed by code, never touch it in the console.** A hand-edit that the tool doesn't know about will be reverted on the next apply, or worse, cause a confusing failure. The console becomes a read-only window — and that discipline, more than the tool choice, is what actually delivers the benefit.

> [Deploys & rollouts](/library/deploys-and-rollouts) in the library covers the release side — blue/green, canaries, and rollback — which sits directly on top of this.`,
    exercises: [],
  },
];
