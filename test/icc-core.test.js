import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  WINDOWS_GAMMA_MAX_DEVIATION,
  clampWindowsGammaTable,
  parseIcc,
  rebaseProfileCurves,
  writeProfileBytes
} from "../icc-core.js";

test("exported VCGT stays inside the Windows gamma ramp limit", async () => {
  const source = await readFile(new URL("../profiles/Untitled.icc", import.meta.url));
  const profile = parseIcc(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength), "Untitled.icc");
  profile.tables[2][88] = 65412 / 65535;
  assert.equal(clampWindowsGammaTable(profile.tables[2]) > 0, true);
  assert.equal(Math.round(profile.tables[2][88] * 65535), 22616 + WINDOWS_GAMMA_MAX_DEVIATION);

  const { bytes } = writeProfileBytes(profile, { profileName: "Windows safe" });
  const exported = parseIcc(bytes.buffer, "Windows safe.icc");

  for (const table of exported.tables) {
    table.forEach((value, index) => {
      const identity = Math.round(index * 65535 / (exported.entries - 1));
      assert.ok(Math.abs(Math.round(value * 65535) - identity) <= WINDOWS_GAMMA_MAX_DEVIATION);
    });
  }

  assert.equal(Math.round(exported.tables[2][88] * 65535), 22616 + WINDOWS_GAMMA_MAX_DEVIATION);
});

test("imported profiles keep only curves and use the trusted template bytes", async () => {
  const source = await readFile(new URL("../profiles/Untitled.icc", import.meta.url));
  const buffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const imported = parseIcc(buffer, "external.icc");
  const template = parseIcc(buffer, "Untitled.icc");
  imported.tables[2][88] = 0.75;
  imported.sourceBytes[416] ^= 255;

  const sanitized = rebaseProfileCurves(imported, template);

  assert.deepEqual(sanitized.sourceBytes, template.sourceBytes);
  assert.notEqual(sanitized.sourceBytes, template.sourceBytes);
  assert.equal(sanitized.tables[2][88], imported.tables[2][88]);
  assert.equal(sanitized.name, imported.name);
});

test("ICC parsing rejects malformed headers and discards undeclared trailing data", async () => {
  const source = await readFile(new URL("../profiles/Untitled.icc", import.meta.url));
  const declaredSize = source.readUInt32BE(0);
  const withTail = Buffer.concat([source, Buffer.from("not part of the ICC")]);
  const parsed = parseIcc(withTail.buffer.slice(withTail.byteOffset, withTail.byteOffset + withTail.byteLength), "tailed.icc");
  assert.equal(parsed.sourceBytes.length, declaredSize);

  const badSignature = Buffer.from(source);
  badSignature.write("nope", 36, "ascii");
  assert.throws(
    () => parseIcc(badSignature.buffer.slice(badSignature.byteOffset, badSignature.byteOffset + badSignature.byteLength), "bad.icc"),
    /signature/
  );

  const overlappingTags = Buffer.from(source);
  overlappingTags.writeUInt32BE(overlappingTags.readUInt32BE(132 + 8) + 4, 132 + 8);
  assert.throws(
    () => parseIcc(overlappingTags.buffer.slice(overlappingTags.byteOffset, overlappingTags.byteOffset + overlappingTags.byteLength), "overlap.icc"),
    /Overlapping/
  );
});
