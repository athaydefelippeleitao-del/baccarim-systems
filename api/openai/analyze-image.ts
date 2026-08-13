import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

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

    const prompt = `Você é um assistente especialista em OCR (leitura ótica).
A imagem contém uma marca d'água com coordenadas (no canto superior direito, inferior esquerdo ou ao longo da borda).
Exemplo comum na marca d'água: "E 506360 N 7322676 282° W"
Neste caso: Leste (E) é 506360 e Norte (N) é 7322676. (Norte no Brasil costuma ter 7 dígitos e Leste 6 dígitos).

Sua tarefa:
1. Encontre o número correspondente a Leste (E, X, ou Easting) e coloque em coordE.
2. Encontre o número correspondente a Norte (N, Y, ou Northing) e coloque em coordN.
3. Se houver Latitude/Longitude em vez de UTM, extraia-os para lat e lng (como número decimal) e deixe coordE e coordN vazios ("").
4. Retorne APENAS OS NÚMEROS nos campos UTM (remova letras como 'S', 'W', 'E', 'N', '°'). NUNCA coloque letras como "S" no campo coordN ou coordE.

Retorne EXCLUSIVAMENTE um JSON neste formato exato (sem formatação markdown):
{"coordE": "506360", "coordN": "7322676", "lat": null, "lng": null}

Se a imagem não tiver coordenadas visíveis, retorne vazio: {"coordE": "", "coordN": "", "lat": null, "lng": null}`;

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
