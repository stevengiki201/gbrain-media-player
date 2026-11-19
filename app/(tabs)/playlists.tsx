import { ListMusic, Plus, Search, Trash2, X } from 'lucide-react-native';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import type { Playlist } from '@/lib/types';
import { useStore } from '@/store/StoreContext';

const PlaylistsScreen = observer(() => {
  const store = useStore();
  const router = useRouter();
  const { colors } = useTheme();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');

  const playlists = store.playlists.playlists
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter((playlist) =>
      query.trim() ? playlist.name.toLowerCase().includes(query.trim().toLowerCase()) : true,
    );

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await store.playlists.create(trimmed);
    setName('');
    setCreating(false);
  };

  const confirmDelete = (playlist: Playlist) => {
    Alert.alert('Delete playlist', `Delete "${playlist.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void store.playlists.remove(playlist.id);
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <AppText variant="caption" color={colors.textSecondary}>
              {store.playlists.playlists.length} playlists
            </AppText>
            <AppText variant="display">Playlists</AppText>
          </View>
          <IconButton
            icon={Plus}
            onPress={() => setCreating(true)}
            variant="solid"
            color={colors.onAccent}
          />
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.input }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search playlists"
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

      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/playlist/[id]', params: { id: item.id } })}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
            ]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
              <ListMusic size={24} color={colors.accent} />
            </View>
            <View style={styles.rowInfo}>
              <AppText variant="label" numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {store.playlists.trackCount(item.id)} tracks
              </AppText>
            </View>
            <Pressable onPress={() => confirmDelete(item)} hitSlop={8} style={styles.deleteBtn}>
              <Trash2 size={18} color={colors.textMuted} />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={ListMusic}
            title="No playlists yet"
            subtitle="Create a playlist to organize your favorite songs."
          />
        }
      />

      <Modal visible={creating} transparent animationType="fade" onRequestClose={() => setCreating(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.scrim }]} onPress={() => setCreating(false)}>
          <Pressable
            style={[styles.dialog, { backgroundColor: colors.surface }]}
            onPress={(event) => event.stopPropagation()}>
            <AppText variant="heading">New playlist</AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Playlist name"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              autoFocus
              onSubmitEditing={() => void create()}
            />
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setCreating(false)} style={styles.dialogButton}>
                <AppText variant="label" color={colors.textSecondary}>
                  Cancel
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => void create()}
                style={[styles.dialogButton, { backgroundColor: colors.accent }]}>
                <AppText variant="label" color={colors.onAccent}>
                  Create
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
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  deleteBtn: {
    padding: 8,
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

export default PlaylistsScreen;