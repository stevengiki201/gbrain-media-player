import { Clapperboard, RefreshCw, Search, X } from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { VideoCard } from '@/components/ui/VideoCard';
import { useTheme } from '@/context/ThemeContext';
import type { MediaItem } from '@/lib/types';
import { useStore } from '@/store/StoreContext';

const H_PADDING = 16;
const GAP = 12;

const VideosScreen = observer(() => {
  const store = useStore();
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');

  const cardWidth = Math.floor((width - H_PADDING * 2 - GAP) / 2);

  const q = query.trim().toLowerCase();
  const videos = store.media.videos
    .slice()
    .sort((a, b) => b.addedAt - a.addedAt)
    .filter((item) =>
      q ? item.title.toLowerCase().includes(q) || (item.folder ?? '').toLowerCase().includes(q) : true,
    );

  const openVideo = (item: MediaItem) => {
    router.push({ pathname: '/video/[id]', params: { id: item.id } });
  };

  const hasVideos = store.media.videoCount > 0;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <AppText variant="caption" color={colors.textSecondary}>
              {store.media.videoCount} videos
            </AppText>
            <AppText variant="display">Videos</AppText>
          </View>
          <IconButton
            icon={RefreshCw}
            onPress={() => void store.media.scan()}
            variant="soft"
            color={colors.text}
          />
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.input }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search videos"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!hasVideos ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={Clapperboard}
            title={store.media.error || 'No videos yet'}
            subtitle="Scan your device to discover video files, or add videos and try again."
          />
          {store.media.error ? null : (
            <Pressable
              onPress={() => void store.media.scan()}
              style={[styles.primaryButton, { backgroundColor: colors.accent }]}>
              <AppText variant="label" color={colors.onAccent}>
                {store.media.scanning ? 'Scanning…' : 'Scan device'}
              </AppText>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <VideoCard
              item={item}
              width={cardWidth}
              onPress={() => openVideo(item)}
              resumePosition={store.history.positionOf(item.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon={Search} title="No videos found" subtitle="Try a different search." />
          }
        />
      )}
    </Screen>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  gridContent: {
    paddingHorizontal: H_PADDING,
    rowGap: 16,
    paddingBottom: 40,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});

export default VideosScreen;