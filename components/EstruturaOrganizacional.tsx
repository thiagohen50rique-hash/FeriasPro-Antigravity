
import React, { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';
import { 
    Funcionario, 
    UnidadeOrganizacional, 
    NivelHierarquico
} from '../tipos';
import { useModal } from '../hooks/useModal';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';

// --- Seção de Áreas ---
const AreasSection: React.FC<{
    localUnits: UnidadeOrganizacional[];
    setLocalUnits: Dispatch<SetStateAction<UnidadeOrganizacional[]>>;
    allEmployees: Funcionario[];
    setIsDirty: Dispatch<SetStateAction<boolean>>;
    setUpdatedEmployees: Dispatch<SetStateAction<Funcionario[] | null>>;
}> = ({ localUnits, setLocalUnits, allEmployees, setIsDirty, setUpdatedEmployees }) => {
    const [newItemName, setNewItemName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedItem, setEditedItem] = useState<UnidadeOrganizacional | null>(null);
    const modal = useModal();

    const areas = localUnits.filter(u => u.type === 'Área').sort((a, b) => a.name.localeCompare(b.name));

    const handleAdd = () => {
        if (!newItemName.trim()) return;
        const newUnit: UnidadeOrganizacional = {
            id: `area_${Date.now()}`,
            name: newItemName.trim(),
            type: 'Área',
            parentId: null,
        };
        setLocalUnits(prev => [...prev, newUnit]);
        setNewItemName('');
        setIsDirty(true);
    };
    
    const handleStartEdit = (unit: UnidadeOrganizacional) => {
        setEditingId(unit.id);
        setEditedItem({ ...unit });
    };

    const handleEditChange = (field: 'name' | 'parentId', value: string | null) => {
        if (editedItem) {
            setEditedItem(prev => (prev ? { ...prev, [field]: value } : null));
        }
    };

    const handleSaveEdit = () => {
        if (!editedItem || !editingId) return;

        const oldUnit = localUnits.find(u => u.id === editingId);
        if (oldUnit && oldUnit.name !== editedItem.name) {
            setUpdatedEmployees(prev => {
                const currentEmployees = prev || allEmployees;
                return currentEmployees.map(emp => emp.departamento === oldUnit.name ? { ...emp, departamento: editedItem.name } : emp);
            });
        }
        
        setLocalUnits(prev => prev.map(u => (u.id === editingId ? editedItem : u)));
        setEditingId(null);
        setEditedItem(null);
        setIsDirty(true);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditedItem(null);
    };

    const handleDelete = async (unitToDelete: UnidadeOrganizacional) => {
        if (localUnits.some(u => u.parentId === unitToDelete.id)) {
            modal.alert({ title: "Ação Bloqueada", message: `Não é possível excluir "${unitToDelete.name}" pois outras áreas são subordinadas a ela.`, confirmVariant: 'warning' });
            return;
        }
        if (allEmployees.some(emp => emp.departamento === unitToDelete.name)) {
            modal.alert({ title: "Ação Bloqueada", message: `Não é possível excluir "${unitToDelete.name}" pois há colaboradores associados a ela.`, confirmVariant: 'warning' });
            return;
        }
        const confirmed = await modal.confirm({ title: 'Confirmar Exclusão', message: `Tem certeza que deseja excluir a área "${unitToDelete.name}"?`, confirmVariant: 'danger' });
        if (confirmed) {
            setLocalUnits(prev => prev.filter(u => u.id !== unitToDelete.id));
            setIsDirty(true);
        }
    };

    return (
        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-lg font-bold text-slate-800 mb-4">Áreas</h4>
            <div className="flex items-center space-x-2 mb-4">
                <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Nova Área" className="bg-white flex-grow border-gray-300 rounded-lg shadow-sm" />
                <button onClick={handleAdd} disabled={!newItemName.trim()} className="p-2 text-white bg-primary rounded-lg hover:bg-blue-600 disabled:bg-slate-400"><PlusIcon className="h-5 w-5"/></button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {areas.map(unit => (
                    <div key={unit.id} className="p-3 bg-white rounded-md border border-slate-200 text-sm">
                        {editingId === unit.id && editedItem ? (
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-600">Nome da Área</label>
                                        <input type="text" value={editedItem.name} onChange={e => handleEditChange('name', e.target.value)} className="bg-white w-full mt-1 border-gray-300 rounded-lg shadow-sm text-sm" autoFocus />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600">Subordinado a</label>
                                        <select value={editedItem.parentId || ''} onChange={e => handleEditChange('parentId', e.target.value || null)} className="bg-white w-full mt-1 border-gray-300 rounded-lg shadow-sm text-sm">
                                            <option value="">Nenhuma</option>
                                            {areas.filter(p => p.id !== unit.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t">
                                    <button onClick={handleCancelEdit} className="p-1.5 text-danger hover:bg-danger/10 rounded-full" title="Cancelar"><XCircleIcon className="h-5 w-5"/></button>
                                    <button onClick={handleSaveEdit} className="p-1.5 text-success hover:bg-success/10 rounded-full" title="Salvar"><CheckCircleIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-800">{unit.name}</span>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => handleStartEdit(unit)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-100/60" title="Alterar"><PencilIcon className="h-4 w-4"/></button>
                                    <button onClick={() => handleDelete(unit)} className="p-1.5 text-slate-400 hover:text-danger rounded-full hover:bg-danger/10" title="Excluir"><TrashIcon className="h-4 w-4"/></button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Seção de Unidades (Localidades) ---
const UnitsSection: React.FC<{
    localUnits: string[];
    setLocalUnits: Dispatch<SetStateAction<string[]>>;
    allEmployees: Funcionario[];
    setIsDirty: Dispatch<SetStateAction<boolean>>;
    setUpdatedEmployees: Dispatch<SetStateAction<Funcionario[] | null>>;
}> = ({ localUnits, setLocalUnits, allEmployees, setIsDirty, setUpdatedEmployees }) => {
    const [newItem, setNewItem] = useState('');
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editedValue, setEditedValue] = useState('');
    const [error, setError] = useState('');
    const modal = useModal();

    const handleAddItem = () => {
        const trimmedItem = newItem.trim();
        if (!trimmedItem || localUnits.some(u => u.toLowerCase() === trimmedItem.toLowerCase())) return;
        setLocalUnits(prev => [...prev, trimmedItem].sort());
        setNewItem('');
        setIsDirty(true);
    };

    const handleStartEdit = (item: string) => {
        setEditingItem(item);
        setEditedValue(item);
    };

    const handleSaveEdit = () => {
        if (!editingItem) return;
        const trimmedValue = editedValue.trim();
        if (!trimmedValue || (trimmedValue.toLowerCase() !== editingItem.toLowerCase() && localUnits.some(u => u.toLowerCase() === trimmedValue.toLowerCase()))) {
            setError(`A unidade "${trimmedValue}" já existe.`);
            setTimeout(() => setError(''), 4000);
            return;
        }

        setUpdatedEmployees(prev => {
            const currentEmployees = prev || allEmployees;
            return currentEmployees.map(emp => emp.unidade === editingItem ? { ...emp, unidade: trimmedValue } : emp);
        });

        setLocalUnits(prev => prev.map(u => u === editingItem ? trimmedValue : u).sort());
        setEditingItem(null);
        setEditedValue('');
        setIsDirty(true);
    };

    const handleDeleteItem = async (itemToDelete: string) => {
        if (allEmployees.some(emp => emp.unidade === itemToDelete)) {
            modal.alert({ title: 'Ação Bloqueada', message: `Não é possível excluir a unidade "${itemToDelete}" pois está em uso.`, confirmVariant: 'warning' });
            return;
        }
        if (await modal.confirm({ title: 'Confirmar Exclusão', message: `Tem certeza que deseja excluir "${itemToDelete}"?`, confirmVariant: 'danger' })) {
            setLocalUnits(prev => prev.filter(item => item !== itemToDelete));
            setIsDirty(true);
        }
    };

    return (
        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-lg font-bold text-slate-800 mb-4">Unidades</h4>
            {error && <div className="mb-4 p-3 text-sm text-danger-dark bg-danger-light rounded-md border border-danger">{error}</div>}
            <div className="flex items-center space-x-2 mb-4">
                <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Nova Unidade" className="bg-white flex-grow border-gray-300 rounded-lg shadow-sm" />
                <button onClick={handleAddItem} disabled={!newItem.trim()} className="p-2 text-white bg-primary rounded-lg hover:bg-blue-600 disabled:bg-slate-400"><PlusIcon className="h-5 w-5"/></button>
            </div>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {localUnits.map(item => (
                    <li key={item} className="p-2.5 bg-white rounded-md border border-slate-200 text-sm">
                        {editingItem === item ? (
                            <div className="flex items-center space-x-2">
                                <input type="text" value={editedValue} onChange={e => setEditedValue(e.target.value)} className="bg-white flex-grow border-gray-300 rounded-lg shadow-sm text-sm p-1" autoFocus />
                                <button onClick={handleSaveEdit} className="p-1.5 text-success hover:bg-success/10 rounded-full" title="Salvar"><CheckCircleIcon className="h-5 w-5"/></button>
                                <button onClick={() => setEditingItem(null)} className="p-1.5 text-danger hover:bg-danger/10 rounded-full" title="Cancelar"><XCircleIcon className="h-5 w-5"/></button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <span className="text-slate-700">{item}</span>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => handleStartEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-100/60" title="Alterar"><PencilIcon className="h-4 w-4"/></button>
                                    <button onClick={() => handleDeleteItem(item)} className="p-1.5 text-slate-400 hover:text-danger rounded-full hover:bg-danger/10" title="Excluir"><TrashIcon className="h-4 w-4"/></button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

// --- Seção de Níveis Hierárquicos ---
const HierarchyLevelsSection: React.FC<{
    localLevels: NivelHierarquico[];
    setLocalLevels: Dispatch<SetStateAction<NivelHierarquico[]>>;
    allEmployees: Funcionario[];
    setIsDirty: Dispatch<SetStateAction<boolean>>;
}> = ({ localLevels, setLocalLevels, allEmployees, setIsDirty }) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editedValue, setEditedValue] = useState('');
    const [newItem, setNewItem] = useState({ level: '', description: '' });
    const modal = useModal();

    const handleAddItem = () => {
        const level = parseInt(newItem.level);
        const description = newItem.description.trim();
        if (isNaN(level) || !description || localLevels.some(l => l.level === level)) return;
        const newLevel: NivelHierarquico = { id: Date.now(), level, description };
        setLocalLevels(prev => [...prev, newLevel].sort((a, b) => a.level - b.level));
        setNewItem({ level: '', description: '' });
        setIsDirty(true);
    };

    const handleStartEdit = (level: NivelHierarquico) => {
        setEditingId(level.id);
        setEditedValue(level.description);
    };

    const handleSaveEdit = () => {
        if (editingId === null) return;
        setLocalLevels(prev => prev.map(l => l.id === editingId ? { ...l, description: editedValue.trim() } : l));
        setEditingId(null);
        setEditedValue('');
        setIsDirty(true);
    };

    const handleDeleteItem = async (levelToDelete: NivelHierarquico) => {
        if (allEmployees.some(emp => emp.nivelHierarquico === levelToDelete.level)) {
            modal.alert({ title: 'Ação Bloqueada', message: `Não é possível excluir o Nível ${levelToDelete.level} pois está em uso.`, confirmVariant: 'warning' });
            return;
        }
        if (await modal.confirm({ title: 'Confirmar Exclusão', message: `Tem certeza que deseja excluir o Nível ${levelToDelete.level}?`, confirmVariant: 'danger' })) {
            setLocalLevels(prev => prev.filter(l => l.id !== levelToDelete.id));
            setIsDirty(true);
        }
    };

    return (
        <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-lg font-bold text-slate-800 mb-4">Níveis Hierárquicos</h4>
            <p className="text-sm text-slate-500 mb-4">Estes são os níveis utilizados para determinar o fluxo de aprovação.</p>
            <ul className="space-y-2 mb-4">
                {localLevels.map(level => (
                    <li key={level.id} className="p-2.5 bg-white rounded-md border border-slate-200 text-sm">
                        {editingId === level.id ? (
                            <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-600 w-16 flex-shrink-0">{`Nível ${level.level}:`}</span>
                                <input type="text" value={editedValue} onChange={e => setEditedValue(e.target.value)} className="bg-white flex-grow border-gray-300 rounded-lg shadow-sm text-sm p-1" autoFocus />
                                <button onClick={handleSaveEdit} className="p-1.5 text-success hover:bg-success/10 rounded-full" title="Salvar"><CheckCircleIcon className="h-5 w-5"/></button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 text-danger hover:bg-danger/10 rounded-full" title="Cancelar"><XCircleIcon className="h-5 w-5"/></button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <span className="font-bold text-slate-600 w-16 flex-shrink-0">{`Nível ${level.level}:`}</span>
                                    <span className="text-slate-800">{level.description}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => handleStartEdit(level)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-100/60" title="Alterar"><PencilIcon className="h-4 w-4"/></button>
                                    <button onClick={() => handleDeleteItem(level)} className="p-1.5 text-slate-400 hover:text-danger rounded-full hover:bg-danger/10" title="Excluir"><TrashIcon className="h-4 w-4"/></button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            <div className="flex items-center space-x-2 pt-4 border-t">
                <input type="number" value={newItem.level} onChange={e => setNewItem(p => ({ ...p, level: e.target.value }))} placeholder="Nível" className="bg-white w-20 border-gray-300 rounded-lg shadow-sm" />
                <input type="text" value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} placeholder="Descrição do Nível" className="bg-white flex-grow border-gray-300 rounded-lg shadow-sm" />
                <button onClick={handleAddItem} disabled={!newItem.level || !newItem.description.trim()} className="p-2 text-white bg-primary rounded-lg hover:bg-blue-600 disabled:bg-slate-400"><PlusIcon className="h-5 w-5"/></button>
            </div>
        </div>
    );
};

// --- Componente Principal ---
const EstruturaOrganizacional: React.FC<{ setActiveView: (view: string) => void }> = ({ setActiveView }) => {
    const { orgUnits, updateOrgUnits, allEmployees, updateEmployee, companyUnits, setCompanyUnits, hierarchyLevels, updateHierarchyLevels } = useAuth();
    const modal = useModal();

    const [localOrgUnits, setLocalOrgUnits] = useState<UnidadeOrganizacional[]>([]);
    const [localCompanyUnits, setLocalCompanyUnits] = useState<string[]>([]);
    const [localHierarchyLevels, setLocalHierarchyLevels] = useState<NivelHierarquico[]>([]);
    const [updatedEmployees, setUpdatedEmployees] = useState<Funcionario[] | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setLocalOrgUnits(JSON.parse(JSON.stringify(orgUnits)));
        setLocalCompanyUnits([...companyUnits]);
        setLocalHierarchyLevels(JSON.parse(JSON.stringify(hierarchyLevels)));
        setIsDirty(false);
    }, [orgUnits, companyUnits, hierarchyLevels]);

    const handleSaveChanges = () => {
        updateOrgUnits(localOrgUnits, updatedEmployees || undefined);
        setCompanyUnits(localCompanyUnits);
        updateHierarchyLevels(localHierarchyLevels);

        if (updatedEmployees) {
            // This assumes the context logic can handle multiple updates if needed.
            // For this app, updateOrgUnits handles passing the bulk employee update.
        }
        setIsDirty(false);
        setUpdatedEmployees(null);
        modal.alert({ title: "Sucesso", message: "Estrutura organizacional salva com sucesso.", confirmVariant: 'success' });
    };

    const handleCancelChanges = () => {
        setLocalOrgUnits(JSON.parse(JSON.stringify(orgUnits)));
        setLocalCompanyUnits([...companyUnits]);
        setLocalHierarchyLevels(JSON.parse(JSON.stringify(hierarchyLevels)));
        setUpdatedEmployees(null);
        setIsDirty(false);
    };

    return (
        <div>
            <button onClick={() => setActiveView('cadastros')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 mb-6 group">
                <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                Voltar para Cadastros
            </button>
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
                <h3 className="text-xl font-bold text-blue-900 mb-2">Estrutura Organizacional</h3>
                <p className="text-slate-600 mb-8">Gerencie a hierarquia, gestores e departamentos da empresa.</p>
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AreasSection 
                            localUnits={localOrgUnits}
                            setLocalUnits={setLocalOrgUnits}
                            allEmployees={allEmployees}
                            setIsDirty={setIsDirty}
                            setUpdatedEmployees={setUpdatedEmployees}
                        />
                        <UnitsSection
                            localUnits={localCompanyUnits}
                            setLocalUnits={setLocalCompanyUnits}
                            allEmployees={allEmployees}
                            setIsDirty={setIsDirty}
                            setUpdatedEmployees={setUpdatedEmployees}
                        />
                    </div>
                    <div>
                        <HierarchyLevelsSection 
                            localLevels={localHierarchyLevels}
                            setLocalLevels={setLocalHierarchyLevels}
                            allEmployees={allEmployees}
                            setIsDirty={setIsDirty}
                        />
                    </div>
                </div>
                {isDirty && (
                    <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-slate-200">
                        <button onClick={handleCancelChanges} className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                            Cancelar
                        </button>
                        <button onClick={handleSaveChanges} className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600">
                            Salvar Alterações
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EstruturaOrganizacional;
