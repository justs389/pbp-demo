// JJG Vocals Try It -> the real JJG processor. The panel reports the plugin's own ids
// (choices as index numbers, switches as booleans, knobs in plugin units); the engine takes
// them by index in params.json order. monoInput is fixed by the wrapper.
const ORDER = ['inputGain', 'outputGain', 'mix', 'autoGain', 'preampType', 'tapeDrive', 'warmth', 'tapeMode', 'tapeSpeed', 'wowFlutter',
  'hpfFreq', 'eqLow', 'eqHigh', 'eqLowConsole', 'eqHighConsole', 'lowMidCut', 'lowMidFreq', 'highMidBoost',
  'compType', 'compAmount', 'compMix', 'compAutoGain', 'comp76Ratio', 'gateThreshold',
  'deesser', 'deesserModel', 'deesser902Hf', 'deesserListen', 'salt', 'saltCurve',
  'driveOn', 'warmthOn', 'wowOn', 'gateOn', 'hpfOn', 'eqLowOn', 'eqHighOn', 'lowMidOn', 'highMidOn', 'compOn', 'deesserOn', 'saltOn',
  'boxSound', 'deskOn', 'hq', 'multiband', 'multibandFlavor', 'multibandOn', 'masterBypass', 'lowLatency', 'monoInput'];
const INDEX = Object.fromEntries(ORDER.map((id, i) => [id, i]));
// MB COMP: the panel lists flavours Plain, Wheat, Poppy, Sesame, Jalapeño; the plugin's choice indexes are Plain 0, Poppy 1, Sesame 2, Jalapeño 3, Wheat 4
const MB_PANEL_TO_PLUGIN = [0, 4, 1, 2, 3];
// inputDb: the clips peak at -1 dBFS; -9 dB puts them at a tracked vocal's -10 dBFS peak into the plugin (2026-11-05, Justin)
PbDemo.start({
  root: '#jjg-try-it', wasm: 'jjg.wasm?v=0c9a846dce', debug: '__jjgDemo', inputDb: -9, meters: '__jjgMeters',
  clips: Object.fromEntries(['female', 'female2', 'female3', 'male', 'male2', 'male3', 'male4', 'male5', 'backing', 'gang', 'drumkit', 'edrums1', 'edrums2', 'bass', 'synthbass', '808', 'acoustic', 'electric', 'electric2', 'rubber', 'pad', 'mellotron'].map(id => [id, 'clips/' + id + '.m4a'])),
  toEngine(id, value) {
    if (id === 'bypass') id = 'masterBypass';          // the player's A/B rides the plugin's own bypass
    if (id === 'eqDesk') id = 'deskOn';                // the panel's THD switch is the plugin's deskOn
    if (!(id in INDEX) || id === 'monoInput') return null;   // LOW LAT and HQ pass through (default mode, 2026-11-04)
    const v = typeof value === 'boolean' ? (value ? 1 : 0) : +value;
    if (id === 'multibandFlavor') return [INDEX[id], MB_PANEL_TO_PLUGIN[v] ?? 2];
    return Number.isFinite(v) ? [INDEX[id], v] : null;
  }
});
