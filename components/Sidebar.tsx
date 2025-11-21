import React from 'react';
import { useAuth } from '../hooks/useAuth';
import HomeIcon from './icons/HomeIcon';
import LogoutIcon from './icons/LogoutIcon';
import CalendarIcon from './icons/CalendarIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import UsersIcon from './icons/UsersIcon';
import SettingsIcon from './icons/SettingsIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import ClipboardCheckIcon from './icons/ClipboardCheckIcon';
import DatabaseIcon from './icons/DatabaseIcon';
import DocumentChartBarIcon from './icons/DocumentChartBarIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';

interface SidebarProps {
    isOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    activeView: string;
    setActiveView: (view: string) => void;
}

const NavLink = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 text-left ${
            active 
            ? 'bg-slate-50 text-blue-600 font-semibold shadow-inner' 
            : 'text-blue-200 hover:bg-blue-600 hover:text-white'
        }`}
    >
        {icon}
        <span className="ml-3">{label}</span>
    </button>
);


const FeriasProLogo = () => (
    <img src="https://i.imgur.com/oERSQ15.png" alt="FériasPro Logo" className="h-9 w-auto" />
)

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setSidebarOpen, activeView, setActiveView }) => {
    const { user, logout } = useAuth();
    const lastUpdated = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
    
    const handleNavClick = (view: string) => {
        setActiveView(view);
        if (window.innerWidth < 768) { // md breakpoint
            setSidebarOpen(false);
        }
    };

    const isSuperUser = user?.role === 'admin' || user?.role === 'rh';
    const isManager = user?.role === 'manager';

    return (
        <aside className={`fixed inset-y-0 left-0 bg-primary text-blue-200 shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex w-64 flex-col transition-transform duration-300 ease-in-out z-30`}>
            
            <div className="h-28 flex items-center justify-center border-b border-blue-400/30 flex-shrink-0">
                <FeriasProLogo />
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto">
                <nav className="px-4 py-6 space-y-2">
                    <NavLink icon={<HomeIcon className="h-6 w-6" />} label="Início" active={activeView === 'inicio'} onClick={() => handleNavClick('inicio')} />
                    <NavLink icon={<CalendarIcon className="h-6 w-6" />} label="Programação de Férias" active={activeView === 'agendar'} onClick={() => handleNavClick('agendar')} />
                    {(isSuperUser || isManager) && (
                         <NavLink icon={<ClipboardCheckIcon className="h-6 w-6" />} label="Aprovações" active={activeView === 'aprovacoes'} onClick={() => handleNavClick('aprovacoes')} />
                    )}
                    <NavLink icon={<UsersIcon className="h-6 w-6" />} label="Calendário da Equipe" active={activeView === 'calendario'} onClick={() => handleNavClick('calendario')} />
                     {(isSuperUser || isManager) && (
                        <NavLink icon={<DocumentChartBarIcon className="h-6 w-6" />} label="Relatórios" active={activeView === 'relatorios'} onClick={() => handleNavClick('relatorios')} />
                    )}
                    <NavLink icon={<SettingsIcon className="h-6 w-6" />} label="Meu Perfil" active={activeView === 'perfil'} onClick={() => handleNavClick('perfil')} />
                    {isSuperUser && (
                         <>
                            <NavLink icon={<ShieldCheckIcon className="h-6 w-6" />} label="Perfis de Acesso" active={activeView === 'acessos'} onClick={() => handleNavClick('acessos')} />
                            <NavLink icon={<DatabaseIcon className="h-6 w-6" />} label="Cadastros" active={activeView === 'cadastros'} onClick={() => handleNavClick('cadastros')} />
                         </>
                    )}
                </nav>
            </div>

            {user?.role === 'admin' && (
                <div className="px-4 py-2 text-center text-xs text-blue-300/70">
                    Última atualização: <br/> {lastUpdated}
                </div>
            )}

            <div className="px-4 py-4 border-t border-blue-400/30">
                 <button 
                    onClick={logout}
                    className="w-full flex items-center px-4 py-3 rounded-lg text-blue-200 hover:bg-blue-600 hover:text-white transition-colors duration-200"
                >
                    <LogoutIcon className="h-6 w-6" />
                    <span className="ml-3">Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;