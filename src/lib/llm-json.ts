// Models often wrap JSON in ```json fences despite being asked not to. Strip
// them defensively before parsing. Pure and bug-prone enough to deserve a
// tested home of its own.
export function stripCodeFences(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}
