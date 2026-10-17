import type { PhotoKey } from './images';

// Demo catalog: real CU stall names; menus, prices and locations are demo data for the client to correct.
// supabase/seed.sql is generated from this file (scripts/gen-seed.mjs), so both backends agree.

export type Category =
  | 'Coffee' | 'Chai' | 'Shakes' | 'Drinks' | 'Snacks' | 'Sandwiches' | 'Momos' | 'Chinese'
  | 'Pizza' | 'Pasta' | 'Meals' | 'South Indian' | 'Desserts';

export type Tag = 'bestseller' | 'spicy' | 'new';

export type Stall = {
  id: string;
  name: string;
  short: string;
  tagline: string;
  location: string;
  photo: PhotoKey;
  avgPrepMin: number;
  /** Default order cap; staff can change it live. */
  maxActive: number;
  /** Demo engine only: how busy the stall starts. */
  demoActive: number;
};

export type Item = {
  id: string;
  stallId: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  photo: PhotoKey;
  tags?: Tag[];
};

export const STALLS: Stall[] = [
  { id: 'hr-cafe', name: 'HR Cafe', short: 'HR', tagline: 'Cold coffee and quick bites', location: 'Main food court', photo: 'cover-hr', avgPrepMin: 9, maxActive: 100, demoActive: 46 },
  { id: 'creative-food', name: 'Creative Food', short: 'CF', tagline: 'Momos, noodles, Indo-Chinese', location: 'Food court, counter 3', photo: 'cover-creative', avgPrepMin: 12, maxActive: 100, demoActive: 71 },
  { id: 'books-n-cooks', name: 'Books n Cooks', short: 'BC', tagline: 'Pasta, bakes and slow coffee', location: 'Library block cafe', photo: 'cover-books', avgPrepMin: 14, maxActive: 80, demoActive: 23 },
  { id: 'tj', name: 'TJ', short: 'TJ', tagline: 'Shakes, chai and coolers', location: 'Near the main gate', photo: 'cover-tj', avgPrepMin: 6, maxActive: 120, demoActive: 38 },
  { id: 'lapinoz', name: "La Pino'z Pizza", short: 'LP', tagline: 'Loaded pizzas, straight from the oven', location: 'Food court, counter 1', photo: 'cover-lapinoz', avgPrepMin: 15, maxActive: 100, demoActive: 100 },
  { id: 'corner-cafe', name: 'Corner Cafe', short: 'CC', tagline: 'Waffles, pancakes and cold brew', location: 'Hostel side corner', photo: 'cover-corner', avgPrepMin: 10, maxActive: 100, demoActive: 88 },
  { id: 'food-republic', name: 'Food Republic', short: 'FR', tagline: 'Full meals, North and South', location: 'Food Republic court', photo: 'cover-fr', avgPrepMin: 11, maxActive: 150, demoActive: 54 },
];

const I = (stallId: string, rows: [string, string, string, Category, number, PhotoKey, Tag[]?][]): Item[] =>
  rows.map(([id, name, description, category, price, photo, tags]) => ({ id, stallId, name, description, category, price, photo, tags }));

