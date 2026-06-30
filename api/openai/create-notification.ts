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
    const { rawText } = req.body;

    const prompt = `Você é um assistente especialista em licenciamento ambiental no Brasil. Analise o texto abaixo (pode ser um ofício, e-mail, ou notificação de órgão ambiental como SEMA, IAT, IBAMA, CEMA, etc.) e extraia as informações para criar um registro estruturado.

Texto recebido:
"""
${rawText}
"""

Retorne SOMENTE um JSON válido com este formato exato (sem markdown, sem explicações, apenas o JSON):
{
  "title": "Título curto e objetivo da exigência (máx 80 chars)",
  "agency": "Nome do órgão emissor (ex: SEMA, IAT, IBAMA, CEMA)",
  "deadline": "Prazo em formato DD/MM/YYYY (se não houver, deixe vazio)",
  "severity": "Alta, Média ou Baixa (baseado na urgência/criticidade)",
  "category": "Notificação ou Licença",
  "description": "Descrição detalhada do que foi solicitado, preservando termos técnicos",
  "responseDraft": "Rascunho de resposta técnica profissional para a exigência, como consultor da Baccarim Engenharia"
}`;

    const response = await withTimeout(openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }));

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return res.status(200).json({ result: parsed });
  } catch (e: any) {
    console.error('create-notification error:', e);
    return res.status(200).json({ error: e.message || 'Erro ao processar notificação' });
  }
}
