import { useState, useCallback } from 'react';
import { Notificacao } from '../tipos';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notificacao[]>([]);

    const addNotification = useCallback((notificationData: Omit<Notificacao, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notificacao = {
            ...notificationData,
            id: 0, // Será gerado pelo BD quando implementar tabela de notificações
            timestamp: new Date().toISOString(),
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const markNotificationsAsRead = useCallback((userId: number) => {
        setNotifications(prev =>
            prev.map(n => (n.userId === userId ? { ...n, read: true } : n))
        );
    }, []);

    return {
        notifications,
        addNotification,
        markNotificationsAsRead
    };
};
