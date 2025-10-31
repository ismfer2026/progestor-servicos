import { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

interface PDFViewerProps {
  orcamento: any;
  onClose: () => void;
}

interface EmpresaInfo {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  telefone: string;
  email_admin: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  website: string;
  logo_url: string;
}

export function PDFViewer({ orcamento, onClose }: PDFViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [empresaInfo, setEmpresaInfo] = useState<EmpresaInfo | null>(null);

  useEffect(() => {
    const fetchEmpresaInfo = async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', orcamento.empresa_id)
        .maybeSingle();

      if (!error && data) {
        setEmpresaInfo(data);
      } else if (error) {
        console.error('Erro ao buscar info da empresa:', error);
      }
    };

    if (orcamento.empresa_id) {
      fetchEmpresaInfo();
    }
  }, [orcamento.empresa_id]);

  const generatePDF = async () => {
    if (!contentRef.current) return;

    const canvas = await html2canvas(contentRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

    // Faz o download do PDF
    const nomeArquivo = `orcamento-${orcamento.id.slice(0, 6).toUpperCase()}.pdf`;
    pdf.save(nomeArquivo);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const calcularSubtotal = () => {
    if (!Array.isArray(orcamento.servicos)) return 0;
    return orcamento.servicos.reduce((sum: number, item: any) => {
      const valorItem = (item.preco_unitario || 0) * (item.quantidade || 1);
      return sum + valorItem;
    }, 0);
  };

  const subtotal = calcularSubtotal();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-lg flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Pré-visualização do Orçamento</h2>
          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors font-medium"
            >
              Baixar em PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div ref={contentRef} className="p-12 bg-white">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {empresaInfo?.logo_url ? (
                    <img 
                      src={empresaInfo.logo_url} 
                      alt="Logo da Empresa" 
                      style={{ width: '150px', height: '150px', objectFit: 'contain' }}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">
                      {empresaInfo?.nome_fantasia?.charAt(0) || 'E'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {empresaInfo?.nome_fantasia || 'Empresa'}
                    </h1>
                    {empresaInfo?.razao_social && (
                      <p className="text-xs text-gray-500">{empresaInfo.razao_social}</p>
                    )}
                    <p className="text-sm text-gray-600">{empresaInfo?.email_admin || ''}</p>
                    <p className="text-sm text-gray-600">{empresaInfo?.telefone || ''}</p>
                    {empresaInfo?.endereco && (
                      <p className="text-xs text-gray-500">
                        {empresaInfo.endereco}
                        {empresaInfo.cidade && `, ${empresaInfo.cidade}`}
                        {empresaInfo.estado && `-${empresaInfo.estado}`}
                        {empresaInfo.cep && ` - ${empresaInfo.cep}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-gray-400 mb-2">ORÇAMENTO</h2>
                <p className="text-sm text-gray-600">
                  # ORC-DRAFT-{orcamento.id.slice(0, 6).toUpperCase()}
                </p>
                <p className="text-sm text-gray-600">
                  Data: {formatDate(orcamento.criado_em || new Date().toISOString())}
                </p>
              </div>
            </div>

            {/* Client and Service Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase">Cliente</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-gray-900">{orcamento.clientes?.nome || 'N/A'}</p>
                  <p className="text-blue-600">{orcamento.clientes?.email || 'N/A'}</p>
                  <p className="text-gray-600">{orcamento.clientes?.telefone || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase">Detalhes do Serviço</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {orcamento.data_servico && (
                    <p><span className="font-medium">Data:</span> {formatDate(orcamento.data_servico)}</p>
                  )}
                  {(orcamento.horario_inicio || orcamento.horario_fim) && (
                    <p>
                      <span className="font-medium">Horário:</span> {formatTime(orcamento.horario_inicio)} às {formatTime(orcamento.horario_fim)}
                    </p>
                  )}
                  {orcamento.local_servico && (
                    <p><span className="font-medium">Local:</span> {orcamento.local_servico}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 uppercase">Item</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 uppercase">Qtd.</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700 uppercase">Preço Unitário</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-gray-700 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(orcamento.servicos) && orcamento.servicos.map((servico: any, index: number) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          {servico.imagem_url && (
                            <img 
                              src={servico.imagem_url} 
                              alt={servico.nome}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{servico.nome}</p>
                            {servico.descricao && (
                              <p className="text-sm text-gray-500 mt-1">{servico.descricao}</p>
                            )}
                            {servico.desconto > 0 && (
                              <p className="text-sm text-green-600 mt-1">
                                Desconto: {servico.tipo_desconto === 'percentual' 
                                  ? `${servico.desconto}%` 
                                  : formatCurrency(servico.desconto)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-900">{servico.quantidade || 1}</td>
                      <td className="py-4 px-4 text-right text-gray-900">{formatCurrency(servico.preco_unitario || 0)}</td>
                      <td className="py-4 px-4 text-right font-medium text-gray-900">{formatCurrency(servico.preco_total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="flex justify-between py-2 text-sm text-gray-600 border-t border-gray-200">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between py-3 text-lg font-bold text-gray-900 border-t-2 border-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(orcamento.valor_total || 0)}</span>
                </div>
              </div>
            </div>

            {/* Observations */}
            {orcamento.observacoes && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase">Observações</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{orcamento.observacoes}</p>
              </div>
            )}

            {/* Validity */}
            <div className="text-sm text-gray-600 border-t border-gray-200 pt-4">
              {orcamento.data_validade ? (
                <p>Este orçamento é válido até: <span className="font-medium">{formatDate(orcamento.data_validade)}</span></p>
              ) : (
                <p>Este orçamento é válido por 30 dias a partir da data de emissão.</p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-sm text-gray-400">
              <p>Obrigado pela sua preferência!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
