import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  WINDOWS_GAMMA_MAX_DEVIATION,
  parseIcc,
  writeProfileBytes
} from "../icc-core.js";

test("exported VCGT stays inside the Windows gamma ramp limit", async () => {
  const source = await readFile(new URL("../profiles/Untitled.icc", import.meta.url));
  const profile = parseIcc(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength), "Untitled.icc");
  profile.tables[2][88] = 65412 / 65535;

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
