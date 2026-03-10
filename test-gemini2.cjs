const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: 'dummy-key-123' });

try {
    // Try to create the request object to see if client side validation throws
    ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
            { text: 'Hello' },
            { inlineData: { mimeType: 'image/jpeg', data: 'abcd' } }
        ]
    }).catch(e => {
        console.log("Caught in promise:", e.message);
    });
    console.log("Validation passed");
} catch (e) {
    console.log("Validation failed:", e.message);
}
