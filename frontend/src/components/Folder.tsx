import { useEffect, useState } from "react";
import AlbumContainer from "./AlbumContainer";
import { HttpSvc } from "../services/HttpSvc";
import { useAppStore } from "../store/useAppStore";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import type { Manifest } from "../types/manifest";

function Folder() {
  const folder = useAppStore((state) => state.folder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    setManifest(null);

    if (!folder) {
      return;
    }

    async function fetchManifest() {
      setLoading(true);
      setError(null);

      try {
        const manifestResponse = await HttpSvc.getManifest(folder);
        console.log("Manifest:", manifestResponse);
        setManifest(manifestResponse);
      } catch (error) {
        setError("Unable to load manifest");
        console.error("Unable to load manifest", error);
      } finally {
        setLoading(false);
      }
    }

    fetchManifest();
  }, [folder]);

  if (loading) {
    return <Loading label="Loading manifest..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!manifest) {
    return <div>No manifest data</div>;
  }

  return <AlbumContainer manifest={manifest} />;
}

export default Folder;
