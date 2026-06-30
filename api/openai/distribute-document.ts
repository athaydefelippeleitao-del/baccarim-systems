import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { Readable } from 'stream';
import { Buffer } from 'buffer';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

const withTimeout = <T>(promise: Promise<T>, ms = 55000): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Timeout após ' + ms / 1000 + 's')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

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
    const { dataUri, fileName, checklistItems } = req.body;

    if (!dataUri || !checklistItems) {
      return res.status(400).json({ error: 'Faltando dataUri ou checklistItems.' });
    }

    const prompt = `Você é um assistente especializado em licenciamento ambiental.
Eu vou enviar um documento cujo nome é "${fileName}" (em anexo).

Abaixo está a lista de itens pendentes no checklist documental deste empreendimento:
${JSON.stringify(checklistItems)}

Sua tarefa é analisar o documento e decidir se ele atende a UM dos itens deste checklist.
Atenção: Procure identificar pelo conteúdo e natureza do documento (ex: se é um RG/CPF, se é um comprovante de endereço, um contrato social, uma planta planialtimétrica, matrícula do imóvel, procuração, etc).

Retorne EXCLUSIVAMENTE um objeto JSON contendo:
- "matchedChecklistItemId": O "id" do item do checklist correspondente. Caso o documento não sirva para nenhum dos itens listados, retorne null.
- "reasoning": Uma explicação muito breve (1 frase) do porquê esse documento atende esse item, ou porquê não atende nenhum.

Retorne APENAS um JSON válido.`;

    const isPdf = dataUri.startsWith('data:application/pdf');
    const isImage = dataUri.startsWith('data:image/');

    let result: any;

    if (isPdf) {
      const base64 = dataUri.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      const file = new File([buffer], fileName || 'documento.pdf', { type: 'application/pdf' });

      const uploadedFile = await withTimeout(openai.files.create({
        file: file,
        purpose: 'user_data',
      }));

      try {
        const response = await withTimeout(openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'file',
                file: { file_id: uploadedFile.id }
              } as any
            ]
          }],
          response_format: { type: 'json_object' },
          temperature: 0.1
        }));

        const text = response.choices[0]?.message?.content || '{}';
        result = JSON.parse(text);
      } finally {
        await openai.files.delete(uploadedFile.id).catch(() => {});
      }
    } else if (isImage) {
      const response = await withTimeout(openai.chat.completions.create({
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

      const text = response.choices[0]?.message?.content || '{}';
      result = JSON.parse(text);
    } else {
      return res.status(400).json({ error: 'Formato de arquivo não suportado. Use PDF, PNG ou JPG.' });
    }

    return res.status(200).json({ result });
  } catch (e: any) {
    console.error('distribute-document error:', e);
    return res.status(200).json({ error: e.message || 'Erro ao analisar o documento com IA' });
  }
}
