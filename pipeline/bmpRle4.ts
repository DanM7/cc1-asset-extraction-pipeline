/**
 * Decode Windows BI_RLE4 (compression type 2) bitmap data into a palette index buffer.
 * @see https://learn.microsoft.com/en-us/windows/win32/gdi/bitmap-compression
 */
export function decodeBmpRle4(
  data: Buffer,
  width: number,
  height: number,
): Uint8Array {
  const pixels = new Uint8Array(width * height);
  let x = 0;
  let y = 0;
  let i = 0;

  while (i < data.length && y < height) {
    const b0 = data[i]!;

    if (b0 !== 0) {
      i++;
      const b1 = data[i++]!;
      for (let c = 0; c < b0; c++) {
        if (x < width && y < height) {
          pixels[y * width + x] = (c & 1) === 0 ? b1 >> 4 : b1 & 0x0f;
        }
        x++;
      }
      continue;
    }

    i++;
    const b1 = data[i++]!;
    if (b1 === 0) {
      x = 0;
      y++;
      continue;
    }
    if (b1 === 1) {
      break;
    }
    if (b1 === 2) {
      x += data[i++]!;
      y += data[i++]!;
      continue;
    }

    const pixelCount = b1;
    const byteCount = Math.ceil((pixelCount + 1) / 2);
    for (let c = 0; c < pixelCount; c++) {
      const byteIndex = Math.floor(c / 2);
      const byte = data[i + byteIndex]!;
      const idx = (c & 1) === 0 ? byte >> 4 : byte & 0x0f;
      if (x < width && y < height) {
        pixels[y * width + x] = idx;
      }
      x++;
    }
    i += byteCount;
    if (byteCount % 2 === 1) {
      i += 1;
    }
  }

  return pixels;
}

export interface DibInfo {
  width: number;
  height: number;
  bpp: number;
  compression: number;
  palette: [number, number, number][];
  pixels: Uint8Array;
}

/** Read embedded DIB from a buffer (e.g. CHIPS.EXE) at offset. */
export function readDibAt(buffer: Buffer, offset: number, bitsEnd?: number): DibInfo {
  const headerSize = buffer.readUInt32LE(offset);
  if (headerSize < 40) {
    throw new Error(`Unsupported DIB header size ${headerSize}`);
  }

  const width = buffer.readInt32LE(offset + 4);
  const heightSigned = buffer.readInt32LE(offset + 8);
  const height = Math.abs(heightSigned);
  const bpp = buffer.readUInt16LE(offset + 14);
  const compression = buffer.readUInt32LE(offset + 16);
  const clrUsed = buffer.readUInt32LE(offset + 32) || (bpp <= 8 ? 1 << bpp : 0);

  const paletteOffset = offset + headerSize;
  const palette: [number, number, number][] = [];
  for (let c = 0; c < clrUsed; c++) {
    const b = buffer[paletteOffset + c * 4]!;
    const g = buffer[paletteOffset + c * 4 + 1]!;
    const r = buffer[paletteOffset + c * 4 + 2]!;
    palette.push([r, g, b]);
  }

  const bitsOffset = paletteOffset + clrUsed * 4;
  const bits =
    bitsEnd !== undefined
      ? buffer.subarray(bitsOffset, bitsEnd)
      : buffer.subarray(bitsOffset);

  let indices: Uint8Array;
  if (compression === 0 && bpp === 4) {
    const rowBytes = Math.ceil(width / 2);
    const paddedRow = Math.ceil(rowBytes / 4) * 4;
    const bottomUp = heightSigned > 0;
    indices = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      const srcRow = bottomUp ? height - 1 - y : y;
      const rowStart = srcRow * paddedRow;
      for (let x = 0; x < width; x++) {
        const byte = bits[rowStart + Math.floor(x / 2)]!;
        indices[y * width + x] = x % 2 === 0 ? byte >> 4 : byte & 0x0f;
      }
    }
  } else if (compression === 2 && bpp === 4) {
    indices = decodeBmpRle4(bits, width, height);
    if (heightSigned > 0) {
      const flipped = new Uint8Array(indices.length);
      for (let y = 0; y < height; y++) {
        flipped.set(indices.subarray((height - 1 - y) * width, (height - y) * width), y * width);
      }
      indices = flipped;
    }
  } else {
    throw new Error(`Unsupported DIB: ${bpp}bpp compression=${compression}`);
  }

  return { width, height, bpp, compression, palette, pixels: indices };
}
