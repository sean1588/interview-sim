import Link from "next/link";
import { COURSES } from "@/lib/lessons";

export default function LearnHome() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-6 pt-16 pb-24">
        <header className="mb-10">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← Home</Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Learn</h1>
          <p className="mt-3 text-lg text-gray-400">
            Guided courses for experienced programmers, each taught live by a voice
            tutor who watches your code as you go. Pick a language to start.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {COURSES.map((course) => (
            <Link
              key={course.id}
              href={`/learn/${course.id}`}
              className="group block rounded-2xl border border-gray-800 bg-gray-900/60 p-6 transition hover:border-gray-700 hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 text-3xl">{course.icon}</div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white group-hover:text-indigo-300 transition">
                    Learn {course.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                    {course.tagline}
                  </p>
                  <p className="mt-3 text-xs text-gray-500">
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
