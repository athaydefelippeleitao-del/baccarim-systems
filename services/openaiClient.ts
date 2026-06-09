/**
 * geminiClient.ts
 * Frontend client that calls the server-side Gemini API routes.
 * The API key stays on the server — never exposed in the browser bundle.
 */

const BASE = '/api/openai';

async function post<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  const data = await res.json();
  return data.result as T;
}

export async function suggestExcelMapping(headers: string[]): Promise<Record<string, string>> {
  return post('/suggest-mapping', { headers });
}

export async function analyzeLicensePortfolio(licenses: any[], notifications: any[]): Promise<string> {
  // Map and strip out heavy fields (like documentation arrays or base64) to prevent 413 payload limit errors on Vercel
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

  const result = await post<string>('/analyze-portfolio', { licenses: cleanLicenses, notifications: cleanNotifications });
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

export async function generateAIDocument(
  documentType: string,
  projectContext: string,
  extraContext: string
): Promise<string> {
  const result = await post<string>('/generate-document', { documentType, projectContext, extraContext });
  return result || 'Não foi possível gerar o documento.';
}
