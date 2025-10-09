import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AnotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  onSaved?: () => void;
}

export function AnotacaoDialog({ open, onOpenChange, cardId, onSaved }: AnotacaoDialogProps) {
  const { user } = useAuth();
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSalvar = async () => {
    if (!mensagem.trim()) {
      toast.error('Digite uma anotação');
      return;
    }

    if (!user?.empresa_id) {
      toast.error('Usuário não está associado a uma empresa');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('funil_anotacoes')
        .insert([{
          empresa_id: user.empresa_id,
          card_id: cardId,
          usuario_id: user.id,
          mensagem
        }]);

      if (error) throw error;

      toast.success('Anotação salva com sucesso!');
      setMensagem('');
      
      if (onSaved) {
        onSaved();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar anotação:', error);
      toast.error('Erro ao salvar anotação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Anotação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="anotacao">Anotação *</Label>
            <Textarea
              id="anotacao"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Escreva suas observações sobre este contato..."
              rows={5}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}