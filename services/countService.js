const goalService = require("./goalService");
const clientService = require("./clientService");
const Count = require("../models/Count")
const Goal = require("../models/Goal")


const addCount = async (goalId, fromId, amount = 0) => {
    if (amount <= 0) {
        throw new Error("Amount cannot be less or equal to zero")
    }
    let goal = await goalService.getGoalById(goalId);
    if (!goal) {
        throw new Error("Goal not found")
    }
    let client = await clientService.getClientByChatId(fromId);
    if (!client) {
        throw new Error("Please first register by sending start command to me in private chat")
    }
    let newCount = new Count({
        goal: goal._id,
        client: client._id,
        amount,
        createdTime: new Date()
    });
    return newCount.save();
}

const getTotalCountByClientId = async (goalId, chatId) => {
    let goal = await goalService.getGoalById(goalId);
    if (!goal) {
        throw new Error("Goal not found")
    }
    console.log("Get goal", new Date().getTime())
    let client = await clientService.getClientByChatId(chatId);
    if (!client) {
        throw new Error("Not registered")
    }
    console.log("Get client", new Date().getTime())
    let count = await Count.aggregate([
        {
            $match: {goal: goal._id, client: client._id},
        },
        {
            $group: {
                _id: null,

                totalAmount: {$sum: '$amount'}
            }
        }]);

    console.log("Get counts", new Date().getTime())
    return count[0]?.totalAmount ?? 0;
}


module.exports = {addCount, getTotalCountByClientId}