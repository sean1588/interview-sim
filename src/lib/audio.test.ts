import { describe, it, expect } from "vitest";
import { resamplePcm16, wavToPcm16 } from "@/lib/audio";
import { pcmToWav } from "@/lib/wav";

describe("resamplePcm16", () => {
  it("returns the input unchanged when rates match", () => {
    const s = Int16Array.from([1, 2, 3, 4]);
    expect(resamplePcm16(s, 16000, 16000)).toBe(s);
  });

  it("downsamples 24k -> 16k to floor(n * 2/3) samples", () => {
    const s = new Int16Array(30).map((_, i) => i);
    const out = resamplePcm16(s, 24000, 16000);
    expect(out.length).toBe(Math.floor(30 * (16000 / 24000)));
  });

  it("interpolates between neighbouring samples", () => {
    // Upsample 1k -> 2k: a value halfway between 0 and 100 should be ~50.
    const out = resamplePcm16(Int16Array.from([0, 100]), 1000, 2000);
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(50);
  });

  it("does not read past the end (last sample falls back to itself, no NaN)", () => {
    const out = resamplePcm16(Int16Array.from([10, 20]), 1000, 3000);
    expect(out.length).toBe(6);
    for (const v of out) expect(Number.isNaN(v)).toBe(false);
    expect(out[out.length - 1]).toBe(20);
  });
});

describe("wavToPcm16 guard", () => {
  it("returns zero samples for a header-only (or shorter) blob instead of throwing", () => {
    expect(() => wavToPcm16(new Uint8Array(10))).not.toThrow();
    const { samples } = wavToPcm16(pcmToWav(new Uint8Array(0), 24000));
    expect(samples.length).toBe(0);
  });
});
