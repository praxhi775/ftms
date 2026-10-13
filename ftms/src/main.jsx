import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { seedDatabase } from './db/seedData.js'

// Automatically seed database with starter squad & matches on first launch
seedDatabase().catch((err) => console.error('Error seeding DB:', err));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
