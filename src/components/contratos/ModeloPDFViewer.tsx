import React from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
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
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (2 * margin);
      let yPosition = margin;

      // Título do modelo
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(modelo.nome, margin, yPosition);
      yPosition += 12;

      // Tipo do modelo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Tipo: ${modelo.tipo.charAt(0).toUpperCase() + modelo.tipo.slice(1)}`, margin, yPosition);
      yPosition += 15;

      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Conteúdo do modelo
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      const lines = doc.splitTextToSize(modelo.conteudo_template, maxWidth);
      
      for (let i = 0; i < lines.length; i++) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(lines[i], margin, yPosition);
        yPosition += 7;
      }

      // Fazer download
      doc.save(`modelo_${modelo.nome.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
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
          <div className="max-w-4xl mx-auto bg-card p-12 rounded-lg shadow-lg border">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {modelo.conteudo_template}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
