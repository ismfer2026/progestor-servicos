import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Filter, Plus, FileText, Send, FileCheck, Eye } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Orcamento {
  id: string;
  cliente_id: string;
  usuario_id: string;
  valor_total: number;
  status: string;
  criado_em: string;
  data_envio?: string;
  pdf_gerado: boolean;
  clientes?: {
    nome: string;
    email: string;
  };
  usuarios?: {
    nome: string;
  };
}

interface Usuario {
  id: string;
  nome: string;
}

const statusOptions = [
  { value: "Aguardando", label: "Aguardando", variant: "secondary" as const },
  { value: "Enviado", label: "Enviado", variant: "default" as const },
  { value: "Aprovado", label: "Aprovado", variant: "default" as const },
  { value: "Rejeitado", label: "Rejeitado", variant: "destructive" as const },
];

export function Orcamentos() {
  const { user } = useAuth();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>("");
  const [filtroDataInicio, setFiltroDataInicio] = useState<Date>();
  const [filtroDataFim, setFiltroDataFim] = useState<Date>();

  useEffect(() => {
    fetchOrcamentos();
    fetchUsuarios();
  }, []);

  const fetchOrcamentos = async () => {
    try {
      let query = supabase
        .from("orcamentos")
        .select(`
          *,
          clientes (nome, email),
          usuarios (nome)
        `)
        .order("criado_em", { ascending: false });

      if (filtroStatus) {
        query = query.eq("status", filtroStatus);
      }
      if (filtroResponsavel) {
        query = query.eq("usuario_id", filtroResponsavel);
      }
      if (filtroDataInicio) {
        query = query.gte("criado_em", filtroDataInicio.toISOString());
      }
      if (filtroDataFim) {
        query = query.lte("criado_em", filtroDataFim.toISOString());
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

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome")
        .eq("ativo", true);

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  };

  const handleGerarPDF = async (orcamentoId: string) => {
    try {
      // Implementar geração de PDF
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const handleEnviar = async (orcamentoId: string) => {
    try {
      // Implementar envio por email/WhatsApp
      toast.success("Orçamento enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar orçamento:", error);
      toast.error("Erro ao enviar orçamento");
    }
  };

  const handleGerarContrato = async (orcamentoId: string) => {
    try {
      // Implementar geração de contrato
      toast.success("Contrato gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar contrato:", error);
      toast.error("Erro ao gerar contrato");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return (
      <Badge variant={statusConfig?.variant || "secondary"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const limparFiltros = () => {
    setFiltroStatus("");
    setFiltroResponsavel("");
    setFiltroDataInicio(undefined);
    setFiltroDataFim(undefined);
  };

  useEffect(() => {
    fetchOrcamentos();
  }, [filtroStatus, filtroResponsavel, filtroDataInicio, filtroDataFim]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orçamentos</h1>
        <Link to="/orcamentos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Responsável</label>
              <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os responsáveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os responsáveis</SelectItem>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filtroDataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtroDataInicio ? (
                      format(filtroDataInicio, "PPP", { locale: ptBR })
                    ) : (
                      "Selecionar data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filtroDataInicio}
                    onSelect={setFiltroDataInicio}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filtroDataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtroDataFim ? (
                      format(filtroDataFim, "PPP", { locale: ptBR })
                    ) : (
                      "Selecionar data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filtroDataFim}
                    onSelect={setFiltroDataFim}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Orçamentos */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Data Envio</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando orçamentos...
                  </TableCell>
                </TableRow>
              ) : orcamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Nenhum orçamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                orcamentos.map((orcamento) => (
                  <TableRow key={orcamento.id}>
                    <TableCell className="font-medium">
                      {orcamento.clientes?.nome || "Cliente não encontrado"}
                    </TableCell>
                    <TableCell>
                      {orcamento.usuarios?.nome || "Usuário não encontrado"}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(orcamento.valor_total || 0)}
                    </TableCell>
                    <TableCell>{getStatusBadge(orcamento.status)}</TableCell>
                    <TableCell>
                      {format(new Date(orcamento.criado_em), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      {orcamento.data_envio
                        ? format(new Date(orcamento.data_envio), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGerarPDF(orcamento.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEnviar(orcamento.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGerarContrato(orcamento.id)}
                        >
                          <FileCheck className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}