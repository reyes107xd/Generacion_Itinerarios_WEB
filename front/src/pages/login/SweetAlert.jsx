import { useEffect } from 'react';

function SweetAlert({ show, type, title, message, onClose }) { 
    if (!show) return null

    // --- Configuración de estilos por tipo ---
    const styles = {
        success: {
            iconBg: 'bg-green-500',
            iconColor: 'text-white',
            titleColor: 'text-white',
            textColor: 'text-white'
        },
        error: {
            iconBg: 'bg-red-500',
            iconColor: 'text-white',
            titleColor: 'text-white',
            textColor: 'text-white'
        },
        warning: {
            iconBg: 'bg-yellow-500',
            iconColor: 'text-white',
            titleColor: 'text-white',
            textColor: 'text-white'
        },
        info: {
            iconBg: 'bg-blue-500',
            iconColor: 'text-white',
            titleColor: 'text-white',
            textColor: 'text-white'
        }
    }

    const currentStyle = styles[type] || styles.info

    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    // Ícono de éxito (check) - SOLO CONTORNO
                    <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                )
            case 'error':
                return (
                    // Ícono de error (X) - SOLO CONTORNO
                    <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                )
            case 'warning':
                return (
                    // Ícono de advertencia (triángulo con admiración) - SOLO CONTORNO
                    <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
                    </svg>
                )
            default: // Info
                return (
                    // Ícono de información (i en círculo) - SOLO CONTORNO
                    <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                )
        }
    }

    return (
        // Overlay con efecto de entrada - más oscuro
        <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg transition-all duration-500"
            onClick={onClose}
        >
            {/* Modal SIN recuadro blanco - solo el ícono y texto */}
            <div 
                className="max-w-md w-full mx-auto transform transition-all duration-500 animate-modal-in text-center"
                onClick={(e) => e.stopPropagation()}
                role="alert"
            >
                {/* Ícono con animación - más grande y centrado */}
                <div className="flex justify-center mb-8">
                    <div className={`p-6 rounded-full ${currentStyle.iconBg} ${currentStyle.iconColor} shadow-2xl animate-icon-in`}>
                        {getIcon()}
                    </div>
                </div>

                {/* Contenido de texto centrado - texto blanco */}
                <div className="text-center space-y-4">
                    <h3 className={`text-4xl font-bold ${currentStyle.titleColor} drop-shadow-lg`}>
                        {title}
                    </h3>
                    <p className={`text-2xl ${currentStyle.textColor} leading-relaxed drop-shadow-lg font-light`}>
                        {message}
                    </p>
                </div>

                {/* Botón de cerrar flotante */}
                <button 
                    className="absolute top-8 right-8 p-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 backdrop-blur-sm"
                    onClick={onClose}
                    aria-label="Cerrar alerta"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Estilos para las animaciones */}
            <style >{`
                @keyframes modal-in {
                    from { 
                        opacity: 0;
                        transform: scale(0.8) translateY(30px);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                @keyframes icon-in {
                    from { 
                        opacity: 0;
                        transform: scale(0) rotate(-180deg);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1) rotate(0);
                    }
                }
                // ⚠️ ELIMINAR la animación shrink también
                // @keyframes shrink {
                //     from { width: 100%; }
                //     to { width: 0%; }
                // }
                .animate-modal-in {
                    animation: modal-in 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .animate-icon-in {
                    animation: icon-in 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both;
                }
            `}</style>
        </div>
    )
}

export default SweetAlert