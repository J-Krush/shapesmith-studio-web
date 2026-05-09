// vite.config.js
// Source: https://vite.dev/config/, vitejs/vite#3448, https://vitest.dev/guide/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	build: {
		outDir: 'build',
	},
	esbuild: {
		loader: 'jsx',
		include: /src\/.*\.jsx?$/,
		exclude: [],
	},
	optimizeDeps: {
		esbuildOptions: {
			loader: { '.js': 'jsx' },
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.js',
		include: [
			'src/**/*.{test,spec}.{js,jsx}',
			// Plan 05-07: Snipcart order webhook formatter unit test lives next to
			// the Function under netlify/functions/**/__tests__/ so the helper and
			// its test stay colocated. Vitest needs an explicit glob to reach
			// outside src/.
			'netlify/functions/**/__tests__/*.{test,spec}.{js,jsx}',
		],
	},
});
