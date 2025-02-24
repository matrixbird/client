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
                'background': 'var(--background)',
                'border': 'var(--border)',
                'container': 'var(--container)',
                'logo': 'var(--logo)',
                'switcher': 'var(--switcher)',
                'sidebar': 'var(--sidebar)',
                'view': 'var(--view)',
                'shade': {
                    1: 'var(--shade-1)',
                    2: 'var(--shade-2)',
                    3: 'var(--shade-3)',
                    4: 'var(--shade-4)',
                    5: 'var(--shade-5)',
                    6: 'var(--shade-6)',
                    7: 'var(--shade-7)',
                    8: 'var(--shade-8)',
                    9: 'var(--shade-9)',
                    10: 'var(--shade-10)',
                },
            }

        }
    },

    plugins: []
} satisfies Config;
