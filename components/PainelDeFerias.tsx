
import React, { useMemo, useState } from 'react';
import {
    Funcionario,
    ConfiguracaoApp,
    PeriodoAquisitivo,
    PeriodoDeFerias
} from '../tipos';
import WarningTriangleIcon from './icons/WarningTriangleIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import CubeIcon from './icons/CubeIcon';
import PlusIcon from './icons/PlusIcon';
import { useAuth } from '../hooks/useAuth';
import DatabaseIcon from './icons/DatabaseIcon';
import UsersIcon from './icons/UsersIcon';
import { getDynamicStatus, getStatusText, getDescendantUnitIds, getStatusBadge, canApprove, getDynamicAccrualPeriodStatus } from '../constants';
import GraficoFeriasEquipe from './GraficoFeriasEquipe';
import { formatDate } from '../utils/dateUtils';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface PainelDeFeriasProps {
    setActiveView: (view: string) => void;
    navigateToSchedule: (periodId: string) => void;
}

const AccrualPeriodContent: React.FC<{
    period: PeriodoAquisitivo;
    config: ConfiguracaoApp;
    setActiveView: (view: string) => void;
    navigateToSchedule: (periodId: string) => void;

}> = ({ period, config, setActiveView, navigateToSchedule }) => {

    const abonoDays = useMemo(() =>
        period.fracionamentos
            .filter(f => f.status !== 'canceled' && f.status !== 'rejected')
            .reduce((sum, frac) => sum + (frac.diasAbono || 0), 0),
        [period.fracionamentos]);


    const usedDays = useMemo(() => {
        return period.fracionamentos
            .filter(f => f.status !== 'canceled' && f.status !== 'rejected')
            .reduce((acc, curr) => acc + curr.quantidadeDias, 0);
    }, [period.fracionamentos]);

    const totalUsedOrAbono = usedDays + abonoDays;

    const remainingDays = period.saldoTotal - totalUsedOrAbono;
    const isFullyScheduled = remainingDays <= 0;

    const isExpired = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(`${period.limiteConcessao}T12:00:00Z`) < today;
    }, [period.limiteConcessao]);

    // Use dynamic status for display and logic
    const dynamicPeriodStatus = getDynamicAccrualPeriodStatus(period);

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200 mb-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Período Aquisitivo: {formatDate(period.inicioPa)} a {formatDate(period.terminoPa)}</h3>
                    <p className="text-sm text-slate-500">Válido de {formatDate(period.inicioPa)} a {formatDate(period.terminoPa)}</p>
                    <p className={`text-sm font-semibold ${isExpired ? 'text-danger' : 'text-slate-500'}`}>
                        Data limite para concessão: {formatDate(period.limiteConcessao)} {isExpired && '(Vencido)'}
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <span className={getStatusBadge(dynamicPeriodStatus, config)}>{getStatusText(dynamicPeriodStatus, config)}</span>
                    {!isExpired ? (
                        <button onClick={() => navigateToSchedule(period.id)} className="text-sm font-semibold text-blue-600 hover:underline mt-2">Analisar/Alterar →</button>
                    ) : null}
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-600">
                        {isFullyScheduled ? `${totalUsedOrAbono} de ${period.saldoTotal} dias utilizados` : `${totalUsedOrAbono} de ${period.saldoTotal} dias planejados`}
                    </span>
                    <span className="text-sm font-medium text-slate-600">{Math.max(0, remainingDays)} dias pendentes</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div
                        className={`h-2.5 rounded-full ${isFullyScheduled ? 'bg-blue-600' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, (totalUsedOrAbono / period.saldoTotal) * 100)}%` }}>
                    </div>
                </div>
            </div>

            {(dynamicPeriodStatus === 'planning' || dynamicPeriodStatus === 'rejected') && (
                <button onClick={() => navigateToSchedule(period.id)} className="w-full mt-6 py-2.5 px-4 border border-dashed border-slate-400 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition flex items-center justify-center font-semibold">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {dynamicPeriodStatus === 'rejected' ? 'Refazer Planejamento' : 'Planejar Férias'}
                </button>
            )}
        </div>
    );
};

