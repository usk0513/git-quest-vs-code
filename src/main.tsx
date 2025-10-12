import React from 'react'
import ReactDOM from 'react-dom/client'
import { Buffer } from 'buffer'
import App from './App.tsx'
import './styles/index.css'

const globalWindow = window as typeof window & { Buffer?: typeof Buffer }

if (!globalWindow.Buffer) {
  globalWindow.Buffer = Buffer
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
