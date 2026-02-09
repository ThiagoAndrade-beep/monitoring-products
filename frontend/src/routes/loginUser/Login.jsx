import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import entrar from "../../assets/entrar.png"
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import './login.css'
import fetchApi from '../../axios/config';

const Login = () => {
  const [visiblePassword, setVisiblePassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const {id} = useParams()
  const navigate = useNavigate()

  const user = {
    email,
    password
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetchApi.post("/login", user)
      const token = response.data.token
      const userId = response.data.userId

      localStorage.setItem("token", token)
      localStorage.setItem("userId", userId)

      console.log(response)
      setTimeout(() => {
        toast.success(response.data.msg)
      }, 2000);

      navigate(`/Dashboard/${userId}`)
    } catch (error) {
      console.log("Erro ao fazer login", error)
      toast.error(error.response.data.msg)
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
            <input type="email" placeholder='seuEmail@gmail.com' name='email' required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label className='register password'>
            <span>Senha</span>
            <div className="password-input-container">
              <input type={visiblePassword ? "text" : "password"} placeholder="******" name="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="toggle-password" onClick={changePasswordView}>
                {visiblePassword ? <FaEyeSlash color='#fff' /> : <FaEye color='#fff' />}
              </button>
            </div>
          </label>

          <input type="submit" value="Entrar" className='input-register' />
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