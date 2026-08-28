export interface MP3Metadata {
  path: string;
  artist: string | null;
  album: string | null;
  title: string | null;
}

export interface Manifest {
  cover: string | null;
  title: string;
  artist: string;
  isCompilation: boolean;
  tracks: MP3Metadata[];
}

