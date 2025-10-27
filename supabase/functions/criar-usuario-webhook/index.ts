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

    const { email, documento, nome, plano } = body;

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
        plano: plano || 'Gratuito',
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
