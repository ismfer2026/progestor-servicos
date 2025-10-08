import { useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFViewerProps {
  orcamento: any;
  onClose: () => void;
}

export function PDFViewer({ orcamento, onClose }: PDFViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!contentRef.current) return;

    const canvas = await html2canvas(contentRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
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
    pdf.save(`orcamento-${orcamento.id.slice(0, 8)}.pdf`);
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Pré-visualização do Orçamento</h2>
          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Baixar PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-accent"
            >
              Fechar
            </button>
          </div>
        </div>

        <div ref={contentRef} className="p-8 bg-white text-black">
          {/* Header */}
          <div className="text-center mb-8 pb-4 border-b-2 border-gray-300">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ORÇAMENTO</h1>
            <p className="text-sm text-gray-600">
              Nº {orcamento.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-sm text-gray-600">
              Data: {formatDate(orcamento.criado_em || new Date().toISOString())}
            </p>
          </div>

          {/* Client Data */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-300">
              Dados do Cliente
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Nome:</p>
                <p className="font-semibold">{orcamento.clientes?.nome || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Email:</p>
                <p className="font-semibold">{orcamento.clientes?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Telefone:</p>
                <p className="font-semibold">{orcamento.clientes?.telefone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Endereço:</p>
                <p className="font-semibold">{orcamento.clientes?.endereco || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-300">
              Serviços
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="text-left p-2">Descrição</th>
                  <th className="text-center p-2">Qtd</th>
                  <th className="text-right p-2">Valor Unit.</th>
                  <th className="text-right p-2">Desconto</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(orcamento.servicos) && orcamento.servicos.map((servico: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-2">
                      <p className="font-semibold">{servico.nome}</p>
                      {servico.descricao && (
                        <p className="text-xs text-gray-600">{servico.descricao}</p>
                      )}
                    </td>
                    <td className="text-center p-2">{servico.quantidade || 1}</td>
                    <td className="text-right p-2">{formatCurrency(servico.preco_unitario || 0)}</td>
                    <td className="text-right p-2">
                      {servico.desconto > 0 && (
                        <span>
                          {servico.tipo_desconto === 'percentual' 
                            ? `${servico.desconto}%` 
                            : formatCurrency(servico.desconto)}
                        </span>
                      )}
                    </td>
                    <td className="text-right p-2 font-semibold">
                      {formatCurrency(servico.preco_total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="bg-gray-100 p-4 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">VALOR TOTAL:</span>
                  <span className="text-xl font-bold text-gray-800">
                    {formatCurrency(orcamento.valor_total || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Validity */}
          {orcamento.data_validade && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-gray-700">
                <strong>Válido até:</strong> {formatDate(orcamento.data_validade)}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>Orçamento gerado em {formatDate(new Date().toISOString())}</p>
            <p className="mt-2">Este orçamento é válido por 30 dias a partir da data de emissão.</p>
          </div>
        </div>
      </div>
    </div>
  );
}