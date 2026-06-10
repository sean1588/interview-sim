"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SimpleVAD } from "@/lib/vad";
import SimliAvatar, { SimliAvatarHandle } from "@/components/SimliAvatar";
import { wavBase64ToSimliPcm, base64ToUint8 } from "@/lib/audio";
import type { InterviewMode } from "@/lib/prompts";

type Status = "idle" | "listening" | "processing" | "speaking";
type Message = { role: "user" | "assistant"; text: string };

/** Live interview context the workspace provides on every turn.
 * Coding mode uses code + language + problem fields.
 * Behavioral / System Design can provide `notes` (and question identifiers).
 */
export interface InterviewContext {
  // Coding
  code?: string;
  language?: string;
  problemId?: string;
  problemTitle?: string;
  problemPrompt?: string;
  lastRun?: string;
  // Behavioral + System Design (and any mode that has freeform notes)
  notes?: string;
  // Generic identifiers (used by non-coding modes)
  questionId?: string;
  questionTitle?: string;
  questionPrompt?: string;
}

interface VoiceChatProps {
  /** Stable id tying all turns to one server-side interview session. */
  sessionId: string;
  /** Which experience this is — sent on every turn so the server uses the right interviewer prompt. */
  mode?: InterviewMode;
  /** Pulled fresh on each turn so the interviewer sees the candidate's latest code / notes. */
  getContext?: () => InterviewContext;
}

