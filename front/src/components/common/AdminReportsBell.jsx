import React, { useState, useEffect, useRef } from 'react'
import { Bell, AlertCircle, X } from 'lucide-react'
import { useAuth } from '../../context/authContext'
import { useAdminReports } from '../../hooks/useAdminReports'
import { motion, AnimatePresence } from 'framer-motion'

const AdminReportsBell = () => {
  const { user } = useAuth()
  const userId = user?.id_usuario
  const userRole = user?.rol
  
  const {
    newReportsCount,
    isAdmin,
    resetCounter
  } = useAdminReports(userId, userRole)

  const [showTooltip, setShowTooltip] = useState(false)
  const [showNotificationPopup, setShowNotificationPopup] = useState(false)
  const [latestReport, setLatestReport] = useState(null)
  const prevCountRef = useRef(0)
  const audioRef = useRef(null)

  // Configurar sonido de notificación
  useEffect(() => {
    audioRef.current = new Audio('/src/audio/notification.mp3')
    // Si no tienes archivo de audio, puedes usar un beep simple
    if (!audioRef.current.src) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==')
    }
    audioRef.current.volume = 0.3
  }, [])

  // Detectar cuando llega un nuevo reporte
  useEffect(() => {
    if (newReportsCount > prevCountRef.current && newReportsCount > 0) {
      console.log('🎯 Nuevo reporte detectado, mostrando popup')
      
      // Simular datos del último reporte (en realidad vendrían de Supabase)
      const mockReport = {
        id: Date.now(),
        tipo: 'Reporte nuevo',
        motivo: 'Nuevo reporte pendiente de revisión',
        timestamp: new Date().toLocaleTimeString()
      }
      
      setLatestReport(mockReport)
      setShowNotificationPopup(true)
      
      // Reproducir sonido
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Error reproduciendo sonido:', e))
      }
      
      // Auto-ocultar después de 8 segundos
      const timer = setTimeout(() => {
        setShowNotificationPopup(false)
      }, 8000)
      
      return () => clearTimeout(timer)
    }
    
    prevCountRef.current = newReportsCount
  }, [newReportsCount])

  // Si no es admin, no mostrar nada
  if (!isAdmin) {
    return null
  }

  const handleBellClick = () => {
    resetCounter()
    setShowNotificationPopup(false)
    // Redirigir a la página de reportes
    window.location.href = '/admin/reportes'
  }

  const handlePopupClick = () => {
    setShowNotificationPopup(false)
    resetCounter()
    window.location.href = '/admin/reportes'
  }

  return (
    <>
      {/* Botón de campana */}
      <div className="relative">
        <button
          onClick={handleBellClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative p-2 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 rounded-full transition-colors group"
          aria-label={`${newReportsCount} nuevos reportes`}
        >
          <Bell size={20} />
          
          {/* Indicador de nuevos reportes */}
          {newReportsCount > 0 && (
            <>
              {/* Punto rojo animado */}
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
              
              {/* Contador numérico */}
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {newReportsCount > 9 ? '9+' : newReportsCount}
              </span>
            </>
          )}
        </button>

        {/* Tooltip al hacer hover */}
        {showTooltip && (
          <div className="absolute right-0 mt-2 w-64 bg-slate-800 text-white text-sm rounded-lg p-3 z-50 shadow-xl border border-slate-700">
            <div className="font-semibold mb-2 flex items-center gap-2">
              <Bell size={14} />
              <span>Reportes Pendientes</span>
              <span className="ml-auto text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">
                En tiempo real
              </span>
            </div>
            
            {newReportsCount > 0 ? (
              <>
                <div className="text-slate-200">
                  {newReportsCount === 1 
                    ? 'Tienes 1 reporte pendiente de revisión'
                    : `Tienes ${newReportsCount} reportes pendientes de revisión`
                  }
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Haz clic para revisar
                </div>
              </>
            ) : (
              <>
                <div className="text-slate-400">
                  No hay reportes pendientes
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Se notificará automáticamente
                </div>
              </>
            )}
            
            {/* Flecha del tooltip */}
            <div className="absolute -top-2 right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-slate-800"></div>
          </div>
        )}
      </div>

      {/* Popup de notificación en tiempo real */}
      <AnimatePresence>
        {showNotificationPopup && latestReport && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-20 right-4 w-80 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700 z-[9999] overflow-hidden"
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-900/20 to-slate-900">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Bell size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Nuevo Reporte</h3>
                  <p className="text-xs text-emerald-400">En tiempo real</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowNotificationPopup(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4">
              <div className="mb-3">
                <span className="inline-block px-2 py-1 bg-slate-700/50 text-emerald-300 text-xs font-medium rounded-md">
                  {latestReport.tipo}
                </span>
              </div>
              
              <p className="text-slate-200 text-sm mb-2">
                {latestReport.motivo}
              </p>
              
              <div className="flex items-center text-xs text-slate-400 gap-2">
                <span>🕒 {latestReport.timestamp}</span>
                <span className="text-emerald-400">•</span>
                <span className="animate-pulse">🔴 Pendiente</span>
              </div>
            </div>

            {/* Acciones */}
            <div className="p-4 border-t border-slate-700/50 flex justify-end gap-2">
              <button
                onClick={() => setShowNotificationPopup(false)}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handlePopupClick}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <AlertCircle size={14} />
                Ver Reporte
              </button>
            </div>

            {/* Barra de progreso */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 8, ease: "linear" }}
              className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AdminReportsBell