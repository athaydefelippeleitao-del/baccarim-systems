import React, { useState } from 'react';
import { Project } from '../types';
import { generateAIDocument } from '../services/openaiClient';

interface AIDocumentsViewProps {
  projects: Project[];
}

const AIDocumentsView: React.FC<AIDocumentsViewProps> = ({ projects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('RAP');
  const [extraContext, setExtraContext] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const documentTypes = ['RAP', 'Relatório Fotográfico', 'Dilação de Prazo', 'Outro'];

  const handleGenerate = async () => {
    if (!selectedProjectId) {
      setError('Por favor, selecione um projeto.');
      return;
    }
    setError(null);
    setIsGenerating(true);
    setGeneratedDocument('');

    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) {
      setError('Projeto não encontrado.');
      setIsGenerating(false);
      return;
    }

    const projectContext = `
Nome: ${project.name}
Cliente: ${project.clientName}
Fase Atual: ${project.currentPhase}
Progresso: ${project.progress}%
Endereço: ${project.specs?.projectAddress || 'Não informado'}
Município: ${project.specs?.projectCity || 'Não informado'}
Área Total: ${project.specs?.areaTotal || 'Não informada'}
    `.trim();

    try {
      const result = await generateAIDocument(documentType, projectContext, extraContext);
      setGeneratedDocument(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao gerar documento. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedDocument);
    alert('Documento copiado para a área de transferência!');
  };

  const downloadTextFile = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedDocument], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${documentType.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  return (
    <div className="flex flex-col h-full bg-baccarim-dark p-4 md:p-8 overflow-y-auto animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-baccarim-text uppercase tracking-widest flex items-center">
            <i className="fas fa-robot text-baccarim-blue mr-4"></i>
            Documentos IA
          </h2>
          <p className="text-baccarim-text-muted mt-2 font-medium">Geração de documentos técnicos utilizando Inteligência Artificial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Configuração */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-baccarim-card rounded-3xl p-6 border border-baccarim-border shadow-xl">
            <h3 className="text-lg font-bold text-baccarim-text mb-4 border-b border-baccarim-border pb-2">Configuração do Documento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-baccarim-text-muted uppercase tracking-widest mb-2">Projeto Referência</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-baccarim-dark border border-baccarim-border text-baccarim-text rounded-xl p-3 focus:outline-none focus:border-baccarim-blue transition-colors"
                >
                  <option value="">Selecione um projeto...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.clientName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-baccarim-text-muted uppercase tracking-widest mb-2">Tipo de Documento</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full bg-baccarim-dark border border-baccarim-border text-baccarim-text rounded-xl p-3 focus:outline-none focus:border-baccarim-blue transition-colors"
                >
                  {documentTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-baccarim-text-muted uppercase tracking-widest mb-2">Instruções Adicionais (Contexto)</label>
                <textarea
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="Ex: Incluir informações sobre a última vistoria realizada no dia 10/10..."
                  className="w-full bg-baccarim-dark border border-baccarim-border text-baccarim-text rounded-xl p-3 focus:outline-none focus:border-baccarim-blue transition-colors min-h-[120px] resize-y"
                />
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-xl text-sm">
                  <i className="fas fa-exclamation-triangle mr-2"></i> {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-baccarim-blue text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-baccarim-blue/20 hover:bg-blue-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles"></i>
                    <span>Gerar Documento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Área de Visualização */}
        <div className="lg:col-span-2">
          <div className="bg-baccarim-card rounded-3xl p-6 border border-baccarim-border shadow-xl h-full flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center border-b border-baccarim-border pb-4 mb-4">
              <h3 className="text-lg font-bold text-baccarim-text">Documento Gerado</h3>
              
              {generatedDocument && (
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-baccarim-hover text-baccarim-text rounded-lg text-xs font-bold hover:bg-baccarim-active transition-colors flex items-center"
                  >
                    <i className="fas fa-copy mr-2"></i> Copiar
                  </button>
                  <button
                    onClick={downloadTextFile}
                    className="px-4 py-2 bg-baccarim-green text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center"
                  >
                    <i className="fas fa-download mr-2"></i> Salvar (.md)
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 bg-baccarim-dark rounded-xl border border-baccarim-border p-4 overflow-y-auto">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-baccarim-text-muted space-y-4">
                  <div className="w-16 h-16 border-4 border-baccarim-blue border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-medium animate-pulse">A IA está escrevendo o documento...</p>
                </div>
              ) : generatedDocument ? (
                <pre className="text-baccarim-text font-sans whitespace-pre-wrap text-sm leading-relaxed">
                  {generatedDocument}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-baccarim-text-muted opacity-50">
                  <i className="fas fa-file-signature text-6xl mb-4"></i>
                  <p>Preencha as opções ao lado e clique em "Gerar Documento".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDocumentsView;
