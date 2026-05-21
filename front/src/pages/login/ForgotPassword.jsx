import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { solicitarRecuperacion } from '../../api/a-auth.js'

function ForgotPassword({ onViewChange, showAlert }) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState('')

  // === Validación en tiempo real con useEffect ===
  useEffect(() => {
    if (touched) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      
      if (!email) {
        setError('El correo electrónico es requerido')
      } else if (!emailRegex.test(email)) {
        setError('Ingresa un correo electrónico válido')
      } else {
        setError('') 
      }
    }
  }, [email, touched])

  const handleChange = (e) => {
    setEmail(e.target.value)
  }

  const handleBlur = () => {
    setTouched(true)
  }

  // Determina el color del borde 
  const getInputBorderClass = () => {
    if (touched && error) {
      return 'border-red-500 focus:ring-red-500 focus:border-red-500'
    }
    if (touched && email && !error) {
      return 'border-green-500 focus:ring-green-500 focus:border-green-500'
    }
    return 'border-gray-300/70 focus:ring-[#287233] focus:border-[#287233] hover:border-[#287233]'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true) 

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      showAlert('error', 'Error al enviar correo', 'Por favor ingresa un correo válido', 4000)
      return
    }

    setIsLoading(true)
    try {
      const data = await solicitarRecuperacion(email)

      showAlert(
        'success', 
        '¡Correo enviado!', 
        data.message || 'Te enviamos un enlace para restablecer tu contraseña.',
        4000
      )

      // Redirige al login tras unos segundos
      setTimeout(() => onViewChange('login'), 4000)

    } catch (error) {
      console.error('Error al solicitar recuperación:', error)
      let mensajeError = error.message || 'No se pudo enviar el enlace de recuperación.'
      
      if (error.response) {
        const resp = await error.response.json().catch(() => ({}))
        mensajeError = resp.error || resp.message || mensajeError
      }
      
      showAlert('error', 'Error al recuperar contraseña', mensajeError)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = email && !error

  return (
    <div className="flex flex-col w-full max-w-sm p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Recuperar Contraseña</h2>
        <p className="text-gray-500 mt-2">Te enviaremos un enlace para restablecer tu contraseña</p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2 relative">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Correo electrónico*
          </label>
          
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="usuario@dominio.com"
              disabled={isLoading}
              className={`w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-1 placeholder-gray-400 transition duration-200 bg-white/95 backdrop-blur-sm pr-10 ${
                getInputBorderClass()
              } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
            
            {/* Iconos de Feedback visual */}
            <div className="absolute right-3 top-3 pointer-events-none">
                {touched && !error && email && <Check size={18} className="text-green-600" />}
            </div>
          </div>
          
          {/* Mensajes de Validación */}
          {touched && error && (
            <p className="text-red-500 text-xs mt-1 animate-fadeIn">{error}</p>
          )}
          {touched && !error && email && (
            <p className="text-green-600 text-xs mt-1 animate-fadeIn">✓ Correo válido</p>
          )}
          
          {/* Información extra */}
          <div className="text-xs text-gray-500 mt-2 p-2 ">
            <p className="font-medium">Ingresa el correo asociado a tu cuenta</p>
            <p className="mt-1 opacity-80">Revisa tu carpeta de spam si no recibes el correo.</p>
          </div>
        </div>

        {/* Botón */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 text-white rounded-lg font-medium transition duration-150 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#287233] transform hover:scale-[1.02] active:scale-[0.98] ${
            isFormValid && !isLoading
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
              Enviando enlace...
            </div>
          ) : (
            'Enviar Enlace de Recuperación'
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <p className="text-gray-600">
          ¿Recordaste tu contraseña?{' '}
          <button
            type="button"
            className="font-medium text-[#287233] hover:text-[#1f5c27] transition duration-150 disabled:opacity-50"
            onClick={() => onViewChange('login')}
            disabled={isLoading}
          >
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword