import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook received - Creating new user');

    // Verificar token de segurança
    const verificationToken = req.headers.get('x-verification-token') || req.headers.get('authorization');
    const expectedToken = Deno.env.get('WEBHOOK_VERIFICATION_TOKEN');
    
    if (!verificationToken || verificationToken.replace('Bearer ', '') !== expectedToken) {
      console.error('Invalid verification token');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token de verificação inválido' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await req.json();
    console.log('Webhook data received:', JSON.stringify(body, null, 2));

    // Extrair dados do webhook da Kiwify
    const email = body.Customer?.email;
    const documento = body.Customer?.cnpj || body.Customer?.cpf;
    const nome = body.Customer?.full_name || body.Customer?.first_name;
    
    // Mapear plano baseado no valor da comissão ou nome do plano
    let plano = 'Essencial'; // Plano padrão
    const chargeAmount = body.Commissions?.charge_amount || 0;
    
    // Mapear pelo valor (em centavos): Essencial R$99,90 = 9990, Estratégico R$249,90 = 24990, Performance R$449,90 = 44990
    if (chargeAmount >= 44000) {
      plano = 'Performance';
    } else if (chargeAmount >= 24000) {
      plano = 'Estratégico';
    } else if (chargeAmount >= 9000) {
      plano = 'Essencial';
    }
    
    // Verificar se é uma assinatura aprovada
    const isApproved = body.webhook_event_type === 'order_approved' && body.order_status === 'paid';
    
    if (!isApproved) {
      console.log('Webhook event is not an approved order, skipping user creation');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Evento não é uma ordem aprovada, usuário não criado' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!email || !documento) {
      console.error('Missing required fields: email or documento');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email e documento são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Limpar documento (remover pontos, traços, barras)
    const documentoLimpo = documento.replace(/[.\-\/]/g, '');

    console.log(`Creating user with email: ${email}`);

    // Criar usuário no Supabase Auth com senha temporária = documento
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: documentoLimpo,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nome: nome || 'Novo Usuário',
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`User created successfully with ID: ${authData.user.id}`);

    // Criar empresa
    const { data: empresaData, error: empresaError } = await supabase
      .from('empresas')
      .insert({
        nome_fantasia: nome || 'Empresa Padrão',
        email_admin: email,
        plano: plano,
        status_pagamento: 'ativo'
      })
      .select()
      .single();

    if (empresaError) {
      console.error('Error creating empresa:', empresaError);
      // Deletar usuário se falhar ao criar empresa
      await supabase.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: empresaError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Atualizar perfil do usuário na tabela usuarios
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        empresa_id: empresaData.id,
        conta_principal: true,
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
    }

    console.log('User creation process completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário criado com sucesso',
        user_id: authData.user.id,
        empresa_id: empresaData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
