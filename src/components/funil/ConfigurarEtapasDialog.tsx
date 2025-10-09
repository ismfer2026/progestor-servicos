import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ConfigurarEtapasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEtapasChanged?: () => void;
}

export function ConfigurarEtapasDialog({ open, onOpenChange, onEtapasChanged }: ConfigurarEtapasDialogProps) {
  const { user } = useAuth();
  const [etapas, setEtapas] = useState<any[]>([]);
  const [novaEtapa, setNovaEtapa] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadEtapas();
    }
  }, [open]);

  const loadEtapas = async () => {
    if (!user?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('funil_etapas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('ordem');

      if (error) throw error;
      setEtapas(data || []);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      toast.error('Erro ao carregar etapas');
    }
  };

  const handleAdicionarEtapa = async () => {
    if (!novaEtapa.trim()) {
      toast.error('Digite o nome da etapa');
      return;
    }

    if (!user?.empresa_id) {
      toast.error('Usuário não está associado a uma empresa');
      return;
    }

    setLoading(true);
    try {
      const ordem = etapas.length;
      const { error } = await supabase
        .from('funil_etapas')
        .insert([{
          empresa_id: user.empresa_id,
          nome: novaEtapa,
          ordem,
          cor: '#3B82F6'
        }]);

      if (error) throw error;

      toast.success('Etapa adicionada com sucesso!');
      setNovaEtapa('');
      loadEtapas();
      
      if (onEtapasChanged) {
        onEtapasChanged();
      }
    } catch (error) {
      console.error('Erro ao adicionar etapa:', error);
      toast.error('Erro ao adicionar etapa');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverEtapa = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('funil_etapas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Etapa removida com sucesso!');
      loadEtapas();
      
      if (onEtapasChanged) {
        onEtapasChanged();
      }
    } catch (error) {
      console.error('Erro ao remover etapa:', error);
      toast.error('Erro ao remover etapa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar Etapas do Funil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={novaEtapa}
              onChange={(e) => setNovaEtapa(e.target.value)}
              placeholder="Nome da nova etapa"
              onKeyPress={(e) => e.key === 'Enter' && handleAdicionarEtapa()}
            />
            <Button onClick={handleAdicionarEtapa} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {etapas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma etapa cadastrada
              </p>
            ) : (
              etapas.map((etapa) => (
                <div
                  key={etapa.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{etapa.nome}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoverEtapa(etapa.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}