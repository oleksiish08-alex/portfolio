/* Portfolio — interactive effects (no dependencies).
   Every effect is gated by the active theme (html[data-theme]) and re-evaluated
   whenever the theme changes:
     classic (Light) : image lens, scaling cursor, dotted-Earth globe
     golden  (Gold)  : image lens, fluid cursor, "Plasma Ring"
     cyber   (Cyber) : smooth cursor follower, "Globe Mesh"
   Touch-first devices and prefers-reduced-motion get native behaviour / static frames. */
(function () {
  'use strict';
  var SCRIPT_BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^\/]*$/, '');
  var root = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  var theme = function () { return root.getAttribute('data-theme') || 'classic'; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ================================================================
     1. IMAGE LENS (Light + Gold) — magnified circle that follows the cursor
     ================================================================ */
  var LENS_ZOOM = 2.2;
  function initLens(card) {
    var box = card.querySelector('.img');
    var img = box && box.querySelector('img');
    if (!box || !img) { return; }
    var lens = document.createElement('span');
    lens.className = 'lens'; lens.setAttribute('aria-hidden', 'true');
    box.appendChild(lens);
    var on = false, raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;

    function enabled() { return fineMQ.matches && theme() !== 'cyber'; }
    function paint() {
      raf = 0;
      var w = box.clientWidth, h = box.clientHeight, nw = img.naturalWidth, nh = img.naturalHeight;
      if (!nw || !nh) { return; }
      var r = lens.offsetWidth / 2;
      cx = reduceMQ.matches ? tx : lerp(cx, tx, 0.28); cy = reduceMQ.matches ? ty : lerp(cy, ty, 0.28);
      /* object-fit: cover → displayed size and crop offset of the picture */
      var k = Math.max(w / nw, h / nh), dw = nw * k, dh = nh * k, ox = (dw - w) / 2, oy = (dh - h) / 2;
      lens.style.translate = (cx - r) + 'px ' + (cy - r) + 'px';
      lens.style.backgroundSize = (dw * LENS_ZOOM) + 'px ' + (dh * LENS_ZOOM) + 'px';
      lens.style.backgroundPosition = (r - (cx + ox) * LENS_ZOOM) + 'px ' + (r - (cy + oy) * LENS_ZOOM) + 'px';
      if (on && (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3)) { raf = requestAnimationFrame(paint); }
    }
    function show(v) {
      if (v === on) { return; }
      on = v; lens.classList.toggle('is-on', v);
      if (v) { lens.style.backgroundImage = 'url("' + (img.currentSrc || img.src) + '")'; }
    }
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !enabled()) { show(false); return; }
      var b = box.getBoundingClientRect();
      var inside = e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom;
      if (!inside) { show(false); return; }
      tx = e.clientX - b.left; ty = e.clientY - b.top;
      if (!on) { cx = tx; cy = ty; }
      show(true);
      if (!raf) { raf = requestAnimationFrame(paint); }
    });
    card.addEventListener('pointerleave', function () { show(false); });
    document.addEventListener('themechange', function () { show(false); });
  }
  $$('.pcard').forEach(initLens);

  /* ================================================================
     2-. SCALING CURSOR (Light / Classic only)
     After Cursify "scaling cursor": a dot glued to the pointer that scales up over interactive elements.
       rest  → #16A34A, 20px
       hover → slightly larger, colour #15803D, concentric waves ripple outward (pure CSS animation)
       press → shrinks a little
     The native cursor stays visible. The element is a manual popover, so it sits in the browser's TOP LAYER
     (above everything, even modal dialogs); z-index is the fallback where popovers are unsupported.
     ================================================================ */
  var sc = { el: null, x: 0, y: 0, tx: 0, ty: 0, raf: 0, seen: false, hot: false };
  var SC_INTERACTIVE = 'a, button, [role="tab"], summary, input, textarea, select, label, [data-lightbox], .pcard, .scard';
  function scaleWanted() { return fineMQ.matches && !reduceMQ.matches && theme() === 'classic'; }
  function scaleEl() {
    if (sc.el) { return sc.el; }
    var el = document.createElement('div'); el.className = 'fx-scale-cursor'; el.setAttribute('aria-hidden', 'true'); el.setAttribute('popover', 'manual');
    el.innerHTML = '<span class="fx-scale-cursor__ring"></span><span class="fx-scale-cursor__ring"></span><span class="fx-scale-cursor__ring"></span><span class="fx-scale-cursor__dot"></span>';
    document.body.appendChild(el);
    try { if (typeof el.showPopover === 'function') { el.showPopover(); } } catch (e) { /* z-index fallback */ }
    sc.el = el; return el;
  }
  function scaleLoop() {
    sc.raf = 0;
    sc.x = lerp(sc.x, sc.tx, 0.42); sc.y = lerp(sc.y, sc.ty, 0.42);
    sc.el.style.transform = 'translate3d(' + sc.x.toFixed(1) + 'px,' + sc.y.toFixed(1) + 'px,0)';
    if (Math.abs(sc.tx - sc.x) + Math.abs(sc.ty - sc.y) > 0.2) { sc.raf = requestAnimationFrame(scaleLoop); }
  }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !scaleWanted()) { return; }
    var el = scaleEl();
    sc.tx = e.clientX; sc.ty = e.clientY;
    if (!sc.seen) { sc.seen = true; sc.x = sc.tx; sc.y = sc.ty; el.classList.remove('is-away'); }
    var hot = !!(e.target.closest && e.target.closest(SC_INTERACTIVE));
    if (hot !== sc.hot) { sc.hot = hot; el.classList.toggle('is-hot', hot); }
    if (!sc.raf) { sc.raf = requestAnimationFrame(scaleLoop); }
  }, { passive: true });
  document.addEventListener('pointerdown', function (e) { if (sc.el && e.pointerType === 'mouse') { sc.el.classList.add('is-down'); } }, { passive: true });
  document.addEventListener('pointerup', function () { if (sc.el) { sc.el.classList.remove('is-down'); } }, { passive: true });
  root.addEventListener('mouseleave', function () { if (sc.el) { sc.el.classList.add('is-away'); sc.seen = false; sc.hot = false; sc.el.classList.remove('is-hot'); } });

  /* ================================================================
     2-b. GOLD DOT (Gold only) — small golden dot glued to the pointer, grows slightly over interactive elements
     ================================================================ */
  var gd = { el: null, x: 0, y: 0, tx: 0, ty: 0, raf: 0, seen: false, hot: false };
  function goldDotWanted() { return fineMQ.matches && !reduceMQ.matches && theme() === 'golden'; }
  function goldDotEl() {
    if (gd.el) { return gd.el; }
    var el = document.createElement('div'); el.className = 'fx-gold-dot'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); gd.el = el; return el;
  }
  function goldDotLoop() {
    gd.raf = 0; gd.x = lerp(gd.x, gd.tx, 0.5); gd.y = lerp(gd.y, gd.ty, 0.5);
    gd.el.style.transform = 'translate3d(' + gd.x.toFixed(1) + 'px,' + gd.y.toFixed(1) + 'px,0)';
    if (Math.abs(gd.tx - gd.x) + Math.abs(gd.ty - gd.y) > 0.2) { gd.raf = requestAnimationFrame(goldDotLoop); }
  }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !goldDotWanted()) { return; }
    var el = goldDotEl(); gd.tx = e.clientX; gd.ty = e.clientY;
    if (!gd.seen) { gd.seen = true; gd.x = gd.tx; gd.y = gd.ty; el.classList.remove('is-away'); }
    var hot = !!(e.target.closest && e.target.closest(INTERACTIVE_RE));
    if (hot !== gd.hot) { gd.hot = hot; el.classList.toggle('is-hot', hot); }
    if (!gd.raf) { gd.raf = requestAnimationFrame(goldDotLoop); }
  }, { passive: true });
  root.addEventListener('mouseleave', function () { if (gd.el) { gd.el.classList.add('is-away'); gd.seen = false; gd.hot = false; gd.el.classList.remove('is-hot'); } });

  /* ================================================================
     2a. FLUID CURSOR (Light + Gold) — port of the Cursify "fluid cursor"
     (WebGL stable-fluids: curl → vorticity → divergence → pressure → advect).
     Differences from the reference, for a lighter footprint:
       · sim 96px / dye 512px (reference: 128 / 1440), 14 pressure iterations
       · dye colours come from the active theme (green / gold) instead of random rainbow
       · the loop stops ~3.5 s after the last movement and the canvas is cleared
     Falls back to the ripple cursor below when WebGL float rendering is unavailable.
     ================================================================ */
  var fluid = null, fluidState = 0;                       /* 0 untried · 1 running · -1 unsupported */
  var FLUID_PALETTE = {
    classic: { rgb: [[22, 163, 74], [74, 222, 128], [5, 150, 105], [34, 197, 94]], k: 0.26 },   /* #16A34A family */
    golden: { rgb: [[250, 204, 21], [245, 158, 11], [253, 224, 71], [217, 119, 6]], k: 0.24 }
  };
  function fluidWanted() { return fineMQ.matches && !reduceMQ.matches && theme() === 'golden'; }

  function createFluid() {
    var cv = document.createElement('canvas'); cv.className = 'fx-fluid'; cv.setAttribute('aria-hidden', 'true');
    var P = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false, premultipliedAlpha: true };
    var gl = cv.getContext('webgl2', P), gl2 = !!gl, halfExt = null;
    if (!gl) { gl = cv.getContext('webgl', P) || cv.getContext('experimental-webgl', P); }
    if (!gl) { return null; }
    var texType, ifmt, linear;
    if (gl2) { gl.getExtension('EXT_color_buffer_float'); gl.getExtension('EXT_color_buffer_half_float'); texType = gl.HALF_FLOAT; ifmt = gl.RGBA16F; linear = true; }
    else {
      halfExt = gl.getExtension('OES_texture_half_float'); linear = gl.getExtension('OES_texture_half_float_linear'); gl.getExtension('EXT_color_buffer_half_float');
      if (!halfExt || !linear) { return null; }
      texType = halfExt.HALF_FLOAT_OES; ifmt = gl.RGBA;
    }
    /* can we actually render into a half-float texture? */
    (function () { var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, 4, 4, 0, gl.RGBA, texType, null);
      var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      cv._ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE; gl.bindFramebuffer(gl.FRAMEBUFFER, null); })();
    if (!cv._ok) { return null; }

    var CFG = { SIM: 96, DYE: 512, DENS_DISS: 4.6, VEL_DISS: 2.4, PRESSURE: 0.1, ITER: 14, CURL: 3, RADIUS: 0.085, FORCE: 3800 };   /* reference: radius 0.2 / force 6000 — scaled down for Gold */
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var VS = sh(gl.VERTEX_SHADER, 'precision highp float;attribute vec2 aPosition;varying vec2 vUv,vL,vR,vT,vB;uniform vec2 texelSize;' +
      'void main(){vUv=aPosition*.5+.5;vL=vUv-vec2(texelSize.x,0.);vR=vUv+vec2(texelSize.x,0.);vT=vUv+vec2(0.,texelSize.y);vB=vUv-vec2(0.,texelSize.y);gl_Position=vec4(aPosition,0.,1.);}');
    var HEAD = 'precision highp float;precision highp sampler2D;varying vec2 vUv,vL,vR,vT,vB;';
    function prog(fs) {
      var p = gl.createProgram(); gl.attachShader(p, VS); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, HEAD + fs)); gl.bindAttribLocation(p, 0, 'aPosition'); gl.linkProgram(p);
      var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS), i; for (i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
      return { p: p, u: u };
    }
    var Pclear = prog('uniform sampler2D uTexture;uniform float value;void main(){gl_FragColor=value*texture2D(uTexture,vUv);}');
    var Psplat = prog('uniform sampler2D uTarget;uniform float aspectRatio;uniform vec3 color;uniform vec2 point;uniform float radius;' +
      'void main(){vec2 p=vUv-point;p.x*=aspectRatio;vec3 s=exp(-dot(p,p)/radius)*color;gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+s,1.);}');
    var Padv = prog('uniform sampler2D uVelocity,uSource;uniform vec2 texelSize;uniform float dt,dissipation;' +
      'void main(){vec2 c=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;gl_FragColor=texture2D(uSource,c)/(1.+dissipation*dt);}');
    var Pdiv = prog('uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).x,R=texture2D(uVelocity,vR).x,T=texture2D(uVelocity,vT).y,B=texture2D(uVelocity,vB).y;vec2 C=texture2D(uVelocity,vUv).xy;' +
      'if(vL.x<0.)L=-C.x;if(vR.x>1.)R=-C.x;if(vT.y>1.)T=-C.y;if(vB.y<0.)B=-C.y;gl_FragColor=vec4(.5*(R-L+T-B),0.,0.,1.);}');
    var Pcurl = prog('uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).y,R=texture2D(uVelocity,vR).y,T=texture2D(uVelocity,vT).x,B=texture2D(uVelocity,vB).x;gl_FragColor=vec4(.5*(R-L-T+B),0.,0.,1.);}');
    var Pvort = prog('uniform sampler2D uVelocity,uCurl;uniform float curl,dt;void main(){float L=texture2D(uCurl,vL).x,R=texture2D(uCurl,vR).x,T=texture2D(uCurl,vT).x,B=texture2D(uCurl,vB).x,C=texture2D(uCurl,vUv).x;' +
      'vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));f/=length(f)+.0001;f*=curl*C;f.y*=-1.;vec2 v=texture2D(uVelocity,vUv).xy+f*dt;gl_FragColor=vec4(clamp(v,-1000.,1000.),0.,1.);}');
    var Ppres = prog('uniform sampler2D uPressure,uDivergence;void main(){float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x,T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;' +
      'gl_FragColor=vec4((L+R+B+T-texture2D(uDivergence,vUv).x)*.25,0.,0.,1.);}');
    var Pgrad = prog('uniform sampler2D uPressure,uVelocity;void main(){float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x,T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;' +
      'vec2 v=texture2D(uVelocity,vUv).xy-vec2(R-L,T-B);gl_FragColor=vec4(v,0.,1.);}');
    var Pdisp = prog('uniform sampler2D uTexture;uniform vec2 texelSize;void main(){vec3 c=texture2D(uTexture,vUv).rgb;' +
      'float dx=length(texture2D(uTexture,vR).rgb)-length(texture2D(uTexture,vL).rgb),dy=length(texture2D(uTexture,vT).rgb)-length(texture2D(uTexture,vB).rgb);' +
      'vec3 n=normalize(vec3(dx,dy,length(texelSize)));c*=clamp(dot(n,vec3(0.,0.,1.))+.7,.7,1.);gl_FragColor=vec4(c,max(c.r,max(c.g,c.b)));}');

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);
    function blit(t) {
      if (!t) { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
      else { gl.viewport(0, 0, t.w, t.h); gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
    function fbo(w, h, filter) {
      gl.activeTexture(gl.TEXTURE0); var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, gl.RGBA, texType, null);
      var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex: tex, fbo: f, w: w, h: h, tx: 1 / w, ty: 1 / h, attach: function (id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; } };
    }
    function dbl(w, h, filter) { var a = fbo(w, h, filter), b = fbo(w, h, filter); return { w: w, h: h, tx: a.tx, ty: a.ty, get read() { return a; }, get write() { return b; }, swap: function () { var t = a; a = b; b = t; } }; }
    function res(r) { var ar = gl.drawingBufferWidth / gl.drawingBufferHeight; if (ar < 1) { ar = 1 / ar; } var mn = Math.round(r), mx = Math.round(r * ar); return gl.drawingBufferWidth > gl.drawingBufferHeight ? { w: mx, h: mn } : { w: mn, h: mx }; }
    var dye, vel, div, curl, pres;
    function init() {
      var s = res(CFG.SIM), d = res(CFG.DYE), lin = linear ? gl.LINEAR : gl.NEAREST;
      gl.disable(gl.BLEND);
      dye = dbl(d.w, d.h, lin); vel = dbl(s.w, s.h, lin); div = fbo(s.w, s.h, gl.NEAREST); curl = fbo(s.w, s.h, gl.NEAREST); pres = dbl(s.w, s.h, gl.NEAREST);
    }
    function size() {                                           /* backing store = ½ CSS px: the dye is soft anyway */
      var w = Math.max(2, Math.round(innerWidth * 0.5)), h = Math.max(2, Math.round(innerHeight * 0.5));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; init(); return true; } return false;
    }
    function splat(x, y, dx, dy, c) {
      gl.useProgram(Psplat.p); gl.uniform1i(Psplat.u.uTarget, vel.read.attach(0)); gl.uniform1f(Psplat.u.aspectRatio, cv.width / cv.height);
      gl.uniform2f(Psplat.u.point, x, y); gl.uniform3f(Psplat.u.color, dx, dy, 0);
      var ar = cv.width / cv.height, r = CFG.RADIUS / 100; if (ar > 1) { r *= ar; } gl.uniform1f(Psplat.u.radius, r);
      blit(vel.write); vel.swap();
      gl.uniform1i(Psplat.u.uTarget, dye.read.attach(0)); gl.uniform3f(Psplat.u.color, c[0], c[1], c[2]); blit(dye.write); dye.swap();
    }
    function color(boost) {
      var pal = FLUID_PALETTE[theme()] || FLUID_PALETTE.classic, c = pal.rgb[(Math.random() * pal.rgb.length) | 0], m = Math.max(c[0], c[1], c[2]), k = pal.k * (boost || 1) / m;
      return [c[0] * k, c[1] * k, c[2] * k];
    }
    function step(dt) {
      gl.disable(gl.BLEND);
      gl.useProgram(Pcurl.p); gl.uniform2f(Pcurl.u.texelSize, vel.tx, vel.ty); gl.uniform1i(Pcurl.u.uVelocity, vel.read.attach(0)); blit(curl);
      gl.useProgram(Pvort.p); gl.uniform2f(Pvort.u.texelSize, vel.tx, vel.ty); gl.uniform1i(Pvort.u.uVelocity, vel.read.attach(0)); gl.uniform1i(Pvort.u.uCurl, curl.attach(1));
      gl.uniform1f(Pvort.u.curl, CFG.CURL); gl.uniform1f(Pvort.u.dt, dt); blit(vel.write); vel.swap();
      gl.useProgram(Pdiv.p); gl.uniform2f(Pdiv.u.texelSize, vel.tx, vel.ty); gl.uniform1i(Pdiv.u.uVelocity, vel.read.attach(0)); blit(div);
      gl.useProgram(Pclear.p); gl.uniform2f(Pclear.u.texelSize, vel.tx, vel.ty); gl.uniform1i(Pclear.u.uTexture, pres.read.attach(0)); gl.uniform1f(Pclear.u.value, CFG.PRESSURE); blit(pres.write); pres.swap();
      gl.useProgram(Ppres.p); gl.uniform2f(Ppres.u.texelSize, vel.tx, vel.ty); gl.uniform1i(Ppres.u.uDivergence, div.attach(0));
      for (var i = 0; i < CFG.ITER; i++) { gl.uniform1i(Ppres.u.uPressure, pres.read.attach(1)); blit(pres.write); pres.swap(); }
      gl.useProgram(Pgrad.p); gl.uniform2f(Pgrad.u.texelSize, vel.tx, vel.ty); gl.uniform1i(Pgrad.u.uPressure, pres.read.attach(0)); gl.uniform1i(Pgrad.u.uVelocity, vel.read.attach(1)); blit(vel.write); vel.swap();
      gl.useProgram(Padv.p); gl.uniform2f(Padv.u.texelSize, vel.tx, vel.ty); var vid = vel.read.attach(0);
      gl.uniform1i(Padv.u.uVelocity, vid); gl.uniform1i(Padv.u.uSource, vid); gl.uniform1f(Padv.u.dt, dt); gl.uniform1f(Padv.u.dissipation, CFG.VEL_DISS); blit(vel.write); vel.swap();
      gl.uniform1i(Padv.u.uVelocity, vel.read.attach(0)); gl.uniform1i(Padv.u.uSource, dye.read.attach(1)); gl.uniform1f(Padv.u.dissipation, CFG.DENS_DISS); blit(dye.write); dye.swap();
    }
    function render() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.BLEND);
      gl.useProgram(Pdisp.p); gl.uniform2f(Pdisp.u.texelSize, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight); gl.uniform1i(Pdisp.u.uTexture, dye.read.attach(0)); blit(null);
    }

    var raf = 0, last = 0, lastMove = 0, px = 0, py = 0, seen = false, pend = null, mounted = false, dead = false;
    function frame(now) {
      raf = 0; if (dead || !fluidWanted()) { stop(); return; }
      var dt = Math.min((now - last) / 1000 || 0.016, 0.0167); last = now;
      if (size()) { /* viewport changed: buffers rebuilt */ }
      if (pend) { splat(pend.x, pend.y, pend.dx, pend.dy, pend.c); pend = null; }
      step(dt); render();
      if (now - lastMove < 2600) { raf = requestAnimationFrame(frame); } else { gl.clearColor(0, 0, 0, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clear(gl.COLOR_BUFFER_BIT); cv.style.opacity = '0'; }
    }
    function kick() { if (!mounted) { document.body.appendChild(cv); mounted = true; size(); } cv.style.opacity = '1'; lastMove = performance.now(); if (!raf) { last = lastMove; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } cv.style.opacity = '0'; if (dye) { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); init(); } }
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); dead = true; fluidState = -1; stop(); });
    return {
      move: function (x, y) {
        kick(); var tx = x / innerWidth, ty = 1 - y / innerHeight;
        if (!seen) { seen = true; px = tx; py = ty; return; }
        var ar = cv.width / cv.height, dx = tx - px, dy = ty - py;
        if (ar < 1) { dx *= ar; } if (ar > 1) { dy /= ar; }
        px = tx; py = ty;
        if (dx || dy) { pend = { x: tx, y: ty, dx: dx * CFG.FORCE, dy: dy * CFG.FORCE, c: color(1) }; }
      },
      click: function (x, y) { kick(); pend = { x: x / innerWidth, y: 1 - y / innerHeight, dx: 10 * (Math.random() - 0.5), dy: 30 * (Math.random() - 0.5), c: color(4) }; },
      leave: function () { seen = false; },
      stop: stop
    };
  }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !fluidWanted()) { return; }
    if (fluidState === 0) { fluid = createFluid(); fluidState = fluid ? 1 : -1; }
    if (fluidState === 1) { fluid.move(e.clientX, e.clientY); }
  }, { passive: true });
  document.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && fluidWanted() && fluidState === 1) { fluid.click(e.clientX, e.clientY); } }, { passive: true });
  root.addEventListener('mouseleave', function () { if (fluid && fluidState === 1) { fluid.leave(); } });

  /* ================================================================
     2. FOLLOW + RIPPLE CURSOR (Light + Gold)
     Cursify "follow cursor": a soft dot eases toward the pointer (lag ≈ 10 frames).
     On top of it: glowing ripples that leave the dot while the mouse moves and burst on click.
     The loop only runs while something is moving, fading or rippling.
     ================================================================ */
  var ripple = { cv: null, ctx: null, rings: [], raf: 0, lx: -999, ly: -999, lt: 0, dpr: 1,
                 x: 0, y: 0, tx: 0, ty: 0, a: 0, ta: 0, hot: 0, thot: 0, seen: false, prev: 0 };
  var RIPPLE = {
    classic: { rgb: '22,163,74', glow: 22, life: 1100, max: 70 },   /* #16A34A */
    golden: { rgb: '250,204,21', glow: 24, life: 1200, max: 76 }
  };
  var INTERACTIVE_RE = 'a, button, [role="tab"], summary, input, textarea, select, label, [data-lightbox]';
  function rippleActive() { return fluidState !== 1 && fineMQ.matches && !reduceMQ.matches && theme() === 'golden'; }
  function rippleCanvas() {
    if (ripple.cv) { return ripple.cv; }
    var cv = document.createElement('canvas'); cv.className = 'fx-ripple'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv); ripple.cv = cv; ripple.ctx = cv.getContext('2d'); sizeRipple();
    return cv;
  }
  function sizeRipple() {
    if (!ripple.cv) { return; }
    ripple.dpr = Math.min(window.devicePixelRatio || 1, 2);
    ripple.cv.width = innerWidth * ripple.dpr; ripple.cv.height = innerHeight * ripple.dpr;
    ripple.ctx.setTransform(ripple.dpr, 0, 0, ripple.dpr, 0, 0);
  }
  function kickRipple() { if (!ripple.raf) { ripple.prev = 0; ripple.raf = requestAnimationFrame(drawRipple); } }
  function spawnRipple(x, y, big) {
    rippleCanvas(); ripple.rings.push({ x: x, y: y, t: performance.now(), big: big });
    if (ripple.rings.length > 12) { ripple.rings.shift(); }
    kickRipple();
  }
  function drawRipple(now) {
    ripple.raf = 0;
    if (!ripple.ctx) { return; }
    var c = ripple.ctx, P = RIPPLE[theme()] || RIPPLE.classic, W = innerWidth, H = innerHeight;
    var dt = ripple.prev ? Math.min(50, now - ripple.prev) : 16.7; ripple.prev = now;
    var k = 1 - Math.pow(1 - 0.1, dt / 16.7);                       /* reference lag = 10, frame-rate independent */
    ripple.x += (ripple.tx - ripple.x) * k; ripple.y += (ripple.ty - ripple.y) * k;
    ripple.a += (ripple.ta - ripple.a) * Math.min(1, dt / 120); ripple.hot += (ripple.thot - ripple.hot) * Math.min(1, dt / 110);
    c.clearRect(0, 0, W, H);
    ripple.rings = ripple.rings.filter(function (r) {
      var p = Math.max(0, (now - r.t) / P.life); if (p >= 1) { return false; }
      var e = 1 - Math.pow(1 - p, 3), rad = (r.big ? 1.45 : 1) * P.max * e, al = Math.pow(1 - p, 1.4) * (r.big ? .6 : .42);
      c.beginPath(); c.arc(r.x, r.y, Math.max(0.1, rad), 0, 6.2832);
      c.lineWidth = 1.4 + 1.6 * (1 - p); c.strokeStyle = 'rgba(' + P.rgb + ',' + al.toFixed(3) + ')';
      c.shadowColor = 'rgba(' + P.rgb + ',.85)'; c.shadowBlur = P.glow * (1 - p * .6); c.stroke();
      return true;
    });
    if (ripple.a > 0.01) {                                           /* the lagging follower dot */
      var rd = 8 + 6 * ripple.hot;
      c.beginPath(); c.arc(ripple.x, ripple.y, rd, 0, 6.2832);
      c.fillStyle = 'rgba(' + P.rgb + ',' + ((0.5 - 0.22 * ripple.hot) * ripple.a).toFixed(3) + ')';
      c.shadowColor = 'rgba(' + P.rgb + ',.9)'; c.shadowBlur = P.glow * ripple.a; c.fill();
      c.beginPath(); c.arc(ripple.x, ripple.y, rd + 5 + 4 * ripple.hot, 0, 6.2832);
      c.lineWidth = 1; c.strokeStyle = 'rgba(' + P.rgb + ',' + (0.35 * ripple.a).toFixed(3) + ')'; c.shadowBlur = P.glow * 0.6 * ripple.a; c.stroke();
    }
    c.shadowBlur = 0;
    var moving = Math.abs(ripple.tx - ripple.x) + Math.abs(ripple.ty - ripple.y) > 0.15 || Math.abs(ripple.ta - ripple.a) > 0.01 || Math.abs(ripple.thot - ripple.hot) > 0.01;
    if (ripple.rings.length || moving) { ripple.raf = requestAnimationFrame(drawRipple); }
    else if (ripple.ta === 0) { c.clearRect(0, 0, W, H); }
  }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !rippleActive()) { return; }
    rippleCanvas();
    ripple.tx = e.clientX; ripple.ty = e.clientY; ripple.ta = 1;
    if (!ripple.seen) { ripple.seen = true; ripple.x = e.clientX; ripple.y = e.clientY; }
    ripple.thot = (e.target.closest && e.target.closest(INTERACTIVE_RE)) ? 1 : 0;
    var d = Math.hypot(e.clientX - ripple.lx, e.clientY - ripple.ly);
    if (d > 70 && e.timeStamp - ripple.lt > 140) { ripple.lx = e.clientX; ripple.ly = e.clientY; ripple.lt = e.timeStamp; spawnRipple(ripple.x, ripple.y, false); }
    kickRipple();
  }, { passive: true });
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && rippleActive()) { spawnRipple(e.clientX, e.clientY, true); }
  }, { passive: true });
  root.addEventListener('mouseleave', function () { ripple.ta = 0; ripple.seen = false; if (ripple.cv) { kickRipple(); } });
  window.addEventListener('resize', sizeRipple);

  /* ================================================================
     3. CYBER CURSOR FOLLOWER (Cyber only) — native cursor stays visible
     ================================================================ */
  var cy = { ring: null, dot: null, x: 0, y: 0, rx: 0, ry: 0, raf: 0, seen: false };
  var INTERACTIVE = 'a, button, [role="tab"], summary, input, textarea, select, label, [data-lightbox]';
  function cyberActive() { return fineMQ.matches && !reduceMQ.matches && theme() === 'cyber'; }
  function cyberEls() {
    if (cy.ring) { return; }
    cy.ring = document.createElement('div'); cy.ring.className = 'fx-cyber-ring'; cy.ring.setAttribute('aria-hidden', 'true');
    cy.dot = document.createElement('div'); cy.dot.className = 'fx-cyber-dot'; cy.dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cy.ring); document.body.appendChild(cy.dot);
  }
  function cyberLoop() {
    cy.raf = 0;
    cy.rx = lerp(cy.rx, cy.x, 0.16); cy.ry = lerp(cy.ry, cy.y, 0.16);
    cy.ring.style.transform = 'translate3d(' + cy.rx.toFixed(1) + 'px,' + cy.ry.toFixed(1) + 'px,0)';
    if (Math.abs(cy.x - cy.rx) + Math.abs(cy.y - cy.ry) > 0.2) { cy.raf = requestAnimationFrame(cyberLoop); }
  }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !cyberActive()) { return; }
    cyberEls();
    cy.x = e.clientX; cy.y = e.clientY;
    if (!cy.seen) { cy.seen = true; cy.rx = cy.x; cy.ry = cy.y; }
    cy.dot.style.transform = 'translate3d(' + cy.x + 'px,' + cy.y + 'px,0)';
    cy.ring.classList.add('is-visible'); cy.dot.classList.add('is-visible');
    var hot = !!(e.target.closest && e.target.closest(INTERACTIVE));
    cy.ring.classList.toggle('is-hot', hot);
    if (!cy.raf) { cy.raf = requestAnimationFrame(cyberLoop); }
  }, { passive: true });
  document.addEventListener('pointerdown', function () { if (cy.ring) { cy.ring.classList.add('is-down'); } }, { passive: true });
  document.addEventListener('pointerup', function () { if (cy.ring) { cy.ring.classList.remove('is-down'); } }, { passive: true });
  root.addEventListener('mouseleave', function () { if (cy.ring) { cy.ring.classList.remove('is-visible'); cy.dot.classList.remove('is-visible'); cy.seen = false; } });

  /* ================================================================
     4. CONTACT VISUALS — lazy, theme-gated canvas scenes
     ================================================================ */
  function Scene(canvas, themeName, factory, kind) {
    var self = this, host = canvas.parentElement;
    this.canvas = canvas; this.ctx = kind === 'gl' ? null : canvas.getContext('2d'); this.theme = themeName; this.lost = false;
    this.W = 0; this.H = 0; this.dpr = 1; this.raf = 0; this.visible = false; this.impl = null; this.factory = factory;
    this.ptr = { x: 0, y: 0, on: false, drag: false, dx: 0, dy: 0 };
    this.size = function () {
      var r = host.getBoundingClientRect(); if (!r.width) { return; }
      self.dpr = Math.min(window.devicePixelRatio || 1, 2); self.W = r.width; self.H = r.height;
      canvas.width = Math.round(self.W * self.dpr); canvas.height = Math.round(self.H * self.dpr);
      if (self.ctx) { self.ctx.setTransform(self.dpr, 0, 0, self.dpr, 0, 0); }
      if (self.impl && self.impl.resize) { self.impl.resize(self.W, self.H); }
      self.kick();
    };
    this.active = function () { return self.visible && !document.hidden && theme() === self.theme && host.offsetParent !== null; };
    this.frame = function (t) {
      self.raf = 0; if (!self.active() || self.lost) { return; }
      if (!self.impl) { self.impl = self.factory(self); if (self.impl.resize) { self.impl.resize(self.W, self.H); } }
      self.impl.draw(t, reduceMQ.matches);
      if (!reduceMQ.matches || self.ptr.drag) { self.raf = requestAnimationFrame(self.frame); }
    };
    this.kick = function () { if (!self.raf && self.active()) { self.raf = requestAnimationFrame(self.frame); } };
    /* pointer: hover + drag (horizontal drags rotate; vertical touch scrolling is left to the page) */
    var last = null;
    canvas.addEventListener('pointerdown', function (e) { self.ptr.drag = true; last = { x: e.clientX, y: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} canvas.classList.add('is-grabbing'); self.kick(); });
    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      self.ptr.x = e.clientX - r.left; self.ptr.y = e.clientY - r.top; self.ptr.on = e.pointerType === 'mouse' || self.ptr.drag;
      if (self.ptr.drag && last) { self.ptr.dx += e.clientX - last.x; self.ptr.dy += e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; }
      self.kick();
    });
    function end() { self.ptr.drag = false; last = null; canvas.classList.remove('is-grabbing'); }
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', function () { self.ptr.on = false; });
    if ('ResizeObserver' in window) { new ResizeObserver(this.size).observe(host); } else { window.addEventListener('resize', this.size); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; if (self.visible) { self.size(); self.kick(); } }, { rootMargin: '120px' }).observe(host);
    } else { this.visible = true; }
    this.size();
    document.addEventListener('visibilitychange', function () { self.kick(); });
    document.addEventListener('themechange', function () { self.kick(); });
  }
  /* consume (and reset) accumulated drag distance */
  function takeDrag(s) { var d = { x: s.ptr.dx, y: s.ptr.dy }; s.ptr.dx = 0; s.ptr.dy = 0; return d; }

  /* ---------- Plasma Ring (Gold): wireframe sphere whose silhouette glows ---------- */
  function plasmaRing(s) {
    var yaw = 0.6, pitch = 0.35, vyaw = 0, vpitch = 0, hover = 0, hx = 0, hy = 0, lastT = 0;
    var MER = 44, MSEG = 38, PAR = 11, PSEG = 64;
    var ramp = [[253, 224, 71], [245, 180, 40], [217, 119, 6], [146, 64, 14]];
    function color(u) { var p = clamp(u, 0, 1) * (ramp.length - 1), i = Math.min(ramp.length - 2, p | 0), f = p - i, a = ramp[i], b = ramp[i + 1];
      return [a[0] + (b[0] - a[0]) * f | 0, a[1] + (b[1] - a[1]) * f | 0, a[2] + (b[2] - a[2]) * f | 0]; }
    return {
      draw: function (t, still) {
        var c = s.ctx, W = s.W, H = s.H, R = Math.min(W, H) * 0.37, cx = W / 2, cy = H / 2;
        var dt = lastT ? Math.min(40, t - lastT) : 16; lastT = t;
        var d = takeDrag(s);
        if (d.x || d.y) { vyaw = d.x * 0.006; vpitch = d.y * 0.006; }
        yaw += vyaw + (s.ptr.drag || still ? 0 : dt * 0.00022); pitch += vpitch;
        vyaw *= 0.94; vpitch *= 0.94;
        var targetH = s.ptr.on ? 1 : 0; hover = lerp(hover, targetH, 0.08);
        if (s.ptr.on) { hx = clamp((s.ptr.x - cx) / R, -1.1, 1.1); hy = clamp(-(s.ptr.y - cy) / R, -1.1, 1.1); }
        var hz = Math.sqrt(Math.max(0, 1 - hx * hx - hy * hy)), hl = Math.hypot(hx, hy, hz) || 1; hx /= hl; hy /= hl; hz /= hl;
        var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), time = still ? 1200 : t;
        c.clearRect(0, 0, W, H); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineWidth = 1;
        /* soft inner haze */
        var g = c.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.25);
        g.addColorStop(0, 'rgba(245,158,11,0)'); g.addColorStop(0.8, 'rgba(245,158,11,.10)'); g.addColorStop(1, 'rgba(245,158,11,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        function vert(lat, lon, out) {
          var x = Math.cos(lat) * Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon);
          var x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
          var wave = 0.06 * Math.sin(3 * lon + time * 0.0007) * Math.sin(2 * lat - time * 0.0005);
          var near = Math.exp(-(1 - (x1 * hx + y2 * hy + z2 * hz)) * 9), bulge = hover * 0.2 * near;
          var r = 1 + wave + bulge, fres = Math.pow(1 - Math.abs(z2), 2.6);
          out.x = cx + x1 * r * R; out.y = cy - y2 * r * R;
          out.a = Math.min(1, 0.05 + fres * 1.1 + hover * near * 0.7) * (z2 < 0 ? 0.55 : 0.8);
          out.u = 1 - (lat + 1.5708) / 3.1416;
        }
        var A = { x: 0, y: 0, a: 0, u: 0 }, B = { x: 0, y: 0, a: 0, u: 0 }, m, i, col, al;
        function seg() {
          al = (A.a + B.a) / 2; if (al < 0.035) { return; }
          col = color((A.u + B.u) / 2);
          c.strokeStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + al.toFixed(2) + ')';
          c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke();
        }
        for (m = 0; m < MER; m++) {
          var lon = (m / MER) * 6.2832; vert(-1.5708, lon, A);
          for (i = 1; i <= MSEG; i++) { vert(-1.5708 + (i / MSEG) * 3.1416, lon, B); seg(); var T = A; A = B; B = T; }
        }
        for (m = 1; m <= PAR; m++) {
          var lat = -1.5708 + (m / (PAR + 1)) * 3.1416; vert(lat, 0, A);
          for (i = 1; i <= PSEG; i++) { vert(lat, (i / PSEG) * 6.2832, B); seg(); var T2 = A; A = B; B = T2; }
        }
        c.globalCompositeOperation = 'source-over';
      }
    };
  }

  /* ---------- Globe Mesh (Cyber): Fibonacci point cloud inside an icosahedron wireframe cage ----------
     After originkit "Globe Mesh": drifting colour waves (patch + expanding ring), a travelling shimmer on each cage edge,
     drag-to-spin, panels that light under the pointer. Additive blending, no depth test: the far side stays visible but dim. */
  function icosphere(detail) {
    var t = (1 + Math.sqrt(5)) / 2;
    function nrm(a) { var l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; }
    var v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nrm);
    var f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    var cache = {};
    function mid(a, b) { var k = a < b ? a + '_' + b : b + '_' + a; if (cache[k] !== undefined) { return cache[k]; } v.push(nrm([(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2])); return (cache[k] = v.length - 1); }
    for (var d = 0; d < detail; d++) { var nf = []; f.forEach(function (tr) { var a = tr[0], b = tr[1], c = tr[2], ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }); f = nf; }
    var seen = {}, e = [];
    f.forEach(function (tr) { for (var k = 0; k < 3; k++) { var a = tr[k], b = tr[(k + 1) % 3], key = a < b ? a + '_' + b : b + '_' + a; if (!seen[key]) { seen[key] = 1; e.push([a, b]); } } });
    return { v: v, f: f, e: e };
  }
  function globeMesh(s) {
    var ico = icosphere(2), V = ico.v, F = ico.f, E = ico.e, i, k;
    var cent = F.map(function (tr) { var x = 0, y = 0, z = 0; tr.forEach(function (n) { x += V[n][0]; y += V[n][1]; z += V[n][2]; }); var l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; });
    var lit = new Float32Array(F.length), seeds = E.map(function () { return Math.random(); });
    var N = 1100, pts = [];
    for (i = 0; i < N; i++) { var yy = 1 - (i + 0.5) / N * 2, rr = Math.sqrt(1 - yy * yy), th = i * 2.399963; pts.push([Math.cos(th) * rr, yy, Math.sin(th) * rr]); }
    var vx = new Float32Array(V.length), vy = new Float32Array(V.length), vz = new Float32Array(V.length), vw = V.map(function () { return [0, 0, 0]; });
    var COLS = [[252, 238, 9], [0, 240, 255], [255, 250, 215]];                    /* yellow · cyan · warm white (existing Cyber palette) */
    var yaw = 0.6, pitch = 0.35, vyaw = 0, vpitch = 0, lastT = 0;
    var dirs = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], rad = [0, 0, 0];
    function waves(t) { for (var q = 0; q < 3; q++) { var a = t * 0.00031 * (q + 1) + q * 2.1, b = t * 0.00023 * (q + 2) + q * 1.3; dirs[q] = [Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b)]; rad[q] = (((t * 0.00035 + q * 0.33) % 1) + 1) % 1 * 2.4; } }
    function wave(p, out) {
      var r = 0, g = 0, b = 0, w = 0;
      for (var q = 0; q < 3; q++) {
        var d = clamp(p[0] * dirs[q][0] + p[1] * dirs[q][1] + p[2] * dirs[q][2], -1, 1), ang = Math.acos(d);
        var wv = Math.exp(-(1 - d) * 6) * 0.75 + Math.exp(-Math.pow((ang - rad[q]) / 0.17, 2)) * (1 - rad[q] / 2.4) * 0.95;
        r += COLS[q][0] * wv; g += COLS[q][1] * wv; b += COLS[q][2] * wv; w += wv;
      }
      out[0] = r; out[1] = g; out[2] = b; return w;
    }
    var tint = [0, 0, 0];
    return {
      draw: function (t, still) {
        var c = s.ctx, W = s.W, H = s.H, R = Math.min(W, H) * 0.4, cx = W / 2, cy = H / 2;
        var dt = lastT ? Math.min(40, t - lastT) : 16; lastT = t;
        var d = takeDrag(s); if (d.x || d.y) { vyaw = d.x * 0.006; vpitch = d.y * 0.004; }
        yaw += vyaw + (s.ptr.drag || still ? 0 : dt * 0.00024); pitch = clamp(pitch + vpitch, -1.1, 1.1); vyaw *= 0.94; vpitch *= 0.94;
        var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), time = still ? 4000 : t;
        waves(time);
        c.clearRect(0, 0, W, H);
        var halo = c.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.2); halo.addColorStop(0, 'rgba(0,240,255,.10)'); halo.addColorStop(0.6, 'rgba(252,238,9,.05)'); halo.addColorStop(1, 'rgba(0,240,255,0)');
        c.fillStyle = halo; c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = 'lighter';
        for (i = 0; i < V.length; i++) {                                           /* cage vertices */
          var p = V[i], x1 = p[0] * cyw + p[2] * syw, z1 = -p[0] * syw + p[2] * cyw, y2 = p[1] * cp - z1 * sp, z2 = p[1] * sp + z1 * cp;
          vx[i] = cx + x1 * R; vy[i] = cy - y2 * R; vz[i] = z2; wave(p, vw[i]);
        }
        /* hover: pointer ray → sphere → object space → nearest panel */
        var best = -1, hit = null;
        if (s.ptr.on) {
          var nx = (s.ptr.x - cx) / R, ny = -(s.ptr.y - cy) / R, r2 = nx * nx + ny * ny;
          if (r2 < 1) { var nz = Math.sqrt(1 - r2), zz = -ny * sp + nz * cp, yo = ny * cp + nz * sp; hit = [nx * cyw - zz * syw, yo, nx * syw + zz * cyw]; var bd = -2; for (k = 0; k < cent.length; k++) { var dd = cent[k][0] * hit[0] + cent[k][1] * hit[1] + cent[k][2] * hit[2]; if (dd > bd) { bd = dd; best = k; } } }
        }
        for (k = 0; k < F.length; k++) {
          var tg = k === best ? 1 : (hit && cent[k][0] * hit[0] + cent[k][1] * hit[1] + cent[k][2] * hit[2] > 0.955 ? 0.4 : 0);
          lit[k] += (tg - lit[k]) * 0.16;
          if (lit[k] > 0.02) {
            var tr = F[k], za = (vz[tr[0]] + vz[tr[1]] + vz[tr[2]]) / 3; if (za < -0.15) { continue; }
            c.beginPath(); c.moveTo(vx[tr[0]], vy[tr[0]]); c.lineTo(vx[tr[1]], vy[tr[1]]); c.lineTo(vx[tr[2]], vy[tr[2]]); c.closePath();
            c.fillStyle = 'rgba(252,238,9,' + (0.26 * lit[k]).toFixed(3) + ')'; c.fill();
            c.strokeStyle = 'rgba(252,238,9,' + (0.85 * lit[k]).toFixed(3) + ')'; c.lineWidth = 1.2; c.stroke();
          }
        }
        c.lineWidth = 0.8;
        for (i = 0; i < E.length; i++) {                                           /* cage edges + shimmer head */
          var a = E[i][0], b = E[i][1], f = (vz[a] + vz[b]) / 2, al = f > 0 ? 0.2 + 0.4 * f : 0.07;
          var mr = (vw[a][0] + vw[b][0]) * 0.5, mg = (vw[a][1] + vw[b][1]) * 0.5, mb = (vw[a][2] + vw[b][2]) * 0.5;
          c.strokeStyle = 'rgba(' + clamp(mr * 0.5 | 0, 0, 255) + ',' + clamp(110 + mg * 0.6 | 0, 0, 255) + ',' + clamp(130 + mb * 0.5 | 0, 0, 255) + ',' + clamp(al + (mr + mg + mb) * 0.0007, 0, 0.95).toFixed(2) + ')';
          c.beginPath(); c.moveTo(vx[a], vy[a]); c.lineTo(vx[b], vy[b]); c.stroke();
          var u = ((time * 0.00042 + seeds[i]) % 1 + 1) % 1, u2 = Math.min(1, u + 0.2);
          if (f > -0.1) {
            c.strokeStyle = 'rgba(252,238,9,' + (0.75 * clamp(0.35 + f, 0, 1)).toFixed(2) + ')'; c.lineWidth = 1.5;
            c.beginPath(); c.moveTo(vx[a] + (vx[b] - vx[a]) * u, vy[a] + (vy[b] - vy[a]) * u); c.lineTo(vx[a] + (vx[b] - vx[a]) * u2, vy[a] + (vy[b] - vy[a]) * u2); c.stroke(); c.lineWidth = 0.8;
          }
        }
        for (i = 0; i < N; i++) {                                                  /* point cloud, radius 0.9 inside the cage */
          var q = pts[i], w = wave(q, tint), lift = 0.9 * (1 + 0.035 * Math.min(1, w));
          var X = q[0] * cyw + q[2] * syw, Z1 = -q[0] * syw + q[2] * cyw, Y = q[1] * cp - Z1 * sp, Zv = q[1] * sp + Z1 * cp;
          var al2 = Zv > 0 ? 0.34 + 0.62 * Zv : 0.12, sz = Zv > 0 ? 1.4 + 1.3 * Zv : 1.0;
          c.fillStyle = 'rgba(' + clamp(255 * 0.92 + tint[0] * 0.25 | 0, 0, 255) + ',' + clamp(246 * 0.92 + tint[1] * 0.25 | 0, 0, 255) + ',' + clamp(210 * 0.9 + tint[2] * 0.3 | 0, 0, 255) + ',' + clamp(al2 + w * 0.2, 0, 1).toFixed(2) + ')';
          c.fillRect(cx + X * R * lift - sz / 2, cy - Y * R * lift - sz / 2, sz, sz);
        }
        c.globalCompositeOperation = 'source-over';
      }
    };
  }

  /* ---------- Dotted Earth (Light): land dots, outlines, 15° graticule, Lviv marker, drag with momentum ----------
     After originkit "Globe" (Natural Earth in the original). Land shapes come from js/land.js (coarse hand-digitised outlines). */
  var landReady = !!window.PORTFOLIO_LAND, landCbs = [];
  function loadLand(cb) {
    if (window.PORTFOLIO_LAND) { cb(); return; }
    landCbs.push(cb); if (landCbs.length > 1) { return; }
    var sc = document.createElement('script'); sc.src = SCRIPT_BASE + 'land.js'; sc.async = true;
    sc.onload = function () { landReady = true; landCbs.splice(0).forEach(function (f) { f(); }); };
    document.head.appendChild(sc);
  }
  function earthEntry(s) {
    if (!window.PORTFOLIO_LAND) { loadLand(function () { s.impl = null; s.kick(); }); return { draw: function () {} }; }
    return earthDots(s);
  }
  function earthDots(s) {
    var D = Math.PI / 180, L = window.PORTFOLIO_LAND, i, j;
    function toPoly(a) { var p = [], x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (var n = 0; n < a.length; n += 2) { p.push([a[n], a[n + 1]]); x0 = Math.min(x0, a[n]); x1 = Math.max(x1, a[n]); y0 = Math.min(y0, a[n + 1]); y1 = Math.max(y1, a[n + 1]); } return { p: p, b: [x0, x1, y0, y1] }; }
    function inPoly(pl, x, y) {
      var b = pl.b; if (x < b[0] || x > b[1] || y < b[2] || y > b[3]) { return false; }
      var p = pl.p, ins = false, n = p.length;
      for (var a = 0, c = n - 1; a < n; c = a++) { if (((p[a][1] > y) !== (p[c][1] > y)) && (x < (p[c][0] - p[a][0]) * (y - p[a][1]) / (p[c][1] - p[a][1]) + p[a][0])) { ins = !ins; } }
      return ins;
    }
    var land = L.land.map(toPoly), water = L.water.map(toPoly);
    function isLand(lon, lat) { var k; for (k = 0; k < land.length; k++) { if (inPoly(land[k], lon, lat)) { for (var w = 0; w < water.length; w++) { if (inPoly(water[w], lon, lat)) { return false; } } return true; } } return false; }
    function vec(lat, lon) { lat *= D; lon *= D; return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)]; }
    /* land dots on a Fibonacci sphere */
    var N = 4600, dots = [];
    for (i = 0; i < N; i++) { var y = 1 - (i + 0.5) / N * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963, x = Math.cos(th) * r, z = Math.sin(th) * r;
      if (isLand(Math.atan2(x, z) / D, Math.asin(y) / D)) { dots.push(x, y, z); } }
    /* outlines (densified so they follow the curvature) and 15° graticule */
    function polyline(pts, closed) { var out = [], n = pts.length;
      for (var a = 0; a < (closed ? n : n - 1); a++) { var p = pts[a], q = pts[(a + 1) % n], steps = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 2.5));
        for (var k = 0; k < steps; k++) { var f = k / steps; out.push(vec(p[1] + (q[1] - p[1]) * f, p[0] + (q[0] - p[0]) * f)); } }
      return out; }
    var outlines = land.concat(water).map(function (pl) { return polyline(pl.p, true); });
    var grat = [], la, lo;
    for (la = -75; la <= 75; la += 15) { var ring = []; for (lo = 0; lo <= 360; lo += 5) { ring.push(vec(la, lo)); } grat.push(ring); }
    for (lo = 0; lo < 360; lo += 15) { var mer = []; for (la = -90; la <= 90; la += 5) { mer.push(vec(la, lo)); } grat.push(mer); }
    var home = vec(49.84, 24.03);
    var yaw = -24.03 * D, pitch = 23 * D, vyaw = 0, vpitch = 0, lastT = 0;
    var bins = [[], [], [], []];
    return {
      draw: function (t, still) {
        var c = s.ctx, W = s.W, H = s.H, R = Math.min(W, H) * 0.4, cx = W / 2, cy = H / 2;
        var dt = lastT ? Math.min(40, t - lastT) : 16; lastT = t;
        var d = takeDrag(s); if (d.x || d.y) { vyaw = d.x * 0.0065; vpitch = d.y * 0.004; }
        yaw += vyaw + (s.ptr.drag || s.ptr.on || still ? 0 : dt * 0.00021);              /* stops while hovered, like the reference */
        pitch = clamp(pitch + vpitch, -1.2, 1.2); vyaw *= 0.95; vpitch *= 0.93;
        var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
        function proj(p, o) { var x1 = p[0] * cyw + p[2] * syw, z1 = -p[0] * syw + p[2] * cyw; o.y = cy - (p[1] * cp - z1 * sp) * R; o.x = cx + x1 * R; o.z = p[1] * sp + z1 * cp; return o; }
        var o = { x: 0, y: 0, z: 0 };
        c.clearRect(0, 0, W, H);
        var halo = c.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.22); halo.addColorStop(0, 'rgba(74,222,128,.16)'); halo.addColorStop(1, 'rgba(74,222,128,0)');
        c.fillStyle = halo; c.fillRect(0, 0, W, H);
        var body = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);              /* ocean body: lit from the upper left */
        body.addColorStop(0, 'rgba(36,128,78,.55)'); body.addColorStop(0.55, 'rgba(10,46,30,.78)'); body.addColorStop(1, 'rgba(5,22,15,.92)');
        c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.fillStyle = body; c.fill();
        c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.clip();
        /* graticule */
        c.strokeStyle = 'rgba(74,222,128,.15)'; c.lineWidth = 0.6; c.beginPath();
        grat.forEach(function (line) { var on = false; for (var a = 0; a < line.length; a++) { proj(line[a], o); if (o.z > 0) { if (!on) { c.moveTo(o.x, o.y); on = true; } else { c.lineTo(o.x, o.y); } } else { on = false; } } });
        c.stroke();
        /* land dots, binned by facing so each bin is one fill */
        bins.forEach(function (b) { b.length = 0; });
        for (i = 0; i < dots.length; i += 3) { var x1 = dots[i] * cyw + dots[i + 2] * syw, z1 = -dots[i] * syw + dots[i + 2] * cyw, zv = dots[i + 1] * sp + z1 * cp;
          if (zv > 0) { var bi = zv < 0.25 ? 0 : zv < 0.5 ? 1 : zv < 0.75 ? 2 : 3; bins[bi].push(cx + x1 * R, cy - (dots[i + 1] * cp - z1 * sp) * R); } }
        var BA = [0.32, 0.55, 0.8, 0.96], DR = [0.9, 1.1, 1.3, 1.45];
        for (j = 0; j < 4; j++) { c.fillStyle = 'rgba(214,247,228,' + BA[j] + ')'; c.beginPath(); var bn = bins[j]; for (i = 0; i < bn.length; i += 2) { c.moveTo(bn[i] + DR[j], bn[i + 1]); c.arc(bn[i], bn[i + 1], DR[j], 0, 6.2832); } c.fill(); }
        /* outlines */
        c.strokeStyle = 'rgba(74,222,128,.55)'; c.lineWidth = 0.8; c.beginPath();
        outlines.forEach(function (line) { var on = false; for (var a = 0; a < line.length; a++) { proj(line[a], o); if (o.z > 0) { if (!on) { c.moveTo(o.x, o.y); on = true; } else { c.lineTo(o.x, o.y); } } else { on = false; } } });
        c.stroke();
        c.restore();
        /* sheen + rim */
        var sheen = c.createRadialGradient(cx - R * 0.4, cy - R * 0.45, 0, cx - R * 0.4, cy - R * 0.45, R * 0.9); sheen.addColorStop(0, 'rgba(255,255,255,.10)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
        c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.fillStyle = sheen; c.fill();
        c.save(); c.shadowColor = 'rgba(74,222,128,.7)'; c.shadowBlur = 14; c.strokeStyle = 'rgba(110,231,160,.6)'; c.lineWidth = 1.1; c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.stroke(); c.restore();
        /* Lviv marker */
        proj(home, o);
        if (o.z > 0.08) {
          var ph = still ? 0.45 : (t % 2000) / 2000;
          c.strokeStyle = 'rgba(134,239,172,' + (0.85 * (1 - ph)).toFixed(2) + ')'; c.lineWidth = 1.4; c.beginPath(); c.arc(o.x, o.y, 4 + ph * 15, 0, 6.2832); c.stroke();
          c.save(); c.shadowColor = '#4ADE80'; c.shadowBlur = 12; c.fillStyle = '#F0FDF4'; c.beginPath(); c.arc(o.x, o.y, 3.2, 0, 6.2832); c.fill(); c.restore();
          c.fillStyle = 'rgba(220,252,231,.95)'; c.font = '600 ' + Math.max(9, R * 0.075) + 'px Inter, sans-serif'; c.fillText('Lviv', o.x + 9, o.y - 8);
        }
      }
    };
  }

  var SCENES = { earth: ['classic', earthEntry], ring: ['golden', plasmaRing], mesh: ['cyber', globeMesh] };
  var made = {};
  function mountScenes() {
    $$('canvas[data-fx]').forEach(function (cv) {
      var key = cv.getAttribute('data-fx'), def = SCENES[key];
      if (!def || made[key]) { return; }
      made[key] = true;
      /* build a scene only the first time its theme is active — nothing heavy runs for hidden themes */
      new Scene(cv, def[0], def[1], def[2]);
    });
  }
  /* defer creating scenes until the contact section is near the viewport */
  var contact = document.querySelector('.contact__visual');
  if (contact) {
    if ('IntersectionObserver' in window) {
      var lazy = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { mountScenes(); lazy.disconnect(); } }, { rootMargin: '300px' });
      lazy.observe(contact);
    } else { mountScenes(); }
  }

  /* ================================================================
     Theme switching: announce it, and clean up effects that no longer apply
     ================================================================ */
  function onTheme() {
    document.dispatchEvent(new Event('themechange'));
    var t = theme();
    if (fluid && fluidState === 1 && !fluidWanted()) { fluid.stop(); }
    if (gd.el && t !== 'golden') { gd.seen = false; gd.hot = false; gd.el.classList.remove('is-hot'); }
    if (sc.el && t !== 'classic') { sc.seen = false; sc.hot = false; sc.el.classList.remove('is-hot', 'is-down'); }
    if (ripple.cv && t !== 'golden') { ripple.rings = []; ripple.a = ripple.ta = 0; ripple.seen = false; ripple.ctx.setTransform(1, 0, 0, 1, 0, 0); ripple.ctx.clearRect(0, 0, ripple.cv.width, ripple.cv.height); ripple.ctx.setTransform(ripple.dpr, 0, 0, ripple.dpr, 0, 0); }
    if (cy.ring && t !== 'cyber') { cy.ring.classList.remove('is-visible', 'is-hot', 'is-down'); cy.dot.classList.remove('is-visible'); cy.seen = false; }
  }
  new MutationObserver(onTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  var motionChange = function () { onTheme(); };
  if (reduceMQ.addEventListener) { reduceMQ.addEventListener('change', motionChange); fineMQ.addEventListener('change', motionChange); }
})();
