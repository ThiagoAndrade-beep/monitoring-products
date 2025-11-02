import React from 'react'
import { Link } from 'react-router-dom'
import entrar from "../../assets/entrar.png"
import './login.css'

const Login = () => {
 return (
    <main className='containerLogin'>
      <img src={entrar} alt="entrar" id='entrar' />

      <div className='login-texts'>
        <h1>Monitoring Products</h1>
        <p>Entre com suas credenciais para acessar sua conta</p>
      </div>

      <div className='login-form'>
        <form>
          <label className='login email'>
            <span>Email</span>
            <input type="email" placeholder='seuEmail@gmail.com' name='email' required />
          </label>

          <label className='register password'>
            <span>Senha</span>
            <input type="password" placeholder='******' name='password' required />
          </label>

          <input type="submit" value="Entrar" className='input-register' />
          <Link to="/RegisterUser" className='link-register'>Não tem conta ? <span className='span-register'>Cadastre-se</span></Link>
        </form>
      </div>
    </main>
  )
}

export default Login