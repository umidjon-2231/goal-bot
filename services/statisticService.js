const countService=require("./countService")
const goalService = require("./goalService");

const getStatistics = async (chatId, from, period) => {
    let result=[]
    let goals = await goalService.getAllGoalByChatId(chatId).toArray();
    // for (let goal of goals) {
    //     let totalCount = await countService.getTotalCountByClientId(goal._id, from.id);
    // }
    switch (period) {
        case "allTime": {
            for (let goal of goals) {
                // countService.getCountByClientIdAndTime(goal._id, from.id, )
            }
            break;
        }
    }
}