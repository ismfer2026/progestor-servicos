import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { X } from "lucide-react";

interface NovoLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etapas: any[];
  onLeadCreated?: () => void;
}

interface Servico {
  id: string;
  nome: string;
  preco_venda: number;
}

interface ServicoSelecionado {
  servico_id: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export function NovoLeadDialog({ open, onOpenChange, etapas, onLeadCreated }: NovoLeadDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicosSelecionados, setServicosSelecionados] = useState<ServicoSelecionado[]>([]);
  const [servicoAtual, setServicoAtual] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    etapa_id: '',
    observacoes: ''
  });

  useEffect(() => {
    if (open && user?.empresa_id) {
      loadServicos();
    }
  }, [open, user]);

  const loadServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome, preco_venda')
        .eq('empresa_id', user?.empresa_id)
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const adicionarServico = () => {
    if (!servicoAtual) {
      toast.error('Selecione um serviço');
      return;
    }

    const servico = servicos.find(s => s.id === servicoAtual);
    if (!servico) return;

    const novoServico: ServicoSelecionado = {
      servico_id: servico.id,
      nome: servico.nome,
      quantidade: 1,
      valor_unitario: servico.preco_venda,
      valor_total: servico.preco_venda
    };

    setServicosSelecionados([...servicosSelecionados, novoServico]);
    setServicoAtual('');
  };

  const removerServico = (index: number) => {
    setServicosSelecionados(servicosSelecionados.filter((_, i) => i !== index));
  };

  const calcularValorTotal = () => {
    return servicosSelecionados.reduce((total, s) => total + s.valor_total, 0);
  };

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
      const valorTotal = calcularValorTotal();
      const { error: cardError } = await supabase
        .from('funil_cards')
        .insert([{
          empresa_id: user.empresa_id,
          cliente_id: cliente.id,
          etapa_id: formData.etapa_id,
          titulo: formData.nome,
          valor: valorTotal > 0 ? valorTotal : null,
          observacoes: formData.observacoes,
          responsavel_id: user.id,
          servicos: servicosSelecionados as any
        }]);

      if (cardError) throw cardError;

      toast.success('Lead criado com sucesso!');
      
      // Limpar formulário
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        endereco: '',
        etapa_id: '',
        observacoes: ''
      });
      setServicosSelecionados([]);

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
            <div className="col-span-2">
              <Label htmlFor="servico">Serviços Desejados</Label>
              <div className="flex gap-2">
                <Select value={servicoAtual} onValueChange={setServicoAtual}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((servico) => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.nome} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(servico.preco_venda)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={adicionarServico} variant="outline">
                  Adicionar
                </Button>
              </div>
              
              {servicosSelecionados.length > 0 && (
                <div className="mt-3 space-y-2">
                  {servicosSelecionados.map((servico, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">
                        {servico.nome} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(servico.valor_total)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerServico(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t font-semibold">
                    <span>Total:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calcularValorTotal())}</span>
                  </div>
                </div>
              )}
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