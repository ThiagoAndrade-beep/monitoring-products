import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/register/Register.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
  {
    path: "RegisterUser",
    element: <Register />
  },
  {
    path: "LoginUser",
    element: <Login />
  },
  {
    path: "Dashboard/:id",
    element: <Dashboard />
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
