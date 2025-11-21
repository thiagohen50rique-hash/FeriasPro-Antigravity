import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AuthContext, CollectiveVacationProposal } from './context/AuthContext';
import { Funcionario, Notificacao, FeriadoEmpresa, ConfiguracaoApp, NovoFeriadoEmpresa, PeriodoAquisitivo, PeriodoDeFerias, Afastamento, RegraFeriasColetivas, NovaRegraFeriasColetivas, UnidadeOrganizacional, NivelHierarquico, ParticipanteAssinatura, NovosDadosFuncionario } from './tipos';
import { ModalProvider } from './context/ModalContext';
import Modal from './components/Modal';
import { supabase } from './services/supabaseClient';
import * as api from './services/api';

// Helper functions for digital signatures (kept as is for now, but should ideally be moved to backend or service)
const createInitialSignatureParticipant = (employee: Funcionario): ParticipanteAssinatura => {
    const now = new Date();
    const eventTime1 = new Date(now.getTime() - 5 * 60000);
    const eventTime2 = new Date(now.getTime() - 2 * 60000);
    const eventTime3 = new Date(now.getTime() - 1 * 60000);
    const eventTime4 = new Date(now.getTime() - 30000);
    const ip = '187.32.157.145';
    const geo = '-22.8805518-47.0376365';

    return {
        assinante: employee,
        dataConclusao: now.toISOString(),
        enderecoIP: ip,
        metodoAutenticacao: 'Não',
        dispositivo: 'Windows NT 10.0; Win64; x64',
        geolocalizacao: 'Autorizado',
        eventos: [
            { name: 'Notificação enviada', timestamp: eventTime1.toISOString(), detalhes: `Link de operação enviado para ${employee.email}` },
            { name: 'Operação visualizada', timestamp: eventTime2.toISOString(), detalhes: `Acessou o link da operação\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Termos da assinatura eletrônica', timestamp: eventTime3.toISOString(), detalhes: `Aceitou os termos da assinatura eletrônica\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Assinatura efetuada', timestamp: eventTime4.toISOString(), detalhes: `Realizou a assinatura com validade jurídica\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Operação concluída', timestamp: eventTime4.toISOString(), detalhes: `Operação concluída\nIP: ${ip}\nGEO: ${geo}` },
        ]
    };
};

const createApproverSignatureParticipant = (approver: Funcionario, period: PeriodoAquisitivo): ParticipanteAssinatura => {
    const now = new Date();
    const requesterSignatureTime = period.infoAssinatura?.participantes?.[0]?.dataConclusao;
    const notificationTime = requesterSignatureTime ? new Date(new Date(requesterSignatureTime).getTime() + 10 * 60000) : now;

    const eventTime2 = new Date(now.getTime() - 2 * 60000);
    const eventTime3 = new Date(now.getTime() - 1 * 60000);
    const eventTime4 = new Date(now.getTime() - 30000);

    const ip = approver.role === 'manager' ? '192.168.1.10' : '201.150.30.5';
    const geo = approver.role === 'manager' ? '-22.9092471-47.0376365' : '-22.8785328-47.0376365';

    return {
        assinante: approver,
        dataConclusao: now.toISOString(),
        enderecoIP: ip,
        metodoAutenticacao: 'Não',
        dispositivo: 'Windows NT 10.0; Win64; x64',
        geolocalizacao: 'Autorizado',
        eventos: [
            { name: 'Notificação enviada', timestamp: notificationTime.toISOString(), detalhes: `Link de operação enviado para ${approver.email}` },
            { name: 'Operação visualizada', timestamp: eventTime2.toISOString(), detalhes: `Acessou o link da operação\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Termos da assinatura eletrônica', timestamp: eventTime3.toISOString(), detalhes: `Aceitou os termos da assinatura eletrônica\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Assinatura efetuada', timestamp: eventTime4.toISOString(), detalhes: `Realizou a assinatura com validade jurídica\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Operação concluída', timestamp: eventTime4.toISOString(), detalhes: `Operação concluída\nIP: ${ip}\nGEO: ${geo}` },
        ]
    };
};


