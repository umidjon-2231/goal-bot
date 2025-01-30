import {Router} from "express";
import {checkChatAccess} from "../../common/middleware/auth";
import {handleServiceResponse} from "../../common/utils/httpHandlers";
import {ServiceResponse} from "../../common/models/serviceResponse";
import goalService from "../../services/goalService";
import {Types} from "mongoose";
import streakService from "../../services/streakService";
import {Period} from "../../services/timeService";


export const streakRouter: Router = Router()


streakRouter.get<{ goalId: string }>("/:goalId", async (req, res) => {
    try {
        const goalId = new Types.ObjectId(req.params.goalId);
        let goalById = await goalService.getGoalById(goalId);
        if (!goalById) {
            return handleServiceResponse(ServiceResponse.failure("Goal not found"), res);
        }
        await checkChatAccess(req, goalById.chatId + "");
        const streak = await streakService.getStreakByClientIdAndGoalId(req.auth.client.chatId, goalId);
        return handleServiceResponse(ServiceResponse.success("Streak fetched successfully",
            {streak, goal: goalById}), res);
    } catch (e) {
        console.error(e);
        return handleServiceResponse(ServiceResponse.failure("Error occurred while getting streak"), res);
    }
})

streakRouter.get<{ goalId: string }, null, null, {
    period?: Period,
    minus?: number
}>("/missed/:goalId", async (req, res) => {
    try {
        const goalId = new Types.ObjectId(req.params.goalId);
        let goalById = await goalService.getGoalById(goalId);
        if (!goalById) {
            return handleServiceResponse(ServiceResponse.failure("Goal not found"), res);
        }
        await checkChatAccess(req, goalById.chatId + "");
        const period = req.query.period ?? "month", minus = req.query.minus ?? 0;
        const missedDays = await streakService.getMissedDaysByClientIdAndGoalId(req.auth.client.chatId, goalId, period, minus);
        return handleServiceResponse(ServiceResponse.success("Missed days fetched successfully",
            {...missedDays, goal: goalById}), res);
    } catch (e) {
        console.error(e);
        return handleServiceResponse(ServiceResponse.failure("Error occurred while getting missed days"), res);
    }
})