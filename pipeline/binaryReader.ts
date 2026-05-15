export class BinaryReader {
  constructor(
    private readonly buffer: Buffer,
    private offset = 0,
  ) {}

  get position(): number {
    return this.offset;
  }

  get remaining(): number {
    return this.buffer.length - this.offset;
  }

  seek(position: number): void {
    if (position < 0 || position > this.buffer.length) {
      throw new Error(`Seek out of bounds: ${position}`);
    }
    this.offset = position;
  }

  readUInt16LE(): number {
    this.ensure(2);
    const value = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  readUInt32LE(): number {
    this.ensure(4);
    const value = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  readByte(): number {
    this.ensure(1);
    return this.buffer[this.offset++]!;
  }

  readBytes(length: number): Buffer {
    this.ensure(length);
    const slice = this.buffer.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  peekByte(): number {
    this.ensure(1);
    return this.buffer[this.offset]!;
  }

  private ensure(length: number): void {
    if (this.offset + length > this.buffer.length) {
      throw new Error(
        `Read past end of buffer at ${this.offset} (+${length}), length=${this.buffer.length}`,
      );
    }
  }
}
