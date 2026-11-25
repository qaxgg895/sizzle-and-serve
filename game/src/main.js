// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps, and the renderer paints what is there. Screens: title, play,
// paused and game over. Clicking a station walks the chef there and uses it.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, interact, nearestStation, EVENT_BURNT, EVENT_COOKED, EVENT_EXPIRED, EVENT_ORDER, EVENT_OVER, EVENT_SERVED } from './world.js';
import { ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { sfx, toggleMute, unlockAudio } from './audio.js';
import { STATIONS } from './config.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let lastServeShown = 0;

  const announce = (message) => {
    status.textContent = message;
  };

  function startGame() {
    world.reset();
    accumulator = 0;
    lastServeShown = 0;
    screen = SCREEN_PLAY;
    sfx.start();
    announce('Playing. Serve 500 coins of food before the shift ends.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(world.state.win
      ? `Shift complete! ${world.state.coins} coins. Best ${best}.`
      : `Shift over. ${world.state.coins} coins. Best ${best}.`);
  }

  function useStation() {
    const station = nearestStation(world.state);
    if (!station) return;
    unlockAudio();
    const result = interact(world.state, station);
    if (result === 'serve') {
      sfx.serve();
      announce(`Served ${world.state.lastServe.dish} for ${world.state.lastServe.earned} coins!`);
      lastServeShown = performance.now();
    } else if (result === 'ok') {
      sfx.place();
    } else if (result === 'trash') {
      sfx.error();
    } else {
      sfx.error();
    }
  }

  function handleEvents(events) {
    if (events & EVENT_ORDER) sfx.order();
    if (events & EVENT_COOKED) sfx.done();
    if (events & EVENT_BURNT) sfx.error();
    if (events & EVENT_EXPIRED) {
      sfx.error();
      announce(`An order walked out! ${world.state.hearts} hearts left.`);
    }
    if (events & EVENT_OVER) endGame();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) startGame();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    if (actions & ACTION_INTERACT && screen === SCREEN_PLAY) useStation();
  }

  function onPointer(x, y) {
    unlockAudio();
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    // Clicking a station walks there and uses it on arrival; a floor click just walks.
    const station = stationAt(x, y);
    if (station) {
      const rect = stationRect(station);
      world.state.chef.target = { x: rect.x + rect.w / 2, y: rect.y + rect.h + 34 };
      world.state.chef.detour = null;
      world.state.chef.stuckT = 0;
      world.state.chef.lastDist = Infinity;
      world.state.chef.onArrive = () => useStation();
    } else {
      world.state.chef.target = { x, y: Math.max(240, y) };
      world.state.chef.detour = null;
      world.state.chef.stuckT = 0;
      world.state.chef.lastDist = Infinity;
      world.state.chef.onArrive = null;
    }
  }

  const input = createInput(canvas, onPointer);

  function step() {
    const events = world.step(STEP, input.direction(), screen === SCREEN_TITLE);
    if (world.state.messageT > 0) world.state.messageT -= STEP;
    if (world.state.shake > 0) world.state.shake -= STEP;
    if (lastServeShown && performance.now() - lastServeShown > 3000) {
      world.state.lastServe = null;
      lastServeShown = 0;
    }
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle and Serve. Press Space or click to start.');
  requestAnimationFrame(frame);
}

/** The station whose rectangle holds (x, y), or null. */
function stationAt(x, y) {
  const inside = (r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  for (const crate of STATIONS.crates) if (inside(crate)) return { type: 'crate', kind: crate.kind };
  for (const key of ['board', 'grill', 'fryer', 'plating', 'window', 'trash']) {
    if (inside(STATIONS[key])) return { type: key };
  }
  return null;
}

function stationRect(station) {
  if (station.type === 'crate') return STATIONS.crates.find((c) => c.kind === station.kind);
  return STATIONS[station.type];
}

if (shot) runShot(shot);
else runGame();

// A read-only handle for play-testing (?debug): the live world state.
if (params.get('debug') !== null) window.__game = world;
