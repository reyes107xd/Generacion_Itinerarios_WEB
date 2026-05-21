import { useEffect } from 'react'

function SweetAlert({ show, type, title, message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!show) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="alert-icon success-icon">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="alert-icon error-icon">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="alert-icon warning-icon">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="sweet-alert-overlay" onClick={onClose}>
      <div className="sweet-alert" onClick={(e) => e.stopPropagation()}>
        {getIcon()}
        <div className="alert-content">
          <h3 className="alert-title">{title}</h3>
          <p className="alert-message">{message}</p>
        </div>
        <button className="alert-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  )
}

export default SweetAlert