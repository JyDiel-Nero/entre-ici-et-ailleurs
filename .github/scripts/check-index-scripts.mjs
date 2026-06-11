/**
 * check-index-scripts.mjs — extrait les <script> de index.html et
 * vérifie leur syntaxe avec `node --check`. Utilisé par le garde-fou CI.
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const html = readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

if (!scripts.length) {
  console.error('✗ Aucun <script> trouvé dans index.html');
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), 'eia-check-'));
scripts.forEach((code, i) => {
  const p = join(dir, `inline-${i}.js`);
  writeFileSync(p, code);
  try {
    execFileSync('node', ['--check', p], { stdio: 'pipe' });
    console.log(`OK  index.html script n°${i + 1}`);
  } catch (e) {
    console.error(`✗ Erreur de syntaxe dans le script n°${i + 1} de index.html :`);
    console.error(String(e.stderr).slice(0, 2000));
    process.exit(1);
  }
});
