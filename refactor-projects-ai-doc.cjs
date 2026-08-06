const fs = require('fs');
const path = 'components/ProjectsView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state variables
const stateVarsTarget = `  const [isExtractingF08, setIsExtractingF08] = useState<string | null>(null); // projectId
  const [f08ExtractError, setF08ExtractError] = useState<string | null>(null);
  const [f08ExtractSuccess, setF08ExtractSuccess] = useState<string | null>(null);`;
const newStateVars = `  const [isExtractingF08, setIsExtractingF08] = useState<string | null>(null); // projectId
  const [f08ExtractError, setF08ExtractError] = useState<string | null>(null);
  const [f08ExtractSuccess, setF08ExtractSuccess] = useState<string | null>(null);
  
  const [isAnalyzingDocAI, setIsAnalyzingDocAI] = useState<string | null>(null);
  const [aiDocExtractError, setAiDocExtractError] = useState<string | null>(null);
  const [aiDocExtractSuccess, setAiDocExtractSuccess] = useState<string | null>(null);`;
content = content.replace(stateVarsTarget, newStateVars);

// 2. Add handleAnalyzeDocumentAI before handleDilacaoPrazo
const handleF08EndTarget = `        setIsExtractingF08(null);
      }
  };

  const handleDilacaoPrazo = (project: Project) => {`;
const newHandler = `        setIsExtractingF08(null);
      }
  };

  const handleAnalyzeDocumentAI = async (project: Project, file: File) => {
    setIsAnalyzingDocAI(project.id);
    setAiDocExtractError(null);
    setAiDocExtractSuccess(null);
    try {
      let base64 = '';
      if (file.type === 'application/pdf') {
        base64 = await convertPdfToImage(file);
      } else {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
          reader.readAsDataURL(file);
        });
      }

      const currentDate = new Date().toLocaleDateString('pt-BR');
      const extracted = await analyzeDocument(base64, project.checklist, currentDate);
      
      if (!extracted.matchedItemId) {
        throw new Error('A IA não conseguiu combinar o documento com nenhum item do checklist atual.');
      }

      const updatedChecklist = project.checklist.map(item => {
        if (item.id === extracted.matchedItemId) {
          const newAttachment: Attachment = { fileName: file.name, fileData: base64, fileDate: currentDate };
          const currentFiles = item.attachedFiles || [];
          const aiComment = \`\${extracted.status ? \`[\${extracted.status}]\` : ''} \${extracted.reason}\`;
          
          return {
            ...item,
            isCompleted: true,
            attachedFiles: [...currentFiles, newAttachment],
            expirationDate: extracted.expirationDate || item.expirationDate,
            aiStatus: extracted.status || item.aiStatus,
            comment: item.comment ? \`\${item.comment}\\n\\n[IA]: \${aiComment}\` : \`[IA]: \${aiComment}\`
          };
        }
        return item;
      });

      onUpdateProject({ ...project, checklist: updatedChecklist });
      setAiDocExtractSuccess(project.id);
      setTimeout(() => setAiDocExtractSuccess(null), 4000);
    } catch (err: any) {
      setAiDocExtractError(err.message || 'Erro ao analisar o documento com a IA.');
      setTimeout(() => setAiDocExtractError(null), 6000);
    } finally {
      setIsAnalyzingDocAI(null);
    }
  };

  const handleDilacaoPrazo = (project: Project) => {`;
content = content.replace(handleF08EndTarget, newHandler);

// 3. Add UI Button
const f08ButtonTarget = `                      {/* F08 AI Extract */}
                      <label
                        htmlFor={\`f08-input-\${project.id}\`}`;
const newButton = `                      {/* AI Document Analysis */}
                      <label
                        htmlFor={\`ai-doc-input-\${project.id}\`}
                        onClick={(e) => e.stopPropagation()}
                        className={\`text-[9px] font-black px-6 py-3 rounded-xl uppercase tracking-widest flex items-center space-x-2 cursor-pointer transition-all border \${
                          isAnalyzingDocAI === project.id
                            ? 'bg-blue-500/10 border-blue-500 text-blue-400 cursor-wait'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500'
                        }\`}
                        title="Anexe um documento e a IA o anexará no item correto do checklist, verificando vencimento"
                      >
                        {isAnalyzingDocAI === project.id ? (
                          <><i className="fas fa-spinner fa-spin"></i><span>Analisando...</span></>
                        ) : (
                          <><i className="fas fa-robot"></i><span>Analisar DOC com IA</span></>
                        )}
                      </label>
                      <input
                        id={\`ai-doc-input-\${project.id}\`}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        disabled={isAnalyzingDocAI === project.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAnalyzeDocumentAI(project, file);
                          e.target.value = '';
                        }}
                      />
                      
                      {/* F08 AI Extract */}
                      <label
                        htmlFor={\`f08-input-\${project.id}\`}`;
content = content.replace(f08ButtonTarget, newButton);

// 4. Add UI Banners for AI Doc Analysis
const bannerTarget = `                    {/* F08 Extraction banners */}
                    {f08ExtractError === project.id && (`;
const newBanner = `                    {/* AI Doc Analysis banners */}
                    {aiDocExtractError === project.id && (
                      <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-xl flex items-center gap-3">
                        <i className="fas fa-circle-exclamation"></i>
                        <span className="text-xs font-bold">{aiDocExtractError}</span>
                      </div>
                    )}
                    {aiDocExtractSuccess === project.id && (
                      <div className="bg-baccarim-green/10 border border-baccarim-green text-baccarim-green px-6 py-4 rounded-xl flex items-center gap-3">
                        <i className="fas fa-circle-check"></i>
                        <span className="text-xs font-bold">Documento analisado, validado e anexado com sucesso!</span>
                      </div>
                    )}

                    {/* F08 Extraction banners */}
                    {f08ExtractError === project.id && (`;
content = content.replace(bannerTarget, newBanner);

// 5. Update Checklist Rendering to show expirationDate and aiStatus
const checklistLabelTarget = `<span className={\`text-[11px] font-bold leading-tight \${item.isCompleted ? 'text-emerald-400 opacity-60' : 'text-slate-300'}\`}>{item.label}</span>`;
const newChecklistLabel = `<div className="flex flex-col">
                                      <span className={\`text-[11px] font-bold leading-tight \${item.isCompleted ? 'text-emerald-400 opacity-60' : 'text-slate-300'}\`}>{item.label}</span>
                                      {item.expirationDate && (
                                        <div className="flex items-center space-x-2 mt-1">
                                          <span className="text-[9px] font-black uppercase text-baccarim-text-muted">
                                            Validade: <span className="text-baccarim-text">{item.expirationDate}</span>
                                          </span>
                                          {item.aiStatus === 'Aprovado' && (
                                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-widest border border-emerald-500/30">
                                              Aprovado
                                            </span>
                                          )}
                                          {item.aiStatus === 'Vencido' && (
                                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase tracking-widest border border-red-500/30">
                                              Vencido
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>`;
content = content.replace(checklistLabelTarget, newChecklistLabel);

fs.writeFileSync(path, content);
console.log('Done refactoring ProjectsView');
