
import React, { useState } from 'react';
import { PapelUsuario } from '../tipos';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/dateUtils';
import { getRoleText } from '../constants';
import { useModal } from '../hooks/useModal';

const DataField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        <div className="w-full bg-slate-100/70 p-3 rounded-lg text-slate-800 text-base border border-slate-200">
            {value}
        </div>
    </div>
);

const Perfil: React.FC = () => {
    const { user, allEmployees, updateEmployee } = useAuth();
    const modal = useModal();
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');

    const employee = allEmployees.find(e => e.id === user?.id);

    if (!employee) {
        return <div className="text-center p-8">Carregando dados do perfil...</div>;
    }

    const manager = allEmployees.find(e => e.id === employee.gestor);

    const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChangeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (passwordData.currentPassword !== employee.cpf) {
            setPasswordError('A senha atual está incorreta.');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('As novas senhas não coincidem.');
            return;
        }
        if (passwordData.newPassword === passwordData.currentPassword) {
            setPasswordError('A nova senha não pode ser igual à senha atual.');
            return;
        }

        const updatedEmployee = { ...employee, cpf: passwordData.newPassword };
        updateEmployee(updatedEmployee);

        modal.alert({
            title: 'Sucesso!',
            message: 'Sua senha foi alterada com sucesso!',
            confirmVariant: 'success',
        });
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-slate-200">
            <h3 className="text-xl font-bold text-blue-900 mb-8">Meus Dados</h3>

            <div className="space-y-8">
                <div>
                    <h4 className="font-semibold text-slate-700 text-lg mb-4 pb-2 border-b">Informações Funcionais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <DataField label="Nome Completo" value={employee.nome} />
                        <DataField label="Matrícula" value={employee.matricula} />
                        <DataField label="Data de Admissão" value={formatDate(employee.dataAdmissao)} />
                        <DataField label="Cargo" value={employee.cargo} />
                        <DataField label="Área" value={employee.departamento} />

                        <DataField label="Gestor Imediato" value={manager ? manager.nome : 'N/A'} />
                        <DataField label="Unidade" value={employee.unidade} />
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-700 text-lg mb-4 pb-2 border-b">Segurança e Acesso</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <DataField label="Perfil de Acesso" value={getRoleText(employee.role)} />
                        <DataField label="E-mail (Login)" value={employee.email} />
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Senha</label>
                            {!showPasswordForm ? (
                                <div className="flex items-center justify-between w-full bg-slate-100/70 p-3 rounded-lg border border-slate-200">
                                    <span className="text-slate-800 text-base font-mono tracking-wider">•••••••••••</span>
                                    <button onClick={() => { setShowPasswordForm(true); setPasswordError(''); }} className="font-semibold text-sm text-primary hover:underline">
                                        Alterar
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handlePasswordChangeSubmit} className="p-4 border border-slate-300 rounded-lg mt-1 space-y-4 bg-slate-50">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                                        <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                                        <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                                        <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordInputChange} required className="bg-white w-full border-gray-300 rounded-lg shadow-sm" />
                                    </div>
                                    {passwordError && <p className="text-sm text-danger">{passwordError}</p>}
                                    <div className="flex justify-end space-x-3">
                                        <button type="button" onClick={() => setShowPasswordForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary border border-transparent rounded-lg hover:bg-blue-600">Salvar Senha</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Perfil;