export default function VoiceChat({ sessionId, mode, getContext }: VoiceChatProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  // Avatar on = animated Simli character; off = voice-only (no Simli session,
  // saves credits). Plain <audio> playback is used whenever the avatar is off.
  const [avatarEnabled, setAvatarEnabled] = useState(false);

  const vadRef = useRef<SimpleVAD | null>(null);
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const playingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Avatar: when connected, audio is routed to Simli instead of <audio> tags.
  const avatarRef = useRef<SimliAvatarHandle | null>(null);
  const avatarActiveRef = useRef(false);
  const reconnectingRef = useRef(false);

  // Turn lifecycle. A turn ends — mic reopens — only once the server has
  // finished streaming AND playback is done: the <audio> queue is drained and,
  // if we routed audio to the avatar, it has spoken and fallen silent. These
  // refs are the inputs to finishTurnIfIdle, the single place that decides.
  const streamDoneRef = useRef(false); // server sent its "done" for this turn
  const avatarAudioSentRef = useRef(false); // routed any audio to the avatar
  const avatarSpokeRef = useRef(false); // avatar has started speaking this turn
  const avatarSpeakingRef = useRef(false); // avatar is speaking right now
  const avatarEnabledRef = useRef(avatarEnabled);
  useEffect(() => {
    avatarEnabledRef.current = avatarEnabled;
  }, [avatarEnabled]);

  // Keep the latest getContext in a ref so sendAudio always reads fresh editor state.
  const getContextRef = useRef(getContext);
  useEffect(() => {
    getContextRef.current = getContext;
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
    if (avatarActiveRef.current) {
      avatarRef.current?.clear();
    }
  }, []);

  // The single owner of "is this turn over?". Every event that could end a turn
  // (server done, <audio> drained, avatar silent/disconnected, avatar toggled
  // off) calls this; it reads the turn refs and reopens the mic exactly once.
  const finishTurnIfIdle = useCallback(() => {
    if (!streamDoneRef.current) return; // server still streaming
    if (playingRef.current) return; // <audio> fallback still playing
    // If we sent audio to the avatar, wait for it to actually speak and then
    // fall silent. Checking a live "speaking" flag (not just the next silent
    // event) means we can't lose the event if it arrives before "done".
    if (avatarActiveRef.current && avatarAudioSentRef.current) {
      if (!avatarSpokeRef.current) return; // hasn't started speaking yet
      if (avatarSpeakingRef.current) return; // still speaking
    }
    streamDoneRef.current = false;
    vadRef.current?.unfreeze();
    setStatus("listening");
    addLog("Listening...");
  }, [addLog]);

  const handleAvatarSpeaking = useCallback(() => {
    avatarSpeakingRef.current = true;
    avatarSpokeRef.current = true;
    setStatus("speaking");
  }, []);

  const handleAvatarSilent = useCallback(() => {
    avatarSpeakingRef.current = false;
    finishTurnIfIdle();
  }, [finishTurnIfIdle]);

  // The Simli connection died (e.g. WS closed). Downgrade to voice-only so the
  // conversation keeps flowing, then try to bring the avatar back once.
  const handleAvatarDisconnected = useCallback(() => {
    avatarActiveRef.current = false;
    // The avatar's onSilent will never come now — finishTurnIfIdle no longer
    // waits on it (avatar inactive), so this recovers a frozen turn.
    finishTurnIfIdle();

    // Don't reconnect if the user has turned the avatar off.
    if (!avatarEnabledRef.current) {
      addLog("Avatar off — voice only.");
      return;
    }
    if (reconnectingRef.current) return;
    reconnectingRef.current = true;
    addLog("Avatar connection dropped — voice only. Reconnecting…");
    setTimeout(async () => {
      // Bail if the conversation was stopped or the avatar disabled meanwhile.
      if (!vadRef.current || !avatarEnabledRef.current) {
        reconnectingRef.current = false;
        return;
      }
      const ok = await avatarRef.current?.init();
      reconnectingRef.current = false;
      avatarActiveRef.current = !!ok;
      addLog(ok ? "Avatar reconnected." : "Avatar offline — voice only.");
    }, 1500);
  }, [addLog, finishTurnIfIdle]);

  // Toggle the animated avatar on/off. Takes effect live if a conversation is
  // running; otherwise it just sets the preference for the next start.
  const toggleAvatar = useCallback(async () => {
    const next = !avatarEnabledRef.current;
    avatarEnabledRef.current = next;
    setAvatarEnabled(next);

    if (!vadRef.current) return; // not in a conversation; preference saved

    if (next) {
      addLog("Enabling avatar…");
      const ok = await avatarRef.current?.init();
      avatarActiveRef.current = !!ok;
      addLog(ok ? "Avatar connected." : "Avatar offline — voice only.");
    } else {
      addLog("Avatar off — voice only.");
      reconnectingRef.current = false;
      avatarActiveRef.current = false;
      avatarRef.current?.destroy();
      // We're no longer waiting on the avatar to finish the turn — recover.
      finishTurnIfIdle();
    }
  }, [addLog, finishTurnIfIdle]);

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
      const blob = new Blob([base64ToUint8(b64)], { type: "audio/wav" });
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

      // Fresh turn — reset the lifecycle refs finishTurnIfIdle reads.
      streamDoneRef.current = false;
      avatarAudioSentRef.current = false;
      avatarSpokeRef.current = false;
      avatarSpeakingRef.current = false;

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
          if (ctx.code) form.append("code", ctx.code);
          if (ctx.language) form.append("language", ctx.language);
          if (ctx.problemId) form.append("problemId", ctx.problemId);
          if (ctx.problemTitle) form.append("problemTitle", ctx.problemTitle);
          if (ctx.problemPrompt) form.append("problemPrompt", ctx.problemPrompt);
          if (ctx.lastRun) form.append("lastRun", ctx.lastRun);

          if (ctx.notes) form.append("notes", ctx.notes);
          if (ctx.questionId) form.append("questionId", ctx.questionId);
          if (ctx.questionTitle) form.append("questionTitle", ctx.questionTitle);
          if (ctx.questionPrompt) form.append("questionPrompt", ctx.questionPrompt);
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
              } else if (msg.type === "text") {
                responseText += (responseText ? " " : "") + msg.text;
              } else if (msg.type === "audio") {
                if (!firstAudioReceived) {
                  firstAudioReceived = true;
                  const elapsed = Date.now() - startTime;
                  setLatency(elapsed);
                  addLog(`First audio chunk: ${elapsed}ms`);
                }
                // Route to the avatar if it's live; if the send fails (dead
                // socket) fall back to plain <audio> for this chunk so the
                // response is still heard.
                const sentToAvatar =
                  avatarActiveRef.current &&
                  avatarRef.current?.sendAudio(wavBase64ToSimliPcm(msg.data));
                if (sentToAvatar) {
                  avatarAudioSentRef.current = true;
                  setStatus("speaking");
                } else {
                  enqueueAudio(msg.data);
                }
              } else if (msg.type === "done") {
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", text: msg.fullResponse },
                ]);
                addLog(`AI: "${msg.fullResponse.slice(0, 80)}${msg.fullResponse.length > 80 ? "..." : ""}"`);
                // The turn ends once playback catches up; finishTurnIfIdle
                // owns that decision across the avatar and <audio> paths.
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
    [addLog, stopPlayback, enqueueAudio, finishTurnIfIdle, sessionId]
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

      // Bring the avatar online only if enabled. Voice-only mode skips the
      // Simli session entirely (saves credits) and uses <audio> playback.
      if (avatarEnabledRef.current) {
        addLog("Connecting avatar...");
        const ok = await avatarRef.current?.init();
        avatarActiveRef.current = !!ok;
        addLog(ok ? "Avatar connected." : "Avatar offline — audio only.");
      } else {
        avatarActiveRef.current = false;
        addLog("Voice-only mode (avatar off).");
      }

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
    avatarRef.current?.destroy();
    avatarActiveRef.current = false;
    streamDoneRef.current = false;
    reconnectingRef.current = false;
    setStatus("idle");
    addLog("Stopped.");
  }, [addLog, stopPlayback]);

  useEffect(() => {
    return () => {
      vadRef.current?.stop();
      stopPlayback();
      avatarRef.current?.destroy();
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
        <div className="flex justify-center">
          {/* Keep SimliAvatar mounted (so the ref survives toggling) but hide
              it in voice-only mode and show a compact badge instead. */}
          <div className={avatarEnabled ? "" : "hidden"}>
            <SimliAvatar
              ref={avatarRef}
              onSpeaking={handleAvatarSpeaking}
              onSilent={handleAvatarSilent}
              onDisconnected={handleAvatarDisconnected}
            />
          </div>
          {!avatarEnabled && (
            <div className="w-64 h-64 rounded-2xl bg-gray-800/60 border border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400">
              <span className="text-4xl">🎙️</span>
              <span className="text-sm">Voice-only mode</span>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            role="switch"
            aria-checked={avatarEnabled}
            onClick={toggleAvatar}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            <span>Avatar</span>
            <span
              className={`relative w-10 h-5 rounded-full transition-colors ${
                avatarEnabled ? "bg-green-600" : "bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  avatarEnabled ? "translate-x-5" : ""
                }`}
              />
            </span>
            <span className="w-7 text-left">{avatarEnabled ? "On" : "Off"}</span>
          </button>
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
