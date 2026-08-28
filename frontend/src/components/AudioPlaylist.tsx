import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HttpSvc } from "../services/HttpSvc";
import { LocalStorageSvc } from "../services/LocalStorageSvc";
import AudioPlayer from "./AudioPlayer";
import ErrorMessage from "./ErrorMessage";
import type { MP3Metadata } from "../types/manifest";
import "./AudioPlaylist.scss";

type AudioPlaylistProps = {
  folder: string;
  tracks: MP3Metadata[];
  isCompilation: boolean;
  coverUrl?: string | null;
};

function AudioPlaylist({
  folder,
  tracks,
  isCompilation,
  coverUrl,
}: AudioPlaylistProps) {
  // Keeps track of which track is currently selected for playback.
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  // Stores the presigned URL for each track once loaded.
  const [trackSources, setTrackSources] = useState<(string | null)[]>([]);
  // Indicates which track index is currently loading its source.
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  // Indicates which track index has encountered an error.
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  // Holds a reference to the audio element to control playback directly.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Flag to determine whether the next track change should auto-play.
  const shouldAutoplayRef = useRef(false);
  // Stores a resume time (in seconds) for the next track load.
  const resumeTimeRef = useRef<number | null>(null);

  // Build display labels for each track.
  const trackLabels = useMemo(
    () =>
      tracks.map((track, index) => {
        const fallbackTitle = track.title ?? `Track ${index + 1}`;
        if (isCompilation) {
          const artist = track.artist ?? "Unknown Artist";
          return `${artist} - ${fallbackTitle}`;
        }
        return fallbackTitle;
      }),
    [isCompilation, tracks]
  );

  // Reset playlist state whenever the folder or track list changes.
  useEffect(() => {
    setTrackSources(Array(tracks.length).fill(null));
    setLoadingIndex(null);
    setErrorIndex(null);

    if (!tracks.length) {
      setCurrentTrackIndex(0);
      resumeTimeRef.current = null;
      return;
    }

    const savedProgress = LocalStorageSvc.getPlaylistProgress(folder);
    if (savedProgress) {
      const clampedIndex = Math.min(
        Math.max(savedProgress.trackIndex ?? 0, 0),
        Math.max(tracks.length - 1, 0)
      );
      setCurrentTrackIndex(clampedIndex);
      resumeTimeRef.current =
        savedProgress.currentTime && savedProgress.currentTime > 0
          ? savedProgress.currentTime
          : null;
    } else {
      setCurrentTrackIndex(0);
      resumeTimeRef.current = null;
    }
  }, [folder, tracks]);

  // Ensure a presigned URL exists for the requested track index.
  const ensureTrackSource = useCallback(
    async (index: number) => {
      if (!tracks[index]) {
        return null;
      }

      if (trackSources[index]) {
        return trackSources[index];
      }

      setLoadingIndex(index);
      setErrorIndex(null);

      try {
        const src = await HttpSvc.getItem(folder, tracks[index].path);
        setTrackSources((prev) => {
          const next = [...prev];
          next[index] = src;
          return next;
        });
        return src;
      } catch (error) {
        console.error("Unable to load track source", error);
        setErrorIndex(index);
        return null;
      } finally {
        setLoadingIndex((current) => (current === index ? null : current));
      }
    },
    [folder, tracks, trackSources]
  );

  // Preload the currently selected track.
  useEffect(() => {
    if (!tracks.length) {
      return;
    }
    void ensureTrackSource(currentTrackIndex);
  }, [currentTrackIndex, ensureTrackSource, tracks.length]);

  // Whenever the selected track or sources change, refresh the audio element.
  useEffect(() => {
    const src = trackSources[currentTrackIndex];
    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }

    let metadataHandler: (() => void) | null = null;

    audioElement.load();

    const resumeTime = resumeTimeRef.current;
    if (src && typeof resumeTime === "number" && resumeTime > 0) {
      const seekToResumeTime = () => {
        if (!audioElement) {
          return;
        }
        audioElement.currentTime = resumeTime;
        resumeTimeRef.current = null;
      };

      if (audioElement.readyState >= 1) {
        seekToResumeTime();
      } else {
        metadataHandler = () => {
          seekToResumeTime();
          audioElement.removeEventListener("loadedmetadata", metadataHandler!);
        };
        audioElement.addEventListener("loadedmetadata", metadataHandler);
      }
    }

    if (src && shouldAutoplayRef.current) {
      shouldAutoplayRef.current = false;
      audioElement.play().catch(() => {});
    }

    return () => {
      if (metadataHandler && audioElement) {
        audioElement.removeEventListener("loadedmetadata", metadataHandler);
      }
    };
  }, [currentTrackIndex, trackSources]);

  const saveProgress = useCallback(
    (trackIndexToSave: number, timeToSave: number) => {
      if (!tracks.length) {
        return;
      }
      LocalStorageSvc.setPlaylistProgress(folder, {
        trackIndex: Math.max(0, Math.min(trackIndexToSave, tracks.length - 1)),
        currentTime: Math.max(0, timeToSave),
      });
    },
    [folder, tracks.length]
  );

  /**
   * Switches to a different track and optionally auto-plays it.
   */
  const changeTrack = useCallback(
    (
      nextIndex: number,
      {
        autoPlay = false,
        resumeTime = 0,
        skipSave = false,
      }: { autoPlay?: boolean; resumeTime?: number; skipSave?: boolean } = {}
    ) => {
      shouldAutoplayRef.current = autoPlay;
      resumeTimeRef.current =
        typeof resumeTime === "number" && resumeTime > 0 ? resumeTime : null;
      setCurrentTrackIndex(nextIndex);
      if (!skipSave) {
        saveProgress(nextIndex, resumeTime ?? 0);
      }
    },
    [saveProgress]
  );

  /**
   * Handles clicks on playlist items.
   * - If the user clicks the current track, restart it.
   * - Otherwise, switch to the selected track.
   */
  const handleSelectTrackClick = (selectedTrackIndex: number) => {
    if (selectedTrackIndex === currentTrackIndex) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }
    changeTrack(selectedTrackIndex, { autoPlay: true });
  };

  const mediaSession =
    typeof navigator !== "undefined" && "mediaSession" in navigator
      ? navigator.mediaSession
      : null;
  const hasPositionState =
    !!mediaSession && typeof mediaSession.setPositionState === "function";
  const SEEK_STEP_SECONDS = 10;

  const buildArtwork = useCallback(() => {
    if (!coverUrl) {
      return [];
    }
    const sizes = ["96x96", "128x128", "192x192", "256x256", "512x512"];
    return sizes.map((size) => ({
      src: coverUrl,
      sizes: size,
      type: "image/png",
    }));
  }, [coverUrl]);

  const updateMediaSessionMetadata = useCallback(
    (trackIndex: number) => {
      if (!mediaSession || !tracks[trackIndex]) {
        return;
      }

      const track = tracks[trackIndex];
      const title = trackLabels[trackIndex] ?? track.title ?? "Unknown Title";
      const artist = track.artist ?? "Unknown Artist";
      const album = track.album ?? folder;

      try {
        mediaSession.metadata = new MediaMetadata({
          title,
          artist,
          album,
          artwork: buildArtwork(),
        });
      } catch {
        // Ignore metadata errors gracefully.
      }
    },
    [buildArtwork, folder, mediaSession, trackLabels, tracks]
  );

  const updateMediaSessionPlaybackState = useCallback(() => {
    if (!mediaSession || !audioRef.current) {
      return;
    }
    mediaSession.playbackState = audioRef.current.paused ? "paused" : "playing";
  }, [mediaSession]);

  const updateMediaSessionPositionState = useCallback(() => {
    if (!hasPositionState || !audioRef.current) {
      return;
    }
    const { duration, currentTime, playbackRate } = audioRef.current;
    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }
    try {
      mediaSession?.setPositionState({
        duration,
        playbackRate: playbackRate || 1,
        position: currentTime,
      });
    } catch {
      // Some platforms may throw if position state is unsupported.
    }
  }, [hasPositionState, mediaSession]);

  /**
   * Switches to the next track. Autoplay is enabled by default so it matches
   * the behavior from the shared component.
   */
  const goToNextTrack = useCallback(
    (
      options: {
        autoPlay?: boolean;
        resumeTime?: number;
        skipSave?: boolean;
      } = {
        autoPlay: true,
      }
    ) => {
      if (currentTrackIndex < tracks.length - 1) {
        changeTrack(currentTrackIndex + 1, options);
      }
    },
    [changeTrack, currentTrackIndex, tracks.length]
  );

  /**
   * Switches to the previous track and starts it automatically.
   */
  const goToPreviousTrack = useCallback(() => {
    if (currentTrackIndex > 0) {
      changeTrack(currentTrackIndex - 1, { autoPlay: true });
    }
  }, [changeTrack, currentTrackIndex]);

  /**
   * Automatically advances to the next track when the current one ends.
   */
  const autoAdvanceToNextTrack = useCallback(() => {
    const isLastTrack = currentTrackIndex >= tracks.length - 1;
    if (isLastTrack) {
      LocalStorageSvc.removePlaylistProgress(folder);
      resumeTimeRef.current = null;
      changeTrack(0, { autoPlay: false, resumeTime: 0, skipSave: true });
      return;
    }

    goToNextTrack({ autoPlay: true });
  }, [changeTrack, currentTrackIndex, folder, goToNextTrack, tracks.length]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }

    const persistTime = () => {
      if (
        audioElement.readyState < 2 &&
        audioElement.paused &&
        audioElement.currentTime === 0 &&
        !audioElement.seeking
      ) {
        return;
      }

      const time = audioElement.currentTime;
      resumeTimeRef.current = time;
      saveProgress(currentTrackIndex, time);
    };

    const handleEnded = () => {
      const isLastTrack = currentTrackIndex >= tracks.length - 1;
      if (isLastTrack) {
        LocalStorageSvc.removePlaylistProgress(folder);
        resumeTimeRef.current = null;
      } else {
        saveProgress(currentTrackIndex, 0);
      }
    };

    audioElement.addEventListener("timeupdate", persistTime);
    audioElement.addEventListener("pause", persistTime);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("play", updateMediaSessionPlaybackState);
    audioElement.addEventListener("pause", updateMediaSessionPlaybackState);
    audioElement.addEventListener("timeupdate", updateMediaSessionPositionState);

    return () => {
      audioElement.removeEventListener("timeupdate", persistTime);
      audioElement.removeEventListener("pause", persistTime);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("play", updateMediaSessionPlaybackState);
      audioElement.removeEventListener("pause", updateMediaSessionPlaybackState);
      audioElement.removeEventListener(
        "timeupdate",
        updateMediaSessionPositionState
      );
    };
  }, [
    currentTrackIndex,
    folder,
    saveProgress,
    tracks.length,
    updateMediaSessionPlaybackState,
    updateMediaSessionPositionState,
  ]);

  useEffect(() => {
    const handlePersist = () => {
      if (!audioRef.current) {
        return;
      }
      saveProgress(currentTrackIndex, audioRef.current.currentTime);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handlePersist();
      }
    };

    window.addEventListener("beforeunload", handlePersist);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handlePersist);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentTrackIndex, saveProgress]);

  useEffect(() => {
    if (!mediaSession) {
      return;
    }

    updateMediaSessionMetadata(currentTrackIndex);
    updateMediaSessionPositionState();
    updateMediaSessionPlaybackState();
  }, [
    currentTrackIndex,
    mediaSession,
    trackSources,
    updateMediaSessionMetadata,
    updateMediaSessionPlaybackState,
    updateMediaSessionPositionState,
  ]);

  useEffect(() => {
    if (!mediaSession) {
      return;
    }

    const setHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch {
        // Ignore unsupported actions.
      }
    };

    const seekBy = (deltaSeconds: number) => {
      const audioElement = audioRef.current;
      if (!audioElement) {
        return;
      }
      const duration = Number.isFinite(audioElement.duration)
        ? audioElement.duration
        : Number.MAX_SAFE_INTEGER;
      const nextTime = Math.max(
        0,
        Math.min(duration, audioElement.currentTime + deltaSeconds)
      );
      audioElement.currentTime = nextTime;
      updateMediaSessionPositionState();
    };

    setHandler("play", () => void audioRef.current?.play());
    setHandler("pause", () => audioRef.current?.pause());
    setHandler("previoustrack", () => goToPreviousTrack());
    setHandler("nexttrack", () => goToNextTrack({ autoPlay: true }));
    setHandler("seekto", (details) => {
      if (!details || details.seekTime === undefined) {
        return;
      }
      const audioElement = audioRef.current;
      if (!audioElement) {
        return;
      }
      const duration = Number.isFinite(audioElement.duration)
        ? audioElement.duration
        : Number.MAX_SAFE_INTEGER;
      const clamped = Math.max(0, Math.min(duration, details.seekTime));
      if (details.fastSeek && audioElement.fastSeek) {
        audioElement.fastSeek(clamped);
      } else {
        audioElement.currentTime = clamped;
      }
      updateMediaSessionPositionState();
    });
    setHandler("seekbackward", () => seekBy(-SEEK_STEP_SECONDS));
    setHandler("seekforward", () => seekBy(SEEK_STEP_SECONDS));
    setHandler("stop", () => audioRef.current?.pause());
    setHandler("skipad", null);

    return () => {
      setHandler("play", null);
      setHandler("pause", null);
      setHandler("previoustrack", null);
      setHandler("nexttrack", null);
      setHandler("seekto", null);
      setHandler("seekbackward", null);
      setHandler("seekforward", null);
      setHandler("stop", null);
      setHandler("skipad", null);
    };
  }, [
    goToNextTrack,
    goToPreviousTrack,
    mediaSession,
    updateMediaSessionPositionState,
  ]);

  useEffect(() => {
    if (!mediaSession) {
      return undefined;
    }
    return () => {
      try {
        mediaSession.metadata = null as unknown as MediaMetadata;
      } catch {
        // Ignore cleanup errors.
      }
    };
  }, [mediaSession]);

  if (!tracks.length) {
    return <div>No tracks available.</div>;
  }

  const currentSource = trackSources[currentTrackIndex];

  return (
    <div>
      <div>
        <div className="audio-playlist__current-track">
          {trackLabels[currentTrackIndex]}
        </div>

        {errorIndex === currentTrackIndex && (
          <ErrorMessage message="Unable to load track" />
        )}
      </div>

      <div className="audio-playlist__controls">
        <button
          type="button"
          onClick={() => void goToPreviousTrack()}
          disabled={currentTrackIndex === 0}
        >
          Previous
        </button>

        <AudioPlayer
          audioPath={currentSource ?? ""}
          audioRef={audioRef}
          onEnded={autoAdvanceToNextTrack}
        />

        <button
          type="button"
          onClick={() => void goToNextTrack()}
          disabled={currentTrackIndex >= tracks.length - 1}
        >
          Next
        </button>
      </div>

      <ol className="audio-playlist__tracks">
        {tracks.map((track, index) => (
          <li key={track.path}>
            <a
              onClick={() => void handleSelectTrackClick(index)}
              className={
                index === currentTrackIndex
                  ? "audio-playlist__track-button audio-playlist__track-button--active"
                  : "audio-playlist__track-button"
              }
            >
              {trackLabels[index]}
              {errorIndex === index && (
                <ErrorMessage message="Unable to load track" />
              )}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default AudioPlaylist;
