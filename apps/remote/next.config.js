const NextFederationPlugin = require("@module-federation/nextjs-mf");
const { FederatedTypesPlugin } = require("@module-federation/typescript");

const federationConfig = {
	name: "remote",
	filename: "static/chunks/remoteEntry.js",
	exposes: {
		"./Hello": "./src/components/Hello.tsx",
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
