import React from 'react'
import caixa from "../../assets/caixa.png"
import { Link } from 'react-router-dom'
import './register.css'
import { useState } from 'react'
import fetchApi from '../../axios/config'
import { ToastContainer, toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Register = () => {

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)

  const passwordRegex = /^(?=.*[@$!%*?&#])/; //Lookahead positivo — verifica se existe pelo menos um caractere especial
  const result = passwordRegex.test(password)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const user = {
      name,
      email,
      password
    }

    try {
      const response = await fetchApi.post("register", user)
      toast.success(response.data.msg)

      setName("")
      setEmail("")
      setPassword("")

    } catch (error) {
      console.log("Erro ao cadastrar o usuário", error)
      toast.error(error.response.data.msg)
    }
  }

  function changePasswordView() {
    setPasswordVisible(!passwordVisible)
  }

  return (
    <main className='containerRegister'>
      <img src={caixa} alt="caixa" id='caixa' />

      <div className='register-texts'>
        <h1>Monitoring Products</h1>
        <p>Faça seu cadastro e comece a monitorar o produto da sua preferência</p>
      </div>

      <div className='register-form'>
        <form onSubmit={handleSubmit}>
          <label className='register name'>
            <span>Nome</span>
            <input type="text" placeholder='Digite seu nome' name='name' required value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className='register email'>
            <span>Email</span>
            <input type="email" placeholder='seuEmail@gmail.com' name='email' required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label className='register password'>
            <span>Senha</span>
            <div className="password-input-container">
              <input type={passwordVisible ? "text" : "password"} placeholder="******" name="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="toggle-password"onClick={changePasswordView}>
                {passwordVisible ? <FaEyeSlash color='#fff'/> : <FaEye color='#fff'/>}
              </button>
            </div>
          </label>
          
          {password && password.length < 6 && (
            <p className='password-warning'>A senha deve conter no mínimo 6 caracteres!</p>
          )}
          {password && !result && (
            <p className='password-warning'>A senha deve conter pelo menos um caractere especial!</p>
          )}

          <input type="submit" value="Cadastrar Conta" className='input-register' />
          <Link to="/LoginUser" className='link-login'>Já tem conta ? <span className='span-login'>Faça login</span></Link>
        </form>
      </div>
      <ToastContainer
        theme="dark"
      />
    </main>
  )
}

export default Register