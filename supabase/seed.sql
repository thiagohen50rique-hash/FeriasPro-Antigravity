-- Seed Data for FeriasPro (Portuguese Tables)

-- Unidades Organizacionais (unidades_organizacionais)
insert into unidades_organizacionais (nome_textual, name, type, parent_id) values
('Matriz - São Paulo', 'Tecnologia', 'Área', null),
('Matriz - São Paulo', 'Recursos Humanos', 'Área', null),
('Matriz - São Paulo', 'Administração de Pessoal', 'Área', 2), -- Assuming ID 2 is RH
('Matriz - São Paulo', 'PMO', 'Área', 1) -- Assuming ID 1 is Tech
on conflict do nothing;

-- Níveis Hierárquicos (niveis_hierarquicos)
insert into niveis_hierarquicos (level, description) values
(1, 'Analista'),
(2, 'Coordenador'),
(3, 'Gerente'),
(4, 'Diretor'),
(5, 'VP')
on conflict (level) do nothing;

-- Perfis (perfis)
insert into perfis (id, matricula, nome, data_admissao, cargo, departamento, area, unidade, gestor_id, email, cpf, role, status, nivel_hierarquico) values
(1, '100524', 'Ana Silva', '2022-05-10', 'Analista de RH Pleno', 'Recursos Humanos', 'Recursos Humanos', 'Matriz - São Paulo', 4, 'ana.silva@empresa.com', '11122233344', 'user', 'active', 1),
(2, '2002', 'Bruno Costa', '2018-02-20', 'Gerente de Projetos', 'PMO', 'Tecnologia', 'São Paulo', 5, 'bruno.costa@empresa.com', '55566677788', 'admin', 'active', 4),
(3, '3003', 'Carla Dias', '2019-11-01', 'Analista de RH', 'Recursos Humanos', 'Recursos Humanos', 'Rio de Janeiro', 6, 'carla.dias@empresa.com', '99988877766', 'rh', 'active', 1),
(4, '4004', 'Carlos Pereira', '2015-03-15', 'Coordenador de RH', 'Recursos Humanos', 'Recursos Humanos', 'Matriz - São Paulo', 6, 'carlos.pereira@empresa.com', '44455566677', 'manager', 'active', 2),
(5, '5005', 'Marcia Lima', '2012-01-10', 'Diretora de Tecnologia', 'Tecnologia', 'Tecnologia', 'Matriz - São Paulo', null, 'marcia.lima@empresa.com', '12312312312', 'manager', 'active', 5),
(6, '6006', 'Roberto Almeida', '2014-08-01', 'Gerente de RH', 'Recursos Humanos', 'Recursos Humanos', 'Rio de Janeiro', 5, 'roberto.almeida@empresa.com', '32132132132', 'manager', 'active', 4)
on conflict (matricula) do nothing;

-- Períodos Aquisitivos (periodos_aquisitivos)
insert into periodos_aquisitivos (perfil_id, rotulo_periodo, inicio_pa, termino_pa, limite_concessao, saldo_total, status, vacation_days_input_type, abono_calculation_basis, manager_approver_id, hr_approver_id) values
(1, '2022-2023', '2022-05-10', '2023-05-09', '2024-05-08', 30, 'scheduled', 'system', 'system', 4, 3),
(1, '2023-2024', '2023-05-10', '2024-05-09', '2025-05-08', 30, 'scheduled', 'system', 'system', 4, 3),
(1, '2024-2025', '2024-05-10', '2025-05-09', '2026-05-08', 30, 'planning', 'system', 'system', null, null),
(2, '2022-2023', '2022-02-20', '2023-02-19', '2024-02-18', 30, 'scheduled', 'system', 'system', 5, 3),
(2, '2023-2024', '2023-02-20', '2024-02-19', '2025-02-18', 30, 'planning', 'system', 'system', null, null),
(2, '2024-2025', '2024-02-20', '2025-02-19', '2026-01-15', 30, 'scheduled', 'system', 'system', 5, 3),
(3, '2022-2023', '2022-11-01', '2023-10-31', '2024-10-30', 30, 'planning', 'system', 'system', null, null)
on conflict (id) do nothing;

