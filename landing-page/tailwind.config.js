/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kratos-dark': '#0a0a0a',
        'kratos-surface': '#171717',
        'kratos-card': '#262626',
        'kratos-card-light': '#262626',
        'kratos-border': '#262626',
        'kratos-border-light': '#333333',
        'kratos-text': '#f5f5f5',
        'kratos-muted': '#828282',
        'kratos-dim': '#a1a1a1',
        'kratos-sage': '#96a665',
        'kratos-gold': '#bda96d',
        'kratos-teal': '#6691a3',
      },
      fontFamily: {
        'serif': ['Hedvig Letters Serif', 'Playfair Display', 'Georgia', 'serif'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'mono': ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        'serif-tight': '-1px',
      },
      borderRadius: {
        'kero': '20px',
        'kero-sm': '16px',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
