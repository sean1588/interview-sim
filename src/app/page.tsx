import Link from "next/link";
import { COURSES } from "@/lib/lessons";
import { ARTICLES, LIBRARY_SECTIONS } from "@/lib/library";

type ModeCardProps = {
  href: string;
  title: string;
  description: string;
  icon: string;
  cta?: string;
};

function ModeCard({ href, title, description, icon, cta = "Start practice" }: ModeCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-[10px] border border-edge bg-chip p-6 transition hover:border-cognac/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 text-3xl">{icon}</div>
        <div className="flex-1">
          <h3 className="font-serif text-[22px] font-semibold text-ink transition group-hover:text-cognac-text">
            {title}
          </h3>
          <p className="mt-1.5 font-serif text-[16px] font-medium leading-[1.55] text-ink-body">
            {description}
          </p>
          <div className="mt-4 inline-flex items-center gap-1 font-sans text-[13px] font-medium text-cognac-text">
            {cta} <span aria-hidden>→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-5xl px-6 pt-16 pb-24">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center rounded-full border border-edge bg-chip px-3 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-cognac-text">
            AI-Powered Practice
          </div>
          <h1 className="mt-5 font-serif text-[56px] font-semibold leading-none tracking-tight text-ink">
            The Interview Studio
          </h1>
          <p className="mt-4 font-serif text-[19px] italic text-muted">
            Real-time voice interviews. Choose your focus.
          </p>
        </header>

        <SectionLabel>Practice interviews</SectionLabel>
        <div className="grid gap-4 md:grid-cols-3">
          <ModeCard
            href="/coding"
            title="Coding Interview"
            description="Data structures, algorithms, and live coding. In-browser execution, the interviewer watches your code and run results in real time."
            icon="💻"
          />
          <ModeCard
            href="/behavioral"
            title="Behavioral Interview"
            description="STAR stories, leadership, conflict, influence, and failure questions. Practice telling clear, structured stories with live follow-ups."
            icon="🗣️"
          />
          <ModeCard
            href="/system-design"
            title="System Design"
            description="Design scalable systems end-to-end. Clarify requirements, sketch architecture, discuss tradeoffs, capacity, and bottlenecks."
            icon="🗺️"
          />
        </div>
        <div className="mt-4 grid gap-4">
          <ModeCard
            href="/freestyle"
            title="Freestyle"
            description="A free-form session — you steer. Ask for a behavioral, coding, or system design interview, open practice, or to learn something new, and the coach adapts in real time, dropping problems and starter code straight into your editor."
            icon="🎛️"
            cta="Start session"
          />
        </div>

        <div className="mt-12">
          <SectionLabel>Learn</SectionLabel>
        </div>
        <p className="mb-3 font-serif text-[16px] font-medium text-ink-body">
          Guided courses for experienced programmers, each taught live by a voice
          tutor — the language courses come with hands-on exercises you run as
          you go, and the concept courses are pure conversation.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {COURSES.map((course) => (
            <ModeCard
              key={course.id}
              href={`/learn/${course.id}`}
              title={`Learn ${course.title}`}
              description={course.tagline}
              icon={course.icon}
              cta="Open course"
            />
          ))}
        </div>

        <div className="mt-12">
          <SectionLabel>Library</SectionLabel>
        </div>
        <p className="mb-3 font-serif text-[16px] font-medium text-ink-body">
          Concept notes on the ideas the system design exercises are built on — the
          mechanism, the tradeoff it makes, the numbers that justify it, and the move to
          make when it comes up.
        </p>
        <ModeCard
          href="/library"
          title="System Design Library"
          description={`${ARTICLES.length} notes across ${LIBRARY_SECTIONS.length} areas, from estimation and consistency models to sharding, streaming, coordination, and the specialized structures behind geo, search, and ranking.`}
          icon="📚"
          cta="Browse library"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {LIBRARY_SECTIONS.map((section) => (
            <Link
              key={section.id}
              href={`/library#${section.id}`}
              className="rounded-full border border-edge bg-chip px-3 py-1 font-sans text-[12px] text-ink-muted transition hover:border-cognac/40 hover:text-cognac-text focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
            >
              {section.title}
            </Link>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-chip px-4 py-1.5 font-sans text-[12px] font-medium text-ink-muted transition hover:border-cognac/40 hover:text-cognac-text focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
          >
            <span aria-hidden>🗂️</span> Past sessions
          </Link>
        </div>

        <div className="mt-8 text-center font-serif text-[14px] italic text-muted">
          Voice-driven and entirely on your machine — graded sessions are saved
          locally and can be cleared any time.
        </div>
      </div>
    </div>
  );
}
