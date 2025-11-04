import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Send, Eye, MoreVertical, Plus, Search, DollarSign, CheckCircle2, FileCheck, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PDFViewer } from "@/components/orcamento/PDFViewer";
import { WhatsAppMessageDialog } from "@/components/shared/WhatsAppMessageDialog";

interface Orcamento {
  id: string;
  cliente_id: string;
  usuario_id: string;
  valor_total: number;
  status: string;
  criado_em: string;
  data_envio?: string;
  pdf_gerado: boolean;
  servicos: any;
  clientes?: {
    nome: string;
    email: string;
    telefone?: string;
  };
  usuarios?: {
    nome: string;
  };
}

const statusMap = {
  "Aguardando": { label: "Rascunho", variant: "secondary" as const },
  "Enviado": { label: "Enviado", variant: "default" as const },
  "Aprovado": { label: "Aprovado", variant: "default" as const },
  "Rejeitado": { label: "Rejeitado", variant: "destructive" as const },
};

export function Orcamentos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  
  // Estados simplificados
  const [orcamentoExcluir, setOrcamentoExcluir] = useState<string | null>(null);
  const [orcamentoEnviar, setOrcamentoEnviar] = useState<Orcamento | null>(null);

  useEffect(() => {
    fetchOrcamentos();
  }, [filtroStatus]);

  const fetchOrcamentos = async () => {
    try {
      let query = supabase
        .from("orcamentos")
        .select(`
          *,
          clientes (nome, email, telefone),
          usuarios (nome)
        `)
        .order("criado_em", { ascending: false });

      if (filtroStatus && filtroStatus !== "all") {
        query = query.eq("status", filtroStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrcamentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      toast.error("Erro ao carregar orçamentos");
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (id: string) => {
    navigate(`/orcamentos/editar/${id}`);
  };

  const handleVisualizar = (id: string) => {
    window.open(`/orcamentos/visualizar/${id}`, '_blank');
  };

  const handleAbrirEnvio = (orcamento: Orcamento) => {
    setOrcamentoEnviar(orcamento);
  };

  const handleEnviarWhatsApp = async () => {
    if (!orcamentoEnviar) return;
    
    const telefone = orcamentoEnviar.clientes?.telefone;
    if (!telefone) {
      toast.error("Cliente sem telefone cadastrado");
      setOrcamentoEnviar(null);
      return;
    }
    
    const mensagem = `Olá ${orcamentoEnviar.clientes?.nome}! Segue o orçamento solicitado.\n\nOrçamento #${orcamentoEnviar.id.slice(0, 8)}\nValor Total: ${formatCurrency(orcamentoEnviar.valor_total || 0)}`;
    const url = `https://wa.me/${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(url, '_blank');
    
    const orcId = orcamentoEnviar.id;
    setOrcamentoEnviar(null);
    
    // Registra envio
    setTimeout(async () => {
      try {
        await supabase.from('logs_envio').insert({
          orcamento_id: orcId,
          empresa_id: user!.empresa_id,
          enviado_por: user!.id,
          destinatario: telefone,
          tipo_envio: 'whatsapp',
          status: 'enviado'
        });

        await supabase
          .from('orcamentos')
          .update({ status: 'Enviado', data_envio: new Date().toISOString() })
          .eq('id', orcId);

        toast.success("WhatsApp aberto!");
        fetchOrcamentos();
      } catch (error) {
        console.error('Erro ao registrar envio:', error);
      }
    }, 500);
  };

  const handleEnviarEmail = async () => {
    if (!orcamentoEnviar) return;
    
    if (!orcamentoEnviar.clientes?.email) {
      toast.error("Cliente sem email cadastrado");
      setOrcamentoEnviar(null);
      return;
    }
    
    toast.info("Enviando orçamento...");
    
    const orcId = orcamentoEnviar.id;
    const clienteEmail = orcamentoEnviar.clientes.email;
    const clienteNome = orcamentoEnviar.clientes.nome;
    
    setOrcamentoEnviar(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('enviar-orcamento', {
        body: {
          orcamento_id: orcId,
          email_destinatario: clienteEmail,
          mensagem_adicional: `Olá ${clienteNome}! Segue o orçamento solicitado.`,
        }
      });

      if (error) {
        console.error("Erro ao enviar email:", error);
        toast.error("Erro ao enviar orçamento");
      } else if (data?.error) {
        console.error("Erro da edge function:", data.error);
        toast.error(data.error);
      } else {
        toast.success("Orçamento enviado por email!");
        fetchOrcamentos();
      }
    } catch (error: any) {
      console.error("Erro ao enviar email:", error);
      toast.error("Erro ao enviar orçamento");
    }
  };

  const handleEnviarAmbos = async () => {
    if (!orcamentoEnviar) return;
    
    const orcamento = orcamentoEnviar;
    
    // WhatsApp
    const telefone = orcamento.clientes?.telefone;
    if (telefone) {
      const mensagem = `Olá ${orcamento.clientes?.nome}! Segue o orçamento solicitado.\n\nOrçamento #${orcamento.id.slice(0, 8)}\nValor Total: ${formatCurrency(orcamento.valor_total || 0)}`;
      const url = `https://wa.me/${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank');
    }
    
    // Email
    if (orcamento.clientes?.email) {
      toast.info("Enviando orçamento...");
      
      try {
        await supabase.functions.invoke('enviar-orcamento', {
          body: {
            orcamento_id: orcamento.id,
            email_destinatario: orcamento.clientes.email,
            mensagem_adicional: `Olá ${orcamento.clientes.nome}! Segue o orçamento solicitado.`,
          }
        });
        toast.success("Orçamento enviado!");
      } catch (error) {
        console.error("Erro ao enviar:", error);
      }
    }
    
    setOrcamentoEnviar(null);
    
    // Registra envio
    setTimeout(async () => {
      try {
        await supabase
          .from('orcamentos')
          .update({ status: 'Enviado', data_envio: new Date().toISOString() })
          .eq('id', orcamento.id);
        fetchOrcamentos();
      } catch (error) {
        console.error('Erro ao registrar envio:', error);
      }
    }, 500);
  };

  const handleAbrirExcluir = (orcamentoId: string) => {
    setOrcamentoExcluir(orcamentoId);
  };

  const handleExcluir = async (id: string) => {
    try {
      const { error } = await supabase
        .from("orcamentos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Orçamento excluído!");
      setOrcamentoExcluir(null);
      fetchOrcamentos();
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast.error("Erro ao excluir orçamento");
      setOrcamentoExcluir(null);
    }
  };

  const handleCancelarExclusao = () => {
    setOrcamentoExcluir(null);
  };

  const handleGerarContrato = (orcamento: Orcamento) => {
    // Navegar para página de contratos com os dados do orçamento
    navigate(`/contratos/novo?orcamento_id=${orcamento.id}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getNumeroOrcamento = (id: string) => {
    const shortId = id.slice(0, 6).toUpperCase();
    return `ORC-DRAFT-${shortId}`;
  };

  const orcamentosFiltrados = orcamentos.filter(orc => {
    const numero = getNumeroOrcamento(orc.id);
    return numero.toLowerCase().includes(busca.toLowerCase());
  });

  // Estatísticas
  const totalOrcamentos = orcamentos.length;
  const totalEnviados = orcamentos.filter(o => o.status === "Enviado").length;
  const totalAprovados = orcamentos.filter(o => o.status === "Aprovado").length;
  const valorTotal = orcamentos.reduce((sum, o) => sum + (o.valor_total || 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie propostas e orçamentos dos seus clientes</p>
        </div>
        <Button onClick={() => navigate("/orcamentos/novo")} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-foreground">{totalOrcamentos}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enviados</p>
                <p className="text-3xl font-bold text-foreground">{totalEnviados}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Send className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                <p className="text-3xl font-bold text-foreground">{totalAprovados}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(valorTotal)}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número do orçamento..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Aguardando">Rascunho</SelectItem>
                <SelectItem value="Enviado">Enviado</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Orçamentos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data do Evento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando orçamentos...
                    </TableCell>
                  </TableRow>
                ) : orcamentosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhum orçamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  orcamentosFiltrados.map((orcamento) => {
                    const statusInfo = statusMap[orcamento.status as keyof typeof statusMap] || statusMap["Aguardando"];
                    const isExcluindo = orcamentoExcluir === orcamento.id;
                    const isEnviando = orcamentoEnviar?.id === orcamento.id;
                    
                    return (
                      <TableRow key={orcamento.id} className={isExcluindo ? "bg-destructive/10" : isEnviando ? "bg-primary/10" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium">{getNumeroOrcamento(orcamento.id)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {orcamento.clientes?.nome?.charAt(0) || "?"}
                              </span>
                            </div>
                            <span>{orcamento.clientes?.nome || "Cliente não encontrado"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">-</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(orcamento.valor_total || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isExcluindo ? (
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-sm text-destructive font-medium">Confirmar exclusão?</span>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleExcluir(orcamento.id)}
                              >
                                Sim
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleCancelarExclusao}
                              >
                                Não
                              </Button>
                            </div>
                          ) : isEnviando ? (
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-sm font-medium">Enviar por:</span>
                              <Button 
                                size="sm" 
                                onClick={handleEnviarWhatsApp}
                              >
                                WhatsApp
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={handleEnviarEmail}
                              >
                                Email
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={handleEnviarAmbos}
                              >
                                Ambos
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => setOrcamentoEnviar(null)}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditar(orcamento.id)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleVisualizar(orcamento.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAbrirEnvio(orcamento)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleGerarContrato(orcamento)}>
                                  <FileCheck className="h-4 w-4 mr-2" />
                                  Gerar Contrato
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleAbrirExcluir(orcamento.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
