import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { ExpensesProvider } from './context/ExpensesContext'
import { ClerkAuthProvider } from './components/ClerkAuth'
import { registerServiceWorker, setupInstallPrompt, preventZoom } from './utils/pwaUtils'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'

// Register Service Worker for PWA
registerServiceWorker()

// Setup PWA install prompt
setupInstallPrompt()

// Prevent zoom on iOS for better app experience
preventZoom()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkAuthProvider>
      <ThemeProvider>
        <ExpensesProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ExpensesProvider>
      </ThemeProvider>
    </ClerkAuthProvider>
  </StrictMode>,
)