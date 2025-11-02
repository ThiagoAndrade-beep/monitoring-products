import React from 'react'
import caixa from "../../assets/caixa.png"
import { Link } from 'react-router-dom'
import './register.css'

const Register = () => {
  return (
    <main className='containerRegister'>
      <img src={caixa} alt="caixa" id='caixa' />

      <div className='register-texts'>
        <h1>Monitoring Products</h1>
        <p>Faça seu cadastro e comece a monitorar o produto da sua preferência</p>
      </div>

      <div className='register-form'>
        <form>
          <label className='register name'>
            <span>Nome</span>
            <input type="text" placeholder='Digite seu nome' name='name' required />
          </label>

          <label className='register email'>
            <span>Email</span>
            <input type="email" placeholder='seuEmail@gmail.com' name='email' required />
          </label>

          <label className='register password'>
            <span>Senha</span>
            <input type="password" placeholder='******' name='password' required />
          </label>

          <input type="submit" value="Cadastrar Conta" className='input-register' />
          <Link to="/LoginUser" className='link-login'>Já tem conta ? <span className='span-login'>Faça login</span></Link>
        </form>
      </div>
    </main>
  )
}

export default Register