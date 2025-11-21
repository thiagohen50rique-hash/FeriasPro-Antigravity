

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import UserIcon from './icons/UserIcon';
import PlusIcon from './icons/PlusIcon';
import LogoutIcon from './icons/LogoutIcon';
import BellIcon from './icons/BellIcon';

interface HeaderProps {
    title: string;
    setActiveView: (view: string) => void;
}

const Header: React.FC<HeaderProps> = ({ title, setActiveView }) => {
    const { user, logout, notifications, markNotificationsAsRead } = useAuth();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isNotificationOpen, setNotificationOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    const userNotifications = notifications.filter(n => n.userId === user?.id);
    const unreadCount = userNotifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleProfileClick = () => {
        setActiveView('perfil');
        setDropdownOpen(false);
    };

    const handleScheduleClick = () => {
        setActiveView('agendar');
    };
    
    const handleBellClick = () => {
        setNotificationOpen(prev => !prev);
        if (!isNotificationOpen && unreadCount > 0) {
            setTimeout(() => {
                markNotificationsAsRead();
            }, 2000);
        }
    };

    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " anos";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " dias";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutos";
        return Math.floor(seconds) + " segundos";
    }

    return (
        <div className="flex-1 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>

            <div className="flex items-center space-x-4">
                <button 
                    onClick={handleScheduleClick}
                    className="bg-primary text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition hidden lg:flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Agendar Férias
                </button>
                
                <div className="relative" ref={notificationRef}>
                    <button onClick={handleBellClick} className="p-2 rounded-full hover:bg-slate-200/60 transition relative">
                        <BellIcon className="h-6 w-6 text-slate-600" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1.5 block h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white"></span>
                        )}
                    </button>
                    {isNotificationOpen && (
                         <div className="absolute right-0 mt-2 w-80 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="p-2 border-b">
                                <h6 className="font-semibold text-slate-800 text-sm">Notificações</h6>
                            </div>
                            <div className="py-1 max-h-96 overflow-y-auto">
                               {userNotifications.length > 0 ? userNotifications.map(notif => (
                                   <div key={notif.id} className={`px-4 py-3 hover:bg-gray-100 ${!notif.read ? 'bg-blue-25' : ''}`}>
                                        <p className="text-sm text-gray-700">{notif.message}</p>
                                        <p className="text-xs text-gray-500 mt-1">{timeSince(notif.timestamp)} atrás</p>
                                   </div>
                               )) : (
                                   <div className="px-4 py-8 text-center">
                                       <p className="text-sm text-gray-500">Nenhuma notificação encontrada.</p>
                                   </div>
                               )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setDropdownOpen(prev => !prev)} className="flex items-center space-x-2 cursor-pointer p-1 rounded-full hover:bg-slate-200/60 transition">
                         <div className="h-10 w-10 text-gray-100 bg-slate-300 rounded-full flex items-center justify-center font-bold">
                            {user?.nome.charAt(0)}
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="font-semibold text-sm text-slate-800 leading-tight">{user?.nome}</p>
                        </div>
                    </button>

                    {isDropdownOpen && (
                         <div className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1">
                                <button
                                    onClick={handleProfileClick}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    <UserIcon className="h-5 w-5 mr-3 text-gray-500" />
                                    <span>Meu Perfil</span>
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                    onClick={logout}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    <LogoutIcon className="h-5 w-5 mr-3 text-gray-500" />
                                    <span>Sair</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;