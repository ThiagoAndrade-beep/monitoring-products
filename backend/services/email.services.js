require('dotenv').config();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendPriceDropEmail({ to, productName, oldPrice, newPrice, link }) {
    try {
        await resend.emails.send({
            from: 'Monitoring Products <onboarding@resend.dev>',
            to,
            subject: "O preço do produto caiu",
            html: `
            <p><strong>Boa notícia!</strong></p>
            <p>O preço do produto <b>${productName}</b> caiu.</p>
            <p>De: R$ ${oldPrice}<br/>
            Para: R$ ${newPrice}</p>
            <p><a href="${link}">Ver produto</a></p>
            `
        });
    } catch (error) {
        console.error("Erro ao enviar email:", error);
    }
}

module.exports = { sendPriceDropEmail }