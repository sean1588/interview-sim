// The learning-mode course registry. Each course lives in its own folder
// (python/, typescript/) and bundles its modules + lessons into a Course;
// this module assembles them and resolves courses/lessons by id. Public import
// path: "@/lib/lessons". Mirrors the shape of "@/lib/problems".

import type { Course, Lesson } from "./types";
import { pythonCourse } from "./python";
import { typescriptCourse } from "./typescript";

export type { Course, Lesson, Exercise, Module } from "./types";
export { buildLessonScript } from "./script";

/** Ordered course list — drives the /learn picker and the home "Learn" section. */
export const COURSES: Course[] = [pythonCourse, typescriptCourse];

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getLesson(courseId: string, lessonId: string): Lesson | undefined {
  return getCourse(courseId)?.lessons.find((l) => l.id === lessonId);
}

export function lessonsForModule(course: Course, moduleId: string): Lesson[] {
  return course.lessons.filter((l) => l.module === moduleId);
}

/** Every lesson across all courses — used by cross-course test invariants. */
export const ALL_LESSONS: Lesson[] = COURSES.flatMap((c) => c.lessons);
