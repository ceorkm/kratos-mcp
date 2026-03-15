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
        'kratos-border': '#333333',
        'kratos-text': '#f5f5f5',
        'kratos-muted': '#828282',
        'kratos-copper': '#d07a54',
        'kratos-gold': '#bda96d',
        'kratos-sage': '#96a665',
        'kratos-teal': '#6691a3',
      },
      fontFamily: {
        'serif': ['Playfair Display', 'Georgia', 'serif'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
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
