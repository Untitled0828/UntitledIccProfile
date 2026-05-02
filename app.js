const builtInProfiles = [
  "Untitled.icc"
];

const APP_SIGNATURE = "Untitled0828";
const SIGNATURE_TEXT = APP_SIGNATURE;
const DEFAULT_PROFILE = "Untitled.icc";
const STANDARD_CURVE_INPUTS = [0, 0.02, 0.05, 0.10, 0.20, 0.35, 0.50, 0.65, 0.80, 0.90, 0.95, 1.0];
const CURVE_DETAIL_COUNTS = {
  standard: STANDARD_CURVE_INPUTS.length,
  fine: 25,
  ultra: 49
};
const CURVE_CANVAS_PAD = 18;
const LANGUAGE_STORAGE_KEY = "icc-live-editor-language";

const translations = {
  en: {
    tagline: "Preview and tune VCGT curves in real time.",
    tabCurve: "Curve",
    tabFiles: "Files",
    liveCurve: "Live Curve",
    linear: "Linear",
    profileReset: "Profile",
    curveHint: "0% and 100% are fixed to keep black and white points stable.",
    channel: "Channel",
    rgbLinked: "RGB linked",
    red: "Red",
    green: "Green",
    blue: "Blue",
    detail: "Detail",
    standard: "Standard",
    fine: "Fine",
    ultra: "Ultra",
    view: "View",
    sliderCompare: "Slider compare",
    sideBySide: "Side by side",
    appliedOnly: "Applied only",
    comparePosition: "Compare position",
    image: "Image",
    useSample: "Use sample pattern",
    pasteHint: "Copy an image, then press Ctrl+V on this page.",
    profile: "Profile",
    loadingProfiles: "Loading ICC profiles from this folder...",
    saveIcc: "Save ICC",
    savedProfileName: "Saved profile name",
    iccLiveCustom: "ICC Live Custom",
    saveIccHint: "",
    saveEditedIcc: "Save edited ICC",
    noProfile: "No profile",
    loadedSignature: "Loaded signature",
    channels: "Channels",
    entries: "Entries",
    type: "Type",
    language: "Language",
    savePreviewPng: "Save preview PNG",
    moveComparisonSlider: "Move comparison slider",
    original: "Original",
    editedProfile: "Edited profile",
    dropImage: "Drop an image here or choose a file.",
    samplePattern: "Sample pattern",
    pastedImage: "Pasted image",
    pastedImageLoaded: "Pasted image loaded.",
    noSignature: "No signature",
    noProfilesFound: "No ICC profiles found in this folder.",
    profilesFound: (count) => `${count} ICC profiles found in this folder.`,
    iccWarning: (warnings) => `Saved ICC curve data, but could not update ${warnings.join(" and ")} in this profile.`,
    warningProfileName: "profile name metadata",
    warningSignature: "signature metadata"
  },
  ko: {
    tagline: "VCGT 커브를 실시간으로 미리 보고 조정합니다.",
    tabCurve: "커브",
    tabFiles: "파일",
    liveCurve: "실시간 커브",
    linear: "선형",
    profileReset: "프로필",
    curveHint: "0%와 100%는 고정됩니다.",
    channel: "채널",
    rgbLinked: "RGB",
    red: "빨강",
    green: "초록",
    blue: "파랑",
    detail: "정밀도",
    standard: "표준",
    fine: "세밀",
    ultra: "초세밀",
    view: "보기",
    sliderCompare: "슬라이더 비교",
    sideBySide: "나란히 보기",
    appliedOnly: "적용본만",
    comparePosition: "비교 위치",
    image: "이미지",
    useSample: "샘플 패턴 사용",
    pasteHint: "이미지를 복사한 뒤 이 페이지에서 Ctrl+V를 누르세요.",
    profile: "프로필",
    loadingProfiles: "이 폴더의 ICC 프로필을 불러오는 중...",
    saveIcc: "ICC 저장",
    savedProfileName: "저장할 프로필 이름",
    iccLiveCustom: "ICC Live Custom",
    saveIccHint: "",
    saveEditedIcc: "수정한 ICC 저장",
    noProfile: "프로필 없음",
    loadedSignature: "불러온 서명",
    channels: "채널",
    entries: "항목 수",
    type: "유형",
    language: "언어",
    savePreviewPng: "미리보기 PNG 저장",
    moveComparisonSlider: "비교 슬라이더 이동",
    original: "원본",
    editedProfile: "수정된 프로필",
    dropImage: "이미지를 여기에 놓거나 파일을 선택하세요.",
    samplePattern: "샘플 패턴",
    pastedImage: "붙여넣은 이미지",
    pastedImageLoaded: "붙여넣은 이미지를 불러왔습니다.",
    noSignature: "서명 없음",
    noProfilesFound: "이 폴더에서 ICC 프로필을 찾지 못했습니다.",
    profilesFound: (count) => `이 폴더에서 ICC 프로필 ${count}개를 찾았습니다.`,
    iccWarning: (warnings) => `ICC 커브 데이터는 저장했지만 이 프로필의 ${warnings.join(" 및 ")}은 업데이트하지 못했습니다.`,
    warningProfileName: "프로필 이름 메타데이터",
    warningSignature: "서명 메타데이터"
  }
};

