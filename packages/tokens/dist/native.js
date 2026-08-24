import {
  color,
  duration,
  easing,
  fontSize,
  fontWeight,
  gradient,
  layout,
  letterSpacing,
  radius,
  space
} from "./chunk-5KEB2SV7.js";

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
export {
  nativeGradient,
  nativeShadow,
  theme
};
//# sourceMappingURL=native.js.map