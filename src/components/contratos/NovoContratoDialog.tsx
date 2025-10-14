import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, X } from 'lucide-react';

interface Cliente {
  id: string;
  nome: string;
  documento?: string;
  endereco?: any;
}

interface ServicoDb {
  id: string;
  nome: string;
  preco_venda?: number;
  valor_total?: number;
}

interface Colaborador {
  id: string;
  nome: string;
  funcao?: string;
}

interface Modelo {
  id: string;
  nome: string;
  conteudo_template: string;
}

interface Servico {
  id?: string;
  nome: string;
  valor: number;
}

interface Parcela {
  numero: number;
  valor: number;
  data_vencimento: Date;
}

interface NovoContratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelos: Modelo[];
  onSuccess: () => void;
}

export function NovoContratoDialog({ open, onOpenChange, modelos, onSuccess }: NovoContratoDialogProps) {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [servicosDb, setServicosDb] = useState<ServicoDb[]>([]);
  
  const [titulo, setTitulo] = useState('');
  const [numeroContrato, setNumeroContrato] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [modeloId, setModeloId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [enderecoRua, setEnderecoRua] = useState('');
  const [enderecoNumero, setEnderecoNumero] = useState('');
  const [enderecoCidade, setEnderecoCidade] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState('');
  const [valorSinal, setValorSinal] = useState(0);
  const [dataSinal, setDataSinal] = useState('');
  const [formaPagamentoSinal, setFormaPagamentoSinal] = useState('');
  const [formaPagamentoRestante, setFormaPagamentoRestante] = useState('');
  const [numeroParcelas, setNumeroParcelas] = useState(1);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
      setNumeroContrato(generateContractNumber());
    }
  }, [open, user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [clientesData, colaboradoresData, servicosData] = await Promise.all([
        supabase
          .from('clientes')
          .select('id, nome, documento, endereco')
          .eq('empresa_id', user.empresa_id)
          .order('nome'),
        supabase
          .from('colaboradores')
          .select('id, nome, funcao')
          .eq('empresa_id', user.empresa_id)
          .eq('ativo', true)
          .order('nome'),
        supabase
          .from('servicos')
          .select('id, nome, preco_venda, valor_total')
          .eq('empresa_id', user.empresa_id)
          .order('nome')
      ]);

      if (clientesData.data) setClientes(clientesData.data);
      if (colaboradoresData.data) setColaboradores(colaboradoresData.data);
      if (servicosData.data) setServicosDb(servicosData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateContractNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CT${year}${month}${random}`;
  };

  const addServicoFromList = () => {
    if (!servicoSelecionado) {
      toast.error('Selecione um serviço');
      return;
    }

    const servico = servicosDb.find(s => s.id === servicoSelecionado);
    if (!servico) return;

    const valor = servico.preco_venda || servico.valor_total || 0;
    setServicos([...servicos, {
      id: servico.id,
      nome: servico.nome,
      valor: valor
    }]);
    setServicoSelecionado('');
  };

  useEffect(() => {
    if (servicos.length === 0) {
      setValorSinal(0);
      setParcelas([]);
      return;
    }

    const valorTotal = calcularValorTotal();
    const restante = valorTotal - valorSinal;
    
    const novasParcelas: Parcela[] = [];
    const valorParcela = restante / numeroParcelas;
    
    for (let i = 0; i < numeroParcelas; i++) {
      novasParcelas.push({
        numero: i + 1,
        valor: valorParcela,
        data_vencimento: new Date(new Date().setMonth(new Date().getMonth() + i + 1))
      });
    }
    
    setParcelas(novasParcelas);
  }, [valorSinal, numeroParcelas, servicos]);

  const removeServico = (index: number) => {
    setServicos(servicos.filter((_, i) => i !== index));
  };

  const calcularValorTotal = () => {
    return servicos.reduce((total, servico) => total + servico.valor, 0);
  };

  const handleSalvar = async () => {
    if (!titulo || !clienteId || !dataInicio || servicos.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (valorSinal > 0 && !dataSinal) {
      toast.error('Informe a data do sinal');
      return;
    }

    setSaving(true);

    try {
      const modelo = modelos.find(m => m.id === modeloId);
      let conteudoContrato = modelo?.conteudo_template || '';

      const cliente = clientes.find(c => c.id === clienteId);
      const colaborador = colaboradores.find(c => c.id === colaboradorId);

      const endereco = `${enderecoRua}, ${enderecoNumero} - ${enderecoCidade}`;
      const servicosTexto = servicos.map((s, i) => `${i + 1}. ${s.nome} - R$ ${s.valor.toFixed(2)}`).join('\n');

      conteudoContrato = conteudoContrato
        .replace(/\{\{cliente_nome\}\}/g, cliente?.nome || '')
        .replace(/\{\{cliente_documento\}\}/g, cliente?.documento || '')
        .replace(/\{\{contrato_numero\}\}/g, numeroContrato)
        .replace(/\{\{contrato_valor\}\}/g, `R$ ${calcularValorTotal().toFixed(2)}`)
        .replace(/\{\{data_inicio\}\}/g, new Date(dataInicio).toLocaleDateString('pt-BR'))
        .replace(/\{\{data_fim\}\}/g, dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : '')
        .replace(/\{\{horario_inicio\}\}/g, horarioInicio || '')
        .replace(/\{\{horario_fim\}\}/g, horarioFim || '')
        .replace(/\{\{endereco_servico\}\}/g, endereco)
        .replace(/\{\{colaborador\}\}/g, colaborador?.nome || '')
        .replace(/\{\{servicos\}\}/g, servicosTexto)
        .replace(/\{\{observacoes\}\}/g, observacoes || '');

      const { data: contrato, error } = await supabase
        .from('contratos')
        .insert({
          empresa_id: user.empresa_id,
          titulo,
          numero_contrato: numeroContrato,
          cliente_id: clienteId,
          valor_total: calcularValorTotal(),
          data_inicio: dataInicio,
          data_fim: dataFim,
          observacoes: `${observacoes}\n\nServiços:\n${servicosTexto}\n\nEndereço: ${endereco}\nColaborador: ${colaborador?.nome || 'N/A'}\nHorário: ${horarioInicio} - ${horarioFim}`,
          pdf_contrato: conteudoContrato,
          status_assinatura: 'rascunho'
        })
        .select()
        .single();

      if (error) throw error;

      // Save payment info
      if (valorSinal > 0) {
        await supabase.from('financeiro_movimentacoes').insert({
          empresa_id: user.empresa_id,
          cliente_id: clienteId,
          tipo: 'receita',
          descricao: `Sinal - ${numeroContrato}`,
          valor: valorSinal,
          data_vencimento: dataSinal,
          categoria: 'Contrato',
          forma_pagamento: formaPagamentoSinal,
          status: 'pendente',
        });
      }

      // Save parcelas
      for (const parcela of parcelas) {
        await supabase.from('financeiro_movimentacoes').insert({
          empresa_id: user.empresa_id,
          cliente_id: clienteId,
          tipo: 'receita',
          descricao: `Parcela ${parcela.numero}/${numeroParcelas} - ${numeroContrato}`,
          valor: parcela.valor,
          data_vencimento: parcela.data_vencimento.toISOString().split('T')[0],
          categoria: 'Contrato',
          forma_pagamento: formaPagamentoRestante,
          status: 'pendente',
        });
      }

      toast.success('Contrato criado com sucesso!');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('Erro ao criar contrato');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setClienteId('');
    setDataInicio('');
    setDataFim('');
    setHorarioInicio('');
    setHorarioFim('');
    setModeloId('');
    setObservacoes('');
    setEnderecoRua('');
    setEnderecoNumero('');
    setEnderecoCidade('');
    setColaboradorId('');
    setServicos([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titulo">Título do Contrato *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Contrato de Prestação de Serviços"
              />
            </div>
            <div>
              <Label htmlFor="numeroContrato">Número do Contrato</Label>
              <Input
                id="numeroContrato"
                value={numeroContrato}
                onChange={(e) => setNumeroContrato(e.target.value)}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome} {cliente.documento ? `- ${cliente.documento}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="colaborador">Colaborador Responsável</Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map(colaborador => (
                    <SelectItem key={colaborador.id} value={colaborador.id}>
                      {colaborador.nome} {colaborador.funcao ? `- ${colaborador.funcao}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Serviços *</Label>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex gap-2">
                <Select value={servicoSelecionado} onValueChange={setServicoSelecionado}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicosDb.map(servico => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.nome} - R$ {(servico.preco_venda || servico.valor_total || 0).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addServicoFromList} type="button">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {servicos.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicos.map((servico, index) => (
                      <TableRow key={index}>
                        <TableCell>{servico.nome}</TableCell>
                        <TableCell>R$ {servico.valor.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeServico(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-bold">Valor Total do Contrato</TableCell>
                      <TableCell className="font-bold text-primary">
                        R$ {calcularValorTotal().toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <div>
            <Label>Endereço do Serviço</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Rua"
                value={enderecoRua}
                onChange={(e) => setEnderecoRua(e.target.value)}
              />
              <Input
                placeholder="Número"
                value={enderecoNumero}
                onChange={(e) => setEnderecoNumero(e.target.value)}
              />
              <Input
                placeholder="Cidade"
                value={enderecoCidade}
                onChange={(e) => setEnderecoCidade(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data de Término</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="horarioInicio">Horário de Início</Label>
              <Input
                id="horarioInicio"
                type="time"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="horarioFim">Horário de Término</Label>
              <Input
                id="horarioFim"
                type="time"
                value={horarioFim}
                onChange={(e) => setHorarioFim(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="modelo">Modelo de Contrato</Label>
            <Select value={modeloId} onValueChange={setModeloId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {modelos.map(modelo => (
                  <SelectItem key={modelo.id} value={modelo.id}>
                    {modelo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Forma de Pagamento</Label>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valorSinal">Valor do Sinal</Label>
                  <Input
                    id="valorSinal"
                    type="number"
                    step="0.01"
                    value={valorSinal}
                    onChange={(e) => setValorSinal(Number(e.target.value))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="dataSinal">Data do Sinal</Label>
                  <Input
                    id="dataSinal"
                    type="date"
                    value={dataSinal}
                    onChange={(e) => setDataSinal(e.target.value)}
                  />
                </div>
              </div>

              {valorSinal > 0 && (
                <div>
                  <Label htmlFor="formaPagamentoSinal">Forma de Pagamento do Sinal</Label>
                  <Select value={formaPagamentoSinal} onValueChange={setFormaPagamentoSinal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm text-muted-foreground">Valor Restante</Label>
                <p className="text-xl font-bold">
                  R$ {(calcularValorTotal() - valorSinal).toFixed(2)}
                </p>
              </div>

              <div>
                <Label htmlFor="numeroParcelas">Número de Parcelas</Label>
                <Select
                  value={numeroParcelas.toString()}
                  onValueChange={(value) => setNumeroParcelas(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}x de R$ {((calcularValorTotal() - valorSinal) / num).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="formaPagamentoRestante">Forma de Pagamento do Restante</Label>
                <Select value={formaPagamentoRestante} onValueChange={setFormaPagamentoRestante}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais sobre o contrato"
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={saving}>
            {saving ? 'Salvando...' : 'Criar Contrato'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
