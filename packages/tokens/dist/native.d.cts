/**
 * React Native theme.
 *
 * Two conversions happen here and nowhere else:
 *
 *  1. SHADOWS. CSS multi-layer shadows do not exist in RN. Each token collapses
 *     to its dominant layer plus an Android `elevation`. RN's `shadowRadius` is
 *     roughly CSS blur / 2. These are approximations by design.
 *
 *  2. GRADIENT. Converted to the `expo-linear-gradient` prop shape
 *     (colors + locations + start/end), since RN has no CSS gradient syntax.
 */
interface NativeShadow {
    shadowColor: string;
    shadowOffset: {
        width: number;
        height: number;
    };
    shadowRadius: number;
    shadowOpacity: number;
    /** Android only — RN ignores shadow* on Android. */
    elevation: number;
}
declare const nativeShadow: {
    readonly raised: {
        readonly shadowColor: "#101828";
        readonly shadowOffset: {
            readonly width: 0;
            readonly height: 6;
        };
        readonly shadowRadius: 10;
        readonly shadowOpacity: 0.06;
        readonly elevation: 2;
    };
    readonly pop: {
        readonly shadowColor: "#101828";
        readonly shadowOffset: {
            readonly width: 0;
            readonly height: 16;
        };
        readonly shadowRadius: 20;
        readonly shadowOpacity: 0.12;
        readonly elevation: 8;
    };
    readonly sheet: {
        readonly shadowColor: "#101828";
        readonly shadowOffset: {
            readonly width: 0;
            readonly height: -12;
        };
        readonly shadowRadius: 20;
        readonly shadowOpacity: 0.18;
        readonly elevation: 16;
    };
};
/** Ready to spread onto `<LinearGradient {...nativeGradient.accent} />`. */
declare const nativeGradient: {
    readonly accent: {
        readonly colors: readonly [string, string, ...string[]];
        readonly locations: readonly [number, number, ...number[]];
        readonly start: {
            readonly x: 0;
            readonly y: 0;
        };
        readonly end: {
            readonly x: 1;
            readonly y: 1;
        };
    };
};
declare const theme: {
    readonly color: {
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
        readonly violet: "#7A5AF8";
        readonly violetTint: "#F1EEFE";
    };
    readonly space: {
        readonly 1: 4;
        readonly 2: 8;
        readonly 3: 12;
        readonly 4: 16;
        readonly 5: 20;
        readonly 6: 24;
        readonly 7: 32;
    };
    readonly radius: {
        readonly base: 14;
        readonly card: 18;
        readonly input: 12;
        readonly pill: 999;
        readonly sheet: 24;
    };
    readonly fontSize: {
        readonly micro: 10.5;
        readonly caption: 11.5;
        readonly bodyS: 13;
        readonly body: 14.5;
        readonly title: 17;
        readonly h2: 21;
        readonly h1: 26;
        readonly numL: 38;
    };
    readonly fontWeight: {
        readonly regular: "400";
        readonly medium: "500";
        readonly semibold: "600";
        readonly bold: "700";
        readonly extrabold: "800";
    };
    readonly letterSpacing: {
        readonly caps: "0.07em";
        readonly h1: "-0.03em";
        readonly h2: "-0.02em";
    };
    readonly shadow: {
        readonly raised: {
            readonly shadowColor: "#101828";
            readonly shadowOffset: {
                readonly width: 0;
                readonly height: 6;
            };
            readonly shadowRadius: 10;
            readonly shadowOpacity: 0.06;
            readonly elevation: 2;
        };
        readonly pop: {
            readonly shadowColor: "#101828";
            readonly shadowOffset: {
                readonly width: 0;
                readonly height: 16;
            };
            readonly shadowRadius: 20;
            readonly shadowOpacity: 0.12;
            readonly elevation: 8;
        };
        readonly sheet: {
            readonly shadowColor: "#101828";
            readonly shadowOffset: {
                readonly width: 0;
                readonly height: -12;
            };
            readonly shadowRadius: 20;
            readonly shadowOpacity: 0.18;
            readonly elevation: 16;
        };
    };
    readonly gradient: {
        readonly accent: {
            readonly colors: readonly [string, string, ...string[]];
            readonly locations: readonly [number, number, ...number[]];
            readonly start: {
                readonly x: 0;
                readonly y: 0;
            };
            readonly end: {
                readonly x: 1;
                readonly y: 1;
            };
        };
    };
    readonly duration: {
        readonly fast: 140;
        readonly medium: 220;
        readonly sheet: 300;
    };
    readonly easingPoints: readonly [0.32, 0.72, 0.24, 1];
    readonly layout: {
        readonly tabBarHeight: 64;
        readonly touchTarget: 44;
        readonly mobileBreakpoint: 460;
    };
};
type Theme = typeof theme;

export { type NativeShadow, type Theme, nativeGradient, nativeShadow, theme };
