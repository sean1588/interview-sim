"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { SimpleVAD } from "@/lib/vad";
import type { SessionMode } from "@/lib/prompts";
import Orb, { type OrbState } from "@/components/session/Orb";
import Equalizer from "@/components/session/Equalizer";
import { Mic } from "@/components/session/icons";

type Status = "idle" | "listening" | "processing" | "speaking";
type Message = { role: "user" | "assistant"; text: string };

/** Who's on the other end of the conversation, per mode — the orb header name and
 * the caps label above interviewer/coach/tutor bubbles. Dispatch by lookup, not
 * scattered conditionals. */
const SPEAKER: Record<SessionMode, { name: string; label: string }> = {
  coding: { name: "The Interviewer", label: "Interviewer" },
  behavioral: { name: "The Interviewer", label: "Interviewer" },
  "system-design": { name: "The Interviewer", label: "Interviewer" },
  freestyle: { name: "Your Coach", label: "Coach" },
  learning: { name: "Your Tutor", label: "Tutor" },
};

/** The orb header treatment per voice-engine status: label, accent (state label +
 * equalizer color), orb state, and whether the equalizer shows. */
const VOICE: Record<Status, { label: string; accent: string; orb: OrbState; eq: boolean }> = {
  idle: { label: "Ready", accent: "#a8997e", orb: "idle", eq: false },
  listening: { label: "Listening", accent: "#5e6b3c", orb: "listening", eq: true },
  processing: { label: "Thinking", accent: "#8a7d63", orb: "thinking", eq: false },
  speaking: { label: "Speaking", accent: "#b5651d", orb: "speaking", eq: true },
};

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
  /** Tutor mode — sent on every turn so the server swaps the evaluative
   * interviewer for a teaching persona (coding / system-design only). */
  tutor?: boolean;
  /** Pulled fresh on each turn so the interviewer / tutor sees the latest code / notes. */
  getContext?: () => SessionContext;
  /** Freestyle: invoked when the agent pushes new contents into the editor. */
  onEditorWrite?: (block: { language: string; code: string }) => void;
  /** Orb diameter — 64 in the interview/coach columns, 56 in the tighter lesson column. */
  orbSize?: number;
  /** Pre-start content shown in the transcript area before the first message
   * arrives (e.g. freestyle's "pick a starting point" chips). */
  prelude?: ReactNode;
}

