import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            fontSize: {
                md: '0.9375rem',
            },
            colors: {
                'primary': 'var(--primary)',
                'secondary': 'var(--secondary)',
                'light': 'var(--light)',
                'bg': 'var(--bg)',
                'background': 'var(--background)',
                'border': 'var(--border)',
                'container': 'var(--container)',
                'logo': 'var(--logo)',
                'switcher': 'var(--switcher)',
                'sidebar': 'var(--sidebar)',
                'view': 'var(--view)',
                'mask': 'var(--mask)',
                'bird': {
                    50: 'var(--bird-50)',
                    100: 'var(--bird-100)',
                    200: 'var(--bird-200)',
                    300: 'var(--bird-300)',
                    400: 'var(--bird-400)',
                    500: 'var(--bird-500)',
                    600: 'var(--bird-600)',
                    700: 'var(--bird-700)',
                    800: 'var(--bird-800)',
                    900: 'var(--bird-900)',
                    950: 'var(--bird-950)',
                },
            }

        }
    },

    plugins: []
} satisfies Config;
