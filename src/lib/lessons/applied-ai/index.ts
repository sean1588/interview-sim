// The Applied AI course: per-module lesson files assembled into a Course. Like
// AWS and Distributed Systems this is a *concept* course — it declares no
// `language`, so it has no editor and no exercises (see Course.language in
// ../types); every lesson is taught conversationally by the voice tutor against
// its notes.
//
// Audience: engineers who ship software and are now being asked to build a
// feature on top of a language model. It is deliberately NOT a course on how
// transformers work — it starts from the API call and covers the decisions you
// actually make: what to put in the context, when to retrieve, when to let the
// model act, how to know whether any of it works, and what it costs.
//
// It is also deliberately provider-neutral. Model names, prices, and context
// limits move every few months; the shape of the trade-offs doesn't, so the
// lessons teach the shape and leave the numbers to the docs. Where a lesson
// overlaps the concept library, it links to the article rather than restating
// it: the library explains the general mechanism (caching, rate limiting,
// ranking, rollouts), this course explains what changes when the component in
// the middle is non-deterministic.

import type { Course, Lesson, Module } from "../types";
import { foundationsLessons } from "./foundations";
import { promptingLessons } from "./prompting";
import { retrievalLessons } from "./retrieval";
import { agentsLessons } from "./agents";
import { frameworksLessons } from "./frameworks";
import { evaluationLessons } from "./evaluation";
import { servingLessons } from "./serving";
import { productionLessons } from "./production";

const MODULES: Module[] = [
  { id: "foundations", title: "Foundations", blurb: "The stateless token-to-token call every feature is built on: what tokens cost you, why output length dominates latency, what temperature really controls, and how to pick a model without guessing." },
  { id: "prompting", title: "Prompting", blurb: "The five parts of a working prompt and where each belongs, structured output you can actually parse, examples versus rules, and treating prompts as versioned code with an eval diff attached." },
  { id: "retrieval", title: "Retrieval & RAG", blurb: "What an embedding does and doesn't encode, chunking decisions that cap quality before a query runs, the five-stage pipeline, and why keyword search never went away." },
  { id: "agents", title: "Tools & Agents", blurb: "Tool calling as an untrusted plan your code enforces, the loop and the termination conditions it needs, context as a budget rather than a bucket, when multiple agents genuinely help, and MCP as the protocol standardizing the tool layer." },
  { id: "frameworks", title: "LangChain & LangGraph", blurb: "The build-versus-adopt call, the v1 agent surface and its middleware hooks, and LangGraph as a state machine with durable checkpoints and human-in-the-loop interrupts." },
  { id: "evaluation", title: "Evaluation", blurb: "The 50-case CSV that turns \"seems better\" into a number, LLM judges and the biases that make a naive one useless, and the error analysis that beats any dashboard." },
  { id: "serving", title: "Latency & Cost", blurb: "TTFT versus total time, three caches with three different correctness stories, where the bill actually comes from, and the fine-tuning decision most teams get backwards." },
  { id: "production", title: "Production & Safety", blurb: "Prompt injection and the trifecta that turns it into a breach, guardrails that hold because they're code, tracing a non-deterministic system, and the order of operations for shipping." },
];

const LESSONS: Lesson[] = [
  ...foundationsLessons,
  ...promptingLessons,
  ...retrievalLessons,
  ...agentsLessons,
  ...frameworksLessons,
  ...evaluationLessons,
  ...servingLessons,
  ...productionLessons,
];

export const appliedAiCourse: Course = {
  id: "applied-ai",
  // No `language`: a concept course — conversational lessons, no editor. Its
  // tutor persona is keyed off this id in CONCEPT_PROFILE (@/lib/prompts).
  title: "Applied AI",
  tagline: "Building real features on top of language models — prompting, retrieval, agents, evals, and the cost, latency and safety decisions that come with them.",
  icon: "🤖",
  modules: MODULES,
  lessons: LESSONS,
};
