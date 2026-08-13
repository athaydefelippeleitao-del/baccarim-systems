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

    const prompt = `Você é um assistente especialista em extração de dados de imagens.
Esta é uma foto de vistoria de campo com uma marca d'água contendo coordenadas geográficas.
Leia com cuidado o texto sobreposto na imagem.
Verifique se as coordenadas estão em formato UTM ou em Latitude/Longitude.
1. Se estiverem em UTM:
Extraia EXATAMENTE como escrito os valores de Leste (E ou X) e Norte (N ou Y).
Retorne-os como string em coordE e coordN. Mantenha os pontos e vírgulas originais! Não invente nem arredonde.
2. Se estiverem em Latitude e Longitude (graus decimais ou graus/minutos/segundos):
Converta para graus decimais numéricos (ex: -23.123456) e retorne nos campos lat e lng.
Deixe coordE e coordN vazios ("").
Retorne EXCLUSIVAMENTE um JSON neste formato exato (sem formatação markdown):
{"coordE": "", "coordN": "", "lat": null, "lng": null}
Se não conseguir ler as coordenadas com certeza, retorne os campos vazios/nulos.`;

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
