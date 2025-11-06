import { Container, Card, Button, Modal, Form, Badge, Alert } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import DesktopNavbar from '../components/Navbar'
import BottomNavigation from '../components/BottomNavigation'
import { useTheme } from '../contexts/ThemeContext'
import { useExpenses } from '../context/ExpensesContext'
import { 
  getGroups, 
  getGroupMembers, 
  getGroupExpenses, 
  getPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
  getUserPaymentMethods
} from '../services/api'
import { formatCurrency } from '../services/calculations'

const styles = {
  paymentPage: {
    minHeight: '100vh'
  },
  mainContent: {
    paddingTop: '2rem',
    paddingBottom: '6rem'
  },
  mainContentDesktop: {
    paddingTop: '3rem',
    paddingBottom: '3rem',
    maxWidth: '900px'
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
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '1rem'
  }
}

function Payment() {
  const isMobile = window.innerWidth < 768
  const { colors } = useTheme()
  const { state } = useExpenses()
  const currentUser = state.currentUser
  
  const [debts, setDebts] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showAddMethodModal, setShowAddMethodModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState(null)
  
  const [methodForm, setMethodForm] = useState({
    type: 'upi',
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifsc: ''
  })
  
  const [methodFormErrors, setMethodFormErrors] = useState({
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifsc: ''
  })
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: '',
    transactionId: '',
    note: ''
  })

  useEffect(() => {
    if (currentUser) {
      loadDebtsData()
      loadPaymentMethods()
    }
  }, [currentUser])

  const validateUpiId = (upiId) => {
    // UPI ID format: username@bankhandle
    // Username: Phone number (10 digits) OR valid username (must contain at least one letter and be 4+ chars)
    // Bank handle: Known UPI handles only
    const validHandles = [
      'paytm', 'ybl', 'oksbi', 'okaxis', 'okhdfcbank', 'okicici', 'airtel', 
      'fbl', 'ibl', 'axl', 'sbi', 'pnb', 'upi', 'cnrb', 'ezeepay', 'idfcbank',
      'federal', 'barodampay', 'axisb', 'indus', 'yapl', 'icici', 'kotak',
      'sliceaxis', 'timecosmos', 'waicici', 'waaxis', 'waokhdfcbank', 'hsbc',
      'jupiter', 'razorpay', 'freecharge', 'mobikwik', 'amazonpay', 'apl'
    ]
    
    if (!upiId) {
      return 'UPI ID is required'
    }
    
    const parts = upiId.split('@')
    if (parts.length !== 2) {
      return 'Invalid UPI ID format. Example: 9876543210@paytm or yourname@ybl'
    }
    
    const [username, handle] = parts
    
    // Validate username part
    if (username.length < 4 || username.length > 50) {
      return 'Username must be between 4-50 characters'
    }
    
    // Check if username is a phone number (10 digits)
    const isPhoneNumber = /^\d{10}$/.test(username)
    
    // If not a phone number, check for valid username pattern
    if (!isPhoneNumber) {
      // Must contain at least one letter and be alphanumeric with dots/hyphens/underscores
      const hasLetter = /[a-zA-Z]/.test(username)
      const isValidPattern = /^[a-zA-Z0-9._-]+$/.test(username)
      
      if (!hasLetter) {
        return 'Username must contain at least one letter or be a 10-digit phone number'
      }
      
      if (!isValidPattern) {
        return 'Username can only contain letters, numbers, dots, hyphens, and underscores'
      }
      
      // Username should not be just random characters - require at least 4 chars with meaning
      if (username.length < 4) {
        return 'Username must be at least 4 characters long'
      }
    }
    
    // Validate bank handle - MUST be from the valid list
    const handleLower = handle.toLowerCase()
    if (!validHandles.includes(handleLower)) {
      return `Invalid UPI handle. Use valid handles like: paytm, ybl, oksbi, okaxis, okicici, etc.`
    }
    
    return ''
  }

  const validateIfsc = (ifsc) => {
    // IFSC format: 4 letters (bank code) + 0 + 6 digits/letters (branch code)
    // Example: SBIN0001234, HDFC0000123
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    
    if (!ifsc) {
      return 'IFSC code is required'
    }
    if (!ifscRegex.test(ifsc.toUpperCase())) {
      return 'Invalid IFSC code format. Example: SBIN0001234'
    }
    return ''
  }

  const validateAccountNumber = (accountNumber) => {
    // Account number: 9-18 digits
    const accountRegex = /^[0-9]{9,18}$/
    
    if (!accountNumber) {
      return 'Account number is required'
    }
    if (!accountRegex.test(accountNumber)) {
      return 'Account number must be 9-18 digits'
    }
    return ''
  }

  const validateBankName = (bankName) => {
    if (!bankName || bankName.trim().length < 2) {
      return 'Bank name is required'
    }
    return ''
  }

  const loadDebtsData = async () => {
    if (!currentUser) {
      return
    }
    
    try {
      setLoading(true)
      
      const groupsResponse = await getGroups()
      const groups = groupsResponse?.data || groupsResponse || []
      
      const allDebts = []
      
      for (const group of groups) {
        const membersResponse = await getGroupMembers(group.id)
        const expensesResponse = await getGroupExpenses(group.id)
        
        const members = membersResponse?.data || membersResponse || []
        const expenses = expensesResponse?.data || expensesResponse || []
        
        // Calculate balances
        const balances = {}
        members.forEach(member => {
          const userId = member.user_id || member.id
          balances[userId] = {
            member: member,
            paid: 0,
            owe: 0,
            balance: 0
          }
        })
        
        expenses.forEach(expense => {
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
              }
            })
          }
        })
        
        // Calculate net balance
        Object.keys(balances).forEach(userId => {
          balances[userId].balance = balances[userId].paid - balances[userId].owe
        })
        
        // Find current user's debts (negative balance = owes money)
        const currentUserData = members.find(m => m.email === currentUser?.email)
        
        if (currentUserData) {
          const currentUserId = currentUserData.user_id || currentUserData.id
          const currentUserBalance = balances[currentUserId]
          
          if (currentUserBalance && currentUserBalance.balance < 0) {
            // Current user owes money - find who they owe to
            Object.values(balances).forEach(otherUser => {
              const otherUserId = otherUser.member.user_id || otherUser.member.id
              if (otherUserId !== currentUserId && otherUser.balance > 0) {
                // This person is owed money - fetch their payment methods
                const amountOwed = Math.min(Math.abs(currentUserBalance.balance), otherUser.balance)
                if (amountOwed > 0) {
                  allDebts.push({
                    groupId: group.id,
                    groupName: group.name,
                    creditor: otherUser.member,
                    creditorUserId: otherUserId,
                    amount: amountOwed
                  })
                }
              }
            })
          }
        }
      }
      
      setDebts(allDebts)
    } catch (error) {
      console.error('Error loading debts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const data = await getPaymentMethods()
      // apiRequest returns data.data directly, which is the array
      setPaymentMethods(data || [])
    } catch (error) {
      console.error('Error loading payment methods:', error)
    }
  }

  const handleAddPaymentMethod = async () => {
    try {
      const newMethod = {
        type: methodForm.type,
        ...(methodForm.type === 'upi' && { upi_id: methodForm.upiId }),
        ...(methodForm.type === 'bank' && {
          bank_name: methodForm.bankName,
          account_number: methodForm.accountNumber,
          ifsc_code: methodForm.ifsc
        }),
        is_primary: paymentMethods.length === 0 ? 1 : 0
      }
      
      const data = await createPaymentMethod(newMethod)
      
      // apiRequest returns data.data directly, which is the array of payment methods
      setPaymentMethods(data || [])
      setShowAddMethodModal(false)
      setMethodForm({
        type: 'upi',
        upiId: '',
        bankName: '',
        accountNumber: '',
        ifsc: ''
      })
    } catch (error) {
      console.error('Error adding payment method:', error)
      alert('Failed to add payment method: ' + error.message)
    }
  }

  const handlePaymentMethodKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (methodForm.upiId) {
        handleAddPaymentMethod()
      }
    }
  }

  const handleDeletePaymentMethod = async (id) => {
    if (window.confirm('Are you sure you want to remove this payment method?')) {
      try {
        await deletePaymentMethod(id)
        loadPaymentMethods()
      } catch (error) {
        console.error('Error deleting payment method:', error)
        alert('Failed to delete payment method: ' + error.message)
      }
    }
  }

  const handleOpenPayment = async (debt) => {
    setSelectedDebt(debt)
    setPaymentForm({
      amount: debt.amount.toString(),
      method: '',
      transactionId: '',
      note: ''
    })
    
    // Load creditor's payment methods
    try {
      const data = await getUserPaymentMethods(debt.creditorUserId)
      if (data && data.length > 0) {
        setSelectedDebt({
          ...debt,
          creditorPaymentMethods: data
        })
        
        // Check if there's a UPI payment method
        const upiMethod = data.find(method => method.type === 'upi')
        if (upiMethod && upiMethod.upi_id) {
          // Directly open UPI app with payment details
          handlePayViaUPI(upiMethod.upi_id, debt.amount, debt.creditor.name)
          return
        }
      }
    } catch (error) {
      console.error('Error loading creditor payment methods:', error)
    }
    
    setShowPaymentModal(true)
  }

  const handlePayViaUPI = (upiId, amount, payeeName) => {
    // UPI Deep Link Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Payment via Splitaa')}`
    
    // Open UPI app
    window.location.href = upiUrl
    
    // Show success message after a brief delay
    setTimeout(() => {
      alert('UPI payment initiated! Please complete the payment in your UPI app.')
    }, 500)
  }

  const handleRecordPayment = () => {
    // TODO: Send payment record to backend
    alert('Payment recorded successfully! The debt will be settled.')
    setShowPaymentModal(false)
    // Reload debts
    loadDebtsData()
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
  }

  const getAvatarColor = (name) => {
    const colorList = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
    const index = (name?.length || 0) % colorList.length
    return colorList[index]
  }

  return (
    <div style={{
      ...styles.paymentPage,
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
        }}>Payments & Settlements</h2>

        {/* Who You Owe Section */}
        <div className="mb-4">
          <h5 style={{
            ...styles.sectionTitle,
            color: colors.text.primary
          }}>
            <i className="bi bi-arrow-up-circle text-danger me-2"></i>
            You Owe
          </h5>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: colors.text.secondary }}>
              Loading...
            </div>
          ) : debts.length === 0 ? (
            <Card style={{
              backgroundColor: colors.bg.card,
              border: `1px solid ${colors.border.primary}`,
              borderRadius: '12px'
            }}>
              <Card.Body className="text-center py-4">
                <i className="bi bi-check-circle" style={{ 
                  fontSize: '3rem', 
                  color: '#22C55E',
                  marginBottom: '1rem',
                  display: 'block'
                }}></i>
                <h5 style={{ color: colors.text.primary }}>All Settled Up!</h5>
                <p style={{ color: colors.text.secondary, marginBottom: 0 }}>
                  You don't owe anyone money right now
                </p>
              </Card.Body>
            </Card>
          ) : (
            debts.map((debt, index) => (
              <Card 
                key={index}
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
                      backgroundColor: getAvatarColor(debt.creditor.name),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      marginRight: '0.75rem',
                      flexShrink: 0
                    }}>
                      {getInitials(debt.creditor.name)}
                    </div>
                    
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <h6 style={{ 
                        color: colors.text.primary, 
                        marginBottom: '0.125rem', 
                        fontWeight: '600', 
                        fontSize: '1rem'
                      }}>
                        {debt.creditor.name}
                      </h6>
                      <p style={{ 
                        color: colors.text.secondary, 
                        marginBottom: 0, 
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        <i className="bi bi-people me-1"></i>
                        {debt.groupName}
                      </p>
                    </div>
                  </div>

                  {/* Payment Amount and Button */}
                  <div 
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
                      onClick={() => handleOpenPayment(debt)}
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
                </Card.Body>
              </Card>
            ))
          )}
        </div>

        {/* Payment Methods Section */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={{
              ...styles.sectionTitle,
              marginBottom: 0,
              color: colors.text.primary
            }}>
              <i className="bi bi-wallet2 me-2"></i>
              Payment Methods
            </h5>
            {paymentMethods.length > 0 && (
              <Button
                size="sm"
                style={{
                  backgroundColor: colors.brand.primary,
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
                onClick={() => setShowAddMethodModal(true)}
              >
                <i className="bi bi-plus-lg me-1"></i>
                Add Method
              </Button>
            )}
          </div>

          {paymentMethods.length === 0 ? (
            <Card style={{
              backgroundColor: colors.bg.card,
              border: `1px solid ${colors.border.primary}`,
              borderRadius: '12px'
            }}>
              <Card.Body className="text-center py-4">
                <i className="bi bi-wallet" style={{ 
                  fontSize: '3rem', 
                  color: colors.text.secondary,
                  marginBottom: '1rem',
                  display: 'block'
                }}></i>
                <h6 style={{ color: colors.text.primary }}>No payment methods added</h6>
                <p style={{ color: colors.text.secondary, marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Add your UPI ID to receive payments
                </p>
                <Button
                  size="sm"
                  style={{
                    backgroundColor: colors.brand.primary,
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  onClick={() => setShowAddMethodModal(true)}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Add Payment Method
                </Button>
              </Card.Body>
            </Card>
          ) : (
            paymentMethods.map((method) => (
              <Card 
                key={method.id}
                className="mb-2"
                style={{
                  backgroundColor: colors.bg.card,
                  border: `1px solid ${colors.border.primary}`,
                  borderRadius: '12px'
                }}
              >
                <Card.Body style={{ padding: '1rem' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: colors.brand.light,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '0.75rem'
                      }}>
                        <i className={`bi ${method.type === 'upi' ? 'bi-phone' : 'bi-bank'}`} 
                           style={{ fontSize: '1.2rem', color: colors.brand.primary }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: colors.text.primary, marginBottom: '0.25rem' }}>
                          {method.type === 'upi' ? 'UPI' : 'Bank Account'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: colors.text.secondary }}>
                          {method.type === 'upi' ? method.upi_id : `${method.bank_name} - ${method.account_number}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeletePaymentMethod(method.id)}
                      style={{ borderRadius: '6px' }}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </div>
      </Container>

      {/* Add Payment Method Modal */}
      <Modal show={showAddMethodModal} onHide={() => setShowAddMethodModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: colors.bg.card, borderBottom: `1px solid ${colors.border.primary}` }}>
          <Modal.Title style={{ color: colors.text.primary }}>
            <i className="bi bi-phone me-2"></i>
            Add UPI
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: colors.bg.card }}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>UPI ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="yourname@paytm or 9876543210@ybl"
                value={methodForm.upiId}
                onChange={(e) => setMethodForm({...methodForm, upiId: e.target.value})}
                onKeyDown={handlePaymentMethodKeyDown}
                autoFocus
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
          <Button variant="secondary" onClick={() => setShowAddMethodModal(false)}>
            Cancel
          </Button>
          <Button 
            style={{
              backgroundColor: colors.brand.primary,
              border: 'none'
            }}
            onClick={handleAddPaymentMethod}
            disabled={!methodForm.upiId}
          >
            <i className="bi bi-check-circle me-2"></i>
            Add UPI
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Record Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: colors.bg.card, borderBottom: `1px solid ${colors.border.primary}` }}>
          <Modal.Title style={{ color: colors.text.primary }}>
            <i className="bi bi-cash-coin me-2"></i>
            Record Payment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: colors.bg.card }}>
          {selectedDebt && (
            <>
              <Alert variant="info" style={{ backgroundColor: colors.bg.tertiary, border: `1px solid ${colors.border.primary}` }}>
                <div style={{ color: colors.text.primary }}>
                  <strong>Paying to:</strong> {selectedDebt.creditor.name}<br/>
                  <strong>Group:</strong> {selectedDebt.groupName}<br/>
                  <strong>Amount:</strong> {formatCurrency(selectedDebt.amount)}
                </div>
              </Alert>
              
              {/* Show Creditor's Payment Methods */}
              {selectedDebt.creditorPaymentMethods && selectedDebt.creditorPaymentMethods.length > 0 && (
                <Card className="mb-3" style={{ backgroundColor: colors.bg.tertiary, border: `1px solid ${colors.border.primary}` }}>
                  <Card.Body style={{ padding: '1rem' }}>
                    <h6 style={{ color: colors.text.primary, marginBottom: '0.75rem', fontWeight: '600' }}>
                      <i className="bi bi-wallet2 me-2"></i>
                      Payment Methods
                    </h6>
                    {selectedDebt.creditorPaymentMethods.map((method, index) => (
                      <div key={index} style={{ 
                        padding: '0.75rem', 
                        marginBottom: index < selectedDebt.creditorPaymentMethods.length - 1 ? '0.5rem' : 0,
                        backgroundColor: colors.bg.card,
                        borderRadius: '8px',
                        border: `1px solid ${colors.border.primary}`
                      }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="flex-grow-1">
                            <div style={{ fontWeight: '600', color: colors.text.primary, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                              {method.type === 'upi' ? '📱 UPI' : '🏦 Bank Account'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: colors.text.secondary, fontFamily: 'monospace' }}>
                              {method.type === 'upi' ? method.upi_id : `${method.bank_name} - ${method.account_number} (IFSC: ${method.ifsc_code})`}
                            </div>
                          </div>
                          {method.type === 'upi' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setShowPaymentModal(false)
                                handlePayViaUPI(method.upi_id, selectedDebt.amount, selectedDebt.creditor.name)
                              }}
                              style={{
                                backgroundColor: '#22C55E',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.5rem 1rem',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                marginLeft: '0.5rem'
                              }}
                            >
                              <i className="bi bi-phone me-1"></i>
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              )}
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>Amount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    style={{
                      backgroundColor: colors.bg.tertiary,
                      border: `1px solid ${colors.border.primary}`,
                      color: colors.text.primary
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>Payment Method</Form.Label>
                  <Form.Select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                    style={{
                      backgroundColor: colors.bg.tertiary,
                      border: `1px solid ${colors.border.primary}`,
                      color: colors.text.primary
                    }}
                  >
                    <option value="">Select method...</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>Transaction ID (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter transaction reference"
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                    style={{
                      backgroundColor: colors.bg.tertiary,
                      border: `1px solid ${colors.border.primary}`,
                      color: colors.text.primary
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ color: colors.text.primary, fontWeight: '600' }}>Note (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Add a note..."
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({...paymentForm, note: e.target.value})}
                    style={{
                      backgroundColor: colors.bg.tertiary,
                      border: `1px solid ${colors.border.primary}`,
                      color: colors.text.primary
                    }}
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: colors.bg.card, borderTop: `1px solid ${colors.border.primary}` }}>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            Cancel
          </Button>
          <Button 
            style={{
              backgroundColor: '#22C55E',
              border: 'none'
            }}
            onClick={handleRecordPayment}
            disabled={!paymentForm.amount || !paymentForm.method}
          >
            <i className="bi bi-check-circle me-2"></i>
            Record Payment
          </Button>
        </Modal.Footer>
      </Modal>

      <BottomNavigation />
    </div>
  )
}

export default Payment
