import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  PlaybackManager,
  type PlaybackControls,
  type PlaybackSnapshot,
} from '@/lib/playback/PlaybackManager';
import { useStore } from '@/store/StoreContext';

const ManagerContext = createContext<PlaybackManager | null>(null);
const SnapshotContext = createContext<PlaybackSnapshot | null>(null);
const ControlsContext = createContext<PlaybackControls | null>(null);

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const managerRef = useRef<PlaybackManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new PlaybackManager();
  }
  const manager = managerRef.current;

  useEffect(() => {
    manager.setCallbacks({
      onStart: (item) => {
        void store.history.record(item).catch(() => {});
      },
      onProgress: (item, positionSeconds) => {
        void store.history
          .savePosition(item.id, positionSeconds * 1000)
          .catch(() => {});
      },
    });
    manager.init();
    return () => {
      manager.setCallbacks({});
      manager.destroy();
    };
  }, [manager, store]);

  const snapshot = useSyncExternalStore(
    manager.subscribe,
    manager.getSnapshot,
    manager.getSnapshot,
  );
  const controls = useSyncExternalStore(
    manager.subscribeControls,
    manager.getControls,
    manager.getControls,
  );

  const managerValue = useMemo(() => manager, [manager]);

  return (
    <ManagerContext.Provider value={managerValue}>
      <SnapshotContext.Provider value={snapshot}>
        <ControlsContext.Provider value={controls}>{children}</ControlsContext.Provider>
      </SnapshotContext.Provider>
    </ManagerContext.Provider>
  );
}

export function usePlaybackManager(): PlaybackManager {
  const manager = useContext(ManagerContext);
  if (!manager) {
    throw new Error('usePlaybackManager must be used within a PlaybackProvider');
  }
  return manager;
}

export function usePlaybackSnapshot(): PlaybackSnapshot {
  const snapshot = useContext(SnapshotContext);
  if (!snapshot) {
    throw new Error('usePlaybackSnapshot must be used within a PlaybackProvider');
  }
  return snapshot;
}

export function usePlaybackControls(): PlaybackControls {
  const controls = useContext(ControlsContext);
  if (!controls) {
    throw new Error('usePlaybackControls must be used within a PlaybackProvider');
  }
  return controls;
}

export function usePlayback(): {
  manager: PlaybackManager;
  snapshot: PlaybackSnapshot;
} {
  return {
    manager: usePlaybackManager(),
    snapshot: usePlaybackSnapshot(),
  };
}