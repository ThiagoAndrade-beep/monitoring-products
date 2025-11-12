import React, { useEffect, useState } from 'react'
import './dashboard.css'
import { useNavigate, useParams } from 'react-router-dom'
import fetchApi from '../../axios/config'
import caixa from "../../assets/caixa.png"
import sair from "../../assets/sair.png"
import caixaLaranja from "../../assets/caixa-laranja.png"
import caixaCinza from "../../assets/caixa-cinza.png"      
import './dashboard.css'

const Dashboard = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [data, setData] = useState(null)

    useEffect(() => {
        const reqGet = async () => {
            const token = localStorage.getItem("token")

            if (!token) {
                navigate("/LoginUser")
                return
            }
            try {
                const response = await fetchApi.get(`user/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                console.log("Usuário autenticado:", response)
                setData(response.data.userData)
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate("/LoginUser")
                }
                console.log("Erro ao verificar autenticação", error)
            }
        }
        reqGet()
    }, [id, navigate])

    function handleLogout() {
        localStorage.removeItem("token")
        navigate("/LoginUser")
    }

    if (!data) {
        return <p>Carregando...</p>
    }
    return (
        <main className='dashboard-container'>
            <header className='dashboard-header'>
                <div className='welcome-section'>
                    <img src={caixa} alt="caixa" />
                    <div className='welcome-texts'>
                        <h2>Dashboard</h2>
                        <p>Bem vindo, {data.name}!</p>
                    </div>
                </div>
                <div className='logout-section'>
                    <button onClick={handleLogout}>
                        <img src={sair} alt='sair' id='sair'/>
                        Sair
                    </button>
                </div>
            </header>

            <section className='card-information'>
                <div className='info-user'>
                    <div className='info'>
                        <h2>Informações do Usuário</h2>
                        <p>Seus dados cadastrados</p>
                    </div>
                    <div className='info-name'>
                        <p>Nome</p>
                        <span>{data.name}</span>
                    </div>
                    <div className='info-email'>
                        <p>Email</p>
                        <span>{data.email}</span>
                    </div>
                </div>
                
                <div className='info-url'>
                    <div className='info-url-texts'>
                        <h2>+ Adicionar Produto</h2>
                        <p>Cole a URL do produto da Amazon</p>
                    </div>

                    <form>
                        <label className='url-action'>
                            <span>Link do produto Amazon</span>
                            <input type="text" placeholder='https://amazon.com.br/produto...' />
                        </label>
                        <input type="submit" value="Adicionar produto" id='add-url'/>
                    </form>
                </div>
            </section>

            <section className='registered-products'>
                <div className='registered-products-texts'>
                     <img src={caixaLaranja} alt="caixa laranja" />   
                    <h2>Produtos cadastrados(0)</h2> 
                </div>  
                <div className='product'>
                    <div className='product-infos'>
                        <img src={caixaCinza} alt="caixa cinza" />
                        <span>Nenhum produto cadastrado ainda</span>
                        <p>Adicione sua primeira URL para começar a monitorar</p>
                    </div>
                </div> 
            </section>
        </main>
    )
}

export default Dashboard