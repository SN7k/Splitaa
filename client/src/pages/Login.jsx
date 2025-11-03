import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { useTheme } from '../contexts/ThemeContext'
import { loginUser } from '../services/api'
import { useSignIn, useUser } from '@clerk/clerk-react'

function Login() {
  const { colors } = useTheme()
  const { signIn, isLoaded: clerkLoaded } = useSignIn()
  const { user, isSignedIn, isLoaded: userLoaded } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (userLoaded && isSignedIn && user) {
      sessionStorage.removeItem('redirectAfterLogin')
      navigate('/home', { replace: true })
      return
    }

    const token = localStorage.getItem('auth_token')
    const currentUser = localStorage.getItem('current_user')
    
    if (token && currentUser) {
      sessionStorage.removeItem('redirectAfterLogin')
      navigate('/home', { replace: true })
    }
  }, [userLoaded, isSignedIn, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await loginUser(email, password)
      sessionStorage.removeItem('redirectAfterLogin')
      navigate('/home')
      window.location.reload()
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e, nextFieldId) => {
    if (e.key === 'Enter' && nextFieldId) {
      e.preventDefault()
      document.getElementById(nextFieldId)?.focus()
    }
  }

  const handleGoogleLogin = async () => {
    if (!clerkLoaded || !signIn) {
      alert('Clerk is not configured. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file')
      return
    }

    try {
      setLoading(true)
      
      if (isSignedIn && user) {
        navigate('/home', { replace: true })
        return
      }
      
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/home'
      })
    } catch (err) {
      console.error('Google login error:', err)
      setError('Google login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="login-page" style={{ backgroundColor: colors.bg.primary }}>
      <Container fluid className="vh-100 d-flex align-items-center justify-content-center">
        <Row className="w-100 justify-content-center">
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card className="shadow-lg border-0 login-card" style={{
              backgroundColor: colors.bg.card,
              border: `1px solid ${colors.border.primary}`
            }}>
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h1 className="brand-name">Splitaa</h1>
                  <p style={{ color: colors.text.secondary }}>Split expenses with friends</p>
                </div>
                
                <Form onSubmit={handleSubmit}>
                  {error && (
                    <Alert variant="danger" className="mb-3">
                      {error}
                    </Alert>
                  )}
                  
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: colors.text.primary }}>Email</Form.Label>
                    <Form.Control
                      id="email-input"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'password-input')}
                      required
                      autoComplete="email"
                      className="form-control-custom"
                      style={{
                        backgroundColor: colors.bg.tertiary,
                        borderColor: colors.border.primary,
                        color: colors.text.primary
                      }}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label style={{ color: colors.text.primary }}>Password</Form.Label>
                    <Form.Control
                      id="password-input"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="form-control-custom"
                      style={{
                        backgroundColor: colors.bg.tertiary,
                        borderColor: colors.border.primary,
                        color: colors.text.primary
                      }}
                    />
                  </Form.Group>
                  
                  <Button 
                    type="submit" 
                    className="w-100 btn-primary-custom mb-3"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                  
                  <div className="text-center mb-3">
                    <small style={{ color: colors.text.secondary }}>or</small>
                  </div>
                  
                  <Button 
                    variant="outline-light"
                    className="w-100 mb-3 d-flex align-items-center justify-content-center"
                    size="lg"
                    onClick={handleGoogleLogin}
                    style={{
                      borderColor: colors.border.primary,
                      color: colors.text.primary,
                      backgroundColor: colors.bg.tertiary
                    }}
                  >
                    <svg className="me-2" width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Login with Google
                  </Button>
                  
                  <div className="text-center">
                    <small style={{ color: colors.text.secondary }}>
                      Don't have an account? <Link to="/signup" className="text-success">Sign up</Link>
                    </small>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Login