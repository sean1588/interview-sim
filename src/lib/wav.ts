// Canonical WAV (PCM) helpers. The 44-byte header layout lives here in exactly
// one place, shared by the browser-side VAD encoder (Float32 mic samples) and
// the server-side TTS path (raw PCM16 from the TTS provider). Pure and
// isomorphic — only DataView/Uint8Array, no Buffer/Blob/DOM.

/** Build a 44-byte PCM WAV header describing `dataByteLength` bytes of samples. */
export function wavHeader(
  dataByteLength: number,
  sampleRate: number,
  channels = 1,
  bitsPerSample = 16
): Uint8Array<ArrayBuffer> {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataByteLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataByteLength, true);

  return header;
}

/** Clamp float samples in [-1, 1] and pack them as little-endian PCM16 bytes. */
export function floatToPcm16(samples: Float32Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(samples.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return out;
}

/** Wrap raw PCM16 bytes in a WAV container. */
export function pcmToWav(
  pcm: Uint8Array,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): Uint8Array<ArrayBuffer> {
  const header = wavHeader(pcm.length, sampleRate, channels, bitsPerSample);
  const out = new Uint8Array(header.length + pcm.length);
  out.set(header, 0);
  out.set(pcm, header.length);
  return out;
}