const state = {
  profile: null,
  baseImageData: null,
  appliedImageData: null,
  editPointsByChannel: [],
  curveInputs: STANDARD_CURVE_INPUTS,
  activeCurveChannel: "all",
  language: "en",
  imageLabelKey: "samplePattern",
  profileCount: null,
  pasteStatusKey: "pasteHint",
  renderFrame: 0,
  pendingTableRebuild: false,
  curveDragIndex: null,
  curveDragTarget: null
};

const els = {
  imageInput: document.querySelector("#imageInput"),
  profileInput: document.querySelector("#profileInput"),
  profileSelect: document.querySelector("#profileSelect"),
  profileStatus: document.querySelector("#profileStatus"),
  pasteStatus: document.querySelector("#pasteStatus"),
  sampleButton: document.querySelector("#sampleButton"),
  viewMode: document.querySelector("#viewMode"),
  splitRange: document.querySelector("#splitRange"),
  exportButton: document.querySelector("#exportButton"),
  exportIccButton: document.querySelector("#exportIccButton"),
  languageSelect: document.querySelector("#languageSelect"),
  resetCurveButton: document.querySelector("#resetCurveButton"),
  linearCurveButton: document.querySelector("#linearCurveButton"),
  curveChannel: document.querySelector("#curveChannel"),
  curveDetail: document.querySelector("#curveDetail"),
  dropZone: document.querySelector("#dropZone"),
  splitView: document.querySelector("#splitView"),
  sideView: document.querySelector("#sideView"),
  emptyState: document.querySelector("#emptyState"),
  baseCanvas: document.querySelector("#baseCanvas"),
  appliedCanvas: document.querySelector("#appliedCanvas"),
  baseSideCanvas: document.querySelector("#baseSideCanvas"),
  appliedSideCanvas: document.querySelector("#appliedSideCanvas"),
  splitHandle: document.querySelector("#splitHandle"),
  imageName: document.querySelector("#imageName"),
  imageSize: document.querySelector("#imageSize"),
  profileName: document.querySelector("#profileName"),
  profileSignature: document.querySelector("#profileSignature"),
  saveProfileName: document.querySelector("#saveProfileName"),
  profileChannels: document.querySelector("#profileChannels"),
  profileEntries: document.querySelector("#profileEntries"),
  profileType: document.querySelector("#profileType"),
  curveCanvas: document.querySelector("#curveCanvas"),
  curvePointLayer: document.querySelector("#curvePointLayer"),
  curveControls: document.querySelector("#curveControls"),
  tabButtons: document.querySelectorAll(".tab-button"),
  tabPanels: document.querySelectorAll(".tab-panel")
};

function t(key, ...args) {
  const value = translations[state.language]?.[key] ?? translations.en[key] ?? key;
  return typeof value === "function" ? value(...args) : value;
}

function setLanguage(language) {
  state.language = translations[language] ? language : "en";
  if (els.languageSelect) els.languageSelect.value = state.language;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
  applyLanguage();
}

function updateProfileStatusText() {
  if (state.profileCount === null) return;
  els.profileStatus.textContent = state.profileCount
    ? t("profilesFound", state.profileCount)
    : t("noProfilesFound");
}

function applyLanguage() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
  });
  if (state.imageLabelKey) els.imageName.textContent = t(state.imageLabelKey);
  if (state.profile && !state.profile.signature) els.profileSignature.textContent = t("noSignature");
  updateProfileStatusText();
  if (state.pasteStatusKey) els.pasteStatus.textContent = t(state.pasteStatusKey);
}

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

