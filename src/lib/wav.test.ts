import { describe, it, expect } from "vitest";
import { wavHeader, floatToPcm16, pcmToWav } from "@/lib/wav";

const str = (u8: Uint8Array, off: number, len: number) =>
  String.fromCharCode(...u8.subarray(off, off + len));

describe("wavHeader", () => {
  it("writes the canonical RIFF/WAVE/fmt/data markers", () => {
    const h = wavHeader(1000, 24000);
    expect(str(h, 0, 4)).toBe("RIFF");
    expect(str(h, 8, 4)).toBe("WAVE");
    expect(str(h, 12, 4)).toBe("fmt ");
    expect(str(h, 36, 4)).toBe("data");
  });

  it("encodes sample rate, byte rate and data length at the right offsets", () => {
    const dv = new DataView(wavHeader(1000, 24000).buffer);
    expect(dv.getUint32(24, true)).toBe(24000); // sampleRate
    expect(dv.getUint32(28, true)).toBe(48000); // byteRate = 24000 * 2
    expect(dv.getUint32(40, true)).toBe(1000); // dataLen
    expect(dv.getUint32(4, true)).toBe(36 + 1000); // RIFF chunk size
  });
});

describe("floatToPcm16", () => {
  it("clamps and maps the full-scale endpoints", () => {
    const bytes = floatToPcm16(new Float32Array([0, 1, -1, 2, -2]));
    const dv = new DataView(bytes.buffer);
    expect(dv.getInt16(0, true)).toBe(0);
    expect(dv.getInt16(2, true)).toBe(0x7fff); // +1.0
    expect(dv.getInt16(4, true)).toBe(-0x8000); // -1.0
    expect(dv.getInt16(6, true)).toBe(0x7fff); // clamps +2
    expect(dv.getInt16(8, true)).toBe(-0x8000); // clamps -2
  });
});

describe("pcmToWav", () => {
  it("prefixes a header sized to the payload and appends the PCM bytes intact", () => {
    const pcm = Uint8Array.from([1, 2, 3, 4, 5, 6]);
    const wav = pcmToWav(pcm, 16000);

    expect(wav.length).toBe(44 + pcm.length);
    const dv = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    expect(dv.getUint32(24, true)).toBe(16000); // sample rate in the header
    expect(dv.getUint32(40, true)).toBe(pcm.length); // data length
    expect(Array.from(wav.subarray(44))).toEqual(Array.from(pcm)); // payload intact
  });
});
