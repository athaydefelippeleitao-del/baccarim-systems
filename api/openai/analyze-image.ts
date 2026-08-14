import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export const maxDuration = 60; // Permite que a função rode por até 60s (necessário para visão computacional)

function withTimeout<T>(promise: Promise<T>, ms = 55000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout após ${ms / 1000}s`)), ms)
  );
  return Promise.race([promise, timeout]);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

    const prompt = `Você é um perito em topografia e visão computacional.
A imagem contém uma marca d'água com coordenadas UTM ou Latitude/Longitude.

Sua ÚNICA tarefa é ler os números EXATAMENTE como estão escritos na imagem. NÃO arredonde, NÃO invente, NÃO adivinhe.

REGRAS RÍGIDAS:
1. Leste (Easting / X): No Brasil, SEMPRE tem 6 dígitos antes da vírgula (ex: 506360). Se você ler algo diferente (ex: 5 dígitos), VOCÊ LEU ERRADO. Olhe novamente com mais cuidado.
2. Norte (Northing / Y): No Brasil, SEMPRE tem 7 dígitos antes da vírgula (ex: 7322676). Se você ler algo diferente, VOCÊ LEU ERRADO. Olhe novamente.
3. Se a imagem tiver Latitude/Longitude em vez de UTM (ex: -23.3106, -51.1628), preencha 'lat' e 'lng' e deixe 'coordE' e 'coordN' VAZIOS ("").
4. Remova QUALQUER letra dos números finais. O campo deve conter apenas números e ponto/vírgula.

EXEMPLO DE SAÍDA JSON VALIDA:
{"coordE": "506360", "coordN": "7322676", "lat": null, "lng": null}

Retorne APENAS o JSON acima, sem markdown, sem explicações. Se a foto não tiver coordenadas, retorne tudo vazio.`;

    // Retry with exponential backoff on rate limit (429)
    const MAX_RETRIES = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await withTimeout(openai.chat.completions.create({
          model: 'gpt-4o',
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
      } catch (err: any) {
        lastError = err;
        const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Rate limit');
        if (is429 && attempt < MAX_RETRIES - 1) {
          // Wait progressively longer: 5s, 15s, 30s
          const waitMs = [5000, 15000, 30000][attempt];
          console.log(`Rate limit hit, retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(waitMs);
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  } catch (e: any) {
    console.error('analyze-image error:', e);
    return res.status(200).json({ error: e.message || 'Erro ao analisar imagem' });
  }
}
