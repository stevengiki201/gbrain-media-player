import {
  Disc3,
  Mic2,
  Music,
  RefreshCw,
  Search,
  X,
} from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SongRow } from '@/components/ui/SongRow';
import { usePlaybackControls, usePlaybackManager } from '@/context/PlaybackContext';
import { useTheme } from '@/context/ThemeContext';
import type { AlbumSummary, ArtistSummary, MediaItem } from '@/lib/types';
import { useStore } from '@/store/StoreContext';

type TabKey = 'songs' | 'albums' | 'artists';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'songs', label: 'Songs' },
  { key: 'albums', label: 'Albums' },
  { key: 'artists', label: 'Artists' },
];

function includes(item: MediaItem, q: string): boolean {
  return (
    item.title.toLowerCase().includes(q) ||
    item.artist.toLowerCase().includes(q) ||
    item.album.toLowerCase().includes(q)
  );
}

const MusicScreen = observer(() => {
  const store = useStore();
  const manager = usePlaybackManager();
  const controls = usePlaybackControls();
  const { colors } = useTheme();
  const [tab, setTab] = useState<TabKey>('songs');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const tracks = store.media.tracks.slice();
  const filteredTracks = q ? tracks.filter((item) => includes(item, q)) : tracks;

  const albums = store.media.albums
    .map((album) => ({
      ...album,
      tracks: q ? album.tracks.filter((track) => includes(track, q)) : album.tracks,
    }))
    .filter((album) => album.tracks.length > 0);

  const artists = store.media.artists
    .map((artist) => ({
      ...artist,
      tracks: q ? artist.tracks.filter((track) => includes(track, q)) : artist.tracks,
    }))
    .filter((artist) => artist.tracks.length > 0);

  const playTrack = (item: MediaItem, list: MediaItem[]) => {
    manager.playAudio(item, list);
  };

  const hasTracks = store.media.trackCount > 0;

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <AppText variant="caption" color={colors.textSecondary}>
              {store.media.trackCount} songs · {albums.length} albums
            </AppText>
            <AppText variant="display">Music</AppText>
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
            placeholder="Search your music"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.tabs}>
          {TABS.map((entry) => {
            const selected = tab === entry.key;
            return (
              <Pressable
                key={entry.key}
                onPress={() => setTab(entry.key)}
                style={[
                  styles.tab,
                  { backgroundColor: selected ? colors.accentSoft : 'transparent' },
                ]}>
                <AppText
                  variant="label"
                  color={selected ? colors.accent : colors.textSecondary}>
                  {entry.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    ),
    [colors, store, albums.length, query, tab],
  );

  if (!hasTracks) {
    return (
      <Screen>
        {listHeader}
        <EmptyState
          icon={Music}
          title={store.media.error || 'No songs yet'}
          subtitle="Scan your device to discover audio files, or add music and try again."
        />
        {store.media.error ? null : (
          <View style={styles.emptyButtonWrap}>
            <Pressable
              onPress={() => void store.media.scan()}
              style={[styles.primaryButton, { backgroundColor: colors.accent }]}>
              <AppText variant="label" color={colors.onAccent}>
                {store.media.scanning ? 'Scanning…' : 'Scan device'}
              </AppText>
            </Pressable>
          </View>
        )}
      </Screen>
    );
  }

  if (tab === 'songs') {
    return (
      <Screen>
        <FlatList
          data={filteredTracks}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SongRow
              item={item}
              onPress={() => playTrack(item, filteredTracks)}
              isActive={controls.currentId === item.id}
              isPlaying={controls.isPlaying && controls.currentId === item.id}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon={Search} title="No songs found" subtitle="Try a different search." />
          }
        />
      </Screen>
    );
  }

  if (tab === 'albums') {
    return (
      <Screen>
        <FlatList
          data={albums}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AlbumRow album={item} onPress={() => playTrack(item.tracks[0], item.tracks)} />
          )}
          ListEmptyComponent={
            <EmptyState icon={Disc3} title="No albums found" subtitle="Try a different search." />
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={artists}
        keyExtractor={(item) => item.name}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ArtistRow artist={item} onPress={() => playTrack(item.tracks[0], item.tracks)} />
        )}
        ListEmptyComponent={
          <EmptyState icon={Mic2} title="No artists found" subtitle="Try a different search." />
        }
      />
    </Screen>
  );
});

function AlbumRow({ album, onPress }: { album: AlbumSummary; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
      ]}>
      <Artwork uri={album.artwork} seed={album.id || album.title} size={56} radius={10} />
      <View style={styles.rowInfo}>
        <AppText variant="label" numberOfLines={1}>
          {album.title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {album.artist} · {album.trackCount} tracks
        </AppText>
      </View>
    </Pressable>
  );
}

function ArtistRow({ artist, onPress }: { artist: ArtistSummary; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
      ]}>
      <Artwork uri={artist.artwork} seed={artist.name} size={56} radius={28} rounded />
      <View style={styles.rowInfo}>
        <AppText variant="label" numberOfLines={1}>
          {artist.name}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {artist.trackCount} songs
        </AppText>
      </View>
    </Pressable>
  );
}

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
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
  },
  rowInfo: {
    flex: 1,
  },
  emptyButtonWrap: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});

export default MusicScreen;