// The kitchen's rules: orders, cooking, assembly, serving and scoring.
// Pure state plus step(): the renderer only reads, the input only asks it to act.

import {
  CHEF, CHOPS_NEEDED, COOK, HAND_LIMIT, INGREDIENTS, MAX_ORDERS, MENU_BY_TIME,
  RECIPES, RECIPE_IDS, SHIFT_SECONDS, STATIONS, START_HEARTS, TARGET_COINS,
} from './config.js';

export const EVENT_ORDER = 1;
export const EVENT_SERVED = 2;
export const EVENT_EXPIRED = 4;
export const EVENT_BURNT = 8;
export const EVENT_COOKED = 16;
export const EVENT_OVER = 32;

let nextOrderId = 1;

/** A loose ingredient: kind plus its prep state (raw/cooked/chopped/plain/burnt). */
export function makeItem(kind, prep) {
  return { kind, prep: prep ?? INGREDIENTS[kind].prep };
}

function menuFor(elapsed) {
  let menu = MENU_BY_TIME[0].ids;
  for (const row of MENU_BY_TIME) if (elapsed >= row.after) menu = row.ids;
  return menu;
}

function spawnInterval(elapsed) {
  // Orders arrive faster as the shift heats up: 16 s early, 10 s late.
  return Math.max(10, 16 - elapsed / 30);
}

function patienceFor(elapsed) {
  return Math.max(55, 80 - elapsed / 12);
}

