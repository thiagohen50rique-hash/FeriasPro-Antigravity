
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PapelUsuario, Funcionario, NovosDadosFuncionario } from '../tipos';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { useModal } from '../hooks/useModal';
import { getRoleText } from '../constants';

interface CadastroDeFuncionarioProps {
    setActiveView: (view: string) => void;
    employeeToEditId?: number | null;
    resetEmployeeToEdit?: () => void;
}

const InputField: React.FC<{ label: string; name: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; disabled?: boolean; }> =
    ({ label, name, type = 'text', value, onChange, required, disabled = false }) => (
        <div className="group">
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1 group-focus-within:text-primary transition-colors">{label}</label>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                disabled={disabled}
                className="bg-slate-50 hover:bg-white focus:bg-white w-full border border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 ease-in-out disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed placeholder-gray-400"
            />
        </div>
    );

const SelectField: React.FC<{ label: string; name: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: (string | { value: string | number; text: string })[]; required?: boolean; }> =
    ({ label, name, value, onChange, options, required }) => (
        <div className="group">
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1 group-focus-within:text-primary transition-colors">{label}</label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="bg-slate-50 hover:bg-white focus:bg-white w-full border border-gray-300 rounded-lg shadow-sm text-base py-2.5 px-3 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 ease-in-out"
            >
                <option value="">Selecione...</option>
                {options.map(opt => {
                    const val = typeof opt === 'string' ? opt : opt.value;
                    const text = typeof opt === 'string' ? opt : opt.text;
                    return <option key={val} value={val}>{text}</option>;
                })}
            </select>
        </div>
    );

