import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import SimpleLayout from "./components/Layout/SimpleLayout";

// Páginas
import Home from "./pages/P-Turistas/Home";
import Perfil from "./pages/P-Turistas/perfil";
import Comunidad from "./pages/P-Turistas/comunidad";
import Preferencias from "./pages/P-Turistas/Preferencias";
import Reportar from "./pages/P-Turistas/reportar";
import Favoritos from "./pages/P-Turistas/favoritos";
import Guardados from "./pages/P-Turistas/Guardados";
import GestionarItinerario from "./pages/P-Turistas/GestionarItinerario";
import Mensajes from "./pages/P-Turistas/mensajes.jsx";
import Notfound from "./components/common/NotFound";
import PerfilPublico from "./pages/P-Turistas/PerfilPublico";

// Rutas de administrador
import AdminRoutes from "./pages/P-Admin/adminRoutes";

// Autenticación
import Login_routes from "./pages/login/login_routes";
import PrivateRoute from './components/common/privateRoute';
import ResetPassword from "./pages/login/ResetPassword";
import AuthLayout from "./pages/login/AuthLayout";

// Alertas globales
import { AlertProvider, useAlert } from "./context/alertContext";
import { FavoritesProvider } from "./context/favoritesContext"; 
import { AuthProvider } from './context/authContext';
import { SocketProvider } from './context/SocketContext';       
import { NotificationProvider } from './context/NotificationContext'; 
import { ExportProvider } from "./context/ExportContext.jsx";

import SweetAlert from "./pages/login/SweetAlert";

function App() {
  return (
  <AuthProvider> 
    <SocketProvider>  
      <AlertProvider>
         <NotificationProvider> 
            <FavoritesProvider>
              <ExportProvider>
                <Routes>
                  {/* Rutas públicas */}
                  <Route path="/" element={<Login_routes />} />
                  <Route path="/login" element={<Login_routes />} />

                  <Route
                    path="/reset-password/:token"
                    element={
                      <AuthLayout>
                        <ResetPassword />
                      </AuthLayout>
                    }
                  />

                  {/* Rutas privadas para usuarios normales */}
                  <Route path="/home" element={<PrivateRoute><Layout><Home/></Layout></PrivateRoute>} />
                  <Route path="/reportar/:id" element={<PrivateRoute><Layout><Reportar /></Layout></PrivateRoute>} />
                  <Route path="/perfil" element={<PrivateRoute><Layout><Perfil /></Layout></PrivateRoute>} />
                  <Route path="/mensajes" element={<PrivateRoute><Layout><Mensajes /></Layout></PrivateRoute>} />
                  <Route path="/mensajes/:id" element={<PrivateRoute><Layout><Mensajes /></Layout></PrivateRoute>} />
                  <Route path="/comunidad" element={<PrivateRoute><Layout><Comunidad /></Layout></PrivateRoute>} />
                  <Route path="/favoritos" element={<PrivateRoute><Layout><Favoritos /></Layout></PrivateRoute>} />
                  <Route path="/guardados" element={<PrivateRoute><Layout><Guardados /></Layout></PrivateRoute>} />
                  <Route path="/GestionarItinerario" element={<PrivateRoute><Layout pageTitle={'Itinerarios'}><GestionarItinerario /></Layout></PrivateRoute>} />
                  <Route path="/preferencias" element={<PrivateRoute><SimpleLayout title="TLAMATINI" ><Preferencias /></SimpleLayout></PrivateRoute>} />
                  <Route path="/perfil/:id" element={<PrivateRoute><Layout><PerfilPublico /></Layout></PrivateRoute>} />

                  {/* Rutas de administrador */}
                  <Route path="/admin/*" element={<AdminRoutes />} />
                  
                  {/* Ruta 404 */}
                  <Route path="*" element={<Notfound />} />
                </Routes>

                {/* Componente global para mostrar alertas */}
                <SweetAlertWrapper />
              </ExportProvider>
            </FavoritesProvider>
          </NotificationProvider> 
      </AlertProvider>
    </SocketProvider>
    </AuthProvider>
  );
}

// Wrapper que conecta el contexto con el componente de alertas visual
const SweetAlertWrapper = () => {
  const { alert, closeAlert } = useAlert();

  return (
    <SweetAlert
      show={alert.show}
      type={alert.type}
      title={alert.title}
      message={alert.message}
      onClose={closeAlert}
    />
  );
};

export default App;
