/**
 * The scroll timeline for the AI assistant section.
 *
 * The section pins its contents and lets scroll position play the sequence, so
 * its height is not a design choice — it is the sum of its steps. This table is
 * the single source of truth: the component reads it to set the height, the
 * script reads it to drive the animation. Change a beat here and both follow.
 *
 * One BEAT is the scroll a reader spends on a single visual change — a bit
 * under a quarter of a screen, which is one gesture on a trackpad. Steps that
 * move further get more; steps that only hold still get less.
 *
 * This is the one knob worth turning. At 22vh the whole sequence fits in just
 * under 400vh; raising it stretches every step evenly and never reintroduces a
 * gap, because the steps are laid end to end.
 */

export const BEAT_VH = 22;

/** The pinned frame itself always costs one viewport on top of the scrolling. */
export const PINNED_VH = 100;

const STEPS = [
  // The intro has already animated in on approach; this is reading time.
  ['introHold', 1],
  ['introOut', 1],
  ['titleIn', 1],
  // The title travels up and scales down — the largest single move.
  ['titleUp', 1.5],

  ['card0In', 1],
  ['card0Hold', 0.4],
  ['card0Out', 0.8],

  ['card1In', 1],
  ['card1Hold', 0.4],
  ['card1Out', 0.8],

  ['card2In', 1],
  ['card2Hold', 0.4],
  ['card2Out', 0.8],

  // The last agent arrives and stays; the rest keeps it still before release.
  ['card3In', 1],
  ['rest', 1.5],
];

const TOTAL_BEATS = STEPS.reduce((sum, [, beats]) => sum + beats, 0);

export const SCROLL_VH = Math.round(TOTAL_BEATS * BEAT_VH);
export const SECTION_VH = SCROLL_VH + PINNED_VH;

/**
 * Each step as a [start, end] pair of progress through the scrollable range,
 * laid end to end so there is never a stretch where nothing is happening.
 */
export const cue = {};

let elapsed = 0;
for (const [name, beats] of STEPS) {
  const start = elapsed / TOTAL_BEATS;
  elapsed += beats;
  cue[name] = [start, elapsed / TOTAL_BEATS];
}

/** Per-agent cues, in the order the cards appear. */
export const cardIn = [cue.card0In, cue.card1In, cue.card2In, cue.card3In];
export const cardOut = [cue.card0Out, cue.card1Out, cue.card2Out, null];
