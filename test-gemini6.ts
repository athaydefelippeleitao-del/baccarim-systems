import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: 'dummy' });
async function run() {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ text: 'Hello' }]
    });
    console.log(response.text);
}
run();
