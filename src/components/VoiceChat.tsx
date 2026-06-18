"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SimpleVAD } from "@/lib/vad";
import type { SessionMode } from "@/lib/prompts";

type Status = "idle" | "listening" | "processing" | "speaking";
type Message = { role: "user" | "assistant"; text: string };

/** Live workspace context provided on every turn. Every mode identifies its
 * current question/lesson; coding and learning add editor state, behavioral /
 * system-design add freeform notes and a target level.
 */
export interface SessionContext {
  questionId?: string;
  questionTitle?: string;
  questionPrompt?: string;
  // Coding + Learning
  code?: string;
  language?: string;
  lastRun?: string;
  // Behavioral + System Design
  notes?: string;
  /** Target level (e.g. "senior") — calibrates the interviewer in behavioral / system-design. */
  level?: string;
}

interface VoiceChatProps {
  /** Stable id tying all turns to one server-side session. */
  sessionId: string;
  /** Which experience this is — sent on every turn so the server uses the right system prompt. */
  mode?: SessionMode;
  /** Pulled fresh on each turn so the interviewer / tutor sees the latest code / notes. */
  getContext?: () => SessionContext;
  /** Freestyle: invoked when the agent pushes new contents into the editor. */
  onEditorWrite?: (block: { language: string; code: string }) => void;
}

export default function VoiceChat({ sessionId, mode, getContext, onEditorWrite }: VoiceChatProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [latency, setLatency] = useState<number | null>(null);

  const vadRef = useRef<SimpleVAD | null>(null);
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const playingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Turn lifecycle. A turn ends — mic reopens — only once the server has
  // finished streaming AND playback is done (the <audio> queue is drained).
  // These refs are the inputs to finishTurnIfIdle, the single place that decides.
  const streamDoneRef = useRef(false); // server sent its "done" for this turn

  // Keep the latest getContext in a ref so sendAudio always reads fresh editor state.
  const getContextRef = useRef(getContext);
  useEffect(() => {
    getContextRef.current = getContext;
  });

  // Same for the editor-write callback (freestyle), so the stream handler below
  // doesn't need it in its dependency list.
  const onEditorWriteRef = useRef(onEditorWrite);
  useEffect(() => {
    onEditorWriteRef.current = onEditorWrite;
  });

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-19), `${new Date().toLocaleTimeString()} — ${msg}`]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    streamDoneRef.current = false;
    for (const audio of audioQueueRef.current) {
      audio.pause();
      if (audio.src) URL.revokeObjectURL(audio.src);
    }
    audioQueueRef.current = [];
  }, []);

  // The single owner of "is this turn over?". Every event that could end a turn
  // (server done, <audio> drained) calls this; it reads the turn refs and
  // reopens the mic exactly once.
  const finishTurnIfIdle = useCallback(() => {
    if (!streamDoneRef.current) return; // server still streaming
    if (playingRef.current) return; // playback still going
    streamDoneRef.current = false;
    vadRef.current?.unfreeze();
    setStatus("listening");
    addLog("Listening...");
  }, [addLog]);

  const playNext = useCallback(() => {
    // Local recursion so the drain loop doesn't reference the memoized callback
    // from within itself.
    function step() {
      if (!playingRef.current) return;
      const queue = audioQueueRef.current;
      if (queue.length === 0) {
        playingRef.current = false;
        finishTurnIfIdle();
        return;
      }

      const audio = queue[0];
      const advance = () => {
        if (audio.src) URL.revokeObjectURL(audio.src);
        queue.shift();
        step();
      };
      audio.onended = advance;
      audio.onerror = advance;
      audio.play().catch(advance);
    }
    step();
  }, [finishTurnIfIdle]);

  const enqueueAudio = useCallback(
    (b64: string) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "audio/wav" });
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

  const runTurn = useCallback(
    async (opts: { audio?: Blob; kickoff?: boolean }) => {
      stopPlayback();
      abortRef.current?.abort();

      // Fresh turn — reset the lifecycle ref finishTurnIfIdle reads.
      streamDoneRef.current = false;

      vadRef.current?.freeze();
      setStatus("processing");
      const startTime = Date.now();
      addLog(
        opts.kickoff
          ? "Starting interview..."
          : `Sending ${((opts.audio?.size ?? 0) / 1024).toFixed(1)}KB of audio...`
      );

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const form = new FormData();
        form.append("sessionId", sessionId);
        if (opts.audio) form.append("audio", opts.audio, "audio.wav");
        if (opts.kickoff) form.append("kickoff", "true");

        if (mode) {
          form.append("mode", mode);
        }

        // Attach live context so the interviewer "sees" the candidate's state.
        // Coding: code + runs. Behavioral/System: notes + current question.
        const ctx = getContextRef.current?.();
        if (ctx) {
          for (const [key, value] of Object.entries(ctx)) {
            if (value) form.append(key, value);
          }
        }

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
              } else if (msg.type === "editor") {
                // Freestyle: the agent loaded new contents into the editor.
                onEditorWriteRef.current?.({
                  language: msg.language,
                  code: msg.code,
                });
                addLog(`Loaded ${msg.language || "code"} into editor`);
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
                // An editor-only turn (the agent just loaded code, said nothing)
                // has no spoken text — don't render a blank bubble for it.
                if (msg.fullResponse.trim()) {
                  setMessages((prev) => [
                    ...prev,
                    { role: "assistant", text: msg.fullResponse },
                  ]);
                }
                addLog(`AI: "${msg.fullResponse.slice(0, 80)}${msg.fullResponse.length > 80 ? "..." : ""}"`);
                // The turn ends once playback catches up; finishTurnIfIdle owns
                // that decision.
                streamDoneRef.current = true;
                finishTurnIfIdle();
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
    [addLog, stopPlayback, enqueueAudio, finishTurnIfIdle, sessionId, mode]
  );

  const sendAudio = useCallback(
    (blob: Blob) => runTurn({ audio: blob }),
    [runTurn]
  );

  const startConversation = useCallback(async () => {
    if (vadRef.current) return;

    const vad = new SimpleVAD({
      silenceThreshold: 1.5,
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

      // The interviewer opens: greet the candidate and present the problem.
      runTurn({ kickoff: true });
    } catch (e) {
      addLog(`Mic error: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }, [addLog, sendAudio, stopPlayback, runTurn]);

  const stopConversation = useCallback(() => {
    vadRef.current?.stop();
    vadRef.current = null;
    stopPlayback();
    abortRef.current?.abort();
    streamDoneRef.current = false;
    setStatus("idle");
    addLog("Stopped.");
  }, [addLog, stopPlayback]);

  useEffect(() => {
    return () => {
      vadRef.current?.stop();
      stopPlayback();
      // Abort any in-flight turn so the stream loop exits — otherwise navigating
      // away mid-response leaves the fetch running and audio playing detached.
      abortRef.current?.abort();
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
    <div className="h-full w-full overflow-y-auto bg-gray-950 text-white flex flex-col items-center p-6">
      <div className="max-w-md w-full space-y-5">
        <div className="flex flex-col items-center space-y-4 pt-2">
          <div className="relative">
            <div
              className={`w-28 h-28 rounded-full ${color} flex items-center justify-center transition-colors duration-300`}
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
