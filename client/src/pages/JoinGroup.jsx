import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { validateInvite, joinViaInvite, isAuthenticated } from '../services/api'
import DesktopNavbar from '../components/Navbar'
import BottomNavigation from '../components/BottomNavigation'

function JoinGroup() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { colors } = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [groupInfo, setGroupInfo] = useState(null)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    validateAndJoin()
  }, [token])

  const validateAndJoin = async () => {
    if (!isAuthenticated()) {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
      navigate('/login')
      return
    }

    try {
      setValidating(true)
      setError('')
      
      const response = await validateInvite(token)
      const data = response?.data || response
      
      if (data.valid) {
        setIsValid(true)
        setGroupInfo(data.group)
        
        await handleJoinGroup(data.group.id)
      } else {
        setError(data.reason || 'Invalid invite link')
        setValidating(false)
        setLoading(false)
      }
    } catch (err) {
      console.error('Error validating invite:', err)
      setError(err.message || 'This invite link is invalid or has expired')
      setValidating(false)
      setLoading(false)
    }
  }

  const handleJoinGroup = async (groupId) => {
    try {
      setJoining(true)
      setError('')
      
      const response = await joinViaInvite(token)
      const data = response?.data || response
      
      if (data.group) {
        setSuccess(true)
        setJoining(false)
        setLoading(false)
        
        setTimeout(() => {
          navigate(`/group-details?groupId=${groupId || data.group.id}`)
        }, 1500)
      }
    } catch (err) {
      console.error('Error joining group:', err)
      if (err.message && err.message.includes('already a member')) {
        setSuccess(true)
        setJoining(false)
        setLoading(false)
        setTimeout(() => {
          navigate(`/group-details?groupId=${groupId}`)
        }, 1500)
      } else {
        setError(err.message || 'Failed to join the group. Please try again.')
        setJoining(false)
        setLoading(false)
      }
    }
  }

  if (loading || validating || joining) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
        <DesktopNavbar />
        <Container style={{ 
          paddingTop: '5rem',
          paddingBottom: '6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 100px)'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: colors.bg.card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              <Spinner animation="border" variant="primary" style={{ width: '2.5rem', height: '2.5rem' }} />
            </div>
            
            <h4 style={{ color: colors.text.primary, marginBottom: '0.5rem', fontWeight: '600' }}>
              {joining ? 'Joining group...' : validating ? 'Validating invite...' : 'Loading...'}
            </h4>
            
            {groupInfo && (
              <p style={{ color: colors.text.secondary, fontSize: '1rem' }}>
                Adding you to <strong>{groupInfo.name}</strong>
              </p>
            )}
          </div>
        </Container>
        <BottomNavigation />
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
        <DesktopNavbar />
        <Container style={{ 
          paddingTop: '5rem',
          paddingBottom: '6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 100px)'
        }}>
          <Card style={{
            backgroundColor: colors.bg.card,
            border: `1px solid ${colors.border.primary}`,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#D1FAE5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <i className="bi bi-check-circle-fill" style={{ 
                fontSize: '3rem', 
                color: '#22C55E'
              }}></i>
            </div>
            
            <h3 style={{ color: colors.text.primary, marginBottom: '0.5rem', fontWeight: '700' }}>
              Welcome aboard!
            </h3>
            
            <p style={{ color: colors.text.secondary, marginBottom: '1rem' }}>
              You've successfully joined <strong>{groupInfo?.name}</strong>
            </p>
            
            <p style={{ color: colors.text.secondary, fontSize: '0.9rem' }}>
              Redirecting to group...
            </p>
          </Card>
        </Container>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      <DesktopNavbar />
      <Container style={{ 
        paddingTop: '5rem',
        paddingBottom: '6rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 100px)'
      }}>
        <Card style={{
          backgroundColor: colors.bg.card,
          border: `1px solid ${colors.border.primary}`,
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            padding: '2rem 1.5rem',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ 
                fontSize: '2.5rem', 
                color: '#EF4444'
              }}></i>
            </div>
            
            <h3 style={{
              color: '#FFFFFF',
              textAlign: 'center',
              fontWeight: '700',
              marginBottom: 0
            }}>
              Oops! Something went wrong
            </h3>
          </div>

          <Card.Body style={{ padding: '2rem 1.5rem' }}>
            <Alert variant="danger" style={{ marginBottom: '1.5rem' }}>
              {error}
            </Alert>
            
            <div className="d-grid gap-2">
              <Button
                size="lg"
                onClick={() => navigate('/groups')}
                style={{
                  backgroundColor: '#F97316',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  padding: '0.875rem'
                }}
              >
                <i className="bi bi-house-door me-2"></i>
                Go to My Groups
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
      <BottomNavigation />
    </div>
  )
}

export default JoinGroup
