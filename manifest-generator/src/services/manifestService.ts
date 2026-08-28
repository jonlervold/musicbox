import { MP3Metadata } from "../types/mp3Metadata"

export interface Manifest {
  cover: string | null
  title: string
  artist: string
  isCompilation: boolean
  tracks: MP3Metadata[]
}

interface GenerateManifestOptions {
  coverPath: string | null
  title: string
  albumArtist: string
  isCompilation: boolean
  tracks: MP3Metadata[]
}

function buildManifest({
  coverPath,
  title,
  albumArtist,
  isCompilation,
  tracks,
}: GenerateManifestOptions): Manifest {
  const manifestArtist = isCompilation ? "Compilation" : albumArtist

  const normalizedTracks = tracks.map((track) => ({
    ...track,
    artist: isCompilation ? track.artist : albumArtist || null,
  }))

  return {
    cover: coverPath,
    title,
    artist: manifestArtist,
    isCompilation,
    tracks: normalizedTracks,
  }
}

function downloadManifest(manifest: Manifest, filename = "manifest.json") {
  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(url)
}

export function generateManifestFile(options: GenerateManifestOptions) {
  const manifest = buildManifest(options)
  downloadManifest(manifest)
}


