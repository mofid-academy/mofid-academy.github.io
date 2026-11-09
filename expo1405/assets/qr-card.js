import { a as e, c as t, i as n, n as r, r as i, s as a, t as o } from "./aurora-UOpARlMs.js";
// node_modules/lucide-react/dist/esm/icons/check.mjs
var s = {
	name: "check",
	size: 24,
	node: [["path", {
		d: "M20 6 9 17l-5-5",
		key: "1gmf2c"
	}]]
};
s.node;
var c = i(s), l = {
	name: "download",
	size: 24,
	node: [
		["path", {
			d: "M12 15V3",
			key: "m9g1x1"
		}],
		["path", {
			d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
			key: "ih7n3h"
		}],
		["path", {
			d: "m7 10 5 5 5-5",
			key: "brsn70"
		}]
	]
};
l.node;
var u = i(l), d = e(), f = /* @__PURE__ */ t(a(), 1), p = n(), m = f.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, p.jsx)("div", {
	ref: n,
	className: o("rounded-lg border bg-card text-card-foreground shadow-sm", e),
	...t
}));
m.displayName = "Card";
var h = f.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, p.jsx)("div", {
	ref: n,
	className: o("flex flex-col space-y-1.5 p-6", e),
	...t
}));
h.displayName = "CardHeader";
var g = f.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, p.jsx)("h3", {
	ref: n,
	className: o("text-2xl font-semibold leading-none tracking-tight", e),
	...t
}));
g.displayName = "CardTitle";
var _ = f.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, p.jsx)("p", {
	ref: n,
	className: o("text-sm text-muted-foreground", e),
	...t
}));
_.displayName = "CardDescription";
var v = f.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, p.jsx)("div", {
	ref: n,
	className: o("p-6 pt-0", e),
	...t
}));
v.displayName = "CardContent";
var y = f.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, p.jsx)("div", {
	ref: n,
	className: o("flex items-center p-6 pt-0", e),
	...t
}));
y.displayName = "CardFooter";
// node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var b = Object.defineProperty, x = (e, t) => b(e, "name", {
	value: t,
	configurable: !0
});
function S(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
x(S, "setRef");
function C(...e) {
	return (t) => {
		let n = !1, r = e.map((e) => {
			let r = S(e, t);
			return !n && typeof r == "function" && (n = !0), r;
		});
		if (n) return () => {
			for (let t = 0; t < r.length; t++) {
				let n = r[t];
				typeof n == "function" ? n() : S(e[t], null);
			}
		};
	};
}
x(C, "composeRefs");
function w(...e) {
	return f.useCallback(C(...e), e);
}
x(w, "useComposedRefs");
// node_modules/@radix-ui/react-slot/dist/index.mjs
var T = Object.defineProperty, E = (e, t) => T(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function D(e) {
	let t = f.forwardRef((t, n) => {
		let { children: r, ...i } = t, a = null, o = !1, s = [];
		r = R(r), f.Children.forEach(r, (e) => {
			if (P(e)) {
				o = !0;
				let t = e, n = "child" in t.props ? t.props.child : t.props.children;
				for (; I(n) && typeof H == "function";) n = H(n._payload);
				a = j(t, n), s.push(a?.props?.children);
			} else s.push(e);
		}), a ? a = f.cloneElement(a, void 0, s) : !o && f.Children.count(r) === 1 && f.isValidElement(r) && (a = r);
		let c = a ? N(a) : void 0, l = w(n, c);
		if (!a) {
			if (r || r === 0) throw Error(o ? V(e) : B(e));
			return r;
		}
		let u = M(i, a.props ?? {});
		return a.type !== f.Fragment && (u.ref = n ? l : c), f.cloneElement(a, u);
	});
	return t.displayName = `${e}.Slot`, t;
}
E(D, "createSlot");
var O = /* @__PURE__ */ D("Slot"), k = Symbol.for("radix.slottable");
// @__NO_SIDE_EFFECTS__
function A(e) {
	let t = /* @__PURE__ */ E((e) => "child" in e ? e.children(e.child) : e.children, "Slottable");
	return t.displayName = `${e}.Slottable`, t.__radixId = k, t;
}
E(A, "createSlottable");
var j = /* @__PURE__ */ E((e, t) => "child" in e.props ? f.isValidElement(t) ? f.cloneElement(t, void 0, e.props.children(t.props.children)) : null : f.isValidElement(t) ? t : null, "getSlottableElementFromSlottable");
function M(e, t) {
	let n = { ...t };
	for (let r in t) {
		let i = e[r], a = t[r];
		/^on[A-Z]/.test(r) ? i && a ? n[r] = (...e) => {
			let t = a(...e);
			return i(...e), t;
		} : i && (n[r] = i) : r === "style" ? n[r] = {
			...i,
			...a
		} : r === "className" ? n[r] = [i, a].filter(Boolean).join(" ") : r === "aria-describedby" && (n[r] = z(a, i));
	}
	return {
		...e,
		...n
	};
}
E(M, "mergeProps");
function N(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
E(N, "getElementRef");
function P(e) {
	return f.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === k;
}
E(P, "isSlottable");
var F = Symbol.for("react.lazy");
function I(e) {
	return typeof e == "object" && !!e && "$$typeof" in e && e.$$typeof === F && "_payload" in e && L(e._payload);
}
E(I, "isLazyComponent");
function L(e) {
	return typeof e == "object" && !!e && "then" in e;
}
E(L, "isPromiseLike");
function R(e) {
	let t = e;
	for (; I(t) && typeof H == "function";) t = H(t._payload);
	return t;
}
E(R, "useUnwrappedLazy");
function z(...e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) if (typeof n == "string") for (let e of String(n).trim().split(/\s+/)) e && t.add(e);
	return t.size > 0 ? Array.from(t).join(" ") : void 0;
}
E(z, "concatAriaDescribedby");
var B = /* @__PURE__ */ E((e) => `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`, "createSlotError"), V = /* @__PURE__ */ E((e) => `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`, "createSlottableError"), H = f.use, U = (e) => typeof e == "boolean" ? `${e}` : e === 0 ? "0" : e, W = r, G = ((e, t) => (n) => {
	if (t?.variants == null) return W(e, n?.class, n?.className);
	let { variants: r, defaultVariants: i } = t, a = Object.keys(r).map((e) => {
		let t = n?.[e], a = i?.[e];
		if (t === null) return null;
		let o = U(t) || U(a);
		return r[e][o];
	}), o = n && Object.entries(n).reduce((e, t) => {
		let [n, r] = t;
		return r === void 0 || (e[n] = r), e;
	}, {});
	return W(e, a, t?.compoundVariants?.reduce((e, t) => {
		let { class: n, className: r, ...a } = t;
		return Object.entries(a).every((e) => {
			let [t, n] = e;
			return Array.isArray(n) ? n.includes({
				...i,
				...o
			}[t]) : {
				...i,
				...o
			}[t] === n;
		}) ? [
			...e,
			n,
			r
		] : e;
	}, []), n?.class, n?.className);
})("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50", {
	variants: {
		variant: {
			default: "bg-mofid-500 text-white hover:bg-mofid-600",
			destructive: "bg-red-600 text-white",
			outline: "border bg-transparent",
			secondary: "bg-mofid-100 text-mofid-800",
			ghost: "bg-transparent",
			link: "underline-offset-4 hover:underline"
		},
		size: {
			default: "h-10 px-4 py-2",
			sm: "h-9 rounded-md px-3",
			lg: "h-11 rounded-md px-8",
			icon: "h-10 w-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
}), K = f.forwardRef(({ className: e, variant: t, size: n, asChild: r = !1, ...i }, a) => /* @__PURE__ */ (0, p.jsx)(r ? O : "button", {
	ref: a,
	className: o(G({
		variant: t,
		size: n,
		className: e
	})),
	...i
}));
K.displayName = "Button";
// components/ui/shiny-button.tsx
var q = f.forwardRef(({ className: e, type: t = "button", children: n, ...r }, i) => /* @__PURE__ */ (0, p.jsx)(K, {
	ref: i,
	type: t,
	className: o("shiny-cta", e),
	...r,
	children: n
}));
q.displayName = "ShinyButton";
// components/ui/qr-code-generator.tsx
function J({ data: e, isLoading: t = !1, error: n, title: r = "کد ورود مخاطب", compact: i = !1, filename: a = "qrcode.png" }) {
	let [s, l] = f.useState(!1), [d, y] = f.useState(!1), [b, x] = f.useState(null), S = f.useRef(0);
	return f.useEffect(() => (S.current++, y(!1), l(!1), x(null), () => {
		S.current++;
	}), [e?.data]), /* @__PURE__ */ (0, p.jsxs)(m, {
		className: o("qr-code-card", i && "qr-code-card-compact"),
		children: [!i && /* @__PURE__ */ (0, p.jsxs)(h, { children: [/* @__PURE__ */ (0, p.jsx)(g, { children: r }), /* @__PURE__ */ (0, p.jsx)(_, {
			dir: "ltr",
			children: e?.data || "QR مخصوص همین پنل"
		})] }), /* @__PURE__ */ (0, p.jsxs)(v, { children: [t ? /* @__PURE__ */ (0, p.jsx)("div", {
			className: "qr-loading",
			role: "status",
			"aria-label": "در حال آماده‌کردن QR"
		}) : n ? /* @__PURE__ */ (0, p.jsx)("p", {
			className: "qr-error",
			role: "alert",
			children: n
		}) : e ? /* @__PURE__ */ (0, p.jsxs)(p.Fragment, { children: [/* @__PURE__ */ (0, p.jsx)("div", {
			className: "qr-image-board",
			children: /* @__PURE__ */ (0, p.jsx)("img", {
				src: e.output,
				alt: "کد QR ورود به همین پنل",
				width: e.size,
				height: e.size,
				decoding: "async"
			})
		}), !i && /* @__PURE__ */ (0, p.jsxs)(p.Fragment, { children: [/* @__PURE__ */ (0, p.jsx)("p", {
			className: "qr-card-note",
			children: "با اسکن این کد وارد همین پنل شوید."
		}), /* @__PURE__ */ (0, p.jsxs)(q, {
			onClick: async () => {
				if (!e?.output || s) return;
				let t = S.current;
				l(!0), x(null);
				try {
					if (!e.output.startsWith("data:image/png;base64,")) throw Error("invalid_png");
					let n = Uint8Array.from(atob(e.output.slice(e.output.indexOf(",") + 1)), (e) => e.charCodeAt(0)), r = URL.createObjectURL(new Blob([n], { type: "image/png" })), i = document.createElement("a");
					i.href = r, i.download = a, document.body.appendChild(i), i.click(), i.remove(), setTimeout(() => URL.revokeObjectURL(r), 15e3), t === S.current && (y(!0), setTimeout(() => {
						t === S.current && y(!1);
					}, 1600));
				} catch {
					t === S.current && x("دانلود انجام نشد؛ دوباره تلاش کنید.");
				} finally {
					t === S.current && l(!1);
				}
			},
			disabled: s,
			className: "qr-download",
			"aria-busy": s,
			"aria-live": "polite",
			"aria-label": d ? "QR ذخیره شد" : s ? "در حال دانلود QR" : "دانلود QR به صورت PNG",
			children: [d ? /* @__PURE__ */ (0, p.jsx)(c, { "aria-hidden": "true" }) : /* @__PURE__ */ (0, p.jsx)(u, { "aria-hidden": "true" }), /* @__PURE__ */ (0, p.jsx)("span", { children: d ? "ذخیره شد" : s ? "در حال دانلود…" : "دانلود PNG" })]
		})] })] }) : /* @__PURE__ */ (0, p.jsx)("p", {
			className: "qr-empty",
			children: "پنل را انتخاب کنید تا QR آن آماده شود."
		}), !i && b && /* @__PURE__ */ (0, p.jsx)("p", {
			className: "qr-error",
			role: "alert",
			children: b
		})] })]
	});
}
// lib/qr-code.ts
function Y(e, t = 960) {
	if (!window.qrcode) throw Error("QR در دسترس نیست؛ صفحه را دوباره باز کنید.");
	let n = window.qrcode(0, "M");
	n.addData(e), n.make();
	let r = n.getModuleCount(), i = Math.max(1, Math.floor(t / (r + 8))), a = (r + 8) * i, o = document.createElement("canvas");
	o.width = a, o.height = a;
	let s = o.getContext("2d");
	if (!s) throw Error("تصویر QR آماده نشد.");
	s.fillStyle = "#fff", s.fillRect(0, 0, a, a), s.fillStyle = "#052c25";
	for (let e = 0; e < r; e++) for (let t = 0; t < r; t++) n.isDark(e, t) && s.fillRect((t + 4) * i, (e + 4) * i, i, i);
	return {
		data: e,
		size: a,
		output: o.toDataURL("image/png")
	};
}
// src/qr-entry.tsx
var X = (e) => ({
	url: e.dataset.qrUrl || "",
	title: e.dataset.qrTitle || "کد ورود مخاطب",
	compact: e.dataset.qrCompact === "true"
});
function Z({ element: e }) {
	let [t, n] = (0, f.useState)(() => X(e));
	(0, f.useEffect)(() => {
		let t = () => {
			let t = X(e);
			n((e) => e.url === t.url && e.title === t.title && e.compact === t.compact ? e : t);
		};
		return e.addEventListener("mofid:qr-update", t), t(), () => e.removeEventListener("mofid:qr-update", t);
	}, [e]);
	let r = (0, f.useMemo)(() => {
		if (!t.url) return {
			data: null,
			error: null
		};
		try {
			return {
				data: Y(t.url),
				error: null
			};
		} catch (e) {
			return {
				data: null,
				error: e instanceof Error ? e.message : "تصویر QR آماده نشد."
			};
		}
	}, [t.url]), i = t.url && new URL(t.url, location.href).searchParams.get("class") || "main";
	return /* @__PURE__ */ (0, p.jsx)(J, {
		data: r.data,
		error: r.error,
		title: t.title,
		compact: t.compact,
		filename: "panel-qr-" + i + ".png"
	});
}
for (let e of document.querySelectorAll("[data-qr-card]")) if (e.dataset.qrEnhanced = "true", (0, d.createRoot)(e).render(/* @__PURE__ */ (0, p.jsx)(Z, { element: e })), e.id === "classQr") {
	let e = document.getElementById("downloadClassQr");
	e && (e.hidden = !0);
}
