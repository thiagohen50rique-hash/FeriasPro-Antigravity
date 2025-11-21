
export type PapelUsuario = 'user' | 'admin' | 'manager' | 'rh';

export interface EventoAssinatura {
  name: 'Notificação enviada' | 'Operação visualizada' | 'Termos da assinatura eletrônica' | 'Assinatura efetuada' | 'Operação concluída';
  timestamp: string;
  details: string;
}

export interface PeriodoDeFerias {
  id: number;
  sequencia: 1 | 2 | 3;
  inicioFerias: string;
  terminoFerias: string;
  quantidadeDias: number;
  diasAbono: number;
  adiantamento13: boolean;
  status: 'planned' | 'scheduled' | 'enjoying' | 'enjoyed' | 'canceled' | 'pending_manager' | 'pending_rh' | 'rejected';
}

export interface Afastamento {
  id: string;
  type: 'licenca_medica' | 'licenca_maternidade' | 'outro';
  startDate: string;
  endDate: string;
  description: string;
}

// Interfaces base para evitar dependência circular direta
export interface FuncionarioBase {
  id: number;
  matricula: string;
  nome: string;
  dataAdmissao: string;
  cargo: string;
  departamento: string;
  area: string;
  unidade: string;
  gestor: number | null;
  email: string;
  cpf: string;
  role: PapelUsuario;
  status: 'active' | 'inactive';
  nivelHierarquico: number;
  afastamentos: Afastamento[];
}

export interface ParticipanteAssinatura {
  signer: FuncionarioBase; // Usa a base para evitar ciclo
  conclusionTime: string | null;
  ipAddress: string;
  authenticationMethod: string;
  device: string;
  geolocation: string;
  events: EventoAssinatura[];
}

export interface InformacaoAssinatura {
  documentId: string;
  operationId: string;
  participants: ParticipanteAssinatura[];
}

export interface PeriodoAquisitivo {
  id: number;
  rotulo_periodo: string;
  inicioPa: string;
  terminoPa: string;
  limiteConcessao: string;
  saldoTotal: number;
  status: 'planning' | 'pending_manager' | 'pending_rh' | 'scheduled' | 'rejected' | 'enjoyed';
  fracionamentos: PeriodoDeFerias[];
  vacationDaysInputType: 'system' | 'list' | 'input';
  abonoCalculationBasis: 'system' | 'initial_balance' | 'current_balance';
  managerApproverId?: number;
  hrApproverId?: number;
  signatureInfo?: InformacaoAssinatura;
}

// Funcionario completo estende a base e adiciona a propriedade complexa
export interface Funcionario extends FuncionarioBase {
  periodosAquisitivos: PeriodoAquisitivo[];
}

export interface UnidadeOrganizacional {
  id: string;
  name: string;
  type: 'Área';
  parentId: string | null;
}

export interface NivelHierarquico {
  id: number;
  level: number;
  description: string;
}

export interface FeriadoEmpresa {
  id: string;
  ano: number;
  descricao: string;
  data: string;
  tipo: 'feriado' | 'ponto_facultativo' | 'recesso' | string;
  unidade?: string;
}

export type NovoFeriadoEmpresa = Omit<FeriadoEmpresa, 'id'>;

export interface RegraFeriasColetivas {
  id: string;
  descricao: string;
  inicio: string;
  fim: string;
  unidade?: string;
  area?: string; // Gerência
  departamento?: string; // Área
  colaboradorIds?: number[];
}

export type NovaRegraFeriasColetivas = Omit<RegraFeriasColetivas, 'id'>;

export interface StatusFeriasConfig {
    id: string;
    label: string;
    style: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    active: boolean;
    category: 'period' | 'fraction' | 'both'; // 'period' = Workflow status, 'fraction' = Execution status, 'both' = Shared
    isSystem: boolean; // If true, ID cannot be changed/deleted
}

export interface ConfiguracaoApp {
  diasFeriasOptions: number[];
  vacationDaysInputType: 'list' | 'input';
  abonoCalculationBasis: 'initial_balance' | 'current_balance';
  antecedenciaMinimaDias: number;
  antecedenciaMinimaAbonoDias: number;
  maxFracionamentos: number;
  prazoLimiteConcessaoDias: number;
  inicioAdiantamento13: string;
  fimAdiantamento13: string;
  periodoFeriasColetivas: {
    inicio: string;
    fim: string;
  } | null;
  displayDueDateLimit: string | null;
  vacationStatuses: StatusFeriasConfig[];
}

export interface Notificacao {
  id: string;
  userId: number;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}
