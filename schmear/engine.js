// Glue between the Try It player (Design canvas, rendered by support.js) and the Schmear
// engine (dist/schmear.wasm in worklet.js). The canvas emits `transport` and `change`
// events on #schmear-try-it and exposes el.tryIt.{ready,fail,getParams}; nothing here
// touches its DOM.
(() => {
  const base = new URL('.', document.currentScript.src);
  const CLIPS = { female: 'clips/female-vocal.m4a', male: 'clips/male-vocal.m4a', guitar: 'clips/acoustic-guitar.m4a',
                  electric: 'clips/electric-guitar.m4a', bass: 'clips/bass-guitar.m4a' };
  const FAIL = 'The audio engine could not start here. It needs a current Chrome, Firefox, Edge or Safari; some in-app browsers (Instagram, Facebook) block it, so open this page in your regular browser.';
  const IDX = { detune: 0, mix: 1, input: 2, output: 3, bypass: 4 };   // params.json
  const p = { detune: 2, mix: 100, input: 0, output: 0, bypass: 0 };   // engine ranges
  let el, ctx, node, src, decoded = {}, token = null, playing = false;

  // The panel reports detune as its cents (3/6/9); the engine wants the choice index.
  function fromUI(id, value) {
    if (id === 'detune') p.detune = Math.max(0, Math.min(2, Math.round(value / 3) - 1));
    else if (id === 'bypass') p.bypass = value ? 1 : 0;
    else if (id in p) p[id] = +value;
    if (node) node.port.postMessage(toMsg());
  }
  const toMsg = () => { const m = {}; for (const id in IDX) m[IDX[id]] = p[id]; return m; };

  // Safari only unlocks audio inside the click's own call stack, so the context is created
  // and resumed synchronously in the transport handler; loading happens after.
  function unlock() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate); s.connect(ctx.destination); s.start();
  }
  async function ensureEngine() {
    if (node) return;
    const [bytes] = await Promise.all([
      fetch(new URL('schmear.wasm', base)).then(r => { if (!r.ok) throw new Error('wasm ' + r.status); return r.arrayBuffer(); }),
      ctx.audioWorklet.addModule(new URL('worklet.js', base))
    ]);
    const module = await WebAssembly.compile(bytes);
    node = new AudioWorkletNode(ctx, 'pb-engine', { processorOptions: { module }, outputChannelCount: [2] });
    node.connect(ctx.destination);
    const cur = el.tryIt.getParams();
    for (const id in cur) fromUI(id, cur[id]);
  }
  async function clip(id) {
    if (!decoded[id]) {
      const r = await fetch(new URL(CLIPS[id] || CLIPS.female, base));
      if (!r.ok) throw new Error('clip ' + r.status);
      decoded[id] = await ctx.decodeAudioData(await r.arrayBuffer());
    }
    return decoded[id];
  }
  function stopSrc() { if (src) { try { src.stop(); } catch (e) {} src.disconnect(); src = null; } }
  async function play(id) {
    const mine = token = {};
    try {
      unlock();
      await ensureEngine();
      const buf = await clip(id);
      if (token !== mine) return;                       // a newer play/stop won
      stopSrc();
      src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(node); src.start();
      playing = true;
      el.tryIt.ready();
    } catch (e) {
      console.error('[schmear demo]', e);
      stopSrc(); playing = false;
      el.tryIt.fail(FAIL);
    }
  }
  function stop() { token = {}; stopSrc(); playing = false; }

  function wire(root) {
    el = root;
    el.addEventListener('transport', (e) => {
      const { action, clip: id } = e.detail || {};
      if (action === 'play') play(id);
      else if (action === 'stop') stop();
      else if (action === 'clip' && playing) play(id);
    });
    el.addEventListener('change', (e) => { const { id, value } = e.detail || {}; fromUI(id, value); });
  }
  window.__schmearDemo = { get ctx() { return ctx; }, get node() { return node; }, get playing() { return playing; }, p };   // for tests

  // The canvas mounts asynchronously (React boots after support.js loads its runtime).
  const tryWire = () => { const r = document.querySelector('#schmear-try-it'); if (r && r.tryIt) { wire(r); return true; } return false; };
  if (!tryWire()) { const mo = new MutationObserver(() => { if (tryWire()) mo.disconnect(); }); mo.observe(document.documentElement, { childList: true, subtree: true }); }

  // Embedded in the product page: report the player's height so the iframe can fit without
  // scrollbars. The runtime pins html/body to 100% of the frame, so measure the element.
  function reportHeight() {
    if (window.parent === window || !el) return;
    const r = el.getBoundingClientRect();
    parent.postMessage({ type: 'pbp-height', height: Math.ceil(r.bottom + window.scrollY + 4) }, '*');
  }
  const armHeight = () => { if (!el || !window.ResizeObserver) return; new ResizeObserver(reportHeight).observe(el); window.addEventListener('load', reportHeight); reportHeight(); };
  if (el) armHeight(); else { const mo2 = new MutationObserver(() => { if (el) { mo2.disconnect(); armHeight(); } }); mo2.observe(document.documentElement, { childList: true, subtree: true }); }
})();
