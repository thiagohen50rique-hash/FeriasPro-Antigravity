
import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
    Funcionario,
    PeriodoAquisitivo,
    ParticipanteAssinatura,
    InformacaoAssinatura
} from '../tipos';
import ChevronDownIcon from './icons/ChevronDownIcon';
import UsersIcon from './icons/UsersIcon';
import { getDynamicStatus, getStatusBadge, getStatusText, canApprove, getDynamicAccrualPeriodStatus } from '../constants';
import { generateVacationRequestPDF } from '../services/pdfGenerator';
import DocumentTextIcon from './icons/DocumentTextIcon';
import { formatDate } from '../utils/dateUtils';


type PendingRequest = PeriodoAquisitivo & {
    employee: Funcionario;
};

const RequestDetails: React.FC<{ request: PendingRequest, allEmployees: Funcionario[] }> = ({ request, allEmployees }) => {
    const { employee } = request;

    const { totalUsedDays, totalAbonoDays } = useMemo(() => {
        const validFractions = request.fracionamentos.filter(
            f => f.status !== 'canceled'
        );
        const used = validFractions.reduce((acc, curr) => acc + curr.quantidadeDias, 0);
        const abono = validFractions.reduce((acc, f) => acc + (f.diasAbono || 0), 0);
        return { totalUsedDays: used, totalAbonoDays: abono };
    }, [request.fracionamentos]);

    const conflictingTeamMembers = useMemo(() => {
        const teamMembers = allEmployees.filter(e => e.gestor === employee.gestor && e.id !== employee.id && e.status === 'active');
        const conflicts: { name: string, dates: string }[] = [];

        request.fracionamentos.forEach(reqFrac => {
            const requestStart = new Date(`${reqFrac.inicioFerias}T12:00:00Z`);
            const requestEnd = new Date(`${reqFrac.terminoFerias}T12:00:00Z`);

            teamMembers.forEach(member => {
                member.periodosAquisitivos.forEach(pa => {
                    pa.fracionamentos.forEach(vac => {
                        if (getDynamicStatus(vac) === 'scheduled' || getDynamicStatus(vac) === 'enjoying') {
                            const memberStart = new Date(`${vac.inicioFerias}T12:00:00Z`);
                            const memberEnd = new Date(`${vac.terminoFerias}T12:00:00Z`);
                            if (requestStart <= memberEnd && requestEnd >= memberStart) {
                                if (!conflicts.some(c => c.name === member.nome)) {
                                    conflicts.push({ name: member.nome, dates: `${formatDate(vac.inicioFerias)} a ${formatDate(vac.terminoFerias)}` });
                                }
                            }
                        }
                    });
                });
            });
        });

        return conflicts;
    }, [allEmployees, employee, request.fracionamentos]);

    return (
        <div className="p-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                {/* Vacation Details */}
                <div>
                    <h5 className="font-semibold text-slate-700 border-b pb-2 mb-3">Férias Planejadas</h5>
                    <table className="w-full text-sm">
                        <tbody>
                            {request.fracionamentos.map(f => (
                                <tr key={f.id} className="border-b border-slate-200">
                                    <td className="py-2 pr-4">{f.sequencia}º Período: {formatDate(f.inicioFerias)} a {formatDate(f.terminoFerias)}</td>
                                    <td className="py-2 text-right">{f.quantidadeDias} dias</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-semibold">
                                <td className="pt-2 pr-4">Total Férias:</td>
                                <td className="pt-2 text-right">{totalUsedDays} dias</td>
                            </tr>
                            {totalAbonoDays > 0 && (
                                <tr className="font-semibold text-green-700">
                                    <td className="py-1 pr-4">Total Abono:</td>
                                    <td className="py-1 text-right">{totalAbonoDays} dias</td>
                                </tr>
                            )}
                        </tfoot>
                    </table>
                </div>

                {/* Deadlines & Conflicts */}
                <div className="space-y-4">
                    <h5 className="font-semibold text-slate-700 border-b pb-2">Prazos e Conflitos</h5>
                    <InfoItem label="Data Limite de Concessão" value={formatDate(request.limiteConcessao)} />
                    {conflictingTeamMembers.length > 0 && (
                        <div className="p-3 bg-warning-light border border-warning rounded-lg">
                            <div className="flex items-start">
                                <UsersIcon className="h-5 w-5 text-warning-dark mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h6 className="font-semibold text-warning-dark text-sm">Conflito de agenda na equipe</h6>
                                    <ul className="text-xs text-warning-dark mt-1 list-disc pl-4">
                                        {conflictingTeamMembers.map(c => <li key={c.name}>{c.name} ({c.dates})</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    {conflictingTeamMembers.length === 0 && (
                        <p className="text-sm text-slate-500">Nenhum conflito de agenda na equipe para os períodos solicitados.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const InfoItem: React.FC<{ label: string, value: string | number, isBold?: boolean }> = ({ label, value, isBold }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-slate-600">{label}:</span>
        <span className={`font-medium text-slate-800 ${isBold ? 'font-bold' : ''}`}>{value}</span>
    </div>
);

const createApproverSignatureParticipant = (approver: Funcionario, period: PeriodoAquisitivo): ParticipanteAssinatura => {
    const now = new Date();
    const requesterSignatureTime = period.infoAssinatura?.participantes?.[0]?.dataConclusao;
    const notificationTime = requesterSignatureTime ? new Date(new Date(requesterSignatureTime).getTime() + 10 * 60000) : now;

    const eventTime2 = new Date(now.getTime() - 2 * 60000);
    const eventTime3 = new Date(now.getTime() - 1 * 60000);
    const eventTime4 = new Date(now.getTime() - 30000);

    const ip = approver.role === 'manager' ? '192.168.1.10' : '201.150.30.5';
    const geo = approver.role === 'manager' ? '-22.9092471-47.0376365' : '-22.8785328-47.0376365';

    return {
        assinante: approver,
        dataConclusao: now.toISOString(),
        enderecoIP: '192.168.1.105',
        metodoAutenticacao: 'Senha',
        dispositivo: 'Desktop Windows',
        geolocalizacao: 'São Paulo, SP',
        eventos: [
            {
                name: 'Notificação enviada',
                timestamp: notificationTime.toISOString(),
                detalhes: `Notificação de solicitação de aprovação enviada para ${approver.nome} (${approver.email})`
            },
            {
                name: 'Operação visualizada',
                timestamp: eventTime2.toISOString(),
                detalhes: `O aprovador ${approver.nome} visualizou os detalhes da solicitação`
            },
            {
                name: 'Assinatura efetuada',
                timestamp: now.toISOString(),
                detalhes: `Aprovação realizada por ${approver.nome} (CPF: ${approver.cpf})`
            }
        ]
    };
};


const SolicitacoesDeAprovacao: React.FC = () => {
    const { user: currentUser, allEmployees, updateEmployee, addNotification, orgUnits, config } = useAuth();
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
    const [filters, setFilters] = useState({ status: 'pending', search: '' });

    if (!currentUser) return null;

    const allRequestsFromAllEmployees: PendingRequest[] = useMemo(() => {
        return allEmployees.flatMap(emp =>
            emp.periodosAquisitivos.map(pa => ({ ...pa, employee: emp }))
        ).sort((a, b) => {
            const dateA = a.fracionamentos[0]?.inicioFerias;
            const dateB = b.fracionamentos[0]?.inicioFerias;
            if (!dateA || !dateB) return 0;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
    }, [allEmployees]);

    const filteredRequests = useMemo(() => {
        return allRequestsFromAllEmployees.filter(req => {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = req.employee.nome.toLowerCase().includes(searchLower) || req.employee.matricula.includes(searchLower);
            if (!matchesSearch) return false;

            if (filters.status === 'pending') {
                return canApprove(currentUser, req.employee, req.status, orgUnits);
            }
            if (filters.status === 'all') {
                return true;
            }

            // Handle special filter cases that don't map directly to PeriodoAquisitivo['status']
            if (filters.status === 'planned') {
                return req.status === 'planning';
            }
            if (filters.status === 'enjoying') {
                // Check if any fraction is currently being enjoyed
                return req.fracionamentos.some(f => getDynamicStatus(f) === 'enjoying');
            }
            if (filters.status === 'canceled') {
                // Check if any fraction is canceled
                return req.fracionamentos.some(f => f.status === 'canceled');
            }

            // Default comparison for PeriodoAquisitivo statuses
            return req.status === filters.status;
        });
    }, [allRequestsFromAllEmployees, filters, currentUser, orgUnits]);


    const handleApprovalAction = (request: PendingRequest, action: 'approve' | 'reject') => {
        const { employee } = request;

        let updatedPeriod: PeriodoAquisitivo = { ...request };
        let notificationMessage = '';
        let notifyTo: (Funcionario | undefined)[] = [];

        if (action === 'reject') {
            updatedPeriod.status = 'rejected';
            notificationMessage = `Sua programação de férias para o período de ${formatDate(request.inicioPa)} a ${formatDate(request.terminoPa)} foi rejeitada.`;
            notifyTo.push(employee);
        } else { // approve
            const signatureParticipant = createApproverSignatureParticipant(currentUser, request);
            const updatedSignatureInfo = {
                ...(request.infoAssinatura as InformacaoAssinatura),
                participantes: [...(request.infoAssinatura?.participantes || []), signatureParticipant],
            };
            updatedPeriod.infoAssinatura = updatedSignatureInfo;

            if (request.status === 'pending_manager') {
                updatedPeriod.status = 'pending_rh';
                updatedPeriod.idAprovadorGestor = currentUser.id;

                notificationMessage = `Sua programação de férias foi aprovada pelo seu gestor e aguarda o RH.`;
                notifyTo.push(employee);

                const rhUsers = allEmployees.filter(e => e.role === 'rh' || e.role === 'admin');
                rhUsers.forEach(rh => {
                    addNotification({
                        userId: rh.id,
                        message: `A solicitação de ${employee.nome} foi aprovada pelo gestor e precisa da sua aprovação.`
                    });
                });

            } else if (request.status === 'pending_rh') {
                updatedPeriod.status = 'scheduled';
                updatedPeriod.idAprovadorRH = currentUser.id;

                // Set all planned vacations to scheduled
                updatedPeriod.fracionamentos = updatedPeriod.fracionamentos.map(f =>
                    f.status === 'planned' ? { ...f, status: 'scheduled' } : f
                );

                notificationMessage = `Sua programação de férias para o período de ${formatDate(request.inicioPa)} a ${formatDate(request.terminoPa)} foi aprovada!`;
                notifyTo.push(employee);

                const manager = allEmployees.find(e => e.id === employee.gestor);
                if (manager) {
                    addNotification({
                        userId: manager.id,
                        message: `A solicitação de ${employee.nome} foi aprovada pelo RH.`
                    });
                }
            }
        }

        const updatedEmployee = {
            ...employee,
            periodosAquisitivos: employee.periodosAquisitivos.map(p =>
                p.id === updatedPeriod.id ? updatedPeriod : p
            )
        };
        updateEmployee(updatedEmployee);

        notifyTo.forEach(userToNotify => {
            if (userToNotify) {
                addNotification({ userId: userToNotify.id, message: notificationMessage });
            }
        });

        setExpandedRequestId(null);
    };

    const toggleExpand = (uniqueId: string) => {
        setExpandedRequestId(prev => prev === uniqueId ? null : uniqueId);
    };

    const handleGeneratePDF = async (request: PendingRequest) => {
        const { employee, ...periodData } = request;
        await generateVacationRequestPDF(employee, periodData as PeriodoAquisitivo, allEmployees);
    };

    const statusOptions = useMemo(() => {
        if (!config?.vacationStatuses) return [];
        return config.vacationStatuses.filter(s => s.active);
    }, [config]);

    return (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
            <h3 className="text-xl font-bold text-blue-900 mb-4">Solicitações de Férias</h3>
            <p className="text-slate-600 mb-6">Analise, aprove ou reprove as solicitações de sua equipe.</p>

            <div className="mb-6 p-4 bg-slate-100 rounded-lg border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="search-employee" className="block text-sm font-medium text-slate-700 mb-1">Buscar Funcionário</label>
                        <input
                            id="search-employee"
                            type="text"
                            placeholder="Nome ou matrícula..."
                            value={filters.search}
                            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="bg-white w-full border-gray-300 rounded-lg shadow-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 mb-1">Filtrar por Status</label>
                        <select
                            id="status-filter"
                            value={filters.status}
                            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="bg-white w-full border-gray-300 rounded-lg shadow-sm"
                        >
                            <option value="pending">Pendentes para mim</option>
                            {statusOptions.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                            <option value="all">Todas</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white uppercase bg-gray-800">
                        <tr>
                            <th scope="col" className="px-1 py-3 w-12 text-center font-semibold"></th>
                            <th scope="col" className="px-6 py-3 font-semibold">Funcionário</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Período Aquisitivo</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Status do Planejamento</th>
                            <th scope="col" className="px-6 py-3 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.length > 0 ? filteredRequests.map((request) => {
                            const uniqueId = `${request.employee.id}-${request.id}`;
                            const showActionButtons = canApprove(currentUser, request.employee, request.status, orgUnits);
                            const dynamicStatus = getDynamicAccrualPeriodStatus(request);
                            const usedAndAbono = request.fracionamentos
                                .filter(f => f.status !== 'canceled' && f.status !== 'rejected')
                                .reduce((sum, frac) => sum + frac.quantidadeDias + (frac.diasAbono || 0), 0);
                            const remainingBalance = request.saldoTotal - usedAndAbono;

                            return (
                                <React.Fragment key={uniqueId}>
                                    <tr className="bg-white border-b border-slate-200 hover:bg-slate-50 cursor-pointer" onClick={() => toggleExpand(uniqueId)}>
                                        <td className="px-1 py-4 text-center">
                                            <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${expandedRequestId === uniqueId ? 'rotate-180' : ''}`} />
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">
                                            <div>{request.employee.nome}</div>
                                            <div className="text-xs text-slate-500 font-normal">{request.employee.cargo}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{formatDate(request.inicioPa)} a {formatDate(request.terminoPa)}</td>
                                        <td className="px-6 py-4">
                                            <span className={getStatusBadge(dynamicStatus, config)}>{getStatusText(dynamicStatus, config)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-semibold text-slate-500">
                                                {expandedRequestId === uniqueId ? 'Fechar Detalhes' : 'Ver Detalhes'}
                                            </span>
                                        </td>
                                    </tr>
                                    {expandedRequestId === uniqueId && (
                                        <tr className="bg-white border-b border-slate-200">
                                            <td colSpan={5} className="p-0">
                                                <RequestDetails request={request} allEmployees={allEmployees} />
                                                <div className={`p-4 bg-slate-100 flex items-center ${showActionButtons ? 'justify-between' : 'justify-start'}`}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleGeneratePDF(request); }}
                                                        disabled={remainingBalance > 0}
                                                        title={remainingBalance > 0 ? 'O requerimento só pode ser gerado quando todo o saldo for utilizado.' : 'Emitir Requerimento'}
                                                        className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                                    >
                                                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                                                        Emitir Requerimento
                                                    </button>
                                                    {showActionButtons && (
                                                        <div className="flex items-center space-x-3">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleApprovalAction(request, 'reject'); }}
                                                                className="px-4 py-2 text-sm font-semibold text-white bg-danger rounded-lg hover:bg-danger-hover"
                                                            >
                                                                Reprovar
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleApprovalAction(request, 'approve'); }}
                                                                className="px-4 py-2 text-sm font-semibold text-white bg-success rounded-lg hover:bg-success-hover"
                                                            >
                                                                Aprovar Solicitação
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )
                        }) : (
                            <tr>
                                <td colSpan={5} className="text-center py-10">
                                    <p className="text-slate-500">Nenhuma solicitação encontrada para os filtros aplicados.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SolicitacoesDeAprovacao;
