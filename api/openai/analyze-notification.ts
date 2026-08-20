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
    const { dataUris, projects } = req.body;

    if (!dataUris || !Array.isArray(dataUris) || dataUris.length === 0) {
      return res.status(400).json({ error: 'Faltando dataUris.' });
    }

    const prompt = `Você é um assistente de inteligência artificial de um sistema de licenciamento ambiental.
Sua tarefa é atuar como um Perito Ambiental Sênior. Analise o documento em anexo (pode ser Notificação, Licença, Ofício, etc) e extraia os dados para criar automaticamente um registro no sistema.

Lista de Empreendimentos (Projetos) atuais no sistema (JSON):
${JSON.stringify(projects || [])}

Baseado no documento, identifique a qual empreendimento (projectId) e cliente (clientName) ele pertence.
IMPORTANTE: A regra de ouro para encontrar o empreendimento correto é: busque PRIMEIRO pelo número do Protocolo (e-Protocolo, SEI, etc) ou Número do Processo no documento e compare com o campo "processNumber" da lista (ignorando pontos, traços e barras na comparação). Se o número bater exato, esse é o match perfeito, use o "id" dele. Se NÃO achar o protocolo no documento, compare o Nome Fantasia ("clientName") E o Nome do Loteamento ("name"). NÃO chute e NÃO adivinhe! Se houver múltiplos empreendimentos do mesmo cliente (ex: MRV) e você não tiver certeza de qual é o correto, DEIXE EM BRANCO. É preferível retornar null a errar o projeto.

Retorne EXCLUSIVAMENTE um objeto JSON contendo:
- "category": "Notificação" se for um ofício, exigência, multa, notificação, auto de infração, etc. "Licença" se for uma licença (LP, LI, LO, LAS, Outorga, etc).
- "title": Título curto e descritivo. Ex: "Licença de Operação - IAT", "Ofício 123/2023 - Complementação".
- "description": Resumo do que trata o documento.
- "agency": Órgão emissor do licenciamento ambiental. SEMPRE retorne "SEMA" ou "IAT" (a não ser que seja de prefeitura).
- "issueDate": Data de emissão ou recebimento estampada no documento (AAAA-MM-DD). Ex: data da assinatura. Se não achar, null.
- "validityMonths": Se for Licença, extraia APENAS O NÚMERO do prazo de validade em meses (ex: 72, 48). Se não tiver, null.
- "deadlineDays": Se for Notificação/Ofício, extraia APENAS O NÚMERO do prazo para resposta em dias (ex: 15, 30). Se não tiver, null.
- "explicitDeadline": Se o documento citar uma data final fatal explícita para cumprimento (AAAA-MM-DD). Se não achar, null.
- "severity": "Alta" (multa, prazo curto, indeferimento), "Média" (prazos normais), ou "Baixa" (apenas ciência, licença emitida).
- "extractedProtocol": O número do protocolo EXATO que você leu no documento (ex: "11.222.333-4"). Se não achou protocolo, null.
- "extractedProjectName": O nome do empreendimento EXATO que você leu no documento. Se não achou, null.
- "matchedProjectId": O "id" do projeto da lista que corresponde ao documento, ou null se não tiver certeza absoluta.
- "matchedClientName": O "clientName" do projeto identificado, ou o nome que estiver no documento se não bater.

Lembre-se: retorne APENAS um JSON válido.`;

    // Determine if this is a PDF or an image
    const dataUri = dataUris[0] as string;
    const isPdf = dataUri.startsWith('data:application/pdf');
    const isImage = dataUri.startsWith('data:image/');

    let result: any;

    if (isPdf) {
      const base64 = dataUri.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      
      let pdfText = '';
      try {
        const pdfParseModule = (await import('pdf-parse')) as any;
        const pdfParse = pdfParseModule.default || pdfParseModule;
        const parsed = await pdfParse(buffer);
        pdfText = parsed.text;
      } catch (err) {
        console.warn('Could not parse PDF text:', err);
        pdfText = '(Não foi possível extrair o texto do PDF automaticamente. Baseie-se apenas no nome do arquivo e nos metadados possíveis.)';
      }

      const finalPrompt = `${prompt}\n\nConteúdo extraído do PDF:\n${pdfText.substring(0, 8000)}`;

      const response = await withTimeout(openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: finalPrompt }
          ]
        }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      }));

      const text = (response as any).choices[0]?.message?.content || '{}';
      result = JSON.parse(text);
    } else if (isImage) {
      // For images: use vision API directly
      const imagesContent: any[] = dataUris.map((uri: string) => ({
        type: 'image_url',
        image_url: { url: uri, detail: 'high' }
      }));

      const response = await withTimeout(openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imagesContent
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
    console.error('analyze-notification error:', e);
    return res.status(200).json({ error: e.message || 'Erro ao analisar a notificação com IA' });
  }
}
