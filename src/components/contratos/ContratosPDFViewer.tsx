import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ContratosPDFViewerProps {
  contrato: any;
  onClose: () => void;
}

export function ContratosPDFViewer({ contrato, onClose }: ContratosPDFViewerProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`contrato-${contrato.numero_contrato || 'documento'}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Contrato - {contrato.numero_contrato}</h2>
          <div className="flex gap-2">
            <Button onClick={generatePDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div ref={contentRef} className="bg-white p-8 text-gray-900">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
              <p className="text-sm">N° {contrato.numero_contrato}</p>
            </div>

            <div className="space-y-4 text-sm leading-relaxed">
              <div>
                <h3 className="font-bold mb-2">CONTRATANTE</h3>
                <p><strong>Nome:</strong> {contrato.clientes?.nome || 'N/A'}</p>
                <p><strong>Documento:</strong> {contrato.clientes?.documento || 'N/A'}</p>
                <p><strong>Email:</strong> {contrato.clientes?.email || 'N/A'}</p>
                <p><strong>Telefone:</strong> {contrato.clientes?.telefone || 'N/A'}</p>
              </div>

              <div>
                <h3 className="font-bold mb-2">DADOS DO CONTRATO</h3>
                <p><strong>Título:</strong> {contrato.titulo || 'Sem título'}</p>
                <p><strong>Número:</strong> {contrato.numero_contrato || 'N/A'}</p>
                <p><strong>Valor Total:</strong> {formatCurrency(contrato.valor_total)}</p>
                <p><strong>Data de Início:</strong> {formatDate(contrato.data_inicio)}</p>
                <p><strong>Data de Término:</strong> {formatDate(contrato.data_fim)}</p>
              </div>

              {contrato.observacoes && (
                <div>
                  <h3 className="font-bold mb-2">OBSERVAÇÕES</h3>
                  <p className="whitespace-pre-wrap">{contrato.observacoes}</p>
                </div>
              )}

              {contrato.pdf_contrato && (
                <div>
                  <h3 className="font-bold mb-2">CONTEÚDO DO CONTRATO</h3>
                  <div className="whitespace-pre-wrap">{contrato.pdf_contrato}</div>
                </div>
              )}

              <div className="mt-16 pt-8 border-t">
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-2 mt-16">
                      <p className="font-semibold">CONTRATANTE</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-400 pt-2 mt-16">
                      <p className="font-semibold">CONTRATADO</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8 text-xs text-gray-500">
                <p>Documento gerado em {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
