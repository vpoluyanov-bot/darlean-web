/**
 * Rebuilds public/media from the original Claude Design export.
 *
 *   node scripts/encode-media.mjs "/path/to/Darvis export"
 *
 * Requires ffmpeg and cwebp (brew install ffmpeg webp). Homebrew's ffmpeg is
 * built without the libwebp encoder, so WebP goes through cwebp instead.
 *
 * Each clip is produced twice: AV1 in WebM as the primary and H.264 in MP4 as
 * the fallback, plus a WebP poster frame. Target resolutions are twice the size
 * the element actually occupies on a 1440px-wide desktop, which is what a
 * retina screen can resolve — anything beyond that is bytes nobody sees.
 *
 * The CRF pair was picked by measurement, not by feel: on this footage AV1 at
 * CRF 40 scores a higher SSIM than x264 at CRF 25 while being about 45%
 * smaller, and a frame-by-frame look at small UI text shows no visible loss.
 *
 * The source clips carry no audio track; `-an` makes sure none is invented.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, stat, rm } from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);

const SRC = process.argv[2];
if (!SRC) {
  console.error('usage: node scripts/encode-media.mjs "<path to design export>"');
  process.exit(1);
}

const OUT = 'public/media';

/** displayed: CSS px the element occupies at 1440px wide, so target = 2x that. */
const CLIPS = [
  { out: 'hero-main',           src: 'assets/hero-main-v2.mp4',                  width: 1920, displayed: 1000 },
  { out: 'hero-notifications',  src: 'assets/hero-notifications-v2.mp4',         width: 1080, displayed: 491 },
  { out: 'feature-projects',    src: 'uploads/Раскрытие проекта (1).mp4',        width: 1152, displayed: 558 },
  { out: 'feature-requests',    src: 'uploads/Процесс заявки (1).mp4',           width: 1152, displayed: 558 },
  { out: 'feature-org-chart',   src: 'uploads/Оргструктура анимация (1).mp4',    width: 1152, displayed: 558 },
  { out: 'feature-meetings',    src: 'uploads/Meeting Flow (1).mp4',             width: 1152, displayed: 558 },
  // The agent clips use their own still as the poster, so they need no frame grab.
  { out: 'agent-task',          src: 'assets/agent-task.mp4',                    width: 960,  displayed: 475, poster: false },
  { out: 'agent-report',        src: 'assets/agent-report.mp4',                  width: 960,  displayed: 475, poster: false },
  { out: 'agent-expense',       src: 'assets/agent-expense.mp4',                 width: 960,  displayed: 475, poster: false },
  { out: 'agent-secretary',     src: 'assets/agent-secretary.mp4',               width: 960,  displayed: 475, poster: false },
];

/** Agent stills double as the video posters and as the little chips. */
const STILLS = [
  { out: 'agent-task',      src: 'assets/agent-task.png' },
  { out: 'agent-report',    src: 'assets/_report_frame.png' },
  { out: 'agent-expense',   src: 'assets/_expense_frame.png' },
  { out: 'agent-secretary', src: 'assets/_secretary_frame.png' },
];
const STILL_WIDTH = 512;

const ff = (args) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
const scale = (w) => `scale=${w}:-2:flags=lanczos`;

/** ffmpeg writes a PNG, cwebp turns it into WebP, the PNG is thrown away. */
async function webp(pngPath, outPath, quality) {
  await run('cwebp', ['-quiet', '-q', String(quality), pngPath, '-o', outPath]);
  await rm(pngPath, { force: true });
}

async function size(p) {
  try {
    return (await stat(p)).size;
  } catch {
    return 0;
  }
}

const mb = (n) => (n / 1e6).toFixed(2) + 'M';

await mkdir(OUT, { recursive: true });

const report = [];

for (const clip of CLIPS) {
  const input = path.join(SRC, clip.src);
  const before = await size(input);

  // AV1 — the primary.
  await ff([
    '-i', input,
    '-an',
    '-vf', scale(clip.width),
    '-c:v', 'libsvtav1',
    '-crf', '40',
    '-preset', '4',
    '-svtav1-params', 'tune=0',
    '-pix_fmt', 'yuv420p',
    `${OUT}/${clip.out}.webm`,
  ]);

  // H.264 — the fallback for Safari before 17.4 and older hardware.
  await ff([
    '-i', input,
    '-an',
    '-vf', scale(clip.width),
    '-c:v', 'libx264',
    '-crf', '25',
    '-preset', 'slow',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    `${OUT}/${clip.out}.mp4`,
  ]);

  // Poster: a frame from just inside the clip, so it is never a blank first frame.
  // It only has to hold the eye for a moment, so it is capped at 1280px.
  if (clip.poster !== false) {
    const posterWidth = Math.min(Math.round(clip.displayed * 2), 1280);
    const posterTmp = `${OUT}/${clip.out}-poster.png`;
    await ff(['-ss', '0.5', '-i', input, '-frames:v', '1', '-vf', scale(posterWidth), posterTmp]);
    await webp(posterTmp, `${OUT}/${clip.out}-poster.webp`, 78);
  }

  report.push({
    name: clip.out,
    before,
    webm: await size(`${OUT}/${clip.out}.webm`),
    mp4: await size(`${OUT}/${clip.out}.mp4`),
    poster: await size(`${OUT}/${clip.out}-poster.webp`),
  });

  console.log(`${clip.out} done`);
}

for (const still of STILLS) {
  const input = path.join(SRC, still.src);
  const before = await size(input);

  // The PNG fallback is kept, but no larger than it needs to be.
  await ff(['-i', input, '-vf', scale(STILL_WIDTH), `${OUT}/${still.out}.png`]);
  await run('cwebp', ['-quiet', '-q', '82', `${OUT}/${still.out}.png`, '-o', `${OUT}/${still.out}.webp`]);

  report.push({
    name: still.out + ' (still)',
    before,
    webm: 0,
    mp4: await size(`${OUT}/${still.out}.png`),
    poster: await size(`${OUT}/${still.out}.webp`),
  });

  console.log(`${still.out} still done`);
}

console.log(`\n${'asset'.padEnd(24)} ${'source'.padStart(8)} ${'av1/webp'.padStart(9)} ${'h264/png'.padStart(9)} ${'poster'.padStart(8)}`);
let before = 0;
let after = 0;
for (const r of report) {
  before += r.before;
  after += r.webm + r.mp4 + r.poster;
  console.log(
    `${r.name.padEnd(24)} ${mb(r.before).padStart(8)} ${mb(r.webm || r.poster).padStart(9)} ` +
      `${mb(r.mp4).padStart(9)} ${(r.webm ? mb(r.poster) : '—').padStart(8)}`
  );
}
console.log(`\ntotal ${mb(before)} -> ${mb(after)} (${Math.round((1 - after / before) * 100)}% smaller)`);
