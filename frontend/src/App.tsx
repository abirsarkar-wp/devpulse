import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NewIncident from './pages/NewIncident';
import IncidentDetails from './pages/IncidentDetails';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents/new"
            element={
            <ProtectedRoute>
               <NewIncident />
            </ProtectedRoute>
            }
          />
          <Route
            path="/incidents/:id"
            element={
            <ProtectedRoute>
              <IncidentDetails />
            </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;