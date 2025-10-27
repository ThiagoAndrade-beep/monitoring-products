const express = require('express')
const cors = require('cors')
const fs = require("fs")
const buscarDados = require("./index.js")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const app = express()
app.use(cors()) //libera tudo para testes
app.use(express.json()) //"pega todas as requisições e tudo que tem no body converte para um json"

const User = require("./models/Register.js")

app.listen(3000, () => {
    console.log("servidor rodando na porta 3000")
})

app.get("/", (req, res) => {
    res.status(200).json({msg: "bem vindo ao monitoring products"})
})

app.post("/auth/register", async(req, res) => {
    const { name, email, password } = req.body

    if(!name) {
        return res.status(422).json({msg: "Preencha o input com seu nome!"})
    }

    if(!email) {
        return res.status(422).json({msg: "Preencha o input com seu email!"})
    }

    if(!password) {
        return res.status(422).json({msg: "Preencha o input com sua senha!"})
    }

    const userExist = await User.findOne({email: email})
    if(userExist) {
        return res.status(422).json({msg: "Nosso site já possui um cadastro com esse email! "})
    }

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    const user = new User ({
        name,
        email,
        password: passwordHash
    })

    try {
        await user.save()
        res.status(200).json({msg: "Usuário cadastrado com sucesso!"})
    } catch (error) {
        console.log("Erro ao cadastrar um usuário", error)
    }
})

app.post("/auth/login", async(req, res) => {
    const {email, password} = req.body
    if(!email) {
        return res.status(422).json({msg: "Preencha o input com seu email!"})
    }

    if(!password) {
        return res.status(422).json({msg: "Preencha o input com sua senha!"})
    }

    const userEmail = await User.findOne({email: email})
    if(!userEmail) {
        return res.status(404).json({msg: "Nenhum usuário com esse email foi encontrado"})
    }

    const userPassoword = await bcrypt.compare(password, userEmail.password)
    if(!userPassoword) {
        return res.status(422).json({msg: "Senha incorreta"})
    }

    try {
        const secret = process.env.SECRET
        const token = jwt.sign(
            {
                id: userPassoword._id,
            },
            secret
        )

        res.status(200).json({msg: "Usuário logado com sucesso!", token})
        console.log("Token enviado para o front end:", token)
    } catch (error) {
        console.log("Algo de errado aconteceu ao tentar fazer o login:", error)
    }
})

// app.post("/adicionar-url", async(req, res) => {
//     const {novaUrl} = req.body // ou seja, isso aqui vai ser um json
//     if(!novaUrl) {
//         return res.status(400).json({erro: "URL ausente"})
//     }

//     const config = JSON.parse(fs.readFileSync("./config.json"))
//     config.url.push(novaUrl)
//     fs.writeFileSync("./config.json", JSON.stringify(config, null, 2))
    
//     const dados = await buscarDados(novaUrl)
//     fs.writeFileSync("./productData.json", JSON.stringify(dados, null, 2))

//     res.json({mensagem: "URL adicionada com sucesso!", dados})
// })

// app.get("/produto-adicionado", async(req, res) => {
//     try {
//         const config = JSON.parse(fs.readFileSync("./productData.json"))
//         console.log(config)
//         res.json(config)
//     } catch(error) {
//         res.json({error: error})
//     }
// })

const conn = require("./db/Connect.js")
conn()
