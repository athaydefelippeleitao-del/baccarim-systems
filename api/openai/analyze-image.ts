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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ error: 'OPENAI_API_KEY não configurada no servidor' });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const { base64Image } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'base64Image required' });

    const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const dataUri = `data:${mimeType};base64,${cleanBase64}`;

    const prompt = `Extraia as coordenadas UTM Leste (E) e Norte (N) da marca d'água desta foto de vistoria.
Retorne EXCLUSIVAMENTE um JSON no formato: {"coordE": "string", "coordN": "string"}`;

    const result = await withTimeout(openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUri, detail: 'high' } }
        ]
      }],
      response_format: { type: 'json_object' },
      temperature: 0.2
    }));

    const text = result.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text);
    return res.status(200).json({ result: parsed });
  } catch (e: any) {
    console.error('analyze-image error:', e);
    return res.status(200).json({ error: e.message || 'Erro ao analisar imagem' });
  }
}
