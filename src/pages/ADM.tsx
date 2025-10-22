import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Settings as SettingsIcon, Plus, Pencil, Trash2, AlertTriangle, Check, X, Link as LinkIcon, Mail, MessageCircle, Bell, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';

interface Usuario {
  id: string;
  nome_completo: string | null;
  nome: string;
  email: string;
  telefone_whatsapp: string | null;
  cpf_cnpj: string | null;
  data_cadastro: string | null;
  status_conta: string;
  ultimo_pagamento: string | null;
  proximo_vencimento: string | null;
  observacoes: string | null;
  bloqueado: boolean;
  conta_principal: boolean;
  funcao: string | null;
  ativo: boolean;
  empresa_id: string;
  plano?: string;
}

interface EmpresaData {
  id: string;
  plano: string;
  limite_usuarios: number;
  data_proximo_pagamento: string | null;
  data_ultimo_pagamento: string | null;
  status_pagamento: string;
}

interface PlanoConfig {
  nome: string;
  quantidade_acessos_adicionais: number;
  modulos: string[];
}

const MODULOS_DISPONIVEIS = [
  { value: 'dashboard', label: 'Tela Principal' },
  { value: 'orcamentos', label: 'Orçamentos' },
  { value: 'servicos', label: 'Serviços / Produtos' },
  { value: 'funil_vendas', label: 'Funil de Vendas' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'estoque', label: 'Estoque' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'contratos', label: 'Contratos' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'configuracoes', label: 'Configurações' },
  { value: 'vendas', label: 'Vendas (futuro)' },
];

const PERMISSOES_PADRAO = {
  administrador: ['dashboard', 'orcamentos', 'servicos', 'funil_vendas', 'agenda', 'clientes', 'estoque', 'financeiro', 'contratos', 'relatorios', 'configuracoes', 'vendas'],
  gerente: ['dashboard', 'orcamentos', 'servicos', 'funil_vendas', 'agenda', 'clientes', 'estoque', 'financeiro', 'contratos', 'relatorios', 'vendas'],
  lider: ['dashboard', 'orcamentos', 'servicos', 'agenda', 'clientes', 'vendas'],
  colaborador: ['funil_vendas', 'agenda'],
  personalizado: []
};

