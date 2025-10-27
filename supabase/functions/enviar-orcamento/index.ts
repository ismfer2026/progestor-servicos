import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import nodemailer from "npm:nodemailer@6.9.7";

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Busca o orçamento e dados do cliente e empresa
    const { data: orcamento, error: orcamentoError } = await supabaseClient
      .from('orcamentos')
      .select(`
        *,
        clientes (nome, email, telefone),
        empresas (nome_fantasia, email_admin)
      `)
      .eq('id', orcamento_id)
      .single();

    if (orcamentoError || !orcamento) {
      return new Response(
        JSON.stringify({ error: 'Orçamento não encontrado' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Busca configuração de e-mail da empresa
    const { data: emailConfigData } = await supabaseClient
      .from('configuracoes')
      .select('valor')
      .eq('empresa_id', orcamento.empresa_id)
      .eq('chave', 'email_config')
      .maybeSingle();

    const emailConfig = emailConfigData?.valor as any;
    if (!emailConfig || !emailConfig.smtpHost || !emailConfig.smtpUser) {
      return new Response(
        JSON.stringify({ error: 'Configuração de e-mail não encontrada.' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Busca PDF do orçamento no Storage
    const { data: pdfData, error: pdfError } = await supabaseClient
      .storage
      .from('orcamentos-pdf')
      .download(`${orcamento.empresa_id}/${orcamento_id}.pdf`);

    if (pdfError || !pdfData) {
      console.error('Erro ao baixar PDF do Storage:', pdfError);
      return new Response(
        JSON.stringify({ error: 'PDF do orçamento não encontrado.' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const pdfBuffer = new Uint8Array(await pdfData.arrayBuffer());

    // HTML do e-mail
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
        <h1>${orcamento.empresas?.nome_fantasia || 'Empresa'}</h1>
        <p>Orçamento #${orcamento_id.slice(0, 8)}</p>
        ${mensagem_adicional ? `<p>${mensagem_adicional}</p>` : ''}
        <p>O orçamento completo está anexado a este e-mail em PDF.</p>
      </div>
    `;

    // Configura Nodemailer
    const transportConfig: any = {
      host: emailConfig.smtpHost,
      port: parseInt(emailConfig.smtpPort),
      secure: emailConfig.smtpSecurity === 'ssl',
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPass,
      },
    };

    if (emailConfig.smtpSecurity === 'tls') {
      transportConfig.requireTLS = true;
      transportConfig.tls = { rejectUnauthorized: false };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    // Envia e-mail com PDF anexado
    const emailResponse = await transporter.sendMail({
      from: `${orcamento.empresas?.nome_fantasia || 'Empresa'} <${emailConfig.smtpUser}>`,
      to: email_destinatario,
      subject: `Orçamento - ${orcamento.empresas?.nome_fantasia || 'Empresa'}`,
      html: emailHtml,
      attachments: [{
        filename: `Orcamento_${orcamento_id.slice(0, 8)}.pdf`,
        content: pdfBuffer,
      }],
    });

    console.log("Email enviado:", emailResponse.messageId);

    // Registra log de envio
    await supabaseClient
      .from('logs_envio')
      .insert({
        orcamento_id,
        empresa_id: orcamento.empresa_id,
        enviado_por: supabaseClient.auth.user()?.id,
        destinatario: email_destinatario,
        tipo_envio: 'email',
        status: 'enviado',
      });

    // Atualiza status do orçamento
    await supabaseClient
      .from('orcamentos')
      .update({ status: 'Enviado', data_envio: new Date().toISOString() })
      .eq('id', orcamento_id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Orçamento enviado com sucesso!'
    }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error: any) {
    console.error("Erro na função enviar-orcamento:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
