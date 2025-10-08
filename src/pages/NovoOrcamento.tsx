import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CalendarIcon, Plus, X, Trash2, Eye, Clock, MapPin, User, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
}

interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  preco_venda?: number;
}

interface ItemOrcamento {
  servico_id: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  tipo_desconto: 'valor' | 'percentual';
  preco_total: number;
}

export function NovoOrcamento() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: orcamentoId } = useParams();
  const isEditing = !!orcamentoId;

  // Estados principais
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados do formulário
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [modeloDocumento, setModeloDocumento] = useState("");
  const [localEvento, setLocalEvento] = useState("");
  const [dataEvento, setDataEvento] = useState<Date>();
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioTermino, setHorarioTermino] = useState("");
  const [dataValidade, setDataValidade] = useState<Date>();
  const [observacoes, setObservacoes] = useState("");
  const [itensOrcamento, setItensOrcamento] = useState<ItemOrcamento[]>([]);

  // Estados para busca de cliente
  const [buscaCliente, setBuscaCliente] = useState("");
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);

  // Estados para modal de adicionar serviço
  const [modalAdicionarServico, setModalAdicionarServico] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<string>("");
  const [quantidade, setQuantidade] = useState(1);
  const [precoUnitario, setPrecoUnitario] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [tipoDesconto, setTipoDesconto] = useState<'valor' | 'percentual'>('valor');

  useEffect(() => {
    if (buscaCliente) {
      fetchClientes();
      setMostrarListaClientes(true);
    }
  }, [buscaCliente]);

  useEffect(() => {
    fetchServicos();
  }, []);

  useEffect(() => {
    if (isEditing && orcamentoId) {
      loadOrcamento();
    }
  }, [isEditing, orcamentoId]);

  const loadOrcamento = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          clientes (*)
        `)
        .eq('id', orcamentoId)
        .single();

      if (error) throw error;

      if (data) {
        setClienteSelecionado(data.cliente_id);
        setBuscaCliente(data.clientes?.nome || '');
        
        // Load service details
        if (data.data_servico) setDataEvento(new Date(data.data_servico));
        if (data.horario_inicio) setHorarioInicio(data.horario_inicio);
        if (data.horario_fim) setHorarioTermino(data.horario_fim);
        if (data.local_servico) setLocalEvento(data.local_servico);
        if (data.data_validade) setDataValidade(new Date(data.data_validade));
        if (data.observacoes) setObservacoes(data.observacoes);
        
        // Type assertion for servicos from JSON
        const servicosData = data.servicos as any;
        if (Array.isArray(servicosData)) {
          setItensOrcamento(servicosData as ItemOrcamento[]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
      toast.error('Erro ao carregar orçamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (servicoSelecionado) {
      const servico = servicos.find(s => s.id === servicoSelecionado);
      if (servico?.preco_venda) {
        setPrecoUnitario(servico.preco_venda);
      }
    }
  }, [servicoSelecionado, servicos]);

  const fetchClientes = async () => {
    try {
      let query = supabase
        .from("clientes")
        .select("id, nome, email, telefone, endereco")
        .order("nome");

      if (buscaCliente) {
        query = query.or(`nome.ilike.%${buscaCliente}%,email.ilike.%${buscaCliente}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  const fetchServicos = async () => {
    try {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome, descricao, preco_venda")
        .is("cliente_id", null)
        .eq("status", "Ativo")
        .order("nome");

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
    }
  };

  const handleSelecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente.id);
    setBuscaCliente(cliente.nome);
    setMostrarListaClientes(false);
  };

  const calcularPrecoTotal = () => {
    const subtotal = quantidade * precoUnitario;
    if (tipoDesconto === 'percentual') {
      return subtotal - (subtotal * desconto / 100);
    }
    return subtotal - desconto;
  };

  const handleAdicionarServico = () => {
    if (!servicoSelecionado) {
      toast.error("Selecione um serviço");
      return;
    }

    if (quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    const servico = servicos.find(s => s.id === servicoSelecionado);
    if (!servico) return;

    const itemExistente = itensOrcamento.find(item => item.servico_id === servicoSelecionado);
    if (itemExistente) {
      toast.error("Este serviço já foi adicionado");
      return;
    }

    const novoItem: ItemOrcamento = {
      servico_id: servicoSelecionado,
      nome: servico.nome,
      descricao: servico.descricao,
      quantidade,
      preco_unitario: precoUnitario,
      desconto,
      tipo_desconto: tipoDesconto,
      preco_total: calcularPrecoTotal(),
    };

    setItensOrcamento([...itensOrcamento, novoItem]);
    setModalAdicionarServico(false);
    setServicoSelecionado("");
    setQuantidade(1);
    setPrecoUnitario(0);
    setDesconto(0);
    toast.success("Serviço adicionado");
  };

  const handleRemoverItem = (servicoId: string) => {
    setItensOrcamento(itensOrcamento.filter(item => item.servico_id !== servicoId));
  };

  const calcularTotal = () => {
    return itensOrcamento.reduce((total, item) => total + item.preco_total, 0);
  };

  const handleSalvarOrcamento = async () => {
    if (!clienteSelecionado) {
      toast.error("Selecione um cliente");
      return;
    }

    if (itensOrcamento.length === 0) {
      toast.error("Adicione pelo menos um serviço");
      return;
    }

    if (!user?.empresa_id) {
      toast.error("Erro: usuário não está associado a uma empresa");
      return;
    }

    setLoading(true);
    try {
      const valorTotal = calcularTotal();
      const orcamentoData = {
        cliente_id: clienteSelecionado,
        usuario_id: user?.id,
        empresa_id: user.empresa_id,
        servicos: itensOrcamento as any,
        valor_total: valorTotal,
        status: "Aguardando",
        data_validade: dataValidade?.toISOString().split('T')[0],
        data_servico: dataEvento?.toISOString().split('T')[0],
        horario_inicio: horarioInicio || null,
        horario_fim: horarioTermino || null,
        local_servico: localEvento || null,
        observacoes: observacoes || null,
      };

      if (isEditing && orcamentoId) {
        const { error } = await supabase
          .from("orcamentos")
          .update(orcamentoData)
          .eq('id', orcamentoId);

        if (error) throw error;
        toast.success("Orçamento atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("orcamentos")
          .insert([orcamentoData]);

        if (error) throw error;
        toast.success("Orçamento salvo com sucesso!");
      }

      navigate("/orcamentos");
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      toast.error("Erro ao salvar orçamento");
    } finally {
      setLoading(false);
    }
  };

  const handleVisualizarPDF = () => {
    if (!clienteSelecionado || itensOrcamento.length === 0) {
      toast.error("Adicione um cliente e serviços para visualizar o PDF");
      return;
    }
    toast.info("Funcionalidade de visualização em PDF em desenvolvimento");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/orcamentos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Novo Orçamento</h1>
            <p className="text-muted-foreground">Preencha os dados para gerar o orçamento</p>
          </div>
        </div>

        {/* Dados do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <div className="relative">
                  <Input
                    id="cliente"
                    placeholder="Selecione um cliente"
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    onFocus={() => setMostrarListaClientes(true)}
                  />
                  {mostrarListaClientes && clientes.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {clientes.map((cliente) => (
                        <div
                          key={cliente.id}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => handleSelecionarCliente(cliente)}
                        >
                          <div className="font-medium">{cliente.nome}</div>
                          <div className="text-sm text-muted-foreground">{cliente.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo do Documento</Label>
                <Select value={modeloDocumento} onValueChange={setModeloDocumento}>
                  <SelectTrigger id="modelo">
                    <SelectValue placeholder="Selecione um modelo (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="padrao">Modelo Padrão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="local">Local do Serviço</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="local"
                    placeholder="Endereço ou nome do local"
                    value={localEvento}
                    onChange={(e) => setLocalEvento(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Serviço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Dados do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data do Serviço *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataEvento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataEvento ? format(dataEvento, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataEvento}
                      onSelect={setDataEvento}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario-inicio">Horário de Início</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="horario-inicio"
                    type="time"
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario-termino">Horário de Término</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="horario-termino"
                    type="time"
                    value={horarioTermino}
                    onChange={(e) => setHorarioTermino(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itens do Orçamento */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do Orçamento
              </CardTitle>
              <Button onClick={() => setModalAdicionarServico(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {itensOrcamento.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum serviço adicionado</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensOrcamento.map((item) => (
                      <TableRow key={item.servico_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.nome}</div>
                            {item.descricao && (
                              <div className="text-sm text-muted-foreground">{item.descricao}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.preco_unitario)}
                        </TableCell>
                        <TableCell>
                          {item.tipo_desconto === 'percentual' 
                            ? `${item.desconto}%` 
                            : new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(item.desconto)
                          }
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.preco_total)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoverItem(item.servico_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6 flex justify-end">
                  <div className="text-2xl font-bold">
                    Total: {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(calcularTotal())}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Observações e Validade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observações adicionais sobre o orçamento..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={6}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validade do Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataValidade && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataValidade ? format(dataValidade, "PPP", { locale: ptBR }) : "Selecionar validade"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataValidade}
                    onSelect={setDataValidade}
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button variant="outline" onClick={handleVisualizarPDF} className="gap-2">
            <Eye className="h-4 w-4" />
            Visualizar PDF
          </Button>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/orcamentos")}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvarOrcamento} 
              disabled={loading || !clienteSelecionado || itensOrcamento.length === 0}
              className="gap-2"
            >
              {loading ? "Salvando..." : "Salvar e Continuar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Serviço */}
      <Dialog open={modalAdicionarServico} onOpenChange={setModalAdicionarServico}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Itens do Orçamento - Adicionar Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Serviço *</Label>
                <Select value={servicoSelecionado} onValueChange={setServicoSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((servico) => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.nome} - {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(servico.preco_venda || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {servicoSelecionado && servicos.find(s => s.id === servicoSelecionado)?.descricao && (
                  <p className="text-sm text-muted-foreground">
                    {servicos.find(s => s.id === servicoSelecionado)?.descricao}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Qtd *</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Preço Unit. *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precoUnitario}
                  onChange={(e) => setPrecoUnitario(Number(e.target.value))}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Desconto</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={desconto}
                    onChange={(e) => setDesconto(Number(e.target.value))}
                    placeholder="0"
                  />
                  <Select value={tipoDesconto} onValueChange={(value: 'valor' | 'percentual') => setTipoDesconto(value)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valor">R$</SelectItem>
                      <SelectItem value="percentual">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Total</Label>
                <Input
                  value={new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(calcularPrecoTotal())}
                  disabled
                  className="bg-muted font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalAdicionarServico(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdicionarServico}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
