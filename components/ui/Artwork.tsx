import { Image, type ImageProps } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { gradientFor, initialsFor } from '@/lib/artwork';

import { AppText } from './AppText';

type ArtworkProps = {
  uri?: string | null;
  source?: ImageProps['source'];
  seed: string;
  size: number;
  radius?: number;
  rounded?: boolean;
  width?: number;
  height?: number;
};

export function Artwork({
  uri,
  source,
  seed,
  size,
  radius = 12,
  rounded = false,
  width,
  height,
}: ArtworkProps) {
  const [colorA, colorB] = gradientFor(seed);
  const w = width ?? size;
  const h = height ?? size;
  const borderRadius = rounded ? Math.min(w, h) / 2 : radius;
  const block = Math.max(w, h);

  const imageSource = source ?? (uri ? { uri } : null);
  if (imageSource) {
    return (
      <Image
        source={imageSource}
        style={{ width: w, height: h, borderRadius, backgroundColor: colorA }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={{
        width: w,
        height: h,
        borderRadius,
        backgroundColor: colorA,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          position: 'absolute',
          width: block * 1.2,
          height: block * 1.2,
          backgroundColor: colorB,
          opacity: 0.5,
          transform: [{ rotate: '35deg' }],
          top: h * 0.1,
          left: -w * 0.1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: w,
          height: h,
          backgroundColor: '#000000',
          opacity: 0.12,
        }}
      />
      <AppText
        variant="title"
        style={[styles.initials, { fontSize: Math.max(12, Math.min(w, h) * 0.3) }]}
        color="#FFFFFF">
        {initialsFor(seed)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  initials: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});