import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Save, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Parcela {
  numero: number;
  valor: number;
  data_vencimento: Date;
}

export function NovoContrato() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const orcamentoId = searchParams.get('orcamento_id');

  const [loading, setLoading] = useState(false);
  const [orcamento, setOrcamento] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  
  // Contract fields
  const [modeloSelecionado, setModeloSelecionado] = useState<string>("padrao");
  const [valorSinal, setValorSinal] = useState<number>(0);
  const [dataSinal, setDataSinal] = useState<Date>();
  const [valorRestante, setValorRestante] = useState<number>(0);
  const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [observacoes, setObservacoes] = useState<string>("");

  useEffect(() => {
    if (orcamentoId) {
      loadOrcamento();
    }
  }, [orcamentoId]);

  useEffect(() => {
    if (orcamento) {
      const restante = (orcamento.valor_total || 0) - valorSinal;
      setValorRestante(restante);
      
      // Generate parcelas
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
    }
  }, [valorSinal, numeroParcelas, orcamento]);

  const loadOrcamento = async () => {
    try {
      const { data: orcamentoData, error: orcamentoError } = await supabase
        .from('orcamentos')
        .select(`
          *,
          clientes (*)
        `)
        .eq('id', orcamentoId)
        .single();

      if (orcamentoError) throw orcamentoError;

      setOrcamento(orcamentoData);
      setCliente(orcamentoData.clientes);
      setValorRestante(orcamentoData.valor_total || 0);
    } catch (error) {
      console.error("Erro ao carregar orçamento:", error);
      toast.error("Erro ao carregar dados do orçamento");
    }
  };

  const handleSalvarContrato = async () => {
    if (!user || !orcamento) {
      toast.error("Dados insuficientes para gerar contrato");
      return;
    }

    if (valorSinal > 0 && !dataSinal) {
      toast.error("Informe a data do sinal");
      return;
    }

    setLoading(true);

    try {
      // Generate contract number
      const numeroContrato = `CT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // Generate contract content
      const conteudoContrato = gerarConteudoContrato();

      // Save contract
      const { data: contrato, error: contratoError } = await supabase
        .from('contratos')
        .insert({
          orcamento_id: orcamento.id,
          empresa_id: user.empresa_id,
          numero_contrato: numeroContrato,
          titulo: `Contrato de Prestação de Serviços - ${cliente?.nome}`,
          valor_total: orcamento.valor_total,
          data_inicio: new Date().toISOString(),
          status_assinatura: 'Pendente',
          pdf_contrato: conteudoContrato,
          observacoes: observacoes,
          cliente_id: orcamento.cliente_id,
        })
        .select()
        .single();

      if (contratoError) throw contratoError;

      // Save payment info in financeiro table
      if (valorSinal > 0) {
        await supabase.from('financeiro_movimentacoes').insert({
          empresa_id: user.empresa_id,
          cliente_id: orcamento.cliente_id,
          tipo: 'receita',
          descricao: `Sinal - ${numeroContrato}`,
          valor: valorSinal,
          data_vencimento: dataSinal?.toISOString().split('T')[0],
          categoria: 'Contrato',
          status: 'pendente',
        });
      }

      // Save parcelas
      for (const parcela of parcelas) {
        await supabase.from('financeiro_movimentacoes').insert({
          empresa_id: user.empresa_id,
          cliente_id: orcamento.cliente_id,
          tipo: 'receita',
          descricao: `Parcela ${parcela.numero}/${numeroParcelas} - ${numeroContrato}`,
          valor: parcela.valor,
          data_vencimento: parcela.data_vencimento.toISOString().split('T')[0],
          categoria: 'Contrato',
          status: 'pendente',
        });
      }

      // Update orcamento status
      await supabase
        .from('orcamentos')
        .update({ status: 'Aprovado' })
        .eq('id', orcamento.id);

      toast.success("Contrato gerado com sucesso!");
      navigate('/contratos');
    } catch (error) {
      console.error("Erro ao salvar contrato:", error);
      toast.error("Erro ao gerar contrato");
    } finally {
      setLoading(false);
    }
  };

  const gerarConteudoContrato = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    const formatTime = (time: string) => {
      if (!time) return '';
      return time.substring(0, 5);
    };
    
    return `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Contrato Nº: CT${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}
Data: ${dataAtual}

CONTRATANTE:
Nome: ${cliente?.nome || 'N/A'}
CPF/CNPJ: ${cliente?.cpf_cnpj || 'N/A'}
Endereço: ${cliente?.endereco || 'N/A'}
Email: ${cliente?.email || 'N/A'}
Telefone: ${cliente?.telefone || 'N/A'}

DETALHES DO SERVIÇO:
${orcamento?.data_servico ? `Data: ${new Date(orcamento.data_servico).toLocaleDateString('pt-BR')}` : ''}
${orcamento?.horario_inicio && orcamento?.horario_fim ? `Horário: ${formatTime(orcamento.horario_inicio)} às ${formatTime(orcamento.horario_fim)}` : ''}
${orcamento?.local_servico ? `Local: ${orcamento.local_servico}` : ''}

OBJETO DO CONTRATO:
O presente contrato tem por objeto a prestação de serviços conforme especificado no orçamento:

SERVIÇOS:
${Array.isArray(orcamento?.servicos) ? orcamento.servicos.map((s: any) => 
  `- ${s.nome}: ${s.descricao || ''} | Qtd: ${s.quantidade || 1} | Valor: R$ ${(s.preco_total || 0).toFixed(2)}`
).join('\n') : ''}

VALOR TOTAL: R$ ${(orcamento?.valor_total || 0).toFixed(2)}

FORMA DE PAGAMENTO:
${valorSinal > 0 ? `Sinal: R$ ${valorSinal.toFixed(2)} - Data: ${dataSinal ? format(dataSinal, 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}` : ''}
Valor Restante: R$ ${valorRestante.toFixed(2)}
Parcelamento: ${numeroParcelas}x de R$ ${(valorRestante / numeroParcelas).toFixed(2)}

DATAS DE VENCIMENTO DAS PARCELAS:
${parcelas.map(p => `Parcela ${p.numero}: R$ ${p.valor.toFixed(2)} - Vencimento: ${format(p.data_vencimento, 'dd/MM/yyyy', { locale: ptBR })}`).join('\n')}

OBSERVAÇÕES:
${observacoes || 'Nenhuma observação adicional.'}

CLÁUSULAS GERAIS:
1. O presente contrato entrará em vigor na data de sua assinatura.
2. Os serviços serão executados conforme especificações técnicas do orçamento.
3. O pagamento deverá ser realizado conforme cronograma acordado.
4. Em caso de atraso no pagamento, serão aplicados juros de 1% ao mês e multa de 2%.
5. Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 dias.

________________________        ________________________
CONTRATANTE                     CONTRATADO
`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const updateParcelaData = (index: number, data: Date) => {
    const novasParcelas = [...parcelas];
    novasParcelas[index].data_vencimento = data;
    setParcelas(novasParcelas);
  };

  if (!orcamento && orcamentoId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Novo Contrato</h1>
          <p className="text-muted-foreground">Gere um contrato a partir do orçamento</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/orcamentos')}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Orçamento Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados do Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Cliente</Label>
                <p className="font-medium">{cliente?.nome || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-sm">{cliente?.email || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Telefone</Label>
                <p className="text-sm">{cliente?.telefone || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Endereço</Label>
                <p className="text-sm">{cliente?.endereco || 'N/A'}</p>
              </div>
              
              {/* Service Details */}
              {(orcamento?.data_servico || orcamento?.horario_inicio || orcamento?.local_servico) && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground mb-2 block">Detalhes do Serviço</Label>
                  {orcamento?.data_servico && (
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground">Data: </span>
                      <span className="text-sm">{new Date(orcamento.data_servico).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {(orcamento?.horario_inicio || orcamento?.horario_fim) && (
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground">Horário: </span>
                      <span className="text-sm">
                        {orcamento.horario_inicio?.substring(0, 5)} às {orcamento.horario_fim?.substring(0, 5)}
                      </span>
                    </div>
                  )}
                  {orcamento?.local_servico && (
                    <div>
                      <span className="text-xs text-muted-foreground">Local: </span>
                      <span className="text-sm">{orcamento.local_servico}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground">Valor Total</Label>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(orcamento?.valor_total || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Modelo de Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={modeloSelecionado} onValueChange={setModeloSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="padrao">Modelo Padrão do Sistema</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sinal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label>Data do Sinal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataSinal && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataSinal ? format(dataSinal, 'dd/MM/yyyy', { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dataSinal}
                        onSelect={setDataSinal}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Restante */}
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm text-muted-foreground">Valor Restante</Label>
                <p className="text-2xl font-bold">{formatCurrency(valorRestante)}</p>
              </div>

              {/* Parcelas */}
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
                        {num}x de {formatCurrency(valorRestante / num)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Datas das Parcelas */}
              <div className="space-y-3">
                <Label>Datas de Vencimento</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {parcelas.map((parcela, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-20">
                        {parcela.numero}ª parcela:
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(parcela.data_vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={parcela.data_vencimento}
                            onSelect={(date) => date && updateParcelaData(index, date)}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações ou cláusulas especiais para este contrato..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/orcamentos')}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarContrato}
              disabled={loading}
            >
              {loading ? (
                <>Gerando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Gerar Contrato
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}