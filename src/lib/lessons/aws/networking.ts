import type { Lesson } from "../types";

export const networkingLessons: Lesson[] = [
  {
    id: "aws-vpc",
    module: "networking",
    title: "VPC — Subnets, Routing & Security Groups",
    blurb: "what actually makes a subnet public, and the two firewalls that behave differently.",
    content: `## The building blocks

A **VPC** is a private network you define with a CIDR block (say \`10.0.0.0/16\`). You carve it into **subnets**, each pinned to one AZ. Every subnet has a **route table**, and that route table is the only thing that makes a subnet public or private:

\`\`\`
PUBLIC subnet     route: 0.0.0.0/0 -> Internet Gateway (IGW)
PRIVATE subnet    route: 0.0.0.0/0 -> NAT Gateway      (out only)
ISOLATED subnet   no 0.0.0.0/0 route at all
\`\`\`

There is no "public" checkbox with meaning beyond that. A subnet is public because its traffic to the internet goes via an IGW — nothing else.

## The standard three-tier layout

\`\`\`
AZ-a                  AZ-b                  AZ-c
public   10.0.0.0/24  10.0.1.0/24  10.0.2.0/24    ALB, NAT gateways
private  10.0.10.0/24 10.0.11.0/24 10.0.12.0/24   app servers, containers, Lambda
private  10.0.20.0/24 10.0.21.0/24 10.0.22.0/24   RDS, ElastiCache
\`\`\`

Three AZs, three tiers. The load balancer is the only thing reachable from the internet; app servers reach out through NAT but nothing reaches in; the database tier has no internet route at all. This layout is the default for a reason and you'll see it almost everywhere.

## Two firewalls, and they are not alike

\`\`\`
                SECURITY GROUP              NETWORK ACL
attached to     an ENI (instance/service)   a subnet
rules           ALLOW only                  allow AND deny
state           STATEFUL                    STATELESS
evaluation      all rules together          numbered, first match wins
\`\`\`

**Stateful vs stateless is the practical difference.** A security group that allows inbound 443 automatically permits the response out. A NACL does not — you must also allow the outbound ephemeral port range (1024-65535), and forgetting that is the classic "the NACL is silently breaking my traffic" bug.

Security groups also do something uniquely useful: **a rule can reference another security group** rather than a CIDR. "Allow 5432 from \`sg-app\`" means the database accepts connections from anything in the app tier, no matter how it scales or what IPs it gets. That is the idiomatic way to write these rules.

Use security groups for essentially everything; use NACLs for coarse subnet-level denies (blocking a CIDR outright), which is rare.

## Connecting to things outside

- **Internet Gateway** — bidirectional internet for public subnets. Free.
- **NAT Gateway** — outbound-only for private subnets. **Charged per hour *and* per gigabyte processed**, and it's a frequent line item on surprising bills.
- **VPC endpoints** — private connectivity to AWS services without traversing the internet. **Gateway endpoints (S3, DynamoDB) are free and bypass NAT charges entirely** — the easiest cost win in networking. **Interface endpoints (PrivateLink)** put an ENI in your subnet for other services, and are billed hourly.
- **VPC peering** — one-to-one between VPCs, non-transitive. **Transit Gateway** — a hub, when you have more than a handful.

## Common use cases

- **The three-tier layout above** — practically every application VPC.
- **Lambda in a VPC** — required to reach RDS or ElastiCache privately.
- **Gateway endpoints for S3** — private access plus no NAT data charges.
- **PrivateLink to expose a service** to another account without any internet path.
- **Flow logs** to S3, queried with Athena, when you need to see what's actually talking to what.

## The debugging order

When traffic doesn't flow, check in this order — it's almost always one of these, in roughly this frequency: **security group** (inbound rule missing), **route table** (no route to the destination), **NACL** (return traffic blocked), **subnet AZ mismatch**, then DNS. Working outward from the instance beats guessing.`,
    exercises: [],
  },
  {
    id: "aws-load-balancing",
    module: "networking",
    title: "ELB — ALB, NLB & Target Groups",
    blurb: "layer 7 versus layer 4, and the pre-warming problem that used to take sites down.",
    content: `## Three balancers, one real decision

\`\`\`
ALB   Application LB    layer 7 (HTTP/HTTPS)   routes on path, host, header, method
NLB   Network LB        layer 4 (TCP/UDP/TLS)  millions of req/s, ultra-low latency, static IP
GWLB  Gateway LB        layer 3                for inserting firewall appliances
\`\`\`

The real decision is **ALB or NLB**, and it comes down to whether you need to see inside the request.

**ALB** understands HTTP, so it can route \`/api/*\` to one target group and \`/static/*\` to another, terminate TLS, redirect HTTP to HTTPS, authenticate via Cognito/OIDC before the request ever reaches you, and return fixed responses. It also gives you per-request metrics and access logs.

**NLB** just forwards packets. That makes it faster (microseconds of added latency), able to handle non-HTTP protocols, and — the reason people often pick it — it gets a **static IP per AZ**, which matters when a client's firewall needs to allowlist an address. It also preserves the source IP.

## Target groups and health checks

A listener forwards to a **target group**, which holds the actual targets (instances, IPs, Lambda functions, or another ALB) plus the health check config. The health check is the part worth care:

\`\`\`
path                 /health          make it check dependencies, not just "am I a process"
healthy threshold    2 consecutive
unhealthy threshold  2-3 consecutive
interval             10-30s
deregistration delay 30s (default 300)  <- connection draining
\`\`\`

Two things bite here. A health check so shallow it returns 200 while the database is unreachable will keep sending traffic to a broken instance. And a health check so deep that a slow dependency fails *every* instance at once will take the whole fleet out of service — a cascading failure caused by the check itself. Check what this instance can actually do, and don't fail on a dependency the whole fleet shares.

**Deregistration delay** defaults to 300 seconds; that's how long a deploy waits per instance while in-flight requests drain. Lowering it to 30 is one of the cheapest deploy-speed wins there is.

## Common use cases

- **ALB in front of ECS/EKS services** — dynamic port mapping means many containers per host, registered automatically.
- **Path-based routing to microservices** — one entry point, several backends.
- **ALB with Cognito or OIDC** — authentication at the edge, so services never see an unauthenticated request.
- **NLB for gRPC, MQTT, game traffic, or databases** — anything not HTTP.
- **NLB for a static allowlistable IP**, often with an ALB behind it.
- **ALB to Lambda** — a serverless backend without API Gateway.
- **Weighted target groups** for blue/green and canary shifts.

## When it's the wrong reach

An internal service called only by other services in the same VPC may not need a load balancer at all — ECS Service Connect, Cloud Map, or a service mesh handle discovery and balancing without the hop and the hourly charge. And an ALB is not a CDN: for static assets, CloudFront in front is both faster and cheaper.

## The pre-warming footnote

ALBs and NLBs scale themselves, but not instantly — a step change from near-zero to enormous traffic (a product launch, a load test) can outrun the scaling. NLBs handle this far better. For a scheduled traffic spike on an ALB, ramping load beforehand is real practice, not superstition.

> [Load balancing](/library/load-balancing) in the library covers the algorithms and health-check theory generally — this lesson is about which AWS balancer implements them.`,
    exercises: [],
  },
  {
    id: "aws-route-53",
    module: "networking",
    title: "Route 53 — DNS as a Routing Layer",
    blurb: "DNS you can program, health-check-driven failover, and why TTL sets your recovery time.",
    content: `## More than name resolution

Route 53 is a DNS service, but the interesting part is that its answers can depend on health, geography, and weight. That turns DNS into a routing layer — the outermost one you have, sitting in front of every region.

## The routing policies

\`\`\`
Simple        one answer                        the default
Weighted      10% here, 90% there               canary releases, gradual migration
Latency       lowest-latency region for the     global apps
              client's network location
Failover      primary, with a secondary when    active-passive DR
              the health check fails
Geolocation   by the user's country/continent   compliance, localized content
Geoproximity  by distance, with a bias dial     shifting traffic between regions
Multivalue    up to 8 healthy answers           poor-man's balancing with health
\`\`\`

**Health checks** are what make several of these work. Route 53 probes an endpoint from multiple locations and stops returning records that fail — which is how DNS-level failover happens without anyone pressing a button.

## Alias records — use these

An **alias** is a Route 53-specific record that points at an AWS resource (ALB, CloudFront, S3 website, API Gateway) rather than an IP or a name:

\`\`\`
CNAME                            ALIAS
cannot exist at the zone apex    CAN be at the apex (example.com)
counts as a DNS query (billed)   free
resolves to a name, then again   resolves directly to the resource's IPs
\`\`\`

The apex point is the practical one: you cannot CNAME \`example.com\` — the DNS spec forbids it. Alias records are how \`example.com\` points at a load balancer at all.

## TTL is your recovery time

The number people underestimate. If a record has a 24-hour TTL and you need to fail over, resolvers around the world keep handing out the old answer for up to a day. Nothing you do at the DNS provider changes that.

\`\`\`
records you may need to fail over fast    60s TTL
stable records (MX, TXT)                  3600-86400s
before a planned migration                lower the TTL 48 hours ahead
\`\`\`

And DNS failover is never *precise*: browsers, OS resolvers, and JVMs all cache independently, some of them ignoring TTL entirely. **DNS is the right tool for regional failover; it is the wrong tool for anything needing sub-minute precision** — that's what a load balancer's health checks are for, one layer down.

## Common use cases

- **Apex domain to an ALB or CloudFront** via alias — the everyday case.
- **Multi-region active-passive DR** — failover routing with a health check on the primary.
- **Global latency routing** — users served from their nearest region.
- **Weighted canary** — 5% of traffic to a new stack, watched, then ramped.
- **Private hosted zones** — internal DNS resolvable only inside your VPCs.
- **Domain registration** — Route 53 is a registrar too, which keeps renewals and records in one place.

## When it's the wrong reach

For fine-grained, fast traffic shifting, prefer a layer that isn't cached by every resolver on earth: weighted target groups on an ALB, or **AWS Global Accelerator**, which gives you static anycast IPs and shifts traffic between regions in seconds with no DNS involved. Reach for Global Accelerator when DNS TTLs are the thing standing between you and a fast failover.`,
    exercises: [],
  },
  {
    id: "aws-cloudfront",
    module: "networking",
    title: "CloudFront — The CDN Layer",
    blurb: "moving bytes to the user, and the cache key that decides whether any of it works.",
    content: `## Two wins, one of them overlooked

CloudFront caches your content at 400+ edge locations. The obvious win is **latency**: a user in Sydney gets a file from Sydney instead of Virginia, turning a 200ms round trip into 10ms.

The less obvious win is that **even uncacheable requests get faster**. The user's TCP and TLS handshakes terminate at the nearby edge, and the edge holds a warm, optimized connection back to your origin over AWS's backbone rather than the public internet. For a dynamic API, that alone can cut a meaningful chunk of latency — which is why putting CloudFront in front of an API is worth doing even at a 0% cache hit rate.

There's a cost angle too: **data transfer out via CloudFront is cheaper than straight from S3 or EC2**, and origin requests drop with every cache hit.

## The cache key is the whole game

An object is cached under a **cache key**. Whatever you include in it multiplies your cache entries:

\`\`\`
included in key      effect
path                 always
query strings        include ONLY the ones that change the response
headers              each distinct value = a separate cached copy
cookies              a session cookie in the key = a cache entry PER USER = 0% hit rate
\`\`\`

That last line is the single most common CloudFront mistake: forwarding all cookies to the origin and including them in the key, which means nothing is ever shared between users. **Forward what the origin needs; key on only what changes the bytes.**

## TTLs and invalidation

Cache duration comes from the origin's \`Cache-Control\` header, bounded by the distribution's min/default/max TTL. You can invalidate paths explicitly, but invalidations are slow (minutes) and billed past the first thousand a month.

The better pattern is **versioned filenames**: \`app.a3f9c1.js\` with a one-year TTL, and the HTML that references it cached for seconds. New deploy, new filename, no invalidation needed, no stale-asset bug. This is standard practice in every frontend build tool and it exists because invalidation is the worse option.

## Common use cases

- **Static assets and SPAs** — S3 origin, CloudFront distribution, versioned filenames.
- **Video streaming** — HLS/DASH segments are ideal cache objects.
- **API acceleration** — dynamic content, TLS terminated at the edge, little or nothing cached.
- **Origin protection** — Origin Access Control keeps the S3 bucket entirely private so it's reachable only through CloudFront.
- **Security at the edge** — AWS WAF and Shield attach here, which means blocking bad traffic before it costs you origin capacity.
- **Edge compute** — **CloudFront Functions** (sub-millisecond, JS, for header rewrites, redirects, A/B splits) and **Lambda@Edge** (heavier, can call other services, for auth checks and origin selection).
- **Signed URLs/cookies** for paid or private downloads.

## When it's the wrong reach

Content that is genuinely per-user and never repeated gets no cache benefit — though the connection-termination win may still justify it. Highly write-heavy APIs get nothing. And a CDN in front of a broken origin is a magnifier, not a fix: a cache miss storm after an invalidation can hit an origin harder than the raw traffic ever did.

> [CDN & object storage](/library/cdn-and-object-storage) in the library covers the general CDN model — this lesson is CloudFront's specific knobs.`,
    exercises: [],
  },
  {
    id: "aws-api-gateway",
    module: "networking",
    title: "API Gateway — Managed API Front Door",
    blurb: "what you get for the per-request price, and the HTTP-vs-REST choice nobody explains.",
    content: `## What it does

API Gateway is a managed front door for an API: it terminates TLS, authenticates and authorizes, throttles, validates, routes to a backend, and logs. The backend can be Lambda, an HTTP service, a VPC service via PrivateLink, or an AWS service directly.

The value is that authentication, rate limiting, request validation, and usage plans are configuration rather than code you write and maintain in every service.

## Three flavours, and the one you probably want

\`\`\`
                 HTTP API              REST API             WebSocket API
price/million    ~$1.00                ~$3.50               connection + message
latency          lower                 higher               n/a
JWT/OIDC auth    built in              via Lambda authorizer
API keys/usage   no                    YES                  no
request validation  limited            full                 no
caching          no                    yes                  no
WAF              no                    yes                  no
private endpoints   no                 yes                  no
\`\`\`

**HTTP API is the default now** — cheaper, faster, and it covers what most services need. Reach for **REST API** when you need something specific from that right-hand column: API keys and usage plans for third-party consumers, response caching, request validation against a schema, WAF, or private endpoints.

**WebSocket API** is a different thing entirely: it holds the long-lived connection for you and invokes your backend per message, which is how you build a chat or live-updates feature without running a stateful socket fleet.

## Authorization

- **IAM** — signed requests. For service-to-service and internal callers.
- **JWT authorizer (HTTP API)** — validate a token from Cognito, Auth0, Okta. Configuration only, no code.
- **Lambda authorizer** — your own function returns an IAM policy. The escape hatch for custom schemes; cache the result or you've added a Lambda invoke to every request.
- **Cognito user pools** — a full user directory and hosted sign-in.

## Common use cases

- **Serverless REST APIs** — the canonical Lambda backend.
- **A public API with tiers** — API keys plus usage plans giving each customer a rate and quota. This is REST API's clearest reason to exist.
- **A safe façade over a legacy backend** — auth and throttling in front of something you can't modify.
- **WebSocket features** — chat, notifications, live dashboards.
- **Direct service proxying** — put a message on SQS or an item in DynamoDB straight from the gateway, with no Lambda at all.
- **Request/response transformation** — reshaping a legacy contract into a modern one.

## When it's the wrong reach

- **Very high volume.** At a billion requests a month, ~$1,000 in gateway fees may exceed the ALB it replaces. An **ALB in front of Lambda** or a container does the routing far more cheaply, without usage plans or per-route auth.
- **Long-lived or streaming responses.** The 29-second integration timeout is a hard limit, and it's the constraint people hit first.
- **Simple internal service-to-service calls** inside one VPC — that's an internal ALB or service discovery, not a public-facing gateway.
- **When you already run an ingress.** Running API Gateway in front of an EKS ingress controller is usually two front doors doing one job.

> [APIs & protocols](/library/apis-and-protocols) and [Rate limiting](/library/rate-limiting) in the library cover the design side — this lesson is which AWS product enforces it.`,
    exercises: [],
  },
];
