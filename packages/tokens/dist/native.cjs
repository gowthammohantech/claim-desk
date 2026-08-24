"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/native.ts
var native_exports = {};
__export(native_exports, {
  nativeGradient: () => nativeGradient,
  nativeShadow: () => nativeShadow,
  theme: () => theme
});
module.exports = __toCommonJS(native_exports);

// src/color.ts
var color = {
  // surfaces
  paper: "#F2F4F8",
  paperRaised: "#FFFFFF",
  paperSunken: "#F5F7FA",
  // ink
  ink: "#101828",
  ink70: "rgba(16,24,40,.72)",
  ink55: "#667085",
  ink40: "#98A2B3",
  ink25: "#C6CEDA",
  // lines
  line: "#EAECF2",
  lineMid: "#D5DBE4",
  // brand
  accent: "#2D5FF0",
  accentDeep: "#1E4AD1",
  accentTint: "#EBF0FE",
  onAccent: "#FFFFFF",
  focusRing: "#2D5FF0",
  // semantic
  ok: "#12A150",
  okTint: "#E7F6EE",
  warn: "#B25E09",
  warnTint: "#FCF2E3",
  danger: "#DE4444",
  dangerTint: "#FDEDED",
  /** Reserved for "smart-check" AI-insight cards. */
  violet: "#7A5AF8",
  violetTint: "#F1EEFE"
};
var gradient = {
  accent: {
    angleDeg: 135,
    stops: [
      { color: "#4B7BF7", position: 0 },
      { color: "#2D5FF0", position: 0.55 },
      { color: "#2049CE", position: 1 }
    ]
  }
};

// src/motion.ts
var easing = {
  standard: "cubic-bezier(.32,.72,.24,1)",
  /** Same curve as control points, for React Native `Easing.bezier(...)`. */
  standardPoints: [0.32, 0.72, 0.24, 1]
};
var duration = {
  fast: 140,
  medium: 220,
  sheet: 300
};

// src/layout.ts
var layout = {
  tabBarHeight: 64,
  /** Minimum tap target. Icon buttons sit at 42-44px in the prototype. */
  touchTarget: 44,
  /** Prototype device shell width; below this the layout goes full-bleed. */
  mobileBreakpoint: 460
};

// src/radius.ts
var radius = {
  /** Generic surface radius. */
  base: 14,
  card: 18,
  input: 12,
  pill: 999,
  sheet: 24
};

// src/space.ts
var space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32
};

// src/typography.ts
var fontSize = {
  micro: 10.5,
  caption: 11.5,
  bodyS: 13,
  body: 14.5,
  title: 17,
  h2: 21,
  h1: 26,
  numL: 38
};
var fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800"
};
var letterSpacing = {
  /** Uppercase eyebrow tracking. */
  caps: "0.07em",
  h1: "-0.03em",
  h2: "-0.02em"
};

// src/native.ts
var SHADOW_COLOR = "#101828";
var nativeShadow = {
  raised: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    shadowOpacity: 0.06,
    elevation: 2
  },
  pop: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 20,
    shadowOpacity: 0.12,
    elevation: 8
  },
  sheet: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: -12 },
    shadowRadius: 20,
    shadowOpacity: 0.18,
    elevation: 16
  }
};
var nativeGradient = {
  accent: {
    colors: gradient.accent.stops.map((s) => s.color),
    locations: gradient.accent.stops.map((s) => s.position),
    // 135deg in CSS == top-left to bottom-right.
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 }
  }
};
var theme = {
  color,
  space,
  radius,
  fontSize,
  fontWeight,
  letterSpacing,
  shadow: nativeShadow,
  gradient: nativeGradient,
  duration,
  easingPoints: easing.standardPoints,
  layout
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  nativeGradient,
  nativeShadow,
  theme
});
//# sourceMappingURL=native.cjs.map