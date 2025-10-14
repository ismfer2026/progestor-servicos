import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { useWhatsAppConfig } from "@/hooks/useWhatsAppConfig";

interface WhatsAppMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientPhone?: string;
  defaultMessage?: string;
  onSent?: () => void;
  context?: 'orcamento' | 'contrato' | 'cliente' | 'funil' | 'geral';
  contextId?: string;
}

export function WhatsAppMessageDialog({
  open,
  onOpenChange,
  recipientPhone,
  defaultMessage = '',
  onSent,
  context = 'geral',
  contextId
}: WhatsAppMessageDialogProps) {
  const { formatPhoneNumber } = useWhatsAppConfig();
  const [mensagem, setMensagem] = useState(defaultMessage);
  const [loading, setLoading] = useState(false);

  const handleEnviar = async () => {
    if (!mensagem.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    if (!recipientPhone) {
      toast.error('Número do destinatário não informado');
      return;
    }

    setLoading(true);
    try {
      // Formatar número para padrão internacional
      const phoneFormatted = formatPhoneNumber(recipientPhone);
      const encodedMessage = encodeURIComponent(mensagem);
      const whatsappUrl = `https://wa.me/${phoneFormatted}?text=${encodedMessage}`;

      // Abrir WhatsApp
      const whatsappWindow = window.open(whatsappUrl, '_blank');
      
      // Verificar se a janela foi bloqueada
      if (!whatsappWindow || whatsappWindow.closed || typeof whatsappWindow.closed === 'undefined') {
        toast.error('Pop-up bloqueado! Permita pop-ups para este site e tente novamente.', {
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      toast.success('Abrindo WhatsApp...');
      
      // Callback opcional
      if (onSent) {
        onSent();
      }

      setMensagem('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      toast.error('Erro ao abrir WhatsApp. Verifique se pop-ups estão permitidos.');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar mensagem quando defaultMessage mudar
  useState(() => {
    if (defaultMessage && open) {
      setMensagem(defaultMessage);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar mensagem via WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {recipientPhone && (
            <div>
              <Label>Destinatário</Label>
              <p className="text-sm text-muted-foreground">{recipientPhone}</p>
            </div>
          )}
          <div>
            <Label htmlFor="mensagem">Mensagem *</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={6}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEnviar} 
              disabled={loading || !recipientPhone}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