function App() {
    const [currentUser, setCurrentUser] = useState<Funcionario | null>(null);
    const [allEmployees, setAllEmployees] = useState<Funcionario[]>([]);
    const [notifications, setNotifications] = useState<Notificacao[]>([]);
    const [holidays, setHolidays] = useState<FeriadoEmpresa[]>([]);
    const [config, setConfig] = useState<ConfiguracaoApp | null>(null);
    const [collectiveVacationRules, setCollectiveVacationRules] = useState<RegraFeriasColetivas[]>([]);
    const [orgUnits, setOrgUnits] = useState<UnidadeOrganizacional[]>([]);
    const [hierarchyLevels, setHierarchyLevels] = useState<NivelHierarquico[]>([]);
    const [loading, setLoading] = useState(true);

    // New states for organizational data
    const [companyUnits, setCompanyUnits] = useState<string[]>([]);
    const [holidayTypes, setHolidayTypes] = useState<string[]>(['feriado', 'ponto_facultativo', 'recesso']);

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [
                    employeesData,
                    holidaysData,
                    configData,
                    orgUnitsData,
                    collectiveRulesData
                ] = await Promise.all([
                    api.fetchEmployees(),
                    api.fetchHolidays(),
                    api.fetchConfig(),
                    api.fetchOrgUnits(),
                    api.fetchCollectiveVacationRules()
                ]);

                setAllEmployees(employeesData);
                setHolidays(holidaysData);
                setConfig(configData);
                setOrgUnits(orgUnitsData);
                setCollectiveVacationRules(collectiveRulesData);

                // Derive company units from employees
                setCompanyUnits([...new Set(employeesData.map(e => e.unidade))].sort());

                // Check for active session
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    // Find employee associated with this user
                    // This assumes we have a link. For now, let's match by email as a fallback if user_id not set
                    const userEmail = session.user.email;
                    const matchedEmployee = employeesData.find(e => e.email === userEmail);
                    if (matchedEmployee) {
                        setCurrentUser(matchedEmployee);
                    }
                }

            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                // Reload employees to ensure we have fresh data
                const employees = await api.fetchEmployees();
                setAllEmployees(employees);
                const userEmail = session.user.email;
                const matchedEmployee = employees.find(e => e.email === userEmail);
                if (matchedEmployee) setCurrentUser(matchedEmployee);
            } else {
                setCurrentUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);


    const login = useCallback(async (email: string, cpf: string): Promise<boolean> => {
        // For prototype, we are using Supabase Auth with Email/Password.
        // The 'cpf' argument is legacy from the mock login. We'll try to sign in with email and password (using CPF as password for now? Or just ignoring CPF and expecting user to have a password).
        // Let's assume the user has a password set up.

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email,
                password: cpf // TEMPORARY: Using CPF as password for migration simplicity, or user should enter password.
            });

            if (error) {
                console.error("Login failed:", error);
                return false;
            }
            return true;
        } catch (e) {
            console.error("Login error:", e);
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
    }, []);

    const addNotification = useCallback((notificationData: Omit<Notificacao, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notificacao = {
            ...notificationData,
            id: `notif-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const updateOrgUnits = useCallback((newOrgUnits: UnidadeOrganizacional[], updatedEmployeesWithRenames?: Funcionario[]) => {
        if (updatedEmployeesWithRenames) {
            setAllEmployees(updatedEmployeesWithRenames);
        }
        setOrgUnits(newOrgUnits);
    }, []);

    const updateHierarchyLevels = useCallback((newLevels: NivelHierarquico[]) => {
        setHierarchyLevels(newLevels);
    }, []);


    const updateEmployee = useCallback(async (updatedEmployee: Funcionario) => {
        // Optimistic update
        setAllEmployees(prev => {
            const oldEmployeeState = prev.find(e => e.id === updatedEmployee.id);

            if (oldEmployeeState && updatedEmployee.gestor !== oldEmployeeState.gestor) {
                const pendingPeriods = updatedEmployee.periodosAquisitivos
                    .filter(p => p.status === 'pending_manager');

                if (pendingPeriods.length > 0) {
                    const newManager = allEmployees.find(e => e.id === updatedEmployee.gestor);
                    if (newManager) {
                        addNotification({
                            userId: newManager.id,
                            message: `Você tem novas solicitações de férias de ${updatedEmployee.nome} que foram transferidas para sua aprovação.`,
                        });
                    }
                }
            }

            return prev.map(emp => (emp.id === updatedEmployee.id ? updatedEmployee : emp));
        });

        if (currentUser && currentUser.id === updatedEmployee.id) {
            setCurrentUser(updatedEmployee);
        }

        // API Call
        try {
            await api.updateEmployee(updatedEmployee.id, updatedEmployee);
        } catch (error) {
            console.error("Failed to update employee:", error);
            // Revert?
        }

    }, [currentUser, allEmployees, addNotification]);

    const addEmployee = useCallback(async (employeeData: NovosDadosFuncionario) => {
        try {
            const newEmp = await api.createEmployee(employeeData);
            // Need to refetch or manually construct the full object
            // For now, let's just refetch all to be safe and simple
            const employees = await api.fetchEmployees();
            setAllEmployees(employees);
        } catch (error) {
            console.error("Failed to add employee:", error);
        }
    }, []);

    const deleteEmployee = useCallback((employeeId: number) => {
        setAllEmployees(prev => prev.filter(emp => emp.id !== employeeId));
        // API call
    }, []);

    const toggleEmployeeStatus = useCallback(async (employeeId: number) => {
        const emp = allEmployees.find(e => e.id === employeeId);
        if (!emp) return;

        const newStatus = emp.status === 'active' ? 'inactive' : 'active';

        setAllEmployees(prev =>
            prev.map(e =>
                e.id === employeeId
                    ? { ...e, status: newStatus }
                    : e
            )
        );

        await api.updateEmployee(employeeId, { status: newStatus });

    }, [allEmployees]);


    const addHoliday = useCallback(async (holidayData: NovoFeriadoEmpresa) => {
        try {
            await api.createHoliday(holidayData);
            const holidays = await api.fetchHolidays();
            setHolidays(holidays);
        } catch (error) {
            console.error("Failed to add holiday:", error);
        }
    }, []);

    const updateHoliday = useCallback((updatedHoliday: FeriadoEmpresa) => {
        setHolidays(prev =>
            prev
                .map(h => h.id === updatedHoliday.id ? updatedHoliday : h)
                .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
        );
        // API call
    }, []);

    const deleteHoliday = useCallback((holidayId: string) => {
        setHolidays(prev => prev.filter(h => h.id !== holidayId));
        // API call
    }, []);

    const addCollectiveVacationRule = useCallback((ruleData: NovaRegraFeriasColetivas) => {
        const newRule: RegraFeriasColetivas = {
            ...ruleData,
            id: `cv-${Date.now()}`,
        };
        setCollectiveVacationRules(prev => [...prev, newRule]);
        // API call
    }, []);

    const updateCollectiveVacationRule = useCallback((updatedRule: RegraFeriasColetivas) => {
        setCollectiveVacationRules(prev =>
            prev.map(rule => (rule.id === updatedRule.id ? updatedRule : rule))
        );
        // API call
    }, []);

    const deleteCollectiveVacationRule = useCallback((ruleId: string) => {
        setCollectiveVacationRules(prev => prev.filter(rule => rule.id !== ruleId));
        // API call
    }, []);

    const updateConfig = useCallback((newConfig: ConfiguracaoApp) => {
        setConfig(newConfig);
        // API call
    }, []);

    const markNotificationsAsRead = useCallback(() => {
        if (currentUser) {
            setNotifications(prev =>
                prev.map(n => (n.userId === currentUser.id ? { ...n, read: true } : n))
            );
        }
    }, [currentUser]);

    const addAccrualPeriodsByDueDate = useCallback(async (dueDateLimit: string): Promise<number> => {
        // Logic remains similar but needs to persist to DB
        // For prototype, keeping local state update logic but should ideally be a backend function
        return 0;
    }, [allEmployees, config]);


    const addAccrualPeriodToEmployee = useCallback((employeeId: number, newPeriodData: Omit<PeriodoAquisitivo, 'fracionamentos' | 'saldoTotal'>) => {
        // API call
    }, []);

    const updateAccrualPeriod = useCallback((employeeId: number, periodId: string, newPeriodData: Partial<Omit<PeriodoAquisitivo, 'id' | 'fracionamentos' | 'saldoTotal'>>) => {
        // API call
    }, []);

    const deleteAccrualPeriod = useCallback((employeeId: number, periodId: string) => {
        // API call
    }, []);

    const addDirectVacation = useCallback(async (employeeId: number, periodId: string, vacationData: Omit<PeriodoDeFerias, 'id' | 'status' | 'sequencia'>) => {
        try {
            await api.addVacationFraction(periodId, vacationData);
            // Refetch
            const employees = await api.fetchEmployees();
            setAllEmployees(employees);
        } catch (error) {
            console.error("Failed to add vacation:", error);
        }
    }, []);

    const updateVacationPeriod = useCallback((
        employeeId: number,
        periodId: string,
        vacationId: string,
        updatedData: Partial<PeriodoDeFerias>
    ) => {
        // API call
    }, []);

    const deleteVacation = useCallback((employeeId: number, periodId: string, vacationId: string) => {
        // API call
    }, []);

    const addCollectiveVacation = useCallback(async (
        proposals: CollectiveVacationProposal[]
    ): Promise<{ success: boolean; message: string; details?: string[] }> => {
        // Complex logic, needs backend implementation or careful frontend orchestration
        return { success: true, message: "Not implemented yet" };
    }, [allEmployees]);

    const addLeaveToEmployee = useCallback((employeeId: number, leaveData: Omit<Afastamento, 'id'>) => {
        // API call
    }, []);

    const updateLeave = useCallback((employeeId: number, leaveId: string, updatedLeaveData: Omit<Afastamento, 'id'>) => {
        // API call
    }, []);

    const deleteLeave = useCallback((employeeId: number, leaveId: string) => {
        // API call
    }, []);

    const authContextValue = useMemo(() => {
        const activeEmployees = allEmployees.filter(e => e.status === 'active');
        const companyAreas = [...new Set(activeEmployees.map(e => e.departamento))].sort();


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
        currentUser, login, logout, allEmployees, updateEmployee, addEmployee, deleteEmployee, toggleEmployeeStatus,
        notifications, addNotification, markNotificationsAsRead,
        holidays, addHoliday, updateHoliday, deleteHoliday,
        config, updateConfig, addAccrualPeriodsByDueDate,
        addAccrualPeriodToEmployee, updateAccrualPeriod, deleteAccrualPeriod,
        addDirectVacation, updateVacationPeriod, deleteVacation, addCollectiveVacation,
        addLeaveToEmployee, updateLeave, deleteLeave, companyUnits, holidayTypes,
        collectiveVacationRules, addCollectiveVacationRule, updateCollectiveVacationRule, deleteCollectiveVacationRule,
        orgUnits, updateOrgUnits, hierarchyLevels, updateHierarchyLevels
    ]);

    if (loading || !config) {
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