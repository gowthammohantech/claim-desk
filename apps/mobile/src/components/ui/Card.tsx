import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme/theme';

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.paperRaised,
    borderRadius: theme.radius.card,
    padding: theme.space[4],
    gap: theme.space[2],
    ...theme.shadow.raised,
  },
});
