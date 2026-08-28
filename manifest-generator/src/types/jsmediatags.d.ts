interface BaseTagType {
  tags: {
    artist?: string
    album?: string
    title?: string
    track?: string
    [key: string]: any
  }
  [key: string]: any
}

interface BaseError {
  type: string
  info: string
}

interface BaseReadOptions {
  onSuccess: (tag: BaseTagType) => void
  onError: (error: BaseError) => void
}

declare module 'jsmediatags/dist/jsmediatags.min.js' {
  export interface TagType extends BaseTagType {}

  export interface Error extends BaseError {}

  export interface ReadOptions extends BaseReadOptions {}

  export const jsmediatags: {
    read: (file: File | Blob, options: ReadOptions) => void
  }

  export default jsmediatags
}

declare module 'jsmediatags' {
  export * from 'jsmediatags/dist/jsmediatags.min.js'
  import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js'
  export default jsmediatags
}

