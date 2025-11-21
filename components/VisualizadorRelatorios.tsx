
import React, { useMemo, useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../hooks/useAuth';
import { PeriodoDeFerias as VacationPeriod, NivelHierarquico as HierarchyLevel, Funcionario as Employee } from '../tipos';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { getDynamicStatus, getStatusText } from '../constants';
import { getLogoDataUrl } from '../services/logoService';
import { formatDate } from '../utils/dateUtils';
import ChevronDownIcon from './icons/ChevronDownIcon';
import AdjustmentsHorizontalIcon from './icons/AdjustmentsHorizontalIcon';

// Helper Components
const SelectInput: React.FC<{ label: string, name: string, value: string, onChange: any, options: (string | { value: string, label: string })[] }> = ({ label, name, value, onChange, options }) => (
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

const reportColumnsConfig: { [key: string]: { key: string, label: string, default: boolean }[] } = {
    scheduled_chrono: [
        { key: 'employee.nome', label: 'Colaborador', default: true },
        { key: 'employee.cargo', label: 'Cargo', default: true },
        { key: 'employee.nivelHierarquico', label: 'Nível Hierárquico', default: true },
        { key: 'employee.unidade', label: 'Unidade', default: true },
        { key: 'employee.departamento', label: 'Área', default: true },
        { key: 'employee.gestor', label: 'Gestor Imediato', default: true },
        { key: 'periodId', label: 'P.A.', default: true },
        { key: 'concessionLimit', label: 'Limite Concessão', default: true },
        { key: 'periodoGozo', label: 'Período de Gozo', default: true },
        { key: 'quantidadeDias', label: 'Dias Férias', default: true },
        { key: 'diasAbono', label: 'Dias Abono', default: true },
        { key: 'status', label: 'Status', default: true },
    ],
    balance_summary: [
        { key: 'employee.nome', label: 'Colaborador', default: true },
        { key: 'employee.cargo', label: 'Cargo', default: true },
        { key: 'employee.nivelHierarquico', label: 'Nível Hierárquico', default: true },
        { key: 'employee.unidade', label: 'Unidade', default: true },
        { key: 'employee.departamento', label: 'Área', default: true },
        { key: 'employee.gestor', label: 'Gestor Imediato', default: true },
        { key: 'periodId', label: 'P.A.', default: true },
        { key: 'concessionLimit', label: 'Limite Concessão', default: true },
        { key: 'totalSaldo', label: 'Saldo Pendente (dias)', default: true },
    ]
};

const ColumnSelector: React.FC<{ columns: { key: string, label: string }[], visibleColumns: Record<string, boolean>, onChange: (key: string, visible: boolean) => void }> = ({ columns, visibleColumns, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-10 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition flex items-center justify-between"
            >
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-slate-500" />
                <span>Selecionar Colunas</span>
                <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {columns.map(col => (
                        <label key={col.key} className="flex items-center px-3 py-2 text-gray-900 cursor-pointer select-none hover:bg-slate-100">
                            <input
                                type="checkbox"
                                checked={visibleColumns[col.key] ?? false}
                                onChange={(e) => onChange(col.key, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                            />
                            <span className="font-normal block truncate">{col.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

interface ReportViewerProps {
    reportType: string | null;
    setActiveView: (view: string) => void;
}

const VisualizadorRelatorios: React.FC<ReportViewerProps> = ({ reportType, setActiveView }) => {
    const { allEmployees, companyUnits, companyManagements, companyAreas, hierarchyLevels, config } = useAuth();

    const [filters, setFilters] = useState({
        unidade: '',

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

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

    const reportConfig = useMemo(() => {
        if (!reportType) return null;
        switch (reportType) {
            case 'scheduled_chrono': return { title: 'Relatório de Férias Programadas', code: 'RH.REP.FER.001' };
            case 'balance_summary': return { title: 'Relatório Consolidado de Saldos', code: 'RH.REP.SAL.001' };
            default: return { title: 'Relatório', code: 'GEN.REP.000' };
        }
    }, [reportType]);

    const availableColumns = useMemo(() => reportType ? reportColumnsConfig[reportType] || [] : [], [reportType]);

    useEffect(() => {
        const initialVisible = availableColumns.reduce((acc, col) => {
            acc[col.key] = col.default;
            return acc;
        }, {} as Record<string, boolean>);
        setVisibleColumns(initialVisible);
    }, [availableColumns]);

    const data = useMemo(() => {
        if (!reportType) return [];
        let resultData: any[] = [];

        if (reportType === 'scheduled_chrono') {
            const allVacations = allEmployees.flatMap(emp =>
                emp.periodosAquisitivos.flatMap(pa =>
                    pa.fracionamentos
                        .filter(f => {
                            const status = getDynamicStatus(f);
                            return !['canceled', 'rejected', 'planned'].includes(status);
                        })
                        .map(f => ({
                            ...f,
                            employee: emp,
                            periodId: pa.id,
                            concessionLimit: pa.limiteConcessao,
                            periodoGozo: `${formatDate(f.inicioFerias)} a ${formatDate(f.terminoFerias)}`,
                            dynamicStatus: getDynamicStatus(f),
                            // Flattening props for easier sorting
                            'employee.nome': emp.nome,
                            'employee.cargo': emp.cargo,
                            'employee.unidade': emp.unidade,
                            'employee.departamento': emp.departamento,

                            'employee.matricula': emp.matricula,
                            'employee.dataAdmissao': emp.dataAdmissao
                        }))
                )
            );
            resultData = allVacations;
        }

        if (reportType === 'balance_summary') {
            const allPeriods = allEmployees.flatMap(emp =>
                emp.periodosAquisitivos.map(pa => {
                    const used = pa.fracionamentos
                        .filter(f => f.status !== 'canceled' && f.status !== 'rejected')
                        .reduce((sum, f) => sum + f.quantidadeDias + (f.diasAbono || 0), 0);
                    return {
                        employee: emp,
                        periodId: pa.id,
                        concessionLimit: pa.limiteConcessao,
                        totalSaldo: pa.saldoTotal - used,
                        // Flattening props for easier sorting
                        'employee.nome': emp.nome,
                        'employee.cargo': emp.cargo,
                        'employee.unidade': emp.unidade,
                        'employee.departamento': emp.departamento,
                        'employee.area': emp.area,
                        'employee.matricula': emp.matricula,
                        'employee.dataAdmissao': emp.dataAdmissao
                    };
                })
            );
            resultData = allPeriods.filter(item => item.totalSaldo > 0);
        }

        // Filtering
        resultData = resultData.filter(item => {
            if (filters.unidade && item.employee.unidade !== filters.unidade) return false;

            if (filters.area && item.employee.departamento !== filters.area) return false;
            if (filters.colaborador && item.employee.id.toString() !== filters.colaborador) return false;
            if (filters.gestor && (item.employee.gestor?.toString() !== filters.gestor && item.employee.id.toString() !== filters.gestor)) return false;
            if (filters.status && item.dynamicStatus !== filters.status) return false;

            if (filters.limiteConcessaoDe && item.concessionLimit < filters.limiteConcessaoDe) return false;
            if (filters.limiteConcessaoAte && item.concessionLimit > filters.limiteConcessaoAte) return false;

            if (reportType === 'scheduled_chrono') {
                if (filters.inicioFeriasDe && item.inicioFerias < filters.inicioFeriasDe) return false;
                if (filters.inicioFeriasAte && item.inicioFerias > filters.inicioFeriasAte) return false;
                if (filters.mesAnoInicio) {
                    const itemMonthYear = item.inicioFerias.substring(0, 7);
                    if (itemMonthYear !== filters.mesAnoInicio) return false;
                }
            }
            return true;
        });

        // Sorting
        resultData.sort((a, b) => {
            for (const sort of sorts) {
                if (sort.key === 'none') continue;

                let valA, valB;
                // Handle keys that might be nested or direct properties
                if (sort.key.includes('.')) {
                    valA = getNestedValue(a, sort.key);
                    valB = getNestedValue(b, sort.key);
                } else {
                    // Map sort keys to actual data properties if needed
                    switch (sort.key) {
                        case 'colaborador': valA = a.employee.nome; valB = b.employee.nome; break;
                        case 'matricula': valA = a.employee.matricula; valB = b.employee.matricula; break;
                        case 'cargo': valA = a.employee.cargo; valB = b.employee.cargo; break;
                        case 'dataAdmissao': valA = a.employee.dataAdmissao; valB = b.employee.dataAdmissao; break;
                        case 'periodoAquisitivo': valA = a.periodId; valB = b.periodId; break;
                        case 'limiteConcessao': valA = a.concessionLimit; valB = b.concessionLimit; break;
                        case 'periodoGozo': valA = a.inicioFerias; valB = b.inicioFerias; break;
                        case 'quantidadeDias': valA = a.quantidadeDias; valB = b.quantidadeDias; break;
                        case 'diasAbono': valA = a.diasAbono; valB = b.diasAbono; break;
                        case 'status': valA = a.dynamicStatus; valB = b.dynamicStatus; break;
                        case 'totalSaldo': valA = a.totalSaldo; valB = b.totalSaldo; break;
                        default: valA = a[sort.key]; valB = b[sort.key];
                    }
                }

                if (valA < valB) return sort.dir === 'asc' ? -1 : 1;
                if (valA > valB) return sort.dir === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return resultData;
    }, [reportType, allEmployees, filters, sorts]);

    const gestorOptions = useMemo(() => {
        const managerIds = new Set(allEmployees.map(e => e.gestor).filter((id): id is number => id !== null));
        return allEmployees
            .filter(e => managerIds.has(e.id) || e.role === 'manager' || e.role === 'admin')
            .map(e => ({ value: e.id.toString(), label: e.nome }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [allEmployees]);

    const statusOptions = useMemo(() => {
        if (!config?.vacationStatuses) return [];
        return config.vacationStatuses.filter(s => s.active).map(s => ({ value: s.id, label: s.label }));
    }, [config]);

    const sortOptions = [
        { value: 'none', label: 'Nenhuma' }, { value: 'colaborador', label: 'Colaborador' }, { value: 'matricula', label: 'Matrícula' },
        { value: 'cargo', label: 'Cargo' }, { value: 'dataAdmissao', label: 'Data de Admissão' }, { value: 'periodoAquisitivo', label: 'Período Aquisitivo' },
        { value: 'limiteConcessao', label: 'Limite Concessão' },
        ...(reportType === 'scheduled_chrono' ? [
            { value: 'periodoGozo', label: 'Período de Gozo' }, { value: 'quantidadeDias', label: 'Dias Férias' },
            { value: 'diasAbono', label: 'Dias Abono' }, { value: 'status', label: 'Status' }
        ] : []),
        ...(reportType === 'balance_summary' ? [
            { value: 'totalSaldo', label: 'Saldo Pendente' }
        ] : [])
    ];

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleColumnChange = (key: string, visible: boolean) => {
        setVisibleColumns(prev => ({ ...prev, [key]: visible }));
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
            unidade: '', area: '', colaborador: '', gestor: '',
            limiteConcessaoDe: '', limiteConcessaoAte: '', inicioFeriasDe: '', inicioFeriasAte: '',
            mesAnoInicio: '', status: '',
        });
        setSorts([
            { key: 'none', dir: 'asc' }, { key: 'none', dir: 'asc' },
            { key: 'none', dir: 'asc' }, { key: 'none', dir: 'asc' },
        ]);
    };

    const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const generatePDF = async () => {
        if (!reportConfig) return;

        const doc = new jsPDF({ orientation: 'landscape' });
        const logo = await getLogoDataUrl();
        const pageWidth = doc.internal.pageSize.getWidth();

        const head = [availableColumns.filter(c => visibleColumns[c.key]).map(c => c.label)];

        const body = data.map(row => {
            return availableColumns.filter(c => visibleColumns[c.key]).map(col => {
                let value = getNestedValue(row, col.key);

                if (col.key === 'status') {
                    return getStatusText(getDynamicStatus(row as any), config);
                }
                if (col.key === 'concessionLimit') {
                    return formatDate(value);
                }
                if (col.key === 'employee.gestor') {
                    const manager = allEmployees.find(e => e.id === value);
                    return manager ? manager.nome : 'N/A';
                }
                if (col.key === 'employee.nivelHierarquico') {
                    const level = hierarchyLevels.find(h => h.level === value);
                    return level ? `${level.level} - ${level.description}` : value;
                }

                return value;
            });
        });

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(reportConfig.title, 14, 22);
        doc.addImage(logo, 'PNG', pageWidth - 14 - 45, 15, 45, 0);

        autoTable(doc, {
            head: head,
            body: body,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: '#1E293B' },
            didDrawPage: (data) => {
                doc.setFontSize(8);
                doc.setTextColor(100);
                const footerText = `${reportConfig.code} | ${reportConfig.title} | Versão 1.0`;
                doc.text(footerText, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
            }
        });

        doc.save(`${reportConfig.title}.pdf`);
    };

    if (!reportType || !reportConfig) {
        return (
            <div>
                <p>Tipo de relatório inválido.</p>
                <button onClick={() => setActiveView('relatorios')}>Voltar</button>
            </div>
        );
    }

    const finalColumns = availableColumns.filter(c => visibleColumns[c.key]);

    return (
        <div>
            <button onClick={() => setActiveView('relatorios')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 mb-6 group">
                <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                Voltar para Relatórios
            </button>
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-blue-900">{reportConfig.title}</h3>
                        <p className="text-slate-500 text-sm mt-1">{reportConfig.code}</p>
                    </div>
                    <button onClick={generatePDF} className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600">
                        Exportar PDF
                    </button>
                </div>

                <details className="bg-slate-50 border border-slate-200 rounded-lg mb-6 group">
                    <summary className="p-4 font-semibold cursor-pointer flex justify-between items-center">
                        Filtros e Ordenação
                        <ChevronDownIcon className="h-5 w-5 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="p-4 border-t border-slate-200 space-y-4">
                        <div>
                            <h5 className="font-semibold text-slate-700 mb-2">Filtros</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <SelectInput label="Unidade" name="unidade" value={filters.unidade} onChange={handleFilterChange} options={companyUnits} />

                                <SelectInput label="Área" name="area" value={filters.area} onChange={handleFilterChange} options={companyAreas} />
                                <SelectInput label="Colaboradores" name="colaborador" value={filters.colaborador} onChange={handleFilterChange} options={allEmployees.map(e => ({ value: e.id.toString(), label: e.nome }))} />
                                <SelectInput label="Gestor" name="gestor" value={filters.gestor} onChange={handleFilterChange} options={gestorOptions} />
                                <DateInput label="Limite Concessão (De)" name="limiteConcessaoDe" value={filters.limiteConcessaoDe} onChange={handleFilterChange} />
                                <DateInput label="Limite Concessão (Até)" name="limiteConcessaoAte" value={filters.limiteConcessaoAte} onChange={handleFilterChange} />

                                {reportType === 'scheduled_chrono' && (
                                    <>
                                        <DateInput label="Início Férias (De)" name="inicioFeriasDe" value={filters.inicioFeriasDe} onChange={handleFilterChange} />
                                        <DateInput label="Início Férias (Até)" name="inicioFeriasAte" value={filters.inicioFeriasAte} onChange={handleFilterChange} />
                                        <div>
                                            <label className="text-xs font-medium text-slate-600 mb-1 block">Mês/Ano Início</label>
                                            <input type="month" name="mesAnoInicio" value={filters.mesAnoInicio} onChange={handleFilterChange} className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-sm p-2" />
                                        </div>
                                        <SelectInput label="Status" name="status" value={filters.status} onChange={handleFilterChange} options={statusOptions} />
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <h5 className="font-semibold text-slate-700 mb-2 flex items-center justify-between">
                                Ordenação e Visualização
                                <div className="w-56">
                                    <ColumnSelector columns={availableColumns} visibleColumns={visibleColumns} onChange={handleColumnChange} />
                                </div>
                            </h5>
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
                </details>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-800 text-xs text-white uppercase">
                            <tr>
                                {finalColumns.map(col => <th key={col.key} className="p-3 text-left font-semibold">{col.label}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {data.map((row: any, index) => (
                                <tr key={row.id || index} className="hover:bg-slate-50">
                                    {finalColumns.map(col => {
                                        let value = getNestedValue(row, col.key);
                                        if (col.key === 'status') {
                                            value = getStatusText(getDynamicStatus(row), config);
                                        }
                                        if (col.key === 'concessionLimit') {
                                            value = formatDate(value);
                                        }
                                        if (col.key === 'employee.gestor') {
                                            const manager = allEmployees.find(e => e.id === value);
                                            value = manager ? manager.nome : 'N/A';
                                        }
                                        if (col.key === 'employee.nivelHierarquico') {
                                            const level = hierarchyLevels.find(h => h.level === value);
                                            value = level ? `${level.level} - ${level.description}` : value;
                                        }

                                        return <td key={col.key} className="p-3 text-slate-700">{value}</td>
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data.length === 0 && <p className="text-center py-8 text-slate-500">Nenhum dado encontrado para os filtros selecionados.</p>}
                </div>
            </div>
        </div>
    );
};

export default VisualizadorRelatorios;
