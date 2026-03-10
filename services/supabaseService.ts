import { createClient } from '@supabase/supabase-js';
import type { EnvironmentalLicense, Notification, Project, Contract, Meeting, ProductionVideo, PhotoReport, AuditEntry, User } from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pertaeirboqtzbaqaluh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcnRhZWlyYm9xdHpiYXFhbHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDA0ODQsImV4cCI6MjA4ODY3NjQ4NH0.yXv9F4fhIPT1QHy9t0DDmsd2Ypq-fgOl5ByIbFmdjDs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
export async function getUsers(): Promise<any[]> {
  const { data, error } = await supabase.from('users').select('*');
  if (error) { console.error('getUsers error:', error); return []; }
  return (data || []).map(mapUserFromDb);
}

export async function upsertUsers(users: any[]): Promise<void> {
  if (!users.length) return;
  const rows = users.map(mapUserToDb);
  const { error } = await supabase.from('users').upsert(rows, { onConflict: 'id' });
  if (error) console.error('upsertUsers error:', error);
}

function mapUserFromDb(row: any): any {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    clientNames: row.client_names || [],
    phone: row.phone,
    password: row.password,
    createdAt: row.created_at,
    lastLogin: row.last_login,
    googleTokens: row.google_tokens,
  };
}

function mapUserToDb(u: any): any {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    client_names: u.clientNames || [],
    phone: u.phone || null,
    password: u.password || null,
    created_at: u.createdAt || null,
    last_login: u.lastLogin || null,
    google_tokens: u.googleTokens || null,
  };
}

// ─────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────
export async function getClients(): Promise<string[]> {
  const { data, error } = await supabase.from('clients').select('name').order('name');
  if (error) { console.error('getClients error:', error); return []; }
  return (data || []).map((r: any) => r.name);
}

export async function upsertClients(clients: string[]): Promise<void> {
  if (!clients.length) return;
  const rows = clients.map(name => ({ name }));
  const { error } = await supabase.from('clients').upsert(rows, { onConflict: 'name', ignoreDuplicates: true });
  if (error) console.error('upsertClients error:', error);
}

// ─────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getProjects error:', error); return []; }
  return (data || []).map(mapProjectFromDb);
}

export async function upsertProjects(projects: Project[]): Promise<void> {
  if (!projects.length) return;
  const rows = projects.map(mapProjectToDb);
  const { error } = await supabase.from('projects').upsert(rows, { onConflict: 'id' });
  if (error) console.error('upsertProjects error:', error);
}

function mapProjectFromDb(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    razaoSocial: row.razao_social || '',
    cnpj: row.cnpj || '',
    location: row.location || '',
    clientName: row.client_name,
    status: row.status,
    progress: row.progress || 0,
    specs: row.specs || {},
    checklist: row.checklist || [],
    mainLicenseId: row.main_license_id,
    currentPhase: row.current_phase,
    checklistAgency: row.checklist_agency,
  };
}

