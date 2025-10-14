import React from 'react';
import { X, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface Modelo {
  id: string;
  nome: string;
  tipo: string;
  conteudo_template: string;
  ativo: boolean;
  arquivo_docx_url?: string;
}

interface ModeloPDFViewerProps {
  modelo: Modelo;
  onClose: () => void;
}

export function ModeloPDFViewer({ modelo, onClose }: ModeloPDFViewerProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    try {
      toast.info('Gerando PDF...');
      
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`modelo_${modelo.nome.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  const isDocxFile = modelo.arquivo_docx_url ? true : false;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div>
            <h2 className="text-xl font-semibold">{modelo.nome}</h2>
            <p className="text-sm text-muted-foreground">
              Tipo: {modelo.tipo.charAt(0).toUpperCase() + modelo.tipo.slice(1)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 p-8 overflow-auto bg-muted/20">
          <div ref={contentRef} className="max-w-4xl mx-auto bg-white p-12 rounded-lg shadow-lg">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">{modelo.nome}</h1>
              <p className="text-sm text-gray-600 mt-2">
                {modelo.tipo.charAt(0).toUpperCase() + modelo.tipo.slice(1)}
              </p>
            </div>
            {isDocxFile ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <FileText className="h-24 w-24 mx-auto text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Modelo em Formato .DOCX
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Este modelo mantém toda a formatação original do arquivo Word.
                </p>
                <p className="text-xs text-gray-500">
                  Ao gerar um contrato, as variáveis serão substituídas automaticamente<br />
                  mantendo o layout, imagens e formatação originais.
                </p>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">Variáveis Disponíveis:</p>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>{'{{cliente_nome}}, {{cliente_documento}}, {{cliente_email}}'}</p>
                    <p>{'{{data_evento}}, {{servicos}}, {{valor_total}}, {{valor_extenso}}'}</p>
                    <p>{'{{numero_contrato}}, {{assinatura_empresa}}'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-gray-900 whitespace-pre-wrap">
                {modelo.conteudo_template}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
