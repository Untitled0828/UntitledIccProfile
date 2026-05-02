const SIGNATURE_CODE_POINTS = [85, 110, 116, 105, 116, 108, 101, 100, 48, 56, 50, 56];
export const APP_SIGNATURE = String.fromCharCode(...SIGNATURE_CODE_POINTS);
export const SIGNATURE_TEXT = APP_SIGNATURE;
export const DEFAULT_PROFILE = "Untitled.icc";
export const STANDARD_CURVE_INPUTS = [0, 0.02, 0.05, 0.10, 0.20, 0.35, 0.50, 0.65, 0.80, 0.90, 0.95, 1.0];
export const CURVE_DETAIL_COUNTS = {
  standard: STANDARD_CURVE_INPUTS.length,
  fine: 25,
  ultra: 49
};

const MAX_ICC_TAG_COUNT = 4096;

function readAscii(bytes, offset, length) {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function u16(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function u32(bytes, offset) {
  return ((bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0;
}

function writeU32(bytes, offset, value) {
  bytes[offset] = (value >>> 24) & 255;
  bytes[offset + 1] = (value >>> 16) & 255;
  bytes[offset + 2] = (value >>> 8) & 255;
  bytes[offset + 3] = value & 255;
}

function decodeAsciiText(bytes) {
  return new TextDecoder("ascii").decode(bytes).replace(/\0+$/g, "").trim();
}

function parseMluc(bytes, offset, size) {
  const count = u32(bytes, offset + 8);
  if (!count) return "";
  const record = offset + 16;
  const len = u32(bytes, record + 4);
  const textOffset = u32(bytes, record + 8);
  const start = offset + textOffset;
  if (start + len > offset + size) return "";
  try {
    return new TextDecoder("utf-16be").decode(bytes.slice(start, start + len)).replace(/\0+$/g, "");
  } catch {
    const raw = bytes.slice(start, start + len).filter(Boolean);
    return new TextDecoder().decode(raw);
  }
}

function parseDesc(bytes, offset, size) {
  if (size < 12) return "";
  const len = u32(bytes, offset + 8);
  if (!len || 12 + len > size) return "";
  return decodeAsciiText(bytes.slice(offset + 12, offset + 12 + len));
}

function parseText(bytes, offset, size) {
  if (size <= 8) return "";
  return decodeAsciiText(bytes.slice(offset + 8, offset + size));
}

function parseIccText(bytes, offset, size) {
  const type = readAscii(bytes, offset, 4);
  if (type === "mluc") return parseMluc(bytes, offset, size);
  if (type === "desc") return parseDesc(bytes, offset, size);
  if (type === "text") return parseText(bytes, offset, size);
  return "";
}

function parseVcgt(bytes, offset, size) {
  if (readAscii(bytes, offset, 4) !== "vcgt") throw new Error("Invalid VCGT tag.");
  const gammaType = u32(bytes, offset + 8);
  if (gammaType !== 0) throw new Error("Only table VCGT profiles are supported.");
  const channels = u16(bytes, offset + 12);
  const entries = u16(bytes, offset + 14);
  const entrySize = u16(bytes, offset + 16);
  if (channels < 1 || channels > 16 || entries < 2 || entries > 65535 || entrySize !== 2) {
    throw new Error("Unsupported VCGT format.");
  }

  const tableOffset = offset + 18;
  const needed = channels * entries * entrySize;
  if (tableOffset + needed > offset + size) throw new Error("Broken VCGT table.");

  const tables = [];
  for (let channel = 0; channel < channels; channel++) {
    const table = new Float32Array(entries);
    for (let i = 0; i < entries; i++) {
      const pos = tableOffset + (channel * entries + i) * 2;
      table[i] = u16(bytes, pos) / 65535;
    }
    tables.push(table);
  }

  return {
    type: "vcgt table",
    channels,
    entries,
    entrySize,
    vcgtOffset: offset,
    vcgtSize: size,
    tables,
    originalTables: tables.map((table) => new Float32Array(table))
  };
}

export function parseIcc(buffer, fallbackName) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 132) throw new Error("ICC file is too small.");

  const tagCount = u32(bytes, 128);
  if (tagCount > MAX_ICC_TAG_COUNT) throw new Error("ICC tag table is too large.");
  if (132 + tagCount * 12 > bytes.length) throw new Error("ICC tag table is truncated.");

  let vcgt = null;
  let description = "";
  let descTag = null;
  let signature = "";
  let cprtTag = null;

  for (let i = 0; i < tagCount; i++) {
    const row = 132 + i * 12;
    const sig = readAscii(bytes, row, 4);
    const offset = u32(bytes, row + 4);
    const size = u32(bytes, row + 8);
    if (!size || offset + size > bytes.length) continue;
    if (sig === "desc") {
      descTag = { offset, size };
      description = parseIccText(bytes, offset, size) || description;
    }
    if (sig === "cprt") {
      cprtTag = { offset, size };
      signature = parseIccText(bytes, offset, size) || signature;
    }
    if (sig === "vcgt") vcgt = parseVcgt(bytes, offset, size);
  }

  if (!vcgt) throw new Error("This ICC has no VCGT table.");
  return {
    name: description || fallbackName,
    fileName: fallbackName,
    sourceBytes: bytes,
    descTag,
    cprtTag,
    signature,
    ...vcgt
  };
}

export function sampleProfile(profile, channel, input01) {
  const table = profile.tables[Math.min(channel, profile.tables.length - 1)];
  const pos = input01 * (profile.entries - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(profile.entries - 1, lo + 1);
  const t = pos - lo;
  return table[lo] + (table[hi] - table[lo]) * t;
}

function sampleTable(profile, channel, value) {
  if (!profile) return value;
  return Math.round(sampleProfile(profile, channel, value / 255) * 255);
}

function buildProfileLuts(profile) {
  profile.luts = [0, 1, 2].map((channel) => {
    const lut = new Uint8ClampedArray(256);
    for (let value = 0; value < 256; value++) {
      lut[value] = sampleTable(profile, channel, value);
    }
    return lut;
  });
}

export function applyProfile(imageData, profile) {
  if (!profile.luts) buildProfileLuts(profile);
  const [red, green, blue] = profile.luts;
  const output = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  const data = output.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = red[data[i]];
    data[i + 1] = green[data[i + 1]];
    data[i + 2] = blue[data[i + 2]];
  }
  return output;
}

function smoothStep(t) {
  return t * t * (3 - 2 * t);
}

export function sampleEditCurve(points, x) {
  if (!points.length) return x;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (x <= b.x) {
      const t = smoothStep((x - a.x) / (b.x - a.x));
      return a.y + (b.y - a.y) * t;
    }
  }
  return 1;
}

export function cloneCurvePoints(points) {
  return points.map((point) => ({ x: point.x, y: point.y }));
}

export function makeCurveInputs(detail) {
  if (detail === "standard") return [...STANDARD_CURVE_INPUTS];
  const count = CURVE_DETAIL_COUNTS[detail] || CURVE_DETAIL_COUNTS.standard;
  return Array.from({ length: count }, (_, index) => index / (count - 1));
}

export function resampleCurvePoints(points, inputs) {
  return inputs.map((x, index) => ({
    x,
    y: index === 0 ? 0 : index === inputs.length - 1 ? 1 : sampleEditCurve(points, x)
  }));
}

function encodeUtf16be(text) {
  const encoded = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    encoded[i * 2] = (code >>> 8) & 255;
    encoded[i * 2 + 1] = code & 255;
  }
  return encoded;
}