function parseIcc(buffer, fallbackName) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 132) throw new Error("ICC file is too small.");
  const tagCount = u32(bytes, 128);
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
    if (offset + size > bytes.length) continue;
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

function parseVcgt(bytes, offset, size) {
  if (readAscii(bytes, offset, 4) !== "vcgt") throw new Error("Invalid VCGT tag.");
  const gammaType = u32(bytes, offset + 8);
  if (gammaType !== 0) throw new Error("Only table VCGT profiles are supported.");
  const channels = u16(bytes, offset + 12);
  const entries = u16(bytes, offset + 14);
  const entrySize = u16(bytes, offset + 16);
  if (channels < 1 || entries < 2 || entrySize !== 2) throw new Error("Unsupported VCGT format.");

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

function sampleProfile(profile, channel, input01) {
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

function applyProfile(imageData, profile) {
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

function sampleEditCurve(points, x) {
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

function cloneCurvePoints(points) {
  return points.map((point) => ({ x: point.x, y: point.y }));
}

function makeCurveInputs(detail) {
  if (detail === "standard") return [...STANDARD_CURVE_INPUTS];
  const count = CURVE_DETAIL_COUNTS[detail] || CURVE_DETAIL_COUNTS.standard;
  return Array.from({ length: count }, (_, index) => index / (count - 1));
}

function resampleCurvePoints(points, inputs) {
  return inputs.map((x, index) => ({
    x,
    y: index === 0 ? 0 : index === inputs.length - 1 ? 1 : sampleEditCurve(points, x)
  }));
}

function getChannelPoints(channel) {
  if (!state.editPointsByChannel.length) return [];
  return state.editPointsByChannel[Math.min(channel, state.editPointsByChannel.length - 1)];
}

function getVisibleCurvePoints() {
  if (state.activeCurveChannel !== "all") return getChannelPoints(Number(state.activeCurveChannel));
  return state.curveInputs.map((x, index) => {
    const available = Math.max(1, Math.min(3, state.profile?.channels || 1));
    let y = 0;
    for (let channel = 0; channel < available; channel++) {
      y += getChannelPoints(channel)[index]?.y ?? x;
    }
    return { x, y: y / available };
  });
}

function setCurvePoint(index, y) {
  if (state.activeCurveChannel === "all") {
    for (let channel = 0; channel < state.editPointsByChannel.length; channel++) {
      state.editPointsByChannel[channel][index].y = y;
    }
    return;
  }
  getChannelPoints(Number(state.activeCurveChannel))[index].y = y;
}

function updateCurveControlValue(index, y) {
  const value = String(Math.round(y * 100));
  const range = els.curveControls.querySelector(`input[data-curve-index="${index}"]`);
  const output = els.curveControls.querySelector(`output[data-curve-index="${index}"]`);
  if (range) range.value = value;
  if (output) output.textContent = `${value}%`;
}

function updateCurveHandlePosition(index) {
  const handle = els.curvePointLayer.querySelector(`[data-curve-index="${index}"]`);
  if (!handle) return;
  const point = getVisibleCurvePoints()[index];
  if (!point) return;
  const canvasPoint = getCurveCanvasPoint(point);
  handle.style.left = `${(canvasPoint.x / els.curveCanvas.width) * 100}%`;
  handle.style.top = `${(canvasPoint.y / els.curveCanvas.height) * 100}%`;
  handle.setAttribute("aria-label", `${Math.round(point.x * 100)}%, ${Math.round(point.y * 100)}%`);
}

function updateCurveHandles() {
  for (const handle of els.curvePointLayer.querySelectorAll("[data-curve-index]")) {
    updateCurveHandlePosition(Number(handle.dataset.curveIndex));
  }
}

function rebuildProfileTables() {
  if (!state.profile) return;
  for (let channel = 0; channel < state.profile.channels; channel++) {
    const points = getChannelPoints(channel);
    const table = new Float32Array(state.profile.entries);
    let previous = -1;
    for (let i = 0; i < state.profile.entries; i++) {
      let y = sampleEditCurve(points, i / (state.profile.entries - 1));
      if (i === 0) y = 0;
      if (i === state.profile.entries - 1) y = 1;
      if (y <= previous) y = Math.min(1, previous + 1 / 65535);
      table[i] = Math.max(0, Math.min(1, y));
      previous = table[i];
    }
    state.profile.tables[channel] = table;
  }
  state.profile.luts = null;
}

function drawImageData(canvas, imageData) {
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext("2d").putImageData(imageData, 0, 0);
}

function renderAll() {
  if (!state.baseImageData) return;
  state.appliedImageData = state.profile ? applyProfile(state.baseImageData, state.profile) : state.baseImageData;
  drawImageData(els.baseCanvas, state.baseImageData);
  drawImageData(els.appliedCanvas, state.appliedImageData);
  drawImageData(els.baseSideCanvas, state.baseImageData);
  drawImageData(els.appliedSideCanvas, state.appliedImageData);
  if (state.profile) drawCurveCanvas();
  updateViewMode();
}

function requestRenderAll(rebuildTables = false) {
  state.pendingTableRebuild = state.pendingTableRebuild || rebuildTables;
  if (state.renderFrame) return;
  state.renderFrame = requestAnimationFrame(() => {
    state.renderFrame = 0;
    if (state.pendingTableRebuild) {
      rebuildProfileTables();
      state.pendingTableRebuild = false;
    }
    renderAll();
  });
}

function flushPendingRender() {
  let needsRender = false;
  if (state.renderFrame) {
    cancelAnimationFrame(state.renderFrame);
    state.renderFrame = 0;
    needsRender = true;
  }
  if (state.pendingTableRebuild) {
    rebuildProfileTables();
    state.pendingTableRebuild = false;
    needsRender = true;
  }
  if (needsRender) renderAll();
}

function updateSplit() {
  const value = Number(els.splitRange.value);
  const splitRect = els.splitView.getBoundingClientRect();
  const canvasRect = els.appliedCanvas.getBoundingClientRect();
  const canvasLeft = canvasRect.width ? canvasRect.left - splitRect.left : 0;
  const canvasWidth = canvasRect.width || splitRect.width;
  const handleLeft = canvasLeft + (canvasWidth * value) / 100;
  els.appliedCanvas.style.clipPath = `inset(0 0 0 ${value}%)`;
  els.splitHandle.style.left = `${handleLeft}px`;
}

function updateViewMode() {
  const mode = els.viewMode.value;
  els.splitView.classList.toggle("hidden", mode !== "split" && mode !== "applied");
  els.sideView.classList.toggle("hidden", mode !== "side");
  els.splitRange.closest(".control-group").classList.toggle("hidden", mode !== "split");
  els.baseCanvas.classList.toggle("hidden", mode === "applied");
  els.splitHandle.classList.toggle("hidden", mode !== "split");
  if (mode === "applied") {
    els.appliedCanvas.style.clipPath = "none";
  } else {
    updateSplit();
  }
}

async function loadImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    setImageFromElement(img, file.name);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadImageBlob(blob, name, labelKey = null) {
  const file = blob instanceof File ? blob : new File([blob], name, { type: blob.type || "image/png" });
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    setImageFromElement(img, name, labelKey);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function setImageFromElement(img, name, labelKey = null) {
  const maxSide = 2200;
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);
  state.baseImageData = ctx.getImageData(0, 0, width, height);
  state.imageLabelKey = labelKey;
  els.imageName.textContent = labelKey ? t(labelKey) : name;
  els.imageSize.textContent = `${width} x ${height}`;
  els.emptyState.classList.add("hidden");
  renderAll();
}

function makeSamplePattern() {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 820;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, "#000000");
  grad.addColorStop(0.18, "#151515");
  grad.addColorStop(0.36, "#383838");
  grad.addColorStop(0.62, "#898989");
  grad.addColorStop(1, "#ffffff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 82) {
    for (let x = 0; x < canvas.width; x += 82) {
      const shade = Math.floor((x / canvas.width) * 255);
      ctx.fillStyle = `rgba(${shade},${shade},${shade},0.55)`;
      ctx.fillRect(x + 12, y + 12, 44, 44);
    }
  }

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(80, 110, 360, 250);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(930, 110, 360, 250);
  ctx.fillStyle = "#111";
  ctx.font = "22px Segoe UI";
  ctx.fillText("bright area", 980, 245);
  ctx.fillStyle = "#777";
  ctx.fillText("dark area", 190, 245);

  const img = new Image();
  img.onload = () => setImageFromElement(img, t("samplePattern"), "samplePattern");
  img.src = canvas.toDataURL("image/png");
}

async function setProfile(profile) {
  state.profile = profile;
  els.profileName.textContent = profile.name;
  els.profileName.removeAttribute("data-i18n");
  els.profileSignature.textContent = profile.signature || t("noSignature");
  els.saveProfileName.value = trimProfileName(profile.name || "ICC Live Custom");
  els.profileChannels.textContent = String(profile.channels);
  els.profileEntries.textContent = String(profile.entries);
  els.profileType.textContent = profile.type;
  resetCurveFromProfile();
}

function updateCurveChannelOptions() {
  const available = state.profile?.channels || 0;
  for (const option of els.curveChannel.options) {
    option.disabled = option.value !== "all" && Number(option.value) >= available;
  }
  if (state.activeCurveChannel !== "all" && Number(state.activeCurveChannel) >= available) {
    state.activeCurveChannel = "all";
    els.curveChannel.value = "all";
  }
}

function resetCurveFromProfile() {
  if (!state.profile) return;
  state.profile.tables = state.profile.originalTables.map((table) => new Float32Array(table));
  state.profile.luts = null;
  state.editPointsByChannel = Array.from({ length: state.profile.channels }, (_, channel) => {
    const points = state.curveInputs.map((x) => ({ x, y: sampleProfile(state.profile, channel, x) }));
    points[0].y = 0;
    points[points.length - 1].y = 1;
    return points;
  });
  updateCurveChannelOptions();
  renderCurveControls();
  renderAll();
}

function resetCurveToLinear() {
  if (!state.profile) return;
  const linear = state.curveInputs.map((x) => ({ x, y: x }));
  if (state.activeCurveChannel === "all") {
    state.editPointsByChannel = state.editPointsByChannel.map(() => cloneCurvePoints(linear));
  } else {
    state.editPointsByChannel[Number(state.activeCurveChannel)] = cloneCurvePoints(linear);
  }
  rebuildProfileTables();
  renderCurveControls();
  renderAll();
}

function updateCurveDetail() {
  const inputs = makeCurveInputs(els.curveDetail.value);
  state.curveInputs = inputs;
  if (state.editPointsByChannel.length) {
    state.editPointsByChannel = state.editPointsByChannel.map((points) => resampleCurvePoints(points, inputs));
    rebuildProfileTables();
  }
  renderCurveControls();
  renderAll();
}

async function loadProfileFile(file) {
  const profile = parseIcc(await file.arrayBuffer(), file.name);
  await setProfile(profile);
}

async function discoverProfiles() {
  const found = new Set();
  let hasManifest = false;
  try {
    const res = await fetch("./profiles.json", { cache: "no-store" });
    if (res.ok) {
      const payload = await res.json();
      const profiles = Array.isArray(payload) ? payload : [payload];
      for (const name of profiles) {
        if (typeof name === "string" && /\.(icc|icm)$/i.test(name) && !name.includes("/")) found.add(name);
      }
      hasManifest = found.size > 0;
    }
  } catch {
    // start_server.bat writes profiles.json. If the file is missing, try directory listing and fallback names.
  }
  try {
    const res = await fetch("./", { cache: "no-store" });
    if (res.ok) {
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      for (const link of doc.querySelectorAll("a[href]")) {
        const href = decodeURIComponent(link.getAttribute("href").split("?")[0].split("#")[0]);
        const name = href.replace(/^\.\//, "");
        if (/\.(icc|icm)$/i.test(name) && !name.includes("/")) found.add(name);
      }
    }
  } catch {
    // Directory listing may be hidden when index.html is served. Fallback names below keep the app usable.
  }
  for (const name of builtInProfiles) found.add(name);
  if (hasManifest) {
    return [...found].sort(sortProfileNames);
  }
  const existing = [];
  for (const name of found) {
    try {
      const res = await fetch(`./${name}`, { method: "HEAD", cache: "no-store" });
      if (res.ok) existing.push(name);
    } catch {
      // Ignore missing or inaccessible profiles.
    }
  }
  return existing.sort(sortProfileNames);
}

function sortProfileNames(a, b) {
  if (a === DEFAULT_PROFILE) return -1;
  if (b === DEFAULT_PROFILE) return 1;
  return a.localeCompare(b, undefined, { numeric: true });
}

async function loadBuiltInProfiles() {
  els.profileSelect.innerHTML = "";
  const profiles = await discoverProfiles();
  state.profileCount = profiles.length;
  if (!profiles.length) {
    updateProfileStatusText();
    return;
  }
  for (const name of profiles) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    els.profileSelect.append(option);
  }
  updateProfileStatusText();

  els.profileSelect.addEventListener("change", async () => {
    const name = els.profileSelect.value;
    try {
      const res = await fetch(`./${name}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Could not load ${name}.`);
      await setProfile(parseIcc(await res.arrayBuffer(), name));
    } catch (err) {
      alert(err.message);
    }
  });

  els.profileSelect.value = profiles.includes(DEFAULT_PROFILE) ? DEFAULT_PROFILE : profiles[0];
  els.profileSelect.dispatchEvent(new Event("change"));
}

function renderCurveControls() {
  els.curveControls.innerHTML = "";
  els.curvePointLayer.innerHTML = "";
  getVisibleCurvePoints().forEach((point, index) => {
    if (index === 0 || index === state.curveInputs.length - 1) {
      return;
    }

    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "curve-point-handle";
    handle.dataset.curveIndex = String(index);
    handle.addEventListener("pointerdown", (event) => startCurveHandleDrag(event, index));
    handle.addEventListener("pointermove", moveCurveDrag);
    handle.addEventListener("pointerup", endCurveDrag);
    handle.addEventListener("pointercancel", endCurveDrag);
    els.curvePointLayer.append(handle);
    updateCurveHandlePosition(index);

    const row = document.createElement("div");
    row.className = "curve-row";

    const label = document.createElement("label");
    label.textContent = `${Math.round(point.x * 100)}%`;

    const range = document.createElement("input");
    range.type = "range";
    range.min = "0";
    range.max = "100";
    range.step = "1";
    range.value = String(Math.round(point.y * 100));
    range.dataset.curveIndex = String(index);

    const value = document.createElement("output");
    value.textContent = `${range.value}%`;
    value.dataset.curveIndex = String(index);

    range.addEventListener("input", () => {
      setCurvePoint(index, Number(range.value) / 100);
      value.textContent = `${range.value}%`;
      updateCurveHandlePosition(index);
      requestRenderAll(true);
    });

    row.append(label, range, value);
    els.curveControls.append(row);
  });
}

function getCurveCanvasPoint(point) {
  const canvas = els.curveCanvas;
  const w = canvas.width;
  const h = canvas.height;
  return {
    x: CURVE_CANVAS_PAD + point.x * (w - CURVE_CANVAS_PAD * 2),
    y: h - CURVE_CANVAS_PAD - point.y * (h - CURVE_CANVAS_PAD * 2)
  };
}

function getCurvePointerPoint(event) {
  const canvas = els.curveCanvas;
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

function findEditableCurvePoint(event) {
  const pointer = getCurvePointerPoint(event);
  const canvas = els.curveCanvas;
  const plotLeft = CURVE_CANVAS_PAD;
  const plotRight = canvas.width - CURVE_CANVAS_PAD;
  const plotTop = CURVE_CANVAS_PAD;
  const plotBottom = canvas.height - CURVE_CANVAS_PAD;
  if (pointer.x < plotLeft || pointer.x > plotRight || pointer.y < plotTop || pointer.y > plotBottom) return null;

  const points = getVisibleCurvePoints();
  let closest = null;
  let closestXDistance = Infinity;
  for (let index = 1; index < points.length - 1; index++) {
    const canvasPoint = getCurveCanvasPoint(points[index]);
    const xDistance = Math.abs(pointer.x - canvasPoint.x);
    if (xDistance < closestXDistance) {
      closest = index;
      closestXDistance = xDistance;
    }
  }
  return closest;
}

function setCurvePointFromPointer(index, event) {
  const canvas = els.curveCanvas;
  const pointer = getCurvePointerPoint(event);
  const usableHeight = canvas.height - CURVE_CANVAS_PAD * 2;
  const y = Math.max(0, Math.min(1, (canvas.height - CURVE_CANVAS_PAD - pointer.y) / usableHeight));
  setCurvePoint(index, y);
  updateCurveControlValue(index, y);
  updateCurveHandlePosition(index);
  requestRenderAll(true);
}

function drawCurveCanvas() {
  const canvas = els.curveCanvas;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const pad = CURVE_CANVAS_PAD;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#14161b";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#303640";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const x = pad + ((w - pad * 2) * i) / 4;
    const y = pad + ((h - pad * 2) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x, pad);
    ctx.lineTo(x, h - pad);
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#6f7785";
  ctx.beginPath();
  ctx.moveTo(pad, h - pad);
  ctx.lineTo(w - pad, pad);
  ctx.stroke();

  ctx.strokeStyle = "#39b980";
  const channelColors = ["#ff5d5d", "#39b980", "#4f8cff"];
  const drawCurve = (points, color, width, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const x01 = i / 160;
      const y01 = sampleEditCurve(points, x01);
      const x = pad + x01 * (w - pad * 2);
      const y = h - pad - y01 * (h - pad * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  };

  if (state.activeCurveChannel === "all") {
    for (let channel = 0; channel < Math.min(3, state.editPointsByChannel.length); channel++) {
      drawCurve(getChannelPoints(channel), channelColors[channel], 2, 0.95);
    }
  } else {
    const channel = Number(state.activeCurveChannel);
    for (let other = 0; other < Math.min(3, state.editPointsByChannel.length); other++) {
      drawCurve(getChannelPoints(other), channelColors[other], other === channel ? 3 : 1, other === channel ? 1 : 0.25);
    }
  }

  ctx.fillStyle = state.activeCurveChannel === "all" ? "#f1c40f" : channelColors[Number(state.activeCurveChannel)];
  for (const point of getVisibleCurvePoints()) {
    const x = pad + point.x * (w - pad * 2);
    const y = h - pad - point.y * (h - pad * 2);
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  updateCurveHandles();
}

function startCurveDrag(event) {
  if (!state.profile || event.button > 0) return;
  const index = findEditableCurvePoint(event);
  if (index === null) return;
  event.preventDefault();
  state.curveDragIndex = index;
  state.curveDragTarget = els.curveCanvas;
  state.curveDragTarget.setPointerCapture(event.pointerId);
  els.curveCanvas.classList.add("dragging-curve");
  setCurvePointFromPointer(index, event);
}

function startCurveHandleDrag(event, index) {
  if (!state.profile || event.button > 0) return;
  event.preventDefault();
  event.stopPropagation();
  state.curveDragIndex = index;
  state.curveDragTarget = event.currentTarget;
  state.curveDragTarget.setPointerCapture(event.pointerId);
  els.curveCanvas.classList.add("dragging-curve");
  setCurvePointFromPointer(index, event);
}

function moveCurveDrag(event) {
  if (state.curveDragIndex === null || !state.curveDragTarget?.hasPointerCapture(event.pointerId)) return;
  event.preventDefault();
  setCurvePointFromPointer(state.curveDragIndex, event);
}

function endCurveDrag(event) {
  if (state.curveDragTarget?.hasPointerCapture(event.pointerId)) state.curveDragTarget.releasePointerCapture(event.pointerId);
  state.curveDragIndex = null;
  state.curveDragTarget = null;
  els.curveCanvas.classList.remove("dragging-curve");
}

function exportApplied() {
  flushPendingRender();
  if (!state.appliedImageData) return;
  const canvas = document.createElement("canvas");
  drawImageData(canvas, state.appliedImageData);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  const profileName = trimProfileName(els.saveProfileName.value || state.profile?.name);
  a.download = `${safeFileBase(profileName) || "ICC_Live_Custom"}.png`;
  a.click();
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

function trimProfileName(name) {
  return String(name || "ICC Live Custom").trim().slice(0, 24) || "ICC Live Custom";
}

function safeFileBase(name) {
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

function exportEditedIcc() {
  flushPendingRender();
  if (!state.profile) return;
  const bytes = new Uint8Array(state.profile.sourceBytes);
  const tableOffset = state.profile.vcgtOffset + 18;
  for (let channel = 0; channel < state.profile.channels; channel++) {
    const table = state.profile.tables[channel];
    for (let i = 0; i < state.profile.entries; i++) {
      const v = Math.max(0, Math.min(65535, Math.round(table[i] * 65535)));
      const pos = tableOffset + (channel * state.profile.entries + i) * 2;
      bytes[pos] = (v >>> 8) & 255;
      bytes[pos + 1] = v & 255;
    }
  }
  const warnings = [];
  const profileName = trimProfileName(els.saveProfileName.value);
  if (!writeIccText(bytes, state.profile.descTag, profileName)) warnings.push(t("warningProfileName"));
  if (!writeIccText(bytes, state.profile.cprtTag, SIGNATURE_TEXT)) warnings.push(t("warningSignature"));
  const blob = new Blob([bytes], { type: "application/vnd.iccprofile" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileBase(profileName) || "ICC_Live_Custom"}.icc`;
  a.click();
  URL.revokeObjectURL(url);
  if (warnings.length) {
    alert(t("iccWarning", warnings));
  }
}

els.imageInput.addEventListener("change", () => {
  const file = els.imageInput.files[0];
  if (file) loadImageFile(file).catch((err) => alert(err.message));
});

els.profileInput.addEventListener("change", () => {
  const file = els.profileInput.files[0];
  if (file) loadProfileFile(file).catch((err) => alert(err.message));
});

els.sampleButton.addEventListener("click", makeSamplePattern);
els.curveChannel.addEventListener("change", () => {
  state.activeCurveChannel = els.curveChannel.value;
  renderCurveControls();
  drawCurveCanvas();
});
els.curveDetail.addEventListener("change", updateCurveDetail);
els.viewMode.addEventListener("change", updateViewMode);
els.splitRange.addEventListener("input", () => {
  updateSplit();
  updateViewMode();
});
els.exportButton.addEventListener("click", exportApplied);
els.exportIccButton.addEventListener("click", exportEditedIcc);
els.languageSelect.addEventListener("change", () => setLanguage(els.languageSelect.value));
els.resetCurveButton.addEventListener("click", resetCurveFromProfile);
els.linearCurveButton.addEventListener("click", resetCurveToLinear);
els.curveCanvas.addEventListener("pointerdown", startCurveDrag);
els.curveCanvas.addEventListener("pointermove", moveCurveDrag);
els.curveCanvas.addEventListener("pointerup", endCurveDrag);
els.curveCanvas.addEventListener("pointercancel", endCurveDrag);

function activateTab(tabName) {
  els.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  els.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${tabName}`);
  });
}

els.tabButtons.forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tab));
});

function setSplitFromPointer(event) {
  if (els.viewMode.value !== "split") return;
  const rect = els.appliedCanvas.getBoundingClientRect();
  if (!rect.width) return;
  const value = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
  els.splitRange.value = String(Math.round(value));
  updateSplit();
  updateViewMode();
}

function startSplitDrag(event) {
  if (els.viewMode.value !== "split") return;
  event.preventDefault();
  els.splitView.setPointerCapture(event.pointerId);
  els.splitView.classList.add("dragging-split");
  setSplitFromPointer(event);
}

function moveSplitDrag(event) {
  if (!els.splitView.hasPointerCapture(event.pointerId)) return;
  setSplitFromPointer(event);
}

function endSplitDrag(event) {
  if (els.splitView.hasPointerCapture(event.pointerId)) els.splitView.releasePointerCapture(event.pointerId);
  els.splitView.classList.remove("dragging-split");
}

els.splitView.addEventListener("pointerdown", startSplitDrag);
els.splitView.addEventListener("pointermove", moveSplitDrag);
els.splitView.addEventListener("pointerup", endSplitDrag);
els.splitView.addEventListener("pointercancel", endSplitDrag);
window.addEventListener("resize", updateSplit);

document.addEventListener("paste", async (event) => {
  const items = [...(event.clipboardData?.items || [])];
  const imageItem = items.find((item) => item.type.startsWith("image/"));
  if (!imageItem) return;
  event.preventDefault();
  const blob = imageItem.getAsFile();
  if (!blob) return;
  try {
    state.pasteStatusKey = "pastedImageLoaded";
    els.pasteStatus.textContent = t("pastedImageLoaded");
    await loadImageBlob(blob, t("pastedImage"), "pastedImage");
  } catch (err) {
    state.pasteStatusKey = null;
    els.pasteStatus.textContent = err.message;
  }
});

["dragenter", "dragover"].forEach((eventName) => {
  els.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  els.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.dropZone.classList.remove("dragging");
  });
});

els.dropZone.addEventListener("drop", (event) => {
  const file = [...event.dataTransfer.files].find((item) => item.type.startsWith("image/"));
  if (file) loadImageFile(file).catch((err) => alert(err.message));
});

setLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || "en");
loadBuiltInProfiles().catch((err) => alert(err.message));
makeSamplePattern();
updateSplit();
