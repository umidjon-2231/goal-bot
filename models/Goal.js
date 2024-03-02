const mongoose = require("mongoose");


const scheme = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    chatId: {
        type: Number,
        required: true,
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: "Client",
    },
    createdTime: {
        type: Date,
        required: true,
    }
}, {
    validateBeforeSave: true,
})

module.exports = mongoose.models.Goal || mongoose.model('Goal', scheme)