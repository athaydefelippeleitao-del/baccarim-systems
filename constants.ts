
import { EnvironmentalLicense, LicenseType, LicenseStatus, Notification, Project, Contract, Meeting, ProductionVideo, ChecklistItem } from './types';

export const CLIENTS = [
  'A.yoshii',
  'Avos Urbanismo',
  'Vectra',
  'Vitta',
  'Zacarias',
  'Ronaldo Gomes',
  'Luiz A. Braga Cruz'
];

export const PROJECT_CATEGORIES = [
  'Parcelamento do solo urbano para fins habitacionais, como loteamentos e desmembramentos',
  'Implantação de conjuntos habitacionais/construção de empreendimentos horizontais e/ou verticais'
];

export const getChecklistTemplate = (type: LicenseType, agency: 'IAT' | 'SEMA' = 'SEMA'): ChecklistItem[] => {
  const generateId = (prefix: string, num: string) => `${prefix}-${num}-${Math.random().toString(36).substr(2, 5)}`;
  
  const isIAT = agency === 'IAT';

  if (type === LicenseType.LP) {
    return [
      { id: generateId('lp', '1'), label: '1 - RG e CPF do Responsável Legal', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('lp', '2'), label: '2 - Matrícula Atualizada 60 dias', description: 'Contrato de locação se necessário', isCompleted: false, category: 'Legal' },
      { id: generateId('lp', '3'), label: '3 - Certidão Prévia Unificada (CPU)', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('lp', '4'), label: '4 - Contrato Social - última alteração', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('lp', '5'), label: '5 - Viabilidade Técnica Energia Elétrica', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('lp', '6'), label: '6 - Viabilidade Técnica de Água e esgoto', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('lp', '7'), label: '7 - Laudo de sondagem (percolação do solo) com ART', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('lp', '8'), label: '8 - Carta de Declividade com ART', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('lp', '9'), label: '9 - Inventário Florestal com ART assinada', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('lp', '10'), label: '10 - CPVT e Mapa da CPVT', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('lp', '11'), label: '11 - Projeto de Implantação com ART', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('lp', '12'), label: '12 - Projeto Planialtimétrico com ART', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('lp', '14'), label: '14 - CNDA', description: 'Certidão Negativa de Débitos Ambientais', isCompleted: false, category: 'Legal' },
      { id: generateId('lp', '15'), label: '15 - ART Junior', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('lp', '16'), label: '16 - Relatório Fotográfico', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('lp', '17'), label: '17 - RAP', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('lp', '18.1'), label: '18.1 - Publicações (Req. LP) - DIOE e Jornal Local', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('lp', '19'), label: '19 - Projeto básico de Terraplanagem com ART', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('lp', '24'), label: '24 - Manifestação Conclusiva do IPHAN', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('lp', '33'), label: '33 - Mapa de Aptidão', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('lp', '37'), label: '37 - Procuração Simples do Responsável Legal', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('lp', '38'), label: '38 - Cópia dos documentos pessoas do procurador Alberto Jr', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('lp', '39'), label: '39 - Croqui de Localização', description: '', isCompleted: false, category: 'Técnica' },
      ...(isIAT ? [{ id: generateId('lp', 'iat-1'), label: 'IAT - Anuência Municipal para LP', description: '', isCompleted: false, category: 'Legal' as const }] : [])
    ];
  }

  if (type === LicenseType.LI) {
    return [
      { id: generateId('li', '2'), label: '2 - Matrícula atualizada (60 dias)', description: 'Com averbação de área urbana ou IPTU', isCompleted: false, category: 'Legal' },
      { id: generateId('li', '4'), label: '4 - Contrato Social', description: 'Em caso de alteração', isCompleted: false, category: 'Legal' },
      { id: generateId('li', '11.1'), label: '11.1 - Projeto de Implantação com ART aprovado', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('li', '14'), label: '14 - Certidão Negativa de Débitos Ambientais (CNDA)', description: 'Emitida pelo IAT', isCompleted: false, category: 'Legal' },
      { id: generateId('li', '16'), label: '16 - Relatório Fotográfico', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('li', '19'), label: '19 - Projeto Básico de Terraplanagem com ART', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('li', '20'), label: '20 - Projeto de Drenagem Superficial com ART Aprovado', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('li', '21'), label: '21 - Projeto de Arborização com ART Aprovado', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('li', '22'), label: '22 - Projeto de Esgoto com ART Aprovado', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('li', '23'), label: '23 - Relatório de Detalhamento de Programas Ambientais - RDPA', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('li', '24'), label: '24 - Manifestação Conclusiva IPHAN', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('li', '25'), label: '25 - Projeto de Captação da Água da Chuva', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('li', '26'), label: '26 - PGRCC com ART', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('li', '27'), label: '27 - Relatório de Atendimento de Condicionantes', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('li', '28.1'), label: '28.1 - Publicação de Recebimento de LP', description: 'DIOE e Jornal Local', isCompleted: false, category: 'Legal' },
      { id: generateId('li', '29.1'), label: '29.1 - Publicação de Requerimento de LI', description: 'DIOE + Jornal Local', isCompleted: false, category: 'Legal' },
      { id: generateId('li', '30'), label: '30 - Cópia da Licença Prévia', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('li', '33'), label: '33 - Mapa de aptidão', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('li', '34'), label: '34 - Alvará de Licença para Demolição', description: 'SMOP', isCompleted: false, category: 'Legal' },
      { id: generateId('li', '35'), label: '35 - ART da execução da obra', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('li', '36'), label: '36 - Autorização Ambiental erradicação (SINAFLOR)', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('li', '9'), label: '9 - Memorial botânico com ART', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('li', '37'), label: '37 - Procuração Alberto Jr', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('li', '38'), label: '38 - Documentos Alberto Jr', description: '', isCompleted: false, category: 'Legal' },
      ...(isIAT ? [{ id: generateId('li', 'iat-1'), label: 'IAT - Comprovante de Pagamento da Taxa Ambiental', description: '', isCompleted: false, category: 'Legal' as const }] : [])
    ];
  }

  if (type === LicenseType.LAS) {
    return [
      { id: generateId('las', '1'), label: '1 - RG E CPF do Responsável', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('las', '2'), label: '2 - Matrícula atualizada (60 dias)', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('las', '3'), label: '3 - Certidão Prévia Unificada', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('las', '4'), label: '4 - Contrato Social', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('las', '5'), label: '5 - Carta de viabilidade energia elétrica', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '6'), label: '6 - Carta de viabilidade de água e esgoto', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '7'), label: '7 - Laudo Geológico-Geotécnico', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '8'), label: '8 - Carta de Declividade com ART', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '9'), label: '9 - Inventário Florestal com ART assinada', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('las', '11'), label: '11 - Projeto de Implantação Urbanística com ART', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '12'), label: '12 - Projeto Planialtimétrico com ART', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '14'), label: '14 - CNDA', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('las', '16'), label: '16 - Relatório Fotográfico', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '19'), label: '19 - Projeto Báscio de Terraplanagem com ART', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '20'), label: '20 - Projeto de Drenagem Superficial com ART', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '22'), label: '22 - Projeto de Esgoto com ART aprovado', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '24'), label: '24 - Manifestação Concusiva IPHAN', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('las', '26'), label: '26 - PGRCC', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('las', '31'), label: '31 - Relatório Técnico', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('las', '32.1'), label: '32.1 - Publicação de Requerimento de LAS', description: 'DIOE + Jornal Local', isCompleted: false, category: 'Legal' },
      { id: generateId('las', '33'), label: '33 - Mapa de aptidão', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '35'), label: '35 - ART de execução de obra', description: '', isCompleted: false, category: 'Técnica' },
      { id: generateId('las', '36'), label: '36 - Autorização ambiental para erradicação de árvores', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('las', '37'), label: '37 - Croqui de localização', description: '', isCompleted: false, category: 'Técnica' },
    ];
  }

  if (type === LicenseType.LO) {
    return [
      { id: generateId('lo', '1'), label: '1 - Cópia da Licença de Instalação (LI)', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('lo', '2'), label: '2 - Relatório de Atendimento de Condicionantes da LI', description: '', isCompleted: false, category: 'Ambiental' },
      { id: generateId('lo', '3'), label: '3 - Auto de Conclusão de Obra (Habite-se)', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('lo', '4'), label: '4 - Certidão de Conformidade da Prefeitura', description: '', isCompleted: false, category: 'Legal' },
      { id: generateId('lo', '5'), label: '5 - Projeto de As-Built com ART', description: '', isCompleted: false, category: 'Técnica' },
    ];
  }

  return [];
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'iy-137',
    name: 'LOTE 137',
    razaoSocial: 'A. YOSHII ENGENHARIA E CONSTRUÇÃO LTDA',
    cnpj: '78.016.003/0001-00',
    location: 'Rua Eunilson Bezerra da Silva, s/n, Lote 137 – Gleba Ribeirão Esperança – Londrina/PR',
    clientName: 'A.yoshii',
    status: 'Em Execução',
    progress: 45,
    currentPhase: LicenseType.LI,
    checklistAgency: 'SEMA',
    mainLicenseId: 'l-iy137-lp',
    specs: { 
      razaoSocial: 'A. YOSHII ENGENHARIA E CONSTRUÇÃO LTDA',
      cnpjCpf: '78.016.003/0001-00',
      applicantAddress: 'Av. Maringá, 1050',
      applicantBairro: 'Jd. Araxa',
      applicantCity: 'Londrina/PR',
      applicantCep: '86060-000',
      applicantPhone: '(43) 3371-1000',
      applicantMobile: '(43) 99999-0000',
      applicantEmail: 'contato@ayoshii.com.br',
      contactName: 'Rafaela',
      contactRole: 'Coordenadora de Projetos',
      projectCategory: 'Parcelamento',
      projectAddress: 'Rua Eunilson Bezerra da Silva, s/n, Lote 137 – Gleba Ribeirão Esperança',
      projectBairro: 'Gleba Ribeirão Esperança',
      projectCity: 'Londrina/PR',
      realEstateId: '123.456.789',
      areaTotal: '42.500 m²', 
      areaConstruida: '32.000 m²',
      numUnits: '120',
      qtdLotes: 'UH - A Definir', 
      areaAPP: '8.200 m²', 
      matricula: '12.334 - 1º RI',
      service: 'Loteamentos', 
      projectType: 'Parcelamento do Solo',
      contact: 'Rafaela',
      responsavelLegal: 'PEDRO IVAN DEBERTOLIS DA MOTA',
      cpfResponsavel: '052.507.519-46',
      sedeEndereco: 'Av. Maringá, 1050 – Jd. Araxa – Londrina/PR',
      orgaoResponsavel: 'SEMA',
      responsavelTecnico: 'Carlos Augusto Da Silva',
      licencaObtida: 'Licença Prévia',
      licencaASerObtida: 'Licença de Instalação',
      numeroProtocolo: '19.023.013790/2025-10',
      dataProtocolo: '24/01/2025',
      coordE: '479852',
      coordN: '7419215',
      zone: 22,
      notificationNumber: '',
      isDeferred: false,
      lat: -23.328330,
      lng: -51.196321
    },
    checklist: getChecklistTemplate(LicenseType.LI)
  },
  {
    id: 'iy-138',
    name: 'LOTE 138',
    razaoSocial: 'A. YOSHII ENGENHARIA E CONSTRUÇÃO LTDA',
    cnpj: '78.016.003/0001-00',
    location: 'Gleba Ribeirão Esperança – Londrina/PR',
    clientName: 'A.yoshii',
    status: 'Em Planejamento',
    progress: 10,
    currentPhase: LicenseType.LP,
    checklistAgency: 'SEMA',
    specs: { 
      razaoSocial: 'A. YOSHII ENGENHARIA E CONSTRUÇÃO LTDA',
      cnpjCpf: '78.016.003/0001-00',
      applicantAddress: 'Av. Maringá, 1050',
      applicantBairro: 'Jd. Araxa',
      applicantCity: 'Londrina/PR',
      applicantCep: '86060-000',
      applicantPhone: '(43) 3371-1000',
      applicantMobile: '(43) 99999-0000',
      applicantEmail: 'contato@ayoshii.com.br',
      contactName: 'Rafaela',
      contactRole: 'Coordenadora de Projetos',
      projectCategory: 'Parcelamento',
      projectAddress: 'Gleba Ribeirão Esperança',
      projectBairro: 'Gleba Ribeirão Esperança',
      projectCity: 'Londrina/PR',
      realEstateId: 'Pendente',
      areaTotal: 'A Definir', 
      areaConstruida: 'A Definir',
      numUnits: 'A Definir',
      qtdLotes: 'UH - A Definir', 
      areaAPP: 'Pendente', 
      matricula: 'Pendente',
      service: 'Loteamentos', 
      projectType: 'Parcelamento do Solo',
      contact: 'Rafaela',
      orgaoResponsavel: 'SEMA',
      licencaObtida: 'Nenhuma / Em Requerimento',
      licencaASerObtida: 'Licença Prévia (LP)',
      coordE: '480120',
      coordN: '7418950',
      zone: 22,
      isDeferred: false,
      lat: -23.330541,
      lng: -51.194512,
      responsavelLegal: 'PEDRO IVAN DEBERTOLIS DA MOTA',
      cpfResponsavel: '052.507.519-46',
      sedeEndereco: 'Av. Maringá, 1050 – Jd. Araxa – Londrina/PR',
      responsavelTecnico: 'Carlos Augusto Da Silva',
      numeroProtocolo: '',
      dataProtocolo: '',
      notificationNumber: ''
    },
    checklist: getChecklistTemplate(LicenseType.LP)
  }
];

