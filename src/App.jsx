import { useState, useEffect } from 'react'
import './App.css'
import HomePage from './components/HomePage'
import AuthPage from './components/AuthPage'
import ElectricVehicles from './components/ElectricVehicles'
import DashboardApp from './components/dashboard-layout/DashboardApp'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Global ToastContainer - wraps the entire app
const AppWithToast = ({ children }) => (
  <>
    {children}
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
    return (
      <AppWithToast>
        <AuthPage 
          onNavigateHome={() => setCurrentPage('home')}
          onLoginSuccess={handleLoginSuccess}
        />
      </AppWithToast>
    )
  }

  if (currentPage === 'vehicles') {
    return <ElectricVehicles 
      onNavigateHome={() => setCurrentPage('home')} 
      onNavigateAuth={() => setCurrentPage('auth')} 
    />
  }

  if (currentPage === 'dashboard') {
    return (
      <AppWithToast>
        <DashboardApp user={loggedInUser} onLogout={handleLogout} />
      </AppWithToast>
    )
  }

  return (
    <AppWithToast>
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
    </AppWithToast>
  )
}

export default App
