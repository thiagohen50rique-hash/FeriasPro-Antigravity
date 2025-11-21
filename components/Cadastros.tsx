

import React from 'react';
import UsersIcon from './icons/UsersIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import SettingsIcon from './icons/SettingsIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import SearchIcon from './icons/SearchIcon';
import BuildingLibraryIcon from './icons/BuildingLibraryIcon';
import AdjustmentsHorizontalIcon from './icons/AdjustmentsHorizontalIcon';
import PencilSquareIcon from './icons/PencilSquareIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import PencilIcon from './icons/PencilIcon';


interface RegistrationsProps {
    setActiveView: (view: string) => void;
}

const RegistrationCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onNewClick?: () => void;
    onConsultClick?: () => void;
    onManageClick?: () => void;
}> = ({ icon, title, description, onNewClick, onConsultClick, onManageClick }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 flex flex-col">
        <div className="flex items-start mb-4">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
                {icon}
            </div>
            <div>
                <h4 className="text-lg font-bold text-slate-800">{title}</h4>
                <p className="text-sm text-slate-600 mt-1">{description}</p>
            </div>
        </div>
        <div className="mt-auto pt-4 flex items-center justify-end space-x-3">
            {onManageClick && (
                <button
                    onClick={onManageClick}
                    className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition">
                    <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                    Gerenciar
                </button>
            )}
            {onConsultClick && (
                <button
                    onClick={onConsultClick}
                    className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition">
                    <SearchIcon className="h-4 w-4 mr-2" />
                    Consultar
                </button>
            )}
            {onNewClick && (
                <button
                    onClick={onNewClick}
                    className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary border border-transparent rounded-lg hover:bg-blue-600 transition">
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    Novo
                </button>
            )}
        </div>
    </div>
);

const Cadastros: React.FC<RegistrationsProps> = ({ setActiveView }) => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <RegistrationCard
                    icon={<UsersIcon className="h-6 w-6" />}
                    title="Colaboradores"
                    description="Adicione novos colaboradores ou consulte os existentes."
                    onNewClick={() => setActiveView('cadastro-colaborador')}
                    onConsultClick={() => setActiveView('consulta-colaboradores')}
                />
                <RegistrationCard
                    icon={<CalendarDaysIcon className="h-6 w-6" />}
                    title="Feriados e Recessos"
                    description="Cadastre feriados, recessos, pontos facultativos e regras de férias coletivas."
                    onNewClick={() => setActiveView('cadastro-feriado')}
                    onConsultClick={() => setActiveView('consulta-feriados')}
                />
                <RegistrationCard
                    icon={<BuildingLibraryIcon className="h-6 w-6" />}
                    title="Estrutura Organizacional"
                    description="Gerencie as áreas, gerências e unidades da empresa."
                    onManageClick={() => setActiveView('organizational-structure')}
                />
                <RegistrationCard
                    icon={<ClipboardDocumentListIcon className="h-6 w-6" />}
                    title="Períodos Aquisitivos"
                    description="Crie períodos em massa ou gerencie individualmente por colaborador."
                    onManageClick={() => setActiveView('gerenciar-periodos')}
                />
                <RegistrationCard
                    icon={<PencilSquareIcon className="h-6 w-6" />}
                    title="Lançamento Direto de Férias"
                    description="Lance férias diretamente para um colaborador, sem fluxo de aprovação."
                    onManageClick={() => setActiveView('lancamento-ferias')}
                />
                <RegistrationCard
                    icon={<PencilIcon className="h-6 w-6" />}
                    title="Gerenciamento de Férias"
                    description="Visualize e gerencie todos os registros de férias do sistema."
                    onManageClick={() => setActiveView('gerenciar-ferias')}
                />
                <RegistrationCard
                    icon={<SettingsIcon className="h-6 w-6" />}
                    title="Parâmetros do Sistema"
                    description="Ajuste as regras e parâmetros gerais do sistema de férias."
                    onManageClick={() => setActiveView('configuracoes')}
                />
            </div>
        </div>
    );
};

export default Cadastros;