export function trimProfileName(name) {
  return String(name || "ICC Live Custom").trim().slice(0, 24) || "ICC Live Custom";
}

export function safeFileBase(name) {
  return String(name || "").replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, "_");
}

function encodeAscii(text) {
  return new TextEncoder().encode(String(text).replace(/[^\x20-\x7e]/g, "_"));
}

function writeMlucText(bytes, tag, text) {
  const record = tag.offset + 16;
  const currentOffset = u32(bytes, record + 8);
  const textStart = tag.offset + currentOffset;
  const maxLength = tag.offset + tag.size - textStart;
  const encoded = encodeUtf16be(text);
  if (encoded.length > maxLength) return false;
  writeU32(bytes, record + 4, encoded.length);
  bytes.fill(0, textStart, textStart + maxLength);
  bytes.set(encoded, textStart);
  return true;
}

function writeDescText(bytes, tag, text) {
  const maxLength = tag.size - 12;
  const encoded = encodeAscii(text);
  const lengthWithNull = encoded.length + 1;
  if (lengthWithNull > maxLength) return false;
  writeU32(bytes, tag.offset + 8, lengthWithNull);
  bytes.fill(0, tag.offset + 12, tag.offset + tag.size);
  bytes.set(encoded, tag.offset + 12);
  return true;
}

function writeTextText(bytes, tag, text) {
  const maxLength = tag.size - 8;
  const encoded = encodeAscii(text);
  if (encoded.length > maxLength) return false;
  bytes.fill(0, tag.offset + 8, tag.offset + tag.size);
  bytes.set(encoded, tag.offset + 8);
  return true;
}

function writeIccText(bytes, tag, text) {
  if (!tag) return false;
  const type = readAscii(bytes, tag.offset, 4);
  if (type === "mluc") return writeMlucText(bytes, tag, text);
  if (type === "desc") return writeDescText(bytes, tag, text);
  if (type === "text") return writeTextText(bytes, tag, text);
  return false;
}

export function writeProfileBytes(profile, { profileName, signatureText = SIGNATURE_TEXT } = {}) {
  const bytes = new Uint8Array(profile.sourceBytes);
  const tableOffset = profile.vcgtOffset + 18;
  for (let channel = 0; channel < profile.channels; channel++) {
    const table = profile.tables[channel];
    for (let i = 0; i < profile.entries; i++) {
      const v = Math.max(0, Math.min(65535, Math.round(table[i] * 65535)));
      const pos = tableOffset + (channel * profile.entries + i) * 2;
      bytes[pos] = (v >>> 8) & 255;
      bytes[pos + 1] = v & 255;
    }
  }

  const warnings = [];
  if (!writeIccText(bytes, profile.descTag, trimProfileName(profileName))) warnings.push("profileName");
  if (!writeIccText(bytes, profile.cprtTag, signatureText)) warnings.push("signature");
  return { bytes, warnings };
}