export const MOCK_LICENSES: EnvironmentalLicense[] = [
  {
    id: 'l-marcelo-lp',
    name: 'MARCELO - NELSON - LP',
    clientName: 'Avos Urbanismo',
    type: LicenseType.LP,
    agency: 'SEMA',
    issueDate: '26/08/2025',
    expiryDate: '26/08/2026',
    status: LicenseStatus.ACTIVE,
    processNumber: '13.023.158037/2025-52',
    sei: '13.023.158037/2025-52',
    lastUpdate: '24/11/2025',
    detailedStatus: 'Em análise',
    responsibleTec: 'Carlos Augusto da Silva',
    documentation: []
  },
  {
    id: 'l-iy137-lp',
    name: 'LOTE 137 - LP',
    clientName: 'A.yoshii',
    type: LicenseType.LP,
    agency: 'SEMA',
    issueDate: '24/01/2025',
    expiryDate: '23/10/2030',
    status: LicenseStatus.ACTIVE,
    processNumber: '19.023.013790/2025-10',
    sei: '19.023.013790/2025-10',
    lastUpdate: '01/12/2025',
    detailedStatus: 'Licença Deferida',
    responsibleTec: 'Carlos Augusto Da Silva',
    documentation: []
  },
  {
    id: 'l-iy138-lp',
    name: 'LOTE 138 - LP',
    clientName: 'A.yoshii',
    type: LicenseType.LP,
    agency: 'SEMA',
    issueDate: 'Pendente',
    expiryDate: 'Pendente',
    status: LicenseStatus.PENDING,
    processNumber: 'Em Requerimento',
    detailedStatus: 'Aguardando Protocolo',
    responsibleTec: 'Carlos Augusto Da Silva',
    documentation: []
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-3354',
    title: 'NOTIFICAÇÃO AMBIENTAL 3354/2026',
    clientName: 'Avos Urbanismo',
    projectId: 'pr-hiraiwa',
    description: 'Atendendo complementação técnica solicitada pela SEMA.',
    dateReceived: '26/01/2026',
    deadline: '26/02/2026',
    status: 'Open',
    severity: 'Alta',
    agency: 'SEMA'
  },
  {
    id: 'n-li-01',
    title: 'COMPLEMENTAÇÃO LI - LOTE 137',
    clientName: 'A.yoshii',
    projectId: 'iy-137',
    description: 'Apresentar anuência da concessionária de energia conforme parecer técnico.',
    dateReceived: '10/02/2025',
    deadline: '10/03/2025',
    status: 'Open',
    severity: 'Média',
    agency: 'SEMA'
  }
];

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'ct-001',
    clientName: 'A.yoshii',
    projectId: 'iy-137',
    title: 'Assessoria Ambiental - Lote 137',
    totalValue: 120000.00,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'Active',
    billingType: 'Monthly',
    attachedFiles: [
      {
        fileName: 'Contrato_Lote137_BE.pdf',
        fileData: '',
        fileDate: '2024-01-01'
      }
    ],
    installments: [
      { id: 'inst-1', value: 10000.00, dueDate: '2024-05-10', status: 'Paid' },
      { id: 'inst-2', value: 10000.00, dueDate: '2024-06-10', status: 'Pending' }
    ]
  }
];

export const MOCK_MEETINGS: Meeting[] = [];
export const MOCK_VIDEOS: ProductionVideo[] = [];
