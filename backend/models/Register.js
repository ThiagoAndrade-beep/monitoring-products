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
            name: {
                type: String,
                required: true,
            },
            lastPrice: {
                type: Number,
                required: true,
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