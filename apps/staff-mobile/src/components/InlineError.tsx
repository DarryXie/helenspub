export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="inline-error" role="alert">
      <span>{message}</span>
      {onRetry ? (
        <button onClick={onRetry} type="button">
          重试
        </button>
      ) : null}
    </div>
  );
}
