"use client";

import Link from "next/link";
import { forLanguage, type ByLanguage } from "@/lib/lessons";
import { useCourseLanguage } from "@/components/useCourseLanguage";
import { LANGUAGE_LABELS, type LanguageId } from "@/lib/problems";

/**
 * Just the fields the overview renders. The page is a Server Component and this
 * is a Client one, so everything here crosses the network as props — passing the
 * whole Course would ship every lesson's full notes (twice over, on a course
 * that carries two languages) to render a list of titles.
 */
export interface CourseOverviewData {
  id: string;
  title: string;
  tagline: ByLanguage<string>;
  languages?: LanguageId[];
  modules: { id: string; title: string; blurb: ByLanguage<string> }[];
  lessons: { id: string; module: string; title: string; blurb: ByLanguage<string> }[];
}

export default function CourseOverview({ course }: { course: CourseOverviewData }) {
  const [language, selectLanguage] = useCourseLanguage(course.id, course.languages);
  // Only a subject course taught in more than one language offers the choice.
  const choices = course.languages ?? [];

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-4xl px-6 pt-16 pb-24">
        <header className="mb-10">
          <Link
            href="/learn"
            className="font-sans text-[13px] text-muted transition-colors hover:text-ink"
          >
            ← Courses
          </Link>
          <h1 className="mt-5 font-serif text-[44px] font-semibold tracking-tight text-ink">
            Learn {course.title}
          </h1>
          <p className="mt-3 font-serif text-[18px] font-medium leading-[1.55] text-ink-body">
            {forLanguage(course.tagline, language)} {course.lessons.length} lessons across{" "}
            {course.modules.length} modules, each taught live by a voice tutor.
          </p>

          {choices.length > 1 && (
            <div className="mt-6 flex items-center gap-3">
              <span className="font-sans text-[12px] font-medium uppercase tracking-[0.12em] text-faint">
                Language
              </span>
              <div
                role="group"
                aria-label="Course language"
                className="inline-flex overflow-hidden rounded-[7px] border border-edge bg-chip"
              >
                {choices.map((id) => {
                  const active = id === language;
                  return (
                    <button
                      key={id}
                      onClick={() => selectLanguage(id)}
                      aria-pressed={active}
                      className={`px-3.5 py-1.5 font-mono text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 ${
                        active
                          ? "bg-cognac text-[#f7f3ea]"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {LANGUAGE_LABELS[id]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        <div className="space-y-8">
          {course.modules.map((mod, i) => {
            const lessons = course.lessons.filter((l) => l.module === mod.id);
            return (
              <section key={mod.id}>
                <div className="mb-3">
                  <h2 className="font-serif text-[22px] font-semibold text-ink">
                    <span className="mr-2 text-faint">{i + 1}.</span>
                    {mod.title}
                  </h2>
                  <p className="mt-1 font-serif text-[15px] font-medium text-ink-muted">
                    {forLanguage(mod.blurb, language)}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/learn/${course.id}/${lesson.id}`}
                      className="group block rounded-[8px] border border-edge bg-chip p-4 transition hover:border-cognac/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
                    >
                      <h3 className="font-serif text-[17px] font-semibold text-ink transition group-hover:text-cognac-text">
                        {lesson.title}
                      </h3>
                      <p className="mt-1 font-serif text-[14px] font-medium leading-[1.5] text-ink-body">
                        {forLanguage(lesson.blurb, language)}
                      </p>
                    </Link>
                  ))}
                  {lessons.length === 0 && (
                    <p className="font-serif text-[14px] italic text-faint">Coming soon.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
