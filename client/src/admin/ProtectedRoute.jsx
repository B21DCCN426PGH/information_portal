import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, profile } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  // kiểm tra xem user có phải là admin  không
  if (profile?.role !== 'admin' && profile?.role !== 'super-admin') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

