import {getChatsNotificationOn} from "./goalService";
import {getTop, parseRankResult} from "./rankService";
import {bold, uppercaseStart} from "./utils";
import {responsePeriodParser} from "./statisticService";
import {Period} from "./timeService";
import bot from "../bot";
import Goal from "../models/Goal";

export const sendNotification = async (maxRank: number, period: Period, minus: number = 0) => {
    let chats = await getChatsNotificationOn();
    let queue: Promise<any>[] = []
    for (const chat of chats) {
        let tops = await getTop(chat._id, maxRank, period, minus);
        let response = `${bold("Top " + maxRank)} for ${bold(responsePeriodParser(period, minus))}:\n\n`;
        for (let o of tops) {
            response += `${bold(uppercaseStart(o.goal.name))}:\n${parseRankResult(o.counts)}\n`;
        }
        queue.push(bot.sendMessage(chat._id, response, {
            parse_mode: "HTML"
        }))
    }
    await Promise.all(queue)
}


export const turnNotification = (chatId: string, turnOn: boolean) => {
    return Goal.updateMany({
        chatId
    }, {notification: turnOn})
}