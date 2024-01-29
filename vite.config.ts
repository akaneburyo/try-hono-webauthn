import pages from '@hono/vite-dev-server/cloudflare-pages';
import devServer from '@hono/vite-dev-server';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		devServer({
			entry: 'src/index.tsx',
			injectClientScript: true,
			plugins: [
				pages({
					d1Databases: ['DB'],
					d1Persist: true,
				}),
			],
		}),
	],
});
