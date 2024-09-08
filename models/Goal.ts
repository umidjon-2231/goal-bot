import mongoose from "mongoose";

export interface GoalI {
    _id: mongoose.Types.ObjectId,
    name: string,
    chatId: number
    createdBy: typeof mongoose.Types.ObjectId
    createdTime: Date
    notification: boolean
}

const scheme = new mongoose.Schema<GoalI>({
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
    },
    notification: {
        type: Boolean,
        required: true,
        default: false,
    }
}, {
    validateBeforeSave: true,
})

export default mongoose.models.Goal || mongoose.model('Goal', scheme)