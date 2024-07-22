import {getTime} from "./timeService";
import Client from "../models/Client";

const existById = async (chatId: string | number) => {
    if (!chatId) {
        return false;
    }
    return Client.exists({chatId});
}


const addClient = async ({chatId, fullName, username}: {
    chatId: string | number,
    fullName: string,
    username: string
}) => {
    let newClient = new Client({
        chatId,
        fullName,
        username,
        registerTime: getTime()
    });
    return newClient.save()
}

const getClientByChatId = async (chatId: string | number) => {
    return Client.findOne({chatId});
}


export default {existByChatId: existById, addClient, getClientByChatId}