/**
 * Renders the Open Graph card into public/og.png at 1200x630.
 *
 *   node scripts/make-og.mjs
 *
 * The card is built from the design system rather than drawn by hand: it reads
 * the same token files the site does, uses the self-hosted Inter, and uses the
 * signature gradient on the second headline line. Change a token and rerun.
 */
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const TOKENS = ['colors', 'typography', 'radii'];
const tokenCss = (
  await Promise.all(TOKENS.map((f) => readFile(`src/styles/tokens/${f}.css`, 'utf8')))
).join('\n');

const fontData = await readFile('public/fonts/inter-latin.woff2');
const logo = await readFile('public/assets/logo-full-dark.svg', 'utf8');

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Inter';
    font-weight: 400 600;
    src: url(data:font/woff2;base64,${fontData.toString('base64')}) format('woff2');
  }
  ${tokenCss}
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: var(--surface-page);
    font-family: 'Inter', sans-serif;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 72px 80px;
    -webkit-font-smoothing: antialiased;
  }
  .logo { width: 204px; }
  h1 {
    font-size: 76px; line-height: 1.04; letter-spacing: -0.035em;
    font-weight: 600; color: var(--text-display); max-width: 16em;
  }
  .accent {
    display: block;
    background: var(--gradient-headline);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  p {
    font-size: 26px; line-height: 1.45; color: var(--text-secondary);
    max-width: 30em; margin-top: 28px;
  }
  .rule { height: 1px; background: var(--border-hairline); }
  footer { display: flex; gap: 18px; margin-top: 28px; }
  footer span {
    font-size: 20px; color: var(--text-secondary);
    border: 1px solid var(--border-control); border-radius: var(--radius-pill);
    padding: 10px 20px;
  }
</style>
<div class="logo">${logo}</div>
<div>
  <h1>GPT for business.<span class="accent">Only with tools</span></h1>
  <p>Tasks, projects, people and documents — with AI agents that do the work.</p>
</div>
<div>
  <div class="rule"></div>
  <footer><span>Tasks</span><span>Projects</span><span>People</span><span>Documents</span><span>Workflows</span></footer>
</div>
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'public/og.png' });
await browser.close();

console.log('wrote public/og.png');
