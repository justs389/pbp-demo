// Microwave Try It -> the plugin's own DSP (microwave_wasm.cpp). The panel reports knobs in
// plugin units (drive/wobble/noise/wild 0-10, mix %, input/output dB) and switches as booleans;
// the engine takes them by index in microwave_wasm.cpp's order. WILD's knob is the plugin's
// wildamt, its button the plugin's wild switch. LINK only moves the panel's trims.
// inputDb: the clips peak at -1 dBFS; -9 dB puts them at a tracked source's -10 dBFS peak (2026-11-05, Justin)
const ORDER = ['drive', 'wobble', 'noise', 'bypass', 'mix', 'output', 'wild', 'wildamt', 'mic', 'speaker', 'input'];
const INDEX = Object.fromEntries(ORDER.map((id, i) => [id, i]));
PbDemo.start({
  root: '#microwave-try-it', wasm: 'microwave.wasm?v=f5a71a3559', inputDb: -9, debug: '__microwaveDemo',
  clips: Object.fromEntries(['female',  'female2',  'female3',  'male',  'male2',  'male3',  'male4',  'male5',  'backing',  'gang',  'drumkit',  'edrums1',  'edrums2',  'bass',  'synthbass',  '808',  'acoustic',  'electric',  'electric2',  'rubber',  'pad',  'mellotron'].map(id => [id, 'clips/' + id + '.m4a'])),
  toEngine(id, value) {
    if (id === 'wild') id = 'wildamt';
    else if (id === 'wildOn') id = 'wild';
    if (!(id in INDEX)) return null;
    const v = typeof value === 'boolean' ? (value ? 1 : 0) : +value;
    return Number.isFinite(v) ? [INDEX[id], v] : null;
  }
});
