import TelegramBot from "node-telegram-bot-api";
import {responsePeriodParser} from "./statisticService";
import {Period} from "./timeService";

export function escapeRegex(string: string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function uppercaseStart(text: string) {
    return text.at(0).toUpperCase() + text.slice(1);
}


export function bold(text: string|number) {
    return `<b>${text}</b>`;
}

export function italic(text: string|number) {
    return `<i>${text}</i>`;
}


export function userUrl(chatId: string|number, name: string){
    return `<a href="tg://user?id=${chatId}">${name}</a>`
}


export function periodButton(fields: string[], period: Period, minus: number) {
    let buttons: TelegramBot.InlineKeyboardButton[][] = [[], []]
    if (period !== "allTime") {
        buttons[0].push({
            text: "Previous " + fields[1] + " (" + responsePeriodParser(period, minus + 1) + ")",
            callback_data: [fields[0], fields[1], minus + 1].join("&")
        })
        if (minus > 0) {
            buttons[0].push({
                text: "Next " + fields[1] + " (" + responsePeriodParser(period, minus - 1) + ")",
                callback_data: [fields[0], fields[1], minus - 1].join("&")
            })
            if (minus > 1) {
                buttons[1].push({
                    text: uppercaseStart(responsePeriodParser(period, 0)),
                    callback_data: [fields[0], fields[1], 0].join("&")
                })
            }
        }
    }
    return buttons;
}