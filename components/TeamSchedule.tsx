
import React, { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Funcionario, PeriodoDeFerias, PeriodoAquisitivo } from '../tipos';
import { getDescendantUnitIds, getDynamicStatus, getStatusText, getStatusBadge } from '../constants';
import { formatDate } from '../utils/dateUtils';
import UsersIcon from './icons/UsersIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import { generateVacationRequestPDF } from '../services/pdfGenerator';

type DadosFeriasEquipe = PeriodoDeFerias & {
    employee: Funcionario;
    periodId: string;
    periodStartDate: string;
    periodEndDate: string;
    concessionLimit: string;
};

// Helper Components defined locally as they are simple wrappers
const SelectInput: React.FC<{ label: string, name: string, value: string, onChange: any, options: (string | {value: string, label: string})[] }> = ({ label, name, value, onChange, options }) => (
    <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
        <select name={name} value={value} onChange={onChange} className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-sm p-2">
            <option value="">Todos</option>
            {options.map(opt => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const lab = typeof opt === 'string' ? opt : opt.label;
                return <option key={val} value={val}>{lab}</option>
            })}
        </select>
    </div>
);

const DateInput: React.FC<{ label: string, name: string, value: string, onChange: any }> = ({ label, name, value, onChange }) => (
    <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">{label}</label>
        <input type="date" name={name} value={value} onChange={onChange} className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-sm p-2" />
    </div>
);


