import type { ByLanguage } from "../types";

export type ReactCourseLanguage = "javascript" | "typescript";

export function forReact<T>(
  render: (language: ReactCourseLanguage) => T
): ByLanguage<T> {
  return {
    javascript: render("javascript"),
    typescript: render("typescript"),
  };
}

export function reactVariants<T>(javascript: T, typescript: T): ByLanguage<T> {
  return { javascript, typescript };
}

export function reactCode(
  language: ReactCourseLanguage,
  javascript: string,
  typescript: string
): string {
  const fence = language === "javascript" ? "jsx" : "tsx";
  const source = language === "javascript" ? javascript : typescript;
  return `\`\`\`${fence}\n${source}\n\`\`\``;
}
