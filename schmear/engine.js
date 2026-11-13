// Schmear 2.0 Try It -> the plugin's own DSP (schmear2_wasm.cpp: Lox + Berry). The panel reports
// flavor 0/1, detune in cents (3/6/9), chorus 1/2, bump 0/1, hiss 0-100, hissOn 0/1, mix %, input
// and output dB, bypass; the engine takes them by index (see schmear2_wasm.cpp).
// inputDb: the clips peak at -1 dBFS; -9 dB puts them at a tracked source's -10 dBFS peak (2026-11-05, Justin)
const IDS = ['female', 'female2', 'female3', 'male', 'male2', 'male3', 'male4', 'male5', 'backing', 'gang', 'drumkit', 'edrums1', 'edrums2', 'bass', 'synthbass', '808', 'acoustic', 'electric', 'electric2', 'rubber', 'pad', 'mellotron'];
PbDemo.start({
  root: '#schmear-try-it', wasm: 'schmear.wasm?v=41b696e5a0', inputDb: -9, debug: '__schmearDemo',
  clips: Object.fromEntries(IDS.map(id => [id, 'clips/' + id + '.m4a'])),
  toEngine(id, value) {
    const v = typeof value === 'boolean' ? (value ? 1 : 0) : +value;
    if (!Number.isFinite(v)) return null;
    switch (id) {
      case 'detune': return [0, Math.max(0, Math.min(2, Math.round(v / 3) - 1))];   // 3 / 6 / 9 cents -> 0 / 1 / 2
      case 'mix': return [1, v];
      case 'input': return [2, v];
      case 'output': return [3, v];
      case 'bypass': return [4, v];
      case 'flavor': return [5, v];
      case 'chorus': return [6, v - 1];                                                 // I / II -> 0 / 1
      case 'bump': return [7, v];
      case 'hiss': return [8, v];
      case 'hissOn': return [9, v];
      default: return null;
    }
  }
});
