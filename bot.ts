import TelegramBot from "node-telegram-bot-api";
import clientService from "./services/clientService";
import goalService from "./services/goalService";
import countService from "./services/countService";
import {getStatistics} from "./services/statisticService";
import {parseDate, parsePeriodFromDate, Period, responsePeriodParser} from "./services/timeService";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {bold, italic, periodButton, uppercaseStart, userUrl} from "./services/utils";
import {turnNotification} from "./services/notificationService";
import axios from "axios";
import streakService from "./services/streakService";
import tokenService from "./services/tokenService";
import rankService from "./services/rankService";
import recordService from "./services/recordService";

dotenv.config()

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
console.log(process.env.NODE_ENV)

const bot = new TelegramBot(TELEGRAM_TOKEN, {});

bot.on("message", async (msg) => {
    console.log(`New message from ${msg.from!.id} in chat ${msg.chat.id}`)
    const client = await clientService.getClientByChatId(msg.from.id);
    if (client) {
        if (client.fullName !== msg.from.first_name || client.username !== msg.from.username) {
            await clientService.updateClient({
                chatId: msg.from.id,
                fullName: msg.from!.first_name,
                username: msg.from!.username || '',
            })
        }
    } else {
        await clientService.addClient({
            chatId: msg.chat.id,
            fullName: msg.from!.first_name,
            username: msg.from!.username || '',
        })
    }
})

