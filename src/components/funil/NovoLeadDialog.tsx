import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NovoLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etapas: any[];
  onLeadCreated?: () => void;
}

export function NovoLeadDialog({ open, onOpenChange, etapas, onLeadCreated }: NovoLeadDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    valor: '',
    etapa_id: '',
    observacoes: ''
  });

  const handleSubmit = async () => {
    if (!formData.nome || !formData.etapa_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (!user?.empresa_id) {
      toast.error('Usuário não está associado a uma empresa');
      return;
    }

    setLoading(true);
    try {
      // Primeiro, criar o cliente
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .insert([{
          empresa_id: user.empresa_id,
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          endereco: formData.endereco,
          fase_crm: 'Lead'
        }])
        .select()
        .single();

      if (clienteError) throw clienteError;

      // Depois, criar o card no funil
      const { error: cardError } = await supabase
        .from('funil_cards')
        .insert([{
          empresa_id: user.empresa_id,
          cliente_id: cliente.id,
          etapa_id: formData.etapa_id,
          titulo: formData.nome,
          valor: formData.valor ? parseFloat(formData.valor) : null,
          observacoes: formData.observacoes,
          responsavel_id: user.id
        }]);

      if (cardError) throw cardError;

      toast.success('Lead criado com sucesso!');
      
      // Limpar formulário
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        endereco: '',
        valor: '',
        etapa_id: '',
        observacoes: ''
      });

      if (onLeadCreated) {
        onLeadCreated();
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
            <div>
              <Label htmlFor="valor">Valor Estimado</Label>
              <Input
                id="valor"
                type="number"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <Label htmlFor="etapa">Etapa do Funil *</Label>
              <Select
                value={formData.etapa_id}
                onValueChange={(value) => setFormData({ ...formData, etapa_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {etapas.map((etapa) => (
                    <SelectItem key={etapa.id} value={etapa.id}>
                      {etapa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações relevantes sobre o lead..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Salvando...' : 'Criar Lead'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}