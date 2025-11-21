
import { Funcionario, FeriadoEmpresa, ConfiguracaoApp, PeriodoDeFerias, RegraFeriasColetivas, UnidadeOrganizacional, PapelUsuario, PeriodoAquisitivo, NivelHierarquico, StatusFeriasConfig } from './tipos';

export const MOCK_HIERARCHY_LEVELS: NivelHierarquico[] = [
    { id: 1, level: 1, description: 'Operacional/Técnico' },
    { id: 2, level: 2, description: 'Coordenador' },
    { id: 3, level: 3, description: 'Supervisor' },
    { id: 4, level: 4, description: 'Gerente' },
    { id: 5, level: 5, description: 'Superintendente Executivo' },
    { id: 6, level: 6, description: 'Vice-Presidente' },
    { id: 7, level: 7, description: 'Presidente' },
];

export const MOCK_EMPLOYEES: Funcionario[] = [
  {
    id: 1,
    matricula: '100524',
    nome: 'Ana Silva',
    dataAdmissao: '2022-05-10',
    cargo: 'Analista de RH Pleno',
    departamento: 'Recursos Humanos',
    area: 'Recursos Humanos',
    unidade: 'Matriz - São Paulo',
    gestor: 4,
    email: 'ana.silva@empresa.com',
    cpf: '11122233344',
    role: 'user',
    status: 'active',
    nivelHierarquico: 1,
    afastamentos: [],
    periodosAquisitivos: [
      {
        id: '2022-2023',
        inicioPa: '2022-05-10',
        terminoPa: '2023-05-09',
        limiteConcessao: '2024-05-08',
        saldoTotal: 30,
        status: 'scheduled',
        managerApproverId: 4,
        hrApproverId: 3,
        vacationDaysInputType: 'system',
        abonoCalculationBasis: 'system',
        fracionamentos: [
           {
            id: 'frac-ana-3',
            sequencia: 1,
            inicioFerias: '2024-09-01',
            terminoFerias: '2024-09-30',
            quantidadeDias: 30,
            diasAbono: 0,
            adiantamento13: true,
            status: 'scheduled',
          }
        ],
      },
      {
        id: '2023-2024',
        inicioPa: '2023-05-10',
        terminoPa: '2024-05-09',
        limiteConcessao: '2025-05-08',
        saldoTotal: 30,
        status: 'scheduled',
        managerApproverId: 4,
        hrApproverId: 3,
        vacationDaysInputType: 'system',
        abonoCalculationBasis: 'system',
        fracionamentos: [
           {
            id: 'frac-ana-2',
            sequencia: 1,
            inicioFerias: '2025-01-10',
            terminoFerias: '2025-01-29',
            quantidadeDias: 20,
            diasAbono: 10,
            adiantamento13: false,
            status: 'scheduled',
          },
          {
            id: 'frac-ana-4',
            sequencia: 2,
            inicioFerias: '2025-02-01',
            terminoFerias: '2025-02-10',
            quantidadeDias: 10,
            diasAbono: 10,
            adiantamento13: false,
            status: 'canceled',
          }
        ],
      },
       {
        id: '2024-2025',
        inicioPa: '2024-05-10',
        terminoPa: '2025-05-09',
        limiteConcessao: '2026-05-08',
        saldoTotal: 30,
        status: 'pending_manager',
        vacationDaysInputType: 'system',
        abonoCalculationBasis: 'system',
        fracionamentos: [
          {
            id: 'frac-ana-5',
            sequencia: 1,
            inicioFerias: '2025-06-15',
            terminoFerias: '2025-06-24',
            quantidadeDias: 10,
            diasAbono: 0,
            adiantamento13: true,
            status: 'planned',
          },
          {
            id: 'frac-ana-6',
            sequencia: 2,
            inicioFerias: '2025-07-01',
            terminoFerias: '2025-07-20',
            quantidadeDias: 20,
            diasAbono: 0,
            adiantamento13: false,
            status: 'planned',
          }
        ],
      },
    ],
  },
  {
    id: 2,
    matricula: '2002',
    nome: 'Bruno Costa',
    dataAdmissao: '2018-02-20',
    cargo: 'Gerente de Projetos',
    departamento: 'PMO',
    area: 'Tecnologia',
    unidade: 'São Paulo',
    gestor: 5,
    email: 'bruno.costa@empresa.com',
    cpf: '55566677788',
    role: 'admin',
    status: 'active',
    nivelHierarquico: 4,
    afastamentos: [],
    periodosAquisitivos: [
      {
        id: '2022-2023',
        inicioPa: '2022-02-20',
        terminoPa: '2023-02-19',
        limiteConcessao: '2024-02-18',
        saldoTotal: 30,
        status: 'scheduled',
        managerApproverId: 5,
        hrApproverId: 3,
        vacationDaysInputType: 'system',
        abonoCalculationBasis: 'system',
        fracionamentos: [
          {
            id: 'frac1',
            sequencia: 1,
            inicioFerias: '2024-01-02',
            terminoFerias: '2024-01-16',
            quantidadeDias: 15,
            diasAbono: 0,
            adiantamento13: true,
            status: 'scheduled',
          }
        ],
      },
       {
        id: '2023-2024',
        inicioPa: '2023-02-20',
        terminoPa: '2024-02-19',
        limiteConcessao: '2025-02-18',
        saldoTotal: 30,
        status: 'planning',
        vacationDaysInputType: 'system',
        abonoCalculationBasis: 'system',
        fracionamentos: [],
      },
      {
        id: '2024-2025',
        inicioPa: '2024-02-20',
        terminoPa: '2025-02-19',
        limiteConcessao: '2026-01-15',
        saldoTotal: 30,
        status: 'scheduled',
        managerApproverId: 5,
        hrApproverId: 3,
        vacationDaysInputType: 'system',
        abonoCalculationBasis: 'system',
        fracionamentos: [
            {
                id: 'frac-bruno-2',
                sequencia: 1,
                inicioFerias: '2025-11-03',
                terminoFerias: '2025-12-02',
                quantidadeDias: 30,
                diasAbono: 0,
                adiantamento13: false,
                status: 'scheduled',
            }
        ],
      },
    ],
  },
  {
    id: 3,
    matricula: '3003',
    nome: 'Carla Dias',
    dataAdmissao: '2019-11-01',
    cargo: 'Analista de RH',
    departamento: 'Recursos Humanos',
    area: 'Recursos Humanos',
    unidade: 'Rio de Janeiro',
    gestor: 6,
    email: 'carla.dias@empresa.com',
    cpf: '99988877766',
    role: 'rh',
    status: 'active',
    nivelHierarquico: 1,
    afastamentos: [],
    periodosAquisitivos: [
        {
            id: '2022-2023',
            inicioPa: '2022-11-01',
            terminoPa: '2023-10-31',
            limiteConcessao: '2024-10-30',
            saldoTotal: 30,
            status: 'planning',
            vacationDaysInputType: 'system',
            abonoCalculationBasis: 'system',
            fracionamentos: [],
        },
    ],
  },
  {
    id: 4,
    matricula: '4004',
    nome: 'Carlos Pereira',
    dataAdmissao: '2015-03-15',
    cargo: 'Coordenador de RH',
    departamento: 'Recursos Humanos',
    area: 'Recursos Humanos',
    unidade: 'Matriz - São Paulo',
    gestor: 6,
    email: 'carlos.pereira@empresa.com',
    cpf: '44455566677',
    role: 'manager',
    status: 'active',
    nivelHierarquico: 2,
    afastamentos: [],
    periodosAquisitivos: [],
  },
  {
    id: 5,
    matricula: '5005',
    nome: 'Marcia Lima',
    dataAdmissao: '2012-01-10',
    cargo: 'Diretora de Tecnologia',
    departamento: 'Tecnologia',
    area: 'Tecnologia',
    unidade: 'Matriz - São Paulo',
    gestor: null,
    email: 'marcia.lima@empresa.com',
    cpf: '12312312312',
    role: 'manager',
    status: 'active',
    nivelHierarquico: 5,
    afastamentos: [],
    periodosAquisitivos: [],
  },
  {
    id: 6,
    matricula: '6006',
    nome: 'Roberto Almeida',
    dataAdmissao: '2014-08-01',
    cargo: 'Gerente de RH',
    departamento: 'Recursos Humanos',
    area: 'Recursos Humanos',
    unidade: 'Rio de Janeiro',
    gestor: 5,
    email: 'roberto.almeida@empresa.com',
    cpf: '32132132132',
    role: 'manager',
    status: 'active',
    nivelHierarquico: 4,
    afastamentos: [],
    periodosAquisitivos: [],
  }
];

export const MOCK_ORG_UNITS: UnidadeOrganizacional[] = [
    { id: 'a_tech', name: 'Tecnologia', type: 'Área', parentId: null },
    { id: 'a_rh', name: 'Recursos Humanos', type: 'Área', parentId: null },
    { id: 'a_adm_pessoal', name: 'Administração de Pessoal', type: 'Área', parentId: 'a_rh' },
    { id: 'a_pmo', name: 'PMO', type: 'Área', parentId: 'a_tech' },
];

export const MOCK_HOLIDAYS: FeriadoEmpresa[] = [
    { id: 'h1', ano: 2024, descricao: 'Confraternização Universal', data: '2024-01-01', tipo: 'feriado' },
    { id: 'h2', ano: 2024, descricao: 'Carnaval', data: '2024-02-13', tipo: 'ponto_facultativo' },
    { id: 'h3', ano: 2024, descricao: 'Sexta-feira Santa', data: '2024-03-29', tipo: 'feriado' },
    { id: 'h4', ano: 2024, descricao: 'Tiradentes', data: '2024-04-21', tipo: 'feriado' },
    { id: 'h5', ano: 2024, descricao: 'Dia do Trabalho', data: '2024-05-01', tipo: 'feriado' },
    { id: 'h6', ano: 2024, descricao: 'Corpus Christi', data: '2024-05-30', tipo: 'ponto_facultativo' },
    { id: 'h7', ano: 2024, descricao: 'Independência do Brasil', data: '2024-09-07', tipo: 'feriado' },
    { id: 'h8', ano: 2024, descricao: 'Nossa Senhora Aparecida', data: '2024-10-12', tipo: 'feriado' },
    { id: 'h9', ano: 2024, descricao: 'Finados', data: '2024-11-02', tipo: 'feriado' },
    { id: 'h10', ano: 2024, descricao: 'Proclamação da República', data: '2024-11-15', tipo: 'feriado' },
    { id: 'h11', ano: 2024, descricao: 'Natal', data: '2024-12-25', tipo: 'feriado' },
    { id: 'h12', ano: 2025, descricao: 'Aniversário de São Paulo', data: '2025-01-25', tipo: 'feriado', unidade: 'Matriz - São Paulo' },
    { id: 'h13', ano: 2025, descricao: 'Aniversário do Rio de Janeiro', data: '2025-03-01', tipo: 'feriado', unidade: 'Rio de Janeiro' },
    { id: 'h14', ano: 2025, descricao: 'Folga (Feriado)', data: '2025-11-10', tipo: 'feriado' },
];

export const MOCK_COLLECTIVE_VACATION_RULES: RegraFeriasColetivas[] = [
    {
        id: 'cv1',
        descricao: 'Férias Coletivas de Fim de Ano',
        inicio: '2024-12-23',
        fim: '2025-01-03',
        unidade: 'Matriz - São Paulo',
    },
    {
        id: 'cv2',
        descricao: 'Férias Coletivas Fim de Ano 2025',
        inicio: '2025-12-22',
        fim: '2025-12-31',
    },
];

// Updated to include all system statuses used in logic
export const DEFAULT_VACATION_STATUSES: StatusFeriasConfig[] = [
    // --- Status de Fluxo/Período (Workflow) ---
    { id: 'planning', label: 'Em planejamento', style: 'neutral', active: true, category: 'period', isSystem: true },
    { id: 'pending_manager', label: 'Aguardando Gestor', style: 'warning', active: true, category: 'period', isSystem: true },
    { id: 'pending_rh', label: 'Aguardando RH', style: 'warning', active: true, category: 'period', isSystem: true },
    { id: 'rejected', label: 'Rejeitado', style: 'danger', active: true, category: 'period', isSystem: true },
    
    // --- Status de Execução/Fração (Dates) ---
    { id: 'planned', label: 'Planejado', style: 'neutral', active: true, category: 'fraction', isSystem: true },
    { id: 'scheduled', label: 'Programado', style: 'success', active: true, category: 'both', isSystem: true },
    { id: 'enjoying', label: 'Em Gozo', style: 'info', active: true, category: 'fraction', isSystem: true },
    { id: 'enjoyed', label: 'Gozado', style: 'info', active: true, category: 'both', isSystem: true },
    { id: 'canceled', label: 'Cancelado', style: 'danger', active: true, category: 'fraction', isSystem: true },
];

export const MOCK_CONFIG: ConfiguracaoApp = {
    diasFeriasOptions: [5, 10, 15, 20, 30],
    vacationDaysInputType: 'list',
    abonoCalculationBasis: 'initial_balance',
    antecedenciaMinimaDias: 30,
    antecedenciaMinimaAbonoDias: 60,
    maxFracionamentos: 3,
    prazoLimiteConcessaoDias: 330,
    inicioAdiantamento13: '01/02',
    fimAdiantamento13: '31/10',
    periodoFeriasColetivas: {
      inicio: '2024-12-23',
      fim: '2025-01-03'
    },
    displayDueDateLimit: null,
    vacationStatuses: DEFAULT_VACATION_STATUSES,
};

export const getDynamicStatus = (vacation: PeriodoDeFerias): PeriodoDeFerias['status'] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(`${vacation.inicioFerias}T12:00:00Z`);
    const endDate = new Date(`${vacation.terminoFerias}T12:00:00Z`);

    const status = vacation.status;

    // Final states, don't change them.
    if (status === 'canceled' || status === 'enjoyed') {
        return status;
    }

    if (status === 'scheduled' || status === 'enjoying') {
        if (today > endDate) return 'enjoyed';
        if (today >= startDate && today <= endDate) return 'enjoying';
        if (today < startDate) return 'scheduled';
    }

    return status; 
};

export const getDynamicAccrualPeriodStatus = (period: PeriodoAquisitivo): PeriodoAquisitivo['status'] => {
    // Workflow states take precedence
    if (['pending_manager', 'pending_rh', 'rejected'].includes(period.status)) {
        return period.status;
    }

    const validFractions = period.fracionamentos.filter(
        f => f.status !== 'canceled' && f.status !== 'rejected'
    );

    if (validFractions.length === 0) {
        return 'planning';
    }
    
    const areAllEnjoyed = validFractions.every(f => getDynamicStatus(f) === 'enjoyed');

    if (areAllEnjoyed) {
        return 'enjoyed';
    }

    // If it has fractions but not all are enjoyed, it's considered scheduled/in progress.
    return 'scheduled';
};


export const getStatusText = (status: string, config?: ConfiguracaoApp) => {
    if (config && config.vacationStatuses) {
        const customStatus = config.vacationStatuses.find(s => s.id === status);
        if (customStatus) return customStatus.label;
    }

    const statusMap: Record<string, string> = {
        planned: 'Planejado',
        scheduled: 'Programado',
        pending_manager: 'Aguardando Gestor',
        pending_rh: 'Aguardando RH',
        enjoying: 'Em Gozo',
        enjoyed: 'Gozado',
        canceled: 'Cancelado',
        rejected: 'Rejeitado',
        planning: 'Em planejamento'
    };
    return statusMap[status] || 'Desconhecido';
};


export const getStatusBadge = (status: string, config?: ConfiguracaoApp) => {
    const baseClasses = 'px-2 py-0.5 text-xs font-semibold rounded-full';
    
    if (config && config.vacationStatuses) {
        const customStatus = config.vacationStatuses.find(s => s.id === status);
        if (customStatus) {
            switch (customStatus.style) {
                case 'success': return `${baseClasses} bg-success-light text-success-dark`;
                case 'warning': return `${baseClasses} bg-warning-light text-warning-dark`;
                case 'danger': return `${baseClasses} bg-danger-light text-danger-dark`;
                case 'info': return `${baseClasses} bg-info-light text-info-dark`;
                case 'neutral': return `${baseClasses} bg-slate-200 text-slate-700`;
                default: return `${baseClasses} bg-gray-100 text-gray-800`;
            }
        }
    }

    switch (status) {
        case 'scheduled':
            return `${baseClasses} bg-success-light text-success-dark`;
        case 'pending_manager':
        case 'pending_rh':
            return `${baseClasses} bg-warning-light text-warning-dark`;
        case 'enjoying':
            return `${baseClasses} bg-blue-25 text-blue-500`;
        case 'enjoyed':
            return `${baseClasses} bg-info-light text-info-dark`;
        case 'canceled':
        case 'rejected':
            return `${baseClasses} bg-danger-light text-danger-dark`;
        case 'planning':
        case 'planned':
            return `${baseClasses} bg-slate-200 text-slate-700`;
        default:
            return `${baseClasses} bg-gray-100 text-gray-800`;
    }
};

export const getRoleText = (role: PapelUsuario): string => {
    switch (role) {
        case 'admin': return 'Administrador';
        case 'manager': return 'Gestor';
        case 'user': return 'Usuário';
        case 'rh': return 'RH';
        default: return 'Indefinido';
    }
};

export const getDescendantUnitIds = (parentId: string, allUnits: UnidadeOrganizacional[]): string[] => {
    const children = allUnits.filter(u => u.parentId === parentId);
    if (children.length === 0) {
        return [];
    }
    const descendantIds = children.map(c => c.id);
    children.forEach(c => {
        descendantIds.push(...getDescendantUnitIds(c.id, allUnits));
    });
    return descendantIds;
};

const getIsSuperiorInArea = (potentialSuperior: Funcionario, subordinate: Funcionario, orgUnits: UnidadeOrganizacional[]): boolean => {
    const subordinateArea = orgUnits.find(u => u.name === subordinate.departamento && u.type === 'Área');
    if (!subordinateArea) return false;

    let currentAreaId = subordinateArea.parentId;
    while(currentAreaId) {
        const parentArea = orgUnits.find(u => u.id === currentAreaId);
        if (!parentArea) break;
        if(parentArea.name === potentialSuperior.departamento) return true;
        currentAreaId = parentArea.parentId;
    }
    return false;
}

export const canApprove = (approver: Funcionario, requester: Funcionario, status: PeriodoAquisitivo['status'], orgUnits: UnidadeOrganizacional[]): boolean => {
    if (!approver || !requester) return false;

    if (status === 'pending_manager') {
        const hasApprovalRole = ['manager', 'rh', 'admin'].includes(approver.role);
        const isHigherLevel = approver.nivelHierarquico > requester.nivelHierarquico;
        
        const isManagerOfArea = approver.departamento === requester.departamento;
        const isManagerOfSuperiorArea = getIsSuperiorInArea(approver, requester, orgUnits);

        return hasApprovalRole && isHigherLevel && (isManagerOfArea || isManagerOfSuperiorArea);
    }

    if (status === 'pending_rh') {
        const hasApprovalRole = ['rh', 'admin'].includes(approver.role);
        const isHighEnoughLevel = approver.nivelHierarquico >= 2;
        const isInRhDepartment = approver.departamento === 'Recursos Humanos';
        return hasApprovalRole && isHighEnoughLevel && isInRhDepartment;
    }

    return false;
};
