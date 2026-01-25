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
			2831: (e, t, r) => {
				"use strict";
				r.r(t),
					r.d(t, {
						GlobalError: () => l.a,
						__next_app__: () => p,
						originalPathname: () => c,
						pages: () => u,
						routeModule: () => m,
						tree: () => d,
					}),
					r(6545),
					r(2826),
					r(7130);
				var n = r(9635),
					s = r(3521),
					o = r(2260),
					l = r.n(o),
					a = r(2998),
					i = {};
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
						].indexOf(e) && (i[e] = () => a[e]);
				r.d(t, i);
				const d = [
						"",
						{
							children: [
								"__PAGE__",
								{},
								{
									page: [
										() => Promise.resolve().then(r.bind(r, 6545)),
										"/Users/admin/mm/CinePulse/apps/host/src/app/page.tsx",
									],
								},
							],
						},
						{
							layout: [
								() => Promise.resolve().then(r.bind(r, 2826)),
								"/Users/admin/mm/CinePulse/apps/host/src/app/layout.tsx",
							],
							"not-found": [
								() => Promise.resolve().then(r.t.bind(r, 7130, 23)),
								"next/dist/client/components/not-found-error",
							],
						},
					],
					u = ["/Users/admin/mm/CinePulse/apps/host/src/app/page.tsx"],
					c = "/page",
					p = { require: r, loadChunk: () => Promise.resolve() },
					m = new n.AppPageRouteModule({
						definition: {
							kind: s.x.APP_PAGE,
							page: "/page",
							pathname: "/",
							bundlePath: "",
							filename: "",
							appPaths: [],
						},
						userland: { loaderTree: d },
					});
			},
			5082: () => {},
			3645: (e, t, r) => {
				Promise.resolve().then(r.bind(r, 526));
			},
			7792: (e, t, r) => {
				Promise.resolve().then(r.t.bind(r, 4893, 23)),
					Promise.resolve().then(r.t.bind(r, 6208, 23)),
					Promise.resolve().then(r.t.bind(r, 8289, 23)),
					Promise.resolve().then(r.t.bind(r, 7342, 23)),
					Promise.resolve().then(r.t.bind(r, 1979, 23)),
					Promise.resolve().then(r.t.bind(r, 6991, 23));
			},
			526: (e, t, r) => {
				"use strict";
				r.r(t), r.d(t, { default: () => d });
				var n = r(4962),
					s = r(3803),
					o = r.n(s),
					l = r(1718);
				class a extends l.Component {
					static getDerivedStateFromError(e) {
						return { hasError: !0 };
					}
					componentDidCatch(e, t) {
						console.error("Uncaught error:", e, t);
					}
					render() {
						return this.state.hasError
							? this.props.fallback ||
									n.jsx("div", {
										className: "p-4 border-2 border-red-500 rounded-lg",
										children: n.jsx("h2", {
											className: "text-xl font-bold text-red-600",
											children: "Something went wrong.",
										}),
									})
							: this.props.children;
					}
					constructor(...e) {
						super(...e), (this.state = { hasError: !1 });
					}
				}
				const i = o()(
					async () => {
						!(() => {
							var e = Error("Cannot find module 'remote/Hello'");
							throw ((e.code = "MODULE_NOT_FOUND"), e);
						})();
					},
					{
						loadableGenerated: { modules: ["app/page.tsx -> remote/Hello"] },
						ssr: !1,
						loading: () =>
							n.jsx("p", { children: "Loading Remote Component..." }),
					},
				);
				function d() {
					return (0, n.jsxs)("main", {
						className:
							"flex min-h-screen flex-col items-center justify-center p-24 space-y-8",
						children: [
							n.jsx("h1", {
								className: "text-4xl font-extrabold tracking-tight lg:text-5xl",
								children: "CinePulse Host",
							}),
							n.jsx("div", {
								className: "w-full max-w-md",
								children: n.jsx(a, {
									fallback: n.jsx("p", {
										className: "text-red-500",
										children: "Failed to load remote component",
									}),
									children: n.jsx(i, {}),
								}),
							}),
						],
					});
				}
			},
			3803: (e, t, r) => {
				"use strict";
				Object.defineProperty(t, "__esModule", { value: !0 }),
					Object.defineProperty(t, "default", { enumerable: !0, get: () => o });
				const n = r(4037);
				r(4962), r(1718);
				const s = n._(r(6474));
				function o(e, t) {
					var r;
					const n = {
						loading: (e) => {
							const { error: t, isLoading: r, pastDelay: n } = e;
							return null;
						},
					};
					"function" == typeof e && (n.loader = e);
					const o = { ...n, ...t };
					return (0, s.default)({
						...o,
						modules: null == (r = o.loadableGenerated) ? void 0 : r.modules,
					});
				}
				("function" == typeof t.default ||
					("object" == typeof t.default && null !== t.default)) &&
					void 0 === t.default.__esModule &&
					(Object.defineProperty(t.default, "__esModule", { value: !0 }),
					Object.assign(t.default, t),
					(e.exports = t.default));
			},
			8596: (e, t, r) => {
				"use strict";
				Object.defineProperty(t, "__esModule", { value: !0 }),
					Object.defineProperty(t, "BailoutToCSR", {
						enumerable: !0,
						get: () => s,
					});
				const n = r(6889);
				function s(e) {
					const { reason: t, children: r } = e;
					throw new n.BailoutToCSRError(t);
				}
			},
			6474: (e, t, r) => {
				"use strict";
				Object.defineProperty(t, "__esModule", { value: !0 }),
					Object.defineProperty(t, "default", { enumerable: !0, get: () => d });
				const n = r(4962),
					s = r(1718),
					o = r(8596),
					l = r(5420);
				function a(e) {
					return { default: e && "default" in e ? e.default : e };
				}
				const i = {
						loader: () => Promise.resolve(a(() => null)),
						loading: null,
						ssr: !0,
					},
					d = (e) => {
						const t = { ...i, ...e },
							r = (0, s.lazy)(() => t.loader().then(a)),
							d = t.loading;
						function u(e) {
							const a = d
									? (0, n.jsx)(d, { isLoading: !0, pastDelay: !0, error: null })
									: null,
								i = t.ssr
									? (0, n.jsxs)(n.Fragment, {
											children: [
												(0, n.jsx)(l.PreloadCss, { moduleIds: t.modules }),
												(0, n.jsx)(r, { ...e }),
											],
										})
									: (0, n.jsx)(o.BailoutToCSR, {
											reason: "next/dynamic",
											children: (0, n.jsx)(r, { ...e }),
										});
							return (0, n.jsx)(s.Suspense, { fallback: a, children: i });
						}
						return (u.displayName = "LoadableComponent"), u;
					};
			},
			5420: (e, t, r) => {
				"use strict";
				Object.defineProperty(t, "__esModule", { value: !0 }),
					Object.defineProperty(t, "PreloadCss", {
						enumerable: !0,
						get: () => o,
					});
				const n = r(4962),
					s = r(5403);
				function o(e) {
					const { moduleIds: t } = e,
						r = (0, s.getExpectedRequestStore)("next/dynamic css"),
						o = [];
					if (r.reactLoadableManifest && t) {
						const e = r.reactLoadableManifest;
						for (const r of t) {
							if (!e[r]) continue;
							const t = e[r].files.filter((e) => e.endsWith(".css"));
							o.push(...t);
						}
					}
					return 0 === o.length
						? null
						: (0, n.jsx)(n.Fragment, {
								children: o.map((e) =>
									(0, n.jsx)(
										"link",
										{
											precedence: "dynamic",
											rel: "stylesheet",
											href: r.assetPrefix + "/_next/" + encodeURI(e),
											as: "style",
										},
										e,
									),
								),
							});
				}
			},
			2826: (e, t, r) => {
				"use strict";
				r.r(t), r.d(t, { default: () => o, metadata: () => s });
				var n = r(720);
				r(5330);
				const s = {
					title: "CinePulse Host",
					description: "Main Application Shell",
				};
				function o({ children: e }) {
					return n.jsx("html", {
						lang: "en",
						children: n.jsx("body", { children: e }),
					});
				}
			},
			6545: (e, t, r) => {
				"use strict";
				r.r(t),
					r.d(t, { $$typeof: () => l, __esModule: () => o, default: () => a });
				var n = r(3516);
				const s = (0, n.createProxy)(
						String.raw`/Users/admin/mm/CinePulse/apps/host/src/app/page.tsx`,
					),
					{ __esModule: o, $$typeof: l } = s;
				s.default;
				const a = (0, n.createProxy)(
					String.raw`/Users/admin/mm/CinePulse/apps/host/src/app/page.tsx#default`,
				);
			},
			5330: () => {},
		});
	var t = require("../webpack-runtime.js");
	t.C(e);
	var r = (e) => t((t.s = e)),
		n = t.X(0, [752], () => r(2831));
	module.exports = n;
})();
