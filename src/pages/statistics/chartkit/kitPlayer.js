// src/pages/statistics/chartkit/kitPlayer.js
// Il lettore delle animazioni: un tempo t da 0 a frames - 1 che avanza a
// una certa velocita', con avvio, pausa, un passo avanti o indietro e un
// punto qualsiasi. Non sa niente di grafici: a ogni passo chiama
// onFrame(t), e chi lo usa ridisegna. All'inizio sta sull'ultimo passo, cosi'
// chi non preme Avvia vede il grafico completo, e non parte mai da solo:
// rispetta anche chi ha chiesto meno movimento.

const requestFrame = (fn) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : setTimeout(() => fn(Date.now()), 16));
const cancelFrame = (id) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id));

/**
 * A player of `frames` steps, one every `ms` milliseconds at speed 1.
 * onFrame(t) draws step t; onChange(state) tells the interface { t,
 * frames, playing, speed }. Returns { play, pause, toggle, step, seek,
 * setSpeed, setFrames, setMs, state, destroy }.
 */
export function createPlayer({ frames = 1, ms: stepMs = 60, loop = false, onFrame, onChange = null }) {
  let ms = stepMs;
  let count = Math.max(1, frames);
  let t = count - 1;
  let playing = false;
  let speed = 1;
  let request = 0;
  let last = 0;
  let elapsed = 0;
  const state = () => ({ t, frames: count, playing, speed });
  const notify = () => {
    if (onChange) onChange(state());
  };
  const tick = (now) => {
    if (!playing) return;
    if (!last) last = now;
    elapsed += (now - last) * speed;
    last = now;
    let moved = false;
    while (elapsed >= ms && playing) {
      elapsed -= ms;
      if (t < count - 1) {
        t += 1;
        moved = true;
      } else if (loop) {
        t = 0;
        moved = true;
      } else {
        playing = false;
      }
    }
    if (moved) onFrame(t);
    notify();
    if (playing) request = requestFrame(tick);
  };
  const api = {
    play() {
      if (playing || count < 2) return;
      // at the end, play starts again from the beginning
      if (t >= count - 1) {
        t = 0;
        onFrame(t);
      }
      playing = true;
      last = 0;
      elapsed = 0;
      request = requestFrame(tick);
      notify();
    },
    pause() {
      if (!playing) return;
      playing = false;
      cancelFrame(request);
      notify();
    },
    toggle() {
      if (playing) api.pause();
      else api.play();
    },
    step(by = 1) {
      api.pause();
      const next = Math.min(count - 1, Math.max(0, t + by));
      if (next !== t) {
        t = next;
        onFrame(t);
      }
      notify();
    },
    seek(at) {
      const next = Math.min(count - 1, Math.max(0, Math.round(at)));
      if (next !== t) {
        t = next;
        onFrame(t);
      }
      notify();
    },
    setSpeed(next) {
      speed = next;
      notify();
    },
    /** A new number of steps (the parameters changed): when stopped, the player goes to the end, where the chart is complete. */
    setFrames(next) {
      count = Math.max(1, next);
      if (!playing || t > count - 1) t = count - 1;
      notify();
    },
    /** Another length of a step, in milliseconds at speed 1 (a new animation). */
    setMs(next) {
      ms = Math.max(1, next);
    },
    state,
    destroy() {
      playing = false;
      cancelFrame(request);
    },
  };
  return api;
}
