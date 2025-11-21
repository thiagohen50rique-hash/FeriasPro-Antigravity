
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_EMPLOYEES, getRoleText } from '../constants';
import { Funcionario, PapelUsuario } from '../tipos';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';
import UsersIcon from './icons/UsersIcon';

const PerfisDeAcesso: React.FC = () => {
    const { user: currentUser } = useAuth();
    const modal = useModal();
    const [employees, setEmployees] = useState<Funcionario[]>(MOCK_EMPLOYEES);
    const [filters, setFilters] = useState({ cargo: '', unidade: '', role: '', departamento: '' });
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<number>>(new Set());
    const [bulkActionRole, setBulkActionRole] = useState<PapelUsuario>('user');
    const [isDirty, setIsDirty] = useState(false);

    const uniqueCargos = useMemo(() => [...new Set(MOCK_EMPLOYEES.map(e => e.cargo))], []);

    const uniqueDepartamentos = useMemo(() => [...new Set(MOCK_EMPLOYEES.map(e => e.departamento))], []);
    const uniqueUnidades = useMemo(() => [...new Set(MOCK_EMPLOYEES.map(e => e.unidade))], []);
    const uniqueRoles: PapelUsuario[] = ['user', 'manager', 'admin', 'rh'];

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            return (
                (filters.cargo ? emp.cargo === filters.cargo : true) &&

                (filters.departamento ? emp.departamento === filters.departamento : true) &&
                (filters.unidade ? emp.unidade === filters.unidade : true) &&
                (filters.role ? emp.role === filters.role : true)
            );
        });
    }, [employees, filters]);

    const isAllSelected = useMemo(() => {
        if (filteredEmployees.length === 0) return false;
        return filteredEmployees.every(emp => selectedEmployeeIds.has(emp.id));
    }, [filteredEmployees, selectedEmployeeIds]);

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const handleResetFilters = () => {
        setFilters({ cargo: '', unidade: '', role: '', departamento: '' });
    }

    const handleSelectOne = (employeeId: number) => {
        setSelectedEmployeeIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(employeeId)) {
                newSet.delete(employeeId);
            } else {
                newSet.add(employeeId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedEmployeeIds(new Set());
        } else {
            const allFilteredIds = filteredEmployees.map(emp => emp.id);
            setSelectedEmployeeIds(new Set(allFilteredIds));
        }
    };

    const handleRoleChange = (employeeId: number, newRole: PapelUsuario) => {
        setEmployees(prev =>
            prev.map(emp => (emp.id === employeeId ? { ...emp, role: newRole } : emp))
        );
        setIsDirty(true);
    };

    const handleApplyBulkAction = () => {
        setEmployees(prev =>
            prev.map(emp =>
                selectedEmployeeIds.has(emp.id) ? { ...emp, role: bulkActionRole } : emp
            )
        );
        setIsDirty(true);
    };

    const handleSaveChanges = () => {
        // In a real app, this would be an API call.
        console.log("Saving changes for employees:", employees.filter(e => MOCK_EMPLOYEES.find(me => me.id === e.id && me.role !== e.role)));
        modal.alert({ title: "Sucesso", message: "Alterações salvas com sucesso!", confirmVariant: 'success' });
        setIsDirty(false);
    }

    useEffect(() => {
        // Clear selection when filters change to avoid confusion
        setSelectedEmployeeIds(new Set());
    }, [filters]);


    return (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
            <h3 className="text-xl font-bold text-blue-900 mb-6">Gerenciamento de Perfis de Acesso</h3>

            {/* Filters */}
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <FilterSelect label="Cargo" value={filters.cargo} options={uniqueCargos} onChange={val => handleFilterChange('cargo', val)} />
                    <FilterSelect label="Área" value={filters.departamento} options={uniqueDepartamentos} onChange={val => handleFilterChange('departamento', val)} />

                    <FilterSelect label="Unidade" value={filters.unidade} options={uniqueUnidades} onChange={val => handleFilterChange('unidade', val)} />
                    <FilterSelect label="Perfil" value={filters.role} options={uniqueRoles.map(r => ({ value: r, text: getRoleText(r) }))} onChange={val => handleFilterChange('role', val)} />
                    <div className="flex items-end">
                        <button onClick={handleResetFilters} className="w-full h-11 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition">
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedEmployeeIds.size > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6 flex items-center justify-between">
                    <span className="font-semibold text-blue-800">{selectedEmployeeIds.size} funcionário(s) selecionado(s)</span>
                    <div className="flex items-center space-x-3">
                        <select
                            value={bulkActionRole}
                            onChange={(e) => setBulkActionRole(e.target.value as PapelUsuario)}
                            className="w-48 bg-white border-gray-300 rounded-lg shadow-sm py-2"
                        >
                            {uniqueRoles.map(role => <option key={role} value={role}>{getRoleText(role)}</option>)}
                        </select>
                        <button onClick={handleApplyBulkAction} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-600">
                            Aplicar
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white uppercase bg-gray-800">
                        <tr>
                            <th scope="col" className="p-4 font-semibold">
                                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            </th>
                            <th scope="col" className="px-6 py-3 font-semibold">Funcionário</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Cargo</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Área</th>

                            <th scope="col" className="px-6 py-3 font-semibold">Unidade</th>
                            <th scope="col" className="px-6 py-3 font-semibold">Perfil de Acesso</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
                            <tr key={emp.id} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                                <td className="p-4">
                                    <input type="checkbox" checked={selectedEmployeeIds.has(emp.id)} onChange={() => handleSelectOne(emp.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{emp.nome}</td>
                                <td className="px-6 py-4 text-slate-600">{emp.cargo}</td>
                                <td className="px-6 py-4 text-slate-600">{emp.departamento}</td>

                                <td className="px-6 py-4 text-slate-600">{emp.unidade}</td>
                                <td className="px-6 py-4">
                                    <select
                                        value={emp.role}
                                        onChange={(e) => handleRoleChange(emp.id, e.target.value as PapelUsuario)}
                                        className="bg-white block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg shadow-sm"
                                        disabled={emp.id === currentUser?.id}
                                    >
                                        {uniqueRoles.map(role => <option key={role} value={role}>{getRoleText(role)}</option>)}
                                    </select>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6}>
                                    <div className="text-center py-16">
                                        <UsersIcon className="mx-auto h-12 w-12 text-slate-400" />
                                        <h4 className="mt-4 text-lg font-semibold text-slate-700">Nenhum Funcionário Encontrado</h4>
                                        <p className="mt-1 text-sm text-slate-500">Ajuste os filtros ou verifique se há funcionários cadastrados.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                <button
                    onClick={handleSaveChanges}
                    disabled={!isDirty}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-success rounded-lg shadow-sm hover:bg-success-hover disabled:bg-slate-300 disabled:cursor-not-allowed">
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
};

const FilterSelect: React.FC<{ label: string, value: string, options: (string | { value: string, text: string })[], onChange: (v: string) => void }> = ({ label, value, options, onChange }) => {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-white block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg shadow-sm"
            >
                <option value="">Todos</option>
                {options.map(opt => {
                    const val = typeof opt === 'string' ? opt : opt.value;
                    const text = typeof opt === 'string' ? opt : opt.text;
                    return <option key={val} value={val}>{text}</option>
                })}
            </select>
        </div>
    )
}


export default PerfisDeAcesso;
