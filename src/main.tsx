import React from 'react'
import ReactDOM from 'react-dom/client'
import { Buffer } from 'buffer'
import App from './App.tsx'
import './styles/index.css'

const globalWindow = window as typeof window & { Buffer?: typeof Buffer }

if (!globalWindow.Buffer) {
  globalWindow.Buffer = Buffer
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root was not found in index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
