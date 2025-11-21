import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Funcionario, PeriodoAquisitivo } from '../tipos';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import { useModal } from '../hooks/useModal';
import SpinnerIcon from './icons/SpinnerIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import { formatDate } from '../utils/dateUtils';
import ArrowPathIcon from './icons/ArrowPathIcon';


const NewPeriodForm: React.FC<{
    employeeId: number;
    onSave: () => void;
    onCancel: () => void;
    suggestedStartDate?: string;
    suggestedEndDate?: string;
}> = ({ employeeId, onSave, onCancel, suggestedStartDate, suggestedEndDate }) => {
    const { addAccrualPeriodToEmployee, allEmployees, config } = useAuth();
    const modal = useModal();
    const [startDate, setStartDate] = useState(suggestedStartDate || '');
    const [endDate, setEndDate] = useState(suggestedEndDate || '');
    const [tipoEntradaDiasFerias, setTipoEntradaDiasFerias] = useState<'system' | 'list' | 'input'>('system');
    const [baseCalculoAbono, setBaseCalculoAbono] = useState<'system' | 'initial_balance' | 'current_balance'>('system');
    const [error, setError] = useState('');

    const concessionLimit = useMemo(() => {
        if (!endDate || !config) return '';
        const limitDate = new Date(`${endDate}T12:00:00Z`);
        limitDate.setUTCDate(limitDate.getUTCDate() + config.prazoLimiteConcessaoDias);
        return limitDate.toISOString().split('T')[0];
    }, [endDate, config]);


    const handleSave = async () => {
        setError('');
        if (!startDate || !endDate) {
            setError('As datas de início e fim são obrigatórias.');
            return;
        }
        if (new Date(startDate) >= new Date(endDate)) {
            setError('A data de início deve ser anterior à data de fim.');
            return;
        }

        const startYear = new Date(`${startDate}T12:00:00Z`).getUTCFullYear();
        const endYear = new Date(`${endDate}T12:00:00Z`).getUTCFullYear();
        const rotuloPeriodo = `${startYear}-${endYear}`;

        const employee = allEmployees.find(e => e.id === employeeId);
        const periodExists = employee?.periodosAquisitivos.some(p => p.rotulo_periodo === rotuloPeriodo);
        if (periodExists) {
            setError(`Erro: O colaborador já possui o período aquisitivo ${rotuloPeriodo}.`);
            return;
        }

        const newPeriodPayload = {
            rotulo_periodo: rotuloPeriodo,
            inicioPa: startDate,
            terminoPa: endDate,
            limiteConcessao: concessionLimit,
            status: 'planning',
            vacation_days_input_type: tipoEntradaDiasFerias,
            abono_calculation_basis: baseCalculoAbono,
        };

        await addAccrualPeriodToEmployee(employeeId, newPeriodPayload);
        modal.alert({ title: "Sucesso", message: `Novo período ${rotuloPeriodo.replace('-', '/')} adicionado.`, confirmVariant: 'success' });
        onSave();
    };

    return (
        <div className="p-4 bg-slate-100 border-t border-slate-200 space-y-4 mt-4 rounded-b-lg">
            <h6 className="font-semibold text-slate-800">Adicionar Novo Período Aquisitivo</h6>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data de Fim</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white w-full border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Limite Concessão (Automático)</label>
                    <input type="date" value={concessionLimit} disabled className="bg-slate-200/60 w-full border-gray-300 rounded-md shadow-sm cursor-not-allowed" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Modo de Seleção de Dias de Férias</label>
                    <select
                        value={tipoEntradaDiasFerias}
                        onChange={e => setTipoEntradaDiasFerias(e.target.value as any)}
                        className="bg-white w-full border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="system">Padrão do Sistema</option>
                        <option value="list">Lista Suspensa</option>
                        <option value="input">Campo de Input</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Modo de Cálculo de Abono</label>
                    <select
                        value={baseCalculoAbono}
                        onChange={e => setBaseCalculoAbono(e.target.value as any)}
                        className="bg-white w-full border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="system">Padrão do Sistema</option>
                        <option value="initial_balance">Sobre dias de direito no vencimento</option>
                        <option value="current_balance">Sobre saldo na programação</option>
                    </select>
                </div>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end space-x-3 pt-4 border-t">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-600">Salvar Período</button>
            </div>
        </div>
    );
};

