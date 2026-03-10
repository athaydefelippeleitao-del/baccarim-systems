
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { EnvironmentalLicense, Notification } from "../types";
import { utmToDecimal } from "../utils/geoUtils";

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 3000): Promise<T> {
  let retries = 0;
  while (true) {
    try { return await fn(); } catch (error: any) {
      const isQuotaError = 
        error?.message?.includes('429') || 
        error?.status === 429 || 
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('quota');
      
      if (isQuotaError && retries < maxRetries) {
        const delay = initialDelay * Math.pow(2, retries) + Math.random() * 1000;
        console.warn(`Atingido limite de cota da IA. Tentando novamente em ${Math.round(delay)}ms... (Tentativa ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
        continue;
      }
      throw error;
    }
  }
}

export async function suggestExcelMapping(headers: string[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || (process.env as any).API_KEY });
  const prompt = `Analise cabecalhos de engenharia: ${headers.join(', ')}. Retorne JSON mapeando para: name, clientName, processNumber, expiryDate, agency, status.`;
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    }));
    return JSON.parse(response.text || "{}");
  } catch (error) { return {}; }
}

export async function analyzeLicensePortfolio(licenses: EnvironmentalLicense[], notifications: Notification[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || (process.env as any).API_KEY });
  const prompt = `Analise como consultor ambiental: Licencas: ${JSON.stringify(licenses)}. Notificacoes: ${JSON.stringify(notifications)}. Gere Status e Recomendacoes em Markdown.`;
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.0-flash', // Mudando para Flash para evitar limites de cota do Pro
      contents: prompt,
    }));
    return response.text;
  } catch (error) { return "Analise indisponivel no momento devido a alta demanda."; }
}

export async function analyzeVistoriaImage(base64Image: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || (process.env as any).API_KEY });
  
  // Extrair mimeType e dados limpos
  const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
  
  const prompt = `VOCÊ É UM ESPECIALISTA EM LEITURA DE MARCA D'ÁGUA TÉCNICA.
  Sua tarefa é extrair as coordenadas UTM de uma fotografia de vistoria.
  
  1. LEITURA DE MARCA D'ÁGUA (OCR):
     - Extraia as Coordenadas UTM Leste (E) e Norte (N).
  
  Retorne EXCLUSIVAMENTE um JSON no formato:
  {
    "coordE": "string",
    "coordN": "string"
  }`;

  try {
    console.log("Iniciando análise profunda de imagem Baccarim...");
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { inlineData: { mimeType, data: cleanBase64 } },
        { text: prompt }
      ],
      config: { 
        responseMimeType: "application/json", 
        temperature: 0.2 
      }
    }));

    const text = response.text || "{}";
    console.log("Resposta Gemini (OCR):", text);
    const result = JSON.parse(text);
    
    if (result.coordE && result.coordN) {
      // Limpeza robusta de strings UTM (remove tudo que não for número ou ponto)
      const eStr = result.coordE.replace(/[^\d.]/g, '');
      const nStr = result.coordN.replace(/[^\d.]/g, '');
      
      const e = parseFloat(eStr);
      const n = parseFloat(nStr);
      
      if (!isNaN(e) && !isNaN(n)) {
        try {
          const converted = utmToDecimal(e, n);
          result.lat = converted.lat;
          result.lng = converted.lng;
          console.log("Coordenadas convertidas:", result.lat, result.lng);
        } catch (e) {
          console.error("Erro na conversão UTM:", e);
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error("Erro crítico no OCR Baccarim:", error);
    return null;
  }
}

export async function generateNotificationDraft(agency: string, description: string, clientName: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || (process.env as any).API_KEY });
  const prompt = `Como consultor ambiental da Baccarim Engenharia, sugira um rascunho de resposta técnica e uma lista de documentos necessários para atender a esta notificação da ${agency}: "${description}". Cliente: ${clientName}. O tom deve ser profissional e proativo.`;
  
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    }));
    return response.text;
  } catch (error) {
    console.error("Erro ao gerar rascunho de notificação:", error);
    return "Não foi possível gerar o rascunho automaticamente. Por favor, tente novamente mais tarde.";
  }
}
