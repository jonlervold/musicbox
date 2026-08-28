import jsmediatags, {
  TagType,
  Error as JsMediaTagsError,
} from 'jsmediatags/dist/jsmediatags.min.js'
import { MP3Metadata } from '../types/mp3Metadata'

export async function analyzeMP3Files(files: File[]): Promise<MP3Metadata[]> {
  const results: MP3Metadata[] = []

  for (const file of files) {
    try {
      const metadata = await readMP3Metadata(file)
      results.push({
        path: file.name,
        artist: metadata.artist || null,
        album: metadata.album || null,
        title: metadata.title || null,
      })
    } catch (error) {
      // If metadata reading fails, still include the file with null values
      results.push({
        path: file.name,
        artist: null,
        album: null,
        title: null,
      })
    }
  }

  console.log(results)

  return results
}

function readMP3Metadata(file: File): Promise<{
  artist: string | undefined
  album: string | undefined
  title: string | undefined
}> {
  return new Promise((resolve, reject) => {
    jsmediatags.read(file, {
      onSuccess: (tag: TagType) => {
        const tags = tag.tags
        resolve({
          artist: tags.artist,
          album: tags.album,
          title: tags.title,
        })
      },
      onError: (error: JsMediaTagsError) => {
        reject(error)
      },
    })
  })
}

