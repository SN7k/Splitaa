import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react'
import { useEffect, useRef } from 'react'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export function ClerkAuthProvider({ children }) {
  if (!clerkPubKey) {
    console.warn('Clerk Publishable Key not found. Clerk authentication is disabled.')
    return <>{children}</>
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      {children}
    </ClerkProvider>
  )
}

export function ClerkUserSync() {
  const { user, isLoaded, isSignedIn } = useUser()
  const hasSynced = useRef(false)

  useEffect(() => {
    const syncUser = async () => {
      // Prevent multiple sync attempts
      if (hasSynced.current) {
        return
      }

      if (isLoaded && isSignedIn && user) {
        hasSynced.current = true
        
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
            localStorage.setItem('clerk_user', JSON.stringify(user))
            localStorage.setItem('auth_token', result.data.token)
          } else {
            console.warn('⚠️ Backend sync failed, using fallback')
            
            localStorage.setItem('current_user', JSON.stringify(userData))
            localStorage.setItem('clerk_user', JSON.stringify(user))
            localStorage.setItem('auth_token', `clerk_${user.id}`)
          }
        } catch (error) {
          console.error('❌ Error syncing user:', error)
          
          const userData = {
            name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
            email: user.primaryEmailAddress?.emailAddress,
            clerkId: user.id,
            avatar: user.imageUrl
          }
          localStorage.setItem('current_user', JSON.stringify(userData))
          localStorage.setItem('clerk_user', JSON.stringify(user))
          localStorage.setItem('auth_token', `clerk_${user.id}`)
        }
      } else if (isLoaded && !isSignedIn) {
        // User is not signed in, clear local storage
        localStorage.removeItem('current_user')
        localStorage.removeItem('clerk_user')
        localStorage.removeItem('auth_token')
        hasSynced.current = false
      }
    }

    syncUser()
  }, [user, isLoaded, isSignedIn])

  return null
}

export function ProtectedRoute({ children }) {
  if (!clerkPubKey) {
    return <>{children}</>
  }

  return (
    <>
      <SignedIn>
        <ClerkUserSync />
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

export { SignedIn, SignedOut, useUser }
