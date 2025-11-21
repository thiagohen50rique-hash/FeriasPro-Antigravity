
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
    NovoFeriadoEmpresa, 
    FeriadoEmpresa, 
    NovaRegraFeriasColetivas, 
    RegraFeriasColetivas, 
    Funcionario 
} from '../tipos';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { useModal } from '../hooks/useModal';

interface CadastroDeFeriadoProps {
    setActiveView: (view: string) => void;
    holidayToEditId?: string | null;
    resetHolidayToEdit?: () => void;
}

const FormularioFeriado: React.FC<CadastroDeFeriadoProps> = ({ setActiveView, holidayToEditId, resetHolidayToEdit }) => {
    const { addHoliday, allEmployees, holidays, updateHoliday, holidayTypes } = useAuth();
    const modal = useModal();
    const [formData, setFormData] = useState<Partial<FeriadoEmpresa>>({
        descricao: '',
        data: '',
        tipo: 'feriado',
        unidade: '',
    });
    const [error, setError] = useState('');

    const isEditing = useMemo(() => !!holidayToEditId, [holidayToEditId]);

    useEffect(() => {
        if (isEditing) {
            const holidayToEdit = holidays.find(h => h.id === holidayToEditId);
            if (holidayToEdit) {
                setFormData(holidayToEdit);
            }
        } else {
            setFormData({
                descricao: '',
                data: '',
                tipo: 'feriado',
                unidade: '',
            });
        }
    }, [holidayToEditId, holidays, isEditing]);

    const uniqueUnidades = useMemo(() =>
        [...new Set(allEmployees.map(e => e.unidade))].sort(),
        [allEmployees]);

    const holidayTypeTextMap = {
        feriado: 'Feriado',
        ponto_facultativo: 'Ponto Facultativo',
        recesso: 'Recesso',
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBack = () => {
        resetHolidayToEdit?.();
        setActiveView(isEditing ? 'consulta-feriados' : 'cadastros');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.descricao || !formData.data || !formData.tipo) {
            setError("Os campos Descrição, Data e Tipo são obrigatórios.");
            return;
        }

        const year = parseInt(formData.data.split('-')[0], 10);
        if (isNaN(year)) {
            setError("Data inválida.");
            return;
        }

        if (isEditing) {
            const holidayData: FeriadoEmpresa = {
                id: formData.id!,
                descricao: formData.descricao,
                data: formData.data,
                tipo: formData.tipo as any,
                ano: year,
                unidade: formData.unidade || undefined,
            };
            updateHoliday(holidayData);
            modal.alert({ title: 'Sucesso', message: 'Feriado alterado com sucesso!', confirmVariant: 'success' });
        } else {
            const holidayData: NovoFeriadoEmpresa = {
                descricao: formData.descricao,
                data: formData.data,
                tipo: formData.tipo as any,
                ano: year,
                unidade: formData.unidade || undefined,
            };
            addHoliday(holidayData);
            modal.alert({ title: 'Sucesso', message: 'Feriado cadastrado com sucesso!', confirmVariant: 'success' });
        }

        resetHolidayToEdit?.();
        setActiveView('consulta-feriados');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-blue-900 mb-1">{isEditing ? 'Alterar Feriado ou Recesso' : 'Cadastro de Feriado ou Recesso'}</h3>
            <p className="text-slate-600 mb-8">{isEditing ? 'Altere os dados do feriado abaixo.' : 'Adicione um novo feriado, ponto facultativo ou recesso ao calendário.'}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="descricao" className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                    <input type="text" id="descricao" name="descricao" value={formData.descricao} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="data" className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                    <input type="date" id="data" name="data" value={formData.data} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="tipo" className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <select id="tipo" name="tipo" value={formData.tipo} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500">
                        {holidayTypes.map(type => (
                            <option key={type} value={type}>{(holidayTypeTextMap as any)[type] || type.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="unidade" className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                    <select id="unidade" name="unidade" value={formData.unidade} onChange={handleInputChange} className="bg-white w-full border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Geral (todas as unidades)</option>
                        {uniqueUnidades.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                        ))}
                    </select>
                </div>
            </div>
            {error && <p className="text-sm text-center text-danger bg-danger/10 p-3 rounded-md border border-danger/20 mt-4">{error}</p>}
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                <button type="button" onClick={handleBack} className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600">
                    {isEditing ? 'Salvar Alterações' : 'Salvar Cadastro'}
                </button>
            </div>
        </form>
    );
};

const FormularioFeriasColetivas: React.FC<Omit<CadastroDeFeriadoProps, 'holidayToEditId' | 'resetHolidayToEdit'>> = ({ setActiveView }) => {
    const { addCollectiveVacationRule, allEmployees, companyAreas, companyManagements, companyUnits } = useAuth();
    const modal = useModal();
    const [formData, setFormData] = useState<Partial<NovaRegraFeriasColetivas>>({
        descricao: '',
        inicio: '',
        fim: '',
        unidade: '',
        area: '',
        departamento: '',
        colaboradorIds: []
    });
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => parseInt(option.value, 10));
        setFormData(prev => ({ ...prev, colaboradorIds: selectedIds }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.descricao || !formData.inicio || !formData.fim) {
            setError("Descrição, data de início e data de fim são obrigatórios.");
            return;
        }

        if (new Date(formData.inicio) >= new Date(formData.fim)) {
            setError("A data de início deve ser anterior à data de fim.");
            return;
        }
        
        const ruleData: NovaRegraFeriasColetivas = {
            descricao: formData.descricao,
            inicio: formData.inicio,
            fim: formData.fim,
            unidade: formData.unidade || undefined,
            area: formData.area || undefined,
            departamento: formData.departamento || undefined,
            colaboradorIds: formData.colaboradorIds || undefined,
        };

        addCollectiveVacationRule(ruleData);
        modal.alert({ title: 'Sucesso', message: 'Regra de férias coletivas cadastrada com sucesso!', confirmVariant: 'success' });
        setActiveView('consulta-feriados');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-blue-900 mb-1">Cadastro de Férias Coletivas</h3>
            <p className="text-slate-600 mb-8">Defina um período de férias coletivas e os filtros para os colaboradores afetados.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3">
                    <label htmlFor="cv-descricao" className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                    <input type="text" id="cv-descricao" name="descricao" value={formData.descricao} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm" />
                </div>
                <div>
                    <label htmlFor="cv-inicio" className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
                    <input type="date" id="cv-inicio" name="inicio" value={formData.inicio} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm" />
                </div>
                <div>
                    <label htmlFor="cv-fim" className="block text-sm font-medium text-slate-700 mb-1">Data de Fim</label>
                    <input type="date" id="cv-fim" name="fim" value={formData.fim} onChange={handleInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm" />
                </div>
            </div>
            
            <div className="pt-6 border-t">
                <h4 className="font-semibold text-slate-700">Filtros de Aplicação (Opcional)</h4>
                <p className="text-sm text-slate-500 mb-4">Se nenhum filtro for aplicado, a regra valerá para todos os colaboradores.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <div>
                        <label htmlFor="cv-unidade" className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                        <select id="cv-unidade" name="unidade" value={formData.unidade} onChange={handleInputChange} className="bg-white w-full border-gray-300 rounded-lg shadow-sm">
                           <option value="">Todas</option>
                           {companyUnits.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="cv-departamento" className="block text-sm font-medium text-slate-700 mb-1">Área</label>
                        <select id="cv-departamento" name="departamento" value={formData.departamento} onChange={handleInputChange} className="bg-white w-full border-gray-300 rounded-lg shadow-sm">
                           <option value="">Todas</option>
                           {companyAreas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="cv-area" className="block text-sm font-medium text-slate-700 mb-1">Gerência</label>
                        <select id="cv-area" name="area" value={formData.area} onChange={handleInputChange} className="bg-white w-full border-gray-300 rounded-lg shadow-sm">
                           <option value="">Todas</option>
                           {companyManagements.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-4">
                        <label htmlFor="cv-colaboradores" className="block text-sm font-medium text-slate-700 mb-1">Colaboradores Específicos</label>
                        <select id="cv-colaboradores" name="colaboradorIds" multiple value={formData.colaboradorIds?.map(String)} onChange={handleMultiSelectChange} className="bg-white w-full h-40 border-gray-300 rounded-lg shadow-sm">
                           {allEmployees.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {error && <p className="text-sm text-center text-danger bg-danger/10 p-3 rounded-md border border-danger/20 mt-4">{error}</p>}

            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                <button type="button" onClick={() => setActiveView('cadastros')} className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600">
                    Salvar Regra
                </button>
            </div>
        </form>
    );
};


const CadastroDeFeriado: React.FC<CadastroDeFeriadoProps> = (props) => {
    const { setActiveView } = props;
    const [activeTab, setActiveTab] = useState<'holiday' | 'collective'>('holiday');

    return (
        <div>
            <button onClick={() => setActiveView('cadastros')} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 mb-6 group">
                <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                Voltar para Cadastros
            </button>
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
                <div className="border-b border-slate-200 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setActiveTab('holiday')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'holiday' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Feriado ou Recesso
                        </button>
                        <button
                            onClick={() => setActiveTab('collective')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'collective' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            Férias Coletivas
                        </button>
                    </nav>
                </div>

                {activeTab === 'holiday' ? <FormularioFeriado {...props} /> : <FormularioFeriasColetivas setActiveView={props.setActiveView} />}
            </div>
        </div>
    );
};

export default CadastroDeFeriado;
