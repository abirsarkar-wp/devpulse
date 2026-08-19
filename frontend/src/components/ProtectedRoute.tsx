import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './StatusMessage';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Restoring secure session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
