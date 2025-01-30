import mongoose from "mongoose";
import goalService from "./goalService";
import clientService from "./clientService";
import Count from "../models/Count";
import timeService, {Period} from "./timeService";
import {differenceInDays, isFuture} from "date-fns";
import {GoalI} from "../models/Goal";

type MissedDaysInfo={
    days: string[],
    missedDays: number,
    notMissedDays: number,
    total: number
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
        },
        // Step 9: Replace the root with the streaks
        {
            $replaceRoot: {
                newRoot: {
                    longestStreak: "$longestStreak",
                    currentStreak: "$currentStreak"
                }
            }
        }
    ]);

    return streak[0] ?? {
        longestStreak: {start: "", end: "", length: 0},
        currentStreak: {start: "", length: 0}
    };
}


const getMissedDaysByClientIdAndGoalId = async (fromId: string | number, goalId: mongoose.Types.ObjectId, period: Period, minus: number = 0): Promise<MissedDaysInfo> => {
    let goal = await goalService.getGoalById(goalId);
    if (!goal) {
        throw new Error("Goal not found")
    }
    let client = await clientService.getClientByChatId(fromId);
    if (!client) {
        throw new Error("Not registered")
    }
    let {end, start, days} = timeService.periodToStartAndEndDate(period, minus);
    if (isFuture(end)) {
        days = differenceInDays(timeService.getTime(), start) + 1
    }

    const result = await Count.aggregate<{ days: string[] }>([
        // Step 1: Filter by client, goal, and date range
        {
            $match: {
                client: client._id,
                goal: goal._id,
                createdTime: {
                    $gte: start,
                    $lte: end,
                }
            }
        },
        // Step 2: Group by day
        {
            $group: {
                _id: null,
                days: {
                    $addToSet: {$dateToString: {format: "%Y-%m-%d", date: "$createdTime"}}
                },
            }
        },
    ])
    return result.length > 0 ? {
        days: result[0].days ?? [],
        missedDays: days - (result[0]?.days?.length ?? 0),
        notMissedDays: result[0]?.days?.length ?? 0,
        total: days,
    } : {days: [], missedDays: days, total: days, notMissedDays: 0};
}

const getMissedDaysByClientId = async (chatId: string | number, fromId: string | number, period: Period, minus: number = 0) => {
    let client = await clientService.getClientByChatId(fromId);
    if (!client) {
        throw new Error("Not registered")
    }
    const goals = await goalService.getAllGoalByChatId(chatId);
    let result: ({goal: GoalI} & MissedDaysInfo)[] = []
    for (let goal of goals) {
        const missedDays = await getMissedDaysByClientIdAndGoalId(fromId, goal._id, period, minus)
        result.push({goal, ...missedDays});
    }
    return result
}

export default {
    getStreakByClientIdAndGoalId,
    getMissedDaysByClientIdAndGoalId,
    getMissedDaysByClientId
}