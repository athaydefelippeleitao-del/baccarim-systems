import React, { useRef, useState, useMemo } from 'react';
import { Project, AppConfig } from '../types';
import { utmToDecimal } from '../utils/geoUtils';

interface ProjectRapReportViewProps {
  onUpdateProject?: (project: Project) => void;
  project: Project;
  appConfig?: AppConfig;
  onClose: () => void;
}

const ProjectRapReportView: React.FC<ProjectRapReportViewProps> = ({ project, appConfig, onUpdateProject, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const rd = project.specs?.rapData || {};

  // Editable fields (load from saved rapData, fallback to specs)
  const [empreendedorNome, setEmpreendedorNome] = useState(rd.empreendedorNome || project.specs?.responsavelLegal || project.specs?.razaoSocial || '');
  const [empreendedorCpf, setEmpreendedorCpf] = useState(rd.empreendedorCpf || project.specs?.cnpjCpf || '');
  const [empreendedorEnd, setEmpreendedorEnd] = useState(rd.empreendedorEnd || project.specs?.applicantAddress || '');
  const [empreendedorBairro, setEmpreendedorBairro] = useState(rd.empreendedorBairro || project.specs?.applicantBairro || '');
  const [empreendedorCidade, setEmpreendedorCidade] = useState(rd.empreendedorCidade || project.specs?.applicantCity || 'Londrina/PR');
  const [empreendedorCep, setEmpreendedorCep] = useState(rd.empreendedorCep || project.specs?.applicantCep || '');
  const [empEnderecoNome, setEmpEnderecoNome] = useState(rd.empEnderecoNome || project.specs?.responsavelLegal || project.specs?.razaoSocial || '');
  const [empEnderecoFull, setEmpEnderecoFull] = useState(rd.empEnderecoFull || project.specs?.projectAddress || '');
  const [empBairro, setEmpBairro] = useState(rd.empBairro || project.specs?.projectBairro || '');
  const [empCidade, setEmpCidade] = useState(rd.empCidade || project.specs?.projectCity || 'Londrina/PR');
  const [empCep, setEmpCep] = useState(rd.empCep || project.specs?.cep || '');
  const [empLicenca, setEmpLicenca] = useState(rd.empLicenca || project.specs?.licencaASerObtida || 'Licença Prévia em andamento para parcelamento do solo');
  const [empMatricula, setEmpMatricula] = useState(rd.empMatricula || project.specs?.matricula || '');
  const [empCoordE, setEmpCoordE] = useState(rd.empCoordE || project.specs?.coordE || '');
  const [empCoordN, setEmpCoordN] = useState(rd.empCoordN || project.specs?.coordN || '');
  const [mesElaboracao, setMesElaboracao] = useState(rd.mesElaboracao || 'Maio');
  const [anoElaboracao, setAnoElaboracao] = useState(rd.anoElaboracao || new Date().getFullYear().toString());
  const [contratanteEndereco, setContratanteEndereco] = useState(rd.contratanteEndereco || (project.specs?.applicantAddress ? `${project.specs.applicantAddress}${project.specs.applicantBairro ? ', ' + project.specs.applicantBairro : ''}${project.specs.applicantCity ? ' – ' + project.specs.applicantCity : ''}` : ''));
  const [respTecnico, setRespTecnico] = useState(rd.respTecnico || project.specs?.responsavelTecnico || 'Alberto Baccarim Junior');
  const [equipeApoio, setEquipeApoio] = useState(rd.equipeApoio || 'Giovana Pires de Almeida\nEngenheira Ambiental e Sanitária\nCREA – PR – 185635/D');
  const [embasamento, setEmbasamento] = useState(rd.embasamento || 'Instrução Normativa nº 21, de 25 de Abril de 2025');
  const [textoApresentacao, setTextoApresentacao] = useState(rd.textoApresentacao || 'O Relatório Ambiental Preliminar – RAP é um documento essencial para a obtenção do licenciamento ambiental de empreendimentos imobiliários urbanos no Estado do Paraná, em conformidade com as diretrizes estabelecidas na Resolução SEDEST Nº 060/2022, aprovada em 26 de agosto de 2022. A finalidade deste estudo consiste em alcançar um equilíbrio entre os interesses dos empreendedores urbanos e os impactos na qualidade de vida da população residente na área e em suas proximidades, atuando como mediador de conflitos relacionados ao uso e ocupação do solo.\n\nAo avaliar o local de estudo, o RAP reconhece tanto os efeitos positivos quanto os negativos decorrentes do projeto em questão. É frequente que avaliações técnicas não coincidam com a percepção coletiva dos impactos, o que pode conduzir a divergências entre grupos com perspectivas e interesses diversos. Portanto, o RAP busca incluir a percepção, crenças e a situação de poder dos envolvidos, ao mesmo tempo que leva em consideração os aspectos tangíveis dos efeitos gerados.\n\nO Relatório Ambiental Simplificado é uma ferramenta de controle da Política Urbana, e é exigido pelos órgãos reguladores ambientais competentes. Seu objetivo é assegurar que o empreendimento seja implantado de forma a não gerar impactos ambientais significativos e, se sempre que viável, aprimorar o local de implantação e seu entorno.');
  const [textoHistorico, setTextoHistorico] = useState(rd.textoHistorico || 'A partir da interpretação de imagens de satélite de diferentes períodos, constatou-se que a área analisada apresentou, de forma contínua, ocupação voltada à atividade agrícola, com evidências de cultivo de grãos e outras culturas típicas do uso rural. Ao longo do histórico avaliado, não foram observadas edificações, instalações ou sinais compatíveis com atividades industriais, armazenamento ou destinação de resíduos perigosos, postos de abastecimento, nem operações que envolvessem o manuseio de substâncias químicas de elevada periculosidade, ou quaisquer usos enquadráveis como potenciais geradores de áreas contaminadas, conforme os critérios definidos na Resolução CEMA nº 129/2023.');
  const [textoModalidade, setTextoModalidade] = useState(rd.textoModalidade || `O presente documento refere-se ao processo de licenciamento ambiental para a implantação de um loteamento residencial, resultante do parcelamento do solo urbano. O empreendimento será implantado na matrícula nº ${project.specs?.matricula || ''}. `);
  const [textoLocalizacao, setTextoLocalizacao] = useState(rd.textoLocalizacao || `O empreendimento até então sem denominação comercial estará localizado na ${project.specs?.projectAddress || ''}, na ${project.specs?.projectBairro || ''}. \nFigura 1 exibe o mapa de localização na cidade de Londrina.`);
  const [textoLaudoGeo, setTextoLaudoGeo] = useState(rd.textoLaudoGeo || `O Laudo Geológico-Geotécnico foi elaborado e está no Anexo 4 deste documento, trata da investigação geológica e geotécnica realizada nos lotes nº ${project.specs?.matricula || 'indicados'} localizados na ${project.specs?.projectBairro || 'Gleba'}, em Londrina/PR. O objetivo do estudo foi avaliar as características do solo para a viabilidade de um loteamento urbano. Foram realizadas 11 sondagens a trado com profundidade de seis metros, seguindo os critérios da NBR 9.603, além de ensaios de permeabilidade e percolação do solo. O levantamento geológico identificou que o solo predominante na área é composto por argila siltosa porosa vermelha, proveniente do intemperismo de rochas basálticas da Formação Serra Geral, não sendo detectado o nível freático durante as perfurações.\n\nOs ensaios indicaram baixa permeabilidade e uma taxa média de percolação de 60 litros por metro quadrado ao dia, considerada adequada para sistemas de tratamento de esgoto com tanques sépticos.\n\nA área apresenta estabilidade geotécnica, sem sinais de erosão ou recalques, sendo classificada como de baixo risco para a implantação do empreendimento. O estudo conclui que o terreno é adequado para loteamento.`);
  const [isSaving, setIsSaving] = useState(false);

  // Satellite image URL from UTM coordinates
  const satelliteUrl = useMemo(() => {
    const e = parseFloat((empCoordE || '').replace(/[^\d.]/g, ''));
    const n = parseFloat((empCoordN || '').replace(/[^\d.]/g, ''));
    const zone = project.specs?.zone || 22;
    if (!isNaN(e) && !isNaN(n) && e > 0 && n > 0) {
      try {
        const { lat, lng } = utmToDecimal(e, n, zone);
        const delta = 0.003;
        return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${lng-delta},${lat-delta*0.7},${lng+delta},${lat+delta*0.7}&bboxSR=4326&layers=show&size=600,400&imageSR=4326&transparent=false&format=png32&f=image`;
      } catch { return null; }
    }
    return null;
  }, [empCoordE, empCoordN, project.specs?.zone]);

  // Regional/Street map URL for location context
  const locationMapUrl = useMemo(() => {
    const e = parseFloat((empCoordE || '').replace(/[^\d.]/g, ''));
    const n = parseFloat((empCoordN || '').replace(/[^\d.]/g, ''));
    const zone = project.specs?.zone || 22;
    if (!isNaN(e) && !isNaN(n) && e > 0 && n > 0) {
      try {
        const { lat, lng } = utmToDecimal(e, n, zone);
        const delta = 0.04; // Zoom out to show city context
        return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/export?bbox=${lng-delta},${lat-delta*0.7},${lng+delta},${lat+delta*0.7}&bboxSR=4326&layers=show&size=600,400&imageSR=4326&transparent=false&format=png32&f=image`;
      } catch { return null; }
    }
    return null;
  }, [empCoordE, empCoordN, project.specs?.zone]);

  const cidade = 'Londrina/PR';

  const handleSave = () => {
    if (!onUpdateProject) return;
    setIsSaving(true);
    const rapData: Record<string, string> = {
      empreendedorNome, empreendedorCpf, empreendedorEnd, empreendedorBairro, empreendedorCidade, empreendedorCep,
      empEnderecoNome, empEnderecoFull, empBairro, empCidade, empCep, empLicenca, empMatricula, empCoordE, empCoordN,
      mesElaboracao, anoElaboracao, contratanteEndereco, respTecnico, equipeApoio, embasamento,
      textoApresentacao, textoHistorico, textoModalidade, textoLocalizacao, textoLaudoGeo,
    };
    onUpdateProject({ ...project, specs: { ...project.specs, rapData } });
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleGeneratePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    const opt = {
      margin: 0,
      filename: `RAP_${project.name.replace(/ /g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, allowTaint: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css', before: '.pdf-page-break' }
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

  // Page style — fixed A4 height to avoid blank spacing between pages
  const pageStyle: React.CSSProperties = {
    width: '210mm',
    minHeight: '297mm',
    backgroundColor: 'white',
    position: 'relative',
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#000',
    boxSizing: 'border-box',
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

        <div className="space-y-4">
          <p className="text-[9px] font-bold text-baccarim-blue uppercase tracking-widest border-b border-baccarim-border pb-2">Empreendedor</p>
          <div><label className={labelCls}>Nome (Capa)</label><input value={empreendedorNome} onChange={e => setEmpreendedorNome(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>CPF</label><input value={empreendedorCpf} onChange={e => setEmpreendedorCpf(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Endereço</label><input value={empreendedorEnd} onChange={e => setEmpreendedorEnd(e.target.value)} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>Bairro</label><input value={empreendedorBairro} onChange={e => setEmpreendedorBairro(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>CEP</label><input value={empreendedorCep} onChange={e => setEmpreendedorCep(e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Município/UF</label><input value={empreendedorCidade} onChange={e => setEmpreendedorCidade(e.target.value)} className={inputCls} /></div>

          <p className="text-[9px] font-bold text-baccarim-blue uppercase tracking-widest border-b border-baccarim-border pb-2 mt-2">Empreendimento</p>
          <div><label className={labelCls}>Nome/Responsável</label><input value={empEnderecoNome} onChange={e => setEmpEnderecoNome(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Endereço do Lote</label><input value={empEnderecoFull} onChange={e => setEmpEnderecoFull(e.target.value)} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>Bairro/Gleba</label><input value={empBairro} onChange={e => setEmpBairro(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>CEP</label><input value={empCep} onChange={e => setEmpCep(e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Município/UF</label><input value={empCidade} onChange={e => setEmpCidade(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Licença Ambiental</label><textarea value={empLicenca} onChange={e => setEmpLicenca(e.target.value)} className={textareaCls} /></div>
          <div><label className={labelCls}>Matrícula</label><input value={empMatricula} onChange={e => setEmpMatricula(e.target.value)} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>UTM (E)</label><input value={empCoordE} onChange={e => setEmpCoordE(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>UTM (N)</label><input value={empCoordN} onChange={e => setEmpCoordN(e.target.value)} className={inputCls} /></div>
          </div>

          <p className="text-[9px] font-bold text-baccarim-blue uppercase tracking-widest border-b border-baccarim-border pb-2 mt-2">Elaboração</p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>Mês</label><input value={mesElaboracao} onChange={e => setMesElaboracao(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Ano</label><input value={anoElaboracao} onChange={e => setAnoElaboracao(e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Endereço Contratante</label><textarea value={contratanteEndereco} onChange={e => setContratanteEndereco(e.target.value)} className={textareaCls} /></div>
          <div><label className={labelCls}>Responsável Técnico</label><input value={respTecnico} onChange={e => setRespTecnico(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Equipe de Apoio</label><textarea value={equipeApoio} onChange={e => setEquipeApoio(e.target.value)} className={textareaCls} /></div>
          <div><label className={labelCls}>Embasamento Técnico</label><textarea value={embasamento} onChange={e => setEmbasamento(e.target.value)} className={textareaCls} /></div>

          <p className="text-[9px] font-bold text-baccarim-blue uppercase tracking-widest border-b border-baccarim-border pb-2 mt-2">Textos do RAP</p>
          <div><label className={labelCls}>Apresentação</label><textarea value={textoApresentacao} onChange={e => setTextoApresentacao(e.target.value)} className={textareaCls} style={{minHeight:'100px'}} /></div>
          <div><label className={labelCls}>Modalidade do Empreendimento</label><textarea value={textoModalidade} onChange={e => setTextoModalidade(e.target.value)} className={textareaCls} /></div>
          <div><label className={labelCls}>Localização</label><textarea value={textoLocalizacao} onChange={e => setTextoLocalizacao(e.target.value)} className={textareaCls} /></div>
          <div><label className={labelCls}>Histórico do Imóvel</label><textarea value={textoHistorico} onChange={e => setTextoHistorico(e.target.value)} className={textareaCls} style={{minHeight:'100px'}} /></div>
          <div><label className={labelCls}>Laudo Geológico-Geotécnico</label><textarea value={textoLaudoGeo} onChange={e => setTextoLaudoGeo(e.target.value)} className={textareaCls} style={{minHeight:'100px'}} /></div>

          <div className="w-full h-px bg-baccarim-border"></div>

          <button onClick={handleSave} disabled={isSaving || !onUpdateProject}
            className="w-full py-3 bg-baccarim-green text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2 hover:brightness-110 transition-all disabled:opacity-50">
            {isSaving ? <i className="fas fa-check"></i> : <i className="fas fa-save"></i>}
            <span>{isSaving ? 'Salvo!' : 'Salvar no App'}</span>
          </button>

          <button onClick={handleGeneratePDF} disabled={isGenerating}
            className="w-full py-3 bg-baccarim-blue text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2 hover:bg-baccarim-green transition-all disabled:opacity-50">
            {isGenerating ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-file-pdf"></i>}
            <span>{isGenerating ? 'Gerando...' : 'Gerar PDF'}</span>
          </button>
        </div>
      </div>

      {/* A4 Document Preview */}
      <div ref={reportRef} className="shrink-0" style={{ width: '210mm' }}>

        {/* PAGE 1 - CAPA */}
        <div style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Block */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '35mm' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', paddingRight: '20mm' }}>
                  <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '55mm', height: 'auto', objectFit: 'contain', marginBottom: '5mm' }} />
                </div>
                <div style={{ fontSize: '38pt', fontWeight: '900', color: '#1a3a6b', lineHeight: 1.0, letterSpacing: '-0.02em' }}>
                  Baccarim<br />Engenharia de<br />Loteamentos
                </div>
                <div style={{ fontSize: '13pt', fontWeight: '500', color: '#000', marginTop: '6mm' }}>
                  RELATÓRIO AMBIENTAL PRELIMINAR - RAP
                </div>
              </div>
            </div>

            {/* Middle Block (Name) */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '16pt', fontWeight: '900', color: '#000', textAlign: 'center', textTransform: 'uppercase' }}>
                {empreendedorNome}
              </div>
            </div>

            {/* Bottom Block */}
            <div style={{ textAlign: 'center', marginBottom: '15mm' }}>
              <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000', marginBottom: '8mm' }}>
                {cidade}<br />{anoElaboracao}
              </div>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '10mm', right: '12mm', fontSize: '9pt', color: '#000' }}>
              1
            </div>

          </div>
        </div>

        {/* PAGE 2 - FOLHA DE ROSTO */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '10mm 15mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '25mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 10mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '12pt', color: '#000', marginBottom: '8mm', letterSpacing: '0.05em', textDecoration: 'underline' }}>
                RELATÓRIO AMBIENTAL PRELIMINAR – RAP
              </div>

              {/* Contratante / Contratada */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', marginBottom: '15mm', marginTop: '10mm' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000', marginBottom: '35mm' }}>Contratante</div>
                  <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000', textAlign: 'center', maxWidth: '80%' }}>
                    {contratanteEndereco}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000', marginBottom: '15mm' }}>Contratada</div>
                  <div style={{ fontSize: '24pt', fontWeight: '900', color: '#1a3a6b', lineHeight: 1.0, letterSpacing: '-0.02em', alignSelf: 'flex-start', marginLeft: '15%' }}>
                    Baccarim<br />Engenharia de<br />Loteamentos
                  </div>
                  <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000', textAlign: 'center', marginTop: '8mm' }}>
                    Avenida Dom Pedro II, nº 33, Centro,<br />Sala 02 – Ibiporã/PR
                  </div>
                </div>
              </div>

              {/* Elaboração + Embasamento */}
              <div style={{ border: '1px solid #000', width: '90%', margin: '0 auto', display: 'flex', flexDirection: 'column', marginBottom: '10mm' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                  <div style={{ flex: 1, padding: '5mm', textAlign: 'center', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                    <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000', marginBottom: '6mm' }}>ELABORAÇÃO</div>
                    <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000' }}>{mesElaboracao}/{anoElaboracao}</div>
                  </div>
                  <div style={{ flex: 1, padding: '5mm', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                    <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000', marginBottom: '6mm' }}>EMBASAMENTO TÉCNICO</div>
                    <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000', whiteSpace: 'pre-line' }}>{embasamento}</div>
                  </div>
                </div>
                <div style={{ padding: '3mm', textAlign: 'center', fontSize: '10pt', fontWeight: '700', color: '#000' }}>
                  Todos os direitos são reservados à Baccarim Engenharia Urbana LTDA
                </div>
              </div>

              {/* Responsável técnico */}
              <div style={{ textAlign: 'center', marginBottom: '12mm' }}>
                <div style={{ fontSize: '11pt', fontWeight: '700', color: '#000', marginBottom: '5mm' }}>RESPONSÁVEL TÉCNICO DO RAP</div>
                {respTecnico.split('\n').map((line, i) => (
                  <div key={i} style={{ fontSize: '10pt', fontWeight: '700', color: '#000', marginBottom: '3mm' }}>{line}</div>
                ))}
                <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000', marginBottom: '3mm' }}>Engenheiro Civil</div>
                <div style={{ fontSize: '10pt', fontWeight: '700', color: '#000' }}>CREA – PR – 142.811/D</div>
              </div>

              {/* Equipe de apoio */}
              <div style={{ width: '90%', margin: '0 auto', textAlign: 'left' }}>
                <div style={{ fontSize: '11pt', fontWeight: '700', color: '#000', marginBottom: '4mm' }}>Equipe de apoio:</div>
                {equipeApoio.split('\n').map((line, i) => (
                  <div key={i} style={{ fontSize: '10pt', color: '#000', marginBottom: '4mm' }}>{line}</div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '10mm', marginTop: 'auto' }}>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '10mm', right: '12mm', fontSize: '9pt', color: '#000' }}>
              2
            </div>

          </div>
        </div>

        {/* PAGE 3 - SUMÁRIO (parte 1) */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '13pt', color: '#1a3a6b', marginBottom: '6mm', letterSpacing: '0.2em' }}>SUMÁRIO</div>
              
              <div style={{ width: '100%', fontSize: '9pt', color: '#1a3a6b' }}>
                {sumarioItems.slice(0, 30).map((item, i) => {
                  const parts = item.num.replace(/\.$/, '').split('.');
                  const level = parts.length - 1;
                  const indentMap: Record<number, string> = { 0: '0mm', 1: '6mm', 2: '12mm', 3: '18mm' };
                  const numWidthMap: Record<number, string> = { 0: '7mm', 1: '10mm', 2: '14mm', 3: '18mm' };
                  const indent = indentMap[level] ?? '12mm';
                  const numWidth = numWidthMap[level] ?? '14mm';

                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '3px', color: '#1a3a6b', fontWeight: '700', fontSize: '9pt' }}>
                      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', lineHeight: '1.2', paddingLeft: indent }}>
                        <div style={{ position: 'absolute', bottom: '2px', left: 0, right: 0, whiteSpace: 'nowrap', zIndex: 1, letterSpacing: '2px' }}>
                          {'.'.repeat(300)}
                        </div>
                        <span style={{ backgroundColor: '#ffffff', paddingRight: '4px', textDecoration: 'underline', position: 'relative', zIndex: 2 }}>
                          <span style={{ display: 'inline-block', width: numWidth }}>{item.num}</span>
                          {item.title}
                        </span>
                      </div>
                      <div style={{ flexShrink: 0, paddingLeft: '4px', backgroundColor: '#ffffff', zIndex: 2, position: 'relative', marginBottom: '1px' }}>
                        {item.page}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', paddingTop: '4mm' }}>
              <div style={{ fontSize: '7.5pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 – Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '9pt', color: '#000' }}>
              3
            </div>

          </div>
        </div>

        {/* PAGE 4 - SUMÁRIO (parte 2) */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ marginTop: '6mm' }} />
              <div style={{ width: '100%', fontSize: '9pt', color: '#1a3a6b' }}>
                {sumarioItems.slice(30).map((item, i) => {
                  const parts = item.num.replace(/\.$/, '').split('.');
                  const level = parts.length - 1;
                  const indentMap: Record<number, string> = { 0: '0mm', 1: '6mm', 2: '12mm', 3: '18mm' };
                  const numWidthMap: Record<number, string> = { 0: '7mm', 1: '10mm', 2: '14mm', 3: '18mm' };
                  const indent = indentMap[level] ?? '12mm';
                  const numWidth = numWidthMap[level] ?? '14mm';

                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '3px', color: '#1a3a6b', fontWeight: '700', fontSize: '9pt' }}>
                      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', lineHeight: '1.2', paddingLeft: indent }}>
                        <div style={{ position: 'absolute', bottom: '2px', left: 0, right: 0, whiteSpace: 'nowrap', zIndex: 1, letterSpacing: '2px' }}>
                          {'.'.repeat(300)}
                        </div>
                        <span style={{ backgroundColor: '#ffffff', paddingRight: '4px', textDecoration: 'underline', position: 'relative', zIndex: 2 }}>
                          <span style={{ display: 'inline-block', width: numWidth }}>{item.num}</span>
                          {item.title}
                        </span>
                      </div>
                      <div style={{ flexShrink: 0, paddingLeft: '4px', backgroundColor: '#ffffff', zIndex: 2, position: 'relative', marginBottom: '1px' }}>
                        {item.page}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', paddingTop: '4mm' }}>
              <div style={{ fontSize: '7.5pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 – Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '9pt', color: '#000' }}>
              4
            </div>

          </div>
        </div>

        {/* PAGE 5 - LISTA DE FIGURAS */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '10mm 15mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '25mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 10mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '14pt', color: '#1a3a6b', marginBottom: '10mm', letterSpacing: '0.1em' }}>LISTA DE FIGURAS</div>
              
              <div style={{ fontSize: '10pt', lineHeight: '2.0', color: '#1a3a6b' }}>
                {figuras.map((fig) => (
                  <div key={fig.num} style={{ display: 'flex', marginBottom: '6px' }}>
                    <div style={{ fontWeight: '700', marginRight: '6px' }}>Figura {fig.num} –</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ textDecoration: 'underline' }}>{fig.title}</span>
                      <span style={{ float: 'right', fontWeight: '400' }}>.......{fig.page}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '10mm', marginTop: 'auto' }}>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '10mm', right: '12mm', fontSize: '9pt', color: '#000' }}>
              5
            </div>

          </div>
        </div>
        {/* PAGE 6 - Identificação Empreendedor + Empresa */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginTop: '10mm' }} />

              <div style={{ fontSize: '11pt', fontWeight: '900', color: '#000', marginBottom: '6mm' }}>1. IDENTIFICAÇÃO DO EMPREENDEDOR</div>
              <table style={{ width: 'calc(100% - 10mm)', fontSize: '10pt', marginBottom: '10mm', borderCollapse: 'collapse', marginLeft: '10mm' }}>
                <tbody>
                  {[['Nome:', empreendedorNome], ['CPF:', empreendedorCpf], ['Endereço:', empreendedorEnd], ['Bairro:', empreendedorBairro]].map(([k, v]) => (
                    <tr key={k as string}><td style={{ fontWeight: '700', color: '#000', width: '45mm', paddingBottom: '5px', verticalAlign: 'top' }}>{k}</td><td colSpan={2} style={{ color: '#000', paddingBottom: '5px' }}>{v}</td></tr>
                  ))}
                  <tr>
                    <td style={{ fontWeight: '700', color: '#000', width: '45mm', paddingBottom: '5px', verticalAlign: 'top' }}>Município/UF:</td>
                    <td style={{ color: '#000', paddingBottom: '5px', width: '50mm' }}>{empreendedorCidade}</td>
                    <td style={{ color: '#000', paddingBottom: '5px' }}>
                      <span style={{ fontWeight: '700', marginRight: '4px' }}>CEP:</span>
                      <span>{empreendedorCep}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontSize: '11pt', fontWeight: '900', color: '#000', marginBottom: '6mm', marginLeft: '6mm' }}>1.1. Identificação Do Empreendimento</div>
              <table style={{ width: 'calc(100% - 15mm)', fontSize: '10pt', marginBottom: '12mm', borderCollapse: 'collapse', marginLeft: '15mm' }}>
                <tbody>
                  {[['Nome:', empEnderecoNome], ['Endereço:', empEnderecoFull], ['Bairro:', empBairro]].map(([k, v]) => (
                    <tr key={k as string}><td style={{ fontWeight: '700', color: '#000', width: '40mm', paddingBottom: '5px', verticalAlign: 'top' }}>{k}</td><td colSpan={2} style={{ color: '#000', paddingBottom: '5px' }}>{v}</td></tr>
                  ))}
                  <tr>
                    <td style={{ fontWeight: '700', color: '#000', width: '40mm', paddingBottom: '5px', verticalAlign: 'top' }}>Município/UF:</td>
                    <td style={{ color: '#000', paddingBottom: '5px', width: '50mm' }}>{empCidade}</td>
                    <td style={{ color: '#000', paddingBottom: '5px' }}>
                      <span style={{ fontWeight: '700', marginRight: '4px' }}>CEP:</span>
                      <span>{empCep}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700', color: '#000', width: '40mm', paddingBottom: '5px', verticalAlign: 'top' }}>Licença Ambiental:</td>
                    <td colSpan={2} style={{ color: '#000', paddingBottom: '5px', maxWidth: '100mm', lineHeight: '1.4' }}>{empLicenca}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontSize: '11pt', fontWeight: '900', color: '#000', marginBottom: '6mm' }}>2. IDENTIFICAÇÃO DA EMPRESA E RESPONSÁVEL PELA ELABORAÇÃO DO RAP</div>
              <table style={{ width: 'calc(100% - 10mm)', fontSize: '10pt', borderCollapse: 'collapse', marginLeft: '10mm' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '700', color: '#000', width: '45mm', paddingBottom: '5px', verticalAlign: 'top' }}>Responsável técnico:</td>
                    <td colSpan={2} style={{ color: '#000', paddingBottom: '5px' }}>{respTecnico}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700', color: '#000', width: '45mm', paddingBottom: '5px', verticalAlign: 'top' }}>Conselho de Classe:</td>
                    <td style={{ color: '#000', paddingBottom: '5px', width: '50mm' }}>CREA/PR</td>
                    <td style={{ color: '#000', paddingBottom: '5px' }}>
                      <span style={{ fontWeight: '700', marginRight: '4px' }}>Número de Registro:</span>
                      <span>142.811/D</span>
                    </td>
                  </tr>
                  {[['Empresa Responsável:', 'BACCARIM ENGENHARIA URBANA LTDA'], ['E-mail:', 'alberto@baccarimengenharia.com.br'], ['CNPJ:', '03.019.603/0001-23'], ['Endereço:', 'Avenida Dom Pedro II, nº 33, Centro, Sala 02']].map(([k, v]) => (
                    <tr key={k as string}><td style={{ fontWeight: '700', color: '#000', width: '45mm', paddingBottom: '5px', verticalAlign: 'top' }}>{k}</td><td colSpan={2} style={{ color: '#000', paddingBottom: '5px' }}>{v}</td></tr>
                  ))}
                  <tr>
                    <td style={{ fontWeight: '700', color: '#000', width: '45mm', paddingBottom: '5px', verticalAlign: 'top' }}>Município/UF:</td>
                    <td style={{ color: '#000', paddingBottom: '5px', width: '50mm' }}>Ibiporã-Paraná</td>
                    <td style={{ color: '#000', paddingBottom: '5px' }}>
                      <span style={{ fontWeight: '700', marginRight: '4px' }}>CEP:</span>
                      <span>86200-000</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700', color: '#000', width: '45mm', paddingBottom: '5px', verticalAlign: 'top' }}>Telefone:</td>
                    <td colSpan={2} style={{ color: '#000', paddingBottom: '5px' }}>(43) 3268-0916</td>
                  </tr>
                </tbody>
              </table>

            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', paddingTop: '4mm' }}>
              <div style={{ fontSize: '7.5pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 – Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '9pt', color: '#000' }}>
              6
            </div>

          </div>
        </div>

        {/* PAGE 7 - Apresentação */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginTop: '10mm' }} />

              <div style={{ fontSize: '11pt', fontWeight: '900', color: '#000', marginBottom: '6mm', marginLeft: '10mm' }}>3. APRESENTAÇÃO</div>
              <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', padding: '0 10mm' }}>
                {textoApresentacao.split('\n\n').map((p, i) => <p key={i} style={{ textIndent: '15mm', marginBottom: '4mm', marginTop: 0 }}>{p}</p>)}
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', paddingTop: '4mm' }}>
              <div style={{ fontSize: '7.5pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 – Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '9pt', color: '#000' }}>
              7
            </div>

          </div>
        </div>

        {/* PAGE 8 - Modalidade + Localização Regional */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '11pt', fontWeight: '900', color: '#000', marginBottom: '4mm', textTransform: 'uppercase' }}>4. IDENTIFICAÇÃO, MODALIDADE E LOCALIZAÇÃO DO EMPREENDIMENTO</div>
              <div style={{ fontSize: '11pt', fontWeight: '700', color: '#000', marginBottom: '4mm', marginLeft: '6mm' }}>4.1. Identificação E Modalidade Do Empreendimento</div>
              <div style={{ fontSize: '10.5pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', marginBottom: '6mm' }}>
                {textoModalidade.split('\n').map((p, i) => <p key={i} style={{ textIndent: '15mm', marginBottom: '4mm' }}>{p}</p>)}
              </div>
              
              <div style={{ fontSize: '11pt', fontWeight: '900', color: '#000', marginBottom: '4mm', textTransform: 'uppercase', marginTop: '4mm' }}>5. LOCALIZAÇÃO DO EMPREENDIMENTO</div>
              <div style={{ fontSize: '10.5pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', marginBottom: '4mm' }}>
                {textoLocalizacao.split('\n').map((p, i) => <p key={i} style={{ textIndent: '15mm', marginBottom: '3mm' }}>{p}</p>)}
              </div>
              
              {/* MAPA REGIONAL (PARANÁ) */}
              <div style={{ position: 'relative', border: '1px solid #000', padding: '0', marginBottom: '2mm', width: '100%' }}>
                <img src="/mapa_parana.png" alt="Mapa de localização regional" 
                  style={{ width: '100%', height: '80mm', objectFit: 'contain', background: '#fff' }} />
                
                {/* LEGENDA */}
                <div style={{ position: 'absolute', bottom: '5mm', right: '5mm', background: '#fff', border: '1px solid #000', padding: '2mm', fontSize: '8pt', minWidth: '45mm' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>LEGENDA:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', marginBottom: '1mm' }}>
                    <div style={{ width: '8mm', height: '4mm', background: 'red' }}></div>
                    <span>Região Metropolitana de Londrina</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
                    <div style={{ width: '8mm', height: '4mm', background: 'red', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, white 2px, white 4px)' }}></div>
                    <span>Londrina</span>
                  </div>
                </div>
              </div>
              
              <div style={{ fontSize: '8pt', color: '#000', textAlign: 'center', lineHeight: '1.2', marginBottom: '8mm' }}>
                Figura 1 – Mapa de localização do Município de Londrina, Paraná. Fonte: Ambiente construído e o deslocamento a pé: Uma análise comparativa em Londrina – PR (Murilo Doro Maidana, Larissa Casaril da Fontoura e Milena Kanashiro). 2021.
              </div>

              {/* TABELA DE DISTÂNCIAS */}
              <div style={{ width: '70%', margin: '0 auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #000', borderTop: '1.5px solid #000' }}>
                      <th style={{ padding: '4px', fontWeight: 'bold' }}>Distância aproximada entre as cidades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Londrina – Assaí', '45 km'],
                      ['Londrina – Bela Vista do Paraíso', '42 km'],
                      ['Londrina – Cambé', '13 km'],
                      ['Londrina – Ivaiporã', '170 km'],
                      ['Londrina – Curitiba', '379 km']
                    ].map(([c, d], idx) => (
                      <tr key={idx} style={{ borderBottom: idx === 4 ? '1.5px solid #000' : 'none' }}>
                        <td style={{ padding: '2px', display: 'flex', justifyContent: 'center' }}>
                          <span style={{ width: '55%', textAlign: 'right', paddingRight: '10mm' }}>{c}</span>
                          <span style={{ width: '45%', textAlign: 'left', fontWeight: 'bold' }}>{d}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', marginTop: 'auto' }}>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '10pt', color: '#000' }}>
              8
            </div>

          </div>
        </div>

        {/* PAGE 9 - Coordenadas + Satélite (Ajustado) */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '10.5pt', lineHeight: '1.6', color: '#000', marginBottom: '6mm', textAlign: 'justify', marginTop: '10mm' }}>
                <p style={{ textIndent: '15mm' }}>A Figura 2 apresenta a imagem de satélite com o croqui de localização do terreno objeto do licenciamento ambiental. O limite aproximado da propriedade está demarcado pela linha laranja, e as coordenadas correspondentes ao ponto central da área estão descritas na tabela a seguir.</p>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
                {satelliteUrl ? (
                  <img src={satelliteUrl} alt="Imagem de satélite" crossOrigin="anonymous"
                    style={{ width: '100%', height: '110mm', objectFit: 'cover', border: '1px solid #000', display: 'block', marginBottom: '2mm' }} />
                ) : (
                  <div style={{ background: '#f5f5f5', border: '1px solid #000', width: '100%', height: '110mm', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginBottom: '2mm' }}>
                    <i style={{ fontSize: '24pt', color: '#1a3a6b', marginBottom: '4px' }} className="fas fa-satellite"></i>
                    <div style={{ fontSize: '8pt', color: '#666' }}>Informe as coordenadas UTM para gerar a imagem de satélite</div>
                  </div>
                )}
                <div style={{ fontSize: '10pt', color: '#000', fontWeight: 'bold' }}>Avenida Alcides Turini, Gleba Ribeirão Cafezal – Lote A/2</div>
                <div style={{ fontSize: '8pt', color: '#000', marginTop: '1mm' }}>Figura 2 - Planta de localização do empreendimento. Fonte: Google Earth.</div>
              </div>

              <div style={{ marginTop: '8mm' }}>
                <table style={{ width: '50%', margin: '0 auto', borderCollapse: 'collapse', fontSize: '10pt', textAlign: 'center' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Coordenadas</th>
                      <th style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>UTM</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Longitude</td>
                      <td style={{ border: '1px solid #000', padding: '4px 8px' }}>{empCoordE || '474501.23 m E'}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '4px 8px', fontWeight: 'bold' }}>Latitude</td>
                      <td style={{ border: '1px solid #000', padding: '4px 8px' }}>{empCoordN || '7415709.98 m S'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', marginTop: 'auto' }}>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '10pt', color: '#000' }}>
              9
            </div>

          </div>
        </div>

        {/* PAGE 10 - Relatório Fotográfico + Histórico */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '11pt', fontWeight: '900', color: '#000', marginBottom: '6mm', marginTop: '10mm', textTransform: 'uppercase' }}>6. RELATÓRIO FOTOGRÁFICO</div>
              <div style={{ fontSize: '10.5pt', color: '#000', marginBottom: '8mm', textIndent: '15mm', textAlign: 'justify', lineHeight: '1.6' }}>O relatório fotográfico foi elaborado e está em anexo a esse Relatório.</div>
              <div style={{ fontSize: '11pt', fontWeight: '700', color: '#000', marginBottom: '4mm', marginLeft: '6mm' }}>6.1. Histórico do uso do Imóvel</div>
              <div style={{ fontSize: '10.5pt', lineHeight: '1.8', textAlign: 'justify', color: '#000' }}>
                {textoHistorico.split('\n').map((p, i) => p.trim() ? <p key={i} style={{ textIndent: '15mm', marginBottom: '4mm' }}>{p}</p> : null)}
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', marginTop: 'auto' }}>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '10pt', color: '#000' }}>
              10
            </div>

          </div>
        </div>

        {/* PAGE 11 - Plantas, Laudos e Estudos */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '11pt', fontWeight: '900', color: '#000', marginBottom: '5mm', marginTop: '10mm', textTransform: 'uppercase' }}>7. PLANTAS, LAUDOS, PROJETOS E ESTUDOS ESPECÍFICOS</div>

              <div style={{ fontSize: '11pt', fontWeight: '700', color: '#000', marginBottom: '4mm', marginLeft: '6mm' }}>7.1. Planta Ilustrativa</div>
              <div style={{ fontSize: '10.5pt', lineHeight: '1.8', textAlign: 'justify', color: '#000', marginBottom: '6mm' }}>
                <p style={{ textIndent: '15mm', margin: 0 }}>A planta ilustrativa que apresenta o Projeto Urbanístico de implantação está no Anexo 3 deste documento.</p>
              </div>

              <div style={{ fontSize: '11pt', fontWeight: '700', color: '#000', marginBottom: '4mm', marginLeft: '6mm' }}>7.2. Planta Planialtimétrica</div>
              <div style={{ fontSize: '10.5pt', lineHeight: '1.8', textAlign: 'justify', color: '#000', marginBottom: '6mm' }}>
                <p style={{ textIndent: '15mm', margin: 0 }}>A planta planialtimétrica que apresenta a distribuição de áreas propostas para o empreendimento foi elaborada e está no Anexo 4 deste documento.</p>
              </div>

              <div style={{ fontSize: '11pt', fontWeight: '700', color: '#000', marginBottom: '4mm', marginLeft: '6mm' }}>7.3. Laudo Geológico-Geotécnico</div>
              <div style={{ fontSize: '10.5pt', lineHeight: '1.8', textAlign: 'justify', color: '#000' }}>
                {textoLaudoGeo.split('\n').map((p, i) => p.trim() ? <p key={i} style={{ textIndent: '15mm', marginBottom: '4mm' }}>{p}</p> : null)}
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', marginTop: 'auto' }}>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '10pt', color: '#000' }}>
              11
            </div>

          </div>
        </div>

        {/* PAGE 12 - Laudo Florestal + Diagnóstico Ambiental */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '11pt', fontWeight: '700', color: '#000', marginBottom: '4mm', marginLeft: '6mm', marginTop: '10mm' }}>7.4. Laudo Florestal</div>
              <div style={{ fontSize: '10.5pt', lineHeight: '1.8', textAlign: 'justify', color: '#000', marginBottom: '10mm' }}>
                <p style={{ textIndent: '15mm', margin: 0 }}>Em razão do empreendimento não prever intervenção ou supressão de vegetação, nativa ou exótica, não se aplica a elaboração de Laudo Florestal para a presente solicitação.</p>
              </div>

              <div style={{ fontSize: '11pt', fontWeight: '900', color: '#000', marginBottom: '6mm', textTransform: 'uppercase' }}>8. DIAGNÓSTICO AMBIENTAL</div>
              <div style={{ fontSize: '11pt', fontWeight: '700', color: '#000', marginBottom: '4mm', marginLeft: '6mm' }}>8.1. Diagnóstico Do Meio Físico</div>
              <div style={{ fontSize: '11pt', color: '#000', marginBottom: '4mm', marginLeft: '12mm' }}>8.1.1. CLIMA</div>
              <div style={{ fontSize: '10.5pt', lineHeight: '1.8', textAlign: 'justify', color: '#000' }}>
                <p style={{ textIndent: '15mm', marginBottom: '4mm', marginTop: 0 }}>Londrina apresenta clima subtropical úmido, classificado como <em>Cfa</em> segundo Köppen-Geiger, com temperaturas amenas ao longo do ano e chuvas bem distribuídas, embora com maior concentração no verão. A temperatura média anual é de 21 °C, conforme mostra a Figura 3, que apresenta o gráfico de temperatura e precipitação mensal da cidade. A variação térmica anual é moderada, com julho sendo o mês mais frio (média 16,8 °C) e dezembro o mais quente (23,6 °C).</p>
                <p style={{ textIndent: '15mm', marginBottom: '4mm' }}>A precipitação média anual é de 1.723 mm, com maior volume nos meses de verão, especialmente em janeiro (276 mm), e o menor em agosto (65 mm), evidenciando a sazonalidade das chuvas (Figura 25). Além do volume, a frequência de dias chuvosos também varia: julho registra os menores índices (5,7 dias) e janeiro os maiores (21,3 dias). Essa distribuição reforça o caráter úmido do clima, mesmo nos meses mais secos.</p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', marginTop: 'auto' }}>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '10pt', color: '#000' }}>
              12
            </div>

          </div>
        </div>

        {/* PAGE 13 - Figura 3 (clima) */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', marginBottom: '2mm', marginTop: '10mm' }}>
                <img src="/balanco_londrina.png" alt="Gráfico do balanço pluviométrico" 
                  style={{ width: '85%', height: '110mm', objectFit: 'contain', border: '1px solid #000', background: '#fff', margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '8pt', color: '#000', textAlign: 'center', marginBottom: '8mm' }}>Figura 3 - Gráfico do balanço pluviométrico do município (CLIMATE.DATA.ORG, 2020).</div>
              <div style={{ fontSize: '10.5pt', lineHeight: '1.8', textAlign: 'justify', color: '#000' }}>
                <p style={{ textIndent: '15mm', margin: 0 }}>A Figura 4 ilustra a distribuição da temperatura média anual no estado do Paraná, evidenciando que Londrina está inserida em uma faixa com temperaturas entre 20,1 °C e 21,0 °C, condizente com os dados do gráfico climático (Figura 25).</p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', marginTop: 'auto' }}>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '10pt', color: '#000' }}>
              13
            </div>

          </div>
        </div>

        {/* PAGE 14 - Figura 4 (temperatura Paraná) */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', marginBottom: '2mm', marginTop: '4mm' }}>
                <img src="/temp_parana.png" alt="Mapa de temperatura média anual" 
                  style={{ width: '90%', height: '125mm', objectFit: 'contain', border: '1px solid #000', background: '#fff', margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '8pt', color: '#000', textAlign: 'center', marginBottom: '8mm' }}>Figura 4 - Temperatura média do ar anual no Estado do Paraná. Fonte: Instituto Agronômico do Paraná - IAPAR (1999).</div>
              <div style={{ fontSize: '10.5pt', lineHeight: '1.8', textAlign: 'justify', color: '#000' }}>
                <p style={{ textIndent: '15mm', marginBottom: '4mm', marginTop: 0 }}>Já a Figura 6, referente à precipitação anual no Paraná, indica que Londrina se encontra na faixa entre 1.600 mm e 1.800 mm de chuvas anuais, compatível com os 1.723 mm registrados localmente. Isso mostra que a cidade está entre as áreas com maiores índices pluviométricos do estado, ficando atrás apenas das regiões litorâneas e de serra, que ultrapassam 2.000 mm.</p>
                <p style={{ textIndent: '15mm', margin: 0 }}>Portanto, o clima em Londrina pode ser caracterizado como moderadamente quente, úmido e com chuvas bem distribuídas, mas mais intensas no verão. Essas condições são influenciadas pela altitude da cidade (603 m), sua localização no norte do Paraná e os sistemas meteorológicos predominantes da região.</p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', marginTop: 'auto' }}>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '10pt', color: '#000' }}>
              14
            </div>

          </div>
        </div>

        {/* PAGE 15 - Figura 5 (precipitação Paraná) */}
        <div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', marginBottom: '2mm', marginTop: '10mm' }}>
                <img src="/mapa_parana.png" alt="Mapa de precipitação anual" 
                  style={{ width: '90%', height: '125mm', objectFit: 'contain', border: '1px solid #000', background: '#fff', margin: '0 auto' }} />
              </div>
              <div style={{ fontSize: '8pt', color: '#000', textAlign: 'center', marginBottom: '8mm' }}>Figura 5 - Precipitação anual no Estado do Paraná. Fonte: Instituto Agronômico do Paraná - IAPAR (1999).</div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', marginTop: 'auto' }}>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '10pt', color: '#000' }}>
              15
            </div>

          </div>
        </div>

        {/* PAGE 16 - 8.1.2 Hidrografia */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '12mm' }}>8.1.2. HIDROGRAFIA</div>
          <p style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', textIndent: '15mm', marginBottom: '5mm' }}>No que diz respeito à hidrografia, Londrina está inserida na <span style={{ textDecoration: 'underline' }}>Unidade Hidrográfica</span> do Baixo Tibagi, conforme identificado no mapa das Unidades Hidrográficas do Paraná (Figura 28). Essa unidade abrange a parte inferior da bacia do rio Tibagi, importante sub-bacia do rio Paranapanema, e desempenha papel relevante na disponibilidade hídrica da região norte do estado. A bacia do Baixo Tibagi é composta por diversos afluentes que cortam o município e abastecem não apenas o consumo humano, mas também atividades agrícolas e industriais. A presença desta bacia é estratégica para a gestão de recursos hídricos e controle de impactos ambientais no território municipal.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '4mm', marginBottom: '3mm' }}>
            <div style={{ background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '4mm', minHeight: '40mm' }}>
              <i style={{ fontSize: '18pt', color: '#1a3a6b' }} className="fas fa-map-marker-alt"></i>
              <div style={{ fontSize: '7pt', color: '#666', textAlign: 'center', marginTop: '2px' }}>Localização</div>
            </div>
            <div style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '60mm' }}>
              <i style={{ fontSize: '22pt', color: '#1a3a6b', marginBottom: '4px' }} className="fas fa-water"></i>
              <div style={{ fontSize: '8pt', color: '#555', fontStyle: 'italic', textAlign: 'center' }}>UNIDADES HIDROGRÁFICAS DO PARANÁ – inserir imagem</div>
            </div>
          </div>
          <div style={{ fontSize: '8pt', color: '#444', textAlign: 'center', fontStyle: 'italic' }}>Figura 6 – Unidades Hidrográficas do Paraná [Unidade Hidrográfica do Baixo do Tibagi]. Fonte: INSTITUTO DAS ÁGUAS DO PARANÁ, 2007.</div>
          <Footer pageNum={16} />
        </div>

        {/* PAGE 17 - Unidades Aquíferas */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <p style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#1a3a6b', textIndent: '15mm', marginBottom: '5mm' }}>Referente às unidades aquíferas, Londrina está localizada na <span style={{ textDecoration: 'underline' }}>Unidade Aquífera Serra Geral Norte</span>, conforme representado na Figura 28. Essa unidade ocupa a porção nordeste do Estado do Paraná e está associada predominantemente à presença de rochas vulcânicas da Formação Serra Geral, com ampla distribuição regional.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '4mm', marginBottom: '3mm' }}>
            <div style={{ background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '4mm', minHeight: '35mm' }}>
              <i style={{ fontSize: '16pt', color: '#1a3a6b' }} className="fas fa-map-pin"></i>
              <div style={{ fontSize: '7pt', color: '#666', textAlign: 'center', marginTop: '2px' }}>RAPO / Londrina</div>
            </div>
            <div style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', minHeight: '70mm' }}>
              <i style={{ fontSize: '22pt', color: '#1a3a6b', marginBottom: '4px' }} className="fas fa-layer-group"></i>
              <div style={{ fontSize: '8pt', color: '#555', fontStyle: 'italic', textAlign: 'center' }}>UNIDADES AQUÍFERAS DO PARANÁ – inserir imagem</div>
            </div>
          </div>
          <div style={{ fontSize: '8pt', color: '#444', textAlign: 'center', fontStyle: 'italic' }}>Figura 7 – Unidades Hidrográficas do Paraná (Unidade Hidrográfica do Baixo do Tibagi). Fonte: INSTITUTO DAS ÁGUAS DO PARANÁ, 2007.</div>
          <Footer pageNum={17} />
        </div>

        {/* PAGE 18 - Bacia Cafezal + Figura 8 satellite */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <p style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#1a3a6b', textIndent: '15mm', marginBottom: '6mm' }}>Já a bacia Municipal que abrange o local do empreendimento é a <span style={{ textDecoration: 'underline' }}>Bacia do Ribeirão do Cafezal</span>.</p>
          {satelliteUrl ? (
            <div style={{ marginBottom: '3mm' }}>
              <img src={satelliteUrl} alt="Localização do empreendimento e corpos d'água" crossOrigin="anonymous"
                style={{ width: '100%', height: '110mm', objectFit: 'cover', border: '1px solid #ccc', display: 'block' }} />
            </div>
          ) : (
            <div style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '3mm', height: '110mm', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <i style={{ fontSize: '24pt', color: '#1a3a6b', marginBottom: '4px' }} className="fas fa-satellite"></i>
              <div style={{ fontSize: '8pt', color: '#666' }}>Informe as coordenadas UTM para gerar a imagem de satélite</div>
            </div>
          )}
          <div style={{ fontSize: '8pt', color: '#444', textAlign: 'center', fontStyle: 'italic' }}>Figura 8 – Localização do empreendimento e corpos d'água mais próximos. Fonte: Portal Ambiental da Prefeitura de Londrina – SIGLON.</div>
          <Footer pageNum={18} />
        </div>

        {/* PAGE 19 - 8.1.3 Solo e Relevo + Figura 9 */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '12mm' }}>8.1.3. SOLO E RELEVO</div>
          <p style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', textIndent: '15mm', marginBottom: '4mm' }}>De acordo com o Mapa <span style={{ textDecoration: 'underline' }}>Simplificado</span> de Solos do Estado do Paraná (BHERING et al., 2007), os principais tipos de solos presentes no município de Londrina são os Latossolos, Nitossolos e Neossolos Litólicos. Conforme o Levantamento de Reconhecimento dos Solos do Estado do Paraná (Embrapa Solos, 2007), os solos predominantes na área urbana são o Latossolo (L) e a associação de Nitossolos com Neossolos Litólicos (N + RL).</p>
          <div style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '3mm', height: '72mm', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div style={{ fontSize: '9pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '6px' }}>MAPA SIMPLIFICADO DE SOLOS DO ESTADO DO PARANÁ</div>
            <i style={{ fontSize: '22pt', color: '#888' }} className="fas fa-map"></i>
            <div style={{ fontSize: '8pt', color: '#666', fontStyle: 'italic', marginTop: '4px' }}>inserir imagem</div>
          </div>
          <div style={{ fontSize: '8pt', color: '#444', textAlign: 'center', fontStyle: 'italic', marginBottom: '4mm' }}>Figura 9 – Mapa de Solos do Estado do Paraná. Fonte: (BHERING, et al., 2007).</div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>O Latossolo é um solo profundo, bem drenado, com textura argilosa a muito argilosa e coloração avermelhada. Destaca-se pela alta fertilidade, com elevados teores de nutrientes como cálcio, magnésio, potássio e fósforo. É típico de regiões tropicais, com clima quente e chuvas bem distribuídas ao longo do ano.</p>
            <p style={{ textIndent: '15mm' }}>Os Nitossolos também são profundos, com cor escura e textura argilosa, apresentando boa fertilidade natural, especialmente em nitrogênio e fósforo. Já os Neossolos Litólicos são solos rasos, com textura arenosa e baixa fertilidade, limitando seu uso agrícola</p>
          </div>
          <Footer pageNum={19} />
        </div>

        {/* PAGE 20 - Continuação Solo + Seção 9 Meio Biótico + Fauna */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', marginBottom: '6mm' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>sem manejo adequado.</p>
            <p style={{ textIndent: '15mm' }}>De maneira geral, os solos da região de Londrina são considerados altamente produtivos e amplamente utilizados na agricultura.</p>
          </div>
          <div style={{ width: '100%', height: '2px', background: '#1a3a6b', marginBottom: '6mm' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '4mm' }}>9. DIAGNÓSTICO DO MEIO BIÓTICO</div>
          <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>9.1. Caracterização Da Fauna</div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>A fauna da região de Londrina está inserida no Bioma Mata Atlântica, especificamente na Floresta Estacional Semidecidual (FES), que apresenta grande diversidade de espécies devido à sua dupla estacionalidade climática, com períodos tropicais chuvosos e subtropicais mais secos. Devido ao rápido avanço da agricultura e da urbanização, especialmente a partir do século XX, grande parte da fauna original foi afetada, restando populações reduzidas e fragmentadas em áreas remanescentes, como o Parque Estadual Mata dos Godoy, o Parque Arthur Thomas e a Reserva Indígena do Apucaraninha.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Entre os mamíferos que ainda podem ser encontrados na região destacam-se a onça-parda (Puma concolor), a jaguatirica (Leopardus pardalis), a raposa-do-campo (Cerdocyon thous) e diferentes espécies de tatu, como o tatu-galinha (Dasypus novemcinctus) e o tatu-peba (Euphractus sexcinctus). A avifauna é representada por espécies como a jacutinga (Penelope obscura), o tucano-toco (Ramphastos toco) e o papagaio-verdadeiro (Amazona aestiva). A herpetofauna inclui serpentes como a jararaca (Bothrops jararaca) e lagartos como o teiú (Tupinambis merianae). Nos cursos d'água da região ocorrem peixes nativos como a piracanjuba (Brycon orbignyanus) e o curimbatá (Prochilodus lineatus).</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Com a expansão urbana e a degradação de habitats naturais, algumas espécies adaptaram-se às áreas urbanas, como o gambá-de-orelha-branca (Didelphis albiventris), o cachorro-do-mato (Cynomys ludovicianus), o pombo-doméstico (Columbia livia) e o sabiá-do-campo (Mimus saturninus). Essas espécies convivem com a população urbana, muitas vezes utilizando áreas verdes e parques municipais como refúgio. Segundo a Prefeitura de Londrina, na cidade há três Unidades de Conservação, a Unidade de Conservação Municipal Parque Arthur Thomas, a Unidade de Conservação Parque Estadual Mata dos Godoy e a Unidade de Conservação Parque Ecológico Dr. Daisaku Ikeda.</p>
          </div>
          <Footer pageNum={20} />
        </div>

        {/* PAGE 21 - Fauna cont. + 9.2 Flora + Figura 10 */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', marginBottom: '6mm' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Conforme o IAT, o Parque Municipal Mata dos Godoy é uma das últimas reservas naturais de mata nativa existentes no norte do Paraná, considerada uma Unidade de Conservação Integral. O parque abriga 282 espécies de aves, 65 mamíferos e plantas raras como jacarandá, cabreúva, peroba, guaçatinga e pau-marfim. Já a Unidade de Conservação Parque Ecológico Dr. Daisaku Ikeda que foi criada em novembro de 1999 e inaugurada em setembro de 2000, tem identificado em seu Plano de Manejo mais de 96 espécies de aves, 12 mamíferos, 32 espécies de répteis, além de peixes e anfíbios. O Parque Municipal Arthur Thomas é habitado por uma fauna privilegiada, que inclui espécies como macaco-prego, quati, cutia, paca, teiú, garção, garça, águia-pescadora e tatu-galinha, entre outros animais.</p>
          </div>
          <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>9.2. Caracterização Da Flora</div>
          <p style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#1a3a6b', textIndent: '15mm', marginBottom: '4mm' }}>Em Londrina, a fisionomia vegetal originalmente dominante é a Floresta Estacional Semidecidual, que tem como principal característica o caráter parcialmente decíduo de suas espécies, sendo que de 20 a 50% dos indivíduos do conjunto florestal perdem suas folhas na estação seca (IBGE, 2012).</p>
          <div style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '3mm', height: '70mm', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div style={{ fontSize: '8pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '6px' }}>ESTADO DO PARANÁ – COBERTURA VEGETAL NATIVA</div>
            <i style={{ fontSize: '22pt', color: '#888' }} className="fas fa-tree"></i>
            <div style={{ fontSize: '8pt', color: '#666', fontStyle: 'italic', marginTop: '4px' }}>inserir imagem</div>
          </div>
          <div style={{ fontSize: '8pt', color: '#444', textAlign: 'center', fontStyle: 'italic' }}>Figura 10 – Mapa de vegetação do estado brasileiro do Paraná. Fonte: (IPARDES, 2007).</div>
          <Footer pageNum={21} />
        </div>

        {/* PAGE 22 - Flora cont. */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>A cobertura vegetal da região de Londrina está inserida na <span style={{ color: '#1a3a6b', textDecoration: 'underline' }}>Floresta Estacional Semidecidual (FES)</span>, que integra o Bioma Mata Atlântica. A FES caracteriza-se por sua dupla estacionalidade climática, apresentando períodos tropicais com chuvas intensas no verão, seguidos por estiagens acentuadas, além de uma fase subtropical marcada pelo inverno frio e seco. Essa diversidade climática influencia diretamente a composição e o comportamento vegetativo, com espécies caducifólias que perdem parte das folhas durante o inverno.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Historicamente, a área onde atualmente está localizado o município de Londrina era predominantemente ocupada por mata pluvial tropical e subtropical. No entanto, devido ao intenso avanço da agricultura e à urbanização, especialmente a partir do século XX, grande parte dessa vegetação original foi suprimida, restando apenas fragmentos isolados em áreas de conservação e proteção ambiental. Os principais remanescentes florestais no município são encontrados no Parque Estadual Mata dos Godoy, no Parque Arthur Thomas e na Reserva Indígena do Apucaraninha. Essas áreas preservam a vegetação típica da FES, com espécies arbóreas como o pau-d'alho (Gallesia integrifolia), o cedro-rosa (Cedrela fissilis), o peroba-rosa (Aspidosperma polyneuron), a canafístula (Peltophorum dubium) e o ipê-roxo (Handroanthus heptaphyllus). O sub-bosque apresenta uma composição variada de arbustos, cipós e epífitas, como bromélias e orquídeas.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>De acordo com a Fundação SOS Mata Atlântica e o INPE (2008), Londrina possui aproximadamente 12.026,88 hectares de remanescentes florestais, o que corresponde a cerca de 7% da área total do município, que é de 165.808,92 hectares. Essa vegetação remanescente desempenha papel fundamental na conservação da biodiversidade local, protegendo espécies endêmicas e servindo de corredor ecológico.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Em áreas urbanas e rurais que sofreram intervenção antrópica, a vegetação original foi substituída, principalmente, por espécies exóticas e cultivadas. As árvores nativas que ainda se destacam nesses espaços são o ipê-amarelo (Handroanthus albus), a embaúba (Cecropia spp.), o ingá (Inga spp.) e a aroeira-pimenteira (Schinus terebinthifolia), geralmente integradas a reflorestamentos e áreas verdes urbanas. A preservação desses fragmentos vegetais e a recomposição de áreas degradadas são fundamentais para garantir a manutenção da flora nativa e dos serviços ecossistêmicos que ela proporciona, como regulação hídrica, proteção do solo e manutenção da fauna local.</p>
          </div>
          <Footer pageNum={22} />
        </div>

        {/* PAGE 23 - Seção 10 Diagnóstico Socioeconômico */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ width: '100%', height: '2px', background: '#1a3a6b', marginBottom: '6mm' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '4mm' }}>10. DIAGNÓSTICO DO MEIO SOCIOECONÔMICO</div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>O Município de Londrina apresentou um crescimento econômico e populacional acelerado ao longo de sua história, quando comparado a outras regiões do estado e do país.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Esse desenvolvimento esteve associado principalmente à cultura cafeeira, que encontrou condições favoráveis no solo latossolo vermelho da região, e ao processo de colonização e ocupação do território.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>De acordo com estimativas do IBGE de 2022, a população de Londrina era de 555.965 habitantes, tornando-se a segunda cidade mais populosa do Paraná e a quarta da Região Sul. A densidade demográfica do município é de 336,42 habitantes por quilômetro quadrado. Londrina é considerada um importante polo de desenvolvimento estadual e regional, conectando o Sul ao Sudeste do Brasil, e consolidando-se como centro urbano, econômico, industrial, financeiro, administrativo e cultural do norte do Paraná.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>O Produto Interno Bruto (PIB) de Londrina é composto majoritariamente pelo setor de serviços, seguido pela indústria e agropecuária. O Índice de Desenvolvimento Humano (IDH) do município é de 0,824, ocupando o décimo lugar entre os municípios do estado. Segundo a Secretaria de Planejamento do Município (2022), o complexo industrial de Londrina conta com 2.956 indústrias de diversos setores, destacando-se como importante núcleo produtivo.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>A infraestrutura urbana da cidade é bem desenvolvida, abrangendo serviços públicos essenciais, como abastecimento de água, coleta e tratamento de esgoto, gestão de resíduos sólidos, fornecimento de energia elétrica, sistema de saúde pública e rede de ensino. Londrina conta com hospitais, unidades de saúde, escolas, universidades, biblioteca pública, museus, teatros, cinemas e outros equipamentos culturais, garantindo qualidade de vida aos seus habitantes.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Na área da educação, segundo o IBGE, com base no Censo Educacional 2021 do INEP, Londrina possui 231 pré-escolas, 215 escolas de nível fundamental e 85 escolas de nível médio. Quanto ao ensino superior, o Censo Educacional de 2007 registra 10 instituições presenciais, além de 29 polos de ensino à distância implantados posteriormente.</p>
          </div>
          <Footer pageNum={23} />
        </div>

        {/* PAGE 24 - Socioeconômico cont. + Seção 11 Impactos + AII */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', marginBottom: '6mm' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>A rede de saúde pública inclui 133 unidades atendendo pelo Sistema Único de Saúde (SUS). Segundo o IBGE (2010), 85,2% dos domicílios possuem esgotamento sanitário adequado, 96,3% dos domicílios urbanos estão em vias públicas com arborização, e 83,1% em vias públicas com infraestrutura urbana adequada, incluindo calçamento, pavimentação, meio-fio e bueiro. O sistema viário e de transportes é estruturado, destacando-se as rodovias PR-445 (Celso Garcia Cid) e BR-369, que conectam Londrina a outras cidades da região. O transporte público municipal é realizado por ônibus, atendendo os principais bairros e áreas metropolitanas. Segundo o Plano Diretor de Londrina, a área no entorno do empreendimento apresenta uso diversificado do solo, incluindo áreas residenciais de médio e alto padrão, loteamentos de casas, e estabelecimentos comerciais e de serviços, como lojas, restaurantes e escritórios. Também há usos institucionais, como escolas e unidades de saúde, além de áreas verdes, praças e parques, que oferecem lazer e preservação ambiental. Essa diversificação demonstra a dinamicidade da ocupação territorial em Londrina, onde coexistem atividades residenciais, comerciais, industriais e serviços públicos, formando um espaço urbano multifuncional e integrado.</p>
          </div>
          <div style={{ width: '100%', height: '2px', background: '#1a3a6b', marginBottom: '5mm' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '4mm' }}>11. IDENTIFICAÇÃO E ANÁLISE DOS IMPACTOS AMBIENTAIS</div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', marginBottom: '5mm' }}>
            <p style={{ textIndent: '15mm' }}>A área de influência de um empreendimento corresponde ao espaço territorial que pode ser afetado direta ou indiretamente pelos impactos ambientais decorrentes das fases de planejamento, implantação e operação das atividades. Esses impactos podem ser positivos ou negativos. Delimitar adequadamente essas áreas é essencial para determinar o espaço geográfico que será objeto de levantamento e análise de dados, permitindo a caracterização dos contextos biogeofísicos, socioeconômicos e culturais da região antes da realização das obras. A partir desse diagnóstico, é possível identificar as áreas que serão impactadas pela implantação do empreendimento.</p>
          </div>
          <div style={{ background: '#f0f4ff', border: '1px solid #1a3a6b', borderRadius: '4px', padding: '5mm', marginBottom: '4mm' }}>
            <div style={{ fontSize: '10pt', fontWeight: '900', color: '#1a3a6b', textAlign: 'center', marginBottom: '3mm' }}>ÁREA DE INFLUÊNCIA INDIRETA (AII)</div>
            <p style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>A Área de Influência Indireta compreende os territórios que sofrem impactos menos significativos em comparação com as áreas diretamente afetadas, geralmente localizados no</p>
          </div>
          <Footer pageNum={24} />
        </div>

        {/* PAGE 25 - AII cont. + AID + ADA */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', marginBottom: '5mm' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>entorno da Área de Influência Direta (AID). No meio socioeconômico, a AII corresponde ao território do município de Londrina, que poderá ser beneficiado pelo aumento de oferta de empregos e pela arrecadação tributária decorrente do empreendimento. Para os meios físicos e bióticos, a AII inclui os acessos à propriedade a partir do município de Londrina e sua respectiva faixa de domínio. Portanto, a AII abrange uma área que, embora impactada, sofre efeitos menos significativos do que as áreas diretamente afetadas.</p>
          </div>
          <div style={{ background: '#f0f4ff', border: '1px solid #1a3a6b', borderRadius: '4px', padding: '5mm', marginBottom: '4mm' }}>
            <div style={{ fontSize: '10pt', fontWeight: '900', color: '#1a3a6b', textAlign: 'center', marginBottom: '3mm' }}>ÁREA DE INFLUÊNCIA DIRETA – AID</div>
            <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
              <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Conceitualmente, a Área de Influência Direta (AID) consiste nas áreas geográficas diretamente afetadas pelos impactos decorrentes do empreendimento e corresponde ao espaço territorial contíguo e ampliado da ADA, e como esta, deverá sofrer impactos, tanto positivos quanto negativos. Tais impactos devem ser mitigados, compensados ou potencializados (se positivos) pelo empreendedor.</p>
              <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Assim, a delimitação da AID decorreu dos fenômenos causais de primeira ordem, uma vez que haverá alguma interferência sobre o ambiente local. Deste modo, no concernente aos meios físicos, bióticos e antrópicos, está sendo considerada a área onde será implantado o empreendimento e seu entorno imediato.</p>
              <p style={{ textIndent: '15mm' }}>Neste empreendimento fica delimitada como AID para os meios Físicos e Bióticos e socioeconômicos uma faixa de 500 metros a partir do loteamento.</p>
            </div>
          </div>
          <div style={{ background: '#f0f4ff', border: '1px solid #1a3a6b', borderRadius: '4px', padding: '5mm' }}>
            <div style={{ fontSize: '10pt', fontWeight: '900', color: '#1a3a6b', textAlign: 'center', marginBottom: '3mm' }}>ÁREA DIRETAMENTE AFETADA (ADA)</div>
            <p style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', textIndent: '15mm' }}>A Área Diretamente Afetada compreende a região impactada diretamente pela construção do empreendimento, abrangendo a área necessária para a implantação das estruturas, vias de acesso privativas e demais operações vinculadas exclusivamente à infraestrutura do projeto. A ADA corresponde, portanto, à área total destinada ao empreendimento, incluindo estruturas de apoio e acessos específicos.</p>
          </div>
          <Footer pageNum={25} />
        </div>

        {/* PAGE 26 - Seção 12 Metodologia CONAMA */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '4mm' }}>12. METODOLOGIA EMPREGADA PARA A ANÁLISE E IDENTIFICAÇÃO DOS IMPACTOS AMBIENTAIS</div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Segundo a RESOLUÇÃO CONAMA nº 1, de 23 de janeiro de 1986, que "Dispõe sobre critérios básicos e diretrizes gerais para a avaliação de impacto ambiental". O Conselho Nacional Do Meio Ambiente – CONAMA utilizando a atribuição conferida pelo art. 48 do Decreto nº 88.351, de 1º de junho de 1983, revogado pelo Decreto nº 99.274, de 6 de junho de 1990, para realização da atividade das responsabilidades, dispostas no art. 18 do mesmo decreto, visando a necessidade de se estabelecer definições, responsabilidades, critérios básicos e diretrizes gerais "para uso e implementação da Avaliação de Impacto Ambiental como um dos instrumentos da Política Nacional do Meio Ambiente, resolve:"</p>
            <p style={{ marginLeft: '15mm', marginBottom: '2mm' }}>Art. 1 - Para efeito desta Resolução, considera-se impacto ambiental qualquer alteração das propriedades físicas, químicas e biológicas do meio ambiente, causada por qualquer forma de matéria ou energia resultante das atividades humanas que, direta ou indiretamente, afetam:</p>
            <div style={{ marginLeft: '20mm', marginBottom: '3mm' }}>
              {['A saúde, a segurança e o bem-estar da população;', 'As atividades sociais e econômicas;', 'A biota;', 'As condições estéticas e sanitárias do meio ambiente;', 'A qualidade dos recursos ambientais.'].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '4mm', marginBottom: '1mm' }}>
                  <span style={{ fontWeight: '700', minWidth: '6mm' }}>{['I.', 'II.', 'III.', 'IV.', 'V.'][i]}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>A avaliação dos impactos ambientais da edificação, na fase de instalação e operação será realizada através do procedimento:</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Avaliação do meio biótico, físico e socioeconômico da edificação, levando em consideração as principais etapas e o conhecimento no processo construtivo e de operação, analisando os impactos em cada etapa isoladamente.</p>
            <p style={{ fontWeight: '700', marginBottom: '2mm', marginLeft: '15mm' }}>Metodologia</p>
            <p style={{ textIndent: '15mm', marginBottom: '2mm' }}>Para identificar as etapas do projeto, aspectos ambientais e a avaliação dos impactos foram executadas as seguintes etapas:</p>
            <div style={{ display: 'flex', gap: '3mm', marginLeft: '15mm' }}>
              <span>•</span>
              <span>Realização do levantamento dos aspectos e impactos;</span>
            </div>
          </div>
          <Footer pageNum={26} />
        </div>

        {/* PAGE 27 - Parâmetros de avaliação */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <div style={{ display: 'flex', gap: '3mm', marginLeft: '15mm', marginBottom: '4mm' }}>
              <span>•</span>
              <span>Definição da classificação dos impactos através da construção da planilha de aspectos e impactos;</span>
            </div>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Para a avaliação dos impactos ambientais os aspectos físicos, bióticos e socioeconômicos, foram definidos onde finalmente a listagem dos impactos foi relacionada, definindo os parâmetros para análise de tais impactos.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Os parâmetros adotados serão os seguintes:</p>
            {[
              { letra: 'A.', titulo: 'Natureza:', texto: 'identifica e qualifica o tipo de impacto, se é POSITIVO, NEGATIVO ou NEUTRO.' },
              { letra: 'B.', titulo: 'Abrangência:', texto: 'Indica os impactos cujos efeitos se fazem sentir localmente (LOCAL) ou que podem afetar áreas geográficas mais abrangentes, caracterizando-se como impactos regionais (REGIONAL). Considerou-se como efeito local àquele que se restringe à Área Diretamente Afetada do Empreendimento e, regional, aquele que se reflete na Área de Influência Direta.' },
              { letra: 'C.', titulo: 'Meio:', texto: 'identifica em qual aspecto o impacto tem efeito (FÍSICO, BIÓTICO e SOCIOECONÔMICO).' },
              { letra: 'D.', titulo: 'Forma:', texto: 'indica como o impacto se manifesta, se é impacto DIRETA ou INDIRETA.' },
              { letra: 'E.', titulo: 'Magnitude:', texto: 'refere-se à intensidade e significância do impacto sobre a área afetada, GRANDE, MÉDIA ou PEQUENA.' },
              { letra: 'F.', titulo: 'Temporalidade:', texto: 'Diferencia os impactos segundo ao prazo após a ação impactante CURTO PRAZO, MÉDIO PRAZO ou LONGO PRAZO' },
              { letra: 'G.', titulo: 'Fase de ocorrência:', texto: 'Indica em que fase do empreendimento o impacto se manifesta, podendo ser nas fases de PROJETO, INSTALAÇÃO e/ou OPERAÇÃO.' },
              { letra: 'H.', titulo: 'Duração:', texto: 'Critério que indica o tempo de duração do impacto, podendo ser PERMANENTE (ou seja, a instalação do empreendimento e impacto sempre agirá), TEMPORÁRIO (passado algum tempo o impacto desaparecerá) ou CÍCLICO (o impacto agirá de tempos em tempos).' },
              { letra: 'I.', titulo: 'Reversibilidade:', texto: 'classifica os impactos quanto à possibilidade de ser' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginBottom: '2mm', marginLeft: '15mm' }}>
                <span style={{ fontWeight: '700', minWidth: '8mm' }}>{p.letra}</span>
                <span><span style={{ textDecoration: 'underline', fontWeight: '700' }}>{p.titulo}</span> {p.texto}</span>
              </div>
            ))}
          </div>
          <Footer pageNum={27} />
        </div>

        {/* PAGE 28 - Parâmetros cont. + texto final metodologia */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            {[
              { letra: '', titulo: '', texto: 'REVERSÍVEIS ou IRREVERSÍVEIS. Permite identificar que impactos poderão ser integralmente reversíveis a partir da implementação de uma ação de reversibilidade ou poderão apenas ser mitigados ou compensados.' },
              { letra: 'J.', titulo: 'Probabilidade:', texto: 'A probabilidade ou frequência de um impacto será ALTA se sua ocorrência for quase certa e constante ao longo de toda a atividade, MÉDIA se sua ocorrência for intermitente e BAIXA se for quase improvável que ele ocorra.' },
              { letra: 'K.', titulo: 'Controle:', texto: 'Identifica quais medidas serão tomadas para cada impacto, se será MITIGADO (ação que tem como objetivo reduzir os efeitos de um impacto negativo), CONTROLADO (ação que visa controlar e monitorar os possíveis impactos e verificar a eficácia das demais medidas), COMPENSADO (ação que objetiva compensar, através de melhorias em outro local, um impacto ambiental negativo importante e não mitigável), POTENCIALIZADO (ação que tem como objetivo aumentar os efeitos de um impacto positivo).' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginBottom: '3mm', marginLeft: '15mm' }}>
                {p.letra && <span style={{ fontWeight: '700', minWidth: '8mm' }}>{p.letra}</span>}
                <span>{p.titulo && <span style={{ textDecoration: 'underline', fontWeight: '700' }}>{p.titulo} </span>}{p.texto}</span>
              </div>
            ))}
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>A metodologia adotada na elaboração deste RAP foi estruturada com o objetivo de atender diretamente ao solicitado pelo órgão ambiental competente (SEMA – Secretaria Municipal do Ambiente), assim como atender à legislação, em especial os princípios e objetivos expressos nos termos, da Resolução SEDEST Nº 050/2022 e de toda a legislação pertinente nas esferas federal, estadual e municipal.</p>
          </div>
          <Footer pageNum={28} />
        </div>

        {/* PAGE 29 - Seção 13 Impactos Fase Instalação + 13.1 Ruídos */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ width: '100%', height: '2px', background: '#1a3a6b', marginBottom: '5mm' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '4mm' }}>13. IDENTIFICAÇÃO E AVALIAÇÃO DOS IMPACTOS DURANTE A FASE DE INSTALAÇÃO DO EMPREENDIMENTO</div>
          <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>13.1. Interferências e transtornos à população: emissões atmosféricas, ruídos e tráfego de máquinas</div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Durante a fase de implantação do empreendimento, haverá aumento do fluxo de veículos pesados, movimentação de solo e utilização de equipamentos que podem gerar ruídos e poeira, afetando a população do entorno.</p>
            <p style={{ marginBottom: '2mm' }}>Impactos Identificados:</p>
            {['Ruídos e poluição sonora','Efeito: Negativo','Natureza: Direta','Periodicidade: Temporária','Reversibilidade: Reversível','Magnitude: Média','Abrangência: Local','Probabilidade: Média'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}>
                <span>•</span><span>{it}</span>
              </div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas Mitigadoras:</p>
            <p style={{ textIndent: '10mm', marginBottom: '3mm' }}>Respeitar horários de trabalho (08h às 18h); controle de ruídos dos equipamentos; sinalização de vias; evitar tráfego em horários de pico; uso de EPIs; planejamento de rotas.</p>
            <p style={{ fontWeight: '700', marginBottom: '1mm' }}>Medidas recomendadas:</p>
            <p style={{ textIndent: '10mm' }}>Planejar antecipadamente os transportes e trajetos, em função do porte dos equipamentos/veículos pesados e do fluxo do tráfego, para os acessos a serem utilizados de forma a possibilitar as manobras com o máximo de segurança e rapidez. Implantação de sinalização adequada e redutores de velocidade, principalmente nas proximidades de escolas, igreja e postos de saúde. No caso da necessidade de uma eventual alteração temporária do tráfego, deverá ser estabelecido contato com os órgãos responsáveis. Promover esclarecimentos, caso necessário, através de Programa de Comunicação e Educação Ambiental, sobre as ações de mão de obra e de equipamentos de forma a minimizar as perturbações no cotidiano das populações residentes próximas aos acessos que serão utilizados. Seleção de trabalhadores residentes em Londrina pode ajudar a diminuir o fluxo de</p>
          </div>
          <Footer pageNum={29} />
        </div>

        {/* PAGE 30 - 13.1 cont. + 13.2 Poeira */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '4mm' }}>veículos dos trabalhadores, pois favoreceria o deslocamento por outros meios de transporte (ônibus, bicicleta etc.). Controlar os ruídos a serem emitidos pelos equipamentos utilizados na obra, conforme especificado pelo fabricante e obedecendo às normas brasileiras. Planejar o horário de transporte do pessoal, materiais e equipamentos, evitando-se as horas de pico e noturno, para não perturbar o sossego das comunidades próximas. Utilizar equipamento de proteção individual (EPI) — botas, protetores auriculares, luvas, capacetes etc., pelos funcionários da obra.</p>
            <div style={{ width: '100%', height: '1px', background: '#ddd', marginBottom: '4mm' }}></div>
            <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>13.2. Emissão de poeira e poluentes atmosférico</div>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>A formação de nuvens de poeira formada pela passagem de máquinas sobre o solo seco pode promover a poluição do ar nas áreas de influência do empreendimento.</p>
            {['Efeito: Negativo','Natureza: Direta','Periodicidade: Temporária','Reversibilidade: Reversível','Magnitude: Média','Abrangência: Local','Probabilidade: Média'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}>
                <span>•</span><span>{it}</span>
              </div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas Mitigadoras:</p>
            <p style={{ textIndent: '10mm', marginBottom: '3mm' }}>Cobrir caçambas com lona; umidificação constante do solo; manutenção e regulagem de máquinas; monitoramento das emissões.</p>
            <p style={{ fontWeight: '700', marginBottom: '1mm' }}>Medidas Mitigadoras:</p>
            <p style={{ textIndent: '10mm' }}>Manter as caçambas dos veículos cobertas com lona durante o transporte de material e regulagem das descargas do sistema de combustão dos veículos de trabalho. Durante a fase das obras serão geradas emissões provenientes de poeiras originadas nas fases construtivas (empréstimos, bota-foras e sedimentos de escavação). Para diminuir a quantidade de emissões geradas, as máquinas e equipamentos deverão operar dentro das especificações técnicas adequadas, com monitoramento frequente. Já a quantidade de poeira levantada poderá ser reduzida através da constante umidificação do solo com jatos de água.</p>
          </div>
          <Footer pageNum={30} />
        </div>

        {/* PAGE 31 - 13.3 Tráfego de máquinas + 13.4 Terraplanagem início */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>13.3. Tráfego de máquinas</div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Na fase de implantação da edificação haverá um fluxo maior de veículos, geralmente pesados de grande porte, que irão atender aos serviços exigidos na obra, como terraplanagem, implantação de infraestrutura básica e a construção das residências, sendo que este último tem o caráter menos intenso e mais difuso ao longo dos anos.</p>
            {['Efeito: Negativo','Natureza: Direta','Periodicidade: Temporária','Reversibilidade: Reversível','Magnitude: Média','Abrangência: Local','Probabilidade: Baixa'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}><span>•</span><span>{it}</span></div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas recomendadas:</p>
            <p style={{ textIndent: '10mm', marginBottom: '5mm' }}>Planejar antecipadamente os transportes e trajetos, em função do porte dos equipamentos/veículos pesados e do fluxo do tráfego, para os acessos a serem utilizados de forma a possibilitar as manobras com o máximo de segurança e rapidez. Implantação de sinalização adequada e redutores de velocidade, principalmente nas proximidades de escolas, igreja e postos de saúde. No caso da necessidade de uma eventual alteração temporária do tráfego, deverá ser estabelecido contato com os órgãos responsáveis. Promover esclarecimentos através de Programa de Comunicação e Educação Ambiental, sobre as ações de mão de obra e de equipamentos de forma a minimizar perturbações no cotidiano da comunidade residente próxima ao acesso que serão utilizados. Controlar os ruídos a serem emitidos pelos equipamentos utilizados na obra, conforme especificado pelo fabricante e obedecendo às normas brasileiras. Planejar o horário de transporte do pessoal, materiais e equipamentos, evitando-se as horas de pico e noturno, para não perturbar o sossego das comunidades próximas.</p>
            <div style={{ width: '100%', height: '1px', background: '#ddd', marginBottom: '4mm' }}></div>
            <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>13.4. Impactos Resultantes De Obras De Terraplanagem</div>
            <p style={{ textIndent: '15mm' }}>Durante as obras de implantação do empreendimento (limpeza de terreno,</p>
          </div>
          <Footer pageNum={31} />
        </div>

        {/* PAGE 32 - 13.4 cont. + 13.5 Impermeabilização início */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>terraplanagem, obras auxiliares, vias de acesso e áreas de apoio) ocorrerão alterações no ambiente natural e exposição do solo superficial, deixando a superfície da ADA mais vulnerável à ação erosiva das águas pluviais. Tal situação poderá favorecer o surgimento de condições propícias ao desenvolvimento de processos erosivos, em função do escoamento concentrado ou pela intensificação dos processos já existentes.</p>
            {['Efeito: Negativo','Natureza: Direta','Periodicidade: Temporária','Reversibilidade: Reversível','Magnitude: Média','Abrangência: Local','Probabilidade: Média'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}><span>•</span><span>{it}</span></div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas Mitigadoras:</p>
            <p style={{ textIndent: '10mm', marginBottom: '5mm' }}>Estudo prévio do solo e do relevo, identificando áreas mais suscetíveis à erosão. Com base nesse diagnóstico, implementar a técnica de terraplanagem em etapas, se necessário, evitando a remoção da vegetação em grandes áreas de uma só vez para preservar a cobertura do solo, que atua como uma barreira natural contra a erosão. A utilização de práticas de drenagem adequadas é outra medida importante. A instalação de sistemas de drenagem superficial e subterrânea pode ajudar a controlar e direcionar o escoamento da água da chuva, reduzindo a erosão causada pelo escoamento superficial. Além disso, a construção de terraços ou taludes em áreas inclinadas pode aumentar a retenção de água e diminuir a velocidade do escoamento, auxiliando na estabilização do solo.</p>
            <div style={{ width: '100%', height: '1px', background: '#ddd', marginBottom: '4mm' }}></div>
            <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>13.5. Impactos Decorrentes Da Impermeabilização Do Solo</div>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Devido à alteração do uso do solo, para a edificação, haverá menos áreas permeáveis, devido às construções civis, compactação do solo e do arruamento.</p>
            {['Natureza: NEGATIVA','Abrangência: LOCAL','Meio: FÍSICO','Forma: DIRETA'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}><span>•</span><span>{it}</span></div>
            ))}
          </div>
          <Footer pageNum={32} />
        </div>

        {/* PAGE 33 - 13.5 cont. + 13.6 Patrimônio + Seção 14 início + 14.1 */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            {['Magnitude: MÉDIA','Temporalidade: LONGO PRAZO','Fase de ocorrência: INSTALAÇÃO','Duração: PERMANENTE','Reversibilidade: IRREVERSÍVEL','Probabilidade: ALTA','Controle: MITIGADO.'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}><span>•</span><span>{it}</span></div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas Mitigadoras:</p>
            <p style={{ textIndent: '10mm', marginBottom: '5mm' }}>Projetar e dimensionar sistema de drenagem adequada de acordo com métodos conhecidos, aperfeiçoar, detalhar levantamentos topográficos.</p>
            <div style={{ width: '100%', height: '1px', background: '#ddd', marginBottom: '4mm' }}></div>
            <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>13.6. Proteção ao patrimônio histórico e paisagístico</div>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Não foram identificados bens tombados ou áreas com relevância histórico-cultural direta na área do empreendimento. No entanto, a paisagem local pode ser afetada pela implantação.</p>
            {['Efeito: Negativo','Natureza: Direta','Periodicidade: Permanente','Reversibilidade: Reversível','Magnitude: Pequena','Abrangência: Local','Probabilidade: Baixa'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}><span>•</span><span>{it}</span></div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas Mitigadoras:</p>
            <p style={{ textIndent: '10mm', marginBottom: '5mm' }}>Manutenção de áreas verdes e visuais relevantes; integração da arborização ao paisagismo urbano; comunicação ao IPHAN caso haja achados arqueológicos durante as obras.</p>
            <div style={{ width: '100%', height: '2px', background: '#1a3a6b', marginBottom: '4mm' }}></div>
            <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '3mm' }}>14. IDENTIFICAÇÃO E AVALIAÇÃO DOS IMPACTOS DURANTE A FASE DE OCUPAÇÃO DO EMPREENDIMENTO</div>
            <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '2mm', marginLeft: '6mm' }}>14.1. Mitigação dos impactos referentes ao incremento de população</div>
          </div>
          <Footer pageNum={33} />
        </div>

        {/* PAGE 34 - 14.1 cont. + 14.2 Demanda serviços */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>A ocupação do empreendimento implicará no acréscimo populacional na região, o que pode gerar sobrecarga nas infraestruturas e serviços públicos, caso não haja planejamento adequado.</p>
            {['Efeito: Negativo','Natureza: Direto','Periodicidade: Permanente','Reversibilidade: Irreversível','Magnitude: Grande','Abrangência: Regional','Probabilidade: Alta'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}><span>•</span><span>{it}</span></div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas Mitigadoras:</p>
            <p style={{ textIndent: '10mm', marginBottom: '5mm' }}>Previsão de infraestrutura proporcional ao adensamento, com ampliação de sistemas de abastecimento de água, esgotamento sanitário, transporte, segurança, educação e lazer. Adoção de planejamento urbano integrado e incentivo à ocupação ordenada.</p>
            <div style={{ width: '100%', height: '1px', background: '#ddd', marginBottom: '4mm' }}></div>
            <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>14.2. Estimativa do aumento da demanda por serviços públicos de educação, saúde, segurança e transporte coletivo</div>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Com base na densidade populacional estimada para o uso residencial, haverá aumento da demanda por serviços públicos essenciais, exigindo expansão e adequação da rede pública municipal.</p>
            {['Efeito: Negativo','Natureza: Direto','Periodicidade: Permanente','Reversibilidade: Irreversível','Magnitude: Grande','Abrangência: Regional','Probabilidade: Alta'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}><span>•</span><span>{it}</span></div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas Mitigadoras:</p>
            <p style={{ textIndent: '10mm' }}>Elaboração de diagnóstico da capacidade atual dos serviços</p>
          </div>
          <Footer pageNum={34} />
        </div>

        {/* PAGE 35 - 14.2 cont. + 14.3 Efluentes + 14.4 Resíduos início */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '5mm' }}>públicos e planejamento para sua ampliação, incluindo parcerias com o poder público. Priorização de investimentos em transporte coletivo, postos de saúde, escolas e segurança comunitária.</p>
            <div style={{ width: '100%', height: '1px', background: '#ddd', marginBottom: '4mm' }}></div>
            <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>14.3. Tratamento E Disposição Final De Efluentes Sanitários Do Empreendimento</div>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Uma vez constatada a viabilidade de extensão da rede de coleta de esgoto do empreendimento à do município, o atendimento ao saneamento básico proporciona melhoria nas condições sanitárias e ambientais do entorno, evitando a contaminação do solo e dispersão de doenças.</p>
            {['Efeito: Positivo','Natureza: Direto','Periodicidade: Permanente','Reversibilidade: Reversível','Magnitude: Grande','Abrangência: Regional','Probabilidade: Alta'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}><span>•</span><span>{it}</span></div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas Potencializadoras:</p>
            <p style={{ textIndent: '10mm', marginBottom: '5mm' }}>Realizar programas de educação ambiental voltados aos moradores, com foco no uso correto da rede de esgoto e no descarte adequado de resíduos, evitando obstruções e danos à infraestrutura sanitária. Implantar sistemas internos de reuso de águas cinzas, se possível, provenientes de chuveiros, pias e máquinas de lavar, com reaproveitamento para fins não potáveis, como irrigação de jardins e limpeza de áreas comuns. Monitorar continuamente as instalações internas do sistema de esgotamento sanitário, por meio de vistorias periódicas e adotar um plano de manutenção preventiva e corretiva. Incentivar o uso de tecnologias sustentáveis, como torneiras com aeradores, válvulas de descarga com duplo acionamento e dispositivos economizadores de água.</p>
            <div style={{ width: '100%', height: '1px', background: '#ddd', marginBottom: '4mm' }}></div>
            <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>14.4. Coleta E Destino Final De Resíduos Sólidos Urbanos</div>
            <p style={{ textIndent: '15mm' }}>A integração à rede de coleta municipal viabiliza a gestão adequada dos resíduos,</p>
          </div>
          <Footer pageNum={35} />
        </div>

        {/* PAGE 36 - 14.4 cont. Resíduos + 14.5 Arborização */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>contribuindo para a saúde pública, limpeza urbana e proteção ambiental.</p>
            {['Efeito: Positivo','Natureza: Direto','Periodicidade: Permanente','Reversibilidade: Reversível','Magnitude: Média','Abrangência: Local','Probabilidade: Alta'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}><span>•</span><span>{it}</span></div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas Potencializadoras:</p>
            <p style={{ textIndent: '10mm', marginBottom: '5mm' }}>Realizar campanhas internas de educação ambiental voltadas à separação adequada dos resíduos, promovendo a consciência sobre a responsabilidade compartilhada na gestão dos resíduos sólidos. Implantar pontos de coleta seletiva. Estabelecer rotinas de coleta interna compatíveis com a frequência da coleta pública municipal, de modo a evitar acúmulo de resíduos e minimizar riscos à saúde pública e ao bem-estar.</p>
            <div style={{ width: '100%', height: '1px', background: '#ddd', marginBottom: '4mm' }}></div>
            <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>14.5. Arborização Do Sistema Viário E Espaços Públicos</div>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Com o plantio de indivíduos arbóreos através da implantação da arborização do sistema viário e espaços públicos na área do futuro empreendimento haverá um aumento considerável na cobertura vegetal no local do empreendimento. Ainda, através da recuperação e revegetação das áreas degradadas, haverá um ganho ambiental significativo decorrente da preservação e manutenção das áreas verdes no entorno do empreendimento.</p>
            {['Efeito: Positivo','Natureza: Direto','Periodicidade: Permanente','Reversibilidade: Reversível','Magnitude: Grande','Abrangência: Local','Probabilidade: Alta'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}><span>•</span><span>{it}</span></div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas Potencializadoras:</p>
            <p style={{ textIndent: '10mm' }}>Priorizar o plantio de árvores nativas adaptadas à região,</p>
          </div>
          <Footer pageNum={36} />
        </div>

        {/* PAGE 37 - 14.5 cont. + 14.6 Recuperação áreas */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '5mm' }}>que requerem menos cuidados e contribuem para a biodiversidade local. Definir um espaçamento adequado entre as árvores, considerando seu crescimento e a necessidade de iluminação e ventilação para os espaços urbanos. Promover campanhas de sensibilização junto à comunidade sobre a importância da arborização e como cuidar das árvores plantadas. Estabelecer um plano de manutenção que inclua podas, controle de pragas e doenças, e monitoramento da saúde das árvores, garantindo seu crescimento saudável. Implementar projetos de replantio com espécies nativas nas áreas ao redor das nascentes e cursos d'água que foram afetados por atividades de parcelamento e edificações.</p>
            <div style={{ width: '100%', height: '1px', background: '#ddd', marginBottom: '4mm' }}></div>
            <div style={{ fontSize: '11pt', fontWeight: '700', color: '#1a3a6b', marginBottom: '3mm', marginLeft: '6mm' }}>14.6. Recuperação e revegetação das áreas degradadas e comprometidas com a necessidade de preservação</div>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>O empreendimento prevê a recuperação ambiental de áreas afetadas por usos anteriores, com revegetação e proteção de áreas sensíveis, contribuindo para a conservação dos recursos naturais.</p>
            {['Efeito: Positivo','Natureza: Direto','Periodicidade: Permanente','Reversibilidade: Reversível','Magnitude: Média','Abrangência: Local','Probabilidade: Alta'].map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginLeft: '10mm', marginBottom: '1mm' }}><span>•</span><span>{it}</span></div>
            ))}
            <p style={{ fontWeight: '700', marginTop: '3mm', marginBottom: '1mm' }}>Medidas Potencializadoras:</p>
            <p style={{ textIndent: '10mm' }}>Execução de projetos de restauração ecológica, com uso de espécies nativas em áreas de preservação permanente (APPs) ou sujeitas a intervenções, além de acompanhamento técnico para garantir a efetividade das ações.</p>
          </div>
          <Footer pageNum={37} />
        </div>

        {/* PAGE 38 - Seção 15 Quadro de Medidas (tabela parte 1) */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ width: '100%', height: '2px', background: '#1a3a6b', marginBottom: '5mm' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '3mm' }}>15. QUADRO DE MEDIDAS MITIGADORAS E COMPENSATÓRIAS</div>
          <p style={{ fontSize: '10pt', lineHeight: '1.6', color: '#000', textAlign: 'justify', textIndent: '15mm', marginBottom: '5mm' }}>Com base na avaliação dos impactos ambientais relacionados e para melhor descrição de cada item, as medidas mitigadoras foram relacionadas nos itens anteriores.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
            <thead>
              <tr style={{ background: '#1a3a6b', color: 'white' }}>
                {['Impacto Ambiental','Medida Mitigadora/Compensatória','Componente Ambiental Afetado','Fase de Implementação','Caráter','Eficácia','Responsável pela Implementação'].map((h, i) => (
                  <th key={i} style={{ padding: '3px 4px', textAlign: 'center', border: '1px solid #aaa', fontSize: '7.5pt' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Emissão de ruídos e poluição sonora','Restrição de horários, manutenção de equipamentos, sinalização e comunicação com a população','Físico','Instalação','Corretivo','Alta','Construtora /Empreendedor'],
                ['Emissão de poeira e poluentes atmosféricos','Umidificação do solo, cobertura de caminhões, manutenção de máquinas','Físico','Instalação','Corretivo','Alta','Construtora /Empreendedor'],
                ['Transtornos pelo tráfego de máquinas','Planejamento de rotas, controle de horários e sinalização','Socioeconômico','Instalação','Preventivo','Média','Construtora /Empreendedor'],
                ['Erosão e instabilidade do solo (terraplanagem)','Drenagem adequada, obras em etapas, proteção do solo','Físico','Instalação','Preventivo','Alta','Construtora /Empreendedor'],
                ['Impermeabilização do solo','Uso de pavimento permeável, sistema de drenagem pluvial eficiente','Físico','Instalação e Ocupação','Preventivo','Alta','Construtora /Empreendedor'],
                ['Lançamento inadequado de águas pluviais','Instalação de dissipadores, bacias de contenção e reuso de águas','Físico','Instalação e Ocupação','Preventivo','Alta','Construtora /Empreendedor'],
                ['Aumento da demanda por serviços públicos','Planejamento urbano integrado e articulação com o poder público para ampliação da oferta de serviços','Socioeconômico','Ocupação','Corretivo','Média','Município /Empreendedor'],
                ['Geração de efluentes sanitários','Conexão com rede pública e uso de tecnologias sustentáveis','Físico','Ocupação','Preventivo','Alta','Empreendedor /Concessionária de Saneamento'],
              ].map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f0f4ff' : 'white' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '3px 4px', border: '1px solid #ccc', textAlign: 'center', color: j === 2 ? '#1a3a6b' : '#000', fontWeight: j === 2 ? '700' : 'normal', fontSize: '7.5pt' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Footer pageNum={38} />
        </div>

        {/* PAGE 39 - Quadro Medidas (tabela parte 2) */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
            <thead>
              <tr style={{ background: '#1a3a6b', color: 'white' }}>
                {['Impacto Ambiental','Medida Mitigadora/Compensatória','Componente Ambiental Afetado','Fase de Implementação','Caráter','Eficácia','Responsável pela Implementação'].map((h, i) => (
                  <th key={i} style={{ padding: '3px 4px', textAlign: 'center', border: '1px solid #aaa', fontSize: '7.5pt' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Geração de resíduos sólidos urbanos','Implantação de coleta seletiva e educação ambiental','Físico /Socioeconômico','Ocupação','Preventivo','Alta','Empreendedor /Prefeitura Municipal'],
                ['Alteração paisagística e perda da vegetação local','Arborização urbana com espécies nativas e integração paisagística','Biótico','Instalação e Ocupação','Compensatório','Alta','Empreendedor /Construtora'],
                ['Destinação inadequada de resíduos da obra','Plano de Gerenciamento de Resíduos da Construção Civil (PGRCC)','Físico','Instalação','Preventivo','Alta','Construtora'],
                ['Potencial contaminação por efluentes no canteiro de obras','Banheiros químicos com manutenção regular e sistema de coleta adequado','Físico','Instalação','Corretivo','Alta','Construtora'],
              ].map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f0f4ff' : 'white' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '3px 4px', border: '1px solid #ccc', textAlign: 'center', color: j === 2 ? '#1a3a6b' : '#000', fontWeight: j === 2 ? '700' : 'normal', fontSize: '7.5pt' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Footer pageNum={39} />
        </div>

        {/* PAGE 40 - Seção 16 Legislação + Seção 17 Conclusões */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ width: '100%', height: '2px', background: '#1a3a6b', marginBottom: '5mm' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '4mm' }}>16. LEGISLAÇÃO APLICÁVEL</div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000', marginBottom: '6mm' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Instrução Normativa nº 21, de 25 de Abril de 2025 - Estabelece definições, critérios, diretrizes e procedimentos para o licenciamento ambiental de empreendimentos imobiliários urbanos no território paranaense.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Resolução CONAMA nº 237/1997 – Dispõe sobre a revisão e complementação dos procedimentos e critérios utilizados para o licenciamento ambiental.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Lei Municipal Nº 11.468/2011 - Institui o código de posturas do município de Londrina.</p>
          </div>
          <div style={{ width: '100%', height: '2px', background: '#1a3a6b', marginBottom: '5mm' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '4mm' }}>17. CONCLUSÕES</div>
          <div style={{ fontSize: '10pt', lineHeight: '1.6', textAlign: 'justify', color: '#000' }}>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Do ponto de vista ambiental, constata-se que a área onde será implantado o empreendimento possui histórico de uso agrícola, caracterizando-se como uma área rural já submetida a atividades antrópicas.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>Considerando que a natureza do empreendimento envolve o parcelamento do solo e posterior edificação para fins residenciais, é esperado que ocorram alterações nas características ambientais da área. Contudo, tais mudanças são passíveis de controle e compensação, desde que devidamente planejadas e executadas.</p>
            <p style={{ textIndent: '15mm', marginBottom: '3mm' }}>O projeto propõe a adoção de uma infraestrutura adequada, aliada à implementação de medidas mitigadoras e compensatórias compatíveis com os impactos diagnosticados, bem como o cumprimento rigoroso da legislação ambiental vigente.</p>
            <p style={{ textIndent: '15mm' }}>Dessa forma, conclui-se pela viabilidade técnica, ambiental e sociocultural do empreendimento, desde que observadas as diretrizes propostas neste estudo e cumpridas integralmente as condicionantes do processo de licenciamento ambiental.</p>
          </div>
          <Footer pageNum={40} />
        </div>

        {/* PAGE 41 - Seção 18 Referências Bibliográficas parte 1 */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ width: '100%', height: '2px', background: '#1a3a6b', marginBottom: '5mm' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '6mm' }}>18. REFERÊNCIAS BIBLIOGRÁFICAS</div>
          <div style={{ fontSize: '10pt', lineHeight: '1.8', textAlign: 'justify', color: '#000' }}>
            {[
              { bold: 'BHERING, S. B.; SANTOS, H. G.; MANZATTO, C. V.; BOGNOLA, I.; FASOLO CARVALHO, A. P.; POTTER, O.; AGLIO, M. L. D.; SILVA, J. S.; CHAFFIN, C. E.; CARVALHO JUNIOR, W.', rest: ' Mapa de Solos do Estado do Paraná. 2007. Disponível em: <http://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/339505>. Acesso em: 15/04/2025.' },
              { bold: 'CAMPOS, J. B.; SOUZA, M. C. Vegetação. In: VAZZOLER, A. E. A. M.; AGOSTINHO, A. A.; HAHN, N. S. (ed.). A planície de inundação do alto rio Paraná: aspectos físicos, biológicos e socioeconômicos.', rest: ' Maringá: EDUEM/Nupélia, 1997. p. 331-342.' },
              { bold: 'CLIMA DATA.', rest: ' Dados Climáticos para cidades Mundiais. Disponível em:< https://pt.climate-data.org/>. Acesso em: 15/04/2025.' },
              { bold: 'FUNDAÇÃO SOS MATA ATLÂNTICA;', rest: ' Instituto Nacional de Pesquisas Espaciais – INPE. Atlas dos remanescentes florestais da mata atlântica – período 2000- 2005. São Paulo, 2009' },
              { bold: 'INFOTECA-E –', rest: ' Repositório de informação tecnológica da EMBRAPA - Mapa de Solos do Estado do Paraná. – Disponível em: <https://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/339505>. Rio de Janeiro, 2017. Acesso em: 15/03/2025.' },
              { bold: 'Instituto Brasileiro de Geografia e Estatística – IBGE.', rest: ' Disponível em: <https://cidades.ibge.gov.br/brasil/panorama>. Acesso em: 15/03/2025.' },
              { bold: 'Instituto de Desenvolvimento Rural do Paraná – IDPR.', rest: ' Atlas Climáticos. Disponível em: <https://www.idrparana.pr.gov.br/Pagina/Atlas-Climatico>. Acesso em 16/03/2025.' },
              { bold: 'Instituto Paranaense de Desenvolvimento Econômico e Social - IPARDES.', rest: ' Caderno Estatístico do Município de Londrina. 2023. Disponível em:' },
            ].map((ref, i) => (
              <p key={i} style={{ marginBottom: '4mm', paddingLeft: '15mm', textIndent: '-15mm' }}>
                <span style={{ fontWeight: '700' }}>{ref.bold}</span>{ref.rest}
              </p>
            ))}
          </div>
          <Footer pageNum={41} />
        </div>

        {/* PAGE 42 - Referências cont. */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ fontSize: '10pt', lineHeight: '1.8', textAlign: 'justify', color: '#000' }}>
            {[
              { bold: '', rest: '<http://www.ipardes.gov.br/cadernos/MontaCadPdf1.php?Municipio=86000&btOk=ok>. Acesso em: 15/04/2025.' },
              { bold: 'MINISTÉRIO DO MEIO AMBIENTE.', rest: ' Mata Atlântica. – Disponível em: < https://antigo.mma.gov.br/biomas/mata-atl%C3%A2ntica_emdesenvolvimento.html>. Acesso em: 15/04/2025.' },
              { bold: 'Secretária Municipal De Planejamento, Orçamento E Tecnologia.', rest: ' Perfil De Londrina 2023 – Ano Base 2022. Disponível em: < https://portal.londrina.pr.gov.br/perfil-de-londrina/perfil-de-londrina-2023>. Acesso em: 15/04/2025.' },
              { bold: 'SUDERHSA.', rest: ' - Unidades Hidrográficas do Paraná – Disponível em: <http://www.iat.pr.gov.br/sites/agua-terra/arquivos_restritos/files/documento/2020-07/unidades_hidrograficas_a4.pdf>. 2007. Acesso em: 15/04/2025.' },
              { bold: 'TOFFOLO, Adriano.', rest: ' PROPOSTA PARA CONEXÃO DE TRÊS FRAGMENTOS FLORESTAIS NA REGIÃO SUL DO MUNICÍPIO DE LONDRINA-PR, ATRAVÉS DE TÉCNICAS DE GEOPROCESSAMENTO. 2009. 26 pg. Monografia (Bacharel em Geografia). Universidade Estadual de Londrina. Londrina, Paraná.' },
            ].map((ref, i) => (
              <p key={i} style={{ marginBottom: '4mm', paddingLeft: '15mm', textIndent: '-15mm' }}>
                {ref.bold && <span style={{ fontWeight: '700' }}>{ref.bold}</span>}{ref.rest}
              </p>
            ))}
          </div>
          <Footer pageNum={42} />
        </div>

        {/* PAGE 43 - Seção 19 Responsáveis */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ width: '100%', height: '2px', background: '#1a3a6b', marginBottom: '5mm' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '6mm' }}>19. RESPONSÁVEIS</div>
          {/* Box empresa */}
          <div style={{ border: '1px solid #1a3a6b', borderRadius: '4px', padding: '5mm 6mm', marginBottom: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '10pt', lineHeight: '1.8', color: '#000' }}>
              <div style={{ fontWeight: '900', color: '#1a3a6b', marginBottom: '2mm' }}>BACCARIM ENGENHARIA URBANA LTDA</div>
              <div>CNPJ: 03.019.603/0001-23</div>
              <div>Registro no Crea-PR: 52.707</div>
              <div>Endereço: Avenida Dom Pedro II, nº 33, Centro, Sala 02.</div>
              <div>Ibiporã – PR</div>
              <div>Telefone: (43) 3268-0916</div>
              <div>Email: alberto@baccarimengenharia.com.br</div>
            </div>
            <SmallLogo />
          </div>
          {/* Box ART */}
          <div style={{ border: '1px solid #1a3a6b', borderRadius: '4px', padding: '5mm 6mm', marginBottom: '6mm', fontSize: '10pt', lineHeight: '1.8', color: '#1a3a6b', textAlign: 'center' }}>
            <div style={{ marginBottom: '3mm' }}>Responsável técnico pela elaboração do documento: Alberto Baccarim Junior</div>
            <div>ART Nº: 1720260789180</div>
            <div>Profissional: Alberto Baccarim Junior</div>
            <div>Formação Profissional: Eng.º Civil</div>
            <div>Registro no Crea: PR- 142.811/D</div>
            <div style={{ marginTop: '8mm', marginBottom: '4mm', fontStyle: 'italic', fontSize: '13pt', color: '#000', fontFamily: 'cursive' }}>Alberto Baccarim Junior</div>
            <div style={{ color: '#000' }}>Alberto Baccarim Junior</div>
          </div>
          {/* Box Proposição */}
          <div style={{ border: '1px solid #1a3a6b', borderRadius: '4px', padding: '4mm 6mm', fontSize: '10pt', color: '#000' }}>
            <div style={{ fontWeight: '900', color: '#1a3a6b', marginBottom: '3mm', textAlign: 'center' }}>PROPOSIÇÃO E EXECUÇÃO DESTE RELATÓRIO AMBIENTAL PRELIMINAR - RAP</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #1a3a6b', padding: '3px 6px', fontWeight: '700', width: '35%' }}>RAZÃO SOCIAL:</td>
                  <td style={{ border: '1px solid #1a3a6b', padding: '3px 6px' }}>Francisco Sigueru Hiraiwa</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #1a3a6b', padding: '3px 6px', fontWeight: '700' }}>CPF:</td>
                  <td style={{ border: '1px solid #1a3a6b', padding: '3px 6px' }}>073.396.409-59</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Footer pageNum={43} />
        </div>

        {/* PAGE 44 - Seção 20 Anexos */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo /></div>
          <div style={{ width: '100%', height: '2px', background: '#1a3a6b', marginBottom: '5mm' }}></div>
          <div style={{ fontSize: '11pt', fontWeight: '900', color: '#1a3a6b', marginBottom: '6mm' }}>20. ANEXOS</div>
          <div style={{ fontSize: '10pt', lineHeight: '2.2', color: '#1a3a6b' }}>
            {[
              { num: '1', desc: 'Anotação de Responsabilidade Técnica ART nº 1720260789180 (Engº Civil Alberto Baccarim Junior).' },
              { num: '2', desc: 'Planta-Ilustrativa.' },
              { num: '3', desc: 'Planta-Planialtimétrica.' },
              { num: '4', desc: 'Mapa de Declividade.' },
              { num: '5', desc: 'Laudo-Geológico-Geotécnico.' },
              { num: '6', desc: 'Relatório Fotográfico.' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '3mm', marginBottom: '2mm', marginLeft: '15mm' }}>
                <span style={{ fontWeight: '700' }}>Anexo {a.num} –</span>
                <span>{a.desc}</span>
              </div>
            ))}
          </div>
          <Footer pageNum={44} />
        </div>

        {/* PAGE 45 - Capa Anexo 01 */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><SmallLogo /></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '24pt', fontWeight: '900', color: '#000', textAlign: 'center' }}>ANEXO 01</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '10pt', color: '#1a3a6b', marginBottom: '20mm' }}>
            <p>Anotação de Responsabilidade Técnica ART nº 1720260789180</p>
            <p>(Engº Civil Alberto Baccarim Junior).</p>
          </div>
          <Footer pageNum={45} />
        </div>

        {/* PAGE 46 - Capa Anexo 02 */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><SmallLogo /></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '24pt', fontWeight: '900', color: '#000', textAlign: 'center' }}>ANEXO 02</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12pt', fontWeight: '700', color: '#000', marginBottom: '10mm' }}>
            <div style={{ borderBottom: '4px solid #000', paddingBottom: '2mm', display: 'inline-block' }}>Planta-Ilustrativa</div>
          </div>
          <Footer pageNum={46} />
        </div>

        {/* PAGE 47 - Capa Anexo 03 */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><SmallLogo /></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '24pt', fontWeight: '900', color: '#000', textAlign: 'center' }}>ANEXO 03</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12pt', fontWeight: '700', color: '#000', marginBottom: '10mm' }}>
            <div style={{ borderBottom: '4px solid #000', paddingBottom: '2mm', display: 'inline-block' }}>Planta-Planialtimétrica</div>
          </div>
          <Footer pageNum={47} />
        </div>

        {/* PAGE 48 - Capa Anexo 04 */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><SmallLogo /></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '24pt', fontWeight: '900', color: '#000', textAlign: 'center' }}>ANEXO 04</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12pt', fontWeight: '700', color: '#000', marginBottom: '10mm' }}>
            <div style={{ borderBottom: '4px solid #000', paddingBottom: '2mm', display: 'inline-block' }}>Mapa de declividade</div>
          </div>
          <Footer pageNum={48} />
        </div>

        {/* PAGE 49 - Capa Anexo 05 */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><SmallLogo /></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '24pt', fontWeight: '900', color: '#000', textAlign: 'center' }}>ANEXO 05</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12pt', fontWeight: '700', color: '#000', marginBottom: '10mm' }}>
            <div style={{ borderBottom: '4px solid #000', paddingBottom: '2mm', display: 'inline-block' }}>Laudo-Geológico-Geotécnico</div>
          </div>
          <Footer pageNum={49} />
        </div>

        {/* PAGE 50 - Capa Anexo 06 */}
        <div className="pdf-page-break" style={{ ...pageStyle, padding: '15mm 20mm 30mm 20mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><SmallLogo /></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '24pt', fontWeight: '900', color: '#000', textAlign: 'center' }}>ANEXO 06</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12pt', fontWeight: '700', color: '#000', marginBottom: '10mm' }}>
            <div style={{ borderBottom: '4px solid #000', paddingBottom: '2mm', display: 'inline-block' }}>Relatório Fotográfico</div>
          </div>
          <Footer pageNum={50} />
        </div>

      </div>
    </div>
  );
};

export default ProjectRapReportView;

