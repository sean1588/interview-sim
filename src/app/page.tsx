import Link from "next/link";

type ModeCardProps = {
  href: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
};

function ModeCard({ href, title, description, icon, accent }: ModeCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-gray-800 bg-gray-900/60 p-6 transition hover:border-gray-700 hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="flex items-start gap-4">
        <div className={`mt-1 text-3xl ${accent}`}>{icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white group-hover:text-indigo-300 transition">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">{description}</p>
          <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-400 group-hover:text-indigo-300">
            Start practice <span aria-hidden>→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-5xl px-6 pt-16 pb-24">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900 px-3 py-1 text-xs tracking-[2px] text-gray-400">
            AI-POWERED PRACTICE
          </div>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight">Interview Sim</h1>
          <p className="mt-3 text-lg text-gray-400">
            Real-time voice interviews. Choose your focus.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <ModeCard
            href="/coding"
            title="Coding Interview"
            description="Data structures, algorithms, and live coding. In-browser execution, the interviewer watches your code and run results in real time."
            icon="💻"
            accent="text-emerald-400"
          />
          <ModeCard
            href="/behavioral"
            title="Behavioral Interview"
            description="STAR stories, leadership, conflict, influence, and failure questions. Practice telling clear, structured stories with live follow-ups."
            icon="🗣️"
            accent="text-amber-400"
          />
          <ModeCard
            href="/system-design"
            title="System Design"
            description="Design scalable systems end-to-end. Clarify requirements, sketch architecture, discuss tradeoffs, capacity, and bottlenecks."
            icon="🗺️"
            accent="text-sky-400"
          />
        </div>

        <div className="mt-10 text-center text-xs text-gray-500">
          Voice + animated interviewer (optional). Sessions are ephemeral and stay on your machine.
        </div>
      </div>
    </div>
  );
}
