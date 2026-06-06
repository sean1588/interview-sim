"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SimpleVAD } from "@/lib/vad";

type Status = "idle" | "listening" | "processing" | "speaking";
type Message = { role: "user" | "assistant"; text: string };

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export default function VoiceChat() {
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [latency, setLatency] = useState<number | null>(null);

  const vadRef = useRef<SimpleVAD | null>(null);
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const playingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-19), `${new Date().toLocaleTimeString()} — ${msg}`]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    for (const audio of audioQueueRef.current) {
      audio.pause();
      if (audio.src) URL.revokeObjectURL(audio.src);
    }
    audioQueueRef.current = [];
  }, []);

  const playNext = useCallback(() => {
    if (!playingRef.current) return;
    const queue = audioQueueRef.current;
    if (queue.length === 0) {
      playingRef.current = false;
      vadRef.current?.unfreeze();
      setStatus("listening");
      addLog("Listening...");
      return;
    }

    const audio = queue[0];
    audio.onended = () => {
      if (audio.src) URL.revokeObjectURL(audio.src);
      queue.shift();
      playNext();
    };
    audio.onerror = () => {
      if (audio.src) URL.revokeObjectURL(audio.src);
      queue.shift();
      playNext();
    };
    audio.play().catch(() => {
      queue.shift();
      playNext();
    });
  }, [addLog]);

  const enqueueAudio = useCallback(
    (b64: string) => {
      const buf = base64ToArrayBuffer(b64);
      const blob = new Blob([buf], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioQueueRef.current.push(audio);

      if (!playingRef.current) {
        playingRef.current = true;
        setStatus("speaking");
        playNext();
      }
    },
    [playNext]
  );

  const sendAudio = useCallback(
    async (blob: Blob) => {
      stopPlayback();
      abortRef.current?.abort();

      vadRef.current?.freeze();
      setStatus("processing");
      const startTime = Date.now();
      addLog(`Sending ${(blob.size / 1024).toFixed(1)}KB of audio...`);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const form = new FormData();
        form.append("audio", blob, "audio.webm");

        const res = await fetch("/api/chat", {
          method: "POST",
          body: form,
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Request failed");
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let firstAudioReceived = false;
        let responseText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const msg = JSON.parse(line);

              if (msg.type === "transcript") {
                setMessages((prev) => [...prev, { role: "user", text: msg.text }]);
                addLog(`You: "${msg.text}"`);
              } else if (msg.type === "text") {
                responseText += (responseText ? " " : "") + msg.text;
              } else if (msg.type === "audio") {
                if (!firstAudioReceived) {
                  firstAudioReceived = true;
                  const elapsed = Date.now() - startTime;
                  setLatency(elapsed);
                  addLog(`First audio chunk: ${elapsed}ms`);
                }
                enqueueAudio(msg.data);
              } else if (msg.type === "done") {
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", text: msg.fullResponse },
                ]);
                addLog(`AI: "${msg.fullResponse.slice(0, 80)}${msg.fullResponse.length > 80 ? "..." : ""}"`);
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      } catch (e) {
        vadRef.current?.unfreeze();
        if (e instanceof DOMException && e.name === "AbortError") {
          addLog("Interrupted — listening again");
          setStatus("listening");
          return;
        }
        addLog(`Error: ${e instanceof Error ? e.message : "unknown"}`);
        setStatus("listening");
      }
    },
    [addLog, stopPlayback, enqueueAudio]
  );

  const startConversation = useCallback(async () => {
    if (vadRef.current) return;

    const vad = new SimpleVAD({
      silenceThreshold: 15,
      silenceDuration: 1200,
      preRollMs: 400,
      onSpeechStart: () => {
        stopPlayback();
        addLog("Speech detected...");
      },
      onSpeechEnd: (audio: Blob) => {
        sendAudio(audio);
      },
    });

    try {
      await vad.start();
      vadRef.current = vad;
      setMessages([]);
      setStatus("listening");
      addLog("Microphone active — start talking!");
    } catch (e) {
      addLog(`Mic error: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }, [addLog, sendAudio, stopPlayback]);

  const stopConversation = useCallback(() => {
    vadRef.current?.stop();
    vadRef.current = null;
    stopPlayback();
    abortRef.current?.abort();
    setStatus("idle");
    addLog("Stopped.");
  }, [addLog, stopPlayback]);

  useEffect(() => {
    return () => {
      vadRef.current?.stop();
      stopPlayback();
    };
  }, [stopPlayback]);

  const statusConfig: Record<Status, { color: string; label: string; pulse: boolean }> = {
    idle: { color: "bg-gray-500", label: "Ready", pulse: false },
    listening: { color: "bg-green-500", label: "Listening...", pulse: true },
    processing: { color: "bg-yellow-500", label: "Thinking...", pulse: true },
    speaking: { color: "bg-blue-500", label: "Speaking...", pulse: true },
  };

  const { color, label, pulse } = statusConfig[status];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Voice Loop Spike</h1>
          <p className="text-gray-400">
            Streaming: mic → STT → LLM → TTS (sentence by sentence)
          </p>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div
              className={`w-24 h-24 rounded-full ${color} flex items-center justify-center transition-colors duration-300`}
            >
              {pulse && (
                <div
                  className={`absolute inset-0 rounded-full ${color} animate-ping opacity-25`}
                />
              )}
              <span className="text-sm font-medium z-10">{label}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={status === "idle" ? startConversation : stopConversation}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                status === "idle"
                  ? "bg-green-600 hover:bg-green-500"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {status === "idle" ? "Start Conversation" : "Stop"}
            </button>
            {latency !== null && (
              <span className="text-xs text-gray-500">
                First audio:{" "}
                <span
                  className={`font-mono font-bold ${
                    latency < 2000
                      ? "text-green-400"
                      : latency < 4000
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {(latency / 1000).toFixed(1)}s
                </span>
              </span>
            )}
          </div>
        </div>

        {messages.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 max-h-96 overflow-y-auto space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        <div className="bg-gray-900/50 rounded-xl p-4 font-mono text-xs text-gray-500 max-h-36 overflow-y-auto">
          {log.length === 0 ? (
            <p>Press Start to begin...</p>
          ) : (
            log.map((entry, i) => <p key={i}>{entry}</p>)
          )}
        </div>
      </div>
    </div>
  );
}
