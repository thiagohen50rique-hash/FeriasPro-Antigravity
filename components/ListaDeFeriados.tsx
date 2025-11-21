
import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import { FeriadoEmpresa, RegraFeriasColetivas } from '../tipos';
import { useModal } from '../hooks/useModal';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import { formatDate } from '../utils/dateUtils';

interface ListaDeFeriadosProps {
    setActiveView: (view: string) => void;
    onEditHoliday: (holidayId: string) => void;
}

const getTypeLabel = (type: string): string => {
    switch (type) {
        case 'feriado': return 'Feriado';
        case 'ponto_facultativo': return 'Ponto Facultativo';
        case 'recesso': return 'Recesso';
        default: return type.replace(/_/g, ' ');
    }
};

const getTypeBadge = (type: string): string => {
    const baseClasses = 'px-2 py-0.5 text-xs font-semibold rounded-full';
    switch (type) {
        case 'feriado': return `${baseClasses} bg-danger/10 text-danger`;
        case 'ponto_facultativo': return `${baseClasses} bg-warning/10 text-warning-dark`;
        case 'recesso': return `${baseClasses} bg-info/10 text-info`;
        default: return `${baseClasses} bg-slate-200 text-slate-600`;
    }
};

const TabelaListaDeFeriados: React.FC<{ holidays: FeriadoEmpresa[], onEdit: (id: string) => void, onDelete: (holiday: FeriadoEmpresa) => void }> = ({ holidays, onEdit, onDelete }) => (
    <table className="w-full text-sm text-left">
        <thead className="text-xs text-white uppercase bg-gray-800">
            <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Data</th>
                <th scope="col" className="px-6 py-3 font-semibold">Descrição</th>
                <th scope="col" className="px-6 py-3 font-semibold">Tipo</th>
                <th scope="col" className="px-6 py-3 font-semibold">Unidade</th>
                <th scope="col" className="px-6 py-3 font-semibold">Ano</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">Ações</th>
            </tr>
        </thead>
        <tbody>
            {holidays.map((holiday) => (
                <tr key={holiday.id} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-800 whitespace-nowrap">{formatDate(holiday.data)}</td>
                    <td className="px-6 py-4 text-slate-600">{holiday.descricao}</td>
                    <td className="px-6 py-4"><span className={getTypeBadge(holiday.tipo)}>{getTypeLabel(holiday.tipo)}</span></td>
                    <td className="px-6 py-4 text-slate-600">{holiday.unidade || 'Geral'}</td>
                    <td className="px-6 py-4 text-slate-600">{holiday.ano}</td>
                    <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            <button onClick={() => onEdit(holiday.id)} className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-blue-100 transition" title="Editar Feriado"><PencilIcon className="h-4 w-4" /></button>
                            <button onClick={() => onDelete(holiday)} className="p-2 text-slate-500 hover:text-danger rounded-full hover:bg-red-100 transition" title="Excluir Feriado"><TrashIcon className="h-4 w-4" /></button>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

const TabelaFeriasColetivas: React.FC<{ rules: RegraFeriasColetivas[], onDelete: (rule: RegraFeriasColetivas) => void }> = ({ rules, onDelete }) => (
    <table className="w-full text-sm text-left">
        <thead className="text-xs text-white uppercase bg-gray-800">
            <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Descrição</th>
                <th scope="col" className="px-6 py-3 font-semibold">Período</th>
                <th scope="col" className="px-6 py-3 font-semibold">Aplicação</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">Ações</th>
            </tr>
        </thead>
        <tbody>
            {rules.map((rule) => {
                const filters = [rule.unidade, rule.departamento].filter(Boolean).join(' / ');
                const application = filters || (rule.colaboradorIds && rule.colaboradorIds.length > 0 ? `${rule.colaboradorIds.length} colaborador(es)` : 'Geral');
                return (
                    <tr key={rule.id} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-6 py-4 font-semibold text-slate-800">{rule.descricao}</td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{formatDate(rule.inicio)} a {formatDate(rule.fim)}</td>
                        <td className="px-6 py-4 text-slate-600">{application}</td>
                        <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                                {/* Edit functionality for collective vacations can be added here if needed */}
                                <button onClick={() => onDelete(rule)} className="p-2 text-slate-500 hover:text-danger rounded-full hover:bg-danger/10" title="Excluir Regra"><TrashIcon className="h-4 w-4" /></button>
                            </div>
                        </td>
                    </tr>
                );
            })}
        </tbody>
    </table>
);


const ListaDeFeriados: React.FC<ListaDeFeriadosProps> = ({ setActiveView, onEditHoliday }) => {
    const { holidays, allEmployees, deleteHoliday, collectiveVacationRules, deleteCollectiveVacationRule } = useAuth();
    const modal = useModal();
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedUnit, setSelectedUnit] = useState<string>('todas');
    const [activeTab, setActiveTab] = useState<'holidays' | 'collective'>('holidays');

    const availableYears = useMemo(() =>
        [...new Set(holidays.map(h => h.ano.toString()))]
            .sort((a: string, b: string) => parseInt(b) - parseInt(a)),
        [holidays]);

    const availableUnits = useMemo(() =>
        ['todas', 'geral', ...[...new Set(allEmployees.map(e => e.unidade))].sort()],
        [allEmployees]
    );

    const filteredHolidays = useMemo(() => {
        return holidays.filter(h => {
            const yearMatch = !selectedYear || selectedYear === 'todos' || h.ano.toString() === selectedYear;
            if (!yearMatch) return false;

            if (selectedUnit === 'todas') return true;
            if (selectedUnit === 'geral') return !h.unidade;
            return h.unidade === selectedUnit;
        });
    }, [holidays, selectedYear, selectedUnit]);

    const handleDeleteHoliday = async (holiday: FeriadoEmpresa) => {
        const confirmed = await modal.confirm({
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja excluir o feriado "${holiday.descricao}"? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            deleteHoliday(holiday.id);
            modal.alert({ title: 'Sucesso', message: 'Feriado excluído com sucesso!' });
        }
    };

    const handleDeleteRule = async (rule: RegraFeriasColetivas) => {
        const confirmed = await modal.confirm({
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja excluir a regra "${rule.descricao}"?`,
            confirmText: 'Excluir',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            deleteCollectiveVacationRule(rule.id);
            modal.alert({ title: 'Sucesso', message: 'Regra de férias coletivas excluída com sucesso!' });
        }
    };

    return (
        <div>
            <button onClick={() => setActiveView('cadastros')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 mb-6 group">
                <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                Voltar para Cadastros
            </button>
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
                <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-blue-900">Consulta de Feriados e Recessos</h3>
                        <p className="text-slate-600 mt-1">
                            Visualize, adicione ou gerencie os feriados e regras de férias coletivas.
                        </p>
                    </div>
                    <button
                        onClick={() => setActiveView('cadastro-feriado')}
                        className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary border border-transparent rounded-lg hover:bg-blue-600 transition"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Novo Cadastro
                    </button>
                </div>

                <div className="border-b border-slate-200 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('holidays')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'holidays' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            Feriados e Recessos
                        </button>
                        <button onClick={() => setActiveTab('collective')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'collective' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            Férias Coletivas
                        </button>
                    </nav>
                </div>

                {activeTab === 'holidays' && (
                    <div className="flex flex-wrap justify-end items-center mb-6 gap-4">
                        <div>
                            <label htmlFor="unit-select" className="block text-sm font-medium text-slate-700 mb-1">Filtrar por unidade</label>
                            <select id="unit-select" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="bg-white w-full md:w-auto border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500">
                                {availableUnits.map(unit => (<option key={unit} value={unit} className="capitalize">{unit.charAt(0).toUpperCase() + unit.slice(1)}</option>))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="year-select" className="block text-sm font-medium text-slate-700 mb-1">Filtrar por ano</label>
                            <select id="year-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-white w-full md:w-auto border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500">
                                <option value="todos">Todos os Anos</option>
                                {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                            </select>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    {activeTab === 'holidays' ? (
                        filteredHolidays.length > 0 ? (
                            <TabelaListaDeFeriados holidays={filteredHolidays} onEdit={onEditHoliday} onDelete={handleDeleteHoliday} />
                        ) : (
                            <div className="text-center py-16">
                                <CalendarDaysIcon className="mx-auto h-12 w-12 text-slate-400" />
                                <h4 className="mt-4 text-lg font-semibold text-slate-700">Nenhum Registro Encontrado</h4>
                                <p className="mt-1 text-sm text-slate-500">Não há feriados ou recessos para os filtros selecionados.</p>
                            </div>
                        )
                    ) : (
                        collectiveVacationRules.length > 0 ? (
                            <TabelaFeriasColetivas rules={collectiveVacationRules} onDelete={handleDeleteRule} />
                        ) : (
                            <div className="text-center py-16">
                                <CalendarDaysIcon className="mx-auto h-12 w-12 text-slate-400" />
                                <h4 className="mt-4 text-lg font-semibold text-slate-700">Nenhuma Regra Encontrada</h4>
                                <p className="mt-1 text-sm text-slate-500">Nenhuma regra de férias coletivas foi cadastrada ainda.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListaDeFeriados;
