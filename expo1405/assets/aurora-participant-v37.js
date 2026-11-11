import { a as e, i as t, n, o as r, r as i, t as a } from "./aurora-CRxiHlrC.js";
// node_modules/lucide-react/dist/esm/icons/moon.mjs
var o = {
	name: "moon",
	size: 24,
	node: [["path", {
		d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
		key: "kfwtm"
	}]]
};
o.node;
var s = n(o), c = {
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
c.node;
var l = n(c), u = /* @__PURE__ */ r(e(), 1), d = t(), f = i(), p = "\nattribute vec2 position;\nvarying vec2 vUv;\nvoid main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}\n", m = "\nprecision highp float;\nvarying vec2 vUv;\nuniform vec2 u_resolution;\nuniform float u_time;\nuniform float u_grain;\nuniform vec3 u_colors[4];\nuniform vec3 u_bg;\nvec3 permute(vec3 x){return mod(((x*34.)+1.)*x,289.);}\nfloat snoise(vec2 v){\n const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);\n vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);\n vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);\n vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.);\n vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));\n vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);\n m=m*m;m=m*m;vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;\n m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;\n g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;\n return 130.*dot(m,g);\n}\nvoid main(){\n vec2 uv=vUv;float ratio=u_resolution.x/max(u_resolution.y,1.);vec2 p=uv-.5;p.x*=ratio;float t=u_time*.1;\n float n1=snoise(p*.4+vec2(t*.2,-t*.3));\n float n2=snoise(p*.55+vec2(-t*.15,t*.25)+n1*.25);\n float n3=snoise(p*.75+vec2(t*.1,-t*.2)+n2*.2);\n vec3 col=u_bg;float dist=length(p)*1.5;float vignette=1.-smoothstep(.3,1.2,dist);\n col=mix(col,u_colors[0],smoothstep(-.2,.5,n1)*.85);\n col=mix(col,u_colors[1],smoothstep(-.1,.6,n2)*.7);\n col=mix(col,u_colors[2],smoothstep(-.3,.4,n3)*.6);\n col=mix(col,u_colors[3],smoothstep(0.,.7,n1*n2)*.5);\n col+=u_colors[1]*(1.-smoothstep(0.,.8,dist))*.3;col=mix(col*.2,col,vignette);\n float noise=fract(sin(dot(uv,vec2(12.9898,78.233)))*43758.5453+u_time);\n col+=(noise-.5)*u_grain*.1;gl_FragColor=vec4(col,1.);\n}\n", h = (e) => [
	1,
	3,
	5
].map((t) => parseInt(e.slice(t, t + 2), 16) / 255);
function g(e, t, n) {
	e.dataset.renderer = "fallback";
	let r = null;
	try {
		r = e.getContext("webgl", {
			alpha: !1,
			antialias: !1,
			powerPreference: "low-power"
		});
	} catch {
		return () => {};
	}
	if (!r) return () => {};
	let i = r, a = (e, t) => {
		let n = i.createShader(e);
		return n ? (i.shaderSource(n, t), i.compileShader(n), i.getShaderParameter(n, i.COMPILE_STATUS) ? n : (i.deleteShader(n), null)) : null;
	}, o = a(i.VERTEX_SHADER, p), s = a(i.FRAGMENT_SHADER, m);
	if (!o || !s) return o && i.deleteShader(o), s && i.deleteShader(s), () => {};
	let c = i.createProgram(), l = i.createBuffer();
	if (!c || !l) return c && i.deleteProgram(c), l && i.deleteBuffer(l), i.deleteShader(o), i.deleteShader(s), () => {};
	if (i.attachShader(c, o), i.attachShader(c, s), i.linkProgram(c), !i.getProgramParameter(c, i.LINK_STATUS)) return i.deleteProgram(c), i.deleteBuffer(l), i.deleteShader(o), i.deleteShader(s), () => {};
	i.useProgram(c), i.bindBuffer(i.ARRAY_BUFFER, l), i.bufferData(i.ARRAY_BUFFER, new Float32Array([
		-1,
		-1,
		1,
		-1,
		-1,
		1,
		1,
		1
	]), i.STATIC_DRAW);
	let u = i.getAttribLocation(c, "position");
	i.enableVertexAttribArray(u), i.vertexAttribPointer(u, 2, i.FLOAT, !1, 0, 0);
	let d = i.getUniformLocation(c, "u_resolution"), f = i.getUniformLocation(c, "u_time");
	i.uniform1f(i.getUniformLocation(c, "u_grain"), n.grain), i.uniform3f(i.getUniformLocation(c, "u_bg"), ...h(n.bg)), i.uniform3fv(i.getUniformLocation(c, "u_colors[0]"), new Float32Array(n.colors.slice(0, 4).flatMap(h)));
	let g = window.matchMedia("(prefers-reduced-motion: reduce)"), _ = 0, v = -Infinity, y = !0, b = !1, x = !1, S = 1e3 / 24, C = () => {
		_ &&= (window.cancelAnimationFrame(_), 0);
	}, w = () => !x && !b && !document.hidden && y, T = (t) => {
		_ = 0, w() && (t - v >= S && (i.uniform2f(d, e.width, e.height), i.uniform1f(f, t * .001 * n.speed), i.drawArrays(i.TRIANGLE_STRIP, 0, 4), e.dataset.renderer = "webgl", v = t), g.matches || (_ = window.requestAnimationFrame(T)));
	}, E = () => {
		C(), w() && (_ = window.requestAnimationFrame(T));
	}, D = () => {
		let n = t.getBoundingClientRect(), r = Math.max(1, n.width), a = Math.max(1, n.height), o = window.innerWidth <= 650, s = o ? 55e4 : 12e5, c = o ? 1 : 1.25, l = Math.min(window.devicePixelRatio || 1, c, Math.sqrt(s / (r * a)));
		e.width = Math.max(1, Math.floor(r * l)), e.height = Math.max(1, Math.floor(a * l)), i.viewport(0, 0, e.width, e.height), S = 1e3 / (o ? 18 : 24), v = -Infinity, E();
	}, O = (t) => {
		t.preventDefault(), b = !0, C(), e.dataset.renderer = "fallback";
	};
	e.addEventListener("webglcontextlost", O), document.addEventListener("visibilitychange", E), g.addEventListener?.("change", E);
	let k = typeof ResizeObserver == "function" ? new ResizeObserver(D) : null;
	k?.observe(t);
	let A = typeof IntersectionObserver == "function" ? new IntersectionObserver((e) => {
		y = e[0]?.isIntersecting !== !1, E();
	}) : null;
	return A?.observe(t), window.addEventListener("resize", D), D(), () => {
		x = !0, C(), k?.disconnect(), A?.disconnect(), window.removeEventListener("resize", D), document.removeEventListener("visibilitychange", E), g.removeEventListener?.("change", E), e.removeEventListener("webglcontextlost", O), i.deleteBuffer(l), i.deleteProgram(c), i.deleteShader(o), i.deleteShader(s);
	};
}
// components/ui/velaris.tsx
var _ = a(), v = [
	"#70d8ad",
	"#129b75",
	"#075b48",
	"#071d17"
];
function y({ staticOnly: e = !1 }) {
	let t = (0, u.useRef)(null), n = (0, u.useRef)(null), [r, i] = (0, u.useState)(0);
	return (0, u.useEffect)(() => {
		let e = n.current;
		if (!e) return;
		let t = () => i((e) => e + 1);
		return e.addEventListener("webglcontextrestored", t), () => e.removeEventListener("webglcontextrestored", t);
	}, [e]), (0, u.useEffect)(() => {
		if (!e && n.current && t.current) return g(n.current, t.current, {
			bg: "#04140f",
			colors: v,
			speed: .45,
			grain: .12
		});
	}, [e, r]), /* @__PURE__ */ (0, _.jsx)("div", {
		ref: t,
		className: "ambient-layer velaris-layer",
		"data-background": "velaris",
		"aria-hidden": "true",
		children: !e && /* @__PURE__ */ (0, _.jsx)("canvas", {
			ref: n,
			className: "velaris-canvas",
			"data-renderer": "fallback",
			"aria-hidden": "true"
		})
	});
}
// components/ui/jade-sky.tsx
function b() {
	return /* @__PURE__ */ (0, _.jsx)("div", {
		className: "ambient-layer jade-sky",
		"data-background": "jade-sky",
		"aria-hidden": "true"
	});
}
// src/aurora-entry.tsx
var x = "expo1405-participant-theme-v37";
function S() {
	let [e, t] = (0, u.useState)(document.documentElement.dataset.theme === "light" ? "light" : "dark");
	(0, u.useEffect)(() => {
		let t = document.documentElement;
		t.dataset.theme = e, t.dataset.academyTheme = e, t.classList.toggle("dark", e === "dark"), t.style.colorScheme = e, document.querySelector("meta[name=\"theme-color\"]")?.setAttribute("content", e === "dark" ? "#071d17" : "#f2faf5");
		try {
			localStorage.setItem(x, e);
		} catch {}
	}, [e]), (0, u.useEffect)(() => {
		let e = (e) => {
			e.key === x && (e.newValue === "dark" || e.newValue === "light") && t(e.newValue);
		};
		return window.addEventListener("storage", e), () => window.removeEventListener("storage", e);
	}, []);
	let n = document.querySelector("[data-theme-control]"), r = document.body.dataset.backgroundStatic === "true";
	return /* @__PURE__ */ (0, _.jsxs)(_.Fragment, { children: [
		/* @__PURE__ */ (0, _.jsx)("div", {
			className: "ambient-mount",
			"aria-hidden": "true",
			children: e === "dark" ? /* @__PURE__ */ (0, _.jsx)(y, { staticOnly: r }) : /* @__PURE__ */ (0, _.jsx)(b, {})
		}),
		/* @__PURE__ */ (0, _.jsx)("div", {
			className: "ambient-vignette",
			"aria-hidden": "true"
		}),
		n && (0, d.createPortal)(/* @__PURE__ */ (0, _.jsxs)("button", {
			type: "button",
			className: "theme-toggle",
			"aria-label": e === "dark" ? "فعال کردن حالت روز" : "فعال کردن حالت شب",
			onClick: () => t(e === "dark" ? "light" : "dark"),
			children: [e === "dark" ? /* @__PURE__ */ (0, _.jsx)(l, { "aria-hidden": "true" }) : /* @__PURE__ */ (0, _.jsx)(s, { "aria-hidden": "true" }), /* @__PURE__ */ (0, _.jsx)("span", { children: e === "dark" ? "حالت روز" : "حالت شب" })]
		}), n)
	] });
}
var C = document.getElementById("auroraRoot");
C && (0, f.createRoot)(C).render(/* @__PURE__ */ (0, _.jsx)(S, {}));
