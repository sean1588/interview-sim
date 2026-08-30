/** The catalog behind the home-page model picker.
 *
 * OPENROUTER_API_KEY is server-only (see openrouter.ts), so the browser can't
 * call OpenRouter's /models itself — it would 401, or force us to ship the key.
 * This proxies the call and returns only what the picker renders: id and name.
 * The upstream payload (pricing, provider routing, per-model config) is never
 * forwarded verbatim, and neither is the key.
 */

/** One row in the picker. */
export type ModelOption = { id: string; name: string };

const MODELS_URL = "https://openrouter.ai/api/v1/models";

/** Keep only the two fields the picker uses, drop anything without an id, and
 * sort by display name so the list reads the same on every load. */
function trimModels(payload: unknown): ModelOption[] {
  const raw = (payload as { data?: unknown })?.data;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => {
      const { id, name } = (m ?? {}) as { id?: unknown; name?: unknown };
      if (typeof id !== "string" || !id) return null;
      return { id, name: typeof name === "string" && name ? name : id };
    })
    .filter((m): m is ModelOption => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET() {
  try {
    // Raw fetch with the same auth header shape as openrouter.ts — this route
    // exists precisely so the SDK/browser never sees the key.
    const res = await fetch(MODELS_URL, {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    });
    if (!res.ok) {
      throw new Error(`OpenRouter /models failed (${res.status})`);
    }
    return Response.json({ models: trimModels(await res.json()) });
  } catch (error) {
    // The picker treats this as "no catalog" and stays on the stored model, so
    // a bad upstream degrades the list rather than the page.
    console.error("[models] could not load the catalog:", error);
    return Response.json({ error: "Could not load models" }, { status: 502 });
  }
}
