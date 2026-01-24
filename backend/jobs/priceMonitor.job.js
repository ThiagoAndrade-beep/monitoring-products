const cron = require('node-cron');
const takingData = require('../index.js');
const User = require('../models/Register.js');

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

    cron.schedule('*/1 * * * *', async () => {
        console.log('⏱ Rodando monitoramento de preços...');

        const users = await User.find({
            products: { $exists: true, $not: { $size: 0 } }
        })

        for (const user of users) {
            for (const product of user.products) {
                const [data] = await takingData(product.link)
                const currentPrice = normalizePrice(data.price);

                if (currentPrice !== product.lastPrice) {
                    console.log(`🔔 Preço mudou: ${product.lastPrice} → ${currentPrice}`);
                    
                    product.history.push({
                        price: currentPrice,
                        date: new Date()
                    });

                    product.lastPrice = currentPrice;
                    await user.save()
                }
            }
        }
    });
}

module.exports = startPriceMonitorJob;

