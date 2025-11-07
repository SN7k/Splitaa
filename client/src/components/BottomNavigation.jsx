import { useNavigate, useLocation } from 'react-router-dom'
import { Container, Button, Card } from 'react-bootstrap'
import { navigationItems, isActivePath } from '../config/navigation'
import CreateGroupModal from './CreateGroupModal'
import QRScanner from './QRScanner'
import { useTheme } from '../contexts/ThemeContext'
import { useState } from 'react'

const styles = {
  bottomNav: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    zIndex: '1000'
  },
  bottomNavItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#6B7280',
    textDecoration: 'none',
    padding: '8px 4px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.75rem',
    minWidth: '60px'
  },
  bottomNavItemActive: {
    color: '#22C55E'
  },
  bottomNavIcon: {
    fontSize: '1.2rem',
    marginBottom: '2px'
  },
  bottomNavText: {
    fontWeight: '500',
    fontSize: '0.75rem'
  },
  bottomNavCreate: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#22C55E',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    transition: 'all 0.3s ease',
    margin: '0 8px'
  },
  bottomSheetOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1050,
    opacity: 0,
    transition: 'opacity 0.3s ease'
  },
  bottomSheetOverlayVisible: {
    opacity: 1
  },
  bottomSheet: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    padding: '1.5rem',
    paddingBottom: '2rem',
    zIndex: 1051,
    transform: 'translateY(100%)',
    transition: 'transform 0.3s ease',
    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12)'
  },
  bottomSheetVisible: {
    transform: 'translateY(0)'
  },
  bottomSheetHeader: {
    textAlign: 'center',
    marginBottom: '1.5rem'
  },
  bottomSheetTitle: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0'
  },
  bottomSheetHandle: {
    width: '40px',
    height: '4px',
    backgroundColor: '#E5E7EB',
    borderRadius: '2px',
    margin: '0 auto 1rem auto'
  },
  optionCard: {
    borderRadius: '16px',
    border: '1px solid #F3F4F6',
    marginBottom: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#FFFFFF'
  },
  optionIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    color: '#22C55E'
  },
  optionTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '0.5rem'
  },
  optionDescription: {
    fontSize: '0.9rem',
    color: '#6B7280',
    margin: '0'
  }
}

function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { colors } = useTheme()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)

  const handleCreateEvent = () => {
    setShowCreateModal(false)
    setShowGroupModal(true)
  }

  const handleJoinQR = () => {
    setShowCreateModal(false)
    setShowQRScanner(true)
  }

  const handleOverlayClick = () => {
    setShowCreateModal(false)
  }

  return (
    <>
      <div style={{
        ...styles.bottomNav,
        backgroundColor: colors.bg.secondary,
        borderTop: `1px solid ${colors.border.primary}`
      }} className="d-md-none">
        <Container>
          <div className="d-flex justify-content-around align-items-center py-2">
            {navigationItems.map((navItem, index) => (
              <div key={navItem.id} style={{ display: 'contents' }}>
                <Button 
                  variant="link" 
                  style={{
                    ...styles.bottomNavItem, 
                    ...(isActivePath(location.pathname, navItem.path) ? styles.bottomNavItemActive : {}),
                    color: isActivePath(location.pathname, navItem.path) ? '#22C55E' : colors.text.secondary
                  }}
                  onClick={() => navigate(navItem.path)}
                  onMouseEnter={(e) => {
                    if (!isActivePath(location.pathname, navItem.path)) {
                      e.target.style.color = '#22C55E'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActivePath(location.pathname, navItem.path)) {
                      e.target.style.color = colors.text.secondary
                    }
                  }}
                >
                  <i className={navItem.mobileIcon} style={styles.bottomNavIcon}></i>
                  <span style={styles.bottomNavText}>{navItem.label}</span>
                </Button>
                {index === 1 && (
                  <>
                    <Button 
                      style={styles.bottomNavCreate}
                      onClick={() => setShowCreateModal(true)}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#16A34A'
                        e.target.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#22C55E'
                        e.target.style.transform = 'scale(1)'
                      }}
                    >
                      <i className="bi bi-plus-lg"></i>
                    </Button>
                    <Button 
                      variant="link" 
                      style={{
                        ...styles.bottomNavItem,
                        color: colors.text.secondary
                      }}
                      onClick={() => navigate('/payments')}
                      onMouseEnter={(e) => {
                        e.target.style.color = '#22C55E'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = colors.text.secondary
                      }}
                    >
                      <i className="bi bi-credit-card" style={styles.bottomNavIcon}></i>
                      <span style={styles.bottomNavText}>Payment</span>
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </Container>
      </div>

      {showCreateModal && (
        <div 
          style={{
            ...styles.bottomSheetOverlay,
            ...(showCreateModal ? styles.bottomSheetOverlayVisible : {})
          }}
          onClick={handleOverlayClick}
        />
      )}

      <div 
        style={{
          ...styles.bottomSheet,
          backgroundColor: colors.bg.secondary,
          ...(showCreateModal ? styles.bottomSheetVisible : {})
        }}
      >
        <div style={{
          ...styles.bottomSheetHandle,
          backgroundColor: colors.border.primary
        }}></div>
        <div style={styles.bottomSheetHeader}>
          <h4 style={{
            ...styles.bottomSheetTitle,
            color: colors.text.primary
          }}>Quick Actions</h4>
        </div>

        <Card 
          style={{
            ...styles.optionCard,
            backgroundColor: colors.bg.card,
            border: `1px solid ${colors.border.secondary}`
          }}
          onClick={handleCreateEvent}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = `0 4px 12px ${colors.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)'}`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Card.Body className="p-4 text-center">
            <i className="bi bi-plus-circle" style={styles.optionIcon}></i>
            <h5 style={{
              ...styles.optionTitle,
              color: colors.text.primary
            }}>Create New Event</h5>
            <p style={{
              ...styles.optionDescription,
              color: colors.text.secondary
            }}>Start a new group expense or event</p>
          </Card.Body>
        </Card>

        <Card 
          style={{
            ...styles.optionCard,
            backgroundColor: colors.bg.card,
            border: `1px solid ${colors.border.secondary}`
          }}
          onClick={handleJoinQR}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = `0 4px 12px ${colors.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)'}`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Card.Body className="p-4 text-center">
            <i className="bi bi-qr-code-scan" style={styles.optionIcon}></i>
            <h5 style={{
              ...styles.optionTitle,
              color: colors.text.primary
            }}>Join via QR</h5>
            <p style={{
              ...styles.optionDescription,
              color: colors.text.secondary
            }}>Scan QR code to join an existing event</p>
          </Card.Body>
        </Card>
      </div>

      <CreateGroupModal 
        show={showGroupModal} 
        onHide={() => setShowGroupModal(false)} 
      />

      {showQRScanner && (
        <QRScanner onClose={() => setShowQRScanner(false)} />
      )}
    </>
  )
}

export default BottomNavigation