const Goal = require("../models/Goal")
const {getTime} = require("./timeService");


const getAllGoalByChatId = async (chatId) => {
    return Goal.find({chatId});
}

const getOldestGoalOfChat = async (chatId) => {
    let {_id} = await Goal.findOne({chatId}, {sort: {createdTime: 1}});
    return Goal.findById(_id);
}

const addGoal = async (name, chatId, clientId) => {
    let sameGoal = await getGoalByNameAndChatId(name, chatId);
    if (sameGoal) {
        return null;
    }
    let newGoal = new Goal({
        name,
        chatId,
        createdBY: clientId,
        createdTime: getTime(),
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
    const escapedSearchTerm = RegExp.escape(name);
    const regex = new RegExp(escapedSearchTerm, 'i');
    return Goal.findOne({name: {$regex: regex}, chatId});
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
    getGoalByNameAndChatId,
    getOldestGoalOfChat
}