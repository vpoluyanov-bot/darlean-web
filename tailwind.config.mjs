/**
 * Every value here points at a CSS custom property defined in
 * src/styles/tokens/*.css — those files are copied verbatim from the
 * Darlean Dark design system and are the single source of truth.
 *
 * Never write a raw colour, size or radius in markup. If a value is
 * missing, add the token upstream first, then expose it here.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--surface-page)',
        card: 'var(--surface-card)',
        elevated: 'var(--surface-elevated)',

        // --text-display is pure white; mapping it onto Tailwind's built-in
        // `white` keeps `text-display` free for the display *type* scale.
        white: 'var(--text-display)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',

        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
          deep: 'var(--accent-deep)',
        },

        hairline: 'var(--border-hairline)',
        control: 'var(--border-control)',
        glass: 'var(--glass-bg)',

        // Light sections and per-agent hues — see src/styles/tokens/site.css.
        light: {
          DEFAULT: 'var(--surface-light)',
          card: 'var(--surface-light-card)',
          tint: 'var(--surface-light-tint)',
        },
        'on-light': {
          DEFAULT: 'var(--text-on-light)',
          body: 'var(--text-on-light-body)',
          secondary: 'var(--text-on-light-secondary)',
        },
        wash: {
          DEFAULT: 'var(--accent-wash)',
          strong: 'var(--accent-wash-strong)',
          pill: 'var(--accent-wash-pill)',
        },
        nav: 'var(--border-nav)',
        highlight: 'var(--border-highlight)',
        chip: 'var(--border-chip)',
        'chip-strong': 'var(--border-chip-strong)',
        inactive: 'var(--surface-inactive)',
        bar: {
          DEFAULT: 'var(--accent-bar)',
          strong: 'var(--accent-bar-strong)',
        },
        agent: {
          task: 'var(--agent-task)',
          'task-name': 'var(--agent-task-name)',
          'task-wash': 'var(--agent-task-wash)',
          report: 'var(--agent-report)',
          'report-name': 'var(--agent-report-name)',
          'report-wash': 'var(--agent-report-wash)',
          expense: 'var(--agent-expense)',
          'expense-name': 'var(--agent-expense-name)',
          'expense-wash': 'var(--agent-expense-wash)',
          secretary: 'var(--agent-secretary)',
          'secretary-name': 'var(--agent-secretary-name)',
          'secretary-wash': 'var(--agent-secretary-wash)',
        },
      },

      fontFamily: {
        sans: 'var(--font-sans)',
        rounded: 'var(--font-rounded)',
      },

      fontWeight: {
        regular: 'var(--weight-regular)',
        medium: 'var(--weight-medium)',
        semibold: 'var(--weight-semibold)',
      },

      // [size, { lineHeight, letterSpacing }] — one class sets all three.
      fontSize: {
        display: [
          'var(--text-display-size)',
          { lineHeight: 'var(--text-display-lh)', letterSpacing: 'var(--text-display-track)' },
        ],
        h1: [
          'var(--text-h1-size)',
          { lineHeight: 'var(--text-h1-lh)', letterSpacing: 'var(--text-h1-track)' },
        ],
        h2: [
          'var(--text-h2-size)',
          { lineHeight: 'var(--text-h2-lh)', letterSpacing: 'var(--text-h2-track)' },
        ],
        h3: [
          'var(--text-h3-size)',
          { lineHeight: 'var(--text-h3-lh)', letterSpacing: 'var(--text-h3-track)' },
        ],
        lead: ['var(--text-lead-size)', { lineHeight: 'var(--text-lead-lh)' }],
        body: ['var(--text-body-size)', { lineHeight: 'var(--text-body-lh)' }],
        caption: ['var(--text-caption-size)', { lineHeight: 'var(--text-caption-lh)' }],
        price: ['var(--text-price-size)', { lineHeight: '1', letterSpacing: 'var(--text-h1-track)' }],
      },

      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
        30: 'var(--space-30)',
        40: 'var(--space-40)',
        section: 'var(--section-pad-desktop)',
        'section-sm': 'var(--section-pad-mobile)',
      },

      maxWidth: {
        content: 'var(--width-content)',
        bleed: 'var(--width-bleed)',
        measure: 'var(--measure-body)',
        site: 'var(--width-site)',
        plans: 'var(--width-plans)',
        prose: 'var(--width-prose)',
      },

      height: {
        nav: 'var(--height-nav)',
      },

      borderRadius: {
        small: 'var(--radius-small)',
        input: 'var(--radius-input)',
        card: 'var(--radius-card)',
        panel: 'var(--radius-panel)',
        pill: 'var(--radius-pill)',
        frame: 'var(--radius-frame)',
        phone: 'var(--radius-phone)',
        'phone-inner': 'var(--radius-phone-inner)',
        tile: 'var(--radius-tile)',
        field: 'var(--radius-field)',
      },

      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },

      transitionTimingFunction: {
        brand: 'var(--ease)',
      },

      backgroundImage: {
        headline: 'var(--gradient-headline)',
        role: 'var(--gradient-role)',
        'agent-task-card': 'var(--agent-task-card)',
      },

      backdropBlur: {
        glass: '24px',
      },
    },
  },
  plugins: [],
};
