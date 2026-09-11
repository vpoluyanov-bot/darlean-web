/**
 * Re-downloads the self-hosted font subsets into public/fonts/
 * and regenerates src/styles/tokens/fonts.css.
 *
 *   node scripts/fetch-fonts.mjs
 *
 * Inter is the design system's typeface. Nunito stands in for SF Pro Rounded
 * on lead paragraphs, which is what the homepage comp specifies.
 *
 * Both are served by Google Fonts as variable fonts, so one file per subset
 * covers every weight. Nothing is loaded from a CDN at runtime.
 */
import { writeFile, mkdir } from 'node:fs/promises';

const SUBSETS = ['latin', 'cyrillic'];
const FAMILIES = [
  { name: 'Inter', slug: 'inter', weights: '400;500;600', range: '400 600' },
  { name: 'Nunito', slug: 'nunito', weights: '400;500', range: '400 500' },
];
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const faces = [];

for (const family of FAMILIES) {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${family.name}:wght@${family.weights}` +
        '&display=swap&subset=latin,cyrillic',
      { headers: { 'User-Agent': UA } }
    )
  ).text();

  const blocks = [...css.matchAll(/\/\* ([a-z-]+) \*\/\s*(@font-face \{[\s\S]*?\})/g)];
  await mkdir('public/fonts', { recursive: true });

  for (const subset of SUBSETS) {
    const block = blocks.find(([, name]) => name === subset)?.[2];
    if (!block) throw new Error(`${family.name}: subset "${subset}" missing from response`);

    const url = block.match(/url\((https:\/\/[^)]+)\)/)[1];
    const unicodeRange = block.match(/unicode-range: ([^;]+);/)[1];

    const font = Buffer.from(await (await fetch(url)).arrayBuffer());
    await writeFile(`public/fonts/${family.slug}-${subset}.woff2`, font);

    faces.push(`@font-face{
  font-family:'${family.name}';
  font-style:normal;
  font-weight:${family.range};
  font-display:swap;
  src:url('/fonts/${family.slug}-${subset}.woff2') format('woff2');
  unicode-range:${unicodeRange};
}`);
  }
}

await writeFile(
  'src/styles/tokens/fonts.css',
  [
    '/* Self-hosted variable fonts, latin + cyrillic. Nothing loads from a CDN. */',
    '/* Source: Google Fonts (OFL). Regenerate with scripts/fetch-fonts.mjs */',
    '',
    ...faces,
  ].join('\n') + '\n'
);

console.log(`Wrote ${faces.length} font faces to public/fonts/`);
