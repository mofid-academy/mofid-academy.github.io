import { a as e, n as t, o as n, r, t as i } from "./aurora-CRxiHlrC.js";
// node_modules/lucide-react/dist/esm/icons/check.mjs
var a = {
	name: "check",
	size: 24,
	node: [["path", {
		d: "M20 6 9 17l-5-5",
		key: "1gmf2c"
	}]]
};
a.node;
var o = t(a), s = {
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
s.node;
var c = t(s), l = /* @__PURE__ */ n(e(), 1), u = r();
function d(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = d(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function f() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = d(e)) && (r && (r += " "), r += t);
	return r;
}
// node_modules/tailwind-merge/dist/bundle-mjs.mjs
var p = "-", m = (e) => {
	let t = v(e), { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
	return {
		getClassGroupId: (e) => {
			let n = e.split(p);
			return n[0] === "" && n.length !== 1 && n.shift(), h(n, t) || _(e);
		},
		getConflictingClassGroupIds: (e, t) => {
			let i = n[e] || [];
			return t && r[e] ? [...i, ...r[e]] : i;
		}
	};
}, h = (e, t) => {
	if (e.length === 0) return t.classGroupId;
	let n = e[0], r = t.nextPart.get(n), i = r ? h(e.slice(1), r) : void 0;
	if (i) return i;
	if (t.validators.length === 0) return;
	let a = e.join(p);
	return t.validators.find(({ validator: e }) => e(a))?.classGroupId;
}, g = /^\[(.+)\]$/, _ = (e) => {
	if (g.test(e)) {
		let t = g.exec(e)[1], n = t?.substring(0, t.indexOf(":"));
		if (n) return "arbitrary.." + n;
	}
}, v = (e) => {
	let { theme: t, prefix: n } = e, r = {
		nextPart: /* @__PURE__ */ new Map(),
		validators: []
	};
	return S(Object.entries(e.classGroups), n).forEach(([e, n]) => {
		y(n, r, e, t);
	}), r;
}, y = (e, t, n, r) => {
	e.forEach((e) => {
		if (typeof e == "string") {
			let r = e === "" ? t : b(t, e);
			r.classGroupId = n;
		} else if (typeof e == "function") {
			if (x(e)) {
				y(e(r), t, n, r);
				return;
			}
			t.validators.push({
				validator: e,
				classGroupId: n
			});
		} else Object.entries(e).forEach(([e, i]) => {
			y(i, b(t, e), n, r);
		});
	});
}, b = (e, t) => {
	let n = e;
	return t.split(p).forEach((e) => {
		n.nextPart.has(e) || n.nextPart.set(e, {
			nextPart: /* @__PURE__ */ new Map(),
			validators: []
		}), n = n.nextPart.get(e);
	}), n;
}, x = (e) => e.isThemeGetter, S = (e, t) => t ? e.map(([e, n]) => [e, n.map((e) => typeof e == "string" ? t + e : typeof e == "object" ? Object.fromEntries(Object.entries(e).map(([e, n]) => [t + e, n])) : e)]) : e, C = (e) => {
	if (e < 1) return {
		get: () => void 0,
		set: () => {}
	};
	let t = 0, n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = (i, a) => {
		n.set(i, a), t++, t > e && (t = 0, r = n, n = /* @__PURE__ */ new Map());
	};
	return {
		get(e) {
			let t = n.get(e);
			if (t !== void 0) return t;
			if ((t = r.get(e)) !== void 0) return i(e, t), t;
		},
		set(e, t) {
			n.has(e) ? n.set(e, t) : i(e, t);
		}
	};
}, w = "!", T = (e) => {
	let { separator: t, experimentalParseClassName: n } = e, r = t.length === 1, i = t[0], a = t.length, o = (e) => {
		let n = [], o = 0, s = 0, c;
		for (let l = 0; l < e.length; l++) {
			let u = e[l];
			if (o === 0) {
				if (u === i && (r || e.slice(l, l + a) === t)) {
					n.push(e.slice(s, l)), s = l + a;
					continue;
				}
				if (u === "/") {
					c = l;
					continue;
				}
			}
			u === "[" ? o++ : u === "]" && o--;
		}
		let l = n.length === 0 ? e : e.substring(s), u = l.startsWith(w);
		return {
			modifiers: n,
			hasImportantModifier: u,
			baseClassName: u ? l.substring(1) : l,
			maybePostfixModifierPosition: c && c > s ? c - s : void 0
		};
	};
	return n ? (e) => n({
		className: e,
		parseClassName: o
	}) : o;
}, E = (e) => {
	if (e.length <= 1) return e;
	let t = [], n = [];
	return e.forEach((e) => {
		e[0] === "[" ? (t.push(...n.sort(), e), n = []) : n.push(e);
	}), t.push(...n.sort()), t;
}, D = (e) => ({
	cache: C(e.cacheSize),
	parseClassName: T(e),
	...m(e)
}), O = /\s+/, k = (e, t) => {
	let { parseClassName: n, getClassGroupId: r, getConflictingClassGroupIds: i } = t, a = [], o = e.trim().split(O), s = "";
	for (let e = o.length - 1; e >= 0; --e) {
		let t = o[e], { modifiers: c, hasImportantModifier: l, baseClassName: u, maybePostfixModifierPosition: d } = n(t), f = !!d, p = r(f ? u.substring(0, d) : u);
		if (!p) {
			if (!f || (p = r(u), !p)) {
				s = t + (s.length > 0 ? " " + s : s);
				continue;
			}
			f = !1;
		}
		let m = E(c).join(":"), h = l ? m + w : m, g = h + p;
		if (a.includes(g)) continue;
		a.push(g);
		let _ = i(p, f);
		for (let e = 0; e < _.length; ++e) {
			let t = _[e];
			a.push(h + t);
		}
		s = t + (s.length > 0 ? " " + s : s);
	}
	return s;
};
function A() {
	let e = 0, t, n, r = "";
	for (; e < arguments.length;) (t = arguments[e++]) && (n = j(t)) && (r && (r += " "), r += n);
	return r;
}
var j = (e) => {
	if (typeof e == "string") return e;
	let t, n = "";
	for (let r = 0; r < e.length; r++) e[r] && (t = j(e[r])) && (n && (n += " "), n += t);
	return n;
};
function M(e, ...t) {
	let n, r, i, a = o;
	function o(o) {
		return n = D(t.reduce((e, t) => t(e), e())), r = n.cache.get, i = n.cache.set, a = s, s(o);
	}
	function s(e) {
		let t = r(e);
		if (t) return t;
		let a = k(e, n);
		return i(e, a), a;
	}
	return function() {
		return a(A.apply(null, arguments));
	};
}
var N = (e) => {
	let t = (t) => t[e] || [];
	return t.isThemeGetter = !0, t;
}, P = /^\[(?:([a-z-]+):)?(.+)\]$/i, F = /^\d+\/\d+$/, I = /*#__PURE__*/ new Set([
	"px",
	"full",
	"screen"
]), L = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/, R = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/, ee = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/, te = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/, ne = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/, z = (e) => V(e) || I.has(e) || F.test(e), B = (e) => q(e, "length", ue), V = (e) => !!e && !Number.isNaN(Number(e)), H = (e) => q(e, "number", V), U = (e) => !!e && Number.isInteger(Number(e)), re = (e) => e.endsWith("%") && V(e.slice(0, -1)), W = (e) => P.test(e), G = (e) => L.test(e), ie = /*#__PURE__*/ new Set([
	"length",
	"size",
	"percentage"
]), ae = (e) => q(e, ie, de), oe = (e) => q(e, "position", de), se = /*#__PURE__*/ new Set(["image", "url"]), ce = (e) => q(e, se, pe), le = (e) => q(e, "", fe), K = () => !0, q = (e, t, n) => {
	let r = P.exec(e);
	return r ? r[1] ? typeof t == "string" ? r[1] === t : t.has(r[1]) : n(r[2]) : !1;
}, ue = (e) => R.test(e) && !ee.test(e), de = () => !1, fe = (e) => te.test(e), pe = (e) => ne.test(e), me = /*#__PURE__*/ M(() => {
	let e = N("colors"), t = N("spacing"), n = N("blur"), r = N("brightness"), i = N("borderColor"), a = N("borderRadius"), o = N("borderSpacing"), s = N("borderWidth"), c = N("contrast"), l = N("grayscale"), u = N("hueRotate"), d = N("invert"), f = N("gap"), p = N("gradientColorStops"), m = N("gradientColorStopPositions"), h = N("inset"), g = N("margin"), _ = N("opacity"), v = N("padding"), y = N("saturate"), b = N("scale"), x = N("sepia"), S = N("skew"), C = N("space"), w = N("translate"), T = () => [
		"auto",
		"contain",
		"none"
	], E = () => [
		"auto",
		"hidden",
		"clip",
		"visible",
		"scroll"
	], D = () => [
		"auto",
		W,
		t
	], O = () => [W, t], k = () => [
		"",
		z,
		B
	], A = () => [
		"auto",
		V,
		W
	], j = () => [
		"bottom",
		"center",
		"left",
		"left-bottom",
		"left-top",
		"right",
		"right-bottom",
		"right-top",
		"top"
	], M = () => [
		"solid",
		"dashed",
		"dotted",
		"double",
		"none"
	], P = () => [
		"normal",
		"multiply",
		"screen",
		"overlay",
		"darken",
		"lighten",
		"color-dodge",
		"color-burn",
		"hard-light",
		"soft-light",
		"difference",
		"exclusion",
		"hue",
		"saturation",
		"color",
		"luminosity"
	], F = () => [
		"start",
		"end",
		"center",
		"between",
		"around",
		"evenly",
		"stretch"
	], I = () => [
		"",
		"0",
		W
	], L = () => [
		"auto",
		"avoid",
		"all",
		"avoid-page",
		"page",
		"left",
		"right",
		"column"
	], R = () => [V, W];
	return {
		cacheSize: 500,
		separator: ":",
		theme: {
			colors: [K],
			spacing: [z, B],
			blur: [
				"none",
				"",
				G,
				W
			],
			brightness: R(),
			borderColor: [e],
			borderRadius: [
				"none",
				"",
				"full",
				G,
				W
			],
			borderSpacing: O(),
			borderWidth: k(),
			contrast: R(),
			grayscale: I(),
			hueRotate: R(),
			invert: I(),
			gap: O(),
			gradientColorStops: [e],
			gradientColorStopPositions: [re, B],
			inset: D(),
			margin: D(),
			opacity: R(),
			padding: O(),
			saturate: R(),
			scale: R(),
			sepia: I(),
			skew: R(),
			space: O(),
			translate: O()
		},
		classGroups: {
			aspect: [{ aspect: [
				"auto",
				"square",
				"video",
				W
			] }],
			container: ["container"],
			columns: [{ columns: [G] }],
			"break-after": [{ "break-after": L() }],
			"break-before": [{ "break-before": L() }],
			"break-inside": [{ "break-inside": [
				"auto",
				"avoid",
				"avoid-page",
				"avoid-column"
			] }],
			"box-decoration": [{ "box-decoration": ["slice", "clone"] }],
			box: [{ box: ["border", "content"] }],
			display: [
				"block",
				"inline-block",
				"inline",
				"flex",
				"inline-flex",
				"table",
				"inline-table",
				"table-caption",
				"table-cell",
				"table-column",
				"table-column-group",
				"table-footer-group",
				"table-header-group",
				"table-row-group",
				"table-row",
				"flow-root",
				"grid",
				"inline-grid",
				"contents",
				"list-item",
				"hidden"
			],
			float: [{ float: [
				"right",
				"left",
				"none",
				"start",
				"end"
			] }],
			clear: [{ clear: [
				"left",
				"right",
				"both",
				"none",
				"start",
				"end"
			] }],
			isolation: ["isolate", "isolation-auto"],
			"object-fit": [{ object: [
				"contain",
				"cover",
				"fill",
				"none",
				"scale-down"
			] }],
			"object-position": [{ object: [...j(), W] }],
			overflow: [{ overflow: E() }],
			"overflow-x": [{ "overflow-x": E() }],
			"overflow-y": [{ "overflow-y": E() }],
			overscroll: [{ overscroll: T() }],
			"overscroll-x": [{ "overscroll-x": T() }],
			"overscroll-y": [{ "overscroll-y": T() }],
			position: [
				"static",
				"fixed",
				"absolute",
				"relative",
				"sticky"
			],
			inset: [{ inset: [h] }],
			"inset-x": [{ "inset-x": [h] }],
			"inset-y": [{ "inset-y": [h] }],
			start: [{ start: [h] }],
			end: [{ end: [h] }],
			top: [{ top: [h] }],
			right: [{ right: [h] }],
			bottom: [{ bottom: [h] }],
			left: [{ left: [h] }],
			visibility: [
				"visible",
				"invisible",
				"collapse"
			],
			z: [{ z: [
				"auto",
				U,
				W
			] }],
			basis: [{ basis: D() }],
			"flex-direction": [{ flex: [
				"row",
				"row-reverse",
				"col",
				"col-reverse"
			] }],
			"flex-wrap": [{ flex: [
				"wrap",
				"wrap-reverse",
				"nowrap"
			] }],
			flex: [{ flex: [
				"1",
				"auto",
				"initial",
				"none",
				W
			] }],
			grow: [{ grow: I() }],
			shrink: [{ shrink: I() }],
			order: [{ order: [
				"first",
				"last",
				"none",
				U,
				W
			] }],
			"grid-cols": [{ "grid-cols": [K] }],
			"col-start-end": [{ col: [
				"auto",
				{ span: [
					"full",
					U,
					W
				] },
				W
			] }],
			"col-start": [{ "col-start": A() }],
			"col-end": [{ "col-end": A() }],
			"grid-rows": [{ "grid-rows": [K] }],
			"row-start-end": [{ row: [
				"auto",
				{ span: [U, W] },
				W
			] }],
			"row-start": [{ "row-start": A() }],
			"row-end": [{ "row-end": A() }],
			"grid-flow": [{ "grid-flow": [
				"row",
				"col",
				"dense",
				"row-dense",
				"col-dense"
			] }],
			"auto-cols": [{ "auto-cols": [
				"auto",
				"min",
				"max",
				"fr",
				W
			] }],
			"auto-rows": [{ "auto-rows": [
				"auto",
				"min",
				"max",
				"fr",
				W
			] }],
			gap: [{ gap: [f] }],
			"gap-x": [{ "gap-x": [f] }],
			"gap-y": [{ "gap-y": [f] }],
			"justify-content": [{ justify: ["normal", ...F()] }],
			"justify-items": [{ "justify-items": [
				"start",
				"end",
				"center",
				"stretch"
			] }],
			"justify-self": [{ "justify-self": [
				"auto",
				"start",
				"end",
				"center",
				"stretch"
			] }],
			"align-content": [{ content: [
				"normal",
				...F(),
				"baseline"
			] }],
			"align-items": [{ items: [
				"start",
				"end",
				"center",
				"baseline",
				"stretch"
			] }],
			"align-self": [{ self: [
				"auto",
				"start",
				"end",
				"center",
				"stretch",
				"baseline"
			] }],
			"place-content": [{ "place-content": [...F(), "baseline"] }],
			"place-items": [{ "place-items": [
				"start",
				"end",
				"center",
				"baseline",
				"stretch"
			] }],
			"place-self": [{ "place-self": [
				"auto",
				"start",
				"end",
				"center",
				"stretch"
			] }],
			p: [{ p: [v] }],
			px: [{ px: [v] }],
			py: [{ py: [v] }],
			ps: [{ ps: [v] }],
			pe: [{ pe: [v] }],
			pt: [{ pt: [v] }],
			pr: [{ pr: [v] }],
			pb: [{ pb: [v] }],
			pl: [{ pl: [v] }],
			m: [{ m: [g] }],
			mx: [{ mx: [g] }],
			my: [{ my: [g] }],
			ms: [{ ms: [g] }],
			me: [{ me: [g] }],
			mt: [{ mt: [g] }],
			mr: [{ mr: [g] }],
			mb: [{ mb: [g] }],
			ml: [{ ml: [g] }],
			"space-x": [{ "space-x": [C] }],
			"space-x-reverse": ["space-x-reverse"],
			"space-y": [{ "space-y": [C] }],
			"space-y-reverse": ["space-y-reverse"],
			w: [{ w: [
				"auto",
				"min",
				"max",
				"fit",
				"svw",
				"lvw",
				"dvw",
				W,
				t
			] }],
			"min-w": [{ "min-w": [
				W,
				t,
				"min",
				"max",
				"fit"
			] }],
			"max-w": [{ "max-w": [
				W,
				t,
				"none",
				"full",
				"min",
				"max",
				"fit",
				"prose",
				{ screen: [G] },
				G
			] }],
			h: [{ h: [
				W,
				t,
				"auto",
				"min",
				"max",
				"fit",
				"svh",
				"lvh",
				"dvh"
			] }],
			"min-h": [{ "min-h": [
				W,
				t,
				"min",
				"max",
				"fit",
				"svh",
				"lvh",
				"dvh"
			] }],
			"max-h": [{ "max-h": [
				W,
				t,
				"min",
				"max",
				"fit",
				"svh",
				"lvh",
				"dvh"
			] }],
			size: [{ size: [
				W,
				t,
				"auto",
				"min",
				"max",
				"fit"
			] }],
			"font-size": [{ text: [
				"base",
				G,
				B
			] }],
			"font-smoothing": ["antialiased", "subpixel-antialiased"],
			"font-style": ["italic", "not-italic"],
			"font-weight": [{ font: [
				"thin",
				"extralight",
				"light",
				"normal",
				"medium",
				"semibold",
				"bold",
				"extrabold",
				"black",
				H
			] }],
			"font-family": [{ font: [K] }],
			"fvn-normal": ["normal-nums"],
			"fvn-ordinal": ["ordinal"],
			"fvn-slashed-zero": ["slashed-zero"],
			"fvn-figure": ["lining-nums", "oldstyle-nums"],
			"fvn-spacing": ["proportional-nums", "tabular-nums"],
			"fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
			tracking: [{ tracking: [
				"tighter",
				"tight",
				"normal",
				"wide",
				"wider",
				"widest",
				W
			] }],
			"line-clamp": [{ "line-clamp": [
				"none",
				V,
				H
			] }],
			leading: [{ leading: [
				"none",
				"tight",
				"snug",
				"normal",
				"relaxed",
				"loose",
				z,
				W
			] }],
			"list-image": [{ "list-image": ["none", W] }],
			"list-style-type": [{ list: [
				"none",
				"disc",
				"decimal",
				W
			] }],
			"list-style-position": [{ list: ["inside", "outside"] }],
			"placeholder-color": [{ placeholder: [e] }],
			"placeholder-opacity": [{ "placeholder-opacity": [_] }],
			"text-alignment": [{ text: [
				"left",
				"center",
				"right",
				"justify",
				"start",
				"end"
			] }],
			"text-color": [{ text: [e] }],
			"text-opacity": [{ "text-opacity": [_] }],
			"text-decoration": [
				"underline",
				"overline",
				"line-through",
				"no-underline"
			],
			"text-decoration-style": [{ decoration: [...M(), "wavy"] }],
			"text-decoration-thickness": [{ decoration: [
				"auto",
				"from-font",
				z,
				B
			] }],
			"underline-offset": [{ "underline-offset": [
				"auto",
				z,
				W
			] }],
			"text-decoration-color": [{ decoration: [e] }],
			"text-transform": [
				"uppercase",
				"lowercase",
				"capitalize",
				"normal-case"
			],
			"text-overflow": [
				"truncate",
				"text-ellipsis",
				"text-clip"
			],
			"text-wrap": [{ text: [
				"wrap",
				"nowrap",
				"balance",
				"pretty"
			] }],
			indent: [{ indent: O() }],
			"vertical-align": [{ align: [
				"baseline",
				"top",
				"middle",
				"bottom",
				"text-top",
				"text-bottom",
				"sub",
				"super",
				W
			] }],
			whitespace: [{ whitespace: [
				"normal",
				"nowrap",
				"pre",
				"pre-line",
				"pre-wrap",
				"break-spaces"
			] }],
			break: [{ break: [
				"normal",
				"words",
				"all",
				"keep"
			] }],
			hyphens: [{ hyphens: [
				"none",
				"manual",
				"auto"
			] }],
			content: [{ content: ["none", W] }],
			"bg-attachment": [{ bg: [
				"fixed",
				"local",
				"scroll"
			] }],
			"bg-clip": [{ "bg-clip": [
				"border",
				"padding",
				"content",
				"text"
			] }],
			"bg-opacity": [{ "bg-opacity": [_] }],
			"bg-origin": [{ "bg-origin": [
				"border",
				"padding",
				"content"
			] }],
			"bg-position": [{ bg: [...j(), oe] }],
			"bg-repeat": [{ bg: ["no-repeat", { repeat: [
				"",
				"x",
				"y",
				"round",
				"space"
			] }] }],
			"bg-size": [{ bg: [
				"auto",
				"cover",
				"contain",
				ae
			] }],
			"bg-image": [{ bg: [
				"none",
				{ "gradient-to": [
					"t",
					"tr",
					"r",
					"br",
					"b",
					"bl",
					"l",
					"tl"
				] },
				ce
			] }],
			"bg-color": [{ bg: [e] }],
			"gradient-from-pos": [{ from: [m] }],
			"gradient-via-pos": [{ via: [m] }],
			"gradient-to-pos": [{ to: [m] }],
			"gradient-from": [{ from: [p] }],
			"gradient-via": [{ via: [p] }],
			"gradient-to": [{ to: [p] }],
			rounded: [{ rounded: [a] }],
			"rounded-s": [{ "rounded-s": [a] }],
			"rounded-e": [{ "rounded-e": [a] }],
			"rounded-t": [{ "rounded-t": [a] }],
			"rounded-r": [{ "rounded-r": [a] }],
			"rounded-b": [{ "rounded-b": [a] }],
			"rounded-l": [{ "rounded-l": [a] }],
			"rounded-ss": [{ "rounded-ss": [a] }],
			"rounded-se": [{ "rounded-se": [a] }],
			"rounded-ee": [{ "rounded-ee": [a] }],
			"rounded-es": [{ "rounded-es": [a] }],
			"rounded-tl": [{ "rounded-tl": [a] }],
			"rounded-tr": [{ "rounded-tr": [a] }],
			"rounded-br": [{ "rounded-br": [a] }],
			"rounded-bl": [{ "rounded-bl": [a] }],
			"border-w": [{ border: [s] }],
			"border-w-x": [{ "border-x": [s] }],
			"border-w-y": [{ "border-y": [s] }],
			"border-w-s": [{ "border-s": [s] }],
			"border-w-e": [{ "border-e": [s] }],
			"border-w-t": [{ "border-t": [s] }],
			"border-w-r": [{ "border-r": [s] }],
			"border-w-b": [{ "border-b": [s] }],
			"border-w-l": [{ "border-l": [s] }],
			"border-opacity": [{ "border-opacity": [_] }],
			"border-style": [{ border: [...M(), "hidden"] }],
			"divide-x": [{ "divide-x": [s] }],
			"divide-x-reverse": ["divide-x-reverse"],
			"divide-y": [{ "divide-y": [s] }],
			"divide-y-reverse": ["divide-y-reverse"],
			"divide-opacity": [{ "divide-opacity": [_] }],
			"divide-style": [{ divide: M() }],
			"border-color": [{ border: [i] }],
			"border-color-x": [{ "border-x": [i] }],
			"border-color-y": [{ "border-y": [i] }],
			"border-color-s": [{ "border-s": [i] }],
			"border-color-e": [{ "border-e": [i] }],
			"border-color-t": [{ "border-t": [i] }],
			"border-color-r": [{ "border-r": [i] }],
			"border-color-b": [{ "border-b": [i] }],
			"border-color-l": [{ "border-l": [i] }],
			"divide-color": [{ divide: [i] }],
			"outline-style": [{ outline: ["", ...M()] }],
			"outline-offset": [{ "outline-offset": [z, W] }],
			"outline-w": [{ outline: [z, B] }],
			"outline-color": [{ outline: [e] }],
			"ring-w": [{ ring: k() }],
			"ring-w-inset": ["ring-inset"],
			"ring-color": [{ ring: [e] }],
			"ring-opacity": [{ "ring-opacity": [_] }],
			"ring-offset-w": [{ "ring-offset": [z, B] }],
			"ring-offset-color": [{ "ring-offset": [e] }],
			shadow: [{ shadow: [
				"",
				"inner",
				"none",
				G,
				le
			] }],
			"shadow-color": [{ shadow: [K] }],
			opacity: [{ opacity: [_] }],
			"mix-blend": [{ "mix-blend": [
				...P(),
				"plus-lighter",
				"plus-darker"
			] }],
			"bg-blend": [{ "bg-blend": P() }],
			filter: [{ filter: ["", "none"] }],
			blur: [{ blur: [n] }],
			brightness: [{ brightness: [r] }],
			contrast: [{ contrast: [c] }],
			"drop-shadow": [{ "drop-shadow": [
				"",
				"none",
				G,
				W
			] }],
			grayscale: [{ grayscale: [l] }],
			"hue-rotate": [{ "hue-rotate": [u] }],
			invert: [{ invert: [d] }],
			saturate: [{ saturate: [y] }],
			sepia: [{ sepia: [x] }],
			"backdrop-filter": [{ "backdrop-filter": ["", "none"] }],
			"backdrop-blur": [{ "backdrop-blur": [n] }],
			"backdrop-brightness": [{ "backdrop-brightness": [r] }],
			"backdrop-contrast": [{ "backdrop-contrast": [c] }],
			"backdrop-grayscale": [{ "backdrop-grayscale": [l] }],
			"backdrop-hue-rotate": [{ "backdrop-hue-rotate": [u] }],
			"backdrop-invert": [{ "backdrop-invert": [d] }],
			"backdrop-opacity": [{ "backdrop-opacity": [_] }],
			"backdrop-saturate": [{ "backdrop-saturate": [y] }],
			"backdrop-sepia": [{ "backdrop-sepia": [x] }],
			"border-collapse": [{ border: ["collapse", "separate"] }],
			"border-spacing": [{ "border-spacing": [o] }],
			"border-spacing-x": [{ "border-spacing-x": [o] }],
			"border-spacing-y": [{ "border-spacing-y": [o] }],
			"table-layout": [{ table: ["auto", "fixed"] }],
			caption: [{ caption: ["top", "bottom"] }],
			transition: [{ transition: [
				"none",
				"all",
				"",
				"colors",
				"opacity",
				"shadow",
				"transform",
				W
			] }],
			duration: [{ duration: R() }],
			ease: [{ ease: [
				"linear",
				"in",
				"out",
				"in-out",
				W
			] }],
			delay: [{ delay: R() }],
			animate: [{ animate: [
				"none",
				"spin",
				"ping",
				"pulse",
				"bounce",
				W
			] }],
			transform: [{ transform: [
				"",
				"gpu",
				"none"
			] }],
			scale: [{ scale: [b] }],
			"scale-x": [{ "scale-x": [b] }],
			"scale-y": [{ "scale-y": [b] }],
			rotate: [{ rotate: [U, W] }],
			"translate-x": [{ "translate-x": [w] }],
			"translate-y": [{ "translate-y": [w] }],
			"skew-x": [{ "skew-x": [S] }],
			"skew-y": [{ "skew-y": [S] }],
			"transform-origin": [{ origin: [
				"center",
				"top",
				"top-right",
				"right",
				"bottom-right",
				"bottom",
				"bottom-left",
				"left",
				"top-left",
				W
			] }],
			accent: [{ accent: ["auto", e] }],
			appearance: [{ appearance: ["none", "auto"] }],
			cursor: [{ cursor: [
				"auto",
				"default",
				"pointer",
				"wait",
				"text",
				"move",
				"help",
				"not-allowed",
				"none",
				"context-menu",
				"progress",
				"cell",
				"crosshair",
				"vertical-text",
				"alias",
				"copy",
				"no-drop",
				"grab",
				"grabbing",
				"all-scroll",
				"col-resize",
				"row-resize",
				"n-resize",
				"e-resize",
				"s-resize",
				"w-resize",
				"ne-resize",
				"nw-resize",
				"se-resize",
				"sw-resize",
				"ew-resize",
				"ns-resize",
				"nesw-resize",
				"nwse-resize",
				"zoom-in",
				"zoom-out",
				W
			] }],
			"caret-color": [{ caret: [e] }],
			"pointer-events": [{ "pointer-events": ["none", "auto"] }],
			resize: [{ resize: [
				"none",
				"y",
				"x",
				""
			] }],
			"scroll-behavior": [{ scroll: ["auto", "smooth"] }],
			"scroll-m": [{ "scroll-m": O() }],
			"scroll-mx": [{ "scroll-mx": O() }],
			"scroll-my": [{ "scroll-my": O() }],
			"scroll-ms": [{ "scroll-ms": O() }],
			"scroll-me": [{ "scroll-me": O() }],
			"scroll-mt": [{ "scroll-mt": O() }],
			"scroll-mr": [{ "scroll-mr": O() }],
			"scroll-mb": [{ "scroll-mb": O() }],
			"scroll-ml": [{ "scroll-ml": O() }],
			"scroll-p": [{ "scroll-p": O() }],
			"scroll-px": [{ "scroll-px": O() }],
			"scroll-py": [{ "scroll-py": O() }],
			"scroll-ps": [{ "scroll-ps": O() }],
			"scroll-pe": [{ "scroll-pe": O() }],
			"scroll-pt": [{ "scroll-pt": O() }],
			"scroll-pr": [{ "scroll-pr": O() }],
			"scroll-pb": [{ "scroll-pb": O() }],
			"scroll-pl": [{ "scroll-pl": O() }],
			"snap-align": [{ snap: [
				"start",
				"end",
				"center",
				"align-none"
			] }],
			"snap-stop": [{ snap: ["normal", "always"] }],
			"snap-type": [{ snap: [
				"none",
				"x",
				"y",
				"both"
			] }],
			"snap-strictness": [{ snap: ["mandatory", "proximity"] }],
			touch: [{ touch: [
				"auto",
				"none",
				"manipulation"
			] }],
			"touch-x": [{ "touch-pan": [
				"x",
				"left",
				"right"
			] }],
			"touch-y": [{ "touch-pan": [
				"y",
				"up",
				"down"
			] }],
			"touch-pz": ["touch-pinch-zoom"],
			select: [{ select: [
				"none",
				"text",
				"all",
				"auto"
			] }],
			"will-change": [{ "will-change": [
				"auto",
				"scroll",
				"contents",
				"transform",
				W
			] }],
			fill: [{ fill: [e, "none"] }],
			"stroke-w": [{ stroke: [
				z,
				B,
				H
			] }],
			stroke: [{ stroke: [e, "none"] }],
			sr: ["sr-only", "not-sr-only"],
			"forced-color-adjust": [{ "forced-color-adjust": ["auto", "none"] }]
		},
		conflictingClassGroups: {
			overflow: ["overflow-x", "overflow-y"],
			overscroll: ["overscroll-x", "overscroll-y"],
			inset: [
				"inset-x",
				"inset-y",
				"start",
				"end",
				"top",
				"right",
				"bottom",
				"left"
			],
			"inset-x": ["right", "left"],
			"inset-y": ["top", "bottom"],
			flex: [
				"basis",
				"grow",
				"shrink"
			],
			gap: ["gap-x", "gap-y"],
			p: [
				"px",
				"py",
				"ps",
				"pe",
				"pt",
				"pr",
				"pb",
				"pl"
			],
			px: ["pr", "pl"],
			py: ["pt", "pb"],
			m: [
				"mx",
				"my",
				"ms",
				"me",
				"mt",
				"mr",
				"mb",
				"ml"
			],
			mx: ["mr", "ml"],
			my: ["mt", "mb"],
			size: ["w", "h"],
			"font-size": ["leading"],
			"fvn-normal": [
				"fvn-ordinal",
				"fvn-slashed-zero",
				"fvn-figure",
				"fvn-spacing",
				"fvn-fraction"
			],
			"fvn-ordinal": ["fvn-normal"],
			"fvn-slashed-zero": ["fvn-normal"],
			"fvn-figure": ["fvn-normal"],
			"fvn-spacing": ["fvn-normal"],
			"fvn-fraction": ["fvn-normal"],
			"line-clamp": ["display", "overflow"],
			rounded: [
				"rounded-s",
				"rounded-e",
				"rounded-t",
				"rounded-r",
				"rounded-b",
				"rounded-l",
				"rounded-ss",
				"rounded-se",
				"rounded-ee",
				"rounded-es",
				"rounded-tl",
				"rounded-tr",
				"rounded-br",
				"rounded-bl"
			],
			"rounded-s": ["rounded-ss", "rounded-es"],
			"rounded-e": ["rounded-se", "rounded-ee"],
			"rounded-t": ["rounded-tl", "rounded-tr"],
			"rounded-r": ["rounded-tr", "rounded-br"],
			"rounded-b": ["rounded-br", "rounded-bl"],
			"rounded-l": ["rounded-tl", "rounded-bl"],
			"border-spacing": ["border-spacing-x", "border-spacing-y"],
			"border-w": [
				"border-w-s",
				"border-w-e",
				"border-w-t",
				"border-w-r",
				"border-w-b",
				"border-w-l"
			],
			"border-w-x": ["border-w-r", "border-w-l"],
			"border-w-y": ["border-w-t", "border-w-b"],
			"border-color": [
				"border-color-s",
				"border-color-e",
				"border-color-t",
				"border-color-r",
				"border-color-b",
				"border-color-l"
			],
			"border-color-x": ["border-color-r", "border-color-l"],
			"border-color-y": ["border-color-t", "border-color-b"],
			"scroll-m": [
				"scroll-mx",
				"scroll-my",
				"scroll-ms",
				"scroll-me",
				"scroll-mt",
				"scroll-mr",
				"scroll-mb",
				"scroll-ml"
			],
			"scroll-mx": ["scroll-mr", "scroll-ml"],
			"scroll-my": ["scroll-mt", "scroll-mb"],
			"scroll-p": [
				"scroll-px",
				"scroll-py",
				"scroll-ps",
				"scroll-pe",
				"scroll-pt",
				"scroll-pr",
				"scroll-pb",
				"scroll-pl"
			],
			"scroll-px": ["scroll-pr", "scroll-pl"],
			"scroll-py": ["scroll-pt", "scroll-pb"],
			touch: [
				"touch-x",
				"touch-y",
				"touch-pz"
			],
			"touch-x": ["touch"],
			"touch-y": ["touch"],
			"touch-pz": ["touch"]
		},
		conflictingClassGroupModifiers: { "font-size": ["leading"] }
	};
});
// lib/utils.ts
function J(...e) {
	return me(f(e));
}
// components/ui/card.tsx
var Y = i(), he = l.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, Y.jsx)("div", {
	ref: n,
	className: J("rounded-lg border bg-card text-card-foreground shadow-sm", e),
	...t
}));
he.displayName = "Card";
var ge = l.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, Y.jsx)("div", {
	ref: n,
	className: J("flex flex-col space-y-1.5 p-6", e),
	...t
}));
ge.displayName = "CardHeader";
var _e = l.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, Y.jsx)("h3", {
	ref: n,
	className: J("text-2xl font-semibold leading-none tracking-tight", e),
	...t
}));
_e.displayName = "CardTitle";
var ve = l.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, Y.jsx)("p", {
	ref: n,
	className: J("text-sm text-muted-foreground", e),
	...t
}));
ve.displayName = "CardDescription";
var ye = l.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, Y.jsx)("div", {
	ref: n,
	className: J("p-6 pt-0", e),
	...t
}));
ye.displayName = "CardContent";
var be = l.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ (0, Y.jsx)("div", {
	ref: n,
	className: J("flex items-center p-6 pt-0", e),
	...t
}));
be.displayName = "CardFooter";
// node_modules/@radix-ui/react-compose-refs/dist/index.mjs
var xe = Object.defineProperty, X = (e, t) => xe(e, "name", {
	value: t,
	configurable: !0
});
function Z(e, t) {
	if (typeof e == "function") return e(t);
	e != null && (e.current = t);
}
X(Z, "setRef");
function Se(...e) {
	return (t) => {
		let n = !1, r = e.map((e) => {
			let r = Z(e, t);
			return !n && typeof r == "function" && (n = !0), r;
		});
		if (n) return () => {
			for (let t = 0; t < r.length; t++) {
				let n = r[t];
				typeof n == "function" ? n() : Z(e[t], null);
			}
		};
	};
}
X(Se, "composeRefs");
function Ce(...e) {
	return l.useCallback(Se(...e), e);
}
X(Ce, "useComposedRefs");
// node_modules/@radix-ui/react-slot/dist/index.mjs
var we = Object.defineProperty, Q = (e, t) => we(e, "name", {
	value: t,
	configurable: !0
});
// @__NO_SIDE_EFFECTS__
function Te(e) {
	let t = l.forwardRef((t, n) => {
		let { children: r, ...i } = t, a = null, o = !1, s = [];
		r = Ie(r), l.Children.forEach(r, (e) => {
			if (Me(e)) {
				o = !0;
				let t = e, n = "child" in t.props ? t.props.child : t.props.children;
				for (; Pe(n) && typeof $ == "function";) n = $(n._payload);
				a = ke(t, n), s.push(a?.props?.children);
			} else s.push(e);
		}), a ? a = l.cloneElement(a, void 0, s) : !o && l.Children.count(r) === 1 && l.isValidElement(r) && (a = r);
		let c = a ? je(a) : void 0, u = Ce(n, c);
		if (!a) {
			if (r || r === 0) throw Error(o ? ze(e) : Re(e));
			return r;
		}
		let d = Ae(i, a.props ?? {});
		return a.type !== l.Fragment && (d.ref = n ? u : c), l.cloneElement(a, d);
	});
	return t.displayName = `${e}.Slot`, t;
}
Q(Te, "createSlot");
var Ee = /* @__PURE__ */ Te("Slot"), De = Symbol.for("radix.slottable");
// @__NO_SIDE_EFFECTS__
function Oe(e) {
	let t = /* @__PURE__ */ Q((e) => "child" in e ? e.children(e.child) : e.children, "Slottable");
	return t.displayName = `${e}.Slottable`, t.__radixId = De, t;
}
Q(Oe, "createSlottable");
var ke = /* @__PURE__ */ Q((e, t) => "child" in e.props ? l.isValidElement(t) ? l.cloneElement(t, void 0, e.props.children(t.props.children)) : null : l.isValidElement(t) ? t : null, "getSlottableElementFromSlottable");
function Ae(e, t) {
	let n = { ...t };
	for (let r in t) {
		let i = e[r], a = t[r];
		/^on[A-Z]/.test(r) ? i && a ? n[r] = (...e) => {
			let t = a(...e);
			return i(...e), t;
		} : i && (n[r] = i) : r === "style" ? n[r] = {
			...i,
			...a
		} : r === "className" ? n[r] = [i, a].filter(Boolean).join(" ") : r === "aria-describedby" && (n[r] = Le(a, i));
	}
	return {
		...e,
		...n
	};
}
Q(Ae, "mergeProps");
function je(e) {
	let t = Object.getOwnPropertyDescriptor(e.props, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning;
	return n ? e.ref : (t = Object.getOwnPropertyDescriptor(e, "ref")?.get, n = t && "isReactWarning" in t && t.isReactWarning, n ? e.props.ref : e.props.ref || e.ref);
}
Q(je, "getElementRef");
function Me(e) {
	return l.isValidElement(e) && typeof e.type == "function" && "__radixId" in e.type && e.type.__radixId === De;
}
Q(Me, "isSlottable");
var Ne = Symbol.for("react.lazy");
function Pe(e) {
	return typeof e == "object" && !!e && "$$typeof" in e && e.$$typeof === Ne && "_payload" in e && Fe(e._payload);
}
Q(Pe, "isLazyComponent");
function Fe(e) {
	return typeof e == "object" && !!e && "then" in e;
}
Q(Fe, "isPromiseLike");
function Ie(e) {
	let t = e;
	for (; Pe(t) && typeof $ == "function";) t = $(t._payload);
	return t;
}
Q(Ie, "useUnwrappedLazy");
function Le(...e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) if (typeof n == "string") for (let e of String(n).trim().split(/\s+/)) e && t.add(e);
	return t.size > 0 ? Array.from(t).join(" ") : void 0;
}
Q(Le, "concatAriaDescribedby");
var Re = /* @__PURE__ */ Q((e) => `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`, "createSlotError"), ze = /* @__PURE__ */ Q((e) => `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`, "createSlottableError"), $ = l.use, Be = (e) => typeof e == "boolean" ? `${e}` : e === 0 ? "0" : e, Ve = f, He = ((e, t) => (n) => {
	if (t?.variants == null) return Ve(e, n?.class, n?.className);
	let { variants: r, defaultVariants: i } = t, a = Object.keys(r).map((e) => {
		let t = n?.[e], a = i?.[e];
		if (t === null) return null;
		let o = Be(t) || Be(a);
		return r[e][o];
	}), o = n && Object.entries(n).reduce((e, t) => {
		let [n, r] = t;
		return r === void 0 || (e[n] = r), e;
	}, {});
	return Ve(e, a, t?.compoundVariants?.reduce((e, t) => {
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
}), Ue = l.forwardRef(({ className: e, variant: t, size: n, asChild: r = !1, ...i }, a) => /* @__PURE__ */ (0, Y.jsx)(r ? Ee : "button", {
	ref: a,
	className: J(He({
		variant: t,
		size: n,
		className: e
	})),
	...i
}));
Ue.displayName = "Button";
// components/ui/shiny-button.tsx
var We = l.forwardRef(({ className: e, type: t = "button", children: n, ...r }, i) => /* @__PURE__ */ (0, Y.jsx)(Ue, {
	ref: i,
	type: t,
	className: J("shiny-cta", e),
	...r,
	children: n
}));
We.displayName = "ShinyButton";
// components/ui/qr-code-generator.tsx
function Ge({ data: e, isLoading: t = !1, error: n, title: r = "کد ورود مخاطب", compact: i = !1, filename: a = "qrcode.png" }) {
	let [s, u] = l.useState(!1), [d, f] = l.useState(!1), [p, m] = l.useState(null), h = l.useRef(0);
	return l.useEffect(() => (h.current++, f(!1), u(!1), m(null), () => {
		h.current++;
	}), [e?.data]), /* @__PURE__ */ (0, Y.jsxs)(he, {
		className: J("qr-code-card", i && "qr-code-card-compact"),
		children: [!i && /* @__PURE__ */ (0, Y.jsxs)(ge, { children: [/* @__PURE__ */ (0, Y.jsx)(_e, { children: r }), /* @__PURE__ */ (0, Y.jsx)(ve, {
			dir: "ltr",
			children: e?.data || "QR مخصوص همین پنل"
		})] }), /* @__PURE__ */ (0, Y.jsxs)(ye, { children: [t ? /* @__PURE__ */ (0, Y.jsx)("div", {
			className: "qr-loading",
			role: "status",
			"aria-label": "در حال آماده‌کردن QR"
		}) : n ? /* @__PURE__ */ (0, Y.jsx)("p", {
			className: "qr-error",
			role: "alert",
			children: n
		}) : e ? /* @__PURE__ */ (0, Y.jsxs)(Y.Fragment, { children: [/* @__PURE__ */ (0, Y.jsx)("div", {
			className: "qr-image-board",
			children: /* @__PURE__ */ (0, Y.jsx)("img", {
				src: e.output,
				alt: "کد QR ورود به همین پنل",
				width: e.size,
				height: e.size,
				decoding: "async"
			})
		}), !i && /* @__PURE__ */ (0, Y.jsxs)(Y.Fragment, { children: [/* @__PURE__ */ (0, Y.jsx)("p", {
			className: "qr-card-note",
			children: "با اسکن این کد وارد همین پنل شوید."
		}), /* @__PURE__ */ (0, Y.jsxs)(We, {
			onClick: async () => {
				if (!e?.output || s) return;
				let t = h.current;
				u(!0), m(null);
				try {
					if (!e.output.startsWith("data:image/png;base64,")) throw Error("invalid_png");
					let n = Uint8Array.from(atob(e.output.slice(e.output.indexOf(",") + 1)), (e) => e.charCodeAt(0)), r = URL.createObjectURL(new Blob([n], { type: "image/png" })), i = document.createElement("a");
					i.href = r, i.download = a, document.body.appendChild(i), i.click(), i.remove(), setTimeout(() => URL.revokeObjectURL(r), 15e3), t === h.current && (f(!0), setTimeout(() => {
						t === h.current && f(!1);
					}, 1600));
				} catch {
					t === h.current && m("دانلود انجام نشد؛ دوباره تلاش کنید.");
				} finally {
					t === h.current && u(!1);
				}
			},
			disabled: s,
			className: "qr-download",
			"aria-busy": s,
			"aria-live": "polite",
			"aria-label": d ? "QR ذخیره شد" : s ? "در حال دانلود QR" : "دانلود QR به صورت PNG",
			children: [d ? /* @__PURE__ */ (0, Y.jsx)(o, { "aria-hidden": "true" }) : /* @__PURE__ */ (0, Y.jsx)(c, { "aria-hidden": "true" }), /* @__PURE__ */ (0, Y.jsx)("span", { children: d ? "ذخیره شد" : s ? "در حال دانلود…" : "دانلود PNG" })]
		})] })] }) : /* @__PURE__ */ (0, Y.jsx)("p", {
			className: "qr-empty",
			children: "پنل را انتخاب کنید تا QR آن آماده شود."
		}), !i && p && /* @__PURE__ */ (0, Y.jsx)("p", {
			className: "qr-error",
			role: "alert",
			children: p
		})] })]
	});
}
// lib/qr-code.ts
function Ke(e, t = 960) {
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
var qe = (e) => ({
	url: e.dataset.qrUrl || "",
	title: e.dataset.qrTitle || "کد ورود مخاطب",
	compact: e.dataset.qrCompact === "true"
});
function Je({ element: e }) {
	let [t, n] = (0, l.useState)(() => qe(e));
	(0, l.useEffect)(() => {
		let t = () => {
			let t = qe(e);
			n((e) => e.url === t.url && e.title === t.title && e.compact === t.compact ? e : t);
		};
		return e.addEventListener("mofid:qr-update", t), t(), () => e.removeEventListener("mofid:qr-update", t);
	}, [e]);
	let r = (0, l.useMemo)(() => {
		if (!t.url) return {
			data: null,
			error: null
		};
		try {
			return {
				data: Ke(t.url),
				error: null
			};
		} catch (e) {
			return {
				data: null,
				error: e instanceof Error ? e.message : "تصویر QR آماده نشد."
			};
		}
	}, [t.url]), i = t.url && new URL(t.url, location.href).searchParams.get("class") || "main";
	return /* @__PURE__ */ (0, Y.jsx)(Ge, {
		data: r.data,
		error: r.error,
		title: t.title,
		compact: t.compact,
		filename: "panel-qr-" + i + ".png"
	});
}
for (let e of document.querySelectorAll("[data-qr-card]")) if (e.dataset.qrEnhanced = "true", (0, u.createRoot)(e).render(/* @__PURE__ */ (0, Y.jsx)(Je, { element: e })), e.id === "classQr") {
	let e = document.getElementById("downloadClassQr");
	e && (e.hidden = !0);
}
