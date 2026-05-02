import { mkdir, readFile, writeFile, copyFile, readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { createHash } from "node:crypto";

const rootDir = process.cwd();
const outDir = join(rootDir, "build", "web");
const assets = ["styles.css"];
const htmlName = "index.html";
const sourceAppName = "app.js";
const sourceCoreName = "icc-core.js";
const profileManifestName = "profiles.json";

const identifierMap = new Map([
  ["DEFAULT_PROFILE", "DfP"],
  ["STANDARD_CURVE_INPUTS", "ScI"],
  ["parseIcc", "pI"],
  ["sampleProfile", "sP"],
  ["applyProfile", "aP"],
  ["sampleEditCurve", "sE"],
  ["cloneCurvePoints", "cP"],
  ["makeCurveInputs", "mC"],
  ["resampleCurvePoints", "rC"],
  ["trimProfileName", "tP"],
  ["safeFileBase", "sF"],
  ["writeProfileBytes", "wP"],
  ["SIGNATURE_CODE_POINTS", "S0"],
  ["APP_SIGNATURE", "A0"],
  ["SIGNATURE_TEXT", "T0"],
  ["CURVE_DETAIL_COUNTS", "CdC"],
  ["MAX_ICC_TAG_COUNT", "MiT"],
  ["decodeAsciiText", "dA"],
  ["parseIccText", "pT"],
  ["buildProfileLuts", "bL"],
  ["encodeUtf16be", "eU"],
  ["encodeAscii", "eA"],
  ["writeMlucText", "wM"],
  ["writeDescText", "wD"],
  ["writeTextText", "wT"],
  ["writeIccText", "wI"],
  ["builtInProfiles", "Bp"],
  ["CURVE_CANVAS_PAD", "Cp"],
  ["LANGUAGE_STORAGE_KEY", "LsK"],
  ["MAX_IMAGE_FILE_BYTES", "MfB"],
  ["MAX_IMAGE_PIXELS", "MpX"],
  ["MAX_IMAGE_DIMENSION", "MdX"],
  ["translations", "Tr"],
  ["state", "St"],
  ["els", "El"],
  ["drawVisibleCanvases", "dV"],
  ["renderAll", "rA"],
  ["requestRenderAll", "qR"],
  ["flushPendingRender", "fR"],
  ["updateViewMode", "uV"],
  ["validateImageBlob", "vB"],
  ["normalizeImageDimensions", "nD"],
  ["setImageFromDrawable", "sD"],
  ["decodeImageBlob", "dB"],
  ["loadBuiltInProfiles", "lB"],
  ["renderCurveControls", "rC0"],
  ["drawCurveCanvas", "dC"],
  ["exportEditedIcc", "eI"],
  ["exportApplied", "eP"]
]);

function stripModuleSyntax(source) {
  return source
    .replace(/^import\s+[\s\S]*?from\s+["']\.\/icc-core\.js["'];?\s*/m, "")
    .replace(/^export\s+/gm, "");
}

function mangleIdentifiers(source) {
  let output = source;
  for (const [from, to] of identifierMap.entries()) {
    output = output.replace(new RegExp(`\\b${from}\\b`, "g"), to);
  }
  return output;
}

function minifyJs(source) {
  let out = "";
  let state = "code";
  let quote = "";
  let previous = "";

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1] || "";

    if (state === "line_comment") {
      if (char === "\n") {
        state = "code";
        if (previous && /[\w$)\]]/.test(previous)) {
          out += "\n";
          previous = "\n";
        }
      }
      continue;
    }

    if (state === "block_comment") {
      if (char === "*" && next === "/") {
        state = "code";
        i++;
      }
      continue;
    }

    if (state === "string") {
      out += char;
      if (char === "\\" && next) {
        out += next;
        i++;
      } else if (char === quote) {
        state = "code";
      }
      previous = char;
      continue;
    }

    if (char === "'" || char === "\"" || char === "`") {
      state = "string";
      quote = char;
      out += char;
      previous = char;
      continue;
    }

    if (char === "/" && next === "/") {
      state = "line_comment";
      i++;
      continue;
    }

    if (char === "/" && next === "*") {
      state = "block_comment";
      i++;
      continue;
    }

    if (/\s/.test(char)) {
      const last = out[out.length - 1] || "";
      if (/[\w$]/.test(last) && /[\w$]/.test(next)) {
        out += " ";
        previous = " ";
      }
      continue;
    }

    if ("{}[]();,:".includes(char)) {
      while (out.endsWith(" ")) out = out.slice(0, -1);
      out += char;
      previous = char;
      continue;
    }

    out += char;
    previous = char;
  }

  return out.trim();
}

async function buildJavascript() {
  const [coreSource, appSource] = await Promise.all([
    readFile(join(rootDir, sourceCoreName), "utf8"),
    readFile(join(rootDir, sourceAppName), "utf8")
  ]);

  const bundle = [
    stripModuleSyntax(coreSource),
    stripModuleSyntax(appSource)
  ].join("\n");

  return minifyJs(mangleIdentifiers(bundle));
}

async function copyProfiles() {
  const files = await readdir(rootDir, { withFileTypes: true });
  const profiles = files
    .filter((entry) => entry.isFile() && [".icc", ".icm"].includes(extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  await Promise.all(
    profiles.map((name) => copyFile(join(rootDir, name), join(outDir, name)))
  );

  await writeFile(join(outDir, profileManifestName), `${JSON.stringify(profiles, null, 2)}\n`, "utf8");
  return profiles;
}

async function buildHtml(appDigest) {
  let html = await readFile(join(rootDir, htmlName), "utf8");
  html = html.replace("./app.js?v=dev", `./app.js?v=${appDigest}`);
  html = html.replace(" type=\"module\"", "");
  await writeFile(join(outDir, htmlName), html, "utf8");
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const js = await buildJavascript();
  const appDigest = createHash("sha256").update(js).digest("hex").slice(0, 12);
  await writeFile(join(outDir, "app.js"), js, "utf8");

  await Promise.all(
    assets.map((name) => copyFile(join(rootDir, name), join(outDir, basename(name))))
  );

  await buildHtml(appDigest);
  const profiles = await copyProfiles();

  process.stdout.write(JSON.stringify({
    outDir,
    appDigest,
    profiles
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
