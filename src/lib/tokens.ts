/**
 * Reads the token CSS files at build time so the styleguide can never drift
 * from the design system. Add a token upstream and it shows up here by itself.
 */

export interface Token {
  name: string;
  value: string;
}

// Vite inlines these at build time, so the parsed tokens survive bundling.
const SOURCES = import.meta.glob('../styles/tokens/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function readTokens(file: string): Token[] {
  const path = Object.keys(SOURCES).find((key) => key.endsWith(`/${file}`));
  if (!path) throw new Error(`Unknown token file: ${file}`);

  // Strip comments, then pick up every `--name: value;` declaration.
  const body = SOURCES[path].replace(/\/\*[\s\S]*?\*\//g, '');

  return [...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => ({
    name,
    value: value.trim(),
  }));
}

export function tokenMap(file: string): Record<string, string> {
  return Object.fromEntries(readTokens(file).map((t) => [t.name, t.value]));
}

/* ---- WCAG contrast ------------------------------------------------- */

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;

  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two opaque hex colours, or null if either isn't hex. */
export function contrast(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;

  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG AA verdict: 4.5:1 for body text, 3:1 for text 24px and above. */
export function aa(ratio: number): { normal: boolean; large: boolean } {
  return { normal: ratio >= 4.5, large: ratio >= 3 };
}
