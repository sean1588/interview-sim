import type { Lesson } from "../types";

export const retrievalLessons: Lesson[] = [
  {
    id: "ai-embeddings",
    module: "retrieval",
    title: "Embeddings & Vector Search",
    blurb: "what a vector actually encodes, what it can't encode, and why ANN search is an approximation you must budget for.",
    content: `## An embedding is a lossy compression of meaning

An embedding model maps a chunk of text to a fixed-length vector — say 768 or 1536 floats — positioned so that texts with similar *meaning* land near each other. "How do I reset my password?" and "I forgot my login credentials" share almost no words but sit close together. That's the whole value proposition: retrieval that survives paraphrase.

Similarity is nearly always **cosine similarity** — the angle between vectors, ignoring magnitude:

\`\`\`
cos(a, b) = (a . b) / (|a| |b|)     1.0  identical direction
                                    0.0  orthogonal, no relation
                                   -1.0  opposite direction
\`\`\`

Normalize your document vectors at write time and the query vector at query time, and cosine similarity collapses to a plain dot product, which is what makes billion-scale search tractable.

## What embeddings do NOT encode

This is where most RAG disappointment originates. Embeddings capture topical similarity, and that is a narrower thing than relevance:

- **Negation.** "Contains peanuts" and "does not contain peanuts" embed very close together. The vector has no logic in it.
- **Exact identifiers.** Order number \`A-99321\`, error code \`ERR_5521\`, a specific SKU — these are near-random tokens with no semantic neighbourhood. Vector search is *bad* at exactly the queries users are most confident about.
- **Numeric and temporal comparison.** "Invoices over $10,000" and "the 2019 policy" are filter predicates, not directions in a vector space.
- **Structure and authority.** Nothing distinguishes the current policy from its superseded 2017 draft if the text is similar.

The correct conclusion is not "embeddings are weak" — it's that vector search is one retrieval strategy among several, and the strong systems combine it with keyword search and metadata filters. That's the hybrid-search lesson.

## ANN: you are not doing exact search

Comparing a query against every vector is exact and linear — fine at 10k documents, hopeless at 50M. Production uses **approximate nearest neighbour** indexes:

\`\`\`
HNSW     layered proximity graph; greedy descent
         fast + high recall, memory-hungry, the common default

IVF      cluster first, search only the nearest few clusters
         cheaper memory, tune nprobe for recall vs speed

PQ       compress vectors to codes
         big memory savings, real accuracy cost; usually layered on IVF
\`\`\`

The unavoidable point: **ANN trades recall for speed.** At \`ef_search=40\` you might get 95% recall — meaning one in twenty true nearest neighbours is silently missing from your results. Nothing errors. The answer is just quietly worse.

So: measure recall against an exact brute-force baseline on a sample before you tune for latency. A retrieval bug that manifests only as "the assistant seems a bit worse lately" is exceptionally hard to find later.

## Operational realities

**Re-embedding is a migration.** Vectors from different embedding models are not comparable — not even different versions of the same model. Changing the embedding model means re-embedding the entire corpus and rebuilding the index. Budget for it; version your index.

**Asymmetry matters.** Queries are short, documents are long. Some embedding models expose distinct query/document prefixes and using them wrongly costs measurable recall.

**Dimensions cost money forever.** 1536 floats × 4 bytes × 50M chunks is ~300GB before index overhead. Some models support dimension truncation with modest quality loss — often the right trade.

## When it's the wrong reach

Reaching for a vector database when your corpus is 5,000 documents. Brute-force cosine over 5,000 vectors is a few milliseconds in-process, exact, and has no index to rebuild or drift. And reaching for vector search when the query is a literal identifier — that's an index lookup, not a similarity problem.

> The library's [Search & ranking](/library/search-and-ranking) note covers the classical retrieval side — inverted indexes, BM25, and ranking — which is the other half of every serious retrieval system.`,
    exercises: [],
    quiz: [
      {
        id: "ai-embeddings-q1",
        prompt: "A user searches your support corpus for order \"A-99321\" and vector search returns unrelated order pages. Why?",
        options: [
          "The embedding model was trained without numeric tokens",
          "Cosine similarity cannot be computed for strings containing digits",
          "The index needs more dimensions to represent identifiers",
          "Identifiers are near-random tokens with no semantic neighbourhood — embeddings encode topical similarity, so all order pages look alike",
        ],
        answer: 3,
        explanation: "Embeddings capture meaning, and one order ID means nothing different from another. Exact identifiers belong in a keyword index or a metadata filter — which is precisely why production retrieval is hybrid.",
      },
      {
        id: "ai-embeddings-q2",
        prompt: "What is the danger of tuning your ANN index for lower latency without measuring recall?",
        options: [
          "Recall loss is silent — nothing errors, some true nearest neighbours simply never appear, and quality degrades in a way that's hard to trace later",
          "Nothing; ANN indexes are exact and latency tuning only affects speed",
          "The index will begin returning duplicate results",
          "Queries will start timing out under load",
        ],
        answer: 0,
        explanation: "ANN trades recall for speed by construction. At 95% recall, one in twenty true neighbours is missing with no error raised. Measure against an exact brute-force baseline on a sample before tuning for latency.",
      },
      {
        id: "ai-embeddings-q3",
        prompt: "You want to upgrade to a newer embedding model. What does that require?",
        options: [
          "Nothing — embedding models share a common vector space by convention",
          "Re-embedding and reindexing the entire corpus, since vectors from different models (or versions) aren't comparable",
          "Re-embedding only new documents; old vectors remain valid",
          "Increasing the index dimension count to match the new model, but keeping the existing vectors",
        ],
        answer: 1,
        explanation: "Different models place meaning in different coordinate systems, so mixing them produces nonsense distances. Model upgrades are full corpus migrations — version your index and plan for a rebuild.",
      },
    ],
  },
  {
    id: "ai-chunking-and-indexing",
    module: "retrieval",
    title: "Chunking & Indexing",
    blurb: "the ingestion decisions that cap your retrieval quality before a single query runs.",
    content: `## Chunking is the highest-leverage decision in RAG

A chunk is the unit you embed and the unit you retrieve. Get it wrong and no amount of clever querying recovers — you cannot retrieve information that was split away from its context, and you cannot rank a chunk that contains four unrelated topics.

The tension is simple and unavoidable:

\`\`\`
TOO SMALL   precise embeddings, but the answer is split across chunks
            and the retrieved fragment lacks the context to be usable
            ("...must be filed within 30 days." Of what? By whom?)

TOO LARGE   full context, but the embedding is an average of several
            topics, so it's a weak match for any of them, and you burn
            prompt tokens on mostly-irrelevant text
\`\`\`

Typical landing zone is **200-500 tokens with 10-20% overlap**, but treat that as a starting point to measure from, not an answer.

## Split on structure, not on character count

The single biggest improvement over naive fixed-size splitting is respecting the document's own boundaries:

\`\`\`
markdown/docs    split on headings; keep a heading's prose with it
code             split on function/class boundaries
transcripts      split on speaker turns or topic shifts
tables           never split a table's header from its rows
PDFs             extract structure first — a two-column PDF read
                 linearly produces interleaved nonsense
\`\`\`

That last one deserves emphasis: for PDF-heavy corpora, **the extraction step is usually a bigger quality lever than the embedding model**. Teams spend weeks tuning retrieval on top of text that was already garbled at parse time.

## Give every chunk its context back

A retrieved chunk arrives naked. Two cheap fixes, both worth doing:

**Prepend a breadcrumb** to the embedded text: \`"Employee Handbook > Leave Policy > Parental Leave: <chunk>"\`. The chunk now embeds and reads with its context.

**Attach metadata** for filtering and for the model to cite: source, title, section, author, \`updated_at\`, access-control tags. Metadata filters are how you answer the queries embeddings can't — "the 2024 policy", "only docs I'm allowed to see". Access tags in particular must be applied at *query* time as a filter, never as a post-retrieval trim, or you'll leak documents into the model's context and from there into an answer.

## The freshness problem

An index is a cache of your corpus, and it goes stale exactly like one:

- **Deletions must propagate.** A deleted document that lingers in the index gets cited by your assistant. This is the RAG failure that becomes a compliance incident.
- **Updates are delete + insert**, atomically enough that a query can't see both versions.
- **Reindexing is a scheduled job with a cost.** Know what it costs and how long it takes before you need it urgently.

## Common use cases

- **Docs/support corpora** — heading-based chunks with breadcrumbs, near-verbatim citation.
- **Code search** — function-level chunks, path and language as metadata.
- **Long transcripts** — speaker-turn chunks with timestamps, so answers can link to the moment.

## When it's the wrong reach

Elaborate chunking for a corpus that fits in the context window. If your entire knowledge base is 30k tokens, put it in the prompt (and cache the prefix) — you get perfect recall and skip the whole pipeline. Chunking is a response to scale, not a ritual.

> Chunk sizing, overlap, and index rebuild costs are the same shape of problem as any partitioned store — the library's [Sharding & partitioning](/library/sharding-and-partitioning) note is the general treatment.`,
    exercises: [],
    quiz: [
      {
        id: "ai-chunking-and-indexing-q1",
        prompt: "Retrieved chunks are 100 tokens each and score well on similarity, but answers are frequently incomplete or ambiguous. What is the likely cause?",
        options: [
          "The embedding model is too small for short text",
          "Chunks are too small — the answer spans multiple chunks, and each retrieved fragment lacks the surrounding context needed to be usable",
          "Cosine similarity over-weights short chunks, so long relevant ones never rank",
          "The reranker is discarding the longer chunks in favour of shorter, denser ones",
        ],
        answer: 1,
        explanation: "Small chunks embed precisely, which is why similarity looks good, but a fragment like \"must be filed within 30 days\" is unusable without knowing what and by whom. Increase size, add overlap, and prepend a heading breadcrumb.",
      },
      {
        id: "ai-chunking-and-indexing-q2",
        prompt: "Your corpus contains per-customer documents. Where must access-control filtering happen?",
        options: [
          "In the retrieval query itself, as a metadata filter — filtering after retrieval means unauthorized text already entered the model's context",
          "In the prompt, by instructing the model to ignore documents the user can't see",
          "After generation, by scanning the answer for leaked content",
          "At index build time, by maintaining one index per user",
        ],
        answer: 0,
        explanation: "Once a document is in the context window it can surface in the answer, and no instruction reliably prevents that. Access tags belong on the chunk and must be applied as a query-time filter.",
      },
      {
        id: "ai-chunking-and-indexing-q3",
        prompt: "For a corpus of scanned, two-column PDFs, where is the biggest quality lever usually found?",
        options: [
          "Increasing the number of retrieved chunks from 5 to 20",
          "Choosing a larger embedding model",
          "The extraction step — a two-column PDF read linearly produces interleaved text, and everything downstream is tuned on garbage",
          "Lowering the ANN index's ef_search to improve precision",
        ],
        answer: 2,
        explanation: "Document parsing is upstream of chunking, embedding, and ranking. If extraction interleaves columns or drops table structure, no retrieval tuning recovers the meaning that was destroyed at parse time.",
      },
    ],
  },
  {
    id: "ai-rag-pipeline",
    module: "retrieval",
    title: "The RAG Pipeline End to End",
    blurb: "the five stages, the metrics that tell you which one is failing, and how to work through them in order.",
    content: `## The stages

\`\`\`
QUERY -> [1] rewrite -> [2] retrieve -> [3] rerank -> [4] assemble -> [5] generate -> ANSWER
\`\`\`

**1. Query rewriting.** The user's raw text is often a bad query. "What about the second one?" has no meaning standalone — it needs the conversation resolved into it. Two cheap, high-yield moves: rewrite the follow-up into a self-contained question, and expand one query into 2-3 phrasings, retrieving for each and merging. A small model does this well.

**2. Retrieve.** Pull a *generous* candidate set — 20-50, not 5. Recall is what matters here; precision is the next stage's job. A document not retrieved at this step can never be recovered downstream.

**3. Rerank.** A cross-encoder scores each (query, chunk) pair jointly and reorders. Keep the top 3-8. This is the step most first-generation RAG systems skip and the one with the largest quality jump for the effort.

**4. Assemble.** Order the survivors, dedupe near-identical chunks, tag each with its source so the model can cite it, and enforce a token budget. Best chunks go first or last — long windows tend to under-attend the middle.

**5. Generate.** Answer *only* from the context. Cite sources. Have a defined output for "not in the context."

## Diagnose by stage, or you'll tune blind

RAG debugging goes wrong when "the answer was bad" is treated as one problem. It's at least three, and they have different fixes:

\`\`\`
Is the right chunk in the retrieved set?
  NO  -> retrieval failure. Chunking, embeddings, hybrid search, top-k.
  YES -> Is it in the top few after reranking?
           NO  -> ranking failure. Add or upgrade the reranker.
           YES -> Did the model use it correctly?
                    NO -> generation failure. Prompt, context order,
                          model tier, grounding instructions.
\`\`\`

Run that on twenty real failures before changing anything. The distribution is usually lopsided and rarely where the team guessed. The corresponding metrics: **recall@k** for stage 2, **nDCG or MRR** for stage 3, and **faithfulness/groundedness** for stage 5.

## Grounding is a prompt contract

Two instructions do most of the work:

\`\`\`
Answer using ONLY the context below. If the context does not contain
the answer, reply exactly: NOT_FOUND

Cite the source id in brackets after each claim: [doc_14]
\`\`\`

Citations are worth more than they look. They give users a verification path, they make faithfulness measurable, and requiring them measurably reduces invention — a claim that must carry a source id is harder to fabricate.

## Common use cases

- **Support assistants over a docs corpus** — the canonical case, and the one where citations matter most.
- **Internal knowledge search** — heavy on access-control filtering.
- **Code assistants** — retrieval over a repo, where structure-aware chunking dominates.

## When it's the wrong reach

RAG for questions your corpus can't answer — aggregate questions ("how many tickets mentioned X last quarter?") are database queries, not retrieval. RAG for a corpus small enough to fit in context. And RAG as a fix for a *reasoning* failure: if the model has the right documents and still gets it wrong, more retrieval makes it worse by adding noise.

> The library's [Search & ranking](/library/search-and-ranking) note covers ranking quality metrics — recall@k, nDCG — which are the same metrics that make a RAG pipeline debuggable.`,
    exercises: [],
    quiz: [
      {
        id: "ai-rag-pipeline-q1",
        prompt: "Why retrieve 30 candidates and rerank down to 5, rather than retrieving 5 directly?",
        options: [
          "Reranking is cheaper per document than embedding search, so it should do more of the work",
          "It reduces cost, since reranked chunks compress better in the prompt",
          "Retrieval optimizes recall and reranking optimizes precision — a document missed at retrieval can never be recovered later",
          "It has no quality effect; it exists to smooth out ANN index latency",
        ],
        answer: 2,
        explanation: "Bi-encoder retrieval is fast but coarse; a cross-encoder scoring each pair jointly is accurate but expensive. Cast a wide net first, then spend the expensive scoring on the shortlist. Anything not retrieved is permanently gone.",
      },
      {
        id: "ai-rag-pipeline-q2",
        prompt: "Users report bad answers. What should you check first?",
        options: [
          "Whether the correct chunk was in the retrieved set at all — that splits the problem into retrieval, ranking, and generation failures, which have completely different fixes",
          "Whether the model temperature is too high",
          "Whether the context window is large enough to hold more chunks",
          "Whether the system prompt should be rewritten to emphasize accuracy",
        ],
        answer: 0,
        explanation: "\"Bad answer\" is at least three distinct failures. Checking whether the right chunk was retrieved, then whether it ranked into the top few, then whether the model used it, tells you which stage to fix. The distribution is rarely where the team guessed.",
      },
      {
        id: "ai-rag-pipeline-q3",
        prompt: "Beyond letting users verify claims, what does requiring inline source citations buy you?",
        options: [
          "It lets you skip reranking, since cited chunks are ranked by definition",
          "It reduces token usage by allowing shorter answers",
          "It guarantees the answer is factually correct",
          "It makes faithfulness measurable and measurably reduces invention — a claim that must carry a source id is harder to fabricate",
        ],
        answer: 3,
        explanation: "Citations turn groundedness into something you can check automatically: does the cited chunk actually support the claim? They also constrain generation, since attaching a specific source to an invented fact is harder than stating it freely.",
      },
    ],
  },
  {
    id: "ai-hybrid-search",
    module: "retrieval",
    title: "Hybrid Search & Reranking",
    blurb: "why keyword search never went away, and how to fuse two rankings without inventing a scoring hack.",
    content: `## The two retrievers fail in opposite directions

\`\`\`
BM25 / keyword                  Vector / semantic
+ exact terms, IDs, codes       + paraphrase, synonyms, intent
+ rare-word queries             + no shared vocabulary needed
+ interpretable, cheap          + cross-lingual with the right model
+ no training or embedding      + tolerant of typos and phrasing
- no synonym handling           - blind to exact identifiers
- vocabulary mismatch           - blind to negation
- literal to a fault            - opaque failures
\`\`\`

Notice these are complements, not competitors. The query "ERR_5521 timeout on upload" wants both: exact match on the error code, semantic match on the described symptom. Hybrid retrieval routinely beats either retriever alone by a wide margin, and it is the cheapest large win available in a first-generation RAG system.

## Fusing two ranked lists

The naive approach — normalize both scores and take a weighted sum — is fragile, because BM25 scores are unbounded and corpus-dependent while cosine similarity sits in a fixed range. Your normalization becomes a tuning parameter that drifts as the corpus grows.

**Reciprocal Rank Fusion** sidesteps it by using only *ranks*:

\`\`\`
RRF(d) = sum over retrievers of  1 / (k + rank(d))      k ~ 60
\`\`\`

A document ranked 1st by one retriever and 30th by the other still scores well; a document both retrievers like scores best. No score normalization, no per-corpus tuning, trivially extended to a third retriever. It is the sensible default — start here and only move to weighted fusion if you have evals showing it helps.

## Rerankers: the expensive model that earns it

A retrieval embedding is a **bi-encoder** — query and document are embedded *separately*, so the document vector is computed without ever seeing the query. That's what makes precomputation and ANN possible, and it's also the ceiling on quality.

A **cross-encoder** reranker feeds the query and document through the model *together*, so every token can attend to every other token. Much more accurate, and far too slow to run over a corpus — which is exactly why the pipeline shape is "retrieve broadly, rerank narrowly":

\`\`\`
50M docs --ANN (bi-encoder)--> 50 candidates --cross-encoder--> top 5
           milliseconds                        ~50-200ms
\`\`\`

Budget the reranker's latency deliberately. It's usually 50-200ms for a shortlist and it sits on the critical path before generation even starts.

## Filters are the third retriever

Metadata filters do work neither retriever can: date ranges, tenant scoping, document type, access control, "current version only". Apply them as *pre-filters* in the query where your store supports it. Post-filtering after ANN retrieval silently shrinks your result set — retrieve 20, filter to the current year, and you may be left with 3.

## Common use cases

- **Technical/support corpora** — error codes and part numbers make keyword search mandatory.
- **Multi-tenant search** — filters first, then hybrid within the tenant's slice.
- **Long-tail e-commerce** — exact SKU plus fuzzy description.

## When it's the wrong reach

Adding a reranker before you've checked recall. If the right document isn't in the candidate set, reranking reorders a list that doesn't contain the answer — you have spent latency to change nothing. Fix recall first, then precision. Reranking is also poor value when your candidate set is already tiny (top-5 of a 500-document corpus); there's little to reorder.

> The library's [Search & ranking](/library/search-and-ranking) note covers BM25, inverted indexes, and ranking evaluation in depth — this lesson is about fusing that machinery with the vector side.`,
    exercises: [],
    quiz: [
      {
        id: "ai-hybrid-search-q1",
        prompt: "Why is Reciprocal Rank Fusion usually preferred over normalizing and summing BM25 and cosine scores?",
        options: [
          "RRF is faster to compute at query time",
          "RRF uses only ranks, avoiding the fragile normalization of unbounded, corpus-dependent BM25 scores against fixed-range cosine similarity",
          "RRF guarantees higher recall than either retriever alone",
          "Weighted score fusion cannot combine more than two retrievers",
        ],
        answer: 1,
        explanation: "BM25 scores are unbounded and shift as the corpus changes, while cosine sits in a fixed range, so any normalization becomes a drifting tuning parameter. RRF needs only rank positions and extends to a third retriever for free.",
      },
      {
        id: "ai-hybrid-search-q2",
        prompt: "What makes a cross-encoder reranker more accurate than the bi-encoder used for retrieval?",
        options: [
          "It is trained on more data and therefore generalizes better",
          "It uses a larger vector dimension, capturing more nuance",
          "It processes query and document together, so every token can attend across both — while a bi-encoder embeds the document without ever seeing the query",
          "It performs exact search instead of approximate nearest neighbour",
        ],
        answer: 2,
        explanation: "The bi-encoder's separate encoding is what allows precomputation and ANN, and it is also its quality ceiling. Joint encoding is far more accurate but cannot be precomputed, so it only runs over a shortlist.",
      },
      {
        id: "ai-hybrid-search-q3",
        prompt: "You add a reranker and quality barely moves. What is the most likely explanation?",
        options: [
          "The reranker needs fine-tuning on your corpus before it does anything",
          "Cross-encoders only help on queries longer than a sentence",
          "The reranker is being applied after the LLM generates, which is too late",
          "Recall is the bottleneck — the right document isn't in the candidate set, so reordering the list can't surface it",
        ],
        answer: 3,
        explanation: "Reranking improves precision within whatever was retrieved. If the answer never made the candidate set, reordering costs latency and changes nothing. Measure recall@k first and fix retrieval before tuning ranking.",
      },
    ],
  },
];
