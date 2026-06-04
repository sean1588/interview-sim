export interface VADOptions {
  silenceThreshold?: number;
  silenceDuration?: number;
  onSpeechStart?: () => void;
  onSpeechEnd?: (audio: Blob) => void;
}

export class SimpleVAD {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private isSpeaking = false;
  private silenceStart = 0;
  private animationFrame = 0;
  private silenceThreshold: number;
  private silenceDuration: number;
  private onSpeechStart: () => void;
  private onSpeechEnd: (audio: Blob) => void;
  private active = false;

  constructor(options: VADOptions = {}) {
    this.silenceThreshold = options.silenceThreshold ?? 15;
    this.silenceDuration = options.silenceDuration ?? 1200;
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

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: this.getSupportedMimeType(),
    });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.active = true;
    this.monitor();
  }

  stop() {
    this.active = false;
    cancelAnimationFrame(this.animationFrame);
    this.mediaRecorder?.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
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

  private monitor() {
    if (!this.active) return;

    const volume = this.getVolume();

    if (volume > this.silenceThreshold) {
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.chunks = [];
        this.mediaRecorder?.start(100);
        this.onSpeechStart();
      }
      this.silenceStart = 0;
    } else if (this.isSpeaking) {
      if (this.silenceStart === 0) {
        this.silenceStart = Date.now();
      } else if (Date.now() - this.silenceStart > this.silenceDuration) {
        this.isSpeaking = false;
        this.mediaRecorder?.stop();
        this.silenceStart = 0;

        setTimeout(() => {
          const blob = new Blob(this.chunks, {
            type: this.getSupportedMimeType(),
          });
          this.chunks = [];
          if (blob.size > 0) {
            this.onSpeechEnd(blob);
          }
          if (this.active && this.mediaRecorder?.state === "inactive") {
            // ready for next utterance
          }
        }, 50);
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
