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
    const { documentType, projectContext, extraContext } = req.body;

    let typePrompt = 'um documento técnico ambiental';
    if (documentType === 'RAP') typePrompt = 'um RAP (Relatório Ambiental Prévio)';
    else if (documentType === 'Relatório Fotográfico') typePrompt = 'um Relatório Fotográfico de Vistoria';
    else if (documentType === 'Dilação de Prazo') typePrompt = 'um ofício de Dilação de Prazo';

    const prompt = `Você é um engenheiro ambiental sênior da Baccarim Engenharia. Sua tarefa é elaborar ${typePrompt} com base nos dados do projeto.

DADOS DO PROJETO:
${projectContext}

INFORMAÇÕES ADICIONAIS / INSTRUÇÕES:
${extraContext}

Escreva o documento de forma formal, técnica e completa, utilizando formatação Markdown. Crie seções claras, como Introdução, Desenvolvimento/Corpo Técnico, e Conclusão/Fechamento conforme apropriado para o tipo de documento.`;

    const response = await withTimeout(openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    }));

    const result = response.choices[0]?.message?.content || 'Não foi possível gerar o documento.';
    return res.status(200).json({ result });
  } catch (e: any) {
    console.error('generate-document error:', e);
    return res.status(200).json({ error: e.message || 'Erro ao gerar documento' });
  }
}
