import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LiberarReservaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reserva: {
    id: string;
    item_id: string;
    quantidade: number;
    observacoes?: string;
  } | null;
  onSuccess: () => void;
}

export default function LiberarReservaDialog({ 
  open, 
  onOpenChange, 
  reserva,
  onSuccess 
}: LiberarReservaDialogProps) {
  const { user } = useAuth();
  const [tipoLiberacao, setTipoLiberacao] = useState<'venda' | 'contrato' | 'justificativa'>('justificativa');
  const [vendaId, setVendaId] = useState('');
  const [contratoId, setContratoId] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user?.empresa_id) {
      loadOrcamentosEContratos();
    }
  }, [open, user]);

  const loadOrcamentosEContratos = async () => {
    if (!user?.empresa_id) return;

    try {
      const [{ data: orcamentosData }, { data: contratosData }] = await Promise.all([
        supabase
          .from('orcamentos')
          .select('id, cliente_id, valor_total, criado_em, clientes(nome)')
          .eq('empresa_id', user.empresa_id)
          .eq('status', 'Aprovado')
          .order('criado_em', { ascending: false }),
        supabase
          .from('contratos')
          .select('id, cliente_id, valor_total, numero_contrato, clientes(nome)')
          .eq('empresa_id', user.empresa_id)
          .eq('status_assinatura', 'Assinado')
          .order('data_inicio', { ascending: false })
      ]);

      setOrcamentos(orcamentosData || []);
      setContratos(contratosData || []);
    } catch (error) {
      console.error('Erro ao carregar orçamentos e contratos:', error);
    }
  };

  const handleLiberar = async () => {
    if (!reserva || !user?.empresa_id) return;

    if (tipoLiberacao === 'venda' && !vendaId) {
      toast.error('Selecione uma venda/orçamento');
      return;
    }

    if (tipoLiberacao === 'contrato' && !contratoId) {
      toast.error('Selecione um contrato');
      return;
    }

    if (tipoLiberacao === 'justificativa' && !justificativa.trim()) {
      toast.error('Preencha a justificativa');
      return;
    }

    setLoading(true);

    try {
      // Atualizar status da reserva
      const { error: reservaError } = await supabase
        .from('estoque_reservas')
        .update({ status: 'liberado' })
        .eq('id', reserva.id);

      if (reservaError) throw reservaError;

      // Dar baixa no estoque
      const { data: itemAtual, error: itemError } = await supabase
        .from('estoque_itens')
        .select('saldo')
        .eq('id', reserva.item_id)
        .single();

      if (itemError) throw itemError;

      const novoSaldo = (itemAtual.saldo || 0) - reserva.quantidade;

      const { error: updateError } = await supabase
        .from('estoque_itens')
        .update({ saldo: novoSaldo })
        .eq('id', reserva.item_id);

      if (updateError) throw updateError;

      // Registrar no histórico
      const { error: historicoError } = await supabase
        .from('estoque_historico')
        .insert({
          empresa_id: user.empresa_id,
          item_id: reserva.item_id,
          usuario_id: user.id,
          tipo_movimentacao: 'liberacao_reserva',
          quantidade: reserva.quantidade,
          motivo: tipoLiberacao === 'justificativa' ? justificativa : null,
          venda_id: tipoLiberacao === 'venda' ? vendaId : null,
          contrato_id: tipoLiberacao === 'contrato' ? contratoId : null,
          reserva_id: reserva.id,
          detalhes: {
            tipo_liberacao: tipoLiberacao,
            observacoes: reserva.observacoes
          }
        });

      if (historicoError) throw historicoError;

      toast.success('Reserva liberada com sucesso!');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao liberar reserva:', error);
      toast.error('Erro ao liberar reserva: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTipoLiberacao('justificativa');
    setVendaId('');
    setContratoId('');
    setJustificativa('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Liberar Reserva</DialogTitle>
          <DialogDescription>
            Vincule a liberação a uma venda/contrato ou forneça uma justificativa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Quantidade Reservada</Label>
            <Input value={reserva?.quantidade || 0} disabled />
          </div>

          <div className="space-y-3">
            <Label>Tipo de Liberação</Label>
            <RadioGroup value={tipoLiberacao} onValueChange={(value: any) => setTipoLiberacao(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="venda" id="venda" />
                <Label htmlFor="venda" className="cursor-pointer font-normal">
                  Vincular a Venda/Orçamento
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contrato" id="contrato" />
                <Label htmlFor="contrato" className="cursor-pointer font-normal">
                  Vincular a Contrato
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="justificativa" id="justificativa" />
                <Label htmlFor="justificativa" className="cursor-pointer font-normal">
                  Apenas Justificativa
                </Label>
              </div>
            </RadioGroup>
          </div>

          {tipoLiberacao === 'venda' && (
            <div>
              <Label>Selecione a Venda/Orçamento *</Label>
              <Select value={vendaId} onValueChange={setVendaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {orcamentos.map((orc) => (
                    <SelectItem key={orc.id} value={orc.id}>
                      {orc.clientes?.nome} - R$ {orc.valor_total?.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tipoLiberacao === 'contrato' && (
            <div>
              <Label>Selecione o Contrato *</Label>
              <Select value={contratoId} onValueChange={setContratoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {contratos.map((contrato) => (
                    <SelectItem key={contrato.id} value={contrato.id}>
                      {contrato.numero_contrato} - {contrato.clientes?.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tipoLiberacao === 'justificativa' && (
            <div>
              <Label>Justificativa *</Label>
              <Textarea
                placeholder="Descreva o motivo da liberação..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleLiberar} disabled={loading}>
            {loading ? 'Liberando...' : 'Liberar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
