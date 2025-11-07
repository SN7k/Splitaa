import { Container, Button, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'
import DesktopNavbar from '../components/Navbar'
import BalanceCards from '../components/BalanceCards'
import EmptyState from '../components/EmptyState'
import BottomNavigation from '../components/BottomNavigation'
import { useTheme } from '../contexts/ThemeContext'
import { useExpenses } from '../context/ExpensesContext'

const styles = {
  homePage: {
    minHeight: '100vh'
  },
  mainContent: {
    paddingTop: '2rem',
    paddingBottom: '6rem'
  },
  mainContentDesktop: {
    paddingTop: '3rem',
    paddingBottom: '3rem',
    maxWidth: '800px'
  },
  mainContentMobile: {
    paddingTop: '2.5rem',
    paddingBottom: '6rem',
    paddingLeft: '1rem',
    paddingRight: '1rem'
  },
  allTimeLink: {
    color: '#22C55E',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '8px 16px',
    borderRadius: '20px',
    transition: 'all 0.3s ease',
    border: 'none',
    backgroundColor: 'transparent'
  },
  groupCard: {
    borderRadius: '16px',
    border: 'none',
    marginBottom: '1rem',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer'
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  groupIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '1rem',
    flexShrink: 0
  },
  groupName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    margin: '0 0 0.25rem 0'
  },
  groupMembers: {
    fontSize: '0.85rem',
    margin: '0',
    opacity: 0.7
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    marginTop: '2rem'
  }
}

function Home() {
  const isMobile = window.innerWidth < 768
  const navigate = useNavigate()
  const { colors } = useTheme()
  const { user, isLoaded } = useUser()
  const { state } = useExpenses()
  const { groups, loading } = state

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token')
      const currentUser = localStorage.getItem('current_user')
      
      if (isLoaded && !user && !token) {
        navigate('/login', { replace: true })
        return
      }
    }
    
    if (isLoaded) {
      checkAuth()
    }
  }, [isLoaded, user, navigate])

  return (
    <div style={{
      ...styles.homePage,
      backgroundColor: colors.bg.primary
    }}>
      <DesktopNavbar />

      <Container style={{
        ...(isMobile ? styles.mainContentMobile : {...styles.mainContent, ...styles.mainContentDesktop})
      }}>
        <BalanceCards />

        <div className="text-center mb-5">
          <Button 
            variant="link" 
            style={styles.allTimeLink}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colors.brand.light
              e.target.style.color = '#22C55E'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = '#22C55E'
            }}
          >
            All time <i className="bi bi-chevron-right"></i>
          </Button>
        </div>

        {/* Show "Your Events" heading if loading or groups exist */}
        {(loading || (groups && groups.length > 0)) && (
          <h3 style={{
            ...styles.sectionTitle,
            color: colors.text.primary
          }}>
            Your Events
          </h3>
        )}

        {/* Show loading state while data is being fetched */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div className="spinner-border text-success mb-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: colors.text.secondary, fontSize: '0.9rem' }}>Loading your events...</p>
          </div>
        ) : groups && groups.length > 0 ? (
          <div>
            {groups.map(group => (
              <Card 
                key={group.id}
                style={{
                  ...styles.groupCard,
                  backgroundColor: colors.bg.card,
                  boxShadow: `0 4px 12px ${colors.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)'}`
                }}
                onClick={() => navigate(`/group-details?groupId=${group.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 8px 20px ${colors.isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.12)'}`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = `0 4px 12px ${colors.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)'}`
                }}
              >
                <Card.Body className="p-4">
                  <div style={styles.groupHeader}>
                    <div style={{
                      ...styles.groupIcon,
                      backgroundColor: colors.brand.light
                    }}>
                      <i className="bi bi-people-fill" style={{ color: '#22C55E', fontSize: '1.5rem' }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h5 style={{
                        ...styles.groupName,
                        color: colors.text.primary
                      }}>
                        {group.name}
                      </h5>
                      <p style={{
                        ...styles.groupMembers,
                        color: colors.text.secondary
                      }}>
                        {group.members?.length || 0} members
                        {group.description && ` • ${group.description}`}
                      </p>
                    </div>
                    <i className="bi bi-chevron-right" style={{ 
                      color: colors.text.secondary, 
                      fontSize: '1.2rem' 
                    }}></i>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </Container>

      <BottomNavigation />
    </div>
  )
}

export default Home