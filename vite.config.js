import { sveltekit } from '@sveltejs/kit/vite';

const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x)

const configureProxyRequest = ({ proxy, options }) => {
	proxy.on('proxyReq', (proxyReq, req, res, options) => {
		const subdomain = req.headers.host.split('.')[0]
		const host = `${subdomain}.omegle.com`
		proxyReq.host = host
	})
	return { proxy, options }
}

const configureProxyResponse = ({ proxy, options }) => {
	proxy.on('proxyRes', (proxyRes, req, res) => {
		proxyRes.on("data", (chunk) => res.write(chunk, "binary"));
		proxyRes.on("end", () => res.end());
		proxyRes.headers["access-control-allow-origin"] = "*";
		proxyRes.statusCode && res.writeHead(proxyRes.statusCode, proxyRes.headers);
	})
	return { proxy, options }
}

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	server: {
		proxy: {
			'/status': {
				target: 'https://chatserv.omegle.com',
				changeOrigin: true,
				configure: (proxy, options) => configureProxyResponse({ proxy, options })
			},
			'/start': {
				target: 'https://front45.omegle.com',
				changeOrigin: true,
				configure: (proxy, options) => pipe(
					configureProxyRequest,
					configureProxyResponse
				)({ proxy, options })
			}
		},
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
};

export default config;
