import React from 'react'
import './cardUrl.css'

const CardUrl = ({ handleSubmitUrl, novaUrl, setNovaUrl, loading }) => {
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
                <button type='submit' className={`input-register ${loading ? 'loading' : ''}`}>
                    {loading ? <div className="dots-loader">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div> : 'Adicionar produto'}
                </button>
            </form>
        </div>
    )
}

export default CardUrl