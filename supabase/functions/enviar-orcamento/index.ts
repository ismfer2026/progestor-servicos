import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { jsPDF } from "npm:jspdf@2.5.2";
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
    console.log('=== Iniciando função enviar-orcamento ===');
    
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
    console.log('Dados recebidos:', { orcamento_id, email_destinatario, mensagem_adicional });

    // Busca o orçamento
    console.log('Buscando orçamento...');
    const { data: orcamento, error: orcamentoError } = await supabaseClient
      .from('orcamentos')
      .select('*')
      .eq('id', orcamento_id)
      .single();

    if (orcamentoError || !orcamento) {
      console.error('Erro ao buscar orçamento:', orcamentoError);
      return new Response(
        JSON.stringify({ error: 'Orçamento não encontrado', details: orcamentoError?.message }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Orçamento encontrado, buscando cliente...');
    // Busca dados do cliente
    const { data: cliente, error: clienteError } = await supabaseClient
      .from('clientes')
      .select('nome, email, telefone')
      .eq('id', orcamento.cliente_id)
      .single();

    if (clienteError) {
      console.error('Erro ao buscar cliente:', clienteError);
    }

    console.log('Buscando empresa...');
    // Busca dados da empresa
    const { data: empresa, error: empresaError } = await supabaseClient
      .from('empresas')
      .select('nome_fantasia, email_admin')
      .eq('id', orcamento.empresa_id)
      .single();

    if (empresaError) {
      console.error('Erro ao buscar empresa:', empresaError);
    }
    
    console.log('Orçamento encontrado:', orcamento.id);

    // Busca configuração de e-mail da empresa
    const { data: emailConfigData } = await supabaseClient
      .from('configuracoes')
      .select('valor')
      .eq('empresa_id', orcamento.empresa_id)
      .eq('chave', 'email_config')
      .maybeSingle();

    const emailConfig = emailConfigData?.valor as any;
    console.log('Configuração de e-mail:', { 
      found: !!emailConfig, 
      hasHost: !!emailConfig?.smtpHost, 
      hasUser: !!emailConfig?.smtpUser 
    });
    
    if (!emailConfig || !emailConfig.smtpHost || !emailConfig.smtpUser) {
      return new Response(
        JSON.stringify({ error: 'Configuração de e-mail não encontrada. Configure o SMTP em Configurações > E-mail.' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // === GERAÇÃO DO PDF ===
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.text(empresa?.nome_fantasia || 'Empresa', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Orçamento #${orcamento_id.slice(0, 8)}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;

    // Dados do cliente
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Dados do Cliente', 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Nome: ${cliente?.nome || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${cliente?.email || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Telefone: ${cliente?.telefone || 'N/A'}`, 20, yPos);
    yPos += 15;

    // Serviços
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Serviços', 20, yPos);
    yPos += 10;

    // Tabela de serviços
    doc.setFontSize(10);
    doc.text('Serviço', 20, yPos);
    doc.text('Qtd', 100, yPos);
    doc.text('Valor Unit.', 120, yPos);
    doc.text('Total', 160, yPos);
    yPos += 6;
    doc.line(20, yPos, 190, yPos);
    yPos += 6;

    doc.setFont(undefined, 'normal');
    // Se os serviços estão em campo JSON
    const servicos = orcamento.servicos ? 
      (typeof orcamento.servicos === 'string' ? JSON.parse(orcamento.servicos) : orcamento.servicos) : 
      [];
    
    if (Array.isArray(servicos) && servicos.length > 0) {
      for (const servico of servicos) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(servico.nome || servico.descricao || 'Serviço', 20, yPos);
        doc.text(String(servico.quantidade || 1), 100, yPos);
        doc.text(`R$ ${Number(servico.preco_venda || servico.valor || 0).toFixed(2)}`, 120, yPos);
        doc.text(`R$ ${(Number(servico.preco_venda || servico.valor || 0) * (servico.quantidade || 1)).toFixed(2)}`, 160, yPos);
        yPos += 6;
      }
    } else {
      doc.text('Nenhum serviço informado', 20, yPos);
      yPos += 6;
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

    const pdfBuffer = new Uint8Array(doc.output('arraybuffer'));
    console.log(`PDF gerado: tamanho ${pdfBuffer.byteLength} bytes`);

    // Salva PDF no Storage
    const storagePath = `${orcamento.empresa_id}/${orcamento_id}.pdf`;
    const { error: storageError } = await supabaseClient
      .storage
      .from('orcamentos-pdf')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (storageError) {
      console.error('Erro ao salvar PDF no Storage:', storageError);
      throw new Error(`Erro ao salvar PDF: ${storageError.message}`);
    }

    console.log(`PDF salvo em: ${storagePath}`);

    // Salva referência na tabela orcamentos_pdf (se a tabela existir)
    try {
      const { error: pdfRecordError } = await supabaseClient
        .from('orcamentos_pdf')
        .insert({
          orcamento_id,
          storage_path: storagePath
        });

      if (pdfRecordError) {
        console.log('Info: Tabela orcamentos_pdf não disponível ou erro ao registrar:', pdfRecordError.message);
      }
    } catch (err) {
      console.log('Info: Não foi possível registrar na tabela orcamentos_pdf');
    }

    // HTML do e-mail
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
        <h1>${empresa?.nome_fantasia || 'Empresa'}</h1>
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

    // Envia e-mail com PDF
    console.log('Enviando e-mail...');
    const emailResponse = await transporter.sendMail({
      from: `${empresa?.nome_fantasia || 'Empresa'} <${emailConfig.smtpUser}>`,
      to: email_destinatario,
      subject: `Orçamento - ${empresa?.nome_fantasia || 'Empresa'}`,
      html: emailHtml,
      attachments: [{
        filename: `Orcamento_${orcamento_id.slice(0, 8)}.pdf`,
        content: pdfBuffer,
      }],
    });

    console.log(`E-mail enviado: ${emailResponse.messageId}`);

    // Log de envio
    const { data: { user } } = await supabaseClient.auth.getUser();
    await supabaseClient
      .from('logs_envio')
      .insert({
        orcamento_id,
        empresa_id: orcamento.empresa_id,
        enviado_por: user?.id,
        destinatario: email_destinatario,
        tipo_envio: 'email',
        status: 'enviado',
      });

    // Atualiza status do orçamento
    await supabaseClient
      .from('orcamentos')
      .update({ status: 'Enviado', data_envio: new Date().toISOString() })
      .eq('id', orcamento_id);

    return new Response(JSON.stringify({ success: true, message: 'Orçamento enviado com sucesso!' }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error: any) {
    console.error("Erro na função enviar-orcamento:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
