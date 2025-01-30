import {Router} from "express";
import {handleServiceResponse} from "../../common/utils/httpHandlers";
import {ServiceResponse} from "../../common/models/serviceResponse";
import {checkChatAccess} from "../../common/middleware/auth";
import {getStatistics} from "../../services/statisticService";
import {Period} from "../../services/timeService";


export const statisticRouter: Router = Router();


statisticRouter.get<{ chatId: string }, null, null, {
    period?: Period,
    minus?: number
}>("/:chatId", async (req, res) => {
    try {
        const chatId = req.params.chatId;
        await checkChatAccess(req, chatId);
        const period = req.query.period ?? "day",
            minus = req.query.minus ?? 0;
        const statistics = await getStatistics(chatId, req.auth.client.chatId, period, minus);
        return handleServiceResponse(ServiceResponse.success("Counts fetched successfully", statistics), res);
    } catch (e) {
        console.error(e);
        return handleServiceResponse(ServiceResponse.failure("Error occurred while getting counts"), res);
    }
})
