import {getChatsNotificationOn} from "./goalService";
import {getTop, parseRankResult} from "./rankService";
import {bold, uppercaseStart} from "./utils";
import {responsePeriodParser} from "./statisticService";
import {Period} from "./timeService";
import bot from "../bot";
import Goal from "../models/Goal";
import {getRecommendation} from "./aiService";

export const sendNotification = async (maxRank: number, period: Period, minus: number = 0) => {
    let chats = await getChatsNotificationOn();
    let queue: Promise<any>[] = []
    for (const chat of chats) {
        let response = await notificationMessage(chat._id, maxRank, period, minus);
        queue.push(async function () {
            let message = await bot.sendMessage(chat._id, response, {
                parse_mode: "HTML"
            });
            const rec = await getRecommendation(chat._id, maxRank, period, minus)
            return bot.sendMessage(chat._id, rec, {
                reply_to_message_id: message.message_id,
            })
        }())
    }
    await Promise.all(queue)
}

export const notificationMessage = async (chatId: number, maxRank: number, period: Period, minus: number = 0) => {
    let tops = await getTop(chatId, maxRank, period, minus);
    let response = `${bold("Top " + maxRank)} for ${bold(responsePeriodParser(period, minus))}:\n\n`;
    for (let o of tops) {
        response += `${bold(uppercaseStart(o.goal.name))}:\n${parseRankResult(o.counts)}\n`;
    }
    return response;
}


export const turnNotification = (chatId: string, turnOn: boolean) => {
    return Goal.updateMany({
        chatId
    }, {notification: turnOn})
}