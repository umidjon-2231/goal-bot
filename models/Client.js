const mongoose = require("mongoose");


const scheme = new mongoose.Schema({
    username: {
        type: String,
    },
    fullName: {
        type: String,
        required: true,
    },
    chatId: {
        type: Number,
        required: true,
    },
    registerTime: {
        type: Date,
        required: true,
    }
}, {
    validateBeforeSave: true,
})

module.exports = mongoose.models.Client || mongoose.model('Client', scheme)