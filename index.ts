import dotenv from 'dotenv'
import express from 'express';
import mongoose from "mongoose";
import bot from "./bot";
import {isMonday, setDefaultOptions} from "date-fns";
import cron from "node-cron"
import {sendNotification} from "./services/notificationService";
import {getTime} from "./services/timeService";

dotenv.config()
setDefaultOptions({
    weekStartsOn: 1,
})
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
        bot.processUpdate(message)
        res.status(200).json()
    } catch (e) {
        res.status(400).json({message: e})
    }
})

cron.schedule("0 0 * * *", async () => {
    await sendNotification(3, "day",  1);
})

cron.schedule("0 0 * * 1", async () => {
    await sendNotification(3, "week", isMonday(getTime()) ? 1 : 0);
})

cron.schedule("0 0 1 * *", async () => {
    await sendNotification(3, "month", 1);
})

if (process.env.NODE_ENV === "development") {
    mongoose.connect(MONGO_URL, {}).then(() => {
        console.log(`Server is up and running on DEV to bot ${TELEGRAM_TOKEN.replace(/:(.+)/, "")}`)

        bot.getMe().then((me) => {
            console.log("Listening to bot @" + me.username)
        })
        bot.startPolling({
            polling: {
                params: {
                    allowed_updates: ["message", "callback_query"]
                }
            }
        }).then()
    })
} else {
    app.listen(PORT, async () => {
        await mongoose.connect(MONGO_URL, {})
        console.log(`Server is up and running on PORT ${PORT} to bot ${TELEGRAM_TOKEN.replace(/:(.+)/, "")}`)
    })
}