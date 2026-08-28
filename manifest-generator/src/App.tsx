import {
  ChangeEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import AlbumControls from "./components/AlbumControls";
import CoverPicker from "./components/CoverPicker";
import MP3Select from "./components/MP3Select";
import MP3MetadataEditor from "./components/MP3MetadataEditor";
import { analyzeMP3Files } from "./services/mp3AnalysisService";
import { generateManifestFile } from "./services/manifestService";
import { MP3Metadata } from "./types/mp3Metadata";

function App() {
  const [metadata, setMetadata] = useState<MP3Metadata[]>([]);
  const [isCompilation, setIsCompilation] = useState(false);
  const [albumArtist, setAlbumArtist] = useState("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement | null>());
  const positionsRef = useRef(new Map<string, DOMRect>());

  const handleFilesSelected = async (files: File[]) => {
    const analyzedMetadata = await analyzeMP3Files(files);
    if (analyzedMetadata.length === 0) {
      setMetadata([]);
      setAlbumArtist("");
      setAlbumTitle("");
      return;
    }

    const firstArtist = analyzedMetadata[0].artist ?? "";
    const firstAlbumTitle = analyzedMetadata[0].album ?? "";
    setAlbumArtist(firstArtist);
    setAlbumTitle(firstAlbumTitle);

    setMetadata(analyzedMetadata);
  };
  const clearCoverPreview = () => {
    setCoverPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setCoverFileName(null);
  };

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    setCoverPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return file ? URL.createObjectURL(file) : null;
    });

    setCoverFileName(file ? file.name : null);
  };

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const handleGenerateManifest = () => {
    if (metadata.length === 0) return;

    generateManifestFile({
      coverPath: coverFileName,
      title: albumTitle,
      albumArtist,
      isCompilation,
      tracks: metadata,
    });
  };

  const handleMetadataChange = (index: number, updated: MP3Metadata) => {
    setMetadata((prev) =>
      prev.map((item, i) => (i === index ? updated : item))
    );
  };

  const moveMetadata = (from: number, to: number) => {
    setMetadata((prev) => {
      if (to < 0 || to >= prev.length) {
        return prev;
      }

      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const assignItemRef = useCallback(
    (path: string, node: HTMLDivElement | null) => {
      if (node) {
        itemRefs.current.set(path, node);
      } else {
        itemRefs.current.delete(path);
      }
    },
    []
  );

  useLayoutEffect(() => {
    const newPositions = new Map<string, DOMRect>();
    metadata.forEach((item) => {
      const node = itemRefs.current.get(item.path);
      if (node) {
        newPositions.set(item.path, node.getBoundingClientRect());
      }
    });

    newPositions.forEach((rect, path) => {
      const prevRect = positionsRef.current.get(path);
      const node = itemRefs.current.get(path);
      if (!node || !prevRect) return;

      const deltaY = prevRect.top - rect.top;
      if (deltaY !== 0) {
        node.style.transition = "transform 0s";
        node.style.transform = `translateY(${deltaY}px)`;
        requestAnimationFrame(() => {
          node.style.transition = "transform 250ms ease";
          node.style.transform = "";
        });
      }
    });

    positionsRef.current = newPositions;
  }, [metadata]);

  return (
    <div>
      <h1>MusicBox Manifest Generator</h1>
      <CoverPicker
        onChange={handleCoverChange}
        onClear={clearCoverPreview}
        previewUrl={coverPreview}
      />

      <MP3Select onFilesSelected={handleFilesSelected} />

      {metadata.length > 0 && (
        <AlbumControls
          isCompilation={isCompilation}
          albumArtist={albumArtist}
          albumTitle={albumTitle}
          onCompilationChange={(checked) => {
            setIsCompilation(checked);
            if (!checked) {
              const derivedArtist = metadata[0]?.artist ?? albumArtist ?? "";
              setAlbumArtist(derivedArtist ?? "");
            }
          }}
          onArtistChange={(value) => setAlbumArtist(value)}
          onTitleChange={(value) => setAlbumTitle(value)}
        />
      )}

      {metadata.map((item, index) => (
        <MP3MetadataEditor
          key={item.path}
          ref={(node) => assignItemRef(item.path, node)}
          position={index + 1}
          metadata={item}
          onChange={(updated) => handleMetadataChange(index, updated)}
          onMoveUp={() => moveMetadata(index, index - 1)}
          onMoveDown={() => moveMetadata(index, index + 1)}
          disableMoveUp={index === 0}
          disableMoveDown={index === metadata.length - 1}
          showArtistField={isCompilation}
        />
      ))}
      {metadata.length > 0 && (
        <div style={{ margin: "1rem 0" }}>
          <button type="button" onClick={handleGenerateManifest}>
            Generate
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
