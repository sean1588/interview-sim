import { describe, it, expect } from "vitest";
import { wavHeader, floatToPcm16, pcmToWav } from "@/lib/wav";
import { wavToPcm16 } from "@/lib/audio";

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

describe("pcmToWav <-> wavToPcm16 round-trip", () => {
  it("recovers the original samples and sample rate", () => {
    const original = Int16Array.from([0, 1, -1, 1000, -1000, 32767, -32768]);
    const pcmBytes = new Uint8Array(original.buffer);
    const wav = pcmToWav(pcmBytes, 24000);

    const { samples, sampleRate } = wavToPcm16(wav);
    expect(sampleRate).toBe(24000);
    expect(Array.from(samples)).toEqual(Array.from(original));
  });
});
