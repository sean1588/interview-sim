import { NextRequest } from "next/server";

const SIMLI_URL = "https://api.simli.ai";

// A default realistic face from Simli's library. Swap SIMLI_FACE_ID in the
// environment for a custom (e.g. friendly 3D character) face once created.
const DEFAULT_FACE_ID = "tmp9i8bbq7c";

export async function POST(req: NextRequest) {
  const apiKey = process.env.SIMLI_API_KEY;
  if (!apiKey || apiKey === "your-simli-api-key-here") {
    return Response.json(
      { error: "SIMLI_API_KEY not configured" },
      { status: 400 }
    );
  }

  let faceId = process.env.SIMLI_FACE_ID || DEFAULT_FACE_ID;
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.faceId) faceId = body.faceId;
  } catch {
    // ignore — use env/default face
  }

  try {
    const tokenRes = await fetch(`${SIMLI_URL}/compose/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-simli-api-key": apiKey,
      },
      body: JSON.stringify({
        faceId,
        handleSilence: true,
        maxSessionLength: 3600,
        maxIdleTime: 300,
        model: "fasttalk",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[Simli] token error:", errText);
      return Response.json({ error: errText }, { status: tokenRes.status });
    }

    const tokenJson = await tokenRes.json();
    const sessionToken =
      typeof tokenJson === "string" ? tokenJson : tokenJson.session_token;

    let iceServers: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302"] }];
    try {
      const iceRes = await fetch(`${SIMLI_URL}/compose/ice`, {
        headers: {
          "Content-Type": "application/json",
          "x-simli-api-key": apiKey,
        },
      });
      if (iceRes.ok) {
        const ice = await iceRes.json();
        if (Array.isArray(ice) && ice.length > 0) iceServers = ice;
      }
    } catch {
      // fall back to public STUN
    }

    return Response.json({ sessionToken, iceServers, faceId });
  } catch (error) {
    console.error("[Simli] token request failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Token request failed" },
      { status: 500 }
    );
  }
}
