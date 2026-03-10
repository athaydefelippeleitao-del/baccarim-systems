import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Project, Attachment, EnvironmentalLicense, Notification, Contract, PhotoReport } from '../types';

/**
 * Utilitário para exportar dados e arquivos em um único ZIP
 */
export const exportAllDataAsZip = async (data: {
  projects: Project[];
  licenses: EnvironmentalLicense[];
  notifications: Notification[];
  contracts: Contract[];
  reports: PhotoReport[];
  checklistTemplates: any;
}) => {
  const zip = new JSZip();
  
  // 1. Adicionar o banco de dados JSON
  const dbJson = JSON.stringify(data, null, 2);
  zip.file("database_backup.json", dbJson);
  
  // 2. Criar pastas para anexos
  const attachmentsFolder = zip.folder("anexos");
  const reportsFolder = zip.folder("relatorios_fotograficos");
  
  // Função auxiliar para adicionar arquivos base64 ao zip
  const addBase64ToZip = (folder: JSZip | null, attachment: Attachment, subfolderName?: string) => {
    if (!attachment.fileData || !folder) return;
    
    // Extrair apenas os dados base64 (remover o prefixo data:...)
    const base64Content = attachment.fileData.split(',')[1];
    if (!base64Content) return;
    
    const targetFolder = subfolderName ? folder.folder(subfolderName) : folder;
    targetFolder?.file(attachment.fileName, base64Content, { base64: true });
  };

  // Processar Projetos e seus checklists
  data.projects.forEach(project => {
    const projectSlug = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const projectFolder = attachmentsFolder?.folder(projectSlug) || null;
    
    project.checklist.forEach(item => {
      if (item.attachedFiles && item.attachedFiles.length > 0) {
        const itemSlug = item.label.slice(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        item.attachedFiles.forEach(file => {
          addBase64ToZip(projectFolder, file, itemSlug);
        });
      }
    });
  });

  // Processar Notificações
  data.notifications.forEach(notif => {
    if (notif.attachedFiles && notif.attachedFiles.length > 0) {
      const notifSlug = notif.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      notif.attachedFiles.forEach(file => {
        addBase64ToZip(attachmentsFolder, file, `notificacoes/${notifSlug}`);
      });
    }
  });

  // Processar Relatórios Fotográficos
  data.reports.forEach(report => {
    const reportSlug = `${report.clientName}_${report.date}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const reportFolder = reportsFolder?.folder(reportSlug);
    
    report.photos.forEach((photo, idx) => {
      if (photo.url && photo.url.startsWith('data:')) {
        const base64Content = photo.url.split(',')[1];
        const ext = photo.url.split(';')[0].split('/')[1] || 'jpg';
        reportFolder?.file(`foto_${idx + 1}.${ext}`, base64Content, { base64: true });
      }
    });
  });

  // 3. Gerar e baixar o ZIP
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `baccarim_export_completo_${new Date().toISOString().split('T')[0]}.zip`);
};

/**
 * Exporta todos os documentos de um projeto específico
 */
export const exportProjectDocumentsAsZip = async (project: Project) => {
  const zip = new JSZip();
  const projectSlug = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  project.checklist.forEach(item => {
    if (item.attachedFiles && item.attachedFiles.length > 0) {
      const itemSlug = item.label.slice(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const itemFolder = zip.folder(itemSlug);
      
      item.attachedFiles.forEach(file => {
        const base64Content = file.fileData.split(',')[1];
        if (base64Content) {
          itemFolder?.file(file.fileName, base64Content, { base64: true });
        }
      });
    }
  });

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `documentos_${projectSlug}.zip`);
};
