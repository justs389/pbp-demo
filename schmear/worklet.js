// AudioWorklet host for dist/schmear.wasm. The main thread compiles the module and hands it
// over in processorOptions; parameters arrive on the port as {detune, mix, input, output, bypass}.
class SchmearProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const wasi = new Proxy({}, { get: () => () => 0 }); // proc_exit/fd_write etc: never used
    const inst = new WebAssembly.Instance(options.processorOptions.module, {
      wasi_snapshot_preview1: wasi, env: new Proxy({}, { get: () => () => 0 })
    });
    this.x = inst.exports;
    if (this.x._initialize) this.x._initialize();
    this.x.schmear_prepare(sampleRate);
    this.pL = this.x.schmear_bufL(); this.pR = this.x.schmear_bufR();
    this.views();
    this.p = { detune: 0, mix: 100, input: 0, output: 0, bypass: 0 };
    this.port.onmessage = (e) => {
      Object.assign(this.p, e.data);
      this.x.schmear_set(this.p.detune | 0, +this.p.mix, +this.p.input, +this.p.output, this.p.bypass ? 1 : 0);
    };
  }
  views() {
    this.mem = this.x.memory.buffer;
    this.L = new Float32Array(this.mem, this.pL, 4096);
    this.R = new Float32Array(this.mem, this.pR, 4096);
  }
  process(inputs, outputs) {
    const inp = inputs[0], out = outputs[0];
    if (!inp || !inp[0] || !out || !out[0]) return true;
    if (this.mem !== this.x.memory.buffer) this.views(); // memory grew
    const n = inp[0].length, ch = inp.length;
    this.L.set(inp[0]);
    if (ch > 1) this.R.set(inp[1]);
    this.x.schmear_process(n, ch > 1 ? 2 : 1);
    out[0].set(this.L.subarray(0, n));
    if (out[1]) out[1].set(this.R.subarray(0, n));
    return true;
  }
}
registerProcessor('schmear', SchmearProcessor);
