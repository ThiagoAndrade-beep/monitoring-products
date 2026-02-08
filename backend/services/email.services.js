const nodemailer = require("nodemailer")
require("dotenv").config()

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
     connectionTimeout: 60000,
     greetingTimeout: 60000,
     socketTimeout: 300000
});

async function sendPriceDropEmail({ to, productName, oldPrice, newPrice, link }) {
    await transporter.sendMail({
        from: `"Price Monitor" <${process.env.EMAIL_USER}`,
        to,
        subject: "O preço do produto caiu",
        text: `Boa notícia! o preço do produto ${productName} caiu. De: ${oldPrice} Para: ${newPrice}. Link do Produto: ${link}`
    });
}

module.exports = { sendPriceDropEmail }