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
    const { licenses = [], notifications = [] } = req.body;

    const licenseSummary = licenses.slice(0, 10).map((l: any) => ({
      name: l.name, client: l.clientName, type: l.type,
      status: l.status, expiry: l.expiryDate, agency: l.agency
    }));
    const notifSummary = notifications.slice(0, 5).map((n: any) => ({
      title: n.title, client: n.clientName, severity: n.severity,
      deadline: n.deadline, status: n.status
    }));

    const prompt = `Você é um consultor ambiental sênior da Baccarim Engenharia. Analise o portfólio abaixo e gere um relatório em Markdown com: status geral, alertas críticos e recomendações.

LICENÇAS: ${JSON.stringify(licenseSummary)}
NOTIFICAÇÕES: ${JSON.stringify(notifSummary)}`;

    const response = await withTimeout(openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000
    }));

    const result = response.choices[0]?.message?.content || 'Nenhuma análise disponível.';
    return res.status(200).json({ result });
  } catch (e: any) {
    console.error('analyze-portfolio error:', e);
    return res.status(200).json({ error: e.message || 'Erro ao analisar portfólio' });
  }
}
