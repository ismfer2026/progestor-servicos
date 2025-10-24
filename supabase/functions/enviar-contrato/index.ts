import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EnviarContratoRequest {
  contrato_id: string;
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

    const { contrato_id, email_destinatario, mensagem_adicional }: EnviarContratoRequest = await req.json();

    // Get contrato details with cliente and empresa info
    const { data: contrato, error: contratoError } = await supabaseClient
      .from('contratos')
      .select(`
        *,
        clientes (nome, email, telefone),
        usuarios (nome, email),
        empresas (nome_fantasia, email_admin)
      `)
      .eq('id', contrato_id)
      .single();

    if (contratoError || !contrato) {
      console.error('Erro ao buscar contrato:', contratoError);
      return new Response(
        JSON.stringify({ error: 'Contrato não encontrado' }),
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
      .eq('empresa_id', contrato.empresa_id)
      .eq('chave', 'smtp_user')
      .maybeSingle();

    console.log('SMTP Config:', { smtpConfig, smtpError, empresa_id: contrato.empresa_id });

    const emailFrom = smtpConfig?.valor 
      ? `${contrato.empresas?.nome_fantasia || 'Empresa'} <${smtpConfig.valor}>`
      : `${contrato.empresas?.nome_fantasia || 'Empresa'} <onboarding@resend.dev>`;

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

    // Email HTML (with message first, then contract info)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">${contrato.empresas?.nome_fantasia || 'Empresa'}</h1>
            <p style="color: #666; margin: 5px 0;">Contrato #${contrato_id.slice(0, 8)}</p>
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
                <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Nome:</strong></td>
                <td style="padding: 8px 0; color: #111827;">${contrato.clientes?.nome || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; color: #111827;">${contrato.clientes?.email || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Telefone:</strong></td>
                <td style="padding: 8px 0; color: #111827;">${contrato.clientes?.telefone || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
            <h3 style="color: #111827; margin-top: 0; margin-bottom: 15px;">📄 Informações do Contrato</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Número:</strong></td>
                <td style="padding: 8px 0; color: #111827;">#${contrato_id.slice(0, 8)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; color: #111827;">${contrato.status || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Valor:</strong></td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 18px;">R$ ${Number(contrato.valor_total || 0).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #dbeafe; border-radius: 8px; border-left: 4px solid #3B82F6;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">📝 Por favor, revise o contrato e entre em contato caso tenha alguma dúvida.</p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to: [email_destinatario],
      subject: `Contrato - ${contrato.empresas?.nome_fantasia || 'Empresa'}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email sending (assuming there's a similar logs table for contracts)
    const { error: logError } = await supabaseClient
      .from('logs_envio')
      .insert({
        contrato_id: contrato_id,
        empresa_id: contrato.empresa_id,
        enviado_por: user.id,
        destinatario: email_destinatario,
        tipo_envio: 'email',
        status: emailResponse.error ? 'erro' : 'enviado',
        mensagem_erro: emailResponse.error?.message || null
      });

    if (logError) {
      console.error("Erro ao registrar log:", logError);
    }

    // Update contrato with send date
    const { error: updateError } = await supabaseClient
      .from('contratos')
      .update({ 
        data_envio: new Date().toISOString(),
        status: 'Enviado'
      })
      .eq('id', contrato_id);

    if (updateError) {
      console.error("Erro ao atualizar contrato:", updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      email_id: emailResponse.data?.id,
      message: 'Contrato enviado com sucesso!'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Erro na function enviar-contrato:", error);
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
