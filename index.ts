import dotenv from 'dotenv'
import express from 'express';
import mongoose from "mongoose";
import bot from "./bot";
import {isMonday, setDefaultOptions} from "date-fns";
import cron from "node-cron"
import {sendNotification} from "./services/notificationService";
import {getTime} from "./services/timeService";
import helmet from "helmet";
import rateLimiter from "./common/middleware/rateLimiter";
import {healthCheckRouter} from "./routes/healthCheck/healthCheckRouter";
import errorHandler from "./common/middleware/errorHandler";
import {telegramBotRouter} from "./routes/bot/telegramBotRouter";
import {authRouter} from "./routes/auth/authRouter";
import {goalRouter} from "./routes/goal/goalRouter";
import {auth} from "./common/middleware/auth";
import {chatRouter} from "./routes/chat/chatRouter";


dotenv.config()
setDefaultOptions({
    weekStartsOn: 1,
})
const app = express()

const PORT = process.env.PORT || 4000
const MONGO_URL = process.env.MONGO_URL || '';
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';


app.use(express.json())
app.use(express.urlencoded({ extended: true }));
// app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Routes
app.use("/api/health-check", healthCheckRouter);
app.use("/api/bot", telegramBotRouter);
app.use("/api/auth", authRouter);
app.use("/api/goal", auth, goalRouter)
app.use("/api/chat", auth, chatRouter)

// Error handlers
app.use(errorHandler());


cron.schedule("0 0 * * *", async () => {
    await sendNotification(3, "day", 1);
})

cron.schedule("0 0 * * 1", async () => {
    await sendNotification(3, "week", isMonday(getTime()) ? 1 : 0, false);
})

cron.schedule("0 0 1 * *", async () => {
    await sendNotification(3, "month", 1, false);
})

app.listen(PORT, async () => {
    console.log(`Server is up and running on PORT ${PORT}`)
    mongoose.connect(MONGO_URL, {}).then(() => {
        if (process.env.NODE_ENV === "development") {
            console.log(`Server is up and running on DEV to bot ${TELEGRAM_TOKEN.replace(/:(.+)/, "")}`)
            bot.startPolling({
                polling: {
                    params: {
                        allowed_updates: ["message", "callback_query"]
                    }
                }
            }).then()
        }
        bot.getMe().then((me) => {
            console.log("Listening to bot @" + me.username)
        })
    })
})