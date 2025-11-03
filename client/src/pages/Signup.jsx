import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { useTheme } from '../contexts/ThemeContext'
import { registerUser } from '../services/api'
import { useSignUp } from '@clerk/clerk-react'

function Signup() {
  const { colors } = useTheme()
  const { signUp, isLoaded: clerkLoaded } = useSignUp()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    
    try {
      await registerUser(name, email, password)
      sessionStorage.removeItem('redirectAfterLogin')
      navigate('/home')
      window.location.reload()
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    if (!clerkLoaded || !signUp) {
      alert('Clerk is not configured. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file')
      return
    }

    try {
      setLoading(true)
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/home'
      })
    } catch (err) {
      console.error('Google signup error:', err)
      setError('Google signup failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="signup-page" style={{ backgroundColor: colors.bg.primary }}>
      <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center py-4">
        <Row className="w-100 justify-content-center">
          <Col xs={12} sm={10} md={8} lg={5}>
            <Card className="shadow-lg border-0 signup-card" style={{
              backgroundColor: colors.bg.card,
              border: `1px solid ${colors.border.primary}`
            }}>
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h1 className="brand-name">Splitaa</h1>
                  <p style={{ color: colors.text.secondary }}>Create your account</p>
                </div>
                
                <Form onSubmit={handleSubmit}>
                  {error && (
                    <Alert variant="danger" className="mb-3">
                      {error}
                    </Alert>
                  )}
                  
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: colors.text.primary }}>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="form-control-custom"
                      style={{
                        backgroundColor: colors.bg.tertiary,
                        borderColor: colors.border.primary,
                        color: colors.text.primary
                      }}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: colors.text.primary }}>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
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
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
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
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                  
                  <div className="text-center mb-3">
                    <small style={{ color: colors.text.secondary }}>or</small>
                  </div>
                  
                  <Button 
                    variant="outline-light"
                    className="w-100 mb-3 d-flex align-items-center justify-content-center"
                    size="lg"
                    onClick={handleGoogleSignup}
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
                    Sign up with Google
                  </Button>
                  
                  <div className="text-center">
                    <small style={{ color: colors.text.secondary }}>
                      Already have an account? <Link to="/login" className="text-success">Login</Link>
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

export default Signup
