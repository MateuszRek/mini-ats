import fs from "node:fs";
import zlib from "node:zlib";

const appPath = new URL("../src/App.jsx", import.meta.url);
const patchPayload = `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`.replace(/\s/g, "");
const patch = zlib.gunzipSync(Buffer.from(patchPayload, "base64")).toString("utf8");
let source = fs.readFileSync(appPath, "utf8");

if (source.includes("const [newClientContact, setNewClientContact]")) {
  console.log("Normalized clients patch already applied.");
  process.exit(0);
}

function splitLines(text) {
  return text.match(/.*(?:\r?\n|$)/g).filter((line) => line.length > 0);
}

function fail(message) {
  throw new Error(`Cannot apply normalized clients patch: ${message}`);
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
console.log("Applied normalized clients patch.");
