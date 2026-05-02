import test from "node:test";
import assert from "node:assert/strict";

import { parseIcc, writeProfileBytes } from "../icc-core.js";

function writeAscii(bytes, offset, text) {
  for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i);
}

function writeU16(bytes, offset, value) {
  bytes[offset] = (value >>> 8) & 0xff;
  bytes[offset + 1] = value & 0xff;
}

function writeU32(bytes, offset, value) {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

function makeTextTag(text) {
  const encoded = Buffer.from(text, "ascii");
  const bytes = new Uint8Array(8 + encoded.length);
  writeAscii(bytes, 0, "text");
  bytes.set(encoded, 8);
  return bytes;
}

function makeVcgtTag(values) {
  const channels = 1;
  const entries = values.length;
  const bytes = new Uint8Array(18 + channels * entries * 2);
  writeAscii(bytes, 0, "vcgt");
  writeU32(bytes, 8, 0);
  writeU16(bytes, 12, channels);
  writeU16(bytes, 14, entries);
  writeU16(bytes, 16, 2);
  values.forEach((value, index) => writeU16(bytes, 18 + index * 2, value));
  return bytes;
}

function makeIcc({ includeTextTags = true } = {}) {
  const tags = [{ sig: "vcgt", data: makeVcgtTag([0, 16384, 49152, 65535]) }];
  if (includeTextTags) {
    tags.push({ sig: "desc", data: makeTextTag("Sample ICC Metadata Block") });
    tags.push({ sig: "cprt", data: makeTextTag("Original Signature Metadata") });
  }

  const tagTableBytes = tags.length * 12;
  const totalSize = 132 + tagTableBytes + tags.reduce((sum, tag) => sum + tag.data.length, 0);
  const bytes = new Uint8Array(totalSize);
  writeU32(bytes, 0, totalSize);
  writeAscii(bytes, 36, "mntr");
  writeU32(bytes, 128, tags.length);

  let dataOffset = 132 + tagTableBytes;
  tags.forEach((tag, index) => {
    const row = 132 + index * 12;
    writeAscii(bytes, row, tag.sig);
    writeU32(bytes, row + 4, dataOffset);
    writeU32(bytes, row + 8, tag.data.length);
    bytes.set(tag.data, dataOffset);
    dataOffset += tag.data.length;
  });

  return bytes;
}

test("parseIcc reads valid VCGT/text tags", () => {
  const profile = parseIcc(makeIcc().buffer, "fallback.icc");
  assert.equal(profile.name, "Sample ICC Metadata Block");
  assert.equal(profile.signature, "Original Signature Metadata");
  assert.equal(profile.channels, 1);
  assert.equal(profile.entries, 4);
});

test("parseIcc rejects oversized tag tables", () => {
  const bytes = makeIcc();
  writeU32(bytes, 128, 5000);
  assert.throws(() => parseIcc(bytes.buffer, "bad.icc"), /too large/i);
});

test("parseIcc rejects truncated tag tables", () => {
  const bytes = new Uint8Array(132);
  writeU32(bytes, 128, 1);
  assert.throws(() => parseIcc(bytes.buffer, "bad.icc"), /truncated/i);
});

test("writeProfileBytes updates VCGT and metadata", () => {
  const profile = parseIcc(makeIcc().buffer, "sample.icc");
  profile.tables[0][1] = 0.25;
  const { bytes, warnings } = writeProfileBytes(profile, { profileName: "Edited ICC" });
  assert.deepEqual(warnings, []);

  const reparsed = parseIcc(bytes.buffer, "roundtrip.icc");
  assert.equal(reparsed.name, "Edited ICC");
  assert.equal(reparsed.signature, "Untitled0828");
  assert.ok(Math.abs(reparsed.tables[0][1] - 0.25) < 1e-4);
});

test("writeProfileBytes reports missing metadata tags", () => {
  const profile = parseIcc(makeIcc({ includeTextTags: false }).buffer, "sample.icc");
  const { warnings } = writeProfileBytes(profile, { profileName: "Edited ICC" });
  assert.deepEqual(warnings, ["profileName", "signature"]);
});
