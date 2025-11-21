-- Habilita a extensão UUID
create extension if not exists "uuid-ossp";

-- 1. LIMPEZA: Remove tabelas redundantes em Inglês para evitar confusão
drop table if exists public.vacation_fractions;
drop table if exists public.accrual_periods;
drop table if exists public.employees;
drop table if exists public.org_units;
drop table if exists public.company_holidays;
drop table if exists public.collective_vacation_rules;
drop table if exists public.app_settings;

-- 2. ENUMS (Garante que existam)
do $$ begin
    create type papel_usuario as enum ('user', 'manager', 'rh', 'admin');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type status_geral as enum ('active', 'inactive');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type input_type as enum ('system', 'manual');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type abono_basis as enum ('system', 'manual');
exception
    when duplicate_object then null;
end $$;

-- 3. TABELAS (Português - correspondendo ao esquema existente)

-- Níveis Hierárquicos
create table if not exists public.niveis_hierarquicos (
  level integer primary key,
  description text not null
);

-- Unidades Organizacionais
create table if not exists public.unidades_organizacionais (
  id bigint generated always as identity primary key,
  nome_textual text not null, -- Ex: "Matriz - São Paulo"
  name text not null, -- Ex: "Tecnologia"
  type text not null, -- Ex: "Área"
  parent_id bigint references public.unidades_organizacionais(id)
);

-- Perfis (Funcionários)
create table if not exists public.perfis (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id),
  matricula text unique not null,
  nome text not null,
  email text unique not null,
  cpf text unique,
  data_admissao date not null,
  cargo text not null,
  departamento text,
  area text,
  unidade text,
  gestor_id bigint references public.perfis(id),
  role papel_usuario not null default 'user',
  status status_geral not null default 'active',
  nivel_hierarquico integer references public.niveis_hierarquicos(level)
);

-- Períodos Aquisitivos
create table if not exists public.periodos_aquisitivos (
  id bigint generated always as identity primary key,
  perfil_id bigint references public.perfis(id) not null,
  rotulo_periodo text not null,
  inicio_pa date not null,
  termino_pa date not null,
  limite_concessao date not null,
  saldo_total integer not null default 30,
  status text not null, -- 'planning', 'scheduled', etc.
  vacation_days_input_type input_type default 'system',
  abono_calculation_basis abono_basis default 'system',
  manager_approver_id bigint references public.perfis(id),
  hr_approver_id bigint references public.perfis(id),
  signature_info jsonb
);

-- Fracionamentos (Férias)
create table if not exists public.fracionamentos (
  id bigint generated always as identity primary key,
  perfil_id bigint references public.perfis(id) not null,
  periodo_aquisitivo_id bigint references public.periodos_aquisitivos(id) not null,
  sequencia integer not null,
  inicio_ferias date not null,
  termino_ferias date not null,
  quantidade_dias integer not null,
  dias_abono integer default 0,
  adiantamento_13 boolean default false,
  status text not null -- 'planned', 'scheduled', 'completed', 'canceled'
);

-- Afastamentos
create table if not exists public.afastamentos (
  id bigint generated always as identity primary key,
  perfil_id bigint references public.perfis(id),
  type text not null,
  start_date date not null,
  end_date date not null,
  description text
);

-- Feriados
create table if not exists public.feriados (
  id bigint generated always as identity primary key,
  descricao text not null,
  data date not null,
  tipo text not null, -- 'feriado', 'ponto_facultativo'
  ano integer not null,
  unidade text
);

-- Regras de Férias Coletivas
create table if not exists public.regras_ferias_coletivas (
  id uuid default gen_random_uuid() primary key,
  descricao text not null,
  inicio date not null,
  fim date not null,
  unidade text,
  area text,
  departamento text,
  colaborador_ids bigint[] -- Array de IDs
);

-- Configuração do App
create table if not exists public.configuracao_app (
  id integer generated always as identity primary key,
  config jsonb not null,
  updated_at timestamp with time zone default now(),
  updated_by uuid references auth.users(id)
);

-- 4. SEGURANÇA EM NÍVEL DE LINHA (RLS)

-- Habilita RLS
alter table public.perfis enable row level security;
alter table public.periodos_aquisitivos enable row level security;
alter table public.fracionamentos enable row level security;
alter table public.afastamentos enable row level security;
alter table public.feriados enable row level security;
alter table public.configuracao_app enable row level security;

-- Políticas (Policies)

-- Perfis:
-- Usuários podem ver seu próprio perfil
create policy "Usuários podem ver seu próprio perfil" on public.perfis
  for select using (auth.uid() = user_id);

-- Gestores/RH/Admin podem ver todos os perfis (Simplificado: Usuários autenticados podem ver todos para ver equipe/colegas)
create policy "Usuários autenticados podem ver todos os perfis" on public.perfis
  for select using (auth.role() = 'authenticated');

-- Atualizações: Usuários podem atualizar o próprio? Ou apenas RH? Vamos permitir RH e Admin.
-- Para protótipo: Usuários autenticados podem atualizar (para facilitar testes de edição)
create policy "Usuários autenticados podem atualizar perfis" on public.perfis
  for update using (auth.role() = 'authenticated');


-- Períodos Aquisitivos:
-- Visualização: Períodos próprios ou se você for gestor/RH
create policy "Usuários podem ver seus próprios períodos" on public.periodos_aquisitivos
  for select using (
    perfil_id in (select id from public.perfis where user_id = auth.uid())
    or 
    exists (select 1 from public.perfis where user_id = auth.uid() and (role = 'rh' or role = 'admin' or role = 'manager'))
  );

-- Atualização: RH, Admin, Gestor (aprovações)
create policy "Usuários autenticados podem atualizar períodos" on public.periodos_aquisitivos
  for all using (auth.role() = 'authenticated');


-- Fracionamentos:
create policy "Usuários podem ver seus próprios fracionamentos" on public.fracionamentos
  for select using (
    perfil_id in (select id from public.perfis where user_id = auth.uid())
    or 
    exists (select 1 from public.perfis where user_id = auth.uid() and (role = 'rh' or role = 'admin' or role = 'manager'))
  );

create policy "Usuários autenticados podem gerenciar fracionamentos" on public.fracionamentos
  for all using (auth.role() = 'authenticated');


-- Feriados & Config: Legível por todos autenticados
create policy "Usuários autenticados podem ver feriados" on public.feriados
  for select using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem ver configuração" on public.configuracao_app
  for select using (auth.role() = 'authenticated');

-- Inserção de Configuração Padrão
insert into public.configuracao_app (config)
select '{"antecedenciaMinima": 30, "diasMinimosFracao": 10, "permiteVenderFerias": true, "permiteAdiantamento13": true}'::jsonb
where not exists (select 1 from public.configuracao_app);
