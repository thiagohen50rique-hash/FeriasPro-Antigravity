


import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import { Funcionario, PeriodoDeFerias, PeriodoAquisitivo } from '../tipos';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
import { getDynamicStatus, getStatusBadge, getStatusText } from '../constants';
import { formatDate } from '../utils/dateUtils';
import DocumentTextIcon from './icons/DocumentTextIcon';
import { generateVacationRequestPDF } from '../services/pdfGenerator';

type InfoCompletaFerias = PeriodoDeFerias & {
    employeeId: number;
    employeeName: string;
    employeeMatricula: string;
    periodId: string;
};

interface GerenciarFeriasProps {
    setActiveView: (view: string) => void;
}

const GerenciarFerias: React.FC<GerenciarFeriasProps> = ({ setActiveView }) => {
    const { user, allEmployees, updateVacationPeriod, deleteVacation, config } = useAuth();
    const modal = useModal();

    const [filters, setFilters] = useState({ search: '', status: '' });
    const [editingVacation, setEditingVacation] = useState<InfoCompletaFerias | null>(null);

    const statusOptions = useMemo(() => {
        if (!config?.vacationStatuses) return [];
        return config.vacationStatuses.filter(s => s.active).map(s => ({ value: s.id, label: s.label }));
    }, [config]);

    const allVacations = useMemo((): InfoCompletaFerias[] => {
        return allEmployees.flatMap(emp =>
            emp.periodosAquisitivos.flatMap(pa =>
                pa.fracionamentos.map(f => ({
                    ...f,
                    employeeId: emp.id,
                    employeeName: emp.nome,
                    employeeMatricula: emp.matricula,
                    periodId: pa.id,
                }))
            )
        ).sort((a, b) => new Date(b.inicioFerias).getTime() - new Date(a.inicioFerias).getTime());
    }, [allEmployees]);
    
    const getEditableStatuses = (vac: InfoCompletaFerias): {value: PeriodoDeFerias['status'], label: string}[] => {
        if (!user || (user.role !== 'admin' && user.role !== 'rh')) {
            return [];
        }
    
        const dynamicStatus = getDynamicStatus(vac);
    
        // Terminal states
        if (dynamicStatus === 'enjoyed' || dynamicStatus === 'canceled') {
            return statusOptions.filter(s => s.value === dynamicStatus) as any;
        }
        
        // For other states, an admin can generally cancel it.
        const editable: PeriodoDeFerias['status'][] = [dynamicStatus, 'canceled'];
    
        // Specific state transitions an admin can force
        switch (dynamicStatus) {
            case 'planned':
            case 'pending_manager':
            case 'pending_rh':
            case 'rejected':
                editable.push('scheduled'); // Force schedule
                break;
            case 'scheduled':
                editable.push('enjoying', 'enjoyed'); // Force start or finish
                break;
            case 'enjoying':
                editable.push('enjoyed'); // Force finish
                break;
        }
    
        // Filter the main options list to only include allowed transitions, maintaining order.
        // Use a Set for efficient lookup.
        const allowedSet = new Set(editable);
        return statusOptions.filter(s => allowedSet.has(s.value as any)) as any;
    };

    const filteredVacations = useMemo(() => {
        return allVacations.filter(vac => {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = vac.employeeName.toLowerCase().includes(searchLower) || vac.employeeMatricula.includes(searchLower);
            
            const dynamicStatus = getDynamicStatus(vac);
            
            const matchesStatus = () => {
                if (!filters.status) return true;
                return dynamicStatus === filters.status;
            };

            return matchesSearch && matchesStatus();
        });
    }, [allVacations, filters]);

    const handleEditClick = (vacation: InfoCompletaFerias) => {
        setEditingVacation(vacation);
    };

    const handleDeleteClick = async (vacation: InfoCompletaFerias) => {
        const confirmed = await modal.confirm({
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja excluir as férias de ${vacation.employeeName} (${formatDate(vacation.inicioFerias)})?`,
            confirmText: 'Excluir',
            confirmVariant: 'danger'
        });
        
        if (confirmed) {
            deleteVacation(vacation.employeeId, vacation.periodId, vacation.id);
            modal.alert({ title: 'Sucesso', message: 'Férias excluídas com sucesso.' });
        }
    };

    const handleUpdate = (updatedData: Partial<PeriodoDeFerias>) => {
        if (!editingVacation) return;

        updateVacationPeriod(
            editingVacation.employeeId,
            editingVacation.periodId,
            editingVacation.id,
            updatedData
        );

        modal.alert({ title: "Sucesso", message: "Registro de férias atualizado.", confirmVariant: 'success'});
        setEditingVacation(null);
    };

    const handleGeneratePDF = async (vacation: InfoCompletaFerias) => {
        const employee = allEmployees.find(e => e.id === vacation.employeeId);
        if (employee) {
            const period = employee.periodosAquisitivos.find(p => p.id === vacation.periodId);
            if (period) {
                await generateVacationRequestPDF(employee, period, allEmployees, vacation as PeriodoDeFerias);
            }
        }
    };


    return (
        <div>
            <button onClick={() => setActiveView('cadastros')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 mb-6 group">
                <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                Voltar para Cadastros
            </button>

            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
                <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
                    <div>
                        <h3 className="text-xl font-bold text-blue-900 mb-1">Gerenciamento de Férias</h3>
                        <p className="text-slate-600">Visualize e gerencie todos os registros de férias do sistema.</p>
                    </div>
                     <button
                        onClick={() => setActiveView('lancamento-ferias')}
                        className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary border border-transparent rounded-lg hover:bg-blue-600 transition"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nova Férias
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Buscar por nome ou matrícula..."
                        value={filters.search}
                        onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                        className="bg-white w-full md:w-1/2 border-gray-300 rounded-lg shadow-sm"
                    />
                    <select
                        value={filters.status}
                        onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                        className="bg-white border-gray-300 rounded-lg shadow-sm"
                    >
                        <option value="">Todos os Status</option>
                        {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-800 text-xs text-white uppercase">
                            <tr>
                                <th className="p-3 text-left font-semibold">Colaborador</th>
                                <th className="p-3 text-left font-semibold">Período de Férias</th>
                                <th className="p-3 text-center font-semibold">Dias Férias</th>
                                <th className="p-3 text-center font-semibold">Dias Abono</th>
                                <th className="p-3 text-center font-semibold">Status</th>
                                <th className="p-3 text-center font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVacations.map(vac => {
                                const canEdit = getEditableStatuses(vac).length > 0;
                                const employee = allEmployees.find(e => e.id === vac.employeeId);
                                const period = employee?.periodosAquisitivos.find(p => p.id === vac.periodId);
                                
                                let remainingBalance = 0;
                                if (period) {
                                     const usedAndAbono = period.fracionamentos
                                        .filter(f => f.status !== 'canceled' && f.status !== 'rejected')
                                        .reduce((sum, frac) => sum + frac.quantidadeDias + (frac.diasAbono || 0), 0);
                                    remainingBalance = period.saldoTotal - usedAndAbono;
                                }

                                return (
                                <tr key={vac.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-800">{vac.employeeName}</td>
                                    <td className="p-3 text-slate-600">{formatDate(vac.inicioFerias)} a {formatDate(vac.terminoFerias)}</td>
                                    <td className="p-3 text-center text-slate-600">{vac.quantidadeDias}</td>
                                    <td className="p-3 text-center text-slate-600">{vac.diasAbono > 0 ? vac.diasAbono : 'Não'}</td>
                                    <td className="p-3 text-center">
                                        <span className={getStatusBadge(getDynamicStatus(vac), config)}>{getStatusText(getDynamicStatus(vac), config)}</span>
                                    </td>
                                    <td className="p-3 text-center flex items-center justify-center space-x-2">
                                        <button 
                                            onClick={() => handleEditClick(vac)} 
                                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-100/60 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                            disabled={!canEdit}
                                            title={canEdit ? "Editar" : "Não pode ser editado"}
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(vac)} 
                                            className="p-1.5 text-slate-400 hover:text-danger rounded-full hover:bg-danger/10 transition-colors"
                                            title="Excluir"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleGeneratePDF(vac)} 
                                            className="p-1.5 text-slate-400 hover:text-green-600 rounded-full hover:bg-green-100/60 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed disabled:hover:bg-transparent" 
                                            title={remainingBalance > 0 ? `Ainda há ${remainingBalance} dias de saldo. O requerimento só pode ser gerado com o saldo zerado.` : "Gerar Requerimento"}
                                            disabled={remainingBalance > 0}>
                                            <DocumentTextIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingVacation && (
                <div className="fixed inset-0 bg-slate-800/75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="p-6 border-b">
                            <h4 className="text-lg font-bold">Editar Férias de {editingVacation.employeeName}</h4>
                        </div>
                        <div className="p-6">
                            <EditForm
                                vacation={editingVacation}
                                onSave={handleUpdate}
                                onCancel={() => setEditingVacation(null)}
                                editableStatuses={getEditableStatuses(editingVacation)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface EditFormProps {
    vacation: InfoCompletaFerias;
    onSave: (updatedData: Partial<PeriodoDeFerias>) => void;
    onCancel: () => void;
    editableStatuses: {value: string, label: string}[];
}

const EditForm: React.FC<EditFormProps> = ({ vacation, onSave, onCancel, editableStatuses }) => {
    const [formData, setFormData] = useState<Partial<PeriodoDeFerias>>({
        inicioFerias: vacation.inicioFerias,
        quantidadeDias: vacation.quantidadeDias,
        diasAbono: vacation.diasAbono,
        adiantamento13: vacation.adiantamento13,
        status: getDynamicStatus(vacation),
    });

    const canEditFields = editableStatuses.length > 1 || (editableStatuses.length === 1 && editableStatuses[0].value !== getDynamicStatus(vacation));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Data de Início</label>
                    <input
                        type="date"
                        value={formData.inicioFerias}
                        onChange={e => setFormData(p => ({ ...p, inicioFerias: e.target.value }))}
                        className="bg-white w-full border-gray-300 rounded-lg shadow-sm disabled:bg-slate-100"
                        disabled={!canEditFields}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Qtd. Dias de Férias</label>
                    <input
                        type="number"
                        value={formData.quantidadeDias}
                        onChange={e => setFormData(p => ({ ...p, quantidadeDias: parseInt(e.target.value, 10) || 0 }))}
                        className="bg-white w-full border-gray-300 rounded-lg shadow-sm disabled:bg-slate-100"
                        disabled={!canEditFields}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Dias de Abono</label>
                    <input
                        type="number"
                        value={formData.diasAbono}
                        onChange={e => setFormData(p => ({ ...p, diasAbono: parseInt(e.target.value, 10) || 0 }))}
                        className="bg-white w-full border-gray-300 rounded-lg shadow-sm disabled:bg-slate-100"
                        disabled={!canEditFields}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Status</label>
                    <select
                        value={formData.status}
                        onChange={e => setFormData(p => ({ ...p, status: e.target.value as PeriodoDeFerias['status'] }))}
                        className="bg-white w-full border-gray-300 rounded-lg shadow-sm disabled:bg-slate-100"
                        disabled={editableStatuses.length <= 1}
                    >
                        {editableStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex items-center">
                <input
                    id="adiantamento13"
                    type="checkbox"
                    checked={formData.adiantamento13}
                    onChange={e => setFormData(p => ({ ...p, adiantamento13: e.target.checked }))}
                    className="h-4 w-4 text-primary rounded border-gray-300 disabled:bg-slate-200"
                    disabled={!canEditFields}
                />
                <label htmlFor="adiantamento13" className="ml-2 text-sm">Adiantamento do 13º Salário</label>
            </div>

            {editableStatuses.length <= 1 && (
                <p className="text-sm text-center text-warning-dark bg-warning-light p-3 rounded-md border border-warning">
                    Este registro não pode ser alterado. Apenas o status pode ser alterado por usuários autorizados se o período ainda não foi gozado.
                </p>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold bg-slate-200 rounded-lg hover:bg-slate-300">
                    Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600 disabled:bg-slate-300">
                    Salvar Alterações
                </button>
            </div>
        </form>
    );
};

export default GerenciarFerias;