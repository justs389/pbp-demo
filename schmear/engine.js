// Schmear Try It -> Schmear engine. Indexes per params.json; the panel reports detune as cents.
// inputDb: the clips peak at -1 dBFS; -9 dB puts them at a tracked vocal's -10 dBFS peak into the plugin (2026-11-05, Justin)
PbDemo.start({
  root: '#schmear-try-it', wasm: 'schmear.wasm?v=6900d428cf', inputDb: -9, debug: '__schmearDemo',
  clips: Object.fromEntries(['female', 'female2', 'female3', 'male', 'male2', 'male3', 'male4', 'male5', 'backing', 'gang', 'guitar', 'electric', 'bass'].map(id => [id, 'clips/' + id + '.m4a'])),
  toEngine(id, value) {
    switch (id) {
      case 'detune': return [0, Math.max(0, Math.min(2, Math.round(value / 3) - 1))];
      case 'mix': return [1, +value];
      case 'input': return [2, +value];
      case 'output': return [3, +value];
      case 'bypass': return [4, value ? 1 : 0];
      default: return null;
    }
  }
});
