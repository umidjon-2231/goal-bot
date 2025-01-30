import goalService from "./goalService";
import clientService from "./clientService";
import Count, {CountI} from "../models/Count";
import {GoalI} from "../models/Goal";
import {getTime} from "./timeService";
import mongoose from "mongoose";
import {CountRank} from "./rankService";
import {bold, uppercaseStart} from "./utils";


const addCount = async (goalId: mongoose.Types.ObjectId, fromId: string | number, amount = 0): Promise<CountI> => {
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
    let count = await Count.aggregate<{ totalAmount: number }>([
        {
            $match: {
                goal: goal._id,
                client: client._id,
                createdTime: {
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


export interface CountsHistory {
    day: string,
    totalAmount: number,
    goals: {
        goal: GoalI,
        counts: {_id: string, amount: number, createdTime: Date}[]
    }
}
const getCountsHistory = async (clientId: number, chatId: string, page: number = 1) => {
    const LIMIT = 10;
    let client = await clientService.getClientByChatId(clientId);
    if (!client) {
        throw new Error("Not registered")
    }



    return Count.aggregate<CountsHistory>([
        {
            $match: {
                client: client._id
            }
        },
        { $sort: { createdTime: -1 } },
        {
            $group: {
                _id: {
                    day: { $dateToString: { format: "%Y-%m-%d", date: "$createdTime" } },
                    goalId: "$goal",
                },
                totalAmount: { $sum: "$amount" },
                counts: {
                    $push: {
                        _id: "$_id",
                        amount: "$amount",
                        createdTime: "$createdTime",
                    }
                }
            }
        },
        {
            $lookup: {
                from: "goals",
                localField: "_id.goalId",
                foreignField: "_id",
                as: "goal_details"
            }
        },
        {
            $unwind: { path: "$goal_details", preserveNullAndEmptyArrays: true }
        },
        {
            $match: {
                "goal_details.chatId": parseInt(chatId)
            }
        },
        // Step 5: Reshape Data to Group by Day First, then Goals
        {
            $group: {
                _id: "$_id.day",
                totalAmount: { $sum: "$totalAmount" },
                goals: {
                    $push: {
                        goal: "$goal_details",
                        totalAmount: "$totalAmount",
                        counts: "$counts"
                    }
                }
            }
        },
        { $skip: (page - 1) * LIMIT },
        { $limit: LIMIT },
        {
            $sort: { "_id": -1 }
        },
        {
            $replaceRoot: {
                newRoot: {
                    day: "$_id",
                    totalAmount: "$totalAmount",
                    goals: "$goals",
                }
            }
        }
    ])
}


const reactionForCount = (amount: number) => {
    if (amount < 10) {
        return "👎"
    } else if (amount < 50) {
        return "👍"
    } else if (amount < 100) {
        return "⚡"
    } else if (amount < 150) {
        return "🔥"
    }
    return "❤‍🔥"
}


export default {
    addCount,
    getTotalCountByClientId,
    printCount,
    getCountByClientIdAndTime,
    getCountByGoal,
    reactionForCount,
    getCountsHistory,
}