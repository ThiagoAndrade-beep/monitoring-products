const mongoose = require("mongoose")
require("dotenv").config()

const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASSWORD


async function connect() {
    try {
        await mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.yicwex9.mongodb.net/monitoringProducts?retryWrites=true&w=majority&appName=Cluster0`)
        console.log("Banco conectado!")
    } catch (error) {
        console.log("Erro ao conectar com o banco:", error)
    }
}

module.exports = connect