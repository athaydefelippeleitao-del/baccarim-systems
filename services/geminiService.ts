
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { EnvironmentalLicense, Notification } from "../types";
import { utmToDecimal } from "../utils/geoUtils";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY || (process.env as any).API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada no servidor");
  return new GoogleGenAI({ apiKey });
}

// Timeout wrapper — prevents infinite hangs
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
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
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
  const ai = getAI();
  const prompt = `Analise cabecalhos de engenharia: ${headers.join(', ')}. Retorne JSON mapeando para: name, clientName, processNumber, expiryDate, agency, status.`;
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("suggestExcelMapping error:", error);
    return {};
  }
}

export async function analyzeLicensePortfolio(licenses: EnvironmentalLicense[], notifications: Notification[]): Promise<string> {
  const ai = getAI();
  // Limit data size to avoid huge prompts
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

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt,
  }));
  return response.text || "Nenhuma análise disponível.";
}

export async function analyzeVistoriaImage(base64Image: string): Promise<any> {
  const ai = getAI();

  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

  const prompt = `Extraia as coordenadas UTM Leste (E) e Norte (N) da marca d'água desta foto de vistoria.
Retorne EXCLUSIVAMENTE um JSON no formato: {"coordE": "string", "coordN": "string"}`;

  const result = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: [
      { inlineData: { mimeType, data: cleanBase64 } },
      { text: prompt }
    ],
    config: { responseMimeType: "application/json", temperature: 0.2 }
  }));

  const text = result.text || "{}";
  console.log("Resposta Gemini (OCR):", text);
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
  const ai = getAI();
  const prompt = `Como consultor ambiental da Baccarim Engenharia, crie um rascunho de resposta técnica profissional para esta notificação do órgão ${agency}:

"${description}"

Cliente: ${clientName}

Inclua: introdução formal, medidas que serão adotadas e lista de documentos a apresentar.`;

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  }));
  return response.text || "Não foi possível gerar o rascunho.";
}
