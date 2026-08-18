import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function NewIncident() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // VIEWER users are not allowed to create incidents
  if (user?.role === 'VIEWER') {
    return <Navigate to="/dashboard" replace />;
  }

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/incidents', {
        title,
        description,
      });

      navigate(`/incidents/${response.data.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Failed to create incident'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Create New Incident</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <br />

          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Description</label>
          <br />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={6}
          />
        </div>

        <br />

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Incident'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          disabled={loading}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}