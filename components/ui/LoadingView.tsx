import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

import { AppText } from './AppText';

type LoadingViewProps = {
  label?: string;
};

export function LoadingView({ label }: LoadingViewProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      {label ? (
        <AppText variant="body" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  label: {
    marginTop: 12,
  },
});