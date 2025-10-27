import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Auth from './routes/authentication/Auth.jsx'
import HomePage from './pages/home/HomePage.jsx'
import Login from './routes/login/Login.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
  {
    path: "Auth",
    element: <Auth />
  },
  {
    path: "Login",
    element: <Login />
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
