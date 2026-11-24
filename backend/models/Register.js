const mongoose = require("mongoose")

const User = mongoose.model('User', {
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },
    products: [
        {
            link: {
                type: String,
                required: true
            },
            asin: {
                type: String,
                index: true
            },
            // name e lastPrice ficam vazios enquanto o produto aguarda a primeira verificação do worker
            name: {
                type: String
            },
            lastPrice: {
                type: Number
            },
            // pending: aguardando a primeira verificação | ok | unavailable: sem preço na página | error
            status: {
                type: String,
                enum: ['pending', 'ok', 'unavailable', 'error'],
                default: 'ok'
            },
            lastCheckedAt: {
                type: Date
            },
            lastError: {
                type: String
            },
            history: [
                {
                    price: Number,
                    date: {
                        type: Date,
                        default: Date.now
                    }
                }
            ],
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
})

module.exports = User
