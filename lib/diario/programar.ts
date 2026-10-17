// Aviso diario en macOS: un LaunchAgent que corre scripts/diario.ts todos los días a las 7:00.
// Si la Mac está dormida a esa hora, macOS lo corre al despertarse.
import { execFile, spawn } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { DIARIO } from "./archivos";

const run = promisify(execFile);
const ETIQUETA = "com.hookia.diario";
const PLIST = path.join(os.homedir(), "Library", "LaunchAgents", `${ETIQUETA}.plist`);
const SCRIPT = path.join(process.cwd(), "scripts", "diario.ts");
const TSX = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");

export const soportado = process.platform === "darwin";

const xml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function rutaClaude() {
  if (process.env.CLAUDE_BIN && path.isAbsolute(process.env.CLAUDE_BIN)) return process.env.CLAUDE_BIN;
  try {
    const { stdout } = await run("/usr/bin/which", ["claude"]);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function entorno() {
  const claude = await rutaClaude();
  const carpetas = [path.dirname(process.execPath), claude && path.dirname(claude), "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
  return { PATH: [...new Set(carpetas.filter(Boolean))].join(":"), ...(claude ? { CLAUDE_BIN: claude } : {}), HOME: os.homedir() };
}

export async function estaActivo() {
  if (!soportado) return false;
  try {
    await access(PLIST);
    return true;
  } catch {
    return false;
  }
}

export async function activar() {
  if (!soportado) throw new Error("El aviso diario automático por ahora funciona en Mac.");
  const env = await entorno();
  await mkdir(path.dirname(PLIST), { recursive: true });
  await mkdir(DIARIO, { recursive: true });
  const variables = Object.entries(env)
    .map(([k, v]) => `      <key>${xml(k)}</key><string>${xml(v)}</string>`)
    .join("\n");
  const registro = xml(path.join(DIARIO, "registro.log"));
  await writeFile(
    PLIST,
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key><string>${ETIQUETA}</string>
    <key>ProgramArguments</key>
    <array>
      <string>${xml(process.execPath)}</string>
      <string>${xml(TSX)}</string>
      <string>${xml(SCRIPT)}</string>
    </array>
    <key>WorkingDirectory</key><string>${xml(process.cwd())}</string>
    <key>EnvironmentVariables</key>
    <dict>
${variables}
    </dict>
    <key>StartCalendarInterval</key>
    <dict><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <key>StandardOutPath</key><string>${registro}</string>
    <key>StandardErrorPath</key><string>${registro}</string>
  </dict>
</plist>
`,
    { mode: 0o644 },
  );
  const uid = process.getuid?.() ?? 0;
  await run("/bin/launchctl", ["bootout", `gui/${uid}`, PLIST]).catch(() => {});
  await run("/bin/launchctl", ["bootstrap", `gui/${uid}`, PLIST]);
}

export async function desactivar() {
  if (!soportado) return;
  const uid = process.getuid?.() ?? 0;
  await run("/bin/launchctl", ["bootout", `gui/${uid}`, PLIST]).catch(() => {});
  await rm(PLIST, { force: true });
}

/** ¿Hay una búsqueda corriendo ahora? (la marca vieja de más de 20 minutos no cuenta). */
export async function corriendo() {
  try {
    const m = JSON.parse(await readFile(path.join(DIARIO, "corriendo.json"), "utf8")) as { pid: number; desde: string };
    if (Date.now() - new Date(m.desde).getTime() > 20 * 60 * 1000) return false;
    process.kill(m.pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Corre la búsqueda ahora, en segundo plano, igual que a las 7:00. */
export async function correrAhora() {
  const env = await entorno();
  const hijo = spawn(process.execPath, [TSX, SCRIPT], { cwd: process.cwd(), detached: true, stdio: "ignore", env: { ...process.env, ...env } });
  hijo.unref();
}
