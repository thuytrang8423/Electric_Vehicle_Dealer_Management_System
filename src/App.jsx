import { useState } from 'react'
import './App.css'
import HomePage from './component/HomePage'
import AuthPage from './component/AuthPage'
import ElectricVehicles from './component/ElectricVehicles'

function App() {
  const [currentPage, setCurrentPage] = useState('home') // 'home', 'auth', or 'vehicles'

  // Simple page switcher for demo
  // In production, use React Router
  if (currentPage === 'auth') {
    return <AuthPage onNavigateHome={() => setCurrentPage('home')} />
  }

  if (currentPage === 'vehicles') {
    return <ElectricVehicles 
      onNavigateHome={() => setCurrentPage('home')} 
      onNavigateAuth={() => setCurrentPage('auth')} 
    />
  }

  return (
    <>
      <HomePage 
        onNavigateAuth={() => setCurrentPage('auth')}
        onNavigateVehicles={() => setCurrentPage('vehicles')}
      />
    </>
  )
}

export default App
