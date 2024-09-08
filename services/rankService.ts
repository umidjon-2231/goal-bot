import countService from "./countService";
import goalService from "./goalService";
import timeService, {Period} from "./timeService";
import {GoalI} from "../models/Goal";
import {bold, italic, userUrl} from "./utils";

export interface CountRank {
    count: number,
    clientId: string,
    fullName: string,
}

export const getTop = async (chatId: string | number, maxRank: number, period: Period, minus: number = 0) => {
    if (maxRank > 10 || maxRank < 1) {
        maxRank = 10;
    }
    let result: { goal: GoalI, counts: CountRank[] }[] = []
    let [goals, oldestGoal] = await Promise.all([goalService.getAllGoalByChatId(chatId), goalService.getOldestGoalOfChat(chatId)]);
    let {end, start} = timeService.periodToStartAndEndDate(period, minus, oldestGoal.createdTime);
    for (let goal of goals) {
        let details = await countService.getCountByGoal(goal._id, maxRank, start, end);
        result.push({goal, counts: details})
    }
    return result;
}

const topStickers = [
    "🏆", "🥈", "🥉",
]
export const parseRankResult = (counts: CountRank[]) => {
    let result = ""
    if (counts.length === 1) {
        let first = counts[0];
        result = `${first.fullName} - ${bold(first.count.toString())} ${topStickers[0]}\n`
    } else if (counts.length === 0) {
        result = italic("No goal records found\n");
    } else {
        counts.forEach((ranker, i) => {
            result += `${i + 1}. ${userUrl(ranker.clientId, ranker.fullName)} - ${bold(ranker.count.toString())} ${topStickers[i] ?? ""}\n`
        })
    }
    return result;
}