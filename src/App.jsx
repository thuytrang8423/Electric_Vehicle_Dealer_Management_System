import { useState, useEffect } from 'react'
import './App.css'
import HomePage from './component/HomePage'
import AuthPage from './component/AuthPage'
import ElectricVehicles from './component/ElectricVehicles'
import DashboardApp from './components/DashboardApp'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [loggedInUser, setLoggedInUser] = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setLoggedInUser(user);
        setCurrentPage('dashboard');
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setLoggedInUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setLoggedInUser(null);
    setCurrentPage('home');
  };

  if (currentPage === 'auth') {
    return <AuthPage 
      onNavigateHome={() => setCurrentPage('home')}
      onLoginSuccess={handleLoginSuccess}
    />
  }

  if (currentPage === 'vehicles') {
    return <ElectricVehicles onNavigateHome={() => setCurrentPage('home')} />
  }

  if (currentPage === 'dashboard') {
    return <DashboardApp user={loggedInUser} onLogout={handleLogout} />
  }

  return (
    <>
      <HomePage 
        onNavigateAuth={() => setCurrentPage('auth')}
        onNavigateVehicles={() => setCurrentPage('vehicles')}
        onNavigateDashboard={() => {
          if (loggedInUser) {
            setCurrentPage('dashboard');
          } else {
            setCurrentPage('auth');
          }
        }}
      />
    </>
  )
}

export default App
