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
];
