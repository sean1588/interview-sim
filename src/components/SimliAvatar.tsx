"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface SimliAvatarHandle {
  /** Connect to Simli. Resolves true if the avatar is live, false otherwise. */
  init: () => Promise<boolean>;
  /** Send PCM16 mono @ 16kHz audio for the avatar to speak/lip-sync. */
  sendAudio: (pcm: Uint8Array) => void;
  /** Stop the avatar mid-speech (for barge-in). */
  clear: () => void;
  /** Tear down the connection. */
  destroy: () => void;
}

interface SimliAvatarProps {
  onSpeaking?: () => void;
  onSilent?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SimliClientInstance = any;

const SimliAvatar = forwardRef<SimliAvatarHandle, SimliAvatarProps>(
  function SimliAvatar({ onSpeaking, onSilent }, ref) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const clientRef = useRef<SimliClientInstance | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      async init() {
        if (clientRef.current) return connected;
        setError(null);
        try {
          const res = await fetch("/api/simli-token", { method: "POST" });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            setError(err.error || "Could not get Simli token");
            return false;
          }
          const { sessionToken, iceServers } = await res.json();

          const { SimliClient } = await import("simli-client");
          const client = new SimliClient(
            sessionToken,
            videoRef.current!,
            audioRef.current!,
            iceServers ?? null
          );

          client.on("speaking", () => onSpeaking?.());
          client.on("silent", () => onSilent?.());
          client.on("error", (detail: string) => {
            console.error("[Simli] error:", detail);
            setError(detail);
          });

          await client.start();
          clientRef.current = client;
          setConnected(true);
          return true;
        } catch (e) {
          console.error("[Simli] init failed:", e);
          setError(e instanceof Error ? e.message : String(e));
          return false;
        }
      },

      sendAudio(pcm: Uint8Array) {
        if (!clientRef.current) return;
        // Chunk to keep individual messages small.
        const CHUNK = 6000; // bytes (3000 samples)
        for (let i = 0; i < pcm.length; i += CHUNK) {
          clientRef.current.sendAudioData(pcm.subarray(i, i + CHUNK));
        }
      },

      clear() {
        clientRef.current?.ClearBuffer?.();
      },

      destroy() {
        try {
          clientRef.current?.stop?.();
        } catch {
          // ignore
        }
        clientRef.current = null;
        setConnected(false);
      },
    }));

    return (
      <div className="relative w-64 h-64 rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <audio ref={audioRef} autoPlay />
        {!connected && (
          <div className="absolute inset-0 flex items-center justify-center text-center text-xs text-gray-400 p-4">
            {error ? `Avatar offline: ${error}` : "Avatar will appear here"}
          </div>
        )}
      </div>
    );
  }
);

export default SimliAvatar;
