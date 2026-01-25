const NextFederationPlugin = require("@module-federation/nextjs-mf");
const { FederatedTypesPlugin } = require("@module-federation/typescript");

const federationConfig = {
	name: "host",
	filename: "static/chunks/remoteEntry.js",
	remotes: {
		remote: "remote@http://localhost:3001/_next/static/chunks/remoteEntry.js",
	},
	shared: {},
	extraOptions: {
		appDir: true,
	},
};

/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack(config, options) {
		if (!options.isServer) {
			config.plugins.push(
				new NextFederationPlugin(federationConfig),
				new FederatedTypesPlugin({
					federationConfig,
				}),
			);
		}

		return config;
	},
};

module.exports = nextConfig;
