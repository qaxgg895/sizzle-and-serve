// Keyboard and mouse: WASD / arrows to walk, E or click to use a station,
// Space / Enter to confirm, P to pause, M to mute, R to restart.
// Clicking the floor walks there; clicking a station walks there and uses it.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_INTERACT = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

export function createInput(canvas, onPointer) {
  const keys = new Set();
  let actions = 0;

  const down = (e) => {
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'Space' || e.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      e.preventDefault();
    } else if (e.code === 'KeyE') actions |= ACTION_INTERACT;
    else if (e.code === 'KeyP' || e.code === 'Escape') actions |= ACTION_PAUSE;
    else if (e.code === 'KeyM') actions |= ACTION_MUTE;
    else if (e.code === 'KeyR') actions |= ACTION_RESTART;
    else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  };
  const up = (e) => keys.delete(e.code);
  const blur = () => keys.clear();

  const pointer = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    onPointer(x, y);
  };

  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  canvas.addEventListener('pointerdown', pointer);

  return {
    /** Movement vector from the held keys, -1/0/1 per axis. */
    direction() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        const n = Math.hypot(x, y);
        x /= n;
        y /= n;
      }
      return { x, y };
    },
    /** One-shot actions since the last call (confirm / pause / interact / mute / restart). */
    takeActions() {
      const out = actions;
      actions = 0;
      return out;
    },
  };
}
