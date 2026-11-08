/**
 * Generates starter Lottie JSON for Juvantage apps.
 * Brand: teal #0D7A6F, ink #0B1220, cream #FCFBF7
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const TEAL = [0.051, 0.478, 0.435, 1];
const TEAL_DEEP = [0.176, 0.353, 0.337, 1];
const INK = [0.043, 0.071, 0.125, 1];
const MUTED = [0.42, 0.45, 0.48, 1];
const CREAM = [0.988, 0.984, 0.969, 1];
const WHITE = [1, 1, 1, 1];

function kf(times, values, { ease = true } = {}) {
  const keys = [];
  for (let i = 0; i < times.length; i++) {
    const key = { t: times[i], s: values[i] };
    if (i < times.length - 1) {
      key.e = values[i + 1];
      if (ease) {
        key.i = { x: [0.667], y: [1] };
        key.o = { x: [0.333], y: [0] };
      }
    }
    keys.push(key);
  }
  return keys;
}

function shapeLayer({
  ind,
  nm,
  p,
  shapes,
  s,
  o = 100,
  r = 0,
  ip = 0,
  op = 90,
  st = 0,
}) {
  const ks = {
    o: typeof o === "object" ? o : { a: 0, k: o },
    r: typeof r === "object" ? r : { a: 0, k: r },
    p: { a: 0, k: [...p, 0] },
    a: { a: 0, k: [0, 0, 0] },
    s: s || { a: 0, k: [100, 100, 100] },
  };
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm,
    sr: 1,
    ks,
    ao: 0,
    shapes,
    ip,
    op,
    st,
    bm: 0,
  };
}

function ellipse(size, fill) {
  return [
    {
      ty: "el",
      p: { a: 0, k: [0, 0] },
      s: { a: 0, k: size },
      nm: "Ellipse Path",
    },
    {
      ty: "fl",
      c: { a: 0, k: fill },
      o: { a: 0, k: 100 },
      r: 1,
      nm: "Fill",
    },
  ];
}

function strokeEllipse(size, color, width = 6) {
  return [
    {
      ty: "gr",
      nm: "Ring",
      it: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: size },
          nm: "Ellipse",
        },
        {
          ty: "st",
          c: { a: 0, k: color },
          o: { a: 0, k: 100 },
          w: { a: 0, k: width },
          lc: 2,
          lj: 2,
          nm: "Stroke",
        },
        {
          ty: "tm",
          s: {
            a: 1,
            k: [
              { t: 0, s: [0], e: [0], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } },
              { t: 8, s: [0], e: [0] },
            ],
          },
          e: {
            a: 1,
            k: [
              { t: 0, s: [0], e: [100], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } },
              { t: 28, s: [100] },
            ],
          },
          o: { a: 0, k: 0 },
          m: 1,
          nm: "Trim Paths",
        },
        {
          ty: "tr",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
          nm: "Transform",
        },
      ],
    },
  ];
}

function checkPath() {
  // Checkmark as a shape path (relative coords)
  return [
    {
      ty: "gr",
      nm: "Check",
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
              ],
              o: [
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              v: [
                [-22, 2],
                [-6, 18],
                [24, -16],
              ],
              c: false,
            },
          },
          nm: "Path",
        },
        {
          ty: "st",
          c: { a: 0, k: WHITE },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 8 },
          lc: 2,
          lj: 2,
          ml: 4,
          nm: "Stroke",
        },
        {
          ty: "tm",
          s: { a: 0, k: 0 },
          e: {
            a: 1,
            k: [
              { t: 22, s: [0], e: [100], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } },
              { t: 42, s: [100] },
            ],
          },
          o: { a: 0, k: 0 },
          m: 1,
          nm: "Trim Paths",
        },
        {
          ty: "tr",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
          nm: "Transform",
        },
      ],
    },
  ];
}

function roundedRect(w, h, r, fill) {
  return [
    {
      ty: "rc",
      p: { a: 0, k: [0, 0] },
      s: { a: 0, k: [w, h] },
      r: { a: 0, k: r },
      nm: "Rectangle",
    },
    {
      ty: "fl",
      c: { a: 0, k: fill },
      o: { a: 0, k: 100 },
      r: 1,
      nm: "Fill",
    },
  ];
}

function animDoc(nm, w, h, fr, ip, op, layers) {
  return {
    v: "5.7.4",
    fr,
    ip,
    op,
    w,
    h,
    nm,
    ddd: 0,
    assets: [],
    layers,
    markers: [],
  };
}

// --- loader-dots ---
function makeLoaderDots() {
  const op = 60;
  const positions = [55, 100, 145];
  const layers = positions.map((x, i) => {
    const delay = i * 10;
    return shapeLayer({
      ind: i + 1,
      nm: `Dot ${i + 1}`,
      p: [x, 100],
      op,
      shapes: ellipse([22, 22], TEAL),
      s: {
        a: 1,
        k: [
          {
            t: delay,
            s: [70, 70, 100],
            e: [130, 130, 100],
            i: { x: [0.667], y: [1] },
            o: { x: [0.333], y: [0] },
          },
          {
            t: delay + 20,
            s: [130, 130, 100],
            e: [70, 70, 100],
            i: { x: [0.667], y: [1] },
            o: { x: [0.333], y: [0] },
          },
          {
            t: delay + 40,
            s: [70, 70, 100],
            e: [130, 130, 100],
            i: { x: [0.667], y: [1] },
            o: { x: [0.333], y: [0] },
          },
          { t: delay + 60, s: [70, 70, 100] },
        ],
      },
      o: {
        a: 1,
        k: [
          {
            t: delay,
            s: [40],
            e: [100],
            i: { x: [0.667], y: [1] },
            o: { x: [0.333], y: [0] },
          },
          {
            t: delay + 20,
            s: [100],
            e: [40],
            i: { x: [0.667], y: [1] },
            o: { x: [0.333], y: [0] },
          },
          {
            t: delay + 40,
            s: [40],
            e: [100],
            i: { x: [0.667], y: [1] },
            o: { x: [0.333], y: [0] },
          },
          { t: delay + 60, s: [40] },
        ],
      },
    });
  });
  return animDoc("loader-dots", 200, 200, 60, 0, op, layers.reverse());
}

// --- success-check ---
function makeSuccessCheck() {
  const op = 60;
  const fillCircle = shapeLayer({
    ind: 3,
    nm: "Fill Circle",
    p: [100, 100],
    op,
    shapes: ellipse([96, 96], TEAL),
    s: {
      a: 1,
      k: [
        {
          t: 0,
          s: [0, 0, 100],
          e: [110, 110, 100],
          i: { x: [0.2], y: [1] },
          o: { x: [0.3], y: [0] },
        },
        {
          t: 18,
          s: [110, 110, 100],
          e: [100, 100, 100],
          i: { x: [0.667], y: [1] },
          o: { x: [0.333], y: [0] },
        },
        { t: 28, s: [100, 100, 100] },
      ],
    },
    o: {
      a: 1,
      k: [
        { t: 0, s: [0], e: [100], i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] } },
        { t: 12, s: [100] },
      ],
    },
  });

  const ring = shapeLayer({
    ind: 2,
    nm: "Ring",
    p: [100, 100],
    op,
    shapes: strokeEllipse([110, 110], TEAL_DEEP, 5),
  });

  const check = shapeLayer({
    ind: 1,
    nm: "Check",
    p: [100, 100],
    op,
    shapes: checkPath(),
  });

  return animDoc("success-check", 200, 200, 60, 0, op, [check, ring, fillCircle]);
}

// --- empty-state ---
function makeEmptyState() {
  const op = 90;
  // Soft dashed ring (as light ellipse stroke)
  const aura = shapeLayer({
    ind: 4,
    nm: "Aura",
    p: [140, 150],
    op,
    shapes: [
      {
        ty: "el",
        p: { a: 0, k: [0, 0] },
        s: { a: 0, k: [160, 100] },
        nm: "Ellipse",
      },
      {
        ty: "st",
        c: { a: 0, k: TEAL },
        o: { a: 0, k: 25 },
        w: { a: 0, k: 2 },
        lc: 2,
        lj: 2,
        nm: "Stroke",
      },
    ],
    s: {
      a: 1,
      k: [
        {
          t: 0,
          s: [100, 100, 100],
          e: [106, 106, 100],
          i: { x: [0.667], y: [1] },
          o: { x: [0.333], y: [0] },
        },
        {
          t: 45,
          s: [106, 106, 100],
          e: [100, 100, 100],
          i: { x: [0.667], y: [1] },
          o: { x: [0.333], y: [0] },
        },
        { t: 90, s: [100, 100, 100] },
      ],
    },
  });

  // Card body
  const card = shapeLayer({
    ind: 3,
    nm: "Card",
    p: [140, 130],
    op,
    shapes: [
      {
        ty: "gr",
        nm: "Card shape",
        it: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 120] },
            r: { a: 0, k: 14 },
            nm: "Rectangle",
          },
          {
            ty: "fl",
            c: { a: 0, k: WHITE },
            o: { a: 0, k: 100 },
            r: 1,
            nm: "Fill",
          },
          {
            ty: "st",
            c: { a: 0, k: TEAL },
            o: { a: 0, k: 35 },
            w: { a: 0, k: 2 },
            lc: 2,
            lj: 2,
            nm: "Border",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "Transform",
          },
        ],
      },
    ],
  });
  card.ks.p = bobY(140, 128, 6);

  // Lines on card
  const lines = shapeLayer({
    ind: 2,
    nm: "Lines",
    p: [140, 130],
    op,
    shapes: [
      {
        ty: "gr",
        nm: "Line group",
        it: [
          {
            ty: "sh",
            ks: {
              a: 0,
              k: {
                i: [
                  [0, 0],
                  [0, 0],
                ],
                o: [
                  [0, 0],
                  [0, 0],
                ],
                v: [
                  [-28, -28],
                  [28, -28],
                ],
                c: false,
              },
            },
            nm: "L1",
          },
          {
            ty: "st",
            c: { a: 0, k: MUTED },
            o: { a: 0, k: 55 },
            w: { a: 0, k: 4 },
            lc: 2,
            lj: 2,
            nm: "Stroke1",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "Transform",
          },
        ],
      },
      {
        ty: "gr",
        nm: "Line 2",
        it: [
          {
            ty: "sh",
            ks: {
              a: 0,
              k: {
                i: [
                  [0, 0],
                  [0, 0],
                ],
                o: [
                  [0, 0],
                  [0, 0],
                ],
                v: [
                  [-28, -8],
                  [16, -8],
                ],
                c: false,
              },
            },
            nm: "L2",
          },
          {
            ty: "st",
            c: { a: 0, k: MUTED },
            o: { a: 0, k: 40 },
            w: { a: 0, k: 4 },
            lc: 2,
            lj: 2,
            nm: "Stroke2",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "Transform",
          },
        ],
      },
      {
        ty: "gr",
        nm: "Accent bar",
        it: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 28] },
            s: { a: 0, k: [56, 10] },
            r: { a: 0, k: 5 },
            nm: "Bar",
          },
          {
            ty: "fl",
            c: { a: 0, k: TEAL },
            o: { a: 0, k: 85 },
            r: 1,
            nm: "Fill",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "Transform",
          },
        ],
      },
    ],
  });
  lines.ks.p = bobY(140, 128, 6);

  // Small teal spark / plus
  const spark = shapeLayer({
    ind: 1,
    nm: "Spark",
    p: [200, 78],
    op,
    shapes: ellipse([14, 14], TEAL),
    s: {
      a: 1,
      k: [
        {
          t: 0,
          s: [80, 80, 100],
          e: [120, 120, 100],
          i: { x: [0.667], y: [1] },
          o: { x: [0.333], y: [0] },
        },
        {
          t: 45,
          s: [120, 120, 100],
          e: [80, 80, 100],
          i: { x: [0.667], y: [1] },
          o: { x: [0.333], y: [0] },
        },
        { t: 90, s: [80, 80, 100] },
      ],
    },
    o: {
      a: 1,
      k: [
        {
          t: 0,
          s: [60],
          e: [100],
          i: { x: [0.667], y: [1] },
          o: { x: [0.333], y: [0] },
        },
        {
          t: 45,
          s: [100],
          e: [60],
          i: { x: [0.667], y: [1] },
          o: { x: [0.333], y: [0] },
        },
        { t: 90, s: [60] },
      ],
    },
  });

  return animDoc("empty-state", 280, 280, 60, 0, op, [spark, lines, card, aura]);
}

function bobY(x, yBase, amount = 6) {
  return {
    a: 1,
    k: [
      {
        t: 0,
        s: [x, yBase + amount, 0],
        e: [x, yBase - amount, 0],
        i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] },
        o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] },
      },
      {
        t: 45,
        s: [x, yBase - amount, 0],
        e: [x, yBase + amount, 0],
        i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] },
        o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] },
      },
      { t: 90, s: [x, yBase + amount, 0] },
    ],
  };
}

function blinkOpacity() {
  // Opacity blink — scale blinks can explode in some Lottie players
  return {
    a: 1,
    k: [
      {
        t: 0,
        s: [100],
        e: [100],
        i: { x: [0.667], y: [1] },
        o: { x: [0.333], y: [0] },
      },
      {
        t: 50,
        s: [100],
        e: [0],
        i: { x: [0.667], y: [1] },
        o: { x: [0.333], y: [0] },
      },
      {
        t: 54,
        s: [0],
        e: [100],
        i: { x: [0.667], y: [1] },
        o: { x: [0.333], y: [0] },
      },
      { t: 58, s: [100] },
    ],
  };
}

// --- mascot-idle (simple geometric character) ---
function makeMascotIdle() {
  const op = 90;

  const shadow = shapeLayer({
    ind: 6,
    nm: "Shadow",
    p: [100, 188],
    op,
    shapes: ellipse([54, 12], INK),
    o: {
      a: 1,
      k: [
        {
          t: 0,
          s: [18],
          e: [10],
          i: { x: [0.667], y: [1] },
          o: { x: [0.333], y: [0] },
        },
        {
          t: 45,
          s: [10],
          e: [18],
          i: { x: [0.667], y: [1] },
          o: { x: [0.333], y: [0] },
        },
        { t: 90, s: [18] },
      ],
    },
  });

  const body = shapeLayer({
    ind: 5,
    nm: "Body",
    p: [100, 120],
    op,
    shapes: [
      {
        ty: "gr",
        nm: "Capsule",
        it: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [78, 88] },
            r: { a: 0, k: 36 },
            nm: "Rect",
          },
          {
            ty: "fl",
            c: { a: 0, k: TEAL },
            o: { a: 0, k: 100 },
            r: 1,
            nm: "Fill",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "Transform",
          },
        ],
      },
    ],
  });
  body.ks.p = bobY(100, 120, 5);

  const face = shapeLayer({
    ind: 4,
    nm: "Face",
    p: [100, 112],
    op,
    shapes: [
      {
        ty: "gr",
        nm: "Panel",
        it: [
          {
            ty: "rc",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [58, 42] },
            r: { a: 0, k: 16 },
            nm: "Rect",
          },
          {
            ty: "fl",
            c: { a: 0, k: CREAM },
            o: { a: 0, k: 100 },
            r: 1,
            nm: "Fill",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "Transform",
          },
        ],
      },
    ],
  });
  face.ks.p = bobY(100, 112, 5);

  const eyeL = shapeLayer({
    ind: 3,
    nm: "Eye L",
    p: [88, 110],
    op,
    shapes: ellipse([9, 11], INK),
  });
  eyeL.ks.p = bobY(88, 110, 5);
  eyeL.ks.o = blinkOpacity();

  const eyeR = shapeLayer({
    ind: 2,
    nm: "Eye R",
    p: [112, 110],
    op,
    shapes: ellipse([9, 11], INK),
  });
  eyeR.ks.p = bobY(112, 110, 5);
  eyeR.ks.o = blinkOpacity();

  const cheek = shapeLayer({
    ind: 1,
    nm: "Cheeks",
    p: [100, 122],
    op,
    shapes: [
      {
        ty: "gr",
        nm: "L",
        it: [
          {
            ty: "el",
            p: { a: 0, k: [-24, 0] },
            s: { a: 0, k: [10, 6] },
            nm: "Cheek L",
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.85, 0.55, 0.4, 0.45] },
            o: { a: 0, k: 100 },
            r: 1,
            nm: "Fill",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "Transform",
          },
        ],
      },
      {
        ty: "gr",
        nm: "R",
        it: [
          {
            ty: "el",
            p: { a: 0, k: [24, 0] },
            s: { a: 0, k: [10, 6] },
            nm: "Cheek R",
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.85, 0.55, 0.4, 0.45] },
            o: { a: 0, k: 100 },
            r: 1,
            nm: "Fill",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
            sk: { a: 0, k: 0 },
            sa: { a: 0, k: 0 },
            nm: "Transform",
          },
        ],
      },
    ],
  });
  cheek.ks.p = bobY(100, 122, 5);

  return animDoc("mascot-idle-loop", 200, 220, 60, 0, op, [
    cheek,
    eyeR,
    eyeL,
    face,
    body,
    shadow,
  ]);
}

const outputs = [
  ["shared/lottie/loader-dots.json", makeLoaderDots()],
  ["shared/lottie/success-check.json", makeSuccessCheck()],
  ["shared/lottie/empty-state.json", makeEmptyState()],
  ["characters/mascot-idle-loop.json", makeMascotIdle()],
];

for (const [rel, data] of outputs) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
  console.log("wrote", rel, `(${JSON.stringify(data).length} bytes)`);
}
