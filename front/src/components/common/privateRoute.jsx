import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext.jsx';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; // o un loader mientras verifica
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