export function createWorld(random) {
  const state = freshState();
  const world = {
    state,
    random,
    reset() {
      Object.assign(state, freshState());
      nextOrderId = 1;
      world.spawnOrder();
      world.spawnOrder();
    },
    /** Open a new order on the board (null when the board is full). */
    spawnOrder() {
      if (state.orders.length >= MAX_ORDERS) return null;
      const elapsed = SHIFT_SECONDS - state.timeLeft;
      const menu = menuFor(elapsed);
      const id = random.pick(menu);
      const order = {
        id: nextOrderId,
        num: nextOrderId,
        recipe: id,
        patience: patienceFor(elapsed),
        patienceMax: patienceFor(elapsed),
      };
      nextOrderId += 1;
      state.orders.push(order);
      return order;
    },
    /** Advance the world one fixed step. `move` is -1/0/1 per axis from input. */
    step(dt, move, demo) {
      let events = 0;
      if (state.over) return events;
      if (!demo) {
        state.timeLeft -= dt;
        if (state.timeLeft <= 0) {
          state.timeLeft = 0;
          state.over = true;
          state.win = state.coins >= TARGET_COINS;
          return events | EVENT_OVER;
        }
      }
      // Chef movement, clamped to the kitchen floor.
      const speed = CHEF.speed * dt;
      let nx = state.chef.x + move.x * speed;
      let ny = state.chef.y + move.y * speed;
      nx = Math.max(40, Math.min(1240, nx));
      ny = Math.max(230, Math.min(760, ny));
      state.chef.x = nx;
      state.chef.y = ny;
      collide(state);
      if (move.x !== 0 || move.y !== 0) {
        state.chef.facing = move.x < 0 ? -1 : move.x > 0 ? 1 : state.chef.facing;
        state.chef.walk += dt * 10;
      }
      // Mouse move target: walk toward it, stop on arrival. When a counter blocks
      // the straight line, route around it with two waypoints down its nearer side.
      if (state.chef.target) {
        const goal = state.chef.detour && state.chef.detour.length > 0
          ? state.chef.detour[0]
          : state.chef.target;
        const dx = goal.x - state.chef.x;
        const dy = goal.y - state.chef.y;
        const d = Math.hypot(dx, dy);
        if (d < 6) {
          if (state.chef.detour && state.chef.detour.length > 0) {
            state.chef.detour.shift();
            state.chef.lastDist = Infinity;
            state.chef.stuckT = 0;
          } else {
            state.chef.target = null;
            state.chef.lastDist = Infinity;
            state.chef.stuckT = 0;
            if (state.chef.onArrive) {
              const fn = state.chef.onArrive;
              state.chef.onArrive = null;
              fn();
            }
          }
        } else {
          const stepLen = Math.min(d, CHEF.speed * dt);
          state.chef.x += (dx / d) * stepLen;
          state.chef.y += (dy / d) * stepLen;
          collide(state);
          state.chef.facing = dx < 0 ? -1 : 1;
          state.chef.walk += dt * 10;
          const nd = Math.hypot(goal.x - state.chef.x, goal.y - state.chef.y);
          if (nd < state.chef.lastDist - 0.5) {
            state.chef.lastDist = nd;
            state.chef.stuckT = 0;
          } else {
            state.chef.stuckT += dt;
            if (state.chef.stuckT > 0.4 && (!state.chef.detour || state.chef.detour.length === 0)) {
              computeDetour(state);
              state.chef.stuckT = 0;
              state.chef.lastDist = Infinity;
            }
          }
        }
      }
      // Cooking timers.
      for (const slot of state.grill) {
        if (slot.item) {
          const was = slot.item.prep;
          slot.t += dt;
          if (was === 'raw' && slot.t >= COOK.grill.done) {
            slot.item.prep = 'cooked';
            events |= EVENT_COOKED;
          } else if (slot.item.prep === 'cooked' && slot.t >= COOK.grill.burnt) {
            slot.item.prep = 'burnt';
            events |= EVENT_BURNT;
          }
        }
      }
      for (const slot of state.fryer) {
        if (slot.item) {
          const was = slot.item.prep;
          slot.t += dt;
          if (was === 'raw' && slot.t >= COOK.fryer.done) {
            slot.item.prep = 'cooked';
            events |= EVENT_COOKED;
          } else if (slot.item.prep === 'cooked' && slot.t >= COOK.fryer.burnt) {
            slot.item.prep = 'burnt';
            events |= EVENT_BURNT;
          }
        }
      }
      // Orders.
      if (!demo) {
        state.spawnIn -= dt;
        if (state.spawnIn <= 0) {
          if (world.spawnOrder()) events |= EVENT_ORDER;
          state.spawnIn = spawnInterval(SHIFT_SECONDS - state.timeLeft);
        }
        for (let i = state.orders.length - 1; i >= 0; i -= 1) {
          const order = state.orders[i];
          order.patience -= dt;
          if (order.patience <= 0) {
            state.orders.splice(i, 1);
            state.hearts -= 1;
            state.failed += 1;
            state.combo = 0;
            events |= EVENT_EXPIRED;
            if (state.hearts <= 0) {
              state.over = true;
              state.win = false;
              return events | EVENT_OVER;
            }
          }
        }
        // Combo cools off: serve again soon or the streak fades.
        if (state.combo > 0) {
          state.comboTimer -= dt;
          if (state.comboTimer <= 0) state.combo = 0;
        }
      }
      return events;
    },
  };
  world.reset();
  return world;
}

/** Where a segment first enters a rectangle (t in [0,1]), or null. */
function segmentRectT(x1, y1, x2, y2, r) {
  let t0 = 0;
  let t1 = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const slabs = [
    [-dx, x1 - r.x],
    [dx, r.x + r.w - x1],
    [-dy, y1 - r.y],
    [dy, r.y + r.h - y1],
  ];
  for (const [p, q] of slabs) {
    if (p === 0) {
      if (q < 0) return null;
    } else {
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return null;
    }
  }
  return t0;
}

function solidsList() {
  return [
    ...STATIONS.crates,
    STATIONS.board, STATIONS.grill, STATIONS.fryer, STATIONS.plating, STATIONS.window, STATIONS.trash,
  ];
}

