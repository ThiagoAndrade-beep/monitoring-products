import caixa from "../../assets/caixa.png"
import { Link } from 'react-router-dom'
import './register.css'
import { useState } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { registerUser } from '../../service/Register.service.js'
import Input from '../../components/ui/input/Input'
import { validatorPassword } from '../../utils/validatorPassword'

const Register = () => {

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const {minLength, resultPassword} = validatorPassword(password)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const user = {
      name,
      email,
      password
    }

    try {
      const response = await registerUser(user)
      toast.success(response.msg)

      setName("")
      setEmail("")
      setPassword("")

    } catch (error) {
      console.log("Erro ao cadastrar o usuário", error)
      toast.error(error.response?.data?.msg || "Erro ao realizar cadastro. Tente novamente.")
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
            <Input
              type='text'
              name='name'
              placeholder='Digite seu nome'
              value={name}
              setState={setName}
            />
          </label>

          <label className='register email'>
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
                type={passwordVisible ? 'text' : 'password'}
                name='password'
                placeholder="******"
                value={password}
                setState={setPassword}
              />
              <button type="button" className="toggle-password" onClick={changePasswordView}>
                {passwordVisible ? <FaEyeSlash color='#fff' /> : <FaEye color='#fff' />}
              </button>
            </div>
          </label>

          {password && minLength && (
            <p className='password-warning'>A senha deve conter no mínimo 6 caracteres!</p>
          )}
          {password && !resultPassword && (
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