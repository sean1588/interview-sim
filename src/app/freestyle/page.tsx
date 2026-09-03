import FreestyleWorkspace from "@/components/FreestyleWorkspace";

export default async function FreestylePage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string | string[] }>;
}) {
  const params = await searchParams;
  const focus = Array.isArray(params.focus) ? params.focus[0] : params.focus;
  return <FreestyleWorkspace workOnWeakLines={focus === "weak-lines"} />;
}
