import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { mockApi } from './mocks/plugin';

export default defineConfig(({ mode }) => ({
	base: process.env.BASE_PATH || '/',
	plugins: [tailwindcss(), svelte(), ...(mode === 'development' ? [mockApi()] : [])],
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url))
		}
	}
}));
