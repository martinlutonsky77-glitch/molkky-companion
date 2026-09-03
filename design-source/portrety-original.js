/**
 * portrety.js — 30 portrétů hráčů pro appku na Mölkky.
 *
 * Druhá sada k faces.js: místo barevných hlav ve stylu emoji jsou to lidé —
 * odstín pleti, účes, obočí, nos, vousy, doplňky a barevné tričko v ramenou.
 * Stejný rám i stejné API jako faces.js, takže se obě sady dají míchat.
 *
 *   import { PORTRAITS, renderPortrait, portraitForKey, randomPortrait } from './portrety.js';
 *   el.innerHTML = renderPortrait(PORTRAITS[3], { size: 64 });
 *   el.innerHTML = renderPortrait(portraitForKey('Standa'));
 *
 * Vrstvy se kreslí v pořadí: ramena → krk → vlasy vzadu → uši → hlava →
 * obočí, oči, nos, ústa → vousy → vlasy vepředu → doplňky.
 */

const INK = '#2B2622';

export const SKINS = ['#F5D6BC', '#EFC39C', '#DCA579', '#BE8155', '#96603A', '#6B4426'];
export const HAIRS = ['#2E2621', '#5B3B22', '#A9762F', '#D9B26A', '#B9B3AA', '#C9587E'];
export const SHIRTS = ['#E76F51', '#4FA6A0', '#6C9BD1', '#8AB17D', '#B08BBB', '#E9C46A', '#D9D2C5', '#EFA6B4'];

