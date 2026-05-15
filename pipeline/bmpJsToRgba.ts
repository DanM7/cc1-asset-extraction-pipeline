/** bmp-js stores pixels as [0, B, G, R]; convert to [R, G, B, A] for PNG/WebGL. */
export function bmpJsDataToRgba(bmpData: Buffer): Buffer {
  const out = Buffer.from(bmpData);
  for (let i = 0; i < out.length; i += 4) {
    const b = out[i + 1]!;
    const g = out[i + 2]!;
    const r = out[i + 3]!;
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = 255;
  }
  return out;
}
