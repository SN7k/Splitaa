import { Container, Card, Button, Row, Col, Form, Modal } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import DesktopNavbar from '../components/Navbar'
import BottomNavigation from '../components/BottomNavigation'
import { useTheme } from '../contexts/ThemeContext'

const styles = {
  accountPage: {
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
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '1.5rem'
  },
  profileSection: {
    marginBottom: '2rem'
  },
  profileCard: {
    borderRadius: '16px',
    border: 'none',
    padding: '1.5rem',
    marginBottom: '1rem'
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  userAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#22C55E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '1rem',
    fontSize: '1.5rem',
    color: '#FFFFFF',
    fontWeight: '600',
    overflow: 'hidden',
    border: '3px solid #22C55E'
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  userName: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0'
  },
  userEmail: {
    fontSize: '0.9rem',
    color: '#6B7280',
    margin: '0'
  },
  settingsCard: {
    borderRadius: '16px',
    border: 'none',
    marginBottom: '1rem'
  },
  settingItem: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  settingItemLast: {
    borderBottom: 'none'
  },
  settingIcon: {
    width: '24px',
    textAlign: 'center',
    marginRight: '1rem',
    color: '#6B7280'
  },
  settingText: {
    flex: 1,
    margin: 0,
    fontWeight: '500'
  },
  settingArrow: {
    color: '#6B7280'
  },
  logoutBtn: {
    backgroundColor: '#EF4444',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontWeight: '600',
    color: '#FFFFFF',
    width: '100%',
    marginTop: '1rem'
  },
  switchContainer: {
    display: 'flex',
    alignItems: 'center'
  }
}

