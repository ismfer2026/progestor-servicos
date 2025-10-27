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
    console.log('Webhook received - Canceling subscription');

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
    const subscriptionStatus = body.Subscription?.status;
    const webhookEventType = body.webhook_event_type;
    
    console.log(`Processing event: ${webhookEventType}, Subscription status: ${subscriptionStatus}, Email: ${email}`);

    if (!email) {
      console.error('Missing required field: email');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email é obrigatório' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se é um evento de cancelamento
    const isCanceled = webhookEventType === 'subscription_canceled' || subscriptionStatus === 'canceled';
    
    if (!isCanceled) {
      console.log('Webhook event is not a cancellation, skipping');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Evento não é um cancelamento, nenhuma ação necessária' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar empresa pelo email do admin
    const { data: empresaData, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('email_admin', email)
      .single();

    if (empresaError || !empresaData) {
      console.error('Empresa not found:', empresaError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Empresa não encontrada' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found empresa: ${empresaData.id}`);

    // Atualizar status de pagamento para cancelado
    const { error: updateError } = await supabase
      .from('empresas')
      .update({
        status_pagamento: 'cancelado',
        plano: 'Gratuito'
      })
      .eq('id', empresaData.id);

    if (updateError) {
      console.error('Error updating empresa:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: updateError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar todos os usuários da empresa
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('empresa_id', empresaData.id);

    if (usuariosError) {
      console.error('Error fetching usuarios:', usuariosError);
    } else if (usuariosData && usuariosData.length > 0) {
      console.log(`Found ${usuariosData.length} usuarios to update`);
      
      // Atualizar status dos usuários para bloqueado
      const { error: updateUsuariosError } = await supabase
        .from('usuarios')
        .update({
          bloqueado: true,
          status_conta: 'bloqueado'
        })
        .eq('empresa_id', empresaData.id);

      if (updateUsuariosError) {
        console.error('Error updating usuarios:', updateUsuariosError);
      } else {
        console.log('Successfully blocked all company usuarios');
      }
    }

    console.log('Subscription cancellation process completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Assinatura cancelada com sucesso',
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
