// Inlines palette data into preview.html so it opens from disk without a server.
// Usage: node check-contrast.mjs palettes.json contrast.json && node build-preview.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('.', import.meta.url);
const read = (name) => readFileSync(new URL(name, dir), 'utf8');

const script = `<script>
const PALETTES = ${read('palettes.json').trim()};
const CONTRAST = ${read('contrast.json').trim()};
${read('render.js')}
</script>`;

writeFileSync(new URL('preview.html', dir), read('index.html').replace('<!--SCRIPT-->', script));
console.log('wrote preview.html');
