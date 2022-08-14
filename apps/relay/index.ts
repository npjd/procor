import cors from "cors"
import { config as dotenvConfig } from "dotenv"
import { Contract, providers, utils, Wallet } from "ethers"
import express from "express"
import { resolve } from "path"
import { abi as eventsAbi } from "../contracts/build/contracts/contracts/Events.sol/Events.json"
import { abi as procorAbi } from "../contracts/build/contracts/contracts/Procor.sol/Procor.json"

dotenvConfig({ path: resolve(__dirname, "../../.env") })

if (typeof process.env.CONTRACT_ADDRESS !== "string") {
    throw new Error("Please, define CONTRACT_ADDRESS in your .env file")
}

if (typeof process.env.ETHEREUM_URL !== "string") {
    throw new Error("Please, define ETHEREUM_URL in your .env file")
}

if (typeof process.env.ETHEREUM_PRIVATE_KEY !== "string") {
    throw new Error("Please, define ETHEREUM_PRIVATE_KEY in your .env file")
}

if (typeof process.env.RELAY_URL !== "string") {
    throw new Error("Please, define RELAY_URL in your .env file")
}

const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY
const ethereumURL = process.env.ETHEREUM_URL
const contractAddress = process.env.CONTRACT_ADDRESS
const { port } = new URL(process.env.RELAY_URL)

const app = express()

app.use(cors())
app.use(express.json())

const provider = new providers.JsonRpcProvider(ethereumURL)
const signer = new Wallet(ethereumPrivateKey, provider)
const eventsContract = new Contract(contractAddress, eventsAbi, signer)
const procorContract = new Contract(contractAddress, procorAbi, signer)

app.post("/post-review", async (req, res) => {
    const { review, nullifierHash, groupId, solidityProof } = req.body

    try {
        const transaction = await eventsContract.postReview(
            utils.formatBytes32String(review),
            nullifierHash,
            groupId,
            solidityProof
        )

        await transaction.wait()

        res.status(200).end()
    } catch (error: any) {
        console.error(error)

        res.status(500).end()
    }
})

app.post("/add-member", async (req, res) => {
    const { groupId, identityCommitment } = req.body

    try {
        const transaction = await eventsContract.addMember(groupId, identityCommitment)

        await transaction.wait()

        res.status(200).end()
    } catch (error: any) {
        console.error(error)

        res.status(500).end()
    }
})

app.post("/ask-question", async (req, res) => {
    const { sessionId, question, root, nullifierHash, solidityProof } = req.body

    try {
        const transaction = await procorContract.postQuestion(
            sessionId,
            utils.formatBytes32String(question),
            root,
            nullifierHash,
            solidityProof
        )

        await transaction.wait()

        res.status(200).end()
    } catch (error: any) {
        console.error(error)

        res.status(500).end()
    }
})

app.post("/vote-question", async (req, res) => {
    const { signal, root, nullifierHash, externalNullifier, solidityProof } = req.body
    try {
        const transaction = await procorContract.voteQuestion(
            signal,
            root,
            nullifierHash,
            externalNullifier,
            solidityProof
        )

        await transaction.wait()

        res.status(200).end()
        
    } catch (error: any) {
        console.error(error)

        res.status(500).end()
    }
})

app.post("/join-session", async (req, res) => {
    const { sessionId, identityCommitment } = req.body

    try {
        const transaction = await procorContract.joinSession(sessionId, identityCommitment)

        await transaction.wait()

        res.status(200).end()
    } catch (error: any) {
        console.error(error)

        res.status(500).end()
    }
})

app.listen(port, () => {
    console.info(`Started HTTP relay API at ${process.env.RELAY_URL}/`)
})
