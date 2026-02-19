import React from 'react'
import './cardUser.css'

const CardUser = ({name, email}) => {
    return (
        <div className='info-user'>
            <div className='info'>
                <h2>Informações do Usuário</h2>
                <p>Seus dados cadastrados</p>
            </div>
            <div className='info-name'>
                <p>Nome</p>
                <span>{name}</span>
            </div>
            <div className='info-email'>
                <p>Email</p>
                <span>{email}</span>
            </div>
        </div>
    )
}

export default CardUser