export const ITEMS: Item[] = [
  ...I('hr-cafe', [
    ['hr-cold-coffee', 'Classic Cold Coffee', 'Thick, chilled, lightly sweet. Cocoa dust on top.', 'Coffee', 90, 'cold-coffee', ['bestseller']],
    ['hr-hazelnut', 'Hazelnut Frappe', 'Blended ice, espresso and roasted hazelnut.', 'Coffee', 130, 'hazelnut-frappe'],
    ['hr-cappuccino', 'Cappuccino', 'Double shot with silky foam.', 'Coffee', 80, 'cappuccino-top'],
    ['hr-paneer-sandwich', 'Paneer Tikka Sandwich', 'Smoky paneer and mint mayo, grilled till crisp.', 'Sandwiches', 110, 'paneer-sandwich', ['bestseller']],
    ['hr-club', 'Veg Club Sandwich', 'Triple-decker with tomato, cheese and pesto.', 'Sandwiches', 120, 'club-sandwich'],
    ['hr-fries', 'Peri Peri Fries', 'Crinkle-cut and tossed in peri peri spice.', 'Snacks', 90, 'peri-fries', ['spicy']],
    ['hr-maggi', 'Masala Maggi', 'The hostel classic, extra masala.', 'Snacks', 60, 'masala-maggi', ['bestseller']],
    ['hr-brownie', 'Fudge Brownie', 'Dense, gooey, warm.', 'Desserts', 70, 'brownie'],
  ]),
  ...I('creative-food', [
    ['cf-steam-momos', 'Veg Steamed Momos', 'Eight pieces with fiery red chutney.', 'Momos', 80, 'steam-momos', ['bestseller']],
    ['cf-fried-momos', 'Paneer Fried Momos', 'Pan-fried crisp, paneer and spring onion.', 'Momos', 110, 'fried-momos'],
    ['cf-momo-sampler', 'Momo Sampler', 'Steamed, fried and kurkure. Three each.', 'Momos', 150, 'momo-sampler', ['new']],
    ['cf-hakka', 'Veg Hakka Noodles', 'Wok-tossed with crunchy veggies.', 'Chinese', 110, 'hakka'],
    ['cf-schezwan', 'Schezwan Noodles', 'Hot, garlicky, glossy.', 'Chinese', 120, 'schezwan', ['spicy']],
    ['cf-chilli-paneer', 'Chilli Paneer Dry', 'Crispy paneer, capsicum, soy and chilli.', 'Chinese', 140, 'chilli-paneer', ['bestseller', 'spicy']],
    ['cf-chilli-potato', 'Honey Chilli Potato', 'Crunchy fingers in sweet-hot glaze.', 'Chinese', 100, 'chilli-potato'],
    ['cf-fried-rice', 'Veg Fried Rice', 'Smoky wok rice with peas and carrots.', 'Chinese', 110, 'fried-rice'],
    ['cf-burger', 'Crispy Veg Burger', 'Crumbed patty, lettuce, house sauce.', 'Snacks', 80, 'veg-burger'],
  ]),
  ...I('books-n-cooks', [
    ['bnc-white-pasta', 'White Sauce Penne', 'Creamy, cheesy, with sweet corn and capsicum.', 'Pasta', 150, 'white-pasta', ['bestseller']],
    ['bnc-red-pasta', 'Arrabbiata Penne', 'Tangy tomato and chilli flakes.', 'Pasta', 140, 'red-pasta', ['spicy']],
    ['bnc-pesto', 'Pesto Farfalle', 'Basil pesto, cherry tomatoes, parmesan.', 'Pasta', 160, 'pesto', ['new']],
    ['bnc-garlic-bread', 'Cheesy Garlic Bread', 'Four slices, herb butter, mozzarella.', 'Snacks', 110, 'garlic-bread'],
    ['bnc-sub', 'Grilled Veg Sub', 'Six-inch sub with grilled veggies.', 'Sandwiches', 120, 'veg-sub'],
    ['bnc-latte', 'Cafe Latte', 'Smooth espresso, steamed milk.', 'Coffee', 90, 'latte'],
    ['bnc-iced-tea', 'Lemon Iced Tea', 'Brewed in-house, fresh lime.', 'Drinks', 70, 'iced-tea'],
    ['bnc-cheesecake', 'Blueberry Cheesecake', 'Baked, with a blueberry compote.', 'Desserts', 160, 'cheesecake'],
    ['bnc-cookie', 'Choco Chip Cookies', 'Two chunky cookies, crisp edges.', 'Desserts', 60, 'cookies'],
  ]),
  ...I('tj', [
    ['tj-chai', 'Masala Chai', 'Adrak, elaichi, full cream.', 'Chai', 25, 'chai', ['bestseller']],
    ['tj-bun-maska', 'Bun Maska + Chai', 'Soft bun, loads of butter, cutting chai.', 'Chai', 50, 'bun-maska'],
    ['tj-samosa', 'Samosa (2 pc)', 'Hot, crisp, with green chutney.', 'Snacks', 30, 'samosa'],
    ['tj-oreo', 'Oreo Shake', 'Thick, crunchy, very Oreo.', 'Shakes', 110, 'oreo-shake', ['bestseller']],
    ['tj-strawberry', 'Strawberry Shake', 'Real strawberries, no syrup.', 'Shakes', 110, 'strawberry-shake'],
    ['tj-mango', 'Mango Shake', 'Alphonso pulp, chilled.', 'Shakes', 100, 'mango-shake'],
    ['tj-vanilla', 'Vanilla Thick Shake', 'Double scoop, extra thick.', 'Shakes', 100, 'vanilla-shake'],
    ['tj-lime-soda', 'Fresh Lime Soda', 'Sweet, salted or mixed.', 'Drinks', 60, 'lime-soda'],
  ]),
  ...I('lapinoz', [
    ['lp-margherita', 'Margherita', 'Tomato, mozzarella, fresh basil.', 'Pizza', 199, 'margherita', ['bestseller']],
    ['lp-farmhouse', 'Farmhouse', 'Onion, capsicum, mushroom, tomato.', 'Pizza', 299, 'farmhouse'],
    ['lp-mushroom', 'Mushroom Overload', 'Three kinds of mushroom, garlic oil.', 'Pizza', 279, 'mushroom-pizza'],
    ['lp-paneer', 'Paneer Tikka Pizza', 'Tandoori paneer, onion, mint drizzle.', 'Pizza', 329, 'paneer-pizza', ['spicy']],
    ['lp-garden', 'Spinach and Ricotta', 'Baby spinach, ricotta, chilli oil.', 'Pizza', 319, 'spinach-pizza', ['new']],
    ['lp-veggie', 'Veggie Supreme', 'Olives, jalapeno, tomato, sweet corn.', 'Pizza', 289, 'veggie-pizza'],
    ['lp-cheese', 'Double Cheese', 'Mozzarella and cheddar, nothing else.', 'Pizza', 249, 'cheese-pizza'],
    ['lp-sundae', 'Brownie Sundae', 'Warm brownie, vanilla scoop, fudge.', 'Desserts', 129, 'brownie-sundae'],
  ]),
  ...I('corner-cafe', [
    ['cc-waffle', 'Belgian Chocolate Waffle', 'Crisp outside, molten chocolate.', 'Desserts', 150, 'waffle', ['bestseller']],
    ['cc-berry-waffle', 'Berry Yogurt Waffle', 'Greek yogurt, berries, honey.', 'Desserts', 170, 'berry-waffle'],
    ['cc-choco-pancakes', 'Choco Strawberry Pancakes', 'Three fluffy pancakes, chocolate sauce.', 'Desserts', 170, 'choco-pancakes'],
    ['cc-maple-stack', 'Maple Pancake Stack', 'Banana, blueberries, maple syrup.', 'Desserts', 160, 'pancake-stack'],
    ['cc-cold-brew', 'Cold Brew Latte', '16-hour brew over milk and ice.', 'Coffee', 140, 'cold-brew', ['new']],
    ['cc-americano', 'Iced Americano', 'Espresso over ice. Clean and strong.', 'Coffee', 100, 'iced-americano'],
    ['cc-cappuccino', 'Cappuccino', 'Classic, poured to order.', 'Coffee', 90, 'cappuccino-pour'],
    ['cc-kitkat', 'KitKat Freakshake', 'Chocolate shake, whipped cream, KitKat.', 'Shakes', 160, 'kitkat-shake'],
    ['cc-grilled-cheese', 'Grilled Cheese Sandwich', 'Three cheeses, sourdough, chilli jam.', 'Sandwiches', 100, 'grilled-cheese'],
  ]),
  ...I('food-republic', [
    ['fr-chole-bhature', 'Chole Bhature', 'Two fluffy bhature, Amritsari chole, pickle.', 'Meals', 110, 'chole-bhature', ['bestseller']],
    ['fr-paneer-butter', 'Paneer Butter Masala + 2 Naan', 'Rich tomato-butter gravy.', 'Meals', 170, 'paneer-butter'],
    ['fr-paneer-tikka', 'Paneer Tikka', 'Tandoor-charred, with mint chutney.', 'Meals', 160, 'paneer-tikka'],
    ['fr-pav-bhaji', 'Pav Bhaji', 'Buttery bhaji, two toasted pav.', 'Meals', 100, 'pav-bhaji'],
    ['fr-thali', 'Dal Roti Thali', 'Dal, sabzi, rice, three rotis.', 'Meals', 120, 'thali', ['bestseller']],
    ['fr-pulao', 'Veg Pulao + Raita', 'Fragrant basmati, boondi raita.', 'Meals', 110, 'pulao'],
    ['fr-paratha', 'Aloo Paratha + Curd', 'Two parathas, white butter, curd.', 'Meals', 80, 'aloo-paratha'],
    ['fr-dosa', 'Masala Dosa', 'Crisp dosa, sambar, two chutneys.', 'South Indian', 110, 'dosa'],
    ['fr-idli', 'Idli Vada Sambar', 'Two idli, one vada, hot sambar.', 'South Indian', 90, 'idli'],
    ['fr-gulab-jamun', 'Gulab Jamun (2 pc)', 'Warm, syrupy, soft.', 'Desserts', 50, 'gulab-jamun'],
  ]),
];

