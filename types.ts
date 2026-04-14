
export enum LicenseStatus {
  ACTIVE = 'Ativa',
  EXPIRING = 'Vencendo',
  EXPIRED = 'Vencida',
  PENDING = 'Pendente'
}

export enum LicenseType {
  LP = 'Licença Prévia (LP)',
  LI = 'Licença de Instalação (LI)',
  LO = 'Licença de Operação (LO)',
  LAS = 'Licença Ambiental Simplificada (LAS)',
  ASV = 'Autorização de Supressão (ASV)',
  OUTORGA = 'Outorga'
}

export interface Attachment {
  fileName: string;
  fileData: string;
  fileDate: string;
}

export interface CustomSpec {
  id: string;
  label: string;
  value: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'engineer' | 'client';
  clientNames?: string[];
  phone?: string;
  createdAt?: string;
  lastLogin?: string;
  googleTokens?: any;
  pushSubscriptions?: any[];
}

export interface EnvironmentalLicense {
  id: string;
  name: string;
  clientName: string;
  type: string; 
  agency: string;
  issueDate: string;
  expiryDate: string;
  status: LicenseStatus;
  processNumber: string;
  documentation: string[];
  responsibleTec?: string;
  sei?: string;
  sga?: string;
  lastUpdate?: string;
  renewalDate?: string;
  notificationNumber?: string;
  detailedStatus?: string;
  attachedFiles?: Attachment[];
}

export type NotificationSeverity = 'Alta' | 'Média' | 'Baixa';

export interface Notification {
  id: string;
  title: string;
  clientName: string;
  projectId?: string;
  description: string;
  dateReceived: string;
  deadline: string;
  status: 'Open' | 'Resolved';
  agency: string;
  severity: NotificationSeverity;
  attachedFiles?: Attachment[];
  responseDraft?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  isCompleted: boolean;
  category: 'Legal' | 'Técnica' | 'Ambiental' | 'Complementação Vigente' | string;
  dueDate?: string;
  attachedFiles?: Attachment[];
  comment?: string;
}

// Added missing Installment interface used in FinanceView
export interface Installment {
  id: string;
  title?: string;
  value: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  attachedFiles?: Attachment[];
}

// Added missing Contract interface used in FinanceView and constants
export interface Contract {
  id: string;
  clientName: string;
  projectId?: string;
  title: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Active' | 'Expired' | 'Completed';
  billingType: string;
  attachedFiles?: Attachment[];
  installments: Installment[];
}

// Added missing Meeting interface used in MeetingsView and constants
export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  participants: string[];
  type: 'Technical' | 'Commercial' | 'Inspection';
}

// Added missing ProductionVideo interface used in MeetingsView and constants
export interface ProductionVideo {
  id: string;
  title: string;
  status: 'Planned' | 'In Progress' | 'Done';
  deadline: string;
}

export interface ProjectTechnicalSpecs {
  // I - IDENTIFICAÇÃO DO REQUERENTE
  razaoSocial: string;
  cnpjCpf: string;
  applicantAddress: string;
  applicantBairro: string;
  applicantCity: string;
  applicantCep: string;
  applicantPhone: string;
  applicantMobile: string;
  applicantEmail: string;
  contactName: string;
  contactRole: string;

  // II - CARACTERÍSTICAS DO EMPREENDIMENTO
  projectCategory: 'Parcelamento' | 'Implantação' | string;
  projectAddress: string;
  projectBairro: string;
  projectCity: string;
  realEstateId: string; // Inscrição Imobiliária
  areaTotal: string;
  areaConstruida: string;
  numUnits: string | number;
  
  // Existing / Additional
  areaAPP: string;
  matricula: string;
  service: string;       
  projectType: string;   
  contact: string;       
  responsavelLegal?: string;
  cpfResponsavel?: string;
  sedeEndereco?: string;
  sedeBairro?: string;
  sedeCidade?: string;
  sedeCep?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  orgaoResponsavel?: string;
  responsavelTecnico?: string;
  licencaObtida?: string;
  numeroLicenca?: string;
  licencaASerObtida?: string;
  numeroProtocolo?: string;
  dataProtocolo?: string;
  complementacaoVigente?: string;
  notificationNumber?: string;
  isDeferred?: boolean;
  licenseFiles?: Attachment[];
  notificationFiles?: Attachment[];
  driveLicenseLink?: string;
  driveNotificationLink?: string;
  coordE?: string;
  coordN?: string;
  zone?: number;
  lat?: number;
  lng?: number;
  qtdLotes?: number | string; // Kept for compatibility
  customSpecs?: CustomSpec[];
}

export interface Project {
  id: string;
  name: string;
  razaoSocial: string;
  cnpj: string;
  location: string;
  clientName: string;
  status: 'Em Planejamento' | 'Em Execução' | 'Concluído';
  progress: number;
  specs: ProjectTechnicalSpecs;
  checklist: ChecklistItem[];
  mainLicenseId?: string; 
  currentPhase?: string;
  checklistAgency?: 'IAT' | 'SEMA';
}

export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  timestamp: string;
  coordE?: string;
  coordN?: string;
  direction?: string;
  lat?: number;
  lng?: number;
  analysis?: string;
  tags?: string[];
}

export interface PhotoReport {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  title: string;
  date: string;
  
  // 1. Identificação do Empreendedor
  ownerName: string;
  entName: string;
  entCpf: string;
  entAddress: string;
  entDistrict: string;
  entCity: string;
  entCep: string;

  // 1.1. Identificação do Empreendimento
  projName: string;
  projAddress: string;
  projDistrict: string;
  projCity: string;
  projCep: string;
  projLicense: string;
  technicalBasis?: string;

  // 2. Identificação da Empresa Responsável (Baccarim)
  respName: string;
  respRole?: string;
  respCrea: string;
  respReg: string;
  respCompany: string;
  respEmail: string;
  respCnpj: string;
  respAddress: string;
  respCity: string;
  respCep: string;
  respPhone: string;
  techResponsibilityLabel?: string;
  
  photos: PhotoItem[];
}

export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface PresenceUser {
  socketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  lastSeen: string;
}
export interface AppConfig {
  appIcon?: string; // base64
  appName?: string;
  signatureImage?: string; // base64
}
