import mongoose from "mongoose";

export interface CountI {
    amount: number
    goal: typeof mongoose.Types.ObjectId,
    client: typeof mongoose.Types.ObjectId,
    createdTime: Date
}

const scheme = new mongoose.Schema<CountI>({
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

export default mongoose.models.Count || mongoose.model('Count', scheme)