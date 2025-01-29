import {ServiceResponse} from "../models/serviceResponse";
import {Request, RequestHandler} from "express";
import tokenService from "../../services/tokenService";
import bot from "../../bot";


export const checkChatAccess = async (req: Request, chatId: string) => {
    if (!chatId || isNaN(parseInt(chatId))) {
        throw "Invalid chat id"
    }
    try {
        if (req.auth.client.chatId !== parseInt(chatId)) {
            let chatMember = await bot.getChatMember(chatId, req.auth.client.chatId)
                .catch(() => null);
            console.log(chatMember)
            if (!chatMember || !["creator", "administrator", "member"].includes(chatMember.status)) {
                throw null;
            }
        }
    } catch (e) {
        throw `You don't have access to chat ${chatId}`;
    }
}

export const auth: RequestHandler = async (req, res, next) => {
    try {
        let token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw {message: "No token provided"};
        }
        const tokenInfo = await tokenService.getToken(token);
        if (!tokenInfo) {
            throw {message: "Invalid token"};
        }
        if (!tokenInfo.active) {
            throw {message: "Token is not active"};
        }
        console.log(tokenInfo)
        req.auth = tokenInfo;
        next();
    } catch (error) {
        return res.status(400).json(ServiceResponse.failure(
            "Auth failed",
            {
                error: error.message,
            }
        ));
    }
};
