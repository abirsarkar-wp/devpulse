import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';
import { PulseStrip } from '../components/PulseStrip';
import { LoadingState, ErrorState } from '../components/StatusMessage';
import { StatusBadge } from '../components/StatusBadge';

interface Incident { id: string; title: string; status: string; createdAt: string; creator: { email: string }; }
const columns = [{ key: 'OPEN', label: 'Open', accent: 'bg-signal-critical' }, { key: 'IN_PROGRESS', label: 'In progress', accent: 'bg-signal-progress' }, { key: 'RESOLVED', label: 'Resolved', accent: 'bg-signal-resolved' }, { key: 'CLOSED', label: 'Closed', accent: 'bg-steel' }];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: incidents, isLoading, error } = useQuery({ queryKey: ['incidents'], queryFn: async () => (await api.get<Incident[]>('/incidents')).data });
  if (isLoading) return <LoadingState message="Loading the incident board..." />;
  if (error) return <ErrorState message="Failed to load incidents." />;
  const all = incidents ?? [];
  const count = (status: string) => all.filter((item) => item.status === status).length;
  const openCount = count('OPEN'); const activeCount = openCount + count('IN_PROGRESS');
  return <AppShell><PulseStrip openCount={openCount} />
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-10">
      <section className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-steel">Operations overview</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Incident command</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-steel">A live view of every incident moving through the response workflow.</p></div>{user?.role !== 'VIEWER' && <Link to="/incidents/new" className="inline-flex items-center justify-center rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-ink/15 transition hover:-translate-y-0.5 hover:bg-ink/90 active:translate-y-0">Create incident <span className="ml-2 font-mono">+</span></Link>}</section>
      <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Open incidents', openCount, 'text-signal-critical'], ['Active response', activeCount, 'text-signal-progress'], ['Resolved', count('RESOLVED'), 'text-signal-resolved'], ['System state', openCount ? 'Attention' : 'Clear', openCount ? 'text-signal-critical' : 'text-signal-resolved']].map(([label, value, color]) => <div key={String(label)} className="panel-depth rounded-xl border border-black/5 bg-paper-raised p-4"><p className="font-mono text-[10px] uppercase tracking-widest text-steel">{label}</p><p className={`mt-2 font-display text-2xl font-semibold ${color}`}>{value}</p></div>)}</section>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4" aria-label="Incident board">{columns.map((column) => { const items = all.filter((item) => item.status === column.key); return <div key={column.key} className="min-w-0 rounded-xl border border-black/5 bg-white/35 p-3"><div className="mb-3 flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className={`pulse-glow h-2 w-2 rounded-full ${column.accent}`} /><h2 className="font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-ink">{column.label}</h2></div><span className="font-mono text-xs text-steel">{items.length}</span></div><div className="space-y-3">{items.map((incident) => <Link key={incident.id} to={`/incidents/${incident.id}`} className="hover-card block rounded-lg border border-black/6 bg-paper-raised p-4 panel-depth"><div className="mb-3 flex items-start justify-between gap-2"><StatusBadge status={incident.status} /><span className="font-mono text-[9px] text-steel">#{incident.id.slice(-6)}</span></div><h3 className="text-sm font-semibold leading-snug text-ink">{incident.title}</h3><div className="mt-4 border-t border-black/5 pt-3 font-mono text-[10px] text-steel"><p className="truncate">{incident.creator.email}</p><p className="mt-1">{new Date(incident.createdAt).toLocaleDateString()}</p></div></Link>)}{items.length === 0 && <div className="rounded-lg border border-dashed border-black/10 px-4 py-7 text-center"><p className="font-mono text-[10px] uppercase tracking-wider text-steel/70">No incidents</p></div>}</div></div>; })}</section>
    </main></AppShell>;
}
