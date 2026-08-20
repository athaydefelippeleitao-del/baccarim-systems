/**
 * Utilitários de Manipulação de Arquivos para Baccarim Systems
 */

import { Attachment } from '../types';

/**
 * Faz o download de um arquivo a partir de um objeto Attachment (base64)
 */
export const downloadFile = (file: Attachment) => {
  if (!file.fileData) return;
  
  const link = document.createElement('a');
  link.href = file.fileData;
  link.download = file.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Converte a primeira página de um PDF em uma imagem base64
 */
export const convertPdfToImage = async (file: File): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist');
  const pdfWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  
  // Escala de 2.0 para manter qualidade o suficiente para leitura da IA
  const viewport = page.getViewport({ scale: 2.0 });
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Falha ao criar canvas');
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: ctx,
    viewport: viewport
  } as any).promise;
  
  return canvas.toDataURL('image/jpeg', 0.8);
};

/**
 * Converte múltiplas páginas de um PDF em um array de imagens base64
 * Útil para enviar para a IA ler documentos com mais de 1 página (ex: licenças onde a data está na última página)
 */
export const convertPdfToImages = async (file: File, maxPages: number = 4): Promise<string[]> => {
  const pdfjsLib = await import('pdfjs-dist');
  const pdfWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const numPages = Math.min(pdf.numPages, maxPages);
  const dataUris: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({
      canvasContext: ctx as any,
      viewport: viewport
    } as any).promise;
    
    dataUris.push(canvas.toDataURL('image/jpeg', 0.8));
  }
  
  return dataUris;
};
