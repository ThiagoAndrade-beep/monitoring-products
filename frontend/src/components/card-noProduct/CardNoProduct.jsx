import React from 'react'
import './cardNoProduct.css'
import caixaCinza from "../../assets/caixa-cinza.png"

const CardNoProduct = () => {
    return (
        <div className='no-products'>
            <div className='no-product'>
                <img src={caixaCinza} alt="caixa cinza" />
                <span>Nenhum produto cadastrado ainda</span>
                <p>Adicione sua primeira URL para começar a monitorar</p>
            </div>
        </div>
    )
}

export default CardNoProduct