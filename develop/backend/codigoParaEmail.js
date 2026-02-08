// import React, { useRef, useState } from 'react'
// import './searchingProduct.css'
// import { Link } from 'react-router-dom'
// import { usePost } from '../hooks/usePost'
// import { ToastContainer, toast } from 'react-toastify'
// import emailjs from "@emailjs/browser"
// import produtos from '../assets/produtos.png'

// const SearchingProduct = () => {
//   const { postData, loading, error } = usePost('http://localhost:3000/adicionar-url')
//   const [url, setUrl] = useState()
//   const [nome, setNome] = useState()
//   const [email, setEmail] = useState()
//   const form = useRef()
//   const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

//   function enviarEmail() {
//     emailjs.init({
//       publicKey: PUBLIC_KEY
//     });

//     emailjs.sendForm("service_fclebha", "template_7jdpshq", form.current)
//       .then((response) => {
//         toast.success("Sucesso!")
//         console.log(response)
//       })
//       .catch((error) => {
//         console.log(error)
//         toast.error("Error ao cadastrar email")
//       })
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     //validações
//     if (!url) {
//       toast.error("Preencha a o campo com a URL!")
//       return
//     }
//     if (error) {
//       toast.error("Não foi possível enviar a sua URL!")
//       console.log(error)
//     }

//     try {
//       const respostaProduto = await postData(
//         { novaUrl: url },
//         { 'Contet-Type': 'application/json' }
//       )

//       console.log(respostaProduto)

//       const respostaUsuario = await fetch("http://localhost:3000/usuarios", {
//         method: "POST",
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           nome,
//           email
//         })
//       })
//       const userResult = await respostaUsuario.json()
//       console.log(userResult)

//       setEmail("")
//       enviarEmail()
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   return (
//     <>
//       <div>
        
//         <header>
//           <div className='title'>
//             <img src={produtos} alt="produto" />
//             <h2>Monitoring Product</h2>
//           </div>
//           <Link to="/viewProduct" state={{nome}} className='btn-viewProduct'>Ver produtos</Link>
//         </header>

//         <form onSubmit={handleSubmit} ref={form}>
//           <h1>Preencha com as suas informações</h1>
//           <div className='inputs'>
//             <label>
//               <span>Nome</span>
//               <input type="text" placeholder='Digite seu nome' name='nome' value={nome} onChange={(e) => setNome(e.target.value)} />
//             </label>

//             <label>
//               <span>Email</span>
//               <input type="text" placeholder='Digite seu email' name='email' value={email} onChange={(e) => setEmail(e.target.value)} />
//             </label>

//             <label>
//               <span>URL do produto</span>
//               <input type="text" placeholder='Digite a url do produto' id='search' value={url} onChange={(e) => setUrl(e.target.value)} name='url' />
//             </label>
//           </div>
//           <input type="submit" value={loading ? "Enviando..." : "Enviar"} id='enviar' disabled={loading} />
//         </form>
//         <ToastContainer />
//       </div>
//     </>
//   )
// }

// export default SearchingProduct