import OpenAI from "openai";
import { EnvironmentalLicense, Notification } from "../types";
import { utmToDecimal } from "../utils/geoUtils";

function getAI() {
    const apiKey = process.env.OPENAI_API_KEY || (process.env as any).API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY não configurada no servidor");
    return new OpenAI({ apiKey });
}

// Timeout wrapper
function withTimeout<T>(promise: Promise<T>, ms = 25000): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout após ${ms / 1000}s`)), ms)
    );
    return Promise.race([promise, timeout]);
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, initialDelay = 1500): Promise<T> {
    let retries = 0;
    while (true) {
        try {
            return await withTimeout(fn(), 25000);
        } catch (error: any) {
            const isQuotaError =
                error?.message?.includes('429') ||
                error?.status === 429 ||
                error?.message?.includes('quota');

            if (isQuotaError && retries < maxRetries) {
                const delay = initialDelay * Math.pow(2, retries) + Math.random() * 500;
                console.warn(`Cota da IA atingida. Tentando em ${Math.round(delay)}ms... (${retries + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retries++;
                continue;
            }
            throw error;
        }
    }
}

export async function suggestExcelMapping(headers: string[]): Promise<Record<string, string>> {
    const openai = getAI();
    const prompt = `Analise cabecalhos de engenharia: ${headers.join(', ')}. Retorne JSON mapeando para: name, clientName, processNumber, expiryDate, agency, status.`;

    try {
        const response = await withRetry(() => openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" }
        }));
        return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error) {
        console.error("suggestExcelMapping error:", error);
        return {};
    }
}

export async function analyzeLicensePortfolio(licenses: EnvironmentalLicense[], notifications: Notification[]): Promise<string> {
    const openai = getAI();
    const licenseSummary = licenses.slice(0, 10).map(l => ({
        name: l.name, client: l.clientName, type: l.type, status: l.status,
        expiry: l.expiryDate, agency: l.agency
    }));
    const notifSummary = notifications.slice(0, 5).map(n => ({
        title: n.title, client: n.clientName, severity: n.severity, deadline: n.deadline, status: n.status
    }));

    const prompt = `Você é um consultor ambiental sênior da Baccarim Engenharia. Analise o portfólio abaixo e gere um relatório em Markdown com: status geral, alertas críticos e recomendações.

LICENÇAS: ${JSON.stringify(licenseSummary)}
NOTIFICAÇÕES: ${JSON.stringify(notifSummary)}`;

    const response = await withRetry(() => openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
    }));
    return response.choices[0]?.message?.content || "Nenhuma análise disponível.";
}

export async function analyzeVistoriaImage(base64Image: string): Promise<any> {
    const openai = getAI();

    // Extract proper mimeType
    const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const dataUri = `data:${mimeType};base64,${cleanBase64}`;

    const prompt = `Extraia as coordenadas UTM Leste (E) e Norte (N) da marca d'água desta foto de vistoria.
Retorne EXCLUSIVAMENTE um JSON no formato: {"coordE": "string", "coordN": "string"}`;

    const result = await withRetry(() => openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: dataUri, detail: "high" } }
                ]
            }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
    }));

    const text = result.choices[0]?.message?.content || "{}";
    console.log("Resposta OpenAI (OCR):", text);
    const parsed = JSON.parse(text);

    if (parsed.coordE && parsed.coordN) {
        const eStr = parsed.coordE.replace(/[^\d.]/g, '');
        const nStr = parsed.coordN.replace(/[^\d.]/g, '');
        const e = parseFloat(eStr);
        const n = parseFloat(nStr);
        if (!isNaN(e) && !isNaN(n)) {
            try {
                const converted = utmToDecimal(e, n);
                parsed.lat = converted.lat;
                parsed.lng = converted.lng;
            } catch (e) {
                console.error("Erro conversão UTM:", e);
            }
        }
    }
    return parsed;
}

export async function generateNotificationDraft(agency: string, description: string, clientName: string): Promise<string> {
    const openai = getAI();
    const prompt = `Como consultor ambiental da Baccarim Engenharia, crie um rascunho de resposta técnica profissional para esta notificação do órgão ${agency}:

"${description}"

Cliente: ${clientName}

Inclua: introdução formal, medidas que serão adotadas e lista de documentos a apresentar.`;

    const response = await withRetry(() => openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
    }));
    return response.choices[0]?.message?.content || "Não foi possível gerar o rascunho.";
}
