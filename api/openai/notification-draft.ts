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
    const { agency, description, clientName } = req.body;

    const prompt = `Como consultor ambiental da Baccarim Engenharia, crie um rascunho de resposta técnica profissional para esta notificação do órgão ${agency}:

"${description}"

Cliente: ${clientName}

Inclua: introdução formal, medidas que serão adotadas e lista de documentos a apresentar.`;

    const response = await withTimeout(openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    }));

    const result = response.choices[0]?.message?.content || 'Não foi possível gerar o rascunho.';
    return res.status(200).json({ result });
  } catch (e: any) {
    console.error('notification-draft error:', e);
    return res.status(200).json({ error: e.message || 'Erro ao gerar rascunho' });
  }
}
