import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import HomePage from './components/HomePage'
import AuthPage from './components/AuthPage'
import ElectricVehicles from './components/ElectricVehicles'
import Contact from './components/Contact'
import Recruitment from './components/Recruitment'
import Dealer from './components/Dealer'
import DetailDealer from './components/DetailDealer'
import Details from './components/Details'
import DashboardApp from './components/dashboard-layout/DashboardApp'
import PaymentResult from './components/common/PaymentResult'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser')) || null
    } catch {
      return null
    }
  })

  // Sync with localStorage changes (e.g., from other tabs or after login)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'currentUser') {
        try {
          const user = e.newValue ? JSON.parse(e.newValue) : null
          setLoggedInUser(user)
        } catch {
          setLoggedInUser(null)
        }
      }
    }

    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange)

    // Listen for custom event (from same tab)
    const handleUserChange = () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('currentUser')) || null
        setLoggedInUser(storedUser)
      } catch {
        setLoggedInUser(null)
      }
    }
    window.addEventListener('userStateChanged', handleUserChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userStateChanged', handleUserChange)
    }
  }, [])

  const handleLoginSuccess = (user) => {
    setLoggedInUser(user)
    // Ensure localStorage is updated
    localStorage.setItem('currentUser', JSON.stringify(user))
    // Dispatch custom event to sync state
    window.dispatchEvent(new Event('userStateChanged'))
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setLoggedInUser(null)
    // Dispatch custom event to sync state
    window.dispatchEvent(new Event('userStateChanged'))
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
        <Route path="/auth" element={
          loggedInUser
            ? <Navigate to="/dashboard" replace />
            : <AuthPage onLoginSuccess={handleLoginSuccess} />
        } />
        <Route path="/vehicles" element={<ElectricVehicles loggedInUser={loggedInUser} onLogout={handleLogout} />} />
        <Route path="/details/:id" element={<Details loggedInUser={loggedInUser} onLogout={handleLogout} />} />
        <Route path="/contact" element={<Contact loggedInUser={loggedInUser} onLogout={handleLogout} />} />
        <Route path="/recruitment" element={<Recruitment loggedInUser={loggedInUser} onLogout={handleLogout} />} />
        <Route path="/dealer" element={<Dealer loggedInUser={loggedInUser} onLogout={handleLogout} />} />
        <Route path="/detail-dealer/:id" element={<DetailDealer loggedInUser={loggedInUser} onLogout={handleLogout} />} />
        <Route path="/dashboard" element={
          loggedInUser
            ? <DashboardApp user={loggedInUser} onLogout={handleLogout} />
            : <Navigate to="/auth" replace />
        } />
        <Route path="/payment-result" element={<PaymentResult />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </Router>
  )
}

export default App
