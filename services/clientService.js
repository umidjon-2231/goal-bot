const Client = require("../models/Client")


const existById = async (chatId) => {
    if (!chatId) {
        return false;
    }
    return Client.exists({chatId});
}


const addClient = async ({chatId, fullName, username}) => {
    let newClient = new Client({
        chatId,
        fullName,
        username,
        registerTime: new Date()
    });
    return newClient.save()
}

const getClientByChatId = async (chatId) => {
    return Client.findOne({chatId});
}


module.exports = {existByChatId: existById, addClient, getClientByChatId}