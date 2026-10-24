// Installs or updates this extension on a local Marinara Engine and approves the new code.
// Usage: node tools/install.mjs [port]   (default 7861, the test server)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] || 7861);
const base = `http://127.0.0.1:${port}/api/personal-extensions`;
const { config } = JSON.parse(readFileSync(join(here, "manifest.json"), "utf8"));
const payload = {
  name: config.name,
  version: config.version,
  description: config.description,
  runtime: config.runtime,
  capabilities: config.capabilities,
  js: readFileSync(join(here, config.jsPath), "utf8"),
};

async function call(method, url, body) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

let r = await call("POST", base, payload);
if (r.status === 409 && r.data?.id) {
  const { name, ...rest } = payload;
  r = await call("PATCH", `${base}/${r.data.id}`, rest);
}
if (r.status >= 300 || !r.data?.id) throw new Error(`install failed (${r.status}): ${JSON.stringify(r.data)}`);
const ext = r.data;
const a = await call("POST", `${base}/${ext.id}/approve`, {
  contentHash: ext.contentHash,
  acknowledgeSandboxedCode: true,
  acknowledgeFullPageAccess: true,
});
if (a.status >= 300) throw new Error(`approve failed (${a.status}): ${JSON.stringify(a.data)}`);
console.log(`OK ${config.name} ${config.version} -> port ${port}, id ${ext.id}, enabled ${a.data.enabled}`);
