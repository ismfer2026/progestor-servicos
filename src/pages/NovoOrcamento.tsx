import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarIcon, Plus, Search, Trash2, X, FileText } from "lucide-react";
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
  preco_total: number;
}

interface NovoCliente {
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
}

export function NovoOrcamento() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados principais
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados do formulário
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [dataServico, setDataServico] = useState<Date>();
  const [observacoes, setObservacoes] = useState("");
  const [itensOrcamento, setItensOrcamento] = useState<ItemOrcamento[]>([]);

  // Estados para busca
  const [buscaCliente, setBuscaCliente] = useState("");
  const [buscaServico, setBuscaServico] = useState("");

  // Estados para novo cliente
  const [modalNovoCliente, setModalNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState<NovoCliente>({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
  });

  // Estados para adicionar serviço
  const [modalAdicionarServico, setModalAdicionarServico] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<string>("");
  const [quantidade, setQuantidade] = useState(1);
  const [precoUnitario, setPrecoUnitario] = useState(0);

  // Estados para envio
  const [modalEnviarEmail, setModalEnviarEmail] = useState(false);
  const [emailDestinatario, setEmailDestinatario] = useState("");
  const [mensagemAdicional, setMensagemAdicional] = useState("");
  const [orcamentoSalvoId, setOrcamentoSalvoId] = useState<string | null>(null);

  useEffect(() => {
    fetchClientes();
    fetchServicos();
  }, []);

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
      toast.error("Erro ao carregar clientes");
    }
  };

  const fetchServicos = async () => {
    try {
      let query = supabase
        .from("servicos")
        .select("id, nome, descricao, preco_venda")
        .order("nome");

      if (buscaServico) {
        query = query.or(`nome.ilike.%${buscaServico}%,descricao.ilike.%${buscaServico}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      toast.error("Erro ao carregar serviços");
    }
  };

  const handleCriarCliente = async () => {
    if (!novoCliente.nome || !novoCliente.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    if (!user?.empresa_id) {
      toast.error("Erro: usuário não está associado a uma empresa");
      return;
    }

    try {
      // Get current date in Brazilian timezone
      const today = new Date();
      const todayBR = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("clientes")
        .insert([{
          ...novoCliente,
          empresa_id: user.empresa_id,
          data_cadastro: todayBR
        }])
        .select()
        .single();

      if (error) throw error;

      setClientes([...clientes, data]);
      setClienteSelecionado(data.id);
      setBuscaCliente(data.nome);
      setModalNovoCliente(false);
      setNovoCliente({ nome: "", email: "", telefone: "", endereco: "" });
      toast.success("Cliente criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      toast.error("Erro ao criar cliente");
    }
  };

  const handleAdicionarServico = () => {
    const servico = servicos.find(s => s.id === servicoSelecionado);
    if (!servico) {
      toast.error("Selecione um serviço");
      return;
    }

    if (quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (precoUnitario <= 0) {
      toast.error("Preço unitário deve ser maior que zero");
      return;
    }

    const itemExistente = itensOrcamento.find(item => item.servico_id === servicoSelecionado);
    if (itemExistente) {
      toast.error("Este serviço já foi adicionado");
      return;
    }

    const novoItem: ItemOrcamento = {
      servico_id: servico.id,
      nome: servico.nome,
      descricao: servico.descricao,
      quantidade,
      preco_unitario: precoUnitario,
      preco_total: quantidade * precoUnitario,
    };

    setItensOrcamento([...itensOrcamento, novoItem]);
    setModalAdicionarServico(false);
    setServicoSelecionado("");
    setQuantidade(1);
    setPrecoUnitario(0);
    toast.success("Serviço adicionado ao orçamento");
  };

  const handleRemoverItem = (servicoId: string) => {
    setItensOrcamento(itensOrcamento.filter(item => item.servico_id !== servicoId));
  };

  const calcularTotal = () => {
    return itensOrcamento.reduce((total, item) => total + item.preco_total, 0);
  };

  const handleSalvarOrcamento = async (showSuccessMessage = true) => {
    if (!clienteSelecionado) {
      toast.error("Selecione um cliente");
      return null;
    }

    if (itensOrcamento.length === 0) {
      toast.error("Adicione pelo menos um serviço");
      return null;
    }

    if (!user?.empresa_id) {
      toast.error("Erro: usuário não está associado a uma empresa");
      return null;
    }

    setLoading(true);
    try {
      const valorTotal = calcularTotal();
      
      const { data, error } = await supabase
        .from("orcamentos")
        .insert([{
          cliente_id: clienteSelecionado,
          usuario_id: user?.id,
          empresa_id: user.empresa_id,
          servicos: itensOrcamento as any,
          valor_total: valorTotal,
          status: "Aguardando",
        }])
        .select()
        .single();

      if (error) throw error;

      setOrcamentoSalvoId(data.id);
      
      if (showSuccessMessage) {
        toast.success("Orçamento salvo com sucesso!");
      }
      
      return data.id;
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      toast.error("Erro ao salvar orçamento");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarEmail = async () => {
    if (!emailDestinatario) {
      toast.error("Digite o email de destino");
      return;
    }

    let orcamentoId = orcamentoSalvoId;
    
    // Se o orçamento não foi salvo ainda, salvar primeiro
    if (!orcamentoId) {
      orcamentoId = await handleSalvarOrcamento(false);
      if (!orcamentoId) return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enviar-orcamento', {
        body: {
          orcamento_id: orcamentoId,
          email_destinatario: emailDestinatario,
          mensagem_adicional: mensagemAdicional
        }
      });

      if (error) throw error;

      toast.success("Orçamento enviado por email com sucesso!");
      setModalEnviarEmail(false);
      setEmailDestinatario("");
      setMensagemAdicional("");
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast.error("Erro ao enviar orçamento por email");
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarWhatsApp = async () => {
    let orcamentoId = orcamentoSalvoId;
    
    // Se o orçamento não foi salvo ainda, salvar primeiro
    if (!orcamentoId) {
      orcamentoId = await handleSalvarOrcamento(false);
      if (!orcamentoId) return;
    }

    const cliente = clientes.find(c => c.id === clienteSelecionado);
    if (!cliente?.telefone) {
      toast.error("Cliente não possui telefone cadastrado");
      return;
    }

    const valorTotal = calcularTotal();
    const mensagem = `Olá ${cliente.nome}! 

Segue o orçamento solicitado:

${itensOrcamento.map(item => 
  `• ${item.nome} - Qtd: ${item.quantidade} - R$ ${item.preco_total.toFixed(2)}`
).join('\n')}

*Valor Total: R$ ${valorTotal.toFixed(2)}*

Orçamento válido por 30 dias.
Em caso de dúvidas, estou à disposição!`;

    const telefone = cliente.telefone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success("Redirecionando para WhatsApp...");
  };

  useEffect(() => {
    fetchClientes();
  }, [buscaCliente]);

  useEffect(() => {
    fetchServicos();
  }, [buscaServico]);

  useEffect(() => {
    if (servicoSelecionado) {
      const servico = servicos.find(s => s.id === servicoSelecionado);
      if (servico && servico.preco_venda) {
        setPrecoUnitario(servico.preco_venda);
      }
    }
  }, [servicoSelecionado, servicos]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/orcamentos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Novo Orçamento</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Buscar cliente..."
                      value={buscaCliente}
                      onChange={(e) => setBuscaCliente(e.target.value)}
                    />
                    <Dialog open={modalNovoCliente} onOpenChange={setModalNovoCliente}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Novo Cliente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="nome">Nome *</Label>
                            <Input
                              id="nome"
                              value={novoCliente.nome}
                              onChange={(e) => setNovoCliente({...novoCliente, nome: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={novoCliente.email}
                              onChange={(e) => setNovoCliente({...novoCliente, email: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="telefone">Telefone</Label>
                            <Input
                              id="telefone"
                              value={novoCliente.telefone}
                              onChange={(e) => setNovoCliente({...novoCliente, telefone: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="endereco">Endereço</Label>
                            <Input
                              id="endereco"
                              value={novoCliente.endereco}
                              onChange={(e) => setNovoCliente({...novoCliente, endereco: e.target.value})}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setModalNovoCliente(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleCriarCliente}>
                              Criar Cliente
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              {clientes.length > 0 && buscaCliente && !clienteSelecionado && (
                <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-md z-50">
                  {clientes.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setClienteSelecionado(cliente.id);
                        setBuscaCliente(cliente.nome);
                      }}
                    >
                      <div className="font-medium">{cliente.nome}</div>
                      <div className="text-sm text-muted-foreground">{cliente.email}</div>
                      {cliente.telefone && (
                        <div className="text-sm text-muted-foreground">{cliente.telefone}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {clienteSelecionado && (
                <div className="p-3 bg-primary/10 rounded-md flex items-center justify-between">
                  <div>
                    <div className="font-medium">{clientes.find(c => c.id === clienteSelecionado)?.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {clientes.find(c => c.id === clienteSelecionado)?.email}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setClienteSelecionado("");
                      setBuscaCliente("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações gerais do orçamento..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Itens do Orçamento */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Itens do Orçamento</CardTitle>
                <Dialog open={modalAdicionarServico} onOpenChange={setModalAdicionarServico}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Serviço
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Adicionar Serviço</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="busca-servico">Buscar Serviço</Label>
                        <Input
                          id="busca-servico"
                          placeholder="Digite para buscar serviços..."
                          value={buscaServico}
                          onChange={(e) => setBuscaServico(e.target.value)}
                        />
                      </div>

                      {servicos.length > 0 && (
                        <div className="border rounded-md max-h-48 overflow-y-auto">
                          {servicos.map((servico) => (
                            <div
                              key={servico.id}
                              className={cn(
                                "p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted",
                                servicoSelecionado === servico.id && "bg-primary/10"
                              )}
                              onClick={() => setServicoSelecionado(servico.id)}
                            >
                              <div className="font-medium">{servico.nome}</div>
                              {servico.descricao && (
                                <div className="text-sm text-muted-foreground">{servico.descricao}</div>
                              )}
                              {servico.preco_venda && (
                                <div className="text-sm font-medium text-primary">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(servico.preco_venda)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quantidade">Quantidade</Label>
                          <Input
                            id="quantidade"
                            type="number"
                            min="1"
                            value={quantidade}
                            onChange={(e) => setQuantidade(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="preco">Preço Unitário</Label>
                          <Input
                            id="preco"
                            type="number"
                            min="0"
                            step="0.01"
                            value={precoUnitario}
                            onChange={(e) => setPrecoUnitario(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setModalAdicionarServico(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAdicionarServico}>
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {itensOrcamento.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum serviço adicionado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Preço Unit.</TableHead>
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
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.preco_total)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoverItem(item.servico_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Subtotal:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(calcularTotal())}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(calcularTotal())}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => handleSalvarOrcamento(true)}
              disabled={loading || !clienteSelecionado || itensOrcamento.length === 0}
            >
              {loading ? "Salvando..." : "Salvar Orçamento"}
            </Button>
            
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                if (!clienteSelecionado || itensOrcamento.length === 0) {
                  toast.error("Adicione um cliente e serviços para visualizar o PDF");
                  return;
                }
                // Open PDF preview in new window
                const cliente = clientes.find(c => c.id === clienteSelecionado);
                const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Orçamento - ${cliente?.nome}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .info { margin: 20px 0; }
    .info-row { display: flex; margin: 5px 0; }
    .info-label { font-weight: bold; width: 150px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>ORÇAMENTO</h1>
  
  <div class="info">
    <div class="info-row">
      <span class="info-label">Cliente:</span>
      <span>${cliente?.nome}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span>${cliente?.email || '-'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Telefone:</span>
      <span>${cliente?.telefone || '-'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Data:</span>
      <span>${new Date().toLocaleDateString('pt-BR')}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Serviço</th>
        <th>Qtd</th>
        <th>Preço Unit.</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itensOrcamento.map(item => `
        <tr>
          <td>
            <strong>${item.nome}</strong>
            ${item.descricao ? `<br/><small>${item.descricao}</small>` : ''}
          </td>
          <td>${item.quantidade}</td>
          <td>R$ ${item.preco_unitario.toFixed(2)}</td>
          <td>R$ ${item.preco_total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total">
    VALOR TOTAL: R$ ${calcularTotal().toFixed(2)}
  </div>

  ${observacoes ? `
    <div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-left: 3px solid #333;">
      <strong>Observações:</strong><br/>
      ${observacoes}
    </div>
  ` : ''}

  <div style="margin-top: 40px; font-size: 12px; color: #666; text-align: center;">
    Orçamento válido por 30 dias
  </div>
</body>
</html>
                `;
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                  newWindow.document.write(pdfContent);
                  newWindow.document.close();
                }
              }}
              disabled={!clienteSelecionado || itensOrcamento.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Pré-visualizar PDF
            </Button>

            <Dialog open={modalEnviarEmail} onOpenChange={setModalEnviarEmail}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full" 
                  variant="default"
                  disabled={loading || !clienteSelecionado || itensOrcamento.length === 0}
                >
                  Enviar por E-mail
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enviar Orçamento por E-mail</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-destinatario">E-mail do Cliente</Label>
                    <Input
                      id="email-destinatario"
                      type="email"
                      placeholder="cliente@email.com"
                      value={emailDestinatario}
                      onChange={(e) => setEmailDestinatario(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mensagem">Mensagem Adicional (opcional)</Label>
                    <Textarea
                      id="mensagem"
                      placeholder="Digite uma mensagem personalizada..."
                      value={mensagemAdicional}
                      onChange={(e) => setMensagemAdicional(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setModalEnviarEmail(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleEnviarEmail} disabled={loading}>
                      {loading ? "Enviando..." : "Enviar E-mail"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={handleEnviarWhatsApp}
              disabled={loading || !clienteSelecionado || itensOrcamento.length === 0}
              className="w-full"
              variant="secondary"
            >
              Enviar por WhatsApp
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/orcamentos")}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}