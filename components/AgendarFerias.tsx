
import React, { useState, useMemo, useEffect } from 'react';
import {
    ConfiguracaoApp,
    PeriodoAquisitivo,
    PeriodoDeFerias,
    Funcionario,
    RegraFeriasColetivas,
    ParticipanteAssinatura,
    InformacaoAssinatura
} from '../tipos';
import { generateVacationRequestPDF } from '../services/pdfGenerator';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import { getDynamicStatus, getStatusBadge, getStatusText, getDynamicAccrualPeriodStatus } from '../constants';
import DocumentTextIcon from './icons/DocumentTextIcon';
import { formatDate } from '../utils/dateUtils';
import EscalaEquipe from './EscalaEquipe';
import UsersIcon from './icons/UsersIcon';
import CalendarIcon from './icons/CalendarIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

// Helper functions
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

const createInitialSignatureParticipant = (employee: Funcionario): ParticipanteAssinatura => {
    const now = new Date();
    const eventTime1 = new Date(now.getTime() - 5 * 60000);
    const eventTime2 = new Date(now.getTime() - 2 * 60000);
    const eventTime3 = new Date(now.getTime() - 1 * 60000);
    const eventTime4 = new Date(now.getTime() - 30000);
    const ip = '187.32.157.145';
    const geo = '-22.8805518-47.0376365';

    return {
        assinante: employee,
        dataConclusao: now.toISOString(),
        enderecoIP: ip,
        metodoAutenticacao: 'Não',
        dispositivo: 'Windows NT 10.0; Win64; x64',
        geolocalizacao: 'Autorizado',
        eventos: [
            { name: 'Termos da assinatura eletrônica', timestamp: eventTime1.toISOString(), detalhes: `Aceitou os termos da assinatura eletrônica\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Assinatura efetuada', timestamp: now.toISOString(), detalhes: `Realizou a assinatura com validade jurídica\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Operação concluída', timestamp: now.toISOString(), detalhes: `Operação concluída\nIP: ${ip}\nGEO: ${geo}` },
        ]
    };
};

const TabButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
        {icon}
        {label}
    </button>
);


interface AgendarFeriasProps {
    initialPeriodId?: string | null;
    resetInitialPeriod?: () => void;
    initialVacationId?: string | null;
    resetInitialVacation?: () => void;
}

type NewVacationState = {
    startDate: string;
    days: number;
    adiantamento13: boolean;
    diasAbono: number;
    solicitarAbono: boolean;
};

interface ExpandedContentProps {
    activePeriod: PeriodoAquisitivo;
    totalUtilizado: number;
    remainingBalance: number;
    isScheduling: boolean;
    nonCanceledFractions: PeriodoDeFerias[];
    isPlanInEditMode: boolean;
    canModifySchedule: boolean;
    handleGenerateOverallPDF: () => void;
    setIsPlanInEditMode: React.Dispatch<React.SetStateAction<boolean>>;
    handleDeleteEntirePlan: () => void;
    editingVacationId: string | null;
    newVacation: NewVacationState;
    setNewVacation: React.Dispatch<React.SetStateAction<NewVacationState>>;
    tipoEntradaDiasFerias: 'list' | 'input';
    availableDaysForNewRequest: number[];
    exactAbonoDays: number;
    isAbonoDisabled: boolean;
    error: string;
    resetFormState: () => void;
    handleSaveVacation: () => void;
    handleStartAdding: () => void;
    handleStartEditing: (vacation: PeriodoDeFerias) => void;
    handleDeleteVacation: (vacationId: string) => void;
    config: ConfiguracaoApp;
}

