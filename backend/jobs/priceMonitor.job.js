const cron = require('node-cron');
const takingData = require('../index.js');
const User = require('../models/Register.js');
const { sendPriceDropEmail } = require("../services/email.services.js")

function normalizePrice(price) {
    return Number(
        price
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim()
    );
}

function startPriceMonitorJob() {

    cron.schedule('* * * * *', async () => {
        console.log('⏱ Rodando monitoramento de preços...');

        const users = await User.find({
            products: { $exists: true, $not: { $size: 0 } }
        })

        for (const user of users) {
            for (const product of user.products) {
                const [data] = await takingData(product.link)
                const currentPrice = normalizePrice(data.price);
                const previousPrice = product.lastPrice;
                const fakePrice = currentPrice + 15;

                if (fakePrice !== previousPrice) {

                    if (fakePrice < previousPrice) {
                        try {
                            await sendPriceDropEmail({
                                to: user.email,
                                productName: product.name,
                                oldPrice: previousPrice,
                                newPrice: fakePrice,
                                link: product.link
                            })
                            console.log(`Email de queda de preço enviado para ${user.email} sobre o produto "${product.name}".`);
                        } catch (error) {
                            console.error("Erro ao enviar email:", error);
                        }
                    } else {
                        console.log("o preço subiu.")
                    }

                    product.history.push({
                        price: fakePrice,
                        date: new Date()
                    });

                    product.lastPrice = fakePrice;
                    await user.save()
                } else {
                    console.log(`O preço do produto "${product.name}" não mudou.`);
                }
            }
        }
    });
}

module.exports = startPriceMonitorJob;

