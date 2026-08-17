import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Incident = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  creator: {
    id: string;
    email: string;
    role: string;
  };
};

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadIncidents() {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/incidents', {
          params: status ? { status } : undefined,
        });

        setIncidents(response.data);
      } catch (err: any) {
        setError(
          err.response?.data?.error || 'Failed to load incidents'
        );
      } finally {
        setLoading(false);
      }
    }

    loadIncidents();
  }, [status]);

  return (
    <div>
      <header>
        <h1>DevPulse</h1>

        <p>
          Logged in as: <strong>{user?.email}</strong>
        </p>

        <p>
          Role: <strong>{user?.role}</strong>
        </p>

        <button onClick={logout}>Logout</button>
      </header>

      <hr />

      <div>
        <h2>Incidents</h2>

        {user?.role !== 'VIEWER' && (
          <Link to="/incidents/new">
            <button>+ New Incident</button>
          </Link>
        )}
      </div>

      <br />

      <div>
        <label>Filter by status: </label>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <br />

      {loading && <p>Loading incidents...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && incidents.length === 0 && (
        <p>No incidents found.</p>
      )}

      {!loading && !error && incidents.length > 0 && (
        <div>
          {incidents.map((incident) => (
            <div
              key={incident.id}
              style={{
                border: '1px solid #ccc',
                padding: '16px',
                marginBottom: '12px',
              }}
            >
              <h3>{incident.title}</h3>

              <p>{incident.description}</p>

              <p>
                Status: <strong>{incident.status}</strong>
              </p>

              <p>
                Created by: {incident.creator.email}
              </p>

              <p>
                Created: {new Date(incident.createdAt).toLocaleString()}
              </p>

              <Link to={`/incidents/${incident.id}`}>
                View incident
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}