bot.on("callback_query", async (query) => {
    console.log(`New callback query from ${query.from!.id} in chat ${query.message.chat.id}`)
    let fields = query.data!.split("&");
    try {
        switch (fields[0]) {
            case "cancel": {
                let fromId = query.message.reply_to_message?.from?.id
                if (typeof fromId !== "undefined" && fromId !== query.from.id) {
                    await bot.answerCallbackQuery(query.id, {
                        text: "It is not your button!",
                        show_alert: true,
                    })
                    break;
                }
                await bot.editMessageText("Canceled!", {
                    message_id: query.message!.message_id,
                    chat_id: query.message!.chat.id,
                })
                break;
            }
            case "count": {
                let fromId = fields[1],
                    goalId = fields[2] as unknown as mongoose.Types.ObjectId,
                    amount = parseInt(fields[3])
                if (isNaN(amount)) {
                    await bot.answerCallbackQuery(query.id, {
                        text: "Something wrong with amount",
                        show_alert: true,
                    })
                    break;
                }
                if (fromId !== query.from.id + "") {
                    await bot.answerCallbackQuery(query.id, {
                        text: "It is not your button!",
                        show_alert: true,
                    })
                    break;
                }
                let goal = await goalService.getGoalById(goalId);
                let count = await countService.addCount(goalId, fromId, amount);
                if (count) {
                    await bot.editMessageText(`${userUrl(query.from.id, query.from.first_name)}, new data recorded\n\n${uppercaseStart(goal.name)} +${amount}`, {
                        message_id: query.message!.message_id,
                        chat_id: query.message!.chat.id,
                        parse_mode: "HTML",
                    })
                    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/setMessageReaction`, {
                        chat_id: query.message.chat.id,
                        message_id: query.message.reply_to_message.message_id,
                        reaction: [
                            {
                                type: "emoji",
                                emoji: countService.reactionForCount(amount),
                            }
                        ],
                        is_big: true,
                    }).catch(console.error)
                }
                break;
            }
            case "statistics": {
                let from = query.message!.reply_to_message!.from;
                let minus = parseInt(fields[2]) || 0;
                let period = fields[1] as Period;
                let statistics = await getStatistics(query.message!.chat.id, from!.id, period, minus);
                let response = `Statistics of ${userUrl(from!.id, from!.first_name)} for ${responsePeriodParser(period, minus)}:\n\n`;
                for (let i = 0; i < statistics.length; i++) {
                    let statistic = statistics[i];
                    response += `${i + 1}. ${countService.printCount(statistic.goal, statistic.amount)}\n`
                }

                await bot.sendMessage(query.message!.chat.id, response, {
                    parse_mode: "HTML",
                    reply_to_message_id: query.message!.reply_to_message!.message_id,
                    reply_markup: {
                        inline_keyboard: periodButton(fields, period, minus)
                    }
                })
                break;
            }
            case "top": {
                let period = fields[1] as Period;
                let maxRank = parseInt(fields[2]) || 1;
                if (maxRank > 10) {
                    maxRank = 10;
                }
                let minus = parseInt(fields[3]) || 0;
                let tops = await rankService.getTop(query.message.chat.id, maxRank, period, minus);
                let response = `${bold("Top " + maxRank)} for ${bold(responsePeriodParser(period, minus))}:\n\n`;
                for (let o of tops) {
                    response += `${bold(uppercaseStart(o.goal.name))}:\n${rankService.parseRankResult(o.ranks)}\n`;
                }
                await bot.sendMessage(query.message!.chat.id, response, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: periodButton(fields, period, minus)
                    }
                })
                break;
            }
            case "missed": {
                let from = query.message!.reply_to_message!.from;
                let minus = parseInt(fields[2]) || 0;
                let period = fields[1] as Period;
                let result = await streakService.getMissedDaysByClientId(query.message!.chat.id, from!.id, period, minus);
                let response = `Missed days of ${userUrl(from!.id, from!.first_name)} for ${responsePeriodParser(period, minus)}:\n`;
                for (let i = 0; i < result.length; i++) {
                    let missed = result[i];
                    response += `\n${bold(uppercaseStart(missed.goal.name))}:\n${missed.notMissedDays} of ${missed.total}\n` +
                        `Missed: ${bold(missed.missedDays)} (${Math.round((missed.missedDays / missed.total) * 100)}%)\n`
                }
                await bot.sendMessage(query.message!.chat.id, response, {
                    parse_mode: "HTML",
                    reply_to_message_id: query.message!.reply_to_message!.message_id,
                    reply_markup: {
                        inline_keyboard: periodButton(fields, period, minus)
                    }
                })
                break;
            }
            case "confirm": {
                let tokenInfo = await tokenService.getToken(fields[1]);
                if (!tokenInfo) {
                    await bot.answerCallbackQuery(query.id, {
                        text: "Token not found!",
                        show_alert: true,
                    })
                    return;
                }
                try {
                    await tokenService.verifyToken(tokenInfo._id, query.from.id);
                } catch (e) {
                    await bot.answerCallbackQuery(query.id, {
                        text: e.error,
                        show_alert: true,
                    })
                    return
                }
                await bot.answerCallbackQuery(query.id, {
                    text: "Token verified!!!",
                    show_alert: true,
                })
                await bot.editMessageText(`You are successfully logged in device:\n\n${bold(tokenInfo.device.brand + " " + tokenInfo.device.model)} as ${userUrl(query.from.id, query.from.first_name)}`, {
                    message_id: query.message!.message_id,
                    chat_id: query.message!.chat.id,
                    parse_mode: "HTML",
                })
                break;
            }
        }
    } catch (e) {
        console.error(e)
    }
    await bot.answerCallbackQuery(query.id)
})

bot.onText(/\/start/, async (msg) => {
    try {
        let chatId = msg.chat.id;
        if (msg.chat.type === "private") {
            let existById = await clientService.existByChatId(chatId);
            if (existById) {
                await bot.sendMessage(chatId, `Hi ${msg.from!.first_name}. Nice to meet you again!`)
            } else {
                await clientService.addClient({
                    chatId,
                    fullName: msg.from!.first_name,
                    username: msg.from!.username || '',
                })
                await bot.sendMessage(chatId, `Hi ${msg.from!.first_name}. Welcome to goal counter bot`)
            }
            if (msg.text.startsWith("/start ")) {
                const token = msg.text.split(" ")[1];
                const tokenInfo = await tokenService.getToken(token)
                await bot.sendMessage(chatId, `You are trying to login in device:\n\n${bold(tokenInfo.device.brand + " " + tokenInfo.device.model)} as ${userUrl(chatId, msg.from!.first_name)}\n\nPlease confirm it!`, {
                    reply_markup: {
                        inline_keyboard: [[
                            {text: "Cancel ❌", callback_data: "cancel"},
                            {text: "Confirm ✅", callback_data: `confirm&${tokenInfo._id}`},
                        ]]
                    },
                    parse_mode: "HTML"
                })
            }
        } else {
            await bot.sendMessage(chatId, `Hello everyone!`)
        }
    } catch (e) {
        console.error(e)
    }
})

bot.onText(/\/goals/, async (msg) => {
    try {
        let chatId = msg.chat.id;
        let goals = await goalService.getAllGoalByChatId(chatId);
        if (goals.length === 0) {
            await bot.sendMessage(chatId, "There no any goals created for this chat!")
            return;
        }
        let result = `Goal lists:\n\n`
        for (let i = 0; i < goals.length; i++) {
            result += `${i + 1}. ${goals[i].name}\n`;
        }
        await bot.sendMessage(chatId, result)
    } catch (e) {
        console.error(e)
    }
})

bot.onText(/\/new +(.+)/i, async (msg, match) => {
    try {
        let chatId = msg.chat.id, fromId = msg.from!.id, goalName = match![1];
        if (!goalName || goalName.trim().length === 0) {
            await bot.sendMessage(chatId, `Please write correct command. Example: /new goalName`, {
                reply_to_message_id: msg.message_id,
                allow_sending_without_reply: true,
            });
            return;
        }
        let newGoal = await goalService.addGoal(goalName, chatId, fromId);
        if (newGoal) {
            await bot.sendMessage(chatId, `Goal "${goalName}" created!`, {
                reply_to_message_id: msg.message_id,
                allow_sending_without_reply: true,
            });
            return;
        }
        await bot.sendMessage(chatId, `I think goal with name "${goalName}" already created in this chat`, {
            reply_to_message_id: msg.message_id,
            allow_sending_without_reply: true,
        });
    } catch (e) {
        console.error(e);
    }
})

bot.onText(/\/count (.+) (\d+)/, async (msg, match) => {
    try {
        let chatId = msg.chat.id, goalName = match![1], amount = parseInt(match![2]);
        let goal = await goalService.getGoalByNameAndChatId(goalName, chatId);
        if (!goal) {
            await bot.sendMessage(chatId, `Goal with name "${goalName}" not found`);
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            await bot.sendMessage(chatId, "Amount cannot be less or equal to zero", {
                reply_to_message_id: msg.message_id,
                allow_sending_without_reply: true,
            })
            return;
        }
        let client = clientService.existByChatId(msg.from!.id);
        if (!client) {
            await bot.sendMessage(chatId, "Please first register by sending start command to me in private chat", {
                reply_to_message_id: msg.message_id,
                allow_sending_without_reply: true,
            })
            return;
        }
        await bot.sendMessage(chatId,
            `${userUrl(msg.from!.id, msg.from!.first_name)}, confirm adding new record:\n\n${goal.name} +${amount}`, {
                reply_to_message_id: msg.message_id,
                allow_sending_without_reply: true,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [[
                        {text: "Cancel", callback_data: "cancel"},
                        {text: "Confirm", callback_data: `count&${msg.from!.id}&${goal._id}&${amount}`}
                    ]]
                }
            })
    } catch (e) {

    }
})


bot.onText(/\/statistics/, async (msg) => {
    try {
        let chatId = msg.chat.id;
        let goals = await goalService.getAllGoalByChatId(chatId);
        let from = msg.reply_to_message ? msg.reply_to_message.from : msg.from;
        if (goals.length === 0) {
            await bot.sendMessage(chatId, "There no any goals!")
            return;
        }
        await bot.sendMessage(chatId, `Please choose period for ${userUrl(from!.id, from!.first_name)}'s statistics:`, {
            reply_markup: {
                inline_keyboard: [
                    [{text: "All time", callback_data: `statistics&allTime`}],
                    [{text: "Year", callback_data: `statistics&year`}],
                    [{text: "Month", callback_data: `statistics&month`}],
                    [{text: "Week", callback_data: `statistics&week`}],
                    [{text: "Day", callback_data: `statistics&day`}],
                ]
            },
            reply_to_message_id: msg.reply_to_message ? msg.reply_to_message.message_id : msg.message_id,
            parse_mode: "HTML",
        })
    } catch (e) {
        console.error(e);
    }
})


bot.onText(/^\/top(10|[1-9]|)/, async (msg, match) => {
    try {
        if (msg.chat.type === "private") {
            return await bot.sendMessage(msg.chat.id, "Here you are always the best🏆", {
                parse_mode: "HTML",
            })
        }
        let maxRank = parseInt(match[1]) || 1;
        if (maxRank > 10) {
            maxRank = 10;
        }
        let chatId = msg.chat.id;
        let goals = await goalService.getAllGoalByChatId(chatId);
        if (goals.length === 0) {
            await bot.sendMessage(chatId, "There no any goals!")
            return;
        }
        await bot.sendMessage(chatId, `Please choose period for ${bold("Top " + maxRank)}`, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{text: "All time", callback_data: `top&allTime&${maxRank}`}],
                    [{text: "Year", callback_data: `top&year&${maxRank}`}],
                    [{text: "Month", callback_data: `top&month&${maxRank}`}],
                    [{text: "Week", callback_data: `top&week&${maxRank}`}],
                    [{text: "Day", callback_data: `top&day&${maxRank}`}],
                ]
            },
            reply_to_message_id: msg.reply_to_message ? msg.reply_to_message.message_id : msg.message_id,
        })
    } catch (e) {
        console.error(e);
    }
})

bot.onText(/^\/streak/, async (msg) => {
    try {
        let chatId = msg.chat.id,
            from = msg.reply_to_message ? msg.reply_to_message.from : msg.from;
        let goals = await goalService.getAllGoalByChatId(chatId);
        if (goals.length === 0) {
            await bot.sendMessage(chatId, "There no any goals!")
            return;
        }

        let response = `Streak of ${userUrl(from!.id, from!.first_name)}:\n`;

        const result = await Promise.all(goals.map(async (goal) =>
            streakService.getStreakByClientIdAndGoalId(from!.id, goal._id)))
        console.log(result)
        for (let i = 0; i < result.length; i++) {
            let streak = result[i];
            if (!streak || streak.longestStreak.length === 0) {
                response += `\n${bold(uppercaseStart(goals[i].name))}:\n${italic("No streak")}`
                continue;
            }
            response += `\n${bold(uppercaseStart(goals[i].name))}:\n${italic("Current streak:")}` +
                (streak.currentStreak.length > 0 ? `\nDays: ${streak.currentStreak.length}\n` : "No\n") +
                (streak.currentStreak.length > 0 ? `Started date: ${parseDate(new Date(streak.currentStreak.start))}\n` : "") +
                `${italic("Longest streak:")} \nDays: ${streak.longestStreak.length}\n` +
                (streak.longestStreak.length > 0 ? `Started date: ${parseDate(new Date(streak.longestStreak.start)) ?? "No streak"}\n` +
                    `Ended date: ${parseDate(new Date(streak.longestStreak.end)) ?? "No streak"}\n` : "")
        }
        await bot.sendMessage(chatId, response, {
            reply_to_message_id: msg.message_id,
            allow_sending_without_reply: true,
            parse_mode: "HTML",
        })
    } catch (e) {
        console.error(e)
    }
})

