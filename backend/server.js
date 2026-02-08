const express = require('express')
const cors = require('cors')
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const app = express()
app.use(cors()) //libera tudo para testes
app.use(express.json()) //"pega todas as requisições e tudo que tem no body converte para um json"

const User = require("./models/Register.js")
const takingData = require('./index.js')
const cron = require('./jobs/priceMonitor.job.js');

app.listen(3000, () => {
    console.log("servidor rodando na porta 3000")
})

const checkToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
        return res.status(401).json({ msg: "Você não está autorizado!" })
    }

    try {
        const secret = process.env.SECRET
        const decoded = jwt.verify(token, secret) //verifica se o token é válido e decodifica ele com o conteudo que foi usado para criar ele
        console.log("decoded:", decoded)

        //iat: data de criação do token
        //exp: data de expiração do token   

        req.user = decoded.id
        console.log(decoded.id)
        console.log("req.user:", req.user)

        next()
    } catch (error) {
        return res.status(400).json({ msg: "Token inválido!" })
    }
}

function normalizePrice(price) {
    return Number(
        price
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim()
    );
}

app.get("/auth/user/:id", checkToken, async (req, res) => {
    const id = req.params.id
    const userData = await User.findById(id, "-password")

    if (!userData) {
        return res.status(404).json({ msg: "Usuário não encontrado" })
    }

    if (id !== req.user) {
        console.log(req.user)
        return res.status(401).json({ msg: "Acesso não autorizado!" })
    }

    res.status(200).json({ userData })
})

app.get("/", (req, res) => {
    res.status(200).json({ msg: "bem vindo ao monitoring products" })
})

app.post("/auth/register", async (req, res) => {
    const { name, email, password } = req.body

    if (!name) {
        return res.status(422).json({ msg: "Preencha o input com seu nome!" })
    }

    if (!email) {
        return res.status(422).json({ msg: "Preencha o input com seu email!" })
    }

    if (!password) {
        return res.status(422).json({ msg: "Preencha o input com sua senha!" })
    }

    //validação de senha forte
    const passwordRegex = /^(?=.*[@$!%*?&#])/;
    const result = passwordRegex.test(password)
    if (password.length < 6) {
        return res.status(422).json({ msg: "A senha deve conter no mínimo 6 caracteres!" })
    }

    if (!result) {
        return res.status(422).json({ msg: "A senha deve conter pelo menos um caractere especial!" })
    }

    //verificar se o usuário já existe
    const userExist = await User.findOne({ email: email })
    if (userExist) {
        return res.status(422).json({ msg: "Nosso site já possui um cadastro com esse email! " })
    }

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    const user = new User({
        name,
        email,
        password: passwordHash
    })

    try {
        await user.save()
        res.status(200).json({ msg: "Usuário cadastrado com sucesso!" })
    } catch (error) {
        console.log("Erro ao cadastrar um usuário", error)
    }
})

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body
    if (!email) {
        return res.status(422).json({ msg: "Preencha o input com seu email!" })
    }

    if (!password) {
        return res.status(422).json({ msg: "Preencha o input com sua senha!" })
    }

    const userEmail = await User.findOne({ email: email })
    if (!userEmail) {
        return res.status(404).json({ msg: "Nenhum usuário com esse email foi encontrado" })
    }

    const userPassoword = await bcrypt.compare(password, userEmail.password)
    if (!userPassoword) {
        return res.status(422).json({ msg: "Senha incorreta" })
    }

    try {
        const secret = process.env.SECRET
        const token = jwt.sign(
            {
                id: userEmail._id,
            },
            secret,
        )

        res.status(200).json({ msg: "Usuário logado com sucesso!", token, userId: userEmail._id })
        console.log("Token enviado para o front end:", token)
    } catch (error) {
        console.log("Algo de errado aconteceu ao tentar fazer o login:", error)
    }
})

app.post("/auth/add-url", checkToken, async (req, res) => {
    const { novaUrl } = req.body
    const userId = req.user

    if (!novaUrl) {
        return res.status(422).json({ msg: "Insira uma URL!" })
    }

    function urlValid(url) {
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    }

    if (!urlValid(novaUrl)) {
        return res.status(422).json({ msg: "Insira uma URL válida!" })
    }

    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado!" })
        }

        const [productData] = await takingData(novaUrl)
        const normalizedPrice = normalizePrice(productData.price);

        user.products.push({
            link: productData.url,
            name: productData.name,
            lastPrice: normalizedPrice,
            history: [
                {
                    price: normalizedPrice
                }
            ]
        });

        await user.save()

        res.status(200).json({ msg: "Produto adicionado com sucesso!", product: productData })
    } catch (error) {
        console.log("Erro ao adicionar produto:", error)
        res.status(500).json({ msg: "Erro no servidor, tente novamente mais tarde!" })
    }
})

app.get("/auth/view-products", checkToken, async (req, res) => {
    const userId = req.user

    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado!" })
        }

        res.status(200).json({ products: user.products })
    } catch (error) {
        console.log("Erro ao buscar produtos:", error)
        res.status(500).json({ msg: "Erro no servidor, tente novamente mais tarde!" })
    }
})

app.delete("/auth/delete-product/:productId", checkToken, async(req, res) => {
    const userId = req.user
    const productId = req.params.productId

    try {
        const user = await User.findById(userId) 

        if(!user) {
            return res.status(404).json({ msg: "Usuário não encontrado!" })
        }

        const productIndex = user.products.findIndex(product => product._id.toString() === productId)
        if(productIndex === -1) {
            return res.status(404).json({ msg: "Produto não encontrado!" })
        }
        user.products.splice(productIndex, 1) //remove um elemento no indice encontrado
        await user.save()
        res.status(200).json({ msg: "Produto deletado com sucesso!" })
    } catch (error) {
        console.log("Erro ao deletar produto:", error)
        res.status(500).json({ msg: "Erro no servidor, tente novamente mais tarde!" })
    }
})

const conn = require("./db/Connect.js")
conn()
cron()
