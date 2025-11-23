import { createContext, Dispatch, SetStateAction, useCallback, useEffect, useState, ReactNode } from 'react';
import { Funcionario, Notificacao, FeriadoEmpresa, ConfiguracaoApp, NovoFeriadoEmpresa, PeriodoAquisitivo, PeriodoDeFerias, Afastamento, RegraFeriasColetivas, NovaRegraFeriasColetivas, UnidadeOrganizacional, NivelHierarquico, NovosDadosFuncionario } from '../tipos';
import { supabase } from '../services/supabaseClient';
import * as api from '../services/api';

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
  deleteHoliday: (id: number) => void;
  config: ConfiguracaoApp | null;
  updateConfig: (config: ConfiguracaoApp) => void;
  addAccrualPeriodsByDueDate: (dueDateLimit: string) => Promise<number>;
  addAccrualPeriodToEmployee: (employeeId: number, periodData: any) => Promise<void>;
  updateAccrualPeriod: (employeeId: number, periodId: number, periodData: any) => void;
  deleteAccrualPeriod: (employeeId: number, periodId: number) => void;
  addDirectVacation: (employeeId: number, periodId: string | number, vacationData: any) => void;
  updateVacationPeriod: (employeeId: number, periodId: number, vacationId: number, vacationData: any) => void;
  deleteVacation: (employeeId: number, periodId: number, vacationId: number) => void;
  addCollectiveVacation: (proposals: any[]) => Promise<{ success: boolean; message: string }>;
  addLeaveToEmployee: (employeeId: number, leaveData: any) => void;
  updateLeave: (employeeId: number, leaveId: number, leaveData: any) => void;
  deleteLeave: (employeeId: number, leaveId: number) => void;
  companyAreas: string[];

  companyUnits: string[];
  setCompanyUnits: Dispatch<SetStateAction<string[]>>;
  holidayTypes: string[];
  setHolidayTypes: Dispatch<SetStateAction<string[]>>;
  collectiveVacationRules: RegraFeriasColetivas[];
  addCollectiveVacationRule: (rule: NovaRegraFeriasColetivas) => void;
  updateCollectiveVacationRule: (rule: RegraFeriasColetivas) => void;
  deleteCollectiveVacationRule: (ruleId: number) => void;
  orgUnits: UnidadeOrganizacional[];
  updateOrgUnits: (newOrgUnits: UnidadeOrganizacional[], updatedEmployees?: Funcionario[]) => void;
  hierarchyLevels: NivelHierarquico[];
  updateHierarchyLevels: (newLevels: NivelHierarquico[]) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => Promise.resolve(false),
  logout: () => { },
  allEmployees: [],
  activeEmployees: [],
  updateEmployee: () => { },
  addEmployee: () => { },
  deleteEmployee: () => { },
  toggleEmployeeStatus: () => { },
  notifications: [],
  addNotification: () => { },
  markNotificationsAsRead: () => { },
  holidays: [],
  addHoliday: () => { },
  updateHoliday: () => { },
  deleteHoliday: () => { },
  config: null,
  updateConfig: () => { },
  addAccrualPeriodsByDueDate: () => Promise.resolve(0),
  addAccrualPeriodToEmployee: async () => { },
  updateAccrualPeriod: () => { },
  deleteAccrualPeriod: () => { },
  addDirectVacation: () => { },
  updateVacationPeriod: () => { },
  deleteVacation: () => { },
  addCollectiveVacation: () => Promise.resolve({ success: false, message: 'Não implementado' }),
  addLeaveToEmployee: () => { },
  updateLeave: () => { },
  deleteLeave: () => { },
  companyAreas: [],

  companyUnits: [],
  setCompanyUnits: () => { },
  holidayTypes: [],
  setHolidayTypes: () => { },
  collectiveVacationRules: [],
  addCollectiveVacationRule: () => { },
  updateCollectiveVacationRule: () => { },
  deleteCollectiveVacationRule: () => { },
  orgUnits: [],
  updateOrgUnits: () => { },
  hierarchyLevels: [],
  updateHierarchyLevels: () => { },
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
          dataInicio: af.start_date,
          dataFim: af.end_date,
          descricao: af.description
        })) || [],

        periodosAquisitivos: emp.periodos_aquisitivos?.map((pa: any) => ({
          id: pa.id,
          rotulo_periodo: pa.rotulo_periodo,
          inicioPa: pa.inicio_pa,
          terminoPa: pa.termino_pa,
          limiteConcessao: pa.limite_concessao,
          saldoTotal: pa.saldo_total,
          status: pa.status,
          idAprovadorGestor: pa.manager_approver_id,
          idAprovadorRH: pa.hr_approver_id,
          tipoEntradaDiasFerias: pa.vacation_days_input_type,
          baseCalculoAbono: pa.abono_calculation_basis,
          infoAssinatura: pa.signature_info,

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


  // --- AUTENTICAÇÃO (Lógica implantada) ---
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
      id: 0, // Será gerado pelo BD quando implementar tabela de notificações
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
    // Agora usa API que retorna ID do BD
    // TODO: Implementar createHoliday na API
  }, []);
  const updateHoliday = useCallback((h: FeriadoEmpresa) => setHolidays(p => p.map(x => x.id === h.id ? h : x)), []);
  const deleteHoliday = useCallback((id: number) => setHolidays(p => p.filter(x => x.id !== id)), []);
  const updateConfig = useCallback((c: ConfiguracaoApp) => setConfig(c), []);


  const addEmployee = useCallback((employeeData: NovosDadosFuncionario) => {
    console.log("Adicionar funcionário: implementar INSERT no Supabase", employeeData);
  }, []);

  const deleteEmployee = useCallback((employeeId: number) => {
    setAllEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  }, []);

  const toggleEmployeeStatus = useCallback((employeeId: number) => {
    setAllEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' } : emp));
  }, []);


  // --- AÇÕES DE ESCRITA (Placeholders e Implementações concluídas) ---

  const updateEmployee = useCallback(async (updatedEmployee: Funcionario) => {
    try {
      const { error } = await supabase
        .from('perfis')
        .update({
          nome: updatedEmployee.nome,
          cargo: updatedEmployee.cargo,
          departamento: updatedEmployee.departamento,

          unidade: updatedEmployee.unidade,
          gestor_id: updatedEmployee.gestor,
          status: updatedEmployee.status,
          nivel_hierarquico: updatedEmployee.nivelHierarquico,
          // Adicione outros campos conforme necessário
        })
        .eq('id', updatedEmployee.id);

      if (error) throw error;

      // Atualiza estado local
      setAllEmployees(prev => prev.map(emp => (emp.id === updatedEmployee.id ? updatedEmployee : emp)));

      if (currentUser && currentUser.id === updatedEmployee.id) {
        setCurrentUser(updatedEmployee);
      }

    } catch (error: any) {
      console.error('Erro ao atualizar funcionário:', error.message);
    }
  }, [currentUser]);
  //--------------------------------------------




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
          tipoEntradaDiasFerias: data.vacation_days_input_type,
          baseCalculoAbono: data.abono_calculation_basis
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

  // Placeholders para as outras funções (funções implmementadas)
  const addDirectVacation = useCallback(async (employeeId: number, periodId: string | number, vacationData: any) => {
    try {
      const { data, error } = await supabase
        .from('fracionamentos')
        .insert({
          perfil_id: employeeId,
          periodo_aquisitivo_id: Number(periodId), // Garante que é número
          sequencia: 1, // Você pode implementar lógica para calcular (ex: contar existentes + 1)
          inicio_ferias: vacationData.inicioFerias,
          termino_ferias: vacationData.terminoFerias,
          quantidade_dias: vacationData.quantidadeDias,
          dias_abono: vacationData.diasAbono || 0,
          adiantamento_13: vacationData.adiantamento13 || false,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      // Atualiza o estado local (Frontend) sem precisar recarregar a página
      if (data) {
        const newVacation: PeriodoDeFerias = {
          id: data.id,
          sequencia: data.sequencia,
          inicioFerias: data.inicio_ferias,
          terminoFerias: data.termino_ferias,
          quantidadeDias: data.quantidade_dias,
          diasAbono: data.dias_abono,
          adiantamento13: data.adiantamento_13,
          status: data.status
        };

        setAllEmployees(prev => prev.map(emp => {
          if (emp.id === employeeId) {
            return {
              ...emp,
              periodosAquisitivos: emp.periodosAquisitivos.map(pa => {
                if (pa.id === Number(periodId)) {
                  return {
                    ...pa,
                    fracionamentos: [...pa.fracionamentos, newVacation]
                      .sort((a, b) => new Date(a.inicioFerias).getTime() - new Date(b.inicioFerias).getTime())
                  };
                }
                return pa;
              })
            };
          }
          return emp;
        }));

        // Feedback visual (opcional: useModal().alert(...) se tiver acesso ao modal aqui)
        console.log("Férias lançadas com sucesso!");
      }
    } catch (error: any) {
      console.error('Erro ao lançar férias:', error.message);
    }
  }, []);

  const updateAccrualPeriod = useCallback(async (employeeId: number, periodId: number, periodData: any) => {
    try {
      await api.updateAccrualPeriod(periodId, periodData);
      setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            periodosAquisitivos: emp.periodosAquisitivos.map(pa => pa.id === periodId ? { ...pa, ...periodData } : pa)
          };
        }
        return emp;
      }));
    } catch (error) {
      console.error("Error updating accrual period:", error);
    }
  }, []);

  const deleteAccrualPeriod = useCallback(async (employeeId: number, periodId: number) => {
    try {
      await api.deleteAccrualPeriod(periodId);
      setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            periodosAquisitivos: emp.periodosAquisitivos.filter(pa => pa.id !== periodId)
          };
        }
        return emp;
      }));
    } catch (error) {
      console.error("Error deleting accrual period:", error);
    }
  }, []);

  const updateVacationPeriod = useCallback(async (employeeId: number, periodId: number, vacationId: number, vacationData: any) => {
    try {
      await api.updateVacationFraction(vacationId, vacationData);
      setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            periodosAquisitivos: emp.periodosAquisitivos.map(pa => {
              if (pa.id === periodId) {
                return {
                  ...pa,
                  fracionamentos: pa.fracionamentos.map(f => f.id === vacationId ? { ...f, ...vacationData } : f)
                };
              }
              return pa;
            })
          };
        }
        return emp;
      }));
    } catch (error) {
      console.error("Error updating vacation:", error);
    }
  }, []);

  const deleteVacation = useCallback(async (employeeId: number, periodId: number, vacationId: number) => {
    try {
      await api.deleteVacationFraction(vacationId);
      setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            periodosAquisitivos: emp.periodosAquisitivos.map(pa => {
              if (pa.id === periodId) {
                return {
                  ...pa,
                  fracionamentos: pa.fracionamentos.filter(f => f.id !== vacationId)
                };
              }
              return pa;
            })
          };
        }
        return emp;
      }));
    } catch (error) {
      console.error("Error deleting vacation:", error);
    }
  }, []);

  const addCollectiveVacation = useCallback(async (proposals: any[]) => {
    try {
      await api.createCollectiveVacation(proposals);
      await fetchEmployees();
      return { success: true, message: 'Férias coletivas criadas com sucesso' };
    } catch (error: any) {
      console.error("Error creating collective vacations:", error);
      return { success: false, message: error.message || 'Erro ao criar férias coletivas' };
    }
  }, [fetchEmployees]);

  const addLeaveToEmployee = useCallback(async (employeeId: number, leaveData: any) => {
    try {
      await api.createLeave({ ...leaveData, perfilId: employeeId });
      await fetchEmployees();
    } catch (error) {
      console.error("Error adding leave:", error);
    }
  }, [fetchEmployees]);

  const updateLeave = useCallback(async (employeeId: number, leaveId: number, leaveData: any) => {
    try {
      await api.updateLeave(leaveId, leaveData);
      setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            afastamentos: emp.afastamentos.map(l => l.id === leaveId ? { ...l, ...leaveData } : l)
          };
        }
        return emp;
      }));
    } catch (error) {
      console.error("Error updating leave:", error);
    }
  }, []);

  const deleteLeave = useCallback(async (employeeId: number, leaveId: number) => {
    try {
      await api.deleteLeave(leaveId);
      setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            afastamentos: emp.afastamentos.filter(l => l.id !== leaveId)
          };
        }
        return emp;
      }));
    } catch (error) {
      console.error("Error deleting leave:", error);
    }
  }, []);

  const addCollectiveVacationRule = useCallback((rule: NovaRegraFeriasColetivas) => { }, []);
  const updateCollectiveVacationRule = useCallback((rule: RegraFeriasColetivas) => { }, []);
  const deleteCollectiveVacationRule = useCallback((ruleId: number) => { }, []);
  const updateOrgUnits = useCallback((newOrgUnits: UnidadeOrganizacional[], updatedEmployees?: Funcionario[]) => { }, []);
  const updateHierarchyLevels = useCallback((newLevels: NivelHierarquico[]) => { }, []);

  // Valores derivados
  const activeEmployees = allEmployees.filter(e => e.status === 'active');
  const companyAreas = [...new Set(activeEmployees.map(e => e.departamento))].sort();


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