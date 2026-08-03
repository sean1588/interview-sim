"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { SimpleVAD } from "@/lib/vad";
import { settleTurn, type TurnSettle } from "@/lib/mic-state";
import type { SessionMode } from "@/lib/prompts";
import Orb, { type OrbState } from "@/components/session/Orb";
import Equalizer from "@/components/session/Equalizer";
import { Mic, MicOff, Send, Stop } from "@/components/session/icons";

// "listening"/"speaking" are mic-only; "ready" is their text-mode counterpart —
// the composer is enabled and awaiting a typed reply. "off" is the push-to-talk
// resting state: the session is live but the mic is disarmed (released).
type Status = "idle" | "listening" | "processing" | "speaking" | "ready" | "off";
type InputMode = "voice" | "text";
// How the mic engages. push-to-talk: disarmed until the user taps to arm; the
// mic then captures — through pauses — until they tap it off, which sends the
// whole take. hands-free: continuous listening — armed on start, utterances
// sent after each pause in speech, reopened after every reply.
type MicMode = "push-to-talk" | "hands-free";
type Message = { role: "user" | "assistant"; text: string };

/** A reply is in flight — the server is still streaming, or its audio is still
 * playing. Opening the mic now would capture the reply's own voice, so arming is
 * deferred to the turn's end; it's also the window where "stop" is offered. */
const isReplying = (s: Status) => s === "processing" || s === "speaking";

// New sessions start in push-to-talk (mic disarmed) so the mic is only live once
// the user toggles it on. Flip this one constant to default to hands-free.
const DEFAULT_MIC_MODE: MicMode = "push-to-talk";

/** Who's on the other end of the conversation, per mode — the orb header name and
 * the caps label above interviewer/coach/tutor bubbles. Dispatch by lookup, not
 * scattered conditionals. */
const SPEAKER: Record<SessionMode, { name: string; label: string }> = {
  coding: { name: "The Interviewer", label: "Interviewer" },
  behavioral: { name: "The Interviewer", label: "Interviewer" },
  "system-design": { name: "The Interviewer", label: "Interviewer" },
  freestyle: { name: "Your Coach", label: "Coach" },
  learning: { name: "Your Tutor", label: "Tutor" },
  career: { name: "Your Career Coach", label: "Coach" },
};

/** The orb header treatment per voice-engine status: label, accent (state label +
 * equalizer color), orb state, and whether the equalizer shows. */
const VOICE: Record<Status, { label: string; accent: string; orb: OrbState; eq: boolean }> = {
  idle: { label: "Ready", accent: "#a8997e", orb: "idle", eq: false },
  listening: { label: "Listening", accent: "#5e6b3c", orb: "listening", eq: true },
  processing: { label: "Thinking", accent: "#8a7d63", orb: "thinking", eq: false },
  speaking: { label: "Speaking", accent: "#b5651d", orb: "speaking", eq: true },
  ready: { label: "Ready", accent: "#a8997e", orb: "idle", eq: false },
  off: { label: "Mic off", accent: "#a8997e", orb: "idle", eq: false },
};

