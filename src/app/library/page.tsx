import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ARTICLES, LIBRARY_SECTIONS, articlesForSection } from "@/lib/library";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/questions/system-design";

export default function LibraryHome() {
  return (
    <div className="flex-1 bg-app">
      <div className="mx-auto max-w-4xl px-6 pt-10 pb-24">
        <header className="mb-8">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Library" }]} />
          <h1 className="mt-5 font-serif text-[44px] font-semibold tracking-tight text-ink">
            Library
          </h1>
          <p className="mt-3 font-serif text-[18px] font-medium leading-[1.55] text-ink-body">
            {ARTICLES.length} concept notes covering the ideas the{" "}
            {SYSTEM_DESIGN_QUESTIONS.length} system design exercises are built on — what
            each mechanism is, the tradeoff it makes, the numbers that justify it, and the
            move to make when it comes up in an interview.
          </p>
        </header>

        <nav className="mb-10 flex flex-wrap gap-1.5">
          {LIBRARY_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-edge bg-chip px-3 py-1 font-sans text-[12px] text-ink-muted transition hover:border-cognac/40 hover:text-cognac-text focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div className="space-y-9">
          {LIBRARY_SECTIONS.map((section, i) => (
            <section key={section.id} id={section.id} className="scroll-mt-6">
              <div className="mb-3">
                <h2 className="font-serif text-[22px] font-semibold text-ink">
                  <span className="mr-2 text-faint">{i + 1}.</span>
                  {section.title}
                </h2>
                <p className="mt-1 font-serif text-[15px] font-medium text-ink-muted">
                  {section.blurb}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {articlesForSection(section.id).map((article) => (
                  <Link
                    key={article.id}
                    href={`/library/${article.id}`}
                    className="group block rounded-[8px] border border-edge bg-chip p-4 transition hover:border-cognac/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
                  >
                    <h3 className="font-serif text-[17px] font-semibold text-ink transition group-hover:text-cognac-text">
                      {article.title}
                    </h3>
                    <p className="mt-1 font-serif text-[14px] font-medium leading-[1.5] text-ink-body">
                      {article.blurb}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/system-design"
            className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-chip px-4 py-1.5 font-sans text-[12px] font-medium text-ink-muted transition hover:border-cognac/40 hover:text-cognac-text focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
          >
            <span aria-hidden>🗺️</span> Practice a system design interview
          </Link>
        </div>
      </div>
    </div>
  );
}
