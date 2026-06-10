import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

function withTimeout<T>(promise: Promise<T>, ms = 25000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout após ${ms / 1000}s`)), ms)
  );
  return Promise.race([promise, timeout]);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ error: 'OPENAI_API_KEY não configurada no servidor' });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const { headers = [] } = req.body;

    const prompt = `Analise cabecalhos de engenharia: ${headers.join(', ')}. Retorne JSON mapeando para: name, clientName, processNumber, expiryDate, agency, status.`;

    const response = await withTimeout(openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    }));

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return res.status(200).json({ result });
  } catch (e: any) {
    console.error('suggest-mapping error:', e);
    return res.status(200).json({ error: e.message || 'Erro ao sugerir mapeamento' });
  }
}
