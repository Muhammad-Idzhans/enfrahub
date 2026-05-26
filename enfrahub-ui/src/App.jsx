import Header from './components/Header'
import Home from './pages/Home'
import ChatBot from './components/ChatBot'
import { useState } from 'react'
import './App.css'

function App() {
  return (
    <div>
      <Header />
      <Home />
      <ChatBot />
    </div>
  )
}

export default App