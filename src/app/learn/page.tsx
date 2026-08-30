import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { COURSES, defaultLanguage, forLanguage } from "@/lib/lessons";

export default function LearnHome() {
  return (
    <div className="flex-1 bg-app">
      <div className="mx-auto max-w-4xl px-6 pt-10 pb-24">
        <header className="mb-10">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Learn" }]} />
          <h1 className="mt-5 font-serif text-[44px] font-semibold tracking-tight text-ink">
            Learn
          </h1>
          <p className="mt-3 font-serif text-[18px] font-medium leading-[1.55] text-ink-body">
            Guided courses for experienced programmers, each taught live by a voice
            tutor — the language courses come with hands-on exercises you run as
            you go, and the concept courses are pure conversation. Pick one to
            start.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {COURSES.map((course) => (
            <Link
              key={course.id}
              href={`/learn/${course.id}`}
              className="group block rounded-[10px] border border-edge bg-chip p-6 transition hover:border-cognac/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 text-3xl">{course.icon}</div>
                <div className="flex-1">
                  <h2 className="font-serif text-[22px] font-semibold text-ink transition group-hover:text-cognac-text">
                    Learn {course.title}
                  </h2>
                  <p className="mt-1.5 font-serif text-[16px] font-medium leading-[1.55] text-ink-body">
                    {forLanguage(course.tagline, defaultLanguage(course))}
                  </p>
                  <p className="mt-3 font-sans text-[12px] text-faint">
                    {course.lessons.length} lessons · {course.modules.length} modules
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
