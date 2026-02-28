import React from 'react'
import './cardUrl.css'

const CardUrl = ({handleSubmitUrl, novaUrl, setNovaUrl}) => {
    return (
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
    )
}

export default CardUrl