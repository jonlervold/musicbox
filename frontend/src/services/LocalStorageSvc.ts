const CODE_KEY = "code";
const PLAYLIST_PROGRESS_PREFIX = "playlist-progress:";

export type PlaylistProgress = {
  trackIndex: number;
  currentTime: number;
};

export const LocalStorageSvc = {
  getCode(): string | null {
    return window.localStorage.getItem(CODE_KEY);
  },

  setCode(value: string) {
    window.localStorage.setItem(CODE_KEY, value);
  },

  getPlaylistProgress(folder: string): PlaylistProgress | null {
    const key = `${PLAYLIST_PROGRESS_PREFIX}${folder}`;
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.trackIndex === "number" &&
        typeof parsed.currentTime === "number"
      ) {
        return {
          trackIndex: parsed.trackIndex,
          currentTime: parsed.currentTime,
        };
      }
    } catch {
      // ignore malformed data
    }

    return null;
  },

  setPlaylistProgress(folder: string, progress: PlaylistProgress) {
    const key = `${PLAYLIST_PROGRESS_PREFIX}${folder}`;
    window.localStorage.setItem(key, JSON.stringify(progress));
  },

  removePlaylistProgress(folder: string) {
    const key = `${PLAYLIST_PROGRESS_PREFIX}${folder}`;
    window.localStorage.removeItem(key);
  },
};

