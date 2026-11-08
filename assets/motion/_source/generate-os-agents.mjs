/**
 * Live Lottie idle loops for 7 OS agent concepts.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "characters", "os-agent", "lottie");

const TEAL = [0.051, 0.478, 0.435, 1];
const TEAL_DEEP = [0.176, 0.353, 0.337, 1];
const TEAL_LIGHT = [0.2, 0.65, 0.58, 1];
const INK = [0.043, 0.071, 0.125, 1];
const CREAM = [0.988, 0.984, 0.969, 1];
const BLUSH = [0.85, 0.55, 0.4, 0.5];
const GOLD = [0.85, 0.7, 0.25, 1];
const WHITE = [1, 1, 1, 1];

const OP = 90;

function animDoc(nm, w, h, layers) {
  return { v: "5.7.4", fr: 60, ip: 0, op: OP, w, h, nm, ddd: 0, assets: [], layers, markers: [] };
}

function bobY(x, y, amt = 6) {
  return {
    a: 1,
    k: [
      {
        t: 0,
        s: [x, y + amt, 0],
        e: [x, y - amt, 0],
        i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] },
        o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] },
      },
      {
        t: 45,
        s: [x, y - amt, 0],
        e: [x, y + amt, 0],
        i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] },
        o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] },
      },
      { t: 90, s: [x, y + amt, 0] },
    ],
  };
}

function blinkO() {
  return {
    a: 1,
    k: [
      { t: 0, s: [100], e: [100], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } },
      { t: 52, s: [100], e: [0], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } },
      { t: 56, s: [0], e: [100], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } },
      { t: 60, s: [100] },
    ],
  };
}

function shadowPulse() {
  return {
    a: 1,
    k: [
      { t: 0, s: [20], e: [12], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } },
      { t: 45, s: [12], e: [20], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } },
      { t: 90, s: [20] },
    ],
  };
}

function layer({ ind, nm, p, shapes, s, o = 100, r = 0 }) {
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm,
    sr: 1,
    ks: {
      o: typeof o === "object" ? o : { a: 0, k: o },
      r: typeof r === "object" ? r : { a: 0, k: r },
      p: Array.isArray(p?.k) || p?.a ? p : { a: 0, k: [...p, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: s || { a: 0, k: [100, 100, 100] },
    },
    ao: 0,
    shapes,
    ip: 0,
    op: OP,
    st: 0,
    bm: 0,
  };
}

function el(size, fill) {
  return [
    { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: size }, nm: "E" },
    { ty: "fl", c: { a: 0, k: fill }, o: { a: 0, k: 100 }, r: 1, nm: "F" },
  ];
}

function rc(w, h, rad, fill) {
  return [
    {
      ty: "gr",
      nm: "R",
      it: [
        { ty: "rc", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [w, h] }, r: { a: 0, k: rad }, nm: "rc" },
        { ty: "fl", c: { a: 0, k: fill }, o: { a: 0, k: 100 }, r: 1, nm: "fl" },
        {
          ty: "tr",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
          nm: "tr",
        },
      ],
    },
  ];
}

function group(items) {
  return [
    {
      ty: "gr",
      nm: "G",
      it: [
        ...items,
        {
          ty: "tr",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
          nm: "tr",
        },
      ],
    },
  ];
}

function faceBits(cx, cy, eyeGap = 12) {
  const eyeL = layer({
    ind: 10,
    nm: "EyeL",
    p: bobY(cx - eyeGap, cy, 5),
    shapes: el([8, 10], INK),
    o: blinkO(),
  });
  const eyeR = layer({
    ind: 11,
    nm: "EyeR",
    p: bobY(cx + eyeGap, cy, 5),
    shapes: el([8, 10], INK),
    o: blinkO(),
  });
  const cheekL = layer({
    ind: 8,
    nm: "CheekL",
    p: bobY(cx - 18, cy + 12, 5),
    shapes: el([9, 5], BLUSH),
  });
  const cheekR = layer({
    ind: 9,
    nm: "CheekR",
    p: bobY(cx + 18, cy + 12, 5),
    shapes: el([9, 5], BLUSH),
  });
  return [cheekL, cheekR, eyeL, eyeR];
}

function shadow(x = 100, y = 190) {
  return layer({
    ind: 1,
    nm: "Shadow",
    p: [x, y],
    shapes: el([50, 12], INK),
    o: shadowPulse(),
  });
}

// 01 Capsule (current style)
function makeCapsule() {
  const body = layer({
    ind: 5,
    nm: "Body",
    p: bobY(100, 115, 6),
    shapes: rc(78, 92, 38, TEAL),
  });
  const face = layer({
    ind: 6,
    nm: "Face",
    p: bobY(100, 108, 6),
    shapes: rc(56, 40, 16, CREAM),
  });
  return animDoc("os-01-capsule", 200, 220, [
    ...faceBits(100, 106),
    face,
    body,
    shadow(),
  ]);
}

// 02 Orb
function makeOrb() {
  const glow = layer({
    ind: 3,
    nm: "Glow",
    p: bobY(100, 110, 5),
    shapes: el([110, 110], TEAL_LIGHT),
    o: {
      a: 1,
      k: [
        { t: 0, s: [25], e: [40], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } },
        { t: 45, s: [40], e: [25], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } },
        { t: 90, s: [25] },
      ],
    },
  });
  const body = layer({
    ind: 4,
    nm: "Orb",
    p: bobY(100, 110, 6),
    shapes: el([88, 88], TEAL),
  });
  const face = layer({
    ind: 5,
    nm: "Face",
    p: bobY(100, 108, 6),
    shapes: el([52, 40], CREAM),
  });
  return animDoc("os-02-orb", 200, 220, [...faceBits(100, 106, 11), face, body, glow, shadow()]);
}

// 03 Open Loop
function makeOpenLoop() {
  const ring = layer({
    ind: 4,
    nm: "Ring",
    p: bobY(100, 110, 5),
    shapes: [
      {
        ty: "gr",
        nm: "RingG",
        it: [
          { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, nm: "el" },
          {
            ty: "st",
            c: { a: 0, k: TEAL },
            o: { a: 0, k: 100 },
            w: { a: 0, k: 18 },
            lc: 2,
            lj: 2,
            nm: "st",
          },
          {
            ty: "tm",
            s: { a: 0, k: 12 },
            e: { a: 0, k: 88 },
            o: { a: 0, k: 0 },
            m: 1,
            nm: "tm",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: {
              a: 1,
              k: [
                {
                  t: 0,
                  s: [0],
                  e: [8],
                  i: { x: [0.667], y: [1] },
                  o: { x: [0.333], y: [0] },
                },
                {
                  t: 45,
                  s: [8],
                  e: [0],
                  i: { x: [0.667], y: [1] },
                  o: { x: [0.333], y: [0] },
                },
                { t: 90, s: [0] },
              ],
            },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "tr",
          },
        ],
      },
    ],
  });
  const node = layer({
    ind: 5,
    nm: "Node",
    p: bobY(148, 78, 5),
    shapes: el([36, 36], TEAL_DEEP),
  });
  const face = layer({
    ind: 6,
    nm: "Face",
    p: bobY(148, 78, 5),
    shapes: el([22, 18], CREAM),
  });
  return animDoc("os-03-open-loop", 200, 220, [
    ...faceBits(148, 76, 7).map((l) => {
      // tighter face on node
      return l;
    }),
    face,
    node,
    ring,
    shadow(100, 195),
  ]);
}

// Fix open loop face bits positions - regenerate faceBits for node
function makeOpenLoopFixed() {
  const ring = layer({
    ind: 3,
    nm: "Ring",
    p: bobY(100, 112, 5),
    shapes: [
      {
        ty: "gr",
        nm: "RingG",
        it: [
          { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [96, 96] }, nm: "el" },
          {
            ty: "st",
            c: { a: 0, k: TEAL },
            o: { a: 0, k: 100 },
            w: { a: 0, k: 16 },
            lc: 2,
            lj: 2,
            nm: "st",
          },
          {
            ty: "tm",
            s: { a: 0, k: 15 },
            e: { a: 0, k: 85 },
            o: { a: 0, k: 0 },
            m: 1,
            nm: "tm",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: {
              a: 1,
              k: [
                {
                  t: 0,
                  s: [-6],
                  e: [6],
                  i: { x: [0.667], y: [1] },
                  o: { x: [0.333], y: [0] },
                },
                {
                  t: 45,
                  s: [6],
                  e: [-6],
                  i: { x: [0.667], y: [1] },
                  o: { x: [0.333], y: [0] },
                },
                { t: 90, s: [-6] },
              ],
            },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "tr",
          },
        ],
      },
    ],
  });
  const node = layer({
    ind: 4,
    nm: "Node",
    p: bobY(142, 72, 5),
    shapes: el([40, 40], TEAL_DEEP),
  });
  const face = layer({
    ind: 5,
    nm: "Face",
    p: bobY(142, 72, 5),
    shapes: el([24, 20], CREAM),
  });
  const eyeL = layer({
    ind: 6,
    nm: "EyeL",
    p: bobY(136, 70, 5),
    shapes: el([6, 7], INK),
    o: blinkO(),
  });
  const eyeR = layer({
    ind: 7,
    nm: "EyeR",
    p: bobY(148, 70, 5),
    shapes: el([6, 7], INK),
    o: blinkO(),
  });
  return animDoc("os-03-open-loop", 200, 220, [eyeR, eyeL, face, node, ring, shadow()]);
}

// 04 Spark Gem
function makeSparkGem() {
  const sparkles = [0, 1, 2].map((i) =>
    layer({
      ind: 2 + i,
      nm: `Spark${i}`,
      p: bobY(55 + i * 45, 55 + (i % 2) * 20, 8),
      shapes: el([8, 8], GOLD),
      o: {
        a: 1,
        k: [
          {
            t: i * 10,
            s: [30],
            e: [100],
            i: { x: [0.667], y: [1] },
            o: { x: [0.333], y: [0] },
          },
          {
            t: 30 + i * 10,
            s: [100],
            e: [30],
            i: { x: [0.667], y: [1] },
            o: { x: [0.333], y: [0] },
          },
          { t: 60 + i * 10, s: [30] },
        ],
      },
    })
  );
  const body = layer({
    ind: 6,
    nm: "Gem",
    p: bobY(100, 115, 6),
    shapes: [
      {
        ty: "gr",
        nm: "Diamond",
        it: [
          {
            ty: "sh",
            ks: {
              a: 0,
              k: {
                i: [
                  [0, 0],
                  [0, 0],
                  [0, 0],
                  [0, 0],
                ],
                o: [
                  [0, 0],
                  [0, 0],
                  [0, 0],
                  [0, 0],
                ],
                v: [
                  [0, -48],
                  [40, 0],
                  [0, 48],
                  [-40, 0],
                ],
                c: true,
              },
            },
            nm: "path",
          },
          { ty: "fl", c: { a: 0, k: TEAL }, o: { a: 0, k: 100 }, r: 1, nm: "fl" },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "tr",
          },
        ],
      },
    ],
  });
  const face = layer({
    ind: 7,
    nm: "Face",
    p: bobY(100, 112, 6),
    shapes: el([36, 30], CREAM),
  });
  return animDoc("os-04-spark-gem", 200, 220, [
    ...faceBits(100, 110, 9),
    face,
    body,
    ...sparkles,
    shadow(),
  ]);
}

// 05 Droplet
function makeDroplet() {
  const body = layer({
    ind: 4,
    nm: "Drop",
    p: bobY(100, 118, 7),
    shapes: [
      {
        ty: "gr",
        nm: "DropG",
        it: [
          {
            ty: "sh",
            ks: {
              a: 0,
              k: {
                i: [
                  [0, 0],
                  [22, 0],
                  [0, 28],
                  [-22, 0],
                ],
                o: [
                  [22, 0],
                  [0, 28],
                  [-22, 0],
                  [0, 0],
                ],
                v: [
                  [0, -52],
                  [36, 10],
                  [0, 48],
                  [-36, 10],
                ],
                c: true,
              },
            },
            nm: "path",
          },
          { ty: "fl", c: { a: 0, k: TEAL }, o: { a: 0, k: 100 }, r: 1, nm: "fl" },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "tr",
          },
        ],
      },
    ],
  });
  const face = layer({
    ind: 5,
    nm: "Face",
    p: bobY(100, 122, 7),
    shapes: el([44, 36], CREAM),
  });
  return animDoc("os-05-droplet", 200, 220, [...faceBits(100, 120, 10), face, body, shadow()]);
}

// 06 Pebble
function makePebble() {
  const body = layer({
    ind: 4,
    nm: "Pebble",
    p: bobY(100, 115, 6),
    shapes: el([100, 78], TEAL),
  });
  const face = layer({
    ind: 5,
    nm: "Face",
    p: bobY(100, 112, 6),
    shapes: el([70, 48], CREAM),
  });
  return animDoc("os-06-pebble", 200, 220, [...faceBits(100, 110, 14), face, body, shadow()]);
}

// 07 Loop Keeper (soft S curve)
function makeLoopKeeper() {
  const body = layer({
    ind: 4,
    nm: "Keeper",
    p: bobY(100, 110, 6),
    shapes: [
      {
        ty: "gr",
        nm: "S",
        it: [
          {
            ty: "sh",
            ks: {
              a: 0,
              k: {
                i: [
                  [0, -18],
                  [18, 0],
                  [0, 18],
                  [-12, 0],
                  [0, -12],
                  [12, 0],
                  [0, 18],
                  [-18, 0],
                ],
                o: [
                  [0, 18],
                  [-18, 0],
                  [0, -12],
                  [12, 0],
                  [0, 12],
                  [-12, 0],
                  [0, -18],
                  [18, 0],
                ],
                v: [
                  [20, -40],
                  [0, -20],
                  [-16, 0],
                  [0, 12],
                  [16, 24],
                  [0, 36],
                  [-20, 48],
                  [0, 20],
                ],
                c: true,
              },
            },
            nm: "path",
          },
          { ty: "fl", c: { a: 0, k: TEAL }, o: { a: 0, k: 100 }, r: 1, nm: "fl" },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: {
              a: 1,
              k: [
                {
                  t: 0,
                  s: [-4],
                  e: [4],
                  i: { x: [0.667], y: [1] },
                  o: { x: [0.333], y: [0] },
                },
                {
                  t: 45,
                  s: [4],
                  e: [-4],
                  i: { x: [0.667], y: [1] },
                  o: { x: [0.333], y: [0] },
                },
                { t: 90, s: [-4] },
              ],
            },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "tr",
          },
        ],
      },
    ],
  });
  const head = layer({
    ind: 5,
    nm: "Head",
    p: bobY(118, 72, 5),
    shapes: el([44, 44], TEAL_DEEP),
  });
  const face = layer({
    ind: 6,
    nm: "Face",
    p: bobY(118, 72, 5),
    shapes: el([28, 24], CREAM),
  });
  const eyeL = layer({
    ind: 7,
    nm: "EyeL",
    p: bobY(112, 70, 5),
    shapes: el([6, 7], INK),
    o: blinkO(),
  });
  const eyeR = layer({
    ind: 8,
    nm: "EyeR",
    p: bobY(124, 70, 5),
    shapes: el([6, 7], INK),
    o: blinkO(),
  });
  return animDoc("os-07-loop-keeper", 200, 220, [
    eyeR,
    eyeL,
    face,
    head,
    body,
    shadow(),
  ]);
}

mkdirSync(outDir, { recursive: true });

const outputs = [
  ["os-01-capsule.json", makeCapsule()],
  ["os-02-orb.json", makeOrb()],
  ["os-03-open-loop.json", makeOpenLoopFixed()],
  ["os-04-spark-gem.json", makeSparkGem()],
  ["os-05-droplet.json", makeDroplet()],
  ["os-06-pebble.json", makePebble()],
  ["os-07-loop-keeper.json", makeLoopKeeper()],
];

for (const [name, data] of outputs) {
  writeFileSync(join(outDir, name), JSON.stringify(data));
  console.log("wrote", name);
}

// Do NOT overwrite characters/mascot-idle-loop.json — that is the locked first OS agent.
