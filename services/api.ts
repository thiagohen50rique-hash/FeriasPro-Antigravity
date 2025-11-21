import { supabase } from './supabaseClient';
import {
    Funcionario,
    FeriadoEmpresa,
    ConfiguracaoApp,
    UnidadeOrganizacional,
    RegraFeriasColetivas,
    PeriodoAquisitivo,
    PeriodoDeFerias,
    Afastamento,
    NovoFeriadoEmpresa,
    NovosDadosFuncionario
} from '../tipos';

// --- FETCH ---

export const fetchEmployees = async (): Promise<Funcionario[]> => {
    // Fetch from 'perfis' (Portuguese table)
    const { data: employeesData, error: employeesError } = await supabase
        .from('perfis')
        .select('*');

    if (employeesError) throw employeesError;

    const employees: Funcionario[] = [];

    for (const empData of employeesData) {
        // Fetch related 'periodos_aquisitivos'
        const { data: periodsData, error: periodsError } = await supabase
            .from('periodos_aquisitivos')
            .select('*')
            .eq('perfil_id', empData.id);

        if (periodsError) throw periodsError;

        const periods: PeriodoAquisitivo[] = [];
        for (const pData of periodsData) {
            // Fetch related 'fracionamentos'
            const { data: fractionsData, error: fractionsError } = await supabase
                .from('fracionamentos')
                .select('*')
                .eq('periodo_aquisitivo_id', pData.id)
                .order('inicio_ferias', { ascending: true });

            if (fractionsError) throw fractionsError;

            periods.push({
                id: pData.id,
                rotulo_periodo: pData.rotulo_periodo,
                inicioPa: pData.inicio_pa,
                terminoPa: pData.termino_pa,
                limiteConcessao: pData.limite_concessao,
                saldoTotal: pData.saldo_total,
                status: pData.status,
                fracionamentos: fractionsData.map((f: any) => ({
                    id: f.id,
                    sequencia: f.sequencia,
                    inicioFerias: f.inicio_ferias,
                    terminoFerias: f.termino_ferias,
                    quantidadeDias: f.quantidade_dias,
                    diasAbono: f.dias_abono,
                    adiantamento13: f.adiantamento_13,
                    status: f.status
                })),
                tipoEntradaDiasFerias: pData.vacation_days_input_type,
                baseCalculoAbono: pData.abono_calculation_basis,
                idAprovadorGestor: pData.manager_approver_id,
                idAprovadorRH: pData.hr_approver_id,
                infoAssinatura: pData.signature_info
            });
        }

        // Fetch 'afastamentos'
        const { data: leavesData, error: leavesError } = await supabase
            .from('afastamentos')
            .select('*')
            .eq('perfil_id', empData.id);

        if (leavesError) throw leavesError;

        employees.push({
            id: empData.id,
            matricula: empData.matricula,
            nome: empData.nome,
            dataAdmissao: empData.data_admissao,
            cargo: empData.cargo,
            departamento: empData.departamento,

            unidade: empData.unidade,
            gestor: empData.gestor_id,
            email: empData.email,
            cpf: empData.cpf,
            role: empData.role,
            status: empData.status,
            nivelHierarquico: empData.nivel_hierarquico,
            afastamentos: leavesData.map((l: any) => ({
                id: l.id,
                type: l.type,
                dataInicio: l.start_date,
                dataFim: l.end_date,
                descricao: l.description
            })),
            periodosAquisitivos: periods
        });
    }

    return employees;
};

export const fetchHolidays = async (): Promise<FeriadoEmpresa[]> => {
    const { data, error } = await supabase.from('feriados').select('*');
    if (error) throw error;
    return data.map((h: any) => ({
        id: h.id.toString(),
        ano: h.ano,
        descricao: h.descricao,
        data: h.data,
        tipo: h.tipo,
        unidade: h.unidade
    }));
};

export const fetchConfig = async (): Promise<ConfiguracaoApp> => {
    const { data, error } = await supabase.from('configuracao_app').select('config').single();
    if (error) {
        // Return default if not found
        return {
            diasFeriasOptions: [5, 10, 15, 20, 30],
            tipoEntradaDiasFerias: 'list',
            baseCalculoAbono: 'initial_balance',
            antecedenciaMinimaDias: 30,
            antecedenciaMinimaAbonoDias: 60,
            maxFracionamentos: 3,
            prazoLimiteConcessaoDias: 330,
            inicioAdiantamento13: "01/02",
            fimAdiantamento13: "31/10",
            periodoFeriasColetivas: null,
            exibirLimitePrazo: null,
            statusFerias: []
        };
    }
    return data.config;
};

export const fetchOrgUnits = async (): Promise<UnidadeOrganizacional[]> => {
    const { data, error } = await supabase.from('unidades_organizacionais').select('*');
    if (error) throw error;
    return data.map((u: any) => ({
        id: u.id.toString(),
        nome: u.name,
        tipo: u.type,
        idPai: u.parent_id ? u.parent_id.toString() : undefined
    }));
};

export const fetchCollectiveVacationRules = async (): Promise<RegraFeriasColetivas[]> => {
    const { data, error } = await supabase.from('regras_ferias_coletivas').select('*');
    if (error) throw error;
    return data.map((r: any) => ({
        id: r.id,
        descricao: r.descricao,
        inicio: r.inicio,
        fim: r.fim,
        unidade: r.unidade,

        departamento: r.departamento,
        colaboradorIds: r.colaborador_ids || []
    }));
};

// --- MUTATIONS ---

export const updateEmployee = async (id: number, employeeData: Partial<Funcionario>) => {
    const { error } = await supabase
        .from('perfis')
        .update({
            nome: employeeData.nome,
            cargo: employeeData.cargo,
            departamento: employeeData.departamento,

            unidade: employeeData.unidade,
            gestor_id: employeeData.gestor,
            status: employeeData.status,
            nivel_hierarquico: employeeData.nivelHierarquico
        })
        .eq('id', id);

    if (error) throw error;
};

export const createEmployee = async (employee: NovosDadosFuncionario) => {
    const { error } = await supabase
        .from('perfis')
        .insert({
            matricula: employee.matricula,
            nome: employee.nome,
            email: employee.email,
            cpf: employee.cpf,
            data_admissao: employee.dataAdmissao,
            cargo: employee.cargo,
            departamento: employee.departamento,

            unidade: employee.unidade,
            gestor_id: employee.gestor,
            role: employee.role,
            status: employee.status,
            nivel_hierarquico: employee.nivelHierarquico
        });

    if (error) throw error;
};

export const createHoliday = async (holiday: NovoFeriadoEmpresa) => {
    const { error } = await supabase
        .from('feriados')
        .insert({
            descricao: holiday.descricao,
            data: holiday.data,
            tipo: holiday.tipo,
            ano: holiday.ano,
            unidade: holiday.unidade
        });
    if (error) throw error;
};

export const addVacationFraction = async (periodId: string | number, fraction: any) => {
    const { error } = await supabase
        .from('fracionamentos')
        .insert({
            periodo_aquisitivo_id: Number(periodId), // Ensure numeric ID
            perfil_id: fraction.perfil_id, // Need to pass this
            sequencia: fraction.sequencia,
            inicio_ferias: fraction.inicioFerias,
            termino_ferias: fraction.terminoFerias,
            quantidade_dias: fraction.quantidadeDias,
            dias_abono: fraction.diasAbono,
            adiantamento_13: fraction.adiantamento13,
            status: fraction.status
        });
    if (error) throw error;
};
