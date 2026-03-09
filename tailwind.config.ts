import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Neobrutalist palette
                'neo': {
                    'black': '#0a0a0a',
                    'white': '#ffffff',
                    'cream': '#fffef5',
                    'yellow': '#fef08a',
                    'lime': '#bef264',
                    'pink': '#f9a8d4',
                    'blue': '#93c5fd',
                    'orange': '#fdba74',
                    'purple': '#c4b5fd',
                    'red': '#fca5a5',
                },
                'accent': '#fef08a',
                'bg': {
                    'primary': '#fffef5',
                    'dark': '#0a0a0a',
                }
            },
            fontFamily: {
                'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
                'body': ['Inter', 'system-ui', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                'neo': '4px 4px 0px 0px #0a0a0a',
                'neo-lg': '8px 8px 0px 0px #0a0a0a',
                'neo-xl': '12px 12px 0px 0px #0a0a0a',
                'neo-hover': '6px 6px 0px 0px #0a0a0a',
                'neo-active': '2px 2px 0px 0px #0a0a0a',
            },
            borderWidth: {
                '3': '3px',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'bounce-slow': 'bounce 3s ease-in-out infinite',
                'pulse-slow': 'pulse 4s ease-in-out infinite',
                'wiggle': 'wiggle 1s ease-in-out infinite',
                'slide-up': 'slideUp 0.6s ease-out',
                'slide-in-left': 'slideInLeft 0.6s ease-out',
                'slide-in-right': 'slideInRight 0.6s ease-out',
                'scale-in': 'scaleIn 0.4s ease-out',
                'spin-slow': 'spin 8s linear infinite',
                'marquee': 'marquee 30s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(30px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInLeft: {
                    '0%': { transform: 'translateX(-50px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(50px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' },
                }
            },
            transitionTimingFunction: {
                'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            }
        },
    },
    plugins: [],
} satisfies Config;
