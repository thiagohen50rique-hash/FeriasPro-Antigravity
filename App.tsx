



import React, { useState, useMemo, useCallback } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AuthContext, NovosDadosFuncionario, CollectiveVacationProposal } from './context/AuthContext';
import { MOCK_EMPLOYEES, MOCK_HOLIDAYS, MOCK_CONFIG, MOCK_COLLECTIVE_VACATION_RULES, MOCK_ORG_UNITS, MOCK_HIERARCHY_LEVELS } from './constants';
import { Funcionario, Notificacao, FeriadoEmpresa, ConfiguracaoApp, NovoFeriadoEmpresa, PeriodoAquisitivo, PeriodoDeFerias, Afastamento, RegraFeriasColetivas, NovaRegraFeriasColetivas, UnidadeOrganizacional, NivelHierarquico, ParticipanteAssinatura, InformacaoAssinatura } from './tipos';
import { ModalProvider } from './context/ModalContext';
import Modal from './components/Modal';

// Helper functions for digital signatures
const createInitialSignatureParticipant = (employee: Funcionario): ParticipanteAssinatura => {
    const now = new Date();
    const eventTime1 = new Date(now.getTime() - 5 * 60000); 
    const eventTime2 = new Date(now.getTime() - 2 * 60000);
    const eventTime3 = new Date(now.getTime() - 1 * 60000);
    const eventTime4 = new Date(now.getTime() - 30000);
    const ip = '187.32.157.145';
    const geo = '-22.8805518-47.0376365';

    return {
        signer: employee,
        conclusionTime: now.toISOString(),
        ipAddress: ip,
        authenticationMethod: 'Não',
        device: 'Windows NT 10.0; Win64; x64',
        geolocation: 'Autorizado',
        events: [
            { name: 'Notificação enviada', timestamp: eventTime1.toISOString(), details: `Link de operação enviado para ${employee.email}` },
            { name: 'Operação visualizada', timestamp: eventTime2.toISOString(), details: `Acessou o link da operação\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Termos da assinatura eletrônica', timestamp: eventTime3.toISOString(), details: `Aceitou os termos da assinatura eletrônica\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Assinatura efetuada', timestamp: eventTime4.toISOString(), details: `Realizou a assinatura com validade jurídica\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Operação concluída', timestamp: eventTime4.toISOString(), details: `Operação concluída\nIP: ${ip}\nGEO: ${geo}` },
        ]
    };
};

const createApproverSignatureParticipant = (approver: Funcionario, period: PeriodoAquisitivo): ParticipanteAssinatura => {
    const now = new Date();
    const requesterSignatureTime = period.signatureInfo?.participants?.[0]?.conclusionTime;
    const notificationTime = requesterSignatureTime ? new Date(new Date(requesterSignatureTime).getTime() + 10 * 60000) : now;

    const eventTime2 = new Date(now.getTime() - 2 * 60000);
    const eventTime3 = new Date(now.getTime() - 1 * 60000);
    const eventTime4 = new Date(now.getTime() - 30000);

    const ip = approver.role === 'manager' ? '192.168.1.10' : '201.150.30.5';
    const geo = approver.role === 'manager' ? '-22.9092471-47.0376365' : '-22.8785328-47.0376365';

    return {
        signer: approver,
        conclusionTime: now.toISOString(),
        ipAddress: ip,
        authenticationMethod: 'Não',
        device: 'Windows NT 10.0; Win64; x64',
        geolocation: 'Autorizado',
        events: [
            { name: 'Notificação enviada', timestamp: notificationTime.toISOString(), details: `Link de operação enviado para ${approver.email}` },
            { name: 'Operação visualizada', timestamp: eventTime2.toISOString(), details: `Acessou o link da operação\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Termos da assinatura eletrônica', timestamp: eventTime3.toISOString(), details: `Aceitou os termos da assinatura eletrônica\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Assinatura efetuada', timestamp: eventTime4.toISOString(), details: `Realizou a assinatura com validade jurídica\nIP: ${ip}\nGEO: ${geo}` },
            { name: 'Operação concluída', timestamp: eventTime4.toISOString(), details: `Operação concluída\nIP: ${ip}\nGEO: ${geo}` },
        ]
    };
};


function App() {
  const [currentUser, setCurrentUser] = useState<Funcionario | null>(null);
  const [allEmployees, setAllEmployees] = useState<Funcionario[]>(MOCK_EMPLOYEES);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [holidays, setHolidays] = useState<FeriadoEmpresa[]>(MOCK_HOLIDAYS);
  const [config, setConfig] = useState<ConfiguracaoApp>(MOCK_CONFIG);
  const [collectiveVacationRules, setCollectiveVacationRules] = useState<RegraFeriasColetivas[]>(MOCK_COLLECTIVE_VACATION_RULES);
  const [orgUnits, setOrgUnits] = useState<UnidadeOrganizacional[]>(MOCK_ORG_UNITS);
  const [hierarchyLevels, setHierarchyLevels] = useState<NivelHierarquico[]>(MOCK_HIERARCHY_LEVELS);

  // New states for organizational data
  const [companyUnits, setCompanyUnits] = useState<string[]>(() => [...new Set(MOCK_EMPLOYEES.map(e => e.unidade))].sort());
  const [holidayTypes, setHolidayTypes] = useState<string[]>(['feriado', 'ponto_facultativo', 'recesso']);


  const login = useCallback((email: string, cpf: string): boolean => {
    const user = allEmployees.find(
      (emp) => emp.email.toLowerCase() === email.toLowerCase() && emp.cpf === cpf && emp.status === 'active'
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, [allEmployees]);

  const logout = useCallback(() => {
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


  const updateEmployee = useCallback((updatedEmployee: Funcionario) => {
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
  }, [currentUser, allEmployees, addNotification]);

  const addEmployee = useCallback((employeeData: NovosDadosFuncionario) => {
    const newEmployee: Funcionario = {
      ...employeeData,
      id: Date.now(), // Simple unique ID for mock purposes
      status: 'active',
      periodosAquisitivos: [],
      afastamentos: [],
    };
    setAllEmployees(prev => [...prev, newEmployee]);
  }, []);

  const deleteEmployee = useCallback((employeeId: number) => {
    setAllEmployees(prev => prev.filter(emp => emp.id !== employeeId));
  }, []);

  const toggleEmployeeStatus = useCallback((employeeId: number) => {
    setAllEmployees(prev =>
      prev.map(emp =>
        emp.id === employeeId
          ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' }
          : emp
      )
    );
  }, []);


  const addHoliday = useCallback((holidayData: NovoFeriadoEmpresa) => {
    const newHoliday: FeriadoEmpresa = {
      ...holidayData,
      id: `h-${Date.now()}`,
    };
    setHolidays(prev => [...prev, newHoliday].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()));
  }, []);

  const updateHoliday = useCallback((updatedHoliday: FeriadoEmpresa) => {
    setHolidays(prev => 
      prev
        .map(h => h.id === updatedHoliday.id ? updatedHoliday : h)
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    );
  }, []);

  const deleteHoliday = useCallback((holidayId: string) => {
    setHolidays(prev => prev.filter(h => h.id !== holidayId));
  }, []);

  const addCollectiveVacationRule = useCallback((ruleData: NovaRegraFeriasColetivas) => {
    const newRule: RegraFeriasColetivas = {
      ...ruleData,
      id: `cv-${Date.now()}`,
    };
    setCollectiveVacationRules(prev => [...prev, newRule]);
  }, []);

  const updateCollectiveVacationRule = useCallback((updatedRule: RegraFeriasColetivas) => {
    setCollectiveVacationRules(prev =>
      prev.map(rule => (rule.id === updatedRule.id ? updatedRule : rule))
    );
  }, []);

  const deleteCollectiveVacationRule = useCallback((ruleId: string) => {
    setCollectiveVacationRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  const updateConfig = useCallback((newConfig: ConfiguracaoApp) => {
    setConfig(newConfig);
  }, []);

  const markNotificationsAsRead = useCallback(() => {
    if (currentUser) {
        setNotifications(prev =>
            prev.map(n => (n.userId === currentUser.id ? { ...n, read: true } : n))
        );
    }
  }, [currentUser]);

  const addAccrualPeriodsByDueDate = useCallback(async (dueDateLimit: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        if (!dueDateLimit) {
            reject(new Error("Por favor, informe uma data limite."));
            return;
        }
        // Simulate async operation
        setTimeout(() => {
            try {
                const limitDateObj = new Date(`${dueDateLimit}T12:00:00Z`);
                if (isNaN(limitDateObj.getTime())) {
                    reject(new Error("A data limite informada é inválida."));
                    return;
                }
                let employeesUpdatedCount = 0;
                
                const updatedEmployees = allEmployees.map(emp => {
                    if (emp.periodosAquisitivos.length === 0) {
                        return emp; // Skip employees with no periods
                    }
            
                    const lastPeriod = emp.periodosAquisitivos[emp.periodosAquisitivos.length - 1];
                    const lastPeriodEndDate = new Date(`${lastPeriod.terminoPa}T12:00:00Z`);
            
                    if (lastPeriodEndDate <= limitDateObj) {
                        const newStartDate = new Date(lastPeriodEndDate);
                        newStartDate.setUTCDate(newStartDate.getUTCDate() + 1);
            
                        const newEndDate = new Date(newStartDate);
                        newEndDate.setUTCFullYear(newEndDate.getUTCFullYear() + 1);
                        newEndDate.setUTCDate(newEndDate.getUTCDate() - 1);
            
                        const newStartDateStr = newStartDate.toISOString().split('T')[0];
                        const newEndDateStr = newEndDate.toISOString().split('T')[0];
                        
                        const newPeriodId = `${newStartDate.getUTCFullYear()}-${newEndDate.getUTCFullYear()}`;
            
                        const periodExists = emp.periodosAquisitivos.some(p => p.id === newPeriodId);
                        if (!periodExists) {
                            employeesUpdatedCount++;
                            
                            const limitConcessaoDate = new Date(newEndDate);
                            limitConcessaoDate.setUTCDate(limitConcessaoDate.getUTCDate() + config.prazoLimiteConcessaoDias);
                            
                            const newPeriod: PeriodoAquisitivo = {
                                id: newPeriodId,
                                inicioPa: newStartDateStr,
                                terminoPa: newEndDateStr,
                                limiteConcessao: limitConcessaoDate.toISOString().split('T')[0],
                                saldoTotal: 30,
                                status: 'planning',
                                fracionamentos: [],
                                vacationDaysInputType: 'system',
                                abonoCalculationBasis: 'system',
                            };
                            return { ...emp, periodosAquisitivos: [...emp.periodosAquisitivos, newPeriod] };
                        }
                    }
                    return emp;
                });
            
                setAllEmployees(updatedEmployees);
                resolve(employeesUpdatedCount);
            } catch (error) {
                reject(new Error("Ocorreu um erro inesperado ao processar os períodos."));
            }
        }, 1500);
    });
}, [allEmployees, config]);


  const addAccrualPeriodToEmployee = useCallback((employeeId: number, newPeriodData: Omit<PeriodoAquisitivo, 'fracionamentos' | 'saldoTotal'>) => {
      setAllEmployees(prev => prev.map(emp => {
          if (emp.id === employeeId) {
              const periodExists = emp.periodosAquisitivos.some(p => p.id === newPeriodData.id);
              if (periodExists) {
                  // This should be handled in UI, but as a safeguard:
                  console.error(`Erro: O colaborador já possui o período aquisitivo ${newPeriodData.id}.`);
                  return emp;
              }
              const newPeriod: PeriodoAquisitivo = {
                  ...newPeriodData,
                  saldoTotal: 30,
                  fracionamentos: [],
              };
              return { ...emp, periodosAquisitivos: [...emp.periodosAquisitivos, newPeriod].sort((a, b) => new Date(a.inicioPa).getTime() - new Date(b.inicioPa).getTime()) };
          }
          return emp;
      }));
  }, []);
  
  const updateAccrualPeriod = useCallback((employeeId: number, periodId: string, newPeriodData: Partial<Omit<PeriodoAquisitivo, 'id' | 'fracionamentos' | 'saldoTotal'>>) => {
    setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
            const updatedPeriods = emp.periodosAquisitivos.map(p => {
                if (p.id === periodId) {
                    return { ...p, ...newPeriodData };
                }
                return p;
            });
            updatedPeriods.sort((a, b) => new Date(a.inicioPa).getTime() - new Date(b.inicioPa).getTime());
            return { ...emp, periodosAquisitivos: updatedPeriods };
        }
        return emp;
    }));
}, []);

const deleteAccrualPeriod = useCallback((employeeId: number, periodId: string) => {
    setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
            const updatedPeriods = emp.periodosAquisitivos.filter(p => p.id !== periodId);
            return { ...emp, periodosAquisitivos: updatedPeriods };
        }
        return emp;
    }));
}, []);

const addDirectVacation = useCallback((employeeId: number, periodId: string, vacationData: Omit<PeriodoDeFerias, 'id' | 'status' | 'sequencia'>) => {
    setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
            const updatedPeriods = emp.periodosAquisitivos.map(p => {
                if (p.id === periodId) {
                    const newVacation: PeriodoDeFerias = {
                        ...vacationData,
                        id: `direct-${Date.now()}`,
                        status: 'scheduled',
                        sequencia: 1, // Placeholder, will be recalculated
                    };
                    const updatedFractions = [...p.fracionamentos, newVacation]
                        .sort((a,b) => new Date(a.inicioFerias).getTime() - new Date(b.inicioFerias).getTime())
                        .map((frac, index) => ({...frac, sequencia: (index + 1) as 1 | 2 | 3}));

                    let newSignatureInfo = p.signatureInfo;
                    let managerId = p.managerApproverId;
                    let hrId = p.hrApproverId;
                    
                    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'rh')) {
                        const employeeSignature = createInitialSignatureParticipant(emp); 
                        
                        const tempPeriodForSignature = { 
                            ...p, 
                            signatureInfo: { participants: [employeeSignature] } 
                        } as PeriodoAquisitivo;

                        const adminSignature = createApproverSignatureParticipant(currentUser, tempPeriodForSignature);
                        
                        newSignatureInfo = {
                            documentId: `doc-direct-${Date.now()}`,
                            operationId: `${Math.floor(1000000 + Math.random() * 9000000)}`,
                            participants: [employeeSignature, adminSignature],
                        };

                        managerId = currentUser.id;
                        hrId = currentUser.id;
                    }

                    return { 
                        ...p, 
                        fracionamentos: updatedFractions, 
                        status: 'scheduled' as PeriodoAquisitivo['status'],
                        signatureInfo: newSignatureInfo,
                        managerApproverId: managerId,
                        hrApproverId: hrId
                    };
                }
                return p;
            });
            return { ...emp, periodosAquisitivos: updatedPeriods };
        }
        return emp;
    }));
}, [currentUser]);

const updateVacationPeriod = useCallback((
    employeeId: number, 
    periodId: string, 
    vacationId: string, 
    updatedData: Partial<PeriodoDeFerias>
) => {
    setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
            const updatedPeriods = emp.periodosAquisitivos.map(p => {
                if (p.id === periodId) {
                    let updatedFractions = p.fracionamentos.map(f => {
                        if (f.id === vacationId) {
                            const newFraction = { ...f, ...updatedData };
                            // Recalculate end date if start date or days change
                            if (updatedData.inicioFerias || updatedData.quantidadeDias) {
                                const date = new Date(`${newFraction.inicioFerias}T12:00:00Z`);
                                date.setUTCDate(date.getUTCDate() + newFraction.quantidadeDias - 1);
                                newFraction.terminoFerias = date.toISOString().split('T')[0];
                            }
                            return newFraction;
                        }
                        return f;
                    });

                    // Always re-sort and re-sequence for consistency
                    updatedFractions.sort((a, b) => new Date(a.inicioFerias).getTime() - new Date(b.inicioFerias).getTime());
                    const resequencedFractions = updatedFractions.map((frac, index) => ({ ...frac, sequencia: (index + 1) as 1 | 2 | 3 }));

                    let newStatus = p.status;
                    // Only automatically update parent status if it's in a non-workflow state.
                    // Workflow states ('pending_manager', 'pending_rh', 'rejected') are managed by the approval process.
                    if (p.status === 'planning' || p.status === 'scheduled') {
                        const hasValidFractions = resequencedFractions.some(f => f.status !== 'canceled' && f.status !== 'rejected');
                        newStatus = hasValidFractions ? 'scheduled' : 'planning';
                    }

                    return { ...p, fracionamentos: resequencedFractions, status: newStatus };
                }
                return p;
            });
            return { ...emp, periodosAquisitivos: updatedPeriods };
        }
        return emp;
    }));
}, []);

const deleteVacation = useCallback((employeeId: number, periodId: string, vacationId: string) => {
    setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
            const updatedPeriods = emp.periodosAquisitivos.map(p => {
                if (p.id === periodId) {
                    const updatedFractions = p.fracionamentos
                        .filter(f => f.id !== vacationId)
                        .sort((a, b) => new Date(a.inicioFerias).getTime() - new Date(b.inicioFerias).getTime())
                        .map((frac, index) => ({ ...frac, sequencia: (index + 1) as 1 | 2 | 3 }));
                    
                    let newStatus = p.status;
                    if (p.status === 'planning' || p.status === 'scheduled') {
                        const hasValidFractions = updatedFractions.some(f => f.status !== 'canceled' && f.status !== 'rejected');
                        newStatus = hasValidFractions ? 'scheduled' : 'planning';
                    }

                    return { ...p, fracionamentos: updatedFractions, status: newStatus };
                }
                return p;
            });
            return { ...emp, periodosAquisitivos: updatedPeriods };
        }
        return emp;
    }));
}, []);

const addCollectiveVacation = useCallback(async (
    proposals: CollectiveVacationProposal[]
  ): Promise<{ success: boolean; message: string; details?: string[] }> => {
    
    return new Promise((resolve) => {
      setTimeout(() => { // Simulate async
        let updatedCount = 0;
        let errors: string[] = [];

        const updatedEmployees = allEmployees.map(emp => {
            const proposal = proposals.find(p => p.employeeId === emp.id);
            if (!proposal) return emp;

            // Find the most appropriate accrual period to deduct from
            const availablePeriods = emp.periodosAquisitivos
                .map(p => ({
                    ...p,
                    remainingDays: p.saldoTotal - p.fracionamentos
                        .filter(f => f.status !== 'canceled' && f.status !== 'rejected')
                        .reduce((sum, frac) => sum + frac.quantidadeDias + (frac.diasAbono || 0), 0)
                }))
                .filter(p => new Date(p.limiteConcessao) > new Date())
                .sort((a, b) => new Date(a.limiteConcessao).getTime() - new Date(b.limiteConcessao).getTime());
            
            let daysToSchedule = proposal.days;
            
            // CRITICAL FIX FOR BUG-01: 
            // We need to maintain the correct cursor date across multiple periods for a single employee.
            let currentCursorDate = new Date(`${proposal.startDate}T12:00:00Z`);

            let updatedPeriods = [...emp.periodosAquisitivos];
            let successfullyScheduled = false;

            for (const period of availablePeriods) {
                if (daysToSchedule <= 0) break;

                const daysFromThisPeriod = Math.min(daysToSchedule, period.remainingDays);
                if (daysFromThisPeriod > 0) {
                    const startDateForFractionStr = currentCursorDate.toISOString().split('T')[0];

                    const endDateForFraction = new Date(currentCursorDate);
                    endDateForFraction.setUTCDate(endDateForFraction.getUTCDate() + daysFromThisPeriod - 1);
                    const endDateStr = endDateForFraction.toISOString().split('T')[0];

                     const vacationData: PeriodoDeFerias = {
                        id: `coll-${Date.now()}-${Math.random()}`,
                        sequencia: 1, // placeholder
                        inicioFerias: startDateForFractionStr,
                        terminoFerias: endDateStr,
                        quantidadeDias: daysFromThisPeriod,
                        diasAbono: 0,
                        adiantamento13: false,
                        status: 'scheduled',
                    };
                    
                    const periodIndex = updatedPeriods.findIndex(p => p.id === period.id);
                    if (periodIndex !== -1) {
                         const existingFractions = updatedPeriods[periodIndex].fracionamentos;
                         updatedPeriods[periodIndex] = {
                            ...updatedPeriods[periodIndex],
                            status: 'scheduled',
                            fracionamentos: [...existingFractions, vacationData]
                                .sort((a,b) => new Date(a.inicioFerias).getTime() - new Date(b.inicioFerias).getTime())
                                .map((frac, index) => ({...frac, sequencia: (index + 1) as 1|2|3})),
                         }
                    }

                    daysToSchedule -= daysFromThisPeriod;
                    successfullyScheduled = true;
                    
                    // Advance the cursor date to the day AFTER the current fraction ends,
                    // so the next fraction (if any) starts correctly.
                    currentCursorDate.setUTCDate(currentCursorDate.getUTCDate() + daysFromThisPeriod);
                }
            }
            
            if (daysToSchedule > 0) {
                errors.push(`${emp.nome} (Saldo insuficiente: faltam ${daysToSchedule} dias)`);
                return emp; // Return original employee state on failure
            }
            
            if (successfullyScheduled) {
                updatedCount++;
                return { ...emp, periodosAquisitivos: updatedPeriods };
            }

            return emp;
        });
        
        setAllEmployees(updatedEmployees);

        if (errors.length > 0) {
            resolve({ 
                success: false, 
                message: `Operação parcialmente concluída. ${updatedCount} colaborador(es) agendados.`,
                details: errors 
            });
        } else {
            resolve({ success: true, message: `Férias coletivas lançadas para ${updatedCount} colaborador(es) com sucesso.` });
        }
      }, 1000);
    });
}, [allEmployees]);

const addLeaveToEmployee = useCallback((employeeId: number, leaveData: Omit<Afastamento, 'id'>) => {
    setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
            const newLeave: Afastamento = {
                ...leaveData,
                id: `leave-${Date.now()}`
            };
            return {
                ...emp,
                afastamentos: [...emp.afastamentos, newLeave].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            };
        }
        return emp;
    }));
}, []);

const updateLeave = useCallback((employeeId: number, leaveId: string, updatedLeaveData: Omit<Afastamento, 'id'>) => {
    setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
            return {
                ...emp,
                afastamentos: emp.afastamentos
                    .map(l => l.id === leaveId ? { id: leaveId, ...updatedLeaveData } : l)
                    .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            };
        }
        return emp;
    }));
}, []);

const deleteLeave = useCallback((employeeId: number, leaveId: string) => {
    setAllEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
            return {
                ...emp,
                afastamentos: emp.afastamentos.filter(l => l.id !== leaveId)
            };
        }
        return emp;
    }));
}, []);
  
  const authContextValue = useMemo(() => {
    const activeEmployees = allEmployees.filter(e => e.status === 'active');
    const companyAreas = [...new Set(activeEmployees.map(e => e.departamento))].sort();
    const companyManagements = [...new Set(activeEmployees.map(e => e.area))].sort();
    
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

  if (!config) {
    return <div>Carregando configuração...</div>;
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