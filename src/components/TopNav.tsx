import Link from "next/link";
import ModelPicker from "@/components/ModelPicker";

const NAV_ITEMS = [
  { href: "/#practice", label: "Practice" },
  { href: "/learn", label: "Learn" },
  { href: "/library", label: "Library" },
  { href: "/career", label: "Career" },
  { href: "/history", label: "History" },
] as const;

export default function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-[68px] items-center border-b border-section bg-frame/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1480px] items-center gap-5 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Interview Simulator home"
          className="group flex min-w-0 shrink-0 items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-cognac/25 bg-cognac/[0.08] font-serif text-[16px] font-bold text-cognac-text transition group-hover:border-cognac/45">
            IS
          </span>
          <span className="min-w-0">
            <span className="block truncate font-serif text-[21px] font-semibold leading-none tracking-tight text-ink sm:hidden">
              Interview Sim
            </span>
            <span className="hidden truncate font-serif text-[21px] font-semibold leading-none tracking-tight text-ink sm:block">
              Interview Simulator
            </span>
            <span className="mt-1 hidden font-sans text-[9px] font-medium uppercase tracking-[0.2em] text-cognac-text sm:block">
              AI-powered · real-time voice practice
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[7px] px-3 py-2 font-sans text-[13px] font-medium text-ink-muted transition-colors hover:bg-chip hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto min-w-0 max-w-[55vw] sm:max-w-[360px]">
          <ModelPicker />
        </div>
      </div>
    </header>
  );
}
