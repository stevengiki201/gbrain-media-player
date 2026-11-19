import {
  Check,
  ChevronLeft,
  ListMusic,
  Play,
  Plus,
  Shuffle,
} from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { Artwork } from '@/components/ui/Artwork';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SongRow } from '@/components/ui/SongRow';
import { usePlaybackControls, usePlaybackManager } from '@/context/PlaybackContext';
import { useTheme } from '@/context/ThemeContext';
import type { MediaItem } from '@/lib/types';
import { useStore } from '@/store/StoreContext';

const PlaylistDetailScreen = observer(() => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlistId = Array.isArray(id) ? id[0] : id ?? '';
  const store = useStore();
  const manager = usePlaybackManager();
  const controls = usePlaybackControls();
  const router = useRouter();
  const { colors } = useTheme();

  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const playlist = store.playlists.playlistById(playlistId);
  const tracks = useMemo(
    () =>
      store.playlists
        .itemsFor(playlistId)
        .map((item) => store.media.trackById(item.mediaId))
        .filter((item): item is MediaItem => Boolean(item)),
    [store, playlistId],
  );

  if (!playlist) {
    return (
      <Screen>
        <EmptyState icon={ListMusic} title="Playlist not found" subtitle="It may have been deleted." />
      </Screen>
    );
  }

  const playAll = (shuffle: boolean) => {
    if (tracks.length === 0) return;
    if (shuffle && !controls.shuffle) manager.toggleShuffle();
    manager.playAudio(tracks[0], tracks);
  };

  const openAdd = () => {
    setSelected([]);
    setAdding(true);
  };

  const confirmAdd = async () => {
    if (selected.length > 0) {
      await store.playlists.addItems(playlistId, selected);
    }
    setAdding(false);
    setSelected([]);
  };

  const toggleSelect = (mediaId: string) => {
    setSelected((prev) =>
      prev.includes(mediaId) ? prev.filter((entry) => entry !== mediaId) : [...prev, mediaId],
    );
  };

  const removeTrack = (mediaId: string, title: string) => {
    Alert.alert('Remove song', `Remove "${title}" from this playlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void store.playlists.removeItem(playlistId, mediaId);
        },
      },
    ]);
  };

  const move = (index: number, direction: -1 | 1) => {
    const ordered = tracks.map((track) => track.id);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    void store.playlists.reorder(playlistId, ordered);
  };

  const openRename = () => {
    setNameDraft(playlist.name);
    setRenaming(true);
  };

  const confirmRename = async () => {
    if (nameDraft.trim()) {
      await store.playlists.rename(playlistId, nameDraft.trim());
    }
    setRenaming(false);
  };

  const confirmDelete = () => {
    Alert.alert('Delete playlist', `Delete "${playlist.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void store.playlists.remove(playlistId);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <IconButton icon={ChevronLeft} onPress={() => router.back()} color={colors.text} size={26} />
        <View style={styles.topActions}>
          <IconButton icon={Plus} onPress={openAdd} color={colors.text} />
        </View>
      </View>

      <View style={styles.header}>
        <View style={[styles.art, { backgroundColor: colors.accentSoft }]}>
          <ListMusic size={40} color={colors.accent} />
        </View>
        <View style={styles.headerInfo}>
          <AppText variant="title" numberOfLines={2}>
            {playlist.name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {tracks.length} tracks
          </AppText>
          <View style={styles.headerButtons}>
            <Pressable
              onPress={() => playAll(false)}
              style={[styles.smallButton, { backgroundColor: colors.accent }]}>
              <Play size={16} color={colors.onAccent} fill={colors.onAccent} />
              <AppText variant="label" color={colors.onAccent}>
                Play
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => playAll(true)}
              style={[styles.smallButton, { backgroundColor: colors.surfaceAlt }]}>
              <Shuffle size={16} color={colors.text} />
              <AppText variant="label" color={colors.text}>
                Shuffle
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Pressable onPress={openRename} hitSlop={8}>
          <AppText variant="caption" color={colors.accent}>
            Rename
          </AppText>
        </Pressable>
        <Pressable onPress={confirmDelete} hitSlop={8}>
          <AppText variant="caption" color={colors.danger}>
            Delete
          </AppText>
        </Pressable>
      </View>

      {tracks.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="This playlist is empty"
          subtitle="Add songs from your library to get started."
        />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={styles.songRowWrap}>
              <SongRow
                item={item}
                onPress={() => manager.playAudio(item, tracks)}
                isActive={controls.currentId === item.id}
                isPlaying={controls.isPlaying && controls.currentId === item.id}
                onMore={() => {
                  Alert.alert(item.title, undefined, [
                    { text: 'Move up', onPress: () => move(index, -1) },
                    { text: 'Move down', onPress: () => move(index, 1) },
                    { text: 'Remove', style: 'destructive', onPress: () => removeTrack(item.id, item.title) },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
              />
            </View>
          )}
        />
      )}

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHeader}>
            <AppText variant="heading">Add songs</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {selected.length} selected
            </AppText>
          </View>
          <FlatList
            data={store.media.tracks}
            keyExtractor={(item) => item.id}
            style={styles.sheetList}
            renderItem={({ item }) => {
              const checked = selected.includes(item.id);
              return (
                <Pressable
                  onPress={() => toggleSelect(item.id)}
                  style={[styles.selectRow, { backgroundColor: checked ? colors.accentSoft : 'transparent' }]}>
                  <Artwork uri={item.artwork} seed={item.id} size={40} radius={8} />
                  <View style={styles.selectInfo}>
                    <AppText variant="label" numberOfLines={1}>
                      {item.title}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {item.artist || 'Unknown'}
                    </AppText>
                  </View>
                  {checked ? <Check size={20} color={colors.accent} /> : null}
                </Pressable>
              );
            }}
          />
          <View style={styles.sheetActions}>
            <Pressable onPress={() => setAdding(false)} style={styles.sheetButton}>
              <AppText variant="label" color={colors.textSecondary}>
                Cancel
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => void confirmAdd()}
              style={[styles.sheetButton, { backgroundColor: colors.accent }]}>
              <AppText variant="label" color={colors.onAccent}>
                Add{selected.length > 0 ? ` (${selected.length})` : ''}
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={renaming} transparent animationType="fade" onRequestClose={() => setRenaming(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.scrim }]} onPress={() => setRenaming(false)}>
          <Pressable style={[styles.dialog, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <AppText variant="heading">Rename playlist</AppText>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              autoFocus
              onSubmitEditing={() => void confirmRename()}
            />
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setRenaming(false)} style={styles.dialogButton}>
                <AppText variant="label" color={colors.textSecondary}>
                  Cancel
                </AppText>
              </Pressable>
              <Pressable onPress={() => void confirmRename()} style={[styles.dialogButton, { backgroundColor: colors.accent }]}>
                <AppText variant="label" color={colors.onAccent}>
                  Save
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
});

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  topActions: {
    flexDirection: 'row',
  },
  header: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
  },
  art: {
    width: 96,
    height: 96,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: 22,
    marginTop: 14,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 40,
  },
  songRowWrap: {
    marginBottom: 2,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sheetList: {
    paddingHorizontal: 12,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
  },
  selectInfo: {
    flex: 1,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(127,127,127,0.2)',
  },
  sheetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  dialog: {
    borderRadius: 18,
    padding: 20,
  },
  input: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  dialogButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});

export default PlaylistDetailScreen;