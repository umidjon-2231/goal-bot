import express, {Router} from "express";
import {DeviceI, deviceValidation} from "../../models/Device";
import {ServiceResponse} from "../../common/models/serviceResponse";
import {handleServiceResponse} from "../../common/utils/httpHandlers";
import {validateBody} from "../../common/middleware/validateBody";
import tokenService from "../../services/tokenService";
import bot from "../../bot";


export const authRouter: Router = express.Router();


authRouter.post("/token/generate", validateBody(deviceValidation), async (req, res) => {
    try {
        const token = await tokenService.generateAuthToken(req.body as DeviceI);
        const me = await bot.getMe()
        return handleServiceResponse(ServiceResponse.success("Device registered", {
            ...(token["_doc"]),
            loginUrl: `https://t.me/${me.username}?start=${token.token}`
        }), res)
    } catch (e) {
        console.error(e)
        return handleServiceResponse(ServiceResponse.failure("Error occurred while generating token", e), res)
    }
})

authRouter.get<{ token: string }>("/token/:token", async (req, res) => {
    try {
        const token = await tokenService.getToken(req.params.token)
        if (!token) {
            return handleServiceResponse(ServiceResponse.failure("Token not found"), res)
        }
        return handleServiceResponse(ServiceResponse.success("Token found", {
            ...token["_doc"],
            loginUrl: `https://t.me/${(await bot.getMe()).username}?start=${token.token}`
        }), res)
    } catch (e) {
        console.error(e)
        return handleServiceResponse(ServiceResponse.failure("Error occurred while getting token", e), res)
    }
})