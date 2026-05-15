import React, { useRef, useState } from 'react';
import { Project, AppConfig } from '../types';

interface ProjectRapReportViewProps {
  project: Project;
  appConfig?: AppConfig;
  onClose: () => void;
}

const ProjectRapReportView: React.FC<ProjectRapReportViewProps> = ({ project, appConfig, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Editable fields
  const [empreendedorNome, setEmpreendedorNome] = useState(
    project.specs?.responsavelLegal || project.specs?.razaoSocial || ''
  );
  const [mesElaboracao, setMesElaboracao] = useState('Maio');
  const [anoElaboracao, setAnoElaboracao] = useState(new Date().getFullYear().toString());
  const [localAno, setLocalAno] = useState('Londrina/PR\n' + new Date().getFullYear());
  const [contratanteEndereco, setContratanteEndereco] = useState(
    project.specs?.applicantAddress
      ? `${project.specs.applicantAddress}${project.specs.applicantBairro ? ', ' + project.specs.applicantBairro : ''}${project.specs.applicantCity ? ' – ' + project.specs.applicantCity : ''}`
      : ''
  );
  const [respTecnico, setRespTecnico] = useState(project.specs?.responsavelTecnico || 'Alberto Baccarim Junior');
  const [equipeApoio, setEquipeApoio] = useState('Giovana Pires de Almeida\nEngenheira Ambiental e Sanitária\nCREA – PR – 185635/D');
  const [embasamento, setEmbasamento] = useState('Instrução Normativa nº 21, de 25 de Abril de 2025');

  const cidade = 'Londrina/PR';
  const ano = anoElaboracao;

  const handleGeneratePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    const opt = {
      margin: 0,
      filename: `RAP_${project.name.replace(/ /g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      // @ts-ignore
      await html2pdf().set(opt).from(reportRef.current).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const inputCls = "w-full bg-baccarim-dark border border-baccarim-border rounded-xl px-3 py-2 text-sm text-baccarim-text focus:outline-none focus:border-baccarim-blue transition-all";
  const textareaCls = "w-full bg-baccarim-dark border border-baccarim-border rounded-xl px-3 py-2 text-sm text-baccarim-text focus:outline-none focus:border-baccarim-blue transition-all resize-y min-h-[60px]";
  const labelCls = "block text-[10px] font-bold text-baccarim-text-muted uppercase tracking-widest mb-1";

  // Page style
  const pageStyle: React.CSSProperties = {
    width: '210mm',
    minHeight: '297mm',
    backgroundColor: 'white',
    position: 'relative',
    pageBreakAfter: 'always',
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#000',
  };

  const footerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '10mm',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: '7pt',
    color: '#1a3a6b',
    fontWeight: 'bold',
    padding: '0 15mm',
    borderTop: '2px solid #1a3a6b',
    paddingTop: '4px',
  };

  const Logo = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img src="/logo_baccarim.jpg" alt="Baccarim" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
      <div>
        <div style={{ fontSize: '22pt', fontWeight: '900', color: '#1a3a6b', lineHeight: 1.1 }}>
          Baccarim<br />Engenharia de<br />Loteamentos
        </div>
      </div>
    </div>
  );

  const SmallLogo = () => (
    <img src="/logo_baccarim.jpg" alt="Baccarim" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
  );

  const Footer = ({ pageNum }: { pageNum: number }) => (
    <div style={footerStyle}>
      BACCARIM ENGENHARIA URBANA LTDA<br />
      Avenida Dom Pedro II, 33 – Sala 02, Centro / Ibiporã – PR<br />
      Contato: (43) 3268-0918 / alberto@baccarimengenharia.com.br
      <span style={{ position: 'absolute', right: '15mm', bottom: '2px', fontSize: '8pt' }}>{pageNum}</span>
    </div>
  );

  const sumarioItems = [
    { num: '1.', title: 'IDENTIFICAÇÃO DO EMPREENDEDOR', page: 6 },
    { num: '1.1.', title: 'IDENTIFICAÇÃO DO EMPREENDIMENTO', page: 6 },
    { num: '2.', title: 'IDENTIFICAÇÃO DA EMPRESA E RESPONSÁVEL PELA ELABORAÇÃO DO RAP', page: 6 },
    { num: '3.', title: 'APRESENTAÇÃO', page: 7 },
    { num: '4.', title: 'IDENTIFICAÇÃO, MODALIDADE E LOCALIZAÇÃO DO EMPREENDIMENTO', page: 8 },
    { num: '4.1.', title: 'IDENTIFICAÇÃO E MODALIDADE DO EMPREENDIMENTO', page: 8 },
    { num: '4.2.', title: 'LOCALIZAÇÃO DO EMPREENDIMENTO', page: 8 },
    { num: '5.', title: 'RELATÓRIO FOTOGRÁFICO', page: 10 },
    { num: '6.', title: 'PLANTAS, LAUDOS, PROJETOS E ESTUDOS ESPECÍFICOS', page: 11 },
    { num: '6.1.', title: 'PLANTA ILUSTRATIVA', page: 11 },
    { num: '6.2.', title: 'PLANTA PLANIALTIMÉTRICA', page: 11 },
    { num: '6.3.', title: 'LAUDO GEOLÓGICO-GEOTÉCNICO', page: 11 },
    { num: '6.4.', title: 'LAUDO FLORESTAL', page: 12 },
    { num: '7.', title: 'DIAGNÓSTICO AMBIENTAL', page: 12 },
    { num: '7.1.', title: 'DIAGNÓSTICO DO MEIO FÍSICO', page: 12 },
    { num: '7.1.1.', title: 'CLIMA', page: 12 },
    { num: '7.1.2.', title: 'HIDROGRAFIA', page: 16 },
    { num: '7.1.3.', title: 'SOLO E RELEVO', page: 19 },
    { num: '8.', title: 'DIAGNÓSTICO DO MEIO BIÓTICO', page: 20 },
    { num: '8.1.', title: 'CARACTERIZAÇÃO DA FAUNA', page: 20 },
    { num: '8.2.', title: 'CARACTERIZAÇÃO DA FLORA', page: 21 },
    { num: '9.', title: 'DIAGNÓSTICO DO MEIO SOCIOECONÔMICO', page: 23 },
    { num: '10.', title: 'IDENTIFICAÇÃO E ANÁLISE DOS IMPACTOS AMBIENTAIS', page: 24 },
    { num: '11.', title: 'METODOLOGIA EMPREGADA PARA A ANÁLISE E IDENTIFICAÇÃO DOS IMPACTOS AMBIENTAIS', page: 26 },
    { num: '12.', title: 'IDENTIFICAÇÃO E AVALIAÇÃO DOS IMPACTOS DURANTE A FASE DE INSTALAÇÃO DO EMPREENDIMENTO', page: 29 },
    { num: '12.1.', title: 'INTERFERÊNCIAS E TRANSTORNOS À POPULAÇÃO: EMISSÕES ATMOSFÉRICAS, RUÍDOS E TRÁFEGO DE MÁQUINAS', page: 29 },
    { num: '12.2.', title: 'EMISSÃO DE POEIRA E POLUENTES ATMOSFÉRICO', page: 30 },
    { num: '12.3.', title: 'TRÁFEGO DE MÁQUINAS', page: 31 },
    { num: '12.4.', title: 'IMPACTOS RESULTANTES DE OBRAS DE TERRAPLENAGEM', page: 31 },
    { num: '12.5.', title: 'IMPACTOS DECORRENTES DA IMPERMEABILIZAÇÃO DO SOLO', page: 32 },
    { num: '12.6.', title: 'PROTEÇÃO AO PATRIMÔNIO HISTÓRICO E PAISAGÍSTICO', page: 33 },
    { num: '13.', title: 'IDENTIFICAÇÃO E AVALIAÇÃO DOS IMPACTOS DURANTE A FASE DE OCUPAÇÃO DO EMPREENDIMENTO', page: 33 },
    { num: '13.1.', title: 'MITIGAÇÃO DOS IMPACTOS REFERENTES AO INCREMENTO DE POPULAÇÃO', page: 33 },
    { num: '13.2.', title: 'ESTIMATIVA DO AUMENTO DA DEMANDA POR SERVIÇOS PÚBLICOS DE EDUCAÇÃO, SAÚDE, SEGURANÇA E TRANSPORTE COLETIVO', page: 34 },
    { num: '13.3.', title: 'TRATAMENTO E AVALIAÇÃO DOS IMPACTOS DE LANÇAMENTO DE EFLUENTES SANITÁRIOS', page: 35 },
    { num: '13.4.', title: 'COLETA E DESTINO FINAL DE RESÍDUOS SÓLIDOS URBANOS', page: 35 },
    { num: '13.5.', title: 'ARBORIZAÇÃO DO SISTEMA VIÁRIO E ESPAÇOS PÚBLICOS', page: 36 },
    { num: '13.6.', title: 'RECUPERAÇÃO E REVEGETAÇÃO DAS ÁREAS DEGRADADAS E COMPROMETIDAS COM A NECESSIDADE DE PRESERVAÇÃO', page: 37 },
    { num: '14.', title: 'QUADRO DE MEDIDAS MITIGADORAS E COMPENSATÓRIAS', page: 38 },
    { num: '15.', title: 'LEGISLAÇÃO APLICÁVEL', page: 40 },
    { num: '16.', title: 'CONCLUSÕES', page: 40 },
    { num: '17.', title: 'REFERÊNCIAS BIBLIOGRÁFICAS', page: 41 },
    { num: '18.', title: 'RESPONSÁVEIS', page: 43 },
    { num: '19.', title: 'ANEXOS', page: 44 },
  ];

  const figuras = [
    { num: 1, title: 'Mapa de localização do Município de Londrina, Paraná. Fonte: Ambiente construído e o deslocamento a pé: Uma análise comparativa em Londrina – PR (Murilo Doro Maidana, Larissa Casaril da Fontoura e Milena Kanashiro). 2021.', page: 8 },
    { num: 2, title: 'Planta de localização do empreendimento. Fonte: Google Earth.', page: 9 },
    { num: 3, title: 'Gráfico do balanço pluviométrico do município (CLIMATE.DATA.ORG, 2020).', page: 13 },
    { num: 4, title: 'Temperatura média do ar anual no Estado do Paraná. Fonte: Instituto Agronômico do Paraná - IAPAR (1999).', page: 14 },
    { num: 5, title: 'Precipitação anual no Estado do Paraná. Fonte: Instituto Agronômico do Paraná - IAPAR (1999).', page: 15 },
    { num: 6, title: 'Unidades Hidrográficas do Paraná (Unidade Hidrográfica do Baixo do Tibagi). Fonte: INSTITUTO DAS ÁGUAS DO PARANÁ, 2007.', page: 16 },
    { num: 7, title: 'Unidades Hidrográficas do Paraná (Unidade Hidrográfica do Baixo do Tibagi).', page: 17 },
    { num: 8, title: 'Localização do empreendimento e corpos d\'água mais próximos. Fonte: Portal Ambiental da Prefeitura de Londrina – SIGLON.', page: 18 },
    { num: 9, title: 'Mapa de Solos do Estado do Paraná. Fonte: (BHERING, et al., 2007).', page: 19 },
    { num: 10, title: 'Mapa de vegetação do estado brasileiro do Paraná. Fonte: (IPARDES, 2007).', page: 21 },
  ];

  return (
    <div className="fixed inset-0 bg-baccarim-dark/95 backdrop-blur-xl z-[250] flex flex-col md:flex-row items-start justify-center overflow-y-auto p-4 md:p-10 animate-in fade-in duration-300 gap-8">

      {/* Settings Panel */}
      <div className="w-full md:w-80 bg-baccarim-card rounded-[2rem] p-6 shadow-2xl border border-baccarim-border shrink-0 sticky top-10 print:hidden flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-baccarim-text uppercase tracking-widest">Editor RAP</h3>
          <button onClick={onClose} className="w-8 h-8 bg-baccarim-hover text-baccarim-text-muted rounded-full flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelCls}>Empreendedor (Capa)</label>
            <input value={empreendedorNome} onChange={e => setEmpreendedorNome(e.target.value)} className={inputCls} placeholder="Nome do Empreendedor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Mês Elaboração</label>
              <input value={mesElaboracao} onChange={e => setMesElaboracao(e.target.value)} className={inputCls} placeholder="Maio" />
            </div>
            <div>
              <label className={labelCls}>Ano</label>
              <input value={anoElaboracao} onChange={e => setAnoElaboracao(e.target.value)} className={inputCls} placeholder="2025" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Endereço Contratante</label>
            <textarea value={contratanteEndereco} onChange={e => setContratanteEndereco(e.target.value)} className={textareaCls} placeholder="Rua..., nº..." />
          </div>
          <div>
            <label className={labelCls}>Responsável Técnico RAP</label>
            <input value={respTecnico} onChange={e => setRespTecnico(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Equipe de Apoio</label>
            <textarea value={equipeApoio} onChange={e => setEquipeApoio(e.target.value)} className={textareaCls} />
          </div>
          <div>
            <label className={labelCls}>Embasamento Técnico</label>
            <textarea value={embasamento} onChange={e => setEmbasamento(e.target.value)} className={textareaCls} />
          </div>

          <div className="w-full h-px bg-baccarim-border"></div>

          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="w-full py-4 bg-baccarim-blue text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center space-x-2 hover:bg-baccarim-green transition-all disabled:opacity-50"
          >
            {isGenerating ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-file-pdf"></i>}
            <span>{isGenerating ? 'Gerando...' : 'Gerar PDF'}</span>
          </button>
        </div>
      </div>

      {/* A4 Document Preview */}
      <div ref={reportRef} className="shrink-0" style={{ width: '210mm' }}>

        {/* PAGE 1 - CAPA */}
        <div style={{ ...pageStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '20mm 20mm 25mm 20mm' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
            <SmallLogo />
          </div>

          <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            <Logo />
            <div style={{ fontSize: '13pt', fontWeight: '700', color: '#1a3a6b', letterSpacing: '0.05em', marginTop: '8px' }}>
              RELATÓRIO AMBIENTAL PRELIMINAR - RAP
            </div>
            <div style={{ marginTop: '32px' }}>
              <div style={{ fontSize: '14pt', fontWeight: '900', color: '#1a3a6b', textAlign: 'center', letterSpacing: '0.02em' }}>
                {empreendedorNome.toUpperCase()}
              </div>
            </div>
            <div style={{ marginTop: '48px', textAlign: 'center', fontSize: '12pt', fontWeight: '700', color: '#1a3a6b' }}>
              {cidade}<br />{anoElaboracao}
            </div>
          </div>

          <Footer pageNum={1} />
        </div>

        {/* PAGE 2 - FOLHA DE ROSTO */}
        <div style={{ ...pageStyle, padding: '15mm 20mm 25mm 20mm' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '10mm' }}>
            <SmallLogo />
          </div>

          <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '11pt', color: '#1a3a6b', marginBottom: '8mm', letterSpacing: '0.1em', textDecoration: 'underline' }}>
            RELATÓRIO AMBIENTAL PRELIMINAR – RAP
          </div>

          {/* Contratante / Contratada */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8mm', marginBottom: '8mm' }}>
            <div>
              <div style={{ fontSize: '10pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '4px', textDecoration: 'underline' }}>Contratante</div>
              <div style={{ fontSize: '10pt', color: '#000' }}>{contratanteEndereco}</div>
            </div>
            <div>
              <div style={{ fontSize: '10pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '4px', textDecoration: 'underline' }}>Contratada</div>
            </div>
          </div>

          {/* Logo grande centro */}
          <div style={{ textAlign: 'center', marginBottom: '6mm' }}>
            <Logo />
          </div>
          <div style={{ textAlign: 'right', fontSize: '10pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '8mm' }}>
            Avenida Dom Pedro II, nº 33, Centro,<br />Sala 02 – Ibiporã/PR
          </div>

          {/* Elaboração + Embasamento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6mm', border: '1px solid #1a3a6b', marginBottom: '4mm' }}>
            <div style={{ padding: '6mm', borderRight: '1px solid #1a3a6b' }}>
              <div style={{ fontSize: '10pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '4px' }}>ELABORAÇÃO</div>
              <div style={{ fontSize: '10pt', fontWeight: '700', color: '#1a3a6b' }}>{mesElaboracao}/{anoElaboracao}</div>
              <div style={{ fontSize: '8pt', marginTop: '8px', color: '#000' }}>
                Todos os direitos são reservados à Baccarim Engenharia Urbana LTDA
              </div>
            </div>
            <div style={{ padding: '6mm' }}>
              <div style={{ fontSize: '10pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '4px' }}>EMBASAMENTO TÉCNICO</div>
              <div style={{ fontSize: '9pt', color: '#000' }}>{embasamento}</div>
            </div>
          </div>

          {/* Responsável técnico */}
          <div style={{ border: '1px solid #1a3a6b', padding: '6mm', textAlign: 'center', marginBottom: '4mm' }}>
            <div style={{ fontSize: '10pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '4px' }}>RESPONSÁVEL TÉCNICO DO RAP</div>
            {respTecnico.split('\n').map((line, i) => (
              <div key={i} style={{ fontSize: '10pt', fontWeight: '700', color: '#1a3a6b' }}>{line}</div>
            ))}
            <div style={{ fontSize: '10pt', fontWeight: '700', color: '#1a3a6b' }}>Engenheiro Civil</div>
            <div style={{ fontSize: '10pt', fontWeight: '700', color: '#1a3a6b' }}>CREA – PR – 142.811/D</div>
          </div>

          {/* Equipe de apoio */}
          <div style={{ padding: '4mm 6mm' }}>
            <div style={{ fontSize: '10pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '4px' }}>Equipe de apoio:</div>
            {equipeApoio.split('\n').map((line, i) => (
              <div key={i} style={{ fontSize: '9pt', color: '#1a3a6b' }}>{line}</div>
            ))}
          </div>

          <Footer pageNum={2} />
        </div>

        {/* PAGE 3 - SUMÁRIO (parte 1) */}
        <div style={{ ...pageStyle, padding: '15mm 20mm 25mm 20mm' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '6mm' }}>
            <SmallLogo />
          </div>
          <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '13pt', color: '#1a3a6b', marginBottom: '8mm', letterSpacing: '0.15em' }}>SUMÁRIO</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
            <tbody>
              {sumarioItems.slice(0, 29).map((item, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: item.num.split('.').length > 2 ? '8mm' : item.num.includes('.') && item.num !== item.num.replace('.', '') ? '4mm' : '0', paddingBottom: '3px', color: '#1a3a6b', fontWeight: item.num.split('.').length <= 2 ? '700' : '400', width: '15%' }}>{item.num}</td>
                  <td style={{ paddingBottom: '3px', color: '#1a3a6b', fontWeight: item.num.split('.').length <= 2 ? '700' : '400' }}>
                    <span style={{ textDecoration: 'underline', cursor: 'default' }}>{item.title}</span>
                    <span style={{ float: 'right', fontWeight: '400' }}>.......{item.page}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Footer pageNum={3} />
        </div>

        {/* PAGE 4 - SUMÁRIO (parte 2) */}
        <div style={{ ...pageStyle, padding: '15mm 20mm 25mm 20mm' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '6mm' }}>
            <SmallLogo />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
            <tbody>
              {sumarioItems.slice(29).map((item, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: item.num.split('.').length > 2 ? '8mm' : item.num.includes('.') ? '4mm' : '0', paddingBottom: '3px', color: '#1a3a6b', fontWeight: item.num.split('.').length <= 2 ? '700' : '400', width: '15%' }}>{item.num}</td>
                  <td style={{ paddingBottom: '3px', color: '#1a3a6b', fontWeight: item.num.split('.').length <= 2 ? '700' : '400' }}>
                    <span style={{ textDecoration: 'underline' }}>{item.title}</span>
                    <span style={{ float: 'right', fontWeight: '400' }}>.......{item.page}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Footer pageNum={4} />
        </div>

        {/* PAGE 5 - LISTA DE FIGURAS */}
        <div style={{ ...pageStyle, padding: '15mm 20mm 25mm 20mm' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '6mm' }}>
            <SmallLogo />
          </div>
          <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '13pt', color: '#1a3a6b', marginBottom: '8mm', letterSpacing: '0.1em' }}>LISTA DE FIGURAS</div>
          <div style={{ fontSize: '9pt', lineHeight: '1.8' }}>
            {figuras.map((fig) => (
              <div key={fig.num} style={{ marginBottom: '6px', color: '#000' }}>
                <span style={{ fontWeight: '700', color: '#1a3a6b' }}>Figura {fig.num} – </span>
                {fig.title}
                <span style={{ float: 'right', color: '#1a3a6b', fontWeight: '700' }}>.......{fig.page}</span>
              </div>
            ))}
          </div>
          <Footer pageNum={5} />
        </div>

      </div>
    </div>
  );
};

export default ProjectRapReportView;
