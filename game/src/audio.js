// Sound effects, synthesized with WebAudio: no audio files, nothing fetched.
// Every sound is a tiny oscillator/noise burst; the game stays silent until the
// player first interacts (browsers require a gesture before audio starts).

let ctx = null;
let muted = false;

function audio() {
  if (ctx === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, dur, type, gain, when = 0, slideTo = null) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, gain, freq, when = 0) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t0);
}

/** Unlock audio on the first gesture; call from any pointer/key handler. */
export function unlockAudio() {
  audio();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

export const sfx = {
  pickup() { tone(520, 0.08, 'triangle', 0.15, 0, 760); },
  place() { tone(300, 0.07, 'triangle', 0.14, 0, 210); },
  chop() { noise(0.09, 0.35, 900); tone(180, 0.06, 'square', 0.08); },
  sizzle() { noise(0.5, 0.12, 3200); },
  done() { tone(880, 0.12, 'sine', 0.16); tone(1318, 0.18, 'sine', 0.14, 0.1); },
  order() { tone(660, 0.1, 'sine', 0.16); tone(990, 0.14, 'sine', 0.16, 0.09); },
  serve() {
    tone(523, 0.12, 'triangle', 0.18);
    tone(659, 0.12, 'triangle', 0.18, 0.09);
    tone(784, 0.2, 'triangle', 0.2, 0.18);
  },
  error() { tone(160, 0.22, 'sawtooth', 0.12, 0, 110); },
  tick() { tone(1200, 0.05, 'square', 0.07); },
  start() {
    tone(392, 0.1, 'triangle', 0.16);
    tone(523, 0.1, 'triangle', 0.16, 0.09);
    tone(659, 0.18, 'triangle', 0.18, 0.18);
  },
};
