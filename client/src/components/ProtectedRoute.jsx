import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../services/api'

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    const currentPath = window.location.pathname + window.location.search
    sessionStorage.setItem('redirectAfterLogin', currentPath)
    
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
