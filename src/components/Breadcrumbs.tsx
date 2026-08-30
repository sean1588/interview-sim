import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({
  items,
  className = "",
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 ${className}`}>
      <ol className="flex min-w-0 items-center gap-2 font-sans text-[13px] text-muted">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}:${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 && <span className="shrink-0 text-[#cabfa6]">/</span>}
              {item.href && !current ? (
                <Link
                  href={item.href}
                  className="truncate transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={current ? "page" : undefined}
                  className={current ? "truncate font-medium text-ink" : "truncate"}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
