import countService from "./countService";
import goalService from "./goalService";
import timeService, {Period} from "./timeService";
import TelegramBot from "node-telegram-bot-api";
import {GoalI} from "../models/Goal";

export const getStatistics = async (chatId: string | number, fromId: number, period: Period, minus: number) => {
    let result: { goal: GoalI, amount: number }[] = []
    let goals = await goalService.getAllGoalByChatId(chatId);
    let oldestGoal = await goalService.getOldestGoalOfChat(chatId);
    let {end, start} = timeService.periodToStartAndEndDate(period, minus, oldestGoal.createdTime);
    for (let goal of goals) {
        let amount = await countService.getCountByClientIdAndTime(goal._id, fromId, start, end);
        result.push({goal, amount})
    }
    return result.sort((a, b) => {
        let diff = b.amount - a.amount;
        return diff === 0 ? b.goal.name.localeCompare(a.goal.name) : diff;
    });
}

