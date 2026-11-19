import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
};

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  const color = '#64748B';
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon size={40} color={color} />
      </View>
      <AppText variant="heading" align="center" color={color}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" align="center" color="#94A3B8" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 8,
    lineHeight: 22,
    maxWidth: 320,
  },
});