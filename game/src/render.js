// All drawing: the kitchen, the order board, the chef and every screen.
// Canvas 2D only, no images — every ingredient and dish is drawn from shapes.

import { CHEF, COOK, INGREDIENTS, RECIPES, STATIONS, TARGET_COINS, VIEW } from './config.js';
import { nearestStation } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const FLOOR_A = '#c98d5f';
const FLOOR_B = '#bd7f52';
const WALL = '#f3e2c7';
const WOOD = '#8a5a33';
const WOOD_TOP = '#a9743f';
const STEEL = '#9aa5ad';
const STEEL_DARK = '#6e7a82';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

/** Draw one ingredient as a little dish of food. `prep` changes its look. */
export function drawIngredient(ctx, kind, prep, x, y, r) {
  const ing = INGREDIENTS[kind];
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, -r * 0.15, r, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-r, -r * 0.15, r * 2, r * 0.35);
    ctx.fillStyle = '#fff3c4';
    for (const [sx, sy] of [[-0.5, -0.55], [0, -0.75], [0.5, -0.5]]) {
      ctx.beginPath();
      ctx.arc(sx * r, sy * r, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'patty') {
    ctx.fillStyle = prep === 'burnt' ? '#241a12' : prep === 'cooked' ? '#6b3a22' : '#a85f3f';
    rr(ctx, -r, -r * 0.45, r * 2, r * 0.9, r * 0.4);
    ctx.fill();
    if (prep === 'cooked') {
      ctx.strokeStyle = '#4a2413';
      ctx.lineWidth = 2;
      for (const sx of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(sx * r, -r * 0.3);
        ctx.lineTo(sx * r, r * 0.3);
        ctx.stroke();
      }
    }
    if (prep === 'raw') {
      ctx.fillStyle = '#e8b4a0';
      ctx.beginPath();
      ctx.arc(-r * 0.4, -r * 0.1, r * 0.16, 0, Math.PI * 2);
      ctx.arc(r * 0.35, r * 0.12, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.5);
    ctx.lineTo(r, r * 0.5);
    ctx.lineTo(r * 0.55, -r * 0.55);
    ctx.lineTo(-r * 0.55, -r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [sx, sy] of [[-0.35, 0.05], [0.25, -0.15], [0, 0.3]]) {
      ctx.beginPath();
      ctx.arc(sx * r, sy * r, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'lettuce') {
    ctx.fillStyle = prep === 'chopped' ? '#8fd45a' : ing.color;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(-r * 0.5 + i * r * 0.5, 0, r * 0.55, r * 0.75, (i - 1) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.6);
    ctx.lineTo(0, r * 0.6);
    ctx.stroke();
  } else if (kind === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f9e3f';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.75, r * 0.35, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (prep === 'chopped') {
      ctx.fillStyle = '#ff8a7a';
      ctx.beginPath();
      ctx.arc(-r * 0.3, r * 0.1, r * 0.4, 0, Math.PI * 2);
      ctx.arc(r * 0.35, -r * 0.05, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'onion') {
    ctx.fillStyle = prep === 'chopped' ? '#e9d5ec' : ing.color;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 2;
    for (const a of [-0.5, 0, 0.5]) {
      ctx.beginPath();
      ctx.arc(a * r * 0.4, r * 0.1, r * 0.55, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.fillStyle = '#7fb069';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.lineTo(-r * 0.25, -r * 1.15);
    ctx.lineTo(r * 0.25, -r * 1.15);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'fries') {
    ctx.fillStyle = prep === 'burnt' ? '#2a1c10' : prep === 'cooked' ? '#f7b733' : '#ffe08a';
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillRect(i * r * 0.55 - r * 0.18, -r - i * 2, r * 0.36, r * 1.7);
    }
    ctx.fillStyle = '#d23b2e';
    rr(ctx, -r * 0.85, -r * 0.1, r * 1.7, r * 0.85, r * 0.2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlate(ctx, items, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f8f4ec';
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9bfa8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.78, r * 0.32, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Stack the dish's items so the plate reads as a meal, not a pile.
  const n = items.length;
  items.forEach((item, i) => {
    const lift = (n - 1 - i) * 7;
    drawIngredient(ctx, item.kind, item.prep, 0, -lift - 4, Math.min(20, r * 0.55));
  });
  ctx.restore();
}

function progressRing(ctx, x, y, r, frac, color) {
  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac));
  ctx.stroke();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW.width * dpr;
  canvas.height = VIEW.height * dpr;
  ctx.scale(dpr, dpr);

  function drawStationLabel(x, y, label, sub) {
    text(ctx, label, x, y, 15, '#fff', 'center', '800');
    if (sub) text(ctx, sub, x, y + 17, 11, 'rgba(255,255,255,0.75)', 'center', '600');
  }

  function drawCrates(state) {
    for (const crate of STATIONS.crates) {
      const ing = INGREDIENTS[crate.kind];
      ctx.fillStyle = WOOD;
      rr(ctx, crate.x, crate.y, crate.w, crate.h, 10);
      ctx.fill();
      ctx.fillStyle = WOOD_TOP;
      rr(ctx, crate.x + 5, crate.y + 5, crate.w - 10, crate.h - 10, 8);
      ctx.fill();
      drawIngredient(ctx, crate.kind, ing.prep, crate.x + crate.w / 2, crate.y + 30, 20);
      text(ctx, ing.name, crate.x + crate.w / 2, crate.y + 66, 14, '#fff');
    }
  }

  function drawCookStation(state, station, slots, cookKey, label, hint) {
    ctx.fillStyle = STEEL_DARK;
    rr(ctx, station.x, station.y, station.w, station.h, 10);
    ctx.fill();
    ctx.fillStyle = STEEL;
    rr(ctx, station.x + 6, station.y + 6, station.w - 12, station.h - 12, 8);
    ctx.fill();
    drawStationLabel(station.x + station.w / 2, station.y + 15, label, hint);
    const slotW = (station.w - 24) / station.slots;
    slots.forEach((slot, i) => {
      const cx = station.x + 12 + slotW * (i + 0.5);
      const cy = station.y + 70;
      ctx.fillStyle = '#3c444a';
      rr(ctx, cx - slotW / 2 + 6, cy - 30, slotW - 12, 60, 8);
      ctx.fill();
      if (slot.item) {
        const cook = COOK[cookKey];
        const frac = slot.t / cook.done;
        drawIngredient(ctx, slot.item.kind, slot.item.prep, cx, cy, 22);
        if (slot.item.prep === 'raw') progressRing(ctx, cx, cy, 30, frac, '#ffb03a');
        else if (slot.item.prep === 'cooked') {
          const burnFrac = (slot.t - cook.done) / (cook.burnt - cook.done);
          progressRing(ctx, cx, cy, 30, burnFrac, '#ff5340');
          text(ctx, 'READY!', cx, cy + 44, 12, '#7dff6a', 'center', '800');
        } else {
          text(ctx, 'BURNT!', cx, cy + 44, 12, '#ff6a5e', 'center', '800');
        }
      } else {
        text(ctx, 'empty', cx, cy, 12, 'rgba(255,255,255,0.5)');
      }
    });
  }

  function drawBoard(state) {
    const b = STATIONS.board;
    ctx.fillStyle = WOOD;
    rr(ctx, b.x, b.y, b.w, b.h, 10);
    ctx.fill();
    ctx.fillStyle = '#e8c890';
    rr(ctx, b.x + 10, b.y + 10, b.w - 20, b.h - 20, 8);
    ctx.fill();
    drawStationLabel(b.x + b.w / 2, b.y + 20, 'CHOPPING BOARD', 'E to chop ×3');
    if (state.board.item) {
      drawIngredient(ctx, state.board.item.kind, state.board.item.prep, b.x + b.w / 2, b.y + 62, 24);
      if (state.board.item.prep !== 'chopped') {
        text(ctx, `chop ${state.board.chops}/${3}`, b.x + b.w / 2, b.y + 92, 12, '#6b4423', 'center', '800');
      } else {
        text(ctx, 'chopped — take it!', b.x + b.w / 2, b.y + 92, 12, '#2e7d32', 'center', '800');
      }
    } else {
      text(ctx, 'bring lettuce / tomato / onion', b.x + b.w / 2, b.y + 62, 12, '#8a6a42');
    }
  }

  function drawPlating(state) {
    const p = STATIONS.plating;
    ctx.fillStyle = WOOD;
    rr(ctx, p.x, p.y, p.w, p.h, 10);
    ctx.fill();
    ctx.fillStyle = WOOD_TOP;
    rr(ctx, p.x + 5, p.y + 5, p.w - 10, p.h - 10, 8);
    ctx.fill();
    drawStationLabel(p.x + 130, p.y + 22, 'PLATING COUNTER', 'E: add items · take plate');
    const px = p.x + 180;
    const py = p.y + 72;
    if (state.plateOnCounter.length > 0 || !state.plateCarried) {
      drawPlate(ctx, state.plateOnCounter, px, py, 52);
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(px, py, 52, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'plate is out with you', px, py, 12, 'rgba(255,255,255,0.7)');
    }
    if (state.plateOnCounter.length > 0) {
      const names = state.plateOnCounter.map((it) => INGREDIENTS[it.kind].name).join(' + ');
      text(ctx, names, p.x + 180, p.y + 108, 12, '#ffe9b0', 'center', '700');
    }
  }

  function drawWindow(state) {
    const w = STATIONS.window;
    ctx.fillStyle = '#5b3a29';
    rr(ctx, w.x, w.y, w.w, w.h, 10);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    rr(ctx, w.x + 8, w.y + 8, w.w - 16, 44, 8);
    ctx.fill();
    text(ctx, 'SERVICE WINDOW', w.x + w.w / 2, w.y + 30, 15, '#5b3a29', 'center', '800');
    // Bell on the counter.
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(w.x + w.w / 2, w.y + 88, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(w.x + w.w / 2 - 18, w.y + 86, 36, 5);
    text(ctx, 'E: serve the plate', w.x + w.w / 2, w.y + 116, 12, '#ffe9b0');
  }

  function drawTrash(state) {
    const t = STATIONS.trash;
    ctx.fillStyle = '#4a4f55';
    rr(ctx, t.x, t.y, t.w, t.h, 10);
    ctx.fill();
    ctx.fillStyle = '#2f3337';
    rr(ctx, t.x + 10, t.y + 12, t.w - 20, t.h - 24, 8);
    ctx.fill();
    text(ctx, 'TRASH', t.x + t.w / 2, t.y + 34, 14, '#fff');
    text(ctx, 'E: dump', t.x + t.w / 2, t.y + 58, 11, 'rgba(255,255,255,0.7)');
  }

  function drawChef(state) {
    const c = state.chef;
    const bob = Math.sin(c.walk) * 2;
    ctx.save();
    ctx.translate(c.x, c.y + bob * 0.4);
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body (apron) and head.
    ctx.fillStyle = '#f5f0e6';
    rr(ctx, -18, -6, 36, 30, 10);
    ctx.fill();
    ctx.fillStyle = '#e8483f';
    ctx.fillRect(-18, 8, 36, 6);
    ctx.fillStyle = '#f2c79b';
    ctx.beginPath();
    ctx.arc(0, -18, 15, 0, Math.PI * 2);
    ctx.fill();
    // Chef hat.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-9, -32, 9, 0, Math.PI * 2);
    ctx.arc(0, -36, 10, 0, Math.PI * 2);
    ctx.arc(9, -32, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-14, -32, 28, 6);
    // Eyes look the way the chef faces.
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(c.facing * 4 - 5, -18, 2, 0, Math.PI * 2);
    ctx.arc(c.facing * 4 + 5, -18, 2, 0, Math.PI * 2);
    ctx.fill();
    // Held items float above the hat; a carried plate rides overhead.
    if (state.plateCarried) {
      drawPlate(ctx, state.plateCarried, 0, -58, 30);
    } else if (state.hands.length > 0) {
      state.hands.forEach((item, i) => {
        drawIngredient(ctx, item.kind, item.prep, (i - (state.hands.length - 1) / 2) * 26, -56, 13);
      });
    }
    ctx.restore();
  }

  function drawOrders(state) {
    const x0 = 268;
    state.orders.forEach((order, i) => {
      const x = x0 + i * 200;
      const y = 8;
      const recipe = RECIPES[order.recipe];
      const frac = Math.max(0, order.patience / order.patienceMax);
      const urgent = frac < 0.3;
      ctx.save();
      if (state.shake > 0) ctx.translate((Math.random() - 0.5) * 4, 0);
      ctx.fillStyle = urgent && Math.floor(performance.now() / 300) % 2 === 0 ? '#ffe1de' : '#fff8e7';
      rr(ctx, x, y, 192, 84, 10);
      ctx.fill();
      ctx.strokeStyle = urgent ? '#e8483f' : '#d9c48f';
      ctx.lineWidth = 2;
      ctx.stroke();
      text(ctx, `#${order.num} ${recipe.name}`, x + 96, y + 16, 14, '#5b3a29', 'center', '800');
      recipe.items.forEach((item, j) => {
        drawIngredient(ctx, item.kind, item.prep, x + 24 + j * 30, y + 44, 12);
      });
      // Patience bar.
      ctx.fillStyle = '#e5d9bd';
      rr(ctx, x + 10, y + 68, 172, 8, 4);
      ctx.fill();
      ctx.fillStyle = frac > 0.5 ? '#7dc242' : frac > 0.3 ? '#ffb03a' : '#e8483f';
      if (frac > 0) {
        rr(ctx, x + 10, y + 68, 172 * frac, 8, 4);
        ctx.fill();
      }
      ctx.restore();
    });
    if (state.orders.length === 0) {
      text(ctx, 'No orders yet — they are coming!', x0 + 100, 50, 14, 'rgba(255,255,255,0.8)', 'left', '700');
    }
  }

  function drawHud(state, best) {
    // Top bar.
    ctx.fillStyle = '#3a2417';
    ctx.fillRect(0, 0, VIEW.width, 100);
    text(ctx, 'SIZZLE', 134, 34, 30, '#ffb03a', 'center', '900');
    text(ctx, '& SERVE', 134, 64, 30, '#fff', 'center', '900');
    text(ctx, '★ DINER RUSH ★', 134, 88, 11, '#ffd94d', 'center', '700');
    drawOrders(state);
    // Timer, coins, hearts, target.
    const t = Math.max(0, Math.ceil(state.timeLeft));
    const mm = String(Math.floor(t / 60)).padStart(1, '0');
    const ss = String(t % 60).padStart(2, '0');
    const low = t <= 30 && !state.over;
    text(ctx, `${mm}:${ss}`, 1150, 30, 34, low ? '#ff6a5e' : '#fff', 'center', '900');
    text(ctx, 'TIME LEFT', 1150, 56, 11, 'rgba(255,255,255,0.7)', 'center', '700');
    text(ctx, `🪙 ${state.coins}`, 1150, 82, 18, '#ffd94d', 'center', '800');
    text(ctx, `♥`.repeat(Math.max(0, state.hearts)) + `♡`.repeat(Math.max(0, 3 - state.hearts)), 1010, 30, 20, '#ff6a7a', 'center', '800');
    text(ctx, `target ${TARGET_COINS}`, 1010, 56, 11, 'rgba(255,255,255,0.7)', 'center', '700');
    if (state.combo > 1) {
      text(ctx, `COMBO ×${state.combo}`, 1010, 82, 16, '#7dff6a', 'center', '800');
    }
  }

  function drawHint(state, screen) {
    if (screen !== SCREEN_PLAY) return;
    const near = nearestStation(state);
    const labels = {
      crate: 'E: take ingredient',
      board: 'E: chop / take',
      grill: 'E: grill patty',
      fryer: 'E: fry fries',
      plating: 'E: plate / take plate',
      window: 'E: serve!',
      trash: 'E: throw away',
    };
    let hint = 'WASD / arrows to move · click to walk · E to use a station · P pause · M mute';
    if (near) hint = `${labels[near.type] ?? ''}   ·   ${hint}`;
    text(ctx, hint, VIEW.width / 2, 786, 13, 'rgba(255,255,255,0.85)', 'center', '600');
    if (state.messageT > 0 && state.message) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      const w = ctx.measureText(state.message).width + 36;
      rr(ctx, VIEW.width / 2 - w / 2, 736, w, 30, 15);
      ctx.fill();
      text(ctx, state.message, VIEW.width / 2, 752, 15, '#ffe9b0');
    }
    if (state.lastServe) {
      text(ctx, `Served ${state.lastServe.dish}  +${state.lastServe.earned} coins`, VIEW.width / 2, 712, 15, '#7dff6a', 'center', '800');
    }
  }

  function drawKitchen(state) {
    // Floor tiles.
    for (let ty = 0; ty < 9; ty += 1) {
      for (let tx = 0; tx < 16; tx += 1) {
        ctx.fillStyle = (tx + ty) % 2 === 0 ? FLOOR_A : FLOOR_B;
        ctx.fillRect(tx * 80, 100 + ty * 78, 80, 78);
      }
    }
    // Wall strip above the crates.
    ctx.fillStyle = WALL;
    ctx.fillRect(0, 100, VIEW.width, 16);
    ctx.fillStyle = '#d9b98a';
    ctx.fillRect(0, 114, VIEW.width, 4);
    drawCrates(state);
    drawBoard(state);
    drawCookStation(state, STATIONS.grill, state.grill, 'grill', 'GRILL', 'patty · 8 s');
    drawCookStation(state, STATIONS.fryer, state.fryer, 'fryer', 'FRYER', 'fries · 6 s');
    drawPlating(state);
    drawWindow(state);
    drawTrash(state);
    // Reach highlight on the nearest station.
    const near = nearestStation(state);
    if (near) {
      const rect = near.type === 'crate'
        ? STATIONS.crates.find((c) => c.kind === near.kind)
        : STATIONS[near.type];
      if (rect) {
        ctx.strokeStyle = '#ffd94d';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        rr(ctx, rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8, 12);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    drawChef(state);
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(20,12,6,0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff8e7';
    rr(ctx, 340, 170, 600, 440, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.stroke();
    text(ctx, title, 640, 230, 40, '#5b3a29', 'center', '900');
    lines.forEach((line, i) => {
      text(ctx, line, 640, 292 + i * 34, 18, '#5b3a29', 'center', line.startsWith('▶') ? '800' : '600');
    });
  }

  return {
    draw(state, screen, best) {
      ctx.clearRect(0, 0, VIEW.width, VIEW.height);
      ctx.fillStyle = '#2a1a10';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      drawKitchen(state);
      drawHud(state, best);
      drawHint(state, screen);
      if (screen === SCREEN_TITLE) {
        overlay('SIZZLE & SERVE', [
          'The dinner rush is on! Cook what the board asks for,',
          'plate it, and ring the bell before patience runs out.',
          '',
          'WASD / arrows or click to move · E to use a station',
          'Chop · Grill · Fry · Plate · Serve — earn 500 coins!',
          '',
          '▶  Press ENTER or click to start  ◀',
        ], '#ffb03a');
      } else if (screen === SCREEN_PAUSED) {
        overlay('PAUSED', ['', 'Take a breath. The orders wait for no one,', 'but they will wait for you.', '', '▶  Press P or ENTER to keep cooking  ◀'], '#7dc242');
      } else if (screen === SCREEN_OVER) {
        const stars = state.win ? (state.coins >= 800 ? 3 : state.coins >= 650 ? 2 : 1) : 0;
        overlay(state.win ? 'SHIFT COMPLETE!' : 'SHIFT OVER', [
          state.win ? 'You hit the target — the diners are happy!' : 'The rush beat you this time. Try again!',
          '',
          `Coins earned: ${state.coins}  (target ${TARGET_COINS})`,
          `Dishes served: ${state.served}   Orders lost: ${state.failed}`,
          `Best shift: ${best} coins`,
          stars > 0 ? `★`.repeat(stars) + `☆`.repeat(3 - stars) : '',
          '',
          '▶  Press ENTER to cook again  ◀',
        ], state.win ? '#ffd94d' : '#e8483f');
      }
    },
  };
}