export default function ADM() {
  const { user } = useAuth();
  const { defaultPhone, saveWhatsAppConfig } = useWhatsAppConfig();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  
  // Estados para configuração de e-mail
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpSecurity: 'tls',
    smtpUser: '',
    smtpPass: ''
  });
  const [testingEmail, setTestingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para gerenciamento de usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [showUsuarioDialog, setShowUsuarioDialog] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [usuarioForm, setUsuarioForm] = useState({
    nome_completo: '',
    email: '',
    telefone_whatsapp: '',
    cpf_cnpj: '',
    funcao: 'colaborador',
    observacoes: '',
    modulos: [] as string[],
    limite_usuarios_criacao: 0,
    modoPersonalizado: false,
    plano: ''
  });
  const [gerarLinkConvite, setGerarLinkConvite] = useState(false);
  const [linkConvite, setLinkConvite] = useState('');
  
  // Estados para gerenciamento de planos
  const [planos, setPlanos] = useState<PlanoConfig[]>([]);
  const [showPlanoDialog, setShowPlanoDialog] = useState(false);
  const [novoPlano, setNovoPlano] = useState<PlanoConfig>({
    nome: '',
    quantidade_acessos_adicionais: 0,
    modulos: []
  });
  const [editingPlanoIndex, setEditingPlanoIndex] = useState<number | null>(null);

  // Verificar se o usuário é administrador
  const isAdmin = user?.role === 'admin' || user?.id === user?.empresa_id;

  // Redirecionar se não for admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (defaultPhone) {
      setWhatsappPhone(defaultPhone);
    }
  }, [defaultPhone]);

  useEffect(() => {
    if (activeTab === 'usuarios') {
      loadUsuarios();
      loadEmpresaData();
      loadPlanos();
    } else if (activeTab === 'planos') {
      loadPlanos();
    } else if (activeTab === 'integracoes') {
      loadEmailConfig();
    }
  }, [activeTab]);

  const loadEmpresaData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', user.empresa_id)
        .single();

      if (error) throw error;
      if (data) setEmpresaData(data as EmpresaData);
    } catch (error) {
      console.error('Error loading empresa data:', error);
      toast.error('Erro ao carregar dados da empresa');
    }
  };

  const loadUsuarios = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('empresa_id', user.empresa_id)
        .order('conta_principal', { ascending: false })
        .order('nome_completo');

      if (error) throw error;
      if (data) setUsuarios(data as Usuario[]);
    } catch (error) {
      console.error('Error loading usuarios:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const loadPlanos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('empresa_id', user.empresa_id)
        .eq('chave', 'planos_usuarios')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.valor && Array.isArray(data.valor)) {
        setPlanos(data.valor as unknown as PlanoConfig[]);
      } else {
        // Planos padrão
        setPlanos([
          { nome: 'Gratuito', quantidade_acessos_adicionais: 0, modulos: ['dashboard'] },
          { nome: 'Básico', quantidade_acessos_adicionais: 2, modulos: ['dashboard', 'orcamentos', 'servicos', 'clientes'] },
          { nome: 'Profissional', quantidade_acessos_adicionais: 5, modulos: ['dashboard', 'orcamentos', 'servicos', 'funil_vendas', 'agenda', 'clientes', 'estoque', 'financeiro'] },
          { nome: 'Premium', quantidade_acessos_adicionais: 10, modulos: MODULOS_DISPONIVEIS.map(m => m.value) }
        ]);
      }
    } catch (error) {
      console.error('Error loading planos:', error);
      setPlanos([
        { nome: 'Gratuito', quantidade_acessos_adicionais: 0, modulos: ['dashboard'] },
        { nome: 'Básico', quantidade_acessos_adicionais: 2, modulos: ['dashboard', 'orcamentos', 'servicos', 'clientes'] }
      ]);
    }
  };

  const handleSavePlanos = async () => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('configuracoes')
        .select('id')
        .eq('empresa_id', user.empresa_id)
        .eq('chave', 'planos_usuarios')
        .single();

      if (existing) {
        await supabase
          .from('configuracoes')
          .update({ valor: planos as any })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('configuracoes')
          .insert({
            empresa_id: user.empresa_id,
            chave: 'planos_usuarios',
            valor: planos as any,
            tipo: 'json',
            descricao: 'Lista de planos disponíveis para usuários'
          });
      }
      
      toast.success('Planos atualizados com sucesso!');
    } catch (error) {
      console.error('Error saving planos:', error);
      toast.error('Erro ao salvar planos');
    }
  };

  const handleAddPlano = () => {
    if (!novoPlano.nome.trim()) {
      toast.error('Digite o nome do plano');
      return;
    }

    if (planos.some(p => p.nome === novoPlano.nome.trim())) {
      toast.error('Este plano já existe');
      return;
    }

    const novosPlanos = [...planos, { ...novoPlano, nome: novoPlano.nome.trim() }];
    setPlanos(novosPlanos);
    setNovoPlano({ nome: '', quantidade_acessos_adicionais: 0, modulos: [] });
    setShowPlanoDialog(false);
    
    setTimeout(() => {
      handleSavePlanos();
    }, 100);
  };

  const handleDeletePlano = (index: number) => {
    if (!confirm('Deseja realmente excluir este plano?')) return;
    
    const novosPlanos = planos.filter((_, i) => i !== index);
    setPlanos(novosPlanos);
    
    setTimeout(() => {
      handleSavePlanos();
    }, 100);
  };

  const verificarLimiteUsuarios = (): boolean => {
    if (!empresaData) return false;
    
    const usuariosAtivos = usuarios.filter(u => u.status_conta === 'ativo' && u.ativo).length;
    
    if (empresaData.plano === 'Ilimitado') return true;
    if (empresaData.plano === '2 colaboradores' && usuariosAtivos >= 2) return false;
    if (empresaData.plano === '5 colaboradores' && usuariosAtivos >= 5) return false;
    
    return true;
  };

  const handleSaveUsuario = async () => {
    if (!usuarioForm.nome_completo.trim() || !usuarioForm.email.trim() || !usuarioForm.cpf_cnpj.trim()) {
      toast.error('Preencha todos os campos obrigatórios (Nome, E-mail e CPF/CNPJ)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuarioForm.email.trim())) {
      toast.error('Digite um e-mail válido');
      return;
    }

    const cpfCnpjNumeros = usuarioForm.cpf_cnpj.replace(/\D/g, '');
    if (cpfCnpjNumeros.length < 11) {
      toast.error('CPF/CNPJ deve ter pelo menos 11 dígitos');
      return;
    }

    if (!user || !empresaData) return;

    if (!editingUsuario && !verificarLimiteUsuarios()) {
      toast.error('🚫 Limite de usuários do plano atingido. Atualize seu plano para adicionar mais colaboradores.');
      return;
    }

    try {
      const senha = usuarioForm.cpf_cnpj.replace(/\D/g, '');

      if (editingUsuario) {
        const { error } = await supabase
          .from('usuarios')
          .update({
            nome_completo: usuarioForm.nome_completo,
            nome: usuarioForm.nome_completo,
            email: usuarioForm.email,
            telefone_whatsapp: usuarioForm.telefone_whatsapp,
            cpf_cnpj: usuarioForm.cpf_cnpj,
            funcao: usuarioForm.funcao,
            observacoes: usuarioForm.observacoes,
            limite_usuarios_criacao: usuarioForm.limite_usuarios_criacao,
            plano: usuarioForm.plano
          })
          .eq('id', editingUsuario.id);

        if (error) throw error;
        await atualizarModulosAcesso(editingUsuario.id, usuarioForm.modulos);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        const { data: newUser, error } = await supabase
          .from('usuarios')
          .insert({
            empresa_id: user.empresa_id,
            nome_completo: usuarioForm.nome_completo,
            nome: usuarioForm.nome_completo,
            email: usuarioForm.email,
            telefone_whatsapp: usuarioForm.telefone_whatsapp,
            cpf_cnpj: usuarioForm.cpf_cnpj,
            funcao: usuarioForm.funcao,
            observacoes: usuarioForm.observacoes,
            status_conta: 'ativo',
            ativo: true,
            conta_principal: false,
            data_cadastro: new Date().toISOString().split('T')[0],
            primeiro_acesso: true,
            senha_hash: senha,
            limite_usuarios_criacao: usuarioForm.limite_usuarios_criacao,
            plano: usuarioForm.plano
          })
          .select()
          .single();

        if (error) throw error;
        if (newUser) {
          await atualizarModulosAcesso(newUser.id, usuarioForm.modulos);
        }

        toast.success('Usuário cadastrado com sucesso! Senha inicial: CPF/CNPJ');
      }

      setShowUsuarioDialog(false);
      resetUsuarioForm();
      loadUsuarios();
    } catch (error: any) {
      console.error('Error saving usuario:', error);
      if (error.code === '23505') {
        toast.error('E-mail ou CPF/CNPJ já cadastrado');
      } else {
        toast.error('Erro ao salvar usuário');
      }
    }
  };

  const atualizarModulosAcesso = async (userId: string, modulos: string[]) => {
    await supabase
      .from('user_modulos_acesso')
      .delete()
      .eq('user_id', userId);

    if (modulos.length > 0) {
      const modulosData = modulos.map(modulo => ({
        user_id: userId,
        modulo: modulo as 'dashboard' | 'orcamentos' | 'servicos' | 'funil_vendas' | 'agenda' | 'clientes' | 'estoque' | 'financeiro' | 'contratos' | 'relatorios' | 'configuracoes' | 'vendas'
      }));

      await supabase
        .from('user_modulos_acesso')
        .insert(modulosData);
    }
  };

  const handleEditUsuario = async (usuario: Usuario) => {
    setEditingUsuario(usuario);
    
    const { data: modulosData } = await supabase
      .from('user_modulos_acesso')
      .select('modulo')
      .eq('user_id', usuario.id);

    const modulos = modulosData?.map(m => m.modulo) || [];

    const funcao = usuario.funcao || 'colaborador';
    const permissoesPadrao = PERMISSOES_PADRAO[funcao as keyof typeof PERMISSOES_PADRAO] || [];
    const isModoPersonalizado = JSON.stringify(modulos.sort()) !== JSON.stringify(permissoesPadrao.sort());

    setUsuarioForm({
      nome_completo: usuario.nome_completo || usuario.nome,
      email: usuario.email,
      telefone_whatsapp: usuario.telefone_whatsapp || '',
      cpf_cnpj: usuario.cpf_cnpj || '',
      funcao: funcao,
      observacoes: usuario.observacoes || '',
      modulos: modulos,
      limite_usuarios_criacao: (usuario as any).limite_usuarios_criacao || 0,
      modoPersonalizado: isModoPersonalizado,
      plano: usuario.plano || ''
    });
    
    setShowUsuarioDialog(true);
  };

  const handleToggleUsuarioStatus = async (usuario: Usuario) => {
    try {
      const novoStatus = usuario.status_conta === 'ativo' ? 'inativo' : 'ativo';
      
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          status_conta: novoStatus,
          ativo: novoStatus === 'ativo'
        })
        .eq('id', usuario.id);

      if (error) throw error;
      toast.success(`Usuário ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
      loadUsuarios();
    } catch (error) {
      console.error('Error toggling usuario status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const handleToggleBloqueio = async (usuario: Usuario) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ bloqueado: !usuario.bloqueado })
        .eq('id', usuario.id);

      if (error) throw error;
      toast.success(`Usuário ${usuario.bloqueado ? 'desbloqueado' : 'bloqueado'} com sucesso!`);
      loadUsuarios();
    } catch (error) {
      console.error('Error toggling usuario bloqueio:', error);
      toast.error('Erro ao alterar bloqueio do usuário');
    }
  };

  const handleFuncaoChange = (funcao: string) => {
    setUsuarioForm(prev => ({
      ...prev,
      funcao,
      modulos: prev.modoPersonalizado ? prev.modulos : PERMISSOES_PADRAO[funcao as keyof typeof PERMISSOES_PADRAO] || []
    }));
  };

  const handleModuloToggle = (modulo: string) => {
    setUsuarioForm(prev => ({
      ...prev,
      modulos: prev.modulos.includes(modulo)
        ? prev.modulos.filter(m => m !== modulo)
        : [...prev.modulos, modulo]
    }));
  };

  const resetUsuarioForm = () => {
    setUsuarioForm({
      nome_completo: '',
      email: '',
      telefone_whatsapp: '',
      cpf_cnpj: '',
      funcao: 'colaborador',
      observacoes: '',
      modulos: [],
      limite_usuarios_criacao: 0,
      modoPersonalizado: false,
      plano: ''
    });
    setEditingUsuario(null);
  };

  const loadEmailConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('empresa_id', user.empresa_id)
        .eq('chave', 'email_config')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.valor) {
        setEmailConfig(data.valor as any);
      }
    } catch (error) {
      console.error('Error loading email config:', error);
    }
  };

  const handleSaveEmailConfig = async () => {
    if (!user) return;

    if (!emailConfig.smtpHost || !emailConfig.smtpUser || !emailConfig.smtpPass) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('configuracoes')
        .select('id')
        .eq('empresa_id', user.empresa_id)
        .eq('chave', 'email_config')
        .single();

      if (existing) {
        await supabase
          .from('configuracoes')
          .update({ valor: emailConfig as any })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('configuracoes')
          .insert({
            empresa_id: user.empresa_id,
            chave: 'email_config',
            valor: emailConfig as any,
            tipo: 'json',
            descricao: 'Configurações de e-mail SMTP'
          });
      }
      
      toast.success('Configurações de e-mail salvas com sucesso!');
    } catch (error) {
      console.error('Error saving email config:', error);
      toast.error('Erro ao salvar configurações de e-mail');
    }
  };

  const handleTestEmailConnection = async () => {
    if (!emailConfig.smtpHost || !emailConfig.smtpUser || !emailConfig.smtpPass) {
      toast.error('Configure todos os campos antes de testar');
      return;
    }

    setTestingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('testar-email', {
        body: {
          smtpHost: emailConfig.smtpHost,
          smtpPort: parseInt(emailConfig.smtpPort),
          smtpSecurity: emailConfig.smtpSecurity,
          smtpUser: emailConfig.smtpUser,
          smtpPass: emailConfig.smtpPass,
          testEmail: emailConfig.smtpUser
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success('Conexão testada com sucesso! E-mail de teste enviado.');
      } else {
        toast.error(data?.error || 'Erro ao testar conexão');
      }
    } catch (error: any) {
      console.error('Error testing email:', error);
      toast.error('Erro ao testar conexão: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setTestingEmail(false);
    }
  };

  const gerarLinkDeConvite = () => {
    if (!user) return;
    const baseUrl = window.location.origin;
    const token = btoa(`${user.empresa_id}:${Date.now()}`);
    const link = `${baseUrl}/cadastro-convite?token=${token}`;
    setLinkConvite(link);
    toast.success('Link de convite gerado!');
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkConvite);
    toast.success('Link copiado para a área de transferência!');
  };

  const isPagamentoAtrasado = (vencimento: string | null): boolean => {
    if (!vencimento) return false;
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    return dataVencimento < hoje;
  };

  const handleSaveWhatsApp = async () => {
    const success = await saveWhatsAppConfig(whatsappPhone);
    if (success) {
      toast.success('Configuração do WhatsApp salva com sucesso!');
    } else {
      toast.error('Erro ao salvar configuração do WhatsApp');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administração do Sistema</h1>
        <p className="text-muted-foreground">Gerencie usuários, planos e integrações</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="usuarios">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="planos">
            <CreditCard className="h-4 w-4 mr-2" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="integracoes">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-6">
          {empresaData && empresaData.data_proximo_pagamento && isPagamentoAtrasado(empresaData.data_proximo_pagamento) && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  ⚠️ Pagamento em atraso
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Regularize para evitar bloqueio automático. Vencimento: {format(new Date(empresaData.data_proximo_pagamento), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setGerarLinkConvite(true); gerarLinkDeConvite(); }}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Gerar Link de Convite
                  </Button>
                  <Dialog open={showUsuarioDialog} onOpenChange={(open) => {
                    setShowUsuarioDialog(open);
                    if (!open) resetUsuarioForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="nome_completo">Nome Completo *</Label>
                            <Input
                              id="nome_completo"
                              value={usuarioForm.nome_completo}
                              onChange={(e) => setUsuarioForm(prev => ({ ...prev, nome_completo: e.target.value }))}
                              placeholder="Nome completo do usuário"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">E-mail *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={usuarioForm.email}
                              onChange={(e) => setUsuarioForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="email@exemplo.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="telefone_whatsapp">Telefone/WhatsApp</Label>
                            <Input
                              id="telefone_whatsapp"
                              value={usuarioForm.telefone_whatsapp}
                              onChange={(e) => setUsuarioForm(prev => ({ ...prev, telefone_whatsapp: e.target.value }))}
                              placeholder="(11) 99999-9999"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                            <Input
                              id="cpf_cnpj"
                              value={usuarioForm.cpf_cnpj}
                              onChange={(e) => setUsuarioForm(prev => ({ ...prev, cpf_cnpj: e.target.value }))}
                              placeholder="000.000.000-00"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Senha inicial será o CPF/CNPJ sem pontuação</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="funcao">Função</Label>
                            <Select value={usuarioForm.funcao} onValueChange={handleFuncaoChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="administrador">Administrador</SelectItem>
                                <SelectItem value="gerente">Gerente</SelectItem>
                                <SelectItem value="lider">Líder</SelectItem>
                                <SelectItem value="colaborador">Colaborador</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="plano">Plano</Label>
                            <Select 
                              value={usuarioForm.plano} 
                              onValueChange={(value) => setUsuarioForm(prev => ({ ...prev, plano: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um plano" />
                              </SelectTrigger>
                              <SelectContent>
                                {planos.map((plano) => (
                                  <SelectItem key={plano.nome} value={plano.nome}>
                                    {plano.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="limite_usuarios">Limite de Usuários que pode Criar</Label>
                            <Select 
                              value={usuarioForm.limite_usuarios_criacao.toString()} 
                              onValueChange={(value) => setUsuarioForm(prev => ({ ...prev, limite_usuarios_criacao: parseInt(value) }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Sem permissão</SelectItem>
                                <SelectItem value="2">2 usuários</SelectItem>
                                <SelectItem value="5">5 usuários</SelectItem>
                                <SelectItem value="-1">Ilimitado</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Define quantos usuários este usuário poderá criar
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label>Níveis de Acesso (Módulos)</Label>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="modo-personalizado" className="text-sm font-normal cursor-pointer">
                                Personalizado
                              </Label>
                              <Switch
                                id="modo-personalizado"
                                checked={usuarioForm.modoPersonalizado}
                                onCheckedChange={(checked) => {
                                  setUsuarioForm(prev => ({
                                    ...prev,
                                    modoPersonalizado: checked,
                                    modulos: checked ? prev.modulos : PERMISSOES_PADRAO[prev.funcao as keyof typeof PERMISSOES_PADRAO] || []
                                  }));
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-muted/50">
                            {MODULOS_DISPONIVEIS.map(modulo => (
                              <div key={modulo.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={modulo.value}
                                  checked={usuarioForm.modulos.includes(modulo.value)}
                                  onCheckedChange={() => handleModuloToggle(modulo.value)}
                                  disabled={!usuarioForm.modoPersonalizado}
                                />
                                <Label 
                                  htmlFor={modulo.value} 
                                  className={`text-sm ${usuarioForm.modoPersonalizado ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                >
                                  {modulo.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {!usuarioForm.modoPersonalizado ? (
                            <p className="text-xs text-muted-foreground mt-2">
                              ℹ️ Permissões padrão da função selecionada. Ative "Personalizado" para editar manualmente.
                            </p>
                          ) : (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                              ✓ Modo personalizado ativado. Selecione os módulos desejados acima.
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="observacoes">Observações</Label>
                          <Textarea
                            id="observacoes"
                            value={usuarioForm.observacoes}
                            onChange={(e) => setUsuarioForm(prev => ({ ...prev, observacoes: e.target.value }))}
                            placeholder="Observações sobre o usuário..."
                            rows={3}
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowUsuarioDialog(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleSaveUsuario}>Salvar</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usuarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum usuário cadastrado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Último Pgto</TableHead>
                        <TableHead>Próximo Venc.</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.map(usuario => (
                        <TableRow key={usuario.id} className={usuario.conta_principal ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {(usuario.nome_completo || usuario.nome).slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{usuario.nome_completo || usuario.nome}</p>
                                {usuario.conta_principal && (
                                  <Badge variant="outline" className="text-xs">Titular</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>{usuario.telefone_whatsapp || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {usuario.funcao || 'colaborador'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {usuario.ultimo_pagamento ? format(new Date(usuario.ultimo_pagamento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </TableCell>
                          <TableCell>
                            <div>
                              {usuario.proximo_vencimento ? format(new Date(usuario.proximo_vencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                              {usuario.proximo_vencimento && isPagamentoAtrasado(usuario.proximo_vencimento) && (
                                <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                                  ⚠️ Atrasado
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={usuario.status_conta === 'ativo' ? 'default' : usuario.status_conta === 'suspenso' ? 'destructive' : 'secondary'}>
                                {usuario.status_conta}
                              </Badge>
                              {usuario.bloqueado && (
                                <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditUsuario(usuario)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {!usuario.conta_principal && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleUsuarioStatus(usuario)}
                                  >
                                    {usuario.status_conta === 'ativo' ? (
                                      <X className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <Check className="h-4 w-4 text-green-500" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleBloqueio(usuario)}
                                    title={usuario.bloqueado ? 'Desbloquear' : 'Bloquear'}
                                  >
                                    {usuario.bloqueado ? '🔓' : '🔒'}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={gerarLinkConvite} onOpenChange={setGerarLinkConvite}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link de Convite Gerado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Compartilhe este link com a pessoa que deseja convidar. O link permite que ela crie sua própria conta vinculada à sua empresa.
                </p>
                <div className="flex gap-2">
                  <Input value={linkConvite} readOnly className="flex-1" />
                  <Button onClick={copiarLink}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <Button className="w-full" onClick={() => setGerarLinkConvite(false)}>
                  Fechar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="planos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Planos Disponíveis</CardTitle>
                <Dialog open={showPlanoDialog} onOpenChange={setShowPlanoDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Plano
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Plano</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nome_plano">Nome do Plano</Label>
                        <Input
                          id="nome_plano"
                          value={novoPlano.nome}
                          onChange={(e) => setNovoPlano({ ...novoPlano, nome: e.target.value })}
                          placeholder="Ex: Básico, Premium..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="quantidade_acessos">Quantidade de Acessos Adicionais para Colaboradores</Label>
                        <Input
                          id="quantidade_acessos"
                          type="number"
                          min="0"
                          value={novoPlano.quantidade_acessos_adicionais}
                          onChange={(e) => setNovoPlano({ ...novoPlano, quantidade_acessos_adicionais: parseInt(e.target.value) || 0 })}
                          placeholder="Ex: 5"
                        />
                      </div>
                      <div>
                        <Label>Níveis de Acesso (Módulos)</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2 p-4 border rounded-lg">
                          {MODULOS_DISPONIVEIS.map((modulo) => (
                            <div key={modulo.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`plano-modulo-${modulo.value}`}
                                checked={novoPlano.modulos.includes(modulo.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNovoPlano({ ...novoPlano, modulos: [...novoPlano.modulos, modulo.value] });
                                  } else {
                                    setNovoPlano({ ...novoPlano, modulos: novoPlano.modulos.filter(m => m !== modulo.value) });
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`plano-modulo-${modulo.value}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {modulo.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setShowPlanoDialog(false);
                          setNovoPlano({ nome: '', quantidade_acessos_adicionais: 0, modulos: [] });
                        }}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddPlano}>Adicionar</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {planos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum plano cadastrado
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {planos.map((plano, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{plano.nome}</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePlano(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Acessos adicionais:</span> {plano.quantidade_acessos_adicionais}
                        </p>
                        <div>
                          <p className="font-medium mb-2">Módulos inclusos:</p>
                          <div className="flex flex-wrap gap-1">
                            {plano.modulos.map((modulo) => {
                              const moduloInfo = MODULOS_DISPONIVEIS.find(m => m.value === modulo);
                              return (
                                <Badge key={modulo} variant="secondary" className="text-xs">
                                  {moduloInfo?.label || modulo}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" />
                  Configurações de E-mail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm mb-4">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Configure o servidor SMTP para enviar e-mails pelo sistema
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Funciona com Gmail, Outlook, ou qualquer servidor SMTP
                  </p>
                </div>
                <div>
                  <Label htmlFor="smtpHost">Servidor SMTP *</Label>
                  <Input 
                    id="smtpHost" 
                    placeholder="smtp.gmail.com" 
                    value={emailConfig.smtpHost}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpPort">Porta *</Label>
                    <Input 
                      id="smtpPort" 
                      value={emailConfig.smtpPort}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpSecurity">Segurança</Label>
                    <Select 
                      value={emailConfig.smtpSecurity}
                      onValueChange={(value) => setEmailConfig({ ...emailConfig, smtpSecurity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">Nenhuma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="smtpUser">Usuário (E-mail) *</Label>
                  <Input 
                    id="smtpUser" 
                    placeholder="seu@email.com"
                    value={emailConfig.smtpUser}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPass">Senha *</Label>
                  <div className="relative">
                    <Input 
                      id="smtpPass" 
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={emailConfig.smtpPass}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpPass: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite a senha da sua conta de e-mail
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEmailConfig} className="flex-1">
                    Salvar Configuração
                  </Button>
                  <Button 
                    onClick={handleTestEmailConnection} 
                    variant="outline"
                    disabled={testingEmail}
                  >
                    {testingEmail ? 'Testando...' : 'Testar Conexão'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Integração WhatsApp (Gratuita)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">Integração gratuita via WhatsApp Web</p>
                  <p className="text-muted-foreground">
                    Configure o número padrão do WhatsApp da empresa. 
                    Ao enviar mensagens pelo sistema, o WhatsApp Web será aberto automaticamente.
                  </p>
                  <p className="text-amber-600 dark:text-amber-500 mt-2 flex items-center gap-1">
                    <Bell className="h-4 w-4" />
                    <span className="font-medium">Importante:</span> Permita pop-ups neste site para que o WhatsApp abra corretamente.
                  </p>
                </div>
                <div>
                  <Label htmlFor="whatsappPhone">Número do Telefone *</Label>
                  <Input 
                    id="whatsappPhone" 
                    placeholder="5511999999999" 
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato: Código do país + DDD + número (ex: 5511999999999)
                  </p>
                </div>
                <Button onClick={handleSaveWhatsApp}>Salvar Configuração</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
