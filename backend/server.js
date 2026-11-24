const express = require('express')
const cors = require('cors')
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const app = express()
const allowedOrigins = (process.env.FRONTEND_URL || "https://monitoring-products-develop.vercel.app")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
app.use(cors({ origin: allowedOrigins} ))
app.use(express.json()) //"pega todas as requisições e tudo que tem no body converte para um json"

const User = require("./models/Register.js")
const WorkerStatus = require("./models/WorkerStatus.js")
const workerRoutes = require("./routes/worker.routes.js")
const { backfillProductAsins } = require("./services/productBackfill.js")

// Rotas do worker local (scraper/), que consulta os preços e envia os resultados.
app.use("/worker", workerRoutes)

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

const { parseAmazonUrl } = require("./utils/amazonUrl.js")

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
    res.status(200).json({ status: "ok" })
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

    // Só aceita produtos da amazon.com.br e grava a URL canônica (/dp/ASIN),
    // sem parâmetros de rastreamento ou de sessão.
    const parsedUrl = parseAmazonUrl(novaUrl)
    if (!parsedUrl) {
        return res.status(422).json({ msg: "Insira uma URL válida de produto da Amazon Brasil (amazon.com.br/dp/...)!" })
    }

    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado!" })
        }

        const { asin, canonicalUrl } = parsedUrl
        if (user.products.some((product) => product.asin === asin)) {
            return res.status(422).json({ msg: "Você já monitora este produto!" })
        }

        // O preço é consultado pelo worker local. Se outro usuário já monitora
        // este ASIN, reaproveitamos o último preço conhecido; senão o produto
        // fica pendente até a próxima rodada do worker.
        const known = await User.findOne(
            { products: { $elemMatch: { asin, status: "ok" } } },
            { "products.$": 1 }
        )
        const knownProduct = known?.products?.[0]

        const newProduct = knownProduct
            ? {
                link: canonicalUrl,
                asin,
                name: knownProduct.name,
                lastPrice: knownProduct.lastPrice,
                status: "ok",
                lastCheckedAt: knownProduct.lastCheckedAt,
                history: [{ price: knownProduct.lastPrice }]
            }
            : {
                link: canonicalUrl,
                asin,
                status: "pending",
                history: []
            }

        user.products.push(newProduct)
        await user.save()

        const product = user.products[user.products.length - 1]
        const msg = knownProduct
            ? "Produto adicionado com sucesso!"
            : "Produto adicionado! O preço aparece após a próxima verificação."

        res.status(200).json({ msg, product })
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
    console.log('productid', productId)

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

// Situação do worker local, para o frontend avisar quando as verificações estão paradas.
const WORKER_ONLINE_WINDOW_MS = 15 * 60 * 1000

app.get("/auth/scraper-status", checkToken, async (req, res) => {
    try {
        const status = await WorkerStatus.findById("default").lean()
        const lastSeenAt = status?.lastSeenAt || null
        const online = Boolean(lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < WORKER_ONLINE_WINDOW_MS)
        const paused = status?.state === "paused" && status?.pausedUntil && new Date(status.pausedUntil) > new Date()

        res.status(200).json({
            online,
            state: paused ? "paused" : "running",
            pausedUntil: paused ? status.pausedUntil : null,
            lastSeenAt
        })
    } catch (error) {
        console.log("Erro ao buscar status do scraper:", error)
        res.status(500).json({ msg: "Erro no servidor, tente novamente mais tarde!" })
    }
})

const conn = require("./db/Connect.js")

async function startServer() {
    const PORT = process.env.PORT || 3000;
    if (!process.env.SECRET) {
        throw new Error("A variável SECRET não foi definida.")
    }

    if ((process.env.WORKER_TOKEN || "").length < 32) {
        console.warn("WORKER_TOKEN não definido (ou com menos de 32 caracteres): o worker local não conseguirá enviar preços.")
    }

    await conn()
    try {
        await backfillProductAsins()
    } catch (error) {
        console.error("Erro no backfill de ASIN dos produtos:", error)
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Servidor rodando na porta ${PORT}`)
    })
}

startServer().catch((error) => {
    console.error("Não foi possível iniciar o servidor:", error)
    process.exit(1)
})