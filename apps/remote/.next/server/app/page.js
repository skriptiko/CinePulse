(() => {
	var e = {};
	(e.id = 931),
		(e.ids = [931]),
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
			3700: (e, t, r) => {
				"use strict";
				r.r(t),
					r.d(t, {
						GlobalError: () => i.a,
						__next_app__: () => m,
						originalPathname: () => p,
						pages: () => c,
						routeModule: () => u,
						tree: () => d,
					}),
					r(3743),
					r(2826),
					r(7130);
				var s = r(9635),
					n = r(3521),
					o = r(2260),
					i = r.n(o),
					a = r(2998),
					l = {};
				for (const e in a)
					0 >
						[
							"default",
							"tree",
							"pages",
							"GlobalError",
							"originalPathname",
							"__next_app__",
							"routeModule",
						].indexOf(e) && (l[e] = () => a[e]);
				r.d(t, l);
				const d = [
						"",
						{
							children: [
								"__PAGE__",
								{},
								{
									page: [
										() => Promise.resolve().then(r.bind(r, 3743)),
										"/Users/admin/mm/CinePulse/apps/remote/src/app/page.tsx",
									],
								},
							],
						},
						{
							layout: [
								() => Promise.resolve().then(r.bind(r, 2826)),
								"/Users/admin/mm/CinePulse/apps/remote/src/app/layout.tsx",
							],
							"not-found": [
								() => Promise.resolve().then(r.t.bind(r, 7130, 23)),
								"next/dist/client/components/not-found-error",
							],
						},
					],
					c = ["/Users/admin/mm/CinePulse/apps/remote/src/app/page.tsx"],
					p = "/page",
					m = { require: r, loadChunk: () => Promise.resolve() },
					u = new s.AppPageRouteModule({
						definition: {
							kind: n.x.APP_PAGE,
							page: "/page",
							pathname: "/",
							bundlePath: "",
							filename: "",
							appPaths: [],
						},
						userland: { loaderTree: d },
					});
			},
			4691: () => {},
			7792: (e, t, r) => {
				Promise.resolve().then(r.t.bind(r, 4893, 23)),
					Promise.resolve().then(r.t.bind(r, 6208, 23)),
					Promise.resolve().then(r.t.bind(r, 8289, 23)),
					Promise.resolve().then(r.t.bind(r, 7342, 23)),
					Promise.resolve().then(r.t.bind(r, 1979, 23)),
					Promise.resolve().then(r.t.bind(r, 6991, 23));
			},
			6098: () => {},
			2826: (e, t, r) => {
				"use strict";
				r.r(t), r.d(t, { default: () => o, metadata: () => n });
				var s = r(720);
				r(5330);
				const n = { title: "Remote App", description: "Remote Microfrontend" };
				function o({ children: e }) {
					return s.jsx("html", {
						lang: "en",
						children: s.jsx("body", { children: e }),
					});
				}
			},
			3743: (e, t, r) => {
				"use strict";
				r.r(t), r.d(t, { default: () => o });
				var s = r(720);
				r(2197);
				const n = () =>
					(0, s.jsxs)("div", {
						className: "p-4 border-2 border-dashed border-blue-500 rounded-lg",
						children: [
							s.jsx("h2", {
								className: "text-xl font-bold text-blue-600",
								children: "Hello from Remote MFE!",
							}),
							s.jsx("p", {
								className: "text-gray-600",
								children:
									"This component is served from the remote application.",
							}),
						],
					});
				function o() {
					return s.jsx("main", {
						className:
							"flex min-h-screen flex-col items-center justify-between p-24",
						children: s.jsx(n, {}),
					});
				}
			},
			5330: () => {},
		});
	var t = require("../webpack-runtime.js");
	t.C(e);
	var r = (e) => t((t.s = e)),
		s = t.X(0, [752], () => r(3700));
	module.exports = s;
})();
