const Goal = require("../models/Goal")


const getAllGoalByChatId = async (chatId) => {
    return Goal.find({chatId});
}
const addGoal = async (name, chatId, clientId) => {
    let sameGoal = await Goal.findOne({name, chatId});
    if (sameGoal) {
        return null;
    }
    let newGoal = new Goal({
        name,
        chatId,
        createdBY: clientId,
        createdTime: new Date(),
    });
    return newGoal.save();
}

const editGoalById = async (goalId, newName) => {
    let goalById = await getGoalById(goalId);
    if (!goalById) {
        return null
    }
    return Goal.findByIdAndUpdate(goalId, {...goalById, name: newName})
}

const deleteGoalById = async (goalId) => {
    let goalById = await getGoalById(goalId);
    if (!goalById) {
        return null
    }
    return Goal.findByIdAndDelete(goalId);
}

const getGoalByNameAndChatId = async (name, chatId) => {
    return Goal.findOne({name, chatId});
}


const getGoalById = async (goalId) => {
    return Goal.findById(goalId);
}

module.exports = {
    getGoalById,
    addGoal,
    deleteGoalById,
    editGoalById,
    getAllGoalByChatId,
    getGoalByNameAndChatId
}