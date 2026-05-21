import { useState, useRef, useEffect } from 'react';
import SweetAlert from '../../pages/login/SweetAlert';
import { Camera, Trash2, Eye, EyeOff, User, Lock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { actualizarPerfilAPI, eliminarCuentaAPI, cambiarContraseñaAPI } from '../../api/a-user';
import { createPortal } from 'react-dom';

const PasswordRequirements = ({ password }) => {
  const requirements = [
    { label: "Al menos 8 caracteres", test: (pwd) => pwd.length >= 8 },
    { label: "Una letra minúscula (a-z)", test: (pwd) => /[a-z]/.test(pwd) },
    { label: "Una letra mayúscula (A-Z)", test: (pwd) => /[A-Z]/.test(pwd) },
    { label: "Un número (0-9)", test: (pwd) => /[0-9]/.test(pwd) },
    { label: "Un carácter especial (!@#$%...)", test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
  ];

  return (
    <div className="mt-2 ml-1">
      <p className="text-xs text-gray-600 mb-1">La contraseña debe tener:</p>
      <div className="space-y-0.5">
        {requirements.map((req, index) => {
          const isMet = password ? req.test(password) : false;
          return (
            <p key={index} className={`text-xs ${isMet ? 'text-emerald-600' : 'text-red-400'}`}>
              • {req.label}
            </p>
          );
        })}
      </div>
      </div>
  );
};

const EditarPerfil = ({ onProfileUpdate, activeSubTab, setActiveSubTab, onClose }) => { 
  const { user, token, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ /* ... */ });
  const [passwordData, setPasswordData] = useState({ /* ... */ });
  const [showPassword, setShowPassword] = useState({ /* ... */ });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({ /* ... */ });
  const [passwordErrors, setPasswordErrors] = useState({ /* ... */ });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [alertConfig, setAlertConfig] = useState({ /* ... */ });
  
  useEffect(() => {
    if (user) {    
      const nombreCompleto = `${user.nombre || ''} ${user.ap_p || ''} ${user.ap_m || ''}`.trim();
    
      setFormData({
        name: nombreCompleto,
        username: user.nombre_usuario || '',
        bio: user.descripcion || '',
        avatar: user.foto || user.avatarUrl,
        avatarFile: null
      });
    }
  }, [user]);

  const showAlert = (type, title, message) => {
    setAlertConfig({ show: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, show: false }));
    if (alertConfig.type === 'success' && onProfileUpdate) {
      onProfileUpdate();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleAvatarChangeClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

const handleEditPreferences = () => {
    navigate('/preferencias', { state: { fromProfile: true } }); // 👈 Clave
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatar: reader.result,
          avatarFile: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nombre obligatorio";
    if (!formData.username.trim()) newErrors.username = "Nombre de usuario obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = "Contraseña actual es obligatoria";
    }

    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = "Nueva contraseña es obligatoria";
    } else {
      const password = passwordData.newPassword;
      const minLength = password.length >= 8;
      const hasLowercase = /[a-z]/.test(password);
      const hasUppercase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      let errorMessages = [];
      if (!minLength) errorMessages.push("Al menos 8 caracteres");
      if (!hasLowercase) errorMessages.push("Una letra minúscula");
      if (!hasUppercase) errorMessages.push("Una letra mayúscula");
      if (!hasNumber) errorMessages.push("Un número");
      if (!hasSpecialChar) errorMessages.push("Un carácter especial");

      if (errorMessages.length > 0) {
        newErrors.newPassword = `La contraseña debe contener: ${errorMessages.join(", ")}`;
      }
    }

    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirmación de contraseña es obligatoria";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNameLength = (fullName) => {
    const parts = fullName.trim().split(/\s+/);
    const errors = [];
    
    parts.forEach((part, index) => {
      if (part.length > 30) {
        errors.push(`"${part}" tiene ${part.length} caracteres (máximo 30)`);
      }
    });
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const nameLengthErrors = validateNameLength(formData.name);
    if (nameLengthErrors.length > 0) {
      showAlert(
        'error', 
        'Nombre demasiado largo', 
        `Cada parte del nombre debe tener máximo 30 caracteres:\n${nameLengthErrors.join('\n')}`
      );
      return;
    }
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const userId = user.id_usuario;
      const respuesta = await actualizarPerfilAPI(token, userId, formData);

      if (respuesta && respuesta.usuario) {
        updateUser(respuesta.usuario);
        showAlert('success', '¡Perfil actualizado con éxito!', 'Tu información ha sido actualizada.');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      
      if (error.message.includes('30 caracteres') || error.message.includes('máximo 30')) {
        showAlert('error', 'Nombre demasiado largo', error.message);
      } else if (error.response?.data?.error) {
        showAlert('error', 'Error al editar perfil', error.response.data.error);
      } else {
        showAlert('error', 'Error al editar perfil', 'No se pudieron guardar los cambios.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setPasswordLoading(true);

    try {
      const userId = user.id_usuario;
      await cambiarContraseñaAPI(token, userId, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      showAlert('success', '¡Contraseña actualizada con éxito!', 'Tu contraseña ha sido cambiada.');

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setActiveSubTab('datos-basicos'); 

    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      const errorMessage = error.response?.data?.error || 'No se pudo cambiar la contraseña. Verifica tu contraseña actual.';
      showAlert('error', 'Error al actualizar contraseña', errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmation.trim()) {
      showAlert('error', 'Formulario incompleto', 'Proporciona tu contraseña o usuario para confirmar.');
      return;
    }

    try {
      setLoading(true);

      const datos = {};
      if (user.tipo_autenticacion === 'local') {
        datos.password = deleteConfirmation;
      } else {
        datos.username = deleteConfirmation;
      }

      await eliminarCuentaAPI(token, datos);

      showAlert('success', '¡Cuenta eliminada con éxito!', 'Tu cuenta ha sido eliminada permanentemente.');

      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      const mensaje = error.response?.data?.error || 'La contraseña o usuario no coinciden.';
      showAlert('error', 'Error al eliminar cuenta', mensaje);
    } finally {
      setLoading(false);
    }
  };

  // 💡 FUNCIÓN PARA RENDERIZAR EL CONTENIDO SEGÚN LA SUB-PESTAÑA
  const renderEditContentView = () => {
    switch (activeSubTab) {
      case 'datos-basicos':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm transition-colors
                    ${errors.name
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-emerald-400 focus:border-emerald-400"
                    }
                  `}
                placeholder="Tu nombre completo"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm transition-colors
                    ${errors.username
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-emerald-400 focus:border-emerald-400"
                    }
                  `}
                placeholder="Tu nombre de usuario"
              />
              {errors.username && <p className="text-red-500 text-xs mt-1 ml-1">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="3"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-400 focus:border-emerald-400 text-sm"
                placeholder="Cuéntanos algo sobre ti..."
              ></textarea>
            </div>

            {/* --- BOTÓN PREFERENCIAS --- */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleEditPreferences}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-emerald-400 text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Modificar Preferencias
              </button>
            </div>

            {/* --- BOTÓN GUARDAR --- */}
            <div className="pt-4 flex-shrink-0">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${loading
                  ? 'bg-green-600 text-emerald-700 cursor-not-allowed opacity-50'
                  : 'bg-green-200 text-emerald-700 font-medium hover:bg-green-300'
                  }`}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        );

      case 'cambiar-contrasena':
        if (user?.tipo_autenticacion !== 'local') return <p className="text-center text-gray-500 p-6">Función solo disponible para cuentas creadas con email y contraseña.</p>;
        
        return (
          <div className="bg-white p-4 rounded-lg border border-gray-300">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-emerald-800">Cambiar Contraseña</h3>
              <p className="text-xs text-gray-600">Actualiza tu contraseña de acceso</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-xs font-medium text-gray-700 mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-2 py-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm pr-10 ${passwordErrors.currentPassword
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-emerald-400 focus:border-emerald-400"
                      }`}
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-xs font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-2 py-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm pr-10 ${passwordErrors.newPassword
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-emerald-400 focus:border-emerald-400"
                      }`}
                    placeholder="Crea una nueva contraseña segura"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {passwordData.newPassword && (
                  <PasswordRequirements password={passwordData.newPassword} />
                )}

                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full px-2 py-1.5 border rounded-md focus:outline-none focus:ring-1 text-sm pr-10 ${passwordErrors.confirmPassword
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-emerald-400 focus:border-emerald-400"
                      }`}
                    placeholder="Repite tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-green-200 text-emerald-700 py-2 rounded-lg text-sm font-medium hover:bg-green-300 transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('datos-basicos'); 
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setPasswordErrors({});
                  }}
                  className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        );

      case 'eliminar-cuenta':
        return (
          <div className="mt-4 pt-6 border-t border-gray-100"> 
            {!isDeleting ? (
              <div className="flex justify-between items-center bg-red-50 p-4 rounded-xl border border-red-100">
                <div>
                  <p className="text-sm text-red-800 font-medium">Eliminar cuenta permanentemente</p>
                  <p className="text-xs text-red-600/70">Esta acción no se puede deshacer.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  Eliminar
                </button>
              </div>
            ) : (
              <div className="bg-red-50 p-5 rounded-xl border border-red-200">
                <p className="text-sm text-gray-800 mb-3 font-medium">
                  Para confirmar, escribe tu
                  <span className="font-semibold"> {user?.tipo_autenticacion === 'local' ? 'contraseña actual' : 'nombre de usuario'}</span>:
                </p>

                <input
                  type={user?.tipo_autenticacion === 'local' ? "password" : "text"}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 bg-white"
                  placeholder={user?.tipo_autenticacion === 'local' ? "Tu contraseña..." : user?.nombre_usuario}
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleDeleteAccount();
                    }
                  }}
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex justify-center items-center gap-2 shadow-sm"
                  >
                    {loading ? 'Borrando...' : <><Trash2 size={16} /> Borrar Cuenta</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsDeleting(false); setDeleteConfirmation(''); }}
                    disabled={loading}
                    className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-center text-gray-500 p-6">Selecciona una opción de edición.</p>;
    }
  };

