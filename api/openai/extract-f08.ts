import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

function withTimeout<T>(promise: Promise<T>, ms = 55000): Promise<T> {
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

    const prompt = `Este é um formulário F08 de Requerimento de Licenciamento Ambiental Municipal.
Leia todos os campos preenchidos e retorne EXCLUSIVAMENTE um JSON com a seguinte estrutura, mantendo campos vazios como string vazia "":

{
  "razaoSocial": "campo 01 - Razão Social/Nome",
  "cnpjCpf": "campo 02 - CNPJ/CPF",
  "endereco": "campo 03 - Endereço",
  "bairro": "campo 04 - Bairro",
  "municipioUf": "campo 05 - Município-Distrito/UF",
  "cep": "campo 06 - CEP",
  "telefoneFixo": "campo 07 - Telefone Fixo",
  "telefoneCelular": "campo 08 - Telefone Celular",
  "email": "campo 09 - Email",
  "nomeContato": "campo 10 - Nome para Contato",
  "cargo": "campo 11 - Cargo",
  "tipoEmpreendimento": "campo 12 - Tipo (loteamento, implantação, etc)",
  "enderecoEmpreendimento": "campo 13 - Endereço (Lote, Data, etc.)",
  "bairroEmpreendimento": "campo 14 - Bairro / Gleba",
  "municipioEmpreendimento": "campo 15 - Município / UF",
  "inscricaoImobiliaria": "campo 16 - Inscrição Imobiliária",
  "areaTotal": "campo 17 - Área Total (m²)",
  "areaConstruida": "campo 18 - Área Construída / Loteável (m²)",
  "numeroUnidades": "campo 19 - Número de Unidades",
  "corpoHidrico": "campo 20 - Corpo Hídrico Receptor",
  "baciaHidrografica": "campo 21 - Bacia Hidrográfica",
  "constituintesAmbientais": "campo 22 - Constituintes Ambientais (quais caixas estão marcadas, ex: Nascente, Árvore isolada, etc)",
  "descricaoEmpreendimento": "campo 23 - Descrição Detalhada do Empreendimento/Características Técnicas",
  "nomeResponsavel": "campo 24 - Nome do Responsável Técnico",
  "registro": "campo 25 - Registro CREA/CAU",
  "regiaoUnidade": "campo 26 - Região/Unidade",
  "qualificacao": "campo 27 - Qualificação Profissional",
  "enderecoResp": "campo 28 - Endereço do responsável",
  "bairroResp": "campo 29 - Bairro do responsável",
  "municipioResp": "campo 30 - Município/UF do responsável",
  "cepResp": "campo 31 - CEP do responsável",
  "emailResp": "campo 32 - Email do responsável",
  "telefoneResp": "campo 33 - Telefone do responsável",
  "nomeCompletoAssinante": "campo 34 - Nome completo do assinante",
  "cpfAssinante": "campo 35 - CPF do assinante",
  "localData": "campo 36 - Local e Data"
}

Extraia apenas o texto visível no formulário. Não invente dados. Campos não preenchidos devem ser string vazia.`;

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
    console.error('extract-f08 error:', e);
    return res.status(200).json({ error: e.message || 'Erro ao extrair dados do formulário' });
  }
}
