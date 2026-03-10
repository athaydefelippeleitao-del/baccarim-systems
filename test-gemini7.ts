import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: 'dummy' });
ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ text: 'Hello' }],
    config: { responseMimeType: 'application/json' }
});