bot.onText(/^\/missed/, async (msg) => {
    try {
        let chatId = msg.chat.id;
        let goals = await goalService.getAllGoalByChatId(chatId);
        let from = msg.reply_to_message ? msg.reply_to_message.from : msg.from;
        if (goals.length === 0) {
            await bot.sendMessage(chatId, "There no any goals!")
            return;
        }
        await bot.sendMessage(chatId, `Please choose period for ${userUrl(from!.id, from!.first_name)}'s missed days:`, {
            reply_markup: {
                inline_keyboard: [
                    [{text: "Year", callback_data: `missed&year`}],
                    [{text: "Month", callback_data: `missed&month`}],
                    [{text: "Week", callback_data: `missed&week`}],
                ]
            },
            reply_to_message_id: msg.reply_to_message ? msg.reply_to_message.message_id : msg.message_id,
            parse_mode: "HTML",
        })
    } catch (e) {
        console.error(e);
    }
})

bot.onText(/^\/record/, async (msg) => {
    try {
        let chatId = msg.chat.id;
        let goals = await goalService.getAllGoalByChatId(chatId);
        if (goals.length === 0) {
            await bot.sendMessage(chatId, "There no any goals!")
            return;
        }
        let response = `Record history of ${userUrl(msg.from!.id, msg.from!.first_name)}:\n\n`
        for (let goal of goals) {
            let history = await recordService.getRecordHistory(goal._id, msg.from!.id);
            response += `${bold(uppercaseStart(goal.name))}:\n`
            for (let key in history) {
                if (history[key].totalAmount === 0 || !history[key].period) {
                    response += `${uppercaseStart(key)}: No record\n`
                    continue;
                }
                response += `${uppercaseStart(key)}: ${history[key].totalAmount} (${parsePeriodFromDate(history[key].period, key as Period)})\n`
            }
            response += "\n"
        }
        await bot.sendMessage(chatId, response, {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id,
        })
    } catch (e) {
        console.error(e);
    }
})

bot.onText(/^\/notification_(off|on)/, async (msg, match) => {
    if (msg.chat.type === "private") {
        return await bot.sendMessage(msg.chat.id, "Private chats don't support notification!")
    }
    if (match[1] === "on") {
        await turnNotification(msg.chat.id.toString(), true)
    } else if (match[2] === "off") {
        await turnNotification(msg.chat.id.toString(), false)
    }
    return await bot.sendMessage(msg.chat.id, "Notification turned " + match[1], {
        reply_to_message_id: msg.message_id
    })
})
//
//
// bot.onText(/\/quote/, async (msg) => {
//     let quoteOfDay = await getQuoteOfDay();
//     return bot.sendMessage(msg.chat.id, quoteOfDay)
// })
//
// bot.onText(/\/rec/, async (msg) => {
//     let quoteOfDay = await getRecommendation(msg.chat.id, 3, "week");
//     const response = await notificationMessage(msg.chat.id, 3, "week")
//     let message = await bot.sendMessage(msg.chat.id, response, {
//         parse_mode: "HTML"
//     });
//     return bot.sendMessage(msg.chat.id, quoteOfDay, {
//         parse_mode: "Markdown",
//         reply_to_message_id: message.message_id,
//     })
// })


export default bot;