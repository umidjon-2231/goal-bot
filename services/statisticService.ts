import countService from "./countService";
import goalService from "./goalService";
import timeService, {Period} from "./timeService";
import TelegramBot from "node-telegram-bot-api";

export const getStatistics = async (chatId: string | number, from: TelegramBot.User, period: Period, minus: number) => {
    let result = []
    let goals = await goalService.getAllGoalByChatId(chatId);
    let oldestGoal = await goalService.getOldestGoalOfChat(chatId);
    console.log(oldestGoal.createdTime);
    console.log(goals)
    let {end, start} = timeService.periodToStartAndEndDate(period, minus, oldestGoal.createdTime);
    for (let goal of goals) {
        let amount = await countService.getCountByClientIdAndTime(goal._id, from.id, start, end);
        result.push({goal, amount})
    }
    return result;
}

export const responsePeriodParser = (period: Period, minus: number) => {
    if (period === "allTime") {
        return "for all time"
    }
    let {end, start} = timeService.periodToStartAndEndDate(period, minus);
    return `from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`
}
