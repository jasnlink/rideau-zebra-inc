/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./**/*.{html,js,liquid,json}"],
    theme: {
      fontFamily: {
        'sans': ['Archivo', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Ubuntu', 'sans-serif'],
        'serif': ['STIXTwoText', 'Georgia', 'Times New Roman', 'serif'],
      },
      // Standardized border radius scale
      borderRadius: {
        'none': '0',
        'sm':   '0.25rem',   // 4px  — small pills, badges
        'DEFAULT': '0.375rem', // 6px — default (md)
        'md':   '0.375rem',   // 6px  — buttons, cards, inputs, images
        'lg':   '0.5rem',     // 8px  — reserved for modals/drawers
        'full': '9999px',     // circle — icon buttons, avatars
      },
      extend: {
        aspectRatio: {
          '4x3': '4 / 3',
          '3x4': '3 / 4',
        },
        // Standardized font size scale
        fontSize: {
          'xs':   ['0.75rem',   { lineHeight: '1rem' }],      // 12px — badges, captions
          'sm':   ['0.875rem',  { lineHeight: '1.25rem' }],    // 14px — labels, small buttons
          'base': ['1rem',      { lineHeight: '1.5rem' }],     // 16px — body text
          'lg':   ['1.125rem',  { lineHeight: '1.75rem' }],    // 18px — nav, UI text
          'xl':   ['1.25rem',   { lineHeight: '1.75rem' }],    // 20px — sub-headings
          '2xl':  ['1.5rem',    { lineHeight: '2rem' }],       // 24px — h4, card titles
          '3xl':  ['1.875rem',  { lineHeight: '2.25rem' }],    // 30px — h3
          '4xl':  ['2.25rem',   { lineHeight: '2.5rem' }],     // 36px — h2, section titles
          '5xl':  ['3rem',      { lineHeight: '1.15' }],       // 48px — h1
          '6xl':  ['3.75rem',   { lineHeight: '1.1' }],        // 60px — hero (responsive)
          '8xl':  ['6rem',      { lineHeight: '1' }],          // 96px — hero desktop
        },
        // Standardized letter spacing
        letterSpacing: {
          'tighter':  '-0.05em',
          'tight':    '-0.025em',
          'normal':   '0em',
          'wide':     '0.025em',
          'wider':    '0.05em',
          'widest':   '0.1em',
        },
        colors: {
          // Brand accent (primary actions, highlights, selected states)
          brand: {
            50:  '#eef2ff',   // partner sections, very light surfaces
            100: '#e0e7ff',   // info badge backgrounds
            200: '#c7d2fe',   // checked/selected backgrounds
            300: '#a5b4fc',   // hover borders, focus rings
            500: '#6366f1',   // CTA hover, checkmark icons
            600: '#4f46e5',   // PRIMARY: buttons, badges, announcement bar
            700: '#4338ca',   // footer bar, subscribe hover
            800: '#3730a3',   // highlight badges (shipping)
          },
          // Content (text, icons, dark surfaces, borders)
          content: {
            DEFAULT:   '#1c1917',   // primary text, dark buttons, footer bg, icons
            secondary: '#44403c',   // secondary text, muted icons
            tertiary:  '#a8a29e',   // dividers, section borders
            subtle:    '#d6d3d1',   // inactive borders, feature card bg
            light:     '#e7e5e3',   // form/card borders, placeholder bg
            inverse:   '#f5f5f5',   // text on dark backgrounds
          },
          // Surface (page backgrounds, cards, overlays)
          surface: {
            50:    '#fafafa',   // subtle hover backgrounds
            100:   '#f5f5f5',   // page background
            200:   '#e5e5e5',   // raised surfaces, filter cards
            300:   '#d4d4d4',   // hover on raised surfaces
            800:   '#262626',   // detail table text on light bg
            white: '#ffffff',   // forms, inputs, drawers, popovers
          },
          // Trust (security, stock status, success indicators)
          trust: {
            100: '#dcfce7',   // security popover background
            200: '#bbf7d0',   // badge hover
            300: '#86efac',   // SSL badge, security default
            400: '#4ade80',   // stock icons, badge active, verified
            500: '#22c55e',   // verify security button
            600: '#16a34a',   // verify button active
            700: '#15803d',   // shipping tag text/border
            800: '#166534',   // security popover text
          },
          // Danger (errors, out-of-stock)
          danger: {
            DEFAULT: '#ef4444',   // out-of-stock indicator
          },
        },
      },
      container: {
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '2rem',
          xl: '2rem',
          '2xl': '2rem',
        },
      },
    },
    plugins: [],
  }
