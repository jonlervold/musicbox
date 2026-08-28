import "./Loading.scss";

type LoadingProps = {
  label?: string;
};

function Loading({ label }: LoadingProps) {
  return (
    <div className="loading">
      <span
        className="loading__icon"
        role="img"
        aria-label="Loading"
        aria-live="polite"
      >
        {"\u{1F643}"}
      </span>
      {label && <span className="loading__label">{label}</span>}
    </div>
  );
}

export default Loading;

