import fs from "node:fs";
import zlib from "node:zlib";

const appPath = new URL("../src/App.jsx", import.meta.url);
const patchPayload = `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`.replace(/\s/g, "");
const patch = zlib.gunzipSync(Buffer.from(patchPayload, "base64")).toString("utf8");
let source = fs.readFileSync(appPath, "utf8");

if (source.includes("const updateProjectClient = async")) {
  console.log("Client/project flow patch already applied.");
  process.exit(0);
}

function splitLines(text) {
  return text.match(/.*(?:\r?\n|$)/g).filter((line) => line.length > 0);
}

function fail(message) {
  throw new Error(`Cannot apply client/project flow patch: ${message}`);
}

const sourceLines = splitLines(source);
const patchLines = splitLines(patch);
const output = [];
let sourceIndex = 0;
let patchIndex = 0;

while (patchIndex < patchLines.length) {
  const line = patchLines[patchIndex];

  if (line.startsWith("--- ") || line.startsWith("+++ ")) {
    patchIndex += 1;
    continue;
  }

  const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
  if (!match) {
    fail(`unexpected patch line: ${line.slice(0, 120)}`);
  }

  const oldStart = Number(match[1]);
  const targetIndex = oldStart - 1;

  while (sourceIndex < targetIndex) {
    output.push(sourceLines[sourceIndex]);
    sourceIndex += 1;
  }

  patchIndex += 1;

  while (patchIndex < patchLines.length && !patchLines[patchIndex].startsWith("@@ ")) {
    const hunkLine = patchLines[patchIndex];
    const marker = hunkLine[0];
    const value = hunkLine.slice(1);

    if (marker === " ") {
      if (sourceLines[sourceIndex] !== value) {
        fail(`context mismatch near source line ${sourceIndex + 1}`);
      }
      output.push(value);
      sourceIndex += 1;
    } else if (marker === "-") {
      if (sourceLines[sourceIndex] !== value) {
        fail(`removal mismatch near source line ${sourceIndex + 1}`);
      }
      sourceIndex += 1;
    } else if (marker === "+") {
      output.push(value);
    } else if (marker === "\\") {
      // "No newline at end of file" marker. The app source keeps a trailing newline, so nothing to do.
    } else if (hunkLine.startsWith("--- ") || hunkLine.startsWith("+++ ")) {
      break;
    } else {
      fail(`unexpected hunk marker: ${marker}`);
    }

    patchIndex += 1;
  }
}

while (sourceIndex < sourceLines.length) {
  output.push(sourceLines[sourceIndex]);
  sourceIndex += 1;
}

fs.writeFileSync(appPath, output.join(""));
console.log("Applied client/project flow patch.");
