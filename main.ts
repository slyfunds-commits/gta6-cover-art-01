// Neon Hours — make.fun entrypoint.
//
// Copies the app and its screenshots into the output directory and
// writes dossier.json there with buildDossier from the kit's library.
// It writes only to the output directory: the grader sandbox is
// read-only everywhere else, so nothing here touches the repository.

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

mkdirSync(outDir, { recursive: true });
for (const name of ['app', 'screenshots']) {
  const dest = join(outDir, name);
  rmSync(dest, { recursive: true, force: true });
  cpSync(join(repoRoot, name), dest, { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
