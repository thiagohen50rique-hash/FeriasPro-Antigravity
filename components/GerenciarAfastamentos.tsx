import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import { Funcionario, Afastamento } from '../tipos';
import { formatDate } from '../utils/dateUtils';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

const LEAVE_TYPES = [
    'Licença Médica',
    'Licença Maternidade',
    'Licença Paternidade',
    'Acidente de Trabalho',
    'Licença Não Remunerada',
    'Outros'
];

const GerenciarAfastamentos: React.FC = () => {
    const { allEmployees, addLeaveToEmployee, updateLeave, deleteLeave } = useAuth();
    const modal = useModal();
    const [expandedEmployeeId, setExpandedEmployeeId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentLeave, setCurrentLeave] = useState<Partial<Afastamento>>({});
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

    const handleToggleExpand = (employeeId: number) => {
        setExpandedEmployeeId(prev => prev === employeeId ? null : employeeId);
        setIsEditing(false);
        setCurrentLeave({});
        setSelectedEmployeeId(null);
    };

    const handleStartAdd = (employeeId: number) => {
        setSelectedEmployeeId(employeeId);
        setCurrentLeave({
            type: LEAVE_TYPES[0],
            dataInicio: '',
            dataFim: '',
            descricao: ''
        });
        setIsEditing(true);
    };

    const handleStartEdit = (employeeId: number, leave: Afastamento) => {
        setSelectedEmployeeId(employeeId);
        setCurrentLeave({ ...leave });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentLeave({});
        setSelectedEmployeeId(null);
    };

    const handleSave = async () => {
        if (!selectedEmployeeId || !currentLeave.type || !currentLeave.dataInicio || !currentLeave.dataFim) {
            modal.alert({ title: 'Erro', message: 'Preencha todos os campos obrigatórios.', confirmVariant: 'danger' });
            return;
        }

        if (currentLeave.dataInicio > currentLeave.dataFim) {
            modal.alert({ title: 'Erro', message: 'A data de início não pode ser posterior à data de fim.', confirmVariant: 'danger' });
            return;
        }

        try {
            if (currentLeave.id) {
                await updateLeave(selectedEmployeeId, currentLeave.id, currentLeave);
                modal.alert({ title: 'Sucesso', message: 'Afastamento atualizado com sucesso.' });
            } else {
                await addLeaveToEmployee(selectedEmployeeId, currentLeave);
                modal.alert({ title: 'Sucesso', message: 'Afastamento adicionado com sucesso.' });
            }
            handleCancel();
        } catch (error) {
            console.error("Erro ao salvar afastamento:", error);
            modal.alert({ title: 'Erro', message: 'Erro ao salvar afastamento.', confirmVariant: 'danger' });
        }
    };

    const handleDelete = async (employeeId: number, leaveId: number) => {
        const confirmed = await modal.confirm({
            title: 'Confirmar Exclusão',
            message: 'Tem certeza que deseja excluir este afastamento?',
            confirmText: 'Excluir',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            try {
                await deleteLeave(employeeId, leaveId);
                modal.alert({ title: 'Sucesso', message: 'Afastamento excluído com sucesso.' });
            } catch (error) {
                console.error("Erro ao excluir afastamento:", error);
                modal.alert({ title: 'Erro', message: 'Erro ao excluir afastamento.', confirmVariant: 'danger' });
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Gerenciar Afastamentos</h2>
            <div className="space-y-4">
                {allEmployees.map(employee => (
                    <div key={employee.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div
                            className="bg-slate-50 p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => handleToggleExpand(employee.id)}
                        >
                            <div>
                                <h3 className="font-semibold text-slate-700">{employee.nome}</h3>
                                <p className="text-sm text-slate-500">{employee.cargo} - {employee.departamento}</p>
                            </div>
                            <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${expandedEmployeeId === employee.id ? 'transform rotate-180' : ''}`} />
                        </div>

                        {expandedEmployeeId === employee.id && (
                            <div className="p-4 bg-white border-t border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-medium text-slate-700">Histórico de Afastamentos</h4>
                                    {!isEditing && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleStartAdd(employee.id); }}
                                            className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                        >
                                            <PlusIcon className="h-4 w-4 mr-1.5" />
                                            Novo Afastamento
                                        </button>
                                    )}
                                </div>

                                {isEditing && selectedEmployeeId === employee.id ? (
                                    <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-4">
                                        <h5 className="font-semibold text-slate-700 mb-3">{currentLeave.id ? 'Editar Afastamento' : 'Novo Afastamento'}</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                                <select
                                                    value={currentLeave.type}
                                                    onChange={e => setCurrentLeave({ ...currentLeave, type: e.target.value })}
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                >
                                                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (Opcional)</label>
                                                <input
                                                    type="text"
                                                    value={currentLeave.descricao || ''}
                                                    onChange={e => setCurrentLeave({ ...currentLeave, descricao: e.target.value })}
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                                                <input
                                                    type="date"
                                                    value={currentLeave.dataInicio}
                                                    onChange={e => setCurrentLeave({ ...currentLeave, dataInicio: e.target.value })}
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim</label>
                                                <input
                                                    type="date"
                                                    value={currentLeave.dataFim}
                                                    onChange={e => setCurrentLeave({ ...currentLeave, dataFim: e.target.value })}
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-3">
                                            <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancelar</button>
                                            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Salvar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Período</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {employee.afastamentos && employee.afastamentos.length > 0 ? (
                                                    employee.afastamentos.map(leave => (
                                                        <tr key={leave.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{leave.type}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(leave.dataInicio)} a {formatDate(leave.dataFim)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{leave.descricao || '-'}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <button onClick={() => handleStartEdit(employee.id, leave)} className="text-blue-600 hover:text-blue-900 mr-3"><PencilIcon className="h-4 w-4" /></button>
                                                                <button onClick={() => handleDelete(employee.id, leave.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-4 w-4" /></button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">Nenhum afastamento registrado.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GerenciarAfastamentos;
