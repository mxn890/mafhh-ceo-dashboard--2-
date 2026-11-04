/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',      // near-black — nav, headings, primary text
        paper: '#FFFFFF',    // white — main surface
        mist: '#F4F3F0',     // warm off-white — section backgrounds
        line: '#E3E1DC',     // hairline borders/dividers
        signal: {            // the brand red — MAFHH's accent, not a generic Tailwind red
          DEFAULT: '#C8102E',
          dark: '#9C0C24',
          light: '#FBE9EB',
        },
        slate: {
          DEFAULT: '#6B6862', // warm gray — secondary text (not blue-gray)
          light: '#9B9891',
        },
        ok: '#1A7A4C',        // status green — distinct from brand red
        warn: '#B8860B',      // status amber
      },
      fontFamily: {
        display: ['var(--font-poppins)', 'sans-serif'],
        sans: ['var(--font-poppins)', 'sans-serif'],
        mono: ['var(--font-poppins)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '3px',
        lg: '4px',
      },
    },
  },
  plugins: [],
}

