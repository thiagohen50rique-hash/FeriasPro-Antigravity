import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PeriodoAquisitivo, Funcionario } from '../tipos';
import PainelDeFerias from './PainelDeFerias';
import Sidebar from './Sidebar';
import Header from './Header';
import MenuIcon from './icons/MenuIcon';
import AgendarFerias from './AgendarFerias';
import CalendarioEquipe from './CalendarioEquipe';
import Perfil from './Perfil';
import PerfisDeAcesso from './PerfisDeAcesso';
import SolicitacoesDeAprovacao from './SolicitacoesDeAprovacao';
import Cadastros from './Cadastros';
import CadastroDeFuncionario from './CadastroDeFuncionario';
import CadastroDeFeriado from './CadastroDeFeriado';
import ConfiguracoesGerais from './ConfiguracoesGerais';
import ListaDeFuncionarios from './ListaDeFuncionarios';
import ListaDeFeriados from './ListaDeFeriados';
import GerenciarPeriodosAquisitivos from './GerenciarPeriodosAquisitivos';
import EstruturaOrganizacional from './EstruturaOrganizacional';
import LancamentoDeFerias from './LancamentoDeFerias';
import Relatorios from './Relatorios';
import VisualizadorRelatorios from './VisualizadorRelatorios';
import GerenciarFerias from './GerenciarFerias';
import { getLogoDataUrl } from '../services/logoService';
import EscalaEquipe from './EscalaEquipe';
import GerenciarAfastamentos from './GerenciarAfastamentos';

const viewTitles: { [key: string]: string } = {
    inicio: 'Início',
    agendar: 'Programação de Férias',
    calendario: 'Calendário da Equipe',
    perfil: 'Meu Perfil',
    acessos: 'Perfis de Acesso',
    aprovacoes: 'Aprovações',
    cadastros: 'Cadastros',
    'cadastro-colaborador': 'Cadastro de Colaborador',
    'cadastro-feriado': 'Cadastro de Feriado',
    configuracoes: 'Parâmetros do Sistema',
    'consulta-colaboradores': 'Consulta de Colaboradores',
    'consulta-feriados': 'Consulta de Feriados',
    'gerenciar-periodos': 'Gerenciar Períodos Aquisitivos',
    'organizational-structure': 'Estrutura Organizacional',
    'lancamento-ferias': 'Lançamento Direto de Férias',
    'gerenciar-ferias': 'Gerenciamento de Férias',
    relatorios: 'Relatórios',
    'visualizar-relatorio': 'Visualizador de Relatório',
    'programacao-equipe': 'Programação da Equipe',
    afastamentos: 'Gerenciar Afastamentos',
};


const Dashboard: React.FC = () => {
    const { user, allEmployees } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState('inicio');
    const [selectedPeriodForScheduling, setSelectedPeriodForScheduling] = useState<string | null>(null);
    const [selectedVacationIdToEdit, setSelectedVacationIdToEdit] = useState<string | null>(null);
    const [selectedHolidayIdToEdit, setSelectedHolidayIdToEdit] = useState<string | null>(null);
    const [selectedEmployeeIdToEdit, setSelectedEmployeeIdToEdit] = useState<number | null>(null);
    const [selectedReportType, setSelectedReportType] = useState<string | null>(null);

    // Pre-warm the logo cache when the dashboard loads
    useEffect(() => {
        getLogoDataUrl();
    }, []);

    const employeeData = allEmployees.find(e => e.id === user?.id);

    if (!employeeData) return null;

    const navigateToSchedule = (periodId: string) => {
        setSelectedPeriodForScheduling(periodId);
        setActiveView('agendar');
    };

    const handleEditHoliday = (holidayId: string) => {
        setSelectedHolidayIdToEdit(holidayId);
        setActiveView('cadastro-feriado');
    };

    const handleEditEmployee = (employeeId: number) => {
        setSelectedEmployeeIdToEdit(employeeId);
        setActiveView('cadastro-colaborador');
    };

    const handleViewReport = (reportType: string) => {
        setSelectedReportType(reportType);
        setActiveView('visualizar-relatorio');
    };

    const title = viewTitles[activeView] || 'Início';

    const renderContent = () => {
        switch (activeView) {
            case 'inicio':
                return <PainelDeFerias
                    setActiveView={setActiveView}
                    navigateToSchedule={navigateToSchedule}
                />;
            case 'agendar':
                return <AgendarFerias
                    initialPeriodId={selectedPeriodForScheduling ? Number(selectedPeriodForScheduling) : null}
                    resetInitialPeriod={() => setSelectedPeriodForScheduling(null)}
                    initialVacationId={selectedVacationIdToEdit ? Number(selectedVacationIdToEdit) : null}
                    resetInitialVacation={() => setSelectedVacationIdToEdit(null)}
                />;
            case 'calendario':
                return <CalendarioEquipe />;
            case 'programacao-equipe':
                return <EscalaEquipe />;
            case 'perfil':
                return <Perfil />;
            case 'acessos':
                return <PerfisDeAcesso />;
            case 'aprovacoes':
                return <SolicitacoesDeAprovacao />;
            case 'cadastros':
                return <Cadastros setActiveView={setActiveView} />;
            case 'cadastro-colaborador':
                return <CadastroDeFuncionario
                    setActiveView={setActiveView}
                    employeeToEditId={selectedEmployeeIdToEdit}
                    resetEmployeeToEdit={() => setSelectedEmployeeIdToEdit(null)}
                />;
            case 'cadastro-feriado':
                return <CadastroDeFeriado
                    setActiveView={setActiveView}
                    holidayToEditId={selectedHolidayIdToEdit}
                    resetHolidayToEdit={() => setSelectedHolidayIdToEdit(null)}
                />;
            case 'configuracoes':
                return <ConfiguracoesGerais setActiveView={setActiveView} />;
            case 'consulta-colaboradores':
                return <ListaDeFuncionarios
                    setActiveView={setActiveView}
                    onEditEmployee={handleEditEmployee}
                />;
            case 'consulta-feriados':
                return <ListaDeFeriados
                    setActiveView={setActiveView}
                    onEditHoliday={handleEditHoliday}
                />;
            case 'gerenciar-periodos':
                return <GerenciarPeriodosAquisitivos setActiveView={setActiveView} />;
            case 'organizational-structure':
                return <EstruturaOrganizacional setActiveView={setActiveView} />;
            case 'lancamento-ferias':
                return <LancamentoDeFerias setActiveView={setActiveView} />;
            case 'gerenciar-ferias':
                return <GerenciarFerias setActiveView={setActiveView} />;
            case 'relatorios':
                return <Relatorios onSelectReport={handleViewReport} />;
            case 'visualizar-relatorio':
                return <VisualizadorRelatorios reportType={selectedReportType} setActiveView={setActiveView} />;
            case 'afastamentos':
                return <GerenciarAfastamentos />;
            default:
                return <PainelDeFerias
                    setActiveView={setActiveView}
                    navigateToSchedule={navigateToSchedule}
                />;
        }
    };


    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar
                isOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeView={activeView}
                setActiveView={setActiveView}
            />
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"></div>}

            <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
                <header className="bg-white shadow-sm border-b border-slate-300 px-6 md:px-8 flex items-center h-20 flex-shrink-0">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600 hover:text-gray-800 mr-4">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <Header title={title} setActiveView={setActiveView} />
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;