import { wavHeader, floatToPcm16 } from "@/lib/wav";

export interface VADOptions {
  silenceThreshold?: number;
  silenceDuration?: number;
  preRollMs?: number;
  onSpeechStart?: () => void;
  onSpeechEnd?: (audio: Blob) => void;
}

/**
 * Voice Activity Detection that captures raw PCM via Web Audio.
 *
 * Unlike MediaRecorder, this gives us a clean ring buffer of audio samples
 * so we can include a pre-roll (audio from just before speech was detected)
 * without worrying about container headers. We encode the final utterance
 * to a WAV blob ourselves.
 */
export class SimpleVAD {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  private silenceThreshold: number;
  private silenceDuration: number;
  private preRollMs: number;
  private preRollSamples = 0;
  private onSpeechStart: () => void;
  private onSpeechEnd: (audio: Blob) => void;

  private active = false;
  private frozen = false;
  private isSpeaking = false;
  private silenceStart = 0;
  private sampleRate = 48000;

  private preRoll: Float32Array[] = [];
  private preRollLength = 0;
  private speechSamples: Float32Array[] = [];

  constructor(options: VADOptions = {}) {
    // Threshold is on RMS * 100 scale
    this.silenceThreshold = options.silenceThreshold ?? 1.5;
    this.silenceDuration = options.silenceDuration ?? 1200;
    this.onSpeechStart = options.onSpeechStart ?? (() => {});
    this.onSpeechEnd = options.onSpeechEnd ?? (() => {});
    // preRollSamples is computed in start(), once we know the sample rate.
    this.preRollMs = options.preRollMs ?? 400;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    this.sampleRate = this.audioContext.sampleRate;
    this.preRollSamples = Math.floor((this.preRollMs / 1000) * this.sampleRate);

    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => this.process(e);

    // Connect through a muted gain node so the processor runs but mic audio
    // is NOT routed to the speakers (which would cause feedback).
    const mute = this.audioContext.createGain();
    mute.gain.value = 0;
    this.sourceNode.connect(this.processor);
    this.processor.connect(mute);
    mute.connect(this.audioContext.destination);

    this.active = true;
  }

  stop() {
    this.active = false;
    this.processor?.disconnect();
    this.sourceNode?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.audioContext && this.audioContext.state !== "closed") {
      // close() is async and can reject if already closing — swallow it.
      this.audioContext.close().catch(() => {});
    }
  }

  freeze() {
    this.frozen = true;
    this.isSpeaking = false;
    this.silenceStart = 0;
    this.speechSamples = [];
    this.preRoll = [];
    this.preRollLength = 0;
  }

  unfreeze() {
    this.frozen = false;
  }

  private process(e: AudioProcessingEvent) {
    if (!this.active || this.frozen) return;

    const input = e.inputBuffer.getChannelData(0);
    // Copy — the underlying buffer is reused by the browser
    const samples = new Float32Array(input);

    // RMS volume
    let sum = 0;
    for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
    const volume = Math.sqrt(sum / samples.length) * 100;

    if (volume > this.silenceThreshold) {
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        // Seed the utterance with the pre-roll buffer
        this.speechSamples = [...this.preRoll];
        this.preRoll = [];
        this.preRollLength = 0;
        this.onSpeechStart();
      }
      this.speechSamples.push(samples);
      this.silenceStart = 0;
    } else if (this.isSpeaking) {
      this.speechSamples.push(samples);
      if (this.silenceStart === 0) {
        this.silenceStart = Date.now();
      } else if (Date.now() - this.silenceStart > this.silenceDuration) {
        this.isSpeaking = false;
        this.silenceStart = 0;
        this.emitUtterance();
      }
    } else {
      // Not speaking — keep a rolling pre-roll buffer
      this.preRoll.push(samples);
      this.preRollLength += samples.length;
      while (this.preRollLength > this.preRollSamples && this.preRoll.length > 1) {
        const removed = this.preRoll.shift()!;
        this.preRollLength -= removed.length;
      }
    }
  }

  private emitUtterance() {
    const total = this.speechSamples.reduce((n, c) => n + c.length, 0);
    const merged = new Float32Array(total);
    let offset = 0;
    for (const chunk of this.speechSamples) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    this.speechSamples = [];

    const wav = this.encodeWav(merged, this.sampleRate);
    if (wav.size > 0) {
      this.onSpeechEnd(wav);
    }
  }

  private encodeWav(samples: Float32Array, sampleRate: number): Blob {
    const pcm = floatToPcm16(samples);
    const header = wavHeader(pcm.length, sampleRate);
    return new Blob([header, pcm], { type: "audio/wav" });
  }
}
