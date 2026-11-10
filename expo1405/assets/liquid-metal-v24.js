// lib/liquid-metal.ts
var e = ".option-button,.join-cta,.button.primary:not(.danger),.qr-download,.liquid-metal-button";
function t() {
	let t = matchMedia("(prefers-reduced-motion: reduce)"), n = matchMedia("(hover: hover) and (pointer: fine)"), r = /* @__PURE__ */ new Map(), i = performance.now(), a = null, o = !1, s = !1, c = (e) => {
		let t = r.get(e);
		t && (t.cancelled = !0, t.mount?.dispose(), t.layer.remove(), r.delete(e));
	}, l = () => {
		for (let e of r.keys()) c(e);
	}, u = async (e) => {
		if (r.has(e) || o) return;
		let t = document.createElement("span");
		t.className = "liquid-metal-effect", t.setAttribute("aria-hidden", "true"), e.prepend(t);
		let n = {
			layer: t,
			mount: null,
			cancelled: !1
		};
		r.set(e, n);
		try {
			let { ShaderMount: r, liquidMetalFragmentShader: o } = await (a ??= import("./liquid-metal-dist-CoyG9-6D.js"));
			if (n.cancelled || !e.isConnected || e.disabled || document.hidden) return;
			n.mount = new r(t, o, {
				u_colorBack: [
					.03,
					.12,
					.09,
					1
				],
				u_colorTint: [
					.18,
					.67,
					.51,
					1
				],
				u_repetition: 4,
				u_softness: .5,
				u_shiftRed: .12,
				u_shiftBlue: .12,
				u_distortion: .08,
				u_contour: .1,
				u_angle: 45,
				u_scale: 8,
				u_shape: 0,
				u_isImage: !1,
				u_fit: 2,
				u_rotation: 0,
				u_originX: .5,
				u_originY: .5,
				u_offsetX: .1,
				u_offsetY: -.1,
				u_worldWidth: 0,
				u_worldHeight: 0
			}, {
				alpha: !1,
				antialias: !1
			}, .45, (performance.now() - i) * .45, 1, 1e5);
		} catch {
			o = !0, l();
		}
	}, d = () => {
		s = !1;
		let i = [];
		for (let n of document.querySelectorAll(e)) {
			let e = n.getBoundingClientRect(), r = !(e.width > 0 && e.height > 0 && e.bottom > 0 && e.top < innerHeight && e.right > 0 && e.left < innerWidth) || document.hidden || t.matches || n.disabled;
			n.classList.toggle("metal-paused", r), r || i.push(n);
		}
		let a = new Set(i.slice(0, n.matches ? 4 : 2));
		for (let [e, t] of r) a.has(e) && t.layer.isConnected || c(e);
		if (!o) for (let e of a) u(e);
	}, f = () => {
		s || (s = !0, requestAnimationFrame(d));
	}, p = (t) => t instanceof Element ? t.closest(e) : null;
	document.addEventListener("pointerdown", (e) => {
		let t = p(e.target);
		t && r.get(t)?.mount?.setSpeed(1.4);
	}), document.addEventListener("pointerup", () => {
		for (let e of r.values()) e.mount?.setSpeed(.45);
	}), document.addEventListener("visibilitychange", () => {
		document.hidden ? (l(), d()) : f();
	}), window.addEventListener("pagehide", l), window.addEventListener("pageshow", f), window.addEventListener("resize", f), document.addEventListener("scroll", f, {
		capture: !0,
		passive: !0
	}), t.addEventListener("change", f), n.addEventListener("change", f), new MutationObserver(f).observe(document.body, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["disabled", "hidden"]
	}), f();
}
// src/liquid-metal-entry.ts
t();