export default function VoiceChat({
  sessionId,
  mode,
  tutor,
  getContext,
  onEditorWrite,
  orbSize = 64,
  prelude,
}: VoiceChatProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  // Surfaced in the mic bar. Mic-permission failures and failed turns used to
  // reach only the (now-removed) dev log; this is the user-facing channel.
  const [error, setError] = useState<string | null>(null);

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
  }, []);

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
      setError(null);

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
        if (tutor) form.append("tutor", "true");

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
              } else if (msg.type === "editor") {
                // Freestyle: the agent loaded new contents into the editor.
                onEditorWriteRef.current?.({
                  language: msg.language,
                  code: msg.code,
                });
              } else if (msg.type === "text") {
                responseText += (responseText ? " " : "") + msg.text;
              } else if (msg.type === "audio") {
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
          // Interrupted by the next turn — expected, not an error.
          setStatus("listening");
          return;
        }
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setStatus("listening");
      }
    },
    [stopPlayback, enqueueAudio, finishTurnIfIdle, sessionId, mode, tutor]
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
      },
      onSpeechEnd: (audio: Blob) => {
        sendAudio(audio);
      },
    });

    try {
      await vad.start();
      vadRef.current = vad;
      setMessages([]);
      setError(null);
      setStatus("listening");

      // The interviewer opens: greet the candidate and present the problem.
      runTurn({ kickoff: true });
    } catch (e) {
      setError(
        e instanceof Error
          ? `Microphone unavailable — ${e.message}`
          : "Microphone unavailable — check your browser permissions."
      );
    }
  }, [sendAudio, stopPlayback, runTurn]);

  const stopConversation = useCallback(() => {
    vadRef.current?.stop();
    vadRef.current = null;
    stopPlayback();
    abortRef.current?.abort();
    streamDoneRef.current = false;
    setStatus("idle");
  }, [stopPlayback]);

  useEffect(() => {
    return () => {
      vadRef.current?.stop();
      stopPlayback();
      // Abort any in-flight turn so the stream loop exits — otherwise navigating
      // away mid-response leaves the fetch running and audio playing detached.
      abortRef.current?.abort();
    };
  }, [stopPlayback]);

  const v = VOICE[status];
  const speaker = SPEAKER[mode ?? "coding"];

  return (
    <div className="h-full w-full min-h-0 flex flex-col bg-raised">
      {/* Orb header — the persona's reactive presence */}
      <div className="flex-none flex items-center gap-[19px] border-b border-hair px-6 py-5">
        <Orb state={v.orb} size={orbSize} />
        <div>
          <div className="font-serif text-[19px] font-semibold text-ink">{speaker.name}</div>
          <div
            className="mt-0.5 font-sans text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: v.accent }}
          >
            {v.label}
          </div>
          {v.eq && (
            <div className="mt-2">
              <Equalizer color={v.accent} bars={5} height={15} />
            </div>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {messages.length === 0 && prelude}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.text} speakerLabel={speaker.label} />
        ))}
        {status === "processing" && <TypingIndicator />}
        <div ref={chatEndRef} />
      </div>

      {/* Mic bar */}
      <div className="flex-none flex items-center gap-3 border-t border-hair bg-frame px-5 py-4">
        <button
          onClick={status === "idle" ? startConversation : stopConversation}
          aria-label={status === "idle" ? "Start conversation" : "Stop conversation"}
          className="grid h-11 w-11 flex-none place-items-center rounded-full bg-cognac text-[#fbf3e7] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 focus-visible:ring-offset-2 focus-visible:ring-offset-frame"
          style={{ boxShadow: "0 3px 10px rgba(168,85,29,.35)" }}
        >
          <Mic size={17} />
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          {status === "listening" && !error && (
            <Equalizer color="#cdbfa3" bars={4} height={18} stagger={0.2} />
          )}
          <span
            className={`truncate font-sans text-[13px] ${
              error ? "text-[#9c3b28]" : "text-[#8a7259]"
            }`}
          >
            {error ?? MIC_HINT[status]}
          </span>
        </div>
      </div>
    </div>
  );
}

const MIC_HINT: Record<Status, string> = {
  idle: "Tap the mic to begin",
  listening: "Listening — speak any time",
  processing: "Thinking…",
  speaking: "Speaking…",
};

/** One transcript turn. Interviewer/coach/tutor bubbles sit left with a cognac
 * caps label; "You" bubbles sit right with a muted label and the mirrored radius. */
function Bubble({
  role,
  text,
  speakerLabel,
}: {
  role: "user" | "assistant";
  text: string;
  speakerLabel: string;
}) {
  if (role === "user") {
    return (
      <div className="self-end max-w-[92%]">
        <div className="mb-1.5 text-right font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
          You
        </div>
        <div className="rounded-[14px_3px_14px_14px] border border-bubble-edge bg-bubble px-[15px] py-3 font-serif text-[16px] leading-[1.5] text-ink-soft">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="self-start max-w-[92%]">
      <div className="mb-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-[#a8754a]">
        {speakerLabel}
      </div>
      <div className="rounded-[3px_14px_14px_14px] border border-hair bg-chip px-[15px] py-3 font-serif text-[16px] leading-[1.5] text-ink-soft">
        {text}
      </div>
    </div>
  );
}

/** Three glowing dots while the interviewer composes a reply. */
function TypingIndicator() {
  return (
    <div className="self-start flex items-center gap-1.5 px-0.5 py-1">
      {[0, 0.2, 0.4].map((d) => (
        <span
          key={d}
          className="h-[7px] w-[7px] rounded-full bg-olive animate-glow"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
      <span className="ml-1 font-serif italic text-[14px] text-muted">Thinking…</span>
    </div>
  );
}
