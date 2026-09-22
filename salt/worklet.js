// Generic AudioWorklet host for a Pizza Bagel engine .wasm (schmear, salt, ...). Every engine
// exports the same C API: pb_bufL/pb_bufR/pb_maxBlock/pb_prepare/pb_set(index, value)/
// pb_process(n, channels). The main thread compiles the module and hands it over in
// processorOptions; parameter messages are {index: value} objects.
class PbEngine extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const stub = new Proxy({}, { get: () => () => 0 }); // WASI fds / memory-growth notify: never used
    const inst = new WebAssembly.Instance(options.processorOptions.module, { wasi_snapshot_preview1: stub, env: stub });
    this.x = inst.exports;
    if (this.x._initialize) this.x._initialize();
    this.x.pb_prepare(sampleRate);
    this.pL = this.x.pb_bufL(); this.pR = this.x.pb_bufR(); this.max = this.x.pb_maxBlock();
    this.views();
    this.port.onmessage = (e) => { for (const k in e.data) this.x.pb_set(+k, +e.data[k]); };
    this.meterEvery = Math.max(1, Math.round(sampleRate * 0.08 / 128)); this.quantum = 0;   // ~80 ms, the panel's own meter tick
  }
  views() {
    this.mem = this.x.memory.buffer;
    this.L = new Float32Array(this.mem, this.pL, this.max);
    this.R = new Float32Array(this.mem, this.pR, this.max);
  }
  process(inputs, outputs) {
    const inp = inputs[0], out = outputs[0];
    if (!inp || !inp[0] || !out || !out[0]) return true;
    if (this.mem !== this.x.memory.buffer) this.views(); // memory grew
    const n = inp[0].length, ch = inp.length;
    this.L.set(inp[0]);
    if (ch > 1) this.R.set(inp[1]);
    this.x.pb_process(n, ch > 1 ? 2 : 1);
    out[0].set(this.L.subarray(0, n));
    if (out[1]) out[1].set(this.R.subarray(0, n));
    if (this.x.pb_meter && ++this.quantum % this.meterEvery === 0)
      this.port.postMessage({ meters: [this.x.pb_meter(0), this.x.pb_meter(1), this.x.pb_meter(2)] });
    return true;
  }
}
registerProcessor('pb-engine', PbEngine);
