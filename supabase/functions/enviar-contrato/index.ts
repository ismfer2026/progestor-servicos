import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from "npm:resend@2.0.0";
import jsPDF from "npm:jspdf@2.5.2";

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
    const { data: emailConfigData, error: emailError } = await supabaseClient
      .from('configuracoes')
      .select('valor')
      .eq('empresa_id', contrato.empresa_id)
      .eq('chave', 'email_config')
      .maybeSingle();

    console.log('Email Config:', { emailConfigData, emailError, empresa_id: contrato.empresa_id });

    const emailConfig = emailConfigData?.valor as any;
    const smtpUser = emailConfig?.smtp_user;

    const emailFrom = smtpUser 
      ? `${contrato.empresas?.nome_fantasia || 'Empresa'} <${smtpUser}>`
      : `${contrato.empresas?.nome_fantasia || 'Empresa'} <onboarding@resend.dev>`;

    console.log('Email From:', emailFrom, 'SMTP User:', smtpUser);

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

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.text(contrato.empresas?.nome_fantasia || 'Empresa', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Contrato #${contrato_id.slice(0, 8)}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    // Cliente info
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Dados do Cliente', 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Nome: ${contrato.clientes?.nome || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${contrato.clientes?.email || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Telefone: ${contrato.clientes?.telefone || 'N/A'}`, 20, yPos);
    yPos += 15;

    // Contract info
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Informações do Contrato', 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Número: #${contrato_id.slice(0, 8)}`, 20, yPos);
    yPos += 6;
    doc.text(`Status: ${contrato.status || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Valor Total: R$ ${Number(contrato.valor_total || 0).toFixed(2)}`, 20, yPos);
    yPos += 15;

    // Footer
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Por favor, revise o contrato e entre em contato caso tenha alguma dúvida.', pageWidth / 2, yPos, { align: 'center' });

    // Get PDF as buffer
    const pdfBuffer = doc.output('arraybuffer');

    // Email HTML (with message first)
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

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: #333; font-size: 16px;">
              📎 O contrato completo está anexado a este e-mail em formato PDF.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #dbeafe; border-radius: 8px; border-left: 4px solid #3B82F6;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">📝 Por favor, revise o contrato e entre em contato caso tenha alguma dúvida.</p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend with PDF attachment
    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to: [email_destinatario],
      subject: `Contrato - ${contrato.empresas?.nome_fantasia || 'Empresa'}`,
      html: emailHtml,
      attachments: [{
        filename: `Contrato_${contrato_id.slice(0, 8)}.pdf`,
        content: new Uint8Array(pdfBuffer),
      }],
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email sending
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
