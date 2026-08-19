import { useCollabNotes } from '../lib/collab';

function initials(email: string) {
  const name = email.split('@')[0] || '?';
  return name.split(/[._-]+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

export function CollabNotes({ incidentId }: { incidentId: string }) {
  const { value, setNotes, participants, status, error } = useCollabNotes(incidentId);
  const isLive = status === 'connected';
  const statusLabel = isLive ? 'Synced' : status === 'reconnecting' ? 'Reconnecting' : status === 'error' ? 'Offline' : 'Connecting';
  return <section className="panel-depth mt-5 rounded-2xl border border-black/5 bg-paper-raised p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-steel">Live collaboration</p><h2 className="mt-1 font-display text-xl font-semibold text-ink">Shared Runbook</h2></div>
      <div className="flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-wider text-steel"><span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${isLive ? 'bg-signal-resolved' : status === 'error' ? 'bg-signal-critical' : 'bg-signal-progress'}`} />{statusLabel}</span><div className="flex -space-x-2">{participants.slice(0, 5).map((participant) => <span key={`${participant.userId}-${participant.email}`} title={participant.email} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-paper-raised bg-ink font-mono text-[10px] font-semibold text-white">{initials(participant.email)}</span>)}</div></div>
    </div>
    <textarea aria-label="Shared runbook" value={value} onChange={(event) => setNotes(event.target.value)} rows={10} placeholder="Capture live investigation notes, decisions, and next steps..." className="mt-5 w-full resize-y rounded-xl border border-black/10 bg-paper px-4 py-3 font-mono text-sm leading-6 text-ink outline-none transition focus:border-ink/30 focus:ring-4 focus:ring-ink/8" />
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-steel"><span>{isLive ? 'Synced live' : statusLabel} · {participants.length} viewing</span>{error && <span className="normal-case tracking-normal text-signal-critical">{error}</span>}</div>
  </section>;
}
