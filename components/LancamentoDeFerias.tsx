


import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import { 
    PeriodoAquisitivo, 
    Funcionario, 
    PeriodoDeFerias, 
    RegraFeriasColetivas,
    Afastamento
} from '../tipos';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UserIcon from './icons/UserIcon';
import UsersIcon from './icons/UsersIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { getDynamicStatus, getStatusBadge, getStatusText, getDynamicAccrualPeriodStatus } from '../constants';
import PencilIcon from './icons/PencilIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import WarningTriangleIcon from './icons/WarningTriangleIcon';
import { formatDate } from '../utils/dateUtils';
import MultiSelect from './MultiSelect';
import ChevronDownIcon from './icons/ChevronDownIcon';

// Helper Functions
const calculateEndDate = (startDate: string, days: number): string => {
    if (!startDate || days <= 0) return '';
    const date = new Date(`${startDate}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days - 1);
    return date.toISOString().split('T')[0];
};

const findApplicableCollectiveRule = (employee: Funcionario, rules: RegraFeriasColetivas[]): RegraFeriasColetivas | null => {
    if (!employee || !rules) return null;
    const today = new Date().toISOString().split('T')[0];
    for (const rule of rules) {
        if (rule.fim < today) continue;
        let matches = true;
        if (rule.unidade && rule.unidade !== employee.unidade) matches = false;
        if (rule.area && rule.area !== employee.area) matches = false;
        if (rule.departamento && rule.departamento !== employee.departamento) matches = false;
        if (rule.colaboradorIds && rule.colaboradorIds.length > 0 && !rule.colaboradorIds.includes(employee.id)) matches = false;
        if (matches) return rule;
    }
    return null;
};

const calculatePeriodRemainingDays = (period: PeriodoAquisitivo) => {
    const usedAndAbono = period.fracionamentos
        .filter(f => f.status !== 'canceled' && f.status !== 'rejected')
        .reduce((sum, frac) => sum + frac.quantidadeDias + (frac.diasAbono || 0), 0);
    return period.saldoTotal - usedAndAbono;
};


const ExpandedContentForEntry: React.FC<{ employee: Funcionario; period: PeriodoAquisitivo }> = ({ employee, period }) => {
    const { user, config, holidays, collectiveVacationRules, addDirectVacation, updateVacationPeriod, deleteVacation } = useAuth();
    const modal = useModal();
    const isAdmin = user?.role === 'admin' || user?.role === 'rh';

    const [isScheduling, setIsScheduling] = useState(false);
    const [editingVacationId, setEditingVacationId] = useState<string | null>(null);
    const [newVacation, setNewVacation] = useState({
        startDate: '',
        days: config?.diasFeriasOptions[0] || 15,
        diasAbono: 0,
        solicitarAbono: false,
        adiantamento13: false,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (error) setError('');
    }, [newVacation]);

    const periodStats = useMemo(() => {
        const usedDays = period.fracionamentos
            .filter(f => f.id !== editingVacationId && f.status !== 'canceled' && f.status !== 'rejected')
            .reduce((sum, frac) => sum + frac.quantidadeDias, 0);

        const abonoDays = period.fracionamentos
            .filter(f => f.id !== editingVacationId && f.status !== 'canceled' && f.status !== 'rejected')
            .reduce((sum, frac) => sum + (frac.diasAbono || 0), 0);

        const remainingBalance = period.saldoTotal - usedDays - abonoDays;
        return { usedDays, abonoDays, remainingBalance };
    }, [period, editingVacationId]);
    
    const abonoCalculationBasis = useMemo(() => {
        if (!config) return 'initial_balance';
        return period.abonoCalculationBasis === 'system' 
            ? config.abonoCalculationBasis 
            : period.abonoCalculationBasis;
    }, [period, config]);

    const exactAbonoDays = useMemo(() => {
        if (!period) return 0;
        const basis = abonoCalculationBasis === 'current_balance' 
            ? periodStats.remainingBalance 
            : period.saldoTotal;
        const totalAbonoAllowed = Math.floor(basis / 3);
        if (abonoCalculationBasis === 'initial_balance') {
            return periodStats.abonoDays > 0 ? 0 : totalAbonoAllowed;
        }
        return totalAbonoAllowed;
    }, [period, abonoCalculationBasis, periodStats.remainingBalance, periodStats.abonoDays]);

    const isAbonoDisabled = useMemo(() => {
        if (exactAbonoDays <= 0) return true;
        return newVacation.days + exactAbonoDays > periodStats.remainingBalance;
    }, [newVacation.days, exactAbonoDays, periodStats.remainingBalance]);

    useEffect(() => {
        if (isAbonoDisabled && newVacation.solicitarAbono) {
            setNewVacation(prev => ({ ...prev, solicitarAbono: false, diasAbono: 0 }));
        }
    }, [isAbonoDisabled, newVacation.solicitarAbono]);


    const { remainingBalance, usedDays, abonoDays } = periodStats;
    const totalUtilizado = usedDays + abonoDays;

    const availableDaysForNewRequest = useMemo(() => {
        if (!config) return [];
        return config.diasFeriasOptions.filter(d => d <= remainingBalance);
    }, [remainingBalance, config?.diasFeriasOptions]);

    const resetFormState = () => {
        setIsScheduling(false);
        setEditingVacationId(null);
        setNewVacation({
            startDate: '',
            days: availableDaysForNewRequest[0] || (config?.diasFeriasOptions[0] || 15),
            diasAbono: 0,
            solicitarAbono: false,
            adiantamento13: false,
        });
        setError('');
    };

    const handleStartAdding = () => {
        resetFormState();
        setIsScheduling(true);
    };

    const handleStartEditing = (vacation: PeriodoDeFerias) => {
        setEditingVacationId(vacation.id);
        setNewVacation({
            startDate: vacation.inicioFerias,
            days: vacation.quantidadeDias,
            adiantamento13: vacation.adiantamento13,
            diasAbono: vacation.diasAbono || 0,
            solicitarAbono: (vacation.diasAbono || 0) > 0,
        });
        setIsScheduling(true);
        setError('');
    };

    const handleSaveVacation = async () => {
        if (!period || !employee || !config) return;
        setError('');

        const { startDate, days, adiantamento13, diasAbono, solicitarAbono } = newVacation;
        const effectiveDiasAbono = solicitarAbono ? diasAbono : 0;
        
        if (!startDate) { setError('Por favor, selecione uma data de início.'); return; }
        if (days <= 0) { setError('A quantidade de dias deve ser maior que zero.'); return; }
        
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const startDateObj = new Date(`${startDate}T12:00:00Z`);
        const dayOfWeek = startDateObj.getUTCDay();

        if (dayOfWeek === 5 || dayOfWeek === 6) { setError('É vedado o início das férias em sextas-feiras e sábados, pois antecedem o repouso semanal.'); return; }

        const oneDayAfterStart = new Date(startDateObj); oneDayAfterStart.setUTCDate(oneDayAfterStart.getUTCDate() + 1);
        const twoDaysAfterStart = new Date(startDateObj); twoDaysAfterStart.setUTCDate(twoDaysAfterStart.getUTCDate() + 2);
        const oneDayAfterStr = oneDayAfterStart.toISOString().split('T')[0];
        const twoDaysAfterStr = twoDaysAfterStart.toISOString().split('T')[0];
        const isHolidayNextDay = holidays.some(h => h.data === oneDayAfterStr && (h.tipo === 'feriado' || h.tipo === 'ponto_facultativo') && (!h.unidade || h.unidade === employee.unidade));
        const isHolidayInTwoDays = holidays.some(h => h.data === twoDaysAfterStr && (h.tipo === 'feriado' || h.tipo === 'ponto_facultativo') && (!h.unidade || h.unidade === employee.unidade));
        if (isHolidayNextDay || isHolidayInTwoDays) { setError('O início das férias não pode ocorrer nos 2 dias que antecedem um feriado.'); return; }

        if (adiantamento13) {
            const vacationYear = startDateObj.getUTCFullYear();
            const hasExistingAdvanceInYear = employee.periodosAquisitivos.some(pa =>
                pa.fracionamentos.some(f =>
                    f.id !== editingVacationId &&
                    f.adiantamento13 &&
                    f.status !== 'canceled' &&
                    f.status !== 'rejected' &&
                    new Date(`${f.inicioFerias}T12:00:00Z`).getUTCFullYear() === vacationYear
                )
            );
            if (hasExistingAdvanceInYear) {
                setError('Já existe uma solicitação de adiantamento do 13º para este ano.');
                return;
            }
        }

        const accrualPeriodEndDate = new Date(`${period.terminoPa}T12:00:00Z`);
        if (startDateObj < accrualPeriodEndDate) {
            let canProceed = false;
            const applicableRule = findApplicableCollectiveRule(employee, collectiveVacationRules);
            if (applicableRule) {
                const vacationEndDateStr = calculateEndDate(startDate, days);
                const vacationEndDateObj = new Date(`${vacationEndDateStr}T12:00:00Z`);
                const ruleStartDate = new Date(`${applicableRule.inicio}T12:00:00Z`);
                const ruleEndDate = new Date(`${applicableRule.fim}T12:00:00Z`);
                if (startDateObj <= ruleStartDate && vacationEndDateObj >= ruleEndDate) canProceed = true;
            }
            if (!canProceed && isAdmin) {
                if (!await modal.confirm({ title: 'Alerta de Risco', message: `A data de início é anterior ao vencimento do P.A. (${formatDate(period.terminoPa)}). Deseja continuar?`, confirmVariant: 'warning', confirmText: 'Continuar' })) return;
            } else if (!canProceed) {
                setError(`Não é permitido agendar férias com início antes do término do P.A. (${formatDate(period.terminoPa)}).`); return;
            }
        }
        
        const minDate = new Date(today); minDate.setDate(minDate.getDate() + config.antecedenciaMinimaDias);
        if (startDateObj < minDate && !isAdmin) { setError(`A solicitação deve ser feita com no mínimo ${config.antecedenciaMinimaDias} dias de antecedência.`); return; }
        if (startDateObj < minDate && isAdmin) {
             if (!await modal.confirm({ title: 'Alerta de Antecedência', message: `A data de início não respeita a antecedência mínima de ${config.antecedenciaMinimaDias} dias. Deseja continuar?`, confirmVariant: 'warning', confirmText: 'Continuar' })) return;
        }

        if (effectiveDiasAbono > 0) {
            const limiteConcessaoDateAbono = new Date(`${period.limiteConcessao}T12:00:00Z`);
            const minRequestDateForAbono = new Date(limiteConcessaoDateAbono);
            minRequestDateForAbono.setDate(minRequestDateForAbono.getDate() - config.antecedenciaMinimaAbonoDias);
    
            if (today > minRequestDateForAbono && !isAdmin) {
                setError(`A solicitação de abono deve ser feita com no mínimo ${config.antecedenciaMinimaAbonoDias} dias de antecedência do vencimento do período (${formatDate(period.limiteConcessao)}).`); return;
            }
            if (today > minRequestDateForAbono && isAdmin) {
                if (!await modal.confirm({ title: 'Alerta de Prazo de Abono', message: `A solicitação de abono não respeita o prazo mínimo de ${config.antecedenciaMinimaAbonoDias} dias antes do vencimento do período. Deseja continuar?`, confirmVariant: 'warning', confirmText: 'Continuar' })) return;
            }
        }

        const limiteConcessaoDate = new Date(`${period.limiteConcessao}T12:00:00Z`);
        if (startDateObj >= limiteConcessaoDate) {
            if (isAdmin) {
                if (!await modal.confirm({ title: 'Alerta de Vencimento', message: `A data de início é posterior ao limite de concessão (${formatDate(period.limiteConcessao)}). Deseja continuar?`, confirmVariant: 'warning', confirmText: 'Continuar' })) return;
            } else {
                 modal.alert({
                    title: 'Data de Início Inválida',
                    message: `A data de início não pode ser no dia ou após o limite de concessão (${formatDate(period.limiteConcessao)}).`,
                    confirmVariant: 'warning',
                 });
                 return;
            }
        }
        
        const otherFractions = period.fracionamentos.filter(f => f.id !== editingVacationId && f.status !== 'canceled' && f.status !== 'rejected');
        const endDateObj = new Date(calculateEndDate(startDate, days));
        for (const existing of otherFractions) {
            const existingStart = new Date(`${existing.inicioFerias}T12:00:00Z`);
            const existingEnd = new Date(`${existing.terminoFerias}T12:00:00Z`);
            if (startDateObj <= existingEnd && endDateObj >= existingStart) {
                setError(`As datas deste período estão sobrepondo um período já agendado (${formatDate(existing.inicioFerias)} a ${formatDate(existing.terminoFerias)}).`); return;
            }
        }
        
        const tempVacation = { inicioFerias: startDate, quantidadeDias: days, terminoFerias: calculateEndDate(startDate, days), adiantamento13, diasAbono: effectiveDiasAbono };
        if (days + effectiveDiasAbono > remainingBalance) { setError(`O total de dias de férias e abono (${days + effectiveDiasAbono}) excede o saldo disponível de ${remainingBalance} dias.`); return; }
        if (!editingVacationId && otherFractions.length >= config.maxFracionamentos) { setError(`Não é permitido mais de ${config.maxFracionamentos} períodos de férias.`); return; }
        const allProposedFractions = [...otherFractions, tempVacation];
        if (allProposedFractions.length > 1 && allProposedFractions.some(f => f.quantidadeDias < 5)) { setError('Ao fracionar as férias, nenhum período pode ser inferior a 5 dias.'); return; }
        const remainingBalanceAfterRequest = remainingBalance - days - effectiveDiasAbono;
        if (remainingBalanceAfterRequest > 0 && remainingBalanceAfterRequest < 5) { setError(`Esta solicitação deixaria um saldo residual de ${remainingBalanceAfterRequest} dias. O saldo restante deve ser de no mínimo 5 dias ou zerado.`); return; }
        if (!allProposedFractions.some(f => f.quantidadeDias >= 14)) {
            if(remainingBalanceAfterRequest === 0 && allProposedFractions.length > 0) { setError('Ao utilizar todo o saldo, um dos períodos fracionados deve ser de no mínimo 14 dias.'); return; }
            if (remainingBalanceAfterRequest > 0 && remainingBalanceAfterRequest < 14) { setError(`Esta solicitação deixaria um saldo de ${remainingBalanceAfterRequest} dias, impossibilitando a programação do período obrigatório de 14 dias.`); return; }
        }

        const vacationData = { inicioFerias: startDate, terminoFerias: calculateEndDate(startDate, days), quantidadeDias: days, diasAbono: effectiveDiasAbono, adiantamento13 };
        
        if (editingVacationId) {
            updateVacationPeriod(employee.id, period.id, editingVacationId, { ...vacationData, status: 'scheduled' });
            modal.alert({ title: 'Sucesso!', message: `Férias de ${employee.nome} alteradas com sucesso.` });
        } else {
            addDirectVacation(employee.id, period.id, vacationData);
            modal.alert({ title: 'Sucesso!', message: `Férias lançadas para ${employee.nome} com sucesso.` });
        }
        resetFormState();
    };

    const handleDeleteVacation = async (vacationId: string) => {
        const confirmed = await modal.confirm({ 
            title: 'Confirmar Exclusão', 
            message: 'Tem certeza que deseja excluir esta programação de férias?', 
            confirmText: 'Excluir', 
            confirmVariant: 'danger' 
        });
        if (confirmed) {
            deleteVacation(employee.id, period.id, vacationId);
            modal.alert({ title: 'Sucesso', message: 'Férias excluídas com sucesso.' });
        }
    };
    
    const nonCanceledFractions = useMemo(() => period.fracionamentos.filter(f => f.status !== 'canceled' && f.status !== 'rejected'), [period]);
    const canAddFraction = remainingBalance > 0 && nonCanceledFractions.length < (config?.maxFracionamentos || 3);

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-600"> {totalUtilizado} de {period.saldoTotal} dias utilizados</span>
                    <span className="text-sm font-medium text-slate-600">{remainingBalance} dias restantes</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${period.saldoTotal > 0 ? (totalUtilizado / period.saldoTotal) * 100 : 0}%` }}></div>
                </div>
            </div>
            
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-3">Férias Programadas</h4>
                {nonCanceledFractions.length > 0 ? (
                    <ul className="space-y-3">
                        {nonCanceledFractions.map(f => {
                            const dynamicStatus = getDynamicStatus(f);
                            return (
                                <li key={f.id} className="flex flex-wrap justify-between items-center p-3 bg-slate-100 rounded-md border border-slate-200">
                                    <div className="font-medium text-slate-700"> {f.sequencia}º Período: {formatDate(f.inicioFerias)} a {formatDate(f.terminoFerias)} </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-slate-500">{f.quantidadeDias} dias</span>
                                            {f.diasAbono > 0 && <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Abono ({f.diasAbono}d)</span>}
                                            {f.adiantamento13 && <span className="text-xs font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">+ 13º</span>}
                                        </div>
                                        <span className={getStatusBadge(dynamicStatus)}>{getStatusText(dynamicStatus)}</span>
                                        <div className="flex items-center border-l border-slate-300 pl-3 ml-2 space-x-2">
                                            <button 
                                                onClick={() => handleStartEditing(f)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                                title="Editar"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteVacation(f.id)}
                                                className="p-1.5 text-slate-400 hover:text-danger rounded-full hover:bg-red-50 transition-colors"
                                                title="Excluir"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                    <div className="text-center py-6 bg-slate-100 rounded-lg border border-dashed"><p className="text-sm text-slate-500">Nenhuma férias programada para este período.</p></div>
                )}
            </div>
            
            {isScheduling ? (
                <div className="p-4 border-t border-slate-200 mt-6 bg-slate-100 rounded-lg">
                     <h5 className="font-semibold text-slate-800 mb-4">{editingVacationId ? 'Alterar Programação' : 'Lançar Nova Programação'}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
                            <input type="date" value={newVacation.startDate} onChange={e => setNewVacation({...newVacation, startDate: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Dias de Férias</label>
                            <input type="number" value={newVacation.days} onChange={e => setNewVacation({...newVacation, days: parseInt(e.target.value) || 0})} min="1" max={remainingBalance} className="bg-white w-full border-gray-300 rounded-md shadow-sm" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-6 mb-4">
                        {exactAbonoDays > 0 && (
                            <div className="flex items-center" title={isAbonoDisabled ? `Saldo insuficiente para solicitar abono com ${newVacation.days} dias de férias.` : ''}>
                                <input
                                    id={`abono-${period.id}`}
                                    type="checkbox"
                                    checked={!!newVacation.solicitarAbono}
                                    onChange={e => setNewVacation({ ...newVacation, solicitarAbono: e.target.checked, diasAbono: e.target.checked ? exactAbonoDays : 0 })}
                                    disabled={isAbonoDisabled}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:bg-slate-200 disabled:cursor-not-allowed"
                                />
                                <label htmlFor={`abono-${period.id}`} className={`ml-2 block text-sm ${isAbonoDisabled ? 'text-slate-400' : 'text-slate-800'}`}>
                                    Solicitar abono pecuniário (venda de {exactAbonoDays} dias)
                                </label>
                            </div>
                        )}
                        <div className="flex items-center">
                            <input id={`adiantamento13-${period.id}`} type="checkbox" checked={newVacation.adiantamento13} onChange={e => setNewVacation({...newVacation, adiantamento13: e.target.checked})} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                            <label htmlFor={`adiantamento13-${period.id}`} className="ml-2 block text-sm text-slate-800">Solicitar adiantamento do 13º</label>
                        </div>
                    </div>
                    {error && <p className="text-sm text-center text-danger bg-danger/10 p-2 rounded border border-danger/20">{error}</p>}
                    <div className="flex justify-end space-x-3 mt-4">
                        <button type="button" onClick={resetFormState} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancelar</button>
                        <button type="button" onClick={handleSaveVacation} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">{editingVacationId ? 'Salvar Alterações' : 'Lançar Férias'}</button>
                    </div>
                </div>
            ) : (
                <button onClick={handleStartAdding} disabled={!canAddFraction} className="w-full mt-4 py-2.5 px-4 border border-dashed border-slate-400 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition flex items-center justify-center font-semibold disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {!canAddFraction ? (remainingBalance <= 0 ? 'Saldo esgotado' : 'Limite de 3 períodos atingido') : 'Lançar Novo Período'}
                </button>
            )}
        </div>
    );
};


const IndividualEntry: React.FC = () => {
    const { allEmployees, activeEmployees } = useAuth();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [expandedPeriodId, setExpandedPeriodId] = useState<string | null>(null);

    const selectedEmployee = useMemo(() =>
        allEmployees.find(e => e.id === parseInt(selectedEmployeeId, 10)),
        [allEmployees, selectedEmployeeId]
    );

    const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedEmployeeId(e.target.value);
        setExpandedPeriodId(null);
    };

    const handleToggleExpand = (periodId: string) => {
        setExpandedPeriodId(current => (current === periodId ? null : periodId));
    };

    return (
        <div>
            <div className="mb-6">
                <label htmlFor="employee-select" className="block text-sm font-medium text-slate-700 mb-1">Colaborador</label>
                <select id="employee-select" value={selectedEmployeeId} onChange={handleEmployeeChange} required className="bg-white w-full md:w-1/2 border-gray-300 rounded-md shadow-sm text-base py-2.5 px-3">
                    <option value="">Selecione um colaborador...</option>
                    {activeEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                </select>
            </div>

            {selectedEmployee && (
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white uppercase bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Data de Admissão</th>
                                <th className="px-4 py-3 font-semibold">Período Aquisitivo</th>
                                <th className="px-4 py-3 font-semibold">Limite Concessão</th>
                                <th className="px-4 py-3 font-semibold text-center">Dias Disponíveis</th>
                                <th className="px-4 py-3 font-semibold text-center">Status</th>
                                <th className="px-4 py-3 font-semibold text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedEmployee.periodosAquisitivos.length > 0 ? selectedEmployee.periodosAquisitivos.map(period => {
                                const remainingDays = calculatePeriodRemainingDays(period);
                                const isExpired = new Date(period.limiteConcessao) < new Date();
                                const dynamicStatus = getDynamicAccrualPeriodStatus(period);
                                return (
                                    <React.Fragment key={period.id}>
                                        <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4 text-slate-600">{formatDate(selectedEmployee.dataAdmissao)}</td>
                                            <td className="px-4 py-4 font-medium text-slate-800">{formatDate(period.inicioPa)} a {formatDate(period.terminoPa)}</td>
                                            <td className={`px-4 py-4 text-slate-600 ${isExpired ? 'text-danger font-semibold' : ''}`}>{formatDate(period.limiteConcessao)}</td>
                                            <td className="px-4 py-4 text-center font-bold text-lg text-blue-800">{remainingDays}</td>
                                            <td className="px-4 py-4 text-center"><span className={getStatusBadge(dynamicStatus)}>{getStatusText(dynamicStatus)}</span></td>
                                            <td className="px-4 py-4 text-center">
                                                <button onClick={() => handleToggleExpand(period.id)} className="px-4 py-2 text-sm font-semibold text-primary bg-blue-25 border border-primary/20 rounded-lg hover:bg-blue-500 hover:text-white transition-colors">
                                                    {expandedPeriodId === period.id ? 'Fechar' : 'Lançar / Gerenciar'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedPeriodId === period.id && (
                                            <tr>
                                                <td colSpan={6} className="p-0 bg-slate-50 border-b-4 border-primary">
                                                    <ExpandedContentForEntry employee={selectedEmployee} period={period} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-500">
                                        Nenhum período aquisitivo encontrado para este colaborador.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

type CandidateStatus = 'eligible' | 'warning' | 'error';

interface SimulationCandidate {
    employee: Funcionario;
    isSelected: boolean;
    status: CandidateStatus;
    messages: string[];
    proposedDays: number;
    availableBalance: number;
}

const CollectiveEntry: React.FC = () => {
    const { activeEmployees, addCollectiveVacation, companyUnits, companyManagements, companyAreas } = useAuth();
    const modal = useModal();
    const [step, setStep] = useState<'configure' | 'preview'>('configure');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; details?: string[]} | null>(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [filters, setFilters] = useState({
        unidade: [] as string[],
        gerencia: [] as string[],
        area: [] as string[],
    });

    const [candidates, setCandidates] = useState<SimulationCandidate[]>([]);

    // Filter employees based on selection
    const filteredEmployees = useMemo(() => {
        return activeEmployees.filter(emp => {
            const matchUnidade = filters.unidade.length === 0 || filters.unidade.includes(emp.unidade);
            const matchGerencia = filters.gerencia.length === 0 || filters.gerencia.includes(emp.area);
            const matchArea = filters.area.length === 0 || filters.area.includes(emp.departamento);
            return matchUnidade && matchGerencia && matchArea;
        });
    }, [activeEmployees, filters]);

    // Simulation Logic
    const runSimulation = () => {
        if (!startDate || !endDate) {
            modal.alert({ title: 'Erro', message: 'Preencha as datas de início e fim.', confirmVariant: 'warning' });
            return;
        }
        if (filteredEmployees.length === 0) {
            modal.alert({ title: 'Erro', message: 'Nenhum colaborador selecionado pelos filtros.', confirmVariant: 'warning' });
            return;
        }

        const start = new Date(`${startDate}T12:00:00Z`);
        const end = new Date(`${endDate}T12:00:00Z`);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (totalDays <= 0) {
            modal.alert({ title: 'Erro', message: 'Data final deve ser posterior à inicial.', confirmVariant: 'warning' });
            return;
        }

        const simulationResults: SimulationCandidate[] = filteredEmployees.map(emp => {
            let status: CandidateStatus = 'eligible';
            let messages: string[] = [];
            let isSelected = true;

            // 1. Calculate total available balance across valid periods
            const totalBalance = emp.periodosAquisitivos
                .filter(p => new Date(p.limiteConcessao) > new Date()) // Only non-expired
                .reduce((sum, p) => sum + calculatePeriodRemainingDays(p), 0);

            // 2. Check Tenure (< 1 year)
            const admissionDate = new Date(`${emp.dataAdmissao}T12:00:00Z`);
            const oneYearFromAdmission = new Date(admissionDate);
            oneYearFromAdmission.setFullYear(oneYearFromAdmission.getFullYear() + 1);
            
            if (oneYearFromAdmission > start) {
                status = 'warning';
                messages.push('Menos de 1 ano de casa (Férias proporcionais).');
            }

            // 3. Check Balance Availability
            if (totalBalance === 0) {
                status = 'error';
                messages.push('Sem saldo de férias disponível.');
                isSelected = false;
            } else if (totalBalance < totalDays) {
                status = 'warning';
                messages.push(`Saldo insuficiente (${totalBalance}d) para o período completo (${totalDays}d).`);
            }

            // 4. Check Residual Balance Rule (Must not leave < 5 days)
            // Assuming we take min(totalDays, totalBalance)
            const daysToTake = Math.min(totalDays, totalBalance);
            const residual = totalBalance - daysToTake;
            
            if (residual > 0 && residual < 5) {
                status = 'warning';
                messages.push(`Saldo residual de ${residual} dias (inferior a 5 dias). Considere zerar o saldo.`);
            }
            
            // 5. Check 14-Day Rule Compatibility
            // Heuristic: If they haven't taken 14 days yet, and this operation leaves them with < 14 days total capacity in any single period, flag it.
            // This is complex to simulate perfectly across multiple periods, simplified check:
            const hasTaken14Days = emp.periodosAquisitivos.some(p => p.fracionamentos.some(f => f.quantidadeDias >= 14 && f.status !== 'canceled' && f.status !== 'rejected'));
            
            if (!hasTaken14Days) {
                 // If taking this vacation splits their biggest chunk such that they can't take 14 days later
                 // For simplicity in this simulation, we warn if the current proposed vacation is < 14 AND remaining balance < 14
                 if (daysToTake < 14 && residual < 14 && residual > 0) {
                     status = 'warning';
                     messages.push('Risco: Pode impossibilitar o gozo de 14 dias ininterruptos.');
                 }
            }

            return {
                employee: emp,
                isSelected: isSelected,
                status: status,
                messages: messages,
                proposedDays: Math.min(totalDays, totalBalance), // Default to max possible
                availableBalance: totalBalance
            };
        });

        setCandidates(simulationResults);
        setStep('preview');
    };

    const handleConfirm = async () => {
        const selectedCandidates = candidates.filter(c => c.isSelected);
        if (selectedCandidates.length === 0) {
            modal.alert({ title: 'Atenção', message: 'Nenhum colaborador selecionado para o lançamento.', confirmVariant: 'warning' });
            return;
        }

        // Prepare payload
        const proposals = selectedCandidates.map(c => ({
            employeeId: c.employee.id,
            startDate: startDate,
            days: c.proposedDays
        }));

        setIsSubmitting(true);
        const res = await addCollectiveVacation(proposals);
        setResult(res);
        setIsSubmitting(false);
        if(res.success) {
             // Optional: Navigate away or reset
        }
    };

    const handleCandidateChange = (id: number, field: 'isSelected' | 'proposedDays', value: any) => {
        setCandidates(prev => prev.map(c => {
            if (c.employee.id === id) {
                if (field === 'proposedDays') {
                    // Validate max days
                    const newDays = Math.min(parseInt(value) || 0, c.availableBalance);
                    return { ...c, [field]: newDays };
                }
                return { ...c, [field]: value };
            }
            return c;
        }));
    };

    const renderStatusBadge = (status: CandidateStatus, messages: string[]) => {
        let color = '';
        let icon = null;
        
        switch(status) {
            case 'eligible': color = 'bg-green-100 text-green-800 border-green-200'; icon = <CheckCircleIcon className="w-4 h-4 mr-1"/>; break;
            case 'warning': color = 'bg-yellow-100 text-yellow-800 border-yellow-200'; icon = <WarningTriangleIcon className="w-4 h-4 mr-1"/>; break;
            case 'error': color = 'bg-red-100 text-red-800 border-red-200'; icon = <XCircleIcon className="w-4 h-4 mr-1"/>; break;
        }

        return (
            <div className="group relative flex flex-col items-start">
                <span className={`flex items-center px-2 py-1 rounded text-xs font-semibold border ${color} cursor-help`}>
                    {icon}
                    {status === 'eligible' ? 'Apto' : status === 'warning' ? 'Atenção' : 'Inapto'}
                </span>
                {messages.length > 0 && (
                    <div className="absolute left-0 bottom-full mb-1 w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <ul className="list-disc pl-4">
                            {messages.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    if (step === 'configure') {
        return (
            <form onSubmit={(e) => { e.preventDefault(); runSimulation(); }} className="space-y-6">
                <p className="text-sm text-slate-600">
                    Defina o período de férias coletivas e os filtros de colaboradores. Na próxima etapa, você poderá revisar a elegibilidade de cada funcionário.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data de Fim</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm" />
                    </div>
                </div>

                <div className="pt-6 border-t">
                    <h4 className="font-semibold text-slate-700">Filtros de Colaboradores</h4>
                    <p className="text-sm text-slate-500 mb-4">Se nenhum filtro for aplicado, todos os colaboradores ativos serão considerados.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MultiSelect label="Unidade(s)" options={companyUnits} selected={filters.unidade} onChange={s => setFilters(f => ({...f, unidade: s}))} />
                        <MultiSelect label="Gerência(s)" options={companyManagements} selected={filters.gerencia} onChange={s => setFilters(f => ({...f, gerencia: s}))} />
                        <MultiSelect label="Área(s)" options={companyAreas} selected={filters.area} onChange={s => setFilters(f => ({...f, area: s}))} />
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 flex items-center">
                        <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span>{filteredEmployees.length} colaborador(es) correspondem aos filtros atuais.</span>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-200">
                    <button type="submit" className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600 flex items-center">
                        Avaliar Elegibilidade <ChevronDownIcon className="h-4 w-4 ml-2 -rotate-90"/>
                    </button>
                </div>
            </form>
        );
    }

    // PREVIEW STEP
    const summary = {
        total: candidates.length,
        eligible: candidates.filter(c => c.status === 'eligible').length,
        warnings: candidates.filter(c => c.status === 'warning').length,
        errors: candidates.filter(c => c.status === 'error').length,
        selected: candidates.filter(c => c.isSelected).length,
    };

    return (
        <div className="space-y-6">
            {/* Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
                    <span className="block text-xs font-bold text-slate-500 uppercase">Candidatos</span>
                    <span className="text-xl font-bold text-slate-800">{summary.total}</span>
                </div>
                <div className="bg-green-50 p-3 rounded border border-green-200 text-center">
                    <span className="block text-xs font-bold text-green-600 uppercase">Aptos</span>
                    <span className="text-xl font-bold text-green-800">{summary.eligible}</span>
                </div>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-center">
                    <span className="block text-xs font-bold text-yellow-600 uppercase">Atenção</span>
                    <span className="text-xl font-bold text-yellow-800">{summary.warnings}</span>
                </div>
                 <div className="bg-red-50 p-3 rounded border border-red-200 text-center">
                    <span className="block text-xs font-bold text-red-600 uppercase">Inaptos</span>
                    <span className="text-xl font-bold text-red-800">{summary.errors}</span>
                </div>
            </div>

             {/* Warning Summary */}
             {(summary.warnings > 0 || summary.errors > 0) && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-800">
                    <p className="font-semibold flex items-center"><WarningTriangleIcon className="h-4 w-4 mr-2"/> Relatório de Pré-Avaliação</p>
                    <p className="mt-1">
                        Foram detectados {summary.errors} colaboradores com impedimentos e {summary.warnings} com alertas. 
                        Verifique a tabela abaixo. Passe o mouse sobre as etiquetas para ver os detalhes.
                    </p>
                </div>
            )}
            
             {/* Result Message */}
             {result && (
                <div className={`p-4 rounded-md border text-sm ${result.success ? 'bg-success-light border-success text-success-dark' : 'bg-danger-light border-danger text-danger-dark'}`}>
                    <div className="flex items-center font-bold text-base mb-2">
                        {result.success ? <CheckCircleIcon className="h-6 w-6 mr-2" /> : <XCircleIcon className="h-6 w-6 mr-2" />}
                        {result.message}
                    </div>
                    {result.details && (
                        <ul className="list-disc pl-8 space-y-1 mt-2">
                            {result.details.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                    )}
                     {result.success && (
                         <button onClick={() => { setResult(null); setStep('configure'); }} className="mt-4 underline text-sm hover:text-green-900">
                             Realizar novo lançamento
                         </button>
                     )}
                </div>
            )}

            {/* Candidates Table */}
            {!result?.success && (
            <>
                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[500px]">
                    <table className="w-full text-sm text-left bg-white">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={candidates.every(c => c.isSelected)}
                                        onChange={(e) => setCandidates(prev => prev.map(c => ({...c, isSelected: e.target.checked})))}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </th>
                                <th className="px-4 py-3">Colaborador</th>
                                <th className="px-4 py-3">Admissão</th>
                                <th className="px-4 py-3 text-center">Saldo Total</th>
                                <th className="px-4 py-3 text-center">Dias Propostos</th>
                                <th className="px-4 py-3">Avaliação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {candidates.map((c) => (
                                <tr key={c.employee.id} className={`hover:bg-slate-50 ${!c.isSelected ? 'opacity-50 bg-slate-50' : ''}`}>
                                    <td className="px-4 py-3 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={c.isSelected}
                                            onChange={(e) => handleCandidateChange(c.employee.id, 'isSelected', e.target.checked)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                        <div>{c.employee.nome}</div>
                                        <div className="text-xs text-slate-500">{c.employee.cargo}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{formatDate(c.employee.dataAdmissao)}</td>
                                    <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">{c.availableBalance}</td>
                                    <td className="px-4 py-3 text-center">
                                        <input 
                                            type="number" 
                                            value={c.proposedDays}
                                            min={1}
                                            max={c.availableBalance}
                                            disabled={!c.isSelected}
                                            onChange={(e) => handleCandidateChange(c.employee.id, 'proposedDays', e.target.value)}
                                            className="w-16 text-center border-gray-300 rounded shadow-sm text-sm p-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {renderStatusBadge(c.status, c.messages)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-200">
                    <button 
                        type="button" 
                        onClick={() => setStep('configure')} 
                        className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        Voltar e Reconfigurar
                    </button>
                    <button 
                        type="button" 
                        onClick={handleConfirm} 
                        disabled={isSubmitting || summary.selected === 0}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600 flex items-center disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {isSubmitting && <SpinnerIcon className="h-5 w-5 mr-2" />}
                        Confirmar Lançamento ({summary.selected})
                    </button>
                </div>
            </>
            )}
        </div>
    );
};


interface LancamentoDeFeriasProps {
    setActiveView: (view: string) => void;
}

const LancamentoDeFerias: React.FC<LancamentoDeFeriasProps> = ({ setActiveView }) => {
    const [activeTab, setActiveTab] = useState('individual');

    return (
        <div>
            <button onClick={() => setActiveView('cadastros')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 mb-6 group">
                <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                Voltar para Cadastros
            </button>
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
                <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-blue-900">Lançamento Direto de Férias</h3>
                        <p className="text-slate-600 mt-1">
                            Lance férias individuais para um colaborador específico ou férias coletivas para um grupo.
                        </p>
                    </div>
                </div>

                <div className="border-b border-slate-200 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setActiveTab('individual')}
                            className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'individual' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                           <UserIcon className="h-5 w-5 mr-2" />
                            Lançamento Individual
                        </button>
                        <button
                            onClick={() => setActiveTab('collective')}
                            className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'collective' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <UsersIcon className="h-5 w-5 mr-2" />
                            Lançamento Coletivo
                        </button>
                    </nav>
                </div>

                {activeTab === 'individual' ? <IndividualEntry /> : <CollectiveEntry />}

            </div>
        </div>
    );
};

export default LancamentoDeFerias;