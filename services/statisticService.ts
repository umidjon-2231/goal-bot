import countService from "./countService";
import goalService from "./goalService";
import timeService, {parseDate, Period} from "./timeService";
import TelegramBot from "node-telegram-bot-api";
import {format, isThisWeek, isThisYear, isToday} from "date-fns";
import {GoalI} from "../models/Goal";

export const getStatistics = async (chatId: string | number, from: TelegramBot.User, period: Period, minus: number) => {
    let result: {goal: GoalI, amount: number}[] = []
    let goals = await goalService.getAllGoalByChatId(chatId);
    let oldestGoal = await goalService.getOldestGoalOfChat(chatId);
    console.log(oldestGoal.createdTime);
    let {end, start} = timeService.periodToStartAndEndDate(period, minus, oldestGoal.createdTime);
    for (let goal of goals) {
        let amount = await countService.getCountByClientIdAndTime(goal._id, from.id, start, end);
        result.push({goal, amount})
    }
    return result.sort((a, b) => {
        let diff = b.amount - a.amount;
        return diff===0?b.goal.name.localeCompare(a.goal.name):diff;
    });
}

export const responsePeriodParser = (period: Period, minus: number): string => {
    let {end, start} = timeService.periodToStartAndEndDate(period, minus);
    switch (period) {
        case "year":
            if (isThisYear(start)) {
                return "this year"
            }
            return start.getFullYear().toString();
        case "month":
            return format(start, `MMMM${isThisYear(start) ? "" : " yyyy"}`);
        case "day":
            if (isToday(start)) {
                return "today";
            }
            return parseDate(start);
        case "week":
            if (isThisWeek(start)) {
                return "this week";
            }
            break;
        case "today":
            return "today";
        case "allTime":
            return "all time";
    }
    return `${parseDate(start)} to ${parseDate(end)}`
}
