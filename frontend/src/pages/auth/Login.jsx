import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import entrar from "../../assets/entrar.png"
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import './login.css'
import { authUser } from '../../service/Auth.service.js';
import Input from '../../components/ui/input/Input.jsx';

const Login = () => {
  const [visiblePassword, setVisiblePassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault() 

    const user = {
      email,
      password
    }

    setLoading(true)
    try {
      const data = await authUser(user)
      console.log(data)

      localStorage.setItem("token", data.token)
      localStorage.setItem("userId", data.userId)

      toast.success(data.msg)

      navigate(`/Dashboard/${data.userId}`)
    } catch (error) {
      toast.error(error.response?.data?.msg || "Erro ao realizar login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function changePasswordView() {
    setVisiblePassword(!visiblePassword)
  }

  return (
    <main className='containerLogin'>
      <img src={entrar} alt="entrar" id='entrar' />

      <div className='login-texts'>
        <h1>Monitoring Products</h1>
        <p>Entre com suas credenciais para acessar sua conta</p>
      </div>

      <div className='login-form'>
        <form onSubmit={handleSubmit}>
          <label className='login email'>
            <span>Email</span>
            <Input
              type='email'
              name='email'
              placeholder='seuEmail@gmail.com'
              value={email}
              setState={setEmail}
            />
          </label>

          <label className='register password'>
            <span>Senha</span>
            <div className="password-input-container">
              <Input
                type={visiblePassword ? "text" : "password"}
                name='password'
                placeholder='******'
                value={password}
                setState={setPassword}
              />
              <button type="button" className="toggle-password" onClick={changePasswordView}>
                {visiblePassword ? <FaEyeSlash color='#bdbbbb' /> : <FaEye color='#bdbbbb' />}
              </button>
            </div>
          </label>

          <button type='submit' className={`input-register ${loading ? 'loading' : ''}`}>
              {loading ? <span className='mini-loader'></span> : 'Entrar'}
          </button>
          <Link to="/RegisterUser" className='link-register'>Não tem conta ? <span className='span-register'>Cadastre-se</span></Link>
        </form>
      </div>
      <ToastContainer
        theme="dark"
      />
    </main>
  )
}

export default Login