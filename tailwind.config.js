/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ember: {
          50: 'rgb(var(--ember-50) / <alpha-value>)',
          100: 'rgb(var(--ember-100) / <alpha-value>)',
          200: 'rgb(var(--ember-200) / <alpha-value>)',
          300: 'rgb(var(--ember-300) / <alpha-value>)',
          400: 'rgb(var(--ember-400) / <alpha-value>)',
          500: 'rgb(var(--ember-500) / <alpha-value>)',
          600: 'rgb(var(--ember-600) / <alpha-value>)',
          700: 'rgb(var(--ember-700) / <alpha-value>)',
          800: 'rgb(var(--ember-800) / <alpha-value>)',
          900: 'rgb(var(--ember-900) / <alpha-value>)'
        },
        ink: {
          50: 'rgb(var(--ink-50) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)'
        },
        latte: '#C89A6B',
        brass: '#C9A15A'
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      backgroundImage: {
        desk: "linear-gradient(180deg, rgba(11,10,8,0.55) 0%, rgba(11,10,8,0.82) 55%, rgba(11,10,8,0.95) 100%), var(--desk-image)"
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 50px -20px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(217,114,46,0.35), 0 0 30px -4px rgba(217,114,46,0.45)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
}
