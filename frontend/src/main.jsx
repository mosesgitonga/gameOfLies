import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import GameBoard from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameBoard />
  </StrictMode>
)
