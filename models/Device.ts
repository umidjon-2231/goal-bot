import mongoose from "mongoose";
import {z} from "zod";


const systemNames = ["ios", "android"] as const

export type SystemName = typeof systemNames[number]

export interface DeviceI {
    _id: mongoose.Types.ObjectId,
    createdTime: Date
    uniqueId: string
    model: string
    brand: string
    systemName: SystemName,
    systemVersion: string
}

const scheme = new mongoose.Schema<DeviceI>({
    uniqueId: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    systemName: {
        type: String,
        required: true,
        enum: systemNames,
    },
    systemVersion: {
        type: String,
        required: true,
    },
    createdTime: {
        type: Date,
        required: true,
    },
}, {
    validateBeforeSave: true,
})

export const deviceValidation = z.object({
    uniqueId: z.string().min(1),
    model: z.string().min(1),
    brand: z.string().min(1),
    systemName: z.enum(systemNames,
        {message: "Invalid system name provided. Expected 'android' or 'ios'"}),
    systemVersion: z.string().min(1),
}).strict()

export default mongoose.models.Device || mongoose.model('Device', scheme)