/** Route around the counter blocking the chef's path: two waypoints down its nearer side. */
function computeDetour(state) {
  const c = state.chef;
  const goal = c.target;
  if (!goal) return;
  let best = null;
  let bestT = Infinity;
  for (const s of solidsList()) {
    const expanded = { x: s.x - 20, y: s.y - 20, w: s.w + 40, h: s.h + 40 };
    const t = segmentRectT(c.x, c.y, goal.x, goal.y, expanded);
    if (t !== null && t < bestT) {
      bestT = t;
      best = s;
    }
  }
  if (!best) return;
  const goLeft = (c.x - best.x) < (best.x + best.w - c.x);
  const sideX = Math.max(40, Math.min(1240, goLeft ? best.x - 44 : best.x + best.w + 44));
  const yOn = (y) => Math.max(230, Math.min(760, y));
  const yA = yOn(c.y < best.y + best.h / 2 ? best.y - 44 : best.y + best.h + 44);
  const yB = yOn(goal.y < best.y + best.h / 2 ? best.y - 44 : best.y + best.h + 44);
  c.detour = [{ x: sideX, y: yA }, { x: sideX, y: yB }];
}

/** Push the chef out of every counter's rectangle (they walk around, not over). */
function collide(state) {
  const c = state.chef;
  const r = c.radius - 4;
  for (const s of solidsList()) {
    const cx = Math.max(s.x, Math.min(c.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(c.y, s.y + s.h));
    const dx = c.x - cx;
    const dy = c.y - cy;
    const d = Math.hypot(dx, dy);
    if (d < r) {
      if (d === 0) {
        c.y = s.y + s.h + r;
      } else {
        c.x = cx + (dx / d) * r;
        c.y = cy + (dy / d) * r;
      }
    }
  }
}

function freshState() {
  return {
    chef: { x: CHEF.x, y: CHEF.y, radius: CHEF.radius, facing: 1, walk: 0, target: null, onArrive: null, detour: null, stuckT: 0, lastDist: Infinity },
    hands: [],
    plateCarried: null,
    plateOnCounter: [],
    board: { item: null, chops: 0 },
    grill: [{ item: null, t: 0 }, { item: null, t: 0 }],
    fryer: [{ item: null, t: 0 }, { item: null, t: 0 }],
    orders: [],
    spawnIn: 12,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    hearts: START_HEARTS,
    combo: 0,
    comboTimer: 0,
    served: 0,
    failed: 0,
    over: false,
    win: false,
    message: '',
    messageT: 0,
    shake: 0,
  };
}

/** The station nearest the chef, within reach — or null. */
export function nearestStation(state) {
  const p = state.chef;
  let best = null;
  let bestD = 90;
  const consider = (key, rect) => {
    const cx = Math.max(rect.x, Math.min(p.x, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(p.y, rect.y + rect.h));
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < bestD) {
      bestD = d;
      best = key;
    }
  };
  for (const crate of STATIONS.crates) consider({ type: 'crate', kind: crate.kind }, crate);
  consider({ type: 'board' }, STATIONS.board);
  consider({ type: 'grill' }, STATIONS.grill);
  consider({ type: 'fryer' }, STATIONS.fryer);
  consider({ type: 'plating' }, STATIONS.plating);
  consider({ type: 'window' }, STATIONS.window);
  consider({ type: 'trash' }, STATIONS.trash);
  return best;
}

/** What E / a click does at a station. Returns 'ok' | 'error' | 'serve' | 'trash'. */
export function interact(state, station) {
  if (!station || state.over) return 'error';
  const say = (text) => {
    state.message = text;
    state.messageT = 2.2;
  };
  if (station.type === 'crate') {
    if (state.plateCarried) {
      say('Hands full — the plate comes first!');
      return 'error';
    }
    if (state.hands.length >= HAND_LIMIT) {
      say('Hands full!');
      return 'error';
    }
    state.hands.push(makeItem(station.kind));
    return 'ok';
  }
  if (station.type === 'board') {
    const board = state.board;
    if (board.item && board.item.prep === 'chopped') {
      if (state.hands.length >= HAND_LIMIT) {
        say('Hands full!');
        return 'error';
      }
      state.hands.push(board.item);
      board.item = null;
      board.chops = 0;
      return 'ok';
    }
    if (board.item) {
      board.chops += 1;
      if (board.chops >= CHOPS_NEEDED) {
        board.item.prep = 'chopped';
        board.chops = 0;
        return 'ok';
      }
      return 'ok';
    }
    const idx = state.hands.findIndex((it) => INGREDIENTS[it.kind].choppable && it.prep === 'whole');
    if (idx === -1) {
      say('Bring something to chop: lettuce, tomato or onion.');
      return 'error';
    }
    board.item = state.hands.splice(idx, 1)[0];
    board.chops = 0;
    return 'ok';
  }
  if (station.type === 'grill' || station.type === 'fryer') {
    const slots = station.type === 'grill' ? state.grill : state.fryer;
    const want = station.type === 'grill' ? 'patty' : 'fries';
    const empty = slots.find((s) => !s.item);
    const ready = slots.find((s) => s.item && s.item.prep !== 'raw');
    const heldIdx = state.hands.findIndex((it) => it.kind === want && it.prep === 'raw');
    if (ready && state.hands.length < HAND_LIMIT) {
      const slot = ready;
      state.hands.push(slot.item);
      slot.item = null;
      slot.t = 0;
      return 'ok';
    }
    if (heldIdx !== -1 && empty) {
      empty.item = state.hands.splice(heldIdx, 1)[0];
      empty.t = 0;
      return 'ok';
    }
    if (ready) {
      say('Hands full!');
      return 'error';
    }
    say(station.type === 'grill' ? 'The grill wants a raw patty.' : 'The fryer wants raw fries.');
    return 'error';
  }
  if (station.type === 'plating') {
    if (state.plateCarried) {
      state.plateOnCounter = state.plateCarried;
      state.plateCarried = null;
      return 'ok';
    }
    if (state.hands.length > 0) {
      state.plateOnCounter.push(...state.hands);
      state.hands = [];
      return 'ok';
    }
    if (state.plateOnCounter.length >= 0 && state.hands.length === 0) {
      state.plateCarried = state.plateOnCounter;
      state.plateOnCounter = [];
      return 'ok';
    }
    return 'error';
  }
  if (station.type === 'window') {
    if (!state.plateCarried || state.plateCarried.length === 0) {
      say('Bring a finished plate to serve!');
      return 'error';
    }
    const match = findOrder(state, state.plateCarried);
    if (!match) {
      state.shake = 0.4;
      say('No order wants this dish — check the board!');
      return 'error';
    }
    const recipe = RECIPES[match.recipe];
    const tip = Math.round(15 * Math.max(0, match.patience / match.patienceMax));
    const comboBonus = state.combo * 5;
    const earned = recipe.price + tip + comboBonus;
    state.coins += earned;
    state.served += 1;
    state.combo = Math.min(5, state.combo + 1);
    state.comboTimer = 20;
    state.orders = state.orders.filter((o) => o !== match);
    state.plateCarried = null;
    state.lastServe = { dish: recipe.name, earned, tip, combo: state.combo };
    return 'serve';
  }
  if (station.type === 'trash') {
    if (state.plateCarried) {
      state.plateCarried = [];
      return 'trash';
    }
    if (state.hands.length > 0) {
      state.hands = [];
      return 'trash';
    }
    say('Nothing to throw away.');
    return 'error';
  }
  return 'error';
}

function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const key = (it) => `${it.kind}:${it.prep}`;
  const aa = a.map(key).sort().join('|');
  const bb = b.map(key).sort().join('|');
  return aa === bb;
}

export function findOrder(state, plateItems) {
  for (const order of state.orders) {
    if (sameItems(plateItems, RECIPES[order.recipe].items)) return order;
  }
  return null;
}

export function recipeOf(order) {
  return RECIPES[order.recipe];
}

export { RECIPES, RECIPE_IDS, TARGET_COINS };
