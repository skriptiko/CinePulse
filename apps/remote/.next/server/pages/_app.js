"use strict";
(() => {
	var e = {};
	(e.id = 888),
		(e.ids = [888]),
		(e.modules = {
			4618: (e, t, r) => {
				Object.defineProperty(t, "__esModule", { value: !0 }),
					Object.defineProperty(t, "default", { enumerable: !0, get: () => a });
				const n = r(5157),
					o = r(997),
					i = n._(r(6689)),
					u = r(5255);
				async function s(e) {
					const { Component: t, ctx: r } = e;
					return { pageProps: await (0, u.loadGetInitialProps)(t, r) };
				}
				class a extends i.default.Component {
					render() {
						const { Component: e, pageProps: t } = this.props;
						return (0, o.jsx)(e, { ...t });
					}
				}
				(a.origGetInitialProps = s),
					(a.getInitialProps = s),
					("function" == typeof t.default ||
						("object" == typeof t.default && null !== t.default)) &&
						void 0 === t.default.__esModule &&
						(Object.defineProperty(t.default, "__esModule", { value: !0 }),
						Object.assign(t.default, t),
						(e.exports = t.default));
			},
			5255: (e, t) => {
				Object.defineProperty(t, "__esModule", { value: !0 }),
					((e, t) => {
						for (var r in t)
							Object.defineProperty(e, r, { enumerable: !0, get: t[r] });
					})(t, {
						DecodeError: () => g,
						MiddlewareNotFoundError: () => E,
						MissingStaticPage: () => y,
						NormalizeError: () => m,
						PageNotFoundError: () => P,
						SP: () => d,
						ST: () => p,
						WEB_VITALS: () => r,
						execOnce: () => n,
						getDisplayName: () => a,
						getLocationOrigin: () => u,
						getURL: () => s,
						isAbsoluteUrl: () => i,
						isResSent: () => c,
						loadGetInitialProps: () => f,
						normalizeRepeatedSlashes: () => l,
						stringifyError: () => x,
					});
				const r = ["CLS", "FCP", "FID", "INP", "LCP", "TTFB"];
				function n(e) {
					let t,
						r = !1;
					return function () {
						for (var n = arguments.length, o = Array(n), i = 0; i < n; i++)
							o[i] = arguments[i];
						return r || ((r = !0), (t = e(...o))), t;
					};
				}
				const o = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/,
					i = (e) => o.test(e);
				function u() {
					const { protocol: e, hostname: t, port: r } = window.location;
					return e + "//" + t + (r ? ":" + r : "");
				}
				function s() {
					const { href: e } = window.location,
						t = u();
					return e.substring(t.length);
				}
				function a(e) {
					return "string" == typeof e
						? e
						: e.displayName || e.name || "Unknown";
				}
				function c(e) {
					return e.finished || e.headersSent;
				}
				function l(e) {
					const t = e.split("?");
					return (
						t[0].replace(/\\/g, "/").replace(/\/\/+/g, "/") +
						(t[1] ? "?" + t.slice(1).join("?") : "")
					);
				}
				async function f(e, t) {
					const r = t.res || (t.ctx && t.ctx.res);
					if (!e.getInitialProps)
						return t.ctx && t.Component
							? { pageProps: await f(t.Component, t.ctx) }
							: {};
					const n = await e.getInitialProps(t);
					if (r && c(r)) return n;
					if (!n)
						throw Error(
							'"' +
								a(e) +
								'.getInitialProps()" should resolve to an object. But found "' +
								n +
								'" instead.',
						);
					return n;
				}
				const d = "undefined" != typeof performance,
					p =
						d &&
						["mark", "measure", "getEntriesByName"].every(
							(e) => "function" == typeof performance[e],
						);
				class g extends Error {}
				class m extends Error {}
				class P extends Error {
					constructor(e) {
						super(),
							(this.code = "ENOENT"),
							(this.name = "PageNotFoundError"),
							(this.message = "Cannot find module for page: " + e);
					}
				}
				class y extends Error {
					constructor(e, t) {
						super(),
							(this.message =
								"Failed to load static file for page: " + e + " " + t);
					}
				}
				class E extends Error {
					constructor() {
						super(),
							(this.code = "ENOENT"),
							(this.message = "Cannot find the middleware module");
					}
				}
				function x(e) {
					return JSON.stringify({ message: e.message, stack: e.stack });
				}
			},
			6689: (e) => {
				e.exports = require("react");
			},
			997: (e) => {
				e.exports = require("react/jsx-runtime");
			},
			5157: (e, t) => {
				t._ = t._interop_require_default = (e) =>
					e && e.__esModule ? e : { default: e };
			},
		});
	var t = require("../webpack-runtime.js");
	t.C(e);
	var r = t((t.s = 4618));
	module.exports = r;
})();
