import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import fetchApi from '../../axios/config'
import caixa from "../../assets/caixa.png"
import sair from "../../assets/sair.png"
import caixaLaranja from "../../assets/caixa-laranja.png"
import caixaCinza from "../../assets/caixa-cinza.png"
import { ToastContainer, toast } from 'react-toastify';
import './dashboard.css'
import { FiCalendar } from "react-icons/fi";
import { FiExternalLink } from "react-icons/fi";
import { FiBox } from "react-icons/fi";

const Dashboard = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [data, setData] = useState(null)
    const [novaUrl, setNovaUrl] = useState("")
    const [dataProducts, setDataProducts] = useState(null)

    //validação após o login
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

    //função de logout
    function handleLogout() {
        localStorage.removeItem("token")
        navigate("/LoginUser")
    }

    //enviando url para o servidor
    async function handleSubmitUrl(e) {
        e.preventDefault()
        const token = localStorage.getItem("token")

        try {
            const response = await fetchApi.post("/add-url", { novaUrl }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            console.log("url adicionada:", response.data)
            toast.success(response.data.msg)
        } catch (error) {
            console.log("erro ao enviar url:", error)
            toast.error(error.response.data.msg)
        }
    }

    //buscando pelos dados dos produtos
    useEffect(() => {
        const reqGetProducts = async () => {
            const token = localStorage.getItem("token")

            try {
                const response = await fetchApi.get("/view-products", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                setDataProducts(response.data.products)
            } catch (error) {
                console.log("Erro ao buscar pelos produtos:", error)
            }
        }
        reqGetProducts()
    }, [novaUrl])

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
                        <img src={sair} alt='sair' id='sair' />
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

                    <form onSubmit={handleSubmitUrl}>
                        <label className='url-action'>
                            <span>Link do produto Amazon</span>
                            <input type="text" placeholder='https://amazon.com.br/produto...' name='novaUrl' value={novaUrl} onChange={(e) => setNovaUrl(e.target.value)} />
                        </label>
                        <input type="submit" value="Adicionar produto" id='add-url' />
                    </form>
                </div>
            </section>

            <section className='registered-products'>
                <div className='registered-products-texts'>
                    <img src={caixaLaranja} alt="caixa laranja" />
                    <h2>Produtos cadastrados ({dataProducts?.length})</h2>
                </div>
                {!dataProducts || dataProducts?.length === 0 ? (
                    <div className='no-products'>
                        <div className='no-product'>
                            <img src={caixaCinza} alt="caixa cinza" />
                            <span>Nenhum produto cadastrado ainda</span>
                            <p>Adicione sua primeira URL para começar a monitorar</p>
                        </div>
                    </div>
                ) : (
                    <div className="products-list"> {/*container*/}
                        {dataProducts.map(item => (
                            <div className='product' key={item._id}> {/*card do produto*/}
                                <div className='products'> {/*organização interna*/}
                                    <div className='icon-box'><FiBox size={24} color='#ff6600'/></div>
                                    <p className='product-name'>{item.name}</p>
                                    <p className='product-price'>R$ {item.lastPrice}</p>
                                    <div className='products-date'>
                                        <FiCalendar size={18} color='#b5b5b5'/>
                                        <p>Produto adicionado no dia: {new Date(item.createdAt).toLocaleString("pt-BR")}</p>
                                    </div>
                                    <button className='product-link'>
                                        <FiExternalLink size={18} color='#b5b5b5'/>
                                        <a href={item.link}>Link do produto</a>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
            <ToastContainer />
        </main>
    )
}

export default Dashboard