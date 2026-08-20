📦 Monitoring Products

🚧 Projeto em período de testes 🚧

O Monitoring Products é uma aplicação web que permite que usuários monitorem produtos da Amazon e sejam notificados quando houver variação de preço, especialmente queda de valor.

Este projeto está atualmente em fase de testes, sendo continuamente aprimorado em termos de estabilidade, performance e segurança.

🎯 Objetivo do Projeto

O principal objetivo deste projeto é:

Consolidar conhecimentos em Back-end com Node.js
Aplicar autenticação JWT
Trabalhar com MongoDB e modelagem de dados
Automatizar tarefas com cron jobs
Integrar web scraping com notificações por e-mail
Simular um ambiente real de produção, incluindo deploy e infraestrutura
Consolidar conhecimentos de AWS, Linux, Nginx, DNS e HTTPS

Além disso, o projeto também faz parte do meu portfólio profissional.

🧠 Como funciona o fluxo da aplicação
O usuário cria uma conta e realiza login
Após autenticado, recebe um token JWT
O usuário adiciona URLs de produtos da Amazon
Os produtos ficam vinculados exclusivamente à conta do usuário
Um cron job roda periodicamente:
acessa os links cadastrados
verifica o preço atual
compara com o último preço salvo
Caso o preço diminua, o usuário recebe um e-mail de notificação
🛠️ Tecnologias utilizadas
🔹 Back-end
Node.js
Express
MongoDB + Mongoose
JWT (JSON Web Token)
Bcrypt
Node-cron
Puppeteer
Resend
🔹 Front-end
React
Vite
Axios
React Router DOM
React Toastify
React Icons
🔹 Infra / Deploy
AWS EC2
Ubuntu
Nginx
Let's Encrypt
Certbot
DNS / Registro.br
MongoDB Atlas
Vercel
🚀 Arquitetura de Deploy

O backend está hospedado em uma instância AWS EC2.

As requisições externas são recebidas pelo Nginx, que atua como reverse proxy e encaminha as requisições para a aplicação Node.js executando internamente na porta 3000.

Internet
   │
   │ HTTPS :443
   ▼
api.monitoringproducts.com.br
   │
   ▼
Nginx
   │
   │ Reverse Proxy
   ▼
Node.js :3000
   │
   ▼
MongoDB Atlas

O HTTPS é configurado utilizando Let's Encrypt + Certbot, enquanto o DNS do domínio é gerenciado através do Registro.br.

🔐 Segurança

Atualmente, o acesso externo à aplicação ocorre através de HTTPS.

A porta utilizada internamente pelo Node.js (3000) não é necessária como ponto de entrada público, sendo o Nginx responsável por receber as requisições externas.
