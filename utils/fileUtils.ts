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
