import express, {Router} from "express";
import {handleServiceResponse} from "../../common/utils/httpHandlers";
import {ServiceResponse} from "../../common/models/serviceResponse";
import goalService from "../../services/goalService";
import mongoose from "mongoose";
import {validateBody} from "../../common/middleware/validateBody";
import {goalValidation} from "../../models/Goal";
import {checkChatAccess} from "../../common/middleware/auth";
import bot from "../../bot";


export const goalRouter: Router = express.Router();

goalRouter.get<{ chatId: string }>("/:chatId", async (req, res) => {
    try {
        let chatId = req.params.chatId;
        await checkChatAccess(req, chatId);
        let goals = await goalService.getAllGoalByChatId(chatId);
        return handleServiceResponse(ServiceResponse.success(
                "Goals fetched successfully",
                {goals}),
            res
        )
    } catch (e) {
        console.error(e)
        return handleServiceResponse(ServiceResponse.failure("Error occurred while getting goals", e), res)
    }
})

goalRouter.post("/", validateBody(goalValidation), async (req, res) => {
    try {
        const {name, chatId} = req.body;
        await checkChatAccess(req, chatId);
        const goal = await goalService.addGoal(name, chatId, req.auth.client.chatId);
        if (!goal) {
            return handleServiceResponse(ServiceResponse.failure("Goal already exists", null), res)
        }
        return handleServiceResponse(ServiceResponse.success("Goal created successfully", {goal}), res)
    } catch (e) {
        console.error(e)
        return handleServiceResponse(ServiceResponse.failure("Error occurred while creating goal", e), res)
    }
})


goalRouter.put<{ goalId: string }>("/:goalId", validateBody(goalValidation), async (req, res) => {
    try {
        const {goalId} = req.params;
        const {name, chatId} = req.body;
        let goalById = await goalService.getGoalById(new mongoose.Types.ObjectId(goalId));
        if (!goalById || goalById.chatId !== chatId) {
            return handleServiceResponse(ServiceResponse.failure("Goal not found", null), res)
        }
        await checkChatAccess(req, chatId);
        const goal = await goalService.editGoalById(new mongoose.Types.ObjectId(goalId), name);
        if (!goal) {
            return handleServiceResponse(ServiceResponse.failure("Goal not found", null), res)
        }
        return handleServiceResponse(ServiceResponse.success("Goal updated successfully", {goal}), res)
    } catch (e) {
        console.error(e)
        return handleServiceResponse(ServiceResponse.failure("Error occurred while updating goal", e), res)
    }
})