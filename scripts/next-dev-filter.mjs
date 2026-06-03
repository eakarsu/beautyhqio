#!/usr/bin/env node

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const nextBin = path.join(
  dirname,
  "..",
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next"
);

const child = spawn(nextBin, ["dev", ...process.argv.slice(2)], {
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

function pipeFiltered(stream, target) {
  let buffer = "";

  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.includes("/api/voice/call/status/")) {
        target.write(`${line}\n`);
      }
    }
  });

  stream.on("end", () => {
    if (buffer && !buffer.includes("/api/voice/call/status/")) {
      target.write(buffer);
    }
  });
}

pipeFiltered(child.stdout, process.stdout);
pipeFiltered(child.stderr, process.stderr);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
