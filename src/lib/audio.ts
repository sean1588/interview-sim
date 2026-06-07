/**
 * Audio helpers for bridging our TTS output (24kHz WAV) to Simli, which
 * expects raw PCM16 mono at 16kHz.
 */

export function base64ToUint8(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Parse a WAV blob (our encoder: PCM16 mono, 44-byte header) into samples. */
export function wavToPcm16(wav: Uint8Array): { samples: Int16Array; sampleRate: number } {
  const dataOffset = 44;
  // Nothing but (or less than) a header — no samples. Guard so we never try to
  // allocate a negative-length Int16Array.
  if (wav.byteLength <= dataOffset) {
    return { samples: new Int16Array(0), sampleRate: 24000 };
  }
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  const sampleRate = view.getUint32(24, true);
  const sampleCount = Math.floor((wav.byteLength - dataOffset) / 2);
  const samples = new Int16Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    samples[i] = view.getInt16(dataOffset + i * 2, true);
  }
  return { samples, sampleRate };
}

/** Linear-resample PCM16 samples from one rate to another. */
export function resamplePcm16(
  samples: Int16Array,
  inRate: number,
  outRate: number
): Int16Array {
  if (inRate === outRate) return samples;
  const ratio = outRate / inRate;
  const outLength = Math.floor(samples.length * ratio);
  const out = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcPos = i / ratio;
    const idx = Math.floor(srcPos);
    const frac = srcPos - idx;
    const a = samples[idx] ?? 0;
    const b = samples[idx + 1] ?? a;
    out[i] = (a + (b - a) * frac) | 0;
  }
  return out;
}

export function int16ToUint8(samples: Int16Array): Uint8Array {
  return new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
}

/** Full pipeline: base64 WAV (24kHz) -> Uint8Array PCM16 @ 16kHz for Simli. */
export function wavBase64ToSimliPcm(b64: string): Uint8Array {
  const wav = base64ToUint8(b64);
  const { samples, sampleRate } = wavToPcm16(wav);
  const resampled = resamplePcm16(samples, sampleRate, 16000);
  return int16ToUint8(resampled);
}
