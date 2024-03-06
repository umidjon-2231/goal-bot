const goalService = require("./goalService");
const clientService = require("./clientService");
const Count = require("../models/Count")
const Goal = require("../models/Goal")
const {getTime} = require("./timeService");


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
        createdTime: getTime()
    });
    return newCount.save();
}

const getTotalCountByClientId = async (goalId, chatId) => {
    let goal = await goalService.getGoalById(goalId);
    if (!goal) {
        throw new Error("Goal not found")
    }
    let client = await clientService.getClientByChatId(chatId);
    if (!client) {
        throw new Error("Not registered")
    }
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

    return count[0]?.totalAmount ?? 0;
}

const getCountByClientIdAndTime = async (goalId, fromId, fromDate, toDate) => {
    let goal = await goalService.getGoalById(goalId).toArray();
    if (!goal) {
        throw new Error("Goal not found")
    }
    let client = await clientService.getClientByChatId(fromId);
    if (!client) {
        throw new Error("Not registered")
    }
    let count = await Count.aggregate([
        {
            $match: {
                goal: goal._id, client: client._id, createdTime: {
                    $gte: fromDate,
                    $lte: toDate,
                }
            },
        },
        {
            $group: {
                _id: null,

                totalAmount: {$sum: '$amount'}
            }
        }]);

    return count[0]?.totalAmount ?? 0;
}


const printCount = (goal, amount) => {
    return `${goal.name} - ${amount}`
}


module.exports = {addCount, getTotalCountByClientId, printCount, getCountByClientIdAndTime}