import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

async function run() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: "Hello world"
        });
        console.log("Success:", !!response.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
