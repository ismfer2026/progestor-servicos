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
    const { data: smtpConfig } = await supabaseClient
      .from('configuracoes')
      .select('valor')
      .eq('empresa_id', contrato.empresa_id)
      .eq('chave', 'smtp_user')
      .single();

    const emailFrom = smtpConfig?.valor 
      ? `${contrato.empresas?.nome_fantasia || 'Empresa'} <${smtpConfig.valor}>`
      : `${contrato.empresas?.nome_fantasia || 'Empresa'} <onboarding@resend.dev>`;

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

    // Generate link to view contract online
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] ?? '';
    const viewLink = `https://${projectRef}.lovable.app/contratos?view=${contrato_id}`;

    // Email HTML (with message first, then link to view)
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
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Mensagem</h3>
              <p style="margin-bottom: 0; white-space: pre-wrap;">${mensagem_adicional}</p>
            </div>
          ` : ''}

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
              📄 Visualize o contrato completo clicando no botão abaixo:
            </p>
            <a href="${viewLink}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Ver Contrato
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0;">Por favor, revise o contrato e entre em contato caso tenha alguma dúvida.</p>
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
