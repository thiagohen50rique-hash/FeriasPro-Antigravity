
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ConfiguracaoApp, StatusFeriasConfig } from '../tipos';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import { useModal } from '../hooks/useModal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import { formatDate } from '../utils/dateUtils';

interface GeneralSettingsProps {
    setActiveView: (view: string) => void;
}

const OptionsManagement: React.FC<{
    title: string;
    items: number[];
    onItemsChange: (newItems: number[]) => void;
    itemTypeLabel: string;
}> = ({ title, items, onItemsChange, itemTypeLabel }) => {
    const [newItem, setNewItem] = useState('');
    const [error, setError] = useState('');
    const modal = useModal();

    const handleAddItem = () => {
        const numValue = parseInt(newItem, 10);
        if (isNaN(numValue) || numValue <= 0 || numValue > 30) {
             setError('Insira um valor válido entre 1 e 30 dias.');
             return;
        }
        if (items.includes(numValue)) {
             setError('Esta opção já existe.');
             return;
        }
        
        const newOptions = [...items, numValue].sort((a, b) => a - b);
        onItemsChange(newOptions);
        setNewItem('');
        setError('');
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem();
        }
    };

    const handleDeleteItem = async (itemToDelete: number) => {
         setError('');
         if (items.length <= 1) {
            setError(`É necessário manter pelo menos uma opção de dias de ${itemTypeLabel}.`);
            setTimeout(() => setError(''), 5000);
            return;
        }

        const confirmed = await modal.confirm({
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja excluir a opção de "${itemToDelete}" dias?`,
            confirmText: 'Excluir',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            const newOptions = items.filter(item => item !== itemToDelete);
            onItemsChange(newOptions);
        }
    };
    
    return (
        <div className="p-6 bg-white rounded-lg border border-slate-200">
            <h4 className="text-lg font-bold text-slate-800 mb-4">{title}</h4>
            {error && (
                <div className="mb-4 p-3 text-sm text-danger-dark bg-danger-light rounded-md border border-danger">
                    {error}
                </div>
            )}
            <div className="flex items-center space-x-2 mb-4">
                <input
                    type="number"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: 15"
                    className="bg-white flex-grow border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3"
                />
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600 disabled:bg-slate-400"
                    disabled={!newItem.trim()}
                >
                    <PlusIcon className="h-5 w-5" />
                </button>
            </div>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {items.map((item) => (
                    <li key={item} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-md border border-slate-200 text-sm">
                        <span className="text-slate-700">{item} dias</span>
                        <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 text-slate-400 hover:text-danger rounded-full hover:bg-red-100 transition"
                            title={`Excluir ${item}`}
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </li>
                ))}
                 {items.length === 0 && <p className="text-sm text-center text-slate-500 py-4">Nenhum item cadastrado.</p>}
            </ul>
        </div>
    );
};

const StatusTable: React.FC<{
    title: string;
    description: string;
    category: 'period' | 'fraction';
    statuses: StatusFeriasConfig[];
    onStatusChange: (id: string, field: keyof StatusFeriasConfig, value: any) => void;
    onAddStatus: (newStatus: StatusFeriasConfig) => void;
    onDeleteStatus: (id: string) => void;
}> = ({ title, description, category, statuses, onStatusChange, onAddStatus, onDeleteStatus }) => {
    const [newId, setNewId] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newStyle, setNewStyle] = useState<'success' | 'warning' | 'danger' | 'info' | 'neutral'>('neutral');
    const [addError, setAddError] = useState('');

    const handleAdd = () => {
        setAddError('');
        const cleanId = newId.trim().toLowerCase().replace(/\s+/g, '_');
        
        if (!cleanId || !newLabel.trim()) {
            setAddError('ID e Rótulo são obrigatórios.');
            return;
        }
        
        if (statuses.some(s => s.id === cleanId)) {
             setAddError('Este ID de status já existe.');
             return;
        }
        
        // Simple regex for valid ID (alphanumeric and underscore)
        if (!/^[a-z0-9_]+$/.test(cleanId)) {
            setAddError('O ID deve conter apenas letras minúsculas, números e underline.');
            return;
        }

        onAddStatus({
            id: cleanId,
            label: newLabel.trim(),
            style: newStyle,
            active: true,
            category: category,
            isSystem: false,
        });
        
        setNewId('');
        setNewLabel('');
        setNewStyle('neutral');
    };

    return (
        <div className="p-6 bg-white rounded-lg border border-slate-200 mb-6">
            <h4 className="text-lg font-bold text-slate-800 mb-1">{title}</h4>
            <p className="text-sm text-slate-600 mb-4">{description}</p>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 w-1/4">Status (Sistema ID)</th>
                            <th className="px-4 py-3 w-1/3">Rótulo Exibido</th>
                            <th className="px-4 py-3 w-1/4">Estilo</th>
                            <th className="px-4 py-3 text-center w-20">Ativo</th>
                            <th className="px-4 py-3 text-center w-20">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {statuses.map(status => (
                            <tr key={status.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                                    {status.id}
                                    {status.isSystem && <span className="ml-2 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600" title="Status do Sistema">SYS</span>}
                                    {status.category === 'both' && <span className="ml-1 text-[10px] bg-blue-100 px-1.5 py-0.5 rounded text-blue-600" title="Compartilhado">AMBOS</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <input 
                                        type="text" 
                                        value={status.label} 
                                        onChange={(e) => onStatusChange(status.id, 'label', e.target.value)}
                                        className="bg-white border-gray-300 rounded-md shadow-sm text-sm w-full py-1.5"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <select 
                                        value={status.style} 
                                        onChange={(e) => onStatusChange(status.id, 'style', e.target.value)}
                                        className="bg-white border-gray-300 rounded-md shadow-sm text-sm w-full py-1.5"
                                    >
                                        <option value="neutral">Neutro (Cinza)</option>
                                        <option value="success">Sucesso (Verde)</option>
                                        <option value="warning">Alerta (Amarelo)</option>
                                        <option value="danger">Perigo (Vermelho)</option>
                                        <option value="info">Info (Azul)</option>
                                    </select>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={status.active} 
                                        onChange={(e) => onStatusChange(status.id, 'active', e.target.checked)}
                                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {!status.isSystem && (
                                        <button 
                                            onClick={() => onDeleteStatus(status.id)} 
                                            className="text-slate-400 hover:text-danger transition-colors"
                                            title="Excluir Status"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        
                        {/* Add Row */}
                        <tr className="bg-blue-50/30">
                            <td className="px-4 py-3">
                                <input 
                                    type="text" 
                                    placeholder="novo_status_id" 
                                    value={newId}
                                    onChange={(e) => setNewId(e.target.value)}
                                    className="bg-white border-gray-300 rounded-md shadow-sm text-xs w-full py-1.5 font-mono"
                                />
                            </td>
                            <td className="px-4 py-3">
                                <input 
                                    type="text" 
                                    placeholder="Rótulo" 
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    className="bg-white border-gray-300 rounded-md shadow-sm text-sm w-full py-1.5"
                                />
                            </td>
                            <td className="px-4 py-3">
                                <select 
                                    value={newStyle} 
                                    onChange={(e) => setNewStyle(e.target.value as any)}
                                    className="bg-white border-gray-300 rounded-md shadow-sm text-sm w-full py-1.5"
                                >
                                    <option value="neutral">Neutro</option>
                                    <option value="success">Sucesso</option>
                                    <option value="warning">Alerta</option>
                                    <option value="danger">Perigo</option>
                                    <option value="info">Info</option>
                                </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span className="text-xs text-slate-400">Ativo</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                                <button 
                                    onClick={handleAdd} 
                                    className="text-primary hover:text-blue-700 transition-colors"
                                    title="Adicionar"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                {addError && <p className="text-xs text-danger mt-2 px-4">{addError}</p>}
            </div>
        </div>
    );
}


const GeneralSettings: React.FC<GeneralSettingsProps> = ({ setActiveView }) => {
    const { config, updateConfig, holidayTypes, setHolidayTypes, holidays } = useAuth();
    const modal = useModal();
    const [formData, setFormData] = useState<Partial<ConfiguracaoApp>>({});
    const [newHolidayType, setNewHolidayType] = useState('');
    const [activeTab, setActiveTab] = useState<'general' | 'status'>('general');

    useEffect(() => {
        if (config) {
            setFormData(config);
        }
    }, [config]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'radio') {
             setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                [name]: type === 'number' ? parseInt(value, 10) || 0 : value 
            }));
        }
    };
    
    const handleVacationOptionsChange = (newItems: number[]) => {
        setFormData(prev => ({ ...prev, diasFeriasOptions: newItems }));
        if (config) {
            updateConfig({ ...config, ...formData, diasFeriasOptions: newItems });
        }
    };

    const handleStatusChange = (id: string, field: keyof StatusFeriasConfig, value: any) => {
        const updatedStatuses = formData.vacationStatuses?.map(s => s.id === id ? { ...s, [field]: value } : s);
        setFormData(prev => ({ ...prev, vacationStatuses: updatedStatuses }));
    };

    const handleAddStatus = (newStatus: StatusFeriasConfig) => {
        const currentStatuses = formData.vacationStatuses || [];
        if (currentStatuses.some(s => s.id === newStatus.id)) return;
        setFormData(prev => ({ ...prev, vacationStatuses: [...currentStatuses, newStatus] }));
    };

    const handleDeleteStatus = async (id: string) => {
         const confirmed = await modal.confirm({
            title: 'Excluir Status',
            message: `Tem certeza que deseja excluir o status "${id}"?`,
            confirmVariant: 'danger',
            confirmText: 'Excluir'
        });
        if (confirmed) {
            setFormData(prev => ({ ...prev, vacationStatuses: prev.vacationStatuses?.filter(s => s.id !== id) }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (config) {
            updateConfig({ ...config, ...formData });
            modal.alert({title: 'Sucesso', message: 'Configurações salvas com sucesso!', confirmVariant: 'success'});
        }
    };
    
    const handleDeleteHolidayType = async (typeToDelete: string) => {
        const isUsed = holidays.some(h => h && h.tipo === typeToDelete as any);
        if (isUsed) {
            modal.alert({
                title: 'Ação Bloqueada',
                message: `Não é possível excluir o tipo "${typeToDelete.replace(/_/g, ' ')}", pois está em uso por um ou mais feriados/recessos.`,
                confirmVariant: 'warning'
            });
            return;
        }
         const confirmed = await modal.confirm({
            title: 'Confirmar Exclusão',
            message: `Tem certeza que deseja excluir o tipo "${typeToDelete.replace(/_/g, ' ')}"?`,
            confirmText: 'Excluir',
            confirmVariant: 'danger'
        });
        if (confirmed) {
            setHolidayTypes(prev => prev.filter(item => item !== typeToDelete));
        }
    };

    const handleAddHolidayType = () => {
        if (newHolidayType.trim() && !holidayTypes.includes(newHolidayType.trim().toLowerCase().replace(/ /g, '_'))) {
            setHolidayTypes(prev => [...prev, newHolidayType.trim().toLowerCase().replace(/ /g, '_')].sort());
            setNewHolidayType('');
        }
    };
    
    const handleHolidayTypeKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddHolidayType();
        }
    }
    
    if (!config || !formData.diasFeriasOptions) {
        return <div>Carregando configurações...</div>;
    }

    const periodStatuses = formData.vacationStatuses?.filter(s => s.category === 'period' || s.category === 'both') || [];
    const fractionStatuses = formData.vacationStatuses?.filter(s => s.category === 'fraction' || s.category === 'both') || [];

    return (
        <div>
            <button onClick={() => setActiveView('cadastros')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 mb-6 group">
                <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                Voltar para Cadastros
            </button>
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
                <h3 className="text-xl font-bold text-blue-900 mb-1">Parâmetros e Regras do Sistema</h3>
                <p className="text-slate-600 mb-6">Ajuste as regras e parâmetros que governam o agendamento de férias.</p>

                <div className="border-b border-slate-200 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Regras Gerais
                        </button>
                        <button
                            onClick={() => setActiveTab('status')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'status' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Status de Férias
                        </button>
                    </nav>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {activeTab === 'general' && (
                        <>
                            <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                                <h4 className="text-lg font-bold text-slate-800 mb-4">Regras de Agendamento</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <label htmlFor="antecedenciaMinimaDias" className="block text-sm font-medium text-slate-700 mb-1">Antecedência Mínima Férias (dias)</label>
                                        <input type="number" id="antecedenciaMinimaDias" name="antecedenciaMinimaDias" value={formData.antecedenciaMinimaDias || ''} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3" />
                                    </div>
                                    <div>
                                        <label htmlFor="maxFracionamentos" className="block text-sm font-medium text-slate-700 mb-1">Máximo de Fracionamentos</label>
                                        <input type="number" id="maxFracionamentos" name="maxFracionamentos" value={formData.maxFracionamentos || ''} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3" />
                                    </div>
                                    <div>
                                        <label htmlFor="antecedenciaMinimaAbonoDias" className="block text-sm font-medium text-slate-700 mb-1">Antecedência Mínima Abono (dias)</label>
                                        <input type="number" id="antecedenciaMinimaAbonoDias" name="antecedenciaMinimaAbonoDias" value={formData.antecedenciaMinimaAbonoDias || ''} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3" />
                                    </div>
                                    <div>
                                        <label htmlFor="prazoLimiteConcessaoDias" className="block text-sm font-medium text-slate-700 mb-1">Prazo Limite de Concessão (dias)</label>
                                        <input type="number" id="prazoLimiteConcessaoDias" name="prazoLimiteConcessaoDias" value={formData.prazoLimiteConcessaoDias || ''} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3" />
                                    </div>
                                    <div>
                                        <label htmlFor="inicioAdiantamento13" className="block text-sm font-medium text-slate-700 mb-1">Início Adiantamento 13º (DD/MM)</label>
                                        <input type="text" placeholder="DD/MM" maxLength={5} id="inicioAdiantamento13" name="inicioAdiantamento13" value={formData.inicioAdiantamento13 || ''} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3" />
                                    </div>
                                    <div>
                                        <label htmlFor="fimAdiantamento13" className="block text-sm font-medium text-slate-700 mb-1">Fim Adiantamento 13º (DD/MM)</label>
                                        <input type="text" placeholder="DD/MM" maxLength={5} id="fimAdiantamento13" name="fimAdiantamento13" value={formData.fimAdiantamento13 || ''} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <OptionsManagement
                                    title="Opções de Dias de Férias"
                                    items={formData.diasFeriasOptions || []}
                                    onItemsChange={handleVacationOptionsChange}
                                    itemTypeLabel="férias"
                                />
                                <div className="p-6 bg-white rounded-lg border border-slate-200">
                                    <h4 className="text-lg font-bold text-slate-800 mb-4">Tipos de Feriado e Recesso</h4>
                                    <div className="flex items-center space-x-2 mb-4">
                                        <input
                                            type="text"
                                            value={newHolidayType}
                                            onChange={(e) => setNewHolidayType(e.target.value)}
                                            onKeyDown={handleHolidayTypeKeyDown}
                                            placeholder="Ex: feriado_municipal"
                                            className="bg-white flex-grow border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddHolidayType}
                                            className="px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600 disabled:bg-slate-400"
                                            disabled={!newHolidayType.trim()}
                                        >
                                            <PlusIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {holidayTypes.map((item) => (
                                            <li key={item} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-md border border-slate-200 text-sm">
                                                <span className="text-slate-700 capitalize">{item.replace(/_/g, ' ')}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteHolidayType(item)}
                                                    className="p-1.5 text-slate-400 hover:text-danger rounded-full hover:bg-red-100 transition"
                                                    title={`Excluir ${item}`}
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="p-6 bg-white rounded-lg border border-slate-200">
                                    <h4 className="text-lg font-bold text-slate-800 mb-2">Modo de Seleção de Dias de Férias</h4>
                                    <p className="text-sm text-slate-600 mb-4">Defina como os usuários selecionarão a quantidade de dias ao agendar férias.</p>
                                    <fieldset className="space-y-3">
                                        <div className="flex items-center">
                                            <input id="list-ferias" name="vacationDaysInputType" type="radio" value="list" checked={formData.vacationDaysInputType === 'list'} onChange={handleInputChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                                            <label htmlFor="list-ferias" className="ml-3 block text-sm font-medium text-slate-700">Lista Suspensa (dias pré-definidos)</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input id="input-ferias" name="vacationDaysInputType" type="radio" value="input" checked={formData.vacationDaysInputType === 'input'} onChange={handleInputChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                                            <label htmlFor="input-ferias" className="ml-3 block text-sm font-medium text-slate-700">Campo de Input (livre)</label>
                                        </div>
                                    </fieldset>
                                </div>
                                <div className="p-6 bg-white rounded-lg border border-slate-200">
                                    <h4 className="text-lg font-bold text-slate-800 mb-2">Modo de Cálculo de 1/3 de Abono de Férias</h4>
                                    <p className="text-sm text-slate-600 mb-4">Defina a base de cálculo para o abono pecuniário.</p>
                                    <fieldset className="space-y-3">
                                        <div className="flex items-center">
                                            <input id="initial_balance" name="abonoCalculationBasis" type="radio" value="initial_balance" checked={formData.abonoCalculationBasis === 'initial_balance'} onChange={handleInputChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                                            <label htmlFor="initial_balance" className="ml-3 block text-sm font-medium text-slate-700">Cálculo sobre dias de direito no vencimento do P.A.</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input id="current_balance" name="abonoCalculationBasis" type="radio" value="current_balance" checked={formData.abonoCalculationBasis === 'current_balance'} onChange={handleInputChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                                            <label htmlFor="current_balance" className="ml-3 block text-sm font-medium text-slate-700">Cálculo sobre saldo na programação das férias</label>
                                        </div>
                                    </fieldset>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'status' && (
                        <>
                            <StatusTable 
                                title="Status de Fluxo e Requerimento (Período)"
                                description="Status relacionados ao ciclo de vida do período aquisitivo e fluxo de aprovação (workflow)."
                                category="period"
                                statuses={periodStatuses}
                                onStatusChange={handleStatusChange}
                                onAddStatus={handleAddStatus}
                                onDeleteStatus={handleDeleteStatus}
                            />
                            <StatusTable 
                                title="Status de Execução (Fração)"
                                description="Status relacionados ao agendamento e gozo efetivo das datas de férias."
                                category="fraction"
                                statuses={fractionStatuses}
                                onStatusChange={handleStatusChange}
                                onAddStatus={handleAddStatus}
                                onDeleteStatus={handleDeleteStatus}
                            />
                        </>
                    )}
                                        
                    <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 mt-8">
                        <button type="button" onClick={() => setActiveView('cadastros')} className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                            Cancelar
                        </button>
                        <button type="submit" className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600">
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GeneralSettings;
