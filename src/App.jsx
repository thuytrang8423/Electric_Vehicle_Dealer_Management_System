import { useState } from 'react'
import './App.css'
import HomePage from './component/HomePage'
import AuthPage from './component/AuthPage'

function App() {
  const [currentPage, setCurrentPage] = useState('home') // 'home' or 'auth'

  // Simple page switcher for demo
  // In production, use React Router
  if (currentPage === 'auth') {
    return <AuthPage onNavigateHome={() => setCurrentPage('home')} />
  }

  return (
    <>
      <HomePage onNavigateAuth={() => setCurrentPage('auth')} />
    </>
  )
}

export default App
