import { createContext, Dispatch, SetStateAction, useCallback, useEffect, useState, ReactNode } from 'react';
import { Funcionario, Notificacao, FeriadoEmpresa, ConfiguracaoApp, NovoFeriadoEmpresa, PeriodoAquisitivo, PeriodoDeFerias, Afastamento, RegraFeriasColetivas, NovaRegraFeriasColetivas, UnidadeOrganizacional, NivelHierarquico } from '../tipos';
import { supabase } from '../services/supabaseClient';

export type NovosDadosFuncionario = Omit<Funcionario, 'id' | 'periodosAquisitivos' | 'afastamentos'>;

export interface CollectiveVacationProposal {
    employeeId: number;
    startDate: string;
    days: number;
}

interface AuthContextType {
  user: Funcionario | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  allEmployees: Funcionario[];
  activeEmployees: Funcionario[];
  updateEmployee: (employee: Funcionario) => void;
  addEmployee: (employeeData: NovosDadosFuncionario) => void;
  deleteEmployee: (employeeId: number) => void;
  toggleEmployeeStatus: (employeeId: number) => void;
  notifications: Notificacao[];
  addNotification: (notificationData: Omit<Notificacao, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationsAsRead: () => void;
  holidays: FeriadoEmpresa[];
  addHoliday: (holidayData: NovoFeriadoEmpresa) => void;
  updateHoliday: (holiday: FeriadoEmpresa) => void;
  deleteHoliday: (holidayId: string) => void;
  config: ConfiguracaoApp | null;
  updateConfig: (newConfig: ConfiguracaoApp) => void;
  addAccrualPeriodsByDueDate: (dueDateLimit: string) => Promise<number>;
  addAccrualPeriodToEmployee: (employeeId: number, periodoData: any) => Promise<void>;
  updateAccrualPeriod: (employeeId: number, periodId: string, newPeriodData: Partial<Omit<PeriodoAquisitivo, 'id' | 'fracionamentos' | 'saldoTotal'>>) => void;
  deleteAccrualPeriod: (employeeId: number, periodId: string) => void;
  addDirectVacation: (employeeId: number, periodId: string, vacationData: Omit<PeriodoDeFerias, 'id' | 'status' | 'sequencia'>) => void;
  updateVacationPeriod: (employeeId: number, periodId: string, vacationId: string, updatedData: Partial<PeriodoDeFerias>) => void;
  deleteVacation: (employeeId: number, periodId: string, vacationId: string) => void;
  addCollectiveVacation: (
    proposals: CollectiveVacationProposal[]
  ) => Promise<{ success: boolean; message: string; details?: string[] }>;
  addLeaveToEmployee: (employeeId: number, leaveData: Omit<Afastamento, 'id'>) => void;
  updateLeave: (employeeId: number, leaveId: string, updatedLeave: Omit<Afastamento, 'id'>) => void;
  deleteLeave: (employeeId: number, leaveId: string) => void;
  companyAreas: string[];
  companyManagements: string[];
  companyUnits: string[];
  setCompanyUnits: Dispatch<SetStateAction<string[]>>;
  holidayTypes: string[];
  setHolidayTypes: Dispatch<SetStateAction<string[]>>;
  collectiveVacationRules: RegraFeriasColetivas[];
  addCollectiveVacationRule: (rule: NovaRegraFeriasColetivas) => void;
  updateCollectiveVacationRule: (rule: RegraFeriasColetivas) => void;
  deleteCollectiveVacationRule: (ruleId: string) => void;
  orgUnits: UnidadeOrganizacional[];
  updateOrgUnits: (newOrgUnits: UnidadeOrganizacional[], updatedEmployees?: Funcionario[]) => void;
  hierarchyLevels: NivelHierarquico[];
  updateHierarchyLevels: (newLevels: NivelHierarquico[]) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  allEmployees: [],
  activeEmployees: [],
  updateEmployee: () => {},
  addEmployee: () => {},
  deleteEmployee: () => {},
  toggleEmployeeStatus: () => {},
  notifications: [],
  addNotification: () => {},
  markNotificationsAsRead: () => {},
  holidays: [],
  addHoliday: () => {},
  updateHoliday: () => {},
  deleteHoliday: () => {},
  config: null,
  updateConfig: () => {},
  addAccrualPeriodsByDueDate: () => Promise.resolve(0),
  addAccrualPeriodToEmployee: async () => {},
  updateAccrualPeriod: () => {},
  deleteAccrualPeriod: () => {},
  addDirectVacation: () => {},
  updateVacationPeriod: () => {},
  deleteVacation: () => {},
  addCollectiveVacation: () => Promise.resolve({ success: false, message: 'Não implementado' }),
  addLeaveToEmployee: () => {},
  updateLeave: () => {},
  deleteLeave: () => {},
  companyAreas: [],
  companyManagements: [],
  companyUnits: [],
  setCompanyUnits: () => {},
  holidayTypes: [],
  setHolidayTypes: () => {},
  collectiveVacationRules: [],
  addCollectiveVacationRule: () => {},
  updateCollectiveVacationRule: () => {},
  deleteCollectiveVacationRule: () => {},
  orgUnits: [],
  updateOrgUnits: () => {},
  hierarchyLevels: [],
  updateHierarchyLevels: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ESTADO: Dados principais
  const [allEmployees, setAllEmployees] = useState<Funcionario[]>([]);
  const [currentUser, setCurrentUser] = useState<Funcionario | null>(null);
  
  // ESTADO: Auxiliares
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [holidays, setHolidays] = useState<FeriadoEmpresa[]>([]); 
  const [config, setConfig] = useState<ConfiguracaoApp | null>(null);
  const [collectiveVacationRules, setCollectiveVacationRules] = useState<RegraFeriasColetivas[]>([]);
  const [orgUnits, setOrgUnits] = useState<UnidadeOrganizacional[]>([]);
  const [hierarchyLevels, setHierarchyLevels] = useState<NivelHierarquico[]>([]);
  
  // ESTADO: Listas de opções
  const [companyUnits, setCompanyUnits] = useState<string[]>([]);
  const [holidayTypes, setHolidayTypes] = useState<string[]>(['feriado', 'ponto_facultativo', 'recesso']);

  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA (Supabase) ---
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('perfis') 
      .select(`
        *,
        periodos_aquisitivos (
          *,
          fracionamentos (*)
        ),
        afastamentos (*)
      `);

    if (error) {
      console.error('Erro ao buscar funcionários:', error);
      return;
    }

    if (data) {
      if (data.length === 0) {
        console.warn("Atenção: Nenhum funcionário retornado do Supabase. Verifique as políticas de RLS (Row Level Security) se você não estiver logado via Supabase Auth.");
      }

      // ADAPTER: Transforma snake_case (Banco) para camelCase (Frontend)
      const formattedData: Funcionario[] = data.map((emp: any) => ({
        id: emp.id, // ID Numérico
        nome: emp.nome,
        matricula: emp.matricula,
        dataAdmissao: emp.data_admissao, 
        cargo: emp.cargo,
        departamento: emp.departamento,
        area: emp.area,
        unidade: emp.unidade,
        gestor: emp.gestor_id, 
        email: emp.email,
        cpf: emp.cpf,
        role: emp.role,
        status: emp.status,
        nivelHierarquico: emp.nivel_hierarquico,
        
        afastamentos: emp.afastamentos?.map((af: any) => ({
          id: af.id,
          type: af.type,
          startDate: af.start_date,
          endDate: af.end_date,
          description: af.description
        })) || [],

        periodosAquisitivos: emp.periodos_aquisitivos?.map((pa: any) => ({
          id: pa.id, 
          rotulo_periodo: pa.rotulo_periodo,
          inicioPa: pa.inicio_pa,
          terminoPa: pa.termino_pa,
          limiteConcessao: pa.limite_concessao,
          saldoTotal: pa.saldo_total,
          status: pa.status,
          managerApproverId: pa.manager_approver_id,
          hrApproverId: pa.hr_approver_id,
          vacationDaysInputType: pa.vacation_days_input_type,
          abonoCalculationBasis: pa.abono_calculation_basis,
          signatureInfo: pa.signature_info,
          
          fracionamentos: pa.fracionamentos?.map((fr: any) => ({
            id: fr.id,
            sequencia: fr.sequencia,
            inicioFerias: fr.inicio_ferias,
            terminoFerias: fr.termino_ferias,
            quantidadeDias: fr.quantidade_dias,
            diasAbono: fr.dias_abono,
            adiantamento13: fr.adiantamento_13,
            status: fr.status
          })) || []
        })) || []
      }));

      setAllEmployees(formattedData);
      
      const units = [...new Set(formattedData.map(e => e.unidade))].sort();
      setCompanyUnits(units);

      // Atualiza o usuário logado se os dados mudarem no banco
      if (currentUser) {
        const updatedSelf = formattedData.find(e => e.id === currentUser.id);
        if (updatedSelf) setCurrentUser(updatedSelf);
      }
    }
    setIsLoading(false);
  }, [currentUser]); // Dependência correta para atualizar após login/ações

  // Inicialização
  useEffect(() => {
    fetchEmployees();
    // Futuro: fetchHolidays(), fetchConfig(), etc.
  }, [fetchEmployees]); // Adicionado fetchEmployees como dependência para evitar stale closures


  // --- AUTENTICAÇÃO (Lógica Híbrida Temporária) ---
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
try {
        // O Supabase verifica a senha criptografada internamente
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password, 
        });

        if (error) {
            console.error("Erro de autenticação:", error.message);
            return false;
        }

        // Se o login no Supabase passar, buscamos os dados do perfil
        const userProfile = allEmployees.find(emp => emp.email.toLowerCase() === email.toLowerCase());
        
        if (userProfile) {
            setCurrentUser(userProfile);
            return true;
        } else {
            console.error("Usuário autenticado mas sem perfil na tabela 'perfis'");
            return false;
        }

    } catch (error) {
        console.error("Erro inesperado no login:", error);
        return false;
    }
  }, [allEmployees]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);


  // --- AÇÕES DE ESCRITA (Placeholders e Implementações Iniciais) ---
  
  const addNotification = useCallback((notificationData: Omit<Notificacao, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notificacao = {
        ...notificationData,
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markNotificationsAsRead = useCallback(() => {
    if (currentUser) {
        setNotifications(prev => prev.map(n => (n.userId === currentUser.id ? { ...n, read: true } : n)));
    }
  }, [currentUser]);

  const addHoliday = useCallback((holidayData: NovoFeriadoEmpresa) => {
      setHolidays(prev => [...prev, { ...holidayData, id: `h-${Date.now()}` }]);
  }, []);
  const updateHoliday = useCallback((h: FeriadoEmpresa) => setHolidays(p => p.map(x => x.id === h.id ? h : x)), []);
  const deleteHoliday = useCallback((id: string) => setHolidays(p => p.filter(x => x.id !== id)), []);
  const updateConfig = useCallback((c: ConfiguracaoApp) => setConfig(c), []);
  
  const updateEmployee = useCallback((updatedEmployee: Funcionario) => {
      setAllEmployees(prev => prev.map(emp => (emp.id === updatedEmployee.id ? updatedEmployee : emp)));
      if (currentUser && currentUser.id === updatedEmployee.id) setCurrentUser(updatedEmployee);
  }, [currentUser]);

  const addEmployee = useCallback((employeeData: NovosDadosFuncionario) => {
      console.log("Adicionar funcionário: implementar INSERT no Supabase", employeeData);
  }, []);

  const deleteEmployee = useCallback((employeeId: number) => {
      setAllEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  }, []);

  const toggleEmployeeStatus = useCallback((employeeId: number) => {
      setAllEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' } : emp));
  }, []);


  // --- GESTÃO DE FÉRIAS (Comunicação Real com Supabase) ---

  const addAccrualPeriodsByDueDate = useCallback(async (dueDateLimit: string): Promise<number> => {
        // TODO: Implementar RPC: await supabase.rpc('criar_pa_em_massa', { p_due_date_limit: dueDateLimit })
        return 0; 
  }, []);

  const addAccrualPeriodToEmployee = useCallback(async (employeeId: number, periodData: any) => {
    try {
      const { data, error } = await supabase
        .from('periodos_aquisitivos')
        .insert({
          perfil_id: employeeId,
          rotulo_periodo: periodData.rotulo_periodo,
          inicio_pa: periodData.inicio_pa,
          termino_pa: periodData.termino_pa,
          limite_concessao: periodData.limite_concessao,
          status: periodData.status,
          vacation_days_input_type: periodData.vacation_days_input_type,
          abono_calculation_basis: periodData.abono_calculation_basis,
          saldo_total: 30, 
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Reconstrói objeto para o Frontend
        const newPeriodFrontend: PeriodoAquisitivo = {
          id: data.id,
          rotulo_periodo: data.rotulo_periodo,
          inicioPa: data.inicio_pa,
          terminoPa: data.termino_pa,
          limiteConcessao: data.limite_concessao,
          saldoTotal: data.saldo_total,
          status: data.status,
          fracionamentos: [],
          vacationDaysInputType: data.vacation_days_input_type,
          abonoCalculationBasis: data.abono_calculation_basis
        };

        setAllEmployees(prev => prev.map(emp => {
          if (emp.id === employeeId) {
            return {
              ...emp,
              periodosAquisitivos: [...emp.periodosAquisitivos, newPeriodFrontend]
                .sort((a, b) => new Date(a.inicioPa).getTime() - new Date(b.inicioPa).getTime())
            };
          }
          return emp;
        }));
      }
    } catch (error: any) {
      console.error('Erro ao adicionar período:', error.message);
      throw error; 
    }
  }, []);

  // Placeholders para as outras funções
  const updateAccrualPeriod = useCallback(() => {}, []);
  const deleteAccrualPeriod = useCallback(() => {}, []);
  const addDirectVacation = useCallback(() => {}, []);
  const updateVacationPeriod = useCallback(() => {}, []);
  const deleteVacation = useCallback(() => {}, []);
  const addCollectiveVacation = useCallback(async () => ({ success: false, message: 'Não implementado' }), []);
  
  const addLeaveToEmployee = useCallback(() => {}, []);
  const updateLeave = useCallback(() => {}, []);
  const deleteLeave = useCallback(() => {}, []);

  const addCollectiveVacationRule = useCallback(() => {}, []);
  const updateCollectiveVacationRule = useCallback(() => {}, []);
  const deleteCollectiveVacationRule = useCallback(() => {}, []);
  const updateOrgUnits = useCallback(() => {}, []);
  const updateHierarchyLevels = useCallback(() => {}, []);

  // Valores derivados
  const activeEmployees = allEmployees.filter(e => e.status === 'active');
  const companyAreas = [...new Set(activeEmployees.map(e => e.departamento))].sort();
  const companyManagements = [...new Set(activeEmployees.map(e => e.area))].sort();

  return (
    <AuthContext.Provider value={{
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
      config,
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
      companyManagements,
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};