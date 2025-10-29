import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import PizZip from "https://esm.sh/pizzip@3.1.7";
import Docxtemplater from "https://esm.sh/docxtemplater@3.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const { modeloId, contratoData } = await req.json();

    console.log('Processing contract with modelo:', modeloId);
    console.log('Contract data:', contratoData);

    // Buscar informações da empresa
    const { data: empresa, error: empresaError } = await supabaseClient
      .from('empresas')
      .select('nome_fantasia, razao_social, cnpj, telefone, email_admin, endereco, cidade, estado, cep, website, logo_url')
      .eq('id', contratoData.empresa_id)
      .single();

    if (empresaError) {
      console.error('Erro ao buscar empresa:', empresaError);
    }

    // Buscar o modelo
    const { data: modelo, error: modeloError } = await supabaseClient
      .from('modelos')
      .select('*')
      .eq('id', modeloId)
      .single();

    if (modeloError || !modelo) {
      throw new Error('Modelo não encontrado');
    }

    // Verificar se há arquivo .docx
    if (!modelo.arquivo_docx_url) {
      throw new Error('Modelo não possui arquivo .docx');
    }

    // Baixar o arquivo .docx do storage
    const filePath = modelo.arquivo_docx_url.replace('modelos-contratos/', '');
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('modelos-contratos')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error('Erro ao baixar arquivo do modelo: ' + downloadError?.message);
    }

    // Converter o Blob para ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    
    // Processar DOCX com docxtemplater
    const zip = new PizZip(arrayBuffer);
    
    let doc;
    try {
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}'
        }
      });
    } catch (error) {
      console.error('Error creating Docxtemplater instance:', error);
      throw new Error('Erro ao processar o modelo DOCX. Verifique se o arquivo está correto e se as variáveis estão no formato {{variavel}}');
    }

    // Preparar dados para substituição
    const templateData = {
      // Dados do cliente
      cliente_nome: contratoData.cliente_nome || '',
      cliente_documento: contratoData.cliente_documento || '',
      cliente_email: contratoData.cliente_email || '',
      cliente_telefone: contratoData.cliente_telefone || '',
      cliente_endereco: contratoData.cliente_endereco || '',
      // Dados do evento/serviço
      data_evento: contratoData.data_evento || '',
      horario_inicio: contratoData.horario_inicio || '',
      horario_fim: contratoData.horario_fim || '',
      local_servico: contratoData.local_servico || '',
      servicos: contratoData.servicos || '',
      // Dados financeiros
      valor_total: contratoData.valor_total || '',
      valor_extenso: contratoData.valor_extenso || '',
      forma_pagamento: contratoData.forma_pagamento || '',
      // Dados do contrato
      numero_contrato: contratoData.numero_contrato || '',
      data_contrato: contratoData.data_contrato || '',
      observacoes: contratoData.observacoes || '',
      assinatura_empresa: contratoData.assinatura_empresa || '',
      // Dados da empresa
      empresa_nome: empresa?.nome_fantasia || '',
      empresa_razao_social: empresa?.razao_social || '',
      empresa_cnpj: empresa?.cnpj || '',
      empresa_telefone: empresa?.telefone || '',
      empresa_email: empresa?.email_admin || '',
      empresa_endereco: empresa?.endereco || '',
      empresa_cidade: empresa?.cidade || '',
      empresa_estado: empresa?.estado || '',
      empresa_cep: empresa?.cep || '',
      empresa_website: empresa?.website || '',
    };

    // Substituir variáveis
    try {
      doc.render(templateData);
    } catch (error) {
      console.error('Error rendering template:', error);
      if (error.properties && error.properties.errors) {
        console.error('Template errors:', JSON.stringify(error.properties.errors));
      }
      throw new Error('Erro ao substituir as variáveis no modelo. Verifique se todas as tags estão corretas no formato {{variavel}}');
    }

    // Gerar novo arquivo DOCX
    const processedBuffer = doc.getZip().generate({
      type: "arraybuffer",
      compression: "DEFLATE",
    });

    // Nome do arquivo gerado
    const fileName = `CONTRATO_${contratoData.numero_contrato}_${contratoData.cliente_nome.replace(/\s+/g, '_')}_${contratoData.data_evento?.replace(/\//g, '-') || 'sem-data'}.docx`;
    
    // Fazer upload do arquivo processado
    const uploadPath = `contratos-gerados/${fileName}`;
    const { error: uploadError } = await supabaseClient
      .storage
      .from('modelos-contratos')
      .upload(uploadPath, processedBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });

    if (uploadError) {
      throw new Error('Erro ao fazer upload do contrato: ' + uploadError.message);
    }

    // Obter URL pública do arquivo
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('modelos-contratos')
      .getPublicUrl(uploadPath);

    console.log('Contract processed successfully:', fileName);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Contrato processado com sucesso',
        arquivoUrl: uploadPath,
        publicUrl: publicUrl,
        fileName: fileName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing contract:', error);
    
    let errorMessage = error.message || 'Erro desconhecido ao processar contrato';
    
    // Se for erro do docxtemplater, dar uma mensagem mais clara
    if (error.properties && error.properties.errors) {
      console.error('Docxtemplater errors:', JSON.stringify(error.properties.errors));
      errorMessage = 'Erro no modelo DOCX: verifique se todas as variáveis estão no formato {{variavel}} sem espaços ou caracteres extras';
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: error.properties?.errors || null
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
