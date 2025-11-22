import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AuthContext, CollectiveVacationProposal } from './context/AuthContext';
import { Funcionario } from './tipos';
import { ModalProvider } from './context/ModalContext';
import Modal from './components/Modal';
import { useAuth } from './hooks/useAuth';
import { useEmployees } from './hooks/useEmployees';
import { useAppData } from './hooks/useAppData';
import { useNotifications } from './hooks/useNotifications';

function App() {
    const { session, login, logout, loading: authLoading } = useAuth();
    const { notifications, addNotification, markNotificationsAsRead } = useNotifications();

    const {
        allEmployees, activeEmployees, companyUnits, companyAreas, loading: employeesLoading,
        setCompanyUnits,
        fetchEmployees, updateEmployee, addEmployee, deleteEmployee, toggleEmployeeStatus,
        addAccrualPeriodToEmployee, updateAccrualPeriod, deleteAccrualPeriod,
        addDirectVacation, updateVacationPeriod, deleteVacation,
        addLeaveToEmployee, updateLeave, deleteLeave
    } = useEmployees(addNotification);

    const {
        holidays, config, collectiveVacationRules, orgUnits, hierarchyLevels, holidayTypes, loading: appDataLoading,
        setHolidayTypes, addHoliday, updateHoliday, deleteHoliday, updateConfig,
        addCollectiveVacationRule, updateCollectiveVacationRule, deleteCollectiveVacationRule,
        updateOrgUnits, updateHierarchyLevels
    } = useAppData();

    const [currentUser, setCurrentUser] = useState<Funcionario | null>(null);

    // Derive currentUser from session and allEmployees
    useEffect(() => {
        if (session && allEmployees.length > 0) {
            const userEmail = session.user.email;
            const matchedEmployee = allEmployees.find(e => e.email === userEmail);
            setCurrentUser(matchedEmployee || null);
        } else if (!session) {
            setCurrentUser(null);
        }
    }, [session, allEmployees]);

    // Refresh employees when session changes (login)
    useEffect(() => {
        if (session) {
            fetchEmployees();
        }
    }, [session, fetchEmployees]);

    // Placeholder for addAccrualPeriodsByDueDate
    const addAccrualPeriodsByDueDate = useCallback(async (dueDateLimit: string): Promise<number> => {
        // Logic remains similar but needs to persist to DB
        // For prototype, keeping local state update logic but should ideally be a backend function
        return 0;
    }, []);

    // Placeholder for addCollectiveVacation
    const addCollectiveVacation = useCallback(async (
        proposals: CollectiveVacationProposal[]
    ): Promise<{ success: boolean; message: string; details?: string[] }> => {
        // Complex logic, needs backend implementation or careful frontend orchestration
        return { success: true, message: "Not implemented yet" };
    }, []);

    const authContextValue = useMemo(() => {
        return {
            user: currentUser,
            login,
            logout,
            allEmployees,
            activeEmployees,
            updateEmployee,
            addEmployee,
            deleteEmployee,
            toggleEmployeeStatus,
            notifications,
            addNotification,
            markNotificationsAsRead,
            holidays,
            addHoliday,
            updateHoliday,
            deleteHoliday,
            config: config!,
            updateConfig,
            addAccrualPeriodsByDueDate,
            addAccrualPeriodToEmployee,
            updateAccrualPeriod,
            deleteAccrualPeriod,
            addDirectVacation,
            updateVacationPeriod,
            deleteVacation,
            addCollectiveVacation,
            addLeaveToEmployee,
            updateLeave,
            deleteLeave,
            companyAreas,

            companyUnits,
            setCompanyUnits,
            holidayTypes,
            setHolidayTypes,
            collectiveVacationRules,
            addCollectiveVacationRule,
            updateCollectiveVacationRule,
            deleteCollectiveVacationRule,
            orgUnits,
            updateOrgUnits,
            hierarchyLevels,
            updateHierarchyLevels,
        };
    }, [
        currentUser, login, logout, allEmployees, activeEmployees, updateEmployee, addEmployee, deleteEmployee, toggleEmployeeStatus,
        notifications, addNotification, markNotificationsAsRead,
        holidays, addHoliday, updateHoliday, deleteHoliday,
        config, updateConfig, addAccrualPeriodsByDueDate,
        addAccrualPeriodToEmployee, updateAccrualPeriod, deleteAccrualPeriod,
        addDirectVacation, updateVacationPeriod, deleteVacation, addCollectiveVacation,
        addLeaveToEmployee, updateLeave, deleteLeave, companyAreas, companyUnits, holidayTypes,
        collectiveVacationRules, addCollectiveVacationRule, updateCollectiveVacationRule, deleteCollectiveVacationRule,
        orgUnits, updateOrgUnits, hierarchyLevels, updateHierarchyLevels, setCompanyUnits, setHolidayTypes
    ]);

    const loading = authLoading || (session && (employeesLoading || appDataLoading));

    if (loading || (session && !config)) {
        return <div className="flex items-center justify-center h-screen">Carregando dados...</div>;
    }

    return (
        <AuthContext.Provider value={authContextValue}>
            <ModalProvider>
                {currentUser ? <Dashboard /> : <Login />}
                <Modal />
            </ModalProvider>
        </AuthContext.Provider>
    );
}

export default App;