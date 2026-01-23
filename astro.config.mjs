import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    output: 'server',
    adapter: cloudflare({
        imageService: 'compile',
    }),
    vite: {
        ssr: {
            external: [
                'node:crypto', 'crypto',
                'node:fs', 'fs', 'node:fs/promises', 'fs/promises',
                'node:path', 'path',
                'node:process', 'process',
                'node:stream', 'stream',
                'node:util', 'util',
                'node:events', 'events',
                'node:buffer', 'buffer',
                'node:url', 'url',
                'node:http', 'http',
                'node:https', 'https',
                'node:zlib', 'zlib',
                'node:net', 'net',
                'node:tls', 'tls',
                'node:os', 'os',
                'node:child_process', 'child_process',
                'node:timers', 'timers',
                'node:dns', 'dns',
                'async_hooks',
                'assert'
            ]
        }
    }
});
