import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { Buffer } from 'buffer';
import pdfParse from 'pdf-parse';

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

    // Filter to only items that aren't completed, or pass all of them? 
    // The frontend passes all, but we should make sure we only match valid ones.
    const promptBase = `Você é um assistente especializado em licenciamento ambiental e análise documental.
Sua tarefa é analisar o documento (ou o texto do documento) fornecido e decidir se ele atende a UM dos itens deste checklist.

Abaixo está a lista de itens pendentes no checklist documental deste empreendimento:
${JSON.stringify(checklistItems)}

Atenção: Procure identificar pelo conteúdo e natureza do documento (ex: se é um RG/CPF, CNH, se é um comprovante de endereço, um contrato social, uma planta planialtimétrica, matrícula do imóvel, procuração, ART, ofício, etc). 
Pode haver pequenas divergências no nome do arquivo, foque no conteúdo real do documento.

Retorne EXCLUSIVAMENTE um objeto JSON contendo:
- "matchedChecklistItemId": O "id" exato (string) do item do checklist correspondente. Caso o documento não sirva para NENHUM dos itens listados, ou se não for possível determinar, retorne null.
- "reasoning": Uma explicação muito breve (1 ou 2 frases) do porquê esse documento atende esse item, ou porquê não atende nenhum.

Retorne APENAS um JSON válido, sem formatação markdown em volta, apenas o JSON puro.`;

    const isPdf = dataUri.startsWith('data:application/pdf');
    const isImage = dataUri.startsWith('data:image/');

    let result: any = null;

    if (isPdf) {
      const base64 = dataUri.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      
      let pdfText = '';
      try {
        const parsed = await pdfParse(buffer);
        pdfText = parsed.text;
      } catch (err) {
        console.warn('Could not parse PDF text:', err);
        pdfText = '(Não foi possível extrair o texto do PDF automaticamente. Baseie-se apenas no nome do arquivo.)';
      }

      const prompt = `${promptBase}\n\nNome do Arquivo: "${fileName}"\n\nConteúdo extraído do PDF:\n${pdfText.substring(0, 8000)}`;

      const response = await withTimeout(openai.chat.completions.create({
        model: 'gpt-4o', // using gpt-4o as it handles long contexts better
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt }
          ]
        }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      }));

      const text = response.choices[0]?.message?.content || '{}';
      result = JSON.parse(text);

    } else if (isImage) {
      const prompt = `${promptBase}\n\nNome do Arquivo: "${fileName}"\n\nAnalise a imagem em anexo.`;

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

