import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    output: 'server',
    adapter: cloudflare({
        imageService: 'compile',
    }),
    vite: {
        ssr: {
            external: ['node:crypto', 'crypto']
        }
    }
});
