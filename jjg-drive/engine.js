// JJG Drive Try It -> the real JJG Drive processor. The panel reports the plugin's own ids
// (choices as index numbers, switches as booleans, knobs in plugin units); the engine takes
// them by index in jjgd_wasm.cpp's order.
const ORDER = ['inputGain', 'outputGain', 'preampType', 'tapeMode', 'tapeSpeed', 'tapeDrive', 'warmth', 'wowFlutter', 'mix',
  'autoGain', 'driveOn', 'warmthOn', 'wowOn', 'masterBypass', 'hq', 'trimLink'];
const INDEX = Object.fromEntries(ORDER.map((id, i) => [id, i]));
// inputDb: the clips peak at -1 dBFS; -9 dB puts them at a tracked vocal's -10 dBFS peak into the plugin (2026-11-05, Justin)
PbDemo.start({
  root: '#jjg-drive-try-it', wasm: 'jjg-drive.wasm?v=c6601223ab', debug: '__jjgDriveDemo', inputDb: -9,
  clips: Object.fromEntries(['female', 'female2', 'female3', 'male', 'male2', 'male3', 'male4', 'male5', 'backing', 'gang', 'drumkit', 'edrums1', 'edrums2', 'bass', 'synthbass', '808', 'acoustic', 'electric', 'electric2', 'rubber', 'pad', 'mellotron'].map(id => [id, 'clips/' + id + '.m4a'])),
  toEngine(id, value) {
    if (id === 'bypass') id = 'masterBypass';          // the player's A/B rides the plugin's own bypass
    if (!(id in INDEX)) return null;
    const v = typeof value === 'boolean' ? (value ? 1 : 0) : +value;
    return Number.isFinite(v) ? [INDEX[id], v] : null;
  }
});
