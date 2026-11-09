import { a as e, c as t, i as n, o as r, r as i, s as a, t as o } from "./aurora-UOpARlMs.js";
// node_modules/framer-motion/dist/es/context/LayoutGroupContext.mjs
var s = /* @__PURE__ */ t(a(), 1), c = /* @__PURE__ */ (0, s.createContext)({});
// node_modules/framer-motion/dist/es/utils/use-constant.mjs
function l(e) {
	let t = (0, s.useRef)(null);
	return t.current === null && (t.current = e()), t.current;
}
// node_modules/framer-motion/dist/es/utils/use-isomorphic-effect.mjs
var u = typeof window < "u" ? s.useLayoutEffect : s.useEffect, d = /* @__PURE__ */ (0, s.createContext)(null);
// node_modules/motion-utils/dist/es/array.mjs
function f(e, t) {
	e.indexOf(t) === -1 && e.push(t);
}
function p(e, t) {
	let n = e.indexOf(t);
	n > -1 && e.splice(n, 1);
}
// node_modules/motion-utils/dist/es/clamp.mjs
var m = (e, t, n) => n > t ? t : n < e ? e : n, h = {}, g = (e) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(e), _ = (e) => typeof e == "object" && !!e, v = (e) => /^0[^.\s]+$/u.test(e);
// node_modules/motion-utils/dist/es/memo.mjs
/*#__NO_SIDE_EFFECTS__*/
function y(e) {
	let t;
	return () => (t === void 0 && (t = e()), t);
}
// node_modules/motion-utils/dist/es/noop.mjs
var b = /* @__NO_SIDE_EFFECTS__ */ (e) => e, x = (...e) => e.reduce((e, t) => (n) => t(e(n))), S = /* @__NO_SIDE_EFFECTS__ */ (e, t, n) => {
	let r = t - e;
	return r ? (n - e) / r : 1;
}, C = class {
	constructor() {
		this.subscriptions = [];
	}
	add(e) {
		return f(this.subscriptions, e), () => this.remove(e);
	}
	remove(e) {
		p(this.subscriptions, e);
	}
	notify(e, t, n) {
		let r = this.subscriptions.length;
		if (r) {
			if (r === 1) this.subscriptions[0](e, t, n);
			else for (let i = 0; i < r; i++) {
				let r = this.subscriptions[i];
				r && r(e, t, n);
			}
		}
	}
	getSize() {
		return this.subscriptions.length;
	}
	clear() {
		this.subscriptions.length = 0;
	}
}, w = /* @__NO_SIDE_EFFECTS__ */ (e) => e * 1e3, T = /* @__NO_SIDE_EFFECTS__ */ (e) => e / 1e3, E = /* @__NO_SIDE_EFFECTS__ */ (e, t) => t ? 1e3 / t * e : 0, D = (e, t, n) => e * (3 * (1 - e) * ((1 - e) * t + e * n) + e * e);
/*#__NO_SIDE_EFFECTS__*/
function O(e, t, n, r) {
	return e === t && n === r ? b : (i) => {
		let a = 0, o = 1, s = i;
		for (let t = 0;; t++) {
			s >= a && s <= o || (s = (a + o) / 2);
			let r = D(s, e, n) - i;
			if (r * r < 1e-28 || t === 40) break;
			r > 0 ? o = s : a = s, s -= r * 1e-7 / (D(s + 1e-7, e, n) - i - r);
		}
		return D(s, t, r);
	};
}
// node_modules/motion-utils/dist/es/easing/modifiers/mirror.mjs
var ee = /* @__NO_SIDE_EFFECTS__ */ (e) => (t) => t <= .5 ? e(2 * t) / 2 : (2 - e(2 * (1 - t))) / 2, k = /* @__NO_SIDE_EFFECTS__ */ (e) => (t) => 1 - e(1 - t), te = /*@__PURE__*/ O(.33, 1.53, .69, .99), ne = /*@__PURE__*/ k(te), re = /*@__PURE__*/ ee(ne), ie = (e) => e >= 1 ? 1 : (e *= 2) < 1 ? .5 * ne(e) : .5 * (2 - 2 ** (-10 * (e - 1))), ae = (e) => 1 - Math.sin(Math.acos(e)), A = /* @__PURE__ */ k(ae), oe = /* @__PURE__ */ ee(ae), se = /*@__PURE__*/ O(.42, 0, 1, 1), ce = /*@__PURE__*/ O(0, 0, .58, 1), le = /*@__PURE__*/ O(.42, 0, .58, 1), ue = /* @__NO_SIDE_EFFECTS__ */ (e) => Array.isArray(e) && typeof e[0] != "number", de = /* @__NO_SIDE_EFFECTS__ */ (e) => Array.isArray(e) && typeof e[0] == "number", fe = {
	linear: b,
	easeIn: se,
	easeInOut: le,
	easeOut: ce,
	circIn: ae,
	circInOut: oe,
	circOut: A,
	backIn: ne,
	backInOut: re,
	backOut: te,
	anticipate: ie
}, pe = (e) => typeof e == "string", me = (e) => {
	if (/* @__PURE__ */ de(e)) {
		let [t, n, r, i] = e;
		return /* @__PURE__ */ O(t, n, r, i);
	}
	return pe(e) ? fe[e] : e;
}, j = {
	delta: 0,
	timestamp: 0,
	isProcessing: !1
}, he;
function ge() {
	he = void 0;
}
var M = {
	now: () => (he === void 0 && M.set(j.isProcessing || h.useManualTiming ? j.timestamp : performance.now()), he),
	set: (e) => {
		he = e, queueMicrotask(ge);
	}
}, _e = (e) => Math.round(e * 1e5) / 1e5, ve = (e) => (t) => typeof t == "string" && t.startsWith(e), ye = /*@__PURE__*/ ve("--"), be = /*@__PURE__*/ ve("var(--"), xe = (e) => be(e) ? Se.test(e.split("/*")[0].trim()) : !1, Se = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;
function Ce(e) {
	return typeof e == "string" && e.split("/*")[0].includes("var(--");
}
// node_modules/motion-dom/dist/es/value/types/numbers/index.mjs
var we = {
	test: (e) => typeof e == "number",
	parse: parseFloat,
	transform: (e) => e
}, Te = {
	...we,
	transform: (e) => m(0, 1, e)
}, Ee = {
	...we,
	default: 1
}, De = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
// node_modules/motion-dom/dist/es/value/types/utils/is-nullish.mjs
function Oe(e) {
	return e == null;
}
// node_modules/motion-dom/dist/es/value/types/utils/single-color-regex.mjs
var ke = /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu, Ae = (e, t) => (n) => !!(typeof n == "string" && ke.test(n) && n.startsWith(e) || t && !Oe(n) && Object.prototype.hasOwnProperty.call(n, t)), je = (e, t, n) => (r) => {
	if (typeof r != "string") return r;
	let [i, a, o, s] = r.match(De);
	return {
		[e]: parseFloat(i),
		[t]: parseFloat(a),
		[n]: parseFloat(o),
		alpha: s === void 0 ? 1 : parseFloat(s)
	};
}, Me = (e) => m(0, 255, e), Ne = {
	...we,
	transform: (e) => Math.round(Me(e))
}, Pe = {
	test: /*@__PURE__*/ Ae("rgb", "red"),
	parse: /*@__PURE__*/ je("red", "green", "blue"),
	transform: ({ red: e, green: t, blue: n, alpha: r = 1 }) => "rgba(" + Ne.transform(e) + ", " + Ne.transform(t) + ", " + Ne.transform(n) + ", " + _e(Te.transform(r)) + ")"
}, Fe = (e, t, n) => {
	let r = e.substring(1 + t * n, 1 + (t + 1) * n);
	return n > 1 ? r : r + r;
};
function Ie(e) {
	let t = e.length > 5 ? 2 : 1, n = Fe(e, 3, t);
	return {
		red: parseInt(Fe(e, 0, t), 16),
		green: parseInt(Fe(e, 1, t), 16),
		blue: parseInt(Fe(e, 2, t), 16),
		alpha: n ? parseInt(n, 16) / 255 : 1
	};
}
var Le = {
	test: /*@__PURE__*/ Ae("#"),
	parse: Ie,
	transform: Pe.transform
}, Re = /* @__NO_SIDE_EFFECTS__ */ (e) => ({
	test: (t) => typeof t == "string" && t.endsWith(e) && t.split(" ").length === 1,
	parse: parseFloat,
	transform: (t) => `${t}${e}`
}), N = /*@__PURE__*/ Re("deg"), P = /*@__PURE__*/ Re("%"), F = /*@__PURE__*/ Re("px"), ze = /*@__PURE__*/ Re("vh"), Be = /*@__PURE__*/ Re("vw"), Ve = {
	...P,
	parse: (e) => P.parse(e) / 100,
	transform: (e) => P.transform(e * 100)
}, He = {
	test: /*@__PURE__*/ Ae("hsl", "hue"),
	parse: /*@__PURE__*/ je("hue", "saturation", "lightness"),
	transform: ({ hue: e, saturation: t, lightness: n, alpha: r = 1 }) => "hsla(" + Math.round(e) + ", " + P.transform(_e(t)) + ", " + P.transform(_e(n)) + ", " + _e(Te.transform(r)) + ")"
}, I = {
	test: (e) => Pe.test(e) || Le.test(e) || He.test(e),
	parse: (e) => Pe.test(e) ? Pe.parse(e) : He.test(e) ? He.parse(e) : Le.parse(e),
	transform: (e) => typeof e == "string" ? e : e.hasOwnProperty("red") ? Pe.transform(e) : He.transform(e),
	getAnimatableNone: (e) => {
		let t = I.parse(e);
		return t.alpha = 0, I.transform(t);
	}
}, Ue = /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu, We = /*@__PURE__*/ new RegExp(De.source), Ge = /*@__PURE__*/ new RegExp(Ue.source, "i");
function Ke(e) {
	return isNaN(e) && typeof e == "string" && (We.test(e) || Ge.test(e));
}
var qe = "number", Je = "color", Ye = "var", Xe = "var(", Ze = "${}", Qe = /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)(?![a-z]*\()/giu;
function $e(e) {
	let t = e.toString();
	return We.test(t) || Ge.test(t);
}
function et(e) {
	let t = e.toString(), n = [], r = {
		color: [],
		number: [],
		var: []
	}, i = [], a = 0;
	return {
		values: n,
		split: t.replace(Qe, (e) => (I.test(e) ? (r.color.push(a), i.push(Je), n.push(I.parse(e))) : e.startsWith(Xe) ? (r.var.push(a), i.push(Ye), n.push(e)) : (r.number.push(a), i.push(qe), n.push(parseFloat(e))), ++a, Ze)).split(Ze),
		indexes: r,
		types: i
	};
}
function tt(e) {
	return et(e).values;
}
function nt({ split: e, types: t }) {
	let n = e.length;
	return (r) => {
		let i = "";
		for (let a = 0; a < n; a++) if (i += e[a], r[a] !== void 0) {
			let e = t[a];
			i += e === qe ? _e(r[a]) : e === Je ? I.transform(r[a]) : r[a];
		}
		return i;
	};
}
function rt(e) {
	return nt(et(e));
}
var it = (e) => typeof e == "number" ? 0 : I.test(e) ? I.getAnimatableNone(e) : e, at = (e, t) => typeof e == "number" ? t?.trim().endsWith("/") ? e : 0 : it(e);
function ot(e) {
	let t = et(e);
	return nt(t)(t.values.map((e, n) => at(e, t.split[n])));
}
var L = {
	test: Ke,
	parse: tt,
	createTransformer: rt,
	getAnimatableNone: ot
};
// node_modules/motion-dom/dist/es/value/types/color/hsla-to-rgba.mjs
function st(e, t, n) {
	return n < 0 && (n += 1), n > 1 && --n, n < 1 / 6 ? e + (t - e) * 6 * n : n < 1 / 2 ? t : n < 2 / 3 ? e + (t - e) * (2 / 3 - n) * 6 : e;
}
function ct({ hue: e, saturation: t, lightness: n, alpha: r }) {
	e /= 360, t /= 100, n /= 100;
	let i = 0, a = 0, o = 0;
	if (!t) i = a = o = n;
	else {
		let r = n < .5 ? n * (1 + t) : n + t - n * t, s = 2 * n - r;
		i = st(s, r, e + 1 / 3), a = st(s, r, e), o = st(s, r, e - 1 / 3);
	}
	return {
		red: Math.round(i * 255),
		green: Math.round(a * 255),
		blue: Math.round(o * 255),
		alpha: r
	};
}
// node_modules/motion-dom/dist/es/utils/mix/immediate.mjs
function lt(e, t) {
	return (n) => n > 0 ? t : e;
}
// node_modules/motion-dom/dist/es/utils/mix/number.mjs
var R = (e, t, n) => e + (t - e) * n, ut = (e, t, n) => {
	let r = e * e, i = n * (t * t - r) + r;
	return i < 0 ? 0 : Math.sqrt(i);
}, dt = [
	Le,
	Pe,
	He
], ft = (e) => dt.find((t) => t.test(e));
function pt(e) {
	let t = ft(e);
	if (!t) return !1;
	let n = t.parse(e);
	return t === He && (n = ct(n)), n;
}
var mt = (e, t) => {
	let n = pt(e), r = pt(t);
	if (!n || !r) return lt(e, t);
	let i = { ...n };
	return (e) => (i.red = ut(n.red, r.red, e), i.green = ut(n.green, r.green, e), i.blue = ut(n.blue, r.blue, e), i.alpha = R(n.alpha, r.alpha, e), Pe.transform(i));
}, ht = /* @__PURE__ */ new Set(["none", "hidden"]);
function gt(e, t) {
	return ht.has(e) ? (n) => n <= 0 ? e : t : (n) => n >= 1 ? t : e;
}
// node_modules/motion-dom/dist/es/utils/mix/complex.mjs
function _t(e, t) {
	return (n) => R(e, t, n);
}
function vt(e) {
	return typeof e == "number" ? _t : typeof e == "string" ? xe(e) ? lt : I.test(e) ? mt : St : Array.isArray(e) ? yt : typeof e == "object" ? I.test(e) ? mt : bt : lt;
}
function yt(e, t) {
	let n = [...e], r = n.length, i = e.map((e, n) => vt(e)(e, t[n]));
	return (e) => {
		for (let t = 0; t < r; t++) n[t] = i[t](e);
		return n;
	};
}
function bt(e, t) {
	let n = {
		...e,
		...t
	}, r = {};
	for (let i in n) e[i] !== void 0 && t[i] !== void 0 && (r[i] = vt(e[i])(e[i], t[i]));
	return (e) => {
		for (let t in r) n[t] = r[t](e);
		return n;
	};
}
function xt(e, t) {
	let n = [], r = {
		color: 0,
		var: 0,
		number: 0
	};
	for (let i = 0; i < t.values.length; i++) {
		let a = t.types[i], o = e.indexes[a][r[a]], s = e.values[o] ?? 0;
		n[i] = s, r[a]++;
	}
	return n;
}
var St = (e, t) => {
	let n = et(e), r = et(t);
	return n.indexes.var.length === r.indexes.var.length && n.indexes.color.length === r.indexes.color.length && n.indexes.number.length >= r.indexes.number.length ? ht.has(e) && !r.values.length || ht.has(t) && !n.values.length ? gt(e, t) : x(yt(xt(n, r), r.values), nt(r)) : lt(e, t);
}, Ct = /^(-?(?:\d+(?:\.\d*)?|\.\d+))([a-z%]*)$/iu;
function wt(e, t) {
	let n = Ct.exec(e);
	if (!n) return;
	let r = Ct.exec(t);
	if (!r || n[2] !== r[2]) return;
	let i = n[2], a = parseFloat(n[1]), o = parseFloat(r[1]);
	return (e) => _e(R(a, o, e)) + i;
}
function Tt(e, t, n) {
	if (typeof e == "number" && typeof t == "number" && typeof n == "number") return R(e, t, n);
	if (typeof e == "string" && typeof t == "string") {
		let n = wt(e, t);
		if (n) return n;
	}
	return vt(e)(e, t);
}
// node_modules/motion-dom/dist/es/frameloop/order.mjs
var Et = [
	"setup",
	"read",
	"resolveKeyframes",
	"preUpdate",
	"update",
	"preRender",
	"render",
	"postRender"
];
// node_modules/motion-dom/dist/es/frameloop/render-step.mjs
function Dt(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = !1, i = !1, a, o = /* @__PURE__ */ new Set(), s = {
		delta: 0,
		timestamp: 0,
		isProcessing: !1
	};
	function c(t) {
		o.has(t) && (n.add(t), e()), (a = t)(s);
	}
	let l = {
		schedule: (e, i = !1, s = !1) => {
			let c = s && r, l = c ? t : n;
			return i && o.add(e), c && e !== a && l.delete(e), l.add(e), e;
		},
		cancel: (e) => {
			n.delete(e), o.delete(e);
		},
		process: (e) => {
			if (s = e, r) {
				i = !0;
				return;
			}
			r = !0;
			let o = t;
			t = n, n = o, t.forEach(c), t.clear(), a = void 0, r = !1, i && (i = !1, l.process(e));
		}
	};
	return l;
}
// node_modules/motion-dom/dist/es/frameloop/batcher.mjs
var Ot = 40;
function kt(e, t, n = {
	delta: 0,
	timestamp: 0,
	isProcessing: !1
}) {
	let r = !1, i = !0, a = () => r = !0, o = Et.reduce((e, t) => (e[t] = Dt(a), e), {}), { setup: s, read: c, resolveKeyframes: l, preUpdate: u, update: d, preRender: f, render: p, postRender: m } = o, g = () => {
		let a = h.useManualTiming, o = a ? n.timestamp : performance.now();
		r = !1, a || (n.delta = i ? 1e3 / 60 : Math.max(Math.min(o - n.timestamp, Ot), 1)), n.timestamp = o, n.isProcessing = !0, s.process(n), c.process(n), l.process(n), u.process(n), d.process(n), f.process(n), p.process(n), m.process(n), n.isProcessing = !1, r && t && (i = !1, e(g));
	}, _ = () => {
		r = !0, i = !0, n.isProcessing || e(g);
	};
	return {
		schedule: Et.reduce((e, t) => {
			let n = o[t];
			return e[t] = (e, t = !1, i = !1) => (r || _(), n.schedule(e, t, i)), e;
		}, {}),
		cancel: (e) => {
			for (let t = 0; t < Et.length; t++) o[Et[t]].cancel(e);
		},
		state: n,
		steps: o
	};
}
// node_modules/motion-dom/dist/es/frameloop/frame.mjs
var { schedule: z, cancel: B, steps: At } = /* @__PURE__ */ kt(typeof requestAnimationFrame < "u" ? requestAnimationFrame : b, !0, j), jt = (e) => {
	let t = ({ timestamp: t }) => e(t);
	return {
		start: (e = !0) => z.update(t, e),
		stop: () => B(t),
		now: () => j.isProcessing ? j.timestamp : M.now()
	};
}, Mt = (e, t, n = 10) => {
	let r = "", i = Math.max(Math.round(t / n), 2);
	for (let t = 0; t < i; t++) r += Math.round(e(t / (i - 1)) * 1e4) / 1e4 + ", ";
	return `linear(${r.substring(0, r.length - 2)})`;
}, Nt = 2e4;
function Pt(e, t = 50, n = Nt, r) {
	let i = 0, a = e.next(i);
	for (r?.push(a.value); !a.done && i < n;) i += t, a = e.next(i), r?.push(a.value);
	return i >= n ? Infinity : i;
}
// node_modules/motion-dom/dist/es/animation/generators/utils/create-generator-easing.mjs
function Ft(e, t = 100, n) {
	let { keyframes: r, velocity: i } = e, a = r && r[r.length - 1] - r[0], o = n({
		...e,
		velocity: i && a ? i * t / a : i,
		keyframes: [0, t]
	}), s = Math.min(Pt(o), Nt);
	return {
		type: "keyframes",
		ease: (e) => o.next(s * e).value / t,
		duration: /* @__PURE__ */ T(s)
	};
}
// node_modules/motion-dom/dist/es/animation/generators/spring.mjs
var It = 100, Lt = 10, Rt = 1, zt = 800, Bt = .3, Vt = .3, Ht = .01, Ut = 2, Wt = .005, Gt = .5, Kt = .01, qt = 10, Jt = .05, Yt = (e) => e < 0 ? 1 / Math.max(1 + e, Jt) : Math.max(1 - e, Jt);
function Xt(e, t) {
	if (!(e > 1)) return 1;
	let n = Math.sqrt(e * e - 1), r = e - n, i = e + n, a = 2 * n * Math.exp(-t) * (1 + t);
	return $t((e) => i * Math.exp(-r * e) - r * Math.exp(-i * e) - a, (e) => Math.exp(-i * e) - Math.exp(-r * e), t) / t;
}
function Zt(e, t) {
	return e * Math.sqrt(1 - t * t);
}
var Qt = 12;
function $t(e, t, n) {
	let r = n;
	for (let n = 1; n < Qt; n++) r -= e(r) / t(r);
	return r;
}
var en = .001;
function tn({ duration: e = zt, bounce: t = Bt }) {
	let n, r, i = Yt(t);
	e = m(Kt, qt, /* @__PURE__ */ T(e)), i < 1 ? (n = (t) => {
		let n = t * i, r = n * e, a = Zt(t, i), o = Math.exp(-r);
		return en - n / a * o;
	}, r = (t) => {
		let r = t * i * e, a = i * i * t * t * e, o = Math.exp(-r), s = Zt(t * t, i);
		return (-n(t) + en > 0 ? -1 : 1) * -a * o / s;
	}) : (n = (t) => -.001 + Math.exp(-t * e) * (t * e + 1), r = (t) => Math.exp(-t * e) * (-t * (e * e)));
	let a = 5 / e, o = $t(n, r, a), s = o * Xt(i, o * e), c = s * s;
	return {
		stiffness: c,
		damping: i * 2 * Math.sqrt(c),
		duration: /* @__PURE__ */ w(e)
	};
}
var nn = (e, t) => (t ? e >= 0 : e > 0) && e < Infinity;
function rn(e, t) {
	if (nn(e, t)) return e;
}
function an(e) {
	let t = rn(e.stiffness), n = rn(e.damping, !0), r = rn(e.mass), i = {
		...e,
		stiffness: t ?? It,
		damping: n ?? Lt,
		mass: r ?? Rt,
		isResolvedFromDuration: !1,
		isTimeDefined: (t ?? n ?? r) === void 0 && (e.duration !== void 0 || e.bounce !== void 0)
	};
	if (i.isTimeDefined) {
		if (e.visualDuration) {
			let t = Yt(e.bounce || 0), n = 2 * Math.PI / (e.visualDuration * 1.2) * Xt(t, 2 * Math.PI / 1.2);
			i.stiffness = n * n, i.damping = 2 * t * Math.sqrt(i.stiffness);
		} else Object.assign(i, tn(i)), i.isResolvedFromDuration = !0;
		nn(i.stiffness) && nn(i.damping, !0) || (i.stiffness = It, i.damping = Lt);
	}
	return i;
}
function on(e = Vt, t = Bt) {
	let n = typeof e == "object" ? e : {
		visualDuration: e,
		keyframes: [0, 1],
		bounce: t
	}, r = n.keyframes[0], i = n.keyframes[n.keyframes.length - 1], a = {
		done: !1,
		value: r
	}, { stiffness: o, damping: s, mass: c, duration: l, isResolvedFromDuration: u, isTimeDefined: d } = an({ ...n }), f = (e) => d ? 0 : -/* @__PURE__ */ T(e), p = s / (2 * Math.sqrt(o * c)), m = /* @__PURE__ */ T(Math.sqrt(o / c)), h = p * m, g = {
		target: i,
		delta: i - r,
		velocity: f(n.velocity || 0) || 0,
		restSpeed: 0,
		restDelta: 0
	}, _ = () => {
		let e = Math.abs(g.delta) < 5;
		g.restSpeed = n.restSpeed || (e ? Ht : Ut), g.restDelta = n.restDelta || (e ? Wt : Gt);
	};
	_();
	let v, y, b;
	if (p < 1) {
		let e = Zt(m, p), t = {
			A: 0,
			sinC: 0,
			cosC: 0,
			t: -1,
			env: 0,
			sin: 0,
			cos: 0
		};
		b = () => {
			t.A = (g.velocity + h * g.delta) / e, t.sinC = h * t.A + g.delta * e, t.cosC = h * g.delta - t.A * e;
		};
		let n = (n) => {
			n !== t.t && (t.t = n, t.env = Math.exp(-h * n), t.sin = Math.sin(e * n), t.cos = Math.cos(e * n));
		};
		v = (e) => (n(e), g.target - t.env * (t.A * t.sin + g.delta * t.cos)), y = (e) => (n(e), t.env * (t.sinC * t.sin + t.cosC * t.cos));
	} else if (p === 1) {
		v = (e) => g.target - Math.exp(-m * e) * (g.delta + (g.velocity + m * g.delta) * e);
		let e = { C: 0 };
		b = () => {
			e.C = g.velocity + m * g.delta;
		}, y = (t) => Math.exp(-m * t) * (m * e.C * t - g.velocity);
	} else {
		let e = m * Math.sqrt(p * p - 1), t = h - e, n = h + e, r = e < 1 || d ? Infinity : 300 / e, i = (e, t) => Math.exp(t > r ? (h - e) * r - h * t : -e * t), a = {
			S: 0,
			F: 0
		};
		b = () => {
			let t = (g.velocity + h * g.delta) / e;
			a.S = (g.delta + t) / 2, a.F = (g.delta - t) / 2;
		}, v = (e) => g.target - a.S * i(t, e) - a.F * i(n, e), y = (e) => t * a.S * i(t, e) + n * a.F * i(n, e);
	}
	b();
	let x = u && l || null, S = {
		calculatedDuration: x,
		retarget: (e, t) => {
			g.target = e[e.length - 1], g.delta = g.target - e[0], g.velocity = f(t), n.restSpeed && n.restDelta || _(), S.calculatedDuration = x, a.done = !1, b();
		},
		velocity: (e) => /* @__PURE__ */ w(y(e)),
		next: (e) => {
			let t = v(e);
			if (u) a.done = e >= l;
			else {
				let n = /* @__PURE__ */ w(y(e));
				a.done = Math.abs(n) <= g.restSpeed && Math.abs(g.target - t) <= g.restDelta;
			}
			return a.value = a.done ? g.target : t, a;
		},
		toString: () => {
			let e = Math.min(Pt(S), Nt), t = Mt((t) => S.next(e * t).value, e, 30);
			return e + "ms " + t;
		},
		toTransition: () => {}
	};
	return S;
}
var sn = /* @__PURE__ */ Object.assign(on, { applyToOptions: (e) => {
	let t = Ft(e, 100, on);
	return e.ease = t.ease, e.duration = /* @__PURE__ */ w(t.duration), e.type = "keyframes", e;
} });
// node_modules/motion-dom/dist/es/animation/generators/inertia.mjs
function cn({ keyframes: e, velocity: t = 0, power: n = .8, timeConstant: r = 325, bounceDamping: i = 10, bounceStiffness: a = 500, modifyTarget: o, min: s, max: c, restDelta: l = .5, restSpeed: u }) {
	let d = e[0], f = {
		done: !1,
		value: d
	}, p = (e) => e < s || e > c, m = (e) => s === void 0 ? c : c === void 0 || Math.abs(s - e) < Math.abs(c - e) ? s : c, h = n * t, g = d + h, _ = o ? o(g) : g;
	_ !== g && (h = _ - d);
	let v = (e) => -h * Math.exp(-e / r), y = (e) => {
		let t = v(e);
		f.done = Math.abs(t) <= l, f.value = f.done ? _ : e ? _ + t : d;
	}, b, x, S = (e) => {
		p(f.value) && (b = e, x = sn({
			keyframes: [f.value, m(f.value)],
			velocity: -v(e) / r * 1e3,
			damping: i,
			stiffness: a,
			restDelta: l,
			restSpeed: u
		}));
	};
	return S(0), {
		calculatedDuration: null,
		next: (e) => {
			let t = !1;
			return !x && b === void 0 && (t = !0, y(e), S(e)), b !== void 0 && e >= b ? x.next(e - b) : (!t && y(e), f);
		}
	};
}
// node_modules/motion-dom/dist/es/utils/interpolate.mjs
function ln(e, t, n) {
	let r = [], i = h.mix || Tt, a = e.length - 1;
	for (let o = 0; o < a; o++) {
		let a = n?.(e[o], e[o + 1]) || i(e[o], e[o + 1]);
		t && (a = x(Array.isArray(t) ? t[o] || b : t, a)), r.push(a);
	}
	return r;
}
function un(e, t, { clamp: n = !0, ease: r, mixer: i } = {}) {
	let a = e.length;
	if (a === 1) return () => t[0];
	if (a === 2 && t[0] === t[1]) return () => t[1];
	let o = e[0] === e[1];
	e[0] > e[a - 1] && (e = [...e].reverse(), t = [...t].reverse());
	let s = ln(t, r, i), c = s.length, l = (n) => {
		if (o && n < e[0]) return t[0];
		let r = 0;
		if (c > 1) for (; r < e.length - 2 && !(n < e[r + 1]); r++);
		let i = /* @__PURE__ */ S(e[r], e[r + 1], n);
		return s[r](i);
	};
	return n ? (t) => l(m(e[0], e[a - 1], t)) : l;
}
// node_modules/motion-dom/dist/es/animation/keyframes/offsets/fill.mjs
function dn(e, t) {
	let n = e[e.length - 1];
	for (let r = 1; r <= t; r++) {
		let i = /* @__PURE__ */ S(0, t, r);
		e.push(R(n, 1, i));
	}
}
// node_modules/motion-dom/dist/es/animation/keyframes/offsets/default.mjs
function fn(e) {
	let t = [0];
	return dn(t, e.length - 1), t;
}
// node_modules/motion-dom/dist/es/animation/keyframes/offsets/time.mjs
function pn(e, t) {
	return e.map((e) => e * t);
}
// node_modules/motion-dom/dist/es/animation/generators/keyframes.mjs
function mn(e, t) {
	return e.map(() => t || le).splice(0, e.length - 1);
}
function V({ duration: e = 300, keyframes: t, times: n, ease: r = "easeInOut", mixer: i }) {
	let a = typeof t[0] == "number" ? void 0 : i, o = /* @__PURE__ */ ue(r) ? r.map(me) : me(r) || le, s = {
		done: !1,
		value: t[0]
	}, c = -1;
	if (!a) {
		for (let e = 1; e < t.length; e++) if (t[e] !== t[e - 1]) {
			if (c >= 0) {
				c = -2;
				break;
			}
			c = e - 1;
		}
	}
	if (c >= 0) {
		let r = n && n.length === t.length ? n : fn(t), i = r[c] * e, a = r[c + 1] * e, l = t[c], u = t[c + 1], d = Array.isArray(o) ? o[c] : o, f = (h.mix || Tt)(l, u), p = t.length - 2;
		return {
			calculatedDuration: e,
			next: (t) => (s.value = c && t < i ? f(0) : c < p && (t >= a || !e) ? typeof u == "number" ? u : f(1) : f(d(t >= a || !e ? 1 : t <= i ? 0 : (t - i) / (a - i))), s.done = t >= e, s)
		};
	}
	let l = un(pn(n && n.length === t.length ? n : fn(t), e), t, {
		ease: Array.isArray(o) ? o : mn(t, o),
		mixer: a
	});
	return {
		calculatedDuration: e,
		next: (t) => (s.value = l(t), s.done = t >= e, s)
	};
}
// node_modules/motion-dom/dist/es/animation/generators/utils/velocity.mjs
var hn = 5;
function gn(e, t, n) {
	let r = Math.max(t - hn, 0);
	return /* @__PURE__ */ E(n - e(r), t - r);
}
function _n(e, t, n = 0) {
	return t <= 0 ? n : e.velocity ? e.velocity(t) : gn((t) => e.next(t).value, t, e.next(t).value);
}
// node_modules/motion-dom/dist/es/animation/keyframes/get-final.mjs
function vn(e, { repeat: t, repeatType: n = "loop" }, r, i = 1) {
	let a, o, s = 0;
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		n !== null && (s++ || (a = n), o = n);
	}
	let c = i < 0 || t && n !== "loop" && t % 2 == 1 ? 0 : s - 1;
	return !c || r === void 0 ? c ? o : a : r;
}
// node_modules/motion-dom/dist/es/animation/utils/replace-transition-type.mjs
var yn = {
	decay: cn,
	inertia: cn,
	tween: V,
	keyframes: V,
	spring: sn
};
function bn(e) {
	typeof e.type == "string" && (e.type = yn[e.type]);
}
// node_modules/motion-dom/dist/es/animation/utils/resolve-start-time.mjs
var xn = 40, Sn = (e, t) => t - e > xn && !h.useManualTiming ? t : e;
// node_modules/motion-dom/dist/es/animation/utils/notify-inspector.mjs
function Cn(e, t) {
	return {
		kind: e,
		animation: t,
		timestamp: M.now(),
		frameTimestamp: j.timestamp,
		frameIsProcessing: j.isProcessing
	};
}
function wn(e, t, n) {
	let r = globalThis.__MOTION_INSPECT__;
	if (r) try {
		r({
			...Cn("animation-start", e),
			options: n ? {
				...t,
				...n
			} : t
		});
	} catch {}
}
function Tn(e, t) {
	let n = globalThis.__MOTION_INSPECT__;
	if (n) try {
		n({
			...Cn("layout-animation-start", e),
			node: t
		});
	} catch {}
}
// node_modules/motion-dom/dist/es/animation/utils/WithPromise.mjs
var En = class {
	constructor() {
		this.isResolved = !1;
	}
	get finished() {
		return this._finished ||= this.isResolved ? Promise.resolve() : new Promise((e) => {
			this._resolve = e;
		}), this._finished;
	}
	updateFinished() {
		this._finished = this._resolve = void 0, this.isResolved = !1;
	}
	notifyFinished() {
		this.isResolved = !0, this._resolve?.();
	}
	then(e, t) {
		return this.finished.then(e, t);
	}
}, Dn = (e) => e / 100, On = (e) => Math.round(e * 1e4) / 1e4, kn = class extends En {
	constructor(e) {
		super(), this.state = "idle", this.startTime = null, this.isStopped = !1, this.currentTime = 0, this.holdTime = null, this.playbackSpeed = 1, this.delayState = {
			done: !1,
			value: void 0
		}, this.stop = () => {
			let { motionValue: e } = this.options;
			e && e.updatedAt !== M.now() && this.tick(M.now()), this.isStopped = !0, this.state !== "idle" && (this.teardown(), this.options.onStop?.());
		}, this.options = e, this.initAnimation(), this.play(), e.autoplay === !1 && this.pause(), wn(this, this.options);
	}
	initAnimation() {
		let { options: e } = this;
		bn(e);
		let { type: t = V, repeat: n = 0, repeatDelay: r = 0, repeatType: i, velocity: a = 0 } = e, { keyframes: o } = e, s = t || V;
		this.mixKeyframes = void 0, s !== V && typeof o[0] != "number" && (this.mixKeyframes = x(Dn, e.mixer?.(o[0], o[1]) || Tt(o[0], o[1])), o = [0, 100]);
		let c = s(o === e.keyframes ? e : {
			...e,
			keyframes: o
		});
		i === "mirror" && (this.mirroredGenerator = s({
			...e,
			keyframes: [...o].reverse(),
			velocity: -a
		})), c.calculatedDuration === null && (c.calculatedDuration = Pt(c));
		let { calculatedDuration: l } = c;
		this.calculatedDuration = l, this.resolvedDuration = l + r, this.totalDuration = this.resolvedDuration * (n + 1) - r, this.generator = c;
	}
	updateTime(e) {
		this.currentTime = this.holdTime ?? Math.round(e - this.startTime) * this.playbackSpeed;
	}
	tick(e, t = !1) {
		let { generator: n, totalDuration: r, calculatedDuration: i } = this;
		if (this.startTime === null) return n.next(0);
		let { delay: a = 0, keyframes: o, type: s, onUpdate: c, finalKeyframe: l } = this.options;
		this.startTime === this.pendingStartTime && (this.startTime = Sn(this.startTime, e)), this.pendingStartTime = void 0, this.speed > 0 ? this.startTime = Math.min(this.startTime, e) : this.speed < 0 && (this.startTime = Math.min(e - r / this.speed, this.startTime)), t ? this.currentTime = e : this.updateTime(e);
		let u = this.currentTime - a * (this.playbackSpeed >= 0 ? 1 : -1), d = this.playbackSpeed >= 0 ? u < 0 : u > r;
		this.currentTime = Math.max(u, 0), this.state === "finished" && this.holdTime === null && (this.currentTime = r);
		let f = this.generate(this.currentTime, d), { done: p } = f;
		d || (p = this.playbackSpeed >= 0 ? i < Infinity ? this.currentTime >= r : p : this.currentTime <= 0);
		let m = this.holdTime === null && (this.state === "finished" || this.state === "running" && p);
		return m && s !== cn && (f.value = vn(o, this.options, l, this.speed)), c && c(f.value), m && this.finish(), f;
	}
	at(e) {
		return this.holdTime ?? On((e - this.startTime) * this.playbackSpeed);
	}
	sampleAt(e, t) {
		let { options: n, totalDuration: r } = this, i = this.at(e) - (n.delay || 0);
		return i >= r && n.type !== cn ? vn(n.keyframes, n, t ? void 0 : n.finalKeyframe) : this.generate(Math.max(i, 0), i < 0).value;
	}
	generate(e, t) {
		let { generator: n, totalDuration: r, mixKeyframes: i, mirroredGenerator: a, resolvedDuration: o } = this, { keyframes: s, repeat: c, repeatType: l, repeatDelay: u } = this.options, d = e, f = n;
		if (c) {
			let t = Math.min(e, r) / o, n = Math.floor(t), i = t % 1;
			!i && t >= 1 && (i = 1), i === 1 && n--, n = Math.min(n, c + 1), n % 2 && (l === "reverse" ? (i = 1 - i, u && (i -= u / o)) : l === "mirror" && (f = a)), d = m(0, 1, i) * o;
		}
		let p;
		return t ? (this.delayState.value = s[0], p = this.delayState) : p = f.next(d), i && !t && (p.value = i(p.value)), p;
	}
	get duration() {
		return /* @__PURE__ */ T(this.calculatedDuration);
	}
	get iterationDuration() {
		return this.duration + /* @__PURE__ */ T(this.options.delay ?? 0);
	}
	get time() {
		return /* @__PURE__ */ T(this.currentTime);
	}
	set time(e) {
		this.state === "finished" && this.updateFinished(), e = /* @__PURE__ */ w(e), this.currentTime = e, this.startTime === null || this.holdTime !== null || this.playbackSpeed === 0 ? this.holdTime = e : this.driver && (this.startTime = this.driver.now() - e / this.playbackSpeed), this.driver ? this.driver.start(!1) : (this.startTime = 0, this.state = "paused", this.holdTime = e, this.tick(e));
	}
	getGeneratorVelocity() {
		return _n(this.generator, this.currentTime, this.options.velocity);
	}
	get speed() {
		return this.playbackSpeed;
	}
	set speed(e) {
		let t = this.playbackSpeed !== e;
		t && this.driver && this.updateTime(M.now()), this.playbackSpeed = e, t && this.driver && (this.time = /* @__PURE__ */ T(this.currentTime));
	}
	play() {
		if (this.isStopped) return;
		let { driver: e = jt, startTime: t } = this.options;
		this.driver ||= e((e) => this.tick(e)), this.options.onPlay?.();
		let n = this.driver.now();
		this.state === "finished" ? (this.updateFinished(), this.startTime = n) : this.holdTime === null ? this.startTime ||= t ?? (this.pendingStartTime = n) : this.startTime = n - this.holdTime / (this.playbackSpeed || 1), this.state === "finished" && this.speed < 0 && (this.startTime += this.calculatedDuration), this.holdTime = null, this.state = "running", this.driver.start();
	}
	pause() {
		this.state = "paused", this.updateTime(M.now()), this.holdTime = this.currentTime;
	}
	complete() {
		this.state !== "running" && this.play(), this.state = "finished", this.holdTime = null;
	}
	finish() {
		this.notifyFinished(), this.teardown(), this.state = "finished", this.options.onComplete?.();
	}
	cancel() {
		this.holdTime = null, this.startTime = 0, this.tick(0), this.teardown(), this.options.onCancel?.();
	}
	teardown() {
		this.state = "idle", this.driver?.stop(), this.driver = void 0, this.startTime = this.holdTime = null;
	}
	sample(e) {
		return this.startTime = 0, this.tick(e, !0);
	}
	attachTimeline(e) {
		return this.options.allowFlatten && (this.options.type = "keyframes", this.options.ease = "linear", this.initAnimation()), this.driver?.stop(), e.observe(this);
	}
}, An = /* @__PURE__ */ new Set([
	"brightness",
	"contrast",
	"saturate",
	"opacity"
]);
function jn(e) {
	let [t, n] = e.slice(0, -1).split("(");
	if (t === "drop-shadow") return e;
	let [r] = n.match(De) || [];
	if (!r) return e;
	let i = n.replace(r, ""), a = +!!An.has(t);
	return r !== n && (a *= 100), t + "(" + a + i + ")";
}
var Mn = /\b([a-z-]*)\(.*?\)/gu, Nn = {
	...L,
	getAnimatableNone: (e) => {
		let t = e.match(Mn);
		return t ? t.map(jn).join(" ") : e;
	}
}, Pn = {
	...L,
	getAnimatableNone: (e) => {
		let t = L.parse(e);
		return L.createTransformer(e)(t.map((e) => typeof e == "number" ? 0 : typeof e == "object" ? {
			...e,
			alpha: 1
		} : e));
	}
}, Fn = {
	...we,
	transform: Math.round
}, In = {
	rotate: N,
	pathRotation: N,
	rotateX: N,
	rotateY: N,
	rotateZ: N,
	scale: Ee,
	scaleX: Ee,
	scaleY: Ee,
	scaleZ: Ee,
	skew: N,
	skewX: N,
	skewY: N,
	distance: F,
	translateX: F,
	translateY: F,
	translateZ: F,
	x: F,
	y: F,
	z: F,
	perspective: F,
	transformPerspective: F,
	opacity: Te,
	originX: Ve,
	originY: Ve,
	originZ: F
}, Ln = {
	borderWidth: F,
	borderTopWidth: F,
	borderRightWidth: F,
	borderBottomWidth: F,
	borderLeftWidth: F,
	borderRadius: F,
	borderTopLeftRadius: F,
	borderTopRightRadius: F,
	borderBottomRightRadius: F,
	borderBottomLeftRadius: F,
	width: F,
	maxWidth: F,
	height: F,
	maxHeight: F,
	top: F,
	right: F,
	bottom: F,
	left: F,
	inset: F,
	insetBlock: F,
	insetBlockStart: F,
	insetBlockEnd: F,
	insetInline: F,
	insetInlineStart: F,
	insetInlineEnd: F,
	padding: F,
	paddingTop: F,
	paddingRight: F,
	paddingBottom: F,
	paddingLeft: F,
	paddingBlock: F,
	paddingBlockStart: F,
	paddingBlockEnd: F,
	paddingInline: F,
	paddingInlineStart: F,
	paddingInlineEnd: F,
	margin: F,
	marginTop: F,
	marginRight: F,
	marginBottom: F,
	marginLeft: F,
	marginBlock: F,
	marginBlockStart: F,
	marginBlockEnd: F,
	marginInline: F,
	marginInlineStart: F,
	marginInlineEnd: F,
	fontSize: F,
	backgroundPositionX: F,
	backgroundPositionY: F,
	...In,
	zIndex: Fn,
	fillOpacity: Te,
	strokeOpacity: Te,
	numOctaves: Fn
}, Rn = {
	...Ln,
	color: I,
	backgroundColor: I,
	outlineColor: I,
	fill: I,
	stroke: I,
	borderColor: I,
	borderTopColor: I,
	borderRightColor: I,
	borderBottomColor: I,
	borderLeftColor: I,
	filter: Nn,
	WebkitFilter: Nn,
	mask: Pn,
	WebkitMask: Pn
}, zn = (e) => Rn[e], Bn = /*@__PURE__*/ new Set([Nn, Pn]), Vn, Hn, Un;
function Wn(e, t) {
	if (e === Vn && t === Hn) return Un;
	let n = zn(e);
	return Bn.has(n) || (n = L), Un = n.getAnimatableNone ? n.getAnimatableNone(t) : void 0, Vn = e, Hn = t, Un;
}
// node_modules/motion-dom/dist/es/animation/keyframes/utils/fill-wildcards.mjs
function Gn(e) {
	for (let t = 1; t < e.length; t++) e[t] ?? (e[t] = e[t - 1]);
}
// node_modules/motion-dom/dist/es/render/dom/parse-transform.mjs
var Kn = (e) => e * 180 / Math.PI, qn = (e) => Yn(Kn(Math.atan2(e[1], e[0]))), Jn = {
	x: 4,
	y: 5,
	translateX: 4,
	translateY: 5,
	scaleX: 0,
	scaleY: 3,
	scaleZ: () => 1,
	scale: (e) => (Math.abs(e[0]) + Math.abs(e[3])) / 2,
	rotate: qn,
	rotateZ: qn,
	skewX: (e) => Kn(Math.atan(e[1])),
	skewY: (e) => Kn(Math.atan(e[2])),
	skew: (e) => (Math.abs(e[1]) + Math.abs(e[2])) / 2
}, Yn = (e) => (e %= 360, e < 0 && (e += 360), e), Xn = qn, Zn = (e) => Math.hypot(e[0], e[1]), Qn = (e) => Math.hypot(e[4], e[5]), $n = {
	x: 12,
	y: 13,
	z: 14,
	translateX: 12,
	translateY: 13,
	translateZ: 14,
	scaleX: Zn,
	scaleY: Qn,
	scaleZ: (e) => Math.hypot(e[8], e[9], e[10]),
	scale: (e) => (Zn(e) + Qn(e)) / 2,
	rotateX: (e) => Yn(Kn(Math.atan2(e[6], e[5]))),
	rotateY: (e) => Yn(Kn(Math.atan2(-e[2], e[0]))),
	rotateZ: Xn,
	rotate: Xn,
	skewX: (e) => Kn(Math.atan(e[4])),
	skewY: (e) => Kn(Math.atan(e[1])),
	skew: (e) => (Math.abs(e[1]) + Math.abs(e[4])) / 2
};
function er(e) {
	return +!!e.includes("scale");
}
function tr(e, t) {
	if (!e || e === "none") return er(t);
	let n = e.match(/^matrix(3d)?\(([-\d.e\s,]+)\)$/u);
	if (!n) return er(t);
	let r = (n[1] ? $n : Jn)[t], i = n[2].split(",").map((e) => parseFloat(e));
	return typeof r == "function" ? r(i) : i[r];
}
var nr = (e, t) => {
	let { transform: n = "none" } = getComputedStyle(e);
	return tr(n, t);
}, H = [
	"transformPerspective",
	"x",
	"y",
	"z",
	"translateX",
	"translateY",
	"translateZ",
	"scale",
	"scaleX",
	"scaleY",
	"scaleZ",
	"rotate",
	"rotateX",
	"rotateY",
	"rotateZ",
	"skew",
	"skewX",
	"skewY"
], U = /* @__PURE__ */ new Set([...H, "pathRotation"]), rr = (e) => e === we || e === F, ir = /* @__PURE__ */ new Set([
	"x",
	"y",
	"z"
]), ar = /* @__PURE__ */ H.filter((e) => !ir.has(e));
function or(e) {
	let t = [];
	return ar.forEach((n) => {
		let r = e.getValue(n);
		if (r !== void 0) {
			let e = r.get(), i = +!!n.startsWith("scale");
			if (e === i) return;
			t.push([n, e]), r.set(i);
		}
	}), t;
}
var sr = /* @__PURE__ */ new Set(["bottom", "right"]);
function cr(e, t, n, r, i, a) {
	let o = parseFloat(e);
	if (!isNaN(o)) return o;
	let { min: s, max: c } = t()[n], l = c - s;
	return a === "border-box" ? l : l - parseFloat(r) - parseFloat(i);
}
var lr = ({ transform: e }) => tr(e, "x"), ur = ({ transform: e }) => tr(e, "y"), dr = {
	width: ({ width: e, paddingLeft: t = "0", paddingRight: n = "0", boxSizing: r }, i) => cr(e, i, "x", t, n, r),
	height: ({ height: e, paddingTop: t = "0", paddingBottom: n = "0", boxSizing: r }, i) => cr(e, i, "y", t, n, r),
	top: ({ top: e }) => parseFloat(e),
	left: ({ left: e }) => parseFloat(e),
	bottom: ({ top: e }, t) => {
		let { y: n } = t();
		return parseFloat(e) + (n.max - n.min);
	},
	right: ({ left: e }, t) => {
		let { x: n } = t();
		return parseFloat(e) + (n.max - n.min);
	},
	x: lr,
	y: ur,
	translateX: lr,
	translateY: ur
}, fr = /* @__PURE__ */ new Set(), pr = !1, mr = !1, hr = !1;
function gr() {
	if (mr) {
		let e = [], t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set();
		fr.forEach((r) => {
			r.needsMeasurement && (e.push(r), t.add(r.element), sr.has(r.name) && n.add(r.element));
		});
		let r = /* @__PURE__ */ new Map();
		n.forEach((e) => {
			let t = or(e);
			t.length && (r.set(e, t), e.render());
		}), e.forEach((e) => e.measureInitialState()), t.forEach((e) => {
			e.render();
			let t = r.get(e);
			t && t.forEach(([t, n]) => {
				e.getValue(t)?.set(n);
			});
		}), e.forEach((e) => e.measureEndState()), e.forEach((e) => {
			e.suspendedScrollY !== void 0 && window.scrollTo(0, e.suspendedScrollY);
		});
	}
	mr = !1, pr = !1, fr.forEach((e) => e.complete(hr)), fr.clear();
}
function _r() {
	fr.forEach((e) => {
		e.readKeyframes(), e.needsMeasurement && (mr = !0);
	});
}
function vr() {
	hr = !0, _r(), gr(), hr = !1;
}
function yr(e, t, n) {
	if (typeof e == "string") {
		if (g(e) || v(e)) return parseFloat(e);
		if (!L.test(e) && L.test(n)) return Wn(t, n);
	}
	return e ?? void 0;
}
var br = class {
	constructor(e, t, n, r, i, a = !1) {
		this.state = "pending", this.isAsync = !1, this.needsMeasurement = !1, this.unresolvedKeyframes = [...e], this.onComplete = t, this.name = n, this.motionValue = r, this.element = i, this.isAsync = a;
	}
	scheduleResolve() {
		this.state = "scheduled", this.isAsync ? (fr.add(this), pr || (pr = !0, z.read(_r), z.resolveKeyframes(gr))) : (this.readKeyframes(), this.complete());
	}
	readKeyframes() {
		let { unresolvedKeyframes: e, name: t, element: n, motionValue: r } = this;
		if (e[0] === null) {
			let i = r?.get(), a = e[e.length - 1];
			if (i !== void 0) e[0] = i;
			else if (n && t) {
				let r = yr(n.readValue(t, a), t, a);
				r !== void 0 && (e[0] = r);
			}
			e[0] === void 0 && (e[0] = a), r && i === void 0 && r.set(e[0]);
		}
		Gn(e);
	}
	setFinalKeyframe() {}
	measureInitialState() {}
	renderEndStyles() {}
	measureEndState() {}
	complete(e = !1) {
		this.state = "complete", this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, e), fr.delete(this);
	}
	cancel() {
		this.state === "scheduled" && (fr.delete(this), this.state = "pending");
	}
	resume() {
		this.state === "pending" && this.scheduleResolve();
	}
}, xr = (e) => e.startsWith("--");
// node_modules/motion-dom/dist/es/render/dom/style-set.mjs
function Sr(e, t, n) {
	xr(t) ? e.style.setProperty(t, n) : e.style[t] = n;
}
// node_modules/motion-dom/dist/es/utils/supports/flags.mjs
var Cr = {};
// node_modules/motion-dom/dist/es/utils/supports/memo.mjs
function wr(e, t) {
	let n = /* @__PURE__ */ y(e);
	return () => Cr[t] ?? n();
}
// node_modules/motion-dom/dist/es/utils/supports/scroll-timeline.mjs
var Tr = /* @__PURE__ */ wr(() => window.ScrollTimeline !== void 0, "scrollTimeline"), Er = /*@__PURE__*/ wr(() => {
	try {
		document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
	} catch {
		return !1;
	}
	return !0;
}, "linearEasing"), Dr = ([e, t, n, r]) => `cubic-bezier(${e}, ${t}, ${n}, ${r})`, Or = {
	linear: "linear",
	ease: "ease",
	easeIn: "ease-in",
	easeOut: "ease-out",
	easeInOut: "ease-in-out",
	circIn: /*@__PURE__*/ Dr([
		0,
		.65,
		.55,
		1
	]),
	circOut: /*@__PURE__*/ Dr([
		.55,
		0,
		1,
		.45
	]),
	backIn: /*@__PURE__*/ Dr([
		.31,
		.01,
		.66,
		-.59
	]),
	backOut: /*@__PURE__*/ Dr([
		.33,
		1.53,
		.69,
		.99
	])
};
// node_modules/motion-dom/dist/es/animation/waapi/easing/map-easing.mjs
function kr(e, t) {
	if (e) return typeof e == "function" ? Er() ? Mt(e, t) : "ease-out" : /* @__PURE__ */ de(e) ? Dr(e) : Array.isArray(e) ? e.map((e) => kr(e, t) || Or.easeOut) : Or[e];
}
// node_modules/motion-dom/dist/es/animation/waapi/start-waapi-animation.mjs
function Ar(e, t, n, { delay: r = 0, duration: i = 300, repeat: a = 0, repeatType: o = "loop", ease: s = "easeOut", times: c } = {}, l = void 0) {
	let u = { [t]: n };
	c && (u.offset = c);
	let d = kr(s, i);
	Array.isArray(d) && (u.easing = d);
	let f = {
		delay: r,
		duration: i,
		easing: Array.isArray(d) ? "linear" : d,
		fill: "both",
		iterations: a + 1,
		direction: o === "reverse" ? "alternate" : "normal"
	};
	return l && (f.pseudoElement = l), e.animate(u, f);
}
// node_modules/motion-dom/dist/es/animation/generators/utils/is-generator.mjs
function jr(e) {
	return typeof e == "function" && "applyToOptions" in e;
}
// node_modules/motion-dom/dist/es/animation/waapi/utils/apply-generator.mjs
function Mr({ type: e, ...t }) {
	return jr(e) && Er() ? e.applyToOptions(t) : (t.duration ??= 300, t.ease ??= "easeOut", t);
}
// node_modules/motion-dom/dist/es/animation/NativeAnimation.mjs
var Nr = class extends En {
	constructor(e) {
		if (super(), this.finishedTime = null, this.isStopped = !1, this.manualStartTime = null, !e) return;
		let { element: t, name: n, keyframes: r, pseudoElement: i, allowFlatten: a = !1, finalKeyframe: o, onComplete: s } = e;
		this.isPseudoElement = !!i, this.allowFlatten = a, this.options = e;
		let c = Mr(e);
		this.animation = Ar(t, n, r, c, i), c.autoplay === !1 && this.animation.pause(), this.animation.onfinish = this.onFinish = () => {
			if (this.animation.onfinish = null, this.finishedTime = this.time, !i) {
				let e = vn(r, this.options, o, this.speed);
				this.updateMotionValue?.(e), Sr(t, n, e), this.animation.cancel();
			}
			s?.(), this.notifyFinished();
		}, wn(this, e, c);
	}
	play() {
		this.isStopped || (this.manualStartTime = null, this.animation.onfinish = this.onFinish, this.animation.play(), this.state === "finished" && this.updateFinished());
	}
	pause() {
		this.animation.pause();
	}
	complete() {
		this.isStopped || (this.animation.onfinish = this.onFinish), this.animation.finish?.();
	}
	cancel() {
		this.animation.onfinish = null;
		try {
			this.animation.cancel();
		} catch {}
	}
	stop() {
		this.isStopped || (this.isStopped = !0, this.state !== "idle" && this.finishedTime === null && (this.updateMotionValue ? this.updateMotionValue() : this.commitStyles(), this.isPseudoElement || this.cancel()));
	}
	commitStyles() {
		let e = this.options?.element;
		!this.isPseudoElement && e?.isConnected && this.animation.commitStyles?.();
	}
	get duration() {
		let e = this.animation.effect?.getComputedTiming?.().duration || 0;
		return /* @__PURE__ */ T(Number(e));
	}
	get iterationDuration() {
		let { delay: e = 0 } = this.options || {};
		return this.duration + /* @__PURE__ */ T(e);
	}
	get time() {
		return /* @__PURE__ */ T(Number(this.animation.currentTime) || 0);
	}
	set time(e) {
		let t = this.finishedTime !== null;
		this.manualStartTime = null, this.finishedTime = null, this.animation.currentTime = /* @__PURE__ */ w(e), t && (this.animation.pause(), this.updateFinished());
	}
	get speed() {
		return this.animation.playbackRate;
	}
	set speed(e) {
		e < 0 && (this.finishedTime = null), this.animation.playbackRate = e;
	}
	get state() {
		return this.finishedTime === null ? this.animation.playState : "finished";
	}
	get startTime() {
		return this.manualStartTime ?? Number(this.animation.startTime);
	}
	set startTime(e) {
		this.manualStartTime = this.animation.startTime = e;
	}
	attachTimeline({ timeline: e, onAttach: t, observe: n }) {
		return this.allowFlatten && this.animation.effect?.updateTiming({ easing: "linear" }), this.animation.onfinish = this.onFinish = null, e && Tr() ? (this.animation.timeline = e, t?.(this.animation), b) : n(this);
	}
}, Pr = {
	anticipate: ie,
	backInOut: re,
	circInOut: oe
};
function Fr(e) {
	return e in Pr;
}
function Ir(e) {
	typeof e.ease == "string" && Fr(e.ease) && (e.ease = Pr[e.ease]);
}
var Lr = class extends Nr {
	constructor(e) {
		Ir(e), bn(e), super(e), e.startTime !== void 0 && e.autoplay !== !1 && (this.startTime = e.startTime), this.options = e;
	}
	elapsed() {
		return this.state === "running" ? (M.now() - this.startTime) * this.speed : this.time * 1e3;
	}
	sample(e) {
		if (!this.sampler) {
			let { motionValue: e, onUpdate: t, onComplete: n, onPlay: r, onStop: i, element: a, ...o } = this.options;
			this.sampler = new kn({
				...o,
				autoplay: !1
			}), this.sampler.stop();
		}
		return this.sampler.sample(Math.max(0, e)).value;
	}
	liveValue() {
		let { state: e } = this;
		if (e === "running" || e === "paused") return this.sample(this.elapsed());
	}
	updateMotionValue(e) {
		let { motionValue: t, element: n, name: r } = this.options;
		if (!t) return;
		if (e !== void 0) {
			t.set(e);
			return;
		}
		let { speed: i } = this, a = this.elapsed(), o = this.state === "running" && i ? m(0, 10, a) : 0, s = this.sample(a);
		n && r && Sr(n, r, s), t.setWithVelocity(this.sample(a - o * Math.sign(i)), s, o / Math.abs(i || 1));
	}
}, Rr = (e, t) => t !== "zIndex" && !!(typeof e == "number" || Array.isArray(e) || typeof e == "string" && (L.test(e) || e === "0") && !e.startsWith("url("));
// node_modules/motion-dom/dist/es/animation/utils/can-animate.mjs
function zr(e) {
	let t = e[0];
	if (e.length === 1) return !0;
	for (let n = 0; n < e.length; n++) if (e[n] !== t) return !0;
}
function Br(e, t, n, r) {
	let i = e[0];
	if (i === null) return !1;
	if (t === "display" || t === "visibility") return !0;
	let a = e[e.length - 1], o = Rr(i, t), s = Rr(a, t);
	return !o || !s ? !1 : zr(e) || (n === "spring" || jr(n)) && r;
}
// node_modules/motion-dom/dist/es/animation/utils/make-animation-instant.mjs
function Vr(e) {
	e.duration = 0, e.type = "keyframes";
}
// node_modules/motion-dom/dist/es/animation/waapi/utils/accelerated-values.mjs
var Hr = /* @__PURE__ */ new Set([
	"opacity",
	"clipPath",
	"filter",
	"transform"
]), Ur = /^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;
function Wr(e) {
	for (let t = 0; t < e.length; t++) if (typeof e[t] == "string" && Ur.test(e[t])) return !0;
	return !1;
}
// node_modules/motion-dom/dist/es/animation/waapi/utils/needs-mixer.mjs
var Gr = ({ mixer: e, keyframes: t }) => e && typeof t[0] != "number" && t.some((n, r) => r && e(t[r - 1], n)), Kr = /* @__PURE__ */ new Set([
	"color",
	"backgroundColor",
	"outlineColor",
	"fill",
	"stroke",
	"borderColor",
	"borderTopColor",
	"borderRightColor",
	"borderBottomColor",
	"borderLeftColor"
]), qr = () => !h.useManualTiming && Object.hasOwnProperty.call(Element.prototype, "animate");
function Jr(e) {
	let { motionValue: t, name: n, repeatDelay: r, repeatType: i, damping: a, type: o, keyframes: s } = e;
	if (!n || !(Hr.has(n) || Kr.has(n))) return !1;
	let c = t?.owner?.current;
	if (!(c instanceof HTMLElement) && !(c instanceof SVGElement)) return !1;
	let { onUpdate: l, transformTemplate: u } = t.owner.getProps();
	return qr() && (Hr.has(n) || Kr.has(n) && Wr(s)) && (n !== "transform" || !u) && !l && !r && i !== "mirror" && a !== 0 && o !== "inertia" && !Gr(e);
}
// node_modules/motion-dom/dist/es/value/types/utils/get-as-type.mjs
var Yr = (e, t) => t && typeof e == "number" ? t.transform(e) : e, Xr = {
	x: "translateX",
	y: "translateY",
	z: "translateZ",
	transformPerspective: "perspective"
}, Zr = H.length, Qr = {}, $r = (e, t, n = Yr(t, In[e])) => (Qr[e] || (Qr[e] = (Xr[e] || e) + "(")) + n + ")", ei = (e, t) => (typeof t == "number" ? t : parseFloat(t)) === +!!e.startsWith("scale");
function ti(e, t, n) {
	let r = "";
	for (let i = 0; i < Zr; i++) {
		let a = H[i], o = e[a];
		if (o === void 0) continue;
		let s = n && (t[a] = Yr(o, Ln[a]));
		ei(a, o) || (r += $r(a, o, s || void 0) + " ");
	}
	let i = e.pathRotation;
	return i && (r += $r("rotate", i)), r = r.trim(), n ? n(t, r) : r || "none";
}
// node_modules/motion-dom/dist/es/animation/waapi/transforms/groups.mjs
var ni = /* @__PURE__ */ new WeakMap(), ri = 200, ii = .001, ai = .1, oi = .001, si = 100, ci = 100, li = /* @__PURE__ */ new Set([
	"linear",
	"easeIn",
	"easeOut",
	"easeInOut"
]), ui = (e) => li.has(e), di = /* @__PURE__ */ new WeakMap(), fi = (e, t) => {
	let n = di.get(e);
	return n?.[0] !== t && (n = [t, "linear(" + fn(Array(t + 1)).map((t) => On(e(t)) + " " + On(t * 100) + "%") + ")"], di.set(e, n)), n[1];
}, pi = (e, t) => Math.min(ri, Math.max(2, Math.ceil((t - e) / 10))), mi = (e, t) => Math.abs(e - t) <= ii, hi = (e, t) => e - t, gi = (e, t, n) => fn(Array(n + 1)).map((n) => R(e, t, n)), _i = (e) => e.motionValue.owner, vi = (e) => ni.get(e), yi = ({ state: e }) => e === "idle" || e === "finished", bi = (e, t) => e.latestValues ? e.latestValues[t] : e.getValue(t)?.get(), xi = ({ name: e, motionValue: t }) => e && H.includes(e) && t?.owner?.current instanceof HTMLElement && qr() && Er();
function Si(e) {
	let t = _i(e), { onUpdate: n, transformTemplate: r } = t.getProps();
	return !e.isHandoff && !n && !e.hasOnUpdate && !r && e.type !== "inertia" && (bi(t, "transform") || "none") === "none" && !bi(t, "pathRotation") && !t.projection?.isProjecting() && !Gr(e);
}
var Ci = class {
	constructor(e, t, n, r) {
		this.element = e, this.update = t, this.makeDriver = n, this.animation = r;
	}
	get js() {
		return this.driver ||= this.makeDriver(this.update);
	}
	now() {
		return this.driver || this.makeDriver !== jt ? this.js.now() : j.isProcessing ? j.timestamp : M.now();
	}
	start(e = !0) {
		let t = vi(this.element);
		!t || t.isJS ? this.js.start(e) : t.schedule(!1, !e);
	}
	stopJS() {
		this.driver?.stop();
	}
	stop() {
		this.stopJS();
		let e = vi(this.element);
		e && !e.isFinishing && e.release(this.animation);
	}
}, wi, Ti = class extends kn {
	constructor(e) {
		let t = _i(e).current, { driver: n = jt } = e, r, i = Si(e);
		e.driver = (e) => new Ci(t, e, n, r), super(e), r = this;
		let a = this.driver;
		a && (a.animation = this), this.canAccelerate = i;
		let { stop: o } = this;
		this.stop = () => {
			this.isAccelerated() && this.sync(), o();
		};
	}
	offsets() {
		let { keyframes: e, times: t } = this.options;
		return t || (this.offsetsOf !== e && (this.offsetsOf = e, this.cachedOffsets = fn(e)), this.cachedOffsets);
	}
	get group() {
		return vi(_i(this.options).current);
	}
	get js() {
		return this.driver?.js;
	}
	stopJS() {
		this.driver?.stopJS();
	}
	get name() {
		return this.options.name;
	}
	timing() {
		let { startTime: e, speed: t, totalDuration: n } = this, { delay: r = 0, repeatType: i } = this.options;
		return this.holdTime === null ? n === Infinity ? [e + r / t, this.resolvedDuration * (i === "loop" ? 1 : 2) / t || 1] : [e + (r + n) / t, 0] : [Infinity, 0];
	}
	isAccelerated() {
		let { group: e, state: t } = this;
		return e?.tracks.has(this) && !e.isJS && this.canAccelerate && (t === "running" || t === "paused");
	}
	liveValue() {
		return this.isAccelerated() ? this.sampleAt(M.now()) : void 0;
	}
	tween() {
		let { keyframes: e, type: t, repeat: n, delay: r = 0 } = this.options, i = -1;
		if (n || t !== V || this.holdTime !== null) return;
		for (let t = 1; t < e.length; t++) if (e[t] !== e[t - 1]) {
			if (i >= 0) return;
			i = t - 1;
		}
		let { ease: a } = this.options;
		/* @__PURE__ */ ue(a) && (a = a[i]);
		let o = this.offsets(), s = (e) => this.startTime + (r + o[e] * this.totalDuration) / this.speed;
		if (i >= 0) {
			let e = /* @__PURE__ */ de(a) ? Dr(a) : ui(a) ? Or[a] : me(a);
			return [
				s(i),
				s(i + 1),
				typeof e == "string" || mi(e(0), 0) && mi(e(1), 1) ? e : void 0
			];
		}
	}
	boundaries(e, t) {
		let { startTime: n, speed: r, resolvedDuration: i, options: a } = this, { delay: o = 0, repeat: s = 0, repeatDelay: c = 0, repeatType: l, type: u } = a, d = (u || V) === V ? this.offsets() : [0, 1], f = n + o / r, p = [];
		if (this.holdTime !== null || !(i > 0)) return p;
		for (let n = Math.max(0, Math.floor((e - f) * r / i)); n <= s; n++) {
			let a = f + n * i / r;
			if (a > t) break;
			for (let o of d) {
				let s = a + (n % 2 && l && l !== "loop" ? 1 - o : o) * (i - c) / r;
				s > e && s < t && p.push(s);
			}
		}
		return p;
	}
	numberAt(e) {
		return parseFloat(this.sampleAt(e, !0));
	}
	sync() {
		let e = M.now(), t = this.sampleAt(e, !0);
		this.options.motionValue.setWithVelocity(this.holdTime === null ? this.sampleAt(e - 10, !0) : t, t, 10);
	}
	play() {
		this.isStopped || ((this.group || Oi(_i(this.options))).tracks.add(this), super.play());
	}
	pause() {
		super.pause(), this.isAccelerated() && this.group.schedule(!1);
	}
	complete() {
		super.complete();
		let { group: e } = this;
		e && !e.isJS && this.tick(M.now());
	}
	get time() {
		return this.isAccelerated() ? /* @__PURE__ */ T(m(0, this.totalDuration, this.at(M.now()) - (this.options.delay || 0))) : super.time;
	}
	set time(e) {
		(wi ??= Object.getOwnPropertyDescriptor(kn.prototype, "time").set).call(this, e);
	}
	attachTimeline(e) {
		return this.canAccelerate = !1, this.group?.demote(!0), super.attachTimeline(e);
	}
}, Ei, Di = (e) => {
	Ei || queueMicrotask(() => {
		let e = Ei;
		Ei = void 0, e.forEach((e) => e());
	}), (Ei ||= []).push(e);
};
function Oi(e) {
	let t = e.current, n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Map(), i = {}, a = [], o = /* @__PURE__ */ new Map(), s = [], c = !1, l = !1, u = !1, d = !1, f = -Infinity, p, m = Infinity, h, g = (e) => {
		for (let t of n) if (t.name === e) return !0;
	}, _ = (t, n) => {
		let o = {};
		for (let s of t === void 0 ? H : a) {
			let a = r.get(s), c = t === void 0 ? bi(e, s) : a ? a.sampleAt(n > t && !a.timing()[1] ? n : t) : i[s];
			c !== void 0 && (o[s] = c);
		}
		return o;
	}, v = (e, t) => {
		let n = "";
		for (let r in e) {
			let i = e[r];
			t && ei(r, i) || (n += $r(r, i) + " ");
		}
		return (t ? n.trim() : n) || "none";
	}, y = (e, t) => v(_(e, t)), b = (e = _()) => {
		t.style.transform = v(e, !0);
	}, x = (e) => {
		e.onfinish = e.oncancel = null, e.cancel();
	}, C = (e = !0) => {
		clearTimeout(p), m = Infinity, h = void 0, e && b(), s.forEach(({ animation: e }) => x(e)), s = [];
	}, w = (e, n) => new Animation(new KeyframeEffect(t, e, n)), T = (e, t, n = Infinity) => {
		let r = {
			animation: e,
			offset: t,
			end: n
		};
		e.startTime = M.now() + t, n < Infinity && (e.onfinish = () => {
			r.isDone = !0, s.some((e) => e.end === Infinity) && (x(e), s = s.filter((e) => e !== r)), A.schedule(!1);
		}), e.oncancel = () => s.includes(r) && A.demote(), s.push(r);
	}, E = (e, t, n) => {
		let r = (t, n) => Math.abs(e(n) - e(t)), i = r(t, n);
		for (; n - t > .01;) {
			let e = (t + n) / 2;
			r(t, e) > r(e, n) ? n = e : t = e;
		}
		return r(t, n) > i / 2 ? [t, n] : [];
	}, D = (e, t, n, r) => {
		let i = pi(t, n);
		if (r.length * 4 > i) return;
		let a;
		for (let r of e) {
			let e = r.numberAt(t), i = (r.numberAt((t + n) / 2) - e) / (r.numberAt(n) - e);
			if (i === i) {
				if (a === void 0) a = i;
				else if (!mi(i, a)) return;
			}
		}
		let o = gi(t, n, i).concat(r).sort(hi), s = (e) => /* @__PURE__ */ S(t, n, e), c, l;
		for (let n of e) {
			let e = n.numberAt(t), r = o.map((t) => n.numberAt(t) - e), i = r[r.length - 1], a = r.some((e) => Math.abs(e) * ii > Math.abs(i)) ? 0 : i, s = r.map((e) => a ? e / a : e);
			if (a && !c) c = s, l = (t) => (n.numberAt(t) - e) / a;
			else if (s.some((e, t) => !mi(e, a && c[t]))) return;
		}
		if (!c || c.every((e, t) => mi(e, s(o[t])))) return "linear";
		let u = [], d = (e, t = l(e)) => u.push(On(t) + " " + On(s(e) * 100) + "%");
		return c.forEach((e, t) => {
			t && Math.abs(e - c[t - 1]) > .2 && E(l, o[t - 1], o[t]).forEach((e) => d(e)), d(o[t], e);
		}), "linear(" + u + ")";
	}, O = (e, t, n, r) => {
		let i = [t], a = [], o = n, s = t;
		for (let r of e) {
			let e = r.tween();
			if (e?.[2] !== "linear") {
				let [i, c] = r.timing(), [l, u] = e || [t, c ? n : i];
				o = Math.min(o, l), s = Math.max(s, u), a.push(r);
			}
		}
		o = Math.max(t, o), s = Math.min(n, s);
		let c = (e, t) => a.every((n) => !(Math.abs(n.numberAt((e + t) / 2) - (n.numberAt(e) + n.numberAt(t)) / 2) > (n.name.startsWith("scale") ? oi : ai))), l = (t, n, r) => {
			if (n - t < 1 || c(t, n)) i.push(n);
			else if (r < 4) l(t, (t + n) / 2, r + 1), l((t + n) / 2, n, r + 1);
			else {
				for (let r of e) i.push(...E((e) => r.numberAt(e), t, n));
				i.push(n);
			}
		}, u = s > o ? gi(o, s, Math.ceil((s - o) / 100)) : [];
		u.push(n);
		for (let e of r) u.push(e, Math.min(e + .01, n));
		let d = t;
		for (let e of u.sort(hi)) e > d && l(d, e, 0), d = e;
		return i.sort(hi);
	}, ee = (e) => {
		let t;
		for (let n of e) {
			let e = n.tween();
			if (!e || t && (Math.abs(e[0] - t[0]) > 1 || Math.abs(e[1] - t[1]) > 1)) return;
			t = [
				e[0],
				e[1],
				!t || e[2] === t[2] ? e[2] : void 0
			];
		}
		return t;
	}, k = (e, t, n, r, i = { fill: "both" }, a) => {
		let o = r ? [] : e.flatMap((e) => e.boundaries(t, n)), s = r || D(e, t, n, o), c = s ? [t, n] : O(e, t, n, o), l = c.map((e) => y(e, a)), u = { transform: l };
		return s || (u.offset = c.map((e) => /* @__PURE__ */ S(t, n, e))), l.every((e) => e === l[0]) && (b(_(t, a)), u = null), w(u, {
			...i,
			duration: n - t,
			easing: s || "linear"
		});
	}, te = (e) => {
		let t = M.now() + e;
		t < m && (clearTimeout(p), m = t, p = setTimeout(() => {
			m = Infinity, A.schedule(!1);
		}, e));
	}, ne = (t) => {
		let c = t, l = 0, u = 0, d = [], f = [], p = /* @__PURE__ */ new Set();
		r.clear(), o = /* @__PURE__ */ new Map();
		for (let e of n) {
			r.set(e.name, e);
			let [n, i] = e.timing(), a = n === Infinity;
			if (o.set(e, [
				e.at(t),
				e.speed,
				a
			]), !a) {
				if (e.speed < 0) return;
				if (i) {
					if (l) {
						let e = (n - u) / i;
						if (Math.abs(i - l) > 1 || Math.abs(e - Math.round(e)) * l > 1) return;
					} else l = i, u = n;
					f.push(e);
				} else p.add(n);
				d.push(e), c = Math.max(c, n);
			}
		}
		i = {}, a = H.filter((t) => {
			if (r.has(t)) return !0;
			let n = i[t] = bi(e, t);
			return n !== void 0 && !ei(t, n);
		}), C(!1);
		let m = !l && ee(d);
		try {
			if (c > t) {
				let e;
				if (m && m[1] > t) {
					let [n, r, i] = m;
					if (n - t > ci) return d.forEach((e) => e.sync()), te(h = n - t - ci), !0;
					e = typeof i == "string" ? i : i ? fi(i, pi(n, r)) : D(d, n, r, []), e && T(k(d, n, r, e, {
						fill: "both",
						endDelay: c - r
					}), n - t, c - n);
				}
				e || T(k(d, t, c), 0, c - t), p.forEach((e) => e < c - 1 && T(w(null, { duration: e - t }), 0, e - t));
			}
			if (l) {
				let e = u + Math.floor((c - u) / l) * l;
				T(k(f, e, e + l, void 0, {
					iterations: Infinity,
					iterationStart: (c - e) / l,
					fill: "forwards"
				}, c), c - t);
			}
		} catch {
			return;
		}
		return s.length || C(), !0;
	}, re = (e, t) => {
		let r, i = 0;
		for (let t of n) {
			let n = o.get(t);
			if (!n) return !1;
			let [a, c, l] = n, u = t.at(e), d = t.timing()[0] === Infinity;
			if (l) {
				if (d && (u === a || !s.length)) continue;
				return !1;
			}
			let f = (u - a) / c, p = d ? 0 : t.speed / c;
			if (r === void 0) r = f, i = p;
			else if (Math.abs(f - r) > 1 || p !== i) return !1;
		}
		if (r === void 0) return !0;
		if (!s.length) {
			if (h === void 0 || t && i) return !1;
			if (i) {
				let e = (h - r) / i;
				if (e < 1) return !1;
				te(e);
			}
			return !0;
		}
		for (let { offset: e, end: n, isDone: i } of s) {
			let a = r - e;
			if (n < Infinity && (i ? a < n - 1 : a < 0 && (t || e <= 0) || a >= n)) return !1;
		}
		for (let { animation: t, offset: n, isDone: a } of s) {
			if (a) continue;
			let o = r - n;
			i && t.updatePlaybackRate && t.playState === "running" && Math.abs(Number(t.currentTime) - o) < 20 ? t.playbackRate !== i && t.updatePlaybackRate(i) : i ? (t.playbackRate !== i && (t.playbackRate = i), t.startTime = e - o / i) : (t.startTime = null, t.currentTime = o);
		}
		return !0;
	}, ie = () => !n.size && (u = !0, vi(t) === A && ni.delete(t), A.isJS || C(), !0), ae = () => {
		let t = M.now();
		if (A.isJS || (A.isFinishing = !0, n.forEach((n) => {
			let [r, a] = n.timing();
			n.state === "running" && n.speed > 0 && !a && r <= t + 1 && (n.complete(), i[n.name] = bi(e, n.name), o.has(n) || (c = !0));
		}), A.isFinishing = !1), l = !1, u || (n.forEach((e) => yi(e) && n.delete(e)), ie())) return;
		for (let e of n) if (!e.canAccelerate) return A.demote(!0);
		A.isJS && (A.isJS = !1, c = !0, n.forEach((e) => e.stopJS()));
		let r = c, a = d;
		if (c = d = !1, r || !re(t, a)) {
			if (a) {
				if (t - f < si) return A.demote();
				f = t;
			}
			if (!ne(t)) return A.demote();
		} else if (h !== void 0 && !a) return;
		n.forEach((e) => e.timing()[0] === Infinity && e.sync());
	}, A = {
		tracks: n,
		isJS: !1,
		isFinishing: !1,
		schedule(e, t) {
			u || (c ||= e, d ||= !!t, l || (l = !0, j.isProcessing ? z.render(ae, !1, !0) : Di(ae)));
		},
		release(e) {
			yi(e) && n.delete(e), ie() || A.schedule(!0);
		},
		check() {
			if (!A.isJS) {
				for (let t in i) if (bi(e, t) !== i[t] && !g(t)) return A.schedule(!0, !0);
			}
		},
		demote(e) {
			if (!(A.isJS || u)) return n.forEach((t) => {
				t.isAccelerated() && t.sync(), e || (t.canAccelerate = !1);
			}), A.isJS = !0, o = /* @__PURE__ */ new Map(), C(), n.forEach((e) => e.state === "running" && e.js?.start()), !0;
		}
	};
	return ni.set(t, A), A;
}
// node_modules/motion-dom/dist/es/animation/AsyncMotionValueAnimation.mjs
var ki = class extends En {
	constructor(e) {
		super(), this.stop = () => {
			this._animation && (this._animation.stop(), this.stopTimeline?.()), this.keyframeResolver?.cancel();
		}, this.createdAt = M.now();
		let { keyframes: t, name: n, motionValue: r, element: i } = e, a = e;
		a.autoplay ??= !0, a.delay ??= 0, a.type ??= "keyframes", a.repeat ??= 0, a.repeatDelay ??= 0, a.repeatType ??= "loop";
		let o = i?.KeyframeResolver || br;
		this.keyframeResolver = new o(t, (e, t, n) => this.onKeyframesResolved(e, t, a, !n), n, r, i), this.keyframeResolver?.scheduleResolve();
	}
	onKeyframesResolved(e, t, n, r) {
		this.keyframeResolver = void 0;
		let { name: i, type: a, velocity: o, delay: s, isHandoff: c, onUpdate: l } = n;
		this.resolvedAt = M.now();
		let u = Br(e, i, a, o);
		u || ((h.instantAnimations || !s) && l?.(vn(e, n, t)), e[0] = e[e.length - 1], Vr(n), n.repeat = 0);
		let { onComplete: d } = n;
		n.finalKeyframe = t, n.keyframes = e, n.onComplete = () => {
			d?.(), this.notifyFinished();
		};
		let f = u && !c && Jr(n), p = !f && xi(n);
		r && (f || p || this.resolvedAt !== this.createdAt) && (n.startTime ??= Sn(this.createdAt, this.resolvedAt));
		let m;
		if (f) {
			n.element = n.motionValue?.owner?.current;
			try {
				m = new Lr(n);
			} catch {
				m = new kn(n);
			}
		} else m = p ? new Ti(n) : new kn(n);
		this.pendingTimeline &&= (this.stopTimeline = m.attachTimeline(this.pendingTimeline), void 0), this._animation = m;
	}
	get finished() {
		return this._animation ? this._animation.finished : super.finished;
	}
	then(e, t) {
		return this.finished.finally(e).then(() => {});
	}
	liveValue() {
		return this._animation?.liveValue?.();
	}
	get animation() {
		return this._animation || (this.keyframeResolver?.resume(), vr()), this._animation;
	}
	get duration() {
		return this.animation.duration;
	}
	get iterationDuration() {
		return this.animation.iterationDuration;
	}
	get time() {
		return this.animation.time;
	}
	set time(e) {
		this.animation.time = e;
	}
	get speed() {
		return this.animation.speed;
	}
	get state() {
		return this.animation.state;
	}
	set speed(e) {
		this.animation.speed = e;
	}
	get startTime() {
		return this.animation.startTime;
	}
	attachTimeline(e) {
		return this._animation ? this.stopTimeline = this.animation.attachTimeline(e) : this.pendingTimeline = e, () => this.stop();
	}
	play() {
		this.animation.play();
	}
	pause() {
		this.animation.pause();
	}
	complete() {
		this.animation.complete();
	}
	cancel() {
		this._animation?.cancel(), this.keyframeResolver?.cancel();
	}
};
// node_modules/motion-dom/dist/es/animation/utils/calc-child-stagger.mjs
function Ai(e, t, n, r = 0, i = 1) {
	let a = Array.from(e).sort((e, t) => e.sortNodePosition(t)).indexOf(t), o = e.size, s = (o - 1) * r;
	return typeof n == "function" ? n(a, o) : i === 1 ? a * r : s - a * r;
}
// node_modules/motion-dom/dist/es/value/index.mjs
var ji = 30, Mi = (e) => !isNaN(parseFloat(e)), Ni = { current: void 0 }, Pi = class {
	constructor(e, t = {}) {
		this.canTrackVelocity = null, this.events = {}, this.updateAndNotify = (e) => {
			let t = M.now();
			if (this.updatedAt !== t && this.setPrevFrameValue(), this.prev = this.current, this.setCurrent(e), this.current !== this.prev && (this.dirty(), this.dependents)) for (let e of this.dependents) e.dirty();
		}, this.hasAnimated = !1, this.setCurrent(e), this.owner = t.owner;
	}
	setCurrent(e) {
		this.current = e, this.updatedAt = M.now(), this.canTrackVelocity === null && e !== void 0 && (this.canTrackVelocity = Mi(this.current));
	}
	setPrevFrameValue(e = this.current) {
		this.prevFrameValue = e, this.prevUpdatedAt = this.updatedAt;
	}
	onChange(e) {
		return this.on("change", e);
	}
	on(e, t) {
		var n;
		return e === "change" ? this.onChangeSubscribe(t) : ((n = this.events)[e] || (n[e] = new C())).add(t);
	}
	onChangeSubscribe(e) {
		let { events: t } = this;
		return !t.change && !this.changeSubscriber ? this.changeSubscriber = e : (t.change || (t.change = new C(), t.change.add(this.changeSubscriber), this.changeSubscriber = void 0), t.change.add(e)), () => {
			this.changeSubscriber === e ? this.changeSubscriber = void 0 : t.change?.remove(e), this.stopIfUnobserved();
		};
	}
	stopIfUnobserved() {
		z.read(() => {
			!this.changeSubscriber && !this.events.change?.getSize() && this.stop();
		});
	}
	clearListeners() {
		this.changeSubscriber = void 0;
		for (let e in this.events) this.events[e].clear();
	}
	attach(e, t) {
		this.passiveEffect = e, this.stopPassiveEffect = t;
	}
	set(e) {
		this.passiveEffect ? this.passiveEffect(e, this.updateAndNotify) : this.updateAndNotify(e);
	}
	setWithVelocity(e, t, n) {
		this.set(t), this.prev = void 0, this.prevFrameValue = e, this.prevUpdatedAt = this.updatedAt - n;
	}
	jump(e, t = !0) {
		t && (this.updatedAt = M.now(), this.stop()), this.updateAndNotify(e), this.prev = e, this.prevUpdatedAt = this.prevFrameValue = void 0, this.stopPassiveEffect?.();
	}
	dirty() {
		let { current: e, changeSubscriber: t } = this;
		t ? t(e) : this.events.change?.notify(e);
	}
	addDependent(e) {
		(this.dependents ||= /* @__PURE__ */ new Set()).add(e);
	}
	removeDependent(e) {
		this.dependents?.delete(e);
	}
	get() {
		Ni.current?.push(this);
		let e = this.animation?.liveValue?.();
		return e === void 0 ? this.current : e;
	}
	getCurrent() {
		return this.current;
	}
	getPrevious() {
		return this.prev;
	}
	getVelocity() {
		let e = M.now();
		if (!this.canTrackVelocity || this.prevFrameValue === void 0 || e - this.updatedAt > ji) return 0;
		let t = Math.min(this.updatedAt - this.prevUpdatedAt, ji);
		return /* @__PURE__ */ E(parseFloat(this.current) - parseFloat(this.prevFrameValue), t);
	}
	start(e) {
		return new Promise((t) => this.run(e, t));
	}
	run(e, t) {
		this.stop(), this.hasAnimated = !0;
		let n = !1, r;
		r = e(() => {
			n = !0, this.events.animationComplete?.notify(), this.animation === r && (this.animation = void 0), t?.();
		}), n || (this.animation = r), this.events.animationStart?.notify();
	}
	stop() {
		this.animation && (this.animation.stop(), this.events.animationCancel?.notify()), this.animation = void 0;
	}
	isAnimating() {
		return !!this.animation;
	}
	destroy() {
		this.dependents?.clear(), this.events.destroy?.notify(), this.clearListeners(), this.stop(), this.stopPassiveEffect?.();
	}
};
function Fi(e, t) {
	return new Pi(e, t);
}
// node_modules/motion-dom/dist/es/animation/utils/resolve-transition.mjs
function Ii(e, t) {
	if (e?.inherit && t) {
		let { inherit: n, ...r } = e;
		return {
			...t,
			...r
		};
	}
	return e;
}
// node_modules/motion-dom/dist/es/animation/utils/get-value-transition.mjs
function Li(e, t) {
	let n = e?.[t] ?? e?.default ?? e;
	return n === e ? n : Ii(n, e);
}
// node_modules/motion-dom/dist/es/animation/utils/default-transitions.mjs
var Ri = {
	type: "spring",
	stiffness: 500,
	damping: 25,
	restSpeed: 10
}, zi = (e) => ({
	type: "spring",
	stiffness: 550,
	damping: e === 0 ? 2 * Math.sqrt(550) : 30,
	restSpeed: 10
}), Bi = {
	type: "keyframes",
	duration: .8
}, Vi = {
	type: "keyframes",
	ease: [
		.25,
		.1,
		.35,
		1
	],
	duration: .3
}, Hi = (e, { keyframes: t }) => t.length > 2 ? Bi : U.has(e) ? e.startsWith("scale") ? zi(t[1]) : Ri : Vi, Ui = /* @__PURE__ */ new Set([
	"when",
	"delay",
	"delayChildren",
	"staggerChildren",
	"staggerDirection",
	"repeat",
	"repeatType",
	"repeatDelay",
	"from",
	"elapsed",
	"out",
	"mixer"
]);
function Wi(e) {
	for (let t in e) if (!Ui.has(t)) return !0;
	return !1;
}
// node_modules/motion-dom/dist/es/animation/interfaces/motion-value.mjs
var Gi = (e, t, n, r = {}, i, a) => (o) => {
	let s = Li(r, e) || {}, c = s.delay || r.delay || 0, { elapsed: l = 0 } = r;
	l -= /* @__PURE__ */ w(c);
	let u = {
		keyframes: Array.isArray(n) ? n : [null, n],
		ease: "easeOut",
		velocity: t.getVelocity(),
		...s,
		delay: -l,
		onUpdate: (e) => {
			t.set(e), s.onUpdate && s.onUpdate(e);
		},
		onComplete: () => {
			o(), s.onComplete && s.onComplete();
		},
		name: e,
		motionValue: t,
		element: a ? void 0 : i,
		hasOnUpdate: !!s.onUpdate
	};
	Wi(s) || Object.assign(u, Hi(e, u)), u.duration &&= /* @__PURE__ */ w(u.duration), u.repeatDelay &&= /* @__PURE__ */ w(u.repeatDelay), u.from !== void 0 && (u.keyframes[0] = u.from);
	let d = !1;
	if ((u.type === !1 || u.duration === 0 && !u.repeatDelay) && (Vr(u), u.delay === 0 && (d = !0)), (h.instantAnimations || h.skipAnimations || i?.shouldSkipAnimations || s.skipAnimations) && (d = !0, Vr(u), u.delay = 0), u.allowFlatten = !s.type && !s.ease, d && !a && t.get() !== void 0) {
		let e = vn(u.keyframes, s);
		if (e !== void 0) {
			z.update(() => {
				u.onUpdate(e), u.onComplete();
			});
			return;
		}
	}
	return s.isSync ? new kn(u) : new ki(u);
}, Ki = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
function qi(e) {
	let t = Ki.exec(e);
	if (!t) return [,];
	let [, n, r, i] = t;
	return [`--${n ?? r}`, i];
}
function Ji(e, t, n = 1) {
	let [r, i] = qi(e);
	if (!r) return;
	let a = window.getComputedStyle(t).getPropertyValue(r);
	if (a) {
		let e = a.trim();
		return g(e) ? parseFloat(e) : e;
	}
	return xe(i) ? Ji(i, t, n + 1) : i;
}
// node_modules/motion-dom/dist/es/render/utils/resolve-variants.mjs
function Yi(e) {
	let t = [{}, {}];
	return e?.values.forEach((e, n) => {
		t[0][n] = e.get(), t[1][n] = e.getVelocity();
	}), t;
}
function Xi(e, t, n, r) {
	let i = (t) => typeof t == "function" ? t(n === void 0 ? e.custom : n, ...Yi(r)) : t;
	return t = i(t), typeof t == "string" && (t = e.variants && e.variants[t]), i(t);
}
// node_modules/motion-dom/dist/es/render/utils/resolve-dynamic-variants.mjs
function Zi(e, t, n) {
	return Xi(e.getProps(), t, n, e);
}
var Qi = (e, t) => t === "exit" ? e.presenceContext?.custom : void 0, $i = /* @__PURE__ */ new Set([
	"width",
	"height",
	"top",
	"left",
	"right",
	"bottom",
	...H
]), ea = (e) => Array.isArray(e);
// node_modules/motion-dom/dist/es/render/utils/setters.mjs
function ta(e, t, n) {
	e.hasValue(t) ? e.getValue(t).set(n) : e.addValue(t, Fi(n));
}
function na(e) {
	return ea(e) ? e[e.length - 1] || 0 : e;
}
function ra(e, t) {
	let { transitionEnd: n = {}, transition: r = {}, ...i } = Zi(e, t) || {};
	i = {
		...i,
		...n
	};
	for (let t in i) ta(e, t, na(i[t]));
}
// node_modules/motion-dom/dist/es/value/utils/is-motion-value.mjs
var W = (e) => !!(e && e.getVelocity);
// node_modules/motion-dom/dist/es/value/will-change/is.mjs
function ia(e) {
	return !!(W(e) && e.add);
}
// node_modules/motion-dom/dist/es/value/will-change/add-will-change.mjs
function aa(e, t) {
	let n = e.getValue("willChange");
	if (ia(n)) return n.add(t);
	if (!n && h.WillChange) {
		let n = new h.WillChange("auto");
		e.addValue("willChange", n), n.add(t);
	}
}
// node_modules/motion-dom/dist/es/animation/optimized-appear/data-id.mjs
var oa = "data-framer-appear-id";
// node_modules/motion-dom/dist/es/animation/optimized-appear/get-appear-id.mjs
function sa(e) {
	return e.props[oa];
}
// node_modules/motion-dom/dist/es/animation/interfaces/visual-element-target.mjs
var ca = typeof window < "u";
function la({ protectedKeys: e, needsAnimating: t }, n) {
	let r = n in e && !t[n];
	return t[n] = !1, r;
}
function ua(e, t, { delay: n = 0, transitionOverride: r, type: i } = {}) {
	let { transition: a, transitionEnd: o, ...s } = t, c = e.getDefaultTransition();
	a = a ? Ii(a, c) : c;
	let l = a?.reduceMotion, u = a?.skipAnimations;
	r && (a = r);
	let d = [], f = i && e.animationState?.getState()[i], p = a?.path;
	p && (p.animateValues ? p.animateValues((t) => e.getValue(t, e.latestValues[t] ?? 0), s, a, n, d) : p.animateVisualElement?.(e, s, a, n, d));
	for (let t in s) {
		let r = e.getValue(t, e.latestValues[t] ?? null), i = s[t];
		if (i === void 0 || f && la(f, t)) continue;
		let o = {
			delay: n,
			...Li(f?.out[t] || a || {}, t)
		};
		u && (o.skipAnimations = !0);
		let c = r.get();
		if (c !== void 0 && !r.isAnimating() && !Array.isArray(i) && i === c && !o.velocity) {
			z.update(() => r.set(i));
			continue;
		}
		let p = !1;
		if (ca && window.MotionHandoffAnimation) {
			let n = sa(e);
			if (n) {
				let e = window.MotionHandoffAnimation(n, t, z);
				e !== null && (o.startTime = e, p = !0);
			}
		}
		aa(e, t);
		let m = l ?? e.shouldReduceMotion;
		r.run(Gi(t, r, i, m && $i.has(t) ? { type: !1 } : o, e, p));
		let h = r.animation;
		h && d.push(h);
	}
	if (o) {
		let t = () => z.update(() => {
			o && ra(e, o);
		});
		d.length ? Promise.all(d).then(t) : t();
	}
	return d;
}
// node_modules/motion-dom/dist/es/animation/interfaces/visual-element-variant.mjs
function da(e, t, n = {}) {
	let r = Zi(e, t, Qi(e, n.type)), i = n.transitionOverride || (r?.transition ?? (e.getDefaultTransition() || {})), a = () => Promise.all(r ? ua(e, r, n) : []), o = (r = 0) => {
		let { variantChildren: a } = e, { delayChildren: o = 0, staggerChildren: s, staggerDirection: c } = i, l = [];
		return a?.forEach((e) => {
			e.notify("AnimationStart", t), l.push(da(e, t, {
				...n,
				delay: r + (typeof o == "function" ? 0 : o) + Ai(a, e, o, s, c)
			}).then(() => e.notify("AnimationComplete", t)));
		}), Promise.all(l);
	}, { when: s } = i;
	return s ? s === "beforeChildren" ? a().then(() => o()) : o().then(a) : Promise.all([a(), o(n.delay)]);
}
// node_modules/motion-dom/dist/es/animation/interfaces/visual-element.mjs
function fa(e, t, n = {}) {
	return e.notify("AnimationStart", t), (Array.isArray(t) ? Promise.all(t.map((t) => da(e, t, n))) : typeof t == "string" ? da(e, t, n) : Promise.all(ua(e, Zi(e, t, n.custom), n))).then(() => {
		e.notify("AnimationComplete", t);
	});
}
// node_modules/motion-dom/dist/es/value/types/auto.mjs
var pa = {
	test: (e) => e === "auto",
	parse: (e) => e
}, ma = (e) => (t) => t.test(e), ha = [
	we,
	F,
	P,
	N,
	Be,
	ze,
	pa
], ga = (e) => ha.find(ma(e));
// node_modules/motion-dom/dist/es/animation/keyframes/utils/is-none.mjs
function _a(e) {
	return typeof e == "number" ? e === 0 : e === null || e === "none" || e === "0" || v(e);
}
// node_modules/motion-dom/dist/es/animation/keyframes/utils/make-none-animatable.mjs
var va = /* @__PURE__ */ new Set([
	"auto",
	"none",
	"0"
]);
function ya(e, t, n) {
	let r = 0, i;
	for (; r < e.length && !i;) {
		let t = e[r];
		typeof t == "string" && !va.has(t) && $e(t) && (i = e[r]), r++;
	}
	if (i && n) for (let r of t) e[r] !== i && (e[r] = Wn(n, i));
}
// node_modules/motion-dom/dist/es/animation/keyframes/DOMKeyframesResolver.mjs
var ba = class extends br {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i, !0);
	}
	scheduleResolve() {
		if (this.canReadNow() && (this.readKeyframes(), !this.needsMeasurement)) return this.complete();
		super.scheduleResolve();
	}
	canReadNow() {
		let { unresolvedKeyframes: e, element: t, motionValue: n } = this, r = e[0] ?? n?.get();
		if (!t?.current || r === void 0) return !1;
		for (let t = 0; t < e.length; t++) if (Ce(t ? e[t] : r)) return !1;
		return !0;
	}
	readKeyframes() {
		let { unresolvedKeyframes: e, element: t, name: n } = this;
		if (!t?.current) return;
		super.readKeyframes();
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			if (typeof r == "string" && (r = r.trim(), xe(r))) {
				let i = Ji(r, t.current);
				i !== void 0 && (e[n] = i), n === e.length - 1 && (this.finalKeyframe = r);
			}
		}
		if (this.resolveNoneKeyframes(), !$i.has(n) || e.length !== 2) return;
		let [r, i] = e;
		if (typeof r == "number" && typeof i == "number") return;
		let a = ga(r), o = ga(i);
		if (Ce(r) !== Ce(i) && dr[n]) this.needsMeasurement = !0;
		else if (a !== o) {
			if (rr(a) && rr(o)) for (let t = 0; t < e.length; t++) {
				let n = e[t];
				typeof n == "string" && (e[t] = parseFloat(n));
			}
			else dr[n] && (this.needsMeasurement = !0);
		}
	}
	resolveNoneKeyframes() {
		let { unresolvedKeyframes: e, name: t } = this, n = [];
		for (let t = 0; t < e.length; t++) (e[t] === null || _a(e[t])) && n.push(t);
		n.length && ya(e, n, t);
	}
	measure() {
		let { element: e, name: t } = this;
		return dr[t](window.getComputedStyle(e.current), () => e.measureViewportBox());
	}
	measureInitialState() {
		let { element: e, unresolvedKeyframes: t, name: n } = this;
		if (!e?.current) return;
		n === "height" && (this.suspendedScrollY = window.pageYOffset), this.measuredOrigin = this.measure(), t[0] = this.measuredOrigin;
		let r = t[t.length - 1];
		r !== void 0 && this.motionValue?.jump(r, !1);
	}
	measureEndState() {
		let { element: e, unresolvedKeyframes: t } = this;
		if (!e?.current) return;
		this.motionValue?.jump(this.measuredOrigin, !1);
		let n = t.length - 1, r = t[n];
		t[n] = this.measure(), r !== null && this.finalKeyframe === void 0 && (this.finalKeyframe = r), this.resolveNoneKeyframes();
	}
}, xa = [
	"borderTopLeftRadius",
	"borderTopRightRadius",
	"borderBottomRightRadius",
	"borderBottomLeftRadius"
];
// node_modules/motion-dom/dist/es/utils/is-html-element.mjs
function Sa(e) {
	return _(e) && "offsetHeight" in e && !("ownerSVGElement" in e);
}
// node_modules/motion-dom/dist/es/utils/is-svg-element.mjs
function Ca(e) {
	return _(e) && "ownerSVGElement" in e;
}
// node_modules/motion-dom/dist/es/scope/active.mjs
var wa = {};
function Ta(e) {
	return wa.current?.add(e), e;
}
var Ea = (e) => wa.current ? wa.current.bind(e) : e;
// node_modules/motion-dom/dist/es/utils/resolve-elements.mjs
function Da(e, t, n) {
	if (e == null) return [];
	if (e instanceof EventTarget) return [e];
	if (typeof e == "string") {
		let r = t ? t.current : wa.current?.root || document, i = n?.[e] ?? r.querySelectorAll(e);
		return i ? Array.from(i) : [];
	}
	return Array.from(e).filter((e) => e != null);
}
// node_modules/motion-dom/dist/es/render/dom/utils/camel-to-dash.mjs
function Oa(e) {
	return e.replace(/([A-Z])/g, (e) => `-${e.toLowerCase()}`);
}
// node_modules/motion-dom/dist/es/render/html/utils/build-styles.mjs
function ka(e, t, n) {
	let { style: r, vars: i, transformOrigin: a } = e, o = !1, s = !1;
	for (let e in t) {
		let n = t[e];
		if (U.has(e)) o = !0;
		else if (ye(e)) i[e] = n;
		else {
			let t = Yr(n, Ln[e]);
			e.startsWith("origin") ? (s = !0, a[e] = t) : r[e] = t;
		}
	}
	if (t.transform || (o || n ? r.transform = ti(t, e.transform, n) : r.transform &&= "none"), s) {
		let { originX: e = "50%", originY: t = "50%", originZ: n = 0 } = a;
		r.transformOrigin = `${e} ${t} ${n}`;
	}
}
// node_modules/motion-dom/dist/es/render/svg/utils/path.mjs
var Aa = {
	offset: "stroke-dashoffset",
	array: "stroke-dasharray"
}, ja = {
	offset: "strokeDashoffset",
	array: "strokeDasharray"
};
function Ma(e, t, n = 1, r = 0, i = !0) {
	e.pathLength = 1;
	let a = i ? Aa : ja;
	e[a.offset] = `${-r}`, e[a.array] = `${t} ${n}`;
}
// node_modules/motion-dom/dist/es/render/svg/utils/build-attrs.mjs
var Na = [
	"transform",
	"opacity",
	"clipPath",
	"filter",
	"offsetDistance",
	"offsetPath",
	"offsetRotate",
	"offsetAnchor"
];
function Pa(e, { attrX: t, attrY: n, attrScale: r, pathLength: i, pathSpacing: a = 1, pathOffset: o = 0, ...s }, c, l, u) {
	if (ka(e, s, l), c) {
		e.style.viewBox && (e.attrs.viewBox = e.style.viewBox);
		return;
	}
	e.attrs = e.style, e.style = {};
	let { attrs: d, style: f } = e;
	for (let e of Na) d[e] !== void 0 && (f[e] = d[e], delete d[e]);
	(f.transform || d.transformOrigin) && (f.transformOrigin = d.transformOrigin ?? "50% 50%", delete d.transformOrigin), f.transform && (f.transformBox = u?.transformBox ?? "fill-box", delete d.transformBox), t !== void 0 && (d.x = t), n !== void 0 && (d.y = n), r !== void 0 && (d.scale = r), i !== void 0 && Ma(d, i, a, o, !1);
}
// node_modules/motion-dom/dist/es/projection/geometry/conversion.mjs
function Fa({ top: e, left: t, right: n, bottom: r }) {
	return {
		x: {
			min: t,
			max: n
		},
		y: {
			min: e,
			max: r
		}
	};
}
function Ia({ x: e, y: t }) {
	return {
		top: t.min,
		right: e.max,
		bottom: t.max,
		left: e.min
	};
}
function La(e, t) {
	if (!t) return e;
	let n = t({
		x: e.left,
		y: e.top
	}), r = t({
		x: e.right,
		y: e.bottom
	});
	return {
		top: n.y,
		left: n.x,
		bottom: r.y,
		right: r.x
	};
}
// node_modules/motion-dom/dist/es/projection/utils/has-transform.mjs
function Ra(e) {
	return e === void 0 || e === 1;
}
function za({ scale: e, scaleX: t, scaleY: n }) {
	return !Ra(e) || !Ra(t) || !Ra(n);
}
var Ba = [
	"rotate",
	"rotateX",
	"rotateY",
	"rotateZ",
	"skewX",
	"skewY"
];
function Va(e) {
	return za(e) || Ua(e) || Ha(e);
}
function Ha(e) {
	return e.z || e.rotate || e.rotateX || e.rotateY || e.rotateZ || e.skewX || e.skewY;
}
function Ua(e) {
	return Wa(e.x) || Wa(e.y);
}
function Wa(e) {
	return e && e !== "0%";
}
// node_modules/motion-dom/dist/es/projection/geometry/delta-apply.mjs
function Ga(e, t, n) {
	return n + t * (e - n);
}
function Ka(e, t, n, r, i) {
	return i !== void 0 && (e = Ga(e, i, r)), Ga(e, n, r) + t;
}
function qa(e, t = 0, n = 1, r, i) {
	e.min = Ka(e.min, t, n, r, i), e.max = Ka(e.max, t, n, r, i);
}
function Ja(e, { x: t, y: n }) {
	qa(e.x, t.translate, t.scale, t.originPoint), qa(e.y, n.translate, n.scale, n.originPoint);
}
var Ya = .999999999999, Xa = 1.0000000000001;
function Za(e, t, n, r = !1) {
	let i = n.length;
	if (!i) return;
	t.x = t.y = 1;
	let a, o;
	for (let s = 0; s < i; s++) a = n[s], o = a.projectionDelta, a.options.visualElement?.props.style?.display !== "contents" && (r === !0 && a.options.layoutScroll && a.scroll && a !== a.root && (G(e.x, -a.scroll.offset.x), G(e.y, -a.scroll.offset.y)), o && (t.x *= o.x.scale, t.y *= o.y.scale, Ja(e, o)), r && (r.path?.[s] || r) !== a && Va(a.latestValues) && eo(e, a.latestValues, a.layout?.layoutBox));
	t.x < Xa && t.x > Ya && (t.x = 1), t.y < Xa && t.y > Ya && (t.y = 1);
}
function G(e, t) {
	e.min += t, e.max += t;
}
function Qa(e, t, n, r, i = .5) {
	qa(e, t, n, R(e.min, e.max, i), r);
}
function $a(e, t) {
	return typeof e == "string" ? parseFloat(e) / 100 * (t.max - t.min) : e;
}
function eo(e, t, n) {
	let r = n ?? e;
	Qa(e.x, $a(t.x, r.x), t.scaleX, t.scale, t.originX), Qa(e.y, $a(t.y, r.y), t.scaleY, t.scale, t.originY);
}
// node_modules/motion-dom/dist/es/projection/utils/measure.mjs
function to(e, t) {
	return Fa(La(e.getBoundingClientRect(), t));
}
function no(e, t, n) {
	let r = to(e, n), { scroll: i } = t;
	return i && (G(r.x, i.offset.x), G(r.y, i.offset.y)), r;
}
var ro = () => ({
	x: document.documentElement.scrollLeft || document.body?.scrollLeft || 0,
	y: document.documentElement.scrollTop || document.body?.scrollTop || 0
}), { schedule: io, cancel: ao } = /* @__PURE__ */ kt(queueMicrotask, !1);
// node_modules/motion-dom/dist/es/animation/animate/single-value.mjs
function oo(e, t, n) {
	let r = W(e) ? e : Fi(e);
	return r.run(Gi("", r, t, n)), r.animation;
}
// node_modules/motion-dom/dist/es/projection/styles/scale-correction.mjs
var so = {}, co = {
	value: null,
	addProjectionMetrics: null,
	countProjection: void 0
};
// node_modules/motion-dom/dist/es/utils/delay.mjs
function lo(e, t) {
	let n = M.now();
	e = Ea(e);
	let r = ({ timestamp: i }) => {
		let a = i - n;
		a >= t && (B(r), e(a - t));
	};
	return z.setup(r, !0), Ta(() => B(r));
}
// node_modules/motion-dom/dist/es/utils/is-ref-object.mjs
function uo(e) {
	return e && typeof e == "object" && Object.prototype.hasOwnProperty.call(e, "current");
}
// node_modules/motion-dom/dist/es/utils/is-svg-svg-element.mjs
function fo(e) {
	return Ca(e) && e.tagName === "svg";
}
// node_modules/motion-dom/dist/es/value/utils/resolve-motion-value.mjs
function po(e) {
	return W(e) ? e.get() : e;
}
// node_modules/motion-dom/dist/es/value/utils/as-number.mjs
var mo = (e) => typeof e == "number" ? e : parseFloat(e), ho = xa.length, go = (e) => typeof e == "number" || F.test(e);
function _o(e, t, n, r, i, a) {
	i ? (e.opacity = R(0, n.opacity ?? 1, yo(r)), e.opacityExit = R(t.opacity ?? 1, 0, bo(r))) : a && (e.opacity = R(t.opacity ?? 1, n.opacity ?? 1, r));
	for (let i = 0; i < ho; i++) {
		let a = xa[i], o = vo(t, a), s = vo(n, a);
		(o !== void 0 || s !== void 0) && (o ||= 0, s ||= 0, o === 0 || s === 0 || go(o) === go(s) ? (e[a] = Math.max(R(mo(o), mo(s), r), 0), (P.test(s) || P.test(o)) && (e[a] += "%")) : e[a] = s);
	}
	for (let i = 0; i < Ba.length; i++) {
		let a = Ba[i];
		(t[a] || n[a]) && (e[a] = R(t[a] || 0, n[a] || 0, r));
	}
}
function vo(e, t) {
	return e[t] === void 0 ? e.borderRadius : e[t];
}
var yo = /*@__PURE__*/ xo(0, .5, A), bo = /*@__PURE__*/ xo(.5, .95, b);
function xo(e, t, n) {
	return (r) => r < e ? 0 : r > t ? 1 : n(/* @__PURE__ */ S(e, t, r));
}
// node_modules/motion-dom/dist/es/projection/geometry/copy.mjs
function So(e, t) {
	e.min = t.min, e.max = t.max;
}
function K(e, t) {
	So(e.x, t.x), So(e.y, t.y);
}
function Co(e, t) {
	e.translate = t.translate, e.scale = t.scale, e.originPoint = t.originPoint, e.origin = t.origin;
}
// node_modules/motion-dom/dist/es/projection/geometry/delta-calc.mjs
var wo = .9999, To = 1.0001, Eo = -.01, Do = .01;
function q(e) {
	return e.max - e.min;
}
function Oo(e, t, n) {
	return Math.abs(e - t) <= n;
}
function ko(e, t, n, r = .5) {
	e.origin = r, e.originPoint = R(t.min, t.max, e.origin), e.scale = q(n) / q(t), e.translate = R(n.min, n.max, e.origin) - e.originPoint, (e.scale >= wo && e.scale <= To || isNaN(e.scale)) && (e.scale = 1), (e.translate >= Eo && e.translate <= Do || isNaN(e.translate)) && (e.translate = 0);
}
function Ao(e, t, n, r) {
	ko(e.x, t.x, n.x, r?.originX), ko(e.y, t.y, n.y, r?.originY);
}
function jo(e, t, n, r = 0) {
	e.min = (r ? R(n.min, n.max, r) : n.min) + t.min, e.max = e.min + q(t);
}
function Mo(e, t, n, r) {
	jo(e.x, t.x, n.x, r?.x), jo(e.y, t.y, n.y, r?.y);
}
function No(e, t, n, r = 0) {
	let i = r ? R(n.min, n.max, r) : n.min;
	e.min = t.min - i, e.max = e.min + q(t);
}
function Po(e, t, n, r) {
	No(e.x, t.x, n.x, r?.x), No(e.y, t.y, n.y, r?.y);
}
// node_modules/motion-dom/dist/es/projection/geometry/delta-remove.mjs
function Fo(e, t, n, r, i) {
	return e -= t, e = Ga(e, 1 / n, r), i !== void 0 && (e = Ga(e, 1 / i, r)), e;
}
function Io(e, t = 0, n = 1, r = .5, i, a = e, o = e) {
	if (P.test(t) && (t = parseFloat(t), t = R(o.min, o.max, t / 100) - o.min), typeof t != "number") return;
	let s = R(a.min, a.max, r);
	e === a && (s -= t), e.min = Fo(e.min, t, n, s, i), e.max = Fo(e.max, t, n, s, i);
}
function Lo(e, t, [n, r, i], a, o) {
	Io(e, t[n], t[r], t[i], t.scale, a, o);
}
var Ro = [
	"x",
	"scaleX",
	"originX"
], zo = [
	"y",
	"scaleY",
	"originY"
];
function Bo(e, t, n, r) {
	Lo(e.x, t, Ro, n?.x, r?.x), Lo(e.y, t, zo, n?.y, r?.y);
}
// node_modules/motion-dom/dist/es/projection/geometry/round.mjs
var Vo = (e) => typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().includes(e), Ho = Vo("applewebkit/") && !Vo("chrome/") ? Math.round : b;
function Uo(e) {
	e.min = Ho(e.min), e.max = Ho(e.max);
}
function Wo(e) {
	Uo(e.x), Uo(e.y);
}
// node_modules/motion-dom/dist/es/projection/geometry/models.mjs
var Go = () => ({
	translate: 0,
	scale: 1,
	origin: 0,
	originPoint: 0
}), Ko = () => ({
	x: Go(),
	y: Go()
}), qo = () => ({
	min: 0,
	max: 0
}), J = () => ({
	x: qo(),
	y: qo()
});
// node_modules/motion-dom/dist/es/projection/geometry/utils.mjs
function Jo(e) {
	return e.translate === 0 && e.scale === 1;
}
function Yo(e) {
	return Jo(e.x) && Jo(e.y);
}
function Xo(e, t) {
	return e.min === t.min && e.max === t.max;
}
function Zo(e, t) {
	return Xo(e.x, t.x) && Xo(e.y, t.y);
}
function Qo(e, t) {
	return Math.round(e.min) === Math.round(t.min) && Math.round(e.max) === Math.round(t.max);
}
function $o(e, t) {
	return Qo(e.x, t.x) && Qo(e.y, t.y);
}
function es(e) {
	return q(e.x) / q(e.y);
}
function ts(e, t) {
	return e.translate === t.translate && e.scale === t.scale && e.originPoint === t.originPoint;
}
// node_modules/motion-dom/dist/es/projection/shared/stack.mjs
var ns = class {
	constructor() {
		this.members = [];
	}
	add(e) {
		f(this.members, e);
		for (let t = this.members.length - 1; t >= 0; t--) {
			let n = this.members[t];
			if (n === e || n === this.lead || n === this.prevLead) continue;
			let r = n.instance;
			r && r.isConnected !== !1 || n.snapshot || (p(this.members, n), n.unmount());
		}
		e.scheduleRender();
	}
	remove(e) {
		if (p(this.members, e), e === this.prevLead && (this.prevLead = void 0), e === this.lead) {
			let e = this.members[this.members.length - 1];
			e && this.promote(e);
		}
	}
	relegate(e) {
		for (let t = this.members.indexOf(e) - 1; t >= 0; t--) {
			let e = this.members[t];
			if (e.isPresent !== !1 && e.instance?.isConnected !== !1) return this.promote(e), !0;
		}
		return !1;
	}
	promote(e, t) {
		let n = this.lead;
		if (e !== n && (this.prevLead = n, this.lead = e, e.show(), n)) {
			n.updateSnapshot(), e.scheduleRender();
			let { layoutDependency: r } = n.options, { layoutDependency: i } = e.options;
			(r === void 0 || r !== i) && (e.resumeFrom = n, t && (n.preserveOpacity = !0), n.snapshot && (e.snapshot = n.snapshot, e.snapshot.latestValues = n.animationValues || n.latestValues), e.root?.isUpdating && (e.isLayoutDirty = !0)), e.options.crossfade === !1 && n.hide();
		}
	}
	exitAnimationComplete() {
		this.members.forEach((e) => {
			e.options.onExitComplete?.(), e.resumingFrom?.options.onExitComplete?.();
		});
	}
	scheduleRender() {
		this.members.forEach((e) => e.instance && e.scheduleRender(!1));
	}
	removeLeadSnapshot() {
		this.lead?.snapshot && (this.lead.snapshot = void 0);
	}
};
// node_modules/motion-dom/dist/es/projection/styles/scale-border-radius.mjs
function rs(e, t) {
	return t.max === t.min ? 0 : e / (t.max - t.min) * 100;
}
var is = { correct: (e, t) => {
	if (!t.target) return e;
	if (typeof e == "string") {
		if (F.test(e)) e = parseFloat(e);
		else return e;
	}
	return `${rs(e, t.target.x)}% ${rs(e, t.target.y)}%`;
} }, as = {
	borderRadius: /* @__PURE__ */ Object.assign({}, is, { applyTo: /* @__PURE__ */ xa.slice() }),
	borderTopLeftRadius: is,
	borderTopRightRadius: is,
	borderBottomLeftRadius: is,
	borderBottomRightRadius: is,
	boxShadow: { correct: (e, { treeScale: t, projectionDelta: n }) => {
		let r = e, i = L.parse(e);
		if (i.length > 5) return r;
		let a = L.createTransformer(e), o = typeof i[0] == "number" ? 0 : 1, s = n.x.scale * t.x, c = n.y.scale * t.y;
		i[0 + o] /= s, i[1 + o] /= c;
		let l = R(s, c, .5);
		return typeof i[2 + o] == "number" && (i[2 + o] /= l), typeof i[3 + o] == "number" && (i[3 + o] /= l), a(i);
	} }
};
// node_modules/motion-dom/dist/es/projection/styles/transform.mjs
function os(e, t, n) {
	let r = "", i = e.x.translate / t.x, a = e.y.translate / t.y, o = n?.z || 0;
	(i || a || o) && (r = `translate3d(${i}px, ${a}px, ${o}px) `);
	let s = "";
	if (n) {
		let { transformPerspective: e } = n;
		e && (r = `perspective(${e}px) ${r}`);
		for (let e = 0; e < Ba.length; e++) {
			let t = Ba[e], r = n[t];
			r && (s += `${t}(${r}deg) `), !e && n.pathRotation && (s += `rotate(${n.pathRotation}deg) `);
		}
	}
	if (s) {
		(t.x !== 1 || t.y !== 1) && (r += `scale(${1 / t.x}, ${1 / t.y}) `), r += s;
		let n = e.x.scale * t.x, i = e.y.scale * t.y;
		(n !== 1 || i !== 1) && (r += `scale(${n}, ${i})`);
	} else e.x.scale !== 1 || e.y.scale !== 1 ? r += `scale(${e.x.scale}, ${e.y.scale})` : r || t.x === 1 && t.y === 1 || (r = "scale(1, 1)");
	return r || "none";
}
// node_modules/motion-dom/dist/es/projection/utils/each-axis.mjs
function Y(e) {
	return [e("x"), e("y")];
}
// node_modules/motion-dom/dist/es/projection/utils/compare-by-depth.mjs
var ss = (e, t) => e.depth - t.depth, cs = class {
	constructor() {
		this.children = [], this.isDirty = !1;
	}
	add(e) {
		f(this.children, e), this.isDirty = !0;
	}
	remove(e) {
		p(this.children, e), this.isDirty = !0;
	}
	forEach(e) {
		this.isDirty && this.children.sort(ss), this.isDirty = !1, this.children.forEach(e);
	}
}, ls = {
	hasAnimatedSinceResize: !0,
	hasEverUpdated: !1
}, us = [
	"z",
	"skew",
	"skewZ"
], ds = 1e3, fs = 0;
function ps(e, t, n, r) {
	let { latestValues: i } = t;
	i[e] && (n[e] = i[e], t.setStaticValue(e, 0), r && (r[e] = 0));
}
var ms = (e) => e.instance && ni.get(e.instance)?.demote() && e.resetSkewAndRotation();
function hs(e) {
	if (e.hasCheckedOptimisedAppear = !0, e.root === e) return;
	let { visualElement: t } = e.options;
	if (!t) return;
	let n = sa(t);
	if (window.MotionHasOptimisedAnimation(n, "transform")) {
		let { layout: t, layoutId: r } = e.options;
		window.MotionCancelOptimisedAnimation(n, "transform", z, !(t || r));
	}
	let { parent: r } = e;
	r && !r.hasCheckedOptimisedAppear && hs(r);
}
function gs(e) {
	if (e) return e.options.allowProjection === !1 ? gs(e.parent) : e.projection;
}
function _s({ attachResizeListener: e, defaultParent: t, measureScroll: n, checkIsScrollRoot: r, resetTransform: i }) {
	return Object.assign(so, {
		...as,
		...so
	}), class {
		static create(e, t, n) {
			let { layoutId: r, layout: i, drag: a, dragConstraints: o, layoutScroll: s, layoutRoot: c, layoutAnchor: l, layoutCrossfade: u } = t, d = e.projection = new this(e.latestValues, t["data-framer-portal-id"] ? void 0 : gs(e.parent));
			d.setOptions({
				layoutId: r,
				layout: i,
				alwaysMeasureLayout: !!a || o && uo(o),
				visualElement: e,
				animationType: typeof i == "string" ? i : "both",
				initialPromotionConfig: n,
				crossfade: u,
				layoutScroll: s,
				layoutRoot: c,
				layoutAnchor: l
			});
			let f = d.getStack()?.lead;
			f && !d.root.isUpdateBlocked() && (f.willUpdate(), f.scheduleCheckAfterUnmount());
		}
		constructor(e = {}, n = t?.()) {
			this.id = fs++, this.animationId = 0, this.animationCommitId = 0, this.children = /* @__PURE__ */ new Set(), this.options = {}, this.isTreeAnimating = !1, this.isAnimationBlocked = !1, this.isLayoutDirty = !1, this.isProjectionDirty = !1, this.isSharedProjectionDirty = !1, this.isTransformDirty = !1, this.updateManuallyBlocked = !1, this.updateBlockedByResize = !1, this.isUpdating = !1, this.isSVG = !1, this.needsReset = !1, this.shouldResetTransform = !1, this.hasCheckedOptimisedAppear = !1, this.treeScale = {
				x: 1,
				y: 1
			}, this.eventHandlers = /* @__PURE__ */ new Map(), this.hasTreeAnimated = !1, this.updateScheduled = !1, this.scheduleUpdate = () => this.update(), this.projectionUpdateScheduled = !1, this.checkUpdateFailed = () => {
				this.isUpdating && (this.isUpdating = !1, this.clearAllSnapshots());
			}, this.updateProjection = () => {
				this.projectionUpdateScheduled = !1, this.nodes.forEach(bs), this.nodes.forEach(js), this.nodes.forEach(Ms), this.nodes.forEach(xs), co.countProjection?.();
			}, this.resolvedRelativeTargetAt = 0, this.hasProjected = !1, this.isVisible = !0, this.animationProgress = 0, this.sharedNodes = /* @__PURE__ */ new Map(), this.latestValues = e, this.root = n ? n.root || n : this, this.path = n ? [...n.path, n] : [], this.parent = n, this.depth = n ? n.depth + 1 : 0;
			for (let e = 0; e < this.path.length; e++) this.path[e].shouldResetTransform = !0;
			this.root === this && (this.nodes = new cs());
		}
		addEventListener(e, t) {
			return this.eventHandlers.has(e) || this.eventHandlers.set(e, new C()), this.eventHandlers.get(e).add(t);
		}
		notifyListeners(e, ...t) {
			this.eventHandlers.get(e)?.notify(...t);
		}
		hasListeners(e) {
			return this.eventHandlers.has(e);
		}
		mount(t) {
			if (this.instance) return;
			this.isSVG = Ca(t) && !fo(t), this.instance = t;
			let { layoutId: n, layout: r, visualElement: i } = this.options;
			if (i && !i.current && i.mount(t), this.root.nodes.add(this), this.parent?.children.add(this), this.root.hasTreeAnimated && (r || n) && (this.isLayoutDirty = !0), e) {
				let n, r = 0, i = () => this.root.updateBlockedByResize = !1;
				z.read(() => {
					r = window.innerWidth;
				}), e(t, () => {
					let e = window.innerWidth;
					e !== r && (r = e, this.root.updateBlockedByResize = !0, n?.(), n = lo(i, 250), ls.hasAnimatedSinceResize && (ls.hasAnimatedSinceResize = !1, this.nodes.forEach(As)));
				});
			}
			n && this.root.registerSharedNode(n, this), this.addLayoutListener();
		}
		addLayoutListener() {
			let { layoutId: e, layout: t, visualElement: n, animate: r } = this.options;
			this.instance && !this.hasLayoutListener && r !== !1 && n && (e || t) && (this.hasLayoutListener = !0, this.addEventListener("didUpdate", ({ delta: e, hasLayoutChanged: t, hasRelativeLayoutChanged: r, layout: i }) => {
				if (this.isAnimationBlocked) {
					this.target = void 0, this.relativeTarget = void 0;
					return;
				}
				let a = this.options.transition || n.getDefaultTransition() || Rs, { onLayoutAnimationStart: o, onLayoutAnimationComplete: s } = n.getProps(), c = !this.targetLayout || !$o(this.targetLayout, i), l = !t && r;
				if (this.options.layoutRoot || this.resumeFrom || l || t && (c || !this.currentAnimation)) {
					this.resumeFrom && (this.resumingFrom = this.resumeFrom, this.resumingFrom.resumingFrom = void 0);
					let t = {
						...Li(a, "layout"),
						onPlay: o,
						onComplete: s
					};
					(n.shouldReduceMotion || this.options.layoutRoot) && (t.delay = 0, t.type = !1), this.startAnimation(t), this.setAnimationOrigin(e, l, t.path);
				} else t || As(this), this.isLead() && this.options.onExitComplete?.();
				this.targetLayout = i;
			}));
		}
		unmount() {
			this.options.layoutId && this.willUpdate(), this.root.nodes.remove(this), this.getStack()?.remove(this), this.parent?.children.delete(this), this.instance = void 0, this.eventHandlers.clear(), this.hasLayoutListener = !1, B(this.updateProjection);
		}
		blockUpdate() {
			this.updateManuallyBlocked = !0;
		}
		unblockUpdate() {
			this.updateManuallyBlocked = !1;
		}
		isUpdateBlocked() {
			return this.updateManuallyBlocked || this.updateBlockedByResize;
		}
		startUpdate() {
			this.isUpdateBlocked() || (this.isUpdating = !0, this.nodes?.forEach(Ns), this.animationId++);
		}
		getTransformTemplate() {
			let { visualElement: e } = this.options;
			return e && e.getProps().transformTemplate;
		}
		willUpdate(e = !0) {
			if (this.root.hasTreeAnimated = !0, this.root.isUpdateBlocked()) {
				this.options.onExitComplete?.();
				return;
			}
			if (window.MotionCancelOptimisedAnimation && !this.hasCheckedOptimisedAppear && hs(this), !this.root.isUpdating && this.root.startUpdate(), this.isLayoutDirty) return;
			ms(this), this.isLayoutDirty = !0;
			for (let e = 0; e < this.path.length; e++) {
				let t = this.path[e];
				t.shouldResetTransform = !0, ms(t), (typeof t.latestValues.x == "string" || typeof t.latestValues.y == "string") && (t.isLayoutDirty = !0), t.updateScroll("snapshot"), t.options.layoutRoot && t.willUpdate(!1), t.isAnimationBlocked && (t.dragSnapshot ||= t.measure(), this.dragAncestor = t);
			}
			let { layoutId: t, layout: n } = this.options;
			if (t === void 0 && !n) return;
			let r = this.getTransformTemplate();
			this.prevTransformTemplateValue = r ? r(this.latestValues, "") : void 0, this.updateSnapshot(), e && this.notifyListeners("willUpdate");
		}
		update() {
			if (this.updateScheduled = !1, this.isUpdateBlocked()) {
				let e = this.updateBlockedByResize;
				this.unblockUpdate(), this.updateBlockedByResize = !1, this.clearAllSnapshots(), e && this.nodes.forEach(ws), this.nodes.forEach(Cs);
				return;
			}
			if (this.animationId <= this.animationCommitId) {
				this.nodes.forEach(Ts);
				return;
			}
			this.animationCommitId = this.animationId, this.isUpdating ? (this.isUpdating = !1, this.nodes.forEach(Ds), this.nodes.forEach(Os), this.nodes.forEach(ks), this.nodes.forEach(vs), this.nodes.forEach(ys)) : this.nodes.forEach(Ts), this.clearAllSnapshots();
			let e = M.now();
			j.delta = m(0, 1e3 / 60, e - j.timestamp), j.timestamp = e, j.isProcessing = !0, At.update.process(j), At.preRender.process(j), At.render.process(j), j.isProcessing = !1;
		}
		didUpdate() {
			this.updateScheduled || (this.updateScheduled = !0, io.read(this.scheduleUpdate));
		}
		clearAllSnapshots() {
			this.nodes.forEach(Ss), this.sharedNodes.forEach((e, t) => e.members.length ? e.removeLeadSnapshot() : this.sharedNodes.delete(t));
		}
		scheduleUpdateProjection() {
			this.projectionUpdateScheduled || (this.projectionUpdateScheduled = !0, z.preRender(this.updateProjection, !1, !0));
		}
		scheduleCheckAfterUnmount() {
			z.postRender(() => {
				this.isLayoutDirty ? this.root.didUpdate() : this.root.checkUpdateFailed();
			});
		}
		updateSnapshot() {
			!this.snapshot && this.instance && (this.snapshot = this.measure(), this.snapshot && !q(this.snapshot.measuredBox.x) && !q(this.snapshot.measuredBox.y) && (this.snapshot = void 0));
		}
		updateLayout() {
			if (!this.instance || (this.updateScroll(), !(this.options.alwaysMeasureLayout && this.isLead()) && !this.isLayoutDirty)) return;
			if (this.resumeFrom && !this.resumeFrom.instance) for (let e = 0; e < this.path.length; e++) this.path[e].updateScroll();
			let e = this.layout;
			this.layout = this.measure(!1), this.layoutCorrected ||= J(), this.isLayoutDirty = !1, this.projectionDelta = void 0, this.notifyListeners("measure", this.layout.layoutBox);
			let { visualElement: t } = this.options;
			t?.notify("LayoutMeasure", this.layout.layoutBox, e?.layoutBox);
		}
		updateScroll(e = "measure") {
			let { scroll: t, instance: i } = this, { animationId: a } = this.root;
			if (this.options.layoutScroll && i && !(t && t.animationId === a && t.phase === e)) {
				let o = r(i);
				this.scroll = {
					animationId: a,
					phase: e,
					isRoot: o,
					offset: n(i),
					wasRoot: t ? t.isRoot : o
				};
			}
		}
		resetTransform() {
			if (!i) return;
			let e = this.isLayoutDirty || this.shouldResetTransform || this.options.alwaysMeasureLayout;
			e && ms(this);
			let t = this.projectionDelta && !Yo(this.projectionDelta), n = this.getTransformTemplate(), r = n ? n(this.latestValues, "") : void 0, a = r !== this.prevTransformTemplateValue;
			e && this.instance && (t || Va(this.latestValues) || a) && (i(this.instance, r), this.shouldResetTransform = !1, this.scheduleRender());
		}
		measure(e = !0) {
			let t = this.measurePageBox(), n = this.removeElementScroll(t);
			return e && (n = this.removeTransform(n)), Wo(n), {
				animationId: this.root.animationId,
				measuredBox: t,
				layoutBox: n,
				latestValues: {},
				source: this.id
			};
		}
		measurePageBox() {
			let { visualElement: e } = this.options;
			if (!e) return J();
			let t = e.measureViewportBox();
			if (!(this.scroll?.wasRoot || this.path.some(Vs))) {
				let { scroll: e } = this.root;
				e && (G(t.x, e.offset.x), G(t.y, e.offset.y));
			}
			return t;
		}
		removeElementScroll(e) {
			let t = J();
			if (K(t, e), this.scroll?.wasRoot) return t;
			for (let n = 0; n < this.path.length; n++) {
				let r = this.path[n], { scroll: i, options: a } = r;
				r !== this.root && i && a.layoutScroll && (i.wasRoot && K(t, e), G(t.x, i.offset.x), G(t.y, i.offset.y));
			}
			return t;
		}
		applyTransform(e, t = !1, n, r, i = 0) {
			let a = n || J();
			K(a, e);
			for (let e = i; e < this.path.length; e++) {
				let n = this.path[e];
				!t && n.options.layoutScroll && n.scroll && n !== n.root && (G(a.x, -n.scroll.offset.x), G(a.y, -n.scroll.offset.y)), Va(n.latestValues) && eo(a, n.latestValues, n.layout?.layoutBox);
			}
			return !r && Va(this.latestValues) && eo(a, this.latestValues, this.layout?.layoutBox), a;
		}
		removeTransform(e) {
			let t = J();
			K(t, e);
			for (let e = 0; e < this.path.length; e++) {
				let n = this.path[e];
				if (!Va(n.latestValues)) continue;
				let r;
				n.instance && (za(n.latestValues) && n.updateSnapshot(), r = J(), K(r, n.measurePageBox())), Bo(t, n.latestValues, n.snapshot?.layoutBox, r);
			}
			return Va(this.latestValues) && Bo(t, this.latestValues), t;
		}
		setTargetDelta(e) {
			this.targetDelta = e, this.root.scheduleUpdateProjection(), this.isProjectionDirty = !0;
		}
		setOptions(e) {
			this.options = {
				...this.options,
				...e,
				crossfade: e.crossfade === void 0 || e.crossfade
			}, this.addLayoutListener();
		}
		clearMeasurements() {
			this.scroll = void 0, this.layout = void 0, this.snapshot = void 0, this.prevTransformTemplateValue = void 0, this.targetDelta = void 0, this.target = void 0, this.isLayoutDirty = !1;
		}
		forceRelativeParentToResolveTarget() {
			this.relativeParent && this.relativeParent.resolvedRelativeTargetAt !== j.timestamp && this.relativeParent.resolveTargetDelta(!0);
		}
		resolveTargetDelta(e = !1) {
			let t = this.getLead();
			this.isProjectionDirty ||= t.isProjectionDirty, this.isTransformDirty ||= t.isTransformDirty, this.isSharedProjectionDirty ||= t.isSharedProjectionDirty;
			let n = !!this.resumingFrom || this !== t;
			if (!(e || n && this.isSharedProjectionDirty || this.isProjectionDirty || this.parent?.isProjectionDirty || this.attemptToResolveRelativeTarget || this.root.updateBlockedByResize)) return;
			let { layout: r, layoutId: i } = this.options;
			if (!this.layout || !(r || i)) return;
			this.resolvedRelativeTargetAt = j.timestamp;
			let a = this.getClosestProjectingParent();
			!this.targetDelta && !this.relativeTarget && (this.options.layoutAnchor !== !1 && a && a.layout ? this.createRelativeTarget(a, this.layout.layoutBox, a.layout.layoutBox) : this.removeRelativeTarget()), (this.relativeTarget || this.targetDelta) && (this.target || (this.target = J(), this.targetWithTransforms = J()), this.relativeTarget && this.relativeTargetOrigin && this.relativeParent && this.relativeParent.target ? (this.forceRelativeParentToResolveTarget(), Mo(this.target, this.relativeTarget, this.relativeParent.target, this.options.layoutAnchor || void 0)) : this.targetDelta ? (this.resumingFrom ? this.applyTransform(this.layout.layoutBox, !1, this.target, !0) : K(this.target, this.layout.layoutBox), Ja(this.target, this.targetDelta)) : K(this.target, this.layout.layoutBox), this.attemptToResolveRelativeTarget && (this.attemptToResolveRelativeTarget = !1, this.options.layoutAnchor !== !1 && a && (!a.resumingFrom == !this.resumingFrom || a.options.layoutRoot && !a.resumingFrom) && !a.options.layoutScroll && a.target && this.animationProgress !== 1 ? this.createRelativeTarget(a, this.target, a.target) : this.relativeParent = this.relativeTarget = void 0), co.countProjection?.(1));
		}
		getClosestProjectingParent() {
			if (!(!this.parent || za(this.parent.latestValues) || Ua(this.parent.latestValues))) return this.parent.isProjecting() ? this.parent : this.parent.getClosestProjectingParent();
		}
		isProjecting() {
			return !!((this.relativeTarget || this.targetDelta || this.options.layoutRoot) && this.layout);
		}
		createRelativeTarget(e, t, n) {
			this.relativeParent = e, this.forceRelativeParentToResolveTarget(), this.relativeTarget = J(), this.relativeTargetOrigin = J(), Po(this.relativeTargetOrigin, t, n, this.options.layoutAnchor || void 0), K(this.relativeTarget, this.relativeTargetOrigin);
		}
		removeRelativeTarget() {
			this.relativeParent = this.relativeTarget = void 0;
		}
		calcProjection() {
			let e = this.getLead(), t = !!this.resumingFrom || this !== e, n = !0;
			if ((this.isProjectionDirty || this.parent?.isProjectionDirty) && (n = !1), t && (this.isSharedProjectionDirty || this.isTransformDirty) && (n = !1), this.resolvedRelativeTargetAt === j.timestamp && (n = !1), n) return;
			let { layout: r, layoutId: i } = this.options;
			if (this.isTreeAnimating = !!(this.parent?.isTreeAnimating || this.currentAnimation || this.pendingAnimation), this.isTreeAnimating || (this.targetDelta = this.relativeTarget = void 0), !this.layout || !(r || i)) return;
			K(this.layoutCorrected, this.layout.layoutBox);
			let a = this.treeScale.x, o = this.treeScale.y;
			Za(this.layoutCorrected, this.treeScale, this.path, t && (e.relativeTarget && !e.relativeParent.resumingFrom ? e.relativeParent : !0)), e.layout && !e.target && (this.treeScale.x !== 1 || this.treeScale.y !== 1) && (e.target = e.layout.layoutBox, e.targetWithTransforms = J());
			let { target: s } = e;
			s ? (!this.projectionDelta || !this.prevProjectionDelta ? this.createProjectionDeltas() : (Co(this.prevProjectionDelta.x, this.projectionDelta.x), Co(this.prevProjectionDelta.y, this.projectionDelta.y)), Ao(this.projectionDelta, this.layoutCorrected, s, this.latestValues), this.treeScale.x === a && this.treeScale.y === o && ts(this.projectionDelta.x, this.prevProjectionDelta.x) && ts(this.projectionDelta.y, this.prevProjectionDelta.y) || (this.hasProjected = !0, this.scheduleRender(), this.notifyListeners("projectionUpdate", s)), co.countProjection?.(2)) : this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
		}
		hide() {
			this.isVisible = !1;
		}
		show() {
			this.isVisible = !0;
		}
		scheduleRender(e = !0) {
			this.options.visualElement?.scheduleRender(), e && this.getStack()?.scheduleRender(), this.resumingFrom && !this.resumingFrom.instance && (this.resumingFrom = void 0);
		}
		createProjectionDeltas() {
			this.prevProjectionDelta = Ko(), this.projectionDelta = Ko(), this.projectionDeltaWithTransform = Ko();
		}
		setAnimationOrigin(e, t = !1, n) {
			let r = this.snapshot, i = r ? r.latestValues : {}, a = { ...this.latestValues }, o = Ko();
			this.relativeParent && this.relativeParent.options.layoutRoot || (this.relativeTarget = this.relativeTargetOrigin = void 0), this.attemptToResolveRelativeTarget = !t;
			let s = J(), c = r?.source !== this.layout?.source, l = this.getStack(), u = !l || l.members.length <= 1, d = !(!c || u || this.options.crossfade !== !0 || this.path.some(Ls));
			this.animationProgress = 0;
			let f, p = n?.interpolateProjection(e);
			this.mixTargetDelta = (t) => {
				let n = t / 1e3, r = p?.(n);
				Ps(o.x, e.x, n), Ps(o.y, e.y, n), r && (o.x.translate = r.x, o.y.translate = r.y), this.setTargetDelta(o), this.relativeTarget && this.relativeTargetOrigin && this.layout && this.relativeParent && this.relativeParent.layout && (Po(s, this.layout.layoutBox, this.relativeParent.layout.layoutBox, this.options.layoutAnchor || void 0), Is(this.relativeTarget, this.relativeTargetOrigin, s, n), f && Zo(this.relativeTarget, f) && (this.isProjectionDirty = !1), f ||= J(), K(f, this.relativeTarget)), c && (this.animationValues = a, _o(a, i, this.latestValues, n, d, u)), r?.rotate !== void 0 && (this.animationValues ||= a, this.animationValues.pathRotation = r.rotate), this.root.scheduleUpdateProjection(), this.scheduleRender(), this.animationProgress = n;
			}, this.mixTargetDelta(this.options.layoutRoot ? 1e3 : 0);
		}
		startAnimation(e) {
			this.notifyListeners("animationStart"), this.currentAnimation?.stop(), this.resumingFrom?.currentAnimation?.stop(), this.pendingAnimation &&= (B(this.pendingAnimation), void 0), this.pendingAnimation = z.update(() => {
				ls.hasAnimatedSinceResize = !0, this.motionValue ||= Fi(0), this.motionValue.jump(0, !1), this.currentAnimation = oo(this.motionValue, [0, 1e3], {
					...e,
					velocity: 0,
					isSync: !0,
					onUpdate: (t) => {
						this.mixTargetDelta(t), e.onUpdate && e.onUpdate(t);
					},
					onComplete: () => {
						e.onComplete && e.onComplete(), this.completeAnimation();
					}
				}), Tn(this.currentAnimation, this), this.resumingFrom && (this.resumingFrom.currentAnimation = this.currentAnimation), this.pendingAnimation = void 0;
			});
		}
		completeAnimation() {
			this.resumingFrom && (this.resumingFrom.currentAnimation = void 0, this.resumingFrom.preserveOpacity = void 0);
			let e = this.getStack();
			e && e.exitAnimationComplete(), this.resumingFrom = this.currentAnimation = this.animationValues = void 0, this.notifyListeners("animationComplete");
		}
		finishAnimation() {
			this.currentAnimation && (this.mixTargetDelta?.(ds), this.currentAnimation.stop()), this.completeAnimation();
		}
		applyTransformsToTarget() {
			let e = this.getLead(), { targetWithTransforms: t, layout: n, latestValues: r } = e, { target: i } = e;
			if (t && i && n) {
				if (this !== e && this.layout && n && Bs(this.options.animationType, this.layout.layoutBox, n.layoutBox)) {
					let { layoutBox: e } = this.layout, t = i;
					i = this.target || J(), zs(i.x, t.x, e.x), zs(i.y, t.y, e.y);
				}
				K(t, i), eo(t, r), Ao(this.projectionDeltaWithTransform, this.layoutCorrected, t, r);
			}
		}
		registerSharedNode(e, t) {
			this.sharedNodes.has(e) || this.sharedNodes.set(e, new ns()), this.sharedNodes.get(e).add(t);
			let n = t.options.initialPromotionConfig;
			t.promote({
				transition: n?.transition,
				preserveFollowOpacity: n?.shouldPreserveFollowOpacity ? n.shouldPreserveFollowOpacity(t) : void 0
			});
		}
		isLead() {
			let e = this.getStack();
			return !e || e.lead === this;
		}
		getLead() {
			let { layoutId: e } = this.options;
			return e && this.getStack()?.lead || this;
		}
		getPrevLead() {
			let { layoutId: e } = this.options;
			return e ? this.getStack()?.prevLead : void 0;
		}
		getStack() {
			let { layoutId: e } = this.options;
			if (e) return this.root.sharedNodes.get(e);
		}
		promote({ needsReset: e, transition: t, preserveFollowOpacity: n } = {}) {
			this.getStack()?.promote(this, n), e && (this.projectionDelta = void 0, this.needsReset = !0), t && this.setOptions({ transition: t });
		}
		relegate() {
			return this.getStack()?.relegate(this) || !1;
		}
		resetSkewAndRotation() {
			let { visualElement: e } = this.options;
			if (!e) return;
			let { latestValues: t } = e;
			if (!Ha(t)) return;
			let n = {};
			for (let t = 0; t < us.length; t++) ps(us[t], e, n, this.animationValues);
			for (let t = 0; t < Ba.length; t++) ps(Ba[t], e, n, this.animationValues);
			e.render();
			for (let t in n) e.setStaticValue(t, n[t]), this.animationValues && (this.animationValues[t] = n[t]);
			e.scheduleRender();
		}
		applyProjectionStyles(e, t) {
			if (!this.instance || this.isSVG) return;
			let n = this.getLead();
			if (!this.isVisible && n !== this) {
				e.visibility = "hidden";
				return;
			}
			let r = this.getTransformTemplate();
			if (this.needsReset) {
				this.needsReset = !1, e.visibility = "", e.opacity = "", e.pointerEvents = po(t?.pointerEvents) || "", e.transform = r ? r(this.latestValues, "") : "none";
				return;
			}
			if (!this.projectionDelta || !this.layout || !n.target) {
				(this.options.layoutId || this.needsShow) && (this.needsShow = !1, e.visibility = "", e.opacity = this.latestValues.opacity === void 0 ? 1 : this.latestValues.opacity, e.pointerEvents = po(t?.pointerEvents) || ""), this.hasProjected && !Va(this.latestValues) && (e.transform = r ? r({}, "") : "none", this.hasProjected = !1);
				return;
			}
			e.visibility = "";
			let i = n.animationValues || n.latestValues;
			this.applyTransformsToTarget();
			let a = os(this.projectionDeltaWithTransform, this.treeScale, i);
			r && (a = r(i, a)), e.transform = a;
			let { x: o, y: s } = this.projectionDelta;
			e.transformOrigin = `${o.origin * 100}% ${s.origin * 100}% 0`, e.opacity = n.animationValues ? n === this ? i.opacity ?? this.latestValues.opacity ?? 1 : this.preserveOpacity ? this.latestValues.opacity : i.opacityExit : n === this ? i.opacity === void 0 ? "" : i.opacity : i.opacityExit === void 0 ? 0 : i.opacityExit;
			for (let t in so) {
				if (i[t] === void 0) continue;
				let { correct: r, applyTo: o, isCSSVariable: s } = so[t], c = a === "none" ? i[t] : r(i[t], n);
				if (o) {
					let t = o.length;
					for (let n = 0; n < t; n++) e[o[n]] = c;
				} else s ? this.options.visualElement.renderState.vars[t] = c : e[t] = c;
			}
			this.options.layoutId && (e.pointerEvents = n === this ? po(t?.pointerEvents) || "" : "none");
		}
		clearSnapshot() {
			this.resumeFrom = this.snapshot = this.dragSnapshot = this.dragAncestor = void 0;
		}
		resetTree() {
			this.root.nodes.forEach((e) => e.currentAnimation?.stop()), this.root.nodes.forEach(Cs), this.root.sharedNodes.clear();
		}
	};
}
function vs(e) {
	e.updateLayout(), Es(e);
}
function ys(e) {
	let t = e.resumeFrom?.snapshot || e.snapshot;
	if (e.isLead() && e.layout && t && e.hasListeners("didUpdate")) {
		let { layoutBox: n, measuredBox: r } = e.layout, { animationType: i } = e.options, a = t.source !== e.layout.source, o = (r, a) => {
			if (i === "size") Y((e) => {
				let t = q(r[e]);
				r[e].min = a[e].min, r[e].max = r[e].min + t;
			});
			else if (i === "x" || i === "y") {
				let e = i === "x" ? "y" : "x";
				So(r[e], a[e]);
			} else Bs(i, t.layoutBox, n) && Y((t) => {
				let n = q(a[t]);
				r[t].max = r[t].min + n, e.relativeTarget && !e.currentAnimation && (e.isProjectionDirty = !0, e.relativeTarget[t].max = e.relativeTarget[t].min + n);
			});
		}, s = a ? t.measuredBox : t.layoutBox;
		o(s, n);
		let c = Ko();
		Ao(c, n, t.layoutBox);
		let l = Ko();
		Ao(l, a ? e.applyTransform(r, !0) : n, s);
		let u = !Yo(c), d = !1, f = e.getClosestProjectingParent();
		if ((!a || f?.options.layoutRoot && e.resumeFrom?.path.includes(f)) && f && !f.resumeFrom) {
			let { snapshot: r, layout: i } = f;
			if (r && i) {
				let s = e.options.layoutAnchor || void 0, c = J();
				Po(c, a ? e.resumeFrom.applyTransform(t.layoutBox, !0, void 0, !0, f.depth + 1) : t.layoutBox, r.layoutBox, s);
				let l = J();
				Po(l, n, i.layoutBox, s), a && o(c, l), $o(c, l) || (d = !0), f.options.layoutRoot && (e.relativeTarget = l, e.relativeTargetOrigin = c, e.relativeParent = f);
			}
		}
		e.notifyListeners("didUpdate", {
			layout: n,
			snapshot: t,
			delta: l,
			layoutDelta: c,
			hasLayoutChanged: u,
			hasRelativeLayoutChanged: d
		});
	} else e.isLead() && e.options.onExitComplete?.();
	e.options.transition = void 0;
}
function bs(e) {
	co.countProjection?.(0), e.parent && (e.isProjecting() || (e.isProjectionDirty = e.parent.isProjectionDirty), e.isSharedProjectionDirty ||= !!(e.isProjectionDirty || e.parent.isProjectionDirty || e.parent.isSharedProjectionDirty), e.isTransformDirty ||= e.parent.isTransformDirty);
}
function xs(e) {
	e.isProjectionDirty = e.isSharedProjectionDirty = e.isTransformDirty = !1;
}
function Ss(e) {
	e.clearSnapshot();
}
function Cs(e) {
	e.clearMeasurements();
}
function ws(e) {
	e.isLayoutDirty = !0, e.updateLayout();
}
function Ts(e) {
	e.isLayoutDirty = !1;
}
function Es(e) {
	let { snapshot: t, dragAncestor: n } = e, r = n?.isAnimationBlocked && n.layout;
	if (!t || !r || e.resumeFrom || e.isAnimationBlocked) return;
	let i = n.dragSnapshot;
	Y((e) => G(t.layoutBox[e], r.layoutBox[e].min - i.layoutBox[e].min));
}
function Ds(e) {
	e.isAnimationBlocked && e.layout && !e.isLayoutDirty && (e.snapshot = e.dragSnapshot || e.layout, e.isLayoutDirty = !0);
}
function Os(e) {
	e.relativeTarget && e.relativeParent?.isLayoutDirty && (e.currentAnimation ? e.isLayoutDirty = !0 : (e.targetDelta = void 0, e.removeRelativeTarget()));
}
function ks(e) {
	let { visualElement: t } = e.options;
	t?.getProps().onBeforeLayoutMeasure && t.notify("BeforeLayoutMeasure"), e.resetTransform();
}
function As(e) {
	e.finishAnimation(), e.targetDelta = e.relativeTarget = e.target = void 0, e.isProjectionDirty = !0;
}
function js(e) {
	e.resolveTargetDelta();
}
function Ms(e) {
	e.calcProjection();
}
function Ns(e) {
	e.resetSkewAndRotation();
}
function Ps(e, t, n) {
	e.translate = R(t.translate, 0, n), e.scale = R(t.scale, 1, n), e.origin = t.origin, e.originPoint = t.originPoint;
}
function Fs(e, t, n, r) {
	e.min = R(t.min, n.min, r), e.max = R(t.max, n.max, r);
}
function Is(e, t, n, r) {
	Fs(e.x, t.x, n.x, r), Fs(e.y, t.y, n.y, r);
}
function Ls(e) {
	return e.animationValues?.opacityExit !== void 0;
}
var Rs = {
	duration: .45,
	ease: [
		.4,
		0,
		.1,
		1
	]
};
function zs(e, t, n) {
	e.max = q(n) + (e.min = t.min);
}
function Bs(e, t, n) {
	return e === "position" || e === "preserve-aspect" && !Oo(es(t), es(n), .2);
}
function Vs(e) {
	return e !== e.root && e.scroll?.wasRoot;
}
// node_modules/motion-dom/dist/es/events/add-dom-event.mjs
function X(e, t, n, r = { passive: !0 }) {
	return e.addEventListener(t, n, r), () => e.removeEventListener(t, n, r);
}
// node_modules/motion-dom/dist/es/projection/node/DocumentProjectionNode.mjs
var Hs = /* @__PURE__ */ _s({
	attachResizeListener: (e, t) => X(e, "resize", t),
	measureScroll: ro,
	checkIsScrollRoot: () => !0
}), Us = { current: void 0 }, Ws = /* @__PURE__ */ _s({
	measureScroll: (e) => ({
		x: e.scrollLeft,
		y: e.scrollTop
	}),
	defaultParent: () => {
		if (!Us.current) {
			let e = new Hs({});
			e.mount(window), e.setOptions({ layoutScroll: !0 }), Us.current = e;
		}
		return Us.current;
	},
	resetTransform: (e, t) => {
		e.style.transform = t === void 0 ? "none" : t;
	},
	checkIsScrollRoot: (e) => window.getComputedStyle(e).position === "fixed"
}), Gs = /* @__PURE__ */ new WeakMap();
// node_modules/motion-dom/dist/es/render/utils/is-animation-controls.mjs
function Ks(e) {
	return typeof e == "object" && !!e && typeof e.start == "function";
}
// node_modules/motion-dom/dist/es/render/utils/is-variant-label.mjs
function qs(e) {
	return typeof e == "string" || Array.isArray(e);
}
// node_modules/motion-dom/dist/es/render/utils/variant-props.mjs
var Js = [
	"animate",
	"whileInView",
	"whileFocus",
	"whileHover",
	"whileTap",
	"whileDrag",
	"exit"
], Ys = /* @__PURE__ */ ["initial"].concat(Js);
// node_modules/motion-dom/dist/es/render/utils/is-controlling-variants.mjs
function Xs(e) {
	if (Ks(e.animate)) return !0;
	for (let t = 0; t < Ys.length; t++) if (qs(e[Ys[t]])) return !0;
	return !1;
}
function Zs(e) {
	return !!(Xs(e) || e.variants);
}
// node_modules/motion-dom/dist/es/render/utils/motion-values.mjs
function Qs(e, t, n) {
	for (let r in t) {
		let i = t[r], a = n[r];
		if (W(i)) e.addValue(r, i);
		else if (W(a)) e.addValue(r, Fi(i, { owner: e }));
		else if (a !== i) {
			if (e.hasValue(r)) {
				let t = e.getValue(r);
				t.liveStyle === !0 ? t.jump(i) : t.hasAnimated || t.set(i);
			} else {
				let t = e.getStaticValue(r);
				e.addValue(r, Fi(t === void 0 ? i : t, { owner: e }));
			}
		}
	}
	for (let r in n) t[r] === void 0 && e.removeValue(r);
	return t;
}
// node_modules/motion-dom/dist/es/render/utils/reduced-motion/state.mjs
var $s = { current: null }, ec = { current: !1 }, tc = typeof window < "u";
function nc() {
	if (ec.current = !0, tc) {
		if (window.matchMedia) {
			let e = window.matchMedia("(prefers-reduced-motion)"), t = () => $s.current = e.matches;
			e.addEventListener("change", t), t();
		} else $s.current = !1;
	}
}
// node_modules/motion-dom/dist/es/render/VisualElement.mjs
var rc = [
	"AnimationStart",
	"AnimationComplete",
	"Update",
	"BeforeLayoutMeasure",
	"LayoutMeasure",
	"LayoutAnimationStart",
	"LayoutAnimationComplete"
], ic = {};
function ac(e) {
	ic = e;
}
function oc() {
	return ic;
}
var sc = class {
	scrapeMotionValuesFromProps(e, t, n) {
		return {};
	}
	constructor({ parent: e, props: t, presenceContext: n, reducedMotionConfig: r, skipAnimations: i, blockInitialAnimation: a, visualState: o }, s = {}) {
		this.current = null, this.children = /* @__PURE__ */ new Set(), this.isVariantNode = !1, this.isControllingVariants = !1, this.shouldReduceMotion = null, this.shouldSkipAnimations = !1, this.values = /* @__PURE__ */ new Map(), this.KeyframeResolver = br, this.features = {}, this.valueSubscriptions = /* @__PURE__ */ new Map(), this.prevMotionValues = {}, this.hasBeenMounted = !1, this.events = {}, this.propEventSubscriptions = {}, this.notifyUpdate = () => this.notify("Update", this.latestValues), this.render = () => {
			this.current && (this.triggerBuild(), this.renderInstance(this.current, this.renderState, this.props.style, this.projection));
		}, this.renderScheduledAt = 0, this.scheduleRender = () => {
			let e = M.now();
			this.renderScheduledAt < e && (this.renderScheduledAt = e, z.render(this.render, !1, !0));
		};
		let { latestValues: c, renderState: l } = o;
		this.latestValues = c, this.baseTarget = { ...c }, this.initialValues = t.initial ? { ...c } : {}, this.renderState = l, this.parent = e, this.props = t, this.presenceContext = n, this.depth = e ? e.depth + 1 : 0, this.reducedMotionConfig = r, this.skipAnimationsConfig = i, this.options = s, this.blockInitialAnimation = !!a, this.isControllingVariants = Xs(t), this.isVariantNode = Zs(t), this.isVariantNode && (this.variantChildren = /* @__PURE__ */ new Set()), this.manuallyAnimateOnMount = !!(e && e.current);
		let { willChange: u, ...d } = this.scrapeMotionValuesFromProps(t, {}, this);
		for (let e in d) {
			let t = d[e];
			c[e] !== void 0 && W(t) && t.set(c[e]);
		}
	}
	mount(e) {
		let t = this.presenceContext;
		if (this.hasBeenMounted && t?.isPresent !== !1 && !t?.keepValuesOnRemount) for (let e in this.initialValues) this.values.get(e)?.jump(this.initialValues[e]), this.latestValues[e] = this.initialValues[e];
		if (this.current = e, Gs.set(e, this), this.projection?.instance || this.projection?.mount(e), this.isVariantNode && !this.isControllingVariants) {
			let e = this;
			do
				e = e.props.inherit !== !1 && e.parent;
			while (e && !e.isVariantNode);
			if (e) {
				let { variantChildren: t } = e;
				t.add(this), this.removeFromVariantTree = () => t.delete(this);
			}
		}
		this.values.forEach((e, t) => this.bindToMotionValue(t, e)), this.reducedMotionConfig === "never" ? this.shouldReduceMotion = !1 : this.reducedMotionConfig === "always" ? this.shouldReduceMotion = !0 : (ec.current || nc(), this.shouldReduceMotion = $s.current), this.shouldSkipAnimations = this.skipAnimationsConfig ?? !1, this.parent?.addChild(this), this.update(this.props, this.presenceContext), this.hasBeenMounted = !0;
	}
	unmount() {
		this.projection?.unmount(), B(this.notifyUpdate), B(this.render), this.valueSubscriptions.forEach((e) => e()), this.valueSubscriptions.clear(), this.removeFromVariantTree?.(), this.parent?.removeChild(this);
		for (let e in this.events) this.events[e].clear();
		for (let e in this.features) {
			let t = this.features[e];
			t && (t.unmount(), t.isMounted = !1);
		}
		this.current = null;
	}
	addChild(e) {
		this.children.add(e), (this.enteringChildren ||= /* @__PURE__ */ new Set()).add(e);
	}
	removeChild(e) {
		this.children.delete(e), this.enteringChildren?.delete(e);
	}
	bindToMotionValue(e, t) {
		if (this.valueSubscriptions.get(e)?.(), t.accelerate && Hr.has(e) && this.current instanceof HTMLElement) {
			let { factory: n, keyframes: r, times: i, ease: a, duration: o } = t.accelerate, s = new Nr({
				element: this.current,
				name: e,
				keyframes: r,
				times: i,
				ease: a,
				duration: /* @__PURE__ */ w(o)
			}), c = n(s);
			this.valueSubscriptions.set(e, () => {
				c(), s.cancel();
			});
			return;
		}
		let n = U.has(e);
		n && this.onBindTransform && this.onBindTransform();
		let r = t.on("change", (t) => {
			this.latestValues[e] = t, this.props.onUpdate && z.preRender(this.notifyUpdate), n && (this.projection && (this.projection.isTransformDirty = !0), ni.get(this.current)?.check()), this.scheduleRender();
		}), i;
		typeof window < "u" && window.MotionCheckAppearSync && (i = window.MotionCheckAppearSync(this, e, t)), this.valueSubscriptions.set(e, () => {
			r(), i?.();
		});
	}
	sortNodePosition(e) {
		return !this.current || !e.current || !this.sortInstanceNodePosition || this.type !== e.type ? 0 : this.sortInstanceNodePosition(this.current, e.current);
	}
	updateFeatures() {
		let e = "animation";
		for (e in ic) {
			let t = ic[e];
			if (!t) continue;
			let { isEnabled: n, Feature: r } = t;
			if (!this.features[e] && r && n(this.props) && (this.features[e] = new r(this)), this.features[e]) {
				let t = this.features[e];
				t.isMounted ? t.update() : (t.mount(), t.isMounted = !0);
			}
		}
	}
	triggerBuild() {
		this.build(this.renderState, this.latestValues, this.props);
	}
	measureViewportBox() {
		return this.current ? this.measureInstanceViewportBox(this.current, this.props) : J();
	}
	getStaticValue(e) {
		return this.latestValues[e];
	}
	setStaticValue(e, t) {
		this.latestValues[e] = t;
	}
	update(e, t) {
		let { transformTemplate: n, onUpdate: r } = this.props;
		(e.transformTemplate || n) && this.scheduleRender(), (e.transformTemplate && !n || e.onUpdate && !r) && ni.get(this.current)?.demote(), this.prevProps = this.props, this.props = e, this.prevPresenceContext = this.presenceContext, this.presenceContext = t;
		for (let t = 0; t < rc.length; t++) {
			let n = rc[t];
			this.propEventSubscriptions[n]?.(), delete this.propEventSubscriptions[n];
			let r = e["on" + n];
			r && (this.propEventSubscriptions[n] = this.on(n, r));
		}
		this.prevMotionValues = Qs(this, this.scrapeMotionValuesFromProps(e, this.prevProps || {}, this), this.prevMotionValues), this.handleChildMotionValue?.();
	}
	getProps() {
		return this.props;
	}
	getVariant(e) {
		return this.props.variants?.[e];
	}
	getDefaultTransition() {
		return this.props.transition;
	}
	getTransformPagePoint() {
		return this.props.transformPagePoint;
	}
	addValue(e, t) {
		let n = this.values.get(e);
		if (t !== n) {
			n && this.removeValue(e), this.bindToMotionValue(e, t), this.values.set(e, t);
			let r = t.get();
			r !== void 0 && (this.latestValues[e] = r);
		}
	}
	removeValue(e) {
		this.values.delete(e), this.valueSubscriptions.get(e)?.(), this.valueSubscriptions.delete(e), delete this.latestValues[e], this.removeValueFromRenderState(e, this.renderState);
	}
	hasValue(e) {
		return this.values.has(e);
	}
	getValue(e, t) {
		let n = this.props.values?.[e];
		return n || (n = this.values.get(e), n === void 0 && t !== void 0 && (n = Fi(t ?? this.getDefaultValue?.(e), { owner: this }), this.addValue(e, n)), n);
	}
	readValue(e, t) {
		let n = this.latestValues[e] !== void 0 || !this.current ? this.latestValues[e] : this.getBaseTargetFromProps(this.props, e) ?? this.readValueFromInstance(this.current, e, this.options);
		return n != null && (typeof n == "string" && (g(n) || v(n)) ? n = parseFloat(n) : typeof n != "number" && !L.test(n) && L.test(t) && (n = Wn(e, t)), this.setBaseTarget(e, W(n) ? n.get() : n)), W(n) ? n.get() : n;
	}
	setBaseTarget(e, t) {
		this.baseTarget[e] = t;
	}
	on(e, t) {
		return (this.events[e] || (this.events[e] = new C())).add(t);
	}
	notify(e, ...t) {
		this.events[e]?.notify(...t);
	}
	scheduleRenderMicrotask() {
		io.render(this.render);
	}
}, cc = class extends sc {
	constructor() {
		super(...arguments), this.KeyframeResolver = ba;
	}
	sortInstanceNodePosition(e, t) {
		return e.compareDocumentPosition(t) & 2 ? 1 : -1;
	}
	getBaseTargetFromProps(e, t) {
		let n = e.style;
		return n ? n[t] : void 0;
	}
	removeValueFromRenderState(e, { vars: t, style: n }) {
		delete t[e], delete n[e];
	}
	handleChildMotionValue() {
		this.childSubscription && (this.childSubscription(), delete this.childSubscription);
		let { children: e } = this.props;
		W(e) && (this.childSubscription = e.on("change", (e) => {
			this.current && (this.current.textContent = `${e}`);
		}));
	}
};
// node_modules/motion-dom/dist/es/render/html/utils/render.mjs
function lc(e, { style: t, vars: n }, r, i) {
	let a = e.style, o;
	for (o in t) a[o] = t[o];
	for (o in i?.applyProjectionStyles(a, r), n) a.setProperty(o, n[o]);
}
// node_modules/motion-dom/dist/es/render/utils/is-forced-motion-value.mjs
function uc(e, { layout: t, layoutId: n }) {
	return U.has(e) || e.startsWith("origin") || (t || n !== void 0) && (!!so[e] || e === "opacity");
}
// node_modules/motion-dom/dist/es/render/html/utils/scrape-motion-values.mjs
function dc(e, t, n) {
	let r = e.style, i = t?.style, a = {};
	if (!r) return a;
	for (let t in r) (W(r[t]) || i && W(i[t]) || uc(t, e) || n?.getValue(t)?.liveStyle !== void 0) && (a[t] = r[t]);
	return a;
}
// node_modules/motion-dom/dist/es/render/html/HTMLVisualElement.mjs
function fc(e) {
	return window.getComputedStyle(e);
}
var pc = class extends cc {
	constructor() {
		super(...arguments), this.type = "html", this.renderInstance = lc;
	}
	mount(e) {
		super.mount(e);
	}
	readValueFromInstance(e, t) {
		if (U.has(t)) return this.projection?.isProjecting ? er(t) : nr(e, t);
		{
			let n = fc(e), r = (ye(t) ? n.getPropertyValue(t) : n[t]) || 0;
			return typeof r == "string" ? r.trim() : r;
		}
	}
	measureInstanceViewportBox(e, { transformPagePoint: t }) {
		return to(e, t);
	}
	build(e, t, n) {
		ka(e, t, n.transformTemplate);
	}
	scrapeMotionValuesFromProps(e, t, n) {
		return dc(e, t, n);
	}
}, mc = (e) => e.pointerType === "mouse" ? typeof e.button != "number" || e.button <= 0 : e.isPrimary !== !1;
// node_modules/motion-dom/dist/es/events/event-info.mjs
function hc(e) {
	return { point: {
		x: e.pageX,
		y: e.pageY
	} };
}
var gc = (e) => (t) => mc(t) && e(t, hc(t));
// node_modules/motion-dom/dist/es/events/add-pointer-event.mjs
function _c(e, t, n, r) {
	return X(e, t, gc(n), r);
}
// node_modules/motion-dom/dist/es/resize/handle-element.mjs
var vc = /* @__PURE__ */ new WeakMap(), yc, bc = (e, t, n) => (r, i) => i && i[0] ? i[0][e + "Size"] : Ca(r) && "getBBox" in r ? r.getBBox()[t] : r[n], xc = /*@__PURE__*/ bc("inline", "width", "offsetWidth"), Sc = /*@__PURE__*/ bc("block", "height", "offsetHeight");
function Cc({ target: e, borderBoxSize: t }) {
	vc.get(e)?.forEach((n) => {
		n(e, {
			get width() {
				return xc(e, t);
			},
			get height() {
				return Sc(e, t);
			}
		});
	});
}
function wc(e) {
	e.forEach(Cc);
}
function Tc() {
	typeof ResizeObserver < "u" && (yc = new ResizeObserver(wc));
}
function Ec(e, t) {
	yc || Tc();
	let n = Da(e);
	return n.forEach((e) => {
		let n = vc.get(e);
		n || (n = /* @__PURE__ */ new Set(), vc.set(e, n)), n.add(t), yc?.observe(e);
	}), () => {
		n.forEach((e) => {
			let n = vc.get(e);
			n?.delete(t), n?.size || yc?.unobserve(e);
		});
	};
}
// node_modules/motion-dom/dist/es/resize/handle-window.mjs
var Dc = /* @__PURE__ */ new Set(), Oc;
function kc() {
	Oc = () => {
		let e = {
			get width() {
				return window.innerWidth;
			},
			get height() {
				return window.innerHeight;
			}
		};
		Dc.forEach((t) => t(e));
	}, window.addEventListener("resize", Oc);
}
function Ac(e) {
	return Dc.add(e), Oc || kc(), () => {
		Dc.delete(e), !Dc.size && typeof Oc == "function" && (window.removeEventListener("resize", Oc), Oc = void 0);
	};
}
// node_modules/motion-dom/dist/es/resize/index.mjs
function jc(e, t) {
	return Ta(typeof e == "function" ? Ac(e) : Ec(e, t));
}
// node_modules/motion-dom/dist/es/utils/distance.mjs
var Mc = (e, t) => Math.abs(e - t);
function Nc(e, t) {
	let n = Mc(e.x, t.x), r = Mc(e.y, t.y);
	return Math.sqrt(n ** 2 + r ** 2);
}
// node_modules/motion-dom/dist/es/gestures/pan/PanSession.mjs
var Pc = /*#__PURE__*/ new Set(["auto", "scroll"]), Fc = class {
	constructor(e, t, { transformPagePoint: n, contextWindow: r = window, dragSnapToOrigin: i = !1, distanceThreshold: a = 3, element: o, immediate: s } = {}) {
		if (this.startEvent = null, this.lastMoveEvent = null, this.lastMoveEventInfo = null, this.lastRawMoveEventInfo = null, this.handlers = {}, this.contextWindow = window, this.scrollPositions = /* @__PURE__ */ new Map(), this.onElementScroll = (e) => {
			this.handleScroll(e.target);
		}, this.onWindowScroll = () => {
			this.handleScroll(window);
		}, this.updatePoint = () => {
			if (!(this.lastMoveEvent && this.lastMoveEventInfo)) return;
			this.hasPendingMove = !1, this.lastRawMoveEventInfo && (this.lastMoveEventInfo = Lc(this.lastRawMoveEventInfo, this.transformPagePoint));
			let e = zc(this.lastMoveEventInfo, this.history), t = this.startEvent !== null, n = Nc(e.offset, {
				x: 0,
				y: 0
			}) >= this.distanceThreshold;
			if (!t && !n) return;
			let { point: r } = e;
			this.history.push({
				...r,
				timestamp: M.now()
			});
			let { onStart: i, onMove: a } = this.handlers;
			t || (i?.(this.lastMoveEvent, e), this.startEvent = this.lastMoveEvent), a?.(this.lastMoveEvent, e);
		}, this.handlePointerMove = (e, t) => {
			this.handleScroll(window), this.lastMoveEvent = e, this.lastRawMoveEventInfo = t, this.lastMoveEventInfo = Lc(t, this.transformPagePoint), this.hasPendingMove = !0, z.update(this.updatePoint, !0);
		}, this.handlePointerUp = (e, t) => {
			this.hasPendingMove && this.updatePoint(), this.end();
			let { onEnd: n, onSessionEnd: r, resumeAnimation: i } = this.handlers;
			if ((this.dragSnapToOrigin || !this.startEvent) && i?.(), !(this.lastMoveEvent && this.lastMoveEventInfo)) return;
			let a = zc(e.type === "pointercancel" ? this.lastMoveEventInfo : Lc(t, this.transformPagePoint), this.history);
			this.startEvent && n?.(e, a), r?.(e, a);
		}, !mc(e)) return;
		this.dragSnapToOrigin = i, this.handlers = t, this.transformPagePoint = n, this.distanceThreshold = s ? 0 : a, this.contextWindow = r || window;
		let c = hc(e), l = Lc(c, this.transformPagePoint), { point: u } = l;
		this.history = [{
			...u,
			timestamp: M.now()
		}];
		let { onSessionStart: d } = t;
		d && d(e, zc(l, this.history));
		let f = {
			passive: !0,
			capture: !0
		};
		this.removeListeners = x(_c(this.contextWindow, "pointermove", this.handlePointerMove, f), _c(this.contextWindow, "pointerup", this.handlePointerUp, f), _c(this.contextWindow, "pointercancel", this.handlePointerUp, f)), o && this.startScrollTracking(o), s && (this.handlePointerMove(e, c), this.updatePoint());
	}
	startScrollTracking(e) {
		let t = e.parentElement;
		for (; t;) {
			let e = getComputedStyle(t);
			(Pc.has(e.overflowX) || Pc.has(e.overflowY)) && this.scrollPositions.set(t, Ic(t)), t = t.parentElement;
		}
		this.scrollPositions.set(window, Ic(window)), this.removeScrollListeners = x(X(window, "scroll", this.onElementScroll, { capture: !0 }), X(window, "scroll", this.onWindowScroll, {}));
	}
	handleScroll(e) {
		let t = this.scrollPositions.get(e);
		if (!t) return;
		let n = e === window, r = Ic(e), i = {
			x: r.x - t.x,
			y: r.y - t.y
		};
		(i.x !== 0 || i.y !== 0) && (n ? this.lastMoveEventInfo && (this.lastMoveEventInfo.point.x += i.x, this.lastMoveEventInfo.point.y += i.y) : this.history.length > 0 && (this.history[0].x -= i.x, this.history[0].y -= i.y), this.scrollPositions.set(e, r), z.update(this.updatePoint, !0));
	}
	updateHandlers(e) {
		this.handlers = e;
	}
	end() {
		this.removeListeners?.(), this.removeScrollListeners?.(), this.scrollPositions.clear(), B(this.updatePoint);
	}
}, Ic = (e) => e === window ? {
	x: window.scrollX,
	y: window.scrollY
} : {
	x: e.scrollLeft,
	y: e.scrollTop
};
function Lc(e, t) {
	return t ? { point: t(e.point) } : e;
}
function Rc(e, t) {
	return {
		x: e.x - t.x,
		y: e.y - t.y
	};
}
function zc({ point: e }, t) {
	return {
		point: e,
		delta: Rc(e, Vc(t)),
		offset: Rc(e, Bc(t)),
		velocity: Hc(t, .1)
	};
}
function Bc(e) {
	return e[0];
}
function Vc(e) {
	return e[e.length - 1];
}
function Hc(e, t) {
	if (e.length < 2) return {
		x: 0,
		y: 0
	};
	let n = e.length - 1, r = null, i = Vc(e);
	for (; n >= 0 && (r = e[n], !(i.timestamp - r.timestamp > /* @__PURE__ */ w(t)));) n--;
	if (!r) return {
		x: 0,
		y: 0
	};
	r === e[0] && e.length > 2 && i.timestamp - r.timestamp > /* @__PURE__ */ w(t) * 2 && (r = e[1]);
	let a = /* @__PURE__ */ T(i.timestamp - r.timestamp);
	if (a === 0) return {
		x: 0,
		y: 0
	};
	let o = {
		x: (i.x - r.x) / a,
		y: (i.y - r.y) / a
	};
	return o.x === Infinity && (o.x = 0), o.y === Infinity && (o.y = 0), o;
}
// node_modules/motion-dom/dist/es/gestures/press/utils/is-keyboard-accessible.mjs
var Uc = /* @__PURE__ */ new Set([
	"BUTTON",
	"INPUT",
	"SELECT",
	"TEXTAREA",
	"A"
]);
function Wc(e) {
	return Uc.has(e.tagName) || e.isContentEditable === !0;
}
var Gc = /* @__PURE__ */ new Set([
	"INPUT",
	"SELECT",
	"TEXTAREA"
]);
function Kc(e) {
	return Gc.has(e.tagName) || e.isContentEditable === !0;
}
// node_modules/motion-dom/dist/es/gestures/drag/state/is-active.mjs
var Z = {
	x: !1,
	y: !1
};
function qc() {
	return Z.x || Z.y;
}
// node_modules/motion-dom/dist/es/gestures/drag/state/set-active.mjs
function Jc(e) {
	return e === "x" || e === "y" ? Z[e] ? null : (Z[e] = !0, () => {
		Z[e] = !1;
	}) : Z.x || Z.y ? null : (Z.x = Z.y = !0, () => {
		Z.x = Z.y = !1;
	});
}
// node_modules/motion-dom/dist/es/gestures/drag/utils/constraints.mjs
function Yc(e, { min: t, max: n }, r) {
	return t !== void 0 && e < t ? e = r ? R(t, e, r.min) : Math.max(e, t) : n !== void 0 && e > n && (e = r ? R(n, e, r.max) : Math.min(e, n)), e;
}
function Xc(e, t, n) {
	return {
		min: t === void 0 ? void 0 : e.min + t,
		max: n === void 0 ? void 0 : e.max + n - (e.max - e.min)
	};
}
function Zc(e, { top: t, left: n, bottom: r, right: i }) {
	return {
		x: Xc(e.x, n, i),
		y: Xc(e.y, t, r)
	};
}
function Qc(e, t) {
	let n = t.min - e.min, r = t.max - e.max;
	return t.max - t.min < e.max - e.min && ([n, r] = [r, n]), {
		min: n,
		max: r
	};
}
function $c(e, t) {
	return {
		x: Qc(e.x, t.x),
		y: Qc(e.y, t.y)
	};
}
function el(e, t) {
	let n = .5, r = q(e), i = q(t);
	return i > r ? n = /* @__PURE__ */ S(t.min, t.max - r, e.min) : r > i && (n = /* @__PURE__ */ S(e.min, e.max - i, t.min)), m(0, 1, n);
}
function tl(e, t) {
	let n = {};
	return t.min !== void 0 && (n.min = t.min - e.min), t.max !== void 0 && (n.max = t.max - e.min), n;
}
var nl = .35;
function rl(e = nl) {
	return e === !1 ? e = 0 : e === !0 && (e = nl), {
		x: il(e, "left", "right"),
		y: il(e, "top", "bottom")
	};
}
function il(e, t, n) {
	return {
		min: al(e, t),
		max: al(e, n)
	};
}
function al(e, t) {
	return typeof e == "number" ? e : e[t] || 0;
}
// node_modules/motion-dom/dist/es/gestures/drag/VisualElementDragControls.mjs
function ol(e) {
	let t = "";
	for (let n of e.path) {
		n.scroll = void 0, n.updateScroll();
		let { scroll: r } = n;
		n !== e.root && r && (t += r.offset.x + "," + r.offset.y + ",");
	}
	return t;
}
var sl = /* @__PURE__ */ new WeakMap(), cl = class {
	constructor(e, t = () => e.getProps()) {
		this.openDragLock = null, this.isDragging = !1, this.currentDirection = null, this.originPoint = {
			x: 0,
			y: 0
		}, this.constraints = !1, this.hasMutatedConstraints = !1, this.elastic = J(), this.latestPointerEvent = null, this.latestPanInfo = null, this.visualElement = e, this.readProps = t;
	}
	start(e, t = {}) {
		if (this.visualElement.presenceContext?.isPresent === !1) return;
		let n = (e) => {
			t.snapToCursor && this.snapToCursor(e), this.stopAnimation();
		}, r = (e, t) => {
			let { drag: n, dragConstraints: r, dragPropagation: i, onDragStart: a } = this.getProps();
			if (n && !i && (this.openDragLock?.(), this.openDragLock = Jc(n), !this.openDragLock)) return;
			this.latestPointerEvent = e, this.latestPanInfo = t, this.isDragging = !0, this.currentDirection = null, this.resolveConstraints();
			let { projection: o } = this.visualElement;
			o && (o.isAnimationBlocked = !0, o.target = void 0), Y((e) => {
				let t = this.getAxisMotionValue(e).get() || 0;
				if (xe(t) && (t = Ji(t, this.visualElement.current) || 0), F.test(t)) t = parseFloat(t);
				else if (P.test(t)) {
					let n = o?.layout?.layoutBox[e];
					n && (t = q(n) * (parseFloat(t) / 100));
				}
				this.originPoint[e] = t;
			}), this.point = typeof r == "function" && r(this), a && z.update(() => a(e, t), !1, !0), aa(this.visualElement, "transform"), this.visualElement.animationState?.setActive("whileDrag", !0);
		}, i = (e, t) => {
			this.latestPointerEvent = e, this.latestPanInfo = t;
			let { dragPropagation: n, dragDirectionLock: r, onDirectionLock: i, onDrag: a } = this.getProps();
			if (!n && !this.openDragLock) return;
			let { offset: o } = t;
			if (r && this.currentDirection === null) {
				if (this.currentDirection = ml(o), this.currentDirection === null) return;
				i && i(this.currentDirection);
			}
			this.updateAxis("x", o), this.updateAxis("y", o), this.point && this.point.move(), this.visualElement.render(), a && z.update(() => a(e, t), !1, !0);
		}, a = (e, t) => {
			this.latestPointerEvent = e, this.latestPanInfo = t, this.stop(e, t), this.latestPointerEvent = null, this.latestPanInfo = null;
		}, o = () => {
			let { dragSnapToOrigin: e } = this.getProps();
			(e || this.constraints || this.point) && this.startAnimation({
				x: 0,
				y: 0
			});
		}, { dragSnapToOrigin: s } = this.getProps();
		this.panSession = new Fc(e, {
			onSessionStart: n,
			onStart: r,
			onMove: i,
			onSessionEnd: a,
			resumeAnimation: o
		}, {
			...t,
			transformPagePoint: this.visualElement.getTransformPagePoint(),
			dragSnapToOrigin: s,
			contextWindow: this.visualElement.current?.ownerDocument.defaultView,
			element: this.visualElement.current
		});
	}
	stop(e, t, n) {
		let r = e || this.latestPointerEvent, i = t || this.latestPanInfo, a = this.isDragging;
		if (this.cancel(), !a || !i || !r) return;
		let { velocity: o } = i;
		this.startAnimation(o, n);
		let { onDragEnd: s } = this.getProps();
		s && z.postRender(() => s(r, i));
	}
	cancel() {
		this.isDragging = !1;
		let { projection: e, animationState: t } = this.visualElement;
		e && (e.isAnimationBlocked = !1), this.endPanSession(), !this.getProps().dragPropagation && this.openDragLock && (this.openDragLock(), this.openDragLock = null), t?.setActive("whileDrag", !1);
	}
	endPanSession() {
		this.panSession?.end(), this.panSession = void 0;
	}
	updateAxis(e, t) {
		let { drag: n } = this.readProps();
		if (!t || !pl(e, n, this.currentDirection)) return;
		let r = this.getAxisMotionValue(e), i = this.originPoint[e] + t[e], a = this.constraints && this.constraints[e];
		a && (i = Yc(i, a, this.elastic[e])), this.point ? this.point[e] = i : r.set(i);
	}
	resolveConstraints() {
		let { dragConstraints: e, dragElastic: t } = this.getProps(), { projection: n } = this.visualElement, r = n && (n.layout || n.measure(!1)), i = this.constraints;
		ll(e) ? this.constraints && this.scroll === ol(n) || (this.constraints = this.resolveRefConstraints()) : this.constraints = e && r && typeof e == "object" ? Zc(r.layoutBox, e) : !1, this.elastic = rl(t), i !== this.constraints && !ll(e) && r && this.constraints && !this.hasMutatedConstraints && Y((e) => {
			this.constraints !== !1 && this.getAxisMotionValue(e) && (this.constraints[e] = tl(r.layoutBox[e], this.constraints[e]));
		});
	}
	resolveRefConstraints() {
		let { dragConstraints: e, onMeasureDragConstraints: t } = this.getProps();
		if (!ll(e)) return !1;
		let n = ul(e), { projection: r } = this.visualElement;
		if (!r || !r.layout) return !1;
		this.scroll = ol(r);
		let i = no(n, r.root, this.visualElement.getTransformPagePoint()), a = $c(r.layout.layoutBox, r.removeElementScroll(i));
		if (t) {
			let e = t(Ia(a));
			this.hasMutatedConstraints = !!e, e && (a = Fa(e));
		}
		return a;
	}
	startAnimation(e, t) {
		let { drag: n, dragMomentum: r, dragElastic: i, dragTransition: a, dragSnapToOrigin: o, onDragTransitionEnd: s } = this.getProps(), c = {
			bounceStiffness: i ? 200 : 1e6,
			bounceDamping: i ? 40 : 1e7,
			timeConstant: 750,
			restDelta: 1,
			restSpeed: 10,
			...a
		}, l = (i) => r && !(this.point && o) && pl(i, t || n, this.currentDirection) ? e[i] : 0;
		if (this.point && !o) return this.point.release({
			x: l("x"),
			y: l("y")
		}, c).then(s);
		let u = this.constraints || {}, d = Y((e) => {
			if (!pl(e, t || n, this.currentDirection)) return;
			let r = u[e] || {};
			(o === !0 || o === e) && (r = {
				min: 0,
				max: 0
			});
			let i = {
				type: "inertia",
				velocity: l(e),
				...c,
				...r
			};
			return this.startAxisValueAnimation(e, i);
		});
		return Promise.all(d).then(s);
	}
	startAxisValueAnimation(e, t) {
		let n = this.getAxisMotionValue(e);
		return aa(this.visualElement, e), n.start(Gi(e, n, 0, t, this.visualElement, !1));
	}
	stopAnimation() {
		Y((e) => this.getAxisMotionValue(e).stop());
	}
	getAxisMotionValue(e) {
		let t = `_drag${e.toUpperCase()}`;
		return this.readProps()[t] || this.visualElement.getValue(e, this.visualElement.latestValues[e] ?? 0);
	}
	snapToCursor({ clientX: e, clientY: t }) {
		let { drag: n } = this.getProps(), r = {
			x: e,
			y: t
		}, i = this.visualElement.getTransformPagePoint()?.(r) || r, a = this.visualElement.measureViewportBox();
		Y((e) => {
			if (!pl(e, n, this.currentDirection)) return;
			let t = this.getAxisMotionValue(e), { min: r, max: o } = a[e];
			t.set((t.get() || 0) + i[e] - R(r, o, .5));
		});
	}
	scalePositionWithinConstraints() {
		if (!this.visualElement.current) return;
		let { drag: e, dragConstraints: t } = this.getProps(), { projection: n } = this.visualElement;
		if (!ll(t) || !n || !this.constraints) return;
		this.stopAnimation();
		let r = this.constraints, i = {
			x: 0,
			y: 0
		};
		Y((e) => {
			let t = this.getAxisMotionValue(e).get();
			i[e] = el({
				min: t,
				max: t
			}, r[e]);
		});
		let { transformTemplate: a } = this.visualElement.getProps();
		this.visualElement.current.style.transform = a ? a({}, "") : "none", n.root?.updateScroll(), n.updateLayout(), this.constraints = !1, this.resolveConstraints(), Y((t) => {
			let n = this.getAxisMotionValue(t);
			if (!pl(t, e, null) || !n.get()) return;
			let { min: r, max: a } = this.constraints[t];
			n.set(R(r, a, i[t]));
		}), this.visualElement.render();
	}
	addListeners() {
		if (!this.visualElement.current) return;
		sl.set(this.visualElement, this);
		let e = this.visualElement.current, t = _c(e, "pointerdown", (t) => {
			let { drag: n, dragListener: r = !0 } = this.getProps(), i = t.target, a = i !== e && Kc(i);
			n && r && !a && this.start(t);
		}), n, r = () => {
			let { dragConstraints: t } = this.getProps(), r = ll(t) && ul(t);
			r && (this.constraints = this.resolveRefConstraints(), n ||= fl(e, r, () => this.scalePositionWithinConstraints()));
		}, { projection: i } = this.visualElement, a = i.addEventListener("measure", r);
		i.layout || (i.root?.updateScroll(), i.updateLayout()), z.read(r);
		let o = X(window, "resize", () => this.scalePositionWithinConstraints()), s = i.addEventListener("didUpdate", (({ delta: e, hasLayoutChanged: t }) => {
			this.isDragging && t && (Y((t) => {
				if (!pl(t, this.getProps().drag, this.currentDirection)) return;
				let n = this.getAxisMotionValue(t);
				this.originPoint[t] += e[t].translate, n.set(n.get() + e[t].translate);
			}), this.visualElement.render());
		}));
		return () => {
			o(), t(), a(), s(), n?.();
		};
	}
	getProps() {
		let e = this.readProps(), { dragElastic: t = nl, dragMomentum: n = !0 } = e;
		return {
			...e,
			dragElastic: t,
			dragMomentum: n
		};
	}
};
function ll(e) {
	return !!e && typeof e == "object" && ("current" in e || "nodeType" in e);
}
var ul = (e) => "current" in e ? e.current : e;
function dl(e) {
	let t = !0;
	return () => {
		t ? t = !1 : e();
	};
}
function fl(e, t, n) {
	let r = jc(e, dl(n)), i = jc(t, dl(n));
	return () => {
		r(), i();
	};
}
function pl(e, t, n) {
	return (t === !0 || t === e) && (n === null || n === e);
}
function ml(e, t = 10) {
	let n = null;
	return Math.abs(e.y) > t ? n = "y" : Math.abs(e.x) > t && (n = "x"), n;
}
// node_modules/motion-dom/dist/es/gestures/utils/setup.mjs
function hl(e, t) {
	let n = Da(e), r = new AbortController();
	return [
		n,
		{
			passive: !0,
			...t,
			signal: r.signal
		},
		Ta(() => r.abort())
	];
}
// node_modules/motion-dom/dist/es/gestures/hover.mjs
function gl(e) {
	return !(e.pointerType === "touch" || qc());
}
function _l(e, t, n = {}) {
	t = Ea(t);
	let [r, i, a] = hl(e, n);
	return r.forEach((e) => {
		let n = !1, r = !1, a, o = () => {
			e.removeEventListener("pointerleave", u);
		}, s = (e) => {
			a &&= (a(e), void 0), o();
		}, c = (e) => {
			n = !1, window.removeEventListener("pointerup", c), window.removeEventListener("pointercancel", c), r && (r = !1, s(e));
		}, l = () => {
			n = !0, window.addEventListener("pointerup", c, i), window.addEventListener("pointercancel", c, i);
		}, u = (e) => {
			e.pointerType !== "touch" && (n ? r = !0 : s(e));
		};
		e.addEventListener("pointerenter", (n) => {
			if (!gl(n)) return;
			r = !1;
			let o = t(e, n);
			typeof o == "function" && (a = o, e.addEventListener("pointerleave", u, i));
		}, i), e.addEventListener("pointerdown", l, i);
	}), a;
}
// node_modules/motion-dom/dist/es/gestures/utils/is-node-or-child.mjs
var vl = (e, t) => t ? e === t || vl(e, t.parentElement) : !1, yl = /* @__PURE__ */ new WeakSet();
// node_modules/motion-dom/dist/es/gestures/press/utils/keyboard.mjs
function bl(e) {
	return (t) => {
		t.key === "Enter" && e(t);
	};
}
function xl(e, t) {
	e.dispatchEvent(new PointerEvent("pointer" + t, {
		isPrimary: !0,
		bubbles: !0
	}));
}
var Sl = (e, t) => {
	let n = !1, r = bl(() => {
		n || yl.has(e) || (n = !0, xl(e, "down"));
	}), i = bl(() => {
		n && (n = !1, xl(e, "up"));
	});
	e.addEventListener("keydown", r, t), e.addEventListener("keyup", i, t), e.addEventListener("blur", () => {
		e.removeEventListener("keydown", r), e.removeEventListener("keyup", i), n && xl(e, "cancel");
	}, {
		...t,
		once: !0
	});
};
// node_modules/motion-dom/dist/es/gestures/press/index.mjs
function Cl(e) {
	return mc(e) && !qc();
}
var wl = /* @__PURE__ */ new WeakSet(), Tl = 100, El = 8, Dl = (e, t, n) => Math.hypot(e.clientX - t.clientX, e.clientY - t.clientY) > n, Ol = (e) => e.preventDefault();
function kl(e, t, n = {}) {
	t = Ea(t);
	let [r, i, a] = hl(e, n), o = /* @__PURE__ */ new WeakMap(), s = (e) => {
		let r = e.currentTarget;
		if (!Cl(e) || wl.has(e)) return;
		n.stopPropagation && wl.add(e);
		let { count: a = 1, countTimeout: s = .3, hold: c = 0, repeat: l } = n, u = M.now(), d = /* @__PURE__ */ w(c), f = /* @__PURE__ */ w(s), p = o.get(r);
		p?.expire(Dl(p.event, e, Tl)) ? p = void 0 : p && (B(p.expire), o.delete(r));
		let m = p ? p.count + 1 : 1, h = m >= a, g = h && (c || l), _ = !c, v = 0, y;
		if (yl.add(r), p) y = p.handlers;
		else {
			let n = t(r, e);
			y = typeof n == "function" ? { onComplete: n } : n || {};
		}
		h && _ && y.onActive?.();
		let b = /* @__PURE__ */ w(l), x = d || b, S = u + x, C = !0, T = () => {
			if (i.signal.aborted) return B(T);
			let e = Math.min(1 - (S - M.now()) / x, 1);
			C && e < 1 && (e = 0), C = !1, y.onHold?.(e), e < 1 || (_ ? y.onRepeat?.(++v) : (_ = !0, y.onActive?.()), l ? (C = !0, S += x = b) : B(T));
		}, E = {
			...i,
			capture: !0
		}, D = (t, n) => {
			if (window.removeEventListener("pointerup", O, E), window.removeEventListener("pointercancel", ee, E), window.removeEventListener("pointermove", k, E), r.removeEventListener("contextmenu", Ol), B(T), yl.delete(r), mc(t)) {
				if (qc() && (n = !1), n && !h) {
					let n = M.now(), a = (e) => {
						let s = i.signal.aborted;
						if (s || e === !0 || M.now() - n > f) return B(a), o.delete(r), s || y.onComplete?.(t, { success: !1 }), !0;
					};
					o.set(r, {
						count: m,
						event: e,
						handlers: y,
						expire: a
					}), z.update(a, !0);
				} else y.onComplete?.(t, { success: n && _ });
			}
		}, O = (e) => {
			D(e, r === window || r === document || n.useGlobalTarget || vl(r, e.target));
		}, ee = (e) => {
			D(e, !1);
		}, k = (t) => {
			mc(t) && ((l || !_) && Dl(e, t, El) || a > 1 && qc()) && ee(t);
		};
		window.addEventListener("pointerup", O, E), window.addEventListener("pointercancel", ee, E), (g || a > 1) && window.addEventListener("pointermove", k, E), g && (z.update(T, !0), r.addEventListener("contextmenu", Ol, {
			...i,
			passive: !1
		}));
	};
	return r.forEach((e) => {
		(n.useGlobalTarget ? window : e).addEventListener("pointerdown", s, i), Sa(e) && (e.addEventListener("focus", () => Sl(e, i), i), !Wc(e) && !e.hasAttribute("tabindex") && (e.tabIndex = 0));
	}), a;
}
// node_modules/motion-dom/dist/es/render/Feature.mjs
var Q = class {
	constructor(e) {
		this.isMounted = !1, this.node = e;
	}
	update() {}
}, Al = /* @__PURE__ */ new Set([
	"baseFrequency",
	"diffuseConstant",
	"kernelMatrix",
	"kernelUnitLength",
	"keySplines",
	"keyTimes",
	"limitingConeAngle",
	"markerHeight",
	"markerWidth",
	"numOctaves",
	"targetX",
	"targetY",
	"surfaceScale",
	"specularConstant",
	"specularExponent",
	"stdDeviation",
	"tableValues",
	"viewBox",
	"gradientTransform",
	"pathLength",
	"startOffset",
	"textLength",
	"lengthAdjust"
]), jl = (e) => typeof e == "string" && e.toLowerCase() === "svg";
// node_modules/motion-dom/dist/es/render/svg/utils/render.mjs
function Ml(e, t, n, r) {
	lc(e, t, void 0, r);
	for (let n in t.attrs) e.setAttribute(Al.has(n) ? n : Oa(n), t.attrs[n]);
}
// node_modules/motion-dom/dist/es/render/svg/utils/scrape-motion-values.mjs
function Nl(e, t, n) {
	let r = dc(e, t, n);
	for (let n in e) if (n !== "children" && (W(e[n]) || W(t[n]))) {
		let t = H.indexOf(n) === -1 ? n : "attr" + n.charAt(0).toUpperCase() + n.substring(1);
		r[t] = e[n];
	}
	return r;
}
// node_modules/motion-dom/dist/es/render/svg/SVGVisualElement.mjs
var Pl = class extends cc {
	constructor() {
		super(...arguments), this.type = "svg", this.isSVGTag = !1, this.measureInstanceViewportBox = J;
	}
	getBaseTargetFromProps(e, t) {
		return U.has(t) ? super.getBaseTargetFromProps(e, t) ?? er(t) : e[t];
	}
	getDefaultValue(e) {
		return U.has(e) ? this.latestValues[e] ?? er(e) : void 0;
	}
	readValueFromInstance(e, t) {
		if (U.has(t)) {
			let e = zn(t);
			return e && e.default || 0;
		}
		if (Na.includes(t)) {
			let n = getComputedStyle(e)[t];
			if (typeof n == "string" && n) return n.trim();
		}
		return t = Al.has(t) ? t : Oa(t), e.getAttribute(t);
	}
	scrapeMotionValuesFromProps(e, t, n) {
		return Nl(e, t, n);
	}
	build(e, t, n) {
		Pa(e, t, this.isSVGTag, n.transformTemplate, n.style);
	}
	renderInstance(e, t, n, r) {
		Ml(e, t, n, r);
	}
	mount(e) {
		this.isSVGTag = jl(e.tagName), super.mount(e);
	}
};
// node_modules/motion-dom/dist/es/render/utils/shallow-compare.mjs
function Fl(e, t) {
	if (!Array.isArray(t)) return !1;
	let n = t.length;
	if (n !== e.length) return !1;
	for (let r = 0; r < n; r++) if (t[r] !== e[r]) return !1;
	return !0;
}
// node_modules/motion-dom/dist/es/render/utils/animation-state.mjs
var Il = [...Js].reverse(), Ll = (e) => e?.out === !0 ? e : e?.out;
function Rl(e) {
	let t = (t) => Promise.all(t.map(({ animation: t, options: n }) => fa(e, t, n))), n = Bl(), r = !0, i = !1;
	function a(a) {
		let { props: o, parent: s, manuallyAnimateOnMount: c } = e, { initial: l } = o, u = r || i, d = [], f = (t = l) => typeof t != "boolean" && Zi(e, Array.isArray(t) ? t[0] : t, e.presenceContext?.custom) || void 0, p = /* @__PURE__ */ new Map(), m = {}, h = Infinity, g = e;
		do
			g = g.props.inherit !== !1 && g.parent;
		while (g && !g.isControllingVariants);
		let _ = u && Ll(f(l ?? (g && g.props.initial))?.transition);
		if (Il.forEach((t, r) => {
			let i = n[t], l = o[t], f = g && g.props[t], v = l === void 0 ? qs(f) || f === !1 ? f : void 0 : l, y = qs(v), b = t === a ? i.isActive : null, x = y && l === void 0 && !(u && c);
			if (i.protectedKeys = { ...m }, !i.isActive && b === null || !v && !i.prevProp || Ks(v) || typeof v == "boolean") return;
			if (b === !1 && (h = r), t === "exit" && i.isActive && b !== !0) {
				m = {
					...m,
					...i.prevResolvedValues
				};
				return;
			}
			let S = zl(i.prevProp, v), C = S || y && (b && !x || r > h), w = !1, T = Array.isArray(v) ? v : [v], E = {}, D;
			if (b !== !1) for (let n of T) {
				let { transition: r, transitionEnd: i, ...a } = Zi(e, n, Qi(e, t)) || {};
				E = {
					...E,
					...a,
					...i
				}, D = Ll(r) || D;
			}
			let { prevResolvedValues: O } = i;
			for (let t in {
				...O,
				...E
			}) {
				if (t in m) continue;
				let n = E[t], r = O[t], a = Array.isArray(n) && Array.isArray(r) ? !Fl(n, r) || S : n !== r, o;
				if (a && n == null) p.has(t) || p.set(t, i.prevOut);
				else if (a || n !== void 0 && p.has(t)) {
					C = !0, o = p.get(t) || _, p.delete(t) && (w = !0), i.needsAnimating[t] = !0;
					let n = e.getValue(t);
					n && (n.liveStyle = !1);
				} else i.protectedKeys[t] = !0;
				i.out[t] = o;
			}
			if (i.prevProp = v, i.prevResolvedValues = E, i.prevOut = D, i.isActive && (m = {
				...m,
				...E
			}), C && (!(x && S) || w)) for (let n of T) {
				let r = { type: t };
				if (typeof n == "string" && u && c && s?.enteringChildren) {
					let t = Zi(s, n)?.transition?.delayChildren;
					r.delay = Ai(s.enteringChildren, e, t);
				}
				d.push({
					animation: n,
					options: r
				});
			}
		}), p.size) {
			let t = {}, n = f(), r = n?.transition;
			p.forEach((i, a) => {
				i && (r = {
					...r || e.getDefaultTransition(),
					[a]: i
				});
				let s = e.getValue(a);
				s && (s.liveStyle = !0);
				let c = n && !Array.isArray(l) ? n[a] : void 0, u = e.getBaseTargetFromProps(o, a);
				t[a] = (c === void 0 ? u !== void 0 && !W(u) ? u : e.initialValues[a] === void 0 ? e.baseTarget[a] : void 0 : c) ?? null;
			}), r && (t.transition = r), d.push({ animation: t });
		}
		let v = u && e.blockInitialAnimation || r && !c && (o.initial === !1 || o.initial === o.animate);
		return r = i = !1, !v && d.length ? t(d) : Promise.resolve();
	}
	function o(t, r) {
		if (n[t].isActive === r) return Promise.resolve();
		e.variantChildren?.forEach((e) => e.animationState?.setActive(t, r)), n[t].isActive = r;
		let i = a(t);
		for (let e in n) n[e].protectedKeys = {};
		return i;
	}
	return {
		animateChanges: a,
		setActive: o,
		setAnimateFunction: (n) => {
			t = n(e);
		},
		getState: () => n,
		reset: () => {
			n = Bl(), i = !0;
		}
	};
}
function zl(e, t) {
	return typeof t == "string" ? t !== e : Array.isArray(t) ? !Fl(t, e) : !1;
}
function Bl() {
	let e = {};
	for (let t of Js) e[t] = {
		isActive: t === "animate",
		protectedKeys: {},
		needsAnimating: {},
		prevResolvedValues: {},
		out: {}
	};
	return e;
}
// node_modules/framer-motion/dist/es/context/MotionConfigContext.mjs
var Vl = /* @__PURE__ */ (0, s.createContext)({
	transformPagePoint: (e) => e,
	isStatic: !1,
	reducedMotion: "never"
});
// node_modules/framer-motion/dist/es/components/AnimatePresence/use-presence.mjs
function Hl(e = !0) {
	let t = (0, s.useContext)(d);
	if (t === null) return [!0, null];
	let { isPresent: n, onExitComplete: r, register: i } = t, a = (0, s.useId)();
	(0, s.useEffect)(() => {
		if (e) return i(a);
	}, [e]);
	let o = (0, s.useCallback)(() => e && r && r(a), [
		a,
		r,
		e
	]);
	return !n && r ? [!1, o] : [!0];
}
// node_modules/framer-motion/dist/es/context/LazyContext.mjs
var Ul = /* @__PURE__ */ (0, s.createContext)({ strict: !1 }), Wl = {
	animation: ["variants", ...Js],
	exit: ["exit"],
	drag: ["drag", "dragControls"],
	focus: ["whileFocus"],
	hover: [
		"whileHover",
		"onHoverStart",
		"onHoverEnd"
	],
	tap: [
		"whileTap",
		"onTap",
		"onTapStart",
		"onTapCancel"
	],
	pan: [
		"onPan",
		"onPanStart",
		"onPanSessionStart",
		"onPanEnd"
	],
	inView: [
		"whileInView",
		"onViewportEnter",
		"onViewportLeave"
	],
	layout: ["layout", "layoutId"]
}, Gl = !1;
function Kl() {
	if (Gl) return;
	let e = {};
	for (let t in Wl) e[t] = { isEnabled: (e) => Wl[t].some((t) => !!e[t]) };
	ac(e), Gl = !0;
}
function ql() {
	return Kl(), oc();
}
// node_modules/framer-motion/dist/es/motion/features/load-features.mjs
function Jl(e) {
	let t = ql();
	for (let n in e) t[n] = {
		...t[n],
		...e[n]
	};
	ac(t);
}
// node_modules/framer-motion/dist/es/context/MotionContext/index.mjs
var Yl = /* @__PURE__ */ (0, s.createContext)({});
// node_modules/framer-motion/dist/es/context/MotionContext/utils.mjs
function Xl(e, t) {
	if (Xs(e)) {
		let { initial: t, animate: n } = e;
		return {
			initial: t === !1 || qs(t) ? t : void 0,
			animate: qs(n) ? n : void 0
		};
	}
	return e.inherit === !1 ? {} : t;
}
// node_modules/framer-motion/dist/es/context/MotionContext/create.mjs
function Zl(e) {
	let { initial: t, animate: n } = Xl(e, (0, s.useContext)(Yl));
	return (0, s.useMemo)(() => ({
		initial: t,
		animate: n
	}), [Ql(t), Ql(n)]);
}
function Ql(e) {
	return Array.isArray(e) ? e.join(" ") : e;
}
// node_modules/framer-motion/dist/es/render/html/utils/create-render-state.mjs
var $l = () => ({
	style: {},
	transform: {},
	transformOrigin: {},
	vars: {}
});
// node_modules/framer-motion/dist/es/render/html/use-props.mjs
function eu(e, t, n) {
	for (let r in t) !W(t[r]) && !uc(r, n) && (e[r] = t[r]);
}
function tu({ transformTemplate: e }, t) {
	return (0, s.useMemo)(() => {
		let n = $l();
		return ka(n, t, e), Object.assign({}, n.vars, n.style);
	}, [t]);
}
function nu(e, t) {
	let n = e.style || {}, r = {};
	return eu(r, n, e), Object.assign(r, tu(e, t)), r;
}
function ru(e, t) {
	let n = {}, r = nu(e, t);
	return e.drag && e.dragListener !== !1 && (n.draggable = !1, r.userSelect = r.WebkitUserSelect = r.WebkitTouchCallout = "none", r.touchAction = e.drag === !0 ? "none" : `pan-${e.drag === "x" ? "y" : "x"}`), e.tabIndex === void 0 && (e.onTap || e.onTapStart || e.whileTap) && (n.tabIndex = 0), n.style = r, n;
}
// node_modules/framer-motion/dist/es/render/svg/utils/create-render-state.mjs
var iu = () => ({
	...$l(),
	attrs: {}
});
// node_modules/framer-motion/dist/es/render/svg/use-props.mjs
function au(e, t, n, r) {
	let i = (0, s.useMemo)(() => {
		let n = iu();
		return Pa(n, t, jl(r), e.transformTemplate, e.style), {
			...n.attrs,
			style: { ...n.style }
		};
	}, [t]);
	if (e.style) {
		let t = {};
		return eu(t, e.style, e), {
			...i,
			style: {
				...t,
				...i.style
			}
		};
	}
	return i;
}
// node_modules/framer-motion/dist/es/motion/utils/valid-prop.mjs
var ou = /* @__PURE__ */ new Set(/* @__PURE__ */ "animate.exit.variants.initial.style.values.transition.transformTemplate.custom.inherit.onBeforeLayoutMeasure.onAnimationStart.onAnimationComplete.onUpdate.onDragStart.onDrag.onDragEnd.onMeasureDragConstraints.onDirectionLock.onDragTransitionEnd._dragX._dragY.onHoverStart.onHoverEnd.onViewportEnter.onViewportLeave.globalTapTarget.tap.propagate.ignoreStrict.viewport".split("."));
function su(e) {
	return e.startsWith("while") || e.startsWith("drag") && e !== "draggable" || e.startsWith("layout") || e.startsWith("onTap") || e.startsWith("onPan") || e.startsWith("onLayout") || ou.has(e);
}
// node_modules/framer-motion/dist/es/render/dom/utils/filter-props.mjs
function cu(e, t) {
	return e.startsWith("on") ? !su(e) : t?.(e) ?? !su(e);
}
function lu(e, t, n, r) {
	let i = {};
	for (let a in e) a === "values" && typeof e.values == "object" || W(e[a]) || (cu(a, r) || n === !0 && su(a) || !t && !su(a) || e.draggable && a.startsWith("onDrag")) && (i[a] = e[a]);
	return i;
}
// node_modules/framer-motion/dist/es/render/svg/lowercase-elements.mjs
var uu = [
	"animate",
	"circle",
	"defs",
	"desc",
	"ellipse",
	"g",
	"image",
	"line",
	"filter",
	"marker",
	"mask",
	"metadata",
	"path",
	"pattern",
	"polygon",
	"polyline",
	"rect",
	"stop",
	"switch",
	"symbol",
	"svg",
	"text",
	"tspan",
	"use",
	"view"
];
// node_modules/framer-motion/dist/es/render/dom/utils/is-svg-component.mjs
function du(e) {
	return typeof e != "string" || e.includes("-") ? !1 : !!(uu.indexOf(e) > -1 || /[A-Z]/u.test(e));
}
// node_modules/framer-motion/dist/es/render/dom/use-render.mjs
function fu(e, t, n, { latestValues: r }, i, a = !1, o, c) {
	let l = (o ?? du(e) ? au : ru)(t, r, i, e), u = lu(t, typeof e == "string", a, c), d = e === s.Fragment ? {} : {
		...u,
		...l,
		ref: n
	}, { children: f } = t, p = (0, s.useMemo)(() => W(f) ? f.get() : f, [f]);
	return (0, s.createElement)(e, {
		...d,
		children: p
	});
}
// node_modules/framer-motion/dist/es/motion/utils/use-visual-state.mjs
function pu({ scrapeMotionValuesFromProps: e, createRenderState: t }, n, r, i) {
	return {
		latestValues: mu(n, r, i, e),
		renderState: t()
	};
}
function mu(e, t, n, r) {
	let i = {}, a = r(e, {});
	for (let e in a) i[e] = po(a[e]);
	let { initial: o, animate: s } = e, c = Xs(e), l = Zs(e);
	t && l && !c && e.inherit !== !1 && (o === void 0 && (o = t.initial), s === void 0 && (s = t.animate));
	let u = n ? n.initial === !1 : !1;
	u ||= o === !1;
	let d = u ? s : o;
	if (d && typeof d != "boolean" && !Ks(d)) {
		let t = Array.isArray(d) ? d : [d];
		for (let n = 0; n < t.length; n++) {
			let r = Xi(e, t[n]);
			if (r) {
				let { transitionEnd: e, transition: t, ...n } = r;
				for (let e in n) {
					let t = n[e];
					if (Array.isArray(t)) {
						let e = u ? t.length - 1 : 0;
						t = t[e];
					}
					t !== null && (i[e] = t);
				}
				for (let t in e) i[t] = e[t];
			}
		}
	}
	return i;
}
var hu = (e) => (t, n) => {
	let r = (0, s.useContext)(Yl), i = (0, s.useContext)(d), a = () => pu(e, t, r, i);
	return n ? a() : l(a);
}, gu = /*@__PURE__*/ hu({
	scrapeMotionValuesFromProps: dc,
	createRenderState: $l
}), _u = /*@__PURE__*/ hu({
	scrapeMotionValuesFromProps: Nl,
	createRenderState: iu
}), vu = /* @__PURE__ */ Symbol.for("motionComponentSymbol");
// node_modules/framer-motion/dist/es/motion/utils/use-motion-ref.mjs
function yu(e, t, n) {
	let r = (0, s.useRef)(n);
	(0, s.useInsertionEffect)(() => {
		r.current = n;
	});
	let i = (0, s.useRef)(null);
	return (0, s.useCallback)((n) => {
		n && e.onMount?.(n), t && (n ? t.mount(n) : t.unmount());
		let a = r.current;
		if (typeof a == "function") {
			if (n) {
				let e = a(n);
				typeof e == "function" && (i.current = e);
			} else i.current ? (i.current(), i.current = null) : a(n);
		} else a && (a.current = n);
	}, [t]);
}
// node_modules/framer-motion/dist/es/context/SwitchLayoutGroupContext.mjs
var bu = /* @__PURE__ */ (0, s.createContext)({});
// node_modules/framer-motion/dist/es/motion/utils/use-visual-element.mjs
function xu(e, t, n, r, i, a) {
	let { visualElement: o } = (0, s.useContext)(Yl), c = (0, s.useContext)(Ul), l = (0, s.useContext)(d), f = (0, s.useContext)(Vl), p = f.reducedMotion, m = f.skipAnimations, h = (0, s.useRef)(null), g = (0, s.useRef)(!1);
	r ||= c.renderer, !h.current && r && (h.current = r(e, {
		visualState: t,
		parent: o,
		props: n,
		presenceContext: l,
		blockInitialAnimation: l ? l.initial === !1 : !1,
		reducedMotionConfig: p,
		skipAnimations: m,
		isSVG: a
	}), g.current && h.current && (h.current.manuallyAnimateOnMount = !0));
	let _ = h.current, v = (0, s.useContext)(bu);
	_ && !_.projection && i && (_.type === "html" || _.type === "svg") && i.create(_, n, v), (0, s.useInsertionEffect)(() => {
		_ && _.props !== n && _.update(n, l);
	});
	let y = n[oa], b = (0, s.useRef)(!!y && typeof window < "u" && !window.MotionHandoffIsComplete?.(y) && window.MotionHasOptimisedAnimation?.(y));
	return u(() => {
		g.current && _ && (_.animationState?.animateChanges(), _.enteringChildren = void 0);
	}, []), u(() => {
		g.current = !0, _ && (window.MotionIsMounted = !0, _.updateFeatures(), _.scheduleRenderMicrotask(), b.current && _.animationState && _.animationState.animateChanges());
	}), (0, s.useEffect)(() => {
		_ && (!b.current && _.animationState && _.animationState.animateChanges(), b.current &&= (queueMicrotask(() => {
			window.MotionHandoffMarkAsComplete?.(y);
		}), !1), _.enteringChildren = void 0);
	}), _;
}
// node_modules/framer-motion/dist/es/motion/index.mjs
var $ = n();
function Su(e, { forwardMotionProps: t = !1, type: n } = {}, r, i) {
	r && Jl(r);
	let a = n ? n === "svg" : du(e), o = a ? _u : gu;
	function c(n, c) {
		let u, d = Cu(n);
		l(() => !!Us.current?.sharedNodes.get(d)?.lead && n.initial) && (n = {
			...n,
			initial: !1
		});
		let f = {
			...(0, s.useContext)(Vl),
			...n,
			layoutId: d
		}, { isStatic: p, isValidProp: m } = f, h = Zl(n), g = o(n, p);
		if (!p && typeof window < "u") {
			wu(f, r);
			let t = Tu(f);
			h.visualElement = xu(e, g, f, i, t.ProjectionNode, a), (t.isEnabled || h.visualElement?.projection?.options.layoutId) && (u = t.MeasureLayout);
		}
		return (0, $.jsxs)(Yl.Provider, {
			value: h,
			children: [u && h.visualElement ? (0, $.jsx)(u, {
				visualElement: h.visualElement,
				...f
			}) : null, fu(e, n, yu(g, h.visualElement, c), g, p, t, a, m)]
		});
	}
	c.displayName = `motion.${typeof e == "string" ? e : `create(${e.displayName ?? e.name ?? ""})`}`;
	let u = (0, s.forwardRef)(c);
	return u[vu] = e, u;
}
function Cu({ layoutId: e }) {
	let t = (0, s.useContext)(c).id;
	return t && e !== void 0 ? t + "-" + e : e;
}
function wu(e, t) {
	(0, s.useContext)(Ul).strict;
}
function Tu(e) {
	let { drag: t, layout: n } = ql();
	if (!t && !n) return {};
	let r = {
		...t,
		...n
	};
	return {
		MeasureLayout: r.MeasureLayout,
		isEnabled: t?.isEnabled(e) || n?.isEnabled(e),
		ProjectionNode: r.ProjectionNode
	};
}
// node_modules/framer-motion/dist/es/render/components/create-proxy.mjs
function Eu(e, t) {
	if (typeof Proxy > "u") return Su;
	let n = /* @__PURE__ */ new Map(), r = (n, r) => Su(n, r, e, t);
	return new Proxy((e, t) => r(e, t), { get: (i, a) => a === "create" ? r : (n.has(a) || n.set(a, Su(a, void 0, e, t)), n.get(a)) });
}
// node_modules/framer-motion/dist/es/render/dom/create-visual-element.mjs
var Du = (e, t) => t.isSVG ?? du(e) ? new Pl(t) : new pc(t, { allowProjection: e !== s.Fragment }), Ou = class extends Q {
	constructor(e) {
		super(e), e.animationState ||= Rl(e);
	}
	updateAnimationControlsSubscription() {
		let { animate: e } = this.node.getProps();
		Ks(e) && (this.unmountControls = e.subscribe(this.node));
	}
	mount() {
		this.updateAnimationControlsSubscription();
	}
	update() {
		this.node.getProps().animate !== this.node.prevProps?.animate && this.updateAnimationControlsSubscription();
	}
	unmount() {
		this.node.animationState.reset(), this.unmountControls?.();
	}
}, ku = 0, Au = {
	animation: { Feature: Ou },
	exit: { Feature: class extends Q {
		constructor() {
			super(...arguments), this.id = ku++;
		}
		update() {
			let { presenceContext: e, animationState: t } = this.node;
			if (!e || !t) return;
			let { isPresent: n, onExitComplete: r } = e;
			if (n === !this.exit) return;
			if (n) {
				if (this.exit === !0) {
					let { initial: e } = this.node.getProps();
					if (e && !Array.isArray(e)) {
						let { transition: t, transitionEnd: n, ...r } = Zi(this.node, e) || {};
						for (let e in r) this.node.getValue(e)?.jump(r[e]);
					}
					this.node.blockInitialAnimation = !1, t.reset(), t.animateChanges();
				} else t.setActive("exit", !1);
				this.exit = void 0;
				return;
			}
			let i = this.exit = t.setActive("exit", !0);
			r && i.then(() => {
				this.exit === i && (this.exit = !0, r(this.id));
			});
		}
		mount() {
			let { register: e } = this.node.presenceContext || {};
			e && (this.unmount = e(this.id, this.node)), this.update();
		}
		unmount() {}
	} }
}, ju = class extends Q {
	constructor(e) {
		super(e), this.removeGroupControls = b, this.removeListeners = b, this.controls = new cl(e);
	}
	mount() {
		let { dragControls: e } = this.node.getProps();
		e && (this.removeGroupControls = e.subscribe(this.controls)), this.removeListeners = this.controls.addListeners() || b;
	}
	update() {
		let { dragControls: e, drag: t } = this.node.getProps(), { dragControls: n, drag: r } = this.node.prevProps || {};
		e !== n && (this.removeGroupControls(), e && (this.removeGroupControls = e.subscribe(this.controls))), r && !t && this.controls.stop(void 0, void 0, r);
	}
	unmount() {
		this.removeGroupControls(), this.removeListeners(), this.controls.isDragging || this.controls.endPanSession();
	}
}, Mu = (e) => (t, n) => {
	e && z.update(() => e(t, n), !1, !0);
}, Nu = class extends Q {
	constructor() {
		super(...arguments), this.removePointerDownListener = b;
	}
	onPointerDown(e) {
		this.session = new Fc(e, this.createPanHandlers(), {
			transformPagePoint: this.node.getTransformPagePoint(),
			contextWindow: this.node.current?.ownerDocument.defaultView
		});
	}
	createPanHandlers() {
		let { onPanSessionStart: e, onPanStart: t, onPan: n, onPanEnd: r } = this.node.getProps();
		return {
			onSessionStart: Mu(e),
			onStart: Mu(t),
			onMove: Mu(n),
			onEnd: (e, t) => {
				delete this.session, r && z.postRender(() => r(e, t));
			}
		};
	}
	mount() {
		this.removePointerDownListener = _c(this.node.current, "pointerdown", (e) => this.onPointerDown(e));
	}
	update() {
		this.session?.updateHandlers(this.createPanHandlers());
	}
	unmount() {
		this.removePointerDownListener(), this.session?.end();
	}
}, Pu = !1, Fu = ({ layout: e, layoutDependency: t, layoutAnchor: n }) => ({
	layout: e,
	layoutDependency: t,
	layoutAnchor: n,
	animationType: typeof e == "string" ? e : "both"
}), Iu = (e, t) => {
	let { snapshot: n } = e, r = e.getStack();
	r?.remove(e);
	let i = r?.lead;
	if (r?.prevLead === e && i.resumeFrom === e && (i.resumeFrom = i.currentAnimation = e.resumingFrom = void 0), e.options.layoutId = t, !t) e.needsShow = !0;
	else return e.root.registerSharedNode(t, e), () => {
		let { resumeFrom: t } = e;
		t?.isPresent !== !1 && e.getStack().members.includes(t) && (t.hide(), e.resumeFrom = void 0, e.snapshot = n);
	};
}, Lu = class extends s.Component {
	componentDidMount() {
		let { visualElement: e, layoutGroup: t, switchLayoutGroup: n, layoutId: r } = this.props, { projection: i } = e;
		i && (t.group?.add(i), r && n?.register?.(i), Pu && i.root.didUpdate(), i.options.layoutId !== r && Iu(i, r)?.(), i.addEventListener("animationComplete", () => this.safeToRemove()), i.setOptions({
			...i.options,
			...Fu(this.props),
			onExitComplete: () => this.safeToRemove()
		})), ls.hasEverUpdated = !0;
	}
	getSnapshotBeforeUpdate(e) {
		let { layoutDependency: t, layoutId: n, visualElement: r, drag: i, isPresent: a } = this.props, { projection: o } = r;
		return o && (o.isPresent = a, this.takeOver = e.layoutId === n ? void 0 : (o.willUpdate(), Iu(o, n)), o.setOptions({
			...o.options,
			...Fu(this.props)
		}), Pu = !0, i || e.layoutDependency !== t || t === void 0 || e.isPresent !== a ? o.willUpdate() : this.safeToRemove(), e.isPresent !== a && (a ? o.promote() : o.relegate() || z.postRender(() => {
			o.getStack()?.members.length || this.safeToRemove();
		}))), null;
	}
	componentDidUpdate() {
		let { projection: e } = this.props.visualElement;
		e && (this.takeOver?.(), e.root.didUpdate(), io.postRender(() => {
			!e.currentAnimation && e.isLead() && this.safeToRemove();
		}));
	}
	componentWillUnmount() {
		let { visualElement: e, layoutGroup: t, switchLayoutGroup: n } = this.props, { projection: r } = e;
		Pu = !0, r && (r.scheduleCheckAfterUnmount(), t.group?.remove(r), n?.deregister?.(r));
	}
	safeToRemove() {
		this.props.safeToRemove?.();
	}
	render() {
		return null;
	}
};
function Ru(e) {
	let [t, n] = Hl(), r = (0, s.useContext)(c);
	return (0, $.jsx)(Lu, {
		...e,
		layoutGroup: r,
		switchLayoutGroup: (0, s.useContext)(bu),
		isPresent: t,
		safeToRemove: n
	});
}
// node_modules/framer-motion/dist/es/motion/features/drag.mjs
var zu = {
	pan: { Feature: Nu },
	drag: {
		Feature: ju,
		ProjectionNode: Ws,
		MeasureLayout: Ru
	}
};
// node_modules/framer-motion/dist/es/gestures/hover.mjs
function Bu(e, t, n, r, i) {
	let { props: a } = e, o = "while" + n;
	!i && e.animationState && a[o] && e.animationState.setActive(o, r === "Start");
	let s = a["on" + n + r];
	s && z.postRender(() => s(t, hc(t)));
}
var Vu = class extends Q {
	mount() {
		let { current: e } = this.node;
		e && (this.unmount = _l(e, (e, t) => (Bu(this.node, t, "Hover", "Start"), (e) => Bu(this.node, e, "Hover", "End"))));
	}
	unmount() {}
}, Hu = class extends Q {
	constructor() {
		super(...arguments), this.isActive = !1;
	}
	onFocus() {
		let e = !1;
		try {
			e = this.node.current.matches(":focus-visible");
		} catch {
			e = !0;
		}
		e && this.node.animationState && (this.node.animationState.setActive("whileFocus", !0), this.isActive = !0);
	}
	onBlur() {
		this.isActive && this.node.animationState && (this.node.animationState.setActive("whileFocus", !1), this.isActive = !1);
	}
	mount() {
		this.unmount = x(X(this.node.current, "focus", () => this.onFocus()), X(this.node.current, "blur", () => this.onBlur()));
	}
	unmount() {}
};
// node_modules/framer-motion/dist/es/gestures/press.mjs
function Uu(e, t, n, r) {
	e.current instanceof HTMLButtonElement && e.current.disabled || Bu(e, t, "Tap", n, r);
}
var Wu = class extends Q {
	constructor() {
		super(...arguments), this.options = {};
	}
	mount() {
		let { current: e } = this.node;
		e && (this.update(), this.unmount = kl(e, (e, t) => (Uu(this.node, t, "Start"), {
			onComplete: (e, { success: t }) => Uu(this.node, e, t ? "" : "Cancel"),
			onRepeat: () => Uu(this.node, t, "", !0)
		}), this.options));
	}
	update() {
		let { options: e, node: t } = this, { globalTapTarget: n, propagate: r, tap: i } = t.props;
		for (let t in e) delete e[t];
		Object.assign(e, i, {
			useGlobalTarget: n,
			stopPropagation: r?.tap === !1
		});
	}
	unmount() {}
}, Gu = /* @__PURE__ */ new WeakMap(), Ku = /* @__PURE__ */ new WeakMap(), qu = (e) => {
	let t = Gu.get(e.target);
	t && t(e);
}, Ju = (e) => {
	e.forEach(qu);
};
function Yu({ root: e, ...t }) {
	let n = e || document;
	Ku.has(n) || Ku.set(n, {});
	let r = Ku.get(n), i = JSON.stringify(t);
	return r[i] || (r[i] = new IntersectionObserver(Ju, {
		root: e,
		...t
	})), r[i];
}
function Xu(e, t, n) {
	let r = Yu(t);
	return Gu.set(e, n), r.observe(e), () => {
		Gu.delete(e), r.unobserve(e);
	};
}
// node_modules/framer-motion/dist/es/motion/features/viewport/index.mjs
var Zu = {
	some: 0,
	all: 1
}, Qu = class extends Q {
	constructor() {
		super(...arguments), this.hasEnteredView = !1, this.isInView = !1;
	}
	startObserver() {
		this.stopObserver?.();
		let { viewport: e = {} } = this.node.getProps(), { root: t, margin: n, amount: r = "some", once: i } = e, a = {
			root: t ? t.current : void 0,
			rootMargin: n,
			threshold: typeof r == "number" ? r : Zu[r]
		}, o = (e) => {
			let { isIntersecting: t } = e;
			if (this.isInView === t || (this.isInView = t, i && !t && this.hasEnteredView)) return;
			t && (this.hasEnteredView = !0), this.node.animationState && this.node.animationState.setActive("whileInView", t);
			let { onViewportEnter: n, onViewportLeave: r } = this.node.getProps(), a = t ? n : r;
			a && a(e);
		};
		this.stopObserver = Xu(this.node.current, a, o);
	}
	mount() {
		this.startObserver();
	}
	update() {
		if (typeof IntersectionObserver > "u") return;
		let { props: e, prevProps: t } = this.node;
		[
			"amount",
			"margin",
			"root"
		].some($u(e, t)) && this.startObserver();
	}
	unmount() {
		this.stopObserver?.(), this.hasEnteredView = !1, this.isInView = !1;
	}
};
function $u({ viewport: e = {} }, { viewport: t = {} } = {}) {
	return (n) => e[n] !== t[n];
}
// node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs
var ed = /*@__PURE__*/ Eu(/* @__PURE__ */ Object.assign({}, Au, {
	inView: { Feature: Qu },
	tap: { Feature: Wu },
	focus: { Feature: Hu },
	hover: { Feature: Vu }
}, zu, { layout: {
	ProjectionNode: Ws,
	MeasureLayout: Ru
} }), Du), td = {
	name: "moon",
	size: 24,
	node: [["path", {
		d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
		key: "kfwtm"
	}]]
};
td.node;
var nd = i(td), rd = {
	name: "sun",
	size: 24,
	node: [
		["circle", {
			cx: "12",
			cy: "12",
			r: "4",
			key: "4exip2"
		}],
		["path", {
			d: "M12 2v2",
			key: "tus03m"
		}],
		["path", {
			d: "M12 20v2",
			key: "1lh1kg"
		}],
		["path", {
			d: "m4.93 4.93 1.41 1.41",
			key: "149t6j"
		}],
		["path", {
			d: "m17.66 17.66 1.41 1.41",
			key: "ptbguv"
		}],
		["path", {
			d: "M2 12h2",
			key: "1t8f8n"
		}],
		["path", {
			d: "M20 12h2",
			key: "1q8mjw"
		}],
		["path", {
			d: "m6.34 17.66-1.41 1.41",
			key: "1m8zz5"
		}],
		["path", {
			d: "m19.07 4.93-1.41 1.41",
			key: "1shlcs"
		}]
	]
};
rd.node;
var id = i(rd), ad = r(), od = e(), sd = ({ className: e, children: t, showRadialGradient: n = !0, ...r }) => /* @__PURE__ */ (0, $.jsx)("main", { children: /* @__PURE__ */ (0, $.jsxs)("div", {
	className: o("relative flex h-[100vh] w-full flex-col items-center justify-center bg-mofid-50 text-slate-950 transition-colors dark:bg-mofid-950", e),
	...r,
	children: [/* @__PURE__ */ (0, $.jsx)("div", {
		className: "pointer-events-none absolute inset-0 overflow-hidden",
		children: /* @__PURE__ */ (0, $.jsx)("div", { className: o("\n    [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]\n    [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]\n    [--aurora:repeating-linear-gradient(100deg,var(--mofid-500)_10%,var(--mofid-300)_15%,var(--mofid-200)_20%,var(--mofid-600)_25%,var(--mofid-400)_30%)]\n    [background-image:var(--white-gradient),var(--aurora)] dark:[background-image:var(--dark-gradient),var(--aurora)]\n    [background-size:300%,_200%] [background-position:50%_50%,50%_50%]\n    absolute -inset-[10px] opacity-50 blur-[10px] invert-0 will-change-transform dark:invert-0\n    after:absolute after:inset-0 after:content-[\"\"] after:[background-image:var(--white-gradient),var(--aurora)]\n    dark:after:[background-image:var(--dark-gradient),var(--aurora)] after:[background-size:200%,_100%]\n    after:animate-aurora after:[background-attachment:fixed] after:mix-blend-normal motion-reduce:after:animate-none\n   ", n && "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]") })
	}), t]
}) }), cd = "mofid-academy-theme";
function ld() {
	let [e, t] = (0, s.useState)(document.documentElement.dataset.theme === "light" ? "light" : "dark");
	(0, s.useEffect)(() => {
		let t = document.documentElement;
		t.dataset.theme = e, t.dataset.academyTheme = e, t.classList.toggle("dark", e === "dark"), t.style.colorScheme = e, document.querySelector("meta[name=\"theme-color\"]")?.setAttribute("content", e === "dark" ? "#071d17" : "#f2faf5");
		try {
			localStorage.setItem(cd, e);
		} catch {}
	}, [e]), (0, s.useEffect)(() => {
		let e = (e) => {
			e.key === cd && (e.newValue === "dark" || e.newValue === "light") && t(e.newValue);
		};
		return window.addEventListener("storage", e), () => window.removeEventListener("storage", e);
	}, []);
	let n = document.querySelector("[data-theme-control]");
	return /* @__PURE__ */ (0, $.jsxs)($.Fragment, { children: [
		/* @__PURE__ */ (0, $.jsx)(ed.div, {
			className: "aurora-mount",
			"aria-hidden": "true",
			initial: { opacity: 0 },
			animate: { opacity: 1 },
			transition: { duration: .8 },
			children: /* @__PURE__ */ (0, $.jsx)(sd, { children: /* @__PURE__ */ (0, $.jsx)("span", {}) })
		}),
		/* @__PURE__ */ (0, $.jsx)("div", {
			className: "aurora-vignette",
			"aria-hidden": "true"
		}),
		n && (0, ad.createPortal)(/* @__PURE__ */ (0, $.jsxs)("button", {
			type: "button",
			className: "theme-toggle",
			"aria-label": e === "dark" ? "فعال کردن حالت روز" : "فعال کردن حالت شب",
			onClick: () => t(e === "dark" ? "light" : "dark"),
			children: [e === "dark" ? /* @__PURE__ */ (0, $.jsx)(id, { "aria-hidden": "true" }) : /* @__PURE__ */ (0, $.jsx)(nd, { "aria-hidden": "true" }), /* @__PURE__ */ (0, $.jsx)("span", { children: e === "dark" ? "حالت روز" : "حالت شب" })]
		}), n)
	] });
}
var ud = document.getElementById("auroraRoot");
ud && (0, od.createRoot)(ud).render(/* @__PURE__ */ (0, $.jsx)(ld, {}));
