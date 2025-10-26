import { useState, useEffect } from 'react'
import './App.css'
import HomePage from './components/HomePage'
import AuthPage from './components/AuthPage'
import ElectricVehicles from './components/ElectricVehicles'
import Contact from './components/Contact'
import DashboardApp from './components/DashboardApp'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
    return <ElectricVehicles 
      onNavigateHome={() => setCurrentPage('home')} 
      onNavigateAuth={() => setCurrentPage('auth')} 
      onNavigateContact={() => setCurrentPage('contact')}
    />
  }

  if (currentPage === 'contact') {
    return <Contact 
      onNavigateHome={() => setCurrentPage('home')} 
      onNavigateAuth={() => setCurrentPage('auth')} 
      onNavigateVehicles={() => setCurrentPage('vehicles')}
    />
  }

  if (currentPage === 'dashboard') {
    return <DashboardApp user={loggedInUser} onLogout={handleLogout} />
  }

  return (
    <>
      <HomePage 
        onNavigateAuth={() => setCurrentPage('auth')}
        onNavigateVehicles={() => setCurrentPage('vehicles')}
        onNavigateContact={() => setCurrentPage('contact')}
        onNavigateDashboard={() => {
          if (loggedInUser) {
            setCurrentPage('dashboard');
          } else {
            setCurrentPage('auth');
          }
        }}
      />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  )
}

export default App
