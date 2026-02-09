import React from 'react'
import caixa from '../../assets/caixa.png'
import setaDireita from '../../assets/seta-direita.png'
import setaBaixo from '../../assets/baixa.png'
import sino from '../../assets/sino.png'
import grafico from '../../assets/grafico-de-barras.png'
import escudo from '../../assets/escudo.png'
import './homePage.css'
import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <main className='container'>
        <section className='container-apresentation'>
            <img src={caixa} alt="pacote" id='caixa'/>
            <h1>Monitore Produtos da Amazon em Tempo Real</h1>
            <p>Nunca mais perca uma promoção. Acompanhe preços, receba alertas e economize dinheiro com nosso sistema inteligente de monitoramento.</p>

            <div className='apresentation-buttons'>
                <button className='btn-createAccount'>
                    <Link to="/RegisterUser">Comeceeee Gratuitamente</Link>
                    <img src={setaDireita} alt="seta pra direita" />
                </button>
                <button className='btn-loginAccount'>
                    <Link to="/LoginUser">Já tenho conta</Link>
                </button>
            </div>
        </section>

        <section className='container-benefits'>
          <div className='benefits-texts'>
            <h1>Por que escolher o <span className='marked-phrase'>Monitoring Products</span> ?</h1>
            <p>Ferramenta completa para você economizar tempo e dinheiro nas suas compras online</p>
          </div>
          <div className='benefits-cards'>
            <div className='card'>
              <img src={setaBaixo} alt="seta para baixo" />
              <h3>Monitoramento de Preços</h3>
              <p>Acompanhe variações de preço em tempo real e nunca perca uma promoção</p>
            </div>

            <div className='card'>
              <img src={sino} alt="sino" />
              <h3>Alertas Inteligentes</h3>
              <p>Receba notificações quando o preço do produto que você deseja baixar</p>
            </div>

            <div className='card'>
              <img src={grafico} alt="grafico de barras" />
              <h3>Histórico de Preços</h3>
              <p>Visualize gráficos e análises detalhadas do histórico de preços</p>
            </div>

            <div className='card'>
              <img src={escudo} alt="escudo" />
              <h3>100% Seguro</h3>
              <p>Seus dados protegidos com a mais alta segurança e privacidade</p>
            </div>
          </div>
        </section>

        <section className='container-closure'>
          <div className='closure'>
            <h1>Pronto para economizar ?</h1>
            <p>Cadastre-se gratuitamente e comece a monitorar seus produtos favoritos agora mesmo</p>
            <button>
                <Link to="/RegisterUser">Criar conta grátis</Link>
                <img src={setaDireita} alt="seta para direita" />
            </button>
          </div>
        </section>
    </main>
  )
}

export default HomePage