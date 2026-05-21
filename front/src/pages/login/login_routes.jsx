import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserPreferences } from "../../api/a-preferencias";
import { useAlert } from "../../context/alertContext";

import AuthLayout from "./AuthLayout";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";

function Login_routes() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [currentView, setCurrentView] = useState("login");

  // Redirección correcta después del login
  const handleSuccessfulLogin = async () => {
    try {
      // Aumentar el tiempo de espera para asegurar que se guarde en localStorage
      await new Promise((r) => setTimeout(r, 500));

      // DEPURACIÓN: Verificar todo el localStorage
      console.log("🔍 DEPURACIÓN - Contenido completo de localStorage:");
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`📦 ${key}:`, value);
      }

      // Obtener el usuario del localStorage - múltiples intentos
      let userData = localStorage.getItem('user');
      
      // Si no se encuentra en localStorage, intentar en sessionStorage
      if (!userData) {
        userData = sessionStorage.getItem('user');
        console.log("🔄 Buscando usuario en sessionStorage:", userData);
      }
      
      if (userData) {
        const user = JSON.parse(userData);
        console.log("✅ Usuario encontrado, rol:", user.rol);
        
        // Verificar si es administrador
        if (user.rol === 'administrador') {
          console.log("🔑 Usuario administrador detectado, redirigiendo al dashboard...");
          navigate("/admin");
          return;
        }
        
        // Para usuarios normales, verificar preferencias
        console.log("📊 Verificando preferencias para usuario normal...");
        const pref = await getUserPreferences();
        console.log("Preferencias obtenidas:", pref);

        if (pref.hasPreferences === true) {
          navigate("/home");
        } else {
          navigate("/preferencias");
        }
      } else {
        // Fallback si no hay datos de usuario
        console.error("❌ No se encontraron datos de usuario en ningún storage");
        console.warn("⚠️ Redirigiendo a home como fallback");
        navigate("/home");
      }
    } catch (err) {
      console.error("❌ Error en handleSuccessfulLogin:", err);
      console.warn("⚠️ Redirigiendo a home por error");
      navigate("/home"); // fallback
    }
  };

  const renderForm = () => {
    switch (currentView) {
      case "login":
        return (
          <LoginForm
            onViewChange={setCurrentView}
            showAlert={showAlert}
            onLoginSuccess={handleSuccessfulLogin}
          />
        );
      case "register":
        return (
          <RegisterForm
            onViewChange={setCurrentView}
            showAlert={showAlert}
            onLoginSuccess={handleSuccessfulLogin}
          />
        );
      case "forgot-password":
        return (
          <ForgotPassword
            onViewChange={setCurrentView}
            showAlert={showAlert}
          />
        );
      case "reset-password":
        return (
          <ResetPassword
            onViewChange={setCurrentView}
            showAlert={showAlert}
          />
        );
      default:
        return (
          <LoginForm
            onViewChange={setCurrentView}
            showAlert={showAlert}
            onLoginSuccess={handleSuccessfulLogin}
          />
        );
    }
  };

  const clientId =
    "1035029264833-upq422fc7fjjtc2p51uedoatbank1lmr.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthLayout>{renderForm()}</AuthLayout>
    </GoogleOAuthProvider>
  );
}

export default Login_routes;