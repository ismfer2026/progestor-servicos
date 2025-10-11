import React, { useState } from 'react';
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

interface LiberarManutencaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manutencao: {
    id: string;
    item_id: string;
    defeito: string;
    custo_manutencao?: number;
  } | null;
  onSuccess: () => void;
}

export default function LiberarManutencaoDialog({ 
  open, 
  onOpenChange, 
  manutencao,
  onSuccess 
}: LiberarManutencaoDialogProps) {
  const { user } = useAuth();
  const [acao, setAcao] = useState<'liberar' | 'rejeitar'>('liberar');
  const [valorCusto, setValorCusto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Manutenção');
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!manutencao || !user?.empresa_id) return;

    if (acao === 'liberar' && !valorCusto) {
      toast.error('Preencha o valor do custo da manutenção');
      return;
    }

    if (acao === 'rejeitar' && !motivoRejeicao.trim()) {
      toast.error('Preencha o motivo da rejeição');
      return;
    }

    setLoading(true);

    try {
      if (acao === 'liberar') {
        // Atualizar status da manutenção para concluída
        const { error: manutencaoError } = await supabase
          .from('estoque_manutencao')
          .update({ 
            status: 'concluido',
            data_retorno: new Date().toISOString().split('T')[0],
            custo_manutencao: parseFloat(valorCusto)
          })
          .eq('id', manutencao.id);

        if (manutencaoError) throw manutencaoError;

        // Registrar no financeiro como despesa
        const { error: financeiroError } = await supabase
          .from('financeiro_movimentacoes')
          .insert({
            empresa_id: user.empresa_id,
            tipo: 'despesa',
            valor: parseFloat(valorCusto),
            descricao: descricao || `Manutenção - ${manutencao.defeito}`,
            categoria: categoria,
            data_vencimento: new Date().toISOString().split('T')[0],
            data_pagamento: new Date().toISOString().split('T')[0],
            status: 'pago',
            observacoes: `Referente à manutenção do item. Defeito: ${manutencao.defeito}`
          });

        if (financeiroError) throw financeiroError;

        // Registrar no histórico
        const { error: historicoError } = await supabase
          .from('estoque_historico')
          .insert({
            empresa_id: user.empresa_id,
            item_id: manutencao.item_id,
            usuario_id: user.id,
            tipo_movimentacao: 'conclusao_manutencao',
            quantidade: 1,
            valor_custo: parseFloat(valorCusto),
            manutencao_id: manutencao.id,
            detalhes: {
              defeito: manutencao.defeito,
              descricao: descricao,
              categoria: categoria
            }
          });

        if (historicoError) throw historicoError;

        toast.success('Item liberado para o estoque e custo registrado no financeiro!');
      } else {
        // Rejeitar item - atualizar status
        const { error: manutencaoError } = await supabase
          .from('estoque_manutencao')
          .update({ 
            status: 'rejeitado',
            observacoes: motivoRejeicao
          })
          .eq('id', manutencao.id);

        if (manutencaoError) throw manutencaoError;

        // Registrar no histórico
        const { error: historicoError } = await supabase
          .from('estoque_historico')
          .insert({
            empresa_id: user.empresa_id,
            item_id: manutencao.item_id,
            usuario_id: user.id,
            tipo_movimentacao: 'rejeicao_manutencao',
            quantidade: 1,
            motivo: motivoRejeicao,
            manutencao_id: manutencao.id,
            detalhes: {
              defeito: manutencao.defeito
            }
          });

        if (historicoError) throw historicoError;

        toast.success('Item rejeitado e registrado no histórico!');
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao processar manutenção:', error);
      toast.error('Erro ao processar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAcao('liberar');
    setValorCusto('');
    setDescricao('');
    setCategoria('Manutenção');
    setMotivoRejeicao('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Processar Manutenção</DialogTitle>
          <DialogDescription>
            Libere o item para o estoque ou rejeite-o
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Defeito Reportado</Label>
            <Input value={manutencao?.defeito || ''} disabled />
          </div>

          <div className="space-y-3">
            <Label>Ação</Label>
            <RadioGroup value={acao} onValueChange={(value: any) => setAcao(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="liberar" id="liberar" />
                <Label htmlFor="liberar" className="cursor-pointer font-normal">
                  Liberar para Estoque
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejeitar" id="rejeitar" />
                <Label htmlFor="rejeitar" className="cursor-pointer font-normal">
                  Rejeitar Item
                </Label>
              </div>
            </RadioGroup>
          </div>

          {acao === 'liberar' && (
            <>
              <div>
                <Label>Valor do Custo (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={valorCusto}
                  onChange={(e) => setValorCusto(e.target.value)}
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Manutenção preventiva, troca de peças..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div>
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Manutenção Preventiva">Manutenção Preventiva</SelectItem>
                    <SelectItem value="Manutenção Corretiva">Manutenção Corretiva</SelectItem>
                    <SelectItem value="Conserto">Conserto</SelectItem>
                    <SelectItem value="Substituição de Peças">Substituição de Peças</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {acao === 'rejeitar' && (
            <div>
              <Label>Motivo da Rejeição *</Label>
              <Textarea
                placeholder="Descreva o motivo da rejeição do item..."
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processando...' : acao === 'liberar' ? 'Liberar' : 'Rejeitar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