-- Fracionamentos (fracionamentos)
-- Note: We need to know the IDs of periodos_aquisitivos. Since we can't easily know generated IDs in seed, 
-- we might need to rely on the fact that they are inserted sequentially or use a DO block.
-- For simplicity in this seed file, we will assume IDs 1, 2, 3... based on insertion order above.
-- BE CAREFUL: If you run this multiple times, IDs will increment. 
-- Ideally, use a DO block with lookups.

do $$
declare
    p_ana_1 int;
    p_ana_2 int;
    p_ana_3 int;
    p_bruno_1 int;
begin
    select id into p_ana_1 from periodos_aquisitivos where perfil_id = 1 and rotulo_periodo = '2022-2023';
    select id into p_ana_2 from periodos_aquisitivos where perfil_id = 1 and rotulo_periodo = '2023-2024';
    select id into p_ana_3 from periodos_aquisitivos where perfil_id = 1 and rotulo_periodo = '2024-2025';
    select id into p_bruno_1 from periodos_aquisitivos where perfil_id = 2 and rotulo_periodo = '2022-2023';

    if p_ana_1 is not null then
        insert into fracionamentos (perfil_id, periodo_aquisitivo_id, sequencia, inicio_ferias, termino_ferias, quantidade_dias, dias_abono, adiantamento_13, status) values
        (1, p_ana_1, 1, '2024-09-01', '2024-09-30', 30, 0, true, 'scheduled');
    end if;

    if p_ana_2 is not null then
        insert into fracionamentos (perfil_id, periodo_aquisitivo_id, sequencia, inicio_ferias, termino_ferias, quantidade_dias, dias_abono, adiantamento_13, status) values
        (1, p_ana_2, 1, '2025-01-10', '2025-01-29', 20, 10, false, 'scheduled'),
        (1, p_ana_2, 2, '2025-02-01', '2025-02-10', 10, 10, false, 'canceled');
    end if;
    
    if p_ana_3 is not null then
        insert into fracionamentos (perfil_id, periodo_aquisitivo_id, sequencia, inicio_ferias, termino_ferias, quantidade_dias, dias_abono, adiantamento_13, status) values
        (1, p_ana_3, 1, '2025-06-15', '2025-06-24', 10, 0, true, 'planned'),
        (1, p_ana_3, 2, '2025-07-01', '2025-07-20', 20, 0, false, 'planned');
    end if;

    if p_bruno_1 is not null then
        insert into fracionamentos (perfil_id, periodo_aquisitivo_id, sequencia, inicio_ferias, termino_ferias, quantidade_dias, dias_abono, adiantamento_13, status) values
        (2, p_bruno_1, 1, '2024-01-02', '2024-01-16', 15, 0, true, 'scheduled');
    end if;
end $$;

-- Feriados (feriados)
insert into feriados (descricao, data, tipo, ano, unidade) values
('Confraternização Universal', '2024-01-01', 'feriado', 2024, null),
('Carnaval', '2024-02-13', 'ponto_facultativo', 2024, null),
('Sexta-feira Santa', '2024-03-29', 'feriado', 2024, null),
('Tiradentes', '2024-04-21', 'feriado', 2024, null),
('Dia do Trabalho', '2024-05-01', 'feriado', 2024, null),
('Corpus Christi', '2024-05-30', 'ponto_facultativo', 2024, null),
('Independência do Brasil', '2024-09-07', 'feriado', 2024, null),
('Nossa Senhora Aparecida', '2024-10-12', 'feriado', 2024, null),
('Finados', '2024-11-02', 'feriado', 2024, null),
('Proclamação da República', '2024-11-15', 'feriado', 2024, null),
('Natal', '2024-12-25', 'feriado', 2024, null),
('Aniversário de São Paulo', '2025-01-25', 'feriado', 2025, 'Matriz - São Paulo'),
('Aniversário do Rio de Janeiro', '2025-03-01', 'feriado', 2025, 'Rio de Janeiro'),
('Folga (Feriado)', '2025-11-10', 'feriado', 2025, null)
on conflict (id) do nothing;

-- Regras de Férias Coletivas (regras_ferias_coletivas)
insert into regras_ferias_coletivas (descricao, inicio, fim, unidade) values
('Férias Coletivas de Fim de Ano', '2024-12-23', '2025-01-03', 'Matriz - São Paulo'),
('Férias Coletivas Fim de Ano 2025', '2025-12-22', '2025-12-31', null)
on conflict (id) do nothing;
