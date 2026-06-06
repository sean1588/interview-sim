export interface VADOptions {
  silenceThreshold?: number;
  silenceDuration?: number;
  preRollMs?: number;
  onSpeechStart?: () => void;
  onSpeechEnd?: (audio: Blob) => void;
}

export class SimpleVAD {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private isSpeaking = false;
  private silenceStart = 0;
  private animationFrame = 0;
  private silenceThreshold: number;
  private silenceDuration: number;
  private preRollChunks: number;
  private onSpeechStart: () => void;
  private onSpeechEnd: (audio: Blob) => void;
  private active = false;
  private frozen = false;
  private mimeType = "audio/webm";

  // Always-on recorder for pre-roll buffer
  private recorder: MediaRecorder | null = null;
  private ringBuffer: Blob[] = [];
  private speechChunks: Blob[] = [];

  constructor(options: VADOptions = {}) {
    this.silenceThreshold = options.silenceThreshold ?? 15;
    this.silenceDuration = options.silenceDuration ?? 1200;
    this.preRollChunks = Math.ceil((options.preRollMs ?? 400) / 100);
    this.onSpeechStart = options.onSpeechStart ?? (() => {});
    this.onSpeechEnd = options.onSpeechEnd ?? (() => {});
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    source.connect(this.analyser);
    this.mimeType = this.getSupportedMimeType();
    this.active = true;
    this.startContinuousRecording();
    this.monitor();
  }

  stop() {
    this.active = false;
    cancelAnimationFrame(this.animationFrame);
    if (this.recorder?.state === "recording") {
      try { this.recorder.stop(); } catch {}
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.audioContext?.state !== "closed") {
      this.audioContext?.close();
    }
  }

  freeze() {
    this.frozen = true;
    this.isSpeaking = false;
    this.silenceStart = 0;
    this.speechChunks = [];
    this.ringBuffer = [];
  }

  unfreeze() {
    this.frozen = false;
  }

  getVolume(): number {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const val = (data[i] - 128) / 128;
      sum += val * val;
    }
    return Math.sqrt(sum / data.length) * 100;
  }

  private startContinuousRecording() {
    if (!this.stream) return;

    const recorder = new MediaRecorder(this.stream, { mimeType: this.mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size === 0) return;

      if (this.isSpeaking) {
        this.speechChunks.push(e.data);
      } else {
        this.ringBuffer.push(e.data);
        if (this.ringBuffer.length > this.preRollChunks) {
          this.ringBuffer.shift();
        }
      }
    };
    recorder.start(100);
    this.recorder = recorder;
  }

  private monitor() {
    if (!this.active) return;

    if (this.frozen) {
      this.animationFrame = requestAnimationFrame(() => this.monitor());
      return;
    }

    const volume = this.getVolume();

    if (volume > this.silenceThreshold) {
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        // Grab pre-roll buffer as the start of speech
        this.speechChunks = [...this.ringBuffer];
        this.ringBuffer = [];
        this.onSpeechStart();
      }
      this.silenceStart = 0;
    } else if (this.isSpeaking) {
      if (this.silenceStart === 0) {
        this.silenceStart = Date.now();
      } else if (Date.now() - this.silenceStart > this.silenceDuration) {
        this.isSpeaking = false;
        this.silenceStart = 0;

        const blob = new Blob(this.speechChunks, { type: this.mimeType });
        this.speechChunks = [];
        if (blob.size > 0) {
          this.onSpeechEnd(blob);
        }
      }
    }

    this.animationFrame = requestAnimationFrame(() => this.monitor());
  }

  private getSupportedMimeType(): string {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "audio/webm";
  }
}
