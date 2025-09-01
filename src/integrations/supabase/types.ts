export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agenda_servicos: {
        Row: {
          cliente_id: string | null
          data_hora: string | null
          empresa_id: string | null
          google_id: string | null
          id: string
          observacao: string | null
          servico: string | null
          usuario_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          data_hora?: string | null
          empresa_id?: string | null
          google_id?: string | null
          id?: string
          observacao?: string | null
          servico?: string | null
          usuario_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          data_hora?: string | null
          empresa_id?: string | null
          google_id?: string | null
          id?: string
          observacao?: string | null
          servico?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_servicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_servicos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          data_cadastro: string | null
          email: string | null
          empresa_id: string | null
          endereco: string | null
          fase_crm: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          valor_estimado: number | null
        }
        Insert: {
          data_cadastro?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          fase_crm?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          valor_estimado?: number | null
        }
        Update: {
          data_cadastro?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          fase_crm?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          data_assinatura: string | null
          empresa_id: string | null
          id: string
          orcamento_id: string | null
          pdf_contrato: string | null
          status_assinatura: string | null
        }
        Insert: {
          data_assinatura?: string | null
          empresa_id?: string | null
          id?: string
          orcamento_id?: string | null
          pdf_contrato?: string | null
          status_assinatura?: string | null
        }
        Update: {
          data_assinatura?: string | null
          empresa_id?: string | null
          id?: string
          orcamento_id?: string | null
          pdf_contrato?: string | null
          status_assinatura?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnpj: string | null
          data_criacao: string | null
          email_admin: string
          id: string
          nome_fantasia: string
          plano: string | null
        }
        Insert: {
          cnpj?: string | null
          data_criacao?: string | null
          email_admin: string
          id?: string
          nome_fantasia: string
          plano?: string | null
        }
        Update: {
          cnpj?: string | null
          data_criacao?: string | null
          email_admin?: string
          id?: string
          nome_fantasia?: string
          plano?: string | null
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          contrato_id: string | null
          data_pagto: string | null
          data_venc: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          tipo: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          contrato_id?: string | null
          data_pagto?: string | null
          data_venc?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          tipo: string
          valor: number
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          contrato_id?: string | null
          data_pagto?: string | null
          data_venc?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_envio: {
        Row: {
          criado_em: string
          data_envio: string
          destinatario: string
          empresa_id: string
          enviado_por: string | null
          id: string
          mensagem_erro: string | null
          orcamento_id: string
          status: string
          tipo_envio: string
          updated_at: string
        }
        Insert: {
          criado_em?: string
          data_envio?: string
          destinatario: string
          empresa_id: string
          enviado_por?: string | null
          id?: string
          mensagem_erro?: string | null
          orcamento_id: string
          status?: string
          tipo_envio: string
          updated_at?: string
        }
        Update: {
          criado_em?: string
          data_envio?: string
          destinatario?: string
          empresa_id?: string
          enviado_por?: string | null
          id?: string
          mensagem_erro?: string | null
          orcamento_id?: string
          status?: string
          tipo_envio?: string
          updated_at?: string
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          cliente_id: string | null
          criado_em: string | null
          data_envio: string | null
          empresa_id: string | null
          id: string
          pdf_gerado: boolean | null
          servicos: Json | null
          status: string | null
          usuario_id: string | null
          valor_total: number | null
        }
        Insert: {
          cliente_id?: string | null
          criado_em?: string | null
          data_envio?: string | null
          empresa_id?: string | null
          id?: string
          pdf_gerado?: boolean | null
          servicos?: Json | null
          status?: string | null
          usuario_id?: string | null
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string | null
          criado_em?: string | null
          data_envio?: string | null
          empresa_id?: string | null
          id?: string
          pdf_gerado?: boolean | null
          servicos?: Json | null
          status?: string | null
          usuario_id?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          custo_encargos: number | null
          custo_mao_obra: number | null
          custo_produto: number | null
          descricao: string | null
          empresa_id: string | null
          id: string
          lucro_liquido: number | null
          markup_percent: number | null
          nome: string
          preco_venda: number | null
        }
        Insert: {
          custo_encargos?: number | null
          custo_mao_obra?: number | null
          custo_produto?: number | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          lucro_liquido?: number | null
          markup_percent?: number | null
          nome: string
          preco_venda?: number | null
        }
        Update: {
          custo_encargos?: number | null
          custo_mao_obra?: number | null
          custo_produto?: number | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          lucro_liquido?: number | null
          markup_percent?: number | null
          nome?: string
          preco_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          email: string
          empresa_id: string | null
          funcao: string | null
          id: string
          nome: string
          permissao: string | null
        }
        Insert: {
          ativo?: boolean | null
          email: string
          empresa_id?: string | null
          funcao?: string | null
          id?: string
          nome: string
          permissao?: string | null
        }
        Update: {
          ativo?: boolean | null
          email?: string
          empresa_id?: string | null
          funcao?: string | null
          id?: string
          nome?: string
          permissao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
