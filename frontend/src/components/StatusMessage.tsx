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
    <div className="grid min-h-screen place-items-center bg-paper p-8"><div className="rounded-xl border border-black/5 bg-paper-raised px-6 py-5 text-center panel-depth"><span className="pulse-glow mx-auto mb-3 block h-2 w-2 rounded-full bg-signal-progress" /><p className="font-mono text-xs text-steel">{message}</p></div></div>
  );
}

export function ErrorState({
  message = 'Something went wrong.',
}: ErrorStateProps) {
  return (
    <div className="grid min-h-screen place-items-center bg-paper p-8"><div className="max-w-sm rounded-xl border border-signal-critical/20 bg-paper-raised px-6 py-5 text-center panel-depth"><p className="font-display text-lg font-semibold text-signal-critical">Unable to continue</p><p className="mt-2 text-sm text-steel">{message}</p></div></div>
  );
}
