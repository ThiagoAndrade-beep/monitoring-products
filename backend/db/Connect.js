const mongoose = require("mongoose")
require("dotenv").config()

const dbUri = process.env.MONGO_URI


async function connect() {
    try {
        await mongoose.connect(dbUri)
        console.log("Banco conectado!")
    } catch (error) {
        console.log("Erro ao conectar com o banco:", error)
    }
}

module.exports = connect