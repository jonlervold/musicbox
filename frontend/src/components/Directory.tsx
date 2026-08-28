import { useEffect, useState } from "react";
import { HttpSvc } from "../services/HttpSvc";
import { formatFolderName } from "../utils/formatFolderName";
import ErrorMessage from "./ErrorMessage";
import Loading from "./Loading";
import "./Directory.scss";

function normalize(value: string) {
  return value.replace(/\./g, " ").replace(/-/g, " ").toLowerCase();
}

function splitFolderName(value: string) {
  const [left, ...rest] = value.split("-");
  return {
    left: left?.trim() ?? "",
    right: rest.join("-").trim(),
  };
}

function Directory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  let lastArtistKey: string | null = null;

  useEffect(() => {
    async function fetchFolders() {
      setLoading(true);
      setError(null);

      try {
        const foldersResponse = await HttpSvc.listFolders();
        console.log("Folders response:", foldersResponse.folders);
        setFolders(foldersResponse.folders);
      } catch (err) {
        setError("Unable to load folders");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchFolders();
  }, []);

  if (loading) {
    return <Loading label="Loading folders..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const filteredFolders = folders.filter((folder) =>
    normalize(folder).includes(normalize(query))
  );

  const handleRandomClick = () => {
    if (!filteredFolders.length) {
      return;
    }
    const randomFolder =
      filteredFolders[Math.floor(Math.random() * filteredFolders.length)];
    const folderParam = encodeURIComponent(randomFolder);
    window.location.href = `/mb?folder=${folderParam}`;
  };

  return (
    <div className="directory__container">
      <div className="directory__search-container">
        <input
          type="text"
          placeholder="Search folders..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <button type="button" onClick={() => setQuery("")}>
          Clear
        </button>
        <button
          type="button"
          onClick={handleRandomClick}
          disabled={filteredFolders.length === 0}
        >
          Random
        </button>
      </div>

      {filteredFolders.length === 0 ? (
        <div>No matches.</div>
      ) : (
        <table className="directory__table">
          <tbody>
            {filteredFolders.map((folder) => {
              const folderParam = encodeURIComponent(folder);
              const { left, right } = splitFolderName(folder);
              const artistRaw = left || folder;
              const artistKey = normalize(artistRaw);
              const isNewArtist = artistKey !== lastArtistKey;
              const hasPreviousArtist = lastArtistKey !== null;
              const rowClassName = [
                "directory__table-row",
                isNewArtist && hasPreviousArtist
                  ? "directory__table-row--separator"
                  : "",
              ]
                .filter(Boolean)
                .join(" ");
              const showArtist = isNewArtist;
              lastArtistKey = artistKey;

              return (
                <tr key={folder} className={rowClassName}>
                  <td>
                    {showArtist ? (
                      <span className="directory__folder-label">
                        {formatFolderName(artistRaw)}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <a
                      className="directory__folder-link"
                      href={`/mb?folder=${folderParam}`}
                    >
                      {right ? formatFolderName(right) : ""}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Directory;