const s = (w = 2.6) =>
  `fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const f = (fill, w = 2.6) =>
  `fill="${fill}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"`;
const plain = (fill) => `fill="${fill}" stroke="none"`;

/* ----------------------------------------------------------------- tělo -- */

const shoulders = (c) =>
  `<path d="M17 100q1-15 15-20l18-4 18 4q14 5 15 20z" ${f(c)}/>`;
const neck = (c) => `<path d="M42 66h16v14q0 4-8 4t-8-4z" ${f(c)}/>`;
const ears = (c) =>
  `<ellipse cx="26" cy="55" rx="4.5" ry="6.5" ${f(c)}/><ellipse cx="74" cy="55" rx="4.5" ry="6.5" ${f(c)}/>`;

/* ---------------------------------------------------------------- hlavy -- */

export const HEADS = {
  ovalna: (c) => `<ellipse cx="50" cy="50" rx="23" ry="28" ${f(c)}/>`,
  kulata: (c) => `<ellipse cx="50" cy="51" rx="25" ry="25" ${f(c)}/>`,
  hranata: (c) => `<path d="M27 38q0-15 23-15t23 15v16q0 24-23 24T27 54z" ${f(c)}/>`,
  protahla: (c) => `<ellipse cx="50" cy="50" rx="21" ry="30" ${f(c)}/>`,
};

/* ---------------------------------------------------------------- vlasy -- */
/* Každý účes má vrstvu za hlavou (back) a přes čelo (front).                 */

export const HAIRSTYLES = {
  plesaty: { back: () => '', front: () => '' },
  vinek: { back: () => '', front: (c) => `<path d="M27 44q3-9 8-9 -4 5-3 10M73 44q-3-9-8-9 4 5 3 10" ${f(c)}/>` },
  kratke: {
    back: () => '',
    front: (c) => `<path d="M26 46q-2-25 24-25t24 25q-4-14-24-13T26 46z" ${f(c)}/>`,
  },
  pesinka: {
    back: () => '',
    front: (c) => `<path d="M26 45q-2-24 24-24t24 24q-3-13-16-14-8 7-20 6 4-4 5-7-14 3-17 15z" ${f(c)}/>`,
  },
  ofina: {
    back: () => '',
    front: (c) => `<path d="M26 44q-1-24 24-24t24 24V38q-24 6-48-2z" ${f(c)}/>`,
  },
  jezek: {
    back: () => '',
    front: (c) =>
      `<path d="M27 40l3-8 4 5 4-9 5 7 4-9 4 8 5-8 4 9 5-6 4 8 4-4 2 7q-24-9-48 0z" ${f(c)}/>`,
  },
  rozcuch: {
    back: () => '',
    front: (c) =>
      `<path d="M25 44q-4-14 6-19 2-6 10-5 6-5 13-1 10-2 12 7 8 6 4 18-4-16-22-14-16 2-23 14z" ${f(c)}/>`,
  },
  kudrny: {
    back: (c) =>
      `<g ${f(c)}><circle cx="32" cy="30" r="10"/><circle cx="46" cy="24" r="11"/><circle cx="60" cy="26" r="10"/><circle cx="70" cy="34" r="9"/><circle cx="28" cy="42" r="8"/><circle cx="72" cy="45" r="8"/></g>`,
    front: () => '',
  },
  afro: {
    back: (c) => `<circle cx="50" cy="36" r="31" ${f(c)}/>`,
    front: () => '',
  },
  mikado: {
    back: (c) => `<path d="M23 44q0-26 27-26t27 26v28H63l-2-24H39l-2 24H23z" ${f(c)}/>`,
    front: (c) => `<path d="M26 44q-1-23 24-23t24 23q-6-14-24-13T26 44z" ${f(c)}/>`,
  },
  dlouhe: {
    back: (c) => `<path d="M22 46q0-28 28-28t28 28v44q-8-6-14-4l-3-26H39l-3 26q-6-2-14 4z" ${f(c)}/>`,
    front: (c) => `<path d="M27 45q-2-24 23-24t23 24q-5-15-23-14T27 45z" ${f(c)}/>`,
  },
  culik: {
    back: (c) => `<path d="M70 34q14 4 15 18t-9 20q6-12 1-22t-13-10z" ${f(c)}/>`,
    front: (c) => `<path d="M26 45q-2-24 24-24t24 24q-4-15-24-14T26 45z" ${f(c)}/>`,
  },
  drdol: {
    back: (c) => `<circle cx="50" cy="17" r="10" ${f(c)}/>`,
    front: (c) => `<path d="M27 44q-2-23 23-23t23 23q-4-14-23-13T27 44z" ${f(c)}/>`,
  },
  copanky: {
    back: (c) =>
      `<path d="M25 40q-8 8-6 20t8 16q-4-12-1-20t7-10zM75 40q8 8 6 20t-8 16q4-12 1-20t-7-10z" ${f(c)}/>`,
    front: (c) => `<path d="M26 45q-2-24 24-24t24 24q-4-15-24-14T26 45z" ${f(c)}/>`,
  },
  mohawk: {
    back: () => '',
    front: (c) => `<path d="M44 40q0-22 6-30 6 8 6 30-6-3-12 0z" ${f(c)}/>`,
  },
};

/* ------------------------------------------------------------------ oči -- */

export const EYES = {
  normalni: () =>
    `<ellipse cx="40" cy="50" rx="5.5" ry="4" ${f('#fff', 2.2)}/><ellipse cx="60" cy="50" rx="5.5" ry="4" ${f('#fff', 2.2)}/>` +
    `<circle cx="40" cy="50" r="2.3" fill="${INK}"/><circle cx="60" cy="50" r="2.3" fill="${INK}"/>`,
  tecky: () => `<circle cx="40" cy="50" r="2.8" fill="${INK}"/><circle cx="60" cy="50" r="2.8" fill="${INK}"/>`,
  vytrestene: () =>
    `<circle cx="40" cy="50" r="6.5" ${f('#fff', 2.2)}/><circle cx="60" cy="50" r="6.5" ${f('#fff', 2.2)}/>` +
    `<circle cx="40" cy="50" r="2.4" fill="${INK}"/><circle cx="60" cy="50" r="2.4" fill="${INK}"/>`,
  silhave: () =>
    `<circle cx="40" cy="50" r="6" ${f('#fff', 2.2)}/><circle cx="60" cy="50" r="6" ${f('#fff', 2.2)}/>` +
    `<circle cx="44" cy="51" r="2.4" fill="${INK}"/><circle cx="56" cy="51" r="2.4" fill="${INK}"/>`,
  privrene: () => `<path d="M34 50a6 6 0 0 1 12 0M54 50a6 6 0 0 1 12 0" ${s(2.6)}/>`,
  radostne: () => `<path d="M35 52q5-7 10 0M55 52q5-7 10 0" ${s(2.8)}/>`,
  mrknuti: () =>
    `<circle cx="40" cy="50" r="2.8" fill="${INK}"/><path d="M54 51a6 6 0 0 1 12 0" ${s(2.6)}/>`,
  unavene: () =>
    `<ellipse cx="40" cy="50" rx="5" ry="3.6" ${f('#fff', 2.2)}/><ellipse cx="60" cy="50" rx="5" ry="3.6" ${f('#fff', 2.2)}/>` +
    `<circle cx="40" cy="50" r="2.2" fill="${INK}"/><circle cx="60" cy="50" r="2.2" fill="${INK}"/>` +
    `<path d="M35 57q5 3 10 0M55 57q5 3 10 0" ${s(1.8)}/>`,
};

/* ---------------------------------------------------------------- obočí -- */

export const BROWS = {
  rovne: () => `<path d="M34 41h11M55 41h11" ${s(2.6)}/>`,
  tenke: () => `<path d="M34 41q5-3 11 0M55 41q6-3 11 0" ${s(1.8)}/>`,
  huste: () => `<path d="M33 41h13M54 41h13" ${s(5)}/>`,
  zvednute: () => `<path d="M34 42a6 5 0 0 1 11 0M55 42a6 5 0 0 1 11 0" ${s(2.6)}/>`,
  nastvane: () => `<path d="M34 38l11 5M66 38l-11 5" ${s(2.8)}/>`,
  jedno: () => `<path d="M34 42h11M55 37a6 4 0 0 1 11 0" ${s(2.6)}/>`,
};

/* ------------------------------------------------------------------ nos -- */

export const NOSES = {
  hacek: () => `<path d="M50 52v6l-4 2" ${s(2.4)}/>`,
  tecka: () => `<circle cx="50" cy="59" r="2" fill="${INK}"/>`,
  siroky: () => `<path d="M46 58q4 4 8 0" ${s(2.4)}/>`,
};

/* ----------------------------------------------------------------- ústa -- */

export const MOUTHS = {
  usmev: () => `<path d="M42 68q8 7 16 0" ${s(2.8)}/>`,
  siroky: () => `<path d="M38 66q12 12 24 0" ${s(2.8)}/>`,
  ceneni: () =>
    `<path d="M39 65h22v6q0 6-11 6t-11-6z" ${f('#fff', 2.4)}/><path d="M39 70h22" ${s(2)}/>`,
  cara: () => `<path d="M43 69h14" ${s(2.8)}/>`,
  usklebek: () => `<path d="M43 70q9 5 15-4" ${s(2.8)}/>`,
  mracik: () => `<path d="M42 73q8-7 16 0" ${s(2.8)}/>`,
  puska: () => `<ellipse cx="50" cy="70" rx="5" ry="6" ${f(INK, 0)}/>`,
  rty: () => `<path d="M42 68q4-4 8 0 4-4 8 0-4 8-8 8t-8-8z" ${f('#C9587E', 2.2)}/>`,
};

/* ---------------------------------------------------------------- vousy -- */

export const BEARDS = {
  zadne: () => '',
  knir: () => `<path d="M50 64q-7-5-11 1 6 4 11-1 5 5 11 1-4-6-11-1z" ${plain(INK)}/>`,
  strniste: () =>
    `<path d="M28 55q2 25 22 25t22-25q-2 14-22 14T28 55z" fill="${INK}" opacity=".35"/>`,
  bradka: () => `<path d="M44 76q6 4 12 0-2 8-6 9t-6-9z" ${plain(INK)}/>`,
  plnovous: (c) =>
    `<path d="M27 52q0 30 23 30t23-30q-1 12-11 15h-24q-10-3-11-15z" ${f(c)}/>`,
  licousy: (c) =>
    `<path d="M27 42q-3 20 4 28 3-14 2-28zM73 42q3 20-4 28-3-14-2-28z" ${f(c)}/>`,
};

/* -------------------------------------------------------------- doplňky -- */

export const ACCESSORIES = {
  zadny: () => '',
  bryle: () =>
    `<circle cx="40" cy="50" r="10" ${s(2.4)}/><circle cx="60" cy="50" r="10" ${s(2.4)}/>` +
    `<path d="M50 50h0M30 48l-4-2M70 48l4-2" ${s(2.4)}/>`,
  slunecni: () =>
    `<path d="M29 43h19v8q0 6-9.5 6T29 51zM52 43h19v8q0 6-9.5 6T52 51z" ${f(INK, 0)}/>` +
    `<path d="M48 45h4" ${s(2.4)}/>`,
  cepice: (c) =>
    `<path d="M25 32q4-17 25-17t25 17z" ${f(c)}/><path d="M25 32h50l10 6-10 4H25z" ${f(c)}/>`,
  celenka: (c) => `<path d="M26 34q24-12 48 0" ${f(c, 5)}/>`,
  nausnice: () => `<circle cx="26" cy="63" r="2.6" ${f('#E9C46A', 1.6)}/><circle cx="74" cy="63" r="2.6" ${f('#E9C46A', 1.6)}/>`,
  sluchatka: () =>
    `<path d="M26 50a24 24 0 0 1 48 0" ${s(4)}/>` +
    `<rect x="19" y="46" width="10" height="16" rx="4" ${f('#E76F51', 2.4)}/>` +
    `<rect x="71" y="46" width="10" height="16" rx="4" ${f('#E76F51', 2.4)}/>`,
  naplast: () =>
    `<path d="M60 30l14 8" ${s(8)}/><path d="M60 30l14 8" fill="none" stroke="#F6EDE0" stroke-width="5" stroke-linecap="round"/>`,
};

/* --------------------------------------------------------------- render -- */

export function renderPortrait(p, opts = {}) {
  const { size = 96, className = '', background = null, title = p.name } = opts;
  const hair = HAIRSTYLES[p.hair];
  const parts = [
    background ? `<circle cx="50" cy="50" r="50" fill="${background}"/>` : '',
    shoulders(p.shirt),
    neck(p.skin),
    hair.back(p.hairColor),
    ears(p.skin),
    HEADS[p.head](p.skin),
    BROWS[p.brows](),
    EYES[p.eyes](),
    NOSES[p.nose](),
    MOUTHS[p.mouth](),
    BEARDS[p.beard](p.hairColor),
    hair.front(p.hairColor),
    ACCESSORIES[p.accessory](p.shirt),
  ];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}"` +
    ` role="img" aria-label="${esc(title)}" class="${className}">` +
    `<title>${esc(title)}</title>${parts.join('')}</svg>`
  );
}

