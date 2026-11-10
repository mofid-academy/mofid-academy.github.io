function e() {
	let e = matchMedia("(prefers-reduced-motion: reduce)"), t = matchMedia("(hover: hover) and (pointer: fine)"), n = null, r = null, i = null, a = 0, o = !1, s = null, c = () => {
		a++, i?.dispose(), i = null, r?.remove(), r = null, n = null;
	}, l = (e) => e instanceof Element ? e.closest(".option-button,.join-cta,.button.primary:not(.danger),.qr-download,.liquid-metal-button") : null, u = async (l) => {
		if (!l || l.disabled || document.hidden || e.matches || !t.matches || o || l === n) return;
		c(), n = l;
		let u = a;
		try {
			let { ShaderMount: e, liquidMetalFragmentShader: t } = await (s ??= import("./liquid-metal-dist-CoyG9-6D.js"));
			if (u !== a || !l.isConnected || l.disabled || document.hidden) return;
			r = document.createElement("span"), r.className = "liquid-metal-effect", r.setAttribute("aria-hidden", "true"), l.prepend(r), i = new e(r, t, {
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
			}, .6, 0, 1, 18e4);
		} catch {
			c(), o = !0;
		}
	};
	document.addEventListener("pointerover", (e) => {
		e.pointerType === "mouse" && u(l(e.target));
	}), document.addEventListener("pointerout", (e) => {
		n && l(e.target) === n && !(e.relatedTarget instanceof Node && n.contains(e.relatedTarget)) && c();
	}), document.addEventListener("focusin", (e) => {
		u(l(e.target));
	}), document.addEventListener("focusout", (e) => {
		n && !(e.relatedTarget instanceof Node && n.contains(e.relatedTarget)) && c();
	}), document.addEventListener("pointerdown", (e) => {
		l(e.target) === n && i?.setSpeed(1.4);
	}), document.addEventListener("pointerup", () => i?.setSpeed(.6)), document.addEventListener("visibilitychange", () => {
		document.hidden && c();
	}), window.addEventListener("pagehide", c), e.addEventListener("change", c), t.addEventListener("change", c), new MutationObserver(() => {
		n && (!n.isConnected || n.disabled) && c();
	}).observe(document.body, {
		childList: !0,
		subtree: !0,
		attributes: !0,
		attributeFilter: ["disabled"]
	});
}
// src/liquid-metal-entry.ts
e();
