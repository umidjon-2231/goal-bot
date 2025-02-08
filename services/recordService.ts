import {Types} from "mongoose";
import {Period} from "./timeService";
import goalService from "./goalService";
import clientService from "./clientService";
import Count from "../models/Count";


export type RecordHistory = Record<Exclude<Period, "today" | "allTime">, {
    period: Date,
    totalAmount: number,
}>

const getRecordHistory = async (goalId: Types.ObjectId, fromId: number | string): Promise<RecordHistory> => {
    let goal = await goalService.getGoalById(goalId);
    if (!goal) {
        throw new Error("Goal not found")
    }

    let client = await clientService.getClientByChatId(fromId);
    if (!client) {
        throw new Error("Not registered")
    }

    const result = await Count.aggregate<RecordHistory>([
        {
            $match: {
                client: client._id,
                goal: goal._id,
            }
        },
        {
            $addFields: {
                day: {$dateTrunc: {date: "$createdTime", unit: "day"}},
                week: {$dateTrunc: {date: "$createdTime", unit: "week"}},
                month: {$dateTrunc: {date: "$createdTime", unit: "month"}},
                year: {$dateTrunc: {date: "$createdTime", unit: "year"}}
            }
        },
        {
            $facet: {
                day: [
                    {
                        $group: {
                            _id: "$day",
                            totalAmount: {$sum: "$amount"},
                        }
                    },
                    {
                        $sort: {totalAmount: -1}
                    },
                    {
                        $limit: 1
                    },
                    {
                        $project: {
                            period: "$_id",
                            totalAmount: 1,
                        }
                    }
                ],
                week: [
                    {
                        $group: {
                            _id: "$week",
                            totalAmount: {$sum: "$amount"},
                        }
                    },
                    {
                        $sort: {totalAmount: -1}
                    },
                    {
                        $limit: 1
                    },
                    {
                        $project: {
                            period: "$_id",
                            totalAmount: 1,
                        }
                    }
                ],
                month: [
                    {
                        $group: {
                            _id: "$month",
                            totalAmount: {$sum: "$amount"},
                        }
                    },
                    {
                        $sort: {totalAmount: -1}
                    },
                    {
                        $limit: 1
                    },
                    {
                        $project: {
                            period: "$_id",
                            totalAmount: 1,
                        }
                    }
                ],
                year: [
                    {
                        $group: {
                            _id: "$year",
                            totalAmount: {$sum: "$amount"},
                        }
                    },
                    {
                        $sort: {totalAmount: -1}
                    },
                    {
                        $limit: 1
                    },
                    {
                        $project: {
                            period: "$_id",
                            totalAmount: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "$day",
            }
        },
        {
            $unwind: {
                path: "$week",
            }
        },
        {
            $unwind: {
                path: "$month",
            }
        },
        {
            $unwind: {
                path: "$year",
            }
        }
    ]);
    return result[0] ?? {
        day: {period: null, totalAmount: 0},
        week: {period: null, totalAmount: 0},
        month: {period: null, totalAmount: 0},
        year: {period: null, totalAmount: 0},
    };
}

export default {
    getRecordHistory,
}