import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, lessonsForModule } from "@/lib/lessons";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

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
            {course.tagline} {course.lessons.length} lessons across{" "}
            {course.modules.length} modules, each taught live by a voice tutor who
            watches your code as you go.
          </p>
        </header>

        <div className="space-y-8">
          {course.modules.map((mod, i) => {
            const lessons = lessonsForModule(course, mod.id);
            return (
              <section key={mod.id}>
                <div className="mb-3">
                  <h2 className="font-serif text-[22px] font-semibold text-ink">
                    <span className="mr-2 text-faint">{i + 1}.</span>
                    {mod.title}
                  </h2>
                  <p className="mt-1 font-serif text-[15px] font-medium text-ink-muted">
                    {mod.blurb}
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
                        {lesson.blurb}
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
