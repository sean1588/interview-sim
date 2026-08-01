import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ARTICLES, LIBRARY_SECTIONS, getArticle } from "@/lib/library";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/questions/system-design";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  const article = getArticle(articleId);
  if (!article) notFound();

  const section = LIBRARY_SECTIONS.find((s) => s.id === article.section);
  const index = ARTICLES.findIndex((a) => a.id === article.id);
  const prev = ARTICLES[index - 1];
  const next = ARTICLES[index + 1];
  // appliesTo ids are asserted to resolve in library.test.ts; flatMap keeps the
  // page honest if one ever doesn't rather than rendering an empty chip.
  const questions = article.appliesTo.flatMap((id) => {
    const q = SYSTEM_DESIGN_QUESTIONS.find((x) => x.id === id);
    return q ? [q] : [];
  });

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-3xl px-6 pt-16 pb-24">
        <header className="mb-8">
          <Link
            href="/library"
            className="font-sans text-[13px] text-muted transition-colors hover:text-ink"
          >
            ← Library
          </Link>
          {section && (
            <div className="mt-5 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
              {section.title}
            </div>
          )}
          <h1 className="mt-2 font-serif text-[38px] font-semibold leading-[1.15] tracking-tight text-ink">
            {article.title}
          </h1>
          <p className="mt-3 font-serif text-[17px] font-medium italic leading-[1.55] text-ink-muted">
            {article.blurb}
          </p>
        </header>

        {/* Long-form prose sits on the ivory work surface, the way lesson notes and
            problem statements do — the sand page background is too dark to read
            17px serif against for a full article. */}
        <article className="markdown rounded-[10px] border border-hair bg-editor px-7 py-6">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </article>

        <section className="mt-12 rounded-[10px] border border-edge bg-chip p-5">
          <h2 className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
            Practice this on
          </h2>
          <ul className="mt-3 space-y-1.5">
            {questions.map((q) => (
              <li key={q.id} className="font-serif text-[16px] font-medium leading-[1.5] text-ink-body">
                {q.title}
              </li>
            ))}
          </ul>
          <Link
            href="/system-design"
            className="mt-4 inline-flex items-center gap-1 font-sans text-[13px] font-medium text-cognac-text transition-colors hover:text-cognac"
          >
            Start a system design interview <span aria-hidden>→</span>
          </Link>
        </section>

        <nav className="mt-8 flex items-stretch gap-3">
          {prev ? (
            <Link
              href={`/library/${prev.id}`}
              className="group flex-1 rounded-[8px] border border-edge bg-chip p-4 transition hover:border-cognac/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
            >
              <div className="font-sans text-[11px] uppercase tracking-[0.14em] text-faint">
                ← Previous
              </div>
              <div className="mt-1 font-serif text-[16px] font-semibold text-ink transition group-hover:text-cognac-text">
                {prev.title}
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {next ? (
            <Link
              href={`/library/${next.id}`}
              className="group flex-1 rounded-[8px] border border-edge bg-chip p-4 text-right transition hover:border-cognac/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
            >
              <div className="font-sans text-[11px] uppercase tracking-[0.14em] text-faint">
                Next →
              </div>
              <div className="mt-1 font-serif text-[16px] font-semibold text-ink transition group-hover:text-cognac-text">
                {next.title}
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </nav>
      </div>
    </div>
  );
}
