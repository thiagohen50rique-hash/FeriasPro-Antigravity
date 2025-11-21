
import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SearchIcon from './icons/SearchIcon';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import { PapelUsuario } from '../tipos';
import { useModal } from '../hooks/useModal';
import { formatDate } from '../utils/dateUtils';
import UserPlusIcon from './icons/UserPlusIcon';
import UserMinusIcon from './icons/UserMinusIcon';
import { getRoleText } from '../constants';

interface ListaDeFuncionariosProps {
    setActiveView: (view: string) => void;
    onEditEmployee: (employeeId: number) => void;
}

const getStatusBadge = (status: 'active' | 'inactive') => {
    const baseClasses = 'px-2 py-0.5 text-xs font-semibold rounded-full';
    switch (status) {
        case 'active':
            return `${baseClasses} bg-success-light text-success-dark`;
        case 'inactive':
            return `${baseClasses} bg-slate-200 text-slate-600`;
    }
};


const FilterSelect: React.FC<{ label: string, value: string, options: (string | { value: string, text: string })[], onChange: (v: string) => void }> = ({ label, value, options, onChange }) => (
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
);


const ListaDeFuncionarios: React.FC<ListaDeFuncionariosProps> = ({ setActiveView, onEditEmployee }) => {
    const { allEmployees, toggleEmployeeStatus, hierarchyLevels } = useAuth();
    const modal = useModal();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        departamento: '', // Área
        area: '',       // Gerência
        unidade: '',
        role: '',
        status: 'active',
    });

    const uniqueOptions = useMemo(() => {
        const departamentos = [...new Set(allEmployees.map(e => e.departamento))].sort();
        const areas = [...new Set(allEmployees.map(e => e.area))].sort();
        const unidades = [...new Set(allEmployees.map(e => e.unidade))].sort();
        const roles: PapelUsuario[] = ['user', 'manager', 'admin', 'rh'];
        const statuses = [{value: 'active', text: 'Ativo'}, {value: 'inactive', text: 'Inativo'}];
        return { departamentos, areas, unidades, roles, statuses };
    }, [allEmployees]);

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const filteredEmployees = useMemo(() => {
        return allEmployees.filter(emp =>
            (searchTerm === '' || emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) || emp.matricula.includes(searchTerm)) &&
            (filters.departamento === '' || emp.departamento === filters.departamento) &&
            (filters.area === '' || emp.area === filters.area) &&
            (filters.unidade === '' || emp.unidade === filters.unidade) &&
            (filters.role === '' || emp.role === filters.role) &&
            (filters.status === '' || emp.status === filters.status)
        );
    }, [allEmployees, searchTerm, filters]);


    const handleToggleStatus = async (employeeId: number, employeeName: string, currentStatus: 'active' | 'inactive') => {
        const action = currentStatus === 'active' ? 'inativar' : 'reativar';
        const title = currentStatus === 'active' ? 'Confirmar Inativação' : 'Confirmar Reativação';
        
        if (currentStatus === 'active') {
             const isManager = allEmployees.some(emp => emp.gestor === employeeId && emp.status === 'active');
            if (isManager) {
                modal.alert({
                    title: 'Ação Bloqueada',
                    message: `Não é possível inativar "${employeeName}", pois este colaborador é gestor de outra pessoa. Por favor, reatribua a equipe antes de inativar.`,
                    confirmVariant: 'warning'
                });
                return;
            }
        }
        
        const confirmed = await modal.confirm({
            title: title,
            message: `Tem certeza que deseja ${action} o colaborador "${employeeName}"?`,
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            confirmVariant: currentStatus === 'active' ? 'warning' : 'success'
        });

        if (confirmed) {
            toggleEmployeeStatus(employeeId);
            modal.alert({ title: 'Sucesso', message: `Colaborador ${action === 'inativar' ? 'inativado' : 'reativado'} com sucesso!` });
        }
    };

    return (
        <div>
            <button onClick={() => setActiveView('cadastros')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 mb-6 group">
                <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                Voltar para Cadastros
            </button>
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
                <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-blue-900">Consulta de Colaboradores</h3>
                        <p className="text-slate-600 mt-1">
                            Visualize, pesquise, adicione, edite ou altere o status dos funcionários.
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveView('cadastro-colaborador')}
                        className="flex-shrink-0 flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary border border-transparent rounded-lg hover:bg-blue-600 transition"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Novo Colaborador
                    </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="lg:col-span-2">
                             <label htmlFor="search-term" className="block text-xs font-medium text-slate-600 mb-1">Buscar</label>
                            <div className="relative">
                                <input
                                    id="search-term"
                                    type="text"
                                    placeholder="Nome ou matrícula..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white w-full pl-10 pr-4 py-2.5 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        </div>
                        <FilterSelect label="Área" value={filters.departamento} options={uniqueOptions.departamentos} onChange={val => handleFilterChange('departamento', val)} />
                        <FilterSelect label="Gerência" value={filters.area} options={uniqueOptions.areas} onChange={val => handleFilterChange('area', val)} />
                        <FilterSelect label="Perfil" value={filters.role} options={uniqueOptions.roles.map(r => ({ value: r, text: getRoleText(r) }))} onChange={val => handleFilterChange('role', val)} />
                        <FilterSelect label="Status" value={filters.status} options={uniqueOptions.statuses} onChange={val => handleFilterChange('status', val)} />
                    </div>
                </div>

                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-slate-200">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nome</th>
                                <th scope="col" className="px-6 py-3">Cargo</th>
                                <th scope="col" className="px-6 py-3">Nível Hierárquico</th>
                                <th scope="col" className="px-6 py-3">Gestor Imediato</th>
                                <th scope="col" className="px-6 py-3">Perfil de Acesso</th>
                                <th scope="col" className="px-6 py-3">Área</th>
                                <th scope="col" className="px-6 py-3">Unidade</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((employee) => {
                                const manager = allEmployees.find(m => m.id === employee.gestor);
                                const level = hierarchyLevels.find(h => h.level === employee.nivelHierarquico);
                                
                                return (
                                <tr key={employee.id} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                                    <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">
                                        <div>{employee.nome}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{employee.cargo}</td>
                                    <td className="px-6 py-4 text-slate-600">{level ? `${level.level} - ${level.description}` : employee.nivelHierarquico}</td>
                                    <td className="px-6 py-4 text-slate-600">{manager ? manager.nome : '-'}</td>
                                    <td className="px-6 py-4 text-slate-600">{getRoleText(employee.role)}</td>
                                    <td className="px-6 py-4 text-slate-600">{employee.departamento}</td>
                                    <td className="px-6 py-4 text-slate-600">{employee.unidade}</td>
                                    <td className="px-6 py-4">
                                        <span className={getStatusBadge(employee.status)}>
                                            {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => onEditEmployee(employee.id)}
                                                className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-blue-100 transition"
                                                title="Editar Colaborador"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            {employee.status === 'active' ? (
                                                <button
                                                    onClick={() => handleToggleStatus(employee.id, employee.nome, 'active')}
                                                    className="p-2 text-slate-500 hover:text-danger rounded-full hover:bg-red-100 transition"
                                                    title="Inativar Colaborador"
                                                >
                                                    <UserMinusIcon className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                 <button
                                                    onClick={() => handleToggleStatus(employee.id, employee.nome, 'inactive')}
                                                    className="p-2 text-slate-500 hover:text-success rounded-full hover:bg-green-100 transition"
                                                    title="Reativar Colaborador"
                                                >
                                                    <UserPlusIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden space-y-4">
                     {filteredEmployees.map((employee) => {
                        const manager = allEmployees.find(m => m.id === employee.gestor);
                        const level = hierarchyLevels.find(h => h.level === employee.nivelHierarquico);
                        
                        return (
                        <div key={employee.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-slate-800">{employee.nome}</h4>
                                    <p className="text-sm text-slate-500">{employee.cargo}</p>
                                </div>
                                <span className={getStatusBadge(employee.status)}>
                                    {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <div className="space-y-2 text-sm text-slate-600 mb-4">
                                <div className="flex justify-between">
                                    <span className="font-medium">Nível:</span>
                                    <span>{level ? `${level.level} - ${level.description}` : employee.nivelHierarquico}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Gestor:</span>
                                    <span>{manager ? manager.nome : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Área:</span>
                                    <span>{employee.departamento}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Unidade:</span>
                                    <span>{employee.unidade}</span>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => onEditEmployee(employee.id)}
                                    className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                                >
                                    <PencilIcon className="h-4 w-4 mr-1.5" />
                                    Editar
                                </button>
                                {employee.status === 'active' ? (
                                    <button
                                        onClick={() => handleToggleStatus(employee.id, employee.nome, 'active')}
                                        className="flex items-center px-3 py-1.5 text-sm font-medium text-danger bg-red-50 rounded-md hover:bg-red-100"
                                    >
                                        <UserMinusIcon className="h-4 w-4 mr-1.5" />
                                        Inativar
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleToggleStatus(employee.id, employee.nome, 'inactive')}
                                        className="flex items-center px-3 py-1.5 text-sm font-medium text-success bg-green-50 rounded-md hover:bg-green-100"
                                    >
                                        <UserPlusIcon className="h-4 w-4 mr-1.5" />
                                        Reativar
                                    </button>
                                )}
                            </div>
                        </div>
                    )})}
                </div>

                {filteredEmployees.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-slate-500">Nenhum colaborador encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListaDeFuncionarios;
