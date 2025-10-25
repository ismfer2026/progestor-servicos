import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from "npm:resend@2.0.0";
import { jsPDF } from "npm:jspdf@2.5.2";

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
    const { data: emailConfigData, error: emailError } = await supabaseClient
      .from('configuracoes')
      .select('valor')
      .eq('empresa_id', orcamento.empresa_id)
      .eq('chave', 'email_config')
      .maybeSingle();

    console.log('Email Config:', { emailConfigData, emailError, empresa_id: orcamento.empresa_id });

    const emailConfig = emailConfigData?.valor as any;
    const smtpUser = emailConfig?.smtpUser;

    const emailFrom = smtpUser
      ? `${orcamento.empresas?.nome_fantasia || 'Empresa'} <${smtpUser}>`
      : `${orcamento.empresas?.nome_fantasia || 'Empresa'} <onboarding@resend.dev>`;

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
    doc.text(orcamento.empresas?.nome_fantasia || 'Empresa', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Orçamento #${orcamento_id.slice(0, 8)}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    // Cliente info
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Dados do Cliente', 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Nome: ${orcamento.clientes?.nome || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${orcamento.clientes?.email || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Telefone: ${orcamento.clientes?.telefone || 'N/A'}`, 20, yPos);
    yPos += 15;

    // Services
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Serviços', 20, yPos);
    yPos += 10;

    // Table header
    doc.setFontSize(10);
    doc.text('Serviço', 20, yPos);
    doc.text('Qtd', 100, yPos);
    doc.text('Valor Unit.', 120, yPos);
    doc.text('Total', 160, yPos);
    yPos += 6;
    doc.line(20, yPos, 190, yPos);
    yPos += 6;

    // Table rows
    doc.setFont(undefined, 'normal');
    if (Array.isArray(orcamento.servicos)) {
      for (const servico of orcamento.servicos) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(servico.nome, 20, yPos);
        doc.text(String(servico.quantidade || 1), 100, yPos);
        doc.text(`R$ ${Number(servico.preco_venda || 0).toFixed(2)}`, 120, yPos);
        doc.text(`R$ ${(Number(servico.preco_venda || 0) * (servico.quantidade || 1)).toFixed(2)}`, 160, yPos);
        yPos += 6;
      }
    }

    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    // Total
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Valor Total: R$ ${Number(orcamento.valor_total || 0).toFixed(2)}`, 160, yPos, { align: 'right' });
    yPos += 15;

    // Footer
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Orçamento válido por 30 dias', pageWidth / 2, yPos, { align: 'center' });

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
            <h1 style="color: #333; margin: 0;">${orcamento.empresas?.nome_fantasia || 'Empresa'}</h1>
            <p style="color: #666; margin: 5px 0;">Orçamento #${orcamento_id.slice(0, 8)}</p>
          </div>

          ${mensagem_adicional ? `
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3B82F6;">
              <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">💬 Mensagem</h3>
              <p style="margin-bottom: 0; white-space: pre-wrap; color: #374151; line-height: 1.6;">${mensagem_adicional}</p>
            </div>
          ` : ''}

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <p style="margin: 0; color: #333; font-size: 16px;">
              📎 O orçamento completo está anexado a este e-mail em formato PDF.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">⏰ Orçamento válido por 30 dias</p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend with PDF attachment
    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to: [email_destinatario],
      subject: `Orçamento - ${orcamento.empresas?.nome_fantasia || 'Empresa'}`,
      html: emailHtml,
      attachments: [{
        filename: `Orcamento_${orcamento_id.slice(0, 8)}.pdf`,
        content: new Uint8Array(pdfBuffer),
      }],
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
