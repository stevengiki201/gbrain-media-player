import {
  Clapperboard,
  ListMusic,
  Music,
  RefreshCw,
  Search,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SongRow } from '@/components/ui/SongRow';
import { usePlaybackManager } from '@/context/PlaybackContext';
import { useTheme } from '@/context/ThemeContext';
import type { MediaItem } from '@/lib/types';
import { useStore } from '@/store/StoreContext';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function matches(item: MediaItem, query: string): boolean {
  const q = query.toLowerCase();
  return (
    item.title.toLowerCase().includes(q) ||
    item.artist.toLowerCase().includes(q) ||
    item.album.toLowerCase().includes(q)
  );
}

const HomeScreen = observer(() => {
  const store = useStore();
  const manager = usePlaybackManager();
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const tracks = store.media.tracks.slice();
  const videos = store.media.videos.slice();
  const hasMedia = tracks.length > 0 || videos.length > 0;

  const recentlyPlayed = store.history.recentTracks(10);
  const favoriteTracks = store.favorites.ids
    .map((id) => store.media.trackById(id))
    .filter((item): item is MediaItem => Boolean(item));
  const recentlyAdded = tracks
    .slice()
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, 6);
  const recentVideos = videos
    .slice()
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, 5);
  const recentPlaylists = store.playlists.playlists
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  const searchResults = query.trim()
    ? {
        tracks: tracks.filter((item) => matches(item, query.trim())),
        videos: videos.filter((item) => matches(item, query.trim())),
      }
    : null;

  const playTrack = (item: MediaItem, list: MediaItem[]) => {
    manager.playAudio(item, list);
  };

  const openVideo = (item: MediaItem) => {
    router.push({ pathname: '/video/[id]', params: { id: item.id } });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <AppText variant="caption" color={colors.textSecondary}>
            {greeting()}
          </AppText>
          <AppText variant="display">Your library</AppText>
        </View>
        <IconButton icon={RefreshCw} onPress={() => void store.media.scan()} variant="soft" color={colors.text} />
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.input }]}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search songs, artists, videos"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <X size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {searchResults ? (
          <SearchResults
            tracks={searchResults.tracks}
            videos={searchResults.videos}
            onPlayTrack={(item) => playTrack(item, searchResults.tracks)}
            onOpenVideo={openVideo}
          />
        ) : !hasMedia ? (
          store.media.scanning || !store.media.hydrated ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.accent} />
              <AppText variant="body" color={colors.textSecondary} style={styles.loadingText}>
                Scanning your device…
              </AppText>
            </View>
          ) : (
            <EmptyState
              icon={Music}
              title={store.media.error || 'No media found'}
              subtitle={
                store.media.error
                  ? 'Grant media permissions and try scanning again.'
                  : 'Add music or videos to your device, then scan your library.'
              }
            />
          )
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatCard icon={Music} label="Songs" value={tracks.length} onPress={() => router.push('/music')} />
              <StatCard icon={Clapperboard} label="Videos" value={videos.length} onPress={() => router.push('/videos')} />
              <StatCard icon={Users} label="Artists" value={store.media.artists.length} onPress={() => router.push('/music')} />
              <StatCard icon={ListMusic} label="Playlists" value={store.playlists.playlists.length} onPress={() => router.push('/playlists')} />
            </View>

            {recentlyPlayed.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Recently played" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {recentlyPlayed.map((item) => (
                    <MediaTile
                      key={`recent-${item.id}`}
                      item={item}
                      onPress={() => playTrack(item, tracks)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {favoriteTracks.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Favorite songs" />
                {favoriteTracks.slice(0, 5).map((item) => (
                  <SongRow
                    key={`fav-${item.id}`}
                    item={item}
                    onPress={() => playTrack(item, favoriteTracks)}
                    showAlbum={false}
                    onMore={() => void store.favorites.toggle(item.id)}
                  />
                ))}
              </View>
            ) : null}

            {recentlyAdded.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Recently added" actionLabel="See all" onAction={() => router.push('/music')} />
                {recentlyAdded.map((item) => (
                  <SongRow
                    key={`added-${item.id}`}
                    item={item}
                    onPress={() => playTrack(item, tracks)}
                    isActive={false}
                  />
                ))}
              </View>
            ) : null}

            {recentVideos.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Videos" actionLabel="See all" onAction={() => router.push('/videos')} />
                {recentVideos.map((item) => (
                  <Pressable
                    key={`vid-${item.id}`}
                    onPress={() => openVideo(item)}
                    style={({ pressed }) => [
                      styles.videoRow,
                      { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
                    ]}>
                    <Artwork uri={item.thumbnail} seed={item.id} size={112} radius={10} />
                    <View style={styles.videoInfo}>
                      <AppText variant="label" numberOfLines={2}>
                        {item.title}
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                        {item.folder ? item.folder.split('/').pop() : 'Video'}
                      </AppText>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {recentPlaylists.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Playlists" actionLabel="See all" onAction={() => router.push('/playlists')} />
                {recentPlaylists.map((playlist) => (
                  <Pressable
                    key={`pl-${playlist.id}`}
                    onPress={() => router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } })}
                    style={({ pressed }) => [
                      styles.playlistRow,
                      { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
                    ]}>
                    <View style={[styles.playlistIcon, { backgroundColor: colors.accentSoft }]}>
                      <ListMusic size={22} color={colors.accent} />
                    </View>
                    <View style={styles.playlistInfo}>
                      <AppText variant="label" numberOfLines={1}>
                        {playlist.name}
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {store.playlists.trackCount(playlist.id)} tracks
                      </AppText>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
});

function StatCard({
  icon: Icon,
  label,
  value,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
      ]}>
      <View style={[styles.statIcon, { backgroundColor: colors.accentSoft }]}>
        <Icon size={18} color={colors.accent} />
      </View>
      <AppText variant="heading" color={colors.text}>
        {value > 999 ? `${Math.round(value / 100) / 10}k` : value}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

function MediaTile({ item, onPress }: { item: MediaItem; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginRight: 14 })}>
      <Artwork uri={item.artwork ?? item.thumbnail} seed={item.id || item.title} size={96} radius={14} />
      <AppText variant="caption" numberOfLines={1} style={styles.tileTitle}>
        {item.title}
      </AppText>
      <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
        {item.artist || 'Unknown'}
      </AppText>
    </Pressable>
  );
}

function SearchResults({
  tracks,
  videos,
  onPlayTrack,
  onOpenVideo,
}: {
  tracks: MediaItem[];
  videos: MediaItem[];
  onPlayTrack: (item: MediaItem) => void;
  onOpenVideo: (item: MediaItem) => void;
}) {
  const total = tracks.length + videos.length;
  if (total === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No results"
        subtitle="Try a different song, artist, album or video title."
      />
    );
  }
  return (
    <View>
      {tracks.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={`Songs (${tracks.length})`} />
          {tracks.slice(0, 40).map((item) => (
            <SongRow
              key={`sr-${item.id}`}
              item={item}
              onPress={() => onPlayTrack(item)}
              showAlbum={false}
            />
          ))}
        </View>
      ) : null}
      {videos.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={`Videos (${videos.length})`} />
          {videos.slice(0, 20).map((item) => (
            <SongRow
              key={`srv-${item.id}`}
              item={item}
              onPress={() => onOpenVideo(item)}
              subtitle="Video"
              showAlbum={false}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  scroll: {
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  section: {
    marginTop: 26,
    paddingHorizontal: 20,
  },
  tileTitle: {
    marginTop: 8,
    maxWidth: 96,
    fontWeight: '600',
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 12,
  },
  videoInfo: {
    flex: 1,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
  },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
  },
});

export default HomeScreen;