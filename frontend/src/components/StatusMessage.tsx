type LoadingStateProps = {
  message?: string;
};

type ErrorStateProps = {
  message?: string;
};

export function LoadingState({
  message = 'Loading...',
}: LoadingStateProps) {
  return (
    <div
      style={{
        padding: '40px',
        textAlign: 'center',
        color: '#666',
      }}
    >
      {message}
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong.',
}: ErrorStateProps) {
  return (
    <div
      style={{
        padding: '40px',
        textAlign: 'center',
        color: 'red',
      }}
    >
      {message}
    </div>
  );
}