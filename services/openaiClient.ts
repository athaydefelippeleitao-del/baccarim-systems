/**
 * openaiClient.ts
 * Frontend client que chama as Vercel Serverless Functions de IA (OpenAI no backend).
 * A chave fica no servidor — nunca exposta no bundle do navegador.
 */

const BASE = '/api/openai';

async function post<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Erro do servidor (${res.status}): ${text.slice(0, 200)}`);
  }

  if (data && data.error) {
    throw new Error(data.error);
  }
  return data.result as T;
}

export async function analyzeLicensePortfolio(licenses: any[], notifications: any[]): Promise<string> {
  const cleanLicenses = (licenses || []).map(l => ({
    name: l.name,
    clientName: l.clientName,
    type: l.type,
    status: l.status,
    expiryDate: l.expiryDate,
    agency: l.agency
  }));

  const cleanNotifications = (notifications || []).map(n => ({
    title: n.title,
    clientName: n.clientName,
    severity: n.severity,
    deadline: n.deadline,
    status: n.status
  }));

  const result = await post<string>('/analyze-portfolio', {
    licenses: cleanLicenses,
    notifications: cleanNotifications
  });
  return result || 'Nenhuma análise disponível.';
}

export async function analyzeVistoriaImage(base64Image: string): Promise<any> {
  return post('/analyze-image', { base64Image });
}

export async function generateNotificationDraft(
  agency: string,
  description: string,
  clientName: string
): Promise<string> {
  const result = await post<string>('/notification-draft', { agency, description, clientName });
  return result || 'Não foi possível gerar o rascunho.';
}

export async function createNotificationFromText(rawText: string): Promise<{
  title: string;
  agency: string;
  deadline: string;
  severity: string;
  category: string;
  description: string;
  responseDraft: string;
}> {
  return post('/create-notification', { rawText });
}


export async function suggestExcelMapping(headers: string[]): Promise<Record<string, string>> {
  return post('/suggest-mapping', { headers });
}

export async function generateAIDocument(
  documentType: string,
  projectContext: string,
  extraContext: string
): Promise<string> {
  const result = await post<string>('/generate-document', { documentType, projectContext, extraContext });
  return result || 'Não foi possível gerar o documento.';
}
