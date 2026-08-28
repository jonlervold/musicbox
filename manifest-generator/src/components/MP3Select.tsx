import { ChangeEvent } from "react";

interface MP3SelectProps {
  onFilesSelected?: (files: File[]) => void;
}

function MP3Select({ onFilesSelected }: MP3SelectProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (onFilesSelected) {
      onFilesSelected(files);
    }
  };

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
        htmlFor="mp3-input"
        style={{ fontSize: "1.1rem", fontWeight: "bold" }}
      >
        MP3s / M4As
      </label>
      <input
        id="mp3-input"
        type="file"
        accept="audio/mpeg,.mp3,audio/mp4,.m4a"
        multiple
        onChange={handleFileChange}
      />
    </div>
  );
}

export default MP3Select;
