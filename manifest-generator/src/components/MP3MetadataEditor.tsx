import { ChangeEvent, Fragment, forwardRef } from "react";
import { MP3Metadata } from "../types/mp3Metadata";

type EditableField = "artist" | "title";

interface MP3MetadataEditorProps {
  metadata: MP3Metadata;
  onChange?: (updated: MP3Metadata) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
  showArtistField?: boolean;
  position?: number;
}

const MP3MetadataEditor = forwardRef<HTMLDivElement, MP3MetadataEditorProps>(
  (
    {
      metadata,
      onChange,
      onMoveUp,
      onMoveDown,
      disableMoveUp,
      disableMoveDown,
      showArtistField = true,
      position,
    },
    ref
  ) => {
    const handleEditableChange = (
      field: EditableField,
      event: ChangeEvent<HTMLInputElement>
    ) => {
      if (!onChange) return;

      onChange({
        ...metadata,
        [field]: event.target.value || null,
      });
    };

    return (
      <div
        ref={ref}
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "flex-start",
          border: "1px solid #d0d0d0",
          borderRadius: "4px",
          padding: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            minWidth: "2ch",
            textAlign: "right",
            paddingTop: "0.35rem",
          }}
        >
          {position}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={onMoveUp}
            disabled={disableMoveUp || !onMoveUp}
          >
            Move Up
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={disableMoveDown || !onMoveDown}
          >
            Move Down
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <span>{metadata.path}</span>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              columnGap: "0.5rem",
              rowGap: "0.5rem",
              alignItems: "center",
            }}
          >
            {(showArtistField
              ? (["artist", "title"] as const)
              : (["title"] as const)
            ).map((field) => (
              <Fragment key={field}>
                <label htmlFor={`metadata-${field}-${metadata.path}`}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  id={`metadata-${field}-${metadata.path}`}
                  type="text"
                  value={metadata[field] ?? ""}
                  onChange={(event) => handleEditableChange(field, event)}
                  style={{ width: "100%" }}
                />
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

export default MP3MetadataEditor;
