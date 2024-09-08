import goalService from "./goalService";
import clientService from "./clientService";
import Count from "../models/Count";
import {GoalI} from "../models/Goal";
import {getTime} from "./timeService";
import mongoose from "mongoose";
import {CountRank} from "./rankService";
import {bold, uppercaseStart} from "./utils";


const addCount = async (goalId: mongoose.Types.ObjectId, fromId: string | number, amount = 0) => {
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

const getTotalCountByClientId = async (goalId: mongoose.Types.ObjectId, chatId: string | number) => {
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


const getCountByGoal = async (goalId: mongoose.Types.ObjectId, limit: number, fromDate: Date, toDate: Date) => {
    let goal = await goalService.getGoalById(goalId);
    if (!goal) {
        throw new Error("Goal not found")
    }
    return Count.aggregate<CountRank>([
        {
            $match: {
                goal: goal._id,
                createdTime: {
                    $gte: fromDate,
                    $lte: toDate,
                }
            },
        },
        {
            $group: {
                _id: "$client",
                count: {$sum: '$amount'}
            }
        },
        {
            $sort: {
                count: -1
            }
        },
        {
            $limit: limit
        },
        {
            $lookup: {
                from: "clients",
                localField: "_id",
                foreignField: "_id",
                as: "clientDetails"
            }
        },
        {
            $unwind: "$clientDetails"
        },
        {
            $project: {
                _id: 1,
                clientId: "$clientDetails.chatId",
                count: 1,
                fullName: "$clientDetails.fullName",
            }
        }
    ]);
}

const getCountByClientIdAndTime = async (goalId: mongoose.Types.ObjectId, fromId: string | number, fromDate: Date, toDate: Date) => {
    let goal = await goalService.getGoalById(goalId);
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


const printCount = (goal: GoalI, amount: number) => {
    return `${uppercaseStart(goal.name)} - ${bold(amount.toString())}`
}


export default {addCount, getTotalCountByClientId, printCount, getCountByClientIdAndTime, getCountByGoal}