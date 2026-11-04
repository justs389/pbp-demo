// Shared glue between a Try It player (a Design canvas rendered by support.js) and a Pizza
// Bagel engine (.wasm in worklet.js). Each demo's engine.js calls PbDemo.start({...}) with:
//   root      selector of the player's root element (it carries el.tryIt hooks and emits
//             `transport` {action, clip} and `change` {id, value} events)
//   wasm      engine file next to the page
//   clips     {clipId: file} relative to the page
//   toEngine  (id, value) -> [paramIndex, number] or null (see <slug>/params.json)
//   meters    optional window property name that receives {comp, deess, gate} GR in dB (~80 ms)
//   debug     window property name for a small inspection handle
window.PbDemo = {
  start(cfg) {
    const base = new URL('.', document.currentScript ? document.currentScript.src : location.href);
    const FAIL = 'The audio engine could not start here. It needs a current Chrome, Firefox, Edge or Safari; some in-app browsers (Instagram, Facebook) block it, so open this page in your regular browser.';
    const msg = {};                                   // engine index -> value, the full current state
    let el, ctx, node, src, decoded = {}, token = null, playing = false;

    function fromUI(id, value) {
      const m = cfg.toEngine(id, value);
      if (!m) return;
      msg[m[0]] = m[1];
      if (node) node.port.postMessage({ [m[0]]: m[1] });
    }
    // Safari only unlocks audio inside the click's own call stack: create and resume the
    // context synchronously in the transport handler, load afterwards.
    function unlock() {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
      const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate); s.connect(ctx.destination); s.start();
    }
    async function ensureEngine() {
      if (node) return;
      const [bytes] = await Promise.all([
        fetch(new URL(cfg.wasm, base)).then(r => { if (!r.ok) throw new Error('wasm ' + r.status); return r.arrayBuffer(); }),
        ctx.audioWorklet.addModule(new URL('worklet.js', base))
      ]);
      const module = await WebAssembly.compile(bytes);
      node = new AudioWorkletNode(ctx, 'pb-engine', { processorOptions: { module }, outputChannelCount: [2] });
      node.connect(ctx.destination);
      if (cfg.meters) { window[cfg.meters] = { comp: 0, deess: 0, gate: 0, raw: [0, 0, 0] }; node.port.onmessage = (e) => { const m = e.data && e.data.meters; if (m) window[cfg.meters] = { comp: m[0], deess: m[1], gate: m[2], raw: m }; }; }
      const cur = el.tryIt.getParams();
      for (const id in cur) fromUI(id, cur[id]);
      node.port.postMessage(msg);
    }
    async function clip(id) {
      const file = cfg.clips[id] || ('clips/' + id + '.m4a');   // never silently substitute another clip
      if (!cfg.clips[id]) console.warn('[pbp demo] clip not in config, trying', file);
      if (!decoded[id]) {
        const r = await fetch(new URL(file, base));
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
        if (token !== mine) return;                   // a newer play/stop won
        stopSrc();
        src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(node); src.start();
        playing = true;
        el.tryIt.ready();
      } catch (e) {
        console.error('[pbp demo]', e);
        stopSrc(); playing = false;
        el.tryIt.fail(FAIL);
      }
    }
    function stop() { token = {}; stopSrc(); playing = false; if (cfg.meters) window[cfg.meters] = { comp: 0, deess: 0, gate: 0, raw: [0, 0, 0] }; }

    function reportHeight() {
      if (window.parent === window || !el) return;
      const r = el.getBoundingClientRect();
      parent.postMessage({ type: 'pbp-height', height: Math.ceil(r.bottom + window.scrollY + 4) }, '*');
    }
    function wire(root) {
      el = root;
      el.addEventListener('transport', (e) => {
        const { action, clip: id } = e.detail || {};
        if (action === 'play') play(id);
        else if (action === 'stop') stop();
        else if (action === 'clip' && playing) play(id);
      });
      el.addEventListener('change', (e) => { const { id, value } = e.detail || {}; fromUI(id, value); });
      if (window.ResizeObserver) { new ResizeObserver(reportHeight).observe(el); window.addEventListener('load', reportHeight); reportHeight(); }
    }
    if (cfg.debug) window[cfg.debug] = { get ctx() { return ctx; }, get node() { return node; }, get playing() { return playing; }, msg };
    // The canvas mounts asynchronously (React boots after support.js loads).
    const tryWire = () => { const r = document.querySelector(cfg.root); if (r && r.tryIt) { wire(r); return true; } return false; };
    if (!tryWire()) { const mo = new MutationObserver(() => { if (tryWire()) mo.disconnect(); }); mo.observe(document.documentElement, { childList: true, subtree: true }); }
  }
};
