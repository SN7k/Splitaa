import { Container, Card, Button, Modal, Form, Alert, Badge, ListGroup, Nav } from 'react-bootstrap'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import DesktopNavbar from '../components/Navbar'
import BottomNavigation from '../components/BottomNavigation'
import { useTheme } from '../contexts/ThemeContext'
import { calculateSettlements, formatCurrency } from '../services/calculations'
import { useExpenses } from '../context/ExpensesContext'
import { 
  getGroupExpenses, 
  getGroupMembers, 
  addGroupMemberByEmail, 
  removeGroupMember,
  createExpense,
  updateExpense,
  deleteExpense,
  getGroup,
  createGroupInvite
} from '../services/api'

function GroupDetails() {
  const isMobile = window.innerWidth < 768
  const navigate = useNavigate()
  const { colors } = useTheme()
  const { state } = useExpenses()
  const currentUser = state.currentUser
  
  const searchParams = new URLSearchParams(window.location.search)
  const groupIdFromUrl = searchParams.get('groupId')
  
  const [activeTab, setActiveTab] = useState('expenses')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupMembers, setGroupMembers] = useState([])
  const [groupExpenses, setGroupExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [addMemberError, setAddMemberError] = useState('')
  
  const [showShareModal, setShowShareModal] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [generatingLink, setGeneratingLink] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const qrCanvasRef = useRef(null)
  
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'food',
    splitType: 'equal',
    paidBy: '',
    customSplits: {} // Format: { userId: amount }
  })
  const [expenseError, setExpenseError] = useState('')

  useEffect(() => {
    // Wait for currentUser to be available before loading group data
    if (groupIdFromUrl && currentUser) {
      loadGroupData()
    } else if (groupIdFromUrl && !currentUser) {
      // If no currentUser yet, set a small timeout to wait for context to load
      const timer = setTimeout(() => {
        if (currentUser) {
          loadGroupData()
        }
      }, 500)
      return () => clearTimeout(timer)
    } else if (!groupIdFromUrl) {
      navigate('/groups')
    }
  }, [groupIdFromUrl, currentUser])

  const loadGroupData = async () => {
    try {
      setLoading(true)
      
      const groupData = await getGroup(groupIdFromUrl)
      
      const members = await getGroupMembers(groupIdFromUrl)
      
      const expenses = await getGroupExpenses(groupIdFromUrl)
      
      // Handle different response structures
      const group = groupData?.data || groupData
      const membersList = members?.data || members || []
      const expensesList = expenses?.data || expenses || []
      
      setSelectedGroup(group)
      setGroupMembers(membersList)
      setGroupExpenses(expensesList)
      
      if (membersList && membersList.length > 0 && currentUser) {
        const currentMember = membersList.find(m => m.email === currentUser.email)
        if (currentMember) {
          setExpenseForm(prev => ({ ...prev, paidBy: currentMember.user_id || currentMember.id }))
        }
      }
    } catch (error) {
      console.error('Error loading group data:', error)
      console.error('Error details:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      setAddMemberError('Please enter an email address')
      return
    }

    try {
      await addGroupMemberByEmail(groupIdFromUrl, newMemberEmail)
      setShowAddMemberModal(false)
      setNewMemberEmail('')
      setAddMemberError('')
      loadGroupData()
    } catch (error) {
      setAddMemberError(error.message || 'Failed to add member')
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeGroupMember(groupIdFromUrl, memberId)
        loadGroupData()
      } catch (error) {
        alert('Failed to remove member')
      }
    }
  }

  const handleOpenExpenseModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense)
      
      // Convert splits array to customSplits object
      const customSplits = {}
      if (expense.splits && expense.splits.length > 0) {
        expense.splits.forEach(split => {
          customSplits[split.user_id] = split.amount
        })
      }
      
      setExpenseForm({
        description: expense.description,
        amount: expense.amount,
        category: expense.category || 'food',
        splitType: expense.split_type || 'equal',
        paidBy: expense.paid_by,
        customSplits: customSplits
      })
    } else {
      setEditingExpense(null)
      const currentMember = currentUser ? groupMembers.find(m => m.email === currentUser.email) : null
      
      // Initialize customSplits with equal distribution
      const customSplits = {}
      groupMembers.forEach(member => {
        const userId = member.user_id || member.id
        customSplits[userId] = 0
      })
      
      setExpenseForm({
        description: '',
        amount: '',
        category: 'food',
        splitType: 'equal',
        paidBy: currentMember ? (currentMember.user_id || currentMember.id) : '',
        customSplits: customSplits
      })
    }
    setExpenseError('')
    setShowExpenseModal(true)
  }

  const handleCustomSplitChange = (userId, value) => {
    const totalAmount = parseFloat(expenseForm.amount) || 0
    const newAmount = value === '' ? 0 : parseFloat(value)
    
    // Create new splits object
    const newSplits = { ...expenseForm.customSplits }
    newSplits[userId] = newAmount
    
    // Calculate remaining amount to distribute
    const remaining = totalAmount - newAmount
    
    // Find other members (excluding the one just changed)
    const otherMembers = groupMembers.filter(member => {
      const memberId = String(member.user_id || member.id)
      return memberId !== String(userId)
    })
    
    // Auto-fill remaining amount equally to other members
    if (otherMembers.length > 0 && remaining >= 0) {
      const autoAmount = remaining / otherMembers.length
      otherMembers.forEach(member => {
        const memberId = member.user_id || member.id
        newSplits[memberId] = autoAmount
      })
    }
    
    setExpenseForm({
      ...expenseForm,
      customSplits: newSplits
    })
  }

  const distributeEqually = () => {
    if (!expenseForm.amount || groupMembers.length === 0) return
    
    const perPerson = parseFloat(expenseForm.amount) / groupMembers.length
    const newSplits = {}
    
    groupMembers.forEach(member => {
      const userId = member.user_id || member.id
      newSplits[userId] = perPerson
    })
    
    setExpenseForm({
      ...expenseForm,
      customSplits: newSplits
    })
  }

  const getTotalCustomSplit = () => {
    return Object.values(expenseForm.customSplits).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0)
  }

  const handleSaveExpense = async () => {
    setExpenseError('')
    
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.paidBy) {
      setExpenseError('Please fill in all required fields')
      return
    }

    const totalAmount = parseFloat(expenseForm.amount)
    
    // Prepare splits based on split type
    let splits = []
    
    if (expenseForm.splitType === 'equal') {
      const perPerson = totalAmount / groupMembers.length
      splits = groupMembers.map(m => ({
        user_id: m.user_id || m.id,
        amount: perPerson
      }))
    } else if (expenseForm.splitType === 'custom') {
      const totalCustomSplit = getTotalCustomSplit()
      
      // Validate custom splits
      if (Math.abs(totalCustomSplit - totalAmount) > 0.01) {
        setExpenseError(`Custom splits (${formatCurrency(totalCustomSplit)}) must equal total amount (${formatCurrency(totalAmount)})`)
        return
      }
      
      splits = Object.entries(expenseForm.customSplits)
        .filter(([_, amount]) => parseFloat(amount) > 0)
        .map(([userId, amount]) => ({
          user_id: parseInt(userId),
          amount: parseFloat(amount)
        }))
      
      if (splits.length === 0) {
        setExpenseError('Please assign amounts to at least one person')
        return
      }
    }

    try {
      const expenseData = {
        group_id: parseInt(groupIdFromUrl),
        description: expenseForm.description,
        amount: totalAmount,
        category: expenseForm.category,
        split_type: expenseForm.splitType,
        paid_by: parseInt(expenseForm.paidBy),
        splits: splits
      }

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData)
      } else {
        await createExpense(expenseData)
      }

      setShowExpenseModal(false)
      setExpenseForm({
        description: '',
        amount: '',
        category: 'food',
        splitType: 'equal',
        paidBy: '',
        customSplits: {}
      })
      loadGroupData()
    } catch (error) {
      console.error('Error saving expense:', error)
      setExpenseError(error.message || 'Failed to save expense')
    }
  }

  const handleExpenseKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      if (expenseForm.description && expenseForm.amount && expenseForm.paidBy) {
        handleSaveExpense()
      }
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(expenseId)
        loadGroupData()
      } catch (error) {
        alert('Failed to delete expense')
      }
    }
  }

  const handlePayClick = (debt) => {
    // For now, navigate to payment page or show payment modal
    // You can enhance this later with actual payment integration
    alert(`Payment feature: Pay ${formatCurrency(debt.amount)} to ${debt.toName}`)
    // navigate('/payment', { state: { debt, groupId: groupIdFromUrl } })
  }

  // Calculate member balances
  const calculateMemberBalances = () => {
    const balances = {}
    
    groupMembers.forEach(member => {
      const userId = member.user_id || member.id
      balances[userId] = {
        member: member,
        balance: 0,
        paid: 0,
        owe: 0,
        owesTo: [],    // Array of { toId, toName, amount }
        owedBy: []     // Array of { fromId, fromName, amount }
      }
    })

    groupExpenses.forEach(expense => {
      const paidBy = parseInt(expense.paid_by)
      const amount = parseFloat(expense.amount)
      
      if (balances[paidBy]) {
        balances[paidBy].paid += amount
      }
      
      if (expense.splits && expense.splits.length > 0) {
        expense.splits.forEach(split => {
          const userId = parseInt(split.user_id)
          const splitAmount = parseFloat(split.amount)
          
          if (balances[userId]) {
            balances[userId].owe += splitAmount
            
            // Track bilateral debt: userId owes paidBy
            if (userId !== paidBy) {
              // Find existing debt to this person
              const existingDebt = balances[userId].owesTo.find(d => d.toId === paidBy)
              if (existingDebt) {
                existingDebt.amount += splitAmount
              } else {
                const payer = getMemberById(paidBy)
                balances[userId].owesTo.push({
                  toId: paidBy,
                  toName: payer?.name || 'Unknown',
                  amount: splitAmount
                })
              }
              
              // Track reverse: paidBy is owed by userId
              const existingCredit = balances[paidBy].owedBy.find(d => d.fromId === userId)
              if (existingCredit) {
                existingCredit.amount += splitAmount
              } else {
                const debtor = getMemberById(userId)
                balances[paidBy].owedBy.push({
                  fromId: userId,
                  fromName: debtor?.name || 'Unknown',
                  amount: splitAmount
                })
              }
            }
          }
        })
      }
    })

    // Calculate net balance (positive = owed to you, negative = you owe)
    Object.keys(balances).forEach(userId => {
      balances[userId].balance = balances[userId].paid - balances[userId].owe
    })

    return Object.values(balances)
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
  }

  const getAvatarColor = (name) => {
    const colorList = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
    const index = (name?.length || 0) % colorList.length
    return colorList[index]
  }

  const getGroupBannerGradient = (groupId, groupName) => {
    const gradients = [
      { colors: ['#FEF3C7', '#FDE68A'], name: 'yellow' },      // Yellow
      { colors: ['#DBEAFE', '#BFDBFE'], name: 'blue' },        // Blue
      { colors: ['#FCE7F3', '#FBCFE8'], name: 'pink' },        // Pink
      { colors: ['#D1FAE5', '#A7F3D0'], name: 'green' },       // Green
      { colors: ['#E0E7FF', '#C7D2FE'], name: 'indigo' },      // Indigo
      { colors: ['#FED7AA', '#FDBA74'], name: 'orange' },      // Orange
      { colors: ['#E9D5FF', '#D8B4FE'], name: 'purple' },      // Purple
      { colors: ['#FEE2E2', '#FECACA'], name: 'red' },         // Red
    ]
    
    const seed = groupId || groupName?.length || 0
    const index = seed % gradients.length
    const gradient = gradients[index]
    
    return `linear-gradient(135deg, ${gradient.colors[0]} 0%, ${gradient.colors[1]} 100%)`
  }

  const getMemberById = (userId) => {
    return groupMembers.find(m => (m.user_id || m.id) === parseInt(userId))
  }

  const handleGenerateInviteLink = async () => {
    try {
      setGeneratingLink(true)
      setLinkCopied(false)
      
      // Create invite link (optional: set expiry or max uses)
      const response = await createGroupInvite(groupIdFromUrl, {
        // expires_at: null, // Optional: set expiry date
        // max_uses: null // Optional: set max number of uses
      })
      
      const inviteData = response?.data || response
      const token = inviteData.token
      
      // Generate full invite URL
      const baseUrl = window.location.origin
      const inviteUrl = `${baseUrl}/invite/${token}`
      
      setInviteLink(inviteUrl)
      
      // Generate QR code
      try {
        const qrDataUrl = await QRCode.toDataURL(inviteUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeUrl(qrDataUrl)
      } catch (qrError) {
        console.error('Error generating QR code:', qrError)
      }
      
      setShowShareModal(true)
    } catch (error) {
      console.error('Error generating invite link:', error)
      alert('Failed to generate invite link')
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 3000)
      })
      .catch(err => {
        console.error('Failed to copy link:', err)
        alert('Failed to copy link')
      })
  }

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${selectedGroup.name}`,
          text: `You've been invited to join "${selectedGroup.name}" group!`,
          url: inviteLink
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      // Fallback to copy
      handleCopyLink()
    }
  }

  // Check if current user is admin/host
  const isCurrentUserAdmin = () => {
    if (!currentUser) return false
    const currentMember = groupMembers.find(m => m.email === currentUser.email)
    return currentMember?.role === 'admin'
  }

  const memberBalances = selectedGroup ? calculateMemberBalances() : []

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      <DesktopNavbar />

      <Container style={{
        paddingTop: isMobile ? '1rem' : '2rem',
        paddingBottom: '6rem',
        maxWidth: isMobile ? '100%' : '900px',
        padding: 0
      }}>
        {/* Header with Banner Image */}
        <div style={{
          background: getGroupBannerGradient(selectedGroup?.id, selectedGroup?.name),
          padding: '1.5rem 1.5rem 1rem',
          position: 'relative',
          minHeight: '120px',
          display: 'flex',
          alignItems: 'flex-end'
        }}>
          {/* Back Button */}
          <Button 
            variant="light"
            onClick={() => navigate('/groups')}
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.9)',
              border: 'none'
            }}
          >
            <i className="bi bi-arrow-left" style={{ fontSize: '1.2rem' }}></i>
          </Button>

          {/* Group Name */}
          <h2 style={{
            color: '#1F2937',
            fontWeight: '700',
            fontSize: '1.8rem',
            marginBottom: 0,
            zIndex: 1
          }}>
            {loading ? (
              <span style={{ opacity: 0.6 }}>
                <i className="bi bi-hourglass-split me-2"></i>
                Loading...
              </span>
            ) : selectedGroup ? (
              selectedGroup.name
            ) : (
              'Group not found'
            )}
          </h2>
        </div>

        {/* Tabs Navigation */}
        <Nav variant="tabs" style={{
          backgroundColor: colors.bg.card,
          borderBottom: `2px solid ${colors.border.primary}`,
          padding: '0 1rem'
        }}>
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'expenses'}
              onClick={() => setActiveTab('expenses')}
              style={{
                color: activeTab === 'expenses' ? '#F97316' : colors.text.secondary,
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                borderBottom: activeTab === 'expenses' ? '3px solid #F97316' : 'none',
                fontWeight: activeTab === 'expenses' ? '600' : '400',
                backgroundColor: 'transparent',
                padding: '1rem 1.5rem'
              }}
            >
              <i className="bi bi-pie-chart me-2"></i>
              Expenses
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === 'members'}
              onClick={() => setActiveTab('members')}
              style={{
                color: activeTab === 'members' ? '#F97316' : colors.text.secondary,
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                borderBottom: activeTab === 'members' ? '3px solid #F97316' : 'none',
                fontWeight: activeTab === 'members' ? '600' : '400',
                backgroundColor: 'transparent',
                padding: '1rem 1.5rem'
              }}
            >
              <i className="bi bi-people me-2"></i>
              Members
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Show loading message if still loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: colors.text.secondary }}>
              <div className="spinner-border text-primary mb-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading group data...</p>
            </div>
          )}

          {/* Show not found message if not loading and no group */}
          {!loading && !selectedGroup && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <i className="bi bi-exclamation-triangle" style={{ fontSize: '4rem', color: colors.text.secondary, marginBottom: '1rem', display: 'block' }}></i>
              <h4 style={{ color: colors.text.primary }}>Group not found</h4>
              <Button onClick={() => navigate('/groups')} className="mt-3" style={{ backgroundColor: '#22C55E', border: 'none' }}>
                Go to Groups
              </Button>
            </div>
          )}

          {/* EXPENSES TAB */}
          {!loading && selectedGroup && activeTab === 'expenses' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 style={{ color: colors.text.primary, marginBottom: 0, fontWeight: '600' }}>
                  All Expenses
                </h5>
              </div>

              {groupExpenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <i className="bi bi-receipt" style={{ fontSize: '4rem', color: colors.text.secondary, marginBottom: '1rem', display: 'block' }}></i>
                  <h5 style={{ color: colors.text.primary, marginBottom: '0.5rem' }}>No expenses yet</h5>
                  <p style={{ color: colors.text.secondary, marginBottom: '1.5rem' }}>
                    Add your first expense to start tracking
                  </p>
                </div>
              ) : (
                <div>
                  {groupExpenses.map((expense) => {
                    const paidByMember = getMemberById(expense.paid_by)
                    return (
                      <Card 
                        key={expense.id}
                        className="mb-3"
                        style={{
                          backgroundColor: colors.bg.card,
                          border: `1px solid ${colors.border.primary}`,
                          borderRadius: '12px'
                        }}
                      >
                        <Card.Body style={{ padding: '1rem' }}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 style={{ color: colors.text.primary, fontWeight: '600', marginBottom: '0.5rem' }}>
                                {expense.description}
                              </h6>
                              <div style={{ fontSize: '0.85rem', color: colors.text.secondary }}>
                                <div className="mb-1">
                                  <i className="bi bi-person-circle me-1"></i>
                                  Paid by <strong>{paidByMember?.name || 'Unknown'}</strong>
                                </div>
                                <div className="mb-1">
                                  <i className="bi bi-tag me-1"></i>
                                  {expense.category} · <i className="bi bi-calendar me-1"></i>
                                  {new Date(expense.created_at || expense.date).toLocaleDateString()}
                                </div>
                                <div>
                                  <Badge bg={expense.split_type === 'equal' ? 'success' : 'primary'} style={{ fontSize: '0.75rem' }}>
                                    {expense.split_type === 'equal' ? 'Equal Split' : 'Custom Split'}
                                  </Badge>
                                  {expense.split_type === 'equal' && groupMembers.length > 0 && (
                                    <span className="ms-2" style={{ fontSize: '0.75rem' }}>
                                      {formatCurrency(expense.amount / groupMembers.length)} per person
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="ms-3 text-end">
                              <div style={{ 
                                fontSize: '1.25rem', 
                                fontWeight: '700',
                                color: '#F97316',
                                marginBottom: '0.5rem'
                              }}>
                                {formatCurrency(expense.amount)}
                              </div>
                              {/* Only show edit/delete buttons to admin/host */}
                              {isCurrentUserAdmin() && (
                                <div>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-1"
                                    onClick={() => handleOpenExpenseModal(expense)}
                                    style={{ borderRadius: '6px', fontSize: '0.75rem' }}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    style={{ borderRadius: '6px', fontSize: '0.75rem' }}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* MEMBERS TAB */}
          {!loading && selectedGroup && activeTab === 'members' && (
            <div>
              <p style={{ color: colors.text.secondary, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Total: {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'}
              </p>

              {groupMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <i className="bi bi-people" style={{ fontSize: '4rem', color: colors.text.secondary, marginBottom: '1rem', display: 'block' }}></i>
                  <h5 style={{ color: colors.text.primary, marginBottom: '0.5rem' }}>It seems like you're the first one here.</h5>
                  <p style={{ color: colors.text.secondary, marginBottom: '1.5rem' }}>
                    Nice to be with someone.
                  </p>
                </div>
              ) : (
                <div>
                  {memberBalances.map((memberData) => {
                    const balance = memberData.balance
                    const member = memberData.member
                    const memberId = member.user_id || member.id
                    const isCurrentUser = member.email === currentUser?.email
                    
                    return (
                      <Card
                        key={memberId}
                        className="mb-3"
                        style={{
                          backgroundColor: colors.bg.card,
                          border: `1px solid ${colors.border.primary}`,
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}
                      >
                        <Card.Body style={{ padding: '1rem' }}>
                          {/* Member Info Row */}
                          <div className="d-flex align-items-center" style={{ marginBottom: '0.75rem' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              backgroundColor: getAvatarColor(member.name),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              fontWeight: '700',
                              fontSize: '1.1rem',
                              marginRight: '0.75rem',
                              flexShrink: 0
                            }}>
                              {getInitials(member.name)}
                            </div>
                            
                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                              <div className="d-flex align-items-center" style={{ marginBottom: '0.125rem' }}>
                                <h6 style={{ 
                                  color: colors.text.primary, 
                                  marginBottom: 0, 
                                  fontWeight: '600', 
                                  fontSize: '1rem',
                                  marginRight: '0.5rem'
                                }}>
                                  {member.name}
                                </h6>
                                {isCurrentUser && (
                                  <Badge bg="warning" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}>me</Badge>
                                )}
                                {member.role === 'admin' && (
                                  <Badge bg="danger" className="ms-1" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}>Host</Badge>
                                )}
                              </div>
                              <p style={{ 
                                color: colors.text.secondary, 
                                marginBottom: 0, 
                                fontSize: '0.8rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {member.email}
                              </p>
                            </div>
                          </div>

                          {/* Payment Details - Show breakdown for all members */}
                          {!isCurrentUser && memberData.owedBy && memberData.owedBy.length > 0 ? (
                            // For OTHER members: Check if current user owes them
                            <div>
                              {memberData.owedBy.map((debt, idx) => {
                                // Check if the current user is the one who owes this member
                                const currentUserId = currentUser?.id || groupMembers.find(m => m.email === currentUser?.email)?.user_id || groupMembers.find(m => m.email === currentUser?.email)?.id;
                                const currentUserOwesThisMember = debt.fromId == currentUserId;
                                
                                // Only show if current user owes this member
                                if (!currentUserOwesThisMember) return null;
                                
                                return (
                                  <div 
                                    key={idx} 
                                    className="d-flex align-items-center justify-content-between"
                                    style={{ 
                                      padding: '0.75rem',
                                      backgroundColor: colors.bg.tertiary,
                                      borderRadius: '8px',
                                      border: `1px solid ${colors.border.primary}`
                                    }}
                                  >
                                    <div className="d-flex align-items-baseline gap-2">
                                      <div style={{ 
                                        color: '#EF4444', 
                                        fontWeight: '700', 
                                        fontSize: '1.1rem'
                                      }}>
                                        {formatCurrency(debt.amount)}
                                      </div>
                                      <div style={{ color: colors.text.secondary, fontSize: '0.75rem' }}>
                                        you owe
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => handlePayClick({
                                        toId: memberId,
                                        toName: member.name,
                                        amount: debt.amount,
                                        fromId: currentUserId,
                                        fromName: currentUser?.name
                                      })}
                                      style={{
                                        backgroundColor: '#22C55E',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.5rem 1.25rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      <i className="bi bi-credit-card me-1"></i>
                                      Pay
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : !isCurrentUser && memberData.owesTo && memberData.owesTo.length > 0 ? (
                            // For OTHER members: Check if they owe current user
                            <div>
                              {memberData.owesTo.map((debt, idx) => {
                                // Check if this member owes the current user
                                const currentUserId = currentUser?.id || groupMembers.find(m => m.email === currentUser?.email)?.user_id || groupMembers.find(m => m.email === currentUser?.email)?.id;
                                const memberOwesCurrentUser = debt.toId == currentUserId;
                                
                                // Only show if they owe current user
                                if (!memberOwesCurrentUser) return null;
                                
                                return (
                                  <div 
                                    key={idx}
                                    className="d-flex align-items-center justify-content-between"
                                    style={{ 
                                      padding: '0.75rem',
                                      backgroundColor: colors.bg.tertiary,
                                      borderRadius: '8px',
                                      border: `1px solid ${colors.border.primary}`
                                    }}
                                  >
                                    <div className="d-flex align-items-baseline gap-2">
                                      <div style={{ 
                                        color: '#22C55E', 
                                        fontWeight: '700', 
                                        fontSize: '1.1rem'
                                      }}>
                                        {formatCurrency(debt.amount)}
                                      </div>
                                      <div style={{ color: colors.text.secondary, fontSize: '0.75rem' }}>
                                        you will receive
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : balance === 0 && !isCurrentUser ? (
                            <div style={{ paddingTop: '0.5rem' }}>
                              <span style={{ color: colors.text.secondary, fontSize: '0.8rem' }}>
                                <i className="bi bi-check-circle me-1"></i>
                                Settled up
                              </span>
                            </div>
                          ) : null}
                        </Card.Body>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Add Members Button - Only for Admin/Host */}
              {isCurrentUserAdmin() && (
                <div className="d-grid gap-2 mt-4">
                  <Button
                    size="lg"
                    style={{
                      backgroundColor: '#F97316',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '600',
                      padding: '1rem'
                    }}
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    <i className="bi bi-person-plus me-2"></i>
                    Add members
                  </Button>
                </div>
              )}
              <div className="d-grid gap-2 mt-4">
                <Button
                  size="lg"
                  variant="light"
                  onClick={handleGenerateInviteLink}
                  disabled={generatingLink}
                  style={{
                    borderRadius: '12px',
                    fontWeight: '600',
                    padding: '1rem',
                    color: '#F97316',
                    border: `1px solid ${colors.border.primary}`
                  }}
                >
                  <i className={`bi ${generatingLink ? 'bi-hourglass-split' : 'bi-share'} me-2`}></i>
                  {generatingLink ? 'Generating link...' : 'Share event invitation'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>

      {/* Floating Action Button - Only for Admin/Host */}
      {isCurrentUserAdmin() && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '100px' : '5rem',
          right: '2rem',
          zIndex: 1000
        }}>
          <Button
            onClick={() => handleOpenExpenseModal()}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#F97316',
              border: 'none',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}
          >
            <i className="bi bi-plus"></i>
          </Button>
        </div>
      )}

      {/* Add Member Modal */}
      <Modal show={showAddMemberModal} onHide={() => setShowAddMemberModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: colors.bg.card, borderBottom: `1px solid ${colors.border.primary}` }}>
          <Modal.Title style={{ color: colors.text.primary }}>
            <i className="bi bi-person-plus me-2"></i>
            Add Member to Group
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: colors.bg.card }}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter member's email address"
                value={newMemberEmail}
                onChange={(e) => {
                  setNewMemberEmail(e.target.value)
                  setAddMemberError('')
                }}
                isInvalid={!!addMemberError}
                style={{
                  backgroundColor: colors.bg.tertiary,
                  border: `1px solid ${colors.border.primary}`,
                  color: colors.text.primary
                }}
              />
              <Form.Control.Feedback type="invalid">
                {addMemberError}
              </Form.Control.Feedback>
            </Form.Group>
            <Alert variant="info" style={{ backgroundColor: colors.bg.tertiary, border: `1px solid ${colors.border.primary}` }}>
              <small style={{ color: colors.text.primary }}>
                <i className="bi bi-info-circle me-2"></i>
                The member must have an account with this email address
              </small>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: colors.bg.card, borderTop: `1px solid ${colors.border.primary}` }}>
          <Button variant="secondary" onClick={() => setShowAddMemberModal(false)}>
            Cancel
          </Button>
          <Button 
            style={{
              backgroundColor: '#F97316',
              border: 'none'
            }}
            onClick={handleAddMember}
          >
            <i className="bi bi-person-plus me-2"></i>
            Add Member
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Expense Modal */}
      <Modal show={showExpenseModal} onHide={() => setShowExpenseModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: colors.bg.card, borderBottom: `1px solid ${colors.border.primary}` }}>
          <Modal.Title style={{ color: colors.text.primary }}>
            <i className="bi bi-receipt me-2"></i>
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: colors.bg.card }}>
          {expenseError && (
            <Alert variant="danger" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {expenseError}
            </Alert>
          )}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>
                Description <span style={{ color: '#EF4444' }}>*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="What's this expense for? (e.g., Dinner at restaurant)"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                onKeyDown={handleExpenseKeyDown}
                autoFocus
                style={{
                  backgroundColor: colors.bg.tertiary,
                  border: `1px solid ${colors.border.primary}`,
                  color: colors.text.primary,
                  padding: '0.75rem'
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>
                Amount <span style={{ color: '#EF4444' }}>*</span>
              </Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={expenseForm.amount}
                onChange={(e) => {
                  setExpenseForm({...expenseForm, amount: e.target.value})
                  // Auto-update custom splits if in equal mode
                  if (expenseForm.splitType === 'equal' && e.target.value) {
                    const perPerson = parseFloat(e.target.value) / groupMembers.length
                    const newSplits = {}
                    groupMembers.forEach(m => {
                      newSplits[m.user_id || m.id] = perPerson
                    })
                    setExpenseForm(prev => ({...prev, customSplits: newSplits}))
                  }
                }}
                onKeyDown={handleExpenseKeyDown}
                style={{
                  backgroundColor: colors.bg.tertiary,
                  border: `1px solid ${colors.border.primary}`,
                  color: colors.text.primary,
                  padding: '0.75rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>
                Paid By <span style={{ color: '#EF4444' }}>*</span>
              </Form.Label>
              <Form.Select
                value={expenseForm.paidBy}
                onChange={(e) => setExpenseForm({...expenseForm, paidBy: e.target.value})}
                style={{
                  backgroundColor: colors.bg.tertiary,
                  border: `1px solid ${colors.border.primary}`,
                  color: colors.text.primary,
                  padding: '0.75rem'
                }}
              >
                <option value="">Select who paid</option>
                {groupMembers.map(member => {
                  const memberId = member.user_id || member.id
                  return (
                    <option key={memberId} value={memberId}>
                      {member.name} {currentUser && member.email === currentUser.email ? '(You)' : ''}
                    </option>
                  )
                })}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>Category</Form.Label>
              <Form.Select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                style={{
                  backgroundColor: colors.bg.tertiary,
                  border: `1px solid ${colors.border.primary}`,
                  color: colors.text.primary,
                  padding: '0.75rem'
                }}
              >
                <option value="food">🍽️ Food & Drinks</option>
                <option value="transport">🚗 Transport</option>
                <option value="entertainment">🎬 Entertainment</option>
                <option value="shopping">🛍️ Shopping</option>
                <option value="accommodation">🏨 Accommodation</option>
                <option value="utilities">💡 Utilities</option>
                <option value="other">📦 Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: colors.text.primary, fontWeight: '600', marginBottom: '0.75rem' }}>
                Split Type
              </Form.Label>
              <div className="d-flex gap-2 mb-3">
                <Button
                  variant={expenseForm.splitType === 'equal' ? 'primary' : 'outline-secondary'}
                  className="flex-grow-1"
                  onClick={() => {
                    // Just switch to equal mode - no need to populate customSplits
                    setExpenseForm({...expenseForm, splitType: 'equal'})
                  }}
                  style={{
                    backgroundColor: expenseForm.splitType === 'equal' ? '#F97316' : 'transparent',
                    borderColor: expenseForm.splitType === 'equal' ? '#F97316' : colors.border.primary,
                    color: expenseForm.splitType === 'equal' ? '#FFFFFF' : colors.text.primary,
                    padding: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '8px'
                  }}
                >
                  <i className="bi bi-people-fill me-2"></i>
                  Split Equally
                </Button>
                <Button
                  variant={expenseForm.splitType === 'custom' ? 'primary' : 'outline-secondary'}
                  className="flex-grow-1"
                  onClick={() => {
                    // Switch to custom and populate with equal amounts as starting point
                    const newForm = {...expenseForm, splitType: 'custom'}
                    setExpenseForm(newForm)
                    
                    // Populate custom splits if amount exists
                    if (expenseForm.amount && groupMembers.length > 0) {
                      const perPerson = parseFloat(expenseForm.amount) / groupMembers.length
                      const newSplits = {}
                      groupMembers.forEach(member => {
                        const userId = member.user_id || member.id
                        newSplits[userId] = perPerson
                      })
                      setExpenseForm({...newForm, customSplits: newSplits})
                    }
                  }}
                  style={{
                    backgroundColor: expenseForm.splitType === 'custom' ? '#F97316' : 'transparent',
                    borderColor: expenseForm.splitType === 'custom' ? '#F97316' : colors.border.primary,
                    color: expenseForm.splitType === 'custom' ? '#FFFFFF' : colors.text.primary,
                    padding: '0.75rem',
                    fontWeight: '600',
                    borderRadius: '8px'
                  }}
                >
                  <i className="bi bi-sliders me-2"></i>
                  Custom Split
                </Button>
              </div>

              {/* Equal Split Info */}
              {expenseForm.splitType === 'equal' && expenseForm.amount && groupMembers.length > 0 && (
                <Alert variant="info" style={{ 
                  backgroundColor: '#DBEAFE', 
                  border: '1px solid #3B82F6',
                  borderRadius: '8px',
                  padding: '0.75rem'
                }}>
                  <small style={{ color: '#1E40AF', fontWeight: '500' }}>
                    <i className="bi bi-info-circle me-2"></i>
                    Each of the {groupMembers.length} members will pay
                    <strong className="ms-2" style={{ fontSize: '1rem' }}>
                      {formatCurrency(parseFloat(expenseForm.amount) / groupMembers.length)}
                    </strong>
                  </small>
                </Alert>
              )}

              {/* Custom Split Section */}
              {expenseForm.splitType === 'custom' && (
                <Card style={{
                  backgroundColor: colors.bg.tertiary,
                  border: `1px solid ${colors.border.primary}`,
                  borderRadius: '12px'
                }}>
                  <Card.Body style={{ padding: '1rem' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 style={{ color: colors.text.primary, margin: 0, fontWeight: '600' }}>
                        Assign Amounts
                      </h6>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={distributeEqually}
                        style={{
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          padding: '0.25rem 0.75rem'
                        }}
                      >
                        <i className="bi bi-distribute-vertical me-1"></i>
                        Distribute Equally
                      </Button>
                    </div>
                    
                    {groupMembers.map(member => {
                      const memberId = member.user_id || member.id
                      return (
                        <div key={memberId} className="mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: getAvatarColor(member.name),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              fontWeight: '700',
                              fontSize: '0.85rem',
                              flexShrink: 0
                            }}>
                              {getInitials(member.name)}
                            </div>
                            <div className="flex-grow-1" style={{ fontSize: '0.9rem', color: colors.text.primary, fontWeight: '500' }}>
                              {member.name}
                              {currentUser && member.email === currentUser.email && (
                                <Badge bg="warning" className="ms-2" style={{ fontSize: '0.65rem' }}>You</Badge>
                              )}
                            </div>
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={expenseForm.customSplits[memberId] || ''}
                              onChange={(e) => handleCustomSplitChange(memberId, e.target.value)}
                              style={{
                                width: '120px',
                                backgroundColor: colors.bg.card,
                                border: `1px solid ${colors.border.primary}`,
                                color: colors.text.primary,
                                padding: '0.5rem',
                                textAlign: 'right',
                                fontWeight: '600'
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Custom Split Summary */}
                    {expenseForm.amount && (
                      <div style={{
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: `2px solid ${colors.border.primary}`
                      }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span style={{ color: colors.text.secondary, fontSize: '0.9rem' }}>Total Split:</span>
                          <span style={{ 
                            fontWeight: '700', 
                            fontSize: '1.1rem',
                            color: Math.abs(getTotalCustomSplit() - parseFloat(expenseForm.amount)) < 0.01 ? '#22C55E' : '#EF4444'
                          }}>
                            {formatCurrency(getTotalCustomSplit())}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-1">
                          <span style={{ color: colors.text.secondary, fontSize: '0.9rem' }}>Total Amount:</span>
                          <span style={{ fontWeight: '700', fontSize: '1.1rem', color: colors.text.primary }}>
                            {formatCurrency(parseFloat(expenseForm.amount))}
                          </span>
                        </div>
                        {Math.abs(getTotalCustomSplit() - parseFloat(expenseForm.amount)) > 0.01 && (
                          <Alert variant="warning" className="mt-2 mb-0" style={{ fontSize: '0.85rem', padding: '0.5rem' }}>
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Difference: {formatCurrency(Math.abs(getTotalCustomSplit() - parseFloat(expenseForm.amount)))}
                          </Alert>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: colors.bg.card, borderTop: `1px solid ${colors.border.primary}` }}>
          <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>
            Cancel
          </Button>
          <Button 
            style={{
              backgroundColor: '#22C55E',
              border: 'none',
              padding: '0.75rem 1.5rem',
              fontWeight: '600'
            }}
            onClick={handleSaveExpense}
            disabled={!expenseForm.description || !expenseForm.amount || !expenseForm.paidBy}
          >
            <i className="bi bi-check-circle me-2"></i>
            {editingExpense ? 'Update Expense' : 'Add Expense'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Share Invite Link Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: colors.bg.card, borderBottom: `1px solid ${colors.border.primary}` }}>
          <Modal.Title style={{ color: colors.text.primary }}>
            <i className="bi bi-qr-code me-2"></i>
            Share Invite
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: colors.bg.card, padding: '2rem' }}>
          {/* QR Code */}
          {qrCodeUrl && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                padding: '1rem',
                borderRadius: '12px',
                display: 'inline-block',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <img src={qrCodeUrl} alt="QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
              </div>
            </div>
          )}

          {/* Link Section */}
          <div style={{
            backgroundColor: colors.bg.tertiary,
            padding: '1rem',
            borderRadius: '8px',
            border: `1px solid ${colors.border.primary}`
          }}>
            <div style={{
              fontSize: '0.85rem',
              color: colors.text.primary,
              wordBreak: 'break-all',
              marginBottom: '0.75rem',
              fontFamily: 'monospace'
            }}>
              {inviteLink}
            </div>
            
            <div className="d-flex gap-2">
              <Button
                variant={linkCopied ? 'success' : 'primary'}
                onClick={handleCopyLink}
                className="flex-grow-1"
                style={{
                  borderRadius: '8px',
                  fontWeight: '600',
                  padding: '0.75rem'
                }}
              >
                <i className={`bi ${linkCopied ? 'bi-check-circle' : 'bi-clipboard'} me-2`}></i>
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </Button>
              
              {navigator.share && (
                <Button
                  variant="outline-primary"
                  onClick={handleShareLink}
                  style={{
                    borderRadius: '8px',
                    fontWeight: '600',
                    padding: '0.75rem'
                  }}
                >
                  <i className="bi bi-share"></i>
                </Button>
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <BottomNavigation />
    </div>
  )
}

export default GroupDetails
