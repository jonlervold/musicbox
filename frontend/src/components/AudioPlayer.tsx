import type { MutableRefObject } from "react";
import "./AudioPlayer.scss";

type AudioPlayerProps = {
  audioPath: string;
  audioRef?: MutableRefObject<HTMLAudioElement | null> | null;
  onEnded?: () => void;
};

function AudioPlayer({
  audioPath,
  audioRef = null,
  onEnded = () => {},
}: AudioPlayerProps) {
  return (
    <audio
      className="audio-player__player"
      ref={audioRef ?? null}
      onEnded={onEnded}
      preload="auto"
      controls
    >
      <source src={audioPath} type="audio/mpeg" />
    </audio>
  );
}

export default AudioPlayer;

