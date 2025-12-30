import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const StudentProtectedRoute = ({ children }) => {
  const { isAuthenticated, profile } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/student/login" replace />;
  }

  if (profile?.role !== 'student') {
    return <Navigate to="/" replace />;
  }

  return children;
};

