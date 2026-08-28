import { useEffect, useState, type ReactNode } from "react";
import { HttpSvc } from "../services/HttpSvc";
import { useAppStore } from "../store/useAppStore";
import AudioPlaylist from "./AudioPlaylist";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import "./AlbumContainer.scss";
import type { Manifest } from "../types/manifest";

type AlbumContainerProps = {
  manifest: Manifest;
};

function AlbumContainer({ manifest }: AlbumContainerProps) {
  const folder = useAppStore((state) => state.folder);
  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const defaultTitle = "MusicBox";

  useEffect(() => {
    const artist = manifest.artist?.trim();
    const album = manifest.title?.trim();
    const parts = [defaultTitle];

    if (artist || album) {
      parts.push([artist, album].filter((part) => Boolean(part)).join(" - "));
    }

    document.title = parts.join(" - ");

    return () => {
      document.title = defaultTitle;
    };
  }, [defaultTitle, manifest.artist, manifest.title]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCover() {
      if (!folder || !manifest.cover) {
        setCoverSrc(null);
        return;
      }

      setCoverLoading(true);
      setCoverError(null);

      try {
        const coverResponse = await HttpSvc.getItem(folder, manifest.cover);
        if (!isMounted) {
          return;
        }
        setCoverSrc(coverResponse);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setCoverError("Unable to load cover image");
      } finally {
        if (isMounted) {
          setCoverLoading(false);
        }
      }
    }

    fetchCover();

    return () => {
      isMounted = false;
    };
  }, [folder, manifest.cover]);

  const fallbackCoverSrc = `/mb/no-art.png`;

  let coverContent: ReactNode;
  if (coverLoading) {
    coverContent = <Loading label="Loading cover..." />;
  } else if (coverError) {
    coverContent = <ErrorMessage message={coverError} />;
  } else {
    const imageSrc = coverSrc ?? fallbackCoverSrc;
    coverContent = (
      <div className="album-container__cover">
        <img src={imageSrc} alt={manifest.title} />
      </div>
    );
  }

  return (
    <div>
      {coverContent}

      {!manifest.isCompilation && (
        <div className="album-container__heading">{manifest.artist}</div>
      )}
      <div className="album-container__heading album-container__title">
        {manifest.title}
      </div>

      {folder && manifest.tracks.length > 0 && (
        <AudioPlaylist
          folder={folder}
          tracks={manifest.tracks}
          isCompilation={manifest.isCompilation}
          coverUrl={coverSrc ?? fallbackCoverSrc}
        />
      )}
    </div>
  );
}

export default AlbumContainer;