const esc = (t) =>
  String(t).replace(/[<>&"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[ch]));

/* -------------------------------------------------------------- presety -- */

const p = (id, name, head, hair, hairColor, skin, brows, eyes, nose, mouth, beard, accessory, shirt) => ({
  id, name, head, hair, brows, eyes, nose, mouth, beard, accessory,
  hairColor: HAIRS[hairColor], skin: SKINS[skin], shirt: SHIRTS[shirt],
});

/** 30 hotových portrétů. Pořadí je zároveň doporučené pořadí přidělování. */
export const PORTRAITS = [
  p('bara', 'Bára', 'ovalna', 'dlouhe', 1, 0, 'tenke', 'normalni', 'hacek', 'usmev', 'zadne', 'zadny', 2),
  p('standa', 'Standa', 'hranata', 'kratke', 0, 1, 'huste', 'tecky', 'siroky', 'usklebek', 'knir', 'zadny', 0),
  p('ota', 'Ospalý Ota', 'ovalna', 'rozcuch', 1, 0, 'rovne', 'unavene', 'hacek', 'cara', 'strniste', 'zadny', 6),
  p('zuzka', 'Zuzka', 'kulata', 'culik', 3, 1, 'zvednute', 'radostne', 'tecka', 'ceneni', 'zadne', 'zadny', 7),
  p('dedek', 'Dědek', 'protahla', 'plesaty', 4, 0, 'huste', 'privrene', 'siroky', 'usmev', 'plnovous', 'bryle', 6),
  p('mira', 'Míra', 'hranata', 'jezek', 0, 2, 'nastvane', 'tecky', 'siroky', 'mracik', 'bradka', 'zadny', 3),
  p('pavla', 'Pavla', 'ovalna', 'mikado', 0, 0, 'tenke', 'normalni', 'hacek', 'rty', 'zadne', 'nausnice', 4),
  p('honza', 'Honza', 'kulata', 'kudrny', 1, 1, 'rovne', 'normalni', 'tecka', 'siroky', 'zadne', 'zadny', 5),
  p('lucka', 'Lucka', 'ovalna', 'copanky', 2, 0, 'zvednute', 'radostne', 'tecka', 'usmev', 'zadne', 'celenka', 1),
  p('tomas', 'Tomáš', 'hranata', 'pesinka', 1, 3, 'rovne', 'normalni', 'siroky', 'cara', 'zadne', 'bryle', 2),
  p('dan', 'Dan', 'kulata', 'afro', 0, 4, 'rovne', 'normalni', 'siroky', 'siroky', 'zadne', 'zadny', 1),
  p('vasek', 'Vašek', 'protahla', 'plesaty', 4, 1, 'jedno', 'silhave', 'hacek', 'usklebek', 'licousy', 'zadny', 6),
  p('nikol', 'Nikol', 'ovalna', 'dlouhe', 5, 0, 'tenke', 'mrknuti', 'tecka', 'rty', 'zadne', 'slunecni', 7),
  p('petr', 'Petr', 'hranata', 'kratke', 1, 2, 'huste', 'privrene', 'siroky', 'cara', 'plnovous', 'zadny', 0),
  p('eliska', 'Eliška', 'kulata', 'drdol', 0, 1, 'zvednute', 'vytrestene', 'tecka', 'puska', 'zadne', 'zadny', 3),
  p('kuba', 'Kuba', 'ovalna', 'mohawk', 5, 0, 'nastvane', 'tecky', 'hacek', 'ceneni', 'zadne', 'zadny', 4),
  p('marek', 'Marek', 'hranata', 'ofina', 0, 3, 'rovne', 'normalni', 'siroky', 'usmev', 'strniste', 'sluchatka', 5),
  p('hana', 'Hana', 'protahla', 'mikado', 4, 0, 'tenke', 'privrene', 'hacek', 'usklebek', 'zadne', 'bryle', 6),
  p('ludva', 'Ludva', 'kulata', 'vinek', 4, 1, 'huste', 'unavene', 'siroky', 'mracik', 'plnovous', 'zadny', 6),
  p('sara', 'Sára', 'ovalna', 'kudrny', 2, 4, 'zvednute', 'radostne', 'tecka', 'ceneni', 'zadne', 'nausnice', 7),
  p('filip', 'Filip', 'hranata', 'jezek', 1, 0, 'jedno', 'mrknuti', 'hacek', 'usklebek', 'knir', 'zadny', 2),
  p('anicka', 'Anička', 'kulata', 'copanky', 3, 1, 'zvednute', 'normalni', 'tecka', 'usmev', 'zadne', 'naplast', 3),
  p('radek', 'Radek', 'protahla', 'rozcuch', 0, 2, 'nastvane', 'vytrestene', 'siroky', 'puska', 'bradka', 'zadny', 0),
  p('iva', 'Iva', 'ovalna', 'culik', 1, 0, 'tenke', 'silhave', 'hacek', 'cara', 'zadne', 'celenka', 4),
  p('bohous', 'Bohouš', 'hranata', 'plesaty', 4, 1, 'huste', 'tecky', 'siroky', 'mracik', 'knir', 'cepice', 5),
  p('tereza', 'Tereza', 'ovalna', 'dlouhe', 3, 2, 'zvednute', 'normalni', 'tecka', 'siroky', 'zadne', 'zadny', 1),
  p('adam', 'Adam', 'kulata', 'kratke', 1, 5, 'rovne', 'radostne', 'siroky', 'ceneni', 'zadne', 'zadny', 2),
  p('zdenek', 'Zdeněk', 'protahla', 'pesinka', 4, 0, 'huste', 'privrene', 'hacek', 'usklebek', 'licousy', 'bryle', 6),
  p('majda', 'Majda', 'kulata', 'ofina', 0, 1, 'tenke', 'vytrestene', 'tecka', 'puska', 'zadne', 'slunecni', 7),
  p('venca', 'Venca', 'hranata', 'mikado', 5, 0, 'jedno', 'silhave', 'siroky', 'usmev', 'strniste', 'cepice', 3),
];

export const PARTS = { HEADS, HAIRSTYLES, EYES, BROWS, NOSES, MOUTHS, BEARDS, ACCESSORIES, SKINS, HAIRS, SHIRTS };

/* --------------------------------------------------------- výběr a mix -- */

const keys = (o) => Object.keys(o);

export function hashKey(key) {
  let h = 0x811c9dc5;
  const str = String(key);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Stejný klíč (jméno hráče) vrátí vždy stejný portrét. */
export function portraitForKey(key) {
  return PORTRAITS[hashKey(key) % PORTRAITS.length];
}

/** Libovolná kombinace dílů, když 30 presetů nestačí. */
export function randomPortrait(rnd = Math.random) {
  const u = () => Math.min(0.9999999, Math.max(0, rnd()));
  const pick = (o) => keys(o)[Math.floor(u() * keys(o).length)];
  const one = (a) => a[Math.floor(u() * a.length)];
  return {
    id: 'mix-' + Math.floor(u() * 1e9).toString(36),
    name: 'Hráč',
    head: pick(HEADS),
    hair: pick(HAIRSTYLES),
    brows: pick(BROWS),
    eyes: pick(EYES),
    nose: pick(NOSES),
    mouth: pick(MOUTHS),
    beard: pick(BEARDS),
    accessory: pick(ACCESSORIES),
    hairColor: one(HAIRS),
    skin: one(SKINS),
    shirt: one(SHIRTS),
  };
}

export function portraitDataUri(portrait, opts) {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(renderPortrait(portrait, opts));
}

if (typeof window !== 'undefined') {
  window.MolkkyPortraits = { PORTRAITS, PARTS, renderPortrait, portraitForKey, randomPortrait, portraitDataUri, hashKey };
}
