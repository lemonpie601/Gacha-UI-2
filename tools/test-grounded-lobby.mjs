import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../extension.js", import.meta.url), "utf8");

function keyframes(name) {
  const match = source.match(new RegExp(`^@keyframes\\s+${name}\\s+(.+)$`, "m"));
  assert.ok(match, `missing @keyframes ${name}`);
  return match[1];
}

for (const name of ["gfx-lobby-bob", "gfx-step"]) {
  assert.doesNotMatch(
    keyframes(name),
    /translateY\s*\(\s*-?[0-9.]+%\s*\)/,
    `${name} must keep the sprite's feet on its ground anchor`,
  );
}

assert.match(
  source,
  /\.gfx-lobby \.who \.body\s*\{[^}]*animation:\s*gfx-lobby-bob\b/s,
  "the lobby must use its grounded idle animation",
);

assert.match(
  source,
  /\.gfx-lobby \.who \.body\s*\{[^}]*transform-origin:\s*50%\s+100%/s,
  "lobby squash and sway must pivot around the feet",
);

console.log("grounded lobby animation checks passed");
