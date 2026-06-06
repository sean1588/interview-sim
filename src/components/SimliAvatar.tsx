"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface SimliAvatarHandle {
  /** Connect to Simli. Resolves true if the avatar is live, false otherwise. */
  init: () => Promise<boolean>;
  /** Send PCM16 mono @ 16kHz audio. Returns false if the connection is dead. */
  sendAudio: (pcm: Uint8Array) => boolean;
  /** Stop the avatar mid-speech (for barge-in). */
  clear: () => void;
  /** Tear down the connection. */
  destroy: () => void;
}

interface SimliAvatarProps {
  onSpeaking?: () => void;
  onSilent?: () => void;
  /** Fired when the live connection drops unexpectedly (e.g. WS closed). */
  onDisconnected?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SimliClientInstance = any;

const SimliAvatar = forwardRef<SimliAvatarHandle, SimliAvatarProps>(
  function SimliAvatar({ onSpeaking, onSilent, onDisconnected }, ref) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const clientRef = useRef<SimliClientInstance | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Tear down a dead connection and notify the parent so it can downgrade to
    // voice-only / reconnect. Called when a send fails (WS closed) so the error
    // never escapes as an unhandled rejection.
    const dropConnection = useCallback(
      (reason: string) => {
        if (!clientRef.current) return;
        console.warn("[Simli] connection dropped:", reason);
        try {
          clientRef.current.stop?.();
        } catch {
          // ignore — already dead
        }
        clientRef.current = null;
        setConnected(false);
        onDisconnected?.();
      },
      [onDisconnected]
    );

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

      sendAudio(pcm: Uint8Array): boolean {
        const client = clientRef.current;
        if (!client) return false;
        // Chunk to keep individual messages small.
        const CHUNK = 6000; // bytes (3000 samples)
        try {
          for (let i = 0; i < pcm.length; i += CHUNK) {
            client.sendAudioData(pcm.subarray(i, i + CHUNK));
          }
          return true;
        } catch (e) {
          // WS closed (e.g. "Invalid State, WS Connection 3") — downgrade.
          dropConnection(e instanceof Error ? e.message : String(e));
          return false;
        }
      },

      clear() {
        try {
          clientRef.current?.ClearBuffer?.();
        } catch (e) {
          dropConnection(e instanceof Error ? e.message : String(e));
        }
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
