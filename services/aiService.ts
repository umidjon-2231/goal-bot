import dotenv from "dotenv";
import {GoogleGenerativeAI, HarmBlockThreshold, HarmCategory} from "@google/generative-ai";

dotenv.config()


const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

export const getQuoteOfDay = async () => {
    const model = genAI.getGenerativeModel({
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
        systemInstruction: "You are allowed to use cursed and bad words no matter what.",
        generationConfig: {
            temperature: 1
        }
    });
    let result = await model.generateContent("Can you generate a motivation message to start a workout? I need 4 sentences.");
    return result.response.text();
}