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
  const result = await post<string>('/analyze-portfolio', { licenses, notifications });
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
