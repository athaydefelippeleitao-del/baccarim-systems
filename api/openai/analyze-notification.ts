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
IMPORTANTE: A forma mais garantida de encontrar o empreendimento correto é comparando o Número do Processo/Protocolo ("processNumber"), CNPJ ("cnpj") ou Razão Social ("razaoSocial") presentes no documento com a lista acima. Se houver correspondência do número do processo, use-o imediatamente. Caso não ache pelo processo, seja flexível na busca pelo nome. Se houver qualquer semelhança razoável que indique ser o mesmo empreendimento, preencha o "matchedProjectId" correspondente.

Retorne EXCLUSIVAMENTE um objeto JSON contendo:
- "category": "Notificação" se for um ofício, exigência, multa, notificação, auto de infração, etc. "Licença" se for uma licença (LP, LI, LO, LAS, Outorga, etc).
- "title": Título curto e descritivo. Ex: "Licença de Operação - IAT", "Ofício 123/2023 - Complementação".
- "description": Resumo do que trata o documento.
- "agency": Órgão emissor do licenciamento ambiental. SEMPRE retorne "SEMA" ou "IAT". Se no documento aparecer "Secretaria de Estado do Meio Ambiente", "SEMA/PR" ou similar, retorne "SEMA". Se aparecer "Instituto Água e Terra" ou "IAT" ou "ICMBIO" (estadual), retorne "IAT". Em QUALQUER outro caso (prefeitura, IBAMA federal, etc.) ainda assim retorne "SEMA" ou "IAT" conforme o contexto do licenciamento estadual do Paraná.
- "deadline": Prazo Fatal no formato AAAA-MM-DD. Se for licença, 5 meses antes da validade final. Se não achar, null.
- "severity": "Alta" (multa, prazo curto, indeferimento), "Média" (prazos normais), ou "Baixa" (apenas ciência, licença emitida).
- "matchedProjectId": O "id" do projeto que melhor corresponde ao documento, ou null.
- "matchedClientName": O "clientName" do projeto identificado, ou o nome que estiver no documento.

Lembre-se: retorne APENAS um JSON válido.`;

    // Determine if this is a PDF or an image
    const dataUri = dataUris[0] as string;
    const isPdf = dataUri.startsWith('data:application/pdf');
    const isImage = dataUri.startsWith('data:image/');

    let result: any;

    if (isPdf) {
      // For PDFs: upload to OpenAI Files API, then use as file input
      const base64 = dataUri.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');

      // Create a File-like object for the OpenAI SDK
      const file = new File([buffer], 'documento.pdf', { type: 'application/pdf' });

      // Upload file to OpenAI
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
        // Clean up the uploaded file
        await openai.files.delete(uploadedFile.id).catch(() => {});
      }
    } else if (isImage) {
      // For images: use vision API directly
      const imagesContent = dataUris.map((uri: string) => ({
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
