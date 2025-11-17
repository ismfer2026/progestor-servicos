import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://cdn.skypack.dev/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GerarPDFRequest {
  orcamento_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orcamento_id }: GerarPDFRequest = await req.json();

    if (!orcamento_id) {
      throw new Error('ID do orçamento não fornecido');
    }

    // Buscar dados do orçamento
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .select(`
        *,
        clientes (nome, telefone, email, documento),
        usuarios (nome)
      `)
      .eq('id', orcamento_id)
      .single();

    if (orcamentoError || !orcamento) {
      throw new Error('Orçamento não encontrado');
    }

    // Buscar dados da empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', orcamento.empresa_id)
      .single();

    if (empresaError || !empresa) {
      throw new Error('Empresa não encontrada');
    }

    // Criar PDF
    const doc = new jsPDF();
    let y = 20;

    // Logo e dados da empresa
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(empresa.nome_fantasia || 'Empresa', 20, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (empresa.cnpj) doc.text(`CNPJ: ${empresa.cnpj}`, 20, y);
    y += 5;
    if (empresa.telefone) doc.text(`Tel: ${empresa.telefone}`, 20, y);
    y += 5;
    if (empresa.email_admin) doc.text(`Email: ${empresa.email_admin}`, 20, y);

    y += 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);

    // Título do Orçamento
    y += 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO', 105, y, { align: 'center' });

    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Número: #${orcamento.id.substring(0, 8).toUpperCase()}`, 20, y);
    y += 5;
    doc.text(`Data: ${new Date(orcamento.criado_em).toLocaleDateString('pt-BR')}`, 20, y);
    
    if (orcamento.data_validade) {
      y += 5;
      doc.text(`Validade: ${new Date(orcamento.data_validade).toLocaleDateString('pt-BR')}`, 20, y);
    }

    // Dados do Cliente
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(orcamento.clientes?.nome || 'N/A', 20, y);
    y += 5;
    if (orcamento.clientes?.documento) {
      doc.text(`Documento: ${orcamento.clientes.documento}`, 20, y);
      y += 5;
    }
    if (orcamento.clientes?.telefone) {
      doc.text(`Telefone: ${orcamento.clientes.telefone}`, 20, y);
      y += 5;
    }
    if (orcamento.clientes?.email) {
      doc.text(`Email: ${orcamento.clientes.email}`, 20, y);
      y += 5;
    }

    // Serviços
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('SERVIÇOS', 20, y);
    y += 7;

    // Cabeçalho da tabela
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y, 170, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Descrição', 22, y + 5);
    doc.text('Qtd', 120, y + 5);
    doc.text('Valor Unit.', 140, y + 5);
    doc.text('Total', 170, y + 5);
    y += 7;

    // Itens dos serviços
    doc.setFont('helvetica', 'normal');
    const servicos = orcamento.servicos || [];
    let subtotal = 0;

    for (const servico of servicos) {
      const valorUnitario = servico.valor_unitario || 0;
      const quantidade = servico.quantidade || 1;
      const total = valorUnitario * quantidade;
      subtotal += total;

      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.text(servico.descricao || servico.nome || '', 22, y + 4, { maxWidth: 95 });
      doc.text(quantidade.toString(), 120, y + 4);
      doc.text(valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 140, y + 4);
      doc.text(total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 170, y + 4);
      y += 8;
    }

    // Total
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('VALOR TOTAL:', 120, y);
    doc.text(
      (orcamento.valor_total || subtotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      170,
      y
    );

    // Observações
    if (orcamento.observacoes) {
      y += 15;
      doc.setFontSize(10);
      doc.text('OBSERVAÇÕES:', 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      const observacoes = doc.splitTextToSize(orcamento.observacoes, 170);
      doc.text(observacoes, 20, y);
    }

    // Gerar PDF como buffer
    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="orcamento-${orcamento.id.substring(0, 8)}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('Erro ao gerar PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