function Account() {
  const isMobile = window.innerWidth < 768
  const navigate = useNavigate()
  const { colors, toggleDarkMode, isDarkMode } = useTheme()
  const { user: clerkUser } = useUser()
  const { signOut } = useClerk()
  
  const [userData, setUserData] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    const loadUserData = () => {
      const storedUser = localStorage.getItem('current_user')
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUserData(parsedUser)
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
      
      if (clerkUser) {
        const clerkUserData = {
          name: clerkUser.fullName || `${clerkUser.firstName} ${clerkUser.lastName}` || 'User',
          email: clerkUser.primaryEmailAddress?.emailAddress || 'user@example.com',
          avatar: clerkUser.imageUrl,
          clerkId: clerkUser.id
        }
        setUserData(clerkUserData)
      }
    }
    
    loadUserData()
  }, [clerkUser])

  const handleSettingClick = (setting) => {
    switch(setting) {
      case 'password':
        setShowPasswordModal(true)
        break
      case 'payments':
        break
      case 'privacy':
        break
      case 'help':
        break
      default:
        break
    }
  }

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...')
      
      // Clear all local storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('current_user')
      localStorage.removeItem('clerk_user')
      
      // Clear session storage
      sessionStorage.clear()
      
      // Sign out from Clerk if applicable
      if (clerkUser) {
        console.log('🔄 Signing out from Clerk...')
        await signOut({ redirectUrl: '/login' })
      } else {
        // If not using Clerk, navigate manually
        console.log('✅ Logout complete, redirecting...')
        navigate('/login', { replace: true })
      }
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Force navigation even if there's an error
      navigate('/login', { replace: true })
    }
  }

  const handleDarkModeToggle = (checked) => {
    toggleDarkMode()
  }

  const handlePasswordChange = () => {
    setPasswordError('')
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    
    alert('Password changed successfully!')
    setShowPasswordModal(false)
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handlePasswordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (passwordForm.currentPassword && passwordForm.newPassword && passwordForm.confirmPassword) {
        handlePasswordChange()
      }
    }
  }

  const getUserInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  if (!userData) {
    return (
      <div style={{
        ...styles.accountPage,
        backgroundColor: colors.bg.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ color: colors.text.secondary, marginTop: '1rem' }}>
            Loading your account...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      ...styles.accountPage,
      backgroundColor: colors.bg.primary
    }}>
      <DesktopNavbar />

      <Container style={{
        ...styles.mainContent,
        ...(isMobile ? styles.mainContentMobile : styles.mainContentDesktop)
      }}>
        <h2 style={{
          ...styles.pageTitle,
          color: colors.text.primary
        }}>Account</h2>

        <div style={styles.profileSection}>
          <Card style={{
            ...styles.profileCard,
            backgroundColor: colors.bg.card,
            boxShadow: `0 4px 12px ${colors.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)'}`
          }}>
            <div style={styles.profileHeader}>
              <div style={styles.userAvatar}>
                {userData.avatar ? (
                  <img 
                    src={userData.avatar} 
                    alt={userData.name}
                    style={styles.userAvatarImage}
                  />
                ) : (
                  getUserInitials(userData.name)
                )}
              </div>
              <div>
                <h3 style={{
                  ...styles.userName,
                  color: colors.text.primary
                }}>{userData.name}</h3>
                <p style={{
                  ...styles.userEmail,
                  color: colors.text.secondary
                }}>{userData.email}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card style={{
          ...styles.settingsCard,
          backgroundColor: colors.bg.card,
          boxShadow: `0 4px 12px ${colors.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)'}`
        }}>
          <div 
            style={{
              ...styles.settingItem,
              borderBottomColor: colors.border.secondary
            }}
            onClick={() => handleSettingClick('password')}
            onMouseEnter={(e) => e.target.style.backgroundColor = colors.bg.tertiary}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <i className="bi bi-lock" style={{
              ...styles.settingIcon,
              color: colors.text.secondary
            }}></i>
            <p style={{
              ...styles.settingText,
              color: colors.text.primary
            }}>Change Password</p>
            <i className="bi bi-chevron-right" style={{
              ...styles.settingArrow,
              color: colors.text.secondary
            }}></i>
          </div>
          
          <div style={{
            ...styles.settingItem,
            borderBottomColor: colors.border.secondary
          }}>
            <i className="bi bi-moon" style={{
              ...styles.settingIcon,
              color: colors.text.secondary
            }}></i>
            <p style={{
              ...styles.settingText,
              color: colors.text.primary
            }}>Dark Mode</p>
            <div style={styles.switchContainer}>
              <Form.Check 
                type="switch"
                checked={isDarkMode}
                onChange={(e) => handleDarkModeToggle(e.target.checked)}
              />
            </div>
          </div>
          
          <div style={{
            ...styles.settingItem,
            borderBottomColor: colors.border.secondary
          }}>
            <i className="bi bi-bell" style={{
              ...styles.settingIcon,
              color: colors.text.secondary
            }}></i>
            <p style={{
              ...styles.settingText,
              color: colors.text.primary
            }}>Notifications</p>
            <div style={styles.switchContainer}>
              <Form.Check 
                type="switch"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
            </div>
          </div>
          
          <div 
            style={{
              ...styles.settingItem, 
              ...styles.settingItemLast,
              borderBottomColor: colors.border.secondary
            }}
            onClick={() => handleSettingClick('payments')}
            onMouseEnter={(e) => e.target.style.backgroundColor = colors.bg.tertiary}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <i className="bi bi-credit-card" style={{
              ...styles.settingIcon,
              color: colors.text.secondary
            }}></i>
            <p style={{
              ...styles.settingText,
              color: colors.text.primary
            }}>Payment History</p>
            <i className="bi bi-chevron-right" style={{
              ...styles.settingArrow,
              color: colors.text.secondary
            }}></i>
          </div>
        </Card>

        <Card style={{
          ...styles.settingsCard,
          backgroundColor: colors.bg.card,
          boxShadow: `0 4px 12px ${colors.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)'}`
        }}>
          <div 
            style={{
              ...styles.settingItem,
              borderBottomColor: colors.border.secondary
            }}
            onClick={() => handleSettingClick('privacy')}
            onMouseEnter={(e) => e.target.style.backgroundColor = colors.bg.tertiary}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <i className="bi bi-shield-check" style={{
              ...styles.settingIcon,
              color: colors.text.secondary
            }}></i>
            <p style={{
              ...styles.settingText,
              color: colors.text.primary
            }}>Privacy & Security</p>
            <i className="bi bi-chevron-right" style={{
              ...styles.settingArrow,
              color: colors.text.secondary
            }}></i>
          </div>
          
          <div 
            style={{
              ...styles.settingItem, 
              ...styles.settingItemLast,
              borderBottomColor: colors.border.secondary
            }}
            onClick={() => handleSettingClick('help')}
            onMouseEnter={(e) => e.target.style.backgroundColor = colors.bg.tertiary}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <i className="bi bi-question-circle" style={{
              ...styles.settingIcon,
              color: colors.text.secondary
            }}></i>
            <p style={{
              ...styles.settingText,
              color: colors.text.primary
            }}>Help & Support</p>
            <i className="bi bi-chevron-right" style={{
              ...styles.settingArrow,
              color: colors.text.secondary
            }}></i>
          </div>
        </Card>

        <Button 
          style={styles.logoutBtn}
          onClick={handleLogout}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#DC2626'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#EF4444'}
        >
          <i className="bi bi-box-arrow-right me-2"></i>
          Logout
        </Button>
      </Container>

      <Modal show={showPasswordModal} onHide={() => {
        setShowPasswordModal(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setPasswordError('')
      }} centered>
        <Modal.Header closeButton style={{ backgroundColor: colors.bg.card, borderBottom: `1px solid ${colors.border.primary}` }}>
          <Modal.Title style={{ color: colors.text.primary }}>
            <i className="bi bi-lock me-2"></i>
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: colors.bg.card }}>
          {passwordError && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {passwordError}
            </div>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>Current Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                onKeyDown={handlePasswordKeyDown}
                autoFocus
                style={{
                  backgroundColor: colors.bg.tertiary,
                  border: `1px solid ${colors.border.primary}`,
                  color: colors.text.primary
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>New Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Enter new password (min 6 characters)"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                onKeyDown={handlePasswordKeyDown}
                style={{
                  backgroundColor: colors.bg.tertiary,
                  border: `1px solid ${colors.border.primary}`,
                  color: colors.text.primary
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>Confirm New Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                onKeyDown={handlePasswordKeyDown}
                style={{
                  backgroundColor: colors.bg.tertiary,
                  border: `1px solid ${colors.border.primary}`,
                  color: colors.text.primary
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: colors.bg.card, borderTop: `1px solid ${colors.border.primary}` }}>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowPasswordModal(false)
              setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              })
              setPasswordError('')
            }}
          >
            Cancel
          </Button>
          <Button 
            style={{backgroundColor: '#22C55E', border: 'none'}}
            onClick={handlePasswordChange}
            disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
          >
            <i className="bi bi-check-circle me-2"></i>
            Update Password
          </Button>
        </Modal.Footer>
      </Modal>

      <BottomNavigation />
    </div>
  )
}

export default Account