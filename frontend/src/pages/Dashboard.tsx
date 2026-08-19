import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PulseStrip } from '../components/PulseStrip';
import { LoadingState, ErrorState } from '../components/StatusMessage';

interface Incident {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  creator: {
    email: string;
  };
}

const COLUMNS = [
  {
    key: 'OPEN',
    label: 'Open',
    dot: 'bg-signal-critical',
  },
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    dot: 'bg-signal-progress',
  },
  {
    key: 'RESOLVED',
    label: 'Resolved',
    dot: 'bg-signal-resolved',
  },
  {
    key: 'CLOSED',
    label: 'Closed',
    dot: 'bg-steel',
  },
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  const {
    data: incidents,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const response = await api.get<Incident[]>('/incidents');
      return response.data;
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading incidents..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load incidents." />;
  }

  const openCount =
    incidents?.filter((incident) => incident.status === 'OPEN').length ?? 0;

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="font-display font-semibold text-xl tracking-tight">
            DevPulse
          </h1>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-white/60">
              {user?.email} · {user?.role}
            </span>

            <button
              onClick={logout}
              className="text-xs text-white/70 hover:text-white transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <PulseStrip openCount={openCount} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-semibold text-lg text-ink">
            Incident Board
          </h2>

          {user?.role !== 'VIEWER' && (
            <Link
              to="/incidents/new"
              className="bg-ink text-white text-sm font-medium px-4 py-2 rounded hover:bg-ink/90 transition"
            >
              + New Incident
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((column) => {
            const items =
              incidents?.filter(
                (incident) => incident.status === column.key
              ) ?? [];

            return (
              <div key={column.key} className="flex flex-col">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span
                    className={`w-2 h-2 rounded-full ${column.dot}`}
                  />

                  <span className="text-xs font-semibold uppercase tracking-wide text-steel">
                    {column.label}
                  </span>

                  <span className="font-mono text-xs text-steel">
                    ({items.length})
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {items.map((incident) => (
                    <Link
                      key={incident.id}
                      to={`/incidents/${incident.id}`}
                      className="bg-paper-raised rounded-md p-3 shadow-sm hover:shadow-md transition border border-black/5"
                    >
                      <h3 className="text-sm font-medium text-ink leading-snug">
                        {incident.title}
                      </h3>

                      <p className="font-mono text-[10px] text-steel mt-2">
                        {incident.creator.email} ·{' '}
                        {new Date(
                          incident.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}

                  {items.length === 0 && (
                    <p className="text-xs text-steel/60 italic px-1">
                      Nothing here
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}