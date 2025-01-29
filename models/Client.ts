import mongoose from "mongoose";

export interface ClientI {
    _id: mongoose.Types.ObjectId
    username: string
    fullName: string,
    chatId: number,
    registerTime: Date,
}

const scheme = new mongoose.Schema<ClientI>({
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

export default mongoose.models.Client || mongoose.model('Client', scheme)