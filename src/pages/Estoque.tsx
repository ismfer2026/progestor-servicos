import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, AlertTriangle, Wrench, Calendar, Eye, Edit2, Lock, Download, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import LiberarReservaDialog from '@/components/estoque/LiberarReservaDialog';
import LiberarManutencaoDialog from '@/components/estoque/LiberarManutencaoDialog';

interface EstoqueItem {
  id: string;
  nome: string;
  sku?: string;
  tipo: string;
  saldo: number;
  saldo_minimo: number;
  custo: number;
  venda: number;
  categoria?: string;
  unidade: string;
  localizacao?: string;
  status: string;
  validade?: string;
  dias_aviso_vencimento?: number;
}

interface EstoqueReserva {
  id: string;
  item_id: string;
  quantidade: number;
  data_reserva: string;
  status: string;
  servico_id?: string;
  item?: EstoqueItem;
}

interface EstoqueManutencao {
  id: string;
  item_id: string;
  defeito: string;
  data_entrada: string;
  previsao_retorno?: string;
  status: string;
  item?: EstoqueItem;
}

export default function Estoque() {
  const { user } = useAuth();
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [reservas, setReservas] = useState<EstoqueReserva[]>([]);
  const [manutencoes, setManutencoes] = useState<EstoqueManutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNewItem, setShowNewItem] = useState(false);
  const [activeTab, setActiveTab] = useState('itens');
  const [viewItem, setViewItem] = useState<EstoqueItem | null>(null);
  const [editItem, setEditItem] = useState<EstoqueItem | null>(null);
  const [reserveItem, setReserveItem] = useState<EstoqueItem | null>(null);
  const [maintenanceItem, setMaintenanceItem] = useState<EstoqueItem | null>(null);
  const [showLowStockDialog, setShowLowStockDialog] = useState(false);
  const [showExpiringDialog, setShowExpiringDialog] = useState(false);
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [liberarReservaDialog, setLiberarReservaDialog] = useState<{open: boolean, reserva: any}>({open: false, reserva: null});
  const [liberarManutencaoDialog, setLiberarManutencaoDialog] = useState<{open: boolean, manutencao: any}>({open: false, manutencao: null});
  const [reservaData, setReservaData] = useState({ quantidade: 0, observacoes: '' });
  const [manutencaoData, setManutencaoData] = useState({ 
    defeito: '', 
    previsao_retorno: '', 
    custo_manutencao: 0, 
    observacoes: '',
    quantidade: 1
  });
  const [newItem, setNewItem] = useState({
    nome: '',
    sku: '',
    tipo: 'produto',
    categoria: '',
    saldo: 0,
    saldo_minimo: 0,
    custo: 0,
    venda: 0,
    unidade: 'UN',
    localizacao: '',
    validade: '',
    dias_aviso_vencimento: 7
  });

  useEffect(() => {
    loadEstoqueData();
  }, [user]);

  // Criar notificações para alertas de estoque
  useEffect(() => {
    if (!user || itens.length === 0) return;

    const createNotifications = async () => {
      const lowStock = getLowStockItems();
      const expiring = getExpiringItems();
      const expired = getExpiredItems();

      // Verificar notificações existentes não lidas
      const { data: existingNotifications } = await supabase
        .from('notificacoes')
        .select('tipo')
        .eq('empresa_id', user.empresa_id)
        .eq('lida', false)
        .in('tipo', ['alerta_estoque_baixo', 'alerta_vencimento_proximo', 'alerta_estoque_vencido']);

      const existingTypes = new Set(existingNotifications?.map(n => n.tipo) || []);

      // Notificação para baixo estoque
      if (lowStock.length > 0 && !existingTypes.has('alerta_estoque_baixo')) {
        await supabase.from('notificacoes').insert({
          empresa_id: user.empresa_id,
          usuario_id: user.id,
          tipo: 'alerta_estoque_baixo',
          titulo: 'Itens com estoque baixo',
          mensagem: `${lowStock.length} ${lowStock.length === 1 ? 'item precisa' : 'itens precisam'} de reposição`,
          link: '/estoque'
        });
      }

      // Notificação para itens próximos do vencimento
      if (expiring.length > 0 && !existingTypes.has('alerta_vencimento_proximo')) {
        await supabase.from('notificacoes').insert({
          empresa_id: user.empresa_id,
          usuario_id: user.id,
          tipo: 'alerta_vencimento_proximo',
          titulo: 'Itens próximos do vencimento',
          mensagem: `${expiring.length} ${expiring.length === 1 ? 'item está' : 'itens estão'} próximos do vencimento`,
          link: '/estoque'
        });
      }

      // Notificação para itens vencidos
      if (expired.length > 0 && !existingTypes.has('alerta_estoque_vencido')) {
        await supabase.from('notificacoes').insert({
          empresa_id: user.empresa_id,
          usuario_id: user.id,
          tipo: 'alerta_estoque_vencido',
          titulo: 'Itens vencidos',
          mensagem: `${expired.length} ${expired.length === 1 ? 'item vencido' : 'itens vencidos'} no estoque!`,
          link: '/estoque'
        });
      }
    };

    createNotifications();
  }, [itens, user]);

  const loadEstoqueData = async () => {
    if (!user) return;

    try {
      // Load items
      const { data: itensData, error: itensError } = await supabase
        .from('estoque_itens')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('nome');

      if (itensError) throw itensError;

      // Load reservations
      const { data: reservasData, error: reservasError } = await supabase
        .from('estoque_reservas')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('status', 'reservado')
        .order('data_reserva');

      if (reservasError) throw reservasError;

      // Load maintenance
      const { data: manutencoesData, error: manutencoesError } = await supabase
        .from('estoque_manutencao')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .eq('status', 'em_manutencao')
        .order('data_entrada');

      if (manutencoesError) throw manutencoesError;

      setItens(itensData || []);
      setReservas(reservasData || []);
      setManutencoes(manutencoesData || []);
    } catch (error) {
      console.error('Error loading estoque data:', error);
      toast.error('Erro ao carregar dados do estoque');
    } finally {
      setLoading(false);
    }
  };

  const filteredItens = itens.filter(item => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-500';
      case 'inativo': return 'bg-red-500';
      case 'baixo_estoque': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'inativo': return 'Inativo';
      case 'baixo_estoque': return 'Baixo Estoque';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateTotalValue = () => {
    return itens.reduce((total, item) => total + (item.saldo * item.custo), 0);
  };

  const getLowStockItems = () => {
    return itens.filter(item => item.saldo <= item.saldo_minimo);
  };

  const getExpiringItems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return itens.filter(item => {
      if (!item.validade) return false;
      const validadeDate = new Date(item.validade);
      validadeDate.setHours(0, 0, 0, 0);
      const diasRestantes = Math.ceil((validadeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const diasAviso = item.dias_aviso_vencimento || 7;
      return diasRestantes <= diasAviso && diasRestantes > 0;
    });
  };

  const getExpiredItems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return itens.filter(item => {
      if (!item.validade) return false;
      const validadeDate = new Date(item.validade);
      validadeDate.setHours(0, 0, 0, 0);
      return validadeDate <= today;
    });
  };

  const handleDevolverReserva = async (reserva: EstoqueReserva) => {
    if (!user) return;

    try {
      // Atualizar status da reserva para 'devolvido'
      const { error: reservaError } = await supabase
        .from('estoque_reservas')
        .update({ 
          status: 'devolvido',
          data_liberacao: new Date().toISOString().split('T')[0]
        })
        .eq('id', reserva.id);

      if (reservaError) throw reservaError;

      // Retornar quantidade ao estoque
      const { data: itemData, error: itemError } = await supabase
        .from('estoque_itens')
        .select('saldo')
        .eq('id', reserva.item_id)
        .single();

      if (itemError) throw itemError;

      const { error: updateError } = await supabase
        .from('estoque_itens')
        .update({ saldo: itemData.saldo + reserva.quantidade })
        .eq('id', reserva.item_id);

      if (updateError) throw updateError;

      // Registrar no histórico
      const { error: historicoError } = await supabase
        .from('estoque_historico')
        .insert({
          empresa_id: user.empresa_id,
          item_id: reserva.item_id,
          usuario_id: user.id,
          tipo_movimentacao: 'devolucao_reserva',
          quantidade: reserva.quantidade,
          reserva_id: reserva.id,
          detalhes: {
            motivo: 'Devolução de item reservado'
          }
        });

      if (historicoError) throw historicoError;

      toast.success('Item devolvido ao estoque com sucesso!');
      loadEstoqueData();
    } catch (error: any) {
      console.error('Erro ao devolver reserva:', error);
      toast.error('Erro ao devolver: ' + error.message);
    }
  };

  const downloadLowStockList = () => {
    const items = getLowStockItems();
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Itens com Estoque Baixo', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);
    doc.text(`Total de itens: ${items.length}`, 14, 27);
    
    let y = 35;
    doc.setFontSize(9);
    doc.text('Nome', 14, y);
    doc.text('SKU', 70, y);
    doc.text('Categoria', 100, y);
    doc.text('Atual', 135, y);
    doc.text('Mín', 155, y);
    doc.text('Un', 175, y);
    
    y += 5;
    doc.line(14, y, 195, y);
    y += 5;
    
    items.forEach(item => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(item.nome.substring(0, 30), 14, y);
      doc.text(item.sku || '-', 70, y);
      doc.text((item.categoria || '-').substring(0, 15), 100, y);
      doc.text(item.saldo.toString(), 135, y);
      doc.text(item.saldo_minimo.toString(), 155, y);
      doc.text(item.unidade, 175, y);
      y += 6;
    });
    
    doc.save(`estoque_baixo_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF baixado com sucesso!');
  };

  const downloadExpiringList = () => {
    const items = getExpiringItems();
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Itens Próximos do Vencimento', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);
    doc.text(`Total de itens: ${items.length}`, 14, 27);
    
    let y = 35;
    doc.setFontSize(9);
    doc.text('Nome', 14, y);
    doc.text('SKU', 70, y);
    doc.text('Categoria', 100, y);
    doc.text('Saldo', 130, y);
    doc.text('Validade', 150, y);
    doc.text('Dias', 180, y);
    
    y += 5;
    doc.line(14, y, 195, y);
    y += 5;
    
    items.forEach(item => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const today = new Date();
      const validadeDate = new Date(item.validade!);
      const diasRestantes = Math.ceil((validadeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      doc.text(item.nome.substring(0, 25), 14, y);
      doc.text(item.sku || '-', 70, y);
      doc.text((item.categoria || '-').substring(0, 12), 100, y);
      doc.text(item.saldo.toString(), 130, y);
      doc.text(new Date(item.validade!).toLocaleDateString('pt-BR'), 150, y);
      doc.text(diasRestantes.toString(), 180, y);
      y += 6;
    });
    
    doc.save(`itens_vencendo_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF baixado com sucesso!');
  };

  const downloadExpiredList = () => {
    const items = getExpiredItems();
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Itens Vencidos', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);
    doc.text(`Total de itens: ${items.length}`, 14, 27);
    
    let y = 35;
    doc.setFontSize(9);
    doc.text('Nome', 14, y);
    doc.text('SKU', 70, y);
    doc.text('Categoria', 100, y);
    doc.text('Saldo', 130, y);
    doc.text('Validade', 150, y);
    doc.text('Dias', 180, y);
    
    y += 5;
    doc.line(14, y, 195, y);
    y += 5;
    
    items.forEach(item => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const today = new Date();
      const validadeDate = new Date(item.validade!);
      const diasVencido = Math.ceil((today.getTime() - validadeDate.getTime()) / (1000 * 60 * 60 * 24));
      
      doc.text(item.nome.substring(0, 25), 14, y);
      doc.text(item.sku || '-', 70, y);
      doc.text((item.categoria || '-').substring(0, 12), 100, y);
      doc.text(item.saldo.toString(), 130, y);
      doc.text(new Date(item.validade!).toLocaleDateString('pt-BR'), 150, y);
      doc.text(diasVencido.toString(), 180, y);
      y += 6;
    });
    
    doc.save(`itens_vencidos_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF baixado com sucesso!');
  };

  const handleSaveItem = async () => {
    if (!user || !newItem.nome) {
      toast.error('Preencha o nome do item');
      return;
    }

    try {
      const { error } = await supabase.from('estoque_itens').insert([{
        empresa_id: user.empresa_id,
        nome: newItem.nome,
        sku: newItem.sku || null,
        tipo: newItem.tipo,
        categoria: newItem.categoria || null,
        saldo: newItem.saldo,
        saldo_minimo: newItem.saldo_minimo,
        custo: newItem.custo,
        venda: newItem.venda,
        unidade: newItem.unidade,
        localizacao: newItem.localizacao || null,
        validade: newItem.validade || null,
        dias_aviso_vencimento: newItem.dias_aviso_vencimento,
        status: 'ativo'
      }]);

      if (error) throw error;

      toast.success('Item adicionado com sucesso!');
      setShowNewItem(false);
      setNewItem({
        nome: '',
        sku: '',
        tipo: 'produto',
        categoria: '',
        saldo: 0,
        saldo_minimo: 0,
        custo: 0,
        venda: 0,
        unidade: 'UN',
        localizacao: '',
        validade: '',
        dias_aviso_vencimento: 7
      });
      loadEstoqueData();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Erro ao salvar item');
    }
  };

  const handleUpdateItem = async () => {
    if (!user || !editItem) return;

    try {
      const { error } = await supabase
        .from('estoque_itens')
        .update({
          nome: editItem.nome,
          sku: editItem.sku,
          categoria: editItem.categoria,
          saldo: editItem.saldo,
          saldo_minimo: editItem.saldo_minimo,
          custo: editItem.custo,
          venda: editItem.venda,
          localizacao: editItem.localizacao,
          validade: editItem.validade,
          dias_aviso_vencimento: editItem.dias_aviso_vencimento
        })
        .eq('id', editItem.id);

      if (error) throw error;

      // Verificar se o item ficou com estoque baixo
      if (editItem.saldo <= editItem.saldo_minimo) {
        await supabase.from('notificacoes').insert({
          empresa_id: user.empresa_id,
          usuario_id: user.id,
          tipo: 'alerta_estoque_baixo',
          titulo: 'Item com estoque baixo',
          mensagem: `${editItem.nome} está com estoque baixo (${editItem.saldo} ${editItem.unidade})`,
          link: '/estoque'
        });
      }

      // Verificar se o item está próximo do vencimento
      if (editItem.validade) {
        const today = new Date();
        const validadeDate = new Date(editItem.validade);
        const diasRestantes = Math.ceil((validadeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const diasAviso = editItem.dias_aviso_vencimento || 7;

        if (diasRestantes <= diasAviso && diasRestantes > 0) {
          await supabase.from('notificacoes').insert({
            empresa_id: user.empresa_id,
            usuario_id: user.id,
            tipo: 'alerta_vencimento_proximo',
            titulo: 'Item próximo do vencimento',
            mensagem: `${editItem.nome} vence em ${diasRestantes} dias`,
            link: '/estoque'
          });
        } else if (diasRestantes <= 0) {
          await supabase.from('notificacoes').insert({
            empresa_id: user.empresa_id,
            usuario_id: user.id,
            tipo: 'alerta_estoque_vencido',
            titulo: 'Item vencido',
            mensagem: `${editItem.nome} está vencido!`,
            link: '/estoque'
          });
        }
      }

      toast.success('Item atualizado!');
      setEditItem(null);
      loadEstoqueData();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  const handleReserveItem = async () => {
    if (!user || !reserveItem) return;

    if (reservaData.quantidade <= 0 || reservaData.quantidade > reserveItem.saldo) {
      toast.error('Quantidade inválida!');
      return;
    }

    try {
      // Criar reserva
      const { error: reservaError } = await supabase.from('estoque_reservas').insert([{
        empresa_id: user.empresa_id,
        item_id: reserveItem.id,
        quantidade: reservaData.quantidade,
        data_reserva: new Date().toISOString().split('T')[0],
        observacoes: reservaData.observacoes,
        status: 'reservado'
      }]);

      if (reservaError) throw reservaError;

      // Atualizar saldo do item
      const { error: updateError } = await supabase
        .from('estoque_itens')
        .update({ saldo: reserveItem.saldo - reservaData.quantidade })
        .eq('id', reserveItem.id);

      if (updateError) throw updateError;

      toast.success('Item reservado e estoque atualizado!');
      setReserveItem(null);
      setReservaData({ quantidade: 0, observacoes: '' });
      loadEstoqueData();
    } catch (error) {
      console.error('Error reserving item:', error);
      toast.error('Erro ao reservar item');
    }
  };

  const handleMaintenanceItem = async () => {
    if (!user || !maintenanceItem) return;

    if (!manutencaoData.defeito) {
      toast.error('Descreva o defeito!');
      return;
    }

    if (manutencaoData.quantidade <= 0 || manutencaoData.quantidade > maintenanceItem.saldo) {
      toast.error('Quantidade inválida!');
      return;
    }

    try {
      // Criar registro de manutenção
      const { error: manutencaoError } = await supabase.from('estoque_manutencao').insert([{
        empresa_id: user.empresa_id,
        item_id: maintenanceItem.id,
        defeito: manutencaoData.defeito,
        data_entrada: new Date().toISOString().split('T')[0],
        previsao_retorno: manutencaoData.previsao_retorno || null,
        custo_manutencao: manutencaoData.custo_manutencao,
        observacoes: manutencaoData.observacoes,
        status: 'em_manutencao'
      }]);

      if (manutencaoError) throw manutencaoError;

      // Atualizar saldo do item
      const { error: updateError } = await supabase
        .from('estoque_itens')
        .update({ saldo: maintenanceItem.saldo - manutencaoData.quantidade })
        .eq('id', maintenanceItem.id);

      if (updateError) throw updateError;

      toast.success('Item enviado para manutenção e estoque atualizado!');
      setMaintenanceItem(null);
      setManutencaoData({ defeito: '', previsao_retorno: '', custo_manutencao: 0, observacoes: '', quantidade: 1 });
      loadEstoqueData();
    } catch (error) {
      console.error('Error sending to maintenance:', error);
      toast.error('Erro ao enviar para manutenção');
    }
  };

  const categories = [...new Set(itens.map(item => item.categoria).filter(Boolean))];

  // Agrupar itens por categoria
  const itensPorCategoria = filteredItens.reduce((acc, item) => {
    const categoria = item.categoria || 'Sem Categoria';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(item);
    return acc;
  }, {} as Record<string, EstoqueItem[]>);

  const renderItensTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itens.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalValue())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getLowStockItems().length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{manutencoes.length}</div>
          </CardContent>
        </Card>
      </div>

      {getLowStockItems().length > 0 && (
        <Alert className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowLowStockDialog(true)}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {getLowStockItems().length} itens com estoque baixo precisam de atenção. Clique para ver detalhes.
          </AlertDescription>
        </Alert>
      )}

      {getExpiringItems().length > 0 && (
        <Alert className="border-yellow-500 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setShowExpiringDialog(true)}>
          <Calendar className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-600">
            {getExpiringItems().length} itens próximos do vencimento. Clique para ver detalhes.
          </AlertDescription>
        </Alert>
      )}

      {getExpiredItems().length > 0 && (
        <Alert variant="destructive" className="cursor-pointer hover:bg-destructive/90 transition-colors" onClick={() => setShowExpiredDialog(true)}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {getExpiredItems().length} itens vencidos no estoque! Clique para ver detalhes.
          </AlertDescription>
        </Alert>
      )}

      {Object.entries(itensPorCategoria).map(([categoria, items]) => (
        <Card key={categoria}>
          <CardHeader>
            <CardTitle>{categoria}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Venda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.nome}</p>
                        {item.localizacao && (
                          <p className="text-sm text-muted-foreground">{item.localizacao}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.sku || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span className={item.saldo <= item.saldo_minimo ? 'text-yellow-600 font-semibold' : ''}>
                          {item.saldo}
                        </span>
                        <span className="text-muted-foreground">{item.unidade}</span>
                      </div>
                      {item.saldo <= item.saldo_minimo && (
                        <p className="text-xs text-yellow-600">Mín: {item.saldo_minimo}</p>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(item.custo)}</TableCell>
                    <TableCell>{formatCurrency(item.venda)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(item.status)} text-white`}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewItem(item)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditItem(item)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setReserveItem(item)}>
                            <Lock className="mr-2 h-4 w-4" />
                            Reservar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setMaintenanceItem(item)}>
                            <Wrench className="mr-2 h-4 w-4" />
                            Enviar para Manutenção
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderReservasTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Itens Reservados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Data da Reserva</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservas.map(reserva => (
              <TableRow key={reserva.id}>
                <TableCell>
                  Item #{reserva.item_id.slice(-8)}
                </TableCell>
                <TableCell>
                  {reserva.quantidade}
                </TableCell>
                <TableCell>
                  {new Date(reserva.data_reserva).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  {reserva.servico_id ? `Serviço #${reserva.servico_id.slice(-8)}` : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-blue-500 text-white">
                    Reservado
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setLiberarReservaDialog({open: true, reserva})}
                    >
                      Liberar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDevolverReserva(reserva)}
                    >
                      Devolver
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderManutencaoTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Itens em Manutenção</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Defeito</TableHead>
              <TableHead>Data Entrada</TableHead>
              <TableHead>Previsão Retorno</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {manutencoes.map(manutencao => (
              <TableRow key={manutencao.id}>
                <TableCell>
                  Item #{manutencao.item_id.slice(-8)}
                </TableCell>
                <TableCell>{manutencao.defeito}</TableCell>
                <TableCell>
                  {new Date(manutencao.data_entrada).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  {manutencao.previsao_retorno
                    ? new Date(manutencao.previsao_retorno).toLocaleDateString('pt-BR')
                    : 'Não definida'
                  }
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-red-500 text-white">
                    Em Manutenção
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setLiberarManutencaoDialog({open: true, manutencao})}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
          <h1 className="text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground">Gerencie seus itens e insumos</p>
        </div>
        <Dialog open={showNewItem} onOpenChange={setShowNewItem}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Item do Estoque</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input 
                    placeholder="Nome do item" 
                    value={newItem.nome}
                    onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <Input 
                    placeholder="Código SKU" 
                    value={newItem.sku}
                    onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={newItem.tipo} onValueChange={(value) => setNewItem({...newItem, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="produto">Produto</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="ferramenta">Ferramenta</SelectItem>
                      <SelectItem value="equipamento">Equipamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Input 
                    placeholder="Categoria do item" 
                    value={newItem.categoria}
                    onChange={(e) => setNewItem({...newItem, categoria: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unidade de Medida</label>
                  <Select value={newItem.unidade} onValueChange={(value) => setNewItem({...newItem, unidade: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UN">UN - Unidade</SelectItem>
                      <SelectItem value="PC">PC - Peça</SelectItem>
                      <SelectItem value="CJ">CJ - Conjunto</SelectItem>
                      <SelectItem value="PÇ">PÇ - Peça</SelectItem>
                      <SelectItem value="CX">CX - Caixa</SelectItem>
                      <SelectItem value="FD">FD - Fardo</SelectItem>
                      <SelectItem value="DZ">DZ - Dúzia</SelectItem>
                      <SelectItem value="KT">KT - Kit</SelectItem>
                      <SelectItem value="SC">SC - Saco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Localização</label>
                  <Input 
                    placeholder="Ex: Prateleira A1" 
                    value={newItem.localizacao}
                    onChange={(e) => setNewItem({...newItem, localizacao: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Saldo Atual</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={newItem.saldo}
                    onChange={(e) => setNewItem({...newItem, saldo: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Saldo Mínimo</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={newItem.saldo_minimo}
                    onChange={(e) => setNewItem({...newItem, saldo_minimo: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Custo</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="R$ 0,00" 
                    value={newItem.custo}
                    onChange={(e) => setNewItem({...newItem, custo: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Preço de Venda</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="R$ 0,00" 
                    value={newItem.venda}
                    onChange={(e) => setNewItem({...newItem, venda: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data de Validade</label>
                  <Input 
                    type="date" 
                    value={newItem.validade}
                    onChange={(e) => setNewItem({...newItem, validade: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Avisar vencimento (dias antes)</label>
                  <Input 
                    type="number" 
                    placeholder="7" 
                    value={newItem.dias_aviso_vencimento}
                    onChange={(e) => setNewItem({...newItem, dias_aviso_vencimento: parseInt(e.target.value) || 7})}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowNewItem(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveItem}>Salvar Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category!}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="itens">Itens e Insumos</TabsTrigger>
          <TabsTrigger value="reservas">Itens Reservados</TabsTrigger>
          <TabsTrigger value="manutencao">Itens em Manutenção</TabsTrigger>
        </TabsList>

        <TabsContent value="itens" className="mt-6">
          {renderItensTab()}
        </TabsContent>

        <TabsContent value="reservas" className="mt-6">
          {renderReservasTab()}
        </TabsContent>

        <TabsContent value="manutencao" className="mt-6">
          {renderManutencaoTab()}
        </TabsContent>
      </Tabs>

      {/* View Item Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Item</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <p className="font-medium">{viewItem.nome}</p>
                </div>
                <div>
                  <Label>SKU</Label>
                  <p className="font-medium">{viewItem.sku || '-'}</p>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <p className="font-medium">{viewItem.categoria || '-'}</p>
                </div>
                <div>
                  <Label>Localização</Label>
                  <p className="font-medium">{viewItem.localizacao || '-'}</p>
                </div>
                <div>
                  <Label>Saldo</Label>
                  <p className="font-medium">{viewItem.saldo} {viewItem.unidade}</p>
                </div>
                <div>
                  <Label>Saldo Mínimo</Label>
                  <p className="font-medium">{viewItem.saldo_minimo}</p>
                </div>
                <div>
                  <Label>Custo</Label>
                  <p className="font-medium">{formatCurrency(viewItem.custo)}</p>
                </div>
                <div>
                  <Label>Venda</Label>
                  <p className="font-medium">{formatCurrency(viewItem.venda)}</p>
                </div>
                {viewItem.validade && (
                  <div>
                    <Label>Validade</Label>
                    <p className="font-medium">{new Date(viewItem.validade).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(viewItem.status)}>
                    {getStatusLabel(viewItem.status)}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={editItem.nome} onChange={(e) => setEditItem({...editItem, nome: e.target.value})} />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input value={editItem.sku} onChange={(e) => setEditItem({...editItem, sku: e.target.value})} />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input value={editItem.categoria} onChange={(e) => setEditItem({...editItem, categoria: e.target.value})} />
                </div>
                <div>
                  <Label>Localização</Label>
                  <Input value={editItem.localizacao} onChange={(e) => setEditItem({...editItem, localizacao: e.target.value})} />
                </div>
                <div>
                  <Label>Saldo</Label>
                  <Input type="number" value={editItem.saldo} onChange={(e) => setEditItem({...editItem, saldo: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <Label>Saldo Mínimo</Label>
                  <Input type="number" value={editItem.saldo_minimo} onChange={(e) => setEditItem({...editItem, saldo_minimo: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <Label>Custo</Label>
                  <Input type="number" step="0.01" value={editItem.custo} onChange={(e) => setEditItem({...editItem, custo: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <Label>Venda</Label>
                  <Input type="number" step="0.01" value={editItem.venda} onChange={(e) => setEditItem({...editItem, venda: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <Label>Validade</Label>
                  <Input type="date" value={editItem.validade} onChange={(e) => setEditItem({...editItem, validade: e.target.value})} />
                </div>
                <div>
                  <Label>Avisar vencimento (dias)</Label>
                  <Input type="number" value={editItem.dias_aviso_vencimento} onChange={(e) => setEditItem({...editItem, dias_aviso_vencimento: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
                <Button onClick={handleUpdateItem}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reserve Item Dialog */}
      <Dialog open={!!reserveItem} onOpenChange={() => setReserveItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservar Item</DialogTitle>
          </DialogHeader>
          {reserveItem && (
            <div className="space-y-4">
              <div>
                <Label>Item</Label>
                <p className="font-medium">{reserveItem.nome}</p>
                <p className="text-sm text-muted-foreground">Saldo disponível: {reserveItem.saldo} {reserveItem.unidade}</p>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input 
                  type="number" 
                  min="0.01"
                  max={reserveItem.saldo}
                  value={reservaData.quantidade} 
                  onChange={(e) => setReservaData({...reservaData, quantidade: parseFloat(e.target.value)})} 
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea 
                  value={reservaData.observacoes} 
                  onChange={(e) => setReservaData({...reservaData, observacoes: e.target.value})} 
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setReserveItem(null)}>Cancelar</Button>
                <Button onClick={handleReserveItem}>Reservar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Maintenance Item Dialog */}
      <Dialog open={!!maintenanceItem} onOpenChange={() => setMaintenanceItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar para Manutenção</DialogTitle>
          </DialogHeader>
          {maintenanceItem && (
            <div className="space-y-4">
              <div>
                <Label>Item</Label>
                <p className="font-medium">{maintenanceItem.nome}</p>
                <p className="text-sm text-muted-foreground">Saldo disponível: {maintenanceItem.saldo} {maintenanceItem.unidade}</p>
              </div>
              <div>
                <Label>Quantidade *</Label>
                <Input 
                  type="number" 
                  min="1"
                  max={maintenanceItem.saldo}
                  value={manutencaoData.quantidade} 
                  onChange={(e) => setManutencaoData({...manutencaoData, quantidade: parseInt(e.target.value) || 1})} 
                />
              </div>
              <div>
                <Label>Defeito *</Label>
                <Textarea 
                  value={manutencaoData.defeito} 
                  onChange={(e) => setManutencaoData({...manutencaoData, defeito: e.target.value})} 
                  placeholder="Descreva o problema..."
                />
              </div>
              <div>
                <Label>Previsão de Retorno</Label>
                <Input 
                  type="date" 
                  value={manutencaoData.previsao_retorno} 
                  onChange={(e) => setManutencaoData({...manutencaoData, previsao_retorno: e.target.value})} 
                />
              </div>
              <div>
                <Label>Custo Estimado</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={manutencaoData.custo_manutencao} 
                  onChange={(e) => setManutencaoData({...manutencaoData, custo_manutencao: parseFloat(e.target.value)})} 
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea 
                  value={manutencaoData.observacoes} 
                  onChange={(e) => setManutencaoData({...manutencaoData, observacoes: e.target.value})} 
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setMaintenanceItem(null)}>Cancelar</Button>
                <Button onClick={handleMaintenanceItem}>Enviar para Manutenção</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Low Stock Alert Dialog */}
      <Dialog open={showLowStockDialog} onOpenChange={setShowLowStockDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Itens com Estoque Baixo</DialogTitle>
            <DialogDescription>
              Lista de itens que precisam de reposição
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={downloadLowStockList} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Baixar Lista
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Saldo Atual</TableHead>
                  <TableHead>Saldo Mínimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getLowStockItems().map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.sku || '-'}</TableCell>
                    <TableCell>{item.categoria || '-'}</TableCell>
                    <TableCell className="text-yellow-600 font-semibold">
                      {item.saldo} {item.unidade}
                    </TableCell>
                    <TableCell>{item.saldo_minimo} {item.unidade}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expiring Items Alert Dialog */}
      <Dialog open={showExpiringDialog} onOpenChange={setShowExpiringDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Itens Próximos do Vencimento</DialogTitle>
            <DialogDescription>
              Lista de itens que estão próximos da data de validade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={downloadExpiringList} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Baixar Lista
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Dias Restantes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getExpiringItems().map(item => {
                  const today = new Date();
                  const validadeDate = new Date(item.validade!);
                  const diasRestantes = Math.ceil((validadeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell>{item.sku || '-'}</TableCell>
                      <TableCell>{item.categoria || '-'}</TableCell>
                      <TableCell>{item.saldo} {item.unidade}</TableCell>
                      <TableCell className="text-yellow-600">
                        {new Date(item.validade!).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-yellow-600 font-semibold">
                        {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expired Items Alert Dialog */}
      <Dialog open={showExpiredDialog} onOpenChange={setShowExpiredDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Itens Vencidos</DialogTitle>
            <DialogDescription>
              Lista de itens que já passaram da data de validade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={downloadExpiredList} size="sm" variant="destructive">
                <Download className="mr-2 h-4 w-4" />
                Baixar Lista
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Dias Vencido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getExpiredItems().map(item => {
                  const today = new Date();
                  const validadeDate = new Date(item.validade!);
                  const diasVencido = Math.ceil((today.getTime() - validadeDate.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell>{item.sku || '-'}</TableCell>
                      <TableCell>{item.categoria || '-'}</TableCell>
                      <TableCell>{item.saldo} {item.unidade}</TableCell>
                      <TableCell className="text-destructive">
                        {new Date(item.validade!).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-destructive font-semibold">
                        {diasVencido} {diasVencido === 1 ? 'dia' : 'dias'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <LiberarReservaDialog
        open={liberarReservaDialog.open}
        onOpenChange={(open) => setLiberarReservaDialog({open, reserva: null})}
        reserva={liberarReservaDialog.reserva}
        onSuccess={loadEstoqueData}
      />

      <LiberarManutencaoDialog
        open={liberarManutencaoDialog.open}
        onOpenChange={(open) => setLiberarManutencaoDialog({open, manutencao: null})}
        manutencao={liberarManutencaoDialog.manutencao}
        onSuccess={loadEstoqueData}
      />
    </div>
  );
}