import type { ReactNode, ChangeEvent } from "react";
import { ChevronDown } from "./icons";

/** A native <select> dressed as a studio chip: cream surface, edge border, a
 * single caret. Used for the header pickers (problem, level, scenario). */
export default function SelectChip({
  value,
  onChange,
  ariaLabel,
  className = "",
  children,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className={`cursor-pointer appearance-none rounded-[7px] border border-edge bg-chip py-[7px] pl-3 pr-9 font-sans text-[13px] text-ink-soft focus:outline-none ${className}`}
      >
        {children}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-3 text-faint" />
    </div>
  );
}