function mapProjectToDb(p: Project): any {
  return {
    id: p.id,
    name: p.name,
    razao_social: p.razaoSocial || null,
    cnpj: p.cnpj || null,
    location: p.location || null,
    client_name: p.clientName,
    status: p.status,
    progress: p.progress || 0,
    specs: p.specs || {},
    checklist: p.checklist || [],
    main_license_id: p.mainLicenseId || null,
    current_phase: p.currentPhase || null,
    checklist_agency: p.checklistAgency || null,
    updated_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// LICENSES
// ─────────────────────────────────────────────
export async function getLicenses(): Promise<EnvironmentalLicense[]> {
  const { data, error } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getLicenses error:', error); return []; }
  return (data || []).map(mapLicenseFromDb);
}

export async function upsertLicenses(licenses: EnvironmentalLicense[]): Promise<void> {
  if (!licenses.length) return;
  const rows = licenses.map(mapLicenseToDb);
  const { error } = await supabase.from('licenses').upsert(rows, { onConflict: 'id' });
  if (error) console.error('upsertLicenses error:', error);
}

function mapLicenseFromDb(row: any): EnvironmentalLicense {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    type: row.type,
    agency: row.agency,
    issueDate: row.issue_date || '',
    expiryDate: row.expiry_date || '',
    status: row.status,
    processNumber: row.process_number || '',
    documentation: row.documentation || [],
    responsibleTec: row.responsible_tec,
    sei: row.sei,
    sga: row.sga,
    lastUpdate: row.last_update,
    renewalDate: row.renewal_date,
    notificationNumber: row.notification_number,
    detailedStatus: row.detailed_status,
    attachedFiles: row.attached_files || [],
  };
}

function mapLicenseToDb(l: EnvironmentalLicense): any {
  return {
    id: l.id,
    name: l.name,
    client_name: l.clientName,
    type: l.type,
    agency: l.agency,
    issue_date: l.issueDate || null,
    expiry_date: l.expiryDate || null,
    status: l.status,
    process_number: l.processNumber || null,
    documentation: l.documentation || [],
    responsible_tec: l.responsibleTec || null,
    sei: l.sei || null,
    sga: l.sga || null,
    last_update: l.lastUpdate || null,
    renewal_date: l.renewalDate || null,
    notification_number: l.notificationNumber || null,
    detailed_status: l.detailedStatus || null,
    attached_files: l.attachedFiles || [],
    updated_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────
export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getNotifications error:', error); return []; }
  return (data || []).map(mapNotificationFromDb);
}

export async function upsertNotifications(notifications: Notification[]): Promise<void> {
  if (!notifications.length) return;
  const rows = notifications.map(mapNotificationToDb);
  const { error } = await supabase.from('notifications').upsert(rows, { onConflict: 'id' });
  if (error) console.error('upsertNotifications error:', error);
}

function mapNotificationFromDb(row: any): Notification {
  return {
    id: row.id,
    title: row.title,
    clientName: row.client_name,
    projectId: row.project_id,
    description: row.description || '',
    dateReceived: row.date_received || '',
    deadline: row.deadline || '',
    status: row.status,
    agency: row.agency || '',
    severity: row.severity,
    attachedFiles: row.attached_files || [],
    responseDraft: row.response_draft,
  };
}

function mapNotificationToDb(n: Notification): any {
  return {
    id: n.id,
    title: n.title,
    client_name: n.clientName,
    project_id: n.projectId || null,
    description: n.description || null,
    date_received: n.dateReceived || null,
    deadline: n.deadline || null,
    status: n.status,
    agency: n.agency || null,
    severity: n.severity,
    attached_files: n.attachedFiles || [],
    response_draft: n.responseDraft || null,
    updated_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// CONTRACTS
// ─────────────────────────────────────────────
export async function getContracts(): Promise<Contract[]> {
  const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getContracts error:', error); return []; }
  return (data || []).map(mapContractFromDb);
}

export async function upsertContracts(contracts: Contract[]): Promise<void> {
  if (!contracts.length) return;
  const rows = contracts.map(mapContractToDb);
  const { error } = await supabase.from('contracts').upsert(rows, { onConflict: 'id' });
  if (error) console.error('upsertContracts error:', error);
}

function mapContractFromDb(row: any): Contract {
  return {
    id: row.id,
    clientName: row.client_name,
    projectId: row.project_id,
    title: row.title,
    totalValue: Number(row.total_value) || 0,
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    status: row.status,
    billingType: row.billing_type || '',
    attachedFiles: row.attached_files || [],
    installments: row.installments || [],
  };
}

function mapContractToDb(c: Contract): any {
  return {
    id: c.id,
    client_name: c.clientName,
    project_id: c.projectId || null,
    title: c.title,
    total_value: c.totalValue || 0,
    start_date: c.startDate || null,
    end_date: c.endDate || null,
    status: c.status,
    billing_type: c.billingType || null,
    attached_files: c.attachedFiles || [],
    installments: c.installments || [],
    updated_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// MEETINGS
// ─────────────────────────────────────────────
export async function getMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase.from('meetings').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getMeetings error:', error); return []; }
  return (data || []).map(mapMeetingFromDb);
}

export async function upsertMeetings(meetings: Meeting[]): Promise<void> {
  if (!meetings.length) return;
  const rows = meetings.map(mapMeetingToDb);
  const { error } = await supabase.from('meetings').upsert(rows, { onConflict: 'id' });
  if (error) console.error('upsertMeetings error:', error);
}

function mapMeetingFromDb(row: any): Meeting {
  return {
    id: row.id,
    title: row.title,
    date: row.date || '',
    time: row.time || '',
    location: row.location || '',
    participants: row.participants || [],
    type: row.type,
  };
}

function mapMeetingToDb(m: Meeting): any {
  return {
    id: m.id,
    title: m.title,
    date: m.date || null,
    time: m.time || null,
    location: m.location || null,
    participants: m.participants || [],
    type: m.type,
  };
}

// ─────────────────────────────────────────────
// VIDEOS
// ─────────────────────────────────────────────
export async function getVideos(): Promise<ProductionVideo[]> {
  const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getVideos error:', error); return []; }
  return (data || []).map(mapVideoFromDb);
}

export async function upsertVideos(videos: ProductionVideo[]): Promise<void> {
  if (!videos.length) return;
  const rows = videos.map(mapVideoToDb);
  const { error } = await supabase.from('videos').upsert(rows, { onConflict: 'id' });
  if (error) console.error('upsertVideos error:', error);
}

function mapVideoFromDb(row: any): ProductionVideo {
  return { id: row.id, title: row.title, status: row.status, deadline: row.deadline || '' };
}

function mapVideoToDb(v: ProductionVideo): any {
  return { id: v.id, title: v.title, status: v.status, deadline: v.deadline || null };
}

// ─────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────
export async function getReports(): Promise<PhotoReport[]> {
  const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (error) { console.error('getReports error:', error); return []; }
  return (data || []).map(mapReportFromDb);
}

export async function upsertReports(reports: PhotoReport[]): Promise<void> {
  if (!reports.length) return;
  const rows = reports.map(mapReportToDb);
  const { error } = await supabase.from('reports').upsert(rows, { onConflict: 'id' });
  if (error) console.error('upsertReports error:', error);
}

function mapReportFromDb(row: any): PhotoReport {
  return {
    id: row.id, projectId: row.project_id, projectName: row.project_name, clientName: row.client_name,
    title: row.title, date: row.date, ownerName: row.owner_name, entName: row.ent_name,
    entCpf: row.ent_cpf, entAddress: row.ent_address, entDistrict: row.ent_district,
    entCity: row.ent_city, entCep: row.ent_cep, projName: row.proj_name,
    projAddress: row.proj_address, projDistrict: row.proj_district, projCity: row.proj_city,
    projCep: row.proj_cep, projLicense: row.proj_license, technicalBasis: row.technical_basis,
    respName: row.resp_name, respRole: row.resp_role, respCrea: row.resp_crea,
    respReg: row.resp_reg, respCompany: row.resp_company, respEmail: row.resp_email,
    respCnpj: row.resp_cnpj, respAddress: row.resp_address, respCity: row.resp_city,
    respCep: row.resp_cep, respPhone: row.resp_phone, photos: row.photos || [],
  };
}

function mapReportToDb(r: PhotoReport): any {
  return {
    id: r.id, project_id: r.projectId || null, project_name: r.projectName, client_name: r.clientName,
    title: r.title, date: r.date, owner_name: r.ownerName, ent_name: r.entName,
    ent_cpf: r.entCpf, ent_address: r.entAddress, ent_district: r.entDistrict,
    ent_city: r.entCity, ent_cep: r.entCep, proj_name: r.projName,
    proj_address: r.projAddress, proj_district: r.projDistrict, proj_city: r.projCity,
    proj_cep: r.projCep, proj_license: r.projLicense, technical_basis: r.technicalBasis || null,
    resp_name: r.respName, resp_role: r.respRole || null, resp_crea: r.respCrea,
    resp_reg: r.respReg, resp_company: r.respCompany, resp_email: r.respEmail,
    resp_cnpj: r.respCnpj, resp_address: r.respAddress, resp_city: r.respCity,
    resp_cep: r.respCep, resp_phone: r.respPhone, photos: r.photos || [],
    updated_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────
export async function getAuditLog(): Promise<AuditEntry[]> {
  const { data, error } = await supabase.from('audit_log').select('*').order('timestamp', { ascending: false }).limit(200);
  if (error) { console.error('getAuditLog error:', error); return []; }
  return (data || []).map((row: any) => ({
    id: row.id, userId: row.user_id, userName: row.user_name,
    action: row.action, details: row.details, timestamp: row.timestamp,
  }));
}

export async function insertAuditEntry(entry: AuditEntry): Promise<void> {
  const { error } = await supabase.from('audit_log').insert({
    id: entry.id,
    user_id: entry.userId,
    user_name: entry.userName,
    action: entry.action,
    details: entry.details,
    timestamp: entry.timestamp,
  });
  if (error) console.error('insertAuditEntry error:', error);
}

// ─────────────────────────────────────────────
// CHECKLIST TEMPLATES
// ─────────────────────────────────────────────
export async function getChecklistTemplates(): Promise<Record<string, any[]>> {
  const { data, error } = await supabase.from('checklist_templates').select('*');
  if (error) { console.error('getChecklistTemplates error:', error); return {}; }
  const result: Record<string, any[]> = {};
  for (const row of data || []) {
    result[row.key] = row.template;
  }
  return result;
}

export async function upsertChecklistTemplates(templates: Record<string, any[]>): Promise<void> {
  const rows = Object.entries(templates).map(([key, template]) => ({ key, template }));
  if (!rows.length) return;
  const { error } = await supabase.from('checklist_templates').upsert(rows, { onConflict: 'key' });
  if (error) console.error('upsertChecklistTemplates error:', error);
}

// ─────────────────────────────────────────────
// LOAD ALL STATE FROM SUPABASE
// ─────────────────────────────────────────────
export async function loadStateFromSupabase() {
  console.log('[Supabase] Loading state from database...');
  const [users, clients, projects, licenses, notifications, contracts, meetings, videos, reports, auditLog, checklistTemplates] =
    await Promise.all([
      getUsers(),
      getClients(),
      getProjects(),
      getLicenses(),
      getNotifications(),
      getContracts(),
      getMeetings(),
      getVideos(),
      getReports(),
      getAuditLog(),
      getChecklistTemplates(),
    ]);

  console.log(`[Supabase] Loaded: ${projects.length} projects, ${licenses.length} licenses, ${users.length} users`);
  return { users, clients, projects, licenses, notifications, contracts, meetings, videos, reports, auditLog, checklistTemplates };
}

// ─────────────────────────────────────────────
// SAVE STATE KEY TO SUPABASE
// ─────────────────────────────────────────────
export async function saveKeyToSupabase(key: string, value: any): Promise<void> {
  switch (key) {
    case 'users': return upsertUsers(value);
    case 'clients': return upsertClients(value);
    case 'projects': return upsertProjects(value);
    case 'licenses': return upsertLicenses(value);
    case 'notifications': return upsertNotifications(value);
    case 'contracts': return upsertContracts(value);
    case 'meetings': return upsertMeetings(value);
    case 'videos': return upsertVideos(value);
    case 'reports': return upsertReports(value);
    case 'auditLog': return; // audit log is written entry-by-entry
    case 'checklistTemplates': return upsertChecklistTemplates(value);
    default:
      console.warn(`[Supabase] Unknown key "${key}" - not persisted`);
  }
}
