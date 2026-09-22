// JJG Vocals Try It -> the real JJG processor. The panel reports the plugin's own ids
// (choices as index numbers, switches as booleans, knobs in plugin units); the engine takes
// them by index in params.json order. lowLatency and monoInput are fixed by the wrapper.
const ORDER = ['inputGain', 'outputGain', 'mix', 'autoGain', 'preampType', 'tapeDrive', 'warmth', 'tapeMode', 'tapeSpeed', 'wowFlutter',
  'hpfFreq', 'eqLow', 'eqHigh', 'eqLowConsole', 'eqHighConsole', 'lowMidCut', 'lowMidFreq', 'highMidBoost',
  'compType', 'compAmount', 'compMix', 'compAutoGain', 'comp76Ratio', 'gateThreshold',
  'deesser', 'deesserModel', 'deesser902Hf', 'deesserListen', 'salt', 'saltCurve',
  'driveOn', 'warmthOn', 'wowOn', 'gateOn', 'hpfOn', 'eqLowOn', 'eqHighOn', 'lowMidOn', 'highMidOn', 'compOn', 'deesserOn', 'saltOn',
  'masterBypass', 'lowLatency', 'monoInput'];
const INDEX = Object.fromEntries(ORDER.map((id, i) => [id, i]));
PbDemo.start({
  root: '#jjg-try-it', wasm: 'jjg.wasm', debug: '__jjgDemo', meters: '__jjgMeters',
  clips: Object.fromEntries(['female', 'female2', 'female3', 'male', 'male2', 'male3', 'male4', 'male5', 'backing', 'gang'].map(id => [id, 'clips/' + id + '.m4a'])),
  toEngine(id, value) {
    if (id === 'bypass') id = 'masterBypass';          // the player's A/B rides the plugin's own bypass
    if (!(id in INDEX) || id === 'lowLatency' || id === 'monoInput') return null;
    const v = typeof value === 'boolean' ? (value ? 1 : 0) : +value;
    return Number.isFinite(v) ? [INDEX[id], v] : null;
  }
});
