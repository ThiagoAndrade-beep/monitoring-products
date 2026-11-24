const mongoose = require("mongoose")
require("dotenv").config()

async function connect() {
    const dbUri = process.env.MONGO_URI
    if(!dbUri) {
        throw new Error('A variável do mongo não foi definida')
    }
    try {
        await mongoose.connect(dbUri)
        console.log("Banco conectado!")
    } catch (error) {
        console.error("Erro ao conectar com o banco:", error)
    }
}

module.exports = connect