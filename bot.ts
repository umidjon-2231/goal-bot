import TelegramBot from "node-telegram-bot-api";

import clientService from "./services/clientService";

import goalService from "./services/goalService";

import countService from "./services/countService";

import {getStatistics, responsePeriodParser} from "./services/statisticService";
import {Period} from "./services/timeService";
import mongoose from "mongoose";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';


const bot = new TelegramBot(TELEGRAM_TOKEN, {webHook: true});

bot.on("message", (msg) => {
    console.log(`New message from ${msg.from!.id} in chat ${msg.chat.id}`)
})

bot.on("callback_query", async (query) => {
    console.log(query)
    let fields = query.data!.split("&");
    console.log(fields)
    try {
        switch (fields[0]) {
            case "cancel": {
                let fromId = fields[1]
                if (fromId !== query.from.id + "") {
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
                let fromId = fields[1], goalId = fields[2] as unknown as typeof mongoose.Types.ObjectId, amount = parseInt(fields[3])
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
                    await bot.editMessageText(`[${query.from.first_name}](tg://user?id=${query.from.id}), new data recorded\n\n${goal.name} +${amount}`, {
                        message_id: query.message!.message_id,
                        chat_id: query.message!.chat.id,
                        parse_mode: "Markdown",
                    })
                }
                break;
            }
            case "statistics": {
                let from = query.message!.reply_to_message!.from;
                let statistics = await getStatistics(query.message!.chat.id, from!, fields[1] as Period, fields.length > 2 ? parseInt(fields[2]) : 0);
                let response = `Statistics of [${from!.first_name}](tg://user?id=${from!.id}) ${responsePeriodParser(fields[1] as Period, fields.length > 2 ? parseInt(fields[2]) : 0)}:\n\n`;
                for (let i = 0; i < statistics.length; i++) {
                    let statistic = statistics[i];
                    response += `${i + 1}. ${countService.printCount(statistic.goal, statistic.amount)}\n`
                }
                await bot.sendMessage(query.message!.chat.id, response, {
                    parse_mode: "Markdown"
                })
                break;
            }
        }
    } catch (e) {
        console.error(e)
    }
})

bot.onText(/\/start/, async (msg) => {
    try {
        let chatId = msg.chat.id;
        if (msg.chat.type === "private") {
            let existById = await clientService.existByChatId(chatId);
            if (!existById) {
                await clientService.addClient({
                    chatId,
                    fullName: msg.from!.first_name,
                    username: msg.from!.username || '',
                })
                await bot.sendMessage(chatId, `Hi ${msg.from!.first_name}. Welcome to goal counter bot`)
                return;
            }
            await bot.sendMessage(chatId, `Hi ${msg.from!.first_name}. Nice to meet you again!`)
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
        //count&656634861&65e2575cd25df84ba017d715&10
        let client = clientService.existByChatId(msg.from!.id);
        if (!client) {
            await bot.sendMessage(chatId, "Please first register by sending start command to me in private chat", {
                reply_to_message_id: msg.message_id,
                allow_sending_without_reply: true,
            })
            return;
        }
        console.log(`count&${msg.from!.id}&${goal._id}&${amount}`)
        await bot.sendMessage(chatId,
            `[${msg.from!.first_name}](tg://user?id=${msg.from!.id}), confirm adding new record:\n\n${goal.name} +${amount}`, {
                reply_to_message_id: msg.message_id,
                allow_sending_without_reply: true,
                parse_mode: "Markdown",
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
        await bot.sendMessage(chatId, `Please choose period of [${from!.first_name}](tg://user?id=${from!.id}):`, {
            reply_markup: {
                inline_keyboard: [
                    [{text: "All time", callback_data: `statistics&allTime`}],
                    [{text: "This year", callback_data: `statistics&year`}],
                    [{text: "This month", callback_data: `statistics&month`}],
                    [{text: "This week", callback_data: `statistics&week`}],
                    [{text: "Today", callback_data: `statistics&today`}],
                ]
            },
            reply_to_message_id: msg.reply_to_message ? msg.reply_to_message.message_id : msg.message_id,
            parse_mode: "Markdown",
        })
        // let result = `Goal statistics of [${from.first_name}](tg://user?id=${from.id}) for all time:\n\n`
        // for (let i = 0; i < goals.length; i++) {
        //     let goal = goals[i];
        //     let totalCount = await countService.getTotalCountByClientId(goal._id, from.id);
        //     result += `${i + 1}. ${goal.name} - ${totalCount}\n`
        // }
        // await bot.sendMessage(chatId, result, {
        //     parse_mode: "Markdown",
        // });
    } catch (e) {
        console.error(e);
    }
})


export default bot;