import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telefone?: string;
  cardId: string;
}

export function WhatsAppDialog({ open, onOpenChange, telefone, cardId }: WhatsAppDialogProps) {
  const { user } = useAuth();
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnviar = async () => {
    if (!mensagem.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    if (!user?.empresa_id) {
      toast.error('Usuário não está associado a uma empresa');
      return;
    }

    setLoading(true);
    try {
      // Salvar mensagem no banco
      const { error } = await supabase
        .from('funil_mensagens')
        .insert([{
          empresa_id: user.empresa_id,
          card_id: cardId,
          usuario_id: user.id,
          mensagem,
          telefone
        }]);

      if (error) throw error;

      // Abrir WhatsApp
      if (telefone) {
        const cleanPhone = telefone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(mensagem);
        window.open(`https://wa.me/55${cleanPhone}?text=${encodedMessage}`, '_blank');
      }

      toast.success('Mensagem salva com sucesso!');
      setMensagem('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      toast.error('Erro ao salvar mensagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar mensagem via WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {telefone && (
            <div>
              <Label>Telefone</Label>
              <p className="text-sm text-muted-foreground">{telefone}</p>
            </div>
          )}
          <div>
            <Label htmlFor="mensagem">Mensagem *</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={5}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={loading || !telefone}>
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}