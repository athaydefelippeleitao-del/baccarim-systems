const fs = require('fs');
const path = 'components/NotificationsView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
const importTarget = `import { generateNotificationDraft } from '../services/openaiClient';`;
if (!content.includes(importTarget)) throw new Error('importTarget not found');
content = content.replace(importTarget, `import { generateNotificationDraft, analyzeNotificationDocument } from '../services/openaiClient';\nimport { convertPdfToImage } from '../utils/fileUtils';`);

// 2. Add state
const stateTarget = `  const [loadingFilesId, setLoadingFilesId] = useState<string | null>(null);`;
if (!content.includes(stateTarget)) throw new Error('stateTarget not found');
content = content.replace(stateTarget, `${stateTarget}\n  const [isAnalyzingNotifAI, setIsAnalyzingNotifAI] = useState<boolean>(false);\n  const [aiNotifError, setAiNotifError] = useState<string | null>(null);\n  const [aiNotifSuccess, setAiNotifSuccess] = useState<boolean>(false);\n  const aiInputRef = React.useRef<HTMLInputElement>(null);`);

// 3. Add handler
const handlerTarget = `  const handleEditClick = (notif: Notification) => {`;
if (!content.includes(handlerTarget)) throw new Error('handlerTarget not found');
const newHandler = `  const handleCreateNotificationFromAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingNotifAI(true);
    setAiNotifError(null);
    setAiNotifSuccess(false);

    try {
      let base64 = '';
      if (file.type === 'application/pdf') {
        base64 = await convertPdfToImage(file);
      } else {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Falha ao ler arquivo.'));
          reader.readAsDataURL(file);
        });
      }

      const simplifiedProjects = projects.map(p => ({ id: p.id, name: p.name, clientName: p.clientName }));
      const result = await analyzeNotificationDocument(base64, simplifiedProjects);

      let formattedDeadline = '';
      if (result.deadline) {
        const parts = result.deadline.split('-');
        if (parts.length === 3) formattedDeadline = \`\${parts[2]}/\${parts[1]}/\${parts[0]}\`;
      } else {
        formattedDeadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
      }

      const dateStr = new Date().toLocaleDateString('pt-BR');
      const newAttachment: Attachment = { fileName: file.name, fileData: base64, fileDate: dateStr };

      const newNotif: Notification = {
        id: \`n-\${Date.now()}\`,
        title: result.title || 'Documento analisado por IA',
        clientName: result.matchedClientName || clients[0] || 'Desconhecido',
        projectId: result.matchedProjectId || '',
        agency: result.agency || 'SEMA',
        severity: result.severity || 'Média',
        category: result.category || 'Notificação',
        deadline: formattedDeadline,
        description: result.description || 'Extraído automaticamente.',
        dateReceived: dateStr,
        status: 'Open',
        attachedFiles: [newAttachment]
      };

      onAddNotification(newNotif);
      setAiNotifSuccess(true);
      setTimeout(() => setAiNotifSuccess(false), 4000);
    } catch (err: any) {
      setAiNotifError(err.message || 'Erro ao criar notificação com IA.');
      setTimeout(() => setAiNotifError(null), 6000);
    } finally {
      setIsAnalyzingNotifAI(false);
      if (aiInputRef.current) aiInputRef.current.value = '';
    }
  };

  const handleEditClick = (notif: Notification) => {`;
content = content.replace(handlerTarget, newHandler);

// 4. Add UI Button
const btnTarget = `<button
            onClick={() => setShowAddModal(true)}
            className="px-8 py-3.5 bg-baccarim-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-baccarim-green/20 hover:-translate-y-1 transition-all"
          >
            <i className="fas fa-plus mr-2"></i> Nova Notificação
          </button>`;
if (!content.includes(btnTarget)) throw new Error('btnTarget not found');
const newBtn = `<div className="flex space-x-2">
            <button
              onClick={() => aiInputRef.current?.click()}
              disabled={isAnalyzingNotifAI}
              className={\`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center \${
                isAnalyzingNotifAI
                  ? 'bg-blue-500/20 text-blue-400 cursor-wait shadow-none'
                  : 'bg-blue-500 text-white shadow-blue-500/20 hover:-translate-y-1'
              }\`}
              title="A IA criará a notificação/licença automaticamente lendo o documento anexo"
            >
              {isAnalyzingNotifAI ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i> Analisando...</>
              ) : (
                <><i className="fas fa-robot mr-2"></i> Criar com IA</>
              )}
            </button>
            <input
              ref={aiInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleCreateNotificationFromAI}
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3.5 bg-baccarim-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-baccarim-green/20 hover:-translate-y-1 transition-all"
            >
              <i className="fas fa-plus mr-2"></i> Nova
            </button>
          </div>`;
content = content.replace(btnTarget, newBtn);

// 5. Add Banner
const headerEndTarget = `</header>`;
if (!content.includes(headerEndTarget)) throw new Error('headerEndTarget not found');
const banner = `
      {aiNotifError && (
        <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-xl flex items-center gap-3">
          <i className="fas fa-circle-exclamation"></i>
          <span className="text-sm font-bold">{aiNotifError}</span>
        </div>
      )}
      {aiNotifSuccess && (
        <div className="mb-6 bg-baccarim-green/10 border border-baccarim-green text-baccarim-green px-6 py-4 rounded-xl flex items-center gap-3">
          <i className="fas fa-circle-check"></i>
          <span className="text-sm font-bold">Documento analisado e registro criado com sucesso!</span>
        </div>
      )}
</header>`;
content = content.replace(headerEndTarget, banner);

fs.writeFileSync(path, content);
console.log('Success');
