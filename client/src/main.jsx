import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { ExpensesProvider } from './context/ExpensesContext'
import { ClerkAuthProvider } from './components/ClerkAuth'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'

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