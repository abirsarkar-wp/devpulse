import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { LoadingState, ErrorState } from '../components/StatusMessage';

type User = {
  id: string;
  email: string;
  role: string;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: User;
};

type AuditLog = {
  id: string;
  action: string;
  createdAt: string;
  user: User;
};

type Incident = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  creator: User;
  comments: Comment[];
  auditLogs: AuditLog[];
};

function getStatusClasses(status: string) {
  switch (status) {
    case 'OPEN':
      return {
        badge: 'bg-signal-critical/10 text-signal-critical border-signal-critical/20',
        dot: 'bg-signal-critical',
      };

    case 'IN_PROGRESS':
      return {
        badge: 'bg-signal-progress/10 text-signal-progress border-signal-progress/20',
        dot: 'bg-signal-progress',
      };

    case 'RESOLVED':
      return {
        badge: 'bg-signal-resolved/10 text-signal-resolved border-signal-resolved/20',
        dot: 'bg-signal-resolved',
      };

    case 'CLOSED':
      return {
        badge: 'bg-steel/10 text-steel border-steel/20',
        dot: 'bg-steel',
      };

    default:
      return {
        badge: 'bg-steel/10 text-steel border-steel/20',
        dot: 'bg-steel',
      };
  }
}

export default function IncidentDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function loadIncident() {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/incidents/${id}`);

      setIncident(response.data);
      setStatus(response.data.status);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Failed to load incident'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncident();
  }, [id]);

  // Real-time Socket.io updates
  useEffect(() => {
    if (!id) return;

    const socket = getSocket();

    socket.emit('join_incident', id);

    const handleIncidentUpdated = () => {
      loadIncident();
    };

    const handleCommentAdded = () => {
      loadIncident();
    };

    socket.on('incident:updated', handleIncidentUpdated);
    socket.on('comment:added', handleCommentAdded);

    return () => {
      socket.emit('leave_incident', id);

      socket.off('incident:updated', handleIncidentUpdated);
      socket.off('comment:added', handleCommentAdded);
    };
  }, [id]);

  async function updateStatus() {
    if (!id || !status) return;

    try {
      setActionLoading(true);
      setError('');

      await api.patch(`/incidents/${id}/status`, {
        status,
      });

      await loadIncident();
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Failed to update status'
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function addComment() {
    if (!id || !comment.trim()) return;

    try {
      setActionLoading(true);
      setError('');

      await api.post(`/incidents/${id}/comments`, {
        content: comment,
      });

      setComment('');
      await loadIncident();
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Failed to add comment'
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading incident..." />;
  }

  if (error && !incident) {
    return <ErrorState message={error} />;
  }

  if (!incident) {
    return <ErrorState message="Incident not found." />;
  }

  const statusStyle = getStatusClasses(incident.status);

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="font-display font-semibold text-lg tracking-tight"
          >
            DevPulse
          </Link>

          <div className="font-mono text-xs text-white/60">
            {user?.email} · {user?.role}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Link
          to="/dashboard"
          className="font-mono text-xs text-steel hover:text-ink transition"
        >
          ← Back to dashboard
        </Link>

        <section className="mt-6 bg-paper-raised border border-black/5 rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-steel mb-2">
                Incident
              </p>

              <h1 className="font-display text-2xl font-semibold text-ink">
                {incident.title}
              </h1>

              <p className="mt-3 text-sm text-steel leading-relaxed max-w-3xl">
                {incident.description}
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border text-xs font-medium ${statusStyle.badge}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${statusStyle.dot}`}
              />
              {incident.status.replace('_', ' ')}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-steel">
                Created by
              </p>

              <p className="font-mono text-xs text-ink mt-1">
                {incident.creator.email}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-steel">
                Created
              </p>

              <p className="font-mono text-xs text-ink mt-1">
                {new Date(incident.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-steel">
                Last updated
              </p>

              <p className="font-mono text-xs text-ink mt-1">
                {new Date(incident.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {user?.role !== 'VIEWER' && (
          <section className="mt-6 bg-paper-raised border border-black/5 rounded-lg shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <p className="font-display font-semibold text-sm text-ink">
                  Update status
                </p>

                <p className="text-xs text-steel mt-1">
                  Change the current incident state.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="border border-black/10 rounded px-3 py-2 text-sm bg-paper-raised text-ink"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>

                <button
                  onClick={updateStatus}
                  disabled={actionLoading}
                  className="bg-ink text-white text-sm font-medium px-4 py-2 rounded hover:bg-ink/90 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg text-ink">
              Activity
            </h2>

            <span className="font-mono text-[10px] uppercase tracking-widest text-steel">
              {incident.auditLogs.length} events
            </span>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-black/10" />

            <div className="space-y-5">
              {incident.auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="relative pl-10"
                >
                  <span className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-paper border border-black/10 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-ink" />
                  </span>

                  <div className="bg-paper-raised border border-black/5 rounded-md p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <p className="font-mono text-xs font-medium text-ink">
                        {log.action}
                      </p>

                      <span className="font-mono text-[10px] text-steel">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-steel mt-2">
                      Performed by{' '}
                      <span className="font-mono text-ink">
                        {log.user.email}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-display font-semibold text-lg text-ink mb-4">
            Comments
          </h2>

          <div className="space-y-3">
            {incident.comments.length === 0 ? (
              <div className="bg-paper-raised border border-black/5 rounded-md p-5">
                <p className="text-sm text-steel italic">
                  No comments yet.
                </p>
              </div>
            ) : (
              incident.comments.map((item) => (
                <div
                  key={item.id}
                  className="bg-paper-raised border border-black/5 rounded-md p-4"
                >
                  <p className="text-sm text-ink leading-relaxed">
                    {item.content}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 font-mono text-[10px] text-steel">
                    <span>{item.user.email}</span>
                    <span>·</span>
                    <span>
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {user?.role !== 'VIEWER' && (
            <div className="mt-5 bg-paper-raised border border-black/5 rounded-lg shadow-sm p-5">
              <p className="font-display font-semibold text-sm text-ink mb-2">
                Add comment
              </p>

              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                placeholder="Describe what happened or what was done..."
                className="w-full border border-black/10 rounded-md bg-paper-raised text-ink text-sm px-3 py-3 resize-y focus:outline-none"
              />

              <div className="mt-3 flex justify-end">
                <button
                  onClick={addComment}
                  disabled={actionLoading || !comment.trim()}
                  className="bg-ink text-white text-sm font-medium px-4 py-2 rounded hover:bg-ink/90 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Adding...' : 'Add Comment'}
                </button>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="mt-6 border border-signal-critical/20 bg-signal-critical/5 text-signal-critical rounded-md px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}