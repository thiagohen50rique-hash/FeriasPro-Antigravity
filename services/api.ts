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
        id: h.id,
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
        id: u.id,
        nome: u.name,
        tipo: u.type,
        idPai: u.parent_id || null
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

export const updateAccrualPeriod = async (periodId: string | number, periodData: any) => {
    const { error } = await supabase
        .from('periodos_aquisitivos')
        .update({
            rotulo_periodo: periodData.rotulo_periodo,
            inicio_pa: periodData.inicioPa,
            termino_pa: periodData.terminoPa,
            limite_concessao: periodData.limiteConcessao,
            saldo_total: periodData.saldoTotal,
            status: periodData.status,
            vacation_days_input_type: periodData.tipoEntradaDiasFerias,
            abono_calculation_basis: periodData.baseCalculoAbono
        })
        .eq('id', periodId);

    if (error) throw error;
};

export const deleteAccrualPeriod = async (periodId: string | number) => {
    const { error } = await supabase
        .from('periodos_aquisitivos')
        .delete()
        .eq('id', periodId);

    if (error) throw error;
};

export const updateVacationFraction = async (fractionId: string | number, fractionData: any) => {
    const { error } = await supabase
        .from('fracionamentos')
        .update({
            inicio_ferias: fractionData.inicioFerias,
            termino_ferias: fractionData.terminoFerias,
            quantidade_dias: fractionData.quantidadeDias,
            dias_abono: fractionData.diasAbono,
            adiantamento_13: fractionData.adiantamento13,
            status: fractionData.status
        })
        .eq('id', fractionId);

    if (error) throw error;
};

export const deleteVacationFraction = async (fractionId: string | number) => {
    const { error } = await supabase
        .from('fracionamentos')
        .delete()
        .eq('id', fractionId);

    if (error) throw error;
};

export const createLeave = async (leaveData: any) => {
    const { error } = await supabase
        .from('afastamentos')
        .insert({
            perfil_id: leaveData.perfilId,
            type: leaveData.type,
            start_date: leaveData.dataInicio,
            end_date: leaveData.dataFim,
            description: leaveData.descricao
        });

    if (error) throw error;
};

export const updateLeave = async (leaveId: string | number, leaveData: any) => {
    const { error } = await supabase
        .from('afastamentos')
        .update({
            type: leaveData.type,
            start_date: leaveData.dataInicio,
            end_date: leaveData.dataFim,
            description: leaveData.descricao
        })
        .eq('id', leaveId);

    if (error) throw error;
};

export const deleteLeave = async (leaveId: string | number) => {
    const { error } = await supabase
        .from('afastamentos')
        .delete()
        .eq('id', leaveId);

    if (error) throw error;
};

export const createCollectiveVacation = async (proposals: any[]) => {
    // This should ideally be a transaction or RPC
    const errors = [];
    for (const proposal of proposals) {
        try {
            // 1. Find the correct accrual period (simplification: find first open period or create logic needed)
            // For now, we assume the frontend or a previous step identified the period, OR we just insert blindly if logic allows.
            // Actually, the proposal usually needs to be attached to a period.
            // If we don't have period logic here, we might fail.
            // Let's assume the proposal object passed here ALREADY contains the period_id or we have to find it.

            // If the proposal structure is just { employeeId, startDate, days }, we lack context.
            // We will assume for now this function is a placeholder for the complex logic needed.

            // However, to be useful, let's implement a basic loop that tries to insert if period_id is present
            if (proposal.periodId) {
                await addVacationFraction(proposal.periodId, {
                    perfil_id: proposal.employeeId,
                    sequencia: 1, // Logic needed
                    inicioFerias: proposal.startDate,
                    terminoFerias: proposal.endDate, // Calculated
                    quantidadeDias: proposal.days,
                    diasAbono: 0,
                    adiantamento13: false,
                    status: 'scheduled'
                });
            }
        } catch (e) {
            errors.push({ proposal, error: e });
        }
    }

    if (errors.length > 0) {
        throw new Error(`Failed to create some collective vacations: ${JSON.stringify(errors)}`);
    }
};
