import mongoose from "mongoose";

export interface StoryI {
    content: string,
    client: typeof mongoose.Types.ObjectId,
    createdTime: Date
}

const scheme = new mongoose.Schema<StoryI>({
    content: {
        type: String,
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

export default mongoose.models.Story || mongoose.model('Story', scheme)