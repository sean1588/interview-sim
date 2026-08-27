/** A native checkbox dressed as a studio chip, to sit beside SelectChip in the
 * session header: cream surface, edge border, cognac tick. Used for the Tutor
 * mode switch. */
export default function ToggleChip({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[7px] border border-edge bg-chip px-3 py-[7px] font-sans text-[13px] text-ink-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cognac/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[13px] w-[13px] cursor-pointer accent-cognac focus-visible:outline-none"
      />
      {label}
    </label>
  );
}
