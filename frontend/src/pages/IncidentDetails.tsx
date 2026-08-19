import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';
import { LoadingState, ErrorState } from '../components/StatusMessage';
import { StatusBadge } from '../components/StatusBadge';
import { CollabNotes } from '../components/CollabNotes';

type User = { id: string; email: string; role: string };
type Comment = { id: string; content: string; createdAt: string; user: User };
type AuditLog = { id: string; action: string; createdAt: string; user: User };
type Incident = { id: string; title: string; description: string; status: string; createdAt: string; updatedAt: string; creator: User; comments: Comment[]; auditLogs: AuditLog[] };

export default function IncidentDetails() {
  const { id } = useParams(); const { user } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [status, setStatus] = useState(''); const [comment, setComment] = useState(''); const [actionLoading, setActionLoading] = useState(false);
  async function loadIncident() {
    if (!id) return;
    try { setLoading(true); setError(''); const response = await api.get(`/incidents/${id}`); setIncident(response.data); setStatus(response.data.status); }
    catch (err: any) { setError(err.response?.data?.error || 'Failed to load incident'); } finally { setLoading(false); }
  }
  useEffect(() => { loadIncident(); }, [id]);
  useEffect(() => {
    if (!id) return; const socket = getSocket(); socket.emit('join_incident', id);
    const refresh = () => { loadIncident(); };
    socket.on('incident:updated', refresh); socket.on('comment:added', refresh);
    return () => { socket.emit('leave_incident', id); socket.off('incident:updated', refresh); socket.off('comment:added', refresh); };
  }, [id]);
  async function updateStatus() {
    if (!id || !status) return;
    try { setActionLoading(true); setError(''); await api.patch(`/incidents/${id}/status`, { status }); await loadIncident(); }
    catch (err: any) { setError(err.response?.data?.error || 'Failed to update status'); } finally { setActionLoading(false); }
  }
  async function addComment() {
    if (!id || !comment.trim()) return;
    try { setActionLoading(true); setError(''); await api.post(`/incidents/${id}/comments`, { content: comment }); setComment(''); await loadIncident(); }
    catch (err: any) { setError(err.response?.data?.error || 'Failed to add comment'); } finally { setActionLoading(false); }
  }
  if (loading) return <LoadingState message="Loading incident..." />;
  if (error && !incident) return <ErrorState message={error} />;
  if (!incident) return <ErrorState message="Incident not found." />;
  const eventColor = incident.status === 'OPEN' ? 'bg-signal-critical' : incident.status === 'IN_PROGRESS' ? 'bg-signal-progress' : incident.status === 'RESOLVED' ? 'bg-signal-resolved' : 'bg-steel';
  return <AppShell><main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:py-10">
    <Link to="/dashboard" className="font-mono text-[10px] uppercase tracking-[.18em] text-steel transition hover:text-ink">← Incident board</Link>
    <section className="panel-depth mt-5 rounded-2xl border border-black/5 bg-paper-raised p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-steel">Incident <span className="ml-2 text-ink">#{incident.id.slice(-8)}</span></p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{incident.title}</h1></div><StatusBadge status={incident.status} /></div>
      <div className="mt-6 border-y border-black/5 py-5"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-steel">Situation report</p><p className="mt-2 max-w-3xl text-sm leading-7 text-ink/75">{incident.description}</p></div>
      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"><div><dt className="font-mono text-[10px] uppercase tracking-wider text-steel">Created by</dt><dd className="mt-1 truncate font-mono text-xs text-ink">{incident.creator.email}</dd></div><div><dt className="font-mono text-[10px] uppercase tracking-wider text-steel">Created</dt><dd className="mt-1 font-mono text-xs text-ink">{new Date(incident.createdAt).toLocaleString()}</dd></div><div><dt className="font-mono text-[10px] uppercase tracking-wider text-steel">Last updated</dt><dd className="mt-1 font-mono text-xs text-ink">{new Date(incident.updatedAt).toLocaleString()}</dd></div></dl>
    </section>
    <CollabNotes incidentId={incident.id} />
    {user?.role !== 'VIEWER' && <section className="panel-depth mt-5 rounded-xl border border-black/5 bg-paper-raised p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-base font-semibold text-ink">Status transition</h2><p className="mt-1 text-xs text-steel">Publish the current operational state to the board.</p></div><div className="flex gap-2"><select aria-label="Incident status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-black/10 bg-paper px-3 py-2 text-sm text-ink outline-none focus:ring-4 focus:ring-ink/8"><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select><button onClick={updateStatus} disabled={actionLoading} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-ink/90 disabled:opacity-50">{actionLoading ? 'Updating...' : 'Update'}</button></div></div></section>}
    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-steel">Incident record</p><h2 className="mt-1 font-display text-xl font-semibold text-ink">Activity timeline</h2></div><span className="font-mono text-[10px] text-steel">{incident.auditLogs.length} EVENTS</span></div><div className="relative ml-3 border-l border-black/10 pl-7">{incident.auditLogs.length === 0 ? <div className="rounded-xl border border-dashed border-black/10 p-5 text-sm text-steel">No activity recorded yet.</div> : <div className="space-y-4">{incident.auditLogs.map((log) => <article key={log.id} className="hover-card relative rounded-xl border border-black/5 bg-paper-raised p-4 panel-depth"><span className={`absolute -left-[35px] top-5 h-3.5 w-3.5 rounded-full border-[3px] border-paper ${eventColor}`} /><div className="flex flex-col gap-2 sm:flex-row sm:justify-between"><p className="font-mono text-xs font-semibold text-ink">{log.action}</p><time className="font-mono text-[10px] text-steel">{new Date(log.createdAt).toLocaleString()}</time></div><p className="mt-2 text-xs text-steel">System event · <span className="font-mono text-ink">{log.user.email}</span></p></article>)}</div>}</div></section>
    <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-steel">Team channel</p><h2 className="mt-1 font-display text-xl font-semibold text-ink">Comments</h2></div><span className="font-mono text-[10px] text-steel">{incident.comments.length} NOTES</span></div><div className="space-y-3">{incident.comments.length === 0 ? <div className="rounded-xl border border-dashed border-black/10 bg-white/40 p-5 text-sm text-steel">No comments yet.</div> : incident.comments.map((item) => <article key={item.id} className="hover-card rounded-xl border border-black/5 bg-paper-raised p-4 panel-depth"><p className="text-sm leading-relaxed text-ink">{item.content}</p><p className="mt-3 font-mono text-[10px] text-steel">{item.user.email} · {new Date(item.createdAt).toLocaleString()}</p></article>)}</div>
      {user?.role !== 'VIEWER' && <div className="panel-depth mt-5 rounded-xl border border-black/5 bg-paper-raised p-5"><label htmlFor="comment" className="font-display text-sm font-semibold text-ink">Add update</label><textarea id="comment" value={comment} onChange={(event) => setComment(event.target.value)} rows={4} placeholder="Describe what happened or what was done..." className="mt-3 w-full resize-y rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-sm leading-relaxed outline-none transition focus:border-ink/30 focus:ring-4 focus:ring-ink/8" /><div className="mt-3 flex justify-end"><button onClick={addComment} disabled={actionLoading || !comment.trim()} className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-ink/90 disabled:opacity-50">{actionLoading ? 'Adding...' : 'Add comment'}</button></div></div>}
    </section>{error && <p className="mt-6 rounded-lg bg-signal-critical/10 px-3 py-2 text-sm text-signal-critical">{error}</p>}
  </main></AppShell>;
}
