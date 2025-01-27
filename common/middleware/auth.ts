import {ServiceResponse} from "../models/serviceResponse";
import {RequestHandler, Request} from "express";
import tokenService from "../../services/tokenService";
import bot from "../../bot";


export const checkChatAccess = async (req: Request, chatId: string) => {
    if (req.auth.client.chatId !== parseInt(chatId)) {
        let chatMember = await bot.getChatMember(chatId, req.auth.client.chatId);
        console.log(chatMember)
        if (!chatMember || !["creator", "administrator", "member"].includes(chatMember.status)) {
            throw `You don't have access to chat ${chatId}`;
        }
    }
}

export const auth: RequestHandler = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
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
