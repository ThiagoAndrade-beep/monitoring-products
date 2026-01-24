const nodemailer = require("nodemailer")
require("dotenv").config()

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
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