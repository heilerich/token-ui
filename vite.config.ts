import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { mockApi } from './mocks/plugin';

export default defineConfig(({ mode }) => ({
	plugins: [tailwindcss(), sveltekit(), ...(mode === 'development' ? [mockApi()] : [])]
}));
