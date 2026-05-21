import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../api/a-auth.js';
import { useAlert } from '../../context/alertContext.jsx';
import { Eye, EyeOff } from 'lucide-react';

function ResetPassword({}) {
  const navigate = useNavigate();
  const { token } = useParams();
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Estados para mostrar/ocultar contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // === Validaciones en tiempo real  ===
  useEffect(() => {
    const newErrors = {};

    // Validación de contraseña
    if (touched.password && !formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (touched.password && formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      }
    }

    // Validación de confirmar contraseña
    if (touched.confirmPassword && !formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (touched.confirmPassword && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
  }, [formData, touched]);

  // === Manejadores ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpiar error específico al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Marcar como touched 
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Función para determinar el color del borde 
  const getInputBorderClass = (fieldName) => {
    if (touched[fieldName] && errors[fieldName]) {
      return 'border-red-500 focus:ring-red-500 focus:border-red-500';
    }
    if (touched[fieldName] && formData[fieldName] && !errors[fieldName]) {
      return 'border-green-500 focus:ring-green-500 focus:border-green-500';
    }
    return 'border-gray-300/70 focus:ring-[#287233] focus:border-[#287233] hover:border-[#287233]';
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.password) newErrors.password = 'La contraseña es requerida';
    else if (formData.password.length < 8) newErrors.password = 'La contraseña debe tener al menos 8 caracteres';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Marcar todos como tocados
    setTouched({ password: true, confirmPassword: true });

    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      showAlert('error', 'Error al restablecer contraseña', 'Completa todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, formData.password, formData.confirmPassword);
      showAlert('success', '¡Contraseña actualizada con éxito!', 'Serás redirigido al inicio de sesión.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      showAlert('error', 'Error al actualizar contraseña', error.message || 'No se pudo actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && formData.password && formData.confirmPassword;

  return (
    <div className="flex flex-col w-full max-w-sm p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Nueva Contraseña</h2>
        <p className="text-gray-500">Crea una nueva contraseña para tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* === Campo: Nueva contraseña === */}
        <div className="space-y-2 relative">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Nueva contraseña*
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 placeholder-gray-400 transition duration-200 bg-white/95 backdrop-blur-sm pr-10 ${
                getInputBorderClass('password')
              } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            />
            {/* Botón para mostrar/ocultar */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition duration-150"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {touched.password && errors.password && (
            <span className="text-red-500 text-xs mt-1">{errors.password}</span>
          )}
          {touched.password && !errors.password && formData.password && (
            <span className="text-green-600 text-xs mt-1">✓ Contraseña segura</span>
          )}

          {/* Indicador de requisitos de contraseña  */}
          {formData.password && (
            <div className="text-xs text-gray-600 space-y-1 mt-2">
              <small className='font-semibold'>La contraseña debe tener:</small>
              <ul className="list-none p-0 space-y-0.5">
                <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-red-500'}>
                  • Al menos 8 caracteres
                </li>
                <li className={/(?=.*[a-z])/.test(formData.password) ? 'text-green-600' : 'text-red-500'}>
                  • Una letra minúscula
                </li>
                <li className={/(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : 'text-red-500'}>
                  • Una letra mayúscula
                </li>
                <li className={/(?=.*\d)/.test(formData.password) ? 'text-green-600' : 'text-red-500'}>
                  • Un número
                </li>
                <li className={/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(formData.password) ? 'text-green-600' : 'text-red-500'}>
                  • Un caracter especial
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* === Campo: Confirmar contraseña === */}
        <div className="space-y-2 relative">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmar contraseña*
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="••••••••"
              className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 placeholder-gray-400 transition duration-200 bg-white/95 backdrop-blur-sm pr-10 ${
                getInputBorderClass('confirmPassword')
              } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition duration-150"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {touched.confirmPassword && errors.confirmPassword && (
            <span className="text-red-500 text-xs mt-1">{errors.confirmPassword}</span>
          )}
          {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && (
            <span className="text-green-600 text-xs mt-1">✓ Contraseñas coinciden</span>
          )}
        </div>

        {/* === Botón de envío === */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 text-white rounded-lg font-medium transition duration-150 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#287233] transform hover:scale-[1.02] active:scale-[0.98]
            ${isLoading
              ? 'bg-[#287233]/40 cursor-not-allowed'
              : isFormValid
                ? 'bg-[#287233] hover:bg-[#1f5c27] cursor-pointer'
                : 'bg-[#287233]/60 hover:bg-[#287233]/70 cursor-pointer'
            }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Actualizando...
            </div>
          ) : (
            'Actualizar Contraseña'
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <p className="text-gray-600">
          ¿Recordaste tu contraseña?{' '}
          <button
            className="font-medium text-[#287233] hover:text-[#1f5c27] transition duration-150 disabled:opacity-50"
            onClick={() => navigate('/login')} 
            disabled={isLoading}
            type="button" 
          >
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;