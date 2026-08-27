// The learning-mode course registry. Each course lives in its own folder
// (python/, typescript/, go/, dsa/, distributed-systems/, aws/, applied-ai/) and bundles its
// modules + lessons into a Course;
// this module assembles them and resolves courses/lessons by id. Public import
// path: "@/lib/lessons". Mirrors the shape of "@/lib/problems".

import type { Course, Lesson, ResolvedLesson } from "./types";
import { resolveLesson } from "./types";
import type { LanguageId } from "@/lib/problems";
import { pythonCourse } from "./python";
import { typescriptCourse } from "./typescript";
import { goCourse } from "./go";
import { dsaCourse } from "./dsa";
import { distributedSystemsCourse } from "./distributed-systems";
import { awsCourse } from "./aws";
import { appliedAiCourse } from "./applied-ai";

export type {
  ByLanguage,
  Course,
  Lesson,
  LessonGraphic,
  Exercise,
  Module,
  ConceptCourseId,
  SubjectCourseId,
  QuizQuestion,
  ResolvedExercise,
  ResolvedLesson,
  ResolvedQuizQuestion,
} from "./types";
export { QUIZ_LENGTH, QUIZ_OPTIONS } from "./types";
export {
  defaultLanguage,
  forLanguage,
  resolveExercise,
  resolveLesson,
  resolveQuizQuestion,
} from "./types";
export { buildLessonScript } from "./script";

/** Ordered course list — drives the /learn picker and the home "Learn" section. */
export const COURSES: Course[] = [
  pythonCourse,
  typescriptCourse,
  goCourse,
  dsaCourse,
  distributedSystemsCourse,
  awsCourse,
  appliedAiCourse,
];

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getLesson(courseId: string, lessonId: string): Lesson | undefined {
  return getCourse(courseId)?.lessons.find((l) => l.id === lessonId);
}

export function lessonsForModule(course: Course, moduleId: string): Lesson[] {
  return course.lessons.filter((l) => l.module === moduleId);
}

/**
 * A course's lessons for one module, with every per-language field already
 * resolved. The course overview and the lesson room both render language-
 * specific text, so they take this rather than resolving lesson by lesson.
 */
export function resolvedLessonsForModule(
  course: Course,
  moduleId: string,
  language?: LanguageId
): ResolvedLesson[] {
  return lessonsForModule(course, moduleId).map((l) => resolveLesson(l, language));
}

/** Every lesson across all courses — used by cross-course test invariants. */
export const ALL_LESSONS: Lesson[] = COURSES.flatMap((c) => c.lessons);
