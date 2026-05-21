import { useState, useEffect } from 'react'
import { Eye, EyeOff } from "lucide-react";
import { registrarUsuario } from '../../api/a-auth.js';
import VerificationNotice from './verificationNotice';

function RegisterForm({ onViewChange, showAlert }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        birthDate: '',
        gender: ''
    })

    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Estados para el datepicker personalizado
    const [dateParts, setDateParts] = useState({
        day: '',
        month: '',
        year: ''
    })

    const [registeredEmail, setRegisteredEmail] = useState(null);
    const [showVerification, setShowVerification] = useState(false);

    // Calcular fechas límite
    const today = new Date()
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())

    // Datos para los selectores
    const years = Array.from({ length: 83 }, (_, i) => maxDate.getFullYear() - i)
    const months = [
        { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
    ]

    // Efecto para construir la fecha completa
    useEffect(() => {
        if (dateParts.day && dateParts.month && dateParts.year) {
            const date = new Date(dateParts.year, dateParts.month - 1, dateParts.day)
            if (!isNaN(date.getTime())) {
                const formattedDate = date.toISOString().split('T')[0]
                if (formattedDate !== formData.birthDate) {
                    setFormData(prev => ({ ...prev, birthDate: formattedDate }))
                }
            } else {
                setErrors(prev => ({ ...prev, birthDate: 'Fecha de nacimiento no válida' }))
            }
        }
    }, [dateParts.day, dateParts.month, dateParts.year])

    // Obtener días según mes y año
    const getDaysInMonth = () => {
        if (!dateParts.month || !dateParts.year) return 31
        return new Date(dateParts.year, dateParts.month, 0).getDate()
    }

    const days = Array.from({ length: getDaysInMonth() }, (_, i) => i + 1)

    // Regex centralizado para consistencia
    const passwordRegex = {
        minLength: 8,
        lower: /(?=.*[a-z])/,
        upper: /(?=.*[A-Z])/,
        number: /(?=.*\d)/,
        special: /(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/
    };

    // Validaciones en tiempo real
    useEffect(() => {
        const newErrors = {}
        
        // Validación de campo requerido para nombre
        if (touched.name && !formData.name) {
            newErrors.name = 'El nombre completo es requerido';
        }
        else if (touched.name && formData.name) {
            const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
            const onlySpacesRegex = /^\s+$/;
            
            if (formData.name.trim().length < 2) {
                newErrors.name = 'El nombre debe tener al menos 2 caracteres';
            } else if (onlySpacesRegex.test(formData.name)) {
                newErrors.name = 'El nombre no puede contener solo espacios en blanco';
            } else if (!nameRegex.test(formData.name)) {
                newErrors.name = 'El nombre solo puede contener letras y espacios';
            } else if (formData.name.length > 50) {
                newErrors.name = 'El nombre no puede tener más de 50 caracteres';
            }
        }

        // Validación de email
        if (touched.email && !formData.email) {
            newErrors.email = 'El correo electrónico es requerido';
        }
        else if (touched.email && formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Ingresa un correo electrónico válido';
            }
        }

        // Validación de teléfono
        if (touched.phone && !formData.phone) {
            newErrors.phone = 'El teléfono es requerido';
        }
        else if (touched.phone && formData.phone) {
            const phoneRegex = /^[0-9]{10}$/
            if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
                newErrors.phone = 'El teléfono debe tener 10 dígitos'
            }
        }

        // Validación de fecha de nacimiento
        if (touched.birthDate && !formData.birthDate) {
            newErrors.birthDate = 'La fecha de nacimiento es requerida';
        }
        else if (touched.birthDate && formData.birthDate) {
            const birthDate = new Date(formData.birthDate)
            if (birthDate > maxDate) {
                newErrors.birthDate = 'Debes tener al menos 18 años'
            } else if (birthDate < minDate) {
                newErrors.birthDate = 'Fecha de nacimiento no válida'
            }
        }

        // Validación de género
        if (touched.gender && !formData.gender) {
            newErrors.gender = 'Selecciona tu género'
        }

        // --- CORRECCIÓN AQUÍ: Validación estricta de contraseña ---
        if (touched.password && !formData.password) {
            newErrors.password = 'La contraseña es requerida';
        }
        else if (touched.password && formData.password) {
            // Verificar TODOS los requisitos, no solo la longitud
            const hasMinLength = formData.password.length >= passwordRegex.minLength;
            const hasLower = passwordRegex.lower.test(formData.password);
            const hasUpper = passwordRegex.upper.test(formData.password);
            const hasNumber = passwordRegex.number.test(formData.password);
            const hasSpecial = passwordRegex.special.test(formData.password);

            if (!hasMinLength) {
                newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
            } else if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
                newErrors.password = 'No cumple con los requisitos de seguridad';
            }
        }

        // Validación de coincidencia de contraseñas
        if (touched.confirmPassword && !formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu contraseña';
        }
        else if (touched.confirmPassword && formData.confirmPassword) {
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Las contraseñas no coinciden'
            }
        }

        setErrors(newErrors)
    }, [formData, touched])

    // Función para validar todos los campos antes del submit
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) newErrors.name = 'El nombre completo es requerido';
        if (!formData.email) newErrors.email = 'El correo electrónico es requerido';
        if (!formData.phone) newErrors.phone = 'El teléfono es requerido';
        if (!formData.birthDate) newErrors.birthDate = 'La fecha de nacimiento es requerida';
        if (!formData.gender) newErrors.gender = 'Selecciona tu género';
        if (!formData.password) newErrors.password = 'La contraseña es requerida';
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
        
        if (Object.keys(newErrors).length > 0) return newErrors;
        
        // Validaciones profundas en submit
        if (formData.name) {
            const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
            const onlySpacesRegex = /^\s+$/;
            if (formData.name.trim().length < 2) newErrors.name = 'Nombre muy corto';
            else if (onlySpacesRegex.test(formData.name)) newErrors.name = 'Nombre inválido';
            else if (!nameRegex.test(formData.name)) newErrors.name = 'Caracteres inválidos';
        }
        
        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) newErrors.email = 'Email inválido';
        }
        
        if (formData.phone) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Teléfono inválido';
        }
        
        if (formData.birthDate) {
            const birthDate = new Date(formData.birthDate);
            if (birthDate > maxDate) newErrors.birthDate = 'Debes tener al menos 18 años';
        }
        
        if (formData.password) {
            const hasMinLength = formData.password.length >= passwordRegex.minLength;
            const hasLower = passwordRegex.lower.test(formData.password);
            const hasUpper = passwordRegex.upper.test(formData.password);
            const hasNumber = passwordRegex.number.test(formData.password);
            const hasSpecial = passwordRegex.special.test(formData.password);

            if (!hasMinLength || !hasLower || !hasUpper || !hasNumber || !hasSpecial) {
                 newErrors.password = 'La contraseña no es segura';
            }
        }
        
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
        
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const allTouched = {
            name: true,
            email: true,
            phone: true,
            birthDate: true,
            gender: true,
            password: true,
            confirmPassword: true
        };
        setTouched(allTouched);

        const formErrors = validateForm();
        
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            showAlert('error', 'Error al registrar', 'Por favor corrige los errores del formulario.', 4000);
            return;
        }

        setIsLoading(true);

        try {
            const nombreParts = formData.name.trim().split(/\s+/);
            let nombre = '';
            let ap_p = '';
            let ap_m = '';

            switch (nombreParts.length) {
                case 1:
                    nombre = nombreParts[0];
                    break;
                case 2:
                    nombre = nombreParts[0];
                    ap_p = nombreParts[1];
                    break;
                case 3:
                    nombre = nombreParts[0];
                    ap_p = nombreParts[1];
                    ap_m = nombreParts[2];
                    break;
                default:
                    nombre = `${nombreParts[0]} ${nombreParts[1]}`;
                    ap_p = nombreParts[2];
                    ap_m = nombreParts[3] || '';
                    break;
            }

            const payload = {
                nombre,
                ap_p,
                ap_m,
                fecha_nac: formData.birthDate,
                correo: formData.email,
                password: formData.password,
                genero: formData.gender === 'masculino' ? 'M' : formData.gender === 'femenino' ? 'F' : 'O',
                telefono: formData.phone
            };

            const data = await registrarUsuario(payload);
            console.log('Usuario registrado:', data);

            setRegisteredEmail(formData.email);
            setShowVerification(true);

        } catch (error) {
            console.error('Error al registrar usuario:', error);
            let mensajeError = error.message || 'No se pudo crear la cuenta.';
            if (error.response) {
                const resp = await error.response.json().catch(() => ({}));
                mensajeError = resp.error || resp.message || mensajeError;
            }
            showAlert('error', 'Error al registrar', mensajeError);
        } finally {
            setIsLoading(false);
        }
    }

    if (showVerification && registeredEmail) {
        return (
            <VerificationNotice
                email={registeredEmail}
                onBackToLogin={() => onViewChange('login')}
            />
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        if (name === 'phone') {
            const formattedPhone = value.replace(/\D/g, '').slice(0, 10)
            setFormData(prev => ({ ...prev, [name]: formattedPhone }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        
        if (!touched[name]) {
            setTouched(prev => ({ ...prev, [name]: true }));
        }
    }

    const handleDatePartChange = (part, value) => {
        setDateParts(prev => ({ ...prev, [part]: value }))
        handleBlur('birthDate')
    }

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }))
    }

    const getInputBorderClass = (fieldName) => {
        if (touched[fieldName] && errors[fieldName]) {
            return 'border-red-500 focus:ring-red-500 focus:border-red-500';
        }
        if (touched[fieldName] && formData[fieldName] && !errors[fieldName]) {
            return 'border-green-500 focus:ring-green-500 focus:border-green-500';
        }
        return 'border-gray-300/70 focus:ring-[#287233] focus:border-[#287233] hover:border-[#287233]';
    };

    const isFormValid = Object.keys(errors).length === 0 &&
        formData.name &&
        formData.email &&
        formData.phone &&
        formData.birthDate &&
        formData.gender &&
        formData.password &&
        formData.confirmPassword;

    return (
        <div className="flex flex-col w-full max-w-sm p-8 space-y-6 max-h-[90vh]">
            
            <div className="space-y-2 text-center flex-shrink-0">
                <h2 className="text-3xl font-bold text-gray-900">Crear Cuenta</h2>
                <p className="text-gray-500">Únete a nuestra comunidad de turistas</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    
                    {/* Campo Nombre */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre completo*</label>
                        <input
                            type="text" 
                            id="name" 
                            name="name" 
                            value={formData.name}
                            onChange={handleChange} 
                            onBlur={() => handleBlur('name')}
                            placeholder="Ej: María González López"
                            className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 placeholder-gray-400 transition duration-200 bg-white/95 backdrop-blur-sm ${getInputBorderClass('name')} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                        />
                        {touched.name && errors.name && (<span className="text-red-500 text-xs mt-1">{errors.name}</span>)}
                        {touched.name && !errors.name && formData.name && (<span className="text-green-600 text-xs mt-1">✓ Nombre válido</span>)}
                    </div>

                    {/* Campo Email */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo electrónico*</label>
                        <input
                            type="email" 
                            id="email" 
                            name="email" 
                            value={formData.email}
                            onChange={handleChange} 
                            onBlur={() => handleBlur('email')}
                            placeholder="usuario@dominio.com"
                            className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 placeholder-gray-400 transition duration-200 bg-white/95 backdrop-blur-sm ${getInputBorderClass('email')} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                        />
                        {touched.email && errors.email && (<span className="text-red-500 text-xs mt-1">{errors.email}</span>)}
                        {touched.email && !errors.email && formData.email && (<span className="text-green-600 text-xs mt-1">✓ Correo válido</span>)}
                    </div>

                    {/* Campo Teléfono */}
                    <div className="space-y-2">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono*</label>
                        <input
                            type="tel" 
                            id="phone" 
                            name="phone" 
                            value={formData.phone}
                            onChange={handleChange} 
                            onBlur={() => handleBlur('phone')}
                            placeholder="XXXXXXXXXX"
                            className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 placeholder-gray-400 transition duration-200 bg-white/95 backdrop-blur-sm ${getInputBorderClass('phone')} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                        />
                        {touched.phone && errors.phone && (<span className="text-red-500 text-xs mt-1">{errors.phone}</span>)}
                        {touched.phone && !errors.phone && formData.phone && (<span className="text-green-600 text-xs mt-1">✓ Teléfono válido</span>)}
                    </div>

                    {/* Campo Fecha de Nacimiento */}
                    <div className="space-y-2">
                        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Fecha de nacimiento*</label>
                        <div className="flex space-x-2">
                            <select
                                value={dateParts.day} 
                                onChange={(e) => handleDatePartChange('day', e.target.value)}
                                onBlur={() => handleBlur('birthDate')}
                                className={`w-1/3 px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 transition duration-200 bg-white/95 backdrop-blur-sm ${getInputBorderClass('birthDate')} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                disabled={isLoading}
                            >
                                <option value="">Día</option>
                                {days.map(day => (<option key={day} value={day}>{day}</option>))}
                            </select>
                            <select
                                value={dateParts.month} 
                                onChange={(e) => handleDatePartChange('month', e.target.value)}
                                onBlur={() => handleBlur('birthDate')}
                                className={`w-1/3 px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 transition duration-200 bg-white/95 backdrop-blur-sm ${getInputBorderClass('birthDate')} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                disabled={isLoading}
                            >
                                <option value="">Mes</option>
                                {months.map(month => (<option key={month.value} value={month.value}>{month.label}</option>))}
                            </select>
                            <select
                                value={dateParts.year} 
                                onChange={(e) => handleDatePartChange('year', e.target.value)}
                                onBlur={() => handleBlur('birthDate')}
                                className={`w-1/3 px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 transition duration-200 bg-white/95 backdrop-blur-sm ${getInputBorderClass('birthDate')} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                disabled={isLoading}
                            >
                                <option value="">Año</option>
                                {years.map(year => (<option key={year} value={year}>{year}</option>))}
                            </select>
                        </div>
                        {touched.birthDate && errors.birthDate && (<span className="text-red-500 text-xs mt-1">{errors.birthDate}</span>)}
                        {touched.birthDate && !errors.birthDate && formData.birthDate && (<span className="text-green-600 text-xs mt-1">✓ Fecha válida</span>)}
                    </div>

                    {/* Campo Género */}
                    <div className="space-y-2">
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Género*</label>
                        <select
                            id="gender" 
                            name="gender" 
                            value={formData.gender}
                            onChange={handleChange} 
                            onBlur={() => handleBlur('gender')}
                            className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 transition duration-200 bg-white/95 backdrop-blur-sm ${getInputBorderClass('gender')} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                        >
                            <option value="">Selecciona tu género</option>
                            <option value="masculino">Masculino</option>
                            <option value="femenino">Femenino</option>
                            <option value="otro">Otro</option>
                        </select>
                        {touched.gender && errors.gender && (<span className="text-red-500 text-xs mt-1">{errors.gender}</span>)}
                        {touched.gender && !errors.gender && formData.gender && (<span className="text-green-600 text-xs mt-1">✓ Género seleccionado</span>)}
                    </div>

                    {/* Campo Contraseña */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña*</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={() => handleBlur("password")}
                                placeholder="••••••••"
                                className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 placeholder-gray-400 transition duration-200 bg-white/95 backdrop-blur-sm pr-10 ${getInputBorderClass('password')} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition duration-150"
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        
                        {/* Mensaje de error o éxito bajo el input */}
                        {touched.password && errors.password && (<span className="text-red-500 text-xs mt-1">{errors.password}</span>)}
                        {touched.password && !errors.password && formData.password && (<span className="text-green-600 text-xs mt-1">✓ Contraseña segura</span>)}

                        {/* Indicador de requisitos de contraseña */}
                        {formData.password && (
                            <div className="text-xs text-gray-600 space-y-1 mt-2">
                                <small className='font-semibold'>La contraseña debe tener:</small>
                                <ul className="list-none p-0 space-y-0.5">
                                    <li className={formData.password.length >= passwordRegex.minLength ? 'text-green-600' : 'text-red-500'}>
                                        • Al menos 8 caracteres
                                    </li>
                                    <li className={passwordRegex.lower.test(formData.password) ? 'text-green-600' : 'text-red-500'}>
                                        • Una letra minúscula
                                    </li>
                                    <li className={passwordRegex.upper.test(formData.password) ? 'text-green-600' : 'text-red-500'}>
                                        • Una letra mayúscula
                                    </li>
                                    <li className={passwordRegex.number.test(formData.password) ? 'text-green-600' : 'text-red-500'}>
                                        • Un número
                                    </li>
                                    <li className={passwordRegex.special.test(formData.password) ? 'text-green-600' : 'text-red-500'}>
                                        • Un caracter especial
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Campo Confirmar Contraseña */}
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar contraseña*</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onBlur={() => handleBlur("confirmPassword")}
                                placeholder="••••••••"
                                className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 placeholder-gray-400 transition duration-200 bg-white/95 backdrop-blur-sm pr-10 ${getInputBorderClass('confirmPassword')} ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((prev) => !prev)}
                                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition duration-150"
                                disabled={isLoading}
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {touched.confirmPassword && errors.confirmPassword && (<span className="text-red-500 text-xs mt-1">{errors.confirmPassword}</span>)}
                        {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && (<span className="text-green-600 text-xs mt-1">✓ Contraseñas coinciden</span>)}
                    </div>
                </form>
            </div>

            {/* Botón y Footer */}
            <div className="flex-shrink-0 space-y-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    onClick={handleSubmit}
                    className={`w-full py-3 px-4 text-white rounded-lg font-medium transition duration-150 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#287233] transform hover:scale-[1.02] active:scale-[0.98] ${
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
                            Creando cuenta...
                        </div>
                    ) : (
                        'Crear Cuenta'
                    )}
                </button>

                <div className="text-center text-sm">
                    <p className="text-gray-600">
                        ¿Ya tienes cuenta?{' '}
                        <button
                            className="font-medium text-[#287233] hover:text-[#1f5c27] transition duration-150 disabled:opacity-50"
                            onClick={() => onViewChange('login')}
                            disabled={isLoading}
                        >
                            Inicia sesión aquí
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RegisterForm