const ExpandedContent: React.FC<ExpandedContentProps> = ({
    activePeriod,
    totalUtilizado,
    remainingBalance,
    isScheduling,
    nonCanceledFractions,
    isPlanInEditMode,
    canModifySchedule,
    handleGenerateOverallPDF,
    setIsPlanInEditMode,
    handleDeleteEntirePlan,
    editingVacationId,
    newVacation,
    setNewVacation,
    tipoEntradaDiasFerias,
    availableDaysForNewRequest,
    exactAbonoDays,
    isAbonoDisabled,
    error,
    resetFormState,
    handleSaveVacation,
    handleStartAdding,
    handleStartEditing,
    handleDeleteVacation,
    config
}) => {
    return (
        <div>
            <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-600"> {totalUtilizado} de {activePeriod.saldoTotal} dias utilizados</span>
                    <span className="text-sm font-medium text-slate-600">{remainingBalance} dias restantes</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${activePeriod.saldoTotal > 0 ? (totalUtilizado / activePeriod.saldoTotal) * 100 : 0}%` }}></div>
                </div>
                {remainingBalance > 0 && !isScheduling && (
                    <p className="text-xs text-amber-600 text-center mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                        <strong>Alerta:</strong> Você ainda tem {remainingBalance} dias de saldo para programar neste período.
                    </p>
                )}
            </div>

            <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-3">Férias Programadas</h4>
                {nonCanceledFractions.length > 0 ? (
                    <ul className="space-y-3">
                        {nonCanceledFractions.map(f => {
                            const dynamicStatus = getDynamicStatus(f);
                            return (
                                <li key={f.id} className="flex flex-wrap justify-between items-center p-3 bg-slate-50 rounded-md border border-slate-200">
                                    <div className="font-medium text-slate-700"> {f.sequencia}º Período: {formatDate(f.inicioFerias)} a {formatDate(f.terminoFerias)} </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-slate-500">{f.quantidadeDias} dias</span>
                                            {f.diasAbono > 0 && (
                                                <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                                    Abono ({f.diasAbono}d)
                                                </span>
                                            )}
                                            {f.adiantamento13 && (
                                                <span className="text-xs font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                                                    + 13º
                                                </span>
                                            )}
                                        </div>
                                        <span className={getStatusBadge(dynamicStatus, config)}>{getStatusText(dynamicStatus, config)}</span>
                                        {isPlanInEditMode && (
                                            <div className="flex items-center border-l pl-2 ml-2 space-x-1">
                                                <button onClick={() => handleStartEditing(f)} className="p-1 text-slate-400 hover:text-info rounded-full hover:bg-info/10 transition-colors" title="Alterar solicitação"><PencilIcon className="h-4 w-4" /></button>
                                                <button onClick={() => handleDeleteVacation(f.id)} className="p-1 text-slate-400 hover:text-danger rounded-full hover:bg-danger/10 transition-colors" title="Excluir solicitação"><TrashIcon className="h-4 w-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                    <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed"><p className="text-sm text-slate-500">Nenhuma férias programada para este período.</p></div>
                )}
            </div>

            {nonCanceledFractions.length > 0 && (
                <div className="flex justify-end items-center space-x-3 mt-4 pt-4 border-t border-slate-200">
                    <button
                        onClick={handleGenerateOverallPDF}
                        disabled={remainingBalance > 0}
                        className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        title={remainingBalance > 0 ? 'Planeje todo o saldo de férias para poder gerar o requerimento' : 'Gerar requerimento consolidado do período'}
                    >
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Gerar Requerimento
                    </button>

                    {canModifySchedule && (
                        <>
                            {!isPlanInEditMode ? (
                                <button onClick={() => setIsPlanInEditMode(true)} className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600 transition">
                                    <PencilIcon className="h-4 w-4 mr-2" />
                                    Alterar Planejamento
                                </button>
                            ) : (
                                <button onClick={() => setIsPlanInEditMode(false)} className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-success rounded-lg hover:bg-success-hover transition">
                                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                                    Concluir Edição
                                </button>
                            )}
                            <button onClick={handleDeleteEntirePlan} className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-danger rounded-lg hover:bg-danger-hover transition">
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Excluir Planejamento
                            </button>
                        </>
                    )}
                </div>
            )}


            {isScheduling ? (
                <div className="p-4 border-t border-slate-200 mt-6 bg-slate-50 rounded-lg">
                    <h5 className="font-semibold text-slate-800 mb-4">{editingVacationId ? 'Alterar Solicitação de Férias' : 'Nova Solicitação de Férias'}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
                            <input type="date" id="start-date" value={newVacation.startDate} onChange={e => setNewVacation({ ...newVacation, startDate: e.target.value })} className="w-full border-gray-300 rounded-md shadow-sm bg-white" />
                        </div>
                        <div>
                            <label htmlFor="days" className="block text-sm font-medium text-slate-700 mb-1">Dias de Férias</label>
                            {tipoEntradaDiasFerias === 'list' ? (
                                <select id="days" value={newVacation.days} onChange={e => setNewVacation({ ...newVacation, days: parseInt(e.target.value) })} className="bg-white w-full border-gray-300 rounded-md shadow-sm" disabled={availableDaysForNewRequest.length === 0}>
                                    {availableDaysForNewRequest.map(d => <option key={d} value={d}>{d} dias</option>)}
                                </select>
                            ) : (
                                <input type="number" id="days" value={newVacation.days} onChange={e => setNewVacation({ ...newVacation, days: parseInt(e.target.value) || 0 })} min="1" max={remainingBalance} className="bg-white w-full border-gray-300 rounded-md shadow-sm" />
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-6 mb-4">
                        {exactAbonoDays > 0 && (
                            <div className="flex items-center" title={isAbonoDisabled ? `Saldo insuficiente para solicitar abono com ${newVacation.days} dias de férias.` : ''}>
                                <input
                                    id="solicitarAbono"
                                    type="checkbox"
                                    checked={!!newVacation.solicitarAbono}
                                    onChange={e => setNewVacation({ ...newVacation, solicitarAbono: e.target.checked, diasAbono: e.target.checked ? exactAbonoDays : 0 })}
                                    disabled={isAbonoDisabled}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:bg-slate-200 disabled:cursor-not-allowed"
                                />
                                <label htmlFor="solicitarAbono" className={`ml-2 block text-sm ${isAbonoDisabled ? 'text-slate-400' : 'text-slate-800'}`}>
                                    Solicitar abono pecuniário (venda de {exactAbonoDays} dias)
                                </label>
                            </div>
                        )}
                        <div className="flex items-center">
                            <input id="adiantamento13" type="checkbox" checked={newVacation.adiantamento13} onChange={e => setNewVacation({ ...newVacation, adiantamento13: e.target.checked })} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                            <label htmlFor="adiantamento13" className="ml-2 block text-sm text-slate-800">Solicitar adiantamento do 13º</label>
                        </div>
                    </div>

                    {error && <p className="text-sm text-center text-danger bg-danger/10 p-2 rounded border border-danger/20">{error}</p>}
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={resetFormState} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancelar</button>
                        <button onClick={handleSaveVacation} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">{editingVacationId ? 'Salvar Alterações' : 'Solicitar Agendamento'}</button>
                    </div>
                </div>
            ) : (
                <button onClick={handleStartAdding} disabled={remainingBalance <= 0 || nonCanceledFractions.length >= config.maxFracionamentos} className="w-full mt-4 py-2.5 px-4 border border-dashed border-slate-400 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition flex items-center justify-center font-semibold disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {nonCanceledFractions.length >= config.maxFracionamentos ? 'Limite de 3 períodos atingido' : remainingBalance > 0 ? 'Adicionar Período de Férias' : 'Saldo de dias esgotado'}
                </button>
            )}
        </div>
    )
};


const AgendarFerias: React.FC<AgendarFeriasProps> = ({
    initialPeriodId,
    resetInitialPeriod,
    initialVacationId,
    resetInitialVacation
}) => {
    const { user, allEmployees, updateEmployee, addNotification, config, collectiveVacationRules, holidays } = useAuth();
    const modal = useModal();
    const [expandedPeriodId, setExpandedPeriodId] = useState<string | null>(initialPeriodId);
    const [activeTab, setActiveTab] = useState('minha-programacao');
    const [isPlanInEditMode, setIsPlanInEditMode] = useState(false);

    const [isScheduling, setIsScheduling] = useState(false);
    const [editingVacationId, setEditingVacationId] = useState<string | null>(null);
    const [newVacation, setNewVacation] = useState<NewVacationState>({
        startDate: '',
        days: config?.diasFeriasOptions.includes(15) ? 15 : config?.diasFeriasOptions[0] || 10,
        adiantamento13: false,
        diasAbono: 0,
        solicitarAbono: false,
    });
    const [error, setError] = useState('');

    const employee = allEmployees.find(e => e.id === user?.id);
    const hasTeamView = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'rh';

    useEffect(() => {
        if (error) {
            setError('');
        }
    }, [newVacation]);

    const displayablePeriods = useMemo(() => {
        if (!employee || !config) return [];
        return employee.periodosAquisitivos
            .sort((a, b) => new Date(a.inicioPa).getTime() - new Date(b.inicioPa).getTime());
    }, [employee, config]);


    const activePeriod = useMemo(() => {
        if (!employee || !expandedPeriodId) return null;
        return employee.periodosAquisitivos.find(p => p.id === expandedPeriodId);
    }, [expandedPeriodId, employee]);

    const periodStats = useMemo(() => {
        if (!activePeriod) return { usedDays: 0, abonoDays: 0, remainingBalance: 0 };

        const usedDays = activePeriod.fracionamentos
            .filter(f => f.id !== editingVacationId && f.status !== 'canceled' && f.status !== 'rejected')
            .reduce((sum, frac) => sum + frac.quantidadeDias, 0);

        const abonoDays = activePeriod.fracionamentos
            .filter(f => f.id !== editingVacationId && f.status !== 'canceled' && f.status !== 'rejected')
            .reduce((sum, frac) => sum + (frac.diasAbono || 0), 0);

        const remainingBalance = activePeriod.saldoTotal - usedDays - abonoDays;

        return { usedDays, abonoDays, remainingBalance };
    }, [activePeriod, editingVacationId]);


    const baseCalculoAbono = useMemo(() => {
        if (!activePeriod || !config) return 'initial_balance';
        return activePeriod.baseCalculoAbono === 'system'
            ? config.baseCalculoAbono
            : activePeriod.baseCalculoAbono;
    }, [activePeriod, config]);

    const exactAbonoDays = useMemo(() => {
        if (!activePeriod) return 0;

        const basis = baseCalculoAbono === 'current_balance'
            ? periodStats.remainingBalance
            : activePeriod.saldoTotal;

        const totalAbonoAllowed = Math.floor(basis / 3);

        if (baseCalculoAbono === 'initial_balance') {
            return periodStats.abonoDays > 0 ? 0 : totalAbonoAllowed;
        }

        return totalAbonoAllowed;

    }, [activePeriod, baseCalculoAbono, periodStats.remainingBalance, periodStats.abonoDays]);


    useEffect(() => {
        setNewVacation(prev => {
            let newDiasAbono = prev.diasAbono;
            let newSolicitarAbono = prev.solicitarAbono;

            if (exactAbonoDays === 0) {
                newDiasAbono = 0;
                newSolicitarAbono = false;
            } else {
                if (newDiasAbono > exactAbonoDays) {
                    newDiasAbono = exactAbonoDays;
                }
            }

            if (newDiasAbono === 0 && newSolicitarAbono) {
                newSolicitarAbono = false;
            }

            if (!newSolicitarAbono && newDiasAbono > 0) {
                newDiasAbono = 0;
            }

            if (newDiasAbono !== prev.diasAbono || newSolicitarAbono !== prev.solicitarAbono) {
                return { ...prev, diasAbono: newDiasAbono, solicitarAbono: newSolicitarAbono };
            }

            return prev;
        });
    }, [exactAbonoDays]);

    const isAbonoDisabled = useMemo(() => {
        if (exactAbonoDays <= 0) return true;
        return newVacation.days + exactAbonoDays > periodStats.remainingBalance;
    }, [newVacation.days, exactAbonoDays, periodStats.remainingBalance]);

    useEffect(() => {
        if (isAbonoDisabled && newVacation.solicitarAbono) {
            setNewVacation(prev => ({ ...prev, solicitarAbono: false, diasAbono: 0 }));
        }
    }, [isAbonoDisabled, newVacation.solicitarAbono]);

    useEffect(() => {
        if (initialPeriodId) {
            setExpandedPeriodId(initialPeriodId);
            resetInitialPeriod?.();
        }
    }, [initialPeriodId, resetInitialPeriod]);

    useEffect(() => {
        if (expandedPeriodId) {
            if (initialVacationId) {
                const vacationToEdit = activePeriod?.fracionamentos.find(f => f.id === initialVacationId);
                if (vacationToEdit) {
                    handleStartEditing(vacationToEdit);
                }
                resetInitialVacation?.();
            } else if (!isScheduling) {
                resetFormState();
            }
        }
    }, [expandedPeriodId, initialVacationId, activePeriod]);


    const { remainingBalance, usedDays, abonoDays } = periodStats;
    const totalUtilizado = usedDays + abonoDays;

    const availableDaysForNewRequest = useMemo(() => {
        if (!activePeriod || !config) return [];
        return config.diasFeriasOptions.filter(d => d <= remainingBalance);
    }, [remainingBalance, activePeriod, config?.diasFeriasOptions]);

    const tipoEntradaDiasFerias = useMemo(() => {
        if (!activePeriod || !config) return 'list';
        return activePeriod.tipoEntradaDiasFerias === 'system'
            ? config.tipoEntradaDiasFerias
            : activePeriod.tipoEntradaDiasFerias;
    }, [activePeriod, config]);

    const handleToggleExpand = (periodId: string) => {
        setExpandedPeriodId(current => (current === periodId ? null : periodId));
    };

    const resetFormState = () => {
        setIsScheduling(false);
        setEditingVacationId(null);
        setNewVacation({
            startDate: '',
            days: availableDaysForNewRequest[0] || (config?.diasFeriasOptions.includes(15) ? 15 : config?.diasFeriasOptions[0] || 10),
            adiantamento13: false,
            diasAbono: 0,
            solicitarAbono: false,
        });
        setError('');
        setIsPlanInEditMode(false);
    }

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
        if (!activePeriod || !employee || !config) return;
        setError('');

        const { startDate, days, adiantamento13, diasAbono, solicitarAbono } = newVacation;
        const effectiveDiasAbono = solicitarAbono ? diasAbono : 0;

        if (!startDate) {
            setError('Por favor, selecione uma data de início.'); return;
        }

        const startDateObj = new Date(`${startDate}T12:00:00Z`);
        const dayOfWeek = startDateObj.getUTCDay();

        if (dayOfWeek === 5 || dayOfWeek === 6) {
            setError('É vedado o início das férias em sextas-feiras e sábados, pois antecedem o repouso semanal.');
            return;
        }

        const oneDayAfterStart = new Date(startDateObj);
        oneDayAfterStart.setUTCDate(oneDayAfterStart.getUTCDate() + 1);
        const twoDaysAfterStart = new Date(startDateObj);
        twoDaysAfterStart.setUTCDate(twoDaysAfterStart.getUTCDate() + 2);

        const oneDayAfterStr = oneDayAfterStart.toISOString().split('T')[0];
        const twoDaysAfterStr = twoDaysAfterStart.toISOString().split('T')[0];

        const isHolidayNextDay = holidays.some(h =>
            h.data === oneDayAfterStr &&
            (h.tipo === 'feriado' || h.tipo === 'ponto_facultativo') &&
            (!h.unidade || h.unidade === employee.unidade)
        );
        const isHolidayInTwoDays = holidays.some(h =>
            h.data === twoDaysAfterStr &&
            (h.tipo === 'feriado' || h.tipo === 'ponto_facultativo') &&
            (!h.unidade || h.unidade === employee.unidade)
        );

        if (isHolidayNextDay || isHolidayInTwoDays) {
            setError('O início das férias não pode ocorrer nos 2 dias que antecedem um feriado.');
            return;
        }

        const accrualPeriodEndDate = new Date(`${activePeriod.terminoPa}T12:00:00Z`);

        if (startDateObj < accrualPeriodEndDate) {
            const applicableRule = findApplicableCollectiveRule(employee, collectiveVacationRules);
            if (applicableRule) {
                const vacationEndDateStr = calculateEndDate(startDate, days);
                const vacationEndDateObj = new Date(`${vacationEndDateStr}T12:00:00Z`);
                const ruleStartDate = new Date(`${applicableRule.inicio}T12:00:00Z`);
                const ruleEndDate = new Date(`${applicableRule.fim}T12:00:00Z`);

                if (!(startDateObj <= ruleStartDate && vacationEndDateObj >= ruleEndDate)) {
                    setError('Férias antecipadas só são permitidas se cobrirem todo o período de férias coletivas definido pela empresa.');
                    return;
                }
            } else {
                setError(`Não é permitido agendar férias com início antes do término do período aquisitivo (${formatDate(activePeriod.terminoPa)}).`);
                return;
            }
        }

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const minDate = new Date(today); minDate.setDate(minDate.getDate() + config.antecedenciaMinimaDias);
        if (startDateObj < minDate) {
            setError(`A solicitação deve ser feita com no mínimo ${config.antecedenciaMinimaDias} dias de antecedência.`); return;
        }

        if (effectiveDiasAbono > 0) {
            const limiteConcessaoDate = new Date(`${activePeriod.limiteConcessao}T12:00:00Z`);
            const minRequestDateForAbono = new Date(limiteConcessaoDate);
            minRequestDateForAbono.setDate(minRequestDateForAbono.getDate() - config.antecedenciaMinimaAbonoDias);

            if (today > minRequestDateForAbono) {
                setError(`A solicitação de abono deve ser feita com no mínimo ${config.antecedenciaMinimaAbonoDias} dias de antecedência do vencimento do período (${formatDate(activePeriod.limiteConcessao)}).`);
                return;
            }
        }

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

            const { inicioAdiantamento13, fimAdiantamento13 } = config;
            const vacationValue = (startDateObj.getUTCMonth() + 1) * 100 + startDateObj.getUTCDate();
            const [startDay, startMonth] = inicioAdiantamento13.split('/');
            const startValue = parseInt(startMonth) * 100 + parseInt(startDay);
            const [endDay, endMonth] = fimAdiantamento13.split('/');
            const endValue = parseInt(endMonth) * 100 + parseInt(endDay);
            let isWithinPeriod = endValue < startValue ? (vacationValue >= startValue || vacationValue <= endValue) : (vacationValue >= startValue && vacationValue <= endValue);

            if (!isWithinPeriod) {
                setError(`O adiantamento do 13º só pode ser solicitado para férias com início entre ${inicioAdiantamento13} e ${fimAdiantamento13}.`);
                return;
            }
        }

        const limiteConcessaoDate = new Date(`${activePeriod.limiteConcessao}T12:00:00Z`);
        if (startDateObj >= limiteConcessaoDate) {
            modal.alert({
                title: 'Data de Início Inválida',
                message: `A data de início das férias não pode ser no dia ou após o limite de concessão (${formatDate(activePeriod.limiteConcessao)}).`,
                confirmVariant: 'warning',
            });
            return;
        }

        const otherFractions = activePeriod.fracionamentos.filter(f => f.id !== editingVacationId && f.status !== 'canceled' && f.status !== 'rejected');
        const endDateObj = new Date(calculateEndDate(startDate, days));
        for (const existing of otherFractions) {
            const existingStart = new Date(`${existing.inicioFerias}T12:00:00Z`);
            const existingEnd = new Date(`${existing.terminoFerias}T12:00:00Z`);
            if (startDateObj <= existingEnd && endDateObj >= existingStart) {
                setError(`As datas deste período estão sobrepondo um período já agendado (${formatDate(existing.inicioFerias)} a ${formatDate(existing.terminoFerias)}).`); return;
            }
        }

        const tempVacation = {
            inicioFerias: startDate,
            quantidadeDias: days,
            terminoFerias: calculateEndDate(startDate, days),
            adiantamento13: adiantamento13,
            diasAbono: effectiveDiasAbono,
        };

        if (days + effectiveDiasAbono > remainingBalance) {
            setError(`O total de dias de férias e abono (${days + effectiveDiasAbono}) excede o saldo disponível de ${remainingBalance} dias.`);
            return;
        }

        if (!editingVacationId && otherFractions.length >= config.maxFracionamentos) {
            setError(`Não é permitido mais de ${config.maxFracionamentos} períodos de férias.`); return;
        }

        const allProposedFractions = [...otherFractions, tempVacation];
        if (allProposedFractions.length > 1) {
            const hasLessThan5DayPeriod = allProposedFractions.some(f => f.quantidadeDias < 5);
            if (hasLessThan5DayPeriod) {
                setError('Ao fracionar as férias, nenhum período pode ser inferior a 5 dias.');
                return;
            }
        }

        const remainingBalanceAfterRequest = remainingBalance - days - effectiveDiasAbono;

        if (remainingBalanceAfterRequest > 0 && remainingBalanceAfterRequest < 5) {
            setError(`Esta solicitação deixaria um saldo residual de ${remainingBalanceAfterRequest} dias. O saldo restante deve ser de no mínimo 5 dias ou zerado.`);
            return;
        }

        const has14DayPeriodAlready = allProposedFractions.some(f => f.quantidadeDias >= 14);
        if (!has14DayPeriodAlready) {
            if (remainingBalanceAfterRequest === 0 && allProposedFractions.length > 0) {
                setError('Ao utilizar todo o saldo em períodos fracionados, um deles deve ser de no mínimo 14 dias.');
                return;
            }
            if (remainingBalanceAfterRequest > 0 && remainingBalanceAfterRequest < 14) {
                setError(`Esta solicitação deixaria um saldo residual de ${remainingBalanceAfterRequest} dias, impossibilitando a programação do período obrigatório de 14 dias.`);
                return;
            }
        }

        const signatureParticipant = createInitialSignatureParticipant(employee);
        const infoAssinatura: InformacaoAssinatura = {
            documentId: `doc-${Date.now()}`,
            operationId: `${Math.floor(1000000 + Math.random() * 9000000)}`,
            participantes: [signatureParticipant],
        };

        let updatedFractions: PeriodoDeFerias[];
        if (editingVacationId) {
            updatedFractions = activePeriod.fracionamentos.map(f =>
                f.id === editingVacationId
                    ? { ...f, ...tempVacation, status: 'planned' }
                    : f
            );
        } else {
            const newSplit: PeriodoDeFerias = { ...tempVacation, id: `new-${Date.now()}`, sequencia: 1, status: 'planned' };
            updatedFractions = [...activePeriod.fracionamentos, newSplit];
        }

        updatedFractions.sort((a, b) => new Date(a.inicioFerias).getTime() - new Date(b.inicioFerias).getTime());
        updatedFractions = updatedFractions.map((frac, index) => ({ ...frac, sequencia: (index + 1) as (1 | 2 | 3) }));

        const updatedActivePeriod: PeriodoAquisitivo = {
            ...activePeriod,
            fracionamentos: updatedFractions,
            status: 'pending_manager',
            idAprovadorGestor: undefined,
            idAprovadorRH: undefined,
            infoAssinatura: infoAssinatura,
        };

        const updatedEmployee = {
            ...employee,
            periodosAquisitivos: employee.periodosAquisitivos.map(p => p.id === updatedActivePeriod.id ? updatedActivePeriod : p)
        };
        updateEmployee(updatedEmployee);


        const manager = allEmployees.find(e => e.id === employee.gestor);
        if (manager) {
            addNotification({
                userId: manager.id,
                message: `${employee.nome} solicitou um novo período de férias.`
            });
        }

        resetFormState();
    };

    const handleDeleteVacation = async (vacationId: string) => {
        if (!activePeriod || !employee) return;

        const vacation = activePeriod.fracionamentos.find(f => f.id === vacationId);
        if (vacation) {
            const status = getDynamicStatus(vacation);
            if (status === 'enjoying' || status === 'enjoyed') {
                modal.alert({
                    title: 'Ação Bloqueada',
                    message: 'Não é possível excluir férias que já foram iniciadas ou concluídas.',
                    confirmVariant: 'warning',
                });
                return;
            }
        }

        const confirmed = await modal.confirm({
            title: 'Confirmar Exclusão',
            message: 'Tem certeza que deseja excluir esta solicitação de férias?',
            confirmText: 'Excluir',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            const updatedFractions = activePeriod.fracionamentos.filter((frac) => frac.id !== vacationId)
                .sort((a, b) => new Date(a.inicioFerias).getTime() - new Date(b.inicioFerias).getTime())
                .map((frac, index) => ({ ...frac, sequencia: (index + 1) as 1 | 2 | 3 }));

            const updatedActivePeriod = { ...activePeriod, fracionamentos: updatedFractions };
            const updatedEmployee = {
                ...employee,
                periodosAquisitivos: employee.periodosAquisitivos.map(p => p.id === updatedActivePeriod.id ? updatedActivePeriod : p)
            };
            updateEmployee(updatedEmployee);
        }
    };

    const handleDeleteEntirePlan = async () => {
        if (!activePeriod || !employee) return;

        const hasStartedVacations = activePeriod.fracionamentos.some(f => {
            const status = getDynamicStatus(f);
            return status === 'enjoying' || status === 'enjoyed';
        });

        if (hasStartedVacations) {
            modal.alert({
                title: 'Ação Bloqueada',
                message: 'Não é possível excluir o planejamento, pois ele contém férias que já foram iniciadas ou concluídas.',
                confirmVariant: 'warning',
            });
            return;
        }

        const confirmed = await modal.confirm({
            title: 'Confirmar Exclusão do Planejamento',
            message: 'Tem certeza que deseja excluir todas as férias programadas para este período aquisitivo?',
            confirmText: 'Excluir Tudo',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            const updatedActivePeriod = { ...activePeriod, fracionamentos: [] };
            const updatedEmployee = {
                ...employee,
                periodosAquisitivos: employee.periodosAquisitivos.map(p => p.id === updatedActivePeriod.id ? updatedActivePeriod : p)
            };
            updateEmployee(updatedEmployee);
            resetFormState();
        }
    };

    const handleGenerateOverallPDF = async () => {
        if (activePeriod && employee) {
            await generateVacationRequestPDF(employee, activePeriod, allEmployees);
        }
    };


    const nonCanceledFractions = useMemo(() => activePeriod?.fracionamentos.filter(f => f.status !== 'canceled' && f.status !== 'rejected') || [], [activePeriod]);

    const canModifySchedule = useMemo(() => {
        if (!activePeriod) return false;

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const concessionDate = new Date(`${activePeriod.limiteConcessao}T12:00:00Z`);
        if (concessionDate < today) {
            return false;
        }

        const hasStartedVacations = activePeriod.fracionamentos.some(f => {
            const status = getDynamicStatus(f);
            return status === 'enjoying' || status === 'enjoyed';
        });

        return !hasStartedVacations;
    }, [activePeriod]);


    if (!employee || !config) return null;

    const calculatePeriodRemainingDays = (period: PeriodoAquisitivo) => {
        const usedAndAbono = period.fracionamentos
            .filter(f => f.status !== 'canceled' && f.status !== 'rejected')
            .reduce((sum, frac) => sum + frac.quantidadeDias + (frac.diasAbono || 0), 0);
        return period.saldoTotal - usedAndAbono;
    };

    return (
        <div>
            {hasTeamView && (
                <div className="flex border-b mb-6 bg-white rounded-t-lg shadow-lg border-x border-t border-slate-200">
                    <TabButton icon={<CalendarIcon className="h-5 w-5 mr-2" />} label="Minha Programação" isActive={activeTab === 'minha-programacao'} onClick={() => setActiveTab('minha-programacao')} />
                    <TabButton icon={<UsersIcon className="h-5 w-5 mr-2" />} label="Programação da Equipe" isActive={activeTab === 'programacao-equipe'} onClick={() => setActiveTab('programacao-equipe')} />
                </div>
            )}

            {activeTab === 'minha-programacao' ? (
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
                    <div className="overflow-x-auto">
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
                                {displayablePeriods.map(period => {
                                    const remainingDays = calculatePeriodRemainingDays(period);
                                    const isExpired = new Date(period.limiteConcessao) < new Date();
                                    const dynamicStatus = getDynamicAccrualPeriodStatus(period);
                                    return (
                                        <React.Fragment key={period.id}>
                                            <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-4 text-slate-600">{formatDate(employee.dataAdmissao)}</td>
                                                <td className="px-4 py-4 font-medium text-slate-800">{formatDate(period.inicioPa)} a {formatDate(period.terminoPa)}</td>
                                                <td className={`px-4 py-4 text-slate-600 ${isExpired ? 'text-danger font-semibold' : ''}`}>{formatDate(period.limiteConcessao)}</td>
                                                <td className="px-4 py-4 text-center font-bold text-lg text-blue-800">{remainingDays}</td>
                                                <td className="px-4 py-4 text-center"><span className={getStatusBadge(dynamicStatus, config)}>{getStatusText(dynamicStatus, config)}</span></td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => handleToggleExpand(period.id)}
                                                        className="px-4 py-2 text-sm font-semibold text-primary bg-blue-25 border border-primary/20 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                                                    >
                                                        {expandedPeriodId === period.id ? 'Fechar' : 'Ver detalhes'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedPeriodId === period.id && activePeriod && (
                                                <tr>
                                                    <td colSpan={6} className="p-0 bg-slate-50 border-b-4 border-primary">
                                                        <div className="p-4 md:p-6">
                                                            <ExpandedContent
                                                                activePeriod={activePeriod}
                                                                totalUtilizado={totalUtilizado}
                                                                remainingBalance={remainingBalance}
                                                                isScheduling={isScheduling}
                                                                nonCanceledFractions={nonCanceledFractions}
                                                                isPlanInEditMode={isPlanInEditMode}
                                                                canModifySchedule={canModifySchedule}
                                                                handleGenerateOverallPDF={handleGenerateOverallPDF}
                                                                setIsPlanInEditMode={setIsPlanInEditMode}
                                                                handleDeleteEntirePlan={handleDeleteEntirePlan}
                                                                editingVacationId={editingVacationId}
                                                                newVacation={newVacation}
                                                                setNewVacation={setNewVacation}
                                                                tipoEntradaDiasFerias={tipoEntradaDiasFerias}
                                                                availableDaysForNewRequest={availableDaysForNewRequest}
                                                                exactAbonoDays={exactAbonoDays}
                                                                isAbonoDisabled={isAbonoDisabled}
                                                                error={error}
                                                                resetFormState={resetFormState}
                                                                handleSaveVacation={handleSaveVacation}
                                                                handleStartAdding={handleStartAdding}
                                                                handleStartEditing={handleStartEditing}
                                                                handleDeleteVacation={handleDeleteVacation}
                                                                config={config}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                        {displayablePeriods.length === 0 && (
                            <div className="text-center py-16">
                                <p className="text-slate-500">Nenhum período de férias disponível para agendamento.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <EscalaEquipe />
            )}
        </div>
    );
};

export default AgendarFerias;
