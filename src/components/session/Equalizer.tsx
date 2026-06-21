import type { CSSProperties } from "react";

/** A row of bars that scale on the `eq` animation, staggered. Used live beside the
 * orb (clay when speaking, olive when listening) and as a faint idle hint in the
 * mic bar. Purely decorative — it animates continuously while mounted. */
export default function Equalizer({
  color,
  bars = 5,
  height = 15,
  stagger = 0.15,
}: {
  color: string;
  bars?: number;
  height?: number;
  stagger?: number;
}) {
  return (
    <div className="flex items-end gap-[3px]" style={{ height }} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const style: CSSProperties = {
          height,
          background: color,
          animationDelay: `${i * stagger}s`,
        };
        return (
          <span
            key={i}
            className="w-[3px] rounded-[2px] origin-bottom animate-eq"
            style={style}
          />
        );
      })}
    </div>
  );
}
