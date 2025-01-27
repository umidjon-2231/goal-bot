import mongoose, {Schema} from "mongoose";

export interface TokenI {
    _id: mongoose.Types.ObjectId,
    token: string,
    client?: typeof mongoose.Types.ObjectId
    device: typeof mongoose.Types.ObjectId
    createdTime: Date
    verifiedTime?: Date
    active: boolean
}

const schema = new Schema<TokenI>({
    token: {
        type: String,
        required: true,
    },
    client: {
        type: mongoose.Types.ObjectId,
        ref: "Client",
    },
    device: {
        type: mongoose.Types.ObjectId,
        ref: "Device",
        required: true,
    },
    createdTime: {
        type: Date,
        required: true,
    },
    verifiedTime: {
        type: Date,
    },
    active: {
        type: Boolean,
        default: false,
        required: true,
    }
}, {
    validateBeforeSave: true,
})

export default mongoose.models.Token || mongoose.model('Token', schema)