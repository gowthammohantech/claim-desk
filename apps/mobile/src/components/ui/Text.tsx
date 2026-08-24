import { Text as RNText, type TextProps } from 'react-native';

import { theme } from '@/theme/theme';

type Variant = 'micro' | 'caption' | 'bodyS' | 'body' | 'title' | 'h2' | 'h1' | 'numL';
type Tone = 'ink' | 'muted' | 'faint' | 'accent' | 'onAccent';

const TONE: Record<Tone, string> = {
  ink: theme.color.ink,
  muted: theme.color.ink55,
  faint: theme.color.ink40,
  accent: theme.color.accent,
  onAccent: theme.color.onAccent,
};

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: keyof typeof theme.fontWeight;
  /** Tabular figures, for money and other aligned columns. */
  numeric?: boolean;
}

export function Text({
  variant = 'body',
  tone = 'ink',
  weight = 'regular',
  numeric = false,
  style,
  ...rest
}: Props) {
  return (
    <RNText
      style={[
        {
          fontSize: theme.fontSize[variant],
          color: TONE[tone],
          fontWeight: theme.fontWeight[weight],
        },
        numeric ? { fontVariant: ['tabular-nums' as const] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
