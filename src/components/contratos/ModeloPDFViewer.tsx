import React from 'react';
import { X, Download } from 'lucide-react';
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

  // Function to check if content is HTML
  const isHtmlContent = (content: string) => {
    return /<[a-z][\s\S]*>/i.test(content);
  };

  // Function to process content and replace image placeholders
  const processContent = (content: string) => {
    // Se for HTML (do DOCX), renderizar diretamente
    if (isHtmlContent(content)) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.6',
            color: '#000'
          }}
        />
      );
    }

    // Se for texto simples, processar variáveis
    const parts = content.split(/(\{\{.*?\}\})/g);
    
    return parts.map((part, index) => {
      // Check if it's an assinatura_empresa placeholder
      if (part === '{{assinatura_empresa}}') {
        return (
          <div key={index} className="my-4">
            <div className="text-sm text-muted-foreground mb-2">Assinatura da Empresa:</div>
            <div className="border-t-2 border-gray-300 pt-2 w-64">
              [Assinatura será inserida aqui]
            </div>
          </div>
        );
      }
      
      // Check if part is a variable placeholder
      if (part.match(/^\{\{.*\}\}$/)) {
        return <span key={index} className="bg-yellow-100 px-1 rounded">{part}</span>;
      }
      
      return <span key={index}>{part}</span>;
    });
  };

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
            <div className="prose prose-sm max-w-none text-gray-900">
              <div 
                className={isHtmlContent(modelo.conteudo_template) ? '' : 'whitespace-pre-wrap'} 
                style={{ 
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: '1.6'
                }}
              >
                {processContent(modelo.conteudo_template)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