/** Orb header treatment in text mode: no mic states, just thinking vs. ready. */
const TEXT_HEADER: Record<Status, { label: string; accent: string; orb: OrbState; eq: boolean }> = {
  idle: { label: "Ready", accent: "#a8997e", orb: "idle", eq: false },
  processing: { label: "Thinking", accent: "#8a7d63", orb: "thinking", eq: false },
  listening: { label: "Ready", accent: "#a8997e", orb: "idle", eq: false },
  speaking: { label: "Ready", accent: "#a8997e", orb: "idle", eq: false },
  ready: { label: "Ready", accent: "#a8997e", orb: "idle", eq: false },
  off: { label: "Ready", accent: "#a8997e", orb: "idle", eq: false },
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
  /** Learning: the course id. Concept courses declare no language, so this is
   * what selects their tutor persona server-side. */
  course?: string;
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
  // Voice (mic) vs. text (typed). Default voice; switchable mid-session without
  // losing the server-side history, since both modes share one sessionId.
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  // How the mic engages (push-to-talk vs. hands-free) and whether it's currently
  // armed. `armed` is the single source of truth for "should the mic be open" —
  // finishTurnIfIdle reopens after a reply only when it's set.
  const [micMode, setMicMode] = useState<MicMode>(DEFAULT_MIC_MODE);
  const [armed, setArmed] = useState(false);
  // Surfaced in the mic bar. Mic-permission failures and failed turns used to
  // reach only the (now-removed) dev log; this is the user-facing channel.
  const [error, setError] = useState<string | null>(null);

  const vadRef = useRef<SimpleVAD | null>(null);
  // The in-flight mic acquisition, if any. `vadRef` is only assigned once
  // getUserMedia resolves, so it can't guard against a second concurrent attempt
  // (a double-tap) — this promise does, collapsing them onto one stream.
  const acquireRef = useRef<Promise<void> | null>(null);
  // finishTurnIfIdle/applySettle acquire the mic through this ref because startVad
  // is defined later (it closes over the turn callbacks). Kept current by an
  // effect below, mirroring the other late-bound refs.
  const startVadRef = useRef<(() => Promise<void>) | null>(null);
  // Read inside the memoized turn callbacks so they branch on the current mode
  // without being torn down and rebuilt every time the toggle flips.
  const inputModeRef = useRef(inputMode);
  useEffect(() => {
    inputModeRef.current = inputMode;
  });
  const micModeRef = useRef(micMode);
  useEffect(() => {
    micModeRef.current = micMode;
  });
  // finishTurnIfIdle reads this (it's memoized with no deps) to decide whether to
  // reopen the mic. Handlers set it directly for immediacy; the effect is backup.
  const armedRef = useRef(armed);
  useEffect(() => {
    armedRef.current = armed;
  });
  // Lets event handlers read the live status without listing it as a dep. Used to
  // gate arming to the settled "off" state (never over a still-playing reply).
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  });
  // The session has begun (kickoff fired). In voice mode the VAD's presence used
  // to be this signal, but text mode has no VAD — so track it explicitly.
  const startedRef = useRef(false);
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

  // Carry out a settleTurn decision. The only subtlety is reopening the armed
  // mic: unfreeze the frozen VAD if one exists, else acquire a fresh one — the
  // hands-free-switched-on-mid-turn case, which leaves `armed` set with no VAD.
  // If acquisition fails, startVad has surfaced the error; drop the now-false
  // armed state and settle to "off" rather than lie with a dead "listening".
  const applySettle = useCallback((s: TurnSettle) => {
    if (s.status !== "listening") {
      setStatus(s.status);
      return;
    }
    if (s.mic === "unfreeze") {
      vadRef.current?.unfreeze();
      setStatus("listening"); // startVad sets this itself on the acquire path
      return;
    }
    startVadRef.current?.().catch(() => {
      armedRef.current = false;
      setArmed(false);
      setStatus("off");
    });
  }, []);

  // Settle the turn from the live refs. Every way a turn can end — drained,
  // failed, aborted, interrupted — routes through here, so they all land on the
  // same decision.
  const settleNow = useCallback(() => {
    applySettle(
      settleTurn({
        inputMode: inputModeRef.current,
        armed: armedRef.current,
        hasVad: vadRef.current !== null,
      })
    );
  }, [applySettle]);

  // The single owner of "is this turn over?". Every event that could end a turn
  // (server done, <audio> drained) calls this; it reads the turn refs and
  // reopens the mic exactly once.
  const finishTurnIfIdle = useCallback(() => {
    if (!streamDoneRef.current) return; // server still streaming
    if (playingRef.current) return; // playback still going
    streamDoneRef.current = false;
    settleNow();
  }, [settleNow]);

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
    async (opts: { audio?: Blob; kickoff?: boolean; text?: string }) => {
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
        if (opts.text !== undefined) form.append("text", opts.text);
        if (opts.kickoff) form.append("kickoff", "true");
        // Text mode is silent — including the kickoff greeting — so the server
        // streams words but synthesizes no speech.
        if (inputModeRef.current === "text") form.append("silent", "true");

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
                // The server won't send audio when silent, but text mode must
                // never play speech even if a stray chunk arrives.
                if (inputModeRef.current !== "text") enqueueAudio(msg.data);
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
        // Whoever holds abortRef owns the input now. If a newer turn replaced the
        // controller — or interrupt() cleared it and settled itself — this turn
        // must not touch the mic or the status on its way out.
        const owns = abortRef.current === controller;
        if (e instanceof DOMException && e.name === "AbortError") {
          // Interrupted — expected, not an error.
          if (owns) settleNow();
          return;
        }
        // The turn genuinely failed. Settle it like a normal turn end: text ->
        // composer, armed voice -> reopen the mic (acquiring one if hands-free was
        // switched on mid-turn), disarmed voice -> "off".
        setError(e instanceof Error ? e.message : "Something went wrong.");
        if (owns) settleNow();
      }
    },
    [stopPlayback, enqueueAudio, finishTurnIfIdle, settleNow, sessionId, mode, tutor]
  );

  const sendAudio = useCallback(
    (blob: Blob) => runTurn({ audio: blob }),
    [runTurn]
  );

  const sendText = useCallback(
    (text: string) => runTurn({ text }),
    [runTurn]
  );

  // Open the mic and start listening. Throws (after surfacing the error) if the
  // microphone is unavailable, so callers can decide whether to abort start.
  // Concurrent calls share one acquisition — see acquireRef.
  const startVad = useCallback(async () => {
    if (vadRef.current) return;
    if (acquireRef.current) return acquireRef.current;

    const acquire = async () => {
      const vad = new SimpleVAD({
        silenceThreshold: 1.5,
        silenceDuration: 1200,
        preRollMs: 400,
        // Hands-free sends an utterance after each pause; push-to-talk keeps
        // capturing through pauses until the user taps the mic off (toggleMic
        // flushes the take).
        endOnSilence: micModeRef.current === "hands-free",
        onSpeechStart: () => {
          stopPlayback();
        },
        onSpeechEnd: (audio: Blob) => {
          sendAudio(audio);
        },
      });
      try {
        await vad.start();
      } catch (e) {
        setError(
          e instanceof Error
            ? `Microphone unavailable — ${e.message}`
            : "Microphone unavailable — check your browser permissions."
        );
        throw e;
      }
      // Disarmed while the browser was still granting permission: release the
      // stream instead of parking a live mic nobody asked for. Callers set
      // `armed` before awaiting precisely so this check can see the change.
      if (!armedRef.current) {
        vad.stop();
        return;
      }
      vadRef.current = vad;
      setError(null);
      setStatus("listening");
    };

    const pending = acquire().finally(() => {
      acquireRef.current = null;
    });
    acquireRef.current = pending;
    return pending;
  }, [sendAudio, stopPlayback]);

  // Late-bind startVad so applySettle (defined above, before startVad exists) can
  // acquire a mic through startVadRef.
  useEffect(() => {
    startVadRef.current = startVad;
  });

  // Arm the mic. `armed` flips first: it's the single source of truth the button
  // reads, and startVad consults it to abandon an acquisition the user cancelled.
  // From a settled state that means acquiring a mic now; over a playing reply it
  // means flagging intent only — finishTurnIfIdle acquires once the turn settles,
  // so the mic never hears the reply. Resolves false if the mic was unavailable.
  const arm = useCallback(async () => {
    armedRef.current = true;
    setArmed(true);
    if (isReplying(statusRef.current)) return true;
    try {
      await startVad();
      return true;
    } catch {
      armedRef.current = false; // startVad surfaced the mic error
      setArmed(false);
      return false;
    }
  }, [startVad]);

  // Disarm the mic: stop the VAD so the OS mic is genuinely released (indicator
  // off). Re-arming builds a fresh VAD. Safe to call mid-turn — the reply keeps
  // streaming/playing and finishTurnIfIdle settles to "off" (armed is now false).
  // Also safe mid-acquisition: clearing `armed` makes startVad drop the stream.
  const disarm = useCallback(() => {
    vadRef.current?.stop();
    vadRef.current = null;
    armedRef.current = false;
    setArmed(false);
    // A live "listening" state has no turn to finish, so drop to "off" now;
    // mid-turn we leave the status alone and let finishTurnIfIdle land on "off".
    setStatus((s) => (s === "listening" ? "off" : s));
  }, []);

  // Cut a reply short: drop the queued audio and abort the in-flight request.
  // Barge-in covers this while the mic is armed; disarmed, this is the only way
  // to stop a long answer, so it's offered as its own control. We clear abortRef
  // and settle here, so runTurn's catch stands down (see `owns` there).
  const interrupt = useCallback(() => {
    stopPlayback();
    abortRef.current?.abort();
    abortRef.current = null;
    settleNow();
  }, [stopPlayback, settleNow]);

  const startConversation = useCallback(async () => {
    if (startedRef.current) return;
    setMessages([]);
    setError(null);

    if (inputModeRef.current === "text") {
      // Text mode needs no microphone — just greet the candidate.
      startedRef.current = true;
      runTurn({ kickoff: true });
      return;
    }

    // Hands-free opens the mic on start (continuous listening). Push-to-talk
    // starts the session disarmed — arming is a separate, deliberate tap.
    if (micModeRef.current === "hands-free") {
      // arm() surfaced the mic error; leave the session unstarted for retry.
      if (!(await arm())) return;
    }
    startedRef.current = true;
    // The interviewer opens: greet the candidate and present the problem. Under
    // push-to-talk the mic stays off; finishTurnIfIdle settles to "off" after.
    runTurn({ kickoff: true });
  }, [arm, runTurn]);

  // Tap on the round mic button: start the session when idle, otherwise flip the
  // armed state. Never a no-op — arm() handles the mid-reply case by deferring
  // acquisition, so the button always means what its icon says.
  const toggleMic = useCallback(() => {
    if (!startedRef.current) {
      startConversation();
    } else if (armedRef.current) {
      // Push-to-talk: tapping off IS the send gesture — flush the captured
      // take into a turn before the mic is released. (Hands-free tap-off just
      // drops any half-utterance, as ever.)
      if (micModeRef.current === "push-to-talk") vadRef.current?.flush();
      disarm();
      // Disarming by hand *is* choosing push-to-talk; otherwise the segmented
      // control would keep claiming "Hands-free" over a released mic.
      if (micModeRef.current === "hands-free") {
        micModeRef.current = "push-to-talk";
        setMicMode("push-to-talk");
      }
    } else {
      arm();
    }
  }, [startConversation, arm, disarm]);

  // Switch push-to-talk ↔ hands-free, symmetrically: hands-free ensures the mic
  // is armed (open now, or reopened at turn end if a reply is in flight);
  // push-to-talk disarms it. Works before or during a session.
  const switchMicMode = useCallback(
    (next: MicMode) => {
      if (next === micModeRef.current) return;
      micModeRef.current = next;
      setMicMode(next);
      // A live capture follows the new mode at once: hands-free resumes
      // sending on silence, push-to-talk holds the take until tap-off.
      vadRef.current?.setEndOnSilence(next === "hands-free");
      if (!startedRef.current) return; // pre-start: just changes the default

      if (next === "hands-free") {
        if (!armedRef.current) arm(); // opens the mic now, or at the turn's end
      } else {
        disarm();
      }
    },
    [arm, disarm]
  );

  // Flip between voice and text without dropping the session. To text: silence
  // the mic (history stays server-side). To voice: reopen the mic if the session
  // has already begun. An unstarted switch to text auto-starts via the effect below.
  const switchMode = useCallback(
    (next: InputMode) => {
      if (next === inputModeRef.current) return;
      inputModeRef.current = next;
      setInputMode(next);

      if (next === "text") {
        vadRef.current?.stop();
        vadRef.current = null;
        armedRef.current = false;
        setArmed(false);
        stopPlayback();
        // A live mic turn (listening/speaking) becomes composer-ready; a turn
        // still processing keeps going and lands on "ready" via finishTurnIfIdle.
        setStatus((s) => (s === "processing" || s === "idle" ? s : "ready"));
      } else if (startedRef.current) {
        // Back to voice mid-session: hands-free reopens the mic; push-to-talk
        // stays disarmed ("off") until the user taps to arm.
        if (micModeRef.current === "hands-free") {
          arm();
        } else {
          setStatus("off");
        }
      }
    },
    [stopPlayback, arm]
  );

  // Entering text mode before the session has begun starts it (the assistant
  // greets); voice mode still waits for a deliberate mic tap.
  useEffect(() => {
    if (inputMode === "text" && !startedRef.current) {
      startConversation();
    }
  }, [inputMode, startConversation]);

  useEffect(() => {
    return () => {
      vadRef.current?.stop();
      stopPlayback();
      // Abort any in-flight turn so the stream loop exits — otherwise navigating
      // away mid-response leaves the fetch running and audio playing detached.
      abortRef.current?.abort();
    };
  }, [stopPlayback]);

  const v = inputMode === "text" ? TEXT_HEADER[status] : VOICE[status];
  const speaker = SPEAKER[mode ?? "coding"];
  // The round button reads `armed` — the single source of truth — and nothing
  // else, so its icon and label stay honest mid-reply, when the status is
  // "processing"/"speaking" but the mic is genuinely released.
  const micOff = !armed;

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

      {/* Input bar — mode toggles plus the mic (voice) or composer (text) */}
      <div className="flex-none flex flex-col gap-3 border-t border-hair bg-frame px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <ModeToggle mode={inputMode} onChange={switchMode} />
          {inputMode === "voice" && (
            <MicModeToggle mode={micMode} onChange={switchMicMode} />
          )}
        </div>

        {inputMode === "voice" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMic}
              aria-label={
                status === "idle"
                  ? "Start conversation"
                  : micOff
                    ? "Turn microphone on"
                    : "Turn microphone off"
              }
              aria-pressed={armed}
              className={`grid h-11 w-11 flex-none place-items-center rounded-full transition-[transform,background-color] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 focus-visible:ring-offset-2 focus-visible:ring-offset-frame ${
                micOff
                  ? "border border-edge bg-chip text-muted"
                  : "bg-cognac text-[#fbf3e7]"
              }`}
              style={micOff ? undefined : { boxShadow: "0 3px 10px rgba(168,85,29,.35)" }}
            >
              {micOff ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            {isReplying(status) && (
              <button
                onClick={interrupt}
                aria-label="Stop the reply"
                className="grid h-11 w-11 flex-none place-items-center rounded-full border border-edge bg-chip text-ink-soft transition-[transform,color] hover:scale-105 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 focus-visible:ring-offset-2 focus-visible:ring-offset-frame"
              >
                <Stop size={14} />
              </button>
            )}
            <div className="flex items-center gap-2.5 min-w-0">
              {status === "listening" && !error && (
                <Equalizer color="#cdbfa3" bars={4} height={18} stagger={0.2} />
              )}
              <span
                className={`truncate font-sans text-[13px] ${
                  error ? "text-[#9c3b28]" : "text-[#8a7259]"
                }`}
              >
                {error ??
                  (status === "listening" && micMode === "push-to-talk"
                    ? "Listening — tap the mic off to send"
                    : MIC_HINT[status])}
              </span>
            </div>
          </div>
        ) : (
          <TextComposer
            disabled={status === "processing"}
            onSend={sendText}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

/** Two-option segmented control switching the input between mic and keyboard. */
function ModeToggle({
  mode,
  onChange,
}: {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
}) {
  return (
    <div className="flex-none inline-flex self-start rounded-full border border-edge bg-chip p-0.5">
      {(["voice", "text"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={`rounded-full px-3.5 py-1 font-sans text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 ${
            mode === m
              ? "bg-cognac/[0.10] text-cognac-text"
              : "text-muted hover:text-ink-soft"
          }`}
        >
          {m === "voice" ? "Voice" : "Text"}
        </button>
      ))}
    </div>
  );
}

/** Two-option segmented control choosing how the mic engages: push-to-talk (tap
 * to talk, tap off to send) vs. hands-free (continuous listening, sends on
 * pauses). Mirrors ModeToggle's treatment. */
function MicModeToggle({
  mode,
  onChange,
}: {
  mode: MicMode;
  onChange: (mode: MicMode) => void;
}) {
  const LABEL: Record<MicMode, string> = {
    "push-to-talk": "Push to talk",
    "hands-free": "Hands-free",
  };
  return (
    <div className="flex-none inline-flex rounded-full border border-edge bg-chip p-0.5">
      {(["push-to-talk", "hands-free"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={`rounded-full px-3.5 py-1 font-sans text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 ${
            mode === m
              ? "bg-cognac/[0.10] text-cognac-text"
              : "text-muted hover:text-ink-soft"
          }`}
        >
          {LABEL[m]}
        </button>
      ))}
    </div>
  );
}

/** Text-mode composer: type a reply, Enter to send, Shift+Enter for a newline. */
function TextComposer({
  disabled,
  onSend,
  error,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
  error: string | null;
}) {
  const [value, setValue] = useState("");
  const canSend = !disabled && value.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-2.5">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={disabled ? "Thinking…" : "Type your reply"}
          aria-label="Type your reply"
          className="min-h-[44px] max-h-32 flex-1 resize-none rounded-[14px] border border-edge bg-chip px-3.5 py-2.5 font-serif text-[15px] leading-[1.45] text-ink-soft placeholder:text-faint focus-visible:outline-none focus-visible:border-cognac/50 focus-visible:ring-2 focus-visible:ring-cognac/20"
        />
        <button
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          className="grid h-11 w-11 flex-none place-items-center rounded-full bg-cognac text-[#fbf3e7] transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cognac/40 focus-visible:ring-offset-2 focus-visible:ring-offset-frame"
          style={{ boxShadow: "0 3px 10px rgba(168,85,29,.35)" }}
        >
          <Send size={16} />
        </button>
      </div>
      {error && (
        <span className="truncate font-sans text-[13px] text-[#9c3b28]">{error}</span>
      )}
    </div>
  );
}

const MIC_HINT: Record<Status, string> = {
  idle: "Tap the mic to begin",
  listening: "Listening — speak any time",
  processing: "Thinking… tap stop to cut it short",
  speaking: "Speaking… tap stop to cut it short",
  // Text-mode ready state; the mic bar isn't rendered then, but the map is total.
  ready: "Type your reply",
  off: "Mic off — tap to talk",
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
