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

const getStreakByClientIdAndGoalId = async (fromId: string | number, goalId: mongoose.Types.ObjectId) => {
    let goal = await goalService.getGoalById(goalId);
    if (!goal) {
        throw new Error("Goal not found")
    }
    let client = await clientService.getClientByChatId(fromId);
    if (!client) {
        throw new Error("Not registered")
    }
    console.log(client, goal)
    let streak = await Count.aggregate<{
        streaks: any[],
        longestStreak: { start: null | string, end: null | string, length: number },
        currentStreak: { start: string, length: number },
    }>([
        // Step 1: Filter by client and goal
        {
            $match: {
                client: client._id,
                goal: goal._id
            }
        },
        // Step 2: Sort by createdTime
        {
            $sort: {createdTime: 1}
        },
        // Step 3: Group records by day (ignore time)
        {
            $group: {
                _id: {
                    day: {$dateToString: {format: "%Y-%m-%d", date: "$createdTime"}}
                },
                firstRecordOfDay: {$first: "$createdTime"}
            }
        },
        // Step 4: Collect unique days into an array
        {
            $group: {
                _id: null,
                days: {$push: "$_id.day"}
            }
        },
        // Step 5: Sort the days explicitly
        {
            $project: {
                days: {$sortArray: {input: "$days", sortBy: 1}}
            }
        },
        // Step 6: Calculate streak groups with start and end dates
        {
            $project: {
                streaks: {
                    $reduce: {
                        input: "$days",
                        initialValue: {streakGroup: 0, streaks: [], lastDay: null, currentStart: null},
                        in: {
                            streakGroup: {
                                $cond: [
                                    {
                                        $eq: [
                                            {
                                                $dateDiff: {
                                                    startDate: {$dateFromString: {dateString: "$$value.lastDay"}},
                                                    endDate: {$dateFromString: {dateString: "$$this"}},
                                                    unit: "day"
                                                }
                                            },
                                            1 // Difference of 1 day means the streak continues
                                        ]
                                    },
                                    "$$value.streakGroup",
                                    {$add: ["$$value.streakGroup", 1]} // Otherwise, start a new streak group
                                ]
                            },
                            streaks: {
                                $cond: [
                                    {
                                        $or: [
                                            {$eq: ["$$value.lastDay", null]},
                                            {
                                                $ne: [
                                                    {
                                                        $dateDiff: {
                                                            startDate: {$dateFromString: {dateString: "$$value.lastDay"}},
                                                            endDate: {$dateFromString: {dateString: "$$this"}},
                                                            unit: "day"
                                                        }
                                                    },
                                                    1
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        $concatArrays: ["$$value.streaks", [{
                                            start: "$$value.currentStart",
                                            end: "$$value.lastDay"
                                        }]]
                                    },
                                    "$$value.streaks"
                                ]
                            },
                            lastDay: "$$this",
                            currentStart: {
                                $cond: [
                                    {$eq: ["$$value.lastDay", null]},
                                    "$$this",
                                    {
                                        $cond: [
                                            {
                                                $ne: [
                                                    {
                                                        $dateDiff: {
                                                            startDate: {$dateFromString: {dateString: "$$value.lastDay"}},
                                                            endDate: {$dateFromString: {dateString: "$$this"}},
                                                            unit: "day"
                                                        }
                                                    },
                                                    1
                                                ]
                                            },
                                            "$$this",
                                            "$$value.currentStart"
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                currentDay: {$arrayElemAt: ["$days", -1]} // Get the most recent day
            }
        },
        // Step 7: Add the last streak to the result
        {
            $project: {
                streaks: {
                    $concatArrays: [
                        "$streaks.streaks",
                        [{start: "$streaks.currentStart", end: "$streaks.lastDay"}]
                    ]
                },
                currentDay: 1
            }
        },
        // Step 8: Find the longest streak and current streak
        {
            $project: {
                streaks: 1,
                longestStreak: {
                    $reduce: {
                        input: "$streaks",
                        initialValue: {start: null, end: null, length: 0},
                        in: {
                            $cond: [
                                {
                                    $gt: [
                                        {
                                            $dateDiff: {
                                                startDate: {$dateFromString: {dateString: "$$this.start"}},
                                                endDate: {$dateFromString: {dateString: "$$this.end"}},
                                                unit: "day"
                                            }
                                        },
                                        "$$value.length"
                                    ]
                                },
                                {
                                    start: "$$this.start", end: "$$this.end", length: {
                                        $dateDiff: {
                                            startDate: {$dateFromString: {dateString: "$$this.start"}},
                                            endDate: {$dateFromString: {dateString: "$$this.end"}},
                                            unit: "day"
                                        }
                                    }
                                },
                                "$$value"
                            ]
                        }
                    }
                },
                currentStreak: {
                    $cond: [
                        {
                            $eq: [
                                {
                                    $dateDiff: {
                                        startDate: {
                                            $dateFromString: {
                                                dateString: "$currentDay"
                                            }
                                        },
                                        endDate: {
                                            $dateFromString: {
                                                dateString: {
                                                    $dateToString: {
                                                        format: "%Y-%m-%d",
                                                        date: new Date()
                                                    }
                                                }
                                            }
                                        },
                                        unit: "day"
                                    }
                                },
                                0
                            ]
                        },
                        {

                            start: {
                                $getField: {
                                    field: "start",
                                    input: {
                                        $arrayElemAt: ["$streaks", -1]
                                    }
                                }
                            },
                            length: {
                                $dateDiff: {
                                    startDate: {
                                        $dateFromString: {
                                            dateString: {
                                                $getField: {
                                                    field: "start",
                                                    input: {
                                                        $arrayElemAt: ["$streaks", -1]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    endDate: {
                                        $dateFromString: {
                                            dateString: {
                                                $dateToString: {
                                                    format: "%Y-%m-%d",
                                                    date: new Date()
                                                }
                                            }
                                        }
                                    },
                                    unit: "day"
                                }
                            }
                        },
                        {
                            start: null,
                            length: 0
                        }
                    ]
                }
            }
        }
    ]);

    return streak[0];
}


const printCount = (goal: GoalI, amount: number) => {
    return `${uppercaseStart(goal.name)} - ${bold(amount.toString())}`
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
    getStrikeByClientIdAndGoalId: getStreakByClientIdAndGoalId
}