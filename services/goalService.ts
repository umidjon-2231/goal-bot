import mongoose from "mongoose";

import Goal, {GoalI} from "../models/Goal";
import {getTime} from "./timeService";
import {escapeRegex} from "./utils";

const getAllGoalByChatId = async (chatId: string | number) => {
    return Goal.find<GoalI>({chatId});
}

const getOldestGoalOfChat = async (chatId: string | number) => {
    let {_id} = await Goal.findOne({chatId}, {sort: {createdTime: 1}});
    return Goal.findById<GoalI>(_id);
}

const addGoal = async (name: string, chatId: string | number, clientId: string | number) => {
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

const editGoalById = async (goalId: mongoose.Types.ObjectId, newName: string) => {
    let goalById = await getGoalById(goalId);
    if (!goalById) {
        return null
    }
    return Goal.findByIdAndUpdate(goalId, {...goalById, name: newName})
}

const deleteGoalById = async (goalId: mongoose.Types.ObjectId) => {
    let goalById = await getGoalById(goalId);
    if (!goalById) {
        return null
    }
    return Goal.findByIdAndDelete(goalId);
}

const getGoalByNameAndChatId = async (name: string, chatId: string | number) => {
    const escapedSearchTerm = escapeRegex(name);
    const regex = new RegExp(escapedSearchTerm, 'i');
    return Goal.findOne({name: {$regex: regex}, chatId});
}


const getGoalById = async (goalId: mongoose.Types.ObjectId): Promise<GoalI> => {
    return Goal.findById(goalId);
}

export const getChatsNotificationOn = async () => {
    return Goal.aggregate<{_id: number}>([
        {
            $match: {
                notification: true
            }
        },
        {
            $group: {
                _id: "$chatId"
            }
        }
    ]);

}

export default {
    getGoalById,
    addGoal,
    deleteGoalById,
    editGoalById,
    getAllGoalByChatId,
    getGoalByNameAndChatId,
    getOldestGoalOfChat,
    getGoalsNotificationOn: getChatsNotificationOn,
}