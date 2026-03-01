import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import caixa from "../../assets/caixa.png"
import sair from "../../assets/sair.png"
import caixaLaranja from "../../assets/caixa-laranja.png"
import { ToastContainer, toast } from 'react-toastify';
import './dashboard.css'
import { infoUser } from '../../service/User.service.js'
import { addUrl } from '../../service/AddUrl.service.js'
import { getToken, removeToken } from '../../utils/token.js'
import { infoProducts } from '../../service/Product.service.js'
import { deleteProducts } from '../../service/DeleteProduct.service.js'
import CardUser from '../../components/card-user/CardUser.jsx'
import CardUrl from '../../components/card-url/CardUrl.jsx'
import CardsProducts from '../../components/cards-products/CardsProducts.jsx'
import CardNoProduct from '../../components/card-noProduct/CardNoProduct.jsx'

const Dashboard = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [data, setData] = useState(null)
    const [novaUrl, setNovaUrl] = useState("")
    const [dataProducts, setDataProducts] = useState(null)

    //validação após o login
    useEffect(() => {
        const reqGet = async () => {
            const token = getToken()

            if (!token) {
                navigate("/LoginUser")
                return
            }
            try {
                const response = await infoUser(id, token)
                setData(response.userData)
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
        removeToken()
        navigate("/LoginUser")
    }

    //enviando url para o servidor
    async function handleSubmitUrl(e) {
        e.preventDefault()
        const token = getToken()

        try {
            const response = await addUrl(novaUrl, token)

            console.log("url adicionada:", response)
            toast.success(response.msg)
        } catch (error) {
            console.log("erro ao enviar url:", error)
            toast.error(error.response?.data?.msg || "Erro ao adicionar URL")
        }
    }

    //buscando pelos dados dos produtos
    useEffect(() => {
        const reqGetProducts = async () => {
            const token = getToken()

            try {
                const response = await infoProducts(token)
                setDataProducts(response.products)
            } catch (error) {
                console.log("Erro ao buscar pelos produtos:", error)
            }
        }
        reqGetProducts()
    }, [novaUrl])

    async function deleteProduct(productId) {
        const token = getToken()

        try {
            const response = await deleteProducts(token, productId)
            console.log("Produto deletado:", response)
            toast.success(response.msg)

            setDataProducts(prev =>
                prev.filter(product => product._id !== productId)
            )
        } catch (error) {
            toast.error(error.response?.data?.msg)
        }
    }

    if (!data) {
        return <div className='loader'></div>
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
                    <CardUser name={data.name} email={data.email}/>
                    <CardUrl handleSubmitUrl={handleSubmitUrl} novaUrl={novaUrl} setNovaUrl={setNovaUrl}/>
            </section>

            <section className='registered-products'>
                <div className='registered-products-texts'>
                    <img src={caixaLaranja} alt="caixa laranja" />
                    <h2>Produtos cadastrados ({dataProducts?.length})</h2>
                </div>
                
                {!dataProducts || dataProducts?.length === 0 ? (
                    <CardNoProduct />
                ) : (
                    <div className="products-list"> {/*container*/}
                        {dataProducts.map(item => (
                           <CardsProducts key={item._id} item={item} deleteProduct={deleteProduct}/>
                        ))}
                    </div>
                )}
            </section>
            <ToastContainer />
        </main>
    )
}

export default Dashboard