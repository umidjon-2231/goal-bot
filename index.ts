require('dotenv').config()
import express from 'express';
import mongoose from "mongoose";
import bot from "./bot";

const app = express()

const PORT = process.env.PORT || 4000
const MONGO_URL = process.env.MONGO_URL || '';
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';


app.use(express.json())

app.post("/api/bot/:token", async (req, res) => {
    try {
        if (req.params.token !== TELEGRAM_TOKEN) {
            res.status(400)
            return
        }
        let message = req.body;
        console.log(message);
        await bot.processUpdate(message)
        res.status(200).json()
    } catch (e) {
        res.status(400).json({message: e})
    }
})

app.listen(PORT, async () => {
    await mongoose.connect(MONGO_URL, {})
    console.log(`Server is up and running on PORT ${PORT}`)
})