const TeamSchedule: React.FC = () => {
    const { user: currentUser, allEmployees, orgUnits, companyUnits, companyManagements, companyAreas, config } = useAuth();
    
    // Filters State
    const [filters, setFilters] = useState({
        unidade: '',
        gerencia: '',
        area: '',
        colaborador: '',
        gestor: '',
        limiteConcessaoDe: '',
        limiteConcessaoAte: '',
        inicioFeriasDe: '',
        inicioFeriasAte: '',
        mesAnoInicio: '',
        status: '',
    });

    // Sorting State
    const [sorts, setSorts] = useState([
        { key: 'none', dir: 'asc' },
        { key: 'none', dir: 'asc' },
        { key: 'none', dir: 'asc' },
        { key: 'none', dir: 'asc' },
    ]);

    const managedEmployees = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === 'admin' || currentUser.role === 'rh') {
            return allEmployees;
        }
        if (currentUser.role === 'manager') {
            const managedUnits = orgUnits.filter(u => u.name === currentUser.departamento && u.type === 'Área');
            const managedUnitIds = managedUnits.map(u => u.id);
            const descendantUnitIds: string[] = [];
            managedUnits.forEach(unit => {
                descendantUnitIds.push(...getDescendantUnitIds(unit.id, orgUnits));
            });
            const allManagedUnitIds = [...new Set([...managedUnitIds, ...descendantUnitIds])];
            
            const team = allEmployees.filter(emp => {
                const empUnit = orgUnits.find(u => u.name === emp.departamento && u.type === 'Área');
                return empUnit && allManagedUnitIds.includes(empUnit.id);
            });

            // Explicitly ensure the manager is in the list if not already added by unit logic
            if (!team.some(e => e.id === currentUser.id)) {
                const currentUserFull = allEmployees.find(e => e.id === currentUser.id);
                if(currentUserFull) team.push(currentUserFull);
            }
            return team;
        }
        return [];
    }, [currentUser, allEmployees, orgUnits]);

    const allTeamVacations: DadosFeriasEquipe[] = useMemo(() => {
        return managedEmployees.flatMap(emp =>
            emp.periodosAquisitivos.flatMap(pa =>
                pa.fracionamentos.map(f => ({
                    ...f,
                    employee: emp,
                    periodId: pa.id,
                    periodStartDate: pa.inicioPa,
                    periodEndDate: pa.terminoPa,
                    concessionLimit: pa.limiteConcessao,
                }))
            )
        );
    }, [managedEmployees]);

    const filteredAndSortedData = useMemo(() => {
        let data = [...allTeamVacations];

        // Filtering logic
        data = data.filter(item => {
            if (filters.unidade && item.employee.unidade !== filters.unidade) return false;
            if (filters.gerencia && item.employee.area !== filters.gerencia) return false;
            if (filters.area && item.employee.departamento !== filters.area) return false;
            if (filters.colaborador && item.employee.id.toString() !== filters.colaborador) return false;
            if (filters.gestor && item.employee.gestor?.toString() !== filters.gestor) return false;
            if (filters.limiteConcessaoDe && item.concessionLimit < filters.limiteConcessaoDe) return false;
            if (filters.limiteConcessaoAte && item.concessionLimit > filters.limiteConcessaoAte) return false;
            if (filters.inicioFeriasDe && item.inicioFerias < filters.inicioFeriasDe) return false;
            if (filters.inicioFeriasAte && item.inicioFerias > filters.inicioFeriasAte) return false;
            if (filters.mesAnoInicio) {
                const itemMonthYear = item.inicioFerias.substring(0, 7);
                if (itemMonthYear !== filters.mesAnoInicio) return false;
            }
            if (filters.status && getDynamicStatus(item) !== filters.status) return false;
            
            return true;
        });
        
        // Sorting logic
        data.sort((a, b) => {
            for (const sort of sorts) {
                if (sort.key === 'none') continue;

                let valA, valB;
                switch(sort.key) {
                    case 'colaborador': valA = a.employee.nome; valB = b.employee.nome; break;
                    case 'matricula': valA = a.employee.matricula; valB = b.employee.matricula; break;
                    case 'cargo': valA = a.employee.cargo; valB = b.employee.cargo; break;
                    case 'dataAdmissao': valA = a.employee.dataAdmissao; valB = b.employee.dataAdmissao; break;
                    case 'periodoAquisitivo': valA = a.periodStartDate; valB = b.periodStartDate; break;
                    case 'limiteConcessao': valA = a.concessionLimit; valB = b.concessionLimit; break;
                    case 'periodoGozo': valA = a.inicioFerias; valB = b.inicioFerias; break;
                    default: valA = (a as any)[sort.key]; valB = (b as any)[sort.key];
                }

                if (valA < valB) return sort.dir === 'asc' ? -1 : 1;
                if (valA > valB) return sort.dir === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return data;
    }, [allTeamVacations, filters, sorts]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSortKeyChange = (index: number, key: string) => {
        setSorts(prev => {
            const newSorts = [...prev];
            newSorts[index].key = key;
            return newSorts;
        });
    };

    const handleSortDirChange = (index: number, dir: 'asc' | 'desc') => {
        setSorts(prev => {
            const newSorts = [...prev];
            newSorts[index].dir = dir;
            return newSorts;
        });
    };
    
    const clearFilters = () => {
        setFilters({
            unidade: '', gerencia: '', area: '', colaborador: '', gestor: '',
            limiteConcessaoDe: '', limiteConcessaoAte: '', inicioFeriasDe: '', inicioFeriasAte: '',
            mesAnoInicio: '', status: '',
        });
        setSorts([
            { key: 'none', dir: 'asc' }, { key: 'none', dir: 'asc' },
            { key: 'none', dir: 'asc' }, { key: 'none', dir: 'asc' },
        ]);
    };

    const gestorOptions = useMemo(() => {
        const managerIds = new Set(managedEmployees.map(e => e.gestor).filter((id): id is number => id !== null));
        return allEmployees
            .filter(e => managerIds.has(e.id))
            .map(e => ({ value: e.id.toString(), label: e.nome }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [managedEmployees, allEmployees]);

    const statusOptions = useMemo(() => {
        if (!config?.vacationStatuses) return [];
        return config.vacationStatuses.filter(s => s.active).map(s => ({
            value: s.id,
            label: s.label
        }));
    }, [config]);

    const sortOptions = [
        { value: 'none', label: 'Nenhuma' }, { value: 'colaborador', label: 'Colaborador' }, { value: 'matricula', label: 'Matrícula' },
        { value: 'cargo', label: 'Cargo' }, { value: 'dataAdmissao', label: 'Data de Admissão' }, { value: 'periodoAquisitivo', label: 'Período Aquisitivo' },
        { value: 'limiteConcessao', label: 'Limite Concessão' }, { value: 'periodoGozo', label: 'Período de Gozo' }, { value: 'quantidadeDias', label: 'Dias Férias' },
        { value: 'diasAbono', label: 'Dias Abono' }, { value: 'status', label: 'Status' }
    ];

    const handleGeneratePDF = async (item: DadosFeriasEquipe) => {
        const { employee, periodId, ...vacationData } = item;
        const period = employee.periodosAquisitivos.find(p => p.id === periodId);
        if (period) {
            // The generate function expects a PeriodoDeFerias, not DadosFeriasEquipe, so we cast it.
            await generateVacationRequestPDF(employee, period, allEmployees, vacationData as PeriodoDeFerias);
        }
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
             <h3 className="text-xl font-bold text-blue-900 mb-6">Programação de Férias da Equipe</h3>

            <details className="bg-slate-50 border border-slate-200 rounded-lg mb-6 group">
                <summary className="p-4 font-semibold cursor-pointer flex justify-between items-center">
                    Filtros e Ordenação
                    <ChevronDownIcon className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="p-4 border-t border-slate-200">
                    <div className="space-y-4">
                        <div>
                            <h5 className="font-semibold text-slate-700 mb-2">Filtros</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <SelectInput label="Unidade" name="unidade" value={filters.unidade} onChange={handleFilterChange} options={companyUnits} />
                                <SelectInput label="Gerência" name="gerencia" value={filters.gerencia} onChange={handleFilterChange} options={companyManagements} />
                                <SelectInput label="Área" name="area" value={filters.area} onChange={handleFilterChange} options={companyAreas} />
                                <SelectInput label="Colaboradores" name="colaborador" value={filters.colaborador} onChange={handleFilterChange} options={managedEmployees.map(e => ({ value: e.id.toString(), label: e.nome }))} />
                                <SelectInput label="Gestor" name="gestor" value={filters.gestor} onChange={handleFilterChange} options={gestorOptions} />
                                <DateInput label="Limite Concessão (De)" name="limiteConcessaoDe" value={filters.limiteConcessaoDe} onChange={handleFilterChange} />
                                <DateInput label="Limite Concessão (Até)" name="limiteConcessaoAte" value={filters.limiteConcessaoAte} onChange={handleFilterChange} />
                                <DateInput label="Início Férias (De)" name="inicioFeriasDe" value={filters.inicioFeriasDe} onChange={handleFilterChange} />
                                <DateInput label="Início Férias (Até)" name="inicioFeriasAte" value={filters.inicioFeriasAte} onChange={handleFilterChange} />
                                <div>
                                    <label className="text-xs font-medium text-slate-600 mb-1 block">Mês/Ano Início</label>
                                    <input type="month" name="mesAnoInicio" value={filters.mesAnoInicio} onChange={handleFilterChange} className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-sm p-2" />
                                </div>
                                <SelectInput label="Status" name="status" value={filters.status} onChange={handleFilterChange} options={statusOptions} />
                            </div>
                        </div>
                        <div className="border-t pt-4">
                             <h5 className="font-semibold text-slate-700 mb-2">Ordenação</h5>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {sorts.map((sort, i) => (
                                    <div key={i}>
                                        <label className="text-xs font-medium text-slate-600 mb-1 block">Ordenar por {i + 1}</label>
                                        <select value={sort.key} onChange={(e) => handleSortKeyChange(i, e.target.value)} className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-sm p-2 mb-2">
                                            {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                        <div className="flex items-center space-x-4 text-sm">
                                            <label><input type="radio" name={`dir-${i}`} value="asc" checked={sort.dir === 'asc'} onChange={() => handleSortDirChange(i, 'asc')} /> Crescente</label>
                                            <label><input type="radio" name={`dir-${i}`} value="desc" checked={sort.dir === 'desc'} onChange={() => handleSortDirChange(i, 'desc')} /> Decrescente</label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t">
                            <button onClick={clearFilters} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                                Limpar Filtros e Ordenação
                            </button>
                        </div>
                    </div>
                </div>
            </details>

            {/* Desktop View Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-xs text-white uppercase">
                        <tr>
                            <th className="p-3 text-left font-semibold">Colaborador</th>
                            <th className="p-3 text-left font-semibold">Cargo</th>
                            <th className="p-3 text-left font-semibold">Período Aquisitivo</th>
                            <th className="p-3 text-left font-semibold">Limite Concessão</th>
                            <th className="p-3 text-left font-semibold">Período de Férias</th>
                            <th className="p-3 text-center font-semibold">Dias Férias</th>
                            <th className="p-3 text-center font-semibold">Dias Abono</th>
                            <th className="p-3 text-center font-semibold">Status</th>
                            <th className="p-3 text-center font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredAndSortedData.length > 0 ? filteredAndSortedData.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="p-3 font-semibold text-slate-800">{item.employee.nome}</td>
                                <td className="p-3 text-slate-600">{item.employee.cargo}</td>
                                <td className="p-3 text-slate-600">{formatDate(item.periodStartDate)} a {formatDate(item.periodEndDate)}</td>
                                <td className="p-3 text-slate-600">{formatDate(item.concessionLimit)}</td>
                                <td className="p-3 text-slate-600">{formatDate(item.inicioFerias)} a {formatDate(item.terminoFerias)}</td>
                                <td className="p-3 text-center text-slate-600">{item.quantidadeDias}</td>
                                <td className="p-3 text-center text-slate-600">{item.diasAbono > 0 ? item.diasAbono : 'Não'}</td>
                                <td className="p-3 text-center"><span className={getStatusBadge(getDynamicStatus(item), config)}>{getStatusText(getDynamicStatus(item), config)}</span></td>
                                <td className="p-3 text-center">
                                    <button onClick={() => handleGeneratePDF(item)} className="p-1.5 text-slate-400 hover:text-green-600 rounded-full hover:bg-green-100/60 transition-colors" title="Gerar Requerimento">
                                        <DocumentTextIcon className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={9} className="text-center py-10">
                                    <UsersIcon className="mx-auto h-10 w-10 text-slate-400" />
                                    <p className="mt-2 text-slate-500">Nenhuma programação de férias encontrada para os filtros aplicados.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View Cards */}
            <div className="md:hidden space-y-4">
                {filteredAndSortedData.length > 0 ? filteredAndSortedData.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-slate-800">{item.employee.nome}</h4>
                                <p className="text-xs text-slate-500">{item.employee.cargo}</p>
                            </div>
                            <span className={getStatusBadge(getDynamicStatus(item), config)}>{getStatusText(getDynamicStatus(item), config)}</span>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600 mb-3">
                             <div className="flex justify-between">
                                <span className="font-medium">P.A.:</span>
                                <span>{formatDate(item.periodStartDate)} a {formatDate(item.periodEndDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Gozo:</span>
                                <span>{formatDate(item.inicioFerias)} a {formatDate(item.terminoFerias)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="font-medium">Dias:</span>
                                <span>{item.quantidadeDias} {item.diasAbono > 0 ? `(+${item.diasAbono} abono)` : ''}</span>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => handleGeneratePDF(item)} 
                                className="flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100"
                            >
                                <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                                Gerar Requerimento
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-10">
                        <p className="text-slate-500">Nenhuma programação de férias encontrada.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default TeamSchedule;
