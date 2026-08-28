import { ChangeEvent } from "react"

interface AlbumControlsProps {
  isCompilation: boolean
  albumArtist: string
  albumTitle: string
  onCompilationChange: (checked: boolean) => void
  onArtistChange: (value: string) => void
  onTitleChange: (value: string) => void
}

function AlbumControls({
  isCompilation,
  albumArtist,
  albumTitle,
  onCompilationChange,
  onArtistChange,
  onTitleChange,
}: AlbumControlsProps) {
  const handleCompilationToggle = (event: ChangeEvent<HTMLInputElement>) => {
    onCompilationChange(event.target.checked)
  }

  const handleArtistChange = (event: ChangeEvent<HTMLInputElement>) => {
    onArtistChange(event.target.value)
  }

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTitleChange(event.target.value)
  }

  return (
    <div
      style={{
        margin: "1rem 0",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <label
        htmlFor="compilation-toggle"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <input
        id="compilation-toggle"
        type="checkbox"
        checked={isCompilation}
        onChange={handleCompilationToggle}
      />
        Compilation
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          columnGap: "0.5rem",
          rowGap: "0.5rem",
          alignItems: "center",
        }}
      >
        {!isCompilation && (
          <>
            <label htmlFor="album-artist-input">Artist</label>
            <input
              id="album-artist-input"
              type="text"
              value={albumArtist}
              onChange={handleArtistChange}
              style={{ width: "100%" }}
            />
          </>
        )}
        <label htmlFor="album-title-input">Title</label>
        <input
          id="album-title-input"
          type="text"
          value={albumTitle}
          onChange={handleTitleChange}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  )
}

export default AlbumControls

