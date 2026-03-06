export type ProfessionType =
  | 'esteticista'
  | 'ozonoterapeuta'
  | 'podologa'
  | 'naturologa'
  | 'fisioterapeuta'
  | 'massoterapeuta'
  | 'spa'
  | 'reflexologista'
  | 'biomedica'
  | 'dentista'
  | 'terapeuta_capilar'
  | 'outro';

export const PROFESSION_LABELS: Record<ProfessionType, string> = {
  esteticista: 'Esteticista',
  ozonoterapeuta: 'Ozonoterapeuta',
  podologa: 'Podóloga',
  naturologa: 'Naturóloga',
  fisioterapeuta: 'Fisioterapeuta',
  massoterapeuta: 'Massoterapeuta',
  spa: 'Spa',
  reflexologista: 'Reflexologista',
  biomedica: 'Biomédica',
  dentista: 'Dentista',
  terapeuta_capilar: 'Terapeuta Capilar',
  outro: 'Outro',
};

export interface Professional {
  id: string;
  user_id: string;
  name: string;
  business_name: string | null;
  email: string;
  phone_whatsapp: string | null;
  profession_type: ProfessionType;
  avatar_url: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  professional_id: string;
  name: string;
  email: string | null;
  phone_whatsapp: string | null;
  birth_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      professionals: {
        Row: Professional;
        Insert: Omit<Professional, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Professional, 'id' | 'created_at' | 'updated_at'>>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profession_type: ProfessionType;
    };
  };
}
