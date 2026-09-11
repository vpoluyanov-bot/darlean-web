/**
 * Re-downloads the self-hosted Inter subsets into public/fonts/
 * and regenerates src/styles/tokens/fonts.css.
 *
 *   node scripts/fetch-fonts.mjs
 *
 * Inter is served by Google Fonts as a variable font, so one file per
 * subset covers weights 400-600. Nothing is loaded from a CDN at runtime.
 */
import { writeFile, mkdir } from 'node:fs/promises';

const SUBSETS = ['latin', 'cyrillic'];
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const css = await (
  await fetch(
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap&subset=latin,cyrillic',
    { headers: { 'User-Agent': UA } }
  )
).text();

const blocks = [...css.matchAll(/\/\* ([a-z-]+) \*\/\s*(@font-face \{[\s\S]*?\})/g)];
await mkdir('public/fonts', { recursive: true });

const faces = [];
for (const subset of SUBSETS) {
  const block = blocks.find(([, name]) => name === subset)?.[2];
  if (!block) throw new Error(`subset "${subset}" missing from Google Fonts response`);

  const url = block.match(/url\((https:\/\/[^)]+)\)/)[1];
  const unicodeRange = block.match(/unicode-range: ([^;]+);/)[1];

  const font = Buffer.from(await (await fetch(url)).arrayBuffer());
  await writeFile(`public/fonts/inter-${subset}.woff2`, font);

  faces.push(`@font-face{
  font-family:'Inter';
  font-style:normal;
  font-weight:400 600;
  font-display:swap;
  src:url('/fonts/inter-${subset}.woff2') format('woff2');
  unicode-range:${unicodeRange};
}`);
}

await writeFile(
  'src/styles/tokens/fonts.css',
  [
    '/* Inter — self-hosted variable font, weights 400-600, latin + cyrillic. */',
    '/* Source: Google Fonts (OFL). Regenerate with scripts/fetch-fonts.mjs */',
    '',
    ...faces,
  ].join('\n') + '\n'
);

console.log(`Wrote ${SUBSETS.length} subsets to public/fonts/`);
