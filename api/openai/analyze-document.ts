import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const withTimeout = <T>(promise: Promise<T>, ms: number = 55000): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('A requisição para OpenAI demorou mais de 55 segundos e foi abortada.')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { base64Data, checklistItems, currentDate } = req.body;

    if (!base64Data || !checklistItems) {
      return res.status(400).json({ error: 'Faltando dados (base64Data ou checklistItems).' });
    }

    const mimeTypeMatch = base64Data.match(/^data:(image\/\w+|application\/pdf);base64,/);
    let mimeType = 'image/jpeg';
    let cleanBase64 = base64Data;
    if (mimeTypeMatch) {
      mimeType = mimeTypeMatch[1];
      cleanBase64 = base64Data.replace(/^data:(image\/\w+|application\/pdf);base64,/, '');
    } else if (base64Data.includes(',')) {
      cleanBase64 = base64Data.split(',')[1];
    }

    const dataUri = `data:${mimeType};base64,${cleanBase64}`;

    const prompt = `Você é um perito ambiental sênior de um sistema de licenciamento.
Sua tarefa é analisar rigorosamente o documento em anexo e tentar encaixá-lo em UM dos itens do checklist fornecido abaixo.

Lista de itens do checklist disponíveis (JSON):
${JSON.stringify(checklistItems)}

DIRETRIZES DE CORRESPONDÊNCIA (MATCHING):
1. O documento em anexo pode não ter exatamente o mesmo nome que está no "label" do item. Você deve deduzir pelo contexto, conteúdo do documento, órgão emissor, e jargão ambiental (ex: um documento do IAT sobre recursos hídricos pode ser a "Outorga", um documento sobre cadastro rural pode ser o "CAR", uma licença prévia pode ser a "LP", um comprovante de pagamento pode ser a "Taxa", uma planta baixa pode ser "Projeto Hidrossanitário").
2. Se o documento tratar claramente do mesmo assunto que o item do checklist pede, considere um MATCH.
3. Se realmente o documento não se referir a NENHUM dos itens (por exemplo, é uma propaganda, ou um documento totalmente irrelevante), então retorne null. Seja flexível para encontrar a melhor casa para o documento.

DIRETRIZES DE VALIDADE:
1. Procure datas de validade, vencimento, "válido até", ou prazo de vigência no documento.
2. A data atual para comparação é: ${currentDate} (formato DD/MM/AAAA).
3. Se encontrar validade, retorne-a no formato DD/MM/AAAA.
4. "Aprovado": se não tiver validade clara OU se a validade for maior ou igual à data atual.
5. "Vencido": se a validade já passou da data atual.

Retorne EXCLUSIVAMENTE um objeto JSON contendo:
- "matchedItemId": O ID ("id") do item do checklist que melhor corresponde ao documento (ou null se impossível encaixar em qualquer um).
- "expirationDate": A data de validade extraída (ex: "15/12/2026") ou null.
- "status": "Aprovado" ou "Vencido" ou null.
- "reason": Uma breve explicação técnica do porquê combinou com esse item e o porquê do status (ex: "Trata-se de Licença de Operação do IAT. A validade é até 12/2027, portanto está Aprovado.").

Lembre-se: retorne APENAS um JSON válido.`;

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
      temperature: 0.1
    }));

    const text = result.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text);
    return res.status(200).json({ result: parsed });
  } catch (e: any) {
    console.error('analyze-document error:', e);
    return res.status(500).json({ error: e.message || 'Erro ao analisar o documento com IA' });
  }
}
