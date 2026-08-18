import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

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

  // Initial incident load
  useEffect(() => {
    loadIncident();
  }, [id]);

  // Socket.io real-time connection
  useEffect(() => {
    if (!id) return;

    const socket = getSocket();

    // Join the room for this specific incident
    socket.emit('join_incident', id);

    // Someone changed the incident status
    const handleIncidentUpdated = () => {
      loadIncident();
    };

    // Someone added a comment
    const handleCommentAdded = () => {
      loadIncident();
    };

    socket.on('incident:updated', handleIncidentUpdated);
    socket.on('comment:added', handleCommentAdded);

    // Cleanup when leaving the page
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
    return <p>Loading incident...</p>;
  }

  if (error && !incident) {
    return (
      <div>
        <p>{error}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    );
  }

  if (!incident) {
    return <p>Incident not found.</p>;
  }

  return (
    <div>
      <h1>Incident Details</h1>

      <Link to="/dashboard">← Back to dashboard</Link>

      <hr />

      <h2>{incident.title}</h2>

      <p>{incident.description}</p>

      <p>
        <strong>Status:</strong> {incident.status}
      </p>

      <p>
        <strong>Created by:</strong> {incident.creator.email}
      </p>

      <p>
        <strong>Created:</strong>{' '}
        {new Date(incident.createdAt).toLocaleString()}
      </p>

      <hr />

      {user?.role !== 'VIEWER' && (
        <div>
          <h3>Update Status</h3>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <button
            onClick={updateStatus}
            disabled={actionLoading}
          >
            Update Status
          </button>
        </div>
      )}

      <hr />

      <h3>Comments</h3>

      {incident.comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        incident.comments.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              marginBottom: '10px',
            }}
          >
            <p>{item.content}</p>

            <small>
              {item.user.email} —{' '}
              {new Date(item.createdAt).toLocaleString()}
            </small>
          </div>
        ))
      )}

      {user?.role !== 'VIEWER' && (
        <div>
          <h3>Add Comment</h3>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder="Write a comment..."
          />

          <br />

          <button
            onClick={addComment}
            disabled={actionLoading || !comment.trim()}
          >
            Add Comment
          </button>
        </div>
      )}

      {error && <p>{error}</p>}

      <hr />

      <h3>Audit Log</h3>

      {incident.auditLogs.length === 0 ? (
        <p>No audit logs.</p>
      ) : (
        incident.auditLogs.map((log) => (
          <div key={log.id}>
            <p>
              <strong>{log.action}</strong>
              {' — '}
              {log.user.email}
              {' — '}
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}