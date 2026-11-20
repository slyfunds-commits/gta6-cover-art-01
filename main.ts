import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const outputRoot = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const limits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyRegularTree(source, destination) {
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) copyRegularTree(from, to);
    else if (entry.isFile()) copyFileSync(from, to);
  }
}

function prepareOutput() {
  mkdirSync(outputRoot, { recursive: true });
  // Keep the hand-in self-contained by copying only ordinary files and directories.
  const appSource = join(projectRoot, "app");
  try {
    if (!statSync(appSource).isDirectory()) throw new Error(`Required app/ path is not a directory: ${appSource}`);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Required app/ directory is missing: ${appSource}`, { cause: error });
    }
    throw error;
  }
  copyRegularTree(appSource, join(outputRoot, "app"));

  const screenshotSource = join(projectRoot, "screenshots");
  try {
    if (statSync(screenshotSource).isDirectory()) {
      copyRegularTree(screenshotSource, join(outputRoot, "screenshots"));
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

// Assemble the static app and renders before asking the kit library for its dossier.
prepareOutput();
const dossier = buildDossier(outputRoot, limits);
writeFileSync(join(outputRoot, "dossier.json"), dossier);
