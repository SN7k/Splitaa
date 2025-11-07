import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Container, Spinner } from 'react-bootstrap'
import { useTheme } from '../contexts/ThemeContext'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

function SSOCallback() {
  const { colors } = useTheme()
  const navigate = useNavigate()
  const { user, isLoaded, isSignedIn } = useUser()
  const hasHandled = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions
      if (hasHandled.current) {
        return
      }

      // Wait for Clerk to fully load
      if (!isLoaded) {
        return
      }

      hasHandled.current = true

      try {
        // Check if user is signed in after OAuth
        if (isSignedIn && user) {
          // Sync with backend to get proper JWT token
          try {
            const userData = {
              name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
              email: user.primaryEmailAddress?.emailAddress,
              clerkId: user.id,
              avatar: user.imageUrl
            }
            
            const response = await fetch(`${API_URL}/auth/sync-clerk`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(userData)
            })
            
            const result = await response.json()
            
            if (result.success && result.data) {
              localStorage.setItem('current_user', JSON.stringify(result.data.user))
              localStorage.setItem('auth_token', result.data.token)
              localStorage.setItem('clerk_user', JSON.stringify(user))
            } else {
              localStorage.setItem('current_user', JSON.stringify(userData))
              localStorage.setItem('auth_token', `clerk_${user.id}`)
              localStorage.setItem('clerk_user', JSON.stringify(user))
            }
          } catch (syncError) {
            console.error('Backend sync failed:', syncError)
            const userData = {
              name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
              email: user.primaryEmailAddress?.emailAddress,
              clerkId: user.id,
              avatar: user.imageUrl
            }
            localStorage.setItem('current_user', JSON.stringify(userData))
            localStorage.setItem('auth_token', `clerk_${user.id}`)
            localStorage.setItem('clerk_user', JSON.stringify(user))
          }
          
          // Navigate to home
          navigate('/home', { replace: true })
          
        } else {
          // Not signed in, redirect to login
          localStorage.clear()
          sessionStorage.clear()
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('SSO callback error:', error)
        localStorage.clear()
        sessionStorage.clear()
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [user, isLoaded, isSignedIn, navigate])

  return (
    <div 
      className="d-flex align-items-center justify-content-center vh-100"
      style={{ backgroundColor: colors.bg.primary }}
    >
      <Container className="text-center">
        <Spinner animation="border" variant="success" style={{ width: '3rem', height: '3rem' }} />
        <h4 className="mt-4" style={{ color: colors.text.primary }}>
          Please wait...
        </h4>
      </Container>
    </div>
  )
}

export default SSOCallback
