// The screenshot scenes behind ?shot=start|play|serve|end.
// Each one builds a fixed world state directly (same seed, same numbers every
// time), so the frame is a finished still of a real game state, not a mock-up.

import { INGREDIENTS, RECIPES } from './config.js';
import { makeItem } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function setOrder(world, num, recipe, patience, patienceMax) {
  world.state.orders.push({ id: num, num, recipe, patience, patienceMax });
}

/**
 * Stage the named scene on `world` and return the screen to draw and the best
 * score to show. Any other name stages the title scene.
 */
export function stageShot(name, world) {
  const s = world.state;
  world.reset();
  s.orders = [];
  if (name === 'play') {
    // Mid-shift: a patty on the grill half cooked, a plate mid-assembly,
    // a tomato being chopped, two orders waiting, timer at 2:15.
    setOrder(world, 1, 'garden', 52, 80);
    setOrder(world, 2, 'classic', 38, 75);
    s.grill[0] = { item: makeItem('patty', 'cooked'), t: 8 };
    s.grill[1] = { item: makeItem('patty', 'raw'), t: 4.5 };
    s.fryer[0] = { item: makeItem('fries', 'cooked'), t: 6 };
    s.board = { item: makeItem('tomato', 'whole'), chops: 2 };
    s.plateOnCounter = [makeItem('bun', 'plain'), makeItem('cheese', 'plain')];
    s.hands = [makeItem('lettuce', 'chopped')];
    s.chef.x = 520;
    s.chef.y = 450;
    s.chef.facing = 1;
    s.timeLeft = 135;
    s.coins = 120;
    s.combo = 2;
    s.comboTimer = 18;
    s.served = 3;
    return { screen: SCREEN_PLAY, best: 340 };
  }
  if (name === 'serve') {
    // The money shot: a full Deluxe Burger plated, chef carrying it to the
    // service window, an order for it on the board, timer at 1:05.
    setOrder(world, 3, 'deluxe', 44, 70);
    setOrder(world, 4, 'fries', 61, 80);
    s.plateCarried = RECIPES.deluxe.items.map((it) => makeItem(it.kind, it.prep));
    s.plateOnCounter = [];
    s.grill[0] = { item: makeItem('patty', 'cooked'), t: 8.2 };
    s.fryer[0] = { item: makeItem('fries', 'raw'), t: 3 };
    s.board = { item: makeItem('lettuce', 'whole'), chops: 0 };
    s.hands = [];
    s.chef.x = 880;
    s.chef.y = 620;
    s.chef.facing = 1;
    s.timeLeft = 65;
    s.coins = 260;
    s.combo = 3;
    s.comboTimer = 15;
    s.served = 6;
    s.lastServe = { dish: 'Garden Burger', earned: 58, tip: 13, combo: 3 };
    return { screen: SCREEN_PLAY, best: 340 };
  }
  if (name === 'end') {
    // Shift complete: target beaten, three stars, orders cleared.
    s.timeLeft = 0;
    s.coins = 512;
    s.served = 11;
    s.failed = 1;
    s.over = true;
    s.win = true;
    s.chef.x = 640;
    s.chef.y = 480;
    return { screen: SCREEN_OVER, best: 512 };
  }
  // Title: the kitchen at rest, orders already on the board, ingredients in
  // the crates — the cover frame.
  setOrder(world, 1, 'classic', 70, 80);
  setOrder(world, 2, 'garden', 55, 80);
  setOrder(world, 3, 'salad', 74, 80);
  s.timeLeft = 180;
  s.coins = 0;
  s.chef.x = 640;
  s.chef.y = 470;
  return { screen: SCREEN_TITLE, best: 340 };
}

export { INGREDIENTS };
