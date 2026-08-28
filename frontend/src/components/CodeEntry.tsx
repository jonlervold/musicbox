import { useState } from "react";
import { HttpSvc } from "../services/HttpSvc";
import { LocalStorageSvc } from "../services/LocalStorageSvc";
import { useAppStore } from "../store/useAppStore";
import ErrorMessage from "./ErrorMessage";
import "./CodeEntry.scss";

function CodeEntry() {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setCode = useAppStore((state) => state.setCode);

  async function handleSubmit() {
    if (!value) {
      setError("Code is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await HttpSvc.isCodeValid(value);
      LocalStorageSvc.setCode(value);
      setCode(value);
    } catch {
      setError("That's no good, Al.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="code-entry__title">Enter Code</div>
      <div className="code-entry__body">
        <input
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={submitting}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
      {error && <ErrorMessage message={error} />}
    </div>
  );
}

export default CodeEntry;