export const CATEGORIES: { name: Category; photo: PhotoKey }[] = [
  { name: 'Coffee', photo: 'cold-coffee' },
  { name: 'Momos', photo: 'steam-momos' },
  { name: 'Pizza', photo: 'margherita' },
  { name: 'Meals', photo: 'chole-bhature' },
  { name: 'Shakes', photo: 'oreo-shake' },
  { name: 'Chinese', photo: 'hakka' },
  { name: 'Snacks', photo: 'peri-fries' },
  { name: 'Desserts', photo: 'waffle' },
  { name: 'Pasta', photo: 'white-pasta' },
  { name: 'Chai', photo: 'chai' },
  { name: 'Sandwiches', photo: 'paneer-sandwich' },
  { name: 'South Indian', photo: 'dosa' },
  { name: 'Drinks', photo: 'lime-soda' },
];

export const stallById = Object.fromEntries(STALLS.map((s) => [s.id, s])) as Record<string, Stall>;
export const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<string, Item>;
export const itemsOf = (stallId: string) => ITEMS.filter((i) => i.stallId === stallId);

/** Staff edits on top of the base menu: new dishes and changed prices. */
export type MenuPatch = { prices: Record<string, number>; added: Item[] };

const BASE = ITEMS.map((i) => ({ ...i }));

/** Dishes from the printed menu: staff can reprice them; dishes a stall added are fully editable. */
export const isBaseItem = (id: string) => BASE.some((i) => i.id === id);

/**
 * The live menu is this same registry, patched in place, so every reader (cart pricing,
 * search, the demo kitchen) sees staff edits without threading a menu through the app.
 */
export function applyMenu(patch: MenuPatch) {
  const next = [...BASE.map((i) => (patch.prices[i.id] ? { ...i, price: patch.prices[i.id] } : { ...i })), ...patch.added];
  ITEMS.length = 0;
  ITEMS.push(...next);
  for (const k of Object.keys(itemById)) delete itemById[k];
  for (const i of next) itemById[i.id] = i;
}
