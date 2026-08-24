import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme/theme';

/** Standard screen container: paper background, safe-area aware, optional scroll. */
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const padding = { paddingBottom: insets.bottom + theme.space[4] };

  if (!scroll) {
    return <View style={[styles.root, padding]}>{children}</View>;
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, padding]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.paper },
  content: { padding: theme.space[4], gap: theme.space[3] },
});
