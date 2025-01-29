import express, {Router} from "express";
import {handleServiceResponse} from "../../common/utils/httpHandlers";
import {ServiceResponse} from "../../common/models/serviceResponse";
import goalService from "../../services/goalService";
import {auth} from "../../common/middleware/auth";
import bot from "../../bot";


export const chatRouter: Router = express.Router();

chatRouter.get("/", auth, async (req, res) => {
    try {
        console.log(req.auth.client)
        let chats = await goalService.getChats(req.auth.client._id);
        console.log(chats)
        chats = [{chatId: req.auth.client.chatId},
            ...(chats.filter(o => !!o.chatId && o.chatId !== req.auth.client.chatId))]
        let all = await Promise.all(chats.map(async (chat) => {
            return bot.getChat(chat.chatId)
                .then((chatInfo) => ({
                    ...chat,
                    type: chatInfo.type,
                    title: chatInfo.title ?? chatInfo.first_name,
                    photoId: chatInfo.photo?.small_file_id,
                    error: null,
                }))
                .catch(() => ({...chat, error: "Chat not found"}))
        }));
        return handleServiceResponse(ServiceResponse.success(
                "Chats fetched successfully",
                {chats: all}),
            res
        )
    } catch (e) {
        console.error(e)
        return handleServiceResponse(ServiceResponse.failure("Error occurred while getting chats", e), res)
    }
})

chatRouter.get<{ chatId: string, photoId: string }>("/:chatId/photo/:photoId", async (req, res) => {
    try {
        let chatId = req.params.chatId, photoId = req.params.photoId;
        const chat = await bot.getChat(chatId);
        if (chat.photo?.small_file_id !== photoId) {
            return handleServiceResponse(ServiceResponse.failure("Photo not found", null), res)
        }
        const file = bot.getFileStream(chat.photo?.small_file_id);
        res.setHeader('Content-Type', "image/jpeg");
        return file.pipe(res);
    } catch (e) {
        console.error(e)
        return handleServiceResponse(ServiceResponse.failure("Error occurred while getting goals", e), res)
    }
})