import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Si el usuario no es administrador, redirigir al home
  if (user.rol !== 'administrador') {
    return <Navigate to="/home" replace />;
  }
  
  // Si es administrador, mostrar el contenido
  return children;
};

export default AdminRoute;