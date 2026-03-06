export type JourneyStage = 'lead' | 'agendado' | 'em_tratamento' | 'pos_tratamento' | 'cliente_fiel' | 'inativo';

export const JOURNEY_STAGES: { value: JourneyStage; label: string; color: string }[] = [
  { value: 'lead', label: 'Lead', color: '#94A3B8' },
  { value: 'agendado', label: 'Agendado', color: '#F4A623' },
  { value: 'em_tratamento', label: 'Em Tratamento', color: '#0D6E6E' },
  { value: 'pos_tratamento', label: 'Pós-Tratamento', color: '#6366F1' },
  { value: 'cliente_fiel', label: 'Cliente Fiel', color: '#10B981' },
  { value: 'inativo', label: 'Inativo', color: '#EF4444' },
];

export const STAGE_MAP = Object.fromEntries(JOURNEY_STAGES.map(s => [s.value, s])) as Record<JourneyStage, typeof JOURNEY_STAGES[0]>;

export type ClientSource = 'indicacao' | 'trafego_pago' | 'organico' | 'evento' | 'outros';

export const SOURCE_LABELS: Record<ClientSource, string> = {
  indicacao: 'Indicação',
  trafego_pago: 'Tráfego Pago',
  organico: 'Orgânico',
  evento: 'Evento',
  outros: 'Outros',
};

export type Gender = 'feminino' | 'masculino' | 'outro' | 'prefiro_nao_informar';

export const GENDER_LABELS: Record<Gender, string> = {
  feminino: 'Feminino',
  masculino: 'Masculino',
  outro: 'Outro',
  prefiro_nao_informar: 'Prefiro não informar',
};

export interface ClientRecord {
  id: string;
  professional_id: string;
  name: string;
  email: string | null;
  phone_whatsapp: string | null;
  birth_date: string | null;
  gender: Gender | null;
  cpf: string | null;
  avatar_url: string | null;
  journey_stage: JourneyStage;
  tags: string[];
  source: ClientSource | null;
  referred_by_client_id: string | null;
  first_complaint: string | null;
  notes: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientJourneyHistory {
  id: string;
  client_id: string;
  from_stage: JourneyStage | null;
  to_stage: JourneyStage;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
}

export interface ClientClinicalProfile {
  id: string;
  client_id: string;
  skin_type: string | null;
  main_complaints: string | null;
  allergies: string | null;
  contraindications: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientFamilyMember {
  id: string;
  client_id: string;
  name: string;
  relationship: string;
  birth_date: string | null;
  health_notes: string | null;
  created_at: string;
}

export interface SessionRecord {
  id: string;
  client_id: string;
  professional_id: string;
  service_name: string | null;
  service_revenue: number;
  product_revenue: number;
  session_date: string;
  notes: string | null;
  created_at: string;
}

export const SUGGESTED_TAGS = ['VIP', 'Indicadora', 'Produto Frequente', 'Tratamento Ativo', 'Retorno Pendente'];

export const RELATIONSHIP_OPTIONS = ['Cônjuge', 'Filho', 'Filha', 'Mãe', 'Pai', 'Irmão', 'Irmã', 'Outro'];