const SummaryCard = ({ icon, title, value, subtitle, actionText, bgColorClass, action, containerClass }: any) => {
    return (
        <div className={`bg-white p-5 rounded-lg shadow border border-slate-200 flex-1 flex flex-col justify-between ${containerClass || ''}`}>
            <div>
                <div className="flex items-start justify-between">
                    <div>
                        <h4 className="text-lg font-bold text-slate-800">{title}</h4>
                        <p className="text-3xl font-bold text-slate-800 my-1">{value}</p>
                        <p className="text-xs text-slate-500">{subtitle}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColorClass} flex-shrink-0`}>
                        {icon}
                    </div>
                </div>
            </div>
            <button onClick={action} className="text-sm font-semibold text-blue-600 hover:underline mt-4 inline-block text-left">
                {actionText} →
            </button>
        </div>
    )
}


const PainelDeFerias: React.FC<PainelDeFeriasProps> = ({ setActiveView, navigateToSchedule }) => {
    const { user, allEmployees, activeEmployees, config, orgUnits } = useAuth();
    const employee = allEmployees.find(e => e.id === user?.id) as Funcionario;
    const hasTeamView = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'rh';
    const [upcomingDays, setUpcomingDays] = useState(30);

    if (!employee || !config) return null;

    // --- Common Logic (User's own data) ---
    const periodsToDisplay = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return employee.periodosAquisitivos
            .filter(period => {
                // Regra 1: Não exibir se data limite de concessão já foi atingida.
                const concessionLimitDate = new Date(`${period.limiteConcessao}T12:00:00Z`);
                if (concessionLimitDate < today) {
                    return false;
                }

                // Regra 2: Não exibir se já foi gozado (todas as frações gozadas).
                const dynamicPeriodStatus = getDynamicAccrualPeriodStatus(period);
                if (dynamicPeriodStatus === 'enjoyed') {
                    return false;
                }

                // Filtro opcional de configuração do sistema para exibir apenas períodos até uma data.
                if (config.displayDueDateLimit) {
                    const periodEndDate = new Date(`${period.terminoPa}T12:00:00Z`);
                    const limitDate = new Date(`${config.displayDueDateLimit}T12:00:00Z`);
                    if (periodEndDate > limitDate) {
                        return false;
                    }
                }

                // Se passou por todas as regras de exclusão, o período é exibido.
                return true;
            })
            .sort((a, b) => new Date(a.inicioPa).getTime() - new Date(b.inicioPa).getTime());
    }, [employee.periodosAquisitivos, config.displayDueDateLimit]);


    const totalDaysToSchedule = useMemo(() => {
        return employee.periodosAquisitivos.reduce((total, period) => {
            if (period.status !== 'planning' && period.status !== 'rejected') return total;

            const usedInPeriod = period.fracionamentos
                .filter(frac => frac.status !== 'canceled' && frac.status !== 'rejected')
                .reduce((acc, frac) => acc + frac.quantidadeDias, 0);
            const abonoInPeriod = period.fracionamentos
                .filter(frac => frac.status !== 'canceled' && frac.status !== 'rejected')
                .reduce((acc, frac) => acc + (frac.diasAbono || 0), 0);
            const remainingInPeriod = period.saldoTotal - usedInPeriod - abonoInPeriod;

            if (new Date(period.limiteConcessao) > new Date() && remainingInPeriod > 0) {
                return total + remainingInPeriod;
            }
            return total;
        }, 0);
    }, [employee.periodosAquisitivos]);

    const nextExpiringPeriod = useMemo(() => {
        return employee.periodosAquisitivos
            .filter(p => {
                if (p.status !== 'planning' && p.status !== 'rejected') return false;

                const usedInPeriod = p.fracionamentos
                    .filter(frac => frac.status !== 'canceled' && frac.status !== 'rejected')
                    .reduce((acc, frac) => acc + frac.quantidadeDias + (frac.diasAbono || 0), 0);
                return (p.saldoTotal - usedInPeriod > 0) && (new Date(p.limiteConcessao) > new Date());
            })
            .sort((a, b) => new Date(a.limiteConcessao).getTime() - new Date(b.limiteConcessao).getTime())[0];
    }, [employee.periodosAquisitivos]);

    const nextVacation = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const allVacations = employee.periodosAquisitivos.flatMap(p => p.fracionamentos.map(f => ({ ...f, periodId: p.id })));
        const upcoming = allVacations
            .filter(v => new Date(`${v.inicioFerias}T12:00:00Z`) >= today && v.status === 'scheduled')
            .sort((a, b) => new Date(a.inicioFerias).getTime() - new Date(b.inicioFerias).getTime());
        return upcoming[0] || null;
    }, [employee.periodosAquisitivos]);

    const pendingRequestsCount = useMemo(() => {
        return employee.periodosAquisitivos.filter(p => p.status === 'pending_manager' || p.status === 'pending_rh').length;
    }, [employee.periodosAquisitivos]);

    // --- Manager/Admin Specific Logic ---
    const teamMembers = useMemo(() => {
        if (!hasTeamView || !user) {
            return [];
        }

        // Find subordinates first
        let subordinates: Funcionario[] = [];
        if (user.role === 'admin' || user.role === 'rh') {
            // Admins/RH manage everyone who is not them.
            subordinates = activeEmployees.filter(e => e.id !== user.id);
        } else if (user.role === 'manager') {
            // Managers manage their hierarchy
            const managedUnits = orgUnits.filter(u => u.name === user.departamento && u.type === 'Área');
            const managedUnitIds = managedUnits.map(u => u.id);
            const descendantUnitIds: string[] = [];
            managedUnits.forEach(unit => {
                descendantUnitIds.push(...getDescendantUnitIds(unit.id, orgUnits));
            });
            const allManagedUnitIds = [...new Set([...managedUnitIds, ...descendantUnitIds])];

            subordinates = activeEmployees.filter(emp => {
                if (emp.id === user.id) return false;
                const empUnit = orgUnits.find(u => (u.name === emp.departamento && u.type === 'Área'));
                return empUnit && allManagedUnitIds.includes(empUnit.id);
            });
        }

        // Use a Map to ensure the current user is included and the list is unique.
        const teamMap = new Map<number, Funcionario>();

        // Add subordinates first
        subordinates.forEach(emp => {
            teamMap.set(emp.id, emp);
        });

        // Ensure the logged-in user is on the list
        const self = activeEmployees.find(e => e.id === user.id);
        if (self) {
            teamMap.set(self.id, self);
        }

        return Array.from(teamMap.values());
    }, [user, activeEmployees, hasTeamView, orgUnits]);

    const onVacationToday = useMemo(() => {
        if (!hasTeamView) return [];
        return teamMembers.filter(emp => emp.periodosAquisitivos.some(pa => pa.fracionamentos.some(vac => getDynamicStatus(vac) === 'enjoying')));
    }, [teamMembers, hasTeamView]);

    const upcomingVacations = useMemo(() => {
        if (!hasTeamView) return [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureDate = new Date(today);
        futureDate.setUTCDate(futureDate.getUTCDate() + upcomingDays);

        const vacationingEmployees = new Set<number>();

        teamMembers.forEach(emp => {
            const hasUpcomingVacation = emp.periodosAquisitivos.some(pa =>
                pa.fracionamentos.some(vac => {
                    const dynamicStatus = getDynamicStatus(vac);

                    if (dynamicStatus !== 'enjoying' && dynamicStatus !== 'scheduled') {
                        return false;
                    }

                    const startDate = new Date(`${vac.inicioFerias}T12:00:00Z`);
                    const endDate = new Date(`${vac.terminoFerias}T12:00:00Z`);

                    const overlaps = startDate <= futureDate && endDate >= today;

                    return overlaps;
                })
            );
            if (hasUpcomingVacation) {
                vacationingEmployees.add(emp.id);
            }
        });

        return teamMembers.filter(emp => vacationingEmployees.has(emp.id));
    }, [teamMembers, upcomingDays, hasTeamView]);

    const pendingApprovalsCount = useMemo(() => {
        if (!hasTeamView || !user) return 0;

        const otherEmployees = allEmployees.filter(e => e.id !== user.id);

        let count = 0;
        for (const emp of otherEmployees) {
            for (const pa of emp.periodosAquisitivos) {
                if ((pa.status === 'pending_manager' || pa.status === 'pending_rh') && canApprove(user, emp, pa.status, orgUnits)) {
                    count++;
                    break; // Count employee only once
                }
            }
        }
        return count;
    }, [allEmployees, hasTeamView, user, orgUnits]);

    const pendingDaysSubtitle = totalDaysToSchedule > 0
        ? (nextExpiringPeriod ? `Próximo vencimento em: ${formatDate(nextExpiringPeriod.limiteConcessao)}` : 'Nenhum saldo a vencer.')
        : 'Você está em dia com seus agendamentos!';

    if (hasTeamView) {
        return (
            <div>
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Minha Equipe</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-5 rounded-lg shadow border border-slate-200 flex flex-col justify-between min-h-[150px]">
                            <div>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800">Colaboradores em Férias Hoje</h4>
                                        <p className="text-3xl font-bold text-slate-800 my-1">{onVacationToday.length}</p>
                                        <div className="text-xs text-slate-500 h-8 overflow-y-auto pr-2">
                                            {onVacationToday.length > 0 ? onVacationToday.map(e => e.nome).join(', ') : 'Nenhum colaborador em férias.'}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100 flex-shrink-0">
                                        <UsersIcon className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setActiveView('calendario')} className="text-sm font-semibold text-blue-600 hover:underline mt-4 inline-block text-left">
                                Ver calendário →
                            </button>
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow border border-slate-200 flex flex-col justify-between min-h-[150px]">
                            <div>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800 flex items-baseline flex-wrap">
                                            <span className="mr-2">Férias nos Próximos</span>
                                            <input
                                                type="number"
                                                value={upcomingDays}
                                                onChange={e => setUpcomingDays(parseInt(e.target.value) || 0)}
                                                className="bg-blue-50 w-12 text-center font-semibold border-slate-300 rounded-md shadow-sm p-1 h-7"
                                            />
                                            <span className="ml-2">dias</span>
                                        </h4>
                                        <p className="text-3xl font-bold text-slate-800 my-1">{upcomingVacations.length}</p>
                                        <div className="text-xs text-slate-500 h-8 overflow-y-auto pr-2">
                                            {upcomingVacations.length > 0 ? upcomingVacations.map(e => e.nome).join(', ') : `Nenhuma férias agendada.`}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-cyan-100 flex-shrink-0">
                                        <CalendarDaysIcon className="h-6 w-6 text-cyan-600" />
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setActiveView('calendario')} className="text-sm font-semibold text-blue-600 hover:underline mt-4 inline-block text-left">
                                Ver calendário →
                            </button>
                        </div>
                        <SummaryCard
                            title="Aprovações Pendentes"
                            value={pendingApprovalsCount}
                            subtitle={pendingApprovalsCount > 0 ? "Aguardando sua aprovação." : "Nenhuma solicitação pendente."}
                            actionText="Analisar solicitações"
                            action={() => setActiveView('aprovacoes')}
                            icon={<CubeIcon className="h-6 w-6 text-info" />}
                            bgColorClass="bg-info-light"
                        />
                    </div>
                </div>

                <GraficoFeriasEquipe teamMembers={teamMembers} />

                <div className="mb-10 mt-8">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Minhas Férias</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SummaryCard
                            title="Dias Pendentes"
                            value={totalDaysToSchedule > 0 ? totalDaysToSchedule : '0'}
                            subtitle={pendingDaysSubtitle}
                            actionText="Agendar agora"
                            action={() => setActiveView('agendar')}
                            icon={totalDaysToSchedule > 0 ? <WarningTriangleIcon className="h-6 w-6 text-warning-dark" /> : <CheckCircleIcon className="h-6 w-6 text-success" />}
                            bgColorClass={totalDaysToSchedule > 0 ? 'bg-warning-light' : 'bg-success-light'}
                            containerClass={totalDaysToSchedule > 0 ? 'animate-pulse-warning' : ''}
                        />
                        <SummaryCard
                            title="Próximas Férias"
                            value={nextVacation ? formatDate(nextVacation.inicioFerias) : 'N/A'}
                            subtitle={nextVacation ? `Período de ${nextVacation.quantidadeDias} dias (${getStatusText(getDynamicStatus(nextVacation as PeriodoDeFerias), config)})` : 'Nenhuma férias futura programada'}
                            actionText="Ver detalhes"
                            action={() => setActiveView('agendar')}
                            icon={<CalendarDaysIcon className="h-6 w-6 text-blue-600" />}
                            bgColorClass="bg-blue-100"
                        />
                        <SummaryCard
                            title="Solicitações Pendentes"
                            value={pendingRequestsCount}
                            subtitle={pendingRequestsCount > 0 ? "Aguardando aprovação." : "Nenhuma solicitação pendente."}
                            actionText="Ver solicitações"
                            action={() => setActiveView('agendar')}
                            icon={<CubeIcon className="h-6 w-6 text-info" />}
                            bgColorClass="bg-info-light"
                        />
                    </div>
                </div>

                <div>
                    {periodsToDisplay.map(period => (
                        <AccrualPeriodContent
                            key={period.id}
                            period={period}
                            config={config}
                            setActiveView={setActiveView}
                            navigateToSchedule={navigateToSchedule}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Standard User View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <SummaryCard
                    title="Dias Pendentes"
                    value={totalDaysToSchedule > 0 ? totalDaysToSchedule : '0'}
                    subtitle={pendingDaysSubtitle}
                    actionText="Agendar agora"
                    action={() => setActiveView('agendar')}
                    icon={totalDaysToSchedule > 0 ? <WarningTriangleIcon className="h-6 w-6 text-warning-dark" /> : <CheckCircleIcon className="h-6 w-6 text-success" />}
                    bgColorClass={totalDaysToSchedule > 0 ? 'bg-warning-light' : 'bg-success-light'}
                    containerClass={totalDaysToSchedule > 0 ? 'animate-pulse-warning' : ''}
                />
                <SummaryCard
                    title="Próximas Férias"
                    value={nextVacation ? formatDate(nextVacation.inicioFerias) : 'N/A'}
                    subtitle={nextVacation ? `Período de ${nextVacation.quantidadeDias} dias (${getStatusText(getDynamicStatus(nextVacation as PeriodoDeFerias), config)})` : 'Nenhuma férias futura programada'}
                    actionText="Ver detalhes"
                    action={() => setActiveView('agendar')}
                    icon={<CalendarDaysIcon className="h-6 w-6 text-blue-600" />}
                    bgColorClass="bg-blue-100"
                />
                <SummaryCard
                    title="Solicitações Pendentes"
                    value={pendingRequestsCount}
                    subtitle={pendingRequestsCount > 0 ? "Aguardando aprovação." : "Nenhuma solicitação pendente."}
                    actionText="Ver solicitações"
                    action={() => setActiveView('agendar')}
                    icon={<CubeIcon className="h-6 w-6 text-info" />}
                    bgColorClass="bg-info-light"
                />
            </div>

            <div>
                {periodsToDisplay.map(period => (
                    <AccrualPeriodContent
                        key={period.id}
                        period={period}
                        config={config}
                        setActiveView={setActiveView}
                        navigateToSchedule={navigateToSchedule}
                    />
                ))}
                {periodsToDisplay.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed">
                        <p className="text-sm text-slate-500">Nenhum período com saldo disponível para agendamento.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PainelDeFerias;
