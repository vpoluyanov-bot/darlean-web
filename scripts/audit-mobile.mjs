/**
 * Walks the site at phone widths and reports what breaks.
 *
 *   node scripts/audit-mobile.mjs [baseUrl]
 *
 * Two problems are looked for:
 *
 *  - elements that stick out past the right edge of the viewport and are not
 *    clipped by an ancestor, which is what produces a horizontally scrolling
 *    page;
 *  - elements whose own content is wider than they are, which is text spilling
 *    out of its card.
 *
 * Screenshots land in .audit/ so the result can be looked at, not just counted.
 * They are taken a viewport at a time rather than as one tall image: the two
 * pinned sections make the homepage thousands of pixels long, which no single
 * screenshot survives.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const PAGES = ['/', '/pricing', '/styleguide'];
const WIDTHS = [375, 390, 430];
const OUT = '.audit';

const findProblems = () => {
  const viewport = document.documentElement.clientWidth;

  /** True when some ancestor already cuts this element off horizontally. */
  const isClipped = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const overflowX = getComputedStyle(p).overflowX;
      if (overflowX !== 'visible') return true;
    }
    return false;
  };

  const describe = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const cls = typeof el.className === 'string' && el.className
      ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
      : '';
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return { tag: el.tagName.toLowerCase() + id + cls, text };
  };

  const overflowing = [];
  const spilling = [];

  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;

    const rect = el.getBoundingClientRect();
    if (!rect.width && !rect.height) continue;

    // Sticking out of the viewport, with nothing above it doing the clipping.
    if (rect.right > viewport + 1 && !isClipped(el)) {
      overflowing.push({ ...describe(el), right: Math.round(rect.right), over: Math.round(rect.right - viewport) });
    }

    // Content wider than the box that holds it.
    if (style.overflowX === 'visible' && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      spilling.push({ ...describe(el), box: el.clientWidth, content: el.scrollWidth, over: el.scrollWidth - el.clientWidth });
    }
  }

  // Keep the outermost offender of each nesting chain — children repeat the parent's sin.
  const outermost = (list) =>
    list.filter((_, i, all) => !all.some((other, j) => j !== i && other.tag === all[i].tag && j < i)).slice(0, 12);

  return {
    viewport,
    pageScrollWidth: document.documentElement.scrollWidth,
    scrollsHorizontally: document.documentElement.scrollWidth > viewport + 1,
    overflowing: outermost(overflowing),
    spilling: outermost(spilling),
  };
};

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const report = [];

for (const path of PAGES) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      deviceScaleFactor: 2,
    });

    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const result = await page.evaluate(findProblems);
    report.push({ path, width, ...result });

    const name = (path === '/' ? 'home' : path.replace(/\//g, '')) + `-${width}`;

    // Shoot a screen at a time, skipping the pinned sections' empty middles.
    const stops = await page.evaluate(() => {
      const marks = [0];
      for (const section of document.querySelectorAll('main > section, main > div > section')) {
        const top = section.getBoundingClientRect().top + window.scrollY;
        // A pinned section is many screens tall; one shot at its start is enough.
        if (!marks.some((m) => Math.abs(m - top) < 200)) marks.push(Math.round(top));
      }
      const footer = document.querySelector('footer');
      if (footer) marks.push(Math.round(footer.getBoundingClientRect().top + window.scrollY));
      return marks;
    });

    for (const [i, top] of stops.entries()) {
      await page.evaluate((y) => window.scrollTo(0, y), top);
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${OUT}/${name}-${String(i).padStart(2, '0')}.png` });
    }

    await page.close();
  }
}

await browser.close();
await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2));

for (const r of report) {
  console.log(`\n=== ${r.path} @ ${r.width}px ===`);
  console.log(`page width ${r.pageScrollWidth} / viewport ${r.viewport}` + (r.scrollsHorizontally ? '  <- SCROLLS SIDEWAYS' : '  ok'));

  if (r.overflowing.length) {
    console.log('  sticking out of the viewport:');
    for (const o of r.overflowing) console.log(`    +${String(o.over).padStart(4)}px  ${o.tag}  ${o.text ? '“' + o.text + '”' : ''}`);
  }
  if (r.spilling.length) {
    console.log('  content wider than its box:');
    for (const s of r.spilling) console.log(`    +${String(s.over).padStart(4)}px  ${s.tag}  box ${s.box} content ${s.content}  ${s.text ? '“' + s.text + '”' : ''}`);
  }
  if (!r.overflowing.length && !r.spilling.length) console.log('  nothing found');
}
