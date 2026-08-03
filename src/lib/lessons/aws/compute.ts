import type { Lesson } from "../types";

export const computeLessons: Lesson[] = [
  {
    id: "aws-ec2",
    module: "compute",
    title: "EC2 — Virtual Machines You Operate",
    blurb: "the oldest primitive, its instance-family alphabet, and why 'just use EC2' is often wrong now.",
    content: `## What it actually is

An EC2 instance is a virtual machine on a host you don't see. You pick a size, an image (AMI), a network (VPC subnet), a firewall (security group), and a role. You get a Linux or Windows box and root on it. Everything above the hypervisor is yours: patches, runtime, process supervision, log shipping.

That is the whole value proposition and the whole cost. Maximum control, maximum operational surface.

## Reading the instance name

The naming looks cryptic and is actually systematic:

\`\`\`
m7g.xlarge
|||  |
||'--- generation (7) and options (g = Graviton/ARM, i = Intel, a = AMD, d = local disk)
|'---- family
'----- size: large, xlarge, 2xlarge ... (each step doubles vCPU and RAM)

t  burstable      cheap, accrues CPU credits — dev boxes, low-traffic services
m  general        balanced 4 GB RAM per vCPU — the default guess
c  compute        2 GB per vCPU — encoding, simulation, busy web tiers
r  memory         8 GB per vCPU — caches, in-memory DBs, big JVMs
i  storage        fast local NVMe — databases that want local disk
g/p GPU           inference, training, rendering
\`\`\`

Two practical notes. **Graviton (the \`g\` suffix) is ~20% cheaper for similar performance** and most things that run on Linux run on ARM now — it's the easiest saving in the list. And **\`t\` instances burst on credits**: when a t3 exhausts its credits it is throttled to a few percent of a vCPU, which presents as a service that mysteriously grinds to a halt under sustained load. Never put a steady production workload on a burstable.

## Common use cases

- **Lift-and-shift** — an existing app with a filesystem, a daemon, and assumptions that don't survive containerization.
- **Anything needing the host** — a specific kernel, a custom AMI, GPU drivers, licensed software bound to a machine.
- **Long-lived stateful processes** — a game server, a build agent, a broker you run yourself.
- **Spot fleets for batch** — rendering, CI, ETL, ML training: interruptible work at up to 90% off.
- **The escape hatch** — when a managed service almost fits but not quite, EC2 always fits.

## When it's the wrong reach

If your workload is "run this stateless container" or "run this function on an event", EC2 makes you build and operate what Fargate or Lambda already did: AMI pipelines, autoscaling policies, health checks, patching, log agents. Reach for EC2 when you need the machine — not because it's familiar.

## The comparison people get wrong

\`\`\`
                EC2              Fargate             Lambda
unit            a machine        a container         a function invocation
you patch       OS + runtime     runtime only        nothing
scales in       minutes          ~30-60s             ~100ms
max duration    forever          forever             15 minutes
billing         per second, up   per second, up      per ms, zero at idle
\`\`\`

> Instance replacement, AMI bakes, and blue/green rollouts are the same ideas as [Deploys & rollouts](/library/deploys-and-rollouts) in the library — this lesson is about the machine underneath them.`,
    exercises: [],
  },
  {
    id: "aws-lambda",
    module: "compute",
    title: "Lambda — Functions Without Servers",
    blurb: "the execution model, what a cold start really is, and the shapes that fit in 15 minutes.",
    content: `## The model

You upload a function. AWS runs it when something triggers it, and bills you per millisecond of execution × the memory you configured. At idle you pay nothing. There is no machine to patch, no autoscaling policy to write — concurrency scales with the arrival rate automatically.

The constraints that shape every design decision:

\`\`\`
max duration        15 minutes
memory              128 MB - 10 GB   (CPU scales WITH memory — this matters)
/tmp scratch        512 MB - 10 GB
payload             6 MB sync, 256 KB async
default concurrency 1,000 per region  (a soft limit, raiseable)
\`\`\`

**CPU is tied to memory.** At 1,769 MB you get one full vCPU. This is why bumping a CPU-bound function from 512 MB to 1,792 MB often makes it *cheaper*: it finishes more than 3× faster, and you're billed on duration.

## Cold starts, honestly

When no warm execution environment exists, AWS must create one: download your code, start the runtime, run your init code, then invoke the handler.

\`\`\`
[ download + start runtime ]  [ your init ]  [ handler ]
 ~100-400ms typical            yours          the only part
 (Java/.NET can be seconds)                   a warm call pays
\`\`\`

Everything outside the handler runs once per environment, not once per request — so **create your SDK clients and DB connections at module scope**, not inside the handler. What makes cold starts genuinely bad: a fat deployment package, a JVM, and VPC-attached functions in the old days (that's been largely fixed since 2019 — the ENI is now pre-created). For latency-critical paths, Provisioned Concurrency keeps environments warm for a fee.

## Common use cases

- **HTTP APIs behind API Gateway or a Lambda function URL** — the classic serverless backend.
- **Event handlers** — an S3 upload triggering a thumbnailer, a DynamoDB stream fanning out changes, an SQS queue being drained.
- **Scheduled jobs** — EventBridge cron replacing a crontab on a box someone has to remember to patch.
- **Glue between services** — the small transformations and routing that would otherwise be a whole service.
- **Spiky, low-duty-cycle workloads** — something invoked 200 times an hour costs cents and needs no capacity planning at all.

## When it's the wrong reach

- **Anything over 15 minutes** — a long ETL or a video transcode belongs in Fargate, Batch, or Step Functions.
- **Sustained high throughput** — a function running flat out all day costs several times the equivalent Fargate task. Serverless economics reward idleness.
- **Latency floors in the low milliseconds** — cold starts and the invoke overhead are real.
- **Chatty database access** — thousands of concurrent Lambdas each opening a Postgres connection will exhaust the connection limit. RDS Proxy exists precisely for this.
- **Big local state or long-lived connections** — WebSockets need API Gateway to hold the socket, not Lambda.

## The one that bites

Concurrency is a *regional* limit shared by every function in the account. One function scaling to 1,000 concurrent executions can starve every other function in the region. Reserved concurrency on the noisy one is how you build a bulkhead.`,
    exercises: [],
  },
  {
    id: "aws-containers",
    module: "compute",
    title: "ECS, Fargate & EKS — Running Containers",
    blurb: "the orchestrator-vs-capacity split, and the honest ECS-or-EKS decision.",
    content: `## Two independent choices, not three options

People say "ECS vs Fargate vs EKS" as if it were one menu. It's two:

\`\`\`
ORCHESTRATOR  — who decides what runs where?
    ECS         AWS's own. Simple, deeply integrated, no control plane to run.
    EKS         Managed Kubernetes. Standard API, huge ecosystem, more moving parts.

CAPACITY      — whose machines does it run on?
    EC2         You own the instances. You patch, you scale, you bin-pack.
    Fargate     AWS owns them. You declare CPU/memory per task; no instances exist to you.
\`\`\`

Any combination is valid: **ECS on Fargate** (the low-ops default), **ECS on EC2** (when you need GPUs, huge instances, or tighter bin-packing), **EKS on Fargate**, **EKS on EC2** (the standard Kubernetes shop).

## The ECS vocabulary, briefly

A **task definition** is the spec: image, CPU, memory, environment, IAM role, log config. A **task** is a running instance of that spec. A **service** keeps N tasks running, replaces unhealthy ones, and registers them with a load balancer. That's essentially all of it — which is the point.

## Common use cases

- **ECS on Fargate** — a stateless HTTP service in a container. The right default for most teams: no cluster to operate, no nodes to patch, scales on CPU/memory or ALB request count.
- **ECS on EC2** — you need GPU instances, local NVMe, or you're running enough containers that paying the Fargate premium per task stops making sense.
- **EKS** — you already run Kubernetes, you want the ecosystem (Helm, operators, service meshes, ArgoCD), or you need portability across clouds as a genuine requirement rather than a slogan.
- **Fargate for batch** — a job that runs for two hours (so Lambda is out) but needs no machine of its own.
- **Sidecars** — log shippers, proxies, and agents that Lambda simply cannot host.

## When it's the wrong reach

**EKS when nobody on the team knows Kubernetes.** It is a genuine operational commitment: cluster upgrades every few months, CRDs, networking plugins, RBAC on top of IAM. If your requirement is "run 6 stateless services", ECS on Fargate does that with a fraction of the concepts. Choose EKS for the ecosystem or existing expertise, not because it sounds more serious.

Equally, **Fargate for very high-density workloads** gets expensive — you pay per task's reserved CPU/memory with no bin-packing, so hundreds of small tasks cost more than a few well-packed EC2 instances.

## Where the boundary with Lambda sits

Reach for a container when you have a long-running process, need more than 15 minutes, want a sidecar, need a specific runtime, or your traffic is steady enough that per-request billing stops being a bargain. Reach for Lambda when the work is event-shaped, bursty, and short.`,
    exercises: [],
  },
  {
    id: "aws-auto-scaling",
    module: "compute",
    title: "Auto Scaling & Load-Aware Capacity",
    blurb: "the three things AWS calls scaling, and why the metric you pick decides whether it works.",
    content: `## Three different mechanisms wear the name

\`\`\`
Auto Scaling Group (ASG)     add/remove EC2 INSTANCES
Service auto scaling         add/remove ECS TASKS (or DynamoDB capacity, etc.)
Lambda concurrency           automatic — you only set ceilings
\`\`\`

An ASG also does something people forget: it *replaces* unhealthy instances. Even a fixed-size ASG of exactly 3 is doing useful work, because an instance that fails its health check is terminated and rebuilt. Setting min=max=desired is a legitimate configuration.

## Pick the metric that leads, not the one that lags

This is where scaling policies go wrong. **Target tracking** ("keep average CPU at 60%") is the right default, but only if CPU is what actually saturates:

\`\`\`
CPU-bound service         -> average CPU              good signal
I/O-bound API             -> CPU stays at 10% while latency triples  USELESS
queue worker              -> queue depth / age of oldest message     leading
web tier behind an ALB    -> requests per target                     leading
\`\`\`

For a worker draining SQS, **the age of the oldest message is the best signal there is** — it rises the moment you're falling behind, before any host metric moves.

## Why it's always too slow, and what to do

Reactive scaling is inherently late:

\`\`\`
traffic rises -> CloudWatch metric (up to 60s) -> alarm breach (2 periods)
             -> launch instance (1-2 min) -> boot + app start (1-3 min)
             -> health check passes -> receives traffic
             = often 5+ minutes AFTER the spike started
\`\`\`

The responses, in order of how often they're the right answer:

- **Scale on a leading indicator** (queue depth, request count) rather than a lagging one.
- **Shrink the boot time** — bake the AMI or container image so startup is seconds, not minutes.
- **Scale up fast, down slow** — aggressive scale-out, conservative scale-in, so you don't thrash.
- **Scheduled scaling** for known patterns — business-hours traffic and a Monday 9am spike are predictable; don't rediscover them reactively every day.
- **Keep headroom.** Running at 80% utilization means a spike has nowhere to go while you wait five minutes.

## Common use cases

- **Web tier on requests-per-target** behind an ALB.
- **Queue workers on message age** — the canonical case, and the one where scaling actually shines.
- **Scheduled capacity** for daily or weekly patterns, layered under a reactive policy as a floor.
- **Spot + on-demand mixed ASGs** — a baseline of on-demand with spot for the elastic portion.
- **DynamoDB and Aurora** — the same target-tracking idea applied to database capacity.

## When it's the wrong reach

Autoscaling does not fix a bottleneck you don't control. If the constraint is a single primary database, adding twenty app instances makes the outage worse — more connections, more contention, faster collapse. Scale the tier that's actually saturated, and make sure the tier below it can survive what you're about to point at it.

> [Failure & resilience](/library/failure-and-resilience) in the library covers the surrounding controls — backpressure, circuit breakers, load shedding — that decide whether scaling helps or accelerates a collapse.`,
    exercises: [],
  },
];
