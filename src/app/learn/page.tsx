import Link from "next/link";
import { MODULES, lessonsForModule } from "@/lib/lessons";

export default function LearnHome() {
  const totalLessons = MODULES.reduce(
    (n, m) => n + lessonsForModule(m.id).length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-6 pt-16 pb-24">
        <header className="mb-10">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← Home</Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Learn Python</h1>
          <p className="mt-3 text-lg text-gray-400">
            A guided course for experienced programmers picking up Python. {totalLessons}{" "}
            lessons across {MODULES.length} modules, each taught live by a voice tutor
            who watches your code as you go.
          </p>
        </header>

        <div className="space-y-8">
          {MODULES.map((mod, i) => {
            const lessons = lessonsForModule(mod.id);
            return (
              <section key={mod.id}>
                <div className="mb-3">
                  <h2 className="text-xl font-semibold text-white">
                    <span className="text-gray-600 mr-2">{i + 1}.</span>
                    {mod.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">{mod.blurb}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/learn/${lesson.id}`}
                      className="group block rounded-xl border border-gray-800 bg-gray-900/60 p-4 transition hover:border-gray-700 hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <h3 className="text-sm font-medium text-white group-hover:text-indigo-300 transition">
                        {lesson.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                        {lesson.blurb}
                      </p>
                    </Link>
                  ))}
                  {lessons.length === 0 && (
                    <p className="text-xs text-gray-600 italic">Coming soon.</p>
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
