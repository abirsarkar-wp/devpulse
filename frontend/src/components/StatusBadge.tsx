const styles: Record<string, string> = {
  OPEN: 'border-signal-critical/25 bg-signal-critical/10 text-signal-critical',
  IN_PROGRESS: 'border-signal-progress/25 bg-signal-progress/10 text-signal-progress',
  RESOLVED: 'border-signal-resolved/25 bg-signal-resolved/10 text-signal-resolved',
  CLOSED: 'border-steel/20 bg-steel/10 text-steel',
};
export function StatusBadge({ status }: { status: string }) { const color = styles[status] ?? styles.CLOSED; return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide ${color}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status.replace('_', ' ')}</span>; }
