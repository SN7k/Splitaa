import { Routes, Route } from 'react-router-dom'
import { navigationItems } from './config/navigation'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Groups from './pages/Groups'
import Account from './pages/Account'
import Payment from './pages/Payment'
import GroupDetails from './pages/GroupDetails'
import Dashboard from './pages/Dashboard'
import SSOCallback from './pages/SSOCallback'
import JoinGroup from './pages/JoinGroup'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/sso-callback" element={<SSOCallback />} />
        <Route path="/join/:token" element={<JoinGroup />} />
        
        {/* Protected Routes */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/group-details" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Legacy navigation items routes */}
        {navigationItems.map(navItem => (
          <Route 
            key={navItem.id} 
            path={navItem.path} 
            element={
              <ProtectedRoute>
                {navItem.id === 'home' ? <Home /> :
                 navItem.id === 'groups' ? <Groups /> :
                 navItem.id === 'account' ? <Account /> : null}
              </ProtectedRoute>
            } 
          />
        ))}
      </Routes>
    </div>
  )
}

export default App