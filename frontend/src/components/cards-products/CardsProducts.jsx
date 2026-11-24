import React from 'react'
import './cardsProducts.css'
import { FiBox, FiTrash, FiCalendar, FiExternalLink } from "react-icons/fi"

const STATUS_MESSAGES = {
    unavailable: "Indisponível na última verificação",
    error: "Não foi possível verificar na última tentativa"
}

const CardsProducts = ({item, deleteProduct}) => {
    // Produto recém-adicionado: o worker ainda não buscou nome e preço
    const isPending = item.status === 'pending' || item.lastPrice == null

    return (
        <div className='product'> {/*card do produto*/}
            <div className='products'> {/*organização interna*/}
                <div className='products-icons'>
                    <div className='icon-box'><FiBox size={24} color='#ff6600' /></div>
                    <div className='icon-remove' onClick={() => deleteProduct(item._id)}><FiTrash size={22} color='#ff4d4d' /></div>
                </div>
                <p className='product-name'>{item.name || 'Aguardando primeira verificação...'}</p>
                <p className='product-price'>{isPending ? 'Preço em breve' : `R$ ${item.lastPrice}`}</p>
                {STATUS_MESSAGES[item.status] && (
                    <p className='product-status'>{STATUS_MESSAGES[item.status]}</p>
                )}
                <div className='products-date'>
                    <FiCalendar size={18} color='#b5b5b5' />
                    <p>Produto adicionado no dia: {new Date(item.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                {item.lastCheckedAt && (
                    <div className='products-date'>
                        <FiCalendar size={18} color='#b5b5b5' />
                        <p>Última verificação: {new Date(item.lastCheckedAt).toLocaleString("pt-BR")}</p>
                    </div>
                )}
                <button className='product-link'>
                    <FiExternalLink size={18} color='#b5b5b5' />
                    <a href={item.link}>Link do produto</a>
                </button>
            </div>
        </div>
    )
}

export default CardsProducts