const EditPeriodForm: React.FC<{
    employee: Funcionario;
    period: PeriodoAquisitivo;
    onSave: () => void;
    onCancel: () => void;
}> = ({ employee, period, onSave, onCancel }) => {
    const { updateAccrualPeriod, config } = useAuth();
    const [startDate, setStartDate] = useState(period.inicioPa);
    const [endDate, setEndDate] = useState(period.terminoPa);
    const [concessionLimit, setConcessionLimit] = useState(period.limiteConcessao);
    const [tipoEntradaDiasFerias, setTipoEntradaDiasFerias] = useState(period.tipoEntradaDiasFerias || 'system');
    const [baseCalculoAbono, setBaseCalculoAbono] = useState(period.baseCalculoAbono || 'system');
    const [error, setError] = useState('');

    const globalConcessionLimit = useMemo(() => {
        if (!endDate || !config) return '';
        const limitDate = new Date(`${endDate}T12:00:00Z`);
        limitDate.setUTCDate(limitDate.getUTCDate() + config.prazoLimiteConcessaoDias);
        return limitDate.toISOString().split('T')[0];
    }, [endDate, config]);

    const handleResetConcessionLimit = () => {
        setConcessionLimit(globalConcessionLimit);
    };

    const handleSave = () => {
        setError('');
        if (!startDate || !endDate || !concessionLimit) {
            setError('Todos os campos de data são obrigatórios.'); return;
        }
        if (new Date(startDate) >= new Date(endDate)) {
            setError('A data de início deve ser anterior à data de fim.'); return;
        }

        const updatedData: Partial<Omit<PeriodoAquisitivo, 'id' | 'fracionamentos' | 'saldoTotal'>> = {
            inicioPa: startDate,
            terminoPa: endDate,
            limiteConcessao: concessionLimit,
            tipoEntradaDiasFerias: tipoEntradaDiasFerias,
            baseCalculoAbono: baseCalculoAbono,
        };

        updateAccrualPeriod(employee.id, period.id, updatedData);
        onSave();
    };

    return (
        <div className="p-6 bg-slate-100 border border-slate-200 rounded-lg">
            <h6 className="font-semibold text-slate-800 mb-4">Editando Período: {period.id.replace('-', '/')}</h6>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data de Fim</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white w-full border-gray-300 rounded-md shadow-sm" />
                    </div>
                </div>
                <div className="border-t border-slate-200/80 pt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Limite de Concessão</label>
                        <div className="flex items-center space-x-2">
                            <input type="date" value={concessionLimit} onChange={e => setConcessionLimit(e.target.value)} className="bg-white w-full md:w-1/2 border-gray-300 rounded-md shadow-sm" />
                            <button onClick={handleResetConcessionLimit} title="Recalcular com base na Regra Global" className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-blue-100 transition"><ArrowPathIcon className="h-4 w-4" /></button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">A data pode ser alterada manualmente (Regra Local).</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo de Entrada de Dias</label>
                            <select
                                value={tipoEntradaDiasFerias}
                                onChange={e => setTipoEntradaDiasFerias(e.target.value as 'system' | 'list' | 'input')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                                <option value="system">Padrão do Sistema</option>
                                <option value="list">Lista de Opções</option>
                                <option value="input">Entrada Livre</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Base de Cálculo do Abono</label>
                            <select
                                value={baseCalculoAbono}
                                onChange={e => setBaseCalculoAbono(e.target.value as 'system' | 'initial_balance' | 'current_balance')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                                <option value="system">Padrão do Sistema</option>
                                <option value="initial_balance">Saldo Inicial</option>
                                <option value="current_balance">Saldo Atual</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {error && <p className="text-sm text-danger mt-4">{error}</p>}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancelar</button>
                <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-600">Salvar Alterações</button>
            </div>
        </div>
    );
};


const ExpandedEmployeeDetails: React.FC<{ employee: Funcionario }> = ({ employee }) => {
    const { deleteAccrualPeriod } = useAuth();
    const modal = useModal();
    const [isAdding, setIsAdding] = useState(false);
    const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

    const handleDelete = async (period: PeriodoAquisitivo) => {
        const hasScheduledVacations = period.fracionamentos.some(f => f.status !== 'canceled' && f.status !== 'rejected');
        if (hasScheduledVacations) {
            modal.alert({
                title: 'Ação Bloqueada',
                message: 'Não é possível excluir este período, pois ele já possui férias programadas. Cancele as solicitações antes de prosseguir.',
                confirmVariant: 'warning'
            });
            return;
        }


        // usar propriedade existente no objeto period e garantir string antes de usar replace()
        const periodLabel = String(period.rotulo_periodo ?? period.id ?? `${period.inicioPa}-${period.terminoPa}`);
        const confirmed = await modal.confirm({
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja excluir o período aquisitivo ${periodLabel.replace('-', '/')}?`,
            confirmText: 'Excluir',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            deleteAccrualPeriod(employee.id, period.id);
        }
    };

    const suggestedDates = useMemo(() => {
        if (employee.periodosAquisitivos.length > 0) {
            const lastPeriod = employee.periodosAquisitivos[employee.periodosAquisitivos.length - 1];
            const lastEndDate = new Date(`${lastPeriod.terminoPa}T12:00:00Z`);

            const newStartDate = new Date(lastEndDate);
            newStartDate.setUTCDate(newStartDate.getUTCDate() + 1);

            const newEndDate = new Date(newStartDate);
            newEndDate.setUTCFullYear(newEndDate.getUTCFullYear() + 1);
            newEndDate.setUTCDate(newEndDate.getUTCDate() - 1);

            return {
                startDate: newStartDate.toISOString().split('T')[0],
                endDate: newEndDate.toISOString().split('T')[0],
            };
        } else {
            const admissionDate = new Date(`${employee.dataAdmissao}T12:00:00Z`);

            const newEndDate = new Date(admissionDate);
            newEndDate.setUTCFullYear(newEndDate.getUTCFullYear() + 1);
            newEndDate.setUTCDate(newEndDate.getUTCDate() - 1);

            return {
                startDate: employee.dataAdmissao,
                endDate: newEndDate.toISOString().split('T')[0],
            };
        }
    }, [employee]);

    return (
        <div className="p-6 bg-slate-50">
            <h5 className="font-semibold text-slate-700 mb-3">Períodos Registrados</h5>

            {employee.periodosAquisitivos.length > 0 ? (
                <ul className="space-y-2 mb-4">
                    {employee.periodosAquisitivos.slice().reverse().map(period => (
                        editingPeriodId === period.id ? (
                            <li key={period.id}>
                                <EditPeriodForm
                                    employee={employee}
                                    period={period}
                                    onSave={() => setEditingPeriodId(null)}
                                    onCancel={() => setEditingPeriodId(null)}
                                />
                            </li>
                        ) : (
                            <li key={period.id} className="flex justify-between items-center p-3 bg-white rounded-md border border-slate-200 text-sm">
                                <div>
                                    <span className="font-medium text-slate-800">P.A: {period.id.replace('-', '/')}</span>
                                    <span className="text-slate-500 ml-4">Início: {formatDate(period.inicioPa)} | Fim: {formatDate(period.terminoPa)} | Limite Concessão: {formatDate(period.limiteConcessao)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => setEditingPeriodId(period.id)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-100 transition" title="Editar Período">
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(period)} className="p-1.5 text-slate-400 hover:text-danger rounded-full hover:bg-red-100 transition" title="Excluir Período">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </li>
                        )
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-slate-500 text-center mb-4 py-4 border border-dashed rounded-md">Nenhum período aquisitivo registrado.</p>
            )}

            {!isAdding && !editingPeriodId && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 transition"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Adicionar Novo Período
                    </button>
                </div>
            )}

            {isAdding && (
                <NewPeriodForm
                    employeeId={employee.id}
                    onSave={() => setIsAdding(false)}
                    onCancel={() => setIsAdding(false)}
                    suggestedStartDate={suggestedDates.startDate}
                    suggestedEndDate={suggestedDates.endDate}
                />
            )}
        </div>
    );
};


const GerenciarPeriodosAquisitivos: React.FC<{ setActiveView: (view: string) => void }> = ({ setActiveView }) => {
    const { allEmployees, addAccrualPeriodsByDueDate, config, updateConfig } = useAuth();
    const modal = useModal();
    const [expandedEmployeeId, setExpandedEmployeeId] = useState<number | null>(null);
    const [massCreateData, setMassCreateData] = useState({ dueDateLimit: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [displayDueDateLimit, setDisplayDueDateLimit] = useState(config?.displayDueDateLimit || '');
    const [isDisplayLimitDirty, setIsDisplayLimitDirty] = useState(false);

    useEffect(() => {
        if (config) {
            setDisplayDueDateLimit(config.displayDueDateLimit || '');
        }
    }, [config]);

    const handleDisplayLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayDueDateLimit(e.target.value);
        setIsDisplayLimitDirty(true);
    };

    const handleSaveDisplayLimit = () => {
        if (config) {
            updateConfig({ ...config, displayDueDateLimit: displayDueDateLimit || null });
            modal.alert({ title: 'Sucesso', message: 'Limite de exibição salvo com sucesso!', confirmVariant: 'success' });
            setIsDisplayLimitDirty(false);
        }
    };

    const handleMassCreateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMassCreateData(prev => ({ ...prev, [name]: value }));
    };

    const handleMassCreate = async () => {
        const confirmed = await modal.confirm({
            title: 'Criação de Períodos em Massa',
            message: `Tem certeza que deseja criar um novo período para todos os colaboradores elegíveis com P.A. vencido até ${formatDate(massCreateData.dueDateLimit)}?`,
            confirmText: 'Sim, criar períodos',
            confirmVariant: 'warning'
        });

        if (confirmed) {
            setIsLoading(true);
            try {
                const updatedCount = await addAccrualPeriodsByDueDate(massCreateData.dueDateLimit);
                if (updatedCount > 0) {
                    modal.alert({
                        title: 'Sucesso!',
                        message: `${updatedCount} colaborador(es) tiveram um novo período aquisitivo adicionado com sucesso.`,
                        confirmVariant: 'success'
                    });
                } else {
                    modal.alert({
                        title: 'Informação',
                        message: 'Nenhum colaborador elegível encontrado para a data informada. A operação foi concluída, mas nenhuma alteração foi necessária.',
                        confirmVariant: 'info'
                    });
                }
                setMassCreateData({ dueDateLimit: '' });
            } catch (error: any) {
                modal.alert({
                    title: 'Erro na Operação',
                    message: error.message || 'Ocorreu um erro ao criar os períodos.',
                    confirmVariant: 'danger'
                });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const toggleExpand = (employeeId: number) => {
        setExpandedEmployeeId(prev => (prev === employeeId ? null : employeeId));
    };

    return (
        <div>
            <button onClick={() => setActiveView('cadastros')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 mb-6 group">
                <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                Voltar para Cadastros
            </button>
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Gerenciamento de Períodos Aquisitivos</h3>
                <p className="text-slate-500 mb-6">Utilize as ferramentas abaixo para criar períodos em massa ou gerenciar individualmente cada colaborador.</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-semibold text-slate-700 text-lg mb-2">Criação de P.A. em Massa (Inteligente)</h4>
                        <p className="text-sm text-slate-500 mb-4">Adiciona um novo período para todos os colaboradores cujo último P.A. venceu até a data limite informada. O sistema não criará períodos duplicados.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div>
                                <label htmlFor="due-date-limit" className="block text-sm font-medium text-slate-700 mb-1">Data Limite do Vencimento</label>
                                <input type="date" id="due-date-limit" name="dueDateLimit" value={massCreateData.dueDateLimit} onChange={handleMassCreateInputChange} className="bg-white w-full border-gray-300 rounded-md shadow-sm text-base py-2.5 px-3" />
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="button"
                                    onClick={handleMassCreate}
                                    disabled={!massCreateData.dueDateLimit || isLoading}
                                    className="w-full md:w-auto px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center">
                                    {isLoading ? (<><SpinnerIcon className="h-5 w-5 mr-2" />Processando...</>) : ('Criar Períodos para Elegíveis')}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-semibold text-slate-700 text-lg mb-2">Limite de Exibição de P.A.</h4>
                        <p className="text-sm text-slate-500 mb-4">Defina até qual data de vencimento do P.A. será exibido no painel do funcionário. Deixe em branco para mostrar todos.</p>
                        <div className="flex items-end gap-4">
                            <div className="flex-grow">
                                <label htmlFor="displayDueDateLimit" className="block text-sm font-medium text-slate-700 mb-1">Exibir P.A. com vencimento até:</label>
                                <input type="date" id="displayDueDateLimit" name="displayDueDateLimit" value={displayDueDateLimit} onChange={handleDisplayLimitChange} className="bg-white w-full border-gray-300 rounded-md shadow-sm text-base py-2.5 px-3" />
                            </div>
                            <button
                                onClick={handleSaveDisplayLimit}
                                disabled={!isDisplayLimitDirty}
                                className="px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-md hover:bg-blue-600 disabled:bg-slate-400 disabled:cursor-not-allowed flex-shrink-0">
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>


                <h4 className="font-semibold text-slate-700 text-lg mt-8 mb-4">Gerenciamento Individual</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th scope="col" className="px-1 py-3 w-12 text-center"></th>
                                <th scope="col" className="px-6 py-3">Funcionário</th>
                                <th scope="col" className="px-6 py-3">Matrícula</th>
                                <th scope="col" className="px-6 py-3">Cargo</th>
                                <th scope="col" className="px-6 py-3">Data de Admissão</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allEmployees.map((employee) => (
                                <React.Fragment key={employee.id}>
                                    <tr className="bg-white border-b border-slate-200 hover:bg-slate-50 cursor-pointer" onClick={() => toggleExpand(employee.id)}>
                                        <td className="px-1 py-4 text-center">
                                            <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${expandedEmployeeId === employee.id ? 'rotate-180' : ''}`} />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                            {employee.nome}
                                        </td>
                                        <td className="px-6 py-4 font-mono">{employee.matricula}</td>
                                        <td className="px-6 py-4">{employee.cargo}</td>
                                        <td className="px-6 py-4">{formatDate(employee.dataAdmissao)}</td>
                                    </tr>
                                    {expandedEmployeeId === employee.id && (
                                        <tr className="bg-white border-b border-slate-200">
                                            <td colSpan={5} className="p-0">
                                                <ExpandedEmployeeDetails employee={employee} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GerenciarPeriodosAquisitivos;