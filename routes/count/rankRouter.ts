import {Router} from "express";
import {handleServiceResponse} from "../../common/utils/httpHandlers";
import {ServiceResponse} from "../../common/models/serviceResponse";
import {checkChatAccess} from "../../common/middleware/auth";
import rankService from "../../services/rankService";
import {Period} from "../../services/timeService";


export const rankRouter: Router = Router();


rankRouter.get<{ chatId: string }, null, null, {
    maxRanks?: number
    period?: Period,
    minus?: number
}>("/:chatId", async (req, res) => {
    try {
        const chatId = req.params.chatId;

        await checkChatAccess(req, chatId);

        const period = req.query.period ?? "day",
            minus = req.query.minus ?? 0,
            maxRanks = req.query.maxRanks ?? 3;

        const top = await rankService.getTop(chatId, maxRanks, period, minus);

        return handleServiceResponse(ServiceResponse.success("Ranks fetched successfully", top), res);
    } catch (e) {
        console.error(e);
        return handleServiceResponse(ServiceResponse.failure("Error occurred while getting ranks"), res);
    }
})


