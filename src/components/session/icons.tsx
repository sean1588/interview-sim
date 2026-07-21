import type { SVGProps } from "react";

/** The stroke-based icon set for the studio chrome. Editorial tone: thin strokes,
 * round caps, `currentColor` so each icon inherits its context's text color. */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Stroke({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function ChevronLeft(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M15 18l-6-6 6-6" />
    </Stroke>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <Stroke strokeWidth={2.2} {...props}>
      <path d="M6 9l6 6 6-6" />
    </Stroke>
  );
}

export function Mic(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </Stroke>
  );
}

export function Pencil(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Stroke>
  );
}

export function Sun(props: IconProps) {
  return (
    <Stroke strokeWidth={1.6} {...props}>
      <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
    </Stroke>
  );
}

/** Filled play triangle for the Run button. */
export function Play({ size = 12, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/** Paper-plane for the text composer's Send button. */
export function Send(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </Stroke>
  );
}
