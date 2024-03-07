const countService = require("./countService")
const goalService = require("./goalService");
const timeService = require("./timeService");
const {ca, de} = require("date-fns/locale");

const getStatistics = async (chatId, from, period, minus) => {
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

const responsePeriodParser=(period, minus)=>{
    if(period==="allTime"){
        return "for all time"
    }
    let {end, start} = timeService.periodToStartAndEndDate(period, minus);
    return `from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`
}

module.exports = {getStatistics, responsePeriodParser}