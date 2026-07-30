export type SystemDesignQuestion = {
  id: string;
  title: string;
  prompt: string;
};

export const SYSTEM_DESIGN_QUESTIONS: SystemDesignQuestion[] = [
  {
    id: "url-shortener",
    title: "URL Shortener (bit.ly)",
    prompt:
      "Design a URL shortening service (like bit.ly). It must accept a long URL and return a short alias that redirects to the original. Support custom short codes chosen by the user, click analytics, and very high read scale (billions of redirects per day) with millions of new URLs created daily. Expiration and rate limiting for abuse should be considered.",
  },
  {
    id: "twitter-x",
    title: "Twitter / X (home timeline)",
    prompt:
      "Design the core of Twitter/X focused on posting tweets and viewing a home timeline. Users follow others and should see recent tweets from accounts they follow (reverse chronological or lightly ranked). Support ~300M daily active users with very spiky global events. Key concerns: posting latency, fan-out on write vs read, timeline generation at scale, and handling media.",
  },
  {
    id: "instagram-feed",
    title: "Instagram (photo/video feed)",
    prompt:
      "Design a photo and short video sharing service like Instagram. Users can post media with captions, follow others, like, comment, and view a personalized feed. Handle massive scale for uploads, storage, and feed generation. Consider image/video optimization, CDNs, consistency model for likes/comments, and feed ranking vs freshness.",
  },
  {
    id: "distributed-rate-limiter",
    title: "Distributed Rate Limiter",
    prompt:
      "Design a distributed rate limiting service that can be called by many API gateways / services. Support flexible policies (per user, per IP, per API key), multiple algorithms (token bucket, sliding window), very low latency decisions (<10ms p99), and accuracy even when the limiter itself is partitioned or under attack. Must handle millions of QPS.",
  },
  {
    id: "realtime-chat",
    title: "Real-time Chat System",
    prompt:
      "Design a real-time messaging system supporting both 1:1 and group chats. Must support presence (online/offline), read receipts, message history, and delivery to offline users. Target: tens of millions of concurrent users, low latency message delivery, and correct ordering even across multiple data centers.",
  },
  {
    id: "ride-sharing",
    title: "Ride-Sharing (matching + tracking)",
    prompt:
      "Design the core backend for a ride-sharing service (like Uber). Riders request a ride; nearby drivers are matched in real time; the trip is tracked with ETAs and live location. Handle surge pricing, geolocation at scale, driver/rider matching, payments, and very high write throughput for location updates during peak hours in big cities.",
  },
  {
    id: "distributed-cache",
    title: "Distributed Cache (Redis-like)",
    prompt:
      "Design a distributed in-memory cache service. It must support get/set with TTLs, high read throughput, and tolerate node failures. Consider consistent hashing, replication strategy, cache invalidation patterns, hot key handling, and memory eviction policies. Target: sub-millisecond reads and the ability to scale to terabytes of cached data.",
  },
  {
    id: "notification-service",
    title: "Notification / Messaging Service",
    prompt:
      "Design a system that sends notifications to users via multiple channels (push, email, SMS, in-app). Producers (other services) send events; users have preferences and can be on multiple devices. Must support high volume, retry/backoff, deduplication, and preference management. Consider fan-out, rate limiting per user, and delivery guarantees.",
  },
  {
    id: "typeahead-search",
    title: "Search Typeahead / Autocomplete",
    prompt:
      "Design a low-latency typeahead / autocomplete service (e.g. for search box or mentions). As the user types, it should return relevant completions or results in <100ms. Support prefix matching, ranking by popularity or personalization, and very high QPS. Consider trie vs other structures, caching, sharding of the index, and handling of typos or trending terms.",
  },
  {
    id: "file-storage",
    title: "File / Object Storage (Dropbox-like)",
    prompt:
      "Design a file storage and sync service. Users can upload, download, share, and sync files/folders across devices. Support very large files, versioning, concurrent edits (at least conflict detection), permissions, and search. Key challenges: chunking + deduplication, storage tiering, metadata vs blob storage, and handling billions of files with strong durability.",
  },
  {
    id: "dropbox-sync",
    title: "Dropbox (file sync across devices)",
    prompt:
      "Design the sync engine for Dropbox. A user edits files on one device and the changes appear on their other devices and shared folders within seconds. Focus on the client-server sync protocol: detecting local changes, delta sync (uploading only changed blocks), resuming interrupted transfers, and offline edits that reconcile on reconnect. Handle conflicting edits from two devices (conflict copies vs merging), sync of huge folders with millions of small files, shared folders where one member's change fans out to thousands of others, and keeping battery/bandwidth cost low on laptops and phones.",
  },
  {
    id: "web-crawler",
    title: "Web Crawler",
    prompt:
      "Design a web crawler that continuously discovers and downloads pages to feed a search index. It must crawl billions of pages, be polite (respect robots.txt and per-domain rate limits), deduplicate both URLs and near-identical content, and keep popular pages fresh. Consider the URL frontier design, distributing the crawl across machines, traps (infinite URL spaces), and prioritization of what to crawl next.",
  },
  {
    id: "video-streaming",
    title: "Video Streaming (YouTube/Netflix)",
    prompt:
      "Design a video streaming platform like YouTube. Users upload videos that must be transcoded into multiple resolutions/formats and served globally with low startup latency. Consider the upload and transcoding pipeline at scale, CDN strategy and cache hierarchy, adaptive bitrate streaming, serving viral vs long-tail content, and keeping view counts and watch history at billions of events per day.",
  },
  {
    id: "collaborative-docs",
    title: "Collaborative Editing (Google Docs)",
    prompt:
      "Design a real-time collaborative document editor like Google Docs. Multiple users edit the same document concurrently and see each other's changes and cursors within ~100ms. Key challenges: concurrent conflict resolution (operational transforms vs CRDTs), document storage and version history, offline editing and reconnection, permissions/sharing, and scaling a single hot document with many simultaneous editors.",
  },
  {
    id: "payment-system",
    title: "Payment System",
    prompt:
      "Design a payment system for a large e-commerce site. It must integrate with external payment providers, guarantee a customer is never double-charged despite retries, timeouts, and partial failures, and support refunds and chargebacks. Consider idempotency keys, the ledger and double-entry bookkeeping, distributed transactions vs sagas, reconciliation against provider records, and strict auditability.",
  },
  {
    id: "job-scheduler",
    title: "Distributed Job Scheduler",
    prompt:
      "Design a distributed job scheduler (cron-as-a-service). Users register one-off and recurring jobs; the system executes them at the right time with retries, priorities, and per-tenant rate limits, supporting tens of millions of scheduled jobs. Consider at-least-once vs exactly-once execution, clock skew, partitioning the schedule across workers, leader election or coordination, misfire handling, and monitoring job health.",
  },
  {
    id: "metrics-monitoring",
    title: "Metrics & Monitoring (Datadog-like)",
    prompt:
      "Design a metrics and monitoring system like Datadog or a large-scale Prometheus. Services emit millions of data points per second; users build dashboards and define alerts. Consider the ingestion pipeline, time-series storage and compression, downsampling and retention tiers, the tag/label cardinality explosion problem, low-latency alert evaluation, and keeping the monitoring system itself reliable when everything else is on fire.",
  },
  {
    id: "top-k-trending",
    title: "Top-K / Trending (hashtags, videos)",
    prompt:
      "Design a service that computes the top K most popular items in near real time — for example trending hashtags or most-viewed videos over the last 5 minutes, 1 hour, and 1 day. The event stream is millions of events per second. Consider exact vs approximate counting (count-min sketch, etc.), sliding vs tumbling windows, stream processing topology, merging partial results across shards, and serving reads with low latency.",
  },
  {
    id: "proximity-search",
    title: "Proximity Search (Yelp nearby)",
    prompt:
      "Design a proximity service like Yelp's 'restaurants near me'. Given a user's location, return nearby businesses with filters and ranking, at high read QPS. Consider geospatial indexing approaches (geohash, quadtree, S2), how to shard and cache a read-heavy workload, keeping business data fresh as owners update it, ranking by distance plus relevance, and handling dense city centers vs sparse rural areas.",
  },
  {
    id: "google-maps",
    title: "Google Maps (routing + traffic)",
    prompt:
      "Design Google Maps, focusing on map display, turn-by-turn navigation, and accurate ETAs. Consider modeling the road network as a graph, shortest-path routing at continental scale (precomputation/contraction hierarchies vs live computation), ingesting GPS probes from millions of devices to derive live traffic, map tile storage and CDN delivery, and re-routing users as conditions change mid-trip.",
  },
  {
    id: "qa-platform",
    title: "Q&A Platform (Quora)",
    prompt:
      "Design a Q&A platform like Quora. Users post questions, write answers, upvote, comment, and follow topics or people; a personalized feed surfaces relevant content. Consider the data model for questions/answers/votes at scale, feed generation blending recency, quality, and personalization, vote counting at high write throughput, duplicate-question detection, search, and caching for a read-heavy workload.",
  },
  {
    id: "deployment-system",
    title: "Global Deployment System (CI/CD)",
    prompt:
      "Design a global deployment system that ships code from merge to production across tens of thousands of servers in multiple regions. Support staged rollouts (canary, percentage-based), health checks with fast automatic rollback, config vs binary deploys, and many teams deploying concurrently. Consider artifact distribution at scale, orchestrating rollout state, detecting bad versions quickly, and limiting the blast radius of a bad config push.",
  },
  {
    id: "llm-chat-service",
    title: "LLM Chat Service (ChatGPT)",
    prompt:
      "Design the serving infrastructure for a ChatGPT-like conversational AI product. Users hold streaming, multi-turn conversations with a large language model. Consider request routing and queueing onto a constrained GPU fleet, token streaming to clients, conversation history storage and context assembly, latency targets per turn, rate limiting and abuse prevention, caching opportunities, and degrading gracefully under load spikes.",
  },
  {
    id: "rag-support-bot",
    title: "AI Support Bot (RAG)",
    prompt:
      "Design an LLM-powered customer support bot grounded in a company's knowledge base (retrieval-augmented generation). It must answer from current documentation, cite sources, hand off to human agents when unsure, and never leak one customer's data to another. Consider the ingestion and indexing pipeline (chunking, embeddings, vector search), keeping the index fresh as docs change, retrieval quality and ranking, prompt assembly, guardrails and evaluation, and cost/latency at millions of conversations.",
  },
  {
    id: "message-queue",
    title: "Distributed Message Queue (Kafka)",
    prompt:
      "Design a distributed messaging queue like Kafka. Producers publish to topics; consumer groups read at their own pace with ordering guarantees within a partition. Consider partitioning and replication, leader election and failover, delivery semantics (at-least-once vs exactly-once), consumer offset management and rebalancing, retention and log compaction, back-pressure, and sustaining millions of messages per second.",
  },
  {
    id: "kv-store",
    title: "Key-Value Store (DynamoDB)",
    prompt:
      "Design a distributed, durable key-value store like DynamoDB or Cassandra. Support get/put at single-digit-millisecond latency with high availability across regions. Consider the consistency model (strong vs eventual, quorum reads/writes), partitioning via consistent hashing, replication and conflict resolution (vector clocks, last-write-wins), hinted handoff and anti-entropy repair, hot partitions, and storage engine choices like LSM trees.",
  },
  {
    id: "id-generator",
    title: "Unique ID Generator (Snowflake)",
    prompt:
      "Design a distributed unique ID generation service like Twitter Snowflake. IDs must be unique across many data centers, roughly sortable by time, and generated at millions per second with very low latency. Consider the ID layout (timestamp/machine/sequence bits), clock skew and clocks moving backwards, coordinated vs coordination-free schemes, and the tradeoffs versus UUIDs or database sequences.",
  },
  {
    id: "ticket-booking",
    title: "Ticketmaster (flash-sale booking)",
    prompt:
      "Design a ticket booking system like Ticketmaster for high-demand events. When sales open, hundreds of thousands of users compete for a fixed set of seats; the system must never sell the same seat twice and never strand inventory. Consider seat holds with expiry during checkout, database contention on hot events (locking vs reservation queues), a waiting room / virtual queue to absorb the thundering herd, payment failures releasing inventory, and keeping seat-map views reasonably fresh without melting the backend.",
  },
  {
    id: "stock-exchange",
    title: "Stock Exchange (matching engine)",
    prompt:
      "Design a stock exchange. Traders submit buy/sell orders (market and limit); a matching engine pairs them by price-time priority and publishes market data. Requirements: microsecond-level matching latency, strict fairness in ordering, no lost or duplicated orders even across crashes. Consider the order book data structure, single-threaded matching vs partitioning by symbol, durability via event sourcing / replicated logs, fan-out of market data to thousands of subscribers, and how to fail over without reordering or replaying trades incorrectly.",
  },
  {
    id: "recommendation-system",
    title: "Recommendation System (TikTok For You)",
    prompt:
      "Design the recommendation system behind a feed like TikTok's For You page or Netflix suggestions. Every scroll requests fresh, personalized content selected from hundreds of millions of items. Consider the multi-stage funnel (candidate generation, filtering, ranking), embeddings and approximate nearest-neighbor retrieval, a feature store serving online features at low latency, incorporating real-time signals (a video you just skipped) vs batch-trained models, exploration vs exploitation for new content, and evaluating whether the system is actually working.",
  },
  {
    id: "distributed-lock",
    title: "Distributed Lock / Coordination (Zookeeper)",
    prompt:
      "Design a distributed coordination service like Zookeeper or Chubby that other systems use for locks, leader election, and configuration. Clients acquire locks and must be safe even when processes pause (GC), clocks drift, or the network partitions. Consider consensus for the replicated core (Paxos/Raft), leases and session timeouts, fencing tokens to protect against zombie lock holders, watch/notification semantics, read scaling vs linearizability, and why 'just use Redis SETNX' falls short.",
  },
  {
    id: "ad-click-aggregation",
    title: "Ad Click Aggregation & Billing",
    prompt:
      "Design the system that counts ad clicks and bills advertisers. Billions of click events per day stream in from around the world; advertisers are charged per click and see near-real-time spend dashboards, and campaigns must stop when budgets are exhausted. Consider exactly-once aggregation despite retries and duplicate events, late and out-of-order events with watermarks, fraud/bot click filtering, stream vs batch reconciliation for the billing source of truth, stopping over-delivery on exhausted budgets within seconds, and auditability when an advertiser disputes their bill.",
  },
  {
    id: "hotel-booking",
    title: "Hotel Booking (Airbnb search + reserve)",
    prompt:
      "Design a hotel/home booking platform like Airbnb or Booking.com. Users search listings by location, dates, and filters, then book a stay; a listing must never be double-booked for overlapping dates. Consider modeling availability over date ranges (calendar tables vs interval checks), geospatial + filtered search over millions of listings, the consistency boundary between eventually-consistent search results and the transactional booking path, holds during checkout, cancellations and modifications, and price/availability caching that goes stale gracefully.",
  },
];
