const mongoose = require("mongoose");


const scheme = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    goal: {
        type: mongoose.Types.ObjectId,
        ref: "Goal",
        required: true,
    },
    client: {
        type: mongoose.Types.ObjectId,
        ref: "Client",
        required: true,
    },
    createdTime: {
        type: Date,
        required: true,
    }
}, {
    validateBeforeSave: true,
})

module.exports = mongoose.models.Count || mongoose.model('Count', scheme)