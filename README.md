# MusicBox

MusicBox is my personal, self-hosted alternative to Spotify. My music lives as MP3s in a private AWS S3 bucket, and I can browse and stream it from a simple web app instead of digging through folders. It's basically a small AWS Lambda function guarding the bucket and a React app for actually listening.

The repo has three parts that work together:

1. **`manifest-generator`** – a local tool I run once per album to package it up.
2. **`backend`** – the Lambda function that sits between the app and the S3 bucket.
3. **`frontend`** – the actual music player used day to day.

## How it all connects

To add an album, I run it through `manifest-generator`, which reads the MP3 tags and lets me fix up the artist/title/track order and pick a cover image. It spits out a `manifest.json` describing the album. I then upload that `manifest.json`, the cover, and the MP3s together into a folder in the S3 bucket.

The `frontend` is what I actually open in the browser. It asks you for a passcode, then talks to the `backend` to get the list of album folders, load each album's `manifest.json`, and get temporary links to the cover art and audio files. The bucket is private, so the frontend never touches S3 directly.

The `backend` is a single AWS Lambda function (exposed via a Function URL) that checks the passcode and, if it's correct, either lists the folders in the bucket or generates a short-lived presigned URL for a specific file. This keeps the bucket locked down while still letting the frontend fetch what it needs.

**Typical flow:** generate a manifest for an album → upload the folder to S3 → open the frontend → enter the passcode → browse and play.

## Setup

### `manifest-generator`

A Vite + React app you run whenever you want to prep a new album.

```bash
cd manifest-generator
npm install
npm run dev
```

Open the printed local URL, select the MP3 files for an album, fill in/adjust the metadata and cover art, then click **Generate** to download the album's `manifest.json`. Put that file alongside the MP3s and cover image in a folder, then upload the whole folder to the S3 bucket the backend is configured to use.

### `backend`

A set of plain Node.js (ESM) files meant to be deployed as a single AWS Lambda function.

1. Create an S3 bucket (private) to hold your album folders.
2. Create a Lambda function (Node.js 18+ runtime) with `index.mjs`'s `handler` as the entry point, and give it permission to read `s3:ListBucket`/`s3:GetObject` on your bucket.
3. Bundle the backend files together with their dependencies (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) - e.g. zip up the folder after running `npm install` - and upload that as the function code.
4. Enable a **Function URL** for the Lambda so it can be called directly over HTTPS.
5. Set these environment variables on the function:
   - `BUCKET` – the name of your S3 bucket
   - `CODE` – the passcode users must enter to unlock the app
6. Note the Function URL - you'll need it for the frontend.

### `frontend`

The Vite + React player.

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env.local` and set `VITE_API_URL` to your backend's Function URL, then run it locally:

```bash
npm run dev
```

or build it for deployment (e.g. to S3 + CloudFront, or any static host). For a production build, set `VITE_API_URL` in the environment you build with (or a `.env.production` file that is not committed):

```bash
npm run build
```

Once it's running, enter the passcode you set as `CODE` on the backend to unlock the app.
