// Salt Try It -> Salt engine. Indexes per params.json; the panel reports curve/mode as words.
PbDemo.start({
  root: '#salt-try-it', wasm: 'salt.wasm', debug: '__saltDemo',
  clips: Object.fromEntries(['female', 'female2', 'female3', 'male', 'male2', 'male3', 'male4', 'male5', 'backing', 'gang', 'acoustic', 'electric', 'electric2', 'rubber', 'bass', 'synthbass', '808', 'drumkit', 'edrums1', 'edrums2', 'pad', 'mellotron'].map(id => [id, 'clips/' + id + '.m4a'])),
  toEngine(id, value) {
    switch (id) {
      case 'curve': return [0, value === 'pink' ? 1 : 0];
      case 'mode': return [1, value === 'fat' ? 1 : 0];
      case 'heat': return [2, +value];
      case 'mix': return [3, +value];
      case 'output': return [4, +value];
      case 'bypass': return [5, value ? 1 : 0];
      default: return null;
    }
  }
});
