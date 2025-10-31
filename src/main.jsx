import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// In production, silence non-critical console output (log/info/debug)
if (import.meta.env.PROD) {
  const noop = () => {}
  // Preserve original methods if needed: const originalConsoleLog = console.log
  console.log = noop
  console.info = noop
  console.debug = noop
}

// Use Data Router with v7 future flags enabled to silence v7 warnings
const router = createBrowserRouter([
  {
    path: '/*',
    element: <App />,
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
