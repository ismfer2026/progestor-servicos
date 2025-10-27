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
          documento: string | null
          email: string | null
          empresa_id: string | null
          endereco: Json | null
          fase_crm: string | null
          id: string
          nome: string
          observacoes: string | null
          servico_id: string | null
          tags: string[] | null
          telefone: string | null
          telefones: string[] | null
          tipo_pessoa: string | null
          valor_estimado: number | null
        }
        Insert: {
          data_cadastro?: string | null
          documento?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: Json | null
          fase_crm?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          servico_id?: string | null
          tags?: string[] | null
          telefone?: string | null
          telefones?: string[] | null
          tipo_pessoa?: string | null
          valor_estimado?: number | null
        }
        Update: {
          data_cadastro?: string | null
          documento?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: Json | null
          fase_crm?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          servico_id?: string | null
          tags?: string[] | null
          telefone?: string | null
          telefones?: string[] | null
          tipo_pessoa?: string | null
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
      colaboradores: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          empresa_id: string
          funcao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id: string
          funcao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          empresa_id?: string
          funcao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string | null
          descricao: string | null
          empresa_id: string
          id: string
          tipo: string | null
          updated_at: string | null
          valor: Json | null
        }
        Insert: {
          chave: string
          created_at?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          tipo?: string | null
          updated_at?: string | null
          valor?: Json | null
        }
        Update: {
          chave?: string
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          tipo?: string | null
          updated_at?: string | null
          valor?: Json | null
        }
        Relationships: []
      }
      contratos: {
        Row: {
          cliente_id: string | null
          data_assinatura: string | null
          data_fim: string | null
          data_inicio: string | null
          empresa_id: string | null
          id: string
          modelo_id: string | null
          modelo_url: string | null
          numero_contrato: string | null
          observacoes: string | null
          orcamento_id: string | null
          pdf_contrato: string | null
          status_assinatura: string | null
          titulo: string | null
          valor_total: number | null
        }
        Insert: {
          cliente_id?: string | null
          data_assinatura?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          empresa_id?: string | null
          id?: string
          modelo_id?: string | null
          modelo_url?: string | null
          numero_contrato?: string | null
          observacoes?: string | null
          orcamento_id?: string | null
          pdf_contrato?: string | null
          status_assinatura?: string | null
          titulo?: string | null
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string | null
          data_assinatura?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          empresa_id?: string | null
          id?: string
          modelo_id?: string | null
          modelo_url?: string | null
          numero_contrato?: string | null
          observacoes?: string | null
          orcamento_id?: string | null
          pdf_contrato?: string | null
          status_assinatura?: string | null
          titulo?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
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
          data_proximo_pagamento: string | null
          data_ultimo_pagamento: string | null
          email_admin: string
          id: string
          limite_usuarios: number | null
          nome_fantasia: string
          plano: string | null
          status_pagamento: string | null
        }
        Insert: {
          cnpj?: string | null
          data_criacao?: string | null
          data_proximo_pagamento?: string | null
          data_ultimo_pagamento?: string | null
          email_admin: string
          id?: string
          limite_usuarios?: number | null
          nome_fantasia: string
          plano?: string | null
          status_pagamento?: string | null
        }
        Update: {
          cnpj?: string | null
          data_criacao?: string | null
          data_proximo_pagamento?: string | null
          data_ultimo_pagamento?: string | null
          email_admin?: string
          id?: string
          limite_usuarios?: number | null
          nome_fantasia?: string
          plano?: string | null
          status_pagamento?: string | null
        }
        Relationships: []
      }
      estoque_historico: {
        Row: {
          contrato_id: string | null
          created_at: string | null
          data_hora: string | null
          detalhes: Json | null
          empresa_id: string
          id: string
          item_id: string
          manutencao_id: string | null
          motivo: string | null
          quantidade: number
          reserva_id: string | null
          tipo_movimentacao: string
          usuario_id: string
          valor_custo: number | null
          venda_id: string | null
        }
        Insert: {
          contrato_id?: string | null
          created_at?: string | null
          data_hora?: string | null
          detalhes?: Json | null
          empresa_id: string
          id?: string
          item_id: string
          manutencao_id?: string | null
          motivo?: string | null
          quantidade: number
          reserva_id?: string | null
          tipo_movimentacao: string
          usuario_id: string
          valor_custo?: number | null
          venda_id?: string | null
        }
        Update: {
          contrato_id?: string | null
          created_at?: string | null
          data_hora?: string | null
          detalhes?: Json | null
          empresa_id?: string
          id?: string
          item_id?: string
          manutencao_id?: string | null
          motivo?: string | null
          quantidade?: number
          reserva_id?: string | null
          tipo_movimentacao?: string
          usuario_id?: string
          valor_custo?: number | null
          venda_id?: string | null
        }
        Relationships: []
      }
      estoque_itens: {
        Row: {
          categoria: string | null
          created_at: string | null
          custo: number | null
          descricao: string | null
          dias_aviso_vencimento: number | null
          empresa_id: string
          id: string
          localizacao: string | null
          nome: string
          saldo: number | null
          saldo_minimo: number | null
          sku: string | null
          status: string | null
          tipo: string | null
          unidade: string | null
          updated_at: string | null
          validade: string | null
          venda: number | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          custo?: number | null
          descricao?: string | null
          dias_aviso_vencimento?: number | null
          empresa_id: string
          id?: string
          localizacao?: string | null
          nome: string
          saldo?: number | null
          saldo_minimo?: number | null
          sku?: string | null
          status?: string | null
          tipo?: string | null
          unidade?: string | null
          updated_at?: string | null
          validade?: string | null
          venda?: number | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          custo?: number | null
          descricao?: string | null
          dias_aviso_vencimento?: number | null
          empresa_id?: string
          id?: string
          localizacao?: string | null
          nome?: string
          saldo?: number | null
          saldo_minimo?: number | null
          sku?: string | null
          status?: string | null
          tipo?: string | null
          unidade?: string | null
          updated_at?: string | null
          validade?: string | null
          venda?: number | null
        }
        Relationships: []
      }
      estoque_manutencao: {
        Row: {
          created_at: string | null
          custo_manutencao: number | null
          data_entrada: string | null
          data_retorno: string | null
          defeito: string
          empresa_id: string
          id: string
          item_id: string
          observacoes: string | null
          previsao_retorno: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custo_manutencao?: number | null
          data_entrada?: string | null
          data_retorno?: string | null
          defeito: string
          empresa_id: string
          id?: string
          item_id: string
          observacoes?: string | null
          previsao_retorno?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custo_manutencao?: number | null
          data_entrada?: string | null
          data_retorno?: string | null
          defeito?: string
          empresa_id?: string
          id?: string
          item_id?: string
          observacoes?: string | null
          previsao_retorno?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      estoque_reservas: {
        Row: {
          created_at: string | null
          data_liberacao: string | null
          data_reserva: string
          empresa_id: string
          id: string
          item_id: string
          observacoes: string | null
          quantidade: number
          servico_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          data_liberacao?: string | null
          data_reserva: string
          empresa_id: string
          id?: string
          item_id: string
          observacoes?: string | null
          quantidade: number
          servico_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          data_liberacao?: string | null
          data_reserva?: string
          empresa_id?: string
          id?: string
          item_id?: string
          observacoes?: string | null
          quantidade?: number
          servico_id?: string | null
          status?: string | null
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
      financeiro_bancos: {
        Row: {
          agencia: string | null
          ativo: boolean | null
          codigo: string | null
          conta: string | null
          created_at: string | null
          empresa_id: string
          id: string
          nome: string
          saldo_inicial: number | null
          updated_at: string | null
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean | null
          codigo?: string | null
          conta?: string | null
          created_at?: string | null
          empresa_id: string
          id?: string
          nome: string
          saldo_inicial?: number | null
          updated_at?: string | null
        }
        Update: {
          agencia?: string | null
          ativo?: boolean | null
          codigo?: string | null
          conta?: string | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          saldo_inicial?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financeiro_categorias: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          empresa_id: string
          id: string
          nome: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          empresa_id: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financeiro_centros_custo: {
        Row: {
          ativo: boolean | null
          codigo: string | null
          created_at: string | null
          descricao: string | null
          empresa_id: string
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id: string
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financeiro_conciliacoes: {
        Row: {
          arquivo_ofx: string | null
          banco: string
          created_at: string | null
          data_fim: string
          data_inicio: string
          empresa_id: string
          id: string
          observacoes: string | null
          saldo_final: number
          saldo_inicial: number
          status: string
          total_entradas: number
          total_saidas: number
          updated_at: string | null
        }
        Insert: {
          arquivo_ofx?: string | null
          banco: string
          created_at?: string | null
          data_fim: string
          data_inicio: string
          empresa_id: string
          id?: string
          observacoes?: string | null
          saldo_final?: number
          saldo_inicial?: number
          status?: string
          total_entradas?: number
          total_saidas?: number
          updated_at?: string | null
        }
        Update: {
          arquivo_ofx?: string | null
          banco?: string
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          empresa_id?: string
          id?: string
          observacoes?: string | null
          saldo_final?: number
          saldo_inicial?: number
          status?: string
          total_entradas?: number
          total_saidas?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      financeiro_conciliacoes_itens: {
        Row: {
          conciliacao_id: string
          conciliado: boolean | null
          created_at: string | null
          data_transacao: string
          descricao: string
          id: string
          movimentacao_id: string | null
          observacoes: string | null
          tipo: string
          valor: number
        }
        Insert: {
          conciliacao_id: string
          conciliado?: boolean | null
          created_at?: string | null
          data_transacao: string
          descricao: string
          id?: string
          movimentacao_id?: string | null
          observacoes?: string | null
          tipo: string
          valor: number
        }
        Update: {
          conciliacao_id?: string
          conciliado?: boolean | null
          created_at?: string | null
          data_transacao?: string
          descricao?: string
          id?: string
          movimentacao_id?: string | null
          observacoes?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_conciliacoes_itens_conciliacao_id_fkey"
            columns: ["conciliacao_id"]
            isOneToOne: false
            referencedRelation: "financeiro_conciliacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_conciliacoes_itens_movimentacao_id_fkey"
            columns: ["movimentacao_id"]
            isOneToOne: false
            referencedRelation: "financeiro_movimentacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_movimentacoes: {
        Row: {
          banco_id: string | null
          categoria: string | null
          centro_custo: string | null
          cliente_id: string | null
          created_at: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          forma_pagamento: string | null
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          status: string | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          banco_id?: string | null
          categoria?: string | null
          centro_custo?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          banco_id?: string | null
          categoria?: string | null
          centro_custo?: string | null
          cliente_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_movimentacoes_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "financeiro_bancos"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_nfse: {
        Row: {
          aliquota_iss: number | null
          cliente_id: string | null
          codigo_servico: string | null
          created_at: string | null
          data_competencia: string | null
          data_emissao: string
          descricao_servico: string
          empresa_id: string
          id: string
          link_pdf: string | null
          link_xml: string | null
          numero_nota: string | null
          serie: string | null
          status: string
          updated_at: string | null
          valor_cofins: number | null
          valor_csll: number | null
          valor_deducoes: number | null
          valor_inss: number | null
          valor_ir: number | null
          valor_iss: number | null
          valor_liquido: number
          valor_pis: number | null
          valor_servico: number
        }
        Insert: {
          aliquota_iss?: number | null
          cliente_id?: string | null
          codigo_servico?: string | null
          created_at?: string | null
          data_competencia?: string | null
          data_emissao: string
          descricao_servico: string
          empresa_id: string
          id?: string
          link_pdf?: string | null
          link_xml?: string | null
          numero_nota?: string | null
          serie?: string | null
          status?: string
          updated_at?: string | null
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_deducoes?: number | null
          valor_inss?: number | null
          valor_ir?: number | null
          valor_iss?: number | null
          valor_liquido: number
          valor_pis?: number | null
          valor_servico: number
        }
        Update: {
          aliquota_iss?: number | null
          cliente_id?: string | null
          codigo_servico?: string | null
          created_at?: string | null
          data_competencia?: string | null
          data_emissao?: string
          descricao_servico?: string
          empresa_id?: string
          id?: string
          link_pdf?: string | null
          link_xml?: string | null
          numero_nota?: string | null
          serie?: string | null
          status?: string
          updated_at?: string | null
          valor_cofins?: number | null
          valor_csll?: number | null
          valor_deducoes?: number | null
          valor_inss?: number | null
          valor_ir?: number | null
          valor_iss?: number | null
          valor_liquido?: number
          valor_pis?: number | null
          valor_servico?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_nfse_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      funil_anotacoes: {
        Row: {
          card_id: string
          created_at: string
          empresa_id: string
          id: string
          mensagem: string
          usuario_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          empresa_id: string
          id?: string
          mensagem: string
          usuario_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          empresa_id?: string
          id?: string
          mensagem?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funil_anotacoes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "funil_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funil_anotacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      funil_cards: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          data_limite: string | null
          empresa_id: string
          etapa_id: string
          id: string
          observacoes: string | null
          orcamento_id: string | null
          ordem: number | null
          responsavel_id: string | null
          servicos: Json | null
          titulo: string
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          data_limite?: string | null
          empresa_id: string
          etapa_id: string
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          ordem?: number | null
          responsavel_id?: string | null
          servicos?: Json | null
          titulo: string
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          data_limite?: string | null
          empresa_id?: string
          etapa_id?: string
          id?: string
          observacoes?: string | null
          orcamento_id?: string | null
          ordem?: number | null
          responsavel_id?: string | null
          servicos?: Json | null
          titulo?: string
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      funil_etapas: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          empresa_id: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          empresa_id: string
          id?: string
          nome: string
          ordem: number
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      funil_mensagens: {
        Row: {
          card_id: string
          created_at: string
          empresa_id: string
          id: string
          mensagem: string
          telefone: string | null
          usuario_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          empresa_id: string
          id?: string
          mensagem: string
          telefone?: string | null
          usuario_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          empresa_id?: string
          id?: string
          mensagem?: string
          telefone?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funil_mensagens_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "funil_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funil_mensagens_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
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
      modelos: {
        Row: {
          arquivo_docx_url: string | null
          ativo: boolean | null
          conteudo_template: string
          created_at: string | null
          empresa_id: string
          id: string
          nome: string
          publico: boolean | null
          tipo: string
          updated_at: string | null
          variaveis: Json | null
        }
        Insert: {
          arquivo_docx_url?: string | null
          ativo?: boolean | null
          conteudo_template: string
          created_at?: string | null
          empresa_id: string
          id?: string
          nome: string
          publico?: boolean | null
          tipo: string
          updated_at?: string | null
          variaveis?: Json | null
        }
        Update: {
          arquivo_docx_url?: string | null
          ativo?: boolean | null
          conteudo_template?: string
          created_at?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          publico?: boolean | null
          tipo?: string
          updated_at?: string | null
          variaveis?: Json | null
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          created_at: string | null
          data_leitura: string | null
          empresa_id: string
          id: string
          lida: boolean | null
          link: string | null
          mensagem: string | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          data_leitura?: string | null
          empresa_id: string
          id?: string
          lida?: boolean | null
          link?: string | null
          mensagem?: string | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          data_leitura?: string | null
          empresa_id?: string
          id?: string
          lida?: boolean | null
          link?: string | null
          mensagem?: string | null
          tipo?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          cliente_id: string | null
          criado_em: string | null
          data_envio: string | null
          data_servico: string | null
          data_validade: string | null
          empresa_id: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          local_servico: string | null
          observacoes: string | null
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
          data_servico?: string | null
          data_validade?: string | null
          empresa_id?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          local_servico?: string | null
          observacoes?: string | null
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
          data_servico?: string | null
          data_validade?: string | null
          empresa_id?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          local_servico?: string | null
          observacoes?: string | null
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
      orcamentos_pdf: {
        Row: {
          created_at: string | null
          id: string
          orcamento_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          orcamento_id: string
          storage_path: string
        }
        Update: {
          created_at?: string | null
          id?: string
          orcamento_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_pdf_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      servico_itens: {
        Row: {
          created_at: string | null
          desconto: number | null
          descricao: string
          empresa_id: string
          id: string
          quantidade: number
          servico_id: string
          updated_at: string | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          created_at?: string | null
          desconto?: number | null
          descricao: string
          empresa_id: string
          id?: string
          quantidade?: number
          servico_id: string
          updated_at?: string | null
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          created_at?: string | null
          desconto?: number | null
          descricao?: string
          empresa_id?: string
          id?: string
          quantidade?: number
          servico_id?: string
          updated_at?: string | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: []
      }
      servicos: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          created_at: string | null
          custo_encargos: number | null
          custo_mao_obra: number | null
          custo_produto: number | null
          data: string | null
          descricao: string | null
          empresa_id: string | null
          horario_fim: string | null
          horario_ini: string | null
          id: string
          imagem_url: string | null
          local: string | null
          lucro_liquido: number | null
          markup_percent: number | null
          nome: string
          observacoes: string | null
          periodo: string | null
          preco_venda: number | null
          responsavel_id: string | null
          status: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string | null
          custo_encargos?: number | null
          custo_mao_obra?: number | null
          custo_produto?: number | null
          data?: string | null
          descricao?: string | null
          empresa_id?: string | null
          horario_fim?: string | null
          horario_ini?: string | null
          id?: string
          imagem_url?: string | null
          local?: string | null
          lucro_liquido?: number | null
          markup_percent?: number | null
          nome: string
          observacoes?: string | null
          periodo?: string | null
          preco_venda?: number | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string | null
          custo_encargos?: number | null
          custo_mao_obra?: number | null
          custo_produto?: number | null
          data?: string | null
          descricao?: string | null
          empresa_id?: string | null
          horario_fim?: string | null
          horario_ini?: string | null
          id?: string
          imagem_url?: string | null
          local?: string | null
          lucro_liquido?: number | null
          markup_percent?: number | null
          nome?: string
          observacoes?: string | null
          periodo?: string | null
          preco_venda?: number | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
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
      servicos_estoque_itens: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          item_id: string
          quantidade: number
          servico_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          item_id: string
          quantidade?: number
          servico_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          item_id?: string
          quantidade?: number
          servico_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_estoque_itens_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_estoque_itens_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          data_fim: string | null
          data_hora: string
          descricao: string | null
          empresa_id: string
          id: string
          lembrete: boolean | null
          origem: string | null
          prioridade: string | null
          servico_id: string | null
          status: string | null
          tipo: string | null
          titulo: string
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_hora: string
          descricao?: string | null
          empresa_id: string
          id?: string
          lembrete?: boolean | null
          origem?: string | null
          prioridade?: string | null
          servico_id?: string | null
          status?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_hora?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          lembrete?: boolean | null
          origem?: string | null
          prioridade?: string | null
          servico_id?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      user_modulos_acesso: {
        Row: {
          created_at: string | null
          id: string
          modulo: Database["public"]["Enums"]["modulo_acesso"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          modulo: Database["public"]["Enums"]["modulo_acesso"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          modulo?: Database["public"]["Enums"]["modulo_acesso"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_modulos_acesso_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          bloqueado: boolean | null
          conta_principal: boolean | null
          cpf_cnpj: string | null
          data_cadastro: string | null
          email: string
          empresa_id: string | null
          funcao: string | null
          id: string
          limite_usuarios_criacao: number | null
          nome: string
          nome_completo: string | null
          observacoes: string | null
          permissao: string | null
          primeiro_acesso: boolean | null
          proximo_vencimento: string | null
          senha_hash: string | null
          status_conta: string | null
          telefone_whatsapp: string | null
          ultimo_pagamento: string | null
        }
        Insert: {
          ativo?: boolean | null
          bloqueado?: boolean | null
          conta_principal?: boolean | null
          cpf_cnpj?: string | null
          data_cadastro?: string | null
          email: string
          empresa_id?: string | null
          funcao?: string | null
          id?: string
          limite_usuarios_criacao?: number | null
          nome: string
          nome_completo?: string | null
          observacoes?: string | null
          permissao?: string | null
          primeiro_acesso?: boolean | null
          proximo_vencimento?: string | null
          senha_hash?: string | null
          status_conta?: string | null
          telefone_whatsapp?: string | null
          ultimo_pagamento?: string | null
        }
        Update: {
          ativo?: boolean | null
          bloqueado?: boolean | null
          conta_principal?: boolean | null
          cpf_cnpj?: string | null
          data_cadastro?: string | null
          email?: string
          empresa_id?: string | null
          funcao?: string | null
          id?: string
          limite_usuarios_criacao?: number | null
          nome?: string
          nome_completo?: string | null
          observacoes?: string | null
          permissao?: string | null
          primeiro_acesso?: boolean | null
          proximo_vencimento?: string | null
          senha_hash?: string | null
          status_conta?: string | null
          telefone_whatsapp?: string | null
          ultimo_pagamento?: string | null
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
      count_active_users: { Args: { _empresa_id: string }; Returns: number }
      criar_etapas_padrao_funil: {
        Args: { p_empresa_id: string }
        Returns: undefined
      }
      get_user_empresa_id: { Args: { _user_id: string }; Returns: string }
      get_user_modules: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["modulo_acesso"][]
      }
      has_module_access: {
        Args: {
          _modulo: Database["public"]["Enums"]["modulo_acesso"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conta_principal: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "administrador"
        | "gerente"
        | "lider"
        | "colaborador"
        | "personalizado"
      modulo_acesso:
        | "dashboard"
        | "orcamentos"
        | "servicos"
        | "funil_vendas"
        | "agenda"
        | "clientes"
        | "estoque"
        | "financeiro"
        | "contratos"
        | "relatorios"
        | "configuracoes"
        | "vendas"
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
    Enums: {
      app_role: [
        "administrador",
        "gerente",
        "lider",
        "colaborador",
        "personalizado",
      ],
      modulo_acesso: [
        "dashboard",
        "orcamentos",
        "servicos",
        "funil_vendas",
        "agenda",
        "clientes",
        "estoque",
        "financeiro",
        "contratos",
        "relatorios",
        "configuracoes",
        "vendas",
      ],
    },
  },
} as const
