import "./ErrorMessage.scss";

type ErrorMessageProps = {
  message: string;
};

function ErrorMessage({ message }: ErrorMessageProps) {
  return <div className="error-message">{message}</div>;
}

export default ErrorMessage;

