import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapear price_id para nome do plano
const PLANOS = {
  "price_1SMvCvLzS21dPBnvhCoydvXh": "Essencial",
  "price_1SMvMvLzS21dPBnvzXM4DCyf": "Estratégico",
  "price_1SMvOWLzS21dPBnvMyspWY6B": "Performance",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Webhook Stripe recebido ===");
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    if (!signature) {
      throw new Error("Assinatura do webhook ausente");
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET não configurado");
    }

    // Verificar assinatura do webhook
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("Evento verificado:", event.type);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Processar checkout.session.completed (novo pagamento)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Checkout completado:", session.id);

      const customerEmail = session.customer_email || session.customer_details?.email;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      
      if (!customerEmail) {
        throw new Error("Email do cliente não encontrado");
      }

      // Buscar informações da subscription para pegar o price_id
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const plano = PLANOS[priceId as keyof typeof PLANOS] || "Essencial";
      
      console.log("Criando conta para:", customerEmail, "Plano:", plano);

      // Buscar dados do cliente no Stripe para pegar o documento
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const documento = customer.metadata?.documento || "123456789";
      
      // Criar empresa
      const { data: empresa, error: empresaError } = await supabaseAdmin
        .from("empresas")
        .insert({
          nome_fantasia: customer.name || "Empresa",
          email_admin: customerEmail,
          plano: plano,
          status_pagamento: "ativo",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          data_proximo_pagamento: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
        })
        .select()
        .single();

      if (empresaError) {
        console.error("Erro ao criar empresa:", empresaError);
        throw empresaError;
      }

      console.log("Empresa criada:", empresa.id);

      // Criar usuário no Supabase Auth com senha temporária (documento)
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password: documento,
        email_confirm: true,
        user_metadata: {
          name: customer.name || "Usuário",
        }
      });

      if (authError) {
        console.error("Erro ao criar usuário auth:", authError);
        throw authError;
      }

      console.log("Usuário auth criado:", authUser.user.id);

      // Criar perfil do usuário
      const { error: usuarioError } = await supabaseAdmin
        .from("usuarios")
        .insert({
          id: authUser.user.id,
          email: customerEmail,
          nome: customer.name || "Usuário",
          empresa_id: empresa.id,
          permissao: "admin",
          conta_principal: true,
          ativo: true,
          primeiro_acesso: true,
        });

      if (usuarioError) {
        console.error("Erro ao criar perfil:", usuarioError);
        throw usuarioError;
      }

      console.log("Perfil criado com sucesso");
    }

    // Processar invoice.payment_failed (pagamento falhou)
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("Pagamento falhou para:", invoice.customer);

      const customerId = invoice.customer as string;

      // Atualizar status da empresa
      const { error: updateError } = await supabaseAdmin
        .from("empresas")
        .update({ 
          status_pagamento: "pendente",
          data_ultimo_pagamento: new Date().toISOString().split('T')[0],
        })
        .eq("stripe_customer_id", customerId)
        .eq("acesso_vitalicio", false); // Não atualizar usuários com acesso vitalício

      if (updateError) {
        console.error("Erro ao atualizar status:", updateError);
      } else {
        console.log("Status de pagamento atualizado para pendente");
      }
    }

    // Processar invoice.payment_succeeded (pagamento bem-sucedido)
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("Pagamento bem-sucedido para:", invoice.customer);

      const customerId = invoice.customer as string;
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

      // Atualizar status da empresa
      const { error: updateError } = await supabaseAdmin
        .from("empresas")
        .update({ 
          status_pagamento: "ativo",
          data_ultimo_pagamento: new Date().toISOString().split('T')[0],
          data_proximo_pagamento: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
        })
        .eq("stripe_customer_id", customerId);

      if (updateError) {
        console.error("Erro ao atualizar status:", updateError);
      } else {
        console.log("Status de pagamento atualizado para ativo");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});