// --- RENDERIZADO DEL MODAL COMPLETO ---
const modal = (
    // Fondo borroso y semi-transparente
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
    >
        
        {/* Contenedor central del modal */}
        <div 
            className="bg-white rounded-3xl shadow-2xl h-auto max-h-[90vh] flex flex-col overflow-hidden max-w-lg w-full transform transition-all duration-300 scale-100"
            onClick={e => e.stopPropagation()} // Evita que el clic dentro cierre el modal
        >
            {/* ENCABEZADO ESTILIZADO CON BANNER */}
            <div className="h-32 bg-gradient-to-r from-emerald-400 to-cyan-500">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 bg-white/20 hover:bg-white/40 rounded-full transition text-white z-10 shadow-md"
                >
                    <X size={20} />
                </button>
            </div>
            
            <div className="px-6 pb-4 -mt-12">
                <div className="flex justify-start mb-4">
                    <div className="relative">
                        <img
                            src={formData.avatar}
                            alt={formData.name}
                            className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover ring-4 ring-emerald-500/50 bg-white"
                        />
                        {/* Botón de Cámara (sobre la imagen) */}
                        <button
                            onClick={handleAvatarChangeClick}
                            className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full border-2 border-white hover:bg-emerald-700 transition-colors shadow-lg"
                            title="Cambiar foto de perfil"
                        >
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-1">{formData.name}</h2>
                <p className="text-emerald-600 text-sm font-medium bg-emerald-50 inline-block px-3 py-0.5 rounded-full truncate max-w-full">@{formData.username}</p>
                
                <h3 className="text-lg font-semibold text-gray-800 border-t border-gray-100 pt-4 mt-2">
                    Opciones de Edición
                </h3>
            </div>


            {/* SUB-PESTAÑAS DE EDICIÓN CON ESTILO DE SEGMENTO */}
            <div className="px-6 mb-4">
                <div className="flex justify-start w-full">
                    <div className="bg-gray-50 rounded-xl inline-flex p-1 border border-gray-200">
                        
                        {/* Pestaña Datos Básicos */}
                        <button
                            onClick={() => setActiveSubTab('datos-basicos')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${activeSubTab === 'datos-basicos'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <User size={16} className={`stroke-2 ${activeSubTab === 'datos-basicos' ? 'text-emerald-700' : 'text-gray-500'}`} />
                            Información básica 
                        </button>
                        
                        {/* Pestaña Contraseña (condicional) */}
                        {user?.tipo_autenticacion === 'local' && (
                            <button
                                onClick={() => setActiveSubTab('cambiar-contrasena')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${activeSubTab === 'cambiar-contrasena'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Lock size={16} className={`stroke-2 ${activeSubTab === 'cambiar-contrasena' ? 'text-emerald-700' : 'text-gray-500'}`} />
                                Contraseña
                            </button>
                        )}
                        
                        {/* Pestaña Eliminar Cuenta */}
                        <button
                            onClick={() => setActiveSubTab('eliminar-cuenta')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${activeSubTab === 'eliminar-cuenta'
                                ? 'bg-red-50 text-red-700 border border-red-300 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Trash2 size={16} className={`stroke-2 ${activeSubTab === 'eliminar-cuenta' ? 'text-red-700' : 'text-gray-500'}`} />
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            {/* CONTENIDO DEL FORMULARIO */}
            <div className="px-6 pb-6 flex-grow overflow-y-auto">
                {renderEditContentView()}
            </div>
            
        </div>
    </div>
);

  return (
    <>
      {/* SweetAlert en pantalla completa con z-index superior al modal */}
      {createPortal(
        <SweetAlert
          show={alertConfig.show}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={closeAlert}
          duration={0}
        />,
        document.body
      )}
      
      {/* Modal de edición de perfil */}
      {createPortal(modal, document.body)}
    </>
  );
};

export default EditarPerfil;