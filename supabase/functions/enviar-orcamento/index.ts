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

    // Generate HTML for the budget
    const servicosHtml = Array.isArray(orcamento.servicos) 
      ? orcamento.servicos.map((servico: any) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${servico.nome}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${servico.quantidade || 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${Number(servico.preco_venda || 0).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${(Number(servico.preco_venda || 0) * (servico.quantidade || 1)).toFixed(2)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4" style="padding: 8px; text-align: center;">Nenhum serviço encontrado</td></tr>';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Orçamento - ${orcamento.empresas?.nome_fantasia || 'Empresa'}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">${orcamento.empresas?.nome_fantasia || 'Empresa'}</h1>
            <p style="color: #666; margin: 5px 0;">Orçamento #${orcamento_id.slice(0, 8)}</p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Dados do Cliente</h2>
            <p><strong>Nome:</strong> ${orcamento.clientes?.nome || 'N/A'}</p>
            <p><strong>Email:</strong> ${orcamento.clientes?.email || 'N/A'}</p>
            <p><strong>Telefone:</strong> ${orcamento.clientes?.telefone || 'N/A'}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="color: #333;">Serviços</h2>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Serviço</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qtd</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Valor Unit.</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${servicosHtml}
              </tbody>
            </table>
          </div>

          <div style="text-align: right; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0;">Valor Total: R$ ${Number(orcamento.valor_total || 0).toFixed(2)}</h3>
          </div>

          ${mensagem_adicional ? `
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0;">Mensagem</h3>
              <p style="margin-bottom: 0;">${mensagem_adicional}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin: 0;">Orçamento válido por 30 dias</p>
            <p style="color: #666; margin: 5px 0 0 0;">Status: ${orcamento.status}</p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: `${orcamento.empresas?.nome_fantasia || 'Empresa'} <onboarding@resend.dev>`,
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