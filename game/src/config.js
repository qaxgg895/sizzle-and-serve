// Sizzle & Serve: configuration — canvas size, stations, ingredients and recipes.
// One clear job: every number and name the rest of the game shares lives here.

export const VIEW = { width: 1280, height: 800 };
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 180;
export const TARGET_COINS = 500;
export const START_HEARTS = 3;
export const MAX_ORDERS = 4;
export const HAND_LIMIT = 4;

/** Ingredient kinds and how they look and behave. */
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8a54b', dark: '#b97a28', prep: 'plain', choppable: false, cook: null },
  patty: { name: 'Patty', color: '#8a4b2d', dark: '#5e2f1a', prep: 'raw', choppable: false, cook: 'grill' },
  cheese: { name: 'Cheese', color: '#ffc93c', dark: '#d99a00', prep: 'plain', choppable: false, cook: null },
  lettuce: { name: 'Lettuce', color: '#7dc242', dark: '#4e8a26', prep: 'whole', choppable: true, cook: null },
  tomato: { name: 'Tomato', color: '#e8483f', dark: '#b32720', prep: 'whole', choppable: true, cook: null },
  onion: { name: 'Onion', color: '#f2e6f0', dark: '#b99ac4', prep: 'whole', choppable: true, cook: null },
  fries: { name: 'Fries', color: '#ffd766', dark: '#d9a521', prep: 'raw', choppable: false, cook: 'fryer' },
};

/** Cooking times (seconds on the station) and the burn point. */
export const COOK = {
  grill: { done: 8, burnt: 13 },
  fryer: { done: 6, burnt: 10 },
};
export const CHOPS_NEEDED = 3;

/** Recipes: the dishes the order board asks for. */
export const RECIPES = {
  classic: {
    name: 'Classic Burger', price: 30,
    items: [
      { kind: 'bun', prep: 'plain' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'cheese', prep: 'plain' },
    ],
  },
  garden: {
    name: 'Garden Burger', price: 40,
    items: [
      { kind: 'bun', prep: 'plain' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'lettuce', prep: 'chopped' },
      { kind: 'tomato', prep: 'chopped' },
    ],
  },
  salad: {
    name: 'Garden Salad', price: 25,
    items: [
      { kind: 'lettuce', prep: 'chopped' },
      { kind: 'tomato', prep: 'chopped' },
      { kind: 'onion', prep: 'chopped' },
    ],
  },
  fries: {
    name: 'Crispy Fries', price: 20,
    items: [{ kind: 'fries', prep: 'cooked' }],
  },
  deluxe: {
    name: 'Deluxe Burger', price: 55,
    items: [
      { kind: 'bun', prep: 'plain' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'cheese', prep: 'plain' },
      { kind: 'lettuce', prep: 'chopped' },
      { kind: 'tomato', prep: 'chopped' },
      { kind: 'onion', prep: 'chopped' },
    ],
  },
};
export const RECIPE_IDS = ['classic', 'garden', 'salad', 'fries', 'deluxe'];
/** Early orders are simple; the full menu unlocks as the shift heats up. */
export const MENU_BY_TIME = [
  { after: 0, ids: ['classic', 'fries', 'salad'] },
  { after: 45, ids: ['classic', 'garden', 'fries', 'salad'] },
  { after: 100, ids: ['classic', 'garden', 'salad', 'fries', 'deluxe'] },
];

/** Kitchen stations: rectangles the chef walks up to and uses with E / click. */
export const STATIONS = {
  crates: [
    { kind: 'bun', x: 40, y: 128, w: 158, h: 84 },
    { kind: 'patty', x: 206, y: 128, w: 158, h: 84 },
    { kind: 'cheese', x: 372, y: 128, w: 158, h: 84 },
    { kind: 'lettuce', x: 538, y: 128, w: 158, h: 84 },
    { kind: 'tomato', x: 704, y: 128, w: 158, h: 84 },
    { kind: 'onion', x: 870, y: 128, w: 158, h: 84 },
    { kind: 'fries', x: 1036, y: 128, w: 158, h: 84 },
  ],
  board: { x: 60, y: 300, w: 240, h: 110 },
  grill: { x: 380, y: 300, w: 280, h: 120, slots: 2 },
  fryer: { x: 740, y: 300, w: 280, h: 120, slots: 2 },
  plating: { x: 60, y: 560, w: 360, h: 120 },
  window: { x: 980, y: 560, w: 220, h: 130 },
  trash: { x: 1100, y: 300, w: 100, h: 110 },
};

/** Where the chef starts, and how fast they move. */
export const CHEF = { x: 640, y: 480, radius: 22, speed: 280 };
export const BEST_KEY = 'sizzle-and-serve-best';