const CadastroDeFuncionario: React.FC<CadastroDeFuncionarioProps> = ({ setActiveView, employeeToEditId, resetEmployeeToEdit }) => {
    const { addEmployee, allEmployees, updateEmployee, companyAreas, companyUnits, hierarchyLevels } = useAuth();
    const modal = useModal();
    const [formData, setFormData] = useState<Omit<Funcionario, 'id' | 'periodosAquisitivos' | 'afastamentos'>>({
        nome: '',
        matricula: '',
        dataAdmissao: '',
        cpf: '',
        email: '',
        cargo: '',
        departamento: '', // Área
        unidade: '',
        gestor: null,
        role: 'user',
        status: 'active',
        nivelHierarquico: 1,
    });
    const [error, setError] = useState('');

    const isEditing = useMemo(() => !!employeeToEditId, [employeeToEditId]);
    const employeeToEdit = useMemo(() =>
        isEditing ? allEmployees.find(e => e.id === employeeToEditId) : null,
        [isEditing, employeeToEditId, allEmployees]);

    useEffect(() => {
        if (isEditing && employeeToEdit) {
            const { id, periodosAquisitivos, afastamentos, ...editableData } = employeeToEdit;
            setFormData(editableData);
        } else {
            setFormData({
                nome: '', matricula: '', dataAdmissao: '', cpf: '', email: '',
                cargo: '', departamento: '', unidade: '',
                gestor: null, role: 'user', status: 'active', nivelHierarquico: 1,
            });
        }
    }, [isEditing, employeeToEdit]);

    const managers = useMemo(() =>
        allEmployees
            .filter(e => e.status === 'active' && (!isEditing || e.id !== employeeToEditId))
            .map(e => ({ value: e.id, text: e.nome }))
            .sort((a, b) => a.text.localeCompare(b.text)),
        [allEmployees, isEditing, employeeToEditId]);

    const roleOptions: { value: PapelUsuario; text: string }[] = useMemo(() =>
        (['user', 'manager', 'admin', 'rh'] as PapelUsuario[]).map(role => ({
            value: role,
            text: getRoleText(role),
        })), []);

    const statusOptions: { value: 'active' | 'inactive', text: string }[] = [
        { value: 'active', text: 'Ativo' },
        { value: 'inactive', text: 'Inativo' },
    ];

    const hierarchyLevelOptions = useMemo(() =>
        hierarchyLevels.map(h => ({ value: h.level, text: `${h.level} - ${h.description}` })),
        [hierarchyLevels]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'nivelHierarquico' || name === 'gestor') ? (value ? parseInt(value, 10) : null) : value
        }));
    };

    const handleBack = () => {
        resetEmployeeToEdit?.();
        setActiveView(isEditing ? 'consulta-colaboradores' : 'cadastros');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const requiredFields: Array<keyof typeof formData> = ['nome', 'matricula', 'dataAdmissao', 'cpf', 'email', 'cargo', 'departamento', 'unidade', 'role', 'nivelHierarquico'];
        for (const key of requiredFields) {
            if (!formData[key as keyof typeof formData]) {
                setError(`O campo "${String(key)}" é obrigatório.`);
                return;
            }
        }

        if (isEditing && employeeToEditId === formData.gestor) {
            setError('Um colaborador não pode ser seu próprio gestor.');
            return;
        }

        if (isEditing && employeeToEdit) {
            const updatedEmployee: Funcionario = {
                ...employeeToEdit,
                ...formData,

            };
            updateEmployee(updatedEmployee);
            modal.alert({ title: 'Sucesso', message: 'Dados do colaborador alterados com sucesso!', confirmVariant: 'success' });
        } else {
            addEmployee(formData as NovosDadosFuncionario);
            modal.alert({ title: 'Sucesso', message: 'Colaborador cadastrado com sucesso!', confirmVariant: 'success' });
        }

        resetEmployeeToEdit?.();
        setActiveView('consulta-colaboradores');
    };

    return (
        <div>
            <button onClick={handleBack} className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800 mb-6 group">
                <ArrowLeftIcon className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                {isEditing ? 'Voltar para Consulta' : 'Voltar para Cadastros'}
            </button>
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
                <h3 className="text-xl font-bold text-blue-900 mb-1">{isEditing ? 'Alterar Colaborador' : 'Cadastro de Colaborador'}</h3>
                <p className="text-slate-600 mb-8">{isEditing ? 'Altere os dados do colaborador abaixo.' : 'Preencha os dados para cadastrar um novo colaborador.'}</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputField label="Nome Completo" name="nome" value={formData.nome} onChange={handleInputChange} required />
                        <InputField label="Matrícula" name="matricula" value={formData.matricula} onChange={handleInputChange} required />
                        <InputField label="Data de Admissão" name="dataAdmissao" type="date" value={formData.dataAdmissao} onChange={handleInputChange} required />
                        <InputField label="E-mail (Login)" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                        <InputField label="Senha" name="cpf" type="password" value={formData.cpf} onChange={handleInputChange} required />
                        <InputField label="Cargo" name="cargo" value={formData.cargo} onChange={handleInputChange} required />
                        <SelectField label="Nível Hierárquico" name="nivelHierarquico" value={formData.nivelHierarquico} onChange={handleInputChange} options={hierarchyLevelOptions} required />
                        <SelectField label="Área" name="departamento" value={formData.departamento} onChange={handleInputChange} options={companyAreas} required />
                        <SelectField label="Unidade" name="unidade" value={formData.unidade} onChange={handleInputChange} options={companyUnits} required />
                        <SelectField label="Gestor Imediato" name="gestor" value={formData.gestor || ''} onChange={handleInputChange} options={managers} />
                        <SelectField label="Perfil de Acesso" name="role" value={formData.role} onChange={handleInputChange} options={roleOptions} required />
                        <SelectField label="Status" name="status" value={formData.status} onChange={handleInputChange} options={statusOptions} required />
                    </div>
                    {error && <p className="text-sm text-center text-danger bg-danger/10 p-3 rounded-md border border-danger/20 mt-4">{error}</p>}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                        <button type="button" onClick={handleBack} className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                            Cancelar
                        </button>
                        <button type="submit" className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-600 shadow-sm">
                            {isEditing ? 'Salvar Alterações' : 'Salvar Cadastro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CadastroDeFuncionario;
