import express, {Router} from "express";
import bot from "../../bot";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';

export const telegramBotRouter: Router = express.Router();

telegramBotRouter.post("/:token", async (req, res) => {
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
