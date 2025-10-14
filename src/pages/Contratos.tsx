import React, { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Edit, Send, Download, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ContratosPDFViewer } from '@/components/contratos/ContratosPDFViewer';
import { ModeloPDFViewer } from '@/components/contratos/ModeloPDFViewer';
import { NovoContratoDialog } from '@/components/contratos/NovoContratoDialog';

interface Contrato {
  id: string;
  titulo?: string;
  numero_contrato?: string;
  valor_total?: number;
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  data_assinatura?: string;
  cliente_id?: string;
  servico_id?: string;
  orcamento_id?: string;
  observacoes?: string;
  empresa_id?: string;
  pdf_contrato?: string;
  status_assinatura?: string;
}

interface Modelo {
  id: string;
  nome: string;
  tipo: string;
  conteudo_template: string;
  ativo: boolean;
}

export default function Contratos() {
  const { user } = useAuth();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showNewContract, setShowNewContract] = useState(false);
  const [showNewModel, setShowNewModel] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contrato | null>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [nomeModelo, setNomeModelo] = useState('');
  const [tipoModelo, setTipoModelo] = useState('contrato');
  const [conteudoModelo, setConteudoModelo] = useState('');
  const [assinaturaEmpresa, setAssinaturaEmpresa] = useState('');
  const [arquivoModelo, setArquivoModelo] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [modeloSelecionadoEdit, setModeloSelecionadoEdit] = useState<Modelo | null>(null);
  const [showModeloPDFViewer, setShowModeloPDFViewer] = useState(false);
  const [modeloParaVisualizar, setModeloParaVisualizar] = useState<Modelo | null>(null);

  useEffect(() => {
    loadContratosData();
    loadAssinaturaEmpresa();
  }, [user]);

  const loadAssinaturaEmpresa = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('empresa_id', user.empresa_id)
        .eq('chave', 'assinatura_empresa')
        .single();
      
      if (data?.valor) {
        setAssinaturaEmpresa(data.valor as string);
      }
    } catch (error) {
      console.error('Error loading signature:', error);
    }
  };

  const saveAssinaturaEmpresa = async (assinatura: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert({
          empresa_id: user.empresa_id,
          chave: 'assinatura_empresa',
          valor: assinatura,
          tipo: 'texto',
          descricao: 'Assinatura da empresa para contratos'
        }, {
          onConflict: 'empresa_id,chave'
        });
      
      if (error) throw error;
      setAssinaturaEmpresa(assinatura);
      toast.success('Assinatura salva com sucesso!');
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Erro ao salvar assinatura');
    }
  };

  const loadContratosData = async () => {
    if (!user) return;

    try {
      // Load contracts
      const { data: contratosData, error: contratosError } = await supabase
        .from('contratos')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('data_inicio', { ascending: false });

      if (contratosError) throw contratosError;

      // Load templates
      const { data: modelosData, error: modelosError } = await supabase
        .from('modelos')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('tipo', 'contrato')
        .eq('ativo', true)
        .order('nome');

      if (modelosError) throw modelosError;

      setContratos(contratosData as Contrato[] || []);
      setModelos(modelosData || []);
    } catch (error) {
      console.error('Error loading contratos data:', error);
      toast.error('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  const filteredContratos = contratos.filter(contrato => {
    const matchesSearch = (contrato.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contrato.numero_contrato || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || (contrato.status_assinatura || contrato.status) === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assinado': return 'bg-green-500';
      case 'enviado': return 'bg-blue-500';
      case 'rascunho': return 'bg-gray-500';
      case 'cancelado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assinado': return 'Assinado';
      case 'enviado': return 'Enviado';
      case 'rascunho': return 'Rascunho';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const dateToExtenso = (date: Date): string => {
    const meses = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const ano = date.getFullYear();
    
    return `${dia} de ${mes} de ${ano}`;
  };

  const generateContractNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CT${year}${month}${random}`;
  };

  const handleSalvarModelo = async () => {
    if (!nomeModelo || (!conteudoModelo && !arquivoModelo)) {
      toast.error('Preencha o nome e o conteúdo do modelo');
      return;
    }

    try {
      // Buscar assinatura empresa para incluir no modelo
      const { data: configData } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('empresa_id', user?.empresa_id)
        .eq('chave', 'assinatura_empresa')
        .single();

      let conteudoFinal = conteudoModelo || arquivoModelo;
      
      // Adicionar assinatura empresa ao modelo se existir
      if (configData?.valor && !conteudoFinal.includes('{{assinatura_empresa}}')) {
        conteudoFinal += '\n\n{{assinatura_empresa}}';
      }

      const { error } = await supabase
        .from('modelos')
        .insert({
          empresa_id: user?.empresa_id,
          nome: nomeModelo,
          tipo: tipoModelo,
          conteudo_template: conteudoFinal,
          ativo: true
        });

      if (error) throw error;

      toast.success('Modelo salvo com sucesso!');
      setShowNewModel(false);
      setNomeModelo('');
      setTipoModelo('contrato');
      setConteudoModelo('');
      setArquivoModelo('');
      loadContratosData();
    } catch (error) {
      console.error('Error saving model:', error);
      toast.error('Erro ao salvar modelo');
    }
  };

  const handleEditModelo = async () => {
    if (!modeloSelecionadoEdit || !nomeModelo || (!conteudoModelo && !arquivoModelo)) {
      toast.error('Preencha o nome e o conteúdo do modelo');
      return;
    }

    try {
      const { error } = await supabase
        .from('modelos')
        .update({
          nome: nomeModelo,
          tipo: tipoModelo,
          conteudo_template: conteudoModelo || arquivoModelo
        })
        .eq('id', modeloSelecionadoEdit.id);

      if (error) throw error;

      toast.success('Modelo atualizado com sucesso!');
      setModeloSelecionadoEdit(null);
      setNomeModelo('');
      setTipoModelo('contrato');
      setConteudoModelo('');
      setArquivoModelo('');
      loadContratosData();
    } catch (error) {
      console.error('Error updating model:', error);
      toast.error('Erro ao atualizar modelo');
    }
  };

  const visualizarModelo = (modelo: Modelo) => {
    setModeloParaVisualizar(modelo);
    setShowModeloPDFViewer(true);
  };

  const numeroParaExtenso = (numero: number): string => {
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    
    const inteiro = Math.floor(numero);
    const centavos = Math.round((numero - inteiro) * 100);
    
    const converterCentenas = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return unidades[n];
      if (n < 20) return especiais[n - 10];
      if (n < 100) {
        const dez = Math.floor(n / 10);
        const un = n % 10;
        return dezenas[dez] + (un > 0 ? ' e ' + unidades[un] : '');
      }
      return '';
    };
    
    const converterMilhares = (n: number): string => {
      if (n === 0) return 'zero';
      if (n < 1000) return converterCentenas(n);
      
      const mil = Math.floor(n / 1000);
      const resto = n % 1000;
      
      let resultado = '';
      if (mil === 1) resultado = 'mil';
      else if (mil > 1) resultado = converterCentenas(mil) + ' mil';
      
      if (resto > 0) {
        resultado += (resultado ? ' e ' : '') + converterCentenas(resto);
      }
      
      return resultado;
    };
    
    let resultado = converterMilhares(inteiro) + ' ' + (inteiro === 1 ? 'real' : 'reais');
    
    if (centavos > 0) {
      resultado += ' e ' + converterCentenas(centavos) + ' ' + (centavos === 1 ? 'centavo' : 'centavos');
    }
    
    return resultado;
  };

  const renderContratosTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contratos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assinados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {contratos.filter(c => (c.status_assinatura || c.status) === 'assinado').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {contratos.filter(c => (c.status_assinatura || c.status) === 'enviado').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(contratos.filter(c => (c.status_assinatura || c.status) === 'assinado').reduce((sum, c) => sum + (c.valor_total || 0), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContratos.map(contrato => (
                <TableRow key={contrato.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contrato.titulo || 'Contrato sem título'}</p>
                      {contrato.numero_contrato && (
                        <p className="text-sm text-muted-foreground">{contrato.numero_contrato}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contrato.cliente_id ? `Cliente #${contrato.cliente_id.slice(-8)}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(contrato.valor_total)}
                  </TableCell>
                  <TableCell>
                    {formatDate(contrato.data_inicio)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(contrato.status_assinatura || contrato.status || 'rascunho')} text-white`}
                    >
                      {getStatusLabel(contrato.status_assinatura || contrato.status || 'rascunho')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedContract(contrato);
                          setShowPDFViewer(true);
                        }}
                        title="Visualizar PDF"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSelectedContract(contrato);
                        }}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                        title="Enviar"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSelectedContract(contrato);
                          setShowPDFViewer(true);
                        }}
                        title="Baixar PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderModelosTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Modelos de Contrato</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('card')}
              >
                Card
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                Lista
              </Button>
              <Dialog open={showNewModel || !!modeloSelecionadoEdit} onOpenChange={(open) => {
                setShowNewModel(open);
                if (!open) setModeloSelecionadoEdit(null);
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Modelo
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{modeloSelecionadoEdit ? 'Editar Modelo' : 'Novo Modelo de Contrato'}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nomeModelo">Nome do Modelo</Label>
                      <Input 
                        id="nomeModelo" 
                        value={nomeModelo}
                        onChange={(e) => setNomeModelo(e.target.value)}
                        placeholder="Ex: Contrato de Prestação de Serviços" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipoModelo">Tipo</Label>
                      <Select value={tipoModelo} onValueChange={setTipoModelo}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contrato">Contrato</SelectItem>
                          <SelectItem value="termo">Termo</SelectItem>
                          <SelectItem value="acordo">Acordo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Variáveis Disponíveis</Label>
                      <div className="text-sm text-muted-foreground space-y-1 max-h-[200px] overflow-y-auto pr-2">
                        <p>{'{{cliente_nome}}'} - Nome do cliente</p>
                        <p>{'{{cliente_documento}}'} - CPF/CNPJ</p>
                        <p>{'{{cliente_endereco}}'} - Endereço do cliente</p>
                        <p>{'{{cliente_whatsapp}}'} - WhatsApp do cliente</p>
                        <p>{'{{empresa_nome}}'} - Nome da empresa</p>
                        <p>{'{{contrato_numero}}'} - Número do contrato</p>
                        <p>{'{{contrato_data_extenso}}'} - Data do contrato por extenso (ex: 12 de agosto de 2025)</p>
                        <p>{'{{contrato_valor}}'} - Valor total</p>
                        <p>{'{{valor_extenso}}'} - Valor total por extenso</p>
                        <p>{'{{valor_sinal}}'} - Valor do sinal</p>
                        <p>{'{{data_sinal}}'} - Data do sinal</p>
                        <p>{'{{valor_restante}}'} - Valor restante</p>
                        <p>{'{{data_vencimento_parcelas}}'} - Datas das parcelas</p>
                        <p>{'{{forma_pagamento_sinal}}'} - Forma de pagamento do sinal</p>
                        <p>{'{{forma_pagamento_restante}}'} - Forma de pagamento restante</p>
                        <p>{'{{servico_nome}}'} - Nome do serviço</p>
                        <p>{'{{servico_descricao}}'} - Descrição do serviço</p>
                        <p>{'{{data_inicio}}'} - Data de início</p>
                        <p>{'{{data_fim}}'} - Data de término</p>
                        <p>{'{{horario_inicio}}'} - Horário de início</p>
                        <p>{'{{horario_fim}}'} - Horário de término</p>
                        <p>{'{{endereco_servico}}'} - Endereço do serviço</p>
                        <p>{'{{colaborador}}'} - Colaborador responsável</p>
                        <p>{'{{servicos}}'} - Lista de serviços</p>
                        <p>{'{{observacoes}}'} - Observações</p>
                        <p>{'{{assinatura_empresa}}'} - Assinatura da empresa</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="assinaturaEmpresa">Assinatura da Empresa</Label>
                      <div className="space-y-2">
                        <Input
                          id="uploadAssinatura"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64 = reader.result as string;
                                saveAssinaturaEmpresa(base64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {assinaturaEmpresa && assinaturaEmpresa.startsWith('data:image') && (
                          <div className="border rounded p-2">
                            <img src={assinaturaEmpresa} alt="Assinatura" className="max-h-20 object-contain" />
                          </div>
                        )}
                        <Textarea
                          value={assinaturaEmpresa && !assinaturaEmpresa.startsWith('data:image') ? assinaturaEmpresa : ''}
                          onChange={(e) => setAssinaturaEmpresa(e.target.value)}
                          onBlur={(e) => saveAssinaturaEmpresa(e.target.value)}
                          placeholder="Ou digite o texto da assinatura&#10;Ex: Nome da Empresa&#10;CNPJ: 00.000.000/0001-00"
                          className="min-h-[80px]"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Escolha uma imagem da assinatura ou digite o texto
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uploadModelo">Upload de Arquivo do Modelo (.txt apenas)</Label>
                    <Input
                      id="uploadModelo"
                      type="file"
                      accept=".txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Verificar extensão do arquivo
                          if (!file.name.toLowerCase().endsWith('.txt')) {
                            toast.error('Por favor, selecione apenas arquivos .txt');
                            e.target.value = '';
                            return;
                          }
                          
                          const reader = new FileReader();
                          reader.onload = () => {
                            try {
                              let conteudo = reader.result as string;
                              // Remover caracteres nulos e outros caracteres especiais que o PostgreSQL não aceita
                              conteudo = conteudo.replace(/\u0000/g, '').replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '');
                              
                              if (!conteudo.trim()) {
                                toast.error('Arquivo vazio ou com formato inválido');
                                return;
                              }
                              
                              setArquivoModelo(conteudo);
                              toast.success('Arquivo carregado com sucesso!');
                            } catch (error) {
                              console.error('Error reading file:', error);
                              toast.error('Erro ao ler arquivo. Verifique se é um arquivo de texto válido.');
                            }
                          };
                          reader.onerror = () => {
                            toast.error('Erro ao ler arquivo. Tente novamente.');
                          };
                          reader.readAsText(file, 'UTF-8');
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Apenas arquivos .txt são suportados. Para .docx, copie e cole o conteúdo abaixo.
                    </p>
                    <Label htmlFor="conteudoModelo">Conteúdo do Modelo</Label>
                    <Textarea
                      id="conteudoModelo"
                      value={conteudoModelo || arquivoModelo}
                      onChange={(e) => {
                        setConteudoModelo(e.target.value);
                        setArquivoModelo('');
                      }}
                      className="min-h-[400px]"
                      placeholder="Digite o conteúdo do modelo aqui. Use as variáveis {{variavel}} para campos dinâmicos."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => {
                    setShowNewModel(false);
                    setModeloSelecionadoEdit(null);
                    setNomeModelo('');
                    setTipoModelo('contrato');
                    setConteudoModelo('');
                    setArquivoModelo('');
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={modeloSelecionadoEdit ? handleEditModelo : handleSalvarModelo}>
                    {modeloSelecionadoEdit ? 'Atualizar Modelo' : 'Salvar Modelo'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelos.map(modelo => (
                <Card key={modelo.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{modelo.nome}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant="outline">{modelo.tipo}</Badge>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {modelo.conteudo_template.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className={`text-xs px-2 py-1 rounded ${modelo.ativo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {modelo.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => visualizarModelo(modelo)}
                          title="Visualizar em PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setModeloSelecionadoEdit(modelo);
                            setNomeModelo(modelo.nome);
                            setTipoModelo(modelo.tipo);
                            setConteudoModelo(modelo.conteudo_template);
                            setShowNewModel(true);
                          }}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelos.map(modelo => (
                  <TableRow key={modelo.id}>
                    <TableCell>
                      <p className="font-medium">{modelo.nome}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{modelo.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded ${modelo.ativo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {modelo.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => visualizarModelo(modelo)}
                          title="Visualizar em PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setModeloSelecionadoEdit(modelo);
                            setNomeModelo(modelo.nome);
                            setTipoModelo(modelo.tipo);
                            setConteudoModelo(modelo.conteudo_template);
                            setShowNewModel(true);
                          }}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-muted-foreground">Gerencie seus contratos e modelos</p>
        </div>
        <Button onClick={() => setShowNewContract(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      <NovoContratoDialog
        open={showNewContract}
        onOpenChange={setShowNewContract}
        modelos={modelos}
        onSuccess={loadContratosData}
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Buscar contratos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="assinado">Assinado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="contratos">
        <TabsList>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
        </TabsList>

        <TabsContent value="contratos" className="mt-6">
          {renderContratosTab()}
        </TabsContent>

        <TabsContent value="modelos" className="mt-6">
          {renderModelosTab()}
        </TabsContent>
      </Tabs>

      {/* PDF Viewer */}
      {showPDFViewer && selectedContract && (
        <ContratosPDFViewer
          contrato={selectedContract}
          onClose={() => {
            setShowPDFViewer(false);
            setSelectedContract(null);
          }}
        />
      )}

      {/* Visualizador de PDF do Modelo */}
      {showModeloPDFViewer && modeloParaVisualizar && (
        <ModeloPDFViewer
          modelo={modeloParaVisualizar}
          onClose={() => {
            setShowModeloPDFViewer(false);
            setModeloParaVisualizar(null);
          }}
        />
      )}
    </div>
  );
}