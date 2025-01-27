import Device, {DeviceI} from "../models/Device";
import {getTime} from "./timeService";
import Token, {TokenI} from "../models/Token";
import crypto from "crypto";
import mongoose from "mongoose";
import Client from "../models/Client";
import clientService from "./clientService";
import {AuthInfo} from "../global";


const generateToken = (deviceInfo: Partial<DeviceI>) => {
    const uniqueString = `${JSON.stringify(deviceInfo)}-${Date.now()}`;
    return crypto.createHmac('sha256', process.env.SECRET_KEY)
        .update(uniqueString)
        .digest('hex');
}

const generateAuthToken = async (deviceInfo: DeviceI): Promise<TokenI> => {
    let device = new Device<DeviceI>({
        ...deviceInfo,
        createdTime: getTime(),
    });
    device = await device.save();
    const token = generateToken(device);
    return new Token({
        token,
        device: device._id,
        createdTime: getTime(),
    }).save();
}

const verifyToken = async (tokenId: mongoose.Types.ObjectId, clientId: string | number): Promise<TokenI | null> => {
    const token = await Token.findOne({_id: tokenId}).populate("device");
    if (!token) {
        throw {error: "Token not found"}
    }
    if (token.verifiedTime) {
        throw {error: "Token already verified"}
    }
    token.verifiedTime = getTime();
    token.active = true;
    const client = await clientService.getClientByChatId(clientId);
    token.client = client._id;
    return token.save();
}


const getToken = async (tokenId: string): Promise<AuthInfo | null> => {
    let searchParams: {};
    if (tokenId.length === 64) {
        searchParams = {token: tokenId}
    } else {
        if (!mongoose.Types.ObjectId.isValid(tokenId)) {
            return null;
        }
        searchParams = {_id: tokenId}
    }
    const findOne = await Token.findOne(searchParams);
    if (!findOne) {
        return null;
    }
    const [device, client] = await Promise.all([
        Device.findById(findOne?.device),
        Client.findById(findOne?.client),
    ])
    return {
        ...findOne["_doc"],
        device,
        client,
    }
}

export default {
    generateAuthToken,
    verifyToken,
    getToken
}