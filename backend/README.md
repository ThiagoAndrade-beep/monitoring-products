# Backend

API do Monitoring Products, em Node.js, Express 5 e MongoDB (Mongoose). Ela cuida do cadastro e login de usuários e da lista de produtos monitorados. Também recebe os preços enviados pelo worker local ([`../scraper`](../scraper/README.md)) e manda o e-mail de queda de preço.

O backend **não acessa a Amazon**. Quem consulta os preços é o worker, que roda em outra máquina.

## Como funciona

1. O usuário cadastra um link. O backend valida o link, extrai o ASIN e grava a URL canônica `https://www.amazon.com.br/dp/{ASIN}`.
   - Se outro usuário já monitora o mesmo ASIN, o produto novo copia o último preço conhecido.
   - Senão, o produto fica com status `pending`.
2. O worker pede trabalho em `GET /worker/jobs` e recebe os ASINs que precisam de verificação: primeiro os pendentes, depois os verificados há mais de `CHECK_INTERVAL_HOURS`.
3. O worker envia os resultados em `POST /worker/results`. O backend atualiza todos os usuários que monitoram aquele ASIN e grava o histórico. Se o preço caiu, manda o e-mail.
4. Cada chamada do worker atualiza o `WorkerStatus`. Com ele, o frontend sabe se as verificações estão rodando ou pausadas.

## Arquivos

```
backend/
├── server.js                          ← ponto de entrada (npm start)
├── db/Connect.js
├── models/
│   ├── Register.js
│   └── WorkerStatus.js
├── routes/worker.routes.js
├── middleware/checkWorkerToken.js
├── services/
│   ├── priceUpdate.service.js
│   ├── productBackfill.js
│   └── email.services.js
├── utils/amazonUrl.js
├── Dockerfile
└── package.json
```

### `server.js`: aplicação Express e rotas do usuário
- Configura o CORS, liberando só as origens de `FRONTEND_URL` (aceita uma lista separada por vírgula), e o parser de JSON.
- `checkToken`: middleware que valida o JWT do usuário (header `Authorization: Bearer <token>`) e coloca o id em `req.user`.
- Rotas:

  | Método | Rota | Auth | O que faz |
  |---|---|---|---|
  | GET | `/` | não | Health check (`{ status: "ok" }`) |
  | POST | `/auth/register` | não | Cria o usuário. Exige senha com pelo menos 6 caracteres e um caractere especial; salva o hash com bcrypt |
  | POST | `/auth/login` | não | Confere a senha e devolve `token` (JWT) e `userId` |
  | GET | `/auth/user/:id` | JWT | Dados do próprio usuário, sem a senha |
  | POST | `/auth/add-url` | JWT | Adiciona um produto. Só aceita links da `amazon.com.br` e recusa um ASIN repetido para o mesmo usuário |
  | GET | `/auth/view-products` | JWT | Lista os produtos do usuário |
  | DELETE | `/auth/delete-product/:productId` | JWT | Remove um produto |
  | GET | `/auth/scraper-status` | JWT | Situação do worker: `online` (sinal nos últimos 15 min), `state`, `pausedUntil` e `lastSeenAt` |
  | * | `/worker/*` | `WORKER_TOKEN` | Rotas do worker (ver `routes/worker.routes.js`) |

- `startServer()`:
  1. Exige `SECRET` e avisa no log se `WORKER_TOKEN` estiver ausente ou curto.
  2. Conecta ao Mongo.
  3. Roda o backfill de ASIN.
  4. Sobe o servidor na `PORT`.

### `db/Connect.js`: conexão com o MongoDB
- Conecta o Mongoose usando `MONGO_URI`. Se a conexão falhar, o erro vai para o log.

### `models/Register.js`: modelo `User`
- Campos do usuário: `name`, `email` e `password` (hash).
- `products` é uma lista dentro do próprio usuário. Cada produto tem:
  - `link`: URL canônica.
  - `asin`: indexado, é por ele que o worker busca.
  - `name` e `lastPrice`: ficam vazios até a primeira verificação.
  - `status`: `pending`, `ok`, `unavailable` ou `error`.
  - `lastCheckedAt` e `lastError`: dados da última verificação.
  - `history`: lista de `{ price, date }`.
  - `createdAt`.

### `models/WorkerStatus.js`: sinal de vida do worker
- Documento único (`_id: "default"`) com `lastSeenAt`, `state` (`running` ou `paused`) e `pausedUntil`.

### `routes/worker.routes.js`: rotas do worker local
- Todas passam pelo `checkWorkerToken`.
- `GET /worker/jobs?limit=10`: devolve `{ jobs: [{ asin }] }`, com o limite entre 1 e 50. Também registra o worker como `running`.
- `POST /worker/results`: recebe `{ results: [{ asin, status, name?, price?, error? }] }`, com 1 a 50 itens. Valida cada item e aplica no banco. Responde `{ processed, rejected, productsUpdated }`.
- `POST /worker/status`: recebe `{ state, pausedUntil? }`. O worker usa para avisar que está pausado depois de um bloqueio da Amazon.

### `middleware/checkWorkerToken.js`: autenticação do worker
- Compara o Bearer token com `WORKER_TOKEN` em tempo constante (`crypto.timingSafeEqual`).
- Responde `401` se o token estiver errado e `503` se o servidor não tiver um `WORKER_TOKEN` com pelo menos 32 caracteres.
- É separado do JWT dos usuários: o token do worker não serve para acessar contas, e o JWT de um usuário não serve para enviar preços.

### `services/priceUpdate.service.js`: regra de negócio dos preços
- `sanitizeResult(raw)`: valida o que o worker enviou e devolve `null` se algo não bater.
  - O ASIN precisa ter 10 caracteres e o status precisa ser válido.
  - Com status `ok`, o preço tem que estar entre 0 e 10.000.000 e o nome não pode ser vazio.
  - O preço é arredondado para 2 casas e os textos são cortados (nome em 500 caracteres, erro em 300).
- `applyResult(result)`: atualiza **todos** os usuários que monitoram o ASIN.
  - Grava `lastCheckedAt`, `status` e `lastError`.
  - Se o preço mudou, adiciona um item ao `history` e atualiza `lastPrice`.
  - Salva o usuário antes de mandar o e-mail de queda de preço. Assim, se o save falhar, nenhum e-mail sai.
- `getDueAsins(limit, intervalo)`: agregação que lista ASINs únicos a verificar. Vêm primeiro os pendentes, depois os nunca verificados e os verificados há mais tempo.
- `touchWorkerStatus(update)`: atualiza o `WorkerStatus` (cria o documento se ele não existir).

### `services/productBackfill.js`: migração dos produtos antigos
- `backfillProductAsins()`: roda a cada inicialização. Preenche o `asin` dos produtos cadastrados antes da separação do scraper, para eles entrarem na fila do worker.
- Links que não são da `amazon.com.br` ou não têm ASIN ficam com `status: "error"`.
- Se nenhum produto estiver sem `asin`, não faz nada.

### `services/email.services.js`: e-mail de queda de preço
- `sendPriceDropEmail({ to, productName, oldPrice, newPrice, link })`: envia o aviso pelo Resend (`RESEND_API_KEY`), com o remetente `alerts@monitoringproducts.com.br`.
- Se o envio falhar, o erro só vai para o log e não é repassado para quem chamou.

### `utils/amazonUrl.js`: validação de URL da Amazon
- `parseAmazonUrl(url)`: aceita `amazon.com.br`, `www.` e `m.`, nos formatos `/dp/`, `/gp/product/` e `/gp/aw/d/`. Devolve `{ asin, canonicalUrl }` ou `null`.
- `isAllowedAmazonHost(hostname)`: confere se o domínio é da Amazon Brasil.
- O scraper também usa este arquivo, para impedir que o navegador saia da Amazon.

### Demais arquivos
- `Dockerfile`: imagem `node:22-bookworm-slim` com dependências de produção. Não tem Chromium, porque o scraper roda fora do deploy.
- `.dockerignore` / `.gitignore`: ignoram `node_modules` e `.env`.
- `package.json`: scripts `start` (`node server.js`) e `dev` (`nodemon server.js`).
- `config.json`, `productData.json` e `codigoParaEmail.js`: arquivos antigos, que o código atual não usa mais.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `MONGO_URI` | sim | String de conexão do MongoDB |
| `SECRET` | sim | Segredo usado para assinar o JWT dos usuários |
| `WORKER_TOKEN` | sim, para o worker | Segredo compartilhado com o scraper (mínimo de 32 caracteres) |
| `RESEND_API_KEY` | sim, para os e-mails | Chave da API do Resend |
| `FRONTEND_URL` | não | Origens liberadas no CORS, separadas por vírgula. Padrão: `https://monitoring-products-develop.vercel.app` |
| `CHECK_INTERVAL_HOURS` | não | Intervalo entre as verificações de um mesmo produto. Padrão: `6` |
| `PORT` | não | Porta do servidor. Padrão: `3000` |

Para gerar o `WORKER_TOKEN`, rode o comando abaixo. Use o mesmo valor no `.env` do scraper:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Execução

```bash
cd backend
npm install
npm run dev    # desenvolvimento, com nodemon
npm start      # produção
```

Com Docker:

```bash
docker build -t monitoring-products-backend .
docker run -p 3000:3000 --env-file .env monitoring-products-backend
```

## Observações

- Na primeira inicialização depois da separação do scraper, o backfill altera os produtos já cadastrados no banco: preenche o `asin` ou marca o produto como `error`.
- `nodemailer` e `pg` continuam no `package.json`, mas o código não os usa.
- A pasta `errors/` ficou vazia depois que os arquivos foram movidos para o scraper. O Git não versiona pastas vazias, então ela pode ser apagada.
