(() => {
	var e = {};
	(e.id = 409),
		(e.ids = [409]),
		(e.modules = {
			7849: (e) => {
				"use strict";
				e.exports = require("next/dist/client/components/action-async-storage.external");
			},
			2934: (e) => {
				"use strict";
				e.exports = require("next/dist/client/components/action-async-storage.external.js");
			},
			5403: (e) => {
				"use strict";
				e.exports = require("next/dist/client/components/request-async-storage.external");
			},
			4580: (e) => {
				"use strict";
				e.exports = require("next/dist/client/components/request-async-storage.external.js");
			},
			4749: (e) => {
				"use strict";
				e.exports = require("next/dist/client/components/static-generation-async-storage.external");
			},
			5869: (e) => {
				"use strict";
				e.exports = require("next/dist/client/components/static-generation-async-storage.external.js");
			},
			399: (e) => {
				"use strict";
				e.exports = require("next/dist/compiled/next-server/app-page.runtime.prod.js");
			},
			84: (e, t, n) => {
				"use strict";
				n.r(t),
					n.d(t, {
						GlobalError: () => i.a,
						__next_app__: () => p,
						originalPathname: () => c,
						pages: () => d,
						routeModule: () => f,
						tree: () => l,
					}),
					n(881),
					n(7130),
					n(2826);
				var r = n(9635),
					o = n(3521),
					s = n(2260),
					i = n.n(s),
					u = n(2998),
					a = {};
				for (const e in u)
					0 >
						[
							"default",
							"tree",
							"pages",
							"GlobalError",
							"originalPathname",
							"__next_app__",
							"routeModule",
						].indexOf(e) && (a[e] = () => u[e]);
				n.d(t, a);
				const l = [
						"",
						{
							children: [
								"/_not-found",
								{
									children: [
										"__PAGE__",
										{},
										{
											page: [
												() => Promise.resolve().then(n.t.bind(n, 7130, 23)),
												"next/dist/client/components/not-found-error",
											],
										},
									],
								},
								{},
							],
						},
						{
							layout: [
								() => Promise.resolve().then(n.bind(n, 2826)),
								"/Users/admin/mm/CinePulse/apps/remote/src/app/layout.tsx",
							],
							"not-found": [
								() => Promise.resolve().then(n.t.bind(n, 7130, 23)),
								"next/dist/client/components/not-found-error",
							],
						},
					],
					d = [],
					c = "/_not-found/page",
					p = { require: n, loadChunk: () => Promise.resolve() },
					f = new r.AppPageRouteModule({
						definition: {
							kind: o.x.APP_PAGE,
							page: "/_not-found/page",
							pathname: "/_not-found",
							bundlePath: "",
							filename: "",
							appPaths: [],
						},
						userland: { loaderTree: l },
					});
			},
			4691: () => {},
			7792: (e, t, n) => {
				Promise.resolve().then(n.t.bind(n, 4893, 23)),
					Promise.resolve().then(n.t.bind(n, 6208, 23)),
					Promise.resolve().then(n.t.bind(n, 8289, 23)),
					Promise.resolve().then(n.t.bind(n, 7342, 23)),
					Promise.resolve().then(n.t.bind(n, 1979, 23)),
					Promise.resolve().then(n.t.bind(n, 6991, 23));
			},
			2826: (e, t, n) => {
				"use strict";
				n.r(t), n.d(t, { default: () => s, metadata: () => o });
				var r = n(720);
				n(5330);
				const o = { title: "Remote App", description: "Remote Microfrontend" };
				function s({ children: e }) {
					return r.jsx("html", {
						lang: "en",
						children: r.jsx("body", { children: e }),
					});
				}
			},
			998: (e, t) => {
				"use strict";
				Object.defineProperty(t, "__esModule", { value: !0 }),
					((e, t) => {
						for (var n in t)
							Object.defineProperty(e, n, { enumerable: !0, get: t[n] });
					})(t, { isNotFoundError: () => o, notFound: () => r });
				const n = "NEXT_NOT_FOUND";
				function r() {
					const e = Error(n);
					throw ((e.digest = n), e);
				}
				function o(e) {
					return (
						"object" == typeof e &&
						null !== e &&
						"digest" in e &&
						e.digest === n
					);
				}
				("function" == typeof t.default ||
					("object" == typeof t.default && null !== t.default)) &&
					void 0 === t.default.__esModule &&
					(Object.defineProperty(t.default, "__esModule", { value: !0 }),
					Object.assign(t.default, t),
					(e.exports = t.default));
			},
			881: (e, t, n) => {
				"use strict";
				Object.defineProperty(t, "__esModule", { value: !0 }),
					((e, t) => {
						for (var n in t)
							Object.defineProperty(e, n, { enumerable: !0, get: t[n] });
					})(t, { PARALLEL_ROUTE_DEFAULT_PATH: () => o, default: () => s });
				const r = n(998),
					o = "next/dist/client/components/parallel-route-default.js";
				function s() {
					(0, r.notFound)();
				}
				("function" == typeof t.default ||
					("object" == typeof t.default && null !== t.default)) &&
					void 0 === t.default.__esModule &&
					(Object.defineProperty(t.default, "__esModule", { value: !0 }),
					Object.assign(t.default, t),
					(e.exports = t.default));
			},
			5330: () => {},
		});
	var t = require("../../webpack-runtime.js");
	t.C(e);
	var n = (e) => t((t.s = e)),
		r = t.X(0, [752], () => n(84));
	module.exports = r;
})();
