/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Google Sans', 'Roboto', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                // Google Material Design Colors
                primary: '#1a73e8',      // Google Blue
                'primary-light': '#4285F4',
                secondary: '#34A853',    // Google Green
                accent: '#FBBC05',       // Google Yellow
                danger: '#EA4335',       // Google Red

                // Dynamic theme colors
                darker: 'var(--bg-main)',
                surface: 'var(--bg-surface)',
                body: 'var(--text-body)',
                borderDim: 'var(--border-color)',
                'true-black': '#000000',
            },
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(26, 115, 232, 0.3)' },
                    '100%': { boxShadow: '0 0 40px rgba(26, 115, 232, 0.5)' },
                }
            }
        }
    },
    plugins: [],
}
