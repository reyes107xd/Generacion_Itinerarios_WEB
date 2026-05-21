import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/authContext.jsx';
import { loginUsuario, autenticarConGoogle } from '../../api/a-auth.js';

const LoginForm = ({ onViewChange, showAlert, onLoginSuccess }) => {
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginAttemptFailed, setLoginAttemptFailed] = useState(false);

    // === Validaciones en tiempo real ===
    useEffect(() => {
        const newErrors = { ...errors };
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validación de Email
        if (touched.email) {
            if (!formData.email) {
                newErrors.email = 'El correo electrónico es requerido';
            } else if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Ingresa un correo electrónico válido';
            } else {
                delete newErrors.email;
            }
        }

        // Validación de Password
        if (touched.password) {
            if (!formData.password) {
                newErrors.password = 'La contraseña es requerida';
            } else {
                if (!loginAttemptFailed) {
                    delete newErrors.password;
                }
            }
        }

        setErrors(newErrors);
    }, [formData, touched, loginAttemptFailed]);

    // === Helpers ===
    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Resetear error de contraseña al escribir
        if (name === 'password' && loginAttemptFailed) {
            setLoginAttemptFailed(false);
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs.password;
                return newErrs;
            });
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getInputBorderClass = (fieldName) => {
        if (touched[fieldName] && errors[fieldName]) {
            return 'border-red-500 focus:ring-red-500 focus:border-red-500';
        }
        if (touched[fieldName] && formData[fieldName] && !errors[fieldName]) {
            return 'border-green-500 focus:ring-green-500 focus:border-green-500';
        }
        return 'border-gray-300/70 focus:ring-[#287233] focus:border-[#287233] hover:border-[#287233]';
    };

    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ email: true, password: true });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const hasErrors = !formData.email || !emailRegex.test(formData.email) || !formData.password;

        if (hasErrors) {
            showAlert('error', 'Formulario incompleto', 'Por favor revisa los campos requeridos.', 3000);
            return;
        }

        setIsLoading(true);
        setLoginAttemptFailed(false);

        try {
            const data = await loginUsuario({ 
                correo: formData.email, 
                password: formData.password 
            });

            login(data.user, data.appToken, rememberMe);
            showAlert('success', '¡Sesión iniciada con éxito!', `Bienvenido, ${data.user.nombre_perfil || data.user.correo}`);
            if (typeof onLoginSuccess === 'function') onLoginSuccess();

        } catch (error) {
            console.error('Login error:', error);
            setLoginAttemptFailed(true);
            setErrors(prev => ({ ...prev, password: 'La contraseña es incorrecta o el usuario no existe' }));
            showAlert('error', 'Error al iniciar sesión', error.message || 'Credenciales incorrectas.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Google Handlers ---
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const idToken = credentialResponse.credential;
            const { user, appToken } = await autenticarConGoogle(idToken);

            login(user, appToken);
            showAlert('success', '¡Sesión iniciada con éxito!', `Bienvenido, ${user.nombre || 'usuario'}!`);
            if (typeof onLoginSuccess === 'function') onLoginSuccess();

        } catch (error) {
            console.error(error);
            showAlert('error', 'Error al iniciar sesión', error.message || 'No se pudo autenticar con Google.');
        }
    };

    const handleGoogleError = () => {
        showAlert('error', 'Error al iniciar sesión', 'No se pudo autenticar con Google.');
    };

    const isFormValid = !errors.email && !errors.password && formData.email && formData.password;

    return (
        <div className="flex flex-col w-full max-w-sm p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Header */}
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold text-gray-900">Iniciar sesión</h2>
                <p className="text-gray-500">Ingresa a tu cuenta para continuar</p>
            </div>

            {/* Botón de Google  */}
            <div className="flex justify-center">
                <GoogleLogin 
                    onSuccess={handleGoogleSuccess} 
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    shape="rectangular"
                    width="100%"
                    locale="es"
                    containerProps={{
                        style: {
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center'
                        }
                    }}
                    render={({ onClick }) => (
                        <button 
                            onClick={onClick}
                            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-[#287233] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#287233] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                            disabled={isLoading}
                        >
                            <div className="flex items-center justify-center mr-3">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </div>
                            <span className="group-hover:text-[#287233] transition-colors duration-200">
                                Continuar con Google
                            </span>
                        </button>
                    )}
                />
            </div>

            {/* Separador */}
            <div className="flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-sm">o ingresa con</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                
                {/* === Campo Email === */}
                <div className="space-y-2 relative">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Correo electrónico
                    </label>
                    <div className="relative">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={() => handleBlur('email')}
                            placeholder="usuario@dominio.com"
                            disabled={isLoading}
                            className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 placeholder-gray-400 transition duration-200 bg-white/95 backdrop-blur-sm pr-10 ${
                                getInputBorderClass('email')
                            } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        {/* Iconos de estado  */}
                        <div className="absolute right-3 top-3 pointer-events-none">
                            {touched.email && !errors.email && formData.email && <Check size={18} className="text-green-600" />}

                        </div>
                    </div>
                    {/* Mensajes de error/éxito */}
                    {touched.email && errors.email && (
                        <p className="text-red-500 text-xs mt-1 animate-fadeIn">{errors.email}</p>
                    )}
                    {touched.email && !errors.email && formData.email && (
                        <p className="text-green-600 text-xs mt-1 animate-fadeIn">✓ Correo válido</p>
                    )}
                </div>

                {/* === Campo Password === */}
                <div className="space-y-2 relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Contraseña
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={() => handleBlur('password')}
                            placeholder="••••••••"
                            disabled={isLoading}
                            className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 placeholder-gray-400 transition duration-200 bg-white/95 backdrop-blur-sm pr-10 ${
                                getInputBorderClass('password')
                            } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
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
                        <p className="text-red-500 text-xs mt-1 animate-fadeIn">{errors.password}</p>
                    )}
                </div>

                {/* Opciones  */}
                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-3 cursor-pointer group select-none">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isLoading}
                                className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-full border transition duration-300 flex items-center justify-center
                                ${rememberMe 
                                    ? 'bg-[#287233] border-[#287233] transform scale-100' 
                                    : 'border-gray-300 group-hover:border-[#287233] bg-white group-hover:scale-105'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {rememberMe && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <span className={`text-gray-900 group-hover:text-gray-700 transition duration-200 ${isLoading ? 'opacity-50' : ''}`}>
                            Recordar sesión
                        </span>
                    </label>
                    <button
                        type="button"
                        onClick={() => onViewChange('forgot-password')}
                        disabled={isLoading}
                        className="font-medium text-[#287233] hover:text-[#1f5c27] transition duration-150 disabled:opacity-50"
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>

                {/* Botón Login */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 mt-4 text-white rounded-lg font-medium transition duration-150 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#287233] transform hover:scale-[1.02] active:scale-[0.98] ${
                        isLoading 
                            ? 'bg-[#287233]/40 cursor-not-allowed' 
                            : isFormValid
                            ? 'bg-[#287233] hover:bg-[#1f5c27] cursor-pointer'
                            : 'bg-[#287233]/60 hover:bg-[#287233]/70 cursor-pointer'
                    }`}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Iniciando sesión...
                        </div>
                    ) : (
                        'Iniciar Sesión'
                    )}
                </button>
            </form>
            
            {/* Footer */}
            <div className="mt-6 text-center text-sm">
                <p className="text-gray-600">
                    ¿No tienes cuenta?{' '}
                    <button 
                        type="button" 
                        onClick={() => onViewChange('register')}
                        disabled={isLoading}
                        className="font-medium text-[#287233] hover:text-[#1f5c27] transition duration-150 disabled:opacity-50"
                    >
                        Regístrate aquí
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;