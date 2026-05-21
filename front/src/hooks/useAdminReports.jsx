// hooks/useAdminReports.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../api/supabaseClient'

export const useAdminReports = (userId, userRole) => {
  const [newReportsCount, setNewReportsCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [latestReport, setLatestReport] = useState(null)

  // Función para mostrar notificación
  const showNotification = useCallback((payload) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('📢 Tlamatini - Nuevo Reporte', {
        body: `Tipo: ${payload.new?.tipo_reporte || 'Reporte'}\n${payload.new?.motivo?.substring(0, 50)}...`,
        icon: '/src/img/SoloLogo.png',
        tag: `report-${payload.new?.id_reporte}`,
        requireInteraction: true
      })
      
      notification.onclick = () => {
        window.focus()
        window.location.href = '/admin/reportes'
        notification.close()
      }
      
      setTimeout(() => notification.close(), 10000)
    }
  }, [])

  useEffect(() => {
    // Verificar si es administrador
    const adminCheck = userRole === 'administrador'
    setIsAdmin(adminCheck)
    
    if (!adminCheck || !userId) return
    
    console.log('🔔 Configurando notificaciones para admin ID:', userId)
    
    // Contar reportes pendientes existentes
    const fetchInitialCount = async () => {
      try {
        const { count, error } = await supabase
          .from('reporte')
          .select('*', { count: 'exact', head: true })
          .eq('estatus', 'pendiente')
        
        if (!error && count !== null) {
          setNewReportsCount(count)
        }
      } catch (err) {
        console.error('Error contando reportes:', err)
      }
    }
    
    fetchInitialCount()
    
    // Crear canal para notificaciones en tiempo real
    const channel = supabase.channel(`admin-realtime-${userId}`)
    
    // Escuchar nuevos reportes
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reporte',
        filter: 'estatus=eq.pendiente'
      },
      async (payload) => {
        console.log('🎯 NUEVO REPORTE DETECTADO:', payload.new)
        
        // Incrementar contador
        setNewReportsCount(prev => prev + 1)
        
        // Guardar el último reporte para mostrar en el popup
        setLatestReport({
          id: payload.new.id_reporte,
          tipo: payload.new.tipo_reporte || 'Reporte',
          motivo: payload.new.motivo || 'Nuevo reporte pendiente',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
        
        // Mostrar notificación del sistema
        showNotification(payload)
      }
    )
    
    // También escuchar cuando se resuelven reportes
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'reporte'
      },
      (payload) => {
        if (payload.new.estatus !== 'pendiente') {
          setNewReportsCount(prev => Math.max(0, prev - 1))
        }
      }
    )
    
    // Suscribir
    channel.subscribe((status) => {
      console.log('📡 Estado conexión:', status)
    })
    
    // Limpieza
    return () => {
      supabase.removeChannel(channel)
    }
    
  }, [userId, userRole, showNotification])

  const resetCounter = () => {
    setNewReportsCount(0)
    setLatestReport(null)
  }

  return {
    newReportsCount,
    isAdmin,
    latestReport,
    resetCounter
  }
}