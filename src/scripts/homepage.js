/**
 * Scroll choreography for the homepage.
 *
 * Two sections are taller than the viewport on purpose and pin their contents:
 * the AI assistant section (900vh) and the by-role carousel (520vh). Scroll
 * position inside them drives the sequence directly — nothing animates on its
 * own, so the motion always matches the reader's own scrolling.
 *
 * Video is fetched late. Every clip outside the hero ships with its URLs in
 * `data-src`, and they are only moved onto the element once the slot comes
 * within two screens. Opening the page therefore costs the hero clip and
 * nothing else.
 */

import { cue, cardIn, cardOut } from '../lib/ai-timeline.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The two pinned sequences exist only on wide screens. Below this width the
 * markup lays the same content out as ordinary blocks, and the script must
 * keep its hands off — an inline style left over from a wider window would
 * otherwise hide content that is meant to be simply visible.
 */
const DESKTOP = window.matchMedia('(min-width: 768px)');

/** Maps `value` onto [0, 1] across a [start, end] cue from the timeline. */
const ease = (value, [from, to]) => Math.min(1, Math.max(0, (value - from) / (to - from)));

/* -- Fetching video on approach ------------------------------------------ */

/** Moves the real URLs onto a slot and starts fetching it. Runs once per video. */
function hydrate(video) {
  if (video.dataset.hydrated) return;
  video.dataset.hydrated = '1';

  if (video.dataset.poster) video.poster = video.dataset.poster;

  for (const source of video.querySelectorAll('source[data-src]')) {
    source.src = source.dataset.src;
    source.removeAttribute('data-src');
  }

  video.preload = 'auto';
  video.load();
}

// Two screens of warning is enough for the clip to be ready when it arrives.
const fetchWhenNear = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      hydrate(entry.target);
      fetchWhenNear.unobserve(entry.target);
    }
  },
  { rootMargin: '200% 0px' }
);

for (const video of document.querySelectorAll('[data-lazy-video]')) {
  fetchWhenNear.observe(video);
}

/* -- Playing only what is on screen -------------------------------------- */

/** Plays only if the clip is still on screen and has something to show. */
function tryPlay(video) {
  if (REDUCED || !video.dataset.onScreen) return;
  video.muted = true;
  video.play().catch(() => {});
}

/** Feature clips rest for a beat between runs, the way the comp does. */
function initPlayback(video) {
  if (video.dataset.playbackInit) return;
  video.dataset.playbackInit = '1';

  // hydrate() calls load(), which cancels any play() issued in the same tick —
  // so the first play has to wait until there are frames to show.
  video.addEventListener('loadeddata', () => tryPlay(video));

  video.addEventListener('ended', () =>
    setTimeout(() => {
      video.currentTime = 0;
      tryPlay(video);
    }, 2000)
  );
}

/**
 * The agent clips belong to the pinned sequence on a wide screen — it decides
 * when each one starts. With no sequence to run, they play like any other clip
 * that comes into view.
 */
function ownedByTheSequence(video) {
  return video.matches('[data-agent-video]') && DESKTOP.matches;
}

const playWhenVisible = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const video = entry.target;
      if (ownedByTheSequence(video)) continue;

      if (entry.isIntersecting) {
        video.dataset.onScreen = '1';
        if (REDUCED) continue;
        initPlayback(video);
        hydrate(video);
        tryPlay(video);
      } else {
        delete video.dataset.onScreen;
        video.pause();
      }
    }
  },
  { threshold: 0.5 }
);

for (const video of document.querySelectorAll(
  '[id^="stack-media-"] video, [data-ai-sphere] video, [data-agent-video]'
)) {
  playWhenVisible.observe(video);
}

/* -- Hero: laptop video plays, then the phone slides in ------------------- */

function initHero() {
  const main = document.querySelector('[data-hero-main]');
  const phone = document.querySelector('[data-hero-phone-video]');
  const frame = document.querySelector('[data-hero-frame]');
  const phoneWrap = document.querySelector('[data-hero-phone]');
  if (!main || !phone || REDUCED) return;

  main.muted = true;
  phone.muted = true;

  let revealed = false;

  const reveal = () => {
    if (revealed) return;
    revealed = true;

    if (frame) frame.style.transform = 'translateX(-28px)';
    if (phoneWrap) {
      phoneWrap.style.opacity = '1';
      phoneWrap.style.transform = 'none';
    }

    phone.currentTime = 0;
    phone.play().catch(() => {});
  };

  const restart = () => {
    revealed = false;

    if (phoneWrap) {
      phoneWrap.style.opacity = '0';
      phoneWrap.style.transform = 'translateY(16px)';
    }
    if (frame) frame.style.transform = 'none';

    main.currentTime = 0;
    main.play().catch(() => {});
  };

  main.addEventListener('ended', reveal);
  // Fallback for browsers that never fire `ended`.
  main.addEventListener('play', () => setTimeout(() => reveal(), 9000), { once: true });
  phone.addEventListener('ended', () => setTimeout(restart, 4000));

  main.play().catch(() => {});
}

/* -- By role: vertical scroll drives a horizontal track ------------------- */

function updateRoles() {
  const track = document.querySelector('[data-roles-track]');
  if (!track) return;

  if (!DESKTOP.matches) {
    // The deck is a native swipe carousel here; drop any leftover offset.
    track.style.transform = '';
    return;
  }

  const section = document.querySelector('[data-roles-section]');
  if (!section) return;

  const box = section.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, -box.top / (box.height - window.innerHeight)));
  const distance = Math.max(0, track.scrollWidth - window.innerWidth);

  track.style.transform = `translateX(${-progress * distance}px)`;
}

/* -- AI assistant: intro, then the agent cards deal themselves out -------- */

let introShown = false;

/** Hands every element the sequence touches back to the stylesheet. */
function releaseAi() {
  const touched = [
    ...document.querySelectorAll('[data-ai-reveal], [data-agent-card], [data-agent-chip]'),
    document.querySelector('[data-ai-intro]'),
    document.querySelector('[data-ai-agents-title]'),
    document.querySelector('[data-ai-sphere]'),
  ];

  for (const el of touched) {
    if (!el) continue;
    el.style.removeProperty('opacity');
    el.style.removeProperty('transform');
    el.style.removeProperty('transition');
    el.style.removeProperty('filter');
    el.style.removeProperty('pointer-events');
  }

  introShown = false;
}

function updateAi() {
  const section = document.querySelector('[data-ai-section]');
  if (!section) return;

  if (!DESKTOP.matches) {
    if (introShown) releaseAi();
    return;
  }

  const box = section.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, -box.top / (box.height - window.innerHeight)));

  const reveals = [...document.querySelectorAll('[data-ai-reveal]')];
  const sphere = document.querySelector('[data-ai-sphere]');
  const delays = [0, 140, 300, 390, 480];
  const offsets = [28, 28, 48, 48, 48];

  // The intro plays the moment the section reaches the screen, so the first
  // thing the reader does inside it is already the second step, not the first.
  if (box.top < window.innerHeight * 0.9 && !introShown) {
    introShown = true;

    reveals.forEach((el, i) => {
      const delay = delays[i] ?? 0;
      el.style.transition =
        `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms,` +
        `transform 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`;
      el.style.opacity = '1';
      el.style.transform = 'none';
    });

    if (sphere) {
      sphere.style.transition = 'filter 900ms ease, opacity 900ms ease';
      sphere.style.filter = 'blur(18px)';
      sphere.style.opacity = '0.45';
    }
  }

  if (box.top > window.innerHeight * 1.1 && introShown) {
    introShown = false;

    reveals.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = `translateY(${offsets[i] ?? 28}px)`;
    });

    if (sphere) {
      sphere.style.filter = 'none';
      sphere.style.opacity = '1';
    }
  }

  // The intro block fades out before the agents title arrives.
  const intro = document.querySelector('[data-ai-intro]');
  const introOut = ease(progress, cue.introOut);
  if (intro) {
    intro.style.opacity = String(1 - introOut);
    intro.style.pointerEvents = introOut > 0.5 ? 'none' : '';
  }

  // The agents title rises, shrinks and hands over to the cards.
  const title = document.querySelector('[data-ai-agents-title]');
  if (title) {
    const titleIn = ease(progress, cue.titleIn);
    const titleUp = ease(progress, cue.titleUp);
    const lift = 36 * (1 - titleIn) - titleUp * (window.innerHeight * 0.44);

    title.style.opacity = String(titleIn);
    title.style.transform = `translateY(${lift}px) scale(${1 - 0.55 * titleUp})`;
  }

  const cards = document.querySelectorAll('[data-agent-card]');
  cards.forEach((card, i) => {
    const arriving = ease(progress, cardIn[i]);
    // The last agent stays expanded rather than shrinking into a chip.
    const leaving = cardOut[i] ? ease(progress, cardOut[i]) : 0;

    if (arriving > 0 && !card.dataset.played) {
      card.dataset.played = '1';
      for (const video of card.querySelectorAll('[data-agent-video]')) {
        if (REDUCED) continue;
        video.dataset.onScreen = '1';
        initPlayback(video);
        hydrate(video);
        tryPlay(video);
      }
    }

    card.style.opacity = String(arriving * (1 - leaving));
    card.style.transform =
      `translateY(${56 * (1 - arriving) - 24 * leaving}px) scale(${1 - 0.18 * leaving})`;

    const chip = document.querySelector(`[data-agent-chip="${i}"]`);
    if (chip) chip.style.opacity = String(leaving);
  });
}

/* -- Wiring -------------------------------------------------------------- */

function onScroll() {
  updateRoles();
  updateAi();
}

initHero();
onScroll();

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });

// Crossing the breakpoint changes who owns these styles, so re-evaluate.
DESKTOP.addEventListener('change', () => {
  releaseAi();
  // Ownership of the agent clips changes with the breakpoint.
  for (const video of document.querySelectorAll('[data-agent-video]')) {
    if (DESKTOP.matches) video.pause();
    else tryPlay(video);
  }
  onScroll();
});
