import { Container, Card, Button, Badge, Row, Col } from 'react-bootstrap'
import DesktopNavbar from '../components/Navbar'
import BottomNavigation from '../components/BottomNavigation'
import CreateGroupModal from '../components/CreateGroupModal'
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useExpenses } from '../context/ExpensesContext'
import { deleteGroup } from '../services/api'

const styles = {
  groupsPage: {
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
    marginBottom: '1.5rem'
  },
  groupCard: {
    borderRadius: '16px',
    border: 'none',
    marginBottom: '1rem',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem'
  },
  groupName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    margin: '0'
  },
  groupMembers: {
    fontSize: '0.85rem',
    margin: '0'
  },
  balanceSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem'
  },
  balanceAmount: {
    fontSize: '1rem',
    fontWeight: '600'
  },
  positiveBalance: {
    color: '#22C55E'
  },
  negativeBalance: {
    color: '#EF4444'
  },
  neutralBalance: {
    color: '#9CA3AF'
  },
  settleButton: {
    backgroundColor: '#22C55E',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#FFFFFF'
  },
  createGroupButton: {
    backgroundColor: '#22C55E',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontWeight: '600',
    color: '#FFFFFF',
    width: '100%',
    marginBottom: '2rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem'
  },
  emptyIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem'
  },
  groupIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '1rem'
  }
}

function Groups() {
  const isMobile = window.innerWidth < 768
  const navigate = useNavigate()
  const { colors } = useTheme()
  const { state, refreshData } = useExpenses()
  const { groups, currentUser, loading } = state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true)
      searchParams.delete('create')
      setSearchParams(searchParams)
    }
  }, [searchParams, setSearchParams])

  // Refresh data when component mounts
  useEffect(() => {
    refreshData()
  }, [])

  // Check if current user is admin of a specific group
  const isUserAdminOfGroup = (group) => {
    if (!currentUser || !group.members) return false
    const currentMember = group.members.find(m => m.email === currentUser.email)
    return currentMember?.role === 'admin'
  }

  // Get member names from group
  const getMemberNames = (group) => {
    if (!group.members || group.members.length === 0) return []
    return group.members.map(m => m.name || m.email)
  }

  // Calculate balance for current user in a group
  const getUserBalanceInGroup = (groupId) => {
    if (!currentUser || !state.expenses) return 0
    
    // Filter expenses for this group
    const groupExpenses = state.expenses.filter(e => e.group_id === groupId)
    
    let balance = 0
    
    groupExpenses.forEach(expense => {
      const totalAmount = parseFloat(expense.amount) || 0
      const paidBy = expense.paid_by
      
      // If I paid, I get credited
      if (paidBy === currentUser.id) {
        balance += totalAmount
      }
      
      // Deduct my share from splits
      if (expense.splits && Array.isArray(expense.splits)) {
        const mySplit = expense.splits.find(s => s.user_id === currentUser.id)
        if (mySplit) {
          balance -= parseFloat(mySplit.amount) || 0
        }
      }
    })
    
    return balance
  }

  const getBalanceColor = (balance, type) => {
    if (balance === 0) return styles.neutralBalance
    if (type === 'owed') return styles.positiveBalance
    return styles.negativeBalance
  }

  const getBalanceText = (balance, type) => {
    if (balance === 0) return 'Settled up'
    if (type === 'owed') return `You are owed ₹${balance.toFixed(2)}`
    return `You owe ₹${Math.abs(balance).toFixed(2)}`
  }

  const handleDeleteGroup = async (groupId, groupName) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${groupName}"? This will delete all expenses in this group. This action cannot be undone.`)
    
    if (!confirmed) return
    
    try {
      console.log('Deleting group:', groupId)
      await deleteGroup(groupId)
      console.log('✅ Group deleted successfully')
      
      window.location.reload()
    } catch (error) {
      console.error('❌ Error deleting group:', error)
      alert('Failed to delete group: ' + (error.message || 'Unknown error'))
    }
  }

  return (
    <div style={{
      ...styles.groupsPage,
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
        }}>Your Groups</h2>

        <Button 
          style={styles.createGroupButton}
          onClick={() => setShowCreateModal(true)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#16A34A'
            e.target.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#22C55E'
            e.target.style.transform = 'translateY(0)'
          }}
        >
          <i className="bi bi-plus-lg me-2"></i>Create New Group
        </Button>

        {loading ? (
          <div style={styles.emptyState}>
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: colors.text.secondary, marginTop: '1rem' }}>Loading your groups...</p>
          </div>
        ) : groups.length > 0 ? (
          <div>
            {groups.map(group => {
              const userBalance = getUserBalanceInGroup(group.id)
              const balanceText = userBalance > 0 
                ? `+₹${userBalance.toFixed(2)}`
                : userBalance < 0
                ? `-₹${Math.abs(userBalance).toFixed(2)}`
                : '₹0.00'
              const balanceColor = userBalance > 0 
                ? '#22C55E'  // Green for positive (owed to you)
                : userBalance < 0 
                ? '#EF4444'  // Red for negative (you owe)
                : colors.text.secondary
              
              return (
              <Card 
                key={group.id}
                style={{
                  ...styles.groupCard,
                  backgroundColor: colors.bg.card,
                  boxShadow: `0 4px 12px ${colors.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)'}`
                }}
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
                    <div className="d-flex align-items-center flex-grow-1">
                      <div style={{
                        ...styles.groupIcon,
                        backgroundColor: colors.brand.light
                      }}>
                        <i className="bi bi-people" style={{ color: '#22C55E', fontSize: '1.2rem' }}></i>
                      </div>
                      <div className="flex-grow-1">
                        <h5 style={{
                          ...styles.groupName,
                          color: colors.text.primary
                        }}>{group.name}</h5>
                        <p style={{
                          ...styles.groupMembers,
                          color: colors.text.secondary
                        }}>
                          {group.members?.length || 0} members: {getMemberNames(group).join(', ')}
                        </p>
                      </div>
                    </div>
                    {/* Delete button - Only for admin/host */}
                    {isUserAdminOfGroup(group) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGroup(group.id, group.name)
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = colors.isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent'
                        }}
                        title="Delete group"
                      >
                        <i className="bi bi-trash" style={{ fontSize: '1.1rem' }}></i>
                      </button>
                    )}
                  </div>
                  
                  <div style={styles.balanceSection}>
                    <div>
                      <span 
                        style={{
                          ...styles.balanceAmount,
                          color: balanceColor,
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}
                      >
                        {balanceText}
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      style={styles.settleButton}
                      onClick={() => navigate(`/group-details?groupId=${group.id}`)}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#16A34A'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#22C55E'
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )})}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{
              ...styles.emptyIcon,
              backgroundColor: colors.brand.light
            }}>
              <i className="bi bi-people" style={{ fontSize: '2rem', color: '#22C55E' }}></i>
            </div>
            <h4 style={{ color: colors.text.primary }}>No groups yet</h4>
            <p style={{ color: colors.text.secondary }}>Create a group to start splitting expenses with friends</p>
          </div>
        )}
      </Container>

      <CreateGroupModal 
        show={showCreateModal} 
        onHide={() => setShowCreateModal(false)} 
      />

      <BottomNavigation />
    </div>
  )
}

export default Groups