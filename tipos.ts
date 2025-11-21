

export type PapelUsuario = 'user' | 'admin' | 'manager' | 'rh';

export interface EventoAssinatura {
  name: 'Notificação enviada' | 'Operação visualizada' | 'Termos da assinatura eletrônica' | 'Assinatura efetuada' | 'Operação concluída';
  timestamp: string;
  detalhes: string;
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
  id: number;
  type: 'licenca_medica' | 'licenca_maternidade' | 'outro';
  dataInicio: string;
  dataFim: string;
  descricao: string;
}

// Interfaces base para evitar dependência circular direta
export interface FuncionarioBase {
  id: number;
  matricula: string;
  nome: string;
  dataAdmissao: string;
  cargo: string;
  departamento: string;
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
  assinante: FuncionarioBase; // Usa a base para evitar ciclo
  dataConclusao: string | null;
  enderecoIP: string;
  metodoAutenticacao: string;
  dispositivo: string;
  geolocalizacao: string;
  eventos: EventoAssinatura[];
}

export interface InformacaoAssinatura {
  documentId: string;
  operationId: string;
  participantes: ParticipanteAssinatura[];
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
  tipoEntradaDiasFerias: 'system' | 'list' | 'input';
  baseCalculoAbono: 'system' | 'initial_balance' | 'current_balance';
  idAprovadorGestor?: number;
  idAprovadorRH?: number;
  infoAssinatura?: InformacaoAssinatura;
}

// Funcionario completo estende a base e adiciona a propriedade complexa
export interface Funcionario extends FuncionarioBase {
  periodosAquisitivos: PeriodoAquisitivo[];
}

export type NovosDadosFuncionario = Omit<Funcionario, 'id' | 'periodosAquisitivos' | 'afastamentos'>;

export interface UnidadeOrganizacional {
  id: number;
  nome: string;
  tipo: 'Área';
  idPai: number | null;
}

export interface NivelHierarquico {
  id: number;
  nivel: number;
  descricao: string;
}

export interface FeriadoEmpresa {
  id: number;
  ano: number;
  descricao: string;
  data: string;
  tipo: 'feriado' | 'ponto_facultativo' | 'recesso' | string;
  unidade?: string;
}

export type NovoFeriadoEmpresa = Omit<FeriadoEmpresa, 'id'>;

export interface RegraFeriasColetivas {
  id: number;
  descricao: string;
  inicio: string;
  fim: string;
  unidade?: string;

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
  tipoEntradaDiasFerias: 'list' | 'input';
  baseCalculoAbono: 'initial_balance' | 'current_balance';
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
  exibirLimitePrazo: string | null;
  statusFerias: StatusFeriasConfig[];
}

export interface Notificacao {
  id: number;
  userId: number;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}


