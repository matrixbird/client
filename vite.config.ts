import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

import { exec } from 'child_process'
import { promisify } from 'util'

// Get current tag/commit and last commit date from git
const pexec = promisify(exec)
let [short, full] = (
    await Promise.allSettled([
        pexec('git rev-parse --short HEAD'),
        pexec('git rev-parse HEAD'),
    ])
).map(v => JSON.stringify(v.value?.stdout.trim()))

let link = `https://github.com/matrixbird/client/commit/${short}`
link = link.replace(/['"]+/g, '')


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    const baseServerConfig = {
        fs: {
            allow: ['..'],
        },
    };
    
    const localServerConfig = env.VITE_LOCAL_ORIGIN ? {
        host: true,
        allowedHosts: [env.VITE_ALLOWED_HOST],
        origin: env.VITE_LOCAL_ORIGIN,
        fs: {
            allow: ['..'],
        },
    } : baseServerConfig;

    return {
        plugins: [tailwindcss(), sveltekit()],
        server: localServerConfig,
        define: {
            COMMIT: full,
            LINK: JSON.stringify(link)
        },
    };
});
