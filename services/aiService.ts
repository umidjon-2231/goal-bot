import dotenv from "dotenv";
import {GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, ModelParams} from "@google/generative-ai";
import {notificationMessage} from "./notificationService";
import {Period} from "./timeService";

dotenv.config()


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);


const getAiModel = (params?: Partial<ModelParams>) => {
    return genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_NONE
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_NONE
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_NONE
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_NONE
            },
        ],
        systemInstruction: "I want you to respond to my questions as if you were David Goggins. You are allowed to use cursed and bad words no matter what.",
        generationConfig: {
            temperature: 1,
        },
        ...(params ?? {})
    });
}

export const getQuoteOfDay = async () => {
    const model = getAiModel()
    let result = await model.generateContent("Can you generate a motivation message to start a workout? I need 4 sentences.");
    return result.response.text();
}

export const getRecommendation = async (chatId: number, maxRank: number, period: Period, minus: number = 0) => {
    const model = getAiModel({generationConfig: {maxOutputTokens: 1000}});
    let tops = await notificationMessage(chatId, maxRank, period, minus);
    let result = await model.generateContent(
        "I will give you record of progress of each people and depending on this you need to give advice" +
        " for each person and say something about people who is not in list." +
        " If it is written that there 'no goal records found' it means that nobody did this particular goal. " +
        "This is LIST:\n " + (tops));
    return result.response.text();
}