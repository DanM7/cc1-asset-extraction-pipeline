import { describe, expect, it } from "vitest";
import { parseOptionalFields } from "../pipeline/metadata.js";

describe("parseOptionalFields clone/trap links", () => {
  it("parses DAT field 5 clone connections", () => {
    const buf = Buffer.alloc(8);
    buf.writeUInt16LE(18, 0);
    buf.writeUInt16LE(15, 2);
    buf.writeUInt16LE(18, 4);
    buf.writeUInt16LE(18, 6);

    const field = Buffer.concat([Buffer.from([5, 8]), buf]);
    const upper = Array.from({ length: 32 * 32 }, () => "empty");
    const { cloneLinks } = parseOptionalFields(field, upper, 32);

    expect(cloneLinks).toEqual([{ button: { x: 18, y: 15 }, clone: { x: 18, y: 18 } }]);
  });
});
