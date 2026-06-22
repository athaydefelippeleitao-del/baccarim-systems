-- Schema para o novo projeto Supabase
-- Cole e execute isso no "SQL Editor" do seu novo projeto no Supabase

-- DROP TABLE se precisar recriar:
-- DROP TABLE IF EXISTS users, projects, licenses, notifications, contracts, meetings, videos, reports, audit_log, checklist_templates;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT,
  client_names JSONB,
  phone TEXT,
  password TEXT,
  created_at TEXT,
  last_login TEXT,
  google_tokens JSONB,
  push_subscriptions JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  razao_social TEXT,
  cnpj TEXT,
  location TEXT,
  client_name TEXT,
  status TEXT,
  progress INTEGER,
  specs JSONB,
  checklist JSONB,
  main_license_id TEXT,
  current_phase TEXT,
  checklist_agency TEXT,
  meeting_minutes JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE licenses (
  id TEXT PRIMARY KEY,
  name TEXT,
  client_name TEXT,
  type TEXT,
  agency TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  status TEXT,
  process_number TEXT,
  documentation JSONB,
  responsible_tec TEXT,
  sei TEXT,
  sga TEXT,
  last_update TEXT,
  renewal_date TEXT,
  notification_number TEXT,
  detailed_status TEXT,
  attached_files JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  title TEXT,
  client_name TEXT,
  project_id TEXT,
  description TEXT,
  date_received TEXT,
  deadline TEXT,
  status TEXT,
  agency TEXT,
  severity TEXT,
  category TEXT,
  attached_files JSONB,
  response_draft TEXT,
  sent_1_week_alert BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contracts (
  id TEXT PRIMARY KEY,
  client_name TEXT,
  project_id TEXT,
  title TEXT,
  total_value NUMERIC,
  start_date TEXT,
  end_date TEXT,
  status TEXT,
  billing_type TEXT,
  attached_files JSONB,
  installments JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE meetings (
  id TEXT PRIMARY KEY,
  title TEXT,
  date TEXT,
  time TEXT,
  location TEXT,
  participants JSONB,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  title TEXT,
  status TEXT,
  deadline TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  project_name TEXT,
  client_name TEXT,
  title TEXT,
  date TEXT,
  owner_name TEXT,
  ent_name TEXT,
  ent_cpf TEXT,
  ent_address TEXT,
  ent_district TEXT,
  ent_city TEXT,
  ent_cep TEXT,
  proj_name TEXT,
  proj_address TEXT,
  proj_district TEXT,
  proj_city TEXT,
  proj_cep TEXT,
  proj_license TEXT,
  technical_basis TEXT,
  resp_name TEXT,
  resp_role TEXT,
  resp_crea TEXT,
  resp_reg TEXT,
  resp_company TEXT,
  resp_email TEXT,
  resp_cnpj TEXT,
  resp_address TEXT,
  resp_city TEXT,
  resp_cep TEXT,
  resp_phone TEXT,
  tech_responsibility_label TEXT,
  photos JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  action TEXT,
  details TEXT,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE checklist_templates (
  key TEXT PRIMARY KEY,
  template JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
