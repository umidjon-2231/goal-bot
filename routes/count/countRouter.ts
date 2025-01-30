import {Router} from "express";
import {handleServiceResponse} from "../../common/utils/httpHandlers";
import {ServiceResponse} from "../../common/models/serviceResponse";
import timeService, {Period} from "../../services/timeService";
import countService from "../../services/countService";
import goalService from "../../services/goalService";
import {Types} from "mongoose";
import {validateBody} from "../../common/middleware/validateBody";
import {CountValidation, CountValidationType} from "../../models/Count";
import {checkChatAccess} from "../../common/middleware/auth";


export const countRouter: Router = Router();


countRouter.get<null, null, null, {page?: number, chatId: string}>("/", async (req, res) => {
    try {
        const page = req.query.page ?? 1;
        const chatId = req.query.chatId;
        await checkChatAccess(req, chatId);
        const counts = await countService.getCountsHistory(req.auth.client.chatId, chatId, page);
        return handleServiceResponse(ServiceResponse.success("Counts fetched successfully", counts), res);
    } catch (e) {
        console.error(e);
        return handleServiceResponse(ServiceResponse.failure("Error occurred while getting counts"), res);
    }
})

countRouter.get<{ goalId: string }, null, null, { period?: Period, minus?: number }>("/total/:goalId", async (req, res) => {
    try {
        const period = req.query.period ?? "day";
        const goalId = req.params.goalId;
        const goal = await goalService.getGoalById(new Types.ObjectId(goalId));
        if (!goal) {
            return handleServiceResponse(ServiceResponse.failure("Goal not found"), res);
        }
        await checkChatAccess(req, goal.chatId+"");
        const oldest = await goalService.getOldestGoalOfChat(goal.chatId);
        let {start, end} = timeService.periodToStartAndEndDate(period, req.query.minus ?? 0, oldest.createdTime);
        let count = await countService.getCountByClientIdAndTime(
            new Types.ObjectId(goalId),
            req.auth.client.chatId,
            start, end
        );
        return handleServiceResponse(ServiceResponse.success(
            "Count fetched successfully",
            {count, goal, fromDate: start, toDate: end}
        ), res);
    } catch (e) {
        console.error(e);
        return handleServiceResponse(ServiceResponse.failure("Error occurred while getting counts"), res);
    }
});


countRouter.post<null, null, CountValidationType>("/", validateBody(CountValidation), async (req, res) => {
    try {
        const {goalId, amount} = req.body;
        const goalObjectId = new Types.ObjectId(goalId);
        const goalDoc = await goalService.getGoalById(goalObjectId);
        if (!goalDoc) {
            return handleServiceResponse(ServiceResponse.failure("Goal not found"), res);
        }
        await checkChatAccess(req, goalDoc.chatId+"");
        const count = await countService.addCount(goalObjectId, req.auth.client.chatId, amount);
        return handleServiceResponse(ServiceResponse.success("Count added successfully", {count}), res);
    } catch (e) {
        console.error(e);
        return handleServiceResponse(ServiceResponse.failure("Error occurred while getting counts"), res);
    }
});

