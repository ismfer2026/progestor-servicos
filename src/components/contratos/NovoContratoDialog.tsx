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

interface Usuario {
  id: string;
  nome: string;
}

interface Modelo {
  id: string;
  nome: string;
  conteudo_template: string;
}

interface Servico {
  nome: string;
  valor: number;
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
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  
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
  const [novoServicoNome, setNovoServicoNome] = useState('');
  const [novoServicoValor, setNovoServicoValor] = useState('');
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
      const [clientesData, usuariosData] = await Promise.all([
        supabase
          .from('clientes')
          .select('id, nome, documento, endereco')
          .eq('empresa_id', user.empresa_id)
          .order('nome'),
        supabase
          .from('usuarios')
          .select('id, nome')
          .eq('empresa_id', user.empresa_id)
          .eq('ativo', true)
          .order('nome')
      ]);

      if (clientesData.data) setClientes(clientesData.data);
      if (usuariosData.data) setUsuarios(usuariosData.data);
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

  const addServico = () => {
    if (!novoServicoNome || !novoServicoValor) {
      toast.error('Preencha o nome e valor do serviço');
      return;
    }

    setServicos([...servicos, {
      nome: novoServicoNome,
      valor: parseFloat(novoServicoValor)
    }]);
    setNovoServicoNome('');
    setNovoServicoValor('');
  };

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

    setSaving(true);

    try {
      const modelo = modelos.find(m => m.id === modeloId);
      let conteudoContrato = modelo?.conteudo_template || '';

      // Substituir variáveis no template
      const cliente = clientes.find(c => c.id === clienteId);
      const colaborador = usuarios.find(u => u.id === colaboradorId);

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

      const { error } = await supabase
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
        });

      if (error) throw error;

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
                  {usuarios.map(usuario => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Serviços *</Label>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Nome do serviço"
                  value={novoServicoNome}
                  onChange={(e) => setNovoServicoNome(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Valor"
                  value={novoServicoValor}
                  onChange={(e) => setNovoServicoValor(e.target.value)}
                />
                <Button onClick={addServico} type="button">
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
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="font-bold">
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
