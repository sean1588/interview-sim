// The Data Structures & Algorithms course: per-module lesson files assembled
// into a Course. The one *subject* course — it teaches DSA *through* a language
// rather than teaching the language, so it declares `languages` (editor +
// exercises) but its tutor persona is keyed off the course id (see
// SubjectCourseId in ../types). It's also the only course offering a CHOICE of
// language: the subject is identical either way, so the learner picks TypeScript
// or Python and each lesson resolves its code — and the prose around it — to
// match (see ByLanguage in ../types). Audience is experienced developers who are
// new to (or rusty on) algorithms: mechanism first, Big-O always, "when do I
// reach for this?" as the through-line.

import type { Course, Lesson, Module } from "../types";
import { complexityLessons } from "./complexity";
import { arraysStringsLessons } from "./arrays-strings";
import { hashMapsLessons } from "./hash-maps";
import { linkedListsLessons } from "./linked-lists";
import { stacksQueuesLessons } from "./stacks-queues";
import { treesLessons } from "./trees";
import { graphsLessons } from "./graphs";
import { sortingSearchingLessons } from "./sorting-searching";

const MODULES: Module[] = [
  { id: "complexity", title: "Complexity", blurb: "Big-O growth, trading space for time, and reading real code for its cost." },
  { id: "arrays-strings", title: "Arrays & Strings", blurb: "Two pointers, sliding windows, and prefix sums — linear-time answers on ordered data." },
  { id: "hash-maps", title: "Hash Maps & Sets", blurb: "How hashing actually works, frequency counting, and the seen-before patterns." },
  { id: "linked-lists", title: "Linked Lists", blurb: "Nodes and links, fast & slow pointers, and careful in-place surgery." },
  {
    id: "stacks-queues",
    title: "Stacks & Queues",
    blurb: {
      typescript: "LIFO and FIFO patterns, the shift() trap, and monotonic stacks.",
      python: "LIFO and FIFO patterns, the pop(0) trap, and monotonic stacks.",
    },
  },
  { id: "trees", title: "Trees", blurb: "Binary trees and BSTs, recursive DFS traversals, and queue-driven BFS." },
  { id: "graphs", title: "Graphs", blurb: "Adjacency lists, traversal with a visited set, components, and topological sort." },
  { id: "sorting-searching", title: "Sorting & Searching", blurb: "Binary search and its boundary variants, and how the classic sorts work." },
];

const LESSONS: Lesson[] = [
  ...complexityLessons,
  ...arraysStringsLessons,
  ...hashMapsLessons,
  ...linkedListsLessons,
  ...stacksQueuesLessons,
  ...treesLessons,
  ...graphsLessons,
  ...sortingSearchingLessons,
];

export const dsaCourse: Course = {
  id: "dsa",
  languages: ["typescript", "python"],
  title: "Data Structures & Algorithms",
  tagline: {
    typescript:
      "The interview fundamentals — structures, patterns, and complexity — taught hands-on in TypeScript.",
    python:
      "The interview fundamentals — structures, patterns, and complexity — taught hands-on in Python.",
  },
  icon: "🧮",
  modules: MODULES,
  lessons: LESSONS,
};
