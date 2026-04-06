import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // <-- This line is CRITICAL for the design to work
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)