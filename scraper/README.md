# Scraper (worker local)

Worker que roda **na minha máquina**, consulta os preços na Amazon com o Puppeteer e envia os resultados para o backend do Monitoring Products.

O backend (deploy) não acessa a Amazon. Ele só decide quais produtos precisam de verificação e processa os resultados: histórico, `lastPrice` e e-mail de queda de preço.

## Como funciona

1. A cada `POLL_INTERVAL_MINUTES`, o worker chama `GET /worker/jobs`. O backend devolve os ASINs que precisam de verificação: primeiro os pendentes, depois os verificados há mais de `CHECK_INTERVAL_HOURS`.
2. O worker abre cada produto em `https://www.amazon.com.br/dp/{ASIN}`, um por vez, com `DELAY_BETWEEN_PAGES_SECONDS` de intervalo.
3. Cada resultado é enviado na hora para `POST /worker/results`.
4. Se a Amazon mostrar bloqueio ou verificação, a rodada para e o worker fica pausado: 1h, depois 2h, 4h, até 24h. O estado fica em `.state.json` e sobrevive a reinícios.

## Arquivos

```
scraper/
├── src/
│   ├── worker.js   ← ponto de entrada (npm start)
│   ├── scrape.js
│   ├── browser.js
│   ├── guard.js
│   ├── api.js
│   ├── price.js
│   └── errors.js
├── .env.example
├── .state.json     (gerado em tempo de execução)
└── package.json
```

### `src/worker.js`: orquestra as rodadas
- `validateConfig()`: confere o `.env` antes de começar. Exige `BACKEND_URL` e um `WORKER_TOKEN` com pelo menos 32 caracteres. Também exige `https://`, exceto para `localhost`, para o token não trafegar sem criptografia.
- `runRound()`: executa uma rodada completa.
  1. Se o circuit breaker estiver aberto, não consulta nada e só avisa o backend da pausa.
  2. Busca os jobs no backend e descarta qualquer ASIN fora do formato.
  3. Consulta um produto por vez, esperando `DELAY_BETWEEN_PAGES_SECONDS` entre eles.
  4. Envia cada resultado assim que fica pronto.
  5. No fim, fecha o Chromium.
- `checkProduct(asin)`: monta a URL `https://www.amazon.com.br/dp/{ASIN}`, chama o `scrape.js` e converte o retorno em `{ asin, status, name?, price?, error? }`. O status é `ok`, `unavailable` ou `error`. Um bloqueio (`BlockedError`) interrompe a rodada inteira.
- `main()`: roda em loop a cada `POLL_INTERVAL_MINUTES`, ou uma vez só com `--once`. Fecha o navegador ao receber Ctrl+C.

### `src/scrape.js`: lê uma página de produto
- Recusa a consulta se o circuit breaker estiver aberto.
- Abre uma aba e bloqueia imagens, CSS, fontes e mídia.
- Impede a aba de navegar para fora da `amazon.com.br`.
- Logo após carregar, detecta bloqueio: status 403, 429 ou 503, URL `validateCaptcha` ou formulário de CAPTCHA. Nesse caso abre o circuit breaker e lança `BlockedError`.
- Lança `ProductUnavailableError` em três casos: status 404, produto esgotado ou página sem preço.
- Lê o título (`#productTitle`) e o preço do bloco principal de compra (`PRICE_CONTAINERS`). Não usa preços de outras partes da página.
- Em caso de erro, registra um diagnóstico no log (tipo do erro, status HTTP, título e começo do texto da página) e sempre fecha a aba.
- Retorna `[{ url, name, price, timeStamp }]`, com o preço como texto (ex.: `"R$ 209,99"`).

### `src/browser.js`: ciclo de vida do Chromium
- `getBrowser()`: devolve um único Chromium compartilhado. Se duas chamadas chegarem juntas, ambas reaproveitam o mesmo processo. Se o navegador cair, a próxima chamada abre outro.
- `closeBrowser()`: fecha o Chromium ao fim de cada rodada, para não ocupar memória entre uma rodada e outra.

### `src/guard.js`: circuit breaker
- `trip()`: depois de um bloqueio, pausa todas as consultas por 1h. A cada novo bloqueio seguido a pausa dobra, até o máximo de 24h.
- `recordSuccess()`: zera o contador depois de uma consulta bem-sucedida.
- `isOpen()` e `getBlockedUntil()`: informam se o worker está pausado e até quando.
- O estado é salvo em `.state.json`, então a pausa continua valendo depois de reiniciar o worker.

### `src/api.js`: cliente do backend
- Todas as chamadas levam `Authorization: Bearer <WORKER_TOKEN>` e têm timeout de 30 s.
- `getJobs(limit)` → `GET /worker/jobs`: lista os ASINs a verificar. Essa chamada também conta como sinal de vida do worker.
- `sendResults(results)` → `POST /worker/results`: envia os resultados das consultas.
- `reportStatus(status)` → `POST /worker/status`: avisa o backend quando o worker está pausado.

### `src/price.js`: conversão de preço
- `normalizePrice("R$ 1.299,90")` retorna `1299.9`. Se o texto não tiver um número válido, retorna `NaN`, e o worker trata o resultado como `error`.

### `src/errors.js`: tipos de erro
- `BlockedError`: bloqueio ou verificação da Amazon. Pausa o worker, sem nova tentativa.
- `ProductUnavailableError`: a página abriu, mas não há preço (produto esgotado ou removido).
- `ScraperError`: classe base das duas. Guarda os detalhes do erro em `details`, usados no log.

### Demais arquivos
- `.env.example`: modelo das variáveis de ambiente (`BACKEND_URL`, `WORKER_TOKEN`, `POLL_INTERVAL_MINUTES`, `DELAY_BETWEEN_PAGES_SECONDS`, `BATCH_SIZE`). Copie para `.env`.
- `.state.json`: estado do circuit breaker, criado automaticamente. Está no `.gitignore`. Apague-o para zerar uma pausa manualmente.
- `package.json`: dependências (`puppeteer` e `dotenv`) e os scripts `start` e `once`.
- `../backend/utils/amazonUrl.js`: arquivo do backend, compartilhado com o scraper. Valida se um domínio pertence à `amazon.com.br`.

## Configuração

1. Gere um token e coloque **o mesmo valor** no backend (`WORKER_TOKEN` nas variáveis de ambiente do deploy) e aqui:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Copie `.env.example` para `.env` e preencha `BACKEND_URL` e `WORKER_TOKEN`.
3. Instale as dependências. O Puppeteer baixa o Chrome na primeira vez:

   ```bash
   cd scraper
   npm install
   ```

## Execução

```bash
npm start      # fica rodando, uma rodada a cada POLL_INTERVAL_MINUTES
npm run once   # executa uma única rodada e sai (útil para testar)
```

Para iniciar junto com o Windows, use o [pm2](https://pm2.keymetrics.io/) ou o Agendador de Tarefas, executando `npm start` nesta pasta.

## Observações

- O worker nunca navega para uma URL recebida do backend. Ele monta a URL a partir do ASIN, validado com regex.
- Com o computador desligado, nenhuma verificação acontece. Os produtos novos ficam como "pendentes" até a próxima rodada.
- Não faça login na sua conta da Amazon no navegador usado pelo worker.
- O código de validação de URL é compartilhado com o backend (`../backend/utils/amazonUrl.js`). Por isso o scraper precisa rodar dentro deste repositório.
