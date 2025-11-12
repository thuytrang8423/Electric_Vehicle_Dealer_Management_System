import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import HomePage from './components/HomePage'
import AuthPage from './components/AuthPage'
import ElectricVehicles from './components/ElectricVehicles'
import Contact from './components/Contact'
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

  const handleLoginSuccess = (user) => {
    setLoggedInUser(user)
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setLoggedInUser(null)
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage loggedInUser={loggedInUser} onLogout={handleLogout} />} />
        <Route path="/auth" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/vehicles" element={<ElectricVehicles />} />
        <Route path="/contact" element={<Contact />} />
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
