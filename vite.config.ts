import { defineConfig, loadEnv } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { federation } from '@module-federation/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')

	return {
		plugins: [
			sveltekit(),
			federation({
				name: 'igz4-host',
				remotes: {
					mlrun: {
						type: 'module',
						name: 'mlrun',
						entry: 'http://localhost:5179/remoteEntry.js',
						shareScope: 'default',
					},
				},
				shared: {
					react: { singleton: true, requiredVersion: '^18.2.0' },
					'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
				},
			}),
			viteStaticCopy({
				targets: [
					{
						src: 'node_modules/onnxruntime-web/dist/*.jsep.*',
						dest: 'wasm',
					},
				],
			}),
		],
		define: {
			APP_VERSION: JSON.stringify(process.env.npm_package_version),
			APP_BUILD_HASH: JSON.stringify(process.env.APP_BUILD_HASH || 'dev-build'),
		},
		build: {
			sourcemap: true,
		},
		worker: {
			format: 'es',
		},
		esbuild: {
			pure: process.env.ENV === 'dev' ? [] : ['console.log', 'console.debug'],
		},
		server: {
			proxy: {
				'/api': env.VITE_MLRUN_API_URL
					? {
						target: env.VITE_MLRUN_API_URL,
						changeOrigin: true,
						headers: {
							Connection: 'keep-alive',
							'x-v3io-session-key': env.VITE_MLRUN_V3IO_ACCESS_KEY,
							'x-remote-user': 'admin',
						},
					}
					: undefined,
				'/nuclio': env.VITE_NUCLIO_API_URL
					? {
						target: env.VITE_NUCLIO_API_URL,
						changeOrigin: true,
						rewrite: (path) => path.replace(/^\/nuclio/, ''),
					}
					: undefined,
				'/iguazio': env.VITE_IGUAZIO_API_URL
					? {
						target: env.VITE_IGUAZIO_API_URL,
						changeOrigin: true,
						rewrite: (path) => path.replace(/^\/iguazio/, ''),
					}
					: undefined,
				'/function-catalog': env.VITE_FUNCTION_CATALOG_URL
					? {
						target: env.VITE_FUNCTION_CATALOG_URL,
						changeOrigin: true,
						rewrite: (path) => path.replace(/^\/function-catalog/, ''),
					}
					: undefined,
			},
			fs: {
				strict: false,
			},
		},
	}
})
