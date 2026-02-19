import caixa from '../../assets/caixa.png'
import { HiArrowRight } from "react-icons/hi";
import { FiTrendingDown } from "react-icons/fi";
import { FiBell } from "react-icons/fi";
import { FiBarChart2 } from "react-icons/fi";
import { FiShield } from "react-icons/fi";
import './homePage.css'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/buttons/Button'
import BenefitsCards from '../../components/benefits-cards/BenefitsCards';

const HomePage = () => {
  return (
    <main className='container'>
        <section className='container-apresentation'>
            <img src={caixa} alt="pacote" id='caixa'/>
            <h1>Monitore Produtos da Amazon em Tempo Real</h1>
            <p>Nunca mais perca uma promoção. Acompanhe preços, receba alertas e economize dinheiro com nosso sistema inteligente de monitoramento.</p>

            <div className='apresentation-buttons'>
              <Button variant='createAccount' icon={HiArrowRight}>
                  <Link to="/RegisterUser">Começar Gratuitamente</Link>
              </Button>
              
              <Button variant='login'>
                <Link to="/LoginUser">Já tenho conta</Link>
              </Button>
            </div>
        </section>

        <section className='container-benefits'>
          <div className='benefits-texts'>
            <h1>Por que escolher o <span className='marked-phrase'>Monitoring Products</span> ?</h1>
            <p>Ferramenta completa para você economizar tempo e dinheiro nas suas compras online</p>
          </div>
          <div className='benefits-cards'>
            <BenefitsCards icon={FiTrendingDown} title='Monitoramento de Preços' description='Acompanhe variações de preço em tempo real e nunca perca uma promoção'/>
            <BenefitsCards icon={FiBell} title='Alertas Inteligentes' description='Receba notificações quando o preço do produto que você deseja baixar'/>
            <BenefitsCards icon={FiBarChart2} title='Histórico de Preços' description='Visualize gráficos e análises detalhadas do histórico de preços'/>
            <BenefitsCards icon={FiShield} title='100% Seguro' description='Seus dados protegidos com a mais alta segurança e privacidade'/>
          </div>
        </section>

        <section className='container-closure'>
          <div className='closure'>
            <h1>Pronto para economizar ?</h1>
            <p>Cadastre-se gratuitamente e comece a monitorar seus produtos favoritos agora mesmo</p>
            <Button variant='closure' icon={HiArrowRight}>
              <Link to="/RegisterUser">Criar conta grátis</Link>
            </Button>
          </div>
        </section>
    </main>
  )
}

export default HomePage