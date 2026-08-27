"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  languageServerSnapshot,
  languageSnapshot,
  setSavedLanguage,
  subscribeLanguage,
} from "@/lib/lesson-language";
import type { LanguageId } from "@/lib/problems";

/**
 * The language a course is currently being taken in, plus a setter that persists
 * the choice. Returns the course's default until the learner picks otherwise,
 * and `undefined` for a concept course (no languages, no editor).
 *
 * Every consumer of the choice reads it through this hook rather than holding
 * its own state, so the picker on the course overview and the one in the lesson
 * room stay in agreement without either owning the other.
 */
export function useCourseLanguage(
  courseId: string,
  languages: readonly LanguageId[] | undefined
): [LanguageId | undefined, (language: LanguageId) => void] {
  const allowed = languages ?? EMPTY;

  const getSnapshot = useCallback(
    () => languageSnapshot(courseId, allowed),
    [courseId, allowed]
  );

  const saved = useSyncExternalStore(
    subscribeLanguage,
    getSnapshot,
    languageServerSnapshot
  );

  const select = useCallback(
    (language: LanguageId) => setSavedLanguage(courseId, language),
    [courseId]
  );

  return [saved ?? allowed[0], select];
}

/** Stable identity so the `allowed` dep above doesn't change every render. */
const EMPTY: readonly LanguageId[] = [];
