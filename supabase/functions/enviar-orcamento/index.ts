import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EnviarOrcamentoRequest {
  orcamento_id: string;
  email_destinatario: string;
  mensagem_adicional?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { orcamento_id, email_destinatario, mensagem_adicional }: EnviarOrcamentoRequest = await req.json();

    // Get orçamento details with cliente and empresa info
    const { data: orcamento, error: orcamentoError } = await supabaseClient
      .from('orcamentos')
      .select(`
        *,
        clientes (nome, email, telefone),
        usuarios (nome, email),
        empresas (nome_fantasia, email_admin)
      `)
      .eq('id', orcamento_id)
      .single();

    if (orcamentoError || !orcamento) {
      console.error('Erro ao buscar orçamento:', orcamentoError);
      return new Response(
        JSON.stringify({ error: 'Orçamento não encontrado' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get SMTP configuration for the company
    const { data: smtpConfig, error: smtpError } = await supabaseClient
      .from('configuracoes')
      .select('valor')
      .eq('empresa_id', orcamento.empresa_id)
      .eq('chave', 'smtp_user')
      .maybeSingle();

    console.log('SMTP Config:', { smtpConfig, smtpError, empresa_id: orcamento.empresa_id });

    const emailFrom = smtpConfig?.valor 
      ? `${orcamento.empresas?.nome_fantasia || 'Empresa'} <${smtpConfig.valor}>`
      : `${orcamento.empresas?.nome_fantasia || 'Empresa'} <onboarding@resend.dev>`;

    console.log('Email From:', emailFrom);

    // Get user info for authentication
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate HTML for the services table
    const servicosHtml = Array.isArray(orcamento.servicos) 
      ? orcamento.servicos.map((servico: any) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${servico.nome}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${servico.quantidade || 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${Number(servico.preco_venda || 0).toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">R$ ${(Number(servico.preco_venda || 0) * (servico.quantidade || 1)).toFixed(2)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" style="padding: 12px; text-align: center;">Nenhum serviço encontrado</td></tr>';

    // Email HTML (with message first, then budget details)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">${orcamento.empresas?.nome_fantasia || 'Empresa'}</h1>
            <p style="color: #666; margin: 5px 0;">Orçamento #${orcamento_id.slice(0, 8)}</p>
          </div>

          ${mensagem_adicional ? `
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3B82F6;">
              <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">💬 Mensagem</h3>
              <p style="margin-bottom: 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${mensagem_adicional}</p>
            </div>
          ` : ''}

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #111827; margin-top: 0; margin-bottom: 15px;">📋 Dados do Cliente</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>Nome:</strong></td>
                <td style="padding: 8px 0; color: #111827;">${orcamento.clientes?.nome || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; color: #111827;">${orcamento.clientes?.email || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Telefone:</strong></td>
                <td style="padding: 8px 0; color: #111827;">${orcamento.clientes?.telefone || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #111827; margin-top: 0; margin-bottom: 15px;">📦 Serviços</h3>
            <table style="width: 100%; border-collapse: collapse; background: white;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Serviço</th>
                  <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Qtd</th>
                  <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Valor Unit.</th>
                  <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${servicosHtml}
              </tbody>
            </table>
            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: right;">
              <p style="margin: 0; font-size: 20px; color: #111827;"><strong>Valor Total: R$ ${Number(orcamento.valor_total || 0).toFixed(2)}</strong></p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">⏰ Orçamento válido por 30 dias</p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to: [email_destinatario],
      subject: `Orçamento - ${orcamento.empresas?.nome_fantasia || 'Empresa'}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email sending in logs_envio table
    const { error: logError } = await supabaseClient
      .from('logs_envio')
      .insert({
        orcamento_id: orcamento_id,
        empresa_id: orcamento.empresa_id,
        enviado_por: user.id,
        destinatario: email_destinatario,
        tipo_envio: 'email',
        status: emailResponse.error ? 'erro' : 'enviado',
        mensagem_erro: emailResponse.error?.message || null
      });

    if (logError) {
      console.error("Erro ao registrar log:", logError);
    }

    // Update orçamento with send date
    const { error: updateError } = await supabaseClient
      .from('orcamentos')
      .update({ 
        data_envio: new Date().toISOString(),
        status: 'Enviado'
      })
      .eq('id', orcamento_id);

    if (updateError) {
      console.error("Erro ao atualizar orçamento:", updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      email_id: emailResponse.data?.id,
      message: 'Orçamento enviado com sucesso!'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Erro na function enviar-orcamento:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);