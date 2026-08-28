import { ChangeEvent, useRef } from "react";

interface CoverPickerProps {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  previewUrl: string | null;
}

function CoverPicker({ onChange, onClear, previewUrl }: CoverPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleRemove = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onClear();
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
        htmlFor="cover-input"
        style={{ fontSize: "1.1rem", fontWeight: "bold" }}
      >
        Cover
      </label>
      <input
        ref={inputRef}
        id="cover-input"
        type="file"
        accept="image/*"
        onChange={onChange}
      />
      {previewUrl && (
        <>
          <img
            src={previewUrl}
            alt="Selected cover preview"
            style={{
              maxWidth: "100%",
              height: "auto",
              maxHeight: "80vh",
              objectFit: "contain",
              borderRadius: "4px",
              border: "1px solid #9ca3af",
              padding: "3rem",
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            style={{ alignSelf: "flex-start" }}
          >
            Remove
          </button>
        </>
      )}
    </div>
  );
}

export default CoverPicker;
