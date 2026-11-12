type Props = {
  message: string;
  onRetry: () => void;
};

export default function ErrorMessage({ message, onRetry }: Props) {
  function handleRetry() {
    onRetry();
  }

  return (
    <div className="error" role="alert">
      <p>{message}</p>
      <button type="button" onClick={handleRetry}>
        Tentar de novo
      </button>
    </div>
  );
}
