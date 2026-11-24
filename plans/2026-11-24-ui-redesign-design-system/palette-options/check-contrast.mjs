// Usage: node check-contrast.mjs palettes.json
import { readFileSync } from 'node:fs';

const palettes = JSON.parse(readFileSync(process.argv[2], 'utf8'));

const lum = (hex) => {
  const [r, g, b] = hex.replace('#', '').match(/../g).map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// [foreground, background, minimum ratio]
const pairs = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['muted', 'surface', 4.5], ['muted', 'surfaceAlt', 4.5],
  ['onPrimary', 'primary', 4.5], ['primary', 'surface', 3], ['onAccent', 'accent', 4.5],
  ['accentText', 'surface', 4.5], ['success', 'surface', 4.5], ['warning', 'surface', 4.5], ['danger', 'surface', 4.5],
];

const result = {};
let failures = 0;
for (const p of palettes) {
  result[p.id] = {};
  for (const mode of ['light', 'dark']) {
    const t = p[mode];
    result[p.id][mode] = pairs.map(([fg, bg, min]) => {
      const r = ratio(t[fg], t[bg]);
      const pass = r >= min;
      if (!pass) failures++;
      return { pair: `${fg}/${bg}`, ratio: Number(r.toFixed(2)), min, pass };
    });
  }
}

for (const [id, modes] of Object.entries(result)) {
  for (const [mode, rows] of Object.entries(modes)) {
    const bad = rows.filter((r) => !r.pass).map((r) => `${r.pair}=${r.ratio}`);
    console.log(`${id.padEnd(9)} ${mode.padEnd(5)} ${bad.length ? 'FAIL ' + bad.join(', ') : 'all pass'}`);
  }
}
console.log(`failures: ${failures}`);
if (process.argv[3]) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(process.argv[3], JSON.stringify(result, null, 2));
}
