📦 Monitoring Products

🚧 Projeto em período de testes 🚧

O Monitoring Products é uma aplicação web que permite que usuários monitorem produtos da Amazon e sejam notificados quando houver variação de preço, especialmente queda de valor.

Este projeto está atualmente em fase de testes, sendo continuamente aprimorado em termos de estabilidade, performance e segurança.

🎯 Objetivo do Projeto

O principal objetivo deste projeto é:

-  Consolidar conhecimentos em Back-end com Node.js

-  Aplicar autenticação JWT

-  Trabalhar com MongoDB e modelagem de dados

-  Automatizar tarefas com cron jobs

-  Integrar web scraping com notificações por e-mail

-  Simular um ambiente real de produção, incluindo deploy e monitoramento

Além disso, o projeto também faz parte do meu portfólio profissional.

🧠 Como funciona o fluxo da aplicação

1- O usuário cria uma conta e realiza login

2- Após autenticado, recebe um token JWT

3- O usuário adiciona URLs de produtos da Amazon

4- Os produtos ficam vinculados exclusivamente à conta do usuário

5- Um cron job roda periodicamente:

*  acessa os links cadastrados

*  verifica o preço atual

*  compara com o último preço salvo

6- Caso o preço diminua:
o usuário recebe um e-mail de notificação

🛠️ Tecnologias utilizadas
🔹 Back-end

-Node.js

-Express

-MongoDB + Mongoose

-JWT (JSON Web Token)

-Bcrypt

-Node-cron

-Puppeteer

-Resend(para emails)

🔹 Front-end

-React

-Vite

-Axios

-React Router DOM

-React Toastify

-React Icons

🔹 Infra / Deploy

-Railway (Back-end)

-MongoDB Atlas

-Vercel (Front-end)

