/**
 * "Clear Ledger" v2.0 palette — transcribed verbatim from the `:root` block of
 * reference/ClaimDesk_Mobile_v2.html.
 *
 * Light theme only. The prototype ships no dark palette; the token shape allows
 * one to be added later without touching consumers.
 */
declare const color: {
    readonly paper: "#F2F4F8";
    readonly paperRaised: "#FFFFFF";
    readonly paperSunken: "#F5F7FA";
    readonly ink: "#101828";
    readonly ink70: "rgba(16,24,40,.72)";
    readonly ink55: "#667085";
    readonly ink40: "#98A2B3";
    readonly ink25: "#C6CEDA";
    readonly line: "#EAECF2";
    readonly lineMid: "#D5DBE4";
    readonly accent: "#2D5FF0";
    readonly accentDeep: "#1E4AD1";
    readonly accentTint: "#EBF0FE";
    readonly onAccent: "#FFFFFF";
    readonly focusRing: "#2D5FF0";
    readonly ok: "#12A150";
    readonly okTint: "#E7F6EE";
    readonly warn: "#B25E09";
    readonly warnTint: "#FCF2E3";
    readonly danger: "#DE4444";
    readonly dangerTint: "#FDEDED";
    /** Reserved for "smart-check" AI-insight cards. */
    readonly violet: "#7A5AF8";
    readonly violetTint: "#F1EEFE";
};
/**
 * Hero gradient. Kept as structured stops rather than a CSS string so both
 * `linear-gradient()` (web) and `expo-linear-gradient` (native) can render it.
 */
declare const gradient: {
    readonly accent: {
        readonly angleDeg: 135;
        readonly stops: readonly [{
            readonly color: "#4B7BF7";
            readonly position: 0;
        }, {
            readonly color: "#2D5FF0";
            readonly position: 0.55;
        }, {
            readonly color: "#2049CE";
            readonly position: 1;
        }];
    };
};
/** Avatar fills, hashed by name in the prototype. */
declare const avatarPalette: readonly ["#2D5FF0", "#7A5AF8", "#0FA47A", "#E0731D", "#D6456B", "#1193C2"];
type ColorToken = keyof typeof color;

/** Strict 4pt spacing scale. Unitless so React Native can use the values directly. */
declare const space: {
    readonly 1: 4;
    readonly 2: 8;
    readonly 3: 12;
    readonly 4: 16;
    readonly 5: 20;
    readonly 6: 24;
    readonly 7: 32;
};
type SpaceToken = keyof typeof space;

/** Corner radii. Unitless. */
declare const radius: {
    /** Generic surface radius. */
    readonly base: 14;
    readonly card: 18;
    readonly input: 12;
    readonly pill: 999;
    readonly sheet: 24;
};
type RadiusToken = keyof typeof radius;

/**
 * Type scale. Deliberately non-integer at the small end (10.5 / 11.5 / 14.5) —
 * that is what the prototype specifies.
 *
 * Caveat for React Native: Android rounds fractional `fontSize` inconsistently
 * across densities. Verify `body` (14.5) on a low-DPI Android before relying on
 * it; if it reads badly, snap the native scale to whole pixels in `native.ts`
 * rather than changing this file.
 */
declare const fontSize: {
    readonly micro: 10.5;
    readonly caption: 11.5;
    readonly bodyS: 13;
    readonly body: 14.5;
    readonly title: 17;
    readonly h2: 21;
    readonly h1: 26;
    readonly numL: 38;
};
declare const fontWeight: {
    readonly regular: "400";
    readonly medium: "500";
    readonly semibold: "600";
    readonly bold: "700";
    readonly extrabold: "800";
};
declare const fontFamily: {
    readonly ui: "'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif";
    /** The prototype aliases display to the UI family. */
    readonly display: "'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif";
};
declare const letterSpacing: {
    /** Uppercase eyebrow tracking. */
    readonly caps: "0.07em";
    readonly h1: "-0.03em";
    readonly h2: "-0.02em";
};
type FontSizeToken = keyof typeof fontSize;

/**
 * Elevation. Web keeps the exact multi-layer CSS shadows; `native.ts` collapses
 * each to a single RN layer plus an Android `elevation` — RN has no multi-layer
 * shadow primitive, so the native values are a documented approximation, not a
 * translation. Do not "fix" the mismatch by changing these CSS values.
 */
declare const shadow: {
    readonly raised: "0 1px 2px rgba(16,24,40,.04), 0 6px 20px rgba(16,24,40,.06)";
    readonly pop: "0 4px 10px rgba(16,24,40,.08), 0 16px 40px rgba(16,24,40,.12)";
    readonly sheet: "0 -12px 40px rgba(16,24,40,.18)";
};
type ShadowToken = keyof typeof shadow;

declare const easing: {
    readonly standard: "cubic-bezier(.32,.72,.24,1)";
    /** Same curve as control points, for React Native `Easing.bezier(...)`. */
    readonly standardPoints: readonly [0.32, 0.72, 0.24, 1];
};
declare const duration: {
    readonly fast: 140;
    readonly medium: 220;
    readonly sheet: 300;
};

declare const layout: {
    readonly tabBarHeight: 64;
    /** Minimum tap target. Icon buttons sit at 42-44px in the prototype. */
    readonly touchTarget: 44;
    /** Prototype device shell width; below this the layout goes full-bleed. */
    readonly mobileBreakpoint: 460;
};

export { type ColorToken, type FontSizeToken, type RadiusToken, type ShadowToken, type SpaceToken, avatarPalette, color, duration, easing, fontFamily, fontSize, fontWeight, gradient, layout, letterSpacing, radius